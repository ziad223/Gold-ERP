/**
 * Phase 30.6-Fix — verify Customer History exchange summary integration.
 *
 * Static checks only. No DB, HTTP requests, or mutations.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

const CUSTOMER_DETAIL = "app/[locale]/(dashboard)/customers/[id]/page.tsx";
const COMPONENT = "components/sales/ExchangeSummary.tsx";
const HOOK = "features/sales/hooks/use-exchange-display.ts";

function extractSalesHistoryBlock(source) {
  const start = source.indexOf('{activeTab === "sales"');
  const end = source.indexOf('{activeTab === "statement"', start);
  assert.ok(start >= 0, "customer Sales & Invoices tab exists");
  assert.ok(end > start, "customer statement tab remains separate from sales history");
  return source.slice(start, end);
}

function verifyCustomerHistoryIntegration() {
  assert.ok(fs.existsSync(path.resolve(ROOT, CUSTOMER_DETAIL)), "customer detail page exists");
  assert.ok(fs.existsSync(path.resolve(ROOT, COMPONENT)), "ExchangeSummary component exists");
  assert.ok(fs.existsSync(path.resolve(ROOT, HOOK)), "useExchangeDisplay hook exists");

  const page = read(CUSTOMER_DETAIL);
  const salesBlock = extractSalesHistoryBlock(page);

  assert.ok(page.includes('import { ExchangeSummary } from "@/components/sales/ExchangeSummary";'), "customer page imports ExchangeSummary");
  assert.ok(page.includes('import { useExchangeDisplay } from "@/features/sales/hooks/use-exchange-display";'), "customer page imports useExchangeDisplay");
  assert.ok(page.includes("expandedExchangeInvoiceId"), "customer page has selected/expanded exchange invoice state");
  assert.ok(page.includes('invoice.type === "exchange"'), "selected exchange invoice is type-gated");
  assert.ok(page.includes('inv.type === "exchange"'), "row action is exchange-only");
  assert.ok(
    page.includes('useExchangeDisplay(selectedExchangeInvoice?.id, Boolean(selectedExchangeInvoice?.type === "exchange"))'),
    "exchange-display fetch is gated by selected exchange invoice state",
  );
  assert.ok(salesBlock.includes("<ExchangeSummary"), "sales history renders ExchangeSummary on successful enrichment");
  assert.ok(salesBlock.includes("Loading exchange summary"), "loading state exists");
  assert.ok(salesBlock.includes("Exchange summary is unavailable"), "endpoint error/unavailable fallback exists");
  assert.ok(salesBlock.includes("Showing stored invoice history only"), "fallback keeps stored row/history visible");
  assert.ok(salesBlock.includes("setExpandedExchangeInvoiceId"), "exchange-only action toggles the expanded panel lazily");
  assert.ok(!page.includes("/exchange-display"), "customer page reuses the hook and does not call the endpoint directly");

  const hook = read(HOOK);
  assert.ok(hook.includes("/exchange-display"), "trusted endpoint remains centralized in the hook");
  assert.ok(hook.includes("Boolean(invoiceId) && enabled"), "hook requires explicit enablement");
  assert.ok(hook.includes('dataSource === "api"'), "hook remains API-source gated");

  const component = read(COMPONENT);
  assert.ok(component.includes("display.customerFacing.replacementSection"), "ExchangeSummary uses trusted replacement display data");
  assert.ok(component.includes("display.figures.newTax"), "ExchangeSummary uses trusted VAT figure");
  assert.ok(!component.includes("invoice.items"), "ExchangeSummary does not derive values from raw invoice items");
  assert.ok(!/reduce\s*\(/.test(component), "ExchangeSummary does not recalculate totals");
  assert.ok(!/reduce\s*\(/.test(salesBlock), "customer sales history integration does not recalculate from raw invoice items");
}

function verifyPackageScript() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["verify:customer-history-exchange-display"],
    "node scripts/verify-customer-history-exchange-display.js",
    "package script is registered",
  );
}

function verifyScope() {
  const changed = execFileSync("git", ["status", "--short", "--untracked-files=all"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"))
    .filter(f => !f.startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));

  const allowed = new Set([
    CUSTOMER_DETAIL,
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
    "app/[locale]/(dashboard)/accounting/treasury/page.tsx",
    "hooks/use-treasury.ts",
    "messages/en.json",
    "messages/ar.json",
    "docs/AI_HANDOFF.md",
    "docs/employee-authorization/PHASE-34.5.md",
    "docs/employee-authorization/PHASE-34.5B.md",
    "package.json",
    "scripts/verify-customer-history-exchange-display.js",
    // HF6D: Employee-scoped Branch Account authorization and navigation.
    "app/[locale]/(dashboard)/employees/[id]/page.tsx",
    "app/[locale]/(dashboard)/pos/page.tsx",
    "backend/src/middleware/business-permission.middleware.js",
    "backend/src/routes/employee-authorization.routes.js",
    "backend/src/services/operator-session.service.js",
    "components/auth/auth-guard.tsx",
    "components/layout/sidebar.tsx",
    "contexts/operator-context.tsx",
    "hooks/use-permissions.ts",
    "lib/permissions/module-access.ts",
    "lib/repositories/api-impl.ts",
    "lib/repositories/interfaces.ts",
    "lib/repositories/local-impl.ts",
    "docs/employee-authorization/PHASE-HF6D-EMPLOYEE-PERMISSION-ENFORCEMENT.md",
  ]);

  for (const file of changed) assert.ok(allowed.has(file), `unexpected changed file: ${file}`);
  for (const file of changed) {
    // Phase 34.5B Core intentionally changes backend sales operator gates.
    assert.ok(!file.startsWith("features/printing/"), "print files remain untouched");
    assert.ok(
      !file.includes("/pos/") || file === "app/[locale]/(dashboard)/pos/page.tsx",
      "POS changes remain limited to HF6D permission gating",
    );
    assert.ok(!/(^|\/)migrations?\//.test(file), "no migration added");
  }

  const customerDiff = execFileSync("git", ["diff", "--", CUSTOMER_DETAIL], { cwd: ROOT, encoding: "utf8" });
  assert.ok(!customerDiff.includes("statement-v2"), "customer statement API usage is untouched");
  assert.ok(!customerDiff.includes("CustomerStatementPanel"), "customer statement panel is untouched");

  const printDiff = execFileSync("git", ["diff", "--", "features/printing"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(printDiff.trim(), "", "print diff is empty");
  const posDiff = execFileSync("git", ["diff", "--", "app/[locale]/(dashboard)/pos", "features/sales/hooks/use-pos.ts"], { cwd: ROOT, encoding: "utf8" });
  assert.ok(
    posDiff.trim() === "" || posDiff.includes('hasPermission("pos.installment.zeroDownPayment")'),
    "POS changes remain limited to the HF6D Employee permission check",
  );
  assert.ok(!posDiff.includes("features/sales/hooks/use-pos.ts"), "POS data flow is untouched");
}

function syntaxGuard() {
  execFileSync(process.execPath, ["-c", path.resolve(ROOT, "scripts/verify-customer-history-exchange-display.js")], { stdio: "pipe" });
}

verifyCustomerHistoryIntegration();
verifyPackageScript();
verifyScope();
syntaxGuard();
console.log("verify-customer-history-exchange-display: ok");
