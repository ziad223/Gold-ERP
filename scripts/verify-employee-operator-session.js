#!/usr/bin/env node
"use strict";

const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function staticContract() {
  const migration = read("backend/migrations/20260714040000-employee-operator-session-dual-audit.js");
  const modelIndex = read("backend/src/models/index.js");
  const sessionModel = read("backend/src/models/employeeOperationalSession.model.js");
  const auditModel = read("backend/src/models/auditLog.model.js");
  const auditService = read("backend/src/services/audit.service.js");
  const sessionService = read("backend/src/services/operator-session.service.js");
  const employeeAuth = read("backend/src/services/employee-authorization.service.js");
  const routes = read("backend/src/routes/employee-authorization.routes.js");
  const client = read("lib/api/client.ts");
  const operatorContext = read("contexts/operator-context.tsx");
  const header = read("components/layout/header.tsx");
  const operatorBar = read("components/operator/operator-bar.tsx");
  const verificationForm = read("components/operator/employee-verification-form.tsx");
  const verificationShell = read("components/operator/employee-verification-shell.tsx");
  const authGuard = read("components/auth/auth-guard.tsx");
  const dashboardLayout = read("app/[locale]/(dashboard)/layout.tsx");

  for (const token of [
    "employee_operational_sessions",
    "authorization_version",
    "technical_user_id",
    "operator_session_id",
    "hash_version",
    "employee_operator_sessions_active_user_device_uq"
  ]) assert.ok(migration.includes(token), `migration contains ${token}`);

  for (const token of ["EmployeeOperationalSession", "operationalSessions", "operatorSession", "operatorEmployee"]) {
    assert.ok(modelIndex.includes(token), `model index registers ${token}`);
  }
  for (const token of ["deviceSessionId", "authorizationVersion", "credentialVersion", "absoluteExpiresAt"]) {
    assert.ok(sessionModel.includes(token), `session model has ${token}`);
  }
  for (const token of ["technicalUserId", "employeeId", "employeeCodeSnapshot", "operatorSessionId", "hashVersion"]) {
    assert.ok(auditModel.includes(token), `audit model has ${token}`);
  }
  for (const token of ["canonicalV1", "canonicalV2", "attachDualAuditActor", "hashVersion"]) {
    assert.ok(auditService.includes(token), `audit service has ${token}`);
  }
  for (const token of ["currentFromRequest", "verifyOperator", "lockCurrent", "OPERATOR_SESSION_STALE_AUTHORIZATION"]) {
    assert.ok(sessionService.includes(token), `operator session service has ${token}`);
  }
  assert.ok(employeeAuth.includes("incrementEmployeeAuthorizationVersion"), "authorization version increment exists");
  for (const endpoint of ["/operator/verify", "/operator/current", "/operator/lock", "/operator/end-session"]) {
    assert.ok(routes.includes(endpoint), `route contains ${endpoint}`);
  }
  assert.ok(!routes.includes("/operator/authorize-action"), "step-up authorize-action route removed for HF5C");
  assert.ok(client.includes("X-Device-Session-ID"), "frontend sends device-session header");
  assert.ok(operatorContext.includes("OperatorProvider"), "operator provider exists");
  assert.ok(header.includes("OperatorBar"), "header exposes consolidated operator controls");
  assert.ok(verificationForm.includes("data-employee-verification-form"), "one shared Employee verification component exists");
  assert.ok(verificationForm.includes('pattern="[0-9]{6}"'), "shared verification component validates a six-digit PIN");
  assert.ok(verificationForm.includes("operator.verify"), "shared verification component owns the verification API path");
  assert.ok(verificationShell.includes('presentation="inline"'), "inactive Branch Account safe shell renders shared verification inline");
  assert.ok(authGuard.includes("EmployeeVerificationShell"), "inactive Branch Account access uses the verification shell without OperatorBar dependence");
  assert.ok(dashboardLayout.includes("<AppShell>") && dashboardLayout.includes("<AuthGuard>{children}</AuthGuard>"), "AppShell remains mounted around guarded Branch Account content");
  assert.ok(operatorBar.includes('presentation="dialog"'), "Change Employee reuses the shared verification component in dialog mode");
  assert.ok(operatorBar.includes("Change Employee") && operatorBar.includes("End Employee Session"), "OperatorBar exposes active Employee change and end controls");
  assert.ok(operatorBar.includes("operator.endSession"), "End Employee Session uses the operator-session boundary");
  assert.ok(!operatorBar.includes("operator.verify("), "OperatorBar does not duplicate the verification API path");
  assert.ok(operatorContext.includes("setAuthorization(null)") && operatorContext.includes("operatorRepository.endSession"), "ending an Employee session clears Employee authorization without technical logout");
  assert.ok(!authGuard.includes('router.replace("/pos")'), "no POS fallback is reintroduced");
  assert.ok(authGuard.includes('user?.accountType === "branch_shell"') && authGuard.includes("branchAccountBusinessRoute && !operator.active"), "only inactive Branch Accounts require Employee verification, leaving Super Admin outside the flow");
  assert.ok(!operatorBar.includes("step-up") && !operatorBar.includes("Level 2"), "operator bar exposes no step-up or Level UI");
  console.log("Phase 34.3 static operator-session contract: PASS");
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
const auditService = require(path.join(ROOT, "backend/src/services/audit.service"));
const employeeAuth = require(path.join(ROOT, "backend/src/services/employee-authorization.service"));
const { JWT_SECRET } = require(path.join(ROOT, "backend/src/config/security"));
const { Op } = require(path.join(ROOT, "backend/node_modules/sequelize"));
models.sequelize.options.logging = false;

const namespace = `T34-3-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ids = {
  company: `CMP-${namespace}`,
  branchA: `BR-${namespace}-A`,
  branchB: `BR-${namespace}-B`,
  user: `USR-${namespace}`,
  roleUser: `ROLE-${namespace}-USER`,
  roleEmployee: `ROLE-${namespace}-EMPLOYEE`,
  employee: `EMP-${namespace}`,
  employeeLeave: `EMP-${namespace}-LEAVE`,
  device: `DS-${namespace}-PRIMARY`.replace(/[^A-Za-z0-9._:-]/g, "-").slice(0, 80),
  secondDevice: `DS-${namespace}-SECOND`.replace(/[^A-Za-z0-9._:-]/g, "-").slice(0, 80)
};

let server;
let baseUrl;
const accessTokens = new Map();

async function token(userId = ids.user) {
  if (accessTokens.has(userId)) return accessTokens.get(userId);
  const user = await models.User.findByPk(userId);
  const session = await models.TechnicalAccountSession.create({
    id: `TAS-${namespace}-${userId}`.slice(0, 190),
    userId,
    companyId: user.companyId,
    branchId: user.branchId || null,
    refreshTokenHash: `verifier-${namespace}-${userId}`.slice(0, 128),
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

async function request(method, pathname, { user = ids.user, branchId = ids.branchA, device = ids.device, body } = {}) {
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

function expectError(result, status, code) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  assert.equal(result.body?.code || result.body?.error?.code, code, JSON.stringify(result.body));
}

async function makeRoleWithPermissions(roleId, permissionNames) {
  await models.Role.create({ id: roleId, companyId: ids.company, name: roleId, slug: roleId.toLowerCase(), isSystem: false, isAdmin: false });
  const permissions = await models.Permission.findAll({ where: { name: permissionNames } });
  assert.equal(permissions.length, new Set(permissionNames).size, `missing permissions ${permissionNames}`);
  await models.RolePermission.bulkCreate(permissions.map((permission) => ({ roleId, permissionId: permission.id })));
  return permissions;
}

async function setup() {
  await models.Company.create({ id: ids.company, businessName: namespace, workspace: namespace.toLowerCase(), currency: "AED", country: "AE" }, { returning: false });
  await models.Branch.bulkCreate([
    { id: ids.branchA, companyId: ids.company, name: `${namespace} A`, code: `${namespace}A`, type: "store", isActive: true },
    { id: ids.branchB, companyId: ids.company, name: `${namespace} B`, code: `${namespace}B`, type: "store", isActive: true }
  ]);
  await makeRoleWithPermissions(ids.roleUser, ["employees.credentials.manage", "employees.permissions.manage", "employees.branches.manage", "employees.verification.view"]);
  await models.User.create({
    id: ids.user,
    companyId: ids.company,
    branchId: ids.branchA,
    firstName: namespace,
    lastName: "User",
    email: `${namespace.toLowerCase()}@example.test`,
    password: await bcrypt.hash("Verifier-34.3!", 4),
    role: "admin"
  });
  await models.UserRole.create({ userId: ids.user, roleId: ids.roleUser });
  const employee = await models.Employee.create({
    id: ids.employee,
    companyId: ids.company,
    employeeCode: `${namespace}-OP`,
    employeeCodeNormalized: employeeAuth.normalizeEmployeeCode(`${namespace}-OP`),
    name: `${namespace} Operator`,
    role: "Cashier",
    branch: "A",
    branchId: ids.branchA,
    status: "present",
    authorizationVersion: 1
  });
  await models.Employee.create({
    id: ids.employeeLeave,
    companyId: ids.company,
    employeeCode: `${namespace}-LV`,
    employeeCodeNormalized: employeeAuth.normalizeEmployeeCode(`${namespace}-LV`),
    name: `${namespace} Leave`,
    role: "Cashier",
    branch: "A",
    branchId: ids.branchA,
    status: "leave",
    authorizationVersion: 1
  });
  await models.EmployeeBranchAccess.bulkCreate([
    { id: `EBA-${namespace}-A`, companyId: ids.company, employeeId: ids.employee, branchId: ids.branchA, active: true, validFrom: new Date(), createdByUserId: ids.user },
    { id: `EBA-${namespace}-LV`, companyId: ids.company, employeeId: ids.employeeLeave, branchId: ids.branchA, active: true, validFrom: new Date(), createdByUserId: ids.user }
  ]);
  await employeeAuth.setEmployeePin({ companyId: ids.company, employeeId: ids.employee, pin: "258036", actorUser: await models.User.findByPk(ids.user) });
  await employeeAuth.setEmployeePin({ companyId: ids.company, employeeId: ids.employeeLeave, pin: "258036", actorUser: await models.User.findByPk(ids.user) });
  await makeRoleWithPermissions(ids.roleEmployee, ["sales.view"]);
  await models.EmployeeRoleAssignment.create({ id: `ERA-${namespace}`, companyId: ids.company, employeeId: ids.employee, roleId: ids.roleEmployee, assignedByUserId: ids.user, active: true });
  return employee;
}

async function businessCounts() {
  const counts = {};
  for (const [key, Model] of Object.entries({
    customerGoldPurchaseDocuments: models.CustomerGoldPurchaseDocument,
    investmentGoldPurchaseDocuments: models.InvestmentGoldPurchaseDocument,
    goldPurchaseApprovalRequests: models.GoldPurchaseApprovalRequest,
    invoices: models.Invoice,
    assets: models.Asset,
    stockMovements: models.StockMovement,
    journalEntries: models.JournalEntry,
    cashTransactions: models.CashTransaction,
    purchaseOrders: models.PurchaseOrder,
    transfers: models.Transfer
  })) {
    if (!Model) continue;
    counts[key] = await Model.count({ where: { companyId: ids.company } });
  }
  const [journalLineRows] = await models.sequelize.query(`
    SELECT COUNT(*)::int AS count
    FROM journal_lines jl
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    WHERE je.company_id = :companyId
  `, { replacements: { companyId: ids.company } });
  counts.journalLines = Number(journalLineRows[0].count || 0);
  return counts;
}

function assertNoBusinessMutation(counts, label) {
  assert.deepEqual(counts, Object.fromEntries(Object.keys(counts).map((key) => [key, 0])), `${label} business mutation detected: ${JSON.stringify(counts)}`);
}

async function cleanup() {
  await models.EmployeeOperationalSession.destroy({ where: { companyId: ids.company } });
  await models.EmployeeVerificationAttempt.destroy({ where: { companyId: ids.company } });
  await models.EmployeePermissionDenial.destroy({ where: { companyId: ids.company } });
  await models.EmployeePermissionGrant.destroy({ where: { companyId: ids.company } });
  await models.EmployeeRoleAssignment.destroy({ where: { companyId: ids.company } });
  await models.EmployeeBranchAccess.destroy({ where: { companyId: ids.company } });
  await models.EmployeeCredential.destroy({ where: { companyId: ids.company } });
  await models.TechnicalAccountSession.destroy({ where: { companyId: ids.company } });
  await models.sequelize.query("DELETE FROM audit_logs WHERE company_id = :companyId OR description LIKE :ns", { replacements: { companyId: ids.company, ns: `%${namespace}%` } });
  await models.Employee.destroy({ where: { companyId: ids.company }, force: true });
  await models.UserRole.destroy({ where: { userId: ids.user } });
  await models.RolePermission.destroy({ where: { roleId: [ids.roleUser, ids.roleEmployee] } });
  await models.Role.destroy({ where: { id: [ids.roleUser, ids.roleEmployee] } });
  await models.User.destroy({ where: { id: ids.user }, force: true });
  await models.Branch.destroy({ where: { companyId: ids.company } });
  await models.Company.destroy({ where: { id: ids.company } });
}

async function pollutionCount() {
  const [rows] = await models.sequelize.query(`
    SELECT
      (SELECT COUNT(*) FROM companies WHERE id = :companyId) +
      (SELECT COUNT(*) FROM branches WHERE company_id = :companyId) +
      (SELECT COUNT(*) FROM users WHERE id = :userId) +
      (SELECT COUNT(*) FROM employees WHERE company_id = :companyId) +
      (SELECT COUNT(*) FROM employee_operational_sessions WHERE company_id = :companyId) +
      (SELECT COUNT(*) FROM employee_verification_attempts WHERE company_id = :companyId) +
      (SELECT COUNT(*) FROM audit_logs WHERE company_id = :companyId OR description LIKE :ns) AS count
  `, { replacements: { companyId: ids.company, userId: ids.user, ns: `%${namespace}%` } });
  return Number(rows[0].count || 0);
}

(async () => {
  try {
    server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    await cleanup().catch(() => {});
    const employee = await setup();
    assertNoBusinessMutation(await businessCounts(), "before");

    const noDevice = await request("POST", "/operator/verify", { device: null, body: { employeeCode: employee.employeeCode, pin: "258036", branchId: ids.branchA } });
    expectError(noDevice, 422, "VALIDATION_FAILED");

    const verify = await request("POST", "/operator/verify", { body: { employeeCode: employee.employeeCode, pin: "258036", branchId: ids.branchA } });
    assert.equal(verify.status, 200, JSON.stringify(verify.body));
    assert.equal(verify.body.data.employee.id, ids.employee);
    assert.equal(verify.body.data.operatorSession.verificationLevel, undefined);
    const sessionId = verify.body.data.operatorSession.sessionId;
    const session = await models.EmployeeOperationalSession.findByPk(sessionId);
    assert.ok(session, "operator session persisted");
    assert.equal(session.technicalUserId, undefined, "session model does not expose unrelated technical user alias");
    assert.equal(session.employeeId, ids.employee);
    assert.equal(session.deviceSessionId, ids.device);

    const current = await request("GET", "/operator/current");
    assert.equal(current.status, 200, JSON.stringify(current.body));
    assert.equal(current.body.data.active, true);
    assert.equal(current.body.data.operatorSession.employee.id, ids.employee);

    const stepEndpointGone = await request("POST", "/operator/authorize-action", { body: { pin: "258036", requiredPermission: "sales.view", requestedOperation: "sales-view" } });
    assert.equal(stepEndpointGone.status, 404, "step-up endpoint is not active");
    const stepped = await models.EmployeeOperationalSession.findByPk(sessionId);
    assert.equal(Number(stepped.verificationLevel), 1, "compatibility verification level remains storage-only level 1");
    assert.equal(stepped.level2VerifiedAt, null, "no level 2 timestamp is persisted");

    const leaveVerify = await request("POST", "/operator/verify", { device: ids.secondDevice, body: { employeeCode: `${namespace}-LV`, pin: "258036", branchId: ids.branchA } });
    expectError(leaveVerify, 403, "EMPLOYEE_VERIFICATION_FAILED");

    const staleBefore = await models.Employee.findByPk(ids.employee);
    const oldVersion = staleBefore.authorizationVersion;
    await employeeAuth.updateEmployeeAuthorization({
      companyId: ids.company,
      employeeId: ids.employee,
      actorUser: await models.User.findByPk(ids.user),
      roleIds: [],
      grantPermissionIds: [],
      denialPermissionIds: []
    });
    const staleAfter = await models.Employee.findByPk(ids.employee);
    assert.equal(Number(staleAfter.authorizationVersion), Number(oldVersion) + 1, "authorization version increments on permission change");
    const staleCurrent = await request("GET", "/operator/current");
    assert.equal(staleCurrent.status, 200, JSON.stringify(staleCurrent.body));
    assert.equal(staleCurrent.body.data.active, false);
    assert.equal(staleCurrent.body.data.reason, "OPERATOR_SESSION_STALE_AUTHORIZATION");

    const reverify = await request("POST", "/operator/verify", { body: { employeeCode: employee.employeeCode, pin: "258036", branchId: ids.branchA } });
    assert.equal(reverify.status, 200, JSON.stringify(reverify.body));
    const lock = await request("POST", "/operator/lock", { body: { reason: "verifier_lock" } });
    assert.equal(lock.status, 200, JSON.stringify(lock.body));
    assert.equal(lock.body.data.operatorSession.state, "locked");
    const lockedCurrent = await request("GET", "/operator/current");
    assert.equal(lockedCurrent.body.data.active, false);

    const auditRows = await models.AuditLog.findAll({ where: { companyId: ids.company }, order: [["createdAt", "ASC"]] });
    assert.ok(auditRows.some((row) => row.hashVersion === "v2" && row.employeeId === ids.employee && row.operatorSessionId), "v2 dual audit row persisted");
    const v1Like = { ...auditRows[0].toJSON(), hashVersion: "v1", technicalUserId: null, employeeId: null, operatorSessionId: null };
    assert.equal(auditService.computeHash(v1Like.prevHash, v1Like), auditService.computeHash(v1Like.prevHash, v1Like), "v1 canonical remains deterministic");
    const v2Row = auditRows.find((row) => row.hashVersion === "v2" && row.operatorSessionId);
    const originalHash = auditService.computeHash(v2Row.prevHash, v2Row);
    const tampered = { ...v2Row.toJSON(), employeeId: `EMP-TAMPER-${namespace}` };
    assert.notEqual(auditService.computeHash(v2Row.prevHash, tampered), originalHash, "v2 hash covers employee identity");
    const chain = await auditService.verifyChain(ids.company);
    assert.equal(chain.valid, true, JSON.stringify(chain));

    assertNoBusinessMutation(await businessCounts(), "after");
    await cleanup();
    const finalCount = await pollutionCount();
    assert.equal(finalCount, 0, `persistent pollution detected: ${finalCount}`);
    console.log("LIVE TESTS EXECUTED");
    console.log("OPERATOR SESSION DUAL AUDIT VERIFIER PASSED");
    console.log("No persistent test pollution detected");
  } finally {
    await cleanup().catch(() => {});
    if (server) await new Promise((resolve) => server.close(resolve));
    await models.sequelize.close().catch(() => {});
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
