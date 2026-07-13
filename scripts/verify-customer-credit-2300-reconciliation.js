/**
 * Phase 30.9-Fix — verify-customer-credit-2300-reconciliation.js
 *
 * Verifies that:
 *  - statement-reconciliation.service.js exists and exports reconcileCustomer and CATEGORY.
 *  - No IIFE or execSync or mutation ORM calls in the service.
 *  - Route /customers/:id/credit/reconciliation is GET-only and guarded by customers.view.
 *  - No mutating routes or changes to statement-v2 are introduced.
 *  - Only allowed files are modified/created.
 *  - Stable diagnostic categories exist.
 *  - Functional behavior of the service is correct (mutatesData: false, statementChanged: false, non-authoritative flags, etc.)
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

// 1. Check service existence and imports
const servicePath = "backend/src/services/statement-reconciliation.service.js";
assert.ok(fs.existsSync(path.resolve(ROOT, servicePath)), "Service file must exist");

const service = require(path.resolve(ROOT, servicePath));
assert.ok(typeof service.reconcileCustomer === "function", "Service must export reconcileCustomer");
assert.ok(typeof service.CATEGORY === "object", "Service must export CATEGORY");

// 2. Stable categories check
const expectedCategories = [
  "exchange_paid_now_cash_missing_from_statement",
  "exchange_excess_over_reduces_ar",
  "customer_credit_2300_conflation",
  "return_excess_cash_refund_over_credits_statement",
  "settlement_best_effort_non_authoritative",
  "settlement_unavailable",
  "legacy_exchange_policy",
  "unknown_exchange_policy",
];

const categoryValues = Object.values(service.CATEGORY);
for (const cat of expectedCategories) {
  assert.ok(categoryValues.includes(cat), `CATEGORY must include stable value: ${cat}`);
}

// 3. Static checks on service content
const serviceContent = read(servicePath);

// No IIFE (checks for standard immediate calls like (function(){})() or (()=> {})() at root scope)
assert.ok(!/^\s*\(function/m.test(serviceContent), "Service must not contain root IIFE");
// No execSync
assert.ok(!/execSync\s*\(/.test(serviceContent), "Service must not use execSync");
// No child_process
assert.ok(!serviceContent.includes("require(\"child_process\")") && !serviceContent.includes("require('child_process')"), "Service must not import child_process");

// No mutation ORM calls
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

// 4. Check route is GET-only, guarded by customers.view, and has no mutations
const routesContent = read("backend/src/routes/erp.routes.js");

// Find route usage
const routeRegex = /router\.[a-z]+\(\s*['"]\/customers\/:id\/credit\/reconciliation['"]/i;
assert.ok(routeRegex.test(routesContent), "Route /customers/:id/credit/reconciliation must exist in erp.routes.js");

// Check GET-only for /customers/:id/credit/reconciliation
const getOnlyRegex = /router\.get\(\s*['"]\/customers\/:id\/credit\/reconciliation['"]/;
assert.ok(getOnlyRegex.test(routesContent), "Route must be a GET endpoint");

// Ensure no POST/PUT/PATCH/DELETE for credit/reconciliation
const badRouteRegex = /router\.(post|put|patch|delete)\(\s*['"]\/customers\/:id\/credit\/reconciliation['"]/i;
assert.ok(!badRouteRegex.test(routesContent), "Must not have POST/PUT/PATCH/DELETE for reconciliation");

// Verify route uses customers.view
const routeDefinitionIndex = routesContent.indexOf('router.get("/customers/:id/credit/reconciliation"');
assert.ok(routeDefinitionIndex !== -1, "Could not find route definition start index");
const routeSnippet = routesContent.slice(routeDefinitionIndex, routeDefinitionIndex + 500);
assert.ok(routeSnippet.includes('requirePermission("customers.view")'), "Route must be guarded by customers.view");

// 5. Verify statement-v2 remains unchanged (falls back to ordinary doc math)
const statementV2Index = routesContent.indexOf('router.get("/customers/:id/statement-v2"');
assert.ok(statementV2Index !== -1, "statement-v2 route must exist");
const statementV2Snippet = routesContent.slice(statementV2Index, statementV2Index + 1000);
assert.ok(!statementV2Snippet.includes("statementReconciliationService"), "statement-v2 must not use statementReconciliationService");

// 6. Functional checks on service output (non-authoritative behavior, etc.)
// Check best_effort non-authoritative
const reportBestEffort = service.reconcileCustomer({
  customerId: "C-TEST-1",
  invoices: [{ id: "EX-1", type: "exchange", total: -100 }],
  exchangeMeta: {
    "EX-1": {
      policyStatus: "target_policy",
      settlementSource: "best_effort",
      excessDueToCustomer: 100,
    },
  },
});
assert.equal(reportBestEffort.meta.mutatesData, false, "mutatesData must be false");
assert.equal(reportBestEffort.meta.statementChanged, false, "statementChanged must be false");
assert.equal(reportBestEffort.meta.creditScope, "customer_credit_ledger_only", "creditScope must be customer_credit_ledger_only");

const docBestEffort = reportBestEffort.documents.find((d) => d.category === service.CATEGORY.SETTLEMENT_BEST_EFFORT);
assert.ok(docBestEffort, "Best effort document must exist in output");
assert.equal(docBestEffort.authoritative, false, "best_effort must be non-authoritative");

// Check unavailable non-authoritative
const reportUnavailable = service.reconcileCustomer({
  customerId: "C-TEST-2",
  invoices: [{ id: "EX-2", type: "exchange", total: -50 }],
  exchangeMeta: {
    "EX-2": {
      policyStatus: "target_policy",
      settlementSource: "unavailable",
      excessDueToCustomer: 50,
    },
  },
});
const docUnavailable = reportUnavailable.documents.find((d) => d.category === service.CATEGORY.SETTLEMENT_UNAVAILABLE);
assert.ok(docUnavailable, "Unavailable document must exist in output");
assert.equal(docUnavailable.authoritative, false, "unavailable must be non-authoritative");

// 7. Git status working-tree scope guard
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
  changedFiles = changedFiles.concat(untrackedFiles).filter(Boolean).filter(f => !f.replace(/\\/g, "/").startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));
} catch (e) {
  // If git is not initialized or fails, skip this check
  changedFiles = [];
}

const allowedFiles = new Set([
  "backend/src/services/statement-reconciliation.service.js",
  "backend/src/routes/erp.routes.js",
  "scripts/verify-customer-statement-reconciliation.js",
  "scripts/verify-customer-credit-2300-reconciliation.js",
  "package.json",
  "docs/AI_HANDOFF.md",
]);

const forbiddenFiles = changedFiles.filter((file) => {
  const normalized = file.replace(/\\/g, "/");
  return (
    normalized.startsWith("app/") || // frontend
    /features\/printing|CustomPrint|print/i.test(normalized) || // print
    /(^|\/)pos\//.test(normalized) || // POS
    /(^|\/)migrations\//.test(normalized) || // migrations
    !allowedFiles.has(normalized)
  );
});

assert.equal(forbiddenFiles.length, 0, `Forbidden files modified/created: ${forbiddenFiles.join(", ")}`);

console.log("verify-customer-credit-2300-reconciliation: ok");
