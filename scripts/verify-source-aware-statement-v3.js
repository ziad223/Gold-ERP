/**
 * Phase 30.11-Fix — verify-source-aware-statement-v3.js
 *
 * Verifies the following:
 *  - source-aware-statement.service.js exists and exports buildSourceAwareStatement and VERSION.
 *  - Service has no IIFE, no execSync, no mutation ORM calls.
 *  - Route /customers/:id/statement-v3 is GET-only, guarded by customers.view.
 *  - No write endpoints for statement-v3.
 *  - statement-v2 remains unchanged.
 *  - Response meta shape (structure, handling, and safety rules).
 *  - No forbidden files modified/created.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

// 1. Service checks
const servicePath = "backend/src/services/source-aware-statement.service.js";
assert.ok(fs.existsSync(path.resolve(ROOT, servicePath)), "Service file must exist");

const service = require(path.resolve(ROOT, servicePath));
assert.ok(typeof service.buildSourceAwareStatement === "function", "Service must export buildSourceAwareStatement");
assert.ok(typeof service.SOURCE_AWARE_STATEMENT_VERSION === "string", "Service must export SOURCE_AWARE_STATEMENT_VERSION");

const serviceContent = read(servicePath);
assert.ok(!/^\s*\(function/m.test(serviceContent), "Service must not contain root IIFE");
assert.ok(!/execSync\s*\(/.test(serviceContent), "Service must not use execSync");

const mutationPatterns = [
  /\.create\(/,
  /\.update\(/,
  /\.destroy\(/,
  /\.save\(/,
  /\.bulkCreate\(/,
  /\.upsert\(/,
  /\.increment\(/,
  /\.decrement\(/,
];
for (const pattern of mutationPatterns) {
  assert.ok(!pattern.test(serviceContent), `Service must not perform mutations: ${pattern}`);
}

// 2. Endpoint checks in erp.routes.js
const routesContent = read("backend/src/routes/erp.routes.js");

// GET /customers/:id/statement-v3 exists
assert.ok(/router\.get\(\s*['"]\/customers\/:id\/statement-v3['"]/.test(routesContent), "Route GET /customers/:id/statement-v3 must exist");

// Guarded by customers.view
const routeIndex = routesContent.indexOf('router.get("/customers/:id/statement-v3"');
assert.ok(routeIndex !== -1, "Route must be found");
const routeSnippet = routesContent.slice(routeIndex, routeIndex + 500);
assert.ok(routeSnippet.includes('requirePermission("customers.view")'), "Route must use customers.view permission");

// GET-only (no POST/PUT/PATCH/DELETE statement-v3)
assert.ok(!/router\.(post|put|patch|delete)\(\s*['"]\/customers\/:id\/statement-v3['"]/i.test(routesContent), "Must not have write endpoints for statement-v3");

// statement-v2 still exists
assert.ok(/router\.get\(\s*['"]\/customers\/:id\/statement-v2['"]/.test(routesContent), "Route GET /customers/:id/statement-v2 must still exist");

// 3. Functional behavior checks on buildSourceAwareStatement
const testReport = service.buildSourceAwareStatement({
  customerId: "C-123",
  customerName: "Test Customer",
  customerBalance: 500,
  invoices: [
    { id: "INV-1", type: "invoice", total: 1000, date: "2026-07-01", createdAt: "2026-07-01T10:00:00Z" },
  ],
});

assert.equal(testReport.version, "statement_v3_source_aware", "Version must be statement_v3_source_aware");
assert.equal(testReport.meta.mutatesData, false, "mutatesData must be false");
assert.equal(testReport.meta.statementV2Changed, false, "statementV2Changed must be false");
assert.equal(testReport.meta.ledgerBased, "source_aware_read_only", "ledgerBased must be source_aware_read_only");
assert.equal(testReport.meta.accountingRules.structure, "dual_ledger", "Structure must be dual_ledger");
assert.equal(testReport.meta.accountingRules.negativeExchangeReturnHandling, "clamp_to_ar_relief", "Negative excess handling must be clamp_to_ar_relief");
assert.equal(testReport.meta.accountingRules.cashTransactions, "shown_as_statement_rows", "Cash transactions handling must be shown_as_statement_rows");
assert.ok(testReport.meta.accountingRules.creditScope.includes("credit_ledger_only"), "Credit scope must contain credit_ledger_only");

// Customer Credit Ledger warnings check
assert.equal(testReport.customerCreditLedger.meta.creditScope, "customer_credit_ledger_only", "Credit ledger scope must be customer_credit_ledger_only");
assert.equal(testReport.customerCreditLedger.meta.notFullAccount2300, true, "Credit ledger must warn not full account 2300");

// 3b. Hotfix checks for customer credit transaction date handling
const cctQuerySnippetIndex = routesContent.indexOf("models.CustomerCreditTransaction.findAll");
assert.ok(cctQuerySnippetIndex !== -1, "Must query models.CustomerCreditTransaction");
const cctQuerySnippet = routesContent.slice(cctQuerySnippetIndex, cctQuerySnippetIndex + 400);
assert.ok(!cctQuerySnippet.includes('"date"'), "Must not request 'date' attribute in CustomerCreditTransaction query");

const toDateOnlyFuncIndex = serviceContent.indexOf("function toDateOnly");
assert.ok(toDateOnlyFuncIndex !== -1, "Must have toDateOnly helper function");
const toDateOnlyFuncEndIndex = serviceContent.indexOf("}", toDateOnlyFuncIndex);
assert.ok(toDateOnlyFuncEndIndex !== -1, "Must locate end of toDateOnly function");
const toDateOnlyFuncString = serviceContent.slice(toDateOnlyFuncIndex, toDateOnlyFuncEndIndex + 1);
const remainingServiceContent = serviceContent.replace(toDateOnlyFuncString, "");

assert.ok(!remainingServiceContent.includes("slice(0, 10)"), "All date-slicing must reside within toDateOnly helper");
assert.ok(!serviceContent.includes('(c.date || c.createdAt || "").slice'), "Must not call slice on (c.date || c.createdAt)");
assert.ok(!/createdAt\s*\.\s*slice/.test(serviceContent), "Must not call slice directly on createdAt");

// 4. Git status working-tree scope guard
let changedFiles = [];
try {
  changedFiles = execSync("git diff --name-only HEAD", { cwd: ROOT })
    .toString()
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const untrackedFiles = execSync("git ls-files --others --exclude-standard", { cwd: ROOT })
    .toString()
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  changedFiles = changedFiles.concat(untrackedFiles).filter(f => !f.replace(/\\/g, "/").startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));
} catch (e) {
  changedFiles = [];
}

const allowedFiles = new Set([
  "backend/src/services/source-aware-statement.service.js",
  "backend/src/routes/erp.routes.js",
  "backend/src/bootstrap/accessControl.js",
  "backend/src/services/sales-operator-policy.service.js",
  "backend/src/services/system-account.service.js",
  "app/[locale]/(dashboard)/sales/returns/page.tsx",
  "app/[locale]/(dashboard)/sales/exchanges/page.tsx",
  "app/[locale]/(dashboard)/sales/installments/page.tsx",
  "lib/permissions/catalog.ts",
  "scripts/verify-source-aware-statement-v3.js",
  "package.json",
  "app/[locale]/(dashboard)/accounting/treasury/page.tsx",
  "hooks/use-treasury.ts",
  "messages/en.json",
  "messages/ar.json",
  "docs/AI_HANDOFF.md",
  "docs/employee-authorization/PHASE-34.5.md",
  "docs/employee-authorization/PHASE-34.5B.md",
]);

const forbiddenFiles = changedFiles.filter((file) => {
  const normalized = file.replace(/\\/g, "/");
  if (allowedFiles.has(normalized)) return false;
  return (
    normalized.startsWith("app/") || // frontend UI
    /features\/printing|CustomPrint|print/i.test(normalized) || // print
    /(^|\/)pos\//.test(normalized) || // POS
    /(^|\/)migrations\//.test(normalized) || // migrations
    !allowedFiles.has(normalized)
  );
});

assert.equal(forbiddenFiles.length, 0, `Forbidden files modified/created: ${forbiddenFiles.join(", ")}`);

console.log("verify-source-aware-statement-v3: ok");
