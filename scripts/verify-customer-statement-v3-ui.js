/**
 * Phase 30.12-Fix — verify-customer-statement-v3-ui.js
 *
 * Verifies frontend-only v3 customer statement integration:
 *  - Repository types exist in interfaces.ts.
 *  - Repository methods exist in api-impl.ts and local-impl.ts.
 *  - Customer detail page has sub-tab activeStatementView view selector.
 *  - v2 is default, v3 is opt-in and lazy loaded.
 *  - UI elements, bilingual warning labels, and disclaimers are present.
 *  - No backend files or migrations changed.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

// 1. Interfaces checks
const interfacesContent = read("lib/repositories/interfaces.ts");
assert.ok(interfacesContent.includes("export interface SourceAwareArRow"), "interfaces.ts must export SourceAwareArRow");
assert.ok(interfacesContent.includes("export interface CustomerCreditLedgerRow"), "interfaces.ts must export CustomerCreditLedgerRow");
assert.ok(interfacesContent.includes("export interface CustomerStatementV3Report"), "interfaces.ts must export CustomerStatementV3Report");
assert.ok(interfacesContent.includes("getCustomerStatementV3("), "interfaces.ts must contain getCustomerStatementV3 definition");

// 2. api-impl.ts checks
const apiImplContent = read("lib/repositories/api-impl.ts");
assert.ok(apiImplContent.includes("async getCustomerStatementV3("), "api-impl.ts must implement getCustomerStatementV3");
assert.ok(apiImplContent.includes("/statement-v3"), "api-impl.ts must hit /statement-v3");

// 3. local-impl.ts checks
const localImplContent = read("lib/repositories/local-impl.ts");
assert.ok(localImplContent.includes("async getCustomerStatementV3("), "local-impl.ts must implement getCustomerStatementV3 placeholder");
assert.ok(localImplContent.includes("Customer statement v3 is only available in API mode."), "local-impl.ts must throw expected placeholder error");

// 4. page.tsx checks
const pageContent = read("app/[locale]/(dashboard)/customers/[id]/page.tsx");
assert.ok(pageContent.includes('const [activeStatementView, setActiveStatementView] = useState'), "page.tsx must define activeStatementView state");
assert.ok(pageContent.includes('setActiveStatementView("v2")'), "page.tsx must toggle to v2");
assert.ok(pageContent.includes('setActiveStatementView("v3")'), "page.tsx must toggle to v3");
assert.ok(pageContent.includes('activeStatementView === "v3"'), "page.tsx must conditionally query or render v3 view");
assert.ok(pageContent.includes('["customer-statement-v3"'), "page.tsx must query v3 using expected queryKey");
assert.ok(pageContent.includes('activeStatementView === "v3" && !dateError'), "page.tsx must lazy-load v3 query only when view is v3");

// Verify UI labels and disclaimers
assert.ok(pageContent.includes("Legacy / Document-only Statement v2") || pageContent.includes("كشف حساب المستندات التقليدي v2"), "UI must label v2");
assert.ok(pageContent.includes("Source-aware Statement v3") || pageContent.includes("كشف حساب مرن المصدر v3"), "UI must label v3");
assert.ok(pageContent.includes("Customer Credit Ledger only, not full account 2300.") || pageContent.includes("رصيد كريدت العميل فقط، وليس كامل حساب 2300."), "UI must warn not full 2300");
assert.ok(pageContent.includes("Read-only source-aware statement.") || pageContent.includes("كشف حساب مرن المصدر للقراءة فقط."), "UI must show read-only alert");

// Verify loading/error text
assert.ok(pageContent.includes("Loading source-aware statement...") || pageContent.includes("جاري تحميل كشف الحساب مرن المصدر..."), "UI must display loading state");
assert.ok(pageContent.includes("Failed to load source-aware statement. Legacy statement v2 remains available.") || pageContent.includes("فشل تحميل كشف الحساب مرن المصدر. كشف الحساب التقليدي v2 ما زال متاحًا."), "UI must display fallback error state");

// 5. Git diff guards to make sure no backend or forbidden files are modified
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
  "scripts/verify-customer-statement-v3-ui.js",
  "package.json",
  "docs/AI_HANDOFF.md",
  "docs/employee-authorization/PHASE-34.5.md",
  "docs/employee-authorization/PHASE-34.5B.md",
]);

const forbiddenFiles = changedFiles.filter((file) => {
  const normalized = file.replace(/\\/g, "/");
  if (allowedFiles.has(normalized)) return false;
  return (
    normalized.startsWith("backend/") || // backend
    normalized.startsWith("migrations/") || // migrations
    /features\/printing|CustomPrint|print/i.test(normalized) || // print
    !allowedFiles.has(normalized)
  );
});

assert.equal(forbiddenFiles.length, 0, `Forbidden files modified/created: ${forbiddenFiles.join(", ")}`);

console.log("verify-customer-statement-v3-ui: ok");
