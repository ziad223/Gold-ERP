#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { execFileSync } = require("node:child_process");

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

function staticContract() {
  const bootstrap = read("scripts/bootstrap-first-super-admin.js");
  const salesPolicy = read("backend/src/services/sales-operator-policy.service.js");
  const systemAccounts = read("backend/src/services/system-account.service.js");
  const authMiddleware = read("backend/src/middleware/auth.middleware.js");
  const authController = read("backend/src/controllers/auth.controller.js");
  const permissionService = read("backend/src/services/permission.service.js");
  const usePermissions = read("hooks/use-permissions.ts");
  const usersUi = read("app/[locale]/(dashboard)/settings/users/page.tsx");
  const erpController = read("backend/src/controllers/erp.controller.js");
  const apiClient = read("lib/api/client.ts");

  assert.ok(bootstrap.includes("BOOTSTRAP_FIRST_SUPER_ADMIN"), "bootstrap requires exact confirmation flag");
  assert.ok(bootstrap.includes("DATABASE_URL") && bootstrap.includes("Refusing production"), "bootstrap refuses remote/production config");
  assert.ok(bootstrap.includes("TARGET_ID = \"USR-ADMIN\"") && bootstrap.includes("TARGET_EMAIL = \"admin@admin.com\""), "bootstrap targets the owner account only");
  assert.ok(bootstrap.includes("lock: transaction.LOCK.UPDATE"), "bootstrap row-locks the target user");
  assert.ok(bootstrap.includes("passwordHashPreserved") && !bootstrap.includes("console.log(target.password"), "bootstrap preserves and does not print password hash");
  assert.ok(bootstrap.includes("first_super_admin_bootstrapped") && bootstrap.includes("employeeId: null") && bootstrap.includes("operatorSessionId: null"), "bootstrap writes null-employee audit");

  assert.ok(salesPolicy.includes('accountType === "super_admin"') && salesPolicy.includes("operatorContext: null"), "Super Admin business access has null employee actor");
  assert.ok(salesPolicy.includes('accountTypeRequiresOperator = accountType === "branch_shell"'), "only Branch Shell is forced through employee operator gate");
  assert.ok(salesPolicy.includes("BRANCH_SELECTION_REQUIRED"), "Super Admin business commands require branch selection");

  assert.ok(systemAccounts.includes("requireSuperAdminTechnicalScope(req)") && !/currentFromRequest\(req,[\s\S]{0,240}system-account\.sensitive/.test(systemAccounts), "System Accounts no longer require Employee authorization for Super Admin");
  assert.ok(systemAccounts.includes("findUserByNormalizedEmail") && systemAccounts.includes('fn("lower"'), "System Accounts enforce case-insensitive email uniqueness");
  assert.ok(systemAccounts.includes("assertNotFinalSuperAdmin") && systemAccounts.includes("revokeUserSessions"), "final Super Admin and session revocation safeguards remain");

  assert.ok(authController.includes("findUserByNormalizedEmail") && !authController.includes("auth.change-password") && !authController.includes("auth.change-email"), "self password/email change do not require Employee authorization");
  assert.ok(permissionService.includes('accountType || "legacy") === "super_admin"') && permissionService.includes("return true"), "backend permission service gives Super Admin complete technical scope");
  assert.ok(usePermissions.includes('accountType === "super_admin"') && usePermissions.includes("return true"), "frontend permission hook gives Super Admin complete UI scope");
  assert.ok(usersUi.includes("errorMessage(error") && usersUi.includes("Branch Account"), "System Accounts UI catches expected errors and exposes Branch Account management");

  assert.ok(authMiddleware.includes("COMPANY_SCOPE_FORBIDDEN") && authMiddleware.includes("COMPANY_SCOPE_INVALID"), "middleware rejects company header widening");
  assert.ok(authMiddleware.includes("BRANCH_ACCOUNT_FIXED_SCOPE") && authMiddleware.includes("isActive: true"), "middleware preserves fixed Branch Account scope and validates active branches");
  assert.ok(erpController.includes("this.model.rawAttributes.companyId ? { companyId: req.companyId } : {}"), "Company CRUD is not broken by tenant-owned filters");
  assert.ok(apiClient.includes("X-Branch-ID") && apiClient.includes("X-Company-ID"), "API client sends explicit selected branch/company headers only");

  const migrationCount = fs.readdirSync(path.join(ROOT, "backend", "migrations")).filter((name) => name.endsWith(".js")).length;
  const verifierCount = fs.readdirSync(path.join(ROOT, "scripts")).filter((name) => /^verify-.*\.js$/.test(name)).length;
  assert.equal(migrationCount, 44, "migration count is 44 after Phase 35D");
  assert.equal(verifierCount, 58, "verifier count is 58 after Phase 35D");
  console.log("Simple Super Admin static contract: PASS");
}

async function request(baseUrl, method, urlPath, { token, refreshToken, companyId, branchId, body } = {}) {
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Accept-Language": "en",
    "X-Correlation-ID": "COR-HF5A-VERIFY"
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

async function liveContract() {
  assertLocalEnvironment();
  const ownerPassword = process.env.DARFUS_OWNER_PASSWORD;
  if (!ownerPassword) throw new Error("DARFUS_OWNER_PASSWORD is required for live owner login verification");

  const bcrypt = require(path.join(BACKEND, "node_modules/bcryptjs"));
  const jwt = require(path.join(BACKEND, "node_modules/jsonwebtoken"));
  const models = require(path.join(BACKEND, "src/models"));
  const { JWT_SECRET } = require(path.join(BACKEND, "src/config/security"));

  const owner = await models.User.findByPk("USR-ADMIN");
  assert.ok(owner, "owner account exists");
  assert.equal(owner.email, "admin@admin.com", "owner email is preserved");
  assert.equal(owner.accountType, "super_admin", "owner is super_admin");
  assert.equal(owner.deletedAt, null, "owner is active");
  assert.equal(owner.branchId, null, "owner is not fixed to a branch");
  assert.equal(owner.defaultEmployeeId, null, "owner has no synthetic default Employee");
  assert.equal(Number(owner.failedLoginCount || 0), 0, "failedLoginCount remains 0");
  assert.equal(owner.lockedUntil, null, "lockedUntil remains null");
  assert.equal(owner.forcePasswordChange, false, "no force password change introduced");
  assert.equal(await bcrypt.compare(ownerPassword, owner.password), true, "offline bcrypt comparison matches existing password");

  assert.equal(await models.User.count({ where: { accountType: "super_admin", deletedAt: null } }), 1, "one active Super Admin exists");
  assert.equal(await models.Permission.count(), 128, "permission count is 128 after Phase 35D");
  assert.equal(await models.TechnicalAccountSession.count({ where: { userId: "USR-ADMIN", revokedAt: null } }), 0, "old owner sessions revoked before new login");
  assert.equal(await models.AuditLog.count({ where: { action: "system_account.first_super_admin_bootstrapped", technicalUserId: "USR-ADMIN", employeeId: null, operatorSessionId: null } }), 1, "bootstrap audit row exists with null employee actor");

  const secondRun = execFileSync(process.execPath, ["scripts/bootstrap-first-super-admin.js", "--email", "admin@admin.com", "--confirm", "BOOTSTRAP_FIRST_SUPER_ADMIN"], {
    cwd: ROOT,
    env: { ...process.env, NODE_ENV: "test", DB_HOST: "localhost", DB_PORT: "5433", DB_NAME: "darfus_erp" },
    encoding: "utf8"
  });
  assert.ok(secondRun.includes('"changed": false') && secondRun.includes("already bootstrapped"), "second bootstrap run safely refuses mutation");

  const app = require(path.join(BACKEND, "src/app"));
  const server = await new Promise((resolve) => {
    const srv = http.createServer(app);
    srv.listen(0, "127.0.0.1", () => resolve(srv));
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const login = await request(baseUrl, "POST", "/auth/login", { body: { email: "admin@admin.com", password: ownerPassword } });
    assert.equal(login.status, 200, "existing password login succeeds");
    assert.equal(login.body?.data?.user?.id, "USR-ADMIN", "login returns correct user id");
    assert.equal(login.body?.data?.user?.accountType, "super_admin", "login returns super_admin accountType");
    assert.equal(login.body?.data?.user?.defaultEmployeeId, null, "login does not attach an Employee");
    assert.ok(!JSON.stringify(login.body?.data || {}).includes("pin"), "login response does not request PIN");

    const decoded = jwt.verify(login.body.data.token, JWT_SECRET);
    assert.equal(decoded.userId, "USR-ADMIN", "access token claim has owner id");
    assert.equal(decoded.accountType, "super_admin", "access token claim has super_admin");

    const wrong = await request(baseUrl, "POST", "/auth/login", { body: { email: "admin@admin.com", password: "not-the-owner-password" } });
    assert.equal(wrong.status, 422, "wrong password fails");

    const refresh = await request(baseUrl, "POST", "/auth/refresh", { refreshToken: login.body.data.refreshToken });
    assert.equal(refresh.status, 200, "refresh rotates successfully");
    const refreshedDecoded = jwt.verify(refresh.body.data.token, JWT_SECRET);
    assert.equal(refreshedDecoded.accountType, "super_admin", "refresh preserves super_admin claim");

    const readiness = await request(baseUrl, "GET", "/system-accounts/readiness", { token: refresh.body.data.token });
    assert.equal(readiness.status, 200, "System Accounts readiness succeeds");
    assert.equal(readiness.body?.data?.superAdmins >= 1, true, "readiness sees Super Admin");

    const branches = await models.Branch.findAll({ where: { companyId: owner.companyId, isActive: true }, limit: 1 });
    assert.ok(branches.length >= 1, "at least one active branch exists for branch-scope smoke");
    const meBadCompany = await request(baseUrl, "GET", "/auth/me", { token: refresh.body.data.token, companyId: "CMP-NOT-REAL" });
    assert.equal(meBadCompany.status, 403, "invalid Super Admin company header rejected");
    const meGoodBranch = await request(baseUrl, "GET", "/auth/me", { token: refresh.body.data.token, companyId: owner.companyId, branchId: branches[0].id });
    assert.equal(meGoodBranch.status, 200, "valid Super Admin company/branch selection accepted");

    const logout = await request(baseUrl, "POST", "/auth/logout", { token: refresh.body.data.token });
    assert.equal(logout.status, 200, "logout revokes current session");
    const stale = await request(baseUrl, "GET", "/auth/me", { token: refresh.body.data.token });
    assert.equal(stale.status, 401, "logged-out access token fails");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await models.User.update({ failedLoginCount: 0, lockedUntil: null }, { where: { id: "USR-ADMIN" } });
    await models.sequelize.close();
  }
  console.log("Simple Super Admin live contract: PASS");
}

(async () => {
  staticContract();
  if (process.env.VERIFY_SIMPLE_SUPER_ADMIN_LIVE === "true") {
    await liveContract();
  } else {
    console.log("Simple Super Admin live contract: SKIPPED (set VERIFY_SIMPLE_SUPER_ADMIN_LIVE=true)");
  }
  console.log("SIMPLE SUPER ADMIN ACCESS PASSED");
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
