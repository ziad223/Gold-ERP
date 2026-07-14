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
const operatorVerifyDialog = read("components/operator/operator-verify-dialog.tsx");
const operatorStepUpDialog = read("components/operator/operator-step-up-dialog.tsx");
const employeeHooks = read("hooks/use-employees.ts");
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
check(erpRoutes.includes('router.get("/employees/:id"') && erpRoutes.includes("authorizationSummary") && erpRoutes.includes("employeeCredentialState(credential)") && erpRoutes.includes("activeOperatorSessionCount"), "Employee detail API returns backend authorization summary including credential and active-session state");

check(employeeDetail.includes("getOperatorSessions") || employeeDetail.includes("operatorSessions"), "Employee detail uses real operator-session history");
check(!employeeDetail.includes("Local Simulation") && !employeeDetail.includes("محاكاة محلية"), "legacy simulated session UI is removed");
check(!employeeDetail.includes("split(\",\")") && !employeeDetail.includes("comma-separated") && !employeeDetail.includes("One branch ID per line") && !employeeDetail.includes("One role ID per line") && !employeeDetail.includes("One granted permission ID per line"), "Employee authorization inputs no longer use comma-separated or raw line-based ID management");
check(includesAll(employeeDetail, [
  "Operational Access",
  "Branch Access",
  "Role Templates",
  "Direct Permissions",
  "Effective Permissions",
  "Credential & PIN",
  "Verification Attempts",
  "Operational Sessions",
  "Audit / Activity",
  "HR / Payroll / Attendance",
]), "Employee detail exposes the required focused tab architecture");
check(includesAll(employeeDetail, [
  "EmployeeBranchAccessTab",
  "EmployeeRoleTemplatesTab",
  "EmployeeDirectPermissionsTab",
  "EmployeeEffectivePermissionsTab",
  "EmployeeCredentialTab",
  "EmployeeVerificationAttemptsTab",
  "EmployeeOperationalSessionsTab",
  "EmployeeAuditActivityTab",
]), "Employee detail is split into focused management components");
check(employeeDetail.includes("SearchBox") && employeeDetail.includes("Search branch by name or code") && employeeDetail.includes("Search current role templates") && employeeDetail.includes("Search permission name or module"), "Employee detail uses searchable branch, role and grouped permission controls");
check(employeeDetail.includes("A permission cannot be both granted and denied") && employeeDetail.includes("Direct denial wins"), "Direct permission UI blocks grant/denial overlap and explains denial precedence");
check(employeeDetail.includes("permissionState?.authorization?.effectivePermissionNames"), "Employee detail displays backend-resolved effective permissions");
check(employeeDetail.includes("The frontend does not calculate authority") || employeeDetail.includes("backend-resolved result only"), "Effective permissions tab states that backend response is authoritative");
check(!employeeDetail.includes("pinHash") && !employeeDetail.includes("authSessionFingerprint") && !employeeDetail.includes("deviceSessionId"), "Employee detail does not render raw PIN hash, auth fingerprint, or raw device id");
check(employeeDetail.includes("employeeId") && !employeeDetail.includes("JSON.stringify({ userId: id })"), "Employee activity query uses Employee audit identity rather than technical user id");

check(employeeRoutes.includes('/employees/:id/operator-sessions') && employeeRoutes.includes('requirePermission("employees.verification.view")'), "backend exposes read-only operator-session history with employees.verification.view");
check(employeeRoutes.includes("maskedDeviceLabel") && !employeeRoutes.includes("authSessionFingerprint:"), "operator-session history response masks device identity and omits auth fingerprint");
check(employeeRoutes.includes("maskIp") && employeeRoutes.includes("summarizeUserAgent"), "verification attempts mask IP and summarize user-agent");

check(operatorBar.includes("Level 2") && operatorBar.includes("Switch") && operatorBar.includes("Lock") && operatorBar.includes("formatCountdown"), "operator bar supports Level 1/2, switch, lock, and countdown display");
check(operatorBar.includes("clearSensitiveOperatorFormState") && operatorBar.includes("resetOperatorDialogState") && operatorBar.includes("finally") && operatorBar.includes("lockOperator"), "OperatorBar clears PIN in guaranteed paths and resets dialogs on lock");
check(operatorBar.includes("operator.authorizeAction") && operatorBar.includes("resetOperatorDialogState();"), "Level 2 step-up success closes and resets the operator dialog");
check(operatorVerifyDialog.includes("finally") && operatorVerifyDialog.includes("clearSensitiveOperatorFormState") && operatorStepUpDialog.includes("finally") && operatorStepUpDialog.includes("clearSensitiveOperatorFormState"), "standalone operator dialogs clear PIN after every submit outcome");
check(operatorContext.includes("BroadcastChannel") && operatorContext.includes("storage") && operatorContext.includes("operator:branch-changed"), "operator context supports BroadcastChannel, storage fallback, and branch-change refresh");
check(operatorContext.includes("OPERATOR_LIFECYCLE_EVENT") && operatorContext.includes("window.dispatchEvent") && employeeHooks.includes("addEventListener(OPERATOR_LIFECYCLE_EVENT"), "operator lifecycle events invalidate Employee detail session and authorization views");
check(employeeHooks.includes("employee:credential-reset") && employeeHooks.includes("employee:branch-access-updated") && employeeHooks.includes("employee:permissions-updated"), "Employee credential, branch and permission changes trigger session-history invalidation");
check(!operatorContext.includes("pin") && !operatorBar.includes("localStorage.setItem") && !operatorVerifyDialog.includes("localStorage") && !operatorStepUpDialog.includes("localStorage"), "operator cross-tab state does not persist PIN or secrets");

const businessRouteText = erpRoutes;
check(!/requireOperator|requireEmployeePermission|requireStepUp|employee-permission\.middleware|step-up\.middleware/.test(businessRouteText), "business execution routes do not import or wire operator middleware");

check(en.includes('"systemAccounts"') && ar.includes('"systemAccounts"'), "System Accounts localization keys exist in English and Arabic");
check(en.includes("Employee operational permissions") && ar.includes("صلاحيات الموظفين التشغيلية"), "new System Accounts guidance is localized");

check(handoff.includes("Phase 34.3") || handoff.includes("Phase 34.2"), "AI handoff remains readable for Phase 34 context");

console.log("Phase 34.4 employee management/operator UI static contract: PASS");
