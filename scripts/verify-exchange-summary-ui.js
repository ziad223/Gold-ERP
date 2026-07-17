/**
 * Phase 30.5-Fix — verify the read-only ExchangeSummary sales-detail UI.
 *
 * Static checks only. No DB, HTTP requests, or mutations.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

const COMPONENT = "components/sales/ExchangeSummary.tsx";
const HOOK = "features/sales/hooks/use-exchange-display.ts";
const SALES = "app/[locale]/(dashboard)/sales/page.tsx";

function verifyComponent() {
  assert.ok(fs.existsSync(path.resolve(ROOT, COMPONENT)), "ExchangeSummary component exists");
  const component = read(COMPONENT);

  for (const text of [
    "Exchange credit",
    "Balance due to customer",
    "Amount due from customer",
    "VAT on replacement items",
    '"target_policy"',
    '"legacy_or_unknown"',
    '"linked_records"',
    '"best_effort"',
    '"unavailable"',
  ]) {
    assert.ok(component.includes(text), `ExchangeSummary handles ${text}`);
  }

  assert.ok(component.includes("display.customerFacing.replacementSection"), "replacement rows use trusted display data");
  assert.ok(component.includes("display.customerFacing.returnedCreditSection"), "returned credits use trusted display data");
  assert.ok(component.includes("display.figures.newTax"), "VAT uses the trusted endpoint figure");
  assert.ok(component.includes("display.settlementSummary"), "settlement uses the trusted endpoint summary");
  assert.ok(!component.includes("invoice.items"), "component does not derive display values from raw invoice items");
  assert.ok(!/reduce\s*\(/.test(component), "component does not recalculate totals");
  assert.ok(component.includes("Math.max(0"), "rendered monetary values are positive-only");
}

function verifyHookAndIntegration() {
  assert.ok(fs.existsSync(path.resolve(ROOT, HOOK)), "useExchangeDisplay hook exists");
  const hook = read(HOOK);
  const sales = read(SALES);

  assert.ok(hook.includes("/exchange-display"), "hook calls exchange-display endpoint");
  assert.ok(hook.includes('queryKey: ["invoice-exchange-display", invoiceId]'), "hook has invoice-scoped query key");
  assert.ok(hook.includes('dataSource === "api"'), "hook is API-source gated");
  assert.ok(hook.includes("Boolean(invoiceId) && enabled"), "hook requires an invoice id and explicit enablement");
  assert.ok(sales.includes('selected?.type === "exchange"'), "sales detail detects exchange invoices");
  assert.ok(sales.includes("Boolean(selected && selectedIsExchange)"), "exchange query is enabled only for an open exchange");
  assert.ok(sales.includes("isExchangeDisplayLoading"), "exchange loading state exists");
  assert.ok(sales.includes("exchangeDisplayError"), "endpoint error fallback exists");
  assert.ok(sales.includes("<ExchangeSummary"), "sales detail renders ExchangeSummary");
  assert.ok(sales.includes("<RawInvoiceDetail"), "normal/error raw detail remains available");
  assert.ok(
    sales.indexOf("selectedIsExchange && exchangeDisplay") < sales.indexOf("<RawInvoiceDetail"),
    "successful exchange enrichment suppresses raw detail",
  );
}

function verifyTypesAndPackage() {
  const types = read("lib/types.ts");
  for (const typeName of [
    "ExchangePolicyStatus",
    "ExchangeSettlementSource",
    "ExchangePolicyFigures",
    "ExchangeCustomerFacingModel",
    "ExchangeSettlementSummary",
    "ExchangeDisplayResponse",
    "ExchangeDisplayApiResponse",
  ]) {
    assert.ok(types.includes(`export ${typeName.startsWith("ExchangePolicyStatus") || typeName.startsWith("ExchangeSettlementSource") ? "type" : "interface"} ${typeName}`), `${typeName} exists`);
  }

  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["verify:exchange-summary-ui"], "node scripts/verify-exchange-summary-ui.js");
}

function verifyScope() {
  const changed = execFileSync("git", ["status", "--short", "--untracked-files=all"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"))
    .filter(f => !f.startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));
  const allowed = new Set([
    SALES,
    COMPONENT,
    HOOK,
    "backend/src/routes/erp.routes.js",
    "backend/src/bootstrap/accessControl.js",
    "backend/src/services/sales-operator-policy.service.js",
    "backend/src/services/system-account.service.js",
    "app/[locale]/(dashboard)/sales/returns/page.tsx",
    "app/[locale]/(dashboard)/sales/exchanges/page.tsx",
    "app/[locale]/(dashboard)/sales/installments/page.tsx",
    "lib/permissions/catalog.ts",
    "lib/types.ts",
    "scripts/verify-exchange-summary-ui.js",
    "scripts/verify-installment-reconciliation.js",
    "scripts/verify-ledger-reporting-foundation.js",
    "scripts/verify-customer-credit-existing-rows-checker.js",
    "scripts/verify-return-exchange-settlement-ui.js",
    "scripts/verify-exchange-tax-customer-facing-policy.js",
    "scripts/verify-live-exchange-tax-policy.js",
    "scripts/verify-exchange-display-api-enrichment.js",
    "package.json",
    "app/[locale]/(dashboard)/accounting/treasury/page.tsx",
    "hooks/use-treasury.ts",
    "messages/en.json",
    "messages/ar.json",
    "docs/AI_HANDOFF.md",
    "docs/employee-authorization/PHASE-34.5.md",
    "docs/employee-authorization/PHASE-34.5B.md",
  ]);

  for (const file of changed) assert.ok(allowed.has(file), `unexpected changed file: ${file}`);
  for (const file of changed) {
    assert.ok(!file.startsWith("features/printing/"), "print files remain untouched");
    // Phase 34.5B Core intentionally changes backend sales operator gates.
    assert.ok(!file.includes("/customers/"), "customer statement/history remains untouched");
    assert.ok(!file.includes("/pos/"), "POS remains untouched");
    assert.ok(!/(^|\/)migrations?\//.test(file), "no migration added");
  }
}

function syntaxGuard() {
  execFileSync(process.execPath, ["-c", path.resolve(ROOT, "scripts/verify-exchange-summary-ui.js")], { stdio: "pipe" });
}

verifyComponent();
verifyHookAndIntegration();
verifyTypesAndPackage();
verifyScope();
syntaxGuard();
console.log("verify-exchange-summary-ui: ok");
