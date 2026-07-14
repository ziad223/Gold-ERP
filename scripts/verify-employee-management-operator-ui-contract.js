#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  console.log(`PASS: ${message}`);
}

function includesAll(text, values) {
  return values.every((value) => text.includes(value));
}

const sidebar = read("components/layout/sidebar.tsx");
const authGuard = read("components/auth/auth-guard.tsx");
const apiClient = read("lib/api/client.ts");
const userPage = read("app/[locale]/(dashboard)/settings/users/page.tsx");
const employeeList = read("app/[locale]/(dashboard)/employees/page.tsx");
const employeeDetail = read("app/[locale]/(dashboard)/employees/[id]/page.tsx");
const operatorContext = read("contexts/operator-context.tsx");
const operatorBar = read("components/operator/operator-bar.tsx");
const employeeRoutes = read("backend/src/routes/employee-authorization.routes.js");
const erpRoutes = read("backend/src/routes/erp.routes.js");
const en = read("messages/en.json");
const ar = read("messages/ar.json");
const handoff = read("docs/AI_HANDOFF.md");

console.log("Phase 34.4 employee management/operator UI static contract");

check(userPage.includes("System Accounts") && userPage.includes("technical login accounts"), "System Accounts page is reframed as technical login account management");
check(!/accountType|account type|Linked Employee|linked Employee/.test(userPage), "System Accounts page does not infer account type or fake User-to-Employee linkage");
check(userPage.includes("Employee operational") || userPage.includes("صلاحيات الموظفين التشغيلية"), "System Accounts page separates technical roles from Employee operational permissions");
check(sidebar.includes("systemAccounts") && sidebar.includes("/settings/users"), "sidebar keeps /settings/users route and labels System Accounts");

check(authGuard.includes("EMPLOYEE_ROUTE_PERMISSIONS") && includesAll(authGuard, [
  "payroll.view",
  "employees.credentials.manage",
  "employees.permissions.manage",
  "employees.branches.manage",
  "employees.verification.view",
]), "Employee route guard allows the approved ANY-of zero-delta permissions");
check(!read("backend/src/bootstrap/accessControl.js").includes("employees.view"), "permission catalog source does not add employees.view");
check(erpRoutes.includes("employeeCoreManagePermissions") && erpRoutes.includes('router.put("/employees/:id", authMiddleware, requireAnyPermission(employeeCoreManagePermissions)'), "Employee core update route is not authentication-only");

check(apiClient.includes('darfus-device-session-id-v1'), "canonical device session key is used");
check(apiClient.includes('darfus-device-session-v1') && apiClient.includes("LEGACY_DEVICE_SESSION_KEY"), "legacy device key remains only as migration compatibility");
check(apiClient.includes("window.localStorage.setItem(DEVICE_SESSION_KEY, legacy)") && apiClient.includes("window.localStorage.removeItem(LEGACY_DEVICE_SESSION_KEY)"), "valid legacy device id is migrated to canonical storage");
check(apiClient.includes("clearDeviceSessionId") && apiClient.includes("removeItem(DEVICE_SESSION_KEY)") && apiClient.includes("removeItem(LEGACY_DEVICE_SESSION_KEY)"), "logout cleanup clears canonical and legacy device keys");

check(employeeList.includes("pageSize") && employeeList.includes("authorizationSummary") && employeeList.includes("credentialState"), "Employee list consumes server pagination and safe authorization summary fields");
check(!employeeList.includes("pageSize: 100") && !employeeList.includes("? 6 : 0"), "Employee list no longer hard-caps as full dataset or hard-codes active shifts");
check(employeeList.includes("activeOperatorSession") && employeeList.includes("Employee Code"), "Employee list supports operational-session and Employee Code visibility");

check(employeeDetail.includes("getOperatorSessions") || employeeDetail.includes("operatorSessions"), "Employee detail uses real operator-session history");
check(!employeeDetail.includes("Local Simulation") && !employeeDetail.includes("محاكاة محلية"), "legacy simulated session UI is removed");
check(!employeeDetail.includes("split(\",\")") && !employeeDetail.includes("comma-separated"), "Employee authorization inputs no longer use comma-separated ID management");
check(employeeDetail.includes("permissionState?.authorization?.effectivePermissionNames"), "Employee detail displays backend-resolved effective permissions");
check(!employeeDetail.includes("pinHash") && !employeeDetail.includes("authSessionFingerprint") && !employeeDetail.includes("deviceSessionId"), "Employee detail does not render raw PIN hash, auth fingerprint, or raw device id");
check(employeeDetail.includes("employeeId") && !employeeDetail.includes("JSON.stringify({ userId: id })"), "Employee activity query uses Employee audit identity rather than technical user id");

check(employeeRoutes.includes('/employees/:id/operator-sessions') && employeeRoutes.includes('requirePermission("employees.verification.view")'), "backend exposes read-only operator-session history with employees.verification.view");
check(employeeRoutes.includes("maskedDeviceLabel") && !employeeRoutes.includes("authSessionFingerprint:"), "operator-session history response masks device identity and omits auth fingerprint");
check(employeeRoutes.includes("maskIp") && employeeRoutes.includes("summarizeUserAgent"), "verification attempts mask IP and summarize user-agent");

check(operatorBar.includes("Level 2") && operatorBar.includes("Switch") && operatorBar.includes("Lock") && operatorBar.includes("formatCountdown"), "operator bar supports Level 1/2, switch, lock, and countdown display");
check(operatorContext.includes("BroadcastChannel") && operatorContext.includes("storage") && operatorContext.includes("operator:branch-changed"), "operator context supports BroadcastChannel, storage fallback, and branch-change refresh");
check(!operatorContext.includes("pin") && !operatorBar.includes("localStorage.setItem"), "operator cross-tab state does not persist PIN or secrets");

const businessRouteText = erpRoutes;
check(!/requireOperator|requireEmployeePermission|requireStepUp|employee-permission\.middleware|step-up\.middleware/.test(businessRouteText), "business execution routes do not import or wire operator middleware");

check(en.includes('"systemAccounts"') && ar.includes('"systemAccounts"'), "System Accounts localization keys exist in English and Arabic");
check(en.includes("Employee operational permissions") && ar.includes("صلاحيات الموظفين التشغيلية"), "new System Accounts guidance is localized");

check(handoff.includes("Phase 34.3") || handoff.includes("Phase 34.2"), "AI handoff remains readable for Phase 34 context");

console.log("Phase 34.4 employee management/operator UI static contract: PASS");
