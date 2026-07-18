#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function contains(source, text, message) {
  assert.ok(source.includes(text), message);
}

function staticContract() {
  const sessionService = read("backend/src/services/operator-session.service.js");
  const operatorRoutes = read("backend/src/routes/employee-authorization.routes.js");
  const businessGuard = read("backend/src/middleware/business-permission.middleware.js");
  const erpRoutes = read("backend/src/routes/erp.routes.js");
  const salesPolicy = read("backend/src/services/sales-operator-policy.service.js");
  const operatorContext = read("contexts/operator-context.tsx");
  const apiClient = read("lib/api/client.ts");
  const permissionsHook = read("hooks/use-permissions.ts");
  const authGuard = read("components/auth/auth-guard.tsx");
  const dashboardLayout = read("app/[locale]/(dashboard)/layout.tsx");
  const verificationShell = read("components/operator/employee-verification-shell.tsx");
  const verificationForm = read("components/operator/employee-verification-form.tsx");
  const operatorBar = read("components/operator/operator-bar.tsx");
  const sidebar = read("components/layout/sidebar.tsx");
  const moduleAccess = read("lib/permissions/module-access.ts");
  const employeePage = read("app/[locale]/(dashboard)/employees/[id]/page.tsx");
  const packageJson = JSON.parse(read("package.json"));
  const verifierFiles = fs.readdirSync(path.join(ROOT, "scripts")).filter((name) => /^verify-.*\.js$/.test(name));

  contains(sessionService, "authorizationSafe", "operator sessions expose a safe authorization summary");
  contains(sessionService, "resolveEmployeePermissions", "operator sessions resolve Employee permissions on current and verify");
  contains(operatorRoutes, "authorization: result.active ? result.authorization : null", "operator current returns authorization only for a live session");
  contains(operatorContext, "setAuthorization(result.data.authorization ?? null)", "OperatorProvider stores verification authorization");
  contains(operatorContext, "setAuthorization(result.active ? result.authorization ?? null : null)", "OperatorProvider restores authorization on reload");
  contains(permissionsHook, "operator.authorization?.effectivePermissionNames", "Branch Accounts use effective Employee permissions");
  contains(permissionsHook, "accountType === \"branch_shell\"", "technical Branch Account permissions remain separated");
  contains(authGuard, "EmployeeVerificationShell", "AuthGuard renders the Employee verification shell before business content");
  contains(dashboardLayout, "<AppShell>", "AppShell renders outside the page-content guard");
  contains(dashboardLayout, "<AuthGuard>{children}</AuthGuard>", "AuthGuard protects page content without removing the Header");
  contains(verificationShell, 'presentation="inline"', "safe shell renders the shared inline verification form");
  contains(verificationShell, "Select an Employee to Start", "safe shell includes the English first-login title");
  contains(verificationShell, "اختر موظفًا للبدء", "safe shell includes the Arabic first-login title");
  contains(authGuard, "firstAllowedBusinessRoute", "verification routes to the first allowed business screen after the operator state is current");
  contains(authGuard, "shouldRouteVerifiedEmployee", "the dashboard guard waits for the current Employee authorization state before rendering content");
  contains(verificationForm, "data-employee-verification-form", "shared verification form exposes its presentation mode");
  contains(verificationForm, 'pattern="[0-9]{6}"', "shared verification form enforces a six-digit PIN");
  contains(verificationForm, "operator.verify", "shared verification form owns the single verification API path");
  contains(operatorBar, 'presentation="dialog"', "Change Employee opens the shared dialog form");
  contains(operatorBar, "pendingEmployeeId", "Change Employee waits for the replacement authorization before routing");
  assert.ok(!operatorBar.includes("operator.verify("), "OperatorBar does not duplicate the verification API path");
  assert.ok(!fs.existsSync(path.join(ROOT, "components/operator/operator-verify-dialog.tsx")), "legacy duplicate verification dialog is removed");
  assert.ok(!authGuard.includes('router.replace("/pos")'), "no dashboard to POS fallback remains");
  contains(sidebar, "item.branchBusiness", "sidebar filters business modules through the Employee session");
  contains(sidebar, "permissionMatches(item.permission, hasPermission)", "sidebar applies the canonical permission requirement");
  contains(moduleAccess, "ROUTE_PERMISSION_RULES", "route and navigation mapping is centralized");
  contains(apiClient, "requestUsedAuth", "unauthenticated pre-login requests cannot clear a newly-created technical session");
  contains(apiClient, "operatorRecoveryRequired", "an Employee verification requirement cannot clear a valid Branch Account session");
  contains(apiClient, "isOperatorRecoveryError", "API errors expose operator recovery classification to query handling");
  contains(read("app/providers.tsx"), "isOperatorRecoveryError(error)", "query handling preserves the technical session for operator recovery errors");
  contains(moduleAccess, "pos.sell", "POS navigation recognizes the checkout permission");
  contains(businessGuard, "operatorSessionService.currentFromRequest", "Branch Account business APIs require a live Employee session");
  contains(businessGuard, "EMPLOYEE_PERMISSION_DENIED", "business guard returns a stable Employee denial");
  contains(erpRoutes, "EMPLOYEE_BUSINESS_CRUD_RESOURCES", "generic business CRUD routes use the Employee-aware guard");
  contains(erpRoutes, "requireBusinessPermission(\"inventory.adjust\"", "inventory transfer uses the cataloged inventory adjustment permission");
  contains(salesPolicy, 'employeePermission: "pos.sell"', "checkout retains its exact Employee command permission");
  contains(salesPolicy, 'employeePermission: "sales.returns.execute"', "return execution retains exact Employee command permission");
  contains(employeePage, "moduleFilter", "permission UI has a module filter");
  contains(employeePage, "statusFilter", "permission UI has a source/status filter");
  contains(employeePage, "openModules", "permission UI has collapsible module groups");
  contains(employeePage, "Direct denial overrides role and direct grant", "permission UI warns that denial wins");
  contains(employeePage, "منع مباشر", "Arabic direct-denial wording remains visible");
  assert.equal(packageJson.scripts["verify:employee-permission-enforcement"], "node scripts/verify-employee-permission-enforcement.js", "focused verifier is registered");
  assert.equal(verifierFiles.length, 62, `expected 62 verifier files after HF6D, found ${verifierFiles.length}`);
}

if (process.env.NODE_ENV === "production" || process.env.RENDER || process.env.VERCEL) {
  throw new Error("Refusing production/Render verification");
}

process.chdir(ROOT);
process.env.NODE_ENV = process.env.NODE_ENV || "test";
require(path.join(ROOT, "backend", "node_modules", "dotenv")).config({ path: path.join(ROOT, "backend", ".env") });
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_PORT = process.env.DB_PORT || "5433";
process.env.DB_NAME = process.env.DB_NAME || "darfus_erp";
if (process.env.DB_NAME !== "darfus_erp" || !["localhost", "127.0.0.1"].includes(process.env.DB_HOST) || String(process.env.DB_PORT) !== "5433") {
  throw new Error("Refusing non-local HF6D verification target");
}

const jwt = require(path.join(ROOT, "backend", "node_modules", "jsonwebtoken"));
const bcrypt = require(path.join(ROOT, "backend", "node_modules", "bcryptjs"));
const app = require(path.join(ROOT, "backend", "src", "app"));
const models = require(path.join(ROOT, "backend", "src", "models"));
const employeeAuth = require(path.join(ROOT, "backend", "src", "services", "employee-authorization.service"));
const { JWT_SECRET } = require(path.join(ROOT, "backend", "src", "config", "security"));
models.sequelize.options.logging = false;

const ns = `HF6D-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ids = {
  company: `CMP-${ns}`,
  branch: `BR-${ns}`,
  admin: `USR-${ns}-ADMIN`,
  branchUser: `USR-${ns}-BRANCH`,
  employee: `EMP-${ns}`,
  device: `DS-${ns}`.slice(0, 80),
};
const pin = "864210";
let server;
let baseUrl;
let adminToken;
let branchToken;

async function signedToken(userId) {
  const user = await models.User.findByPk(userId);
  const session = await models.TechnicalAccountSession.create({
    id: `TAS-${ns}-${userId}`.slice(0, 190),
    userId,
    companyId: user.companyId,
    branchId: user.branchId || null,
    refreshTokenHash: `verifier-${ns}-${userId}`.slice(0, 128),
    passwordVersion: Number(user.passwordVersion || 1),
    sessionVersion: Number(user.sessionVersion || 1),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    lastUsedAt: new Date(),
  });
  return jwt.sign({ userId, passwordVersion: Number(user.passwordVersion || 1), sessionVersion: Number(user.sessionVersion || 1), technicalSessionId: session.id }, JWT_SECRET, { expiresIn: "1h" });
}

async function request(method, pathname, { token = branchToken, body } = {}) {
  const response = await fetch(`${baseUrl}/api/v1${pathname}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Company-ID": ids.company,
      "X-Branch-ID": ids.branch,
      "X-Device-Session-ID": ids.device,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  let bodyJson = null;
  try { bodyJson = raw ? JSON.parse(raw) : null; } catch { bodyJson = { raw }; }
  return { status: response.status, body: bodyJson };
}

function errorCode(result) {
  return result.body?.code || result.body?.error?.code || result.body?.errorCode;
}

async function setup() {
  const [customersView, inventoryView] = await Promise.all([
    models.Permission.findOne({ where: { name: "customers.view" } }),
    models.Permission.findOne({ where: { name: "inventory.view" } }),
  ]);
  assert.ok(customersView && inventoryView, "required catalog permissions exist");
  await models.Company.create({ id: ids.company, businessName: ns, workspace: ns.toLowerCase(), currency: "AED", country: "AE" });
  await models.Branch.create({ id: ids.branch, companyId: ids.company, name: `${ns} Branch`, code: ns.slice(-12), type: "store", isActive: true });
  await models.User.bulkCreate([
    { id: ids.admin, companyId: ids.company, accountType: "super_admin", firstName: ns, lastName: "Admin", email: `${ns.toLowerCase()}-admin@example.test`, password: await bcrypt.hash("Verifier-HF6D!", 4), role: "admin", isActive: true },
    { id: ids.branchUser, companyId: ids.company, branchId: ids.branch, accountType: "branch_shell", firstName: ns, lastName: "Branch", email: `${ns.toLowerCase()}-branch@example.test`, password: await bcrypt.hash("Verifier-HF6D!", 4), role: "sales", isActive: true },
  ]);
  await models.Employee.create({ id: ids.employee, companyId: ids.company, employeeCode: `${ns}-EMP`, employeeCodeNormalized: `${ns}-EMP`.toUpperCase(), name: `${ns} Employee`, role: "Operator", branch: ids.branch, branchId: ids.branch, status: "present" });
  await models.EmployeeBranchAccess.create({ id: `EBA-${ns}`, companyId: ids.company, employeeId: ids.employee, branchId: ids.branch, active: true });
  const admin = await models.User.findByPk(ids.admin);
  await employeeAuth.setEmployeePin({ companyId: ids.company, employeeId: ids.employee, pin, actorUser: admin });
  adminToken = await signedToken(ids.admin);
  branchToken = await signedToken(ids.branchUser);
  return { customersView, inventoryView, admin };
}

async function cleanup() {
  await models.EmployeeOperationalSession.destroy({ where: { companyId: ids.company }, force: true });
  await models.TechnicalAccountSession.destroy({ where: { userId: [ids.admin, ids.branchUser] }, force: true });
  await models.EmployeePermissionDenial.destroy({ where: { companyId: ids.company }, force: true });
  await models.EmployeePermissionGrant.destroy({ where: { companyId: ids.company }, force: true });
  await models.EmployeeRoleAssignment.destroy({ where: { companyId: ids.company }, force: true });
  await models.EmployeeBranchAccess.destroy({ where: { companyId: ids.company }, force: true });
  await models.EmployeeCredential.destroy({ where: { companyId: ids.company }, force: true });
  await models.EmployeeVerificationAttempt.destroy({ where: { companyId: ids.company }, force: true });
  await models.sequelize.query("DELETE FROM audit_logs WHERE company_id = :companyId", { replacements: { companyId: ids.company } });
  await models.Employee.destroy({ where: { companyId: ids.company }, force: true });
  await models.User.destroy({ where: { id: [ids.admin, ids.branchUser] }, force: true });
  await models.Branch.destroy({ where: { id: ids.branch }, force: true });
  await models.Company.destroy({ where: { id: ids.company }, force: true });
}

async function runtimeContract() {
  const { customersView, inventoryView, admin } = await setup();
  await employeeAuth.updateEmployeeAuthorization({ companyId: ids.company, employeeId: ids.employee, actorUser: admin, grantPermissionIds: [customersView.id], reason: "HF6D customer access" });
  const verifyCustomer = await request("POST", "/operator/verify", { body: { employeeCode: `${ns}-EMP`, pin, branchId: ids.branch } });
  assert.equal(verifyCustomer.status, 200, JSON.stringify(verifyCustomer.body));
  assert.ok(verifyCustomer.body.data.authorization.effectivePermissionNames.includes("customers.view"), "verify returns current effective permissions");
  const currentCustomer = await request("GET", "/operator/current");
  assert.equal(currentCustomer.status, 200, JSON.stringify(currentCustomer.body));
  assert.ok(currentCustomer.body.data.authorization.effectivePermissionNames.includes("customers.view"), "current returns current effective permissions");
  const customersAllowed = await request("GET", "/customers?page=1&pageSize=1");
  assert.equal(customersAllowed.status, 200, JSON.stringify(customersAllowed.body));
  const inventoryDenied = await request("GET", "/inventory/products?page=1&pageSize=1");
  assert.equal(inventoryDenied.status, 403, JSON.stringify(inventoryDenied.body));
  assert.equal(errorCode(inventoryDenied), "EMPLOYEE_PERMISSION_DENIED", "ungranted business module is denied by Employee guard");

  await employeeAuth.updateEmployeeAuthorization({ companyId: ids.company, employeeId: ids.employee, actorUser: admin, grantPermissionIds: [customersView.id, inventoryView.id], reason: "HF6D inventory access" });
  const stale = await request("GET", "/operator/current");
  assert.equal(stale.status, 200, JSON.stringify(stale.body));
  assert.equal(stale.body.data.active, false, "authorization change stales only the Employee session");
  const technicalStillValid = await request("GET", "/operator/current");
  assert.equal(technicalStillValid.status, 200, "Branch Account technical session remains valid");
  const verifyInventory = await request("POST", "/operator/verify", { body: { employeeCode: `${ns}-EMP`, pin, branchId: ids.branch } });
  assert.equal(verifyInventory.status, 200, JSON.stringify(verifyInventory.body));
  const inventoryAllowed = await request("GET", "/inventory/products?page=1&pageSize=1");
  assert.equal(inventoryAllowed.status, 200, JSON.stringify(inventoryAllowed.body));

  await employeeAuth.updateEmployeeAuthorization({ companyId: ids.company, employeeId: ids.employee, actorUser: admin, grantPermissionIds: [customersView.id, inventoryView.id], denialPermissionIds: [inventoryView.id], reason: "HF6D denial wins" });
  const verifyDenied = await request("POST", "/operator/verify", { body: { employeeCode: `${ns}-EMP`, pin, branchId: ids.branch } });
  assert.equal(verifyDenied.status, 200, JSON.stringify(verifyDenied.body));
  const directDenial = await request("GET", "/inventory/products?page=1&pageSize=1");
  assert.equal(directDenial.status, 403, JSON.stringify(directDenial.body));
  assert.equal(errorCode(directDenial), "EMPLOYEE_PERMISSION_DENIED", "direct denial overrides direct grant on business API");
}

(async () => {
  try {
    staticContract();
    server = await new Promise((resolve) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    await runtimeContract();
  } finally {
    try { if (server) await new Promise((resolve) => server.close(resolve)); } catch {}
    await cleanup();
    await models.sequelize.close();
  }
  console.log("EMPLOYEE PERMISSION ENFORCEMENT PASSED");
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
