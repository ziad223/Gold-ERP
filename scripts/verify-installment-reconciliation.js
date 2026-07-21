/**
 * Phase 24.1-Fix — verify the installment reconciliation dry-run report.
 *
 * Static checks only: no DB, no HTTP requests, no live mutations.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const rootScriptPath = path.resolve(ROOT, "scripts", "reconcile-installment-balances.js");
const scriptPath = path.resolve(ROOT, "backend", "scripts", "reconcile-installment-balances.js");
const verifierPath = path.resolve(ROOT, "scripts", "verify-installment-reconciliation.js");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

function assertIncludes(src, needle, message) {
  assert.ok(src.includes(needle), message);
}

function assertNotMatches(src, regex, message) {
  assert.ok(!regex.test(src), message);
}

function scriptShape() {
  assert.ok(!fs.existsSync(rootScriptPath), "old root reconciliation script no longer exists");
  assert.ok(fs.existsSync(scriptPath), "reconciliation script exists");
  const src = fs.readFileSync(scriptPath, "utf8");

  assertIncludes(src, 'path.resolve(__dirname, "../.env")', "backend script loads backend/.env explicitly");
  assertIncludes(src, 'require("../src/models")', "backend script imports backend models by relative path");
  assertIncludes(src, 'mode: "dry-run"', "script reports dry-run mode");
  assertIncludes(src, "This script is dry-run only and never writes data.", "forbidden flags fail clearly");
  for (const flag of ["--apply", "--write", "--fix", "--update", "--confirm"]) {
    assertIncludes(src, flag, `${flag} is rejected`);
  }
  for (const flag of ["--company-id", "--invoice-id", "--customer-id", "--limit", "--json"]) {
    assertIncludes(src, flag, `${flag} is supported`);
  }

  assertNotMatches(src, /\.(update|destroy|create|bulkCreate|save|increment|decrement)\s*\(/, "script contains no ORM write methods");
  assertNotMatches(src, /queryInterface|sequelize\.query\s*\(\s*["'`](UPDATE|DELETE|INSERT)|TRUNCATE|DROP TABLE|ALTER TABLE/i, "script contains no destructive SQL path");
  assertNotMatches(src, /vat_rate|vatRate/i, "script does not require vat_rate/vatRate");

  for (const model of ["Invoice", "Payment", "Installment", "Customer"]) {
    assertIncludes(src, model, `${model} is read`);
  }
  assertIncludes(src, "INVOICE_ATTRIBUTES", "script defines explicit invoice attributes");
  assertIncludes(src, "PAYMENT_ATTRIBUTES", "script defines explicit payment attributes");
  assertIncludes(src, "INSTALLMENT_ATTRIBUTES", "script defines explicit installment attributes");
  assertIncludes(src, "CUSTOMER_ATTRIBUTES", "script defines explicit customer attributes");
  assertIncludes(src, "options.attributes = INVOICE_ATTRIBUTES", "candidate invoice query uses explicit attributes");
  assertIncludes(src, "attributes: RELATED_INVOICE_ATTRIBUTES", "related return/exchange query uses explicit attributes");
  assertIncludes(src, "attributes: PAYMENT_ATTRIBUTES", "payment query uses explicit attributes");
  assertIncludes(src, "attributes: INSTALLMENT_ATTRIBUTES", "installment query uses explicit attributes");
  assertIncludes(src, "attributes: CUSTOMER_ATTRIBUTES", "customer query uses explicit attributes");
  assertIncludes(src, "findAll", "script uses read queries");
  assertIncludes(src, "findOne", "script uses read lookup");
  assertIncludes(src, "expectedPaidAmount", "script computes expected paid amount");
  assertIncludes(src, "expectedRemainingAmount", "script computes expected remaining amount");
  assertIncludes(src, "paidAmountDelta", "script reports paidAmount delta");
  assertIncludes(src, "remainingAmountDelta", "script reports remainingAmount delta");
  assertIncludes(src, "customerBalanceDelta", "script reports customer balance delta");
  assertIncludes(src, "relatedInvoiceId", "script checks linked return/exchange records");
  assertIncludes(src, '"return"', "script knows return invoices are risky");
  assertIncludes(src, '"exchange"', "script knows exchange invoices are risky");
  assertIncludes(src, "suspicious_overpayment", "script skips overpayments");

  for (const field of [
    "candidateCount",
    "driftedInvoiceCount",
    "skippedRiskyCount",
    "skippedReasonCounts",
    "totalPaidAmountDelta",
    "totalRemainingAmountDelta",
    "totalCustomerBalanceDelta",
    "driftedInvoices",
    "customerDeltas",
    "warnings",
  ]) {
    assertIncludes(src, field, `output includes ${field}`);
  }

  assertIncludes(src, "sequelize.close", "script closes the DB connection");
}

function packageScripts() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["reconcile:installment-balances"],
    "node backend/scripts/reconcile-installment-balances.js",
    "reconcile package script is registered",
  );
  assert.equal(
    pkg.scripts["verify:installment-reconciliation"],
    "node scripts/verify-installment-reconciliation.js",
    "verify package script is registered",
  );
}

function scopeGuard() {
  const statusLines = execFileSync("git", ["status", "--short", "--untracked-files=all"], {
    cwd: ROOT,
    encoding: "utf8",
  }).split(/\r?\n/).filter(Boolean);
  const changed = statusLines.map((line) => line.slice(3).trim().replace(/\\/g, "/"))
    .filter((file) => {
      if (file.startsWith("backend/seeders/client-demo/transactional/") || file.startsWith("scripts/verify-")) return false;
      const diff = execFileSync("git", ["diff", "--no-ext-diff", "HEAD", "--", file], { cwd: ROOT, encoding: "utf8" });
      const semanticLines = diff.replace(/\r\n/g, "\n").split("\n").filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---)/.test(line));
      const approvedNextDevDrift = file === "next-env.d.ts" && semanticLines.length === 2 && semanticLines[0] === '-import "./.next/types/routes.d.ts";' && semanticLines[1] === '+import "./.next/dev/types/routes.d.ts";';
      return !approvedNextDevDrift && diff.trim() !== "";
    });
  const allowed = new Set([
    "backend/scripts/reconcile-installment-balances.js",
    "scripts/reconcile-installment-balances.js",
    "scripts/verify-installment-reconciliation.js",
    "scripts/verify-ledger-reporting-foundation.js",
    "package.json",
    "app/[locale]/(dashboard)/accounting/treasury/page.tsx",
    "hooks/use-treasury.ts",
    "messages/en.json",
    "messages/ar.json",
    "docs/AI_HANDOFF.md",
    "docs/employee-authorization/PHASE-34.5.md",
    "docs/employee-authorization/PHASE-34.5B.md",
    "backend/src/routes/erp.routes.js",
    "backend/src/services/exchange-display.service.js",
    "scripts/verify-exchange-display-api-enrichment.js",
    "backend/src/services/customer-credit.service.js",
    "scripts/verify-customer-credit-ledger.js",
    "scripts/verify-customer-credit-gl-bridge.js",
    "backend/scripts/check-customer-credit-gl-bridge.js",
    "scripts/verify-customer-credit-existing-rows-checker.js",
    "backend/scripts/idempotency-cleanup.js",
    "scripts/verify-secondary-idempotency.js",
    "scripts/verify-manual-customer-deposit.js",
    "scripts/verify-customer-credit-refund.js",
    "scripts/verify-apply-customer-credit.js",
    "scripts/verify-exchange-tax-customer-facing-policy.js",
    "scripts/verify-live-exchange-tax-policy.js",
    "scripts/verify-return-exchange-settlement.js",
    "scripts/verify-return-exchange-settlement-ui.js",
    "app/[locale]/(dashboard)/customers/[id]/page.tsx",
    "backend/src/models/customerCreditTransaction.model.js",
    "backend/src/services/exchange-policy.service.js",
    "lib/exchange-policy.ts",
    "app/[locale]/(dashboard)/sales/page.tsx",
    "components/sales/ExchangeSummary.tsx",
    "features/sales/hooks/use-exchange-display.ts",
    "lib/types.ts",
    "scripts/verify-exchange-summary-ui.js",
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
    "app/[locale]/(dashboard)/sales/returns/page.tsx",
    "app/[locale]/(dashboard)/sales/exchanges/page.tsx",
    "app/[locale]/(dashboard)/sales/installments/page.tsx",
    "backend/src/bootstrap/accessControl.js",
    "backend/src/services/sales-operator-policy.service.js",
    "backend/src/services/system-account.service.js",
    "lib/permissions/catalog.ts",
    "scripts/verify-sales-adjustment-operator-enforcement.js",
    "scripts/verify-sales-pos-operator-enforcement.js",
    "scripts/verify-super-admin-branch-shell-recovery.js",
    "scripts/verify-installment-balance-writeback.js",
  ]);

  for (const file of changed) {
    assert.ok(allowed.has(file), `unexpected changed file: ${file}`);
  }
  assert.ok(!changed.includes("backend/src/services/posting.service.js"), "no posting service changes");
  assert.ok(!changed.some((file) => !file.replace(/\\/g, "/").startsWith("scripts/verify-") && /features\/printing|CustomPrint|print/i.test(file)), "no print files touched");

  const routes = read("backend/src/routes/erp.routes.js");
  assert.ok(routes.includes("postReturnEntry"), "return settlement route remains present");
  assert.ok(routes.includes("receivableIncreaseAmount"), "exchange settlement route remains present");
  assert.ok(routes.includes("receivableReliefAmount"), "receivable-first settlement remains present");
}

function syntaxGuard() {
  execFileSync(process.execPath, ["-c", scriptPath], { stdio: "pipe" });
  execFileSync(process.execPath, ["-c", verifierPath], { stdio: "pipe" });
}

(function main() {
  scriptShape();
  packageScripts();
  scopeGuard();
  syntaxGuard();
  console.log("verify-installment-reconciliation: ok");
})();
