#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function assertLocalDatabaseEnv() {
  if (process.env.DATABASE_URL && !/localhost|127\.0\.0\.1|5433/.test(process.env.DATABASE_URL)) {
    throw new Error("Refusing non-local DATABASE_URL");
  }
  if (process.env.DB_HOST && !["localhost", "127.0.0.1"].includes(process.env.DB_HOST)) {
    throw new Error(`Refusing unexpected DB_HOST ${process.env.DB_HOST}`);
  }
  if (process.env.DB_PORT && String(process.env.DB_PORT) !== "5433") {
    throw new Error(`Refusing unexpected DB_PORT ${process.env.DB_PORT}`);
  }
  if (process.env.DB_NAME && process.env.DB_NAME !== "darfus_erp") {
    throw new Error(`Refusing unexpected DB_NAME ${process.env.DB_NAME}`);
  }
}

function codeOf(response) {
  return response.body?.code || response.body?.errorCode || response.body?.error?.code || null;
}

function staticContract() {
  const employeeAuth = read("backend/src/services/employee-authorization.service.js");
  const operatorSession = read("backend/src/services/operator-session.service.js");
  const salesPolicy = read("backend/src/services/sales-operator-policy.service.js");
  const employeeRoutes = read("backend/src/routes/employee-authorization.routes.js");
  const apiClient = read("lib/api/client.ts");
  const operatorContext = read("contexts/operator-context.tsx");
  const operatorBar = read("components/operator/operator-bar.tsx");
  const verifyDialog = read("components/operator/operator-verify-dialog.tsx");
  const employeeDetail = read("app/[locale]/(dashboard)/employees/[id]/page.tsx");
  const systemAccounts = read("app/[locale]/(dashboard)/settings/users/page.tsx");
  const verifierFiles = fs.readdirSync(path.join(ROOT, "scripts")).filter((file) => /^verify-.*\.js$/.test(file));

  assert.equal(verifierFiles.length, 57, "verifier file count is 57 after Phase 35B");
  assert.ok(employeeAuth.includes("FAILED_VERIFY_DELAY_MS") && !employeeAuth.includes("MAX_FAILURES") && !employeeAuth.includes("LOCKOUT_MINUTES"), "PIN failures use bounded delay without automatic lockout constants");
  assert.ok(employeeAuth.includes("PIN must be exactly 6 numeric digits"), "PIN policy is exactly six numeric digits");
  assert.ok(!employeeAuth.includes("lockedUntil: nowPlus") && employeeAuth.includes("lockedUntil: null"), "verification never writes an automatic credential lock");
  assert.ok(operatorSession.includes("const IDLE_TIMEOUT_MINUTES = 30"), "Employee inactivity timeout is 30 minutes");
  assert.ok(!operatorSession.includes("OPERATOR_STEP_UP_REQUIRED") && !operatorSession.includes("authorizeAction"), "operator session service has no active step-up path");
  assert.ok(operatorSession.includes("verificationLevel: 1") && operatorSession.includes("level2VerifiedAt: null"), "Level columns are storage-only compatibility fields");
  assert.ok(salesPolicy.includes("touch: true") && !salesPolicy.includes("requiredLevel") && !salesPolicy.includes("OPERATOR_STEP_UP_REQUIRED"), "business command policy refreshes meaningful activity without Level checks");
  assert.ok(employeeRoutes.includes('router.get("/operator/current"') && employeeRoutes.includes("touch: false"), "operator current/status polling does not refresh activity");
  assert.ok(!employeeRoutes.includes("/operator/authorize-action"), "step-up endpoint is not mounted");
  assert.ok(!fs.existsSync(path.join(ROOT, "components/operator/operator-step-up-dialog.tsx")), "step-up dialog file is removed");
  assert.ok(!apiClient.includes("OPERATOR_STEP_UP_REQUIRED") && !apiClient.includes("EMPLOYEE_CREDENTIAL_LOCKED"), "frontend recovery no longer handles active step-up or auto-lock errors");
  assert.ok(!operatorContext.includes("authorizeAction") && !verifyDialog.includes("requestedLevel"), "frontend context and verify dialog use one verified state");
  for (const text of [
    "Current Employee",
    "Change Employee",
    "End Employee Session",
    "Select an employee to begin",
    "Employee session expired. Select an employee to continue.",
    "Employee code or PIN is incorrect",
    "الموظف الحالي",
    "تغيير الموظف",
    "إنهاء جلسة الموظف",
    "اختر موظفًا للبدء",
    "كود الموظف أو الرقم السري غير صحيح"
  ]) {
    assert.ok(operatorBar.includes(text), `operator bar includes ${text}`);
  }
  assert.ok(!operatorBar.includes("Level 2") && !operatorBar.includes("step-up"), "operator bar has no visible Level or step-up wording");
  assert.ok(!employeeDetail.includes("Verification level") && !employeeDetail.includes("Locked until") && !systemAccounts.includes("Level 2"), "management UI no longer exposes active Level or PIN lockout labels");
}

assertLocalDatabaseEnv();

process.env.NODE_ENV = "test";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_PORT = process.env.DB_PORT || "5433";
process.env.DB_NAME = process.env.DB_NAME || "darfus_erp";
process.env.DB_USER = process.env.DB_USER || "postgres";
process.env.JWT_SECRET = process.env.JWT_SECRET || "single-level-employee-operator-verifier-secret";

const app = require(path.join(BACKEND, "src/app"));
const models = require(path.join(BACKEND, "src/models"));
const bcrypt = require(path.join(BACKEND, "node_modules/bcryptjs"));
const jwt = require(path.join(BACKEND, "node_modules/jsonwebtoken"));
const { Op } = require(path.join(BACKEND, "node_modules/sequelize"));
const employeeAuth = require(path.join(BACKEND, "src/services/employee-authorization.service"));
const operatorSessionService = require(path.join(BACKEND, "src/services/operator-session.service"));
const { JWT_SECRET } = require(path.join(BACKEND, "src/config/security"));

models.sequelize.options.logging = false;

const ns = `HF5C-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const pin = "258036";
const ids = {
  company: `CMP-${ns}`,
  branchA: `BR-${ns}-A`,
  branchB: `BR-${ns}-B`,
  branchShell: `USR-${ns}-BRANCH`,
  superAdmin: `USR-${ns}-SUPER`,
  roleEmployee: `ROLE-${ns}-EMP`,
  roleViewOnly: `ROLE-${ns}-VIEW`,
  employee: `EMP-${ns}-OK`,
  noPerm: `EMP-${ns}-NOPERM`,
  disabledCredential: `EMP-${ns}-DISABLED`,
  wrongBranch: `EMP-${ns}-WRONGBR`,
  inactive: `EMP-${ns}-INACTIVE`
};

let server;
let baseUrl;
const tokens = new Map();

async function tokenFor(userId) {
  if (tokens.has(userId)) return tokens.get(userId);
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
    lastUsedAt: new Date()
  });
  const token = jwt.sign({
    userId,
    passwordVersion: Number(user.passwordVersion || 1),
    sessionVersion: Number(user.sessionVersion || 1),
    technicalSessionId: session.id,
    accountType: user.accountType
  }, JWT_SECRET, { expiresIn: "30m" });
  tokens.set(userId, token);
  return token;
}

async function request(method, urlPath, { userId = ids.branchShell, branchId = ids.branchA, deviceId, body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Company-ID": ids.company,
    "X-Correlation-ID": `COR-${ns}`
  };
  if (branchId) headers["X-Branch-ID"] = branchId;
  if (userId) headers.Authorization = `Bearer ${await tokenFor(userId)}`;
  if (deviceId) headers["X-Device-Session-ID"] = deviceId;
  const response = await fetch(`${baseUrl}/api/v1${urlPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let bodyJson = null;
  try { bodyJson = text ? JSON.parse(text) : null; } catch (_) { bodyJson = { raw: text }; }
  return { status: response.status, body: bodyJson };
}

async function makeRole(roleId, permissions) {
  await models.Role.create({ id: roleId, companyId: ids.company, name: roleId, slug: roleId.toLowerCase(), isSystem: false, isAdmin: false });
  const rows = await models.Permission.findAll({ where: { name: permissions } });
  assert.equal(rows.length, permissions.length, `missing permission for ${roleId}`);
  await models.RolePermission.bulkCreate(rows.map((permission) => ({ roleId, permissionId: permission.id })));
}

async function makeEmployee(id, code, branchId, status = "present", roleId = ids.roleEmployee) {
  const employee = await models.Employee.create({
    id,
    companyId: ids.company,
    employeeCode: code,
    employeeCodeNormalized: employeeAuth.normalizeEmployeeCode(code),
    name: `${ns} ${code}`,
    role: "Cashier",
    branch: branchId,
    branchId,
    status,
    authorizationVersion: 1
  });
  await models.EmployeeBranchAccess.create({
    id: `EBA-${id}`,
    companyId: ids.company,
    employeeId: id,
    branchId,
    active: true,
    validFrom: new Date(),
    createdByUserId: ids.superAdmin
  });
  await employeeAuth.setEmployeePin({ companyId: ids.company, employeeId: id, pin, actorUser: await models.User.findByPk(ids.superAdmin) });
  await models.EmployeeRoleAssignment.create({
    id: `ERA-${id}`,
    companyId: ids.company,
    employeeId: id,
    roleId,
    assignedByUserId: ids.superAdmin,
    active: true
  });
  return employee;
}

async function setup() {
  await models.Company.create({ id: ids.company, businessName: ns, workspace: ns.toLowerCase(), currency: "AED", country: "AE" }, { returning: false });
  await models.Branch.bulkCreate([
    { id: ids.branchA, companyId: ids.company, name: `${ns} A`, code: `${ns}A`, type: "store", isActive: true },
    { id: ids.branchB, companyId: ids.company, name: `${ns} B`, code: `${ns}B`, type: "store", isActive: true }
  ]);
  await models.User.bulkCreate([
    {
      id: ids.superAdmin,
      companyId: ids.company,
      branchId: null,
      firstName: ns,
      lastName: "Super",
      email: `${ns.toLowerCase()}-super@example.test`,
      password: await bcrypt.hash("Verifier-HF5C!1", 4),
      role: "admin",
      accountType: "super_admin"
    },
    {
      id: ids.branchShell,
      companyId: ids.company,
      branchId: ids.branchA,
      firstName: ns,
      lastName: "Branch",
      email: `${ns.toLowerCase()}-branch@example.test`,
      password: await bcrypt.hash("Verifier-HF5C!1", 4),
      role: "sales",
      accountType: "branch_shell"
    }
  ]);
  await makeRole(ids.roleEmployee, ["sales.view", "pos.sell"]);
  await makeRole(ids.roleViewOnly, ["sales.view"]);
  await makeEmployee(ids.employee, `${ns}-OK`, ids.branchA, "present", ids.roleEmployee);
  await makeEmployee(ids.noPerm, `${ns}-NOPERM`, ids.branchA, "present", ids.roleViewOnly);
  await makeEmployee(ids.disabledCredential, `${ns}-DISABLED`, ids.branchA, "present", ids.roleEmployee);
  await makeEmployee(ids.wrongBranch, `${ns}-WRONGBR`, ids.branchB, "present", ids.roleEmployee);
  await makeEmployee(ids.inactive, `${ns}-INACTIVE`, ids.branchA, "inactive", ids.roleEmployee);
  await models.EmployeeCredential.update({ active: false }, { where: { companyId: ids.company, employeeId: ids.disabledCredential } });
}

async function cleanup() {
  await models.EmployeeOperationalSession.destroy({ where: { companyId: ids.company } });
  await models.EmployeeVerificationAttempt.destroy({ where: { companyId: ids.company } });
  await models.EmployeePermissionDenial.destroy({ where: { companyId: ids.company } });
  await models.EmployeePermissionGrant.destroy({ where: { companyId: ids.company } });
  await models.EmployeeRoleAssignment.destroy({ where: { companyId: ids.company } });
  await models.EmployeeBranchAccess.destroy({ where: { companyId: ids.company } });
  await models.EmployeeCredential.destroy({ where: { companyId: ids.company } });
  await models.sequelize.query("DELETE FROM audit_logs WHERE company_id = :companyId", { replacements: { companyId: ids.company } });
  await models.TechnicalAccountSession.destroy({ where: { companyId: ids.company } });
  await models.UserRole.destroy({ where: { userId: [ids.branchShell, ids.superAdmin] } });
  await models.RolePermission.destroy({ where: { roleId: [ids.roleEmployee, ids.roleViewOnly] } });
  await models.Role.destroy({ where: { id: [ids.roleEmployee, ids.roleViewOnly] } });
  await models.Employee.destroy({ where: { companyId: ids.company }, force: true });
  await models.User.destroy({ where: { id: [ids.branchShell, ids.superAdmin] }, force: true });
  await models.Branch.destroy({ where: { companyId: ids.company } });
  await models.Company.destroy({ where: { id: ids.company } });
}

async function verifyOperator(employeeId, code, deviceId, branchId = ids.branchA) {
  const response = await request("POST", "/operator/verify", {
    deviceId,
    branchId,
    body: { employeeCode: code, pin, branchId }
  });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  const data = response.body.data;
  assert.equal(data.operatorSession.employee.id, employeeId, "verified Employee id");
  assert.equal(data.operatorSession.verificationLevel, undefined, "response hides verificationLevel");
  assert.equal(data.verification.state, "verified", "single verified state returned");
  return data;
}

async function runtimeContract() {
  const [[conn]] = await models.sequelize.query("select current_database() as database, inet_server_port()::int as port");
  assert.equal(conn.database, "darfus_erp", "connected to darfus_erp");
  const [[migrations]] = await models.sequelize.query('select count(*)::int c from "SequelizeMeta"');
  assert.equal(Number(migrations.c), 43, "migration count remains 43");
  assert.equal(await models.Permission.count(), 123, "permission count remains 123");

  const device = `DEV-${ns}-PRIMARY-0001`;
  await verifyOperator(ids.employee, `${ns}-OK`, device);
  let session = await models.EmployeeOperationalSession.findOne({ where: { companyId: ids.company, deviceSessionId: device } });
  assert.ok(session, "operator session persisted");
  assert.equal(Number(session.verificationLevel), 1, "compatibility verificationLevel is level 1 storage only");
  assert.equal(session.level2VerifiedAt, null, "level2VerifiedAt is null");
  const idleMinutes = Math.round((new Date(session.idleExpiresAt).getTime() - new Date(session.lastActivityAt).getTime()) / 60000);
  assert.ok(idleMinutes >= 29 && idleMinutes <= 30, `idle timeout is about 30 minutes (${idleMinutes})`);

  const frozenLast = new Date(Date.now() - 5 * 60 * 1000);
  const frozenIdle = new Date(Date.now() + 25 * 60 * 1000);
  await session.update({ lastActivityAt: frozenLast, idleExpiresAt: frozenIdle });
  const current = await request("GET", "/operator/current", { deviceId: device });
  assert.equal(current.status, 200, "current session succeeds");
  session = await session.reload();
  assert.equal(new Date(session.lastActivityAt).getTime(), frozenLast.getTime(), "current polling does not refresh lastActivityAt");
  assert.equal(new Date(session.idleExpiresAt).getTime(), frozenIdle.getTime(), "current polling does not refresh idleExpiresAt");

  const fakeReq = {
    companyId: ids.company,
    branchId: ids.branchA,
    user: await models.User.findByPk(ids.branchShell),
    headers: { "x-device-session-id": device }
  };
  const protectedAction = await operatorSessionService.currentFromRequest(fakeReq, {
    requiredPermission: "sales.view",
    requestedOperation: "hf5c.meaningful_action",
    touch: true
  });
  assert.equal(protectedAction.active, true, "meaningful Employee-protected action is allowed");
  session = await session.reload();
  assert.ok(new Date(session.lastActivityAt).getTime() > frozenLast.getTime(), "meaningful action refreshes lastActivityAt");

  const noPermDevice = `DEV-${ns}-NOPERM-0001`;
  await verifyOperator(ids.noPerm, `${ns}-NOPERM`, noPermDevice);
  const denied = await operatorSessionService.currentFromRequest({
    ...fakeReq,
    headers: { "x-device-session-id": noPermDevice }
  }, { requiredPermission: "pos.sell", requestedOperation: "hf5c.permission_denied", touch: true });
  assert.equal(denied.active, false, "missing Employee permission is denied");
  assert.equal(denied.reason, "EMPLOYEE_PERMISSION_DENIED", "permission denial reason is stable");
  const deniedSession = await models.EmployeeOperationalSession.findOne({ where: { companyId: ids.company, deviceSessionId: noPermDevice } });
  assert.equal(deniedSession.revokedAt, null, "permission denial does not clear selected Employee");

  for (let i = 0; i < 6; i += 1) {
    const wrong = await request("POST", "/operator/verify", {
      deviceId: `DEV-${ns}-WRONG-${i}`,
      body: { employeeCode: `${ns}-OK`, pin: "111111", branchId: ids.branchA }
    });
    assert.equal(wrong.status, 403, "wrong PIN is rejected");
    assert.equal(codeOf(wrong), "EMPLOYEE_VERIFICATION_FAILED", "wrong PIN uses generic code");
  }
  const credential = await models.EmployeeCredential.findOne({ where: { companyId: ids.company, employeeId: ids.employee } });
  assert.equal(credential.lockedUntil, null, "repeated wrong PINs do not auto-lock credential");
  assert.ok(Number(credential.failedAttemptCount) >= 6, "failed PIN attempts remain audit/telemetry");
  await verifyOperator(ids.employee, `${ns}-OK`, `DEV-${ns}-AFTERFAIL-0001`);
  const failedAttempts = await models.EmployeeVerificationAttempt.count({ where: { companyId: ids.company, result: "failure" } });
  assert.ok(failedAttempts >= 6, "failed attempts are audited");

  const unknown = await request("POST", "/operator/verify", {
    deviceId: `DEV-${ns}-UNKNOWN-0001`,
    body: { employeeCode: `${ns}-MISSING`, pin, branchId: ids.branchA }
  });
  assert.equal(unknown.status, 403, "unknown code denied");
  assert.equal(codeOf(unknown), "EMPLOYEE_VERIFICATION_FAILED", "unknown code uses generic code");

  const disabled = await request("POST", "/operator/verify", {
    deviceId: `DEV-${ns}-DISABLED-0001`,
    body: { employeeCode: `${ns}-DISABLED`, pin, branchId: ids.branchA }
  });
  assert.equal(disabled.status, 403, "manually disabled credential denied");
  assert.equal(codeOf(disabled), "EMPLOYEE_VERIFICATION_FAILED", "disabled credential does not enumerate state");

  const wrongBranch = await request("POST", "/operator/verify", {
    deviceId: `DEV-${ns}-BRANCH-0001`,
    body: { employeeCode: `${ns}-WRONGBR`, pin, branchId: ids.branchA }
  });
  assert.equal(wrongBranch.status, 403, "wrong branch denied");
  assert.equal(codeOf(wrongBranch), "EMPLOYEE_BRANCH_ACCESS_DENIED", "wrong branch has stable branch denial");

  const inactive = await request("POST", "/operator/verify", {
    deviceId: `DEV-${ns}-INACTIVE-0001`,
    body: { employeeCode: `${ns}-INACTIVE`, pin, branchId: ids.branchA }
  });
  assert.equal(inactive.status, 403, "inactive Employee denied");
  assert.equal(codeOf(inactive), "EMPLOYEE_VERIFICATION_FAILED", "inactive Employee uses generic invalid credentials");

  const [staleRows] = await models.EmployeeCredential.update({ credentialVersion: 99 }, { where: { companyId: ids.company, employeeId: ids.employee } });
  assert.equal(staleRows, 1, "credential version fixture update applied");
  const staleCredentialRow = await models.EmployeeCredential.findOne({ where: { companyId: ids.company, employeeId: ids.employee } });
  const staleSessionBefore = await models.EmployeeOperationalSession.findOne({ where: { companyId: ids.company, deviceSessionId: device } });
  assert.equal(Number(staleCredentialRow.credentialVersion), 99, "credential version fixture is visible");
  assert.notEqual(Number(staleSessionBefore.credentialVersion), Number(staleCredentialRow.credentialVersion), "session has stale credential version before current check");
  const staleCredential = await request("GET", "/operator/current", { deviceId: device });
  assert.equal(staleCredential.status, 200, "current session reports stale state through controlled payload");
  assert.equal(staleCredential.body.data.active, false, "credential version change stales session");
  assert.equal(staleCredential.body.data.reason, "OPERATOR_SESSION_STALE_CREDENTIAL", "stale credential code is stable");

  const endDevice = `DEV-${ns}-END-0001`;
  await verifyOperator(ids.employee, `${ns}-OK`, endDevice);
  const ended = await request("POST", "/operator/end-session", { deviceId: endDevice });
  assert.equal(ended.status, 200, "end Employee session succeeds");
  const branchAccountSession = await models.TechnicalAccountSession.findOne({ where: { companyId: ids.company, userId: ids.branchShell, revokedAt: null } });
  assert.ok(branchAccountSession, "Branch Account technical session remains after ending Employee session");
}

(async () => {
  try {
    staticContract();
    server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    await cleanup().catch(() => {});
    await setup();
    await runtimeContract();
    await cleanup();

    assert.equal(await models.Employee.count({ where: { companyId: ids.company } }), 0, "temporary Employees cleaned");
    assert.equal(await models.EmployeeOperationalSession.count({ where: { companyId: ids.company } }), 0, "temporary operator sessions cleaned");
    assert.equal(await models.TechnicalAccountSession.count({ where: { companyId: ids.company } }), 0, "temporary technical sessions cleaned");

    console.log("SINGLE LEVEL EMPLOYEE OPERATOR PASSED");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
    try { await cleanup(); } catch (_) {}
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await models.sequelize.close().catch(() => {});
  }
})();
