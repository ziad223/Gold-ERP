/**
 * Phase 25-Fix — verify read-only ledger reporting foundation.
 *
 * Static checks only: no DB, no HTTP requests, no mutations.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

function assertIncludes(src, needle, message) {
  assert.ok(src.includes(needle), message);
}

function assertNotMatches(src, regex, message) {
  assert.ok(!regex.test(src), message);
}

function routeBlock(src, route) {
  const start = src.indexOf(`router.get("${route}"`);
  assert.ok(start >= 0, `${route} route exists`);
  const next = src.indexOf("\nrouter.", start + 1);
  return src.slice(start, next >= 0 ? next : src.length);
}

function verifyLedgerRoutes() {
  const routes = read("backend/src/routes/erp.routes.js");

  for (const model of ["JournalEntry", "JournalLine", "Account"]) {
    assertIncludes(routes, `models.${model}`, `ledger routes read ${model}`);
  }

  const accountRoute = routeBlock(routes, "/reports/ledger/account");
  const cashRoute = routeBlock(routes, "/reports/ledger/cash-reconciliation");
  const arApRoute = routeBlock(routes, "/reports/ledger/ar-ap-reconciliation");
  const trialRoute = routeBlock(routes, "/reports/trial-balance");
  const accountStatementRoute = routeBlock(routes, "/accounts/:id/statement");

  for (const block of [accountRoute, cashRoute, arApRoute, trialRoute, accountStatementRoute]) {
    assert.ok(block.includes("ledgerBased") || block.includes("ledgerMeta"), "ledger report returns ledger metadata");
    assert.ok(block.includes("journal_lines") || block.includes("ledgerMeta"), "ledger report declares journal line source");
    assertNotMatches(block, /\.(create|update|destroy|bulkCreate|save|increment|decrement)\s*\(/, "ledger report block contains no ORM write methods");
    assertNotMatches(block, /sequelize\.query\s*\(\s*["'`](UPDATE|DELETE|INSERT)|TRUNCATE|DROP TABLE|ALTER TABLE/i, "ledger report block contains no destructive SQL");
  }

  assertIncludes(accountRoute, "accountCode", "account ledger supports accountCode");
  assertIncludes(accountRoute, "accountId", "account ledger supports accountId");
  assertIncludes(accountRoute, "openingBalance", "account ledger reports opening balance");
  assertIncludes(accountRoute, "runningBalance", "account ledger reports running balance");
  assertIncludes(accountRoute, "sourceType", "account ledger exposes sourceType");
  assertIncludes(accountRoute, "sourceId", "account ledger exposes sourceId");

  for (const code of ["1110", "1120"]) {
    assertIncludes(cashRoute, code, `cash reconciliation includes GL account ${code}`);
  }
  assertIncludes(cashRoute, "models.CashTransaction.findAll", "cash reconciliation compares CashTransaction");
  assertIncludes(cashRoute, "glSource: \"journal_lines\"", "cash reconciliation declares GL source");
  assertIncludes(cashRoute, "operationalSource: \"cash_transactions\"", "cash reconciliation declares operational source");

  for (const code of ["1300", "2100", "2300"]) {
    assertIncludes(arApRoute, code, `AR/AP reconciliation includes account ${code}`);
  }
  assertIncludes(arApRoute, "models.Customer.findAll", "AR reconciliation reads Customer.balance mirror");
  assertIncludes(arApRoute, "models.Supplier.findAll", "AP reconciliation reads Supplier.due mirror");
  assertIncludes(arApRoute, "CustomerCreditTransaction", "customer deposits line references credit ledger when available");
  assertIncludes(arApRoute, "partyLevel: false", "AR/AP route declares account-level limitation");
  assertIncludes(arApRoute, "Journal lines do not store customerId/supplierId", "AR/AP route explains party-level limitation");

  for (const route of ["/reports/profit-summary", "/reports/financial-summary", "/reports/tax-summary", "/customers/:id/statement-v2", "/suppliers/:id/statement"]) {
    const block = routeBlock(routes, route);
    assertIncludes(block, "ledgerBased: false", `${route} is labeled non-ledger when document-based`);
  }
}

function verifyScope() {
  const changed = execFileSync("git", ["status", "--short", "--untracked-files=all"], {
    cwd: ROOT,
    encoding: "utf8",
  }).split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim())
    .filter(f => !f.replace(/\\/g, "/").startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));
  const allowed = new Set([
    "backend/src/routes/erp.routes.js",
    "backend/src/services/exchange-display.service.js",
    "scripts/verify-exchange-display-api-enrichment.js",
    "scripts/verify-ledger-reporting-foundation.js",
    "scripts/verify-installment-reconciliation.js",
    "backend/src/services/customer-credit.service.js",
    "scripts/verify-customer-credit-ledger.js",
    "scripts/verify-customer-credit-gl-bridge.js",
    "backend/scripts/check-customer-credit-gl-bridge.js",
    "backend/scripts/reconcile-installment-balances.js",
    "backend/scripts/idempotency-cleanup.js",
    "scripts/verify-customer-credit-existing-rows-checker.js",
    "scripts/verify-secondary-idempotency.js",
    "scripts/verify-manual-customer-deposit.js",
    "scripts/verify-customer-credit-refund.js",
    "scripts/verify-apply-customer-credit.js",
    "scripts/verify-exchange-tax-customer-facing-policy.js",
    "scripts/verify-live-exchange-tax-policy.js",
    "scripts/verify-return-exchange-settlement.js",
    "scripts/verify-return-exchange-settlement-ui.js",
    "app/[locale]/(dashboard)/customers/[id]/page.tsx",
    "backend/src/bootstrap/accessControl.js",
    "backend/src/services/sales-operator-policy.service.js",
    "backend/src/services/system-account.service.js",
    "backend/src/models/customerCreditTransaction.model.js",
    "backend/src/services/exchange-policy.service.js",
    "lib/exchange-policy.ts",
    "package.json",
    "app/[locale]/(dashboard)/accounting/treasury/page.tsx",
    "app/[locale]/(dashboard)/accounting/page.tsx",
    "app/[locale]/(dashboard)/sales/gift-vouchers/page.tsx",
    "backend/migrations/20260717010000-accounting-treasury-launch-minimum.js",
    "backend/src/bootstrap/accessControl.js",
    "backend/src/models/accountingLock.model.js",
    "backend/src/models/cashRegisterSession.model.js",
    "backend/src/models/index.js",
    "backend/src/routes/erp.routes.js",
    "backend/src/services/account-balance.service.js",
    "backend/src/services/accounting-lock.service.js",
    "backend/src/services/cash-register.service.js",
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
    "backend/src/services/journal.service.js",
    "backend/src/services/posting.service.js",
    "docs/accounting/PHASE-35D-ACCOUNTING-TREASURY-LAUNCH-MINIMUM.md",
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
    "lib/repositories/api-impl.ts",
    "lib/repositories/interfaces.ts",
    "lib/repositories/local-impl.ts",
    "lib/permissions/catalog.ts",
    "scripts/verify-accounting-treasury-launch-minimum.js",
    "scripts/verify-exchange-summary-ui.js",
  ]);
  for (const file of changed) {
    assert.ok(allowed.has(file), `unexpected changed file: ${file}`);
  }
  assert.ok(
    !changed.some((file) => file.includes("posting.service.js") && file !== "backend/src/services/posting.service.js"),
    "only Phase 35D accounting-lock posting change is allowed"
  );
  assert.ok(
    !changed.some((file) =>
      (file.startsWith("app/") &&
        file !== "app/[locale]/(dashboard)/customers/[id]/page.tsx" &&
        file !== "app/[locale]/(dashboard)/sales/page.tsx" &&
        file !== "app/[locale]/(dashboard)/sales/returns/page.tsx" &&
        file !== "app/[locale]/(dashboard)/sales/exchanges/page.tsx" &&
        file !== "app/[locale]/(dashboard)/sales/installments/page.tsx" &&
        file !== "app/[locale]/(dashboard)/accounting/treasury/page.tsx" &&
        file !== "app/[locale]/(dashboard)/accounting/page.tsx" &&
        file !== "app/[locale]/(dashboard)/sales/gift-vouchers/page.tsx") ||
      file.startsWith("features/dashboard")
    ),
    "dashboard/frontend reports were not rewritten",
  );
  assert.ok(!changed.some((file) => !file.replace(/\\/g, "/").startsWith("scripts/verify-") && /features\/printing|CustomPrint|print/i.test(file)), "no print files touched");
  assert.ok(!changed.some((file) => /migration|migrations/i.test(file) && file !== "backend/migrations/20260717010000-accounting-treasury-launch-minimum.js"), "only the Phase 35D additive migration is present");
}

function verifyPackageScript() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["verify:ledger-reporting-foundation"],
    "node scripts/verify-ledger-reporting-foundation.js",
    "package script is registered",
  );
}

(function main() {
  verifyLedgerRoutes();
  verifyScope();
  verifyPackageScript();
  console.log("verify-ledger-reporting-foundation: ok");
})();
