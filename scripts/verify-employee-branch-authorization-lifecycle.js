#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

function staticContract() {
  const listPage = read("app/[locale]/(dashboard)/employees/page.tsx");
  const profilePage = read("app/[locale]/(dashboard)/employees/[id]/page.tsx");
  const employeeRoutes = read("backend/src/routes/erp.routes.js");
  const authorizationRoutes = read("backend/src/routes/employee-authorization.routes.js");
  const authorizationService = read("backend/src/services/employee-authorization.service.js");
  const operatorService = read("backend/src/services/operator-session.service.js");

  assert.ok(!listPage.includes("company?.branchName"), "employee creation must not use Company Branch metadata");
  assert.ok(listPage.includes("Branch assignment required"), "employee creation visibly requires Branch setup");
  assert.ok(listPage.includes("router.push(`/employees/${res.data.id}?setup=branches`)"), "employee creation leads to explicit Branch setup");
  assert.ok(employeeRoutes.includes("Employee creation is identity-only; assign Branch access separately."), "create route is identity-only");
  assert.ok(employeeRoutes.includes('status: "inactive"'), "identity-only employees are non-operational until activated");
  assert.ok(!employeeRoutes.includes("EmployeeBranchAccess.findOrCreate"), "create route cannot implicitly create Branch access");
  assert.ok(authorizationRoutes.includes("defaultBranchId: req.body?.defaultBranchId"), "Branch endpoint accepts explicit default Branch choice");
  assert.ok(authorizationService.includes("Default Branch must be one of the employee's active Branch assignments."), "service enforces default membership");
  assert.ok(authorizationService.includes("assertEmployeeOperationalReadiness"), "service exposes fail-closed setup readiness");
  assert.ok(operatorService.includes("assertEmployeeOperationalReadiness"), "operator sessions recheck setup readiness");
  assert.ok(profilePage.includes("employee-default-branch"), "profile presents an explicit default Branch control");
}

staticContract();

if (process.env.VERIFY_EMPLOYEE_BRANCH_AUTHORIZATION_EPHEMERAL !== "true") {
  console.log("STATIC ONLY — set VERIFY_EMPLOYEE_BRANCH_AUTHORIZATION_EPHEMERAL=true with an isolated database URL");
  process.exit(0);
}

const target = new URL(process.env.DATABASE_URL || "");
if (!/^darfus_erp_authorization_fix_cont1_[a-z0-9_]+$/i.test(target.pathname.replace(/^\//, ""))) {
  throw new Error("Ephemeral employee-authorization verification requires an approved disposable database name.");
}

process.chdir(ROOT);
const bcrypt = require(path.join(ROOT, "backend", "node_modules", "bcryptjs"));
const jwt = require(path.join(ROOT, "backend", "node_modules", "jsonwebtoken"));
const app = require(path.join(ROOT, "backend", "src", "app"));
const models = require(path.join(ROOT, "backend", "src", "models"));
const { JWT_SECRET } = require(path.join(ROOT, "backend", "src", "config", "security"));

models.sequelize.options.logging = false;

const namespace = `EA-${crypto.randomBytes(8).toString("hex")}`;
const ids = {
  company: `CMP-${namespace}`,
  branchA: `BR-${namespace}-A`,
  branchB: `BR-${namespace}-B`,
  admin: `USR-${namespace}-ADMIN`,
  shell: `USR-${namespace}-SHELL`,
  employee: `EMP-${namespace}`,
  device: `DS-${namespace}-PRIMARY`.slice(0, 80),
};
const pin = String(100000 + crypto.randomInt(899999));
let server;
const sessions = new Map();

async function token(userId) {
  if (sessions.has(userId)) return sessions.get(userId);
  const user = await models.User.findByPk(userId);
  const session = await models.TechnicalAccountSession.create({
    id: `TAS-${namespace}-${userId}`.slice(0, 190),
    userId,
    companyId: user.companyId,
    branchId: user.branchId || null,
    refreshTokenHash: crypto.randomBytes(24).toString("hex"),
    passwordVersion: Number(user.passwordVersion || 1),
    sessionVersion: Number(user.sessionVersion || 1),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    lastUsedAt: new Date(),
  });
  const value = jwt.sign({ userId, passwordVersion: user.passwordVersion || 1, sessionVersion: user.sessionVersion || 1, technicalSessionId: session.id }, JWT_SECRET, { expiresIn: "1h" });
  sessions.set(userId, value);
  return value;
}

async function request(baseUrl, method, pathname, { userId = ids.admin, branchId = ids.branchA, device = ids.device, body } = {}) {
  const headers = { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${await token(userId)}` };
  headers["X-Company-ID"] = ids.company;
  if (branchId) headers["X-Branch-ID"] = branchId;
  if (device) headers["X-Device-Session-ID"] = device;
  const response = await fetch(`${baseUrl}/api/v1${pathname}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await response.json().catch(() => null);
  return { status: response.status, body: json };
}

function codeOf(result) {
  return result.body?.code || result.body?.error?.code || result.body?.errorCode || null;
}

async function cleanup() {
  const where = { companyId: ids.company };
  for (const Model of [models.EmployeeOperationalSession, models.EmployeeVerificationAttempt, models.EmployeePermissionDenial, models.EmployeePermissionGrant, models.EmployeeRoleAssignment, models.EmployeeBranchAccess, models.EmployeeCredential, models.TechnicalAccountSession]) {
    await Model.destroy({ where });
  }
  await models.AuditLog.destroy({ where, force: true });
  await models.Employee.destroy({ where, force: true });
  await models.User.destroy({ where: { id: [ids.admin, ids.shell] }, force: true });
  await models.Branch.destroy({ where });
  await models.Company.destroy({ where: { id: ids.company } });
}

(async () => {
  try {
    await models.Company.create({ id: ids.company, businessName: namespace, workspace: namespace.toLowerCase(), currency: "AED", country: "AE" });
    await models.Branch.bulkCreate([
      { id: ids.branchA, companyId: ids.company, name: `${namespace} A`, code: `${namespace}A`, type: "store", isActive: true },
      { id: ids.branchB, companyId: ids.company, name: `${namespace} B`, code: `${namespace}B`, type: "store", isActive: true },
    ]);
    await models.User.bulkCreate([
      { id: ids.admin, companyId: ids.company, firstName: namespace, lastName: "Admin", email: `${namespace.toLowerCase()}-admin@example.test`, password: await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 4), accountType: "super_admin", role: "admin", isActive: true },
      { id: ids.shell, companyId: ids.company, branchId: ids.branchA, firstName: namespace, lastName: "Shell", email: `${namespace.toLowerCase()}-shell@example.test`, password: await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 4), accountType: "branch_shell", role: "sales", isActive: true },
    ]);
    server = await new Promise((resolve) => {
      const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const created = await request(baseUrl, "POST", "/employees", { body: { id: ids.employee, employeeCode: `${namespace}-OP`, name: `${namespace} Operator`, role: "Cashier", systemRole: "sales", pin, pinConfirm: pin } });
    assert.equal(created.status, 201, `identity-only employee creation succeeds (${codeOf(created) || "unknown"})`);
    assert.equal(created.body?.data?.branchId || null, null, "identity-only employee has no default Branch");
    assert.equal(created.body?.data?.status, "inactive", "identity-only employee is non-operational");
    assert.equal(await models.EmployeeBranchAccess.count({ where: { companyId: ids.company, employeeId: ids.employee } }), 0, "identity-only employee receives no implicit Branch mapping");

    const beforeAssignment = await request(baseUrl, "POST", "/operator/verify", { userId: ids.shell, body: { employeeCode: `${namespace}-OP`, pin, branchId: ids.branchA } });
    assert.equal(beforeAssignment.status, 403, "unassigned employee cannot start an operator session");

    const invalidDefault = await request(baseUrl, "PUT", `/employees/${ids.employee}/branches`, { body: { branchIds: [ids.branchA], defaultBranchId: ids.branchB } });
    assert.equal(invalidDefault.status, 422, "default Branch outside assignment is rejected");

    const assignedA = await request(baseUrl, "PUT", `/employees/${ids.employee}/branches`, { body: { branchIds: [ids.branchA], defaultBranchId: ids.branchA } });
    assert.equal(assignedA.status, 200, "explicit Branch A assignment and default succeeds");
    const activated = await request(baseUrl, "POST", `/employees/${ids.employee}/reactivate`);
    assert.equal(activated.status, 200, "configured employee with explicit Branch setup activates");

    const deniedB = await request(baseUrl, "POST", "/operator/verify", { userId: ids.shell, branchId: ids.branchB, body: { employeeCode: `${namespace}-OP`, pin, branchId: ids.branchB } });
    assert.equal(deniedB.status, 403, "employee cannot start an operator session in an unassigned Branch");
    const verifiedA = await request(baseUrl, "POST", "/operator/verify", { userId: ids.shell, body: { employeeCode: `${namespace}-OP`, pin, branchId: ids.branchA } });
    assert.equal(verifiedA.status, 200, "explicitly assigned active Branch starts an operator session");

    const deniedPermission = await request(baseUrl, "GET", "/operator/current", { userId: ids.shell });
    assert.equal(deniedPermission.status, 200, "operator bootstrap resolves an empty permission set without privilege escalation");
    assert.deepEqual(deniedPermission.body?.data?.authorization?.effectivePermissionNames || [], [], "empty effective permissions are not administrative access");

    const replaceDefault = await request(baseUrl, "PUT", `/employees/${ids.employee}/branches`, { body: { branchIds: [ids.branchA, ids.branchB], defaultBranchId: ids.branchB } });
    assert.equal(replaceDefault.status, 200, "multiple explicit Branch assignments remain supported");
    const revokeCurrentDefaultWithoutReplacement = await request(baseUrl, "PUT", `/employees/${ids.employee}/branches`, { body: { branchIds: [ids.branchA] } });
    assert.equal(revokeCurrentDefaultWithoutReplacement.status, 422, "revoking a default Branch requires an explicit replacement");
    const replaceAndRevoke = await request(baseUrl, "PUT", `/employees/${ids.employee}/branches`, { body: { branchIds: [ids.branchA], defaultBranchId: ids.branchA } });
    assert.equal(replaceAndRevoke.status, 200, "explicit default replacement keeps the invariant valid");

    const stale = await request(baseUrl, "GET", "/operator/current", { userId: ids.shell });
    assert.equal(stale.body?.data?.active, false, "Branch/default changes invalidate stale operator sessions");
    console.log("EMPLOYEE_BRANCH_AUTHORIZATION_EPHEMERAL = PASS");
  } finally {
    await cleanup().catch(() => {});
    if (server) await new Promise((resolve) => server.close(resolve));
    await models.sequelize.close().catch(() => {});
  }
})().catch((error) => {
  console.error(error.message || "employee Branch authorization verifier failed");
  process.exit(1);
});
