/**
 * Phase 30-Fix — verify backend return/exchange settlement options.
 *
 * (A) Functional: exercise salesService.resolveExcessSettlement (pure, no DB) —
 *     absent settlement (legacy), cash/bank/credit split, sum-must-equal-excess,
 *     no-excess rejection, credit-needs-customer, account-code + negative guards.
 * (B) Static: the return uses postReturnEntry with cash/bank/credit split, the
 *     exchange money leg splits 1110/1120/2300, both create a CustomerCreditTransaction
 *     credit_in (return_credit / exchange_credit) with an explicit journalEntryId
 *     and NO glPosting, cash/bank refunds create CashTransaction logs (no
 *     postCashEntry), AR mirrors stay relief-only, idempotency scopes/whole-body
 *     hash are unchanged, and nothing touches POS/print/migrations.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

const sales = require(path.resolve(ROOT, "backend", "src", "services", "sales.service.js"));

// ── (A) Functional ───────────────────────────────────────────────────────────
function functional() {
  const R = sales.resolveExcessSettlement;
  assert.equal(typeof R, "function", "sales.service exports resolveExcessSettlement");

  // Absent settlement → legacy default (provided:false), caller keeps cash/bank refund.
  assert.equal(R({ excessAmount: 300, settlement: undefined, hasCustomer: true }).provided, false, "absent settlement → provided:false");
  assert.equal(R({ excessAmount: 300, settlement: null, hasCustomer: true }).provided, false, "null settlement → provided:false");

  // Single-method splits.
  let s = R({ excessAmount: 300, settlement: { cashAmount: 300 }, hasCustomer: true });
  assert.deepEqual([s.cashAmount, s.bankAmount, s.creditAmount], [300, 0, 0], "full cash refund");
  s = R({ excessAmount: 300, settlement: { bankAmount: 300 }, hasCustomer: true });
  assert.deepEqual([s.cashAmount, s.bankAmount, s.creditAmount], [0, 300, 0], "full bank refund");
  s = R({ excessAmount: 300, settlement: { creditAmount: 300 }, hasCustomer: true });
  assert.deepEqual([s.cashAmount, s.bankAmount, s.creditAmount], [0, 0, 300], "full customer credit");

  // Split settlements that sum to the excess.
  s = R({ excessAmount: 300, settlement: { cashAmount: 150, creditAmount: 150 }, hasCustomer: true });
  assert.deepEqual([s.cashAmount, s.bankAmount, s.creditAmount], [150, 0, 150], "cash+credit split");
  s = R({ excessAmount: 300, settlement: { cashAmount: 100, bankAmount: 100, creditAmount: 100 }, hasCustomer: true });
  assert.deepEqual([s.cashAmount, s.bankAmount, s.creditAmount], [100, 100, 100], "three-way split");

  // Sum must equal excess (over and under).
  assert.throws(() => R({ excessAmount: 300, settlement: { cashAmount: 300, creditAmount: 300 }, hasCustomer: true }), /must equal the excess/, "over-sum rejected (no double refund+credit)");
  assert.throws(() => R({ excessAmount: 300, settlement: { cashAmount: 200 }, hasCustomer: true }), /must equal the excess/, "under-sum rejected");

  // Credit needs a customer.
  assert.throws(() => R({ excessAmount: 300, settlement: { creditAmount: 300 }, hasCustomer: false }), /requires a customer/, "credit without a customer rejected");

  // No excess → settlement must be zero.
  assert.throws(() => R({ excessAmount: 0, settlement: { cashAmount: 100 }, hasCustomer: true }), /No excess/, "settlement on no-excess rejected");
  assert.equal(R({ excessAmount: 0, settlement: undefined, hasCustomer: true }).provided, false, "no excess + no settlement is fine");

  // Negative + wrong account codes.
  assert.throws(() => R({ excessAmount: 300, settlement: { cashAmount: -100, bankAmount: 400 }, hasCustomer: true }), /must not be negative/, "negative amount rejected");
  assert.throws(() => R({ excessAmount: 300, settlement: { cashAmount: 300, cashAccountCode: "1120" }, hasCustomer: true }), /cashAccountCode must be 1110/, "wrong cash account rejected");
  assert.throws(() => R({ excessAmount: 300, settlement: { bankAmount: 300, bankAccountCode: "1110" }, hasCustomer: true }), /bankAccountCode must be 1120/, "wrong bank account rejected");
}

// ── (B) Static ───────────────────────────────────────────────────────────────
const routes = read("backend/src/routes/erp.routes.js");
const posting = read("backend/src/services/posting.service.js");

function sliceBetween(src, startRe, endRe) {
  const s = src.search(startRe);
  if (s < 0) return "";
  const rest = src.slice(s);
  const e = rest.slice(1).search(endRe);
  return e < 0 ? rest : rest.slice(0, e + 1);
}

function staticChecks() {
  // Both endpoints validate the settlement via the shared helper.
  assert.ok((routes.match(/salesService\.resolveExcessSettlement\(/g) || []).length >= 2, "return + exchange both call resolveExcessSettlement");
  assert.ok(routes.includes("settlement: body.settlement"), "settlement is read from the request body");

  // postReturnEntry splits the money leg into cash (1110) / bank (1120) / credit (2300).
  assert.ok(posting.includes("opts.bankRefundAmount"), "postReturnEntry accepts bankRefundAmount");
  assert.ok(posting.includes("opts.customerCreditAmount"), "postReturnEntry accepts customerCreditAmount");
  assert.ok(/accountCode:\s*"2300"[\s\S]{0,80}customerCredit/.test(posting) || /customerCredit > 0[\s\S]{0,120}"2300"/.test(posting), "postReturnEntry posts Cr 2300 for the credit portion");

  // Return route: passes the split to postReturnEntry.
  assert.ok(/postReturnEntry\([\s\S]{0,400}customerCreditAmount:/.test(routes), "return passes customerCreditAmount to postReturnEntry");
  assert.ok(/postReturnEntry\([\s\S]{0,400}bankRefundAmount:/.test(routes), "return passes bankRefundAmount to postReturnEntry");

  // Exchange money leg splits 1110 / 1120 / 2300 for a refund excess.
  assert.ok(routes.includes('lines.push({ accountCode: "2300", debit: 0, credit: refundCreditPortion'), "exchange posts Cr 2300 for the credit portion");
  assert.ok(routes.includes("refundBankPortion") && routes.includes("refundCashPortion"), "exchange splits cash/bank refund portions");

  // Return credit row: return_credit, explicit journalEntryId, NO glPosting.
  const retCredit = sliceBetween(routes, /sourceType: "return_credit"/, /\}\);/);
  assert.ok(retCredit.length > 0, "return credit block found");
  assert.ok(/journalEntryId:\s*journalEntry/.test(retCredit), "return credit uses explicit journalEntryId");
  assert.ok(!/glPosting/.test(retCredit), "return credit does NOT use glPosting");

  // Exchange credit row: exchange_credit, explicit journalEntryId, NO glPosting.
  const exCredit = sliceBetween(routes, /sourceType: "exchange_credit"/, /\}\);/);
  assert.ok(exCredit.length > 0, "exchange credit block found");
  assert.ok(/journalEntryId:\s*journalEntry/.test(exCredit), "exchange credit uses explicit journalEntryId");
  assert.ok(!/glPosting/.test(exCredit), "exchange credit does NOT use glPosting");

  // Cash/bank refunds create CashTransaction logs; return/exchange journals own GL
  // (no postCashEntry in the settlement area).
  assert.ok(routes.includes("makeRefundCashTx") && routes.includes("makeExchangeCashTx"), "cash/bank refund CashTransaction logs exist");
  const retHandler = sliceBetween(routes, /const idemScope = "sales\.return"/, /const idemScope = "sales\.exchange"/);
  assert.ok(!/postCashEntry\s*\(/.test(retHandler), "return handler never calls postCashEntry");
  const exHandler = sliceBetween(routes, /const idemScope = "sales\.exchange"/, /router\.(get|post|put|patch|delete)\(/);
  assert.ok(!/postCashEntry\s*\(/.test(exHandler), "exchange handler never calls postCashEntry");

  // AR mirrors stay relief-only (Phase 21.2) — credit/cash portions never reduce AR.
  assert.ok(routes.includes("remainingAmount: Math.max(0, roundVal(outstandingBefore - receivableReliefAmount))"), "return remainingAmount reduced by relief only");
  assert.ok(!/remainingAmount:[^\n]*creditPortion/.test(routes) && !/balance:[^\n]*creditPortion/.test(routes), "credit portion never touches AR mirrors");

  // Idempotency: scopes unchanged, whole-body hash unchanged.
  assert.ok(routes.includes('const idemScope = "sales.return"'), "sales.return scope retained");
  assert.ok(routes.includes('const idemScope = "sales.exchange"'), "sales.exchange scope retained");
  assert.ok((routes.match(/idempotencyService\.hashRequest\(idemScope,\s*body\)/g) || []).length >= 2, "return + exchange still hash the whole body (settlement included)");

  // No POS checkout coupling to the settlement helper; POS scope intact.
  assert.ok(routes.includes('const idemScope = "pos.checkout"'), "pos.checkout scope intact");
  const posHandler = sliceBetween(routes, /const idemScope = "pos\.checkout"/, /const idemScope = "sales\.return"/);
  assert.ok(!posHandler.includes("resolveExcessSettlement"), "POS checkout does not use settlement options");

  // Service exports; no new migration; no print coupling.
  assert.ok(sales.resolveExcessSettlement, "resolveExcessSettlement exported");
  const migDir = path.resolve(ROOT, "backend", "migrations");
  assert.ok(!fs.readdirSync(migDir).some((f) => /settlement/i.test(f)), "no settlement migration added");
  assert.ok(!/print/i.test(read("backend/src/services/sales.service.js")), "sales.service has no print coupling");
}

(function main() {
  functional();
  staticChecks();
  console.log("verify-return-exchange-settlement-options: ok");
})();
