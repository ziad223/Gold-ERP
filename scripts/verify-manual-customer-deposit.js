/**
 * Phase 27-Fix — verify manual customer deposit wiring.
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
    'router.post("/customers/:id/credit/deposit"',
    'router.post("/customers/:id/credit/refund"',
  );
  const depositSection = sliceBetween(
    routes,
    "function normalizeCustomerDepositPayload",
    "function normalizeCustomerRefundPayload",
  );

  assertIncludes(route, 'requirePermission("treasury.update")', "endpoint is protected by treasury.update");
  assertIncludes(route, "idempotency-key", "endpoint reads Idempotency-Key");
  assertIncludes(route, "Idempotency-Key", "endpoint reports missing Idempotency-Key clearly");
  assertIncludes(route, 'idemScope = "customer.credit_deposit"', "endpoint uses customer.credit_deposit scope");
  assertIncludes(route, "idempotencyService.hashRequest", "endpoint hashes request");
  assertIncludes(route, "idempotencyService.claim", "endpoint claims idempotency inside transaction");
  assertIncludes(route, "idempotencyService.resolveExisting", "endpoint replays/conflicts duplicate keys");
  assertIncludes(route, "idempotencyService.succeed", "endpoint stores success response");

  assertIncludes(depositSection, "amount <= 0", "endpoint validates positive amount");
  assertIncludes(depositSection, '["1110", "1120"].includes(accountCode)', "endpoint restricts account codes to 1110/1120");
  assertIncludes(depositSection, 'paymentMethod === "cash" && accountCode !== "1110"', "cash must use 1110");
  assertIncludes(depositSection, 'paymentMethod === "bank" && accountCode !== "1120"', "bank must use 1120");
  assertIncludes(route, "Customer.findOne", "endpoint loads customer");
  assertIncludes(route, "LOCK.UPDATE", "endpoint locks customer row");
  assertIncludes(route, "customer.status", "endpoint rejects inactive customers");
  assertIncludes(route, "Branch.findOne", "endpoint validates branch when provided");

  assertIncludes(route, "CashTransaction.create", "endpoint creates CashTransaction");
  assertIncludes(route, 'type: "cash_in"', "cash transaction is cash_in");
  assertIncludes(route, 'category: "customer_credit_deposit"', "cash transaction is categorized as customer deposit");
  assertIncludes(route, 'counterAccountCode: "2300"', "cash transaction references 2300 as counter account metadata");
  assertIncludes(route, "customerCreditService.recordCreditIn", "endpoint records customer credit_in through service");
  assertIncludes(route, 'sourceType: "manual_deposit"', "credit sourceType is manual_deposit");
  assertIncludes(route, "cashTransactionId: cashTransaction.id", "credit row links cashTransactionId");
  assertIncludes(route, "glPosting", "endpoint passes glPosting");
  assertIncludes(route, "enabled: true", "glPosting is enabled");
  assertIncludes(route, "debitAccountCode: payload.accountCode", "GL debit uses 1110/1120 payload account");
  assertIncludes(route, 'creditAccountCode: "2300"', "GL credit uses 2300");
  assertIncludes(route, "cashTransaction.update({ journalEntryId: creditRow.journalEntryId }", "cash transaction links generated journalEntryId");
  assertIncludes(route, "availableCredit", "response includes available credit");
  assertIncludes(route, 'ledgerBased: true', "response is marked ledger-based");
  assertIncludes(route, 'source: "customer_credit_deposit"', "response source marks customer credit deposit");
  assertIncludes(route, 'readOnly: false', "response marks mutation as not read-only");

  assertNotMatches(depositSection, /postCashEntry\s*\(/, "deposit route does not call postCashEntry");
  assertNotMatches(depositSection, /models\.Invoice|Invoice\./, "deposit route does not touch invoices");
  assertNotMatches(depositSection, /Customer\.balance|balance\s*:/, "deposit route does not mutate Customer.balance");
  assertNotMatches(depositSection, /recordCreditOut|credit\/apply|refund credit|apply credit/i, "deposit route does not implement apply/refund");
  assertNotMatches(depositSection, /postReturnEntry|postExchangeEntry/, "deposit route does not alter return/exchange posting");
}

function verifyModelAndFrontend() {
  const model = read("backend/src/models/customerCreditTransaction.model.js");
  assertIncludes(model, '"manual_deposit"', "CustomerCreditTransaction accepts manual_deposit sourceType");

  const page = read("app/[locale]/(dashboard)/customers/[id]/page.tsx");
  assertIncludes(page, "Customer Credit Deposit", "customer detail deposit modal exists");
  assertIncludes(page, "Add Deposit", "customer detail add deposit button exists");
  assertIncludes(page, "credit/deposit", "frontend calls customer credit deposit endpoint");
  assertIncludes(page, "generateUUID", "frontend generates an idempotency key");
  assertIncludes(page, "idempotencyKey", "frontend sends Idempotency-Key through apiClient");
  assertIncludes(page, 'paymentMethod === "bank" ? "1120" : "1110"', "frontend maps bank/cash to 1120/1110");
  assertIncludes(page, "does not settle any invoice", "frontend warning says deposit does not settle invoices");
  assertIncludes(page, "apply-customer-credit", "approved customer detail apply-credit UI may coexist with deposit");
}

function verifyScopeAndPackage() {
  const routes = read("backend/src/routes/erp.routes.js");
  assert.ok(routes.includes("postReturnEntry"), "return posting remains present");
  assert.ok(routes.includes("postExchangeEntry") || routes.includes('sourceType: "exchange"'), "exchange posting remains present");

  const changed = execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter(f => !f.replace(/\\/g, "/").startsWith("scripts/verify-") && !f.replace(/\\/g, "/").startsWith("backend/seeders/client-demo/transactional/"));
  assert.ok(!changed.some((file) => /backend\/migrations|migrations\//.test(file)), "no migration added");
  assert.ok(!changed.some((file) => /features\/printing|CustomPrint|print/i.test(file)), "no print files touched");
  assert.ok(!changed.some((file) => /features\/dashboard|app\/\[locale\]\/\(dashboard\)\/dashboard/.test(file)), "dashboard not rewritten");
  assert.ok(!changed.some((file) => /reports/i.test(file) && !/verify/.test(file)), "reports not rewritten");

  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["verify:manual-customer-deposit"],
    "node scripts/verify-manual-customer-deposit.js",
    "manual deposit verifier package script exists",
  );
}

function syntaxGuard() {
  execFileSync(process.execPath, ["-c", path.resolve(ROOT, "scripts", "verify-manual-customer-deposit.js")], { stdio: "pipe" });
  execFileSync(process.execPath, ["-c", path.resolve(ROOT, "backend", "src", "routes", "erp.routes.js")], { stdio: "pipe" });
}

function main() {
  verifyBackendRoute();
  verifyModelAndFrontend();
  verifyScopeAndPackage();
  syntaxGuard();
  console.log("verify-manual-customer-deposit: ok");
}

main();
