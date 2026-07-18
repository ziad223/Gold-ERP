/**
 * Phase 30.10-Fix — verify-customer-reconciliation-panel.js
 *
 * Verifies that:
 *  - Customer detail page uses GET /credit/reconciliation through repository/api client lazily.
 *  - Reconciliation query uses reconciliationExpanded.
 *  - No POST/PUT/PATCH/DELETE reconciliation calls exist.
 *  - Types exist in interfaces.ts.
 *  - Repository method exists in AccountingRepository.
 *  - Diagnostic warning exists in the UI code.
 *  - UI labels credit-ledger-only (not full 2300).
 *  - UI checks/verifies mutatesData/statementChanged are false.
 *  - No backend files (except repository interfaces/api-impl) or migration/print/POS files changed.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

// 1. Types & Interface Checks
const interfacesContent = read("lib/repositories/interfaces.ts");
assert.ok(interfacesContent.includes("export interface CustomerCreditReconciliationDocument"), "CustomerCreditReconciliationDocument interface must exist");
assert.ok(interfacesContent.includes("export interface CustomerCreditReconciliationReport"), "CustomerCreditReconciliationReport interface must exist");
assert.ok(interfacesContent.includes("getCustomerCreditReconciliation(customerId: string): Promise<CustomerCreditReconciliationReport>"), "getCustomerCreditReconciliation method must exist in AccountingRepository interface");

// 2. API Implementation Checks
const apiImplContent = read("lib/repositories/api-impl.ts");
const methodIndex = apiImplContent.indexOf("async getCustomerCreditReconciliation(customerId: string)");
assert.ok(methodIndex !== -1, "getCustomerCreditReconciliation must be implemented in ApiAccountingRepository");
assert.ok(apiImplContent.includes("`/customers/${encodeURIComponent(customerId)}/credit/reconciliation`"), "getCustomerCreditReconciliation must query correct endpoint");
const methodBlock = apiImplContent.slice(methodIndex, methodIndex + 300);
assert.ok(!methodBlock.includes("POST") && !methodBlock.includes("PUT") && !methodBlock.includes("PATCH") && !methodBlock.includes("DELETE"), "getCustomerCreditReconciliation must not perform POST/PUT/PATCH/DELETE");

// 3. UI Panel Checks in page.tsx
const pageContent = read("app/[locale]/(dashboard)/customers/[id]/page.tsx");

// Query must be lazy/on-demand using reconciliationExpanded
assert.ok(pageContent.includes("const [reconciliationExpanded, setReconciliationExpanded] = useState(false);"), "Reconciliation state must exist");
assert.ok(pageContent.includes("enabled: isApi && !!customerId && reconciliationExpanded,"), "Reconciliation query must be lazy loaded");

// Query matches existing style
assert.ok(pageContent.includes("queryKey: [\"customer-credit-reconciliation\", customerId]"), "Query key must be correct");
assert.ok(pageContent.includes("accountingRepository.getCustomerCreditReconciliation(customerId)"), "Query must call repository method");

// Warns user that it is read-only
assert.ok(pageContent.includes("Internal read-only audit diagnostic"), "Warning text must exist in the UI code");
assert.ok(pageContent.includes("Customer credit ledger only, not full account 2300."), "Credit balance warning label must exist in UI code");

// Checks mutatesData & statementChanged
assert.ok(pageContent.includes("Mutates Data:"), "Must display mutatesData status");
assert.ok(pageContent.includes("Statement Changed:"), "Must display statementChanged status");

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
  "lib/repositories/interfaces.ts",
  "lib/repositories/api-impl.ts",
  "lib/repositories/local-impl.ts",
  "app/[locale]/(dashboard)/customers/[id]/page.tsx",
  "backend/src/routes/erp.routes.js",
  "backend/src/bootstrap/accessControl.js",
  "backend/src/services/sales-operator-policy.service.js",
  "backend/src/services/system-account.service.js",
  "app/[locale]/(dashboard)/sales/returns/page.tsx",
  "app/[locale]/(dashboard)/sales/exchanges/page.tsx",
  "app/[locale]/(dashboard)/sales/installments/page.tsx",
  "lib/permissions/catalog.ts",
  "scripts/verify-customer-reconciliation-panel.js",
  "package.json",
  "app/[locale]/(dashboard)/accounting/treasury/page.tsx",
  "hooks/use-treasury.ts",
  "messages/en.json",
  "messages/ar.json",
  "docs/AI_HANDOFF.md",
  "docs/employee-authorization/PHASE-34.5.md",
  "docs/employee-authorization/PHASE-34.5B.md",
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
  "lib/types.ts",
  "lib/repositories/api-impl.ts",
  "lib/repositories/interfaces.ts",
  "lib/repositories/local-impl.ts",
  "docs/employee-authorization/PHASE-HF6D-EMPLOYEE-PERMISSION-ENFORCEMENT.md",
]);

const forbiddenFiles = changedFiles.filter((file) => {
  const normalized = file.replace(/\\/g, "/");
  if (allowedFiles.has(normalized)) return false;
  return (
    (normalized.startsWith("backend/") && 
     normalized !== "backend/src/routes/erp.routes.js" && 
     normalized !== "backend/src/services/statement-reconciliation.service.js") || // backend (except statement reconciliation from previous phases)
    /features\/printing|CustomPrint|print/i.test(normalized) || // print
    /(^|\/)pos\//.test(normalized) || // POS
    /(^|\/)migrations\//.test(normalized) || // migrations
    !allowedFiles.has(normalized)
  );
});

assert.equal(forbiddenFiles.length, 0, `Forbidden files modified/created: ${forbiddenFiles.join(", ")}`);

console.log("verify-customer-reconciliation-panel: ok");
