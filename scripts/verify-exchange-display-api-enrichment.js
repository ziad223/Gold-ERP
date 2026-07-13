/**
 * Phase 30.4-Fix — verify read-only exchange display API enrichment.
 *
 * Static + pure-helper checks only. No DB, HTTP requests, or mutations.
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

function verifyPureDisplayService() {
  const service = require(path.resolve(ROOT, "backend/src/services/exchange-display.service.js"));
  const invoice = {
    id: "EX-1",
    customerId: "CUS-1",
    relatedInvoiceId: "INV-1",
    subtotal: -100,
    tax: 56,
    total: -44,
    items: [
      { id: 1, assetId: "OLD", name: "Returned item", quantity: 1, price: -500 },
      { id: 2, assetId: "NEW", name: "Replacement item", quantity: 1, price: 400 },
    ],
  };
  const savedPolicy = {
    returnedValue: 500,
    newSubtotal: 400,
    newTax: 56,
    newGross: 456,
    difference: -44,
    amountDueFromCustomer: 0,
    arRelief: 0,
    excessDueToCustomer: 44,
    taxPolicy: {
      taxAppliesTo: "new_items_only",
      returnedValueTaxable: false,
      excessTaxable: false,
      settlementAffectsVat: false,
    },
  };
  const trustedPolicy = service.extractSavedExchangePolicy({
    status: "succeeded",
    responseBody: { data: { id: "EX-1", exchangePolicy: savedPolicy } },
  }, "EX-1");
  assert.equal(trustedPolicy, savedPolicy, "matching saved response is a trusted target-policy marker");
  assert.equal(service.extractSavedExchangePolicy({
    status: "succeeded",
    responseBody: { data: { id: "EX-OTHER", exchangePolicy: savedPolicy } },
  }, "EX-1"), null, "a marker for another invoice is rejected");
  const target = service.buildTargetPolicyDisplay({
    invoice,
    savedPolicy,
    currency: "EGP",
    settlementSummary: {
      cashAmount: 0,
      bankAmount: 0,
      creditAmount: 44,
      source: "linked_records",
      isComplete: true,
    },
  });
  assert.equal(target.policyStatus, "target_policy");
  assert.equal(target.policyVersion, "exchange_tax_new_items_only_v1");
  assert.equal(target.customerFacing.showNegativeLines, false);
  assert.equal(target.customerFacing.showNegativeTotal, false);
  assert.equal(target.customerFacing.returnedCreditSection[0].amount, 500);
  assert.equal(target.customerFacing.replacementSection[0].amount, 400);
  assert.equal(target.figures.newTax, 56);
  assert.equal(target.figures.excessDueToCustomer, 44);
  assert.equal(target.customerFacing.balanceDueLabel, "Balance due to customer");

  const legacy = service.buildLegacyDisplay({ invoice, currency: "EGP" });
  assert.equal(legacy.policyStatus, "legacy_or_unknown");
  assert.equal(legacy.policyVersion, null);
  assert.equal(legacy.legacyFallback.isLegacyOrUnknown, true);
  assert.equal(legacy.customerFacing.showNegativeLines, false);
  assert.equal(legacy.customerFacing.showNegativeTotal, false);
  assert.match(legacy.customerFacing.policyNote, /has not been recalculated/);
  assert.equal(legacy.settlementSummary.source, "unavailable");
}

function verifyReadOnlyRoute() {
  const routes = read("backend/src/routes/erp.routes.js");
  const block = routeBlock(routes, 'router.get("/invoices/:id/exchange-display"');

  assert.ok(block.includes('requirePermission("sales.view")'), "read permission is required");
  assert.ok(block.includes('invoice.type !== "exchange"'), "route validates exchange invoice type");
  assert.ok(block.includes("companyId: req.companyId"), "route is company scoped");
  assert.ok(block.includes('scope: "sales.exchange"'), "target policy uses saved sales.exchange response");
  assert.ok(block.includes("extractSavedExchangePolicy"), "route requires trusted policy marker");
  assert.ok(block.includes("extractSavedExchangePolicy(idempotencyRequest, invoice.id)"), "saved policy must belong to the requested invoice");
  assert.ok(block.includes("buildLegacyDisplay"), "legacy_or_unknown fallback exists");
  assert.ok(block.includes("buildTargetPolicyDisplay"), "target display model exists");
  assert.ok(block.includes("buildSettlementSummary"), "settlement summary is linked-record based");
  assert.ok(block.includes("readOnly: true"), "response is marked read-only");

  for (const forbidden of [
    "Invoice.create", "Invoice.update", "Invoice.destroy", "InvoiceItem.create",
    "InvoiceItem.update", "InvoiceItem.destroy", "Payment.create",
    "CashTransaction.create", "CustomerCreditTransaction.create",
    "postingService.postEntry", "recordCreditIn", "recordCreditOut",
    ".update(", ".destroy(", ".save(", "sequelize.transaction",
  ]) {
    assert.ok(!block.includes(forbidden), `read-only route excludes ${forbidden}`);
  }
}

function verifySourceAndScope() {
  const service = read("backend/src/services/exchange-display.service.js");
  assert.ok(service.includes('POLICY_VERSION = "exchange_tax_new_items_only_v1"'));
  assert.ok(service.includes('LEGACY_POLICY_STATUS = "legacy_or_unknown"'));
  assert.ok(service.includes('vatAppliesTo: "new_items_only"'));
  assert.ok(service.includes("returnedValueTaxable: false"));
  assert.ok(service.includes("excessTaxable: false"));
  assert.ok(service.includes("showNegativeLines: false"));
  assert.ok(service.includes("showNegativeTotal: false"));
  assert.ok(read("backend/src/services/exchange-policy.service.js").includes("Balance due to customer"));
  assert.ok(service.includes('"linked_records"'));
  assert.ok(service.includes('"best_effort"'));
  assert.ok(service.includes('"unavailable"'));

  const changed = execFileSync("git", ["status", "--short", "--untracked-files=all"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"))
    .filter(f => !f.startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));
  const allowed = new Set([
    "backend/src/routes/erp.routes.js",
    "backend/src/services/exchange-display.service.js",
    "scripts/verify-exchange-display-api-enrichment.js",
    "scripts/verify-live-exchange-tax-policy.js",
    "scripts/verify-exchange-tax-customer-facing-policy.js",
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
  for (const file of changed) assert.ok(allowed.has(file), `unexpected changed file: ${file}`);
  assert.ok(!changed.some((file) => file.startsWith("features/printing/")), "no print files changed");
  assert.ok(!changed.some((file) => /(^|\/)migrations?\//.test(file)), "no migration added");
}

function verifyPackageScript() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["verify:exchange-display-api-enrichment"],
    "node scripts/verify-exchange-display-api-enrichment.js",
  );
}

function syntaxGuard() {
  for (const file of [
    "backend/src/routes/erp.routes.js",
    "backend/src/services/exchange-display.service.js",
    "scripts/verify-exchange-display-api-enrichment.js",
  ]) {
    execFileSync(process.execPath, ["-c", path.resolve(ROOT, file)], { stdio: "pipe" });
  }
}

verifyPureDisplayService();
verifyReadOnlyRoute();
verifySourceAndScope();
verifyPackageScript();
syntaxGuard();
console.log("verify-exchange-display-api-enrichment: ok");
