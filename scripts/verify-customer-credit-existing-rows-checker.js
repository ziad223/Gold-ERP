/**
 * Phase 26.1-Fix — verify the customer credit GL bridge dry-run checker.
 *
 * Static checks only: no DB, no HTTP requests, no live mutations.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const checkerPath = path.resolve(ROOT, "backend", "scripts", "check-customer-credit-gl-bridge.js");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

function assertIncludes(src, needle, message) {
  assert.ok(src.includes(needle), message);
}

function assertNotMatches(src, regex, message) {
  assert.ok(!regex.test(src), message);
}

function verifyCheckerShape() {
  assert.ok(fs.existsSync(checkerPath), "checker exists at backend/scripts/check-customer-credit-gl-bridge.js");
  const src = fs.readFileSync(checkerPath, "utf8");

  assertIncludes(src, 'path.resolve(__dirname, "../.env")', "checker loads backend/.env explicitly");
  assertIncludes(src, 'require("../src/models")', "checker imports backend models");
  assertIncludes(src, 'mode: "dry-run"', "checker reports dry-run mode");
  assertIncludes(src, "This checker is dry-run only and never writes data.", "forbidden flags fail clearly");
  for (const flag of ["--apply", "--write", "--fix", "--update", "--backfill", "--confirm"]) {
    assertIncludes(src, flag, `${flag} is rejected`);
  }
  for (const flag of ["--company-id", "--customer-id", "--source-type", "--status", "--limit", "--json"]) {
    assertIncludes(src, flag, `${flag} is supported`);
  }

  assertNotMatches(src, /\.(update|destroy|create|bulkCreate|save|increment|decrement)\s*\(/, "checker contains no ORM write methods");
  assertNotMatches(src, /queryInterface|sequelize\.query\s*\(\s*["'`](UPDATE|DELETE|INSERT)|TRUNCATE|DROP TABLE|ALTER TABLE/i, "checker contains no destructive SQL path");

  for (const model of ["CustomerCreditTransaction", "JournalEntry", "JournalLine", "Account", "Customer"]) {
    assertIncludes(src, model, `${model} is read`);
  }
  for (const attr of ["CREDIT_ATTRIBUTES", "JOURNAL_ENTRY_ATTRIBUTES", "JOURNAL_LINE_ATTRIBUTES", "ACCOUNT_ATTRIBUTES", "CUSTOMER_ATTRIBUTES"]) {
    assertIncludes(src, attr, `${attr} is defined`);
  }
  assertIncludes(src, "attributes: CREDIT_ATTRIBUTES", "credit query uses explicit attributes");
  assertIncludes(src, "attributes: JOURNAL_ENTRY_ATTRIBUTES", "journal entry query uses explicit attributes");
  assertIncludes(src, "attributes: JOURNAL_LINE_ATTRIBUTES", "journal line query uses explicit attributes");
  assertIncludes(src, "attributes: ACCOUNT_ATTRIBUTES", "account query uses explicit attributes");
  assertIncludes(src, "attributes: CUSTOMER_ATTRIBUTES", "customer query uses explicit attributes");
  assertIncludes(src, "journalEntryId", "checker checks journalEntryId");
  assertIncludes(src, 'ACCOUNT_2300 = "2300"', "checker defines account 2300");
  assertIncludes(src, 'row.direction === "credit_in" ? "credit" : "debit"', "credit_in expects Cr 2300 and credit_out expects Dr 2300");
  assertIncludes(src, "account_2300_missing", "checker detects missing 2300 line");
  assertIncludes(src, "account_2300_wrong_side", "checker detects wrong 2300 side");
  assertIncludes(src, "amount_mismatch", "checker detects amount mismatch");
  assertIncludes(src, "journal_unbalanced", "checker detects unbalanced journal");
  assertIncludes(src, "Needs GL Bridge Review", "checker classifies missing journalEntryId");
  assertIncludes(src, "Broken Link", "checker classifies broken journal links");
  assertIncludes(src, "Invalid Journal", "checker classifies invalid journals");
  assertIncludes(src, "Ignored / Not Eligible", "checker classifies ignored rows");
  assertIncludes(src, "GL 2300 can include non-CustomerCreditTransaction sources.", "checker warns about other 2300 subledgers");
  assertIncludes(src, "validates only CustomerCreditTransaction rows that reference journal entries", "checker avoids all-2300 equality claim");
  assertIncludes(src, "sequelize.close", "checker closes DB connection");
}

function verifyPackageScripts() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["check:customer-credit-gl-bridge"],
    "node backend/scripts/check-customer-credit-gl-bridge.js",
    "check package script is registered",
  );
  assert.equal(
    pkg.scripts["verify:customer-credit-existing-rows-checker"],
    "node scripts/verify-customer-credit-existing-rows-checker.js",
    "verify package script is registered",
  );
}

function verifyBackendScriptEnvLoading() {
  const backendScriptPaths = [
    "backend/scripts/check-customer-credit-gl-bridge.js",
    "backend/scripts/reconcile-installment-balances.js",
    "backend/scripts/idempotency-cleanup.js",
  ];
  for (const rel of backendScriptPaths) {
    const src = read(rel);
    assertIncludes(src, 'const path = require("path");', `${rel} imports path`);
    assertIncludes(src, 'path.resolve(__dirname, "../.env")', `${rel} loads backend/.env by script path`);
    assert.ok(
      src.indexOf('path.resolve(__dirname, "../.env")') < src.indexOf('= require("../src/models")'),
      `${rel} loads backend/.env before backend models`,
    );
  }
}

function verifyScope() {
  const changed = execFileSync("git", ["status", "--short", "--untracked-files=all"], {
    cwd: ROOT,
    encoding: "utf8",
  }).split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim())
    .filter(f => !f.replace(/\\/g, "/").startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));
  const allowed = new Set([
    "backend/scripts/check-customer-credit-gl-bridge.js",
    "backend/scripts/reconcile-installment-balances.js",
    "backend/scripts/idempotency-cleanup.js",
    "scripts/verify-customer-credit-existing-rows-checker.js",
    "scripts/verify-installment-reconciliation.js",
    "scripts/verify-secondary-idempotency.js",
    "scripts/verify-customer-credit-gl-bridge.js",
    "scripts/verify-customer-credit-ledger.js",
    "scripts/verify-installment-reconciliation.js",
    "scripts/verify-ledger-reporting-foundation.js",
    "scripts/verify-manual-customer-deposit.js",
    "scripts/verify-customer-credit-refund.js",
    "scripts/verify-apply-customer-credit.js",
    "scripts/verify-exchange-tax-customer-facing-policy.js",
    "scripts/verify-live-exchange-tax-policy.js",
    "scripts/verify-return-exchange-settlement.js",
    "scripts/verify-return-exchange-settlement-ui.js",
    "app/[locale]/(dashboard)/customers/[id]/page.tsx",
    "backend/src/routes/erp.routes.js",
    "backend/src/bootstrap/accessControl.js",
    "backend/src/services/sales-operator-policy.service.js",
    "backend/src/services/system-account.service.js",
    "backend/src/services/exchange-display.service.js",
    "scripts/verify-exchange-display-api-enrichment.js",
    "backend/src/models/customerCreditTransaction.model.js",
    "backend/src/services/exchange-policy.service.js",
    "lib/exchange-policy.ts",
    "package.json",
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

  const routes = read("backend/src/routes/erp.routes.js");
  assert.ok(routes.includes('router.post("/customers/:id/credit/deposit"'), "manual deposit endpoint may exist");
  assert.ok(routes.includes('router.post("/customers/:id/credit/refund"'), "manual refund endpoint may exist");
  assert.ok(routes.includes('router.post("/invoices/:id/apply-customer-credit"'), "invoice apply-credit endpoint may exist");
  assert.ok(!/router\.(post|put|patch|delete)\([^)]*credit\/adjust/.test(routes), "no credit adjustment route");
  assert.ok(routes.includes("postReturnEntry"), "return behavior remains present");
  assert.ok(routes.includes('sourceType: "exchange"'), "exchange behavior remains present");

  assert.ok(!changed.some((file) => /backend\/migrations|migrations\//.test(file)), "no migration added");
  assert.ok(!changed.some((file) => !file.replace(/\\/g, "/").startsWith("scripts/verify-") && /features\/printing|CustomPrint|print/i.test(file)), "no print files touched");
  assert.ok(!changed.some((file) => /features\/dashboard|app\/\[locale\]\/\(dashboard\)\/dashboard/.test(file)), "dashboard not rewritten");
}

function syntaxGuard() {
  execFileSync(process.execPath, ["-c", checkerPath], { stdio: "pipe" });
  execFileSync(process.execPath, ["-c", path.resolve(ROOT, "scripts", "verify-customer-credit-existing-rows-checker.js")], { stdio: "pipe" });
}

function main() {
  verifyCheckerShape();
  verifyBackendScriptEnvLoading();
  verifyPackageScripts();
  verifyScope();
  syntaxGuard();
  console.log("verify-customer-credit-existing-rows-checker: ok");
}

main();
