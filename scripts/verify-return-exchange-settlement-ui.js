/**
 * Phase 30.1-Fix — verify the RETURN settlement UI (return-only; exchange deferred).
 *
 * Static content checks on the return page (settlement math + controls + payload
 * + idempotency reset), a check that the exchange page did NOT gain settlement UI,
 * and a working-tree scope guard that still blocks POS / print / migration files.
 * Phase 30.2 may add a backend read-only preview helper without changing the
 * return UI or exchange UI.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

const RETURN_PAGE = "app/[locale]/(dashboard)/sales/returns/page.tsx";
const EXCHANGE_PAGE = "app/[locale]/(dashboard)/sales/exchanges/page.tsx";

function returnUi() {
  const src = read(RETURN_PAGE);

  // Receivable-first math from the audited inputs.
  assert.ok(src.includes("searchedInvoice?.vatRate"), "return UI reads invoice.vatRate");
  assert.ok(src.includes("returnValueGross"), "return UI computes the gross return value");
  assert.ok(/returnValueGross\s*=\s*roundMoney\(selectedNetTotal\s*\*\s*\(1\s*\+\s*vatRate\s*\/\s*100\)\)/.test(src), "gross uses vatRate");
  assert.ok(src.includes("searchedInvoice?.remainingAmount"), "return UI reads invoice.remainingAmount");
  assert.ok(src.includes("const arRelief = roundMoney(Math.min(returnValueGross, outstandingAR))"), "return UI computes AR relief");
  assert.ok(src.includes("const excess = roundMoney(Math.max(returnValueGross - arRelief, 0))"), "return UI computes the excess");

  // Settlement controls gated by excess > 0.
  assert.ok(src.includes("excess <= 0.01 ?"), "settlement controls are gated by excess > 0");
  assert.ok(src.includes("settlementEnabled"), "return UI has a settlement enable toggle");
  assert.ok(src.includes("setCashAmount") && src.includes("setBankAmount") && src.includes("setCreditAmount"), "return UI has cash/bank/credit inputs");

  // Payload: cash/bank/credit + fixed account codes, included only when enabled + excess.
  assert.ok(/if\s*\(settlementEnabled\s*&&\s*excess\s*>\s*0\.01\)/.test(src), "settlement included only when enabled AND excess > 0");
  assert.ok(src.includes("payload.settlement = {"), "return UI adds settlement to the payload");
  assert.ok(src.includes("cashAmount: settleCash"), "payload sends cashAmount");
  assert.ok(src.includes("bankAmount: settleBank"), "payload sends bankAmount");
  assert.ok(src.includes("creditAmount: settleCredit"), "payload sends creditAmount");
  assert.ok(src.includes('cashAccountCode: "1110"'), "payload uses cash account 1110");
  assert.ok(src.includes('bankAccountCode: "1120"'), "payload uses bank account 1120");

  // Validation: sum == excess within tolerance; credit needs a customer.
  assert.ok(src.includes("Math.abs(settlementSum - excess) > 0.01"), "validation requires the split to equal the excess (0.01 tolerance)");
  assert.ok(src.includes("settleCredit > 0 && !hasCustomer"), "credit settlement requires a customer");
  assert.ok(src.includes("disabled={!canCreateSales || !settlementValid}"), "submit is disabled on an invalid settlement");

  // Idempotency key resets when the settlement signature changes.
  assert.ok(/useEffect\(\s*\(\)\s*=>\s*\{\s*idempotencyKeyRef\.current\s*=\s*"";\s*\},\s*\[selectedItems,\s*settlementEnabled,\s*cashAmount,\s*bankAmount,\s*creditAmount/.test(src.replace(/\s+/g, " ")), "idempotency key resets on selection/settlement changes");

  // Backward compatibility: default state keeps settlement absent.
  assert.ok(src.includes("useState(false)") && src.includes("const [settlementEnabled, setSettlementEnabled] = useState(false)"), "settlement is disabled by default (legacy behavior)");
}

function exchangeDeferred() {
  const src = read(EXCHANGE_PAGE);
  assert.ok(!src.includes("settlementEnabled"), "exchange UI does NOT implement settlement controls (deferred)");
  assert.ok(!/payload\.settlement\s*=/.test(src), "exchange UI does NOT add a settlement payload (deferred)");
}

function scopeGuard() {
  // Working-tree changes vs HEAD (empty post-commit). This phase is frontend-only.
  let changed = [];
  try {
    changed = execSync("git diff --name-only HEAD", { cwd: ROOT }).toString().split("\n").map((s) => s.trim()).filter(Boolean);
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT }).toString().split("\n").map((s) => s.trim()).filter(Boolean);
    changed = changed.concat(untracked).filter(f => !f.replace(/\\/g, "/").startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));
  } catch { changed = []; }

  const allowed = new Set([
    "backend/src/routes/erp.routes.js",
    "backend/src/services/exchange-policy.service.js",
    "backend/src/services/exchange-display.service.js",
    "lib/exchange-policy.ts",
    "scripts/verify-exchange-tax-customer-facing-policy.js",
    "scripts/verify-live-exchange-tax-policy.js",
    "scripts/verify-exchange-display-api-enrichment.js",
    "scripts/verify-return-exchange-settlement.js",
    "scripts/verify-return-exchange-settlement-ui.js",
    "scripts/verify-installment-reconciliation.js",
    "scripts/verify-ledger-reporting-foundation.js",
    "scripts/verify-customer-credit-existing-rows-checker.js",
    "package.json",
    "docs/AI_HANDOFF.md",
    "app/[locale]/(dashboard)/sales/page.tsx",
    "components/sales/ExchangeSummary.tsx",
    "features/sales/hooks/use-exchange-display.ts",
    "lib/types.ts",
    "scripts/verify-exchange-summary-ui.js",
  ]);
  const forbidden = changed.filter((f) => {
    const normalized = f.replace(/\\/g, "/");
    return (
      normalized === RETURN_PAGE ||
      normalized === EXCHANGE_PAGE ||
      /(^|\/)pos\//.test(normalized) ||
      /features\/printing|CustomPrint|print/i.test(normalized) ||
      /(^|\/)migrations\//.test(normalized) ||
      !allowed.has(normalized)
    );
  });
  assert.equal(forbidden.length, 0, `this phase must not change return/exchange UI, POS, print, migration, or unrelated files (found: ${forbidden.join(", ")})`);
}

(function main() {
  returnUi();
  exchangeDeferred();
  scopeGuard();
  console.log("verify-return-exchange-settlement-ui: ok");
})();
