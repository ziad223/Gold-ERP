#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

process.env.NODE_ENV = process.env.NODE_ENV === "production" ? process.env.NODE_ENV : "test";
require(path.join(BACKEND, "node_modules/dotenv")).config({ path: path.join(BACKEND, ".env") });

function assertLocalEnvironment() {
  if (process.env.NODE_ENV === "production" || process.env.RENDER || process.env.VERCEL) throw new Error("Refusing production verification");
  if (process.env.DATABASE_URL) throw new Error("Refusing DATABASE_URL verification");
  if (process.env.DB_NAME !== "darfus_erp") throw new Error(`Refusing DB ${process.env.DB_NAME}`);
  if (!["localhost", "127.0.0.1"].includes(process.env.DB_HOST)) throw new Error(`Refusing DB host ${process.env.DB_HOST}`);
  if (String(process.env.DB_PORT) !== "5433") throw new Error(`Refusing DB port ${process.env.DB_PORT}`);
}

function verifyStaticContract() {
  const migration = read("backend/migrations/20260715010000-simple-fixed-branch-accounts.js");
  const userModel = read("backend/src/models/user.model.js");
  const systemAccounts = read("backend/src/services/system-account.service.js");
  const systemRoutes = read("backend/src/routes/system-account.routes.js");
  const authController = read("backend/src/controllers/auth.controller.js");
  const authMiddleware = read("backend/src/middleware/auth.middleware.js");
  const permissionService = read("backend/src/services/permission.service.js");
  const technicalSessions = read("backend/src/services/technical-session.service.js");
  const operatorSessions = read("backend/src/services/operator-session.service.js");
  const operatorRoutes = read("backend/src/routes/employee-authorization.routes.js");
  const salesPolicy = read("backend/src/services/sales-operator-policy.service.js");
  const apiClient = read("lib/api/client.ts");
  const authContext = read("contexts/auth-context.tsx");
  const operatorContext = read("contexts/operator-context.tsx");
  const operatorBar = read("components/operator/operator-bar.tsx");
  const branchSwitcher = read("components/layout/branch-switcher.tsx");
  const sidebar = read("components/layout/sidebar.tsx");
  const usersUi = read("app/[locale]/(dashboard)/settings/users/page.tsx");
  const userHook = read("hooks/use-user-management.ts");

  assert.ok(migration.includes("users_branch_shell_one_per_branch_uq"), "migration creates one-branch-account unique index");
  assert.ok(migration.includes("account_type = 'branch_shell'") && migration.includes("deleted_at IS NULL") && migration.includes("branch_id IS NOT NULL"), "unique index is scoped to non-deleted Branch Accounts with a branch");
  assert.ok(migration.includes("BRANCH_ACCOUNT_DUPLICATES_EXIST"), "migration pre-checks existing duplicates");
  assert.ok(migration.includes("removeColumn(\"users\", \"is_active\"") && migration.includes("DROP INDEX IF EXISTS users_branch_shell_one_per_branch_uq"), "migration is reversible");
  assert.ok(userModel.includes("isActive") && userModel.includes("field: \"is_active\""), "User model exposes active flag");

  assert.ok(systemRoutes.includes("/branch-accounts"), "dedicated Branch Account create route exists");
  assert.ok(userHook.includes("/system-accounts/branch-accounts"), "UI uses dedicated Branch Account route");
  for (const code of [
    "BRANCH_ACCOUNT_ALREADY_EXISTS",
    "BRANCH_ACCOUNT_BRANCH_REQUIRED",
    "BRANCH_ACCOUNT_BRANCH_INACTIVE",
    "BRANCH_ACCOUNT_COMPANY_MISMATCH",
    "BRANCH_ACCOUNT_FIXED_SCOPE",
    "EMAIL_ALREADY_USED"
  ]) {
    assert.ok(`${systemAccounts}\n${authController}\n${authMiddleware}`.includes(code), `stable error ${code} is implemented`);
  }
  assert.ok(systemAccounts.includes("assertNoBranchAccountForBranch") && systemAccounts.includes("defaultEmployeeId: null"), "Branch Account creation blocks duplicates and default Employee bypass");
  assert.ok(systemAccounts.includes("Forbidden fields") && systemAccounts.includes("\"branchId\", \"email\", \"temporaryPassword\", \"active\", \"reason\""), "dedicated create path rejects role/company/accountType/defaultEmployee override fields");
  assert.ok(systemAccounts.includes("setActive") && systemRoutes.includes("/:id/deactivate") && systemRoutes.includes("/:id/activate"), "activate/deactivate actions are wired");
  assert.ok(systemAccounts.includes("bumpSessionVersion") && systemAccounts.includes("system_account.deactivated"), "status changes invalidate sessions and audit");
  assert.ok(permissionService.includes('accountType || "legacy") === "branch_shell"') && permissionService.includes("return false"), "Branch Account receives no direct User operational permissions");

  assert.ok(authController.includes("ACCOUNT_INACTIVE") && authController.includes("ACCOUNT_LOCKED"), "login has stable inactive/locked errors");
  assert.ok(authController.includes("fixedBranch") && authController.includes("branchName"), "login response includes fixed branch identity");
  assert.ok(authMiddleware.includes("BRANCH_ACCOUNT_FIXED_SCOPE") && authMiddleware.includes("headerCompanyId") && authMiddleware.includes("headerBranchId"), "middleware enforces fixed company/branch scope");
  assert.ok(technicalSessions.includes("revokeOperatorSessionsForUser") && technicalSessions.includes("ACCOUNT_INACTIVE"), "technical session revocation cleans operator sessions and rejects inactive sessions");

  assert.ok(operatorSessions.includes("endCurrent") && operatorRoutes.includes("/operator/end-session"), "End Employee Session revokes operator session without technical logout");
  assert.ok(operatorContext.includes("endSession") && operatorBar.includes("End Employee Session") && operatorBar.includes("إنهاء جلسة الموظف"), "operator UI exposes End Employee Session");
  assert.ok(operatorBar.includes("Change Employee") && operatorBar.includes("تغيير الموظف") && operatorBar.includes("Current Employee") && operatorBar.includes("الموظف الحالي"), "operator UI exposes Change Employee and current employee labels");
  assert.ok(salesPolicy.includes("BRANCH_ACCOUNT_EMPLOYEE_REQUIRED") && salesPolicy.includes("EMPLOYEE_BRANCH_ACCESS_DENIED"), "business command gate maps Branch Account employee errors");
  assert.ok(apiClient.includes("BRANCH_ACCOUNT_EMPLOYEE_REQUIRED") && apiClient.includes("EMPLOYEE_CREDENTIAL_REQUIRED"), "frontend catches expected employee-required errors");

  assert.ok(branchSwitcher.includes("isFixedBranchAccount") && authContext.includes("branchName") && authContext.includes("branchId !== fixedId"), "frontend locks Branch Account branch selection");
  assert.ok(sidebar.includes("branchAccountAllowedRoutes") && sidebar.includes("operator.active"), "Branch Account navigation is allowlisted after Employee verification");
  for (const label of [
    "Branch Account",
    "Branch Login Email",
    "Temporary Password",
    "Assigned Branch",
    "This account's branch cannot be changed",
    "حساب الفرع",
    "إيميل دخول الفرع",
    "كلمة مرور مؤقتة",
    "الفرع المرتبط",
    "لا يمكن تغيير فرع هذا الحساب"
  ]) {
    assert.ok(usersUi.includes(label) || operatorBar.includes(label), `localized label present: ${label}`);
  }

  const migrationCount = fs.readdirSync(path.join(ROOT, "backend", "migrations")).filter((name) => name.endsWith(".js")).length;
  const verifierCount = fs.readdirSync(path.join(ROOT, "scripts")).filter((name) => /^verify-.*\.js$/.test(name)).length;
  assert.equal(migrationCount, 44, "migration count is 44 after Phase 35D");
  assert.ok(verifierCount >= 59, "verifier count remains at or above the HF6A baseline");
  console.log("Simple Branch Account static contract: PASS");
}

async function request(baseUrl, method, urlPath, { token, refreshToken, companyId, branchId, body } = {}) {
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Accept-Language": "en",
    "X-Correlation-ID": "COR-HF5B-VERIFY",
    "X-Device-Session-ID": "DS-HF5B-VERIFY-0001"
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (companyId) headers["X-Company-ID"] = companyId;
  if (branchId) headers["X-Branch-ID"] = branchId;
  const payload = refreshToken ? { refreshToken } : body;
  const response = await fetch(`${baseUrl}/api/v1${urlPath}`, {
    method,
    headers,
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: response.status, body: json };
}

async function verifyLiveContract() {
  assertLocalEnvironment();
  const ownerPassword = process.env.DARFUS_OWNER_PASSWORD;
  if (!ownerPassword) throw new Error("DARFUS_OWNER_PASSWORD is required for live Branch Account verification");

  const bcrypt = require(path.join(BACKEND, "node_modules/bcryptjs"));
  const models = require(path.join(BACKEND, "src/models"));
  const ns = `T345AHF5B-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const ids = {
    branch: `BR-${ns}`,
    user: null
  };
  const password = "BranchPass!234";
  const changedPassword = "BranchPass!345";
  const owner = await models.User.findByPk("USR-ADMIN");
  assert.ok(owner && owner.accountType === "super_admin", "local owner Super Admin exists");
  assert.equal(await models.Permission.count(), 128, "permission count is 128 after Phase 35D");

  const app = require(path.join(BACKEND, "src/app"));
  const server = await new Promise((resolve) => {
    const srv = http.createServer(app);
    srv.listen(0, "127.0.0.1", () => resolve(srv));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await models.Branch.create({
      id: ids.branch,
      companyId: owner.companyId,
      name: `${ns} Branch`,
      code: ns.slice(0, 24),
      type: "store",
      isActive: true
    });

    const loginOwner = await request(baseUrl, "POST", "/auth/login", { body: { email: owner.email, password: ownerPassword } });
    assert.equal(loginOwner.status, 200, "Super Admin login succeeds");
    const ownerToken = loginOwner.body.data.token;

    const missingBranch = await request(baseUrl, "POST", "/system-accounts/branch-accounts", {
      token: ownerToken,
      body: { email: `${ns}@example.test`, temporaryPassword: password }
    });
    assert.equal(missingBranch.status, 422, "branch is required");
    assert.equal(missingBranch.body.code, "BRANCH_ACCOUNT_BRANCH_REQUIRED");

    const override = await request(baseUrl, "POST", "/system-accounts/branch-accounts", {
      token: ownerToken,
      body: { branchId: ids.branch, email: `${ns}-bad@example.test`, temporaryPassword: password, role: "admin", accountType: "super_admin" }
    });
    assert.equal(override.status, 422, "client role/accountType override is rejected");

    const create = await request(baseUrl, "POST", "/system-accounts/branch-accounts", {
      token: ownerToken,
      body: { branchId: ids.branch, email: `${ns}@example.test`, temporaryPassword: password, active: true }
    });
    assert.equal(create.status, 201, "Super Admin creates Branch Account");
    ids.user = create.body.data.account.id;
    assert.equal(create.body.data.account.accountType, "branch_shell");
    assert.equal(create.body.data.account.branchId, ids.branch);
    assert.equal(create.body.data.account.companyId, owner.companyId);
    assert.equal(create.body.data.account.defaultEmployeeId, null);
    assert.equal(create.body.data.account.isActive, true);
    assert.ok(create.body.data.temporaryPassword, "temporary password shown once");

    const row = await models.User.findByPk(ids.user);
    assert.equal(row.role, "sales", "safe role is server-derived");
    assert.equal(await bcrypt.compare(password, row.password), true, "temporary password was hashed");

    const duplicateBranch = await request(baseUrl, "POST", "/system-accounts/branch-accounts", {
      token: ownerToken,
      body: { branchId: ids.branch, email: `${ns}-two@example.test`, temporaryPassword: password }
    });
    assert.equal(duplicateBranch.status, 409, "duplicate Branch Account is denied");
    assert.equal(duplicateBranch.body.code, "BRANCH_ACCOUNT_ALREADY_EXISTS");

    const duplicateEmail = await request(baseUrl, "POST", "/system-accounts/branch-accounts", {
      token: ownerToken,
      body: { branchId: ids.branch, email: `${ns.toUpperCase()}@EXAMPLE.TEST`, temporaryPassword: password }
    });
    assert.equal(duplicateEmail.status, 409, "case-insensitive duplicate email is denied");
    assert.equal(duplicateEmail.body.code, "EMAIL_ALREADY_USED");

    const loginBranch = await request(baseUrl, "POST", "/auth/login", { body: { email: `${ns}@example.test`, password } });
    assert.equal(loginBranch.status, 200, "Branch Account login succeeds");
    assert.equal(loginBranch.body.data.user.accountType, "branch_shell");
    assert.equal(loginBranch.body.data.user.accountScope.branchId, ids.branch);
    assert.equal(loginBranch.body.data.user.defaultEmployeeId, null);

    const badBranchHeader = await request(baseUrl, "GET", "/auth/me", {
      token: loginBranch.body.data.token,
      branchId: "BR-NOT-THIS"
    });
    assert.equal(badBranchHeader.status, 403, "cross-branch header is rejected");
    assert.equal(badBranchHeader.body.code, "BRANCH_ACCOUNT_FIXED_SCOPE");

    const noEmployee = await request(baseUrl, "POST", "/pos/checkout", {
      token: loginBranch.body.data.token,
      branchId: ids.branch,
      body: { items: [], payments: [] }
    });
    assert.equal(noEmployee.status, 401, "business mutation without Employee is denied");
    assert.equal(noEmployee.body.code, "BRANCH_ACCOUNT_EMPLOYEE_REQUIRED");

    const resetPassword = await request(baseUrl, "POST", `/system-accounts/${ids.user}/reset-password`, {
      token: ownerToken,
      body: { temporaryPassword: changedPassword, reason: "HF5B verifier reset" }
    });
    assert.equal(resetPassword.status, 200, "password reset succeeds");
    const staleAfterReset = await request(baseUrl, "GET", "/auth/me", { token: loginBranch.body.data.token, branchId: ids.branch });
    assert.equal(staleAfterReset.status, 401, "password reset invalidates old technical session");

    const loginAfterReset = await request(baseUrl, "POST", "/auth/login", { body: { email: `${ns}@example.test`, password: changedPassword } });
    assert.equal(loginAfterReset.status, 200, "Branch Account can login after reset");
    const deactivate = await request(baseUrl, "POST", `/system-accounts/${ids.user}/deactivate`, {
      token: ownerToken,
      body: { reason: "HF5B verifier deactivate" }
    });
    assert.equal(deactivate.status, 200, "deactivate succeeds");
    const inactiveLogin = await request(baseUrl, "POST", "/auth/login", { body: { email: `${ns}@example.test`, password: changedPassword } });
    assert.equal(inactiveLogin.status, 403, "inactive Branch Account login denied");
    assert.equal(inactiveLogin.body.code, "ACCOUNT_INACTIVE");

    const inactiveDuplicate = await request(baseUrl, "POST", "/system-accounts/branch-accounts", {
      token: ownerToken,
      body: { branchId: ids.branch, email: `${ns}-inactive-dup@example.test`, temporaryPassword: password }
    });
    assert.equal(inactiveDuplicate.status, 409, "inactive non-deleted Branch Account still blocks duplicate");

    const activate = await request(baseUrl, "POST", `/system-accounts/${ids.user}/activate`, {
      token: ownerToken,
      body: { reason: "HF5B verifier activate" }
    });
    assert.equal(activate.status, 200, "activate succeeds");

    const activeSessions = await models.TechnicalAccountSession.count({ where: { userId: ids.user, revokedAt: null } });
    const activeOperatorSessions = await models.EmployeeOperationalSession.count({ where: { sessionUserId: ids.user, revokedAt: null } });
    assert.equal(activeSessions, 0, "security changes leave no active technical sessions");
    assert.equal(activeOperatorSessions, 0, "security changes leave no orphan operator sessions");
  } finally {
    await models.EmployeeOperationalSession.destroy({ where: { sessionUserId: ids.user || "" }, force: true });
    await models.TechnicalAccountSession.destroy({ where: { userId: ids.user || "" }, force: true });
    await models.AuditLog.destroy({ where: { sourceDocument: ids.user || "" }, force: true });
    if (ids.user) await models.User.destroy({ where: { id: ids.user }, force: true });
    await models.Branch.destroy({ where: { id: ids.branch }, force: true });
    await new Promise((resolve) => server.close(resolve));
    await models.sequelize.close();
  }

  console.log("Simple Branch Account live contract: PASS");
}

(async () => {
  verifyStaticContract();
  if (process.env.VERIFY_SIMPLE_BRANCH_ACCOUNT_ACCESS_LIVE === "true") {
    await verifyLiveContract();
  } else {
    console.log("Simple Branch Account live contract: SKIPPED (set VERIFY_SIMPLE_BRANCH_ACCOUNT_ACCESS_LIVE=true)");
  }
  console.log("SIMPLE BRANCH ACCOUNT ACCESS PASSED");
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
