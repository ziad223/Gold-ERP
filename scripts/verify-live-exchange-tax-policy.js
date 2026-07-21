/**
 * Phase 30.3-Fix — verify live exchange target tax policy.
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

function verifyHelperFormula() {
  const helperSrc = read("backend/src/services/exchange-policy.service.js");
  const helper = require(path.resolve(ROOT, "backend", "src", "services", "exchange-policy.service.js"));
  const preview = helper.computeExchangePolicyPreview({
    originalInvoiceId: "INV-1",
    customerId: "CUS-1",
    currency: "EGP",
    vatRate: 14,
    returnedValue: 500,
    newSubtotal: 400,
    outstandingAR: 20,
    settlement: { creditAmount: 24, cashAccountCode: "1110", bankAccountCode: "1120" },
  });

  assert.equal(preview.newTax, 56, "newTax is computed from new replacement subtotal only");
  assert.equal(preview.newGross, 456, "newGross is newSubtotal + newTax");
  assert.equal(preview.difference, -44, "difference is newGross - returnedValue");
  assert.equal(preview.arRelief, 20, "AR relief is first");
  assert.equal(preview.excessDueToCustomer, 24, "excess due to customer is separated after AR relief");
  assert.equal(preview.taxPolicy.excessTaxable, false, "excess due to customer is not taxable");
  assertIncludes(helperSrc, "newTax = roundMoney(subtotal * (rate / 100))", "helper taxes new subtotal only");
  assertIncludes(helperSrc, "settlementAffectsVat: false", "settlement does not affect VAT");
}

function verifyLiveRoute() {
  const routes = read("backend/src/routes/erp.routes.js");
  const liveRoute = routeBlock(routes, '"/sales/exchanges",');
  const previewRoute = routeBlock(routes, '"/sales/exchanges/preview",');

  assertIncludes(previewRoute, "computeExchangePolicyPreview", "preview helper remains available");
  assertIncludes(liveRoute, "exchangePolicyService.computeExchangePolicyPreview", "live route uses exchange-policy helper");
  assertIncludes(liveRoute, "const newSubtotal = roundVal", "live route computes new replacement subtotal");
  assertIncludes(liveRoute, "const newTax = roundVal(exchangePolicy.newTax)", "live route uses helper newTax");
  assertIncludes(liveRoute, "const newGross = roundVal(exchangePolicy.newGross)", "live route uses helper newGross");
  assertIncludes(liveRoute, "const difference = roundVal(exchangePolicy.difference)", "live route uses helper difference");
  assertIncludes(liveRoute, "const amountDueFromCustomer = roundVal(exchangePolicy.amountDueFromCustomer)", "live route uses amountDueFromCustomer");
  assertIncludes(liveRoute, "const arRelief = roundVal(exchangePolicy.arRelief)", "live route uses arRelief");
  assertIncludes(liveRoute, "const excessDueToCustomer = roundVal(exchangePolicy.excessDueToCustomer)", "live route uses excessDueToCustomer");
  assertIncludes(liveRoute, "const refundExcess = excessDueToCustomer", "settlement validates against excessDueToCustomer");
  assertIncludes(liveRoute, "receivableReliefAmount = arRelief", "negative difference uses AR relief from helper");
  assertIncludes(liveRoute, "cashRefundAmount = excessDueToCustomer", "negative difference uses untaxed excess");
  assertIncludes(liveRoute, "cashInAmount = amountDueFromCustomer", "positive paid_now uses amountDueFromCustomer");
  assertIncludes(liveRoute, "receivableIncreaseAmount = amountDueFromCustomer", "positive credit uses amountDueFromCustomer");
  assertIncludes(liveRoute, 'tax: newTax', "exchange invoice tax uses newTax");
  assertIncludes(liveRoute, 'total: difference', "exchange invoice total uses target-policy difference");
  assertIncludes(liveRoute, 'lines.push({ accountCode: "2200", debit: 0, credit: newTax', "VAT journal credits newTax only");

  assertNotMatches(liveRoute, /diffTax\s*=\s*roundVal\(\s*diffBase\s*\*/, "live route does not calculate VAT from net difference");
  assertNotMatches(liveRoute, /diffTotal\s*=\s*roundVal\(\s*diffBase\s*\+\s*diffTax\s*\)/, "live route does not derive total from net-difference VAT");
  assertNotMatches(liveRoute, /Math\.abs\(diffTax\)/, "live route no longer posts negative VAT reversal from diffTax");
  assertNotMatches(liveRoute, /postCashEntry\s*\(/, "live exchange does not call postCashEntry");

  const postEntryCount = (liveRoute.match(/postingService\.postEntry\s*\(/g) || []).length;
  assert.equal(postEntryCount, 1, "live exchange creates one journal entry");

  const creditStart = liveRoute.indexOf('sourceType: "exchange_credit"');
  assert.ok(creditStart >= 0, "exchange_credit block exists");
  const creditBlock = liveRoute.slice(creditStart, liveRoute.indexOf("});", creditStart) + 3);
  assertIncludes(creditBlock, "journalEntryId: journalEntry ? journalEntry.id : null", "exchange_credit uses explicit journalEntryId");
  assertNotMatches(creditBlock, /glPosting/, "exchange_credit does not use glPosting");
  assertIncludes(liveRoute, 'accountCode: "2300"', "exchange credit settlement posts 2300 in the single journal");

  assertIncludes(liveRoute, 'const idemScope = "sales.exchange"', "sales.exchange idempotency scope retained");
  assertIncludes(liveRoute, "idempotencyBodyWithActor(req, body, commandActor)", "whole-body idempotency hash includes operator actor consistency");
}

function verifyScope() {
  const changed = execFileSync("git", ["status", "--short", "--untracked-files=all"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"))
    .filter((file) => {
      if (file.startsWith("backend/seeders/client-demo/transactional/") || file.startsWith("scripts/verify-")) return false;
      const diff = execFileSync("git", ["diff", "--no-ext-diff", "HEAD", "--", file], { cwd: ROOT, encoding: "utf8" });
      const semanticLines = diff.replace(/\r\n/g, "\n").split("\n").filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---)/.test(line));
      const approvedNextDevDrift = file === "next-env.d.ts" && semanticLines.length === 2 && semanticLines[0] === '-import "./.next/types/routes.d.ts";' && semanticLines[1] === '+import "./.next/dev/types/routes.d.ts";';
      return !approvedNextDevDrift && diff.trim() !== "";
    });

  const allowed = new Set([
    "backend/src/routes/erp.routes.js",
    "backend/src/bootstrap/accessControl.js",
    "backend/src/services/sales-operator-policy.service.js",
    "backend/src/services/system-account.service.js",
    "backend/src/services/exchange-display.service.js",
    "scripts/verify-exchange-display-api-enrichment.js",
    "scripts/verify-live-exchange-tax-policy.js",
    "scripts/verify-exchange-tax-customer-facing-policy.js",
    "scripts/verify-return-exchange-settlement.js",
    "scripts/verify-return-exchange-settlement-ui.js",
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

  for (const file of changed) {
    assert.ok(allowed.has(file), `unexpected changed file: ${file}`);
  }
  assert.ok(!changed.some((file) => !file.replace(/\\/g, "/").startsWith("scripts/verify-") && /features\/printing|CustomPrint|invoice-print-view-model|print/i.test(file)), "no print files touched");
  assert.ok(!changed.some((file) => /(^|\/)pos\//.test(file)), "no POS files touched");
  assert.ok(!changed.some((file) => /(^|\/)migrations?\//.test(file)), "no migration added");
  // Phase 34.5B Core intentionally adjusts return/exchange UI operator gating
  // without changing the live exchange tax policy verified here.
}

function verifyPackageScript() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["verify:live-exchange-tax-policy"],
    "node scripts/verify-live-exchange-tax-policy.js",
    "package script registered",
  );
}

function syntaxGuard() {
  for (const file of [
    "backend/src/routes/erp.routes.js",
    "backend/src/services/exchange-policy.service.js",
    "scripts/verify-live-exchange-tax-policy.js",
  ]) {
    execFileSync(process.execPath, ["-c", path.resolve(ROOT, file)], { stdio: "pipe" });
  }
}

function main() {
  verifyHelperFormula();
  verifyLiveRoute();
  verifyScope();
  verifyPackageScript();
  syntaxGuard();
  console.log("verify-live-exchange-tax-policy: ok");
}

main();
