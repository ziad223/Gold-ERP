#!/usr/bin/env node
"use strict";

const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function staticContract() {
  const migration = read("backend/migrations/20260714030000-employee-authorization-foundation.js");
  const service = read("backend/src/services/employee-authorization.service.js");
  const routes = read("backend/src/routes/employee-authorization.routes.js");
  const models = read("backend/src/models/index.js");
  const access = read("backend/src/bootstrap/accessControl.js");
  for (const name of ["employees.credentials.manage", "employees.permissions.manage", "employees.branches.manage", "employees.verification.view"]) {
    assert.ok(migration.includes(name), `migration contains ${name}`);
    assert.ok(access.includes(name), `access catalog contains ${name}`);
  }
  for (const table of ["employee_credentials", "employee_branch_access", "employee_role_assignments", "employee_permission_grants", "employee_permission_denials", "employee_verification_attempts"]) {
    assert.ok(migration.includes(table), `migration creates ${table}`);
  }
  for (const symbol of ["normalizeEmployeeCode", "verifyEmployeeCredential", "resolveEmployeePermissions", "updateEmployeeAuthorization", "recordVerificationAttempt"]) {
    assert.ok(service.includes(symbol), `service exports ${symbol}`);
  }
  for (const endpoint of ["/operator/verify", "/credential/reset", "/branches", "/permissions", "/verification-attempts"]) {
    assert.ok(routes.includes(endpoint), `route contains ${endpoint}`);
  }
  for (const model of ["EmployeeCredential", "EmployeeBranchAccess", "EmployeeRoleAssignment", "EmployeePermissionGrant", "EmployeePermissionDenial", "EmployeeVerificationAttempt"]) {
    assert.ok(models.includes(model), `model index registers ${model}`);
  }
  assert.ok(routes.includes("/operator/current"), "operator current endpoint implemented by Phase 34.3");
  console.log("Phase 34.2 static contract: PASS");
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

const namespace = `T34-2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ids = {
  company: `CMP-${namespace}`,
  otherCompany: `CMP-${namespace}-OTHER`,
  branchA: `BR-${namespace}-A`,
  branchB: `BR-${namespace}-B`,
  otherBranch: `BR-${namespace}-OTHER`,
  admin: `USR-${namespace}-ADMIN`,
  limited: `USR-${namespace}-LIMITED`,
  roleAdmin: `ROLE-${namespace}-ADMIN`,
  roleLimited: `ROLE-${namespace}-LIMITED`,
  roleTemplate: `ROLE-${namespace}-TEMPLATE`,
  emp: `EMP-${namespace}-1`,
  empLeave: `EMP-${namespace}-LEAVE`,
  empInactive: `EMP-${namespace}-INACTIVE`,
  empOther: `EMP-${namespace}-OTHER`,
  device: `DS-${namespace}-PH34-2`.replace(/[^A-Za-z0-9._:-]/g, "-").slice(0, 80)
};
let server;
let baseUrl;
const accessTokens = new Map();

async function token(userId) {
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

async function request(method, pathname, { user = ids.admin, branchId = ids.branchA, device = ids.device, body } = {}) {
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

async function makeUser(userId, roleId, permissionNames, legacyRole = "sales") {
  await models.User.create({
    id: userId,
    companyId: ids.company,
    firstName: namespace,
    lastName: userId.slice(-8),
    email: `${userId.toLowerCase()}@example.test`,
    password: await bcrypt.hash("Verifier-34.2!", 4),
    role: legacyRole
  });
  await models.Role.create({ id: roleId, companyId: ids.company, name: roleId, slug: roleId.toLowerCase(), isSystem: false, isAdmin: false });
  const permissions = await models.Permission.findAll({ where: { name: permissionNames } });
  assert.equal(permissions.length, new Set(permissionNames).size, `missing user permission ${permissionNames}`);
  await models.RolePermission.bulkCreate(permissions.map((permission) => ({ roleId, permissionId: permission.id })));
  await models.UserRole.create({ userId, roleId });
}

async function setup() {
  await models.Company.bulkCreate([
    { id: ids.company, businessName: namespace, workspace: namespace.toLowerCase(), currency: "AED", country: "AE" },
    { id: ids.otherCompany, businessName: `${namespace} Other`, workspace: `${namespace}-other`.toLowerCase(), currency: "AED", country: "AE" }
  ], { returning: false });
  await models.Branch.bulkCreate([
    { id: ids.branchA, companyId: ids.company, name: `${namespace} A`, code: `${namespace}A`, type: "store", isActive: true },
    { id: ids.branchB, companyId: ids.company, name: `${namespace} B`, code: `${namespace}B`, type: "store", isActive: true },
    { id: ids.otherBranch, companyId: ids.otherCompany, name: `${namespace} Other`, code: `${namespace}O`, type: "store", isActive: true }
  ]);
  await makeUser(ids.admin, ids.roleAdmin, ["employees.credentials.manage", "employees.permissions.manage", "employees.branches.manage", "employees.verification.view"]);
  await makeUser(ids.limited, ids.roleLimited, ["sales.view"]);
  await models.Role.create({ id: ids.roleTemplate, companyId: ids.company, name: `${namespace} Template`, slug: `${namespace}-template`.toLowerCase(), isSystem: false, isAdmin: false });
  const salesView = await models.Permission.findOne({ where: { name: "sales.view" } });
  await models.RolePermission.create({ roleId: ids.roleTemplate, permissionId: salesView.id });
}

async function businessCounts() {
  const business = {};
  for (const [key, Model] of Object.entries({
    customerGoldPurchaseDocuments: models.CustomerGoldPurchaseDocument,
    investmentGoldPurchaseDocuments: models.InvestmentGoldPurchaseDocument,
    goldPurchaseApprovalRequests: models.GoldPurchaseApprovalRequest,
    invoices: models.Invoice,
    invoiceItems: models.InvoiceItem,
    assets: models.Asset,
    stockMovements: models.StockMovement,
    journalEntries: models.JournalEntry,
    cashTransactions: models.CashTransaction,
    customerCreditTransactions: models.CustomerCreditTransaction,
    purchaseOrders: models.PurchaseOrder,
    transfers: models.Transfer,
    barcodeInventoryCodes: models.BarcodeInventoryCode,
    barcodeItemCodes: models.BarcodeItemCode
  })) {
    if (key === "invoiceItems") {
      business[key] = await Model.count({ where: { invoiceId: { [Op.like]: `%${namespace}%` } } });
    } else {
      business[key] = await Model.count({ where: { companyId: ids.company } });
    }
  }
  return business;
}

function assertNoBusinessMutation(counts, label) {
  assert.ok(Object.values(counts).every((count) => count === 0), `${label} business mutation detected: ${JSON.stringify(counts)}`);
}

async function cleanup() {
  await models.EmployeeVerificationAttempt.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.EmployeePermissionDenial.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.EmployeePermissionGrant.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.EmployeeRoleAssignment.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.EmployeeBranchAccess.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.EmployeeCredential.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.TechnicalAccountSession.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.sequelize.query("DELETE FROM audit_logs WHERE company_id IN (:companies)", { replacements: { companies: [ids.company, ids.otherCompany] } });
  await models.Employee.destroy({ where: { companyId: [ids.company, ids.otherCompany] }, force: true });
  await models.UserRole.destroy({ where: { userId: [ids.admin, ids.limited] } });
  await models.RolePermission.destroy({ where: { roleId: [ids.roleAdmin, ids.roleLimited, ids.roleTemplate] } });
  await models.Role.destroy({ where: { id: [ids.roleAdmin, ids.roleLimited, ids.roleTemplate] } });
  await models.User.destroy({ where: { id: [ids.admin, ids.limited] }, force: true });
  await models.Branch.destroy({ where: { id: [ids.branchA, ids.branchB, ids.otherBranch] } });
  await models.Company.destroy({ where: { id: [ids.company, ids.otherCompany] } });
}

(async () => {
  try {
    server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    await cleanup().catch(() => {});
    await setup();

    const beforeBusiness = await businessCounts();
    assertNoBusinessMutation(beforeBusiness, "before");

    assert.equal(employeeAuth.normalizeEmployeeCode("  emp-001  "), "EMP-001");
    assert.equal(employeeAuth.normalizeEmployeeCode("０００１２３"), "000123");
    assert.equal(employeeAuth.normalizeEmployeeCode("emp-Ａ１"), "EMP-A1");

    const create = await request("POST", "/employees", { body: { employeeCode: " emp-Ａ１ ", name: `${namespace} Employee`, role: "Cashier", branch: "Branch Text Only", branchId: ids.branchA, systemRole: "sales" } });
    assert.equal(create.status, 201, JSON.stringify(create.body));
    const employee = create.body.data;
    assert.equal(employee.employeeCodeNormalized, "EMP-A1");

    const duplicate = await request("POST", "/employees", { body: { employeeCode: "EMP-A1", name: "Duplicate", role: "Cashier", branch: "A" } });
    expectError(duplicate, 409, "STATE_CONFLICT");

    await models.Employee.create({ id: ids.empOther, companyId: ids.otherCompany, employeeCode: "EMP-A1", employeeCodeNormalized: "EMP-A1", name: "Other Company", role: "Cashier", branch: "Other", branchId: ids.otherBranch, status: "present" });

    const resetDenied = await request("POST", `/employees/${employee.id}/credential/reset`, { user: ids.limited, body: { pin: "258036" } });
    expectError(resetDenied, 403, "FORBIDDEN");
    const reset = await request("POST", `/employees/${employee.id}/credential/reset`, { body: { pin: "258036", resetRequired: false } });
    expectError(reset, 403, "FORBIDDEN");
    const seeded = await employeeAuth.setEmployeePin({ companyId: ids.company, employeeId: employee.id, pin: "258036", actorUser: await models.User.findByPk(ids.admin) });
    const credential = seeded.credential;
    assert.ok(credential.pinHash && credential.pinHash !== "258036", "PIN is hashed");

    const branchDenied = await request("PUT", `/employees/${employee.id}/branches`, { user: ids.limited, body: { branchIds: [ids.branchA] } });
    expectError(branchDenied, 403, "FORBIDDEN");
    const branches = await request("PUT", `/employees/${employee.id}/branches`, { body: { branchIds: [ids.branchA, ids.branchB] } });
    assert.equal(branches.status, 200, JSON.stringify(branches.body));
    assert.equal(branches.body.data.items.length, 2);

    const permissionDenied = await request("PUT", `/employees/${employee.id}/permissions`, { user: ids.limited, body: { roleIds: [ids.roleTemplate] } });
    expectError(permissionDenied, 403, "FORBIDDEN");
    const salesView = await models.Permission.findOne({ where: { name: "sales.view" } });
    const inventoryView = await models.Permission.findOne({ where: { name: "inventory.view" } });
    const reservationView = await models.Permission.findOne({ where: { name: "reservations.view" } });
    const contradiction = await request("PUT", `/employees/${employee.id}/permissions`, { body: { roleIds: [], grantPermissionIds: [inventoryView.id], denialPermissionIds: [inventoryView.id] } });
    expectError(contradiction, 422, "VALIDATION_FAILED");
    const perms = await request("PUT", `/employees/${employee.id}/permissions`, { body: { roleIds: [ids.roleTemplate], grantPermissionIds: [inventoryView.id, reservationView.id], denialPermissionIds: [salesView.id] } });
    assert.equal(perms.status, 200, JSON.stringify(perms.body));
    const resolved = await employeeAuth.resolveEmployeePermissions({ companyId: ids.company, employeeId: employee.id, branchId: ids.branchA });
    assert.ok(resolved.directGrantNames.includes("reservations.view"), "direct grant resolves");
    assert.ok(!resolved.effectivePermissionNames.includes("sales.view"), "direct denial removes role grant");
    assert.ok(resolved.effectivePermissionNames.includes("inventory.view"), "non-overlapping direct grant resolves");
    assert.ok(!resolved.effectivePermissionNames.includes("accounting.post"), "unassigned permission denied");

    const userOnly = await request("POST", "/operator/verify", { user: ids.limited, body: { employeeCode: "EMP-A1", pin: "258036", branchId: ids.branchA, requestedLevel: 1, requestedPermission: "accounting.post" } });
    expectError(userOnly, 403, "EMPLOYEE_PERMISSION_DENIED");

    const ok = await request("POST", "/operator/verify", { body: { employeeCode: "EMP-A1", pin: "258036", branchId: ids.branchA, requestedLevel: 1, requestedPermission: "reservations.view", requestedOperation: "foundation-test" } });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.body.data.employee.id, employee.id);
    assert.equal(ok.body.data.authorization.allowed, true);

    const wrongBranch = await request("POST", "/operator/verify", { body: { employeeCode: "EMP-A1", pin: "258036", branchId: ids.otherBranch, requestedLevel: 1 } });
    expectError(wrongBranch, 403, "EMPLOYEE_BRANCH_ACCESS_DENIED");

    await models.Employee.create({ id: ids.empLeave, companyId: ids.company, employeeCode: `${namespace}-LEAVE`, employeeCodeNormalized: `${namespace}-LEAVE`.toUpperCase(), name: "Leave", role: "Sales", branch: "A", branchId: ids.branchA, status: "leave" });
    await models.EmployeeBranchAccess.create({ id: `EBA-${namespace}-LEAVE`, companyId: ids.company, employeeId: ids.empLeave, branchId: ids.branchA, active: true });
    await employeeAuth.setEmployeePin({ companyId: ids.company, employeeId: ids.empLeave, pin: "258036", actorUser: await models.User.findByPk(ids.admin) });
    const leaveDenied = await request("POST", "/operator/verify", { body: { employeeCode: `${namespace}-LEAVE`, pin: "258036", branchId: ids.branchA, requestedLevel: 2 } });
    expectError(leaveDenied, 403, "EMPLOYEE_VERIFICATION_FAILED");

    await models.Employee.create({ id: ids.empInactive, companyId: ids.company, employeeCode: `${namespace}-INACTIVE`, employeeCodeNormalized: `${namespace}-INACTIVE`.toUpperCase(), name: "Inactive", role: "Sales", branch: "A", branchId: ids.branchA, status: "inactive" });
    await models.EmployeeBranchAccess.create({ id: `EBA-${namespace}-INACTIVE`, companyId: ids.company, employeeId: ids.empInactive, branchId: ids.branchA, active: true });
    await employeeAuth.setEmployeePin({ companyId: ids.company, employeeId: ids.empInactive, pin: "258036", actorUser: await models.User.findByPk(ids.admin) });
    const inactiveDenied = await request("POST", "/operator/verify", { body: { employeeCode: `${namespace}-INACTIVE`, pin: "258036", branchId: ids.branchA, requestedLevel: 1 } });
    expectError(inactiveDenied, 403, "EMPLOYEE_VERIFICATION_FAILED");

    for (let i = 0; i < 4; i++) {
      const fail = await request("POST", "/operator/verify", { body: { employeeCode: "EMP-A1", pin: "963852", branchId: ids.branchA, requestedLevel: 1 } });
      expectError(fail, 403, "EMPLOYEE_VERIFICATION_FAILED");
    }
    const lock = await request("POST", "/operator/verify", { body: { employeeCode: "EMP-A1", pin: "963852", branchId: ids.branchA, requestedLevel: 1 } });
    expectError(lock, 423, "EMPLOYEE_CREDENTIAL_LOCKED");
    const lockedCorrect = await request("POST", "/operator/verify", { body: { employeeCode: "EMP-A1", pin: "258036", branchId: ids.branchA, requestedLevel: 1 } });
    expectError(lockedCorrect, 423, "EMPLOYEE_CREDENTIAL_LOCKED");
    await credential.reload();
    assert.ok(Number(credential.failedAttemptCount) >= 5, "failure count reached threshold");
    await credential.update({ lockedUntil: new Date(Date.now() - 1000) });
    const postExpiry = await request("POST", "/operator/verify", { body: { employeeCode: "EMP-A1", pin: "258036", branchId: ids.branchA, requestedLevel: 2, requestedPermission: "reservations.view" } });
    assert.equal(postExpiry.status, 200, JSON.stringify(postExpiry.body));
    await credential.reload();
    assert.equal(Number(credential.failedAttemptCount), 0);
    assert.equal(credential.lockedUntil, null);

    await credential.update({ failedAttemptCount: 0, lockedUntil: null });
    const concurrent = await Promise.all(Array.from({ length: 6 }, () => request("POST", "/operator/verify", { body: { employeeCode: "EMP-A1", pin: "963851", branchId: ids.branchA, requestedLevel: 1 } })));
    assert.ok(concurrent.some((r) => r.status === 423), "concurrent failures trigger lockout");
    await credential.reload();
    assert.ok(Number(credential.failedAttemptCount) >= 5, "concurrent failures not lost");

    const attempts = await request("GET", `/employees/${employee.id}/verification-attempts?page=1&pageSize=50`);
    assert.equal(attempts.status, 200, JSON.stringify(attempts.body));
    assert.ok(attempts.body.data.items.some((item) => item.result === "success"));
    assert.ok(attempts.body.data.items.some((item) => item.result === "failure"));
    const serializedAttempts = JSON.stringify(attempts.body);
    assert.ok(!serializedAttempts.includes("258036") && !serializedAttempts.includes(credential.pinHash), "attempts contain no PIN/hash");
    const unknownCode = `${namespace}-UNKNOWN`;
    const unknown = await request("POST", "/operator/verify", { body: { employeeCode: unknownCode, pin: "258036", branchId: ids.branchA, requestedLevel: 1 } });
    expectError(unknown, 403, "EMPLOYEE_VERIFICATION_FAILED");
    const unknownAttempt = await models.EmployeeVerificationAttempt.findOne({ where: { companyId: ids.company, employeeCodeNormalized: unknownCode.toUpperCase(), employeeId: null } });
    assert.ok(unknownAttempt, "unknown code attempt recorded without Employee FK");

    const afterBusiness = await businessCounts();
    assertNoBusinessMutation(afterBusiness, "after");

    await cleanup();
    const finalBusiness = await businessCounts().catch(() => beforeBusiness);
    assertNoBusinessMutation(finalBusiness, "final");
    const pollution = await models.sequelize.query(`
      SELECT
        (SELECT count(*) FROM employee_verification_attempts WHERE company_id=:company) +
        (SELECT count(*) FROM employee_credentials WHERE company_id=:company) +
        (SELECT count(*) FROM employee_branch_access WHERE company_id=:company) +
        (SELECT count(*) FROM employee_role_assignments WHERE company_id=:company) +
        (SELECT count(*) FROM employee_permission_grants WHERE company_id=:company) +
        (SELECT count(*) FROM employee_permission_denials WHERE company_id=:company) +
        (SELECT count(*) FROM employees WHERE company_id=:company) +
        (SELECT count(*) FROM users WHERE company_id=:company) +
        (SELECT count(*) FROM roles WHERE company_id=:company) +
        (SELECT count(*) FROM branches WHERE company_id=:company) +
        (SELECT count(*) FROM companies WHERE id=:company) AS count
    `, { replacements: { company: ids.company } });
    assert.equal(Number(pollution[0][0].count), 0, "namespace cleanup");
    console.log("LIVE TESTS EXECUTED");
    console.log("EMPLOYEE AUTHORIZATION FOUNDATION PASSED");
    console.log("No persistent test pollution detected");
  } catch (error) {
    try { await cleanup(); } catch (_) {}
    throw error;
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await models.sequelize.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
