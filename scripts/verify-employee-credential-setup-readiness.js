#!/usr/bin/env node
"use strict";

const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function assertContains(text, needle, message) {
  assert.ok(text.includes(needle), message);
}

function staticContract() {
  const erpRoutes = read("backend/src/routes/erp.routes.js");
  const employeeAuth = read("backend/src/services/employee-authorization.service.js");
  const employeeList = read("app/[locale]/(dashboard)/employees/page.tsx");
  const employeeDetail = read("app/[locale]/(dashboard)/employees/[id]/page.tsx");
  const localRepo = read("lib/repositories/local-impl.ts");
  const types = read("lib/types.ts");
  const verifierFiles = fs.readdirSync(path.join(ROOT, "scripts")).filter((name) => /^verify-.*\.js$/.test(name));
  const backups = fs.existsSync(path.join(ROOT, "backend", "backups"))
    ? fs.readdirSync(path.join(ROOT, "backend", "backups")).filter((name) => /^darfus_erp_hf6a_start_.*\.dump$/.test(name))
    : [];

  assertContains(employeeAuth, "createEmployeeCredentialForNewEmployee", "create-time credential helper exists");
  assertContains(employeeAuth, "bcrypt.hash(pin, 10)", "create-time PIN is hashed");
  assertContains(erpRoutes, "assertEmployeeCreatePin", "employee create validates PIN");
  assertContains(erpRoutes, "Employee PIN must be configured before activation", "activation requires configured PIN");
  assertContains(employeeList, "Employee PIN", "employee create form exposes Employee PIN");
  assertContains(employeeList, "Confirm Employee PIN", "employee create form exposes PIN confirmation");
  assertContains(employeeList, "PIN configured", "employee list displays configured PIN status");
  assertContains(employeeList, "PIN not configured", "employee list displays missing PIN status");
  assertContains(employeeDetail, "PIN not configured", "employee detail displays missing PIN status");
  assertContains(employeeDetail, "Set PIN", "employee detail exposes Set PIN action");
  assertContains(localRepo, "delete safeEmployee.pin", "local repository strips create PIN");
  assertContains(localRepo, "delete safeEmployee.pinConfirm", "local repository strips create PIN confirmation");
  assertContains(types, "pin?: string", "Employee create type includes create-only PIN");
  assert.equal(verifierFiles.length, 59, `expected 59 verifier files after HF6A, found ${verifierFiles.length}`);
  assert.ok(backups.length > 0, "HF6A start backup exists before write-capable verification");
}

staticContract();

if (process.env.NODE_ENV === "production" || process.env.RENDER || process.env.VERCEL) {
  throw new Error("Refusing production/Render verification");
}
if (process.env.DATABASE_URL && !/localhost|127\.0\.0\.1|5433/.test(process.env.DATABASE_URL)) {
  throw new Error("Refusing non-local DATABASE_URL");
}

process.chdir(ROOT);
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_PORT = process.env.DB_PORT || "5433";
process.env.DB_NAME = process.env.DB_NAME || "darfus_erp";
process.env.DB_USER = process.env.DB_USER || "postgres";
process.env.DB_PASS = process.env.DB_PASS || process.env.DB_PASSWORD || "postgres";

const jwt = require(path.join(ROOT, "backend/node_modules/jsonwebtoken"));
const bcrypt = require(path.join(ROOT, "backend/node_modules/bcryptjs"));
const app = require(path.join(ROOT, "backend/src/app"));
const models = require(path.join(ROOT, "backend/src/models"));
const employeeAuth = require(path.join(ROOT, "backend/src/services/employee-authorization.service"));
const { JWT_SECRET } = require(path.join(ROOT, "backend/src/config/security"));
const { Op } = require(path.join(ROOT, "backend/node_modules/sequelize"));
models.sequelize.options.logging = false;

const ns = `HF6A-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const pin = "314159";
const changedPin = "271828";
const ids = {
  company: `CMP-${ns}`,
  otherCompany: `CMP-${ns}-OTHER`,
  branch: `BR-${ns}-A`,
  otherBranch: `BR-${ns}-O`,
  admin: `USR-${ns}-ADMIN`,
  limited: `USR-${ns}-LIMITED`,
  branchUser: `USR-${ns}-BRANCH`,
  otherAdmin: `USR-${ns}-OTHER-ADMIN`,
  employee: `EMP-${ns}-ACTIVE`,
  inactiveEmployee: `EMP-${ns}-INACTIVE`,
  device: `DS-${ns}-MAIN-0001`.slice(0, 80),
  secondDevice: `DS-${ns}-SECOND-0001`.slice(0, 80)
};
let server;
let baseUrl;
const accessTokens = new Map();

async function token(userId) {
  if (accessTokens.has(userId)) return accessTokens.get(userId);
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
  const signed = jwt.sign({
    userId,
    passwordVersion: Number(user.passwordVersion || 1),
    sessionVersion: Number(user.sessionVersion || 1),
    technicalSessionId: session.id
  }, JWT_SECRET, { expiresIn: "1h" });
  accessTokens.set(userId, signed);
  return signed;
}

async function request(method, pathname, { user = ids.admin, branchId = ids.branch, device = ids.device, body } = {}) {
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  if (user) headers.Authorization = `Bearer ${await token(user)}`;
  if (branchId) headers["X-Branch-ID"] = branchId;
  if (device) headers["X-Device-Session-ID"] = device;
  const response = await fetch(`${baseUrl}/api/v1${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: response.status, body: json };
}

function codeOf(result) {
  return result.body?.code || result.body?.error?.code || result.body?.errorCode;
}

function expectError(result, status, code) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  assert.equal(codeOf(result), code, JSON.stringify(result.body));
}

async function createUser(id, companyId, accountType, branchId = null, role = "sales") {
  await models.User.create({
    id,
    companyId,
    branchId,
    accountType,
    firstName: ns,
    lastName: id.slice(-8),
    email: `${id.toLowerCase()}@example.test`,
    password: await bcrypt.hash("Verifier-HF6A!", 4),
    role,
    isActive: true
  });
}

async function setup() {
  await models.Company.bulkCreate([
    { id: ids.company, businessName: ns, workspace: ns.toLowerCase(), currency: "AED", country: "AE" },
    { id: ids.otherCompany, businessName: `${ns} Other`, workspace: `${ns}-other`.toLowerCase(), currency: "AED", country: "AE" }
  ]);
  await models.Branch.bulkCreate([
    { id: ids.branch, companyId: ids.company, name: `${ns} Branch`, code: `${ns}A`, type: "store", isActive: true },
    { id: ids.otherBranch, companyId: ids.otherCompany, name: `${ns} Other`, code: `${ns}O`, type: "store", isActive: true }
  ]);
  await createUser(ids.admin, ids.company, "super_admin", null, "admin");
  await createUser(ids.limited, ids.company, "legacy", null, "sales");
  await createUser(ids.branchUser, ids.company, "branch_shell", ids.branch, "sales");
  await createUser(ids.otherAdmin, ids.otherCompany, "super_admin", null, "admin");
}

async function cleanup() {
  const companies = [ids.company, ids.otherCompany];
  await models.EmployeeVerificationAttempt.destroy({ where: { companyId: companies } });
  await models.EmployeePermissionDenial.destroy({ where: { companyId: companies } });
  await models.EmployeePermissionGrant.destroy({ where: { companyId: companies } });
  await models.EmployeeRoleAssignment.destroy({ where: { companyId: companies } });
  await models.EmployeeBranchAccess.destroy({ where: { companyId: companies } });
  await models.EmployeeCredential.destroy({ where: { companyId: companies } });
  await models.EmployeeOperationalSession.destroy({ where: { companyId: companies } });
  await models.TechnicalAccountSession.destroy({ where: { companyId: companies } });
  await models.sequelize.query("DELETE FROM audit_logs WHERE company_id IN (:companies)", { replacements: { companies } });
  await models.Employee.destroy({ where: { companyId: companies }, force: true });
  await models.User.destroy({ where: { id: [ids.admin, ids.limited, ids.branchUser, ids.otherAdmin] }, force: true });
  await models.Branch.destroy({ where: { id: [ids.branch, ids.otherBranch] } });
  await models.Company.destroy({ where: { id: companies } });
}

async function pollutionCount() {
  const [rows] = await models.sequelize.query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE id LIKE :likeId OR email LIKE :likeEmail) AS users,
      (SELECT COUNT(*) FROM employees WHERE company_id IN (:companies)) AS employees,
      (SELECT COUNT(*) FROM employee_credentials WHERE company_id IN (:companies)) AS credentials,
      (SELECT COUNT(*) FROM employee_branch_access WHERE company_id IN (:companies)) AS branch_access,
      (SELECT COUNT(*) FROM employee_operational_sessions WHERE company_id IN (:companies)) AS operator_sessions,
      (SELECT COUNT(*) FROM technical_account_sessions WHERE company_id IN (:companies)) AS technical_sessions,
      (SELECT COUNT(*) FROM employee_role_assignments WHERE company_id IN (:companies)) AS role_assignments,
      (SELECT COUNT(*) FROM employee_permission_grants WHERE company_id IN (:companies)) AS grants,
      (SELECT COUNT(*) FROM employee_permission_denials WHERE company_id IN (:companies)) AS denials,
      (SELECT COUNT(*) FROM audit_logs WHERE company_id IN (:companies)) AS audit_logs
  `, {
    replacements: {
      likeId: `%${ns}%`,
      likeEmail: `%${ns.toLowerCase()}%`,
      companies: [ids.company, ids.otherCompany]
    }
  });
  return rows[0];
}

async function runtimeContract() {
  const withoutCode = await request("POST", "/employees", {
    body: { name: `${ns} Missing Code`, role: "Cashier", branch: "A", branchId: ids.branch, pin, pinConfirm: pin }
  });
  expectError(withoutCode, 422, "VALIDATION_FAILED");

  const whitespaceCode = await request("POST", "/employees", {
    body: { employeeCode: "   ", name: `${ns} Blank Code`, role: "Cashier", branch: "A", branchId: ids.branch, pin, pinConfirm: pin }
  });
  expectError(whitespaceCode, 422, "VALIDATION_FAILED");

  const noPin = await request("POST", "/employees", {
    body: { employeeCode: `${ns}-NOPIN`, name: `${ns} No Pin`, role: "Cashier", branch: "A", branchId: ids.branch }
  });
  expectError(noPin, 422, "VALIDATION_FAILED");

  for (const body of [
    { employeeCode: `${ns}-BADPIN1`, pin: "abcdef", pinConfirm: "abcdef" },
    { employeeCode: `${ns}-BADPIN2`, pin: "12345", pinConfirm: "12345" },
    { employeeCode: `${ns}-BADPIN3`, pin: "1234567", pinConfirm: "1234567" },
    { employeeCode: `${ns}-BADPIN4`, pin: "123456", pinConfirm: "654321" }
  ]) {
    const failed = await request("POST", "/employees", {
      body: { name: `${body.employeeCode} Name`, role: "Cashier", branch: "A", branchId: ids.branch, ...body }
    });
    expectError(failed, 422, "VALIDATION_FAILED");
  }

  const created = await request("POST", "/employees", {
    body: { id: ids.employee, employeeCode: ` ${ns}-CODE `, name: `${ns} Active`, role: "Cashier", branch: "A", branchId: ids.branch, systemRole: "sales", pin, pinConfirm: pin }
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.data.employeeCodeNormalized, `${ns}-CODE`.toUpperCase());
  const serializedCreate = JSON.stringify(created.body);
  assert.ok(!serializedCreate.includes(pin), "create response does not expose PIN");

  const credential = await models.EmployeeCredential.findOne({ where: { companyId: ids.company, employeeId: ids.employee } });
  assert.ok(credential, "credential was created atomically");
  assert.ok(credential.pinHash && credential.pinHash !== pin, "PIN hash is not plaintext");
  assert.equal(credential.resetRequired, false, "created credential is usable");

  const duplicate = await request("POST", "/employees", {
    body: { employeeCode: `${ns}-CODE`, name: `${ns} Duplicate`, role: "Cashier", branch: "A", branchId: ids.branch, pin, pinConfirm: pin }
  });
  expectError(duplicate, 409, "STATE_CONFLICT");

  const otherCompanySameCode = await request("POST", "/employees", {
    user: ids.otherAdmin,
    branchId: ids.otherBranch,
    body: { employeeCode: `${ns}-CODE`, name: `${ns} Other`, role: "Cashier", branch: "Other", branchId: ids.otherBranch, pin, pinConfirm: pin }
  });
  assert.equal(otherCompanySameCode.status, 201, JSON.stringify(otherCompanySameCode.body));

  const inactive = await request("POST", "/employees", {
    body: { id: ids.inactiveEmployee, employeeCode: `${ns}-INACTIVE`, name: `${ns} Inactive`, role: "Cashier", branch: "A", branchId: ids.branch, status: "inactive" }
  });
  assert.equal(inactive.status, 201, JSON.stringify(inactive.body));
  assert.equal(await models.EmployeeCredential.count({ where: { companyId: ids.company, employeeId: ids.inactiveEmployee } }), 0, "inactive employee may exist without PIN");

  const reactivateDenied = await request("POST", `/employees/${ids.inactiveEmployee}/reactivate`);
  expectError(reactivateDenied, 422, "VALIDATION_FAILED");

  const resetDenied = await request("POST", `/employees/${ids.inactiveEmployee}/credential/reset`, {
    user: ids.limited,
    body: { pin: "111111", resetRequired: false }
  });
  expectError(resetDenied, 403, "FORBIDDEN");

  const resetConfigured = await request("POST", `/employees/${ids.inactiveEmployee}/credential/reset`, {
    body: { pin: "111111", resetRequired: false }
  });
  assert.equal(resetConfigured.status, 200, JSON.stringify(resetConfigured.body));
  assert.ok(!JSON.stringify(resetConfigured.body).includes("111111"), "reset response does not expose PIN");

  const reactivateOk = await request("POST", `/employees/${ids.inactiveEmployee}/reactivate`);
  assert.equal(reactivateOk.status, 200, JSON.stringify(reactivateOk.body));

  const wrongCompanyReset = await request("POST", `/employees/${otherCompanySameCode.body.data.id}/credential/reset`, {
    body: { pin: "222222", resetRequired: false }
  });
  expectError(wrongCompanyReset, 404, "RESOURCE_NOT_FOUND");

  const verify = await request("POST", "/operator/verify", {
    user: ids.branchUser,
    device: ids.device,
    body: { employeeCode: `${ns}-CODE`, pin, branchId: ids.branch }
  });
  assert.equal(verify.status, 200, JSON.stringify(verify.body));
  const branchTechnicalSession = await models.TechnicalAccountSession.findOne({ where: { companyId: ids.company, userId: ids.branchUser, revokedAt: null } });
  assert.ok(branchTechnicalSession, "Branch Account technical session exists before reset");

  const reset = await request("POST", `/employees/${ids.employee}/credential/reset`, {
    body: { pin: "444444", resetRequired: false }
  });
  assert.equal(reset.status, 200, JSON.stringify(reset.body));
  const postResetSession = await models.EmployeeOperationalSession.findOne({ where: { companyId: ids.company, employeeId: ids.employee, deviceSessionId: ids.device } });
  assert.ok(postResetSession.revokedAt, "credential reset revokes operator session");
  await branchTechnicalSession.reload();
  assert.equal(branchTechnicalSession.revokedAt, null, "Branch Account technical session remains after Employee reset");

  const verifyForSelfChange = await request("POST", "/operator/verify", {
    user: ids.branchUser,
    device: ids.secondDevice,
    body: { employeeCode: `${ns}-CODE`, pin: "444444", branchId: ids.branch }
  });
  assert.equal(verifyForSelfChange.status, 200, JSON.stringify(verifyForSelfChange.body));
  const badSelfChange = await request("POST", "/operator/change-pin", {
    user: ids.branchUser,
    device: ids.secondDevice,
    body: { currentPin: "000000", newPin: changedPin, confirmation: changedPin }
  });
  expectError(badSelfChange, 403, "EMPLOYEE_VERIFICATION_FAILED");
  const goodSelfChange = await request("POST", "/operator/change-pin", {
    user: ids.branchUser,
    device: ids.secondDevice,
    body: { currentPin: "444444", newPin: changedPin, confirmation: changedPin }
  });
  assert.equal(goodSelfChange.status, 200, JSON.stringify(goodSelfChange.body));
  assert.ok(!JSON.stringify(goodSelfChange.body).includes(changedPin), "self-change response does not expose PIN");
  const oldAfterChange = await request("POST", "/operator/verify", {
    user: ids.branchUser,
    device: `DS-${ns}-OLDPIN-0001`,
    body: { employeeCode: `${ns}-CODE`, pin: "444444", branchId: ids.branch }
  });
  expectError(oldAfterChange, 403, "EMPLOYEE_VERIFICATION_FAILED");
  const newAfterChange = await request("POST", "/operator/verify", {
    user: ids.branchUser,
    device: `DS-${ns}-NEWPIN-0001`,
    body: { employeeCode: `${ns}-CODE`, pin: changedPin, branchId: ids.branch }
  });
  assert.equal(newAfterChange.status, 200, JSON.stringify(newAfterChange.body));

  const auditRows = await models.AuditLog.findAll({ where: { companyId: ids.company }, raw: true });
  const auditText = JSON.stringify(auditRows);
  for (const secret of [pin, "111111", "444444", changedPin]) {
    assert.ok(!auditText.includes(secret), `audit log does not expose PIN ${secret}`);
  }
  assert.ok(!auditText.includes(credential.pinHash), "audit log does not expose PIN hash");
}

(async () => {
  try {
    server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    await cleanup().catch(() => {});
    await setup();
    await runtimeContract();
    await cleanup();
    const pollution = await pollutionCount();
    for (const [key, value] of Object.entries(pollution)) {
      assert.equal(Number(value), 0, `HF6A ${key} cleanup count`);
    }
    console.log("EMPLOYEE CREDENTIAL SETUP READINESS PASSED");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
    try { await cleanup(); } catch (_) {}
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await models.sequelize.close().catch(() => {});
  }
})();
