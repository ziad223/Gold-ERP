/**
 * Phase 30.2-Fix — verify read-only exchange target-policy preview.
 *
 * Static + pure-helper checks only. No DB, no HTTP requests, no mutations.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

function routeBlock(src, startNeedle) {
  const start = src.indexOf(startNeedle);
  assert.ok(start >= 0, `${startNeedle} exists`);
  const next = src.indexOf("\nrouter.", start + 1);
  return src.slice(start, next >= 0 ? next : src.length);
}

function assertIncludes(src, needle, message) {
  assert.ok(src.includes(needle), message);
}

function assertNotMatches(src, regex, message) {
  assert.ok(!regex.test(src), message);
}

function verifyPurePolicyHelper() {
  const service = require(path.resolve(ROOT, "backend", "src", "services", "exchange-policy.service.js"));
  const preview = service.computeExchangePolicyPreview({
    originalInvoiceId: "INV-1",
    customerId: "CUS-1",
    currency: "EGP",
    vatRate: 14,
    returnedValue: 500,
    newSubtotal: 400,
    outstandingAR: 20,
    settlement: { creditAmount: 24, cashAccountCode: "1110", bankAccountCode: "1120" },
  });

  assert.equal(preview.newTax, 56, "newTax is computed from newSubtotal only");
  assert.equal(preview.newGross, 456, "newGross includes newSubtotal + newTax");
  assert.equal(preview.difference, -44, "difference is new gross minus returned value");
  assert.equal(preview.arRelief, 20, "AR relief applies to refund value first");
  assert.equal(preview.excessDueToCustomer, 24, "excess due to customer is separated");
  assert.equal(preview.taxPolicy.excessTaxable, false, "excess is not taxable");
  assert.equal(preview.taxPolicy.returnedValueTaxable, false, "returned value is not taxable");
  assert.equal(preview.taxPolicy.settlementAffectsVat, false, "settlement does not affect VAT");
  assert.equal(preview.settlementPreview.isValid, true, "settlement preview is valid");
  assert.equal(preview.settlementPreview.remainingToAllocate, 0, "settlement allocates all excess");
  assert.equal(preview.customerFacing.showNegativeLines, false, "customer-facing helper forbids negative lines");
  assert.equal(preview.customerFacing.showNegativeTotal, false, "customer-facing helper forbids negative totals");
  assert.equal(preview.customerFacing.balanceDueLabel, "Balance due to customer", "customer-facing helper labels customer balance");

  assert.throws(
    () => service.computeExchangePolicyPreview({
      originalInvoiceId: "INV-1",
      customerId: "CUS-1",
      vatRate: 14,
      returnedValue: 500,
      newSubtotal: 400,
      outstandingAR: 20,
      settlement: { cashAmount: 10 },
    }),
    /must equal the excess/,
    "settlement must equal excess due to customer",
  );
}

function verifyPreviewRoute() {
  const routes = read("backend/src/routes/erp.routes.js");
  const previewRoute = routeBlock(routes, '"/sales/exchanges/preview",');
  const liveRoute = routeBlock(routes, '"/sales/exchanges",');

  assertIncludes(previewRoute, '"/sales/exchanges/preview"', "preview route exists");
  assertIncludes(previewRoute, 'requireSalesCommandAccess("sales.exchange.preview"', "preview route uses account-type-aware sales gate");
  assertIncludes(previewRoute, "computeExchangePolicyPreview", "preview route uses target policy helper");
  assertIncludes(previewRoute, "readOnly: true", "preview route marks read-only response");
  assertIncludes(previewRoute, "newSubtotal", "preview route computes new subtotal");
  assertIncludes(previewRoute, "newTax", "preview response supports newTax through helper");
  assertIncludes(previewRoute, "excessDueToCustomer", "preview response supports excessDueToCustomer through helper");
  assertIncludes(previewRoute, "settlement: body.settlement", "preview validates optional settlement");
  assertIncludes(previewRoute, "returnedItems", "preview accepts returnedItems safe subset");
  assertIncludes(previewRoute, "newItems", "preview accepts current newItems shape");

  for (const forbidden of [
    "Invoice.create",
    "Payment.create",
    "CashTransaction.create",
    "CustomerCreditTransaction.create",
    "recordCreditIn",
    "postingService.postEntry",
    "postCashEntry",
    ".update(",
    ".destroy(",
    ".save(",
    "sequelize.transaction",
  ]) {
    assert.ok(!previewRoute.includes(forbidden), `preview route is read-only and does not use ${forbidden}`);
  }

  assertIncludes(liveRoute, "computeExchangePolicyPreview", "live exchange uses target policy helper");
  assertIncludes(liveRoute, "const newTax = roundVal(exchangePolicy.newTax)", "live exchange uses helper newTax");
  assertIncludes(liveRoute, "const excessDueToCustomer = roundVal(exchangePolicy.excessDueToCustomer)", "live exchange uses helper excess due to customer");
  assertNotMatches(liveRoute, /diffTax\s*=\s*roundVal\(\s*diffBase\s*\*/, "live exchange no longer taxes net difference");
  assertIncludes(liveRoute, "Invoice.create", "live exchange creation remains in live route only");
  assertIncludes(liveRoute, "price: -Number(originalItem.price || 0)", "live exchange item storage still has negative return line");
  assertIncludes(liveRoute, "postingService.postEntry", "live exchange posting remains present");
}

function verifyHelpersAndScope() {
  const backendHelper = read("backend/src/services/exchange-policy.service.js");
  const frontendHelper = read("lib/exchange-policy.ts");

  assertIncludes(backendHelper, "taxAppliesTo: \"new_items_only\"", "backend helper declares new-item-only tax policy");
  assertIncludes(backendHelper, "excessTaxable: false", "backend helper declares excess untaxed");
  assertIncludes(backendHelper, "newTax = roundMoney(subtotal * (rate / 100))", "backend helper taxes new subtotal only");
  assertIncludes(backendHelper, "excessDueToCustomer", "backend helper computes excess due to customer");
  assertIncludes(backendHelper, "resolveExcessSettlement", "backend helper validates settlement against excess");
  assertIncludes(backendHelper, "showNegativeLines: false", "backend helper forbids negative display lines");
  assertIncludes(backendHelper, "showNegativeTotal: false", "backend helper forbids negative display total");
  assertIncludes(backendHelper, "Balance due to customer", "backend helper includes balance due label");

  assertIncludes(frontendHelper, "buildExchangeCustomerFacingPolicy", "frontend helper exports customer-facing policy builder");
  assertIncludes(frontendHelper, "showNegativeLines: false", "frontend helper forbids negative display lines");
  assertIncludes(frontendHelper, "showNegativeTotal: false", "frontend helper forbids negative display total");
  assertIncludes(frontendHelper, "positiveMoney", "frontend helper clamps display amounts");
  assertIncludes(frontendHelper, "Remaining balance due to customer is not taxed again.", "frontend helper carries policy note");

  const changed = execFileSync("git", ["status", "--short", "--untracked-files=all"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter(f => !f.startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));
  const allowed = new Set([
    "backend/src/routes/erp.routes.js",
    "backend/src/bootstrap/accessControl.js",
    "backend/src/services/sales-operator-policy.service.js",
    "backend/src/services/system-account.service.js",
    "backend/src/services/exchange-display.service.js",
    "backend/src/services/exchange-policy.service.js",
    "lib/exchange-policy.ts",
    "scripts/verify-exchange-tax-customer-facing-policy.js",
    "scripts/verify-live-exchange-tax-policy.js",
    "scripts/verify-exchange-display-api-enrichment.js",
    "scripts/verify-return-exchange-settlement-ui.js",
    "scripts/verify-return-exchange-settlement.js",
    "scripts/verify-installment-reconciliation.js",
    "scripts/verify-ledger-reporting-foundation.js",
    "scripts/verify-customer-credit-existing-rows-checker.js",
    "package.json",
    "app/[locale]/(dashboard)/accounting/treasury/page.tsx",
    "hooks/use-treasury.ts",
    "messages/en.json",
    "messages/ar.json",
    "docs/AI_HANDOFF.md",
    "docs/employee-authorization/PHASE-34.5.md",
    "docs/employee-authorization/PHASE-34.5B.md",
    "app/[locale]/(dashboard)/sales/page.tsx",
    "app/[locale]/(dashboard)/sales/returns/page.tsx",
    "app/[locale]/(dashboard)/sales/exchanges/page.tsx",
    "app/[locale]/(dashboard)/sales/installments/page.tsx",
    "components/sales/ExchangeSummary.tsx",
    "features/sales/hooks/use-exchange-display.ts",
    "lib/types.ts",
    "lib/permissions/catalog.ts",
    "scripts/verify-exchange-summary-ui.js",
  ]);
  for (const file of changed) {
    assert.ok(allowed.has(file), `unexpected changed file: ${file}`);
  }
  assert.ok(!changed.some((file) => /features\/printing|CustomPrint|print/i.test(file)), "no print templates touched");
  assert.ok(!changed.some((file) => /(^|\/)pos\//.test(file)), "no POS files touched");
  assert.ok(!changed.some((file) => /migrations?\//.test(file)), "no migration added");
  // Phase 34.5B Core intentionally adjusts return/exchange UI operator gating
  // without changing the target-tax calculation contract verified here.
}

function verifyPackageScript() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["verify:exchange-tax-customer-facing-policy"],
    "node scripts/verify-exchange-tax-customer-facing-policy.js",
    "package script is registered",
  );
}

function syntaxGuard() {
  for (const file of [
    "backend/src/routes/erp.routes.js",
    "backend/src/services/exchange-policy.service.js",
    "scripts/verify-exchange-tax-customer-facing-policy.js",
  ]) {
    execFileSync(process.execPath, ["-c", path.resolve(ROOT, file)], { stdio: "pipe" });
  }
}

function main() {
  verifyPurePolicyHelper();
  verifyPreviewRoute();
  verifyHelpersAndScope();
  verifyPackageScript();
  syntaxGuard();
  console.log("verify-exchange-tax-customer-facing-policy: ok");
}

main();
