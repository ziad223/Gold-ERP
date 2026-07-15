/**
 * Phase 24-Fix — verify installment payment AR mirror writeback.
 *
 * Static source checks only: no DB, no HTTP requests, no live mutations.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
function readRepo(rel) {
  return fs.readFileSync(path.resolve(ROOT, rel), "utf8");
}

const routes = readRepo("backend/src/routes/erp.routes.js");
const posting = readRepo("backend/src/services/posting.service.js");

function extractRoute(src, startNeedle, endNeedle) {
  const start = src.indexOf(startNeedle);
  assert.ok(start >= 0, `${startNeedle} route exists`);
  const end = src.indexOf(endNeedle, start);
  assert.ok(end > start, `${startNeedle} route has a bounded body`);
  return src.slice(start, end);
}

const installmentRoute = extractRoute(
  routes,
  '"/installments/:id/pay"',
  'router.get("/gift-vouchers"',
);
const returnRoute = extractRoute(
  routes,
  '"/sales/returns"',
  '"/sales/exchanges/preview"',
);
const exchangeRoute = extractRoute(
  routes,
  '"/sales/exchanges"',
  'router.post("/customers/:id/gold/payout"',
);

function routeCoverage() {
  assert.ok(installmentRoute.includes('const idemScope = "installment.payment"'), "central installment.payment scope remains");
  assert.ok(installmentRoute.includes("idempotencyService.claim"), "installment route still claims idempotency");
  assert.ok(installmentRoute.includes("idempotencyService.resolveExisting"), "installment route still resolves replay/conflict");
  assert.ok(installmentRoute.includes("idempotencyService.succeed"), "installment route still persists success response");
  assert.ok(installmentRoute.includes("postInstallmentPayment"), "postInstallmentPayment remains wired");
}

function writeback() {
  assert.ok(installmentRoute.includes("models.sequelize.transaction(async (t)"), "writeback is inside the existing transaction");
  assert.ok(installmentRoute.includes("const idemClaim = await idempotencyService.claim"), "idempotency claim occurs inside transaction");
  assert.ok(installmentRoute.includes("const invoice = await models.Invoice.findOne"), "related invoice is loaded");
  assert.ok(installmentRoute.includes("lock: { level: t.LOCK.UPDATE, of: models.Invoice }"), "invoice row is locked");
  assert.ok(installmentRoute.includes("const customer = customerId"), "related customer is loaded");
  assert.ok(installmentRoute.includes("lock: { level: t.LOCK.UPDATE, of: models.Customer }"), "customer row is locked");

  assert.ok(
    /remainingAmount:\s*Math\.max\(0,\s*round4\(Number\(invoice\.remainingAmount \|\| 0\) - amount\)\)/.test(installmentRoute),
    "Invoice.remainingAmount is reduced and clamped",
  );
  assert.ok(
    /paidAmount:\s*round4\(Number\(invoice\.paidAmount \|\| 0\) \+ amount\)/.test(installmentRoute),
    "Invoice.paidAmount is increased",
  );
  assert.ok(
    /balance:\s*Math\.max\(0,\s*round4\(Number\(customer\.balance \|\| 0\) - amount\)\)/.test(installmentRoute),
    "Customer.balance is reduced and clamped",
  );
}

function replaySafety() {
  const claimPos = installmentRoute.indexOf("const idemClaim = await idempotencyService.claim");
  const invoiceWritePos = installmentRoute.indexOf("await invoice.update");
  const customerWritePos = installmentRoute.indexOf("await customer.update");
  const duplicateThrowPos = installmentRoute.indexOf('throw dup;');
  const resolvePos = installmentRoute.indexOf("idempotencyService.resolveExisting");
  assert.ok(claimPos >= 0 && invoiceWritePos > claimPos, "invoice writeback happens after a fresh claim");
  assert.ok(customerWritePos > claimPos, "customer writeback happens after a fresh claim");
  assert.ok(duplicateThrowPos > claimPos && duplicateThrowPos < invoiceWritePos, "duplicate claim exits before writeback");
  assert.ok(resolvePos > invoiceWritePos, "replay resolution is outside the mutation/writeback block");
}

function noScopeCreep() {
  assert.ok(!installmentRoute.includes("recordCreditIn"), "installment payment does not record customer credit in");
  assert.ok(!installmentRoute.includes("recordCreditOut"), "installment payment does not record customer credit out");
  // Phase 30: returns/exchanges MAY create customer credit (recordCreditIn) for
  // the operator-selected excess, but must never CONSUME/apply it (recordCreditOut).
  assert.ok(!returnRoute.includes("recordCreditOut"), "returns never consume customer credit (no credit_out)");
  assert.ok(!exchangeRoute.includes("recordCreditOut"), "exchanges never consume customer credit (no credit_out)");
  assert.ok(posting.includes("async postInstallmentPayment"), "postInstallmentPayment still exists");
  assert.ok(!/CustomPrint|print template|InvoicePrint/i.test(installmentRoute), "installment route has no print coupling");
}

function packageScript() {
  const pkg = readRepo("package.json");
  assert.ok(
    pkg.includes('"verify:installment-balance-writeback": "node scripts/verify-installment-balance-writeback.js"'),
    "package script is registered",
  );
}

(function main() {
  routeCoverage();
  writeback();
  replaySafety();
  noScopeCreep();
  packageScript();
  console.log("verify-installment-balance-writeback: ok");
})();
