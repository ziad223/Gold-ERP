/**
 * Phase 29-Fix — verify applying customer credit to existing invoices.
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
    'router.post("/invoices/:id/apply-customer-credit"',
    "// ─────────────────────────────────────────────────────────────────────────────\n// GL ACCOUNT STATEMENT",
  );
  const applyPayload = sliceBetween(
    routes,
    "function normalizeCustomerCreditApplyPayload",
    'router.post("/customers/:id/credit/deposit"',
  );

  assertIncludes(route, 'requirePermission("sales.create")', "endpoint is protected by sales.create");
  assertIncludes(route, "idempotency-key", "endpoint reads Idempotency-Key");
  assertIncludes(route, "Idempotency-Key", "endpoint reports missing Idempotency-Key clearly");
  assertIncludes(route, 'idemScope = "customer.credit_apply"', "endpoint uses customer.credit_apply scope");
  assertIncludes(route, "idempotencyService.hashRequest", "endpoint hashes request");
  assertIncludes(route, "idempotencyService.claim", "endpoint claims idempotency inside transaction");
  assertIncludes(route, "idempotencyService.resolveExisting", "endpoint replays/conflicts duplicate keys");
  assertIncludes(route, "idempotencyService.succeed", "endpoint stores success response");

  assertIncludes(applyPayload, "amount <= 0", "endpoint validates positive amount");
  assertIncludes(route, "LOCK.UPDATE", "endpoint locks rows");
  assertIncludes(route, "of: models.Invoice", "endpoint locks invoice row");
  assertIncludes(route, "of: models.Customer", "endpoint locks customer row");
  assertIncludes(route, 'invoice.postingStatus !== "posted"', "endpoint rejects non-posted invoices");
  assertIncludes(route, 'invoice.status === "cancelled"', "endpoint rejects cancelled invoices");
  assertIncludes(route, 'invoice.type === "return" || invoice.type === "exchange"', "endpoint rejects return/exchange invoices");
  assertIncludes(route, "remainingBefore <= 0.0001", "endpoint rejects fully paid invoices");
  assertIncludes(route, "payload.amount > remainingBefore", "endpoint validates amount against invoice remaining");
  assertIncludes(route, "getCustomerCreditSummary", "endpoint reads available credit from credit ledger");
  assertIncludes(route, "availableBefore", "endpoint computes available credit before applying");
  assertIncludes(route, "payload.amount > availableBefore", "endpoint validates sufficient available credit");
  assertIncludes(route, "customerCreditService.recordCreditOut", "endpoint records customer credit_out");
  assertIncludes(route, 'sourceType: "credit_application"', "credit sourceType is credit_application");
  assertIncludes(route, "invoiceId: invoice.id", "credit row links invoiceId");
  assertIncludes(route, "glPosting", "endpoint passes glPosting");
  assertIncludes(route, "enabled: true", "glPosting is enabled");
  assertIncludes(route, 'debitAccountCode: "2300"', "GL debits customer deposits 2300");
  assertIncludes(route, 'creditAccountCode: "1300"', "GL credits accounts receivable 1300");
  assertIncludes(route, "Payment.create", "endpoint creates Payment row");
  assertIncludes(route, 'paymentMethod: "customer_credit"', "Payment method is customer_credit");
  assertIncludes(route, "creditTransactionId=", "Payment notes link credit transaction");
  assertIncludes(route, "journalEntryId=", "Payment notes link journal entry");
  assertIncludes(route, "paidAmount: newPaidAmount", "endpoint updates Invoice.paidAmount");
  assertIncludes(route, "remainingAmount: newRemainingAmount", "endpoint updates Invoice.remainingAmount");
  assertIncludes(route, "balance: Math.max(0, round4(Number(customer.balance || 0) - payload.amount))", "endpoint reduces Customer.balance as AR mirror");
  assertIncludes(route, 'source: "customer_credit_apply"', "response source marks customer credit apply");
  assertIncludes(route, 'ledgerBased: true', "response is marked ledger-based");
  assertIncludes(route, 'readOnly: false', "response marks mutation as not read-only");

  assertNotMatches(route, /CashTransaction\.create/, "apply route does not create CashTransaction");
  assertNotMatches(route, /postCashEntry\s*\(/, "apply route does not call postCashEntry");
  assertNotMatches(route, /accountCode:\s*payload\.accountCode|debitAccountCode:\s*payload\.accountCode|creditAccountCode:\s*payload\.accountCode/, "apply route does not touch cash/bank accounts");
  assertNotMatches(route, /pos\.checkout|\/pos\/checkout/, "apply route does not alter POS checkout");
  assertNotMatches(route, /postReturnEntry|postExchangeEntry/, "apply route does not alter return/exchange posting");
  assertNotMatches(route, /Customer\.balance\s*as\s*available|availableCredit\s*=\s*customer\.balance/i, "apply route does not use Customer.balance as available credit");
}

function verifyApprovedScope() {
  const routes = read("backend/src/routes/erp.routes.js");
  const posRoute = sliceBetween(
    routes,
    'router.post("/pos/checkout"',
    "// ─── Customer Gold Use in Sale Endpoint",
  );
  assertNotMatches(posRoute, /customer_credit|credit_apply|apply-customer-credit|recordCreditOut/, "POS checkout does not support customer-credit payment");

  const returnRoute = sliceBetween(
    routes,
    'router.post("/sales/returns"',
    'router.post("/sales/exchanges"',
  );
  const exchangeRoute = sliceBetween(
    routes,
    'router.post("/sales/exchanges"',
    "// ─── Customer Gold Use in Sale Endpoint",
  );
  // Phase 30: returns/exchanges may CREATE credit (recordCreditIn) for the excess,
  // but must never APPLY/consume it (credit_out / credit_application / apply).
  assertNotMatches(returnRoute, /recordCreditOut|credit_application|customer_credit_apply/, "returns do not apply/consume customer credit");
  assertNotMatches(exchangeRoute, /recordCreditOut|credit_application|customer_credit_apply/, "exchanges do not apply/consume customer credit");

  const depositRoute = sliceBetween(
    routes,
    'router.post("/customers/:id/credit/deposit"',
    'router.post("/customers/:id/credit/refund"',
  );
  const refundRoute = sliceBetween(
    routes,
    'router.post("/customers/:id/credit/refund"',
    'router.post("/invoices/:id/apply-customer-credit"',
  );
  assertIncludes(depositRoute, 'source: "customer_credit_deposit"', "deposit route remains intact");
  assertIncludes(refundRoute, 'source: "customer_credit_refund"', "refund route remains intact");
  assertNotMatches(depositRoute, /credit_application|apply-customer-credit/, "deposit route does not implement apply");
  assertNotMatches(refundRoute, /credit_application|apply-customer-credit/, "refund route does not implement apply");
}

function verifyFrontend() {
  const page = read("app/[locale]/(dashboard)/customers/[id]/page.tsx");
  assertIncludes(page, "Apply Credit to Invoice", "customer detail apply modal exists");
  assertIncludes(page, "Apply to Invoice", "customer detail apply button exists");
  assertIncludes(page, "apply-customer-credit", "frontend calls invoice apply-credit endpoint");
  assertIncludes(page, "getCustomerCreditApplySignature", "frontend has stable apply idempotency signature");
  assertIncludes(page, "generateUUID", "frontend generates an idempotency key");
  assertIncludes(page, "idempotencyKey", "frontend sends Idempotency-Key through apiClient");
  assertIncludes(page, "openInvoices", "frontend filters open invoices");
  assertIncludes(page, "invoice.type !== \"return\"", "frontend excludes return invoices");
  assertIncludes(page, "invoice.type !== \"exchange\"", "frontend excludes exchange invoices");
  assertIncludes(page, "amount > availableCredit", "frontend validates amount against available credit");
  assertIncludes(page, "amount > invoiceRemaining", "frontend validates amount against invoice remaining");
  assertIncludes(page, "availableCredit <= 0", "frontend disables/guards with no credit");
  assertIncludes(page, "No treasury transaction is created", "frontend warning says no treasury transaction");
}

function verifyPackageAndScope() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["verify:apply-customer-credit"],
    "node scripts/verify-apply-customer-credit.js",
    "apply-credit verifier package script exists",
  );

  const changed = execFileSync("git", ["status", "--short"], {
    cwd: ROOT,
    encoding: "utf8",
  }).split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim());
  const migrationChanges = changed.filter((file) => /backend\/migrations|migrations\//.test(file));
  const allowedPhase343Migration = "backend/migrations/20260714040000-employee-operator-session-dual-audit.js";
  assert.ok(
    migrationChanges.every((file) => file === allowedPhase343Migration),
    "no unrelated migration added"
  );
  assert.ok(!changed.some((file) => /features\/printing|CustomPrint|print/i.test(file)), "no print files touched");
  assert.ok(!changed.some((file) => /features\/dashboard|app\/\[locale\]\/\(dashboard\)\/dashboard/.test(file)), "dashboard not rewritten");
  assert.ok(!changed.some((file) => /reports/i.test(file) && !/verify/.test(file)), "reports not rewritten");
}

function syntaxGuard() {
  execFileSync(process.execPath, ["-c", path.resolve(ROOT, "scripts", "verify-apply-customer-credit.js")], { stdio: "pipe" });
  execFileSync(process.execPath, ["-c", path.resolve(ROOT, "backend", "src", "routes", "erp.routes.js")], { stdio: "pipe" });
}

function main() {
  verifyBackendRoute();
  verifyApprovedScope();
  verifyFrontend();
  verifyPackageAndScope();
  syntaxGuard();
  console.log("verify-apply-customer-credit: ok");
}

main();
