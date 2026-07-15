/**
 * Phase 28-Fix — verify customer credit refund wiring.
 *
 * Static verifier only: no DB connection, no HTTP request, no mutation.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

function sliceBetween(src, startNeedle, endNeedle) {
  const start = src.indexOf(startNeedle);
  assert.ok(start >= 0, `${startNeedle} exists`);
  const end = src.indexOf(endNeedle, start + startNeedle.length);
  assert.ok(end > start, `${endNeedle} follows ${startNeedle}`);
  return src.slice(start, end);
}

function assertIncludes(src, needle, message) {
  assert.ok(src.includes(needle), message);
}

function assertNotMatches(src, regex, message) {
  assert.ok(!regex.test(src), message);
}

function verifyBackendRoute() {
  const routes = read("backend/src/routes/erp.routes.js");
  const route = sliceBetween(
    routes,
    'router.post("/customers/:id/credit/refund"',
    'router.post("/invoices/:id/apply-customer-credit"',
  );
  const refundSection = sliceBetween(
    routes,
    "function normalizeCustomerRefundPayload",
    "function normalizeCustomerCreditApplyPayload",
  );

  assertIncludes(route, 'requirePermission("treasury.update")', "endpoint is protected by treasury.update");
  assertIncludes(route, "idempotency-key", "endpoint reads Idempotency-Key");
  assertIncludes(route, "Idempotency-Key", "endpoint reports missing Idempotency-Key clearly");
  assertIncludes(route, 'idemScope = "customer.credit_refund"', "endpoint uses customer.credit_refund scope");
  assertIncludes(route, "idempotencyService.hashRequest", "endpoint hashes request");
  assertIncludes(route, "idempotencyService.claim", "endpoint claims idempotency inside transaction");
  assertIncludes(route, "idempotencyService.resolveExisting", "endpoint replays/conflicts duplicate keys");
  assertIncludes(route, "idempotencyService.succeed", "endpoint stores success response");

  assertIncludes(refundSection, "amount <= 0", "endpoint validates positive amount");
  assertIncludes(refundSection, '["1110", "1120"].includes(accountCode)', "endpoint restricts account codes to 1110/1120");
  assertIncludes(refundSection, 'paymentMethod === "cash" && accountCode !== "1110"', "cash must use 1110");
  assertIncludes(refundSection, 'paymentMethod === "bank" && accountCode !== "1120"', "bank must use 1120");
  assertIncludes(route, "Customer.findOne", "endpoint loads customer");
  assertIncludes(route, "LOCK.UPDATE", "endpoint locks customer row");
  assertIncludes(route, "customer.status", "endpoint rejects inactive customers");
  assertIncludes(route, "Branch.findOne", "endpoint validates branch when provided");

  assertIncludes(route, "getCustomerCreditSummary", "endpoint checks available credit");
  assertIncludes(route, "availableBefore", "endpoint computes available credit before refund");
  assertIncludes(route, "payload.amount > availableBefore", "endpoint rejects insufficient available credit");
  assertIncludes(route, "CashTransaction.create", "endpoint creates CashTransaction");
  assertIncludes(route, 'type: "cash_out"', "cash transaction is cash_out");
  assertIncludes(route, 'category: "customer_credit_refund"', "cash transaction is categorized as customer refund");
  assertIncludes(route, 'counterAccountCode: "2300"', "cash transaction references 2300 as counter account metadata");
  assertIncludes(route, "customerCreditService.recordCreditOut", "endpoint records customer credit_out through service");
  assertIncludes(route, 'sourceType: "credit_refund"', "credit sourceType is credit_refund");
  assertIncludes(route, "cashTransactionId: cashTransaction.id", "credit row links cashTransactionId");
  assertIncludes(route, "glPosting", "endpoint passes glPosting");
  assertIncludes(route, "enabled: true", "glPosting is enabled");
  assertIncludes(route, 'debitAccountCode: "2300"', "GL debit uses 2300");
  assertIncludes(route, "creditAccountCode: payload.accountCode", "GL credit uses 1110/1120 payload account");
  assertIncludes(route, "cashTransaction.update({ journalEntryId: creditRow.journalEntryId }", "cash transaction links generated journalEntryId");
  assertIncludes(route, "availableCredit", "response includes available credit");
  assertIncludes(route, 'ledgerBased: true', "response is marked ledger-based");
  assertIncludes(route, 'source: "customer_credit_refund"', "response source marks customer credit refund");
  assertIncludes(route, 'readOnly: false', "response marks mutation as not read-only");

  assertNotMatches(route, /postCashEntry\s*\(/, "refund route does not call postCashEntry");
  assertNotMatches(route, /models\.Invoice|Invoice\./, "refund route does not touch invoices");
  assertNotMatches(route, /Customer\.balance|balance\s*:/, "refund route does not mutate Customer.balance");
  assertNotMatches(route, /credit\/apply|apply credit/i, "refund route does not implement apply credit");
  assertNotMatches(route, /postReturnEntry|postExchangeEntry/, "refund route does not alter return/exchange posting");
}

function verifyFrontend() {
  const page = read("app/[locale]/(dashboard)/customers/[id]/page.tsx");
  assertIncludes(page, "Customer Credit Refund", "customer detail refund modal exists");
  assertIncludes(page, "Refund Credit", "customer detail refund button exists");
  assertIncludes(page, "credit/refund", "frontend calls customer credit refund endpoint");
  assertIncludes(page, "generateUUID", "frontend generates an idempotency key");
  assertIncludes(page, "idempotencyKey", "frontend sends Idempotency-Key through apiClient");
  assertIncludes(page, 'paymentMethod === "bank" ? "1120" : "1110"', "frontend maps bank/cash to 1120/1110");
  assertIncludes(page, "amount > availableCredit", "frontend guards refund amount against available credit");
  assertIncludes(page, "availableCredit <= 0", "refund button/action is disabled or guarded when no credit is available");
  assertIncludes(page, "does not affect invoice balances", "frontend warning says refund does not affect invoices");
  assertIncludes(page, "apply-customer-credit", "approved customer detail apply-credit UI may coexist with refund");
}

function verifyScopeAndPackage() {
  const routes = read("backend/src/routes/erp.routes.js");
  assert.ok(routes.includes("postReturnEntry"), "return posting remains present");
  assert.ok(routes.includes("postExchangeEntry") || routes.includes('sourceType: "exchange"'), "exchange posting remains present");

  const refundRoute = sliceBetween(
    routes,
    'router.post("/customers/:id/credit/refund"',
    'router.post("/invoices/:id/apply-customer-credit"',
  );
  const applyRoute = sliceBetween(
    routes,
    'router.post("/invoices/:id/apply-customer-credit"',
    "// ─────────────────────────────────────────────────────────────────────────────\n// GL ACCOUNT STATEMENT",
  );
  const routesWithoutApprovedCreditOut = routes.replace(refundRoute, "").replace(applyRoute, "");
  assert.ok(!routesWithoutApprovedCreditOut.includes("customerCreditService.recordCreditOut"), "only refund/apply routes record credit_out");

  const changed = execFileSync("git", ["status", "--short"], {
    cwd: ROOT,
    encoding: "utf8",
  }).split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim());
  assert.ok(!changed.some((file) => /backend\/migrations|migrations\//.test(file)), "no migration added");
  assert.ok(!changed.some((file) => !file.replace(/\\/g, "/").startsWith("scripts/verify-") && /features\/printing|CustomPrint|print/i.test(file)), "no print files touched");
  assert.ok(!changed.some((file) => /features\/dashboard|app\/\[locale\]\/\(dashboard\)\/dashboard/.test(file)), "dashboard not rewritten");
  assert.ok(!changed.some((file) => /reports/i.test(file) && !/verify/.test(file)), "reports not rewritten");

  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["verify:customer-credit-refund"],
    "node scripts/verify-customer-credit-refund.js",
    "customer credit refund verifier package script exists",
  );
}

function syntaxGuard() {
  execFileSync(process.execPath, ["-c", path.resolve(ROOT, "scripts", "verify-customer-credit-refund.js")], { stdio: "pipe" });
  execFileSync(process.execPath, ["-c", path.resolve(ROOT, "backend", "src", "routes", "erp.routes.js")], { stdio: "pipe" });
}

function main() {
  verifyBackendRoute();
  verifyFrontend();
  verifyScopeAndPackage();
  syntaxGuard();
  console.log("verify-customer-credit-refund: ok");
}

main();
