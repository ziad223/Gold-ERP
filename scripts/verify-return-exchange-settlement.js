/**
 * Phase 21.2-Fix — verify receivable-first return / exchange settlement.
 *
 * (A) Functional: exercises posting.service.postReturnEntry's money leg with a
 *     stubbed postEntry (captures GL lines, no DB). Confirms the AR 1300 / Cash
 *     split and legacy fallback, and that every entry balances.
 * (B) Matrix: the settlement formula (returns + exchanges) across the scenarios.
 * (C) Static: the /sales/returns and /sales/exchanges route source uses the
 *     receivable-first split, gates treasury on real cash, posts to AR 1300, and
 *     no longer contains the old unconditional full-value cash lines. Stock/asset
 *     sections remain intact.
 *
 * No DB reset/seed, no live requests.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

// ── (A) Functional: postReturnEntry money leg ───────────────────────────────
const posting = require(path.resolve(__dirname, "..", "backend", "src", "services", "posting.service.js"));
posting.resolveAccountingByKarat = async () => false; // deterministic, no DB
let captured = null;
posting.postEntry = async (_companyId, _meta, lines) => { captured = lines; return { id: "JE-TEST", lines }; };

const findLine = (lines, code, side) => lines.find((l) => l.accountCode === code && Number(l[side]) > 0);
const sum = (lines, side) => round(lines.reduce((s, l) => s + Number(l[side] || 0), 0));

async function returnLines(opts) {
  captured = null;
  await posting.postReturnEntry(
    { id: "INV-1", companyId: "C", total: 3000, tax: 0, subtotal: 3000, date: "2026-01-01" },
    [],
    "tester",
    opts,
  );
  return captured;
}

async function functionalPostReturnEntry() {
  // Unpaid: full AR relief, no cash.
  let l = await returnLines({ receivableReliefAmount: 3000, cashRefundAmount: 0, cashAccountCode: "1110" });
  assert.ok(findLine(l, "1300", "credit"), "unpaid return credits AR 1300");
  assert.equal(findLine(l, "1300", "credit").credit, 3000);
  assert.ok(!findLine(l, "1110", "credit"), "unpaid return has no cash credit");
  assert.equal(sum(l, "debit"), sum(l, "credit"), "unpaid return entry balances");

  // Fully paid: full cash, no AR.
  l = await returnLines({ receivableReliefAmount: 0, cashRefundAmount: 3000, cashAccountCode: "1110" });
  assert.ok(findLine(l, "1110", "credit"), "fully-paid return credits cash 1110");
  assert.equal(findLine(l, "1110", "credit").credit, 3000);
  assert.ok(!findLine(l, "1300", "credit"), "fully-paid return has no AR credit");
  assert.equal(sum(l, "debit"), sum(l, "credit"), "fully-paid return entry balances");

  // Partial: split AR + cash.
  l = await returnLines({ receivableReliefAmount: 2000, cashRefundAmount: 1000, cashAccountCode: "1110" });
  assert.equal(findLine(l, "1300", "credit").credit, 2000, "partial return AR relief");
  assert.equal(findLine(l, "1110", "credit").credit, 1000, "partial return cash refund");
  assert.equal(sum(l, "debit"), sum(l, "credit"), "partial return entry balances");

  // Bank refund uses 1120.
  l = await returnLines({ receivableReliefAmount: 0, cashRefundAmount: 3000, cashAccountCode: "1120" });
  assert.ok(findLine(l, "1120", "credit"), "bank refund credits 1120");

  // Legacy call (no opts) falls back to full cash on 1110 (backward compatible).
  l = await returnLines({});
  assert.ok(findLine(l, "1110", "credit"), "legacy return still credits full cash 1110");
  assert.equal(findLine(l, "1110", "credit").credit, 3000);
  assert.ok(!findLine(l, "1300", "credit"), "legacy return has no AR credit");
  assert.equal(sum(l, "debit"), sum(l, "credit"), "legacy return entry balances");
}

// ── (B) Settlement formula matrix ───────────────────────────────────────────
function settleReturn(returnedTotal, outstanding) {
  const relief = round(Math.min(returnedTotal, outstanding));
  return { relief, cash: round(returnedTotal - relief) };
}
function settleExchange(diffTotal, outstanding, settlementMode) {
  let relief = 0, cashRefund = 0, increase = 0, cashIn = 0;
  if (diffTotal < 0) {
    const v = round(Math.abs(diffTotal));
    relief = round(Math.min(v, outstanding));
    cashRefund = round(v - relief);
  } else if (diffTotal > 0) {
    if (settlementMode === "paid_now") cashIn = round(diffTotal);
    else increase = round(diffTotal);
  }
  return { relief, cashRefund, increase, cashIn };
}

function matrix() {
  // Returns
  assert.deepEqual(settleReturn(3000, 10000), { relief: 3000, cash: 0 }, "return unpaid → AR only");
  assert.deepEqual(settleReturn(3000, 0), { relief: 0, cash: 3000 }, "return fully paid → cash only");
  assert.deepEqual(settleReturn(3000, 2000), { relief: 2000, cash: 1000 }, "return partial → split");
  assert.deepEqual(settleReturn(3000, 3000), { relief: 3000, cash: 0 }, "return == outstanding → AR only");
  assert.deepEqual(settleReturn(3000, 5000), { relief: 3000, cash: 0 }, "return < outstanding → AR only");

  // Exchanges
  assert.deepEqual(settleExchange(0, 5000, "credit"), { relief: 0, cashRefund: 0, increase: 0, cashIn: 0 }, "even exchange → no money leg");
  assert.deepEqual(settleExchange(-1000, 3000, "credit"), { relief: 1000, cashRefund: 0, increase: 0, cashIn: 0 }, "diff<0 with outstanding → AR relief first");
  assert.deepEqual(settleExchange(-1000, 400, "credit"), { relief: 400, cashRefund: 600, increase: 0, cashIn: 0 }, "diff<0 excess → cash refund");
  assert.deepEqual(settleExchange(-1000, 0, "credit"), { relief: 0, cashRefund: 1000, increase: 0, cashIn: 0 }, "diff<0 no outstanding → cash refund");
  assert.deepEqual(settleExchange(1000, 2000, "credit"), { relief: 0, cashRefund: 0, increase: 1000, cashIn: 0 }, "diff>0 credit → AR increase, no cash_in");
  assert.deepEqual(settleExchange(1000, 2000, "paid_now"), { relief: 0, cashRefund: 0, increase: 0, cashIn: 1000 }, "diff>0 paid_now → cash_in, no AR");
}

// ── (C) Static route assertions ─────────────────────────────────────────────
function staticRouteChecks() {
  const routes = fs.readFileSync(path.resolve(__dirname, "..", "backend", "src", "routes", "erp.routes.js"), "utf8");
  const svc = fs.readFileSync(path.resolve(__dirname, "..", "backend", "src", "services", "posting.service.js"), "utf8");

  // Returns receivable-first + gated treasury + AR passed to posting.
  assert.ok(routes.includes("receivableReliefAmount = roundVal(Math.min(returnedTotal, outstandingBefore))"), "returns compute receivable-first relief");
  assert.ok(routes.includes("cashRefundAmount = roundVal(returnedTotal - receivableReliefAmount)"), "returns compute cash-refund excess");
  assert.ok(routes.includes("if (cashRefundAmount > 0)"), "returns gate cash_out on real refund");
  assert.ok(/postReturnEntry\([\s\S]{0,220}receivableReliefAmount/.test(routes), "returns pass the split to postReturnEntry");

  // Exchange receivable-first + gated treasury + AR 1300 GL leg.
  assert.ok(routes.includes("receivableReliefAmount = roundVal(Math.min(creditValue, outstandingBefore))"), "exchange computes receivable-first relief");
  assert.ok(routes.includes("exchangeCashAmount = diffTotal > 0 ? cashInAmount : cashRefundAmount"), "exchange gates treasury on real cash");
  assert.ok(routes.includes("if (exchangeCashAmount > 0)"), "exchange only creates CashTransaction for real cash");
  assert.ok(routes.includes('accountCode: "1300"'), "exchange GL posts to AR 1300");
  assert.ok(routes.includes("exchangeArDelta"), "exchange adjusts receivable via a single AR delta");

  // Old bugs are gone.
  assert.ok(!routes.includes("amount: returnedTotal,"), "returns no longer create a full-value cash_out (amount: returnedTotal)");
  assert.ok(!routes.includes("if (diffTotal !== 0) {"), "exchange no longer creates unconditional cash by diff sign");
  assert.ok(!routes.includes('paymentMethod === "credit"'), "exchange no longer keys receivable off the hardcoded 'credit' method");

  // posting.service money-leg split.
  assert.ok(svc.includes('accountCode: "1300"'), "postReturnEntry can credit AR 1300");
  assert.ok(svc.includes("opts.cashRefundAmount"), "postReturnEntry accepts the cash-refund split");

  // Stock / asset reversal sections remain intact (not regressed).
  assert.ok(routes.includes('type: "return"'), "return StockMovement section present");
  assert.ok(routes.includes('action: "RETURNED"'), "return AssetEvent present");
  assert.ok(routes.includes('action: "EXCHANGED_IN"') && routes.includes('action: "EXCHANGED_OUT"'), "exchange AssetEvents present");
  assert.ok(routes.includes('type: "exchange_out"'), "exchange StockMovement present");
}

(async () => {
  await functionalPostReturnEntry();
  matrix();
  staticRouteChecks();
  console.log("verify-return-exchange-settlement: ok");
})().catch((err) => { console.error(err); process.exit(1); });
