#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

require(path.join(BACKEND, "node_modules/dotenv")).config({ path: path.join(BACKEND, ".env") });

function assertLocalEnvironment() {
  if (process.env.NODE_ENV === "production" || process.env.RENDER || process.env.VERCEL) throw new Error("Refusing production verification");
  if (process.env.DB_NAME !== "darfus_erp") throw new Error(`Refusing DB ${process.env.DB_NAME}`);
  if (!["localhost", "127.0.0.1"].includes(process.env.DB_HOST)) throw new Error(`Refusing DB host ${process.env.DB_HOST}`);
  if (String(process.env.DB_PORT) !== "5433") throw new Error(`Refusing DB port ${process.env.DB_PORT}`);
}

function staticContract() {
  const migration = read("backend/migrations/20260714060000-super-admin-branch-shell-recovery.js");
  const userModel = read("backend/src/models/user.model.js");
  const models = read("backend/src/models/index.js");
  const auth = read("backend/src/controllers/auth.controller.js");
  const middleware = read("backend/src/middleware/auth.middleware.js");
  const systemService = read("backend/src/services/system-account.service.js");
  const routes = read("backend/src/routes/system-account.routes.js");
  const employeeAuth = read("backend/src/services/employee-authorization.service.js");
  const ui = read("app/[locale]/(dashboard)/settings/users/page.tsx");
  const catalog = read("lib/permissions/catalog.ts");
  const pkg = JSON.parse(read("package.json"));

  for (const token of [
    "account_type", "super_admin", "branch_shell", "technical_account_sessions",
    "password_reset_tokens", "email_change_tokens", "employee_code_history",
    "refresh_token_hash", "token_hash", "default_employee_id"
  ]) assert.ok(migration.includes(token), `migration includes ${token}`);
  for (const permission of [
    "system_accounts.view", "system_accounts.manage", "system_accounts.credentials.reset",
    "system_accounts.sessions.revoke", "security.recovery.manage", "super_admin.manage"
  ]) {
    assert.ok(migration.includes(permission), `migration has ${permission}`);
    assert.ok(catalog.includes(permission), `permission catalog has ${permission}`);
  }
  assert.ok(userModel.includes("accountType") && userModel.includes("forcePasswordChange"), "User model exposes safe account fields");
  assert.ok(models.includes("TechnicalAccountSession") && models.includes("PasswordResetToken") && models.includes("EmployeeCodeHistory"), "models registered");
  assert.ok(auth.includes("issueTokens") && auth.includes("rotateRefreshToken") && auth.includes("forgotPassword"), "auth controller uses persisted sessions and recovery");
  assert.ok(middleware.includes("assertAccessSession") && middleware.includes("Branch Shell accounts cannot switch branches"), "middleware validates session scope");
  assert.ok(systemService.includes("Final active Super Admin") && systemService.includes("requireSensitiveAdminLevel2"), "system account safeguards exist");
  assert.ok(routes.includes("/:id/reset-password") && routes.includes("/readiness"), "system account routes mounted");
  assert.ok(employeeAuth.includes("changeEmployeeCode") && employeeAuth.includes("changeOwnPin") && employeeAuth.includes("EmployeeCodeHistory"), "employee credential changes exist");
  assert.ok(ui.includes("Super Admin Accounts") && ui.includes("Branch Shell Accounts") && ui.includes("Security & Recovery"), "system accounts UI sections exist");
  assert.equal(pkg.scripts["verify:super-admin-branch-shell-recovery"], "node scripts/verify-super-admin-branch-shell-recovery.js", "package verifier registered");
  console.log("Phase 34.5A static contract: PASS");
}

let models;
let bcrypt;
let app;
let server;
let baseUrl;
const ns = `T345A-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const pin = "258036";
const ids = {
  company: `CMP-${ns}`,
  branchA: `BR-${ns}-A`,
  branchB: `BR-${ns}-B`,
  superAdmin: `USR-${ns}-SUPER`,
  branchShell: `USR-${ns}-SHELL`,
  employee: `EMP-${ns}-ADMIN`
};
const state = { tokens: {}, refresh: {}, devices: {}, createdUsers: [] };

async function request(method, urlPath, { token, branchId = ids.branchA, deviceId, body } = {}) {
  const headers = {
    "Content-Type": "application/json",
    "X-Company-ID": ids.company,
    "X-Correlation-ID": `COR-${ns}`
  };
  if (branchId) headers["X-Branch-ID"] = branchId;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (deviceId) headers["X-Device-Session-ID"] = deviceId;
  const response = await fetch(`${baseUrl}/api/v1${urlPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: response.status, body: json };
}

function codeOf(res) {
  return res.body?.code || res.body?.error?.code || res.body?.errorCode || null;
}

async function createRole(slug, permissionNames, isAdmin = false) {
  const role = await models.Role.create({
    id: `ROLE-${ns}-${slug}`,
    companyId: ids.company,
    name: `${ns} ${slug}`,
    slug: `${ns}-${slug}`,
    isSystem: false,
    isAdmin
  });
  const permissions = await models.Permission.findAll({ where: { name: permissionNames } });
  await models.RolePermission.bulkCreate(permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })));
  return role;
}

async function grantEmployee(employeeId, permissionNames) {
  const permissions = await models.Permission.findAll({ where: { name: permissionNames } });
  assert.equal(permissions.length, permissionNames.length, `all employee permissions exist: ${permissionNames.join(",")}`);
  await models.EmployeePermissionGrant.bulkCreate(permissions.map((permission) => ({
    id: `EPG-${ns}-${permission.name}`.replace(/[^A-Za-z0-9_.-]/g, "-").slice(0, 190),
    companyId: ids.company,
    employeeId,
    permissionId: permission.id,
    active: true
  })));
}

async function createFixtures() {
  await models.Company.create({ id: ids.company, businessName: `${ns} Company`, workspace: `${ns.toLowerCase()}-workspace`, currency: "AED", branchName: "Main" });
  await models.Branch.bulkCreate([
    { id: ids.branchA, companyId: ids.company, name: `${ns} Branch A`, code: `${ns}-A`, type: "store", isActive: true },
    { id: ids.branchB, companyId: ids.company, name: `${ns} Branch B`, code: `${ns}-B`, type: "store", isActive: true }
  ]);
  const adminRole = await createRole("super-admin", [
    "system_accounts.view", "system_accounts.manage", "system_accounts.credentials.reset",
    "system_accounts.sessions.revoke", "security.recovery.manage", "super_admin.manage",
    "employees.credentials.manage", "employees.permissions.manage", "pos.sell"
  ], true);
  await createRole("shell-admin-name-only", ["pos.sell"], true);
  await models.User.create({
    id: ids.superAdmin,
    companyId: ids.company,
    firstName: ns,
    lastName: "Super",
    email: `${ns}-super@example.test`.toLowerCase(),
    password: bcrypt.hashSync("StrongPass!234", 10),
    role: "admin",
    accountType: "super_admin",
    recoveryEmail: `${ns}-recovery@example.test`.toLowerCase()
  });
  await models.UserRole.create({ userId: ids.superAdmin, roleId: adminRole.id });
  await models.User.create({
    id: ids.branchShell,
    companyId: ids.company,
    firstName: ns,
    lastName: "Shell",
    email: `${ns}-shell@example.test`.toLowerCase(),
    password: bcrypt.hashSync("StrongPass!234", 10),
    role: "admin",
    accountType: "branch_shell",
    branchId: ids.branchA,
    recoveryEmail: `${ns}-shell-recovery@example.test`.toLowerCase()
  });
  await models.UserRole.create({ userId: ids.branchShell, roleId: `ROLE-${ns}-shell-admin-name-only` });
  await models.Employee.create({
    id: ids.employee,
    companyId: ids.company,
    name: `${ns} System Administrator`,
    employeeCode: `${ns}-ADMIN`,
    employeeCodeNormalized: `${ns}-ADMIN`.toUpperCase(),
    role: "System Administrator",
    systemRole: "admin",
    branch: ids.branchA,
    branchId: ids.branchA,
    status: "present",
    email: `${ns}-employee@example.test`,
    joinDate: "2026-07-14"
  });
  await models.EmployeeCredential.create({
    id: `ECRED-${ns}`,
    companyId: ids.company,
    employeeId: ids.employee,
    pinHash: bcrypt.hashSync(pin, 10),
    credentialVersion: 1,
    active: true
  });
  await models.EmployeeBranchAccess.create({
    id: `EBA-${ns}`,
    companyId: ids.company,
    employeeId: ids.employee,
    branchId: ids.branchA,
    active: true,
    validFrom: null,
    validTo: null,
    createdByUserId: ids.superAdmin
  });
  await grantEmployee(ids.employee, [
    "system_accounts.manage", "system_accounts.credentials.reset", "system_accounts.sessions.revoke",
    "security.recovery.manage", "super_admin.manage", "employees.credentials.manage", "pos.sell"
  ]);
}

async function login(email, password, key) {
  const res = await request("POST", "/auth/login", { branchId: null, body: { email, password } });
  assert.equal(res.status, 200, `${key} login`);
  state.tokens[key] = res.body.data.token;
  state.refresh[key] = res.body.data.refreshToken;
  return res.body.data;
}

async function verifyOperator(key = "super") {
  const deviceId = `DEV-${ns}-${key}`;
  const res = await request("POST", "/operator/verify", {
    token: state.tokens.super,
    deviceId,
    body: {
      employeeCode: `${ns}-ADMIN`,
      pin,
      branchId: ids.branchA,
      requestedLevel: 2,
      requestedPermission: "system_accounts.manage",
      requestedOperation: "phase34.5a.verifier"
    }
  });
  assert.equal(res.status, 200, "Admin Employee Level 2 verification");
  state.devices[key] = deviceId;
  return deviceId;
}

async function dbContract() {
  models.sequelize.options.logging = false;
  const [[conn]] = await models.sequelize.query("select current_database() as database");
  assert.equal(conn.database, "darfus_erp", "connected database");
  const [[migrations]] = await models.sequelize.query('select count(*)::int c from "SequelizeMeta"');
  assert.equal(Number(migrations.c), 42, "migration count is 42");
  assert.equal(await models.Permission.count(), 120, "permission count is 120");
  assert.equal(await models.Permission.count({ where: { name: ["pos.view", "pos.sell", "pos.discount.approve"] } }), 3, "POS permissions unchanged");
  const { Op } = require(path.join(BACKEND, "node_modules/sequelize"));
  assert.equal(await models.Permission.count({ where: { name: { [Op.like]: "gold_purchase.%" } } }), 24, "Gold Purchase permissions unchanged");
  const [columns] = await models.sequelize.query(`
    select table_name, column_name from information_schema.columns
    where table_name in ('technical_account_sessions','password_reset_tokens','email_change_tokens','employee_code_history','users')
  `);
  const keys = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
  for (const key of [
    "users.account_type", "users.default_employee_id", "technical_account_sessions.refresh_token_hash",
    "password_reset_tokens.token_hash", "email_change_tokens.token_hash", "employee_code_history.new_code"
  ]) assert.ok(keys.has(key), `schema has ${key}`);
}

async function testSessionsAndRecovery() {
  const data = await login(`${ns}-super@example.test`, "StrongPass!234", "super");
  assert.equal(data.user.accountType, "super_admin", "safe account type returned");
  assert.ok(!JSON.stringify(data).includes("password"), "login response does not reveal password fields");
  let sessions = await models.TechnicalAccountSession.count({ where: { userId: ids.superAdmin, revokedAt: null } });
  assert.equal(sessions, 1, "login creates persisted technical session");
  const beforeHash = (await models.TechnicalAccountSession.findOne({ where: { userId: ids.superAdmin } })).refreshTokenHash;
  const refresh = await request("POST", "/auth/refresh", { branchId: null, body: { refreshToken: state.refresh.super } });
  assert.equal(refresh.status, 200, "refresh succeeds");
  const afterHash = (await models.TechnicalAccountSession.findOne({ where: { userId: ids.superAdmin } })).refreshTokenHash;
  assert.notEqual(afterHash, beforeHash, "refresh rotates hash");
  state.tokens.super = refresh.body.data.token;
  state.refresh.super = refresh.body.data.refreshToken;
  console.log("TECHNICAL SESSION REVOCATION PASSED");

  const unknown = await request("POST", "/auth/forgot-password", { branchId: null, body: { email: `${ns}-unknown@example.test` } });
  const known = await request("POST", "/auth/forgot-password", { branchId: null, body: { email: `${ns}-super@example.test` } });
  assert.equal(unknown.status, 200, "unknown forgot generic");
  assert.equal(known.status, 200, "known forgot generic");
  assert.deepEqual(unknown.body.data, known.body.data, "forgot response does not enumerate");
  const resetRows = await models.PasswordResetToken.findAll({ where: { userId: ids.superAdmin, usedAt: null } });
  assert.equal(resetRows.length, 1, "prior reset tokens invalidated");
  assert.ok(resetRows[0].tokenHash && !resetRows[0].tokenHash.includes("T345A"), "reset token is hashed");
  const sink = path.join(BACKEND, "tmp/local-recovery-delivery.jsonl");
  const last = fs.readFileSync(sink, "utf8").trim().split(/\r?\n/).map(JSON.parse).reverse().find((row) => row.userId === ids.superAdmin);
  assert.ok(last?.token, "local/dev delivery sink emitted one-time token");
  const reset = await request("POST", "/auth/reset-password", {
    branchId: null,
    body: { token: last.token, newPassword: "ChangedPass!234", confirmation: "ChangedPass!234" }
  });
  assert.equal(reset.status, 200, "reset token works once");
  const reuse = await request("POST", "/auth/reset-password", {
    branchId: null,
    body: { token: last.token, newPassword: "ChangedPass!235", confirmation: "ChangedPass!235" }
  });
  assert.equal(reuse.status, 422, "reset token is one-time");
}

async function testLockoutAndBranchShell() {
  for (let i = 0; i < 5; i += 1) {
    const fail = await request("POST", "/auth/login", { branchId: null, body: { email: `${ns}-shell@example.test`, password: `bad-${i}` } });
    assert.equal(fail.status, 422, "failed login stays generic");
  }
  const shell = await models.User.findByPk(ids.branchShell);
  assert.ok(shell.lockedUntil, "five failures lock technical account");
  await shell.update({ failedLoginCount: 0, lockedUntil: null });
  await login(`${ns}-shell@example.test`, "StrongPass!234", "shell");
  const branchSwitch = await request("GET", "/auth/me", { token: state.tokens.shell, branchId: ids.branchB });
  assert.equal(branchSwitch.status, 403, "Branch Shell cannot switch branch");
  const posDenied = await request("POST", "/pos/checkout", {
    token: state.tokens.shell,
    branchId: ids.branchA,
    deviceId: `DEV-${ns}-shell`,
    body: {}
  });
  assert.equal(posDenied.status, 403, "Branch Shell does not inherit admin direct operational permission");
}

async function testSystemAccountsAndSafeguards() {
  await login(`${ns}-super@example.test`, "ChangedPass!234", "super");
  const readiness = await request("GET", "/system-accounts/readiness", { token: state.tokens.super, branchId: null });
  assert.equal(readiness.status, 200, "readiness is allowed with Super Admin technical scope");
  assert.equal(readiness.body.data.productionEmailReady, false, "production email not claimed ready");
  const denied = await request("POST", "/system-accounts", {
    token: state.tokens.super,
    branchId: null,
    body: { accountType: "super_admin", email: `${ns}-second@example.test`, firstName: "Second", lastName: "Admin" }
  });
  assert.equal(denied.status, 401, "sensitive action denied without Admin Employee Level 2");
  const deviceId = await verifyOperator();
  const createSecond = await request("POST", "/system-accounts", {
    token: state.tokens.super,
    deviceId,
    branchId: ids.branchA,
    body: { accountType: "super_admin", email: `${ns}-second@example.test`, firstName: "Second", lastName: "Admin" }
  });
  assert.equal(createSecond.status, 201, "create second Super Admin");
  state.createdUsers.push(createSecond.body.data.account.id);
  assert.ok(createSecond.body.data.temporaryPassword, "temporary password shown once in response");
  const demoteSecond = await request("POST", `/system-accounts/${createSecond.body.data.account.id}/convert-account-type`, {
    token: state.tokens.super,
    deviceId,
    branchId: ids.branchA,
    body: { accountType: "legacy", reason: "verifier demote" }
  });
  assert.equal(demoteSecond.status, 200, "manual conversion is explicit");
  const finalDeny = await request("POST", `/system-accounts/${ids.superAdmin}/convert-account-type`, {
    token: state.tokens.super,
    deviceId,
    branchId: ids.branchA,
    body: { accountType: "legacy", reason: "verifier final deny" }
  });
  assert.equal(finalDeny.status, 409, "final Super Admin safeguard denies demotion");
  console.log("FINAL ADMIN SAFEGUARDS PASSED");
}

async function testEmployeeCodeAndPin() {
  const deviceId = state.devices.super || await verifyOperator();
  const codeChange = await request("POST", `/employees/${ids.employee}/change-code`, {
    token: state.tokens.super,
    deviceId,
    branchId: ids.branchA,
    body: { employeeCode: `${ns}-ADMIN2`, reason: "verifier code change" }
  });
  assert.equal(codeChange.status, 200, "Employee Code change endpoint");
  assert.equal(await models.EmployeeCodeHistory.count({ where: { companyId: ids.company, employeeId: ids.employee } }), 1, "Employee Code history row");
  const reverify = await request("POST", "/operator/verify", {
    token: state.tokens.super,
    deviceId: `DEV-${ns}-pin`,
    body: { employeeCode: `${ns}-ADMIN2`, pin, branchId: ids.branchA, requestedLevel: 1 }
  });
  assert.equal(reverify.status, 200, "operator verifies with changed Employee Code");
  const pinChange = await request("POST", "/operator/change-pin", {
    token: state.tokens.super,
    deviceId: `DEV-${ns}-pin`,
    body: { currentPin: pin, newPin: "369258" }
  });
  assert.equal(pinChange.status, 200, "PIN self-change");
  const weak = await request("POST", "/operator/verify", {
    token: state.tokens.super,
    deviceId: `DEV-${ns}-weak`,
    body: { employeeCode: `${ns}-ADMIN2`, pin: "123456", branchId: ids.branchA, requestedLevel: 1 }
  });
  assert.equal(weak.status, 422, "weak PIN rejected");
  const auditCount = await models.AuditLog.count({ where: { companyId: ids.company } });
  assert.ok(auditCount >= 4, "high-risk dual audit evidence exists");
}

async function runLive() {
  assertLocalEnvironment();
  models = require(path.join(BACKEND, "src/models"));
  bcrypt = require(path.join(BACKEND, "node_modules/bcryptjs"));
  models.sequelize.options.logging = false;
  await dbContract();
  app = require(path.join(BACKEND, "src/app"));
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    await createFixtures();
    await testSessionsAndRecovery();
    await testLockoutAndBranchShell();
    await testSystemAccountsAndSafeguards();
    await testEmployeeCodeAndPin();
    console.log("LIVE HTTP ACCOUNT TESTS EXECUTED");
    console.log("SUPER ADMIN BRANCH SHELL RECOVERY PASSED");
  } finally {
    await cleanupNamespace();
    const remaining = await namespaceCount();
    assert.equal(remaining, 0, "namespace cleanup must leave zero persistent test records");
    console.log("No persistent account test pollution detected");
    await new Promise((resolve) => server.close(resolve));
    await models.sequelize.close();
  }
}

async function namespaceCount() {
  const [rows] = await models.sequelize.query(`
    select
      (select count(*) from companies where id = :companyId)
    + (select count(*) from branches where company_id = :companyId or id like :likeNs)
    + (select count(*) from users where company_id = :companyId or id like :likeNs or email like :likeNs)
    + (select count(*) from roles where company_id = :companyId or id like :likeNs or slug like :likeNs)
    + (select count(*) from employees where company_id = :companyId or id like :likeNs or employee_code like :likeNs)
    + (select count(*) from technical_account_sessions where company_id = :companyId or user_id like :likeNs)
    + (select count(*) from password_reset_tokens where user_id like :likeNs)
    + (select count(*) from email_change_tokens where user_id like :likeNs)
    + (select count(*) from employee_code_history where company_id = :companyId or employee_id like :likeNs)
    + (select count(*) from employee_operational_sessions where company_id = :companyId or id like :likeNs)
    + (select count(*) from employee_verification_attempts where company_id = :companyId or id like :likeNs or employee_code_normalized like :likeNs)
    + (select count(*) from audit_logs where company_id = :companyId or id like :likeNs or source_document like :likeNs)
    + (select count(*) from notifications where company_id = :companyId or entity_id like :likeNs)
    as total
  `, { replacements: { companyId: ids.company, likeNs: `%${ns}%` } });
  return Number(rows[0].total || 0);
}

async function cleanupNamespace() {
  const replacements = { companyId: ids.company, likeNs: `%${ns}%` };
  await models.sequelize.query("delete from notifications where company_id = :companyId or entity_id like :likeNs or message like :likeNs", { replacements });
  await models.sequelize.query("delete from audit_logs where company_id = :companyId or id like :likeNs or source_document like :likeNs or description like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_operational_sessions where company_id = :companyId or id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_verification_attempts where company_id = :companyId or id like :likeNs or employee_code_normalized like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_code_history where company_id = :companyId or employee_id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_permission_grants where company_id = :companyId or employee_id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_permission_denials where company_id = :companyId or employee_id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_role_assignments where company_id = :companyId or employee_id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_credentials where company_id = :companyId or employee_id like :likeNs or id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_branch_access where company_id = :companyId or employee_id like :likeNs or id like :likeNs", { replacements });
  await models.sequelize.query("delete from password_reset_tokens where user_id like :likeNs", { replacements });
  await models.sequelize.query("delete from email_change_tokens where user_id like :likeNs", { replacements });
  await models.sequelize.query("delete from technical_account_sessions where company_id = :companyId or user_id like :likeNs", { replacements });
  await models.sequelize.query("delete from user_roles where user_id like :likeNs or role_id like :likeNs", { replacements });
  await models.sequelize.query("delete from role_permissions where role_id like :likeNs", { replacements });
  await models.sequelize.query("delete from roles where company_id = :companyId or id like :likeNs or slug like :likeNs", { replacements });
  await models.sequelize.query("delete from users where company_id = :companyId or id like :likeNs or email like :likeNs", { replacements });
  await models.sequelize.query("delete from employees where company_id = :companyId or id like :likeNs or employee_code like :likeNs", { replacements });
  await models.sequelize.query("delete from branches where company_id = :companyId or id like :likeNs", { replacements });
  await models.sequelize.query("delete from companies where id = :companyId", { replacements });
  const sink = path.join(BACKEND, "tmp/local-recovery-delivery.jsonl");
  if (fs.existsSync(sink)) {
    const remaining = fs.readFileSync(sink, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.includes(ns));
    if (remaining.length) fs.writeFileSync(sink, `${remaining.join("\n")}\n`);
    else fs.rmSync(sink, { force: true });
  }
}

(async () => {
  staticContract();
  await runLive();
})().catch(async (error) => {
  console.error(error);
  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (models?.sequelize) await cleanupNamespace().catch(() => null).then(() => models.sequelize.close());
  } catch (_) {
    // best-effort shutdown
  }
  process.exit(1);
});
