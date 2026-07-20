#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function assertContains(source, needle, label) {
  assert.ok(source.includes(needle), label);
}

function assertNotContains(source, needle, label) {
  assert.ok(!source.includes(needle), label);
}

function staticContract() {
  const route = read("backend/src/routes/employee-authorization.routes.js");
  const service = read("backend/src/services/employee-authorization.service.js");
  const employeePage = read("app/[locale]/(dashboard)/employees/[id]/page.tsx");
  const types = read("lib/types.ts");
  const verifierFiles = fs.readdirSync(path.join(ROOT, "scripts")).filter((name) => /^verify-.*\.js$/.test(name));
  const migrationFiles = fs.readdirSync(path.join(ROOT, "backend", "migrations")).filter((name) => name.endsWith(".js"));

  assertContains(route, "assignableCatalog", "Employee permission response includes full assignable catalog");
  assertContains(route, "effectiveSources", "Employee permission response includes source explanation");
  assertContains(route, "models.Permission.findAll({ order: [[\"module\", \"ASC\"], [\"action\", \"ASC\"], [\"name\", \"ASC\"]] })", "catalog uses central Permission table with stable ordering");
  assertContains(route, "ROLE_AND_DIRECT_GRANT", "source contract includes role plus direct grant");
  assertContains(route, "DENIED", "source contract includes direct denial");
  assertContains(service, "const effective = new Set([...rolePermissions, ...directGrantNames]);", "effective permission formula includes role and direct grant");
  assertContains(service, "for (const denied of directDenialNames) effective.delete(denied);", "direct denial is authoritative");
  assertContains(employeePage, "permissionState?.assignableCatalog", "Employee UI uses assignable catalog");
  assertContains(employeePage, "Direct denial overrides role and direct grant", "English denial precedence message is visible");
  assertContains(employeePage, "المنع المباشر يتجاوز الدور والسماح المباشر", "Arabic denial precedence message is visible");
  assertContains(types, "EmployeePermissionCatalogItem", "frontend type has catalog item contract");
  assertNotContains(employeePage, "No current direct permission rows", "old false zero-options state is removed");
  assert.equal(migrationFiles.length, 47, "BRANCH-1 adds the two authorized branch-isolation migrations");
  assert.ok(migrationFiles.includes("20260720010000-system-account-roles.js"), "RESET-1 authorized migration is present");
  assert.equal(new Set(migrationFiles.map((file) => file.slice(0, file.indexOf("-")))).size, migrationFiles.length, "migration numbering has no duplicates");
  assert.equal(verifierFiles.length, 66, `expected 66 verifier files after BRANCH-1, found ${verifierFiles.length}`);
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

models.sequelize.options.logging = false;

const ns = `HF6B-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const pin = "864209";
const ids = {
  company: `CMP-${ns}`,
  otherCompany: `CMP-${ns}-OTHER`,
  branch: `BR-${ns}-A`,
  otherBranch: `BR-${ns}-O`,
  admin: `USR-${ns}-ADMIN`,
  limited: `USR-${ns}-LIMITED`,
  branchUser: `USR-${ns}-BRANCH`,
  otherAdmin: `USR-${ns}-OTHER-ADMIN`,
  employee: `EMP-${ns}-E`,
  otherEmployee: `EMP-${ns}-OE`,
  role: `ROLE-${ns}-POS`,
  device: `DS-${ns}-MAIN-0001`.slice(0, 80),
  staleDevice: `DS-${ns}-STALE-0001`.slice(0, 80)
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

async function request(method, pathname, { user = ids.admin, branchId = ids.branch, companyId = null, device = ids.device, body, headers = {} } = {}) {
  const reqHeaders = { Accept: "application/json", "Content-Type": "application/json", ...headers };
  if (user) reqHeaders.Authorization = `Bearer ${await token(user)}`;
  if (branchId) reqHeaders["X-Branch-ID"] = branchId;
  if (companyId) reqHeaders["X-Company-ID"] = companyId;
  if (device) reqHeaders["X-Device-Session-ID"] = device;
  const response = await fetch(`${baseUrl}/api/v1${pathname}`, {
    method,
    headers: reqHeaders,
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
    password: await bcrypt.hash("Verifier-HF6B!", 4),
    role,
    isActive: true
  });
}

async function setup() {
  const [posSell, salesView, inventoryView] = await Promise.all([
    models.Permission.findOne({ where: { name: "pos.sell" } }),
    models.Permission.findOne({ where: { name: "sales.view" } }),
    models.Permission.findOne({ where: { name: "inventory.view" } })
  ]);
  assert.ok(posSell && salesView && inventoryView, "required existing permissions are present");

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
  await models.Role.create({ id: ids.role, companyId: ids.company, name: `${ns} POS Role`, slug: `${ns.toLowerCase()}-pos`, description: "HF6B verifier", isSystem: false, isAdmin: false });
  await models.RolePermission.bulkCreate([
    { roleId: ids.role, permissionId: posSell.id },
    { roleId: ids.role, permissionId: salesView.id }
  ]);
  await models.Employee.bulkCreate([
    { id: ids.employee, companyId: ids.company, employeeCode: `${ns}-E`, employeeCodeNormalized: `${ns}-E`.toUpperCase(), name: `${ns} Employee`, role: "Cashier", branch: "A", branchId: ids.branch, status: "present" },
    { id: ids.otherEmployee, companyId: ids.otherCompany, employeeCode: `${ns}-OE`, employeeCodeNormalized: `${ns}-OE`.toUpperCase(), name: `${ns} Other Employee`, role: "Cashier", branch: "O", branchId: ids.otherBranch, status: "present" }
  ]);
  await models.EmployeeBranchAccess.bulkCreate([
    { id: `EBA-${ns}-A`, companyId: ids.company, employeeId: ids.employee, branchId: ids.branch, active: true },
    { id: `EBA-${ns}-O`, companyId: ids.otherCompany, employeeId: ids.otherEmployee, branchId: ids.otherBranch, active: true }
  ]);
  await employeeAuth.setEmployeePin({ companyId: ids.company, employeeId: ids.employee, pin, actorUser: await models.User.findByPk(ids.admin) });
  await employeeAuth.setEmployeePin({ companyId: ids.otherCompany, employeeId: ids.otherEmployee, pin, actorUser: await models.User.findByPk(ids.otherAdmin) });
  return { posSell, salesView, inventoryView };
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
  await models.RolePermission.destroy({ where: { roleId: ids.role } });
  await models.Role.destroy({ where: { id: ids.role } });
  await models.sequelize.query("DELETE FROM audit_logs WHERE company_id IN (:companies)", { replacements: { companies } });
  await models.Employee.destroy({ where: { companyId: companies }, force: true });
  await models.User.destroy({ where: { id: [ids.admin, ids.limited, ids.branchUser, ids.otherAdmin] }, force: true });
  await models.Branch.destroy({ where: { id: [ids.branch, ids.otherBranch] } });
  await models.Company.destroy({ where: { id: companies } });
}

async function pollutionCount() {
  const [rows] = await models.sequelize.query(`
    SELECT
      (SELECT COUNT(*) FROM companies WHERE id IN (:companies)) AS companies,
      (SELECT COUNT(*) FROM branches WHERE company_id IN (:companies)) AS branches,
      (SELECT COUNT(*) FROM users WHERE id LIKE :likeId OR email LIKE :likeEmail) AS users,
      (SELECT COUNT(*) FROM employees WHERE company_id IN (:companies)) AS employees,
      (SELECT COUNT(*) FROM employee_credentials WHERE company_id IN (:companies)) AS credentials,
      (SELECT COUNT(*) FROM employee_branch_access WHERE company_id IN (:companies)) AS branch_access,
      (SELECT COUNT(*) FROM employee_role_assignments WHERE company_id IN (:companies)) AS role_assignments,
      (SELECT COUNT(*) FROM employee_permission_grants WHERE company_id IN (:companies)) AS grants,
      (SELECT COUNT(*) FROM employee_permission_denials WHERE company_id IN (:companies)) AS denials,
      (SELECT COUNT(*) FROM employee_operational_sessions WHERE company_id IN (:companies)) AS operator_sessions,
      (SELECT COUNT(*) FROM technical_account_sessions WHERE company_id IN (:companies)) AS technical_sessions,
      (SELECT COUNT(*) FROM audit_logs WHERE company_id IN (:companies)) AS audit_logs
  `, {
    replacements: {
      companies: [ids.company, ids.otherCompany],
      likeId: `%${ns}%`,
      likeEmail: `%${ns.toLowerCase()}%`
    }
  });
  return rows[0];
}

function assertZeroPollution(counts) {
  for (const [key, value] of Object.entries(counts)) {
    assert.equal(Number(value || 0), 0, `HF6B fixture pollution remains in ${key}`);
  }
}

async function runtimeContract() {
  const permissionCount = await models.Permission.count();
  assert.equal(permissionCount, 128, "permission count remains 128");
  const { posSell, salesView, inventoryView } = await setup();

  const limitedRead = await request("GET", `/employees/${ids.employee}/permissions`, { user: ids.limited });
  expectError(limitedRead, 403, "FORBIDDEN");

  const wrongCompany = await request("GET", `/employees/${ids.otherEmployee}/permissions`, { user: ids.admin });
  expectError(wrongCompany, 404, "RESOURCE_NOT_FOUND");

  const zero = await request("GET", `/employees/${ids.employee}/permissions`);
  assert.equal(zero.status, 200, JSON.stringify(zero.body));
  assert.equal(zero.body.data.assignableCatalog.length, permissionCount, "zero-authorization employee still receives full catalog");
  assert.equal(new Set(zero.body.data.assignableCatalog.map((permission) => permission.name)).size, permissionCount, "catalog has no duplicate names");
  const zeroAgain = await request("GET", `/employees/${ids.employee}/permissions`);
  assert.equal(zeroAgain.status, 200, JSON.stringify(zeroAgain.body));
  assert.deepEqual(
    zero.body.data.assignableCatalog.map((permission) => permission.name),
    zeroAgain.body.data.assignableCatalog.map((permission) => permission.name),
    "catalog ordering is stable across repeated reads"
  );
  assert.equal(zero.body.data.grants.length, 0);
  assert.equal(zero.body.data.denials.length, 0);
  assert.equal(zero.body.data.effectivePermissions.length, 0);
  assert.equal(zero.body.data.effectiveSources.find((row) => row.name === "pos.sell").source, "NOT_GRANTED");

  const grant = await request("PUT", `/employees/${ids.employee}/permissions`, {
    body: { roleIds: [], grantPermissionIds: [inventoryView.id], denialPermissionIds: [], reason: "HF6B direct grant" }
  });
  assert.equal(grant.status, 200, JSON.stringify(grant.body));
  assert.ok(grant.body.data.authorization.directGrantNames.includes("inventory.view"), "direct grant is separate");
  assert.ok(grant.body.data.authorization.effectivePermissionNames.includes("inventory.view"), "direct grant becomes effective");
  assert.equal(grant.body.data.effectiveSources.find((row) => row.name === "inventory.view").source, "DIRECT_GRANT");

  const roleAllow = await request("PUT", `/employees/${ids.employee}/permissions`, {
    body: { roleIds: [ids.role], grantPermissionIds: [inventoryView.id], denialPermissionIds: [], reason: "HF6B role allow" }
  });
  assert.equal(roleAllow.status, 200, JSON.stringify(roleAllow.body));
  assert.ok(roleAllow.body.data.authorization.rolePermissionNames.includes("pos.sell"), "role permission resolves");
  assert.ok(roleAllow.body.data.authorization.effectivePermissionNames.includes("pos.sell"), "role allow is effective");

  const verified = await request("POST", "/operator/verify", {
    user: ids.branchUser,
    body: { employeeCode: `${ns}-E`, pin, branchId: ids.branch, requestedPermission: "pos.sell", requestedOperation: "hf6b-pos" }
  });
  assert.equal(verified.status, 200, JSON.stringify(verified.body));
  assert.equal(verified.body.data.authorization.allowed, true);

  const staleSession = await request("POST", "/operator/verify", {
    user: ids.branchUser,
    device: ids.staleDevice,
    body: { employeeCode: `${ns}-E`, pin, branchId: ids.branch }
  });
  assert.equal(staleSession.status, 200, JSON.stringify(staleSession.body));

  const denyRole = await request("PUT", `/employees/${ids.employee}/permissions`, {
    body: { roleIds: [ids.role], grantPermissionIds: [inventoryView.id], denialPermissionIds: [posSell.id], reason: "HF6B deny role" }
  });
  assert.equal(denyRole.status, 200, JSON.stringify(denyRole.body));
  assert.ok(!denyRole.body.data.authorization.effectivePermissionNames.includes("pos.sell"), "direct denial blocks role allow");
  assert.equal(denyRole.body.data.effectiveSources.find((row) => row.name === "pos.sell").source, "DENIED");

  const staleCurrent = await request("GET", "/operator/current", { user: ids.branchUser, device: ids.staleDevice });
  assert.equal(staleCurrent.status, 200, JSON.stringify(staleCurrent.body));
  assert.equal(staleCurrent.body.data.active, false, "technical Branch Account session remains while Employee session becomes stale");
  assert.equal(staleCurrent.body.data.reason, "OPERATOR_SESSION_STALE_AUTHORIZATION");

  const deniedVerify = await request("POST", "/operator/verify", {
    user: ids.branchUser,
    device: ids.staleDevice,
    body: { employeeCode: `${ns}-E`, pin, branchId: ids.branch, requestedPermission: "pos.sell", requestedOperation: "hf6b-denied" }
  });
  expectError(deniedVerify, 403, "EMPLOYEE_PERMISSION_DENIED");

  const denialOverGrant = await request("PUT", `/employees/${ids.employee}/permissions`, {
    body: { roleIds: [], grantPermissionIds: [posSell.id], denialPermissionIds: [posSell.id], reason: "HF6B deny direct grant" }
  });
  assert.equal(denialOverGrant.status, 200, JSON.stringify(denialOverGrant.body));
  assert.ok(denialOverGrant.body.data.authorization.directGrantNames.includes("pos.sell"), "overlapping direct grant is recorded");
  assert.ok(denialOverGrant.body.data.authorization.directDenialNames.includes("pos.sell"), "overlapping direct denial is recorded");
  assert.ok(!denialOverGrant.body.data.authorization.effectivePermissionNames.includes("pos.sell"), "direct denial blocks direct grant");

  const restoreAllow = await request("PUT", `/employees/${ids.employee}/permissions`, {
    body: { roleIds: [], grantPermissionIds: [posSell.id], denialPermissionIds: [], reason: "HF6B remove denial" }
  });
  assert.equal(restoreAllow.status, 200, JSON.stringify(restoreAllow.body));
  assert.ok(restoreAllow.body.data.authorization.effectivePermissionNames.includes("pos.sell"), "removing denial restores remaining direct allow");

  const reverify = await request("POST", "/operator/verify", {
    user: ids.branchUser,
    device: ids.staleDevice,
    body: { employeeCode: `${ns}-E`, pin, branchId: ids.branch, requestedPermission: "pos.sell", requestedOperation: "hf6b-restored" }
  });
  assert.equal(reverify.status, 200, JSON.stringify(reverify.body));

  const missingPermission = await request("PUT", `/employees/${ids.employee}/permissions`, {
    body: { roleIds: [], grantPermissionIds: ["PERM-HF6B-MISSING"], denialPermissionIds: [], reason: "HF6B missing permission" }
  });
  expectError(missingPermission, 422, "VALIDATION_FAILED");

  const duplicateSave = await request("PUT", `/employees/${ids.employee}/permissions`, {
    body: { roleIds: [], grantPermissionIds: [posSell.id, posSell.id], denialPermissionIds: [], reason: "HF6B duplicate save" }
  });
  assert.equal(duplicateSave.status, 200, JSON.stringify(duplicateSave.body));
  assert.equal(duplicateSave.body.data.authorization.directGrantNames.filter((name) => name === "pos.sell").length, 1, "duplicate grants are idempotent");

  const noFinalAllow = await request("PUT", `/employees/${ids.employee}/permissions`, {
    body: { roleIds: [], grantPermissionIds: [], denialPermissionIds: [], reason: "HF6B remove final allow" }
  });
  assert.equal(noFinalAllow.status, 200, JSON.stringify(noFinalAllow.body));
  assert.ok(!noFinalAllow.body.data.authorization.effectivePermissionNames.includes("pos.sell"), "removing final allow removes access");

  const deniedRouteSession = await request("POST", "/operator/verify", {
    user: ids.branchUser,
    device: ids.staleDevice,
    body: { employeeCode: `${ns}-E`, pin, branchId: ids.branch }
  });
  assert.equal(deniedRouteSession.status, 200, JSON.stringify(deniedRouteSession.body));

  const deniedCheckout = await request("POST", "/pos/checkout", {
    user: ids.branchUser,
    device: ids.staleDevice,
    body: { branchId: ids.branch, idempotencyKey: `HF6B-${ns}-DENIED` }
  });
  expectError(deniedCheckout, 403, "OPERATOR_PERMISSION_DENIED");

  const allowAgain = await request("PUT", `/employees/${ids.employee}/permissions`, {
    body: { roleIds: [], grantPermissionIds: [posSell.id], denialPermissionIds: [], reason: "HF6B allow backend route" }
  });
  assert.equal(allowAgain.status, 200, JSON.stringify(allowAgain.body));
  const routeVerify = await request("POST", "/operator/verify", {
    user: ids.branchUser,
    device: ids.staleDevice,
    body: { employeeCode: `${ns}-E`, pin, branchId: ids.branch }
  });
  assert.equal(routeVerify.status, 200, JSON.stringify(routeVerify.body));
  const allowedCheckoutValidation = await request("POST", "/pos/checkout", {
    user: ids.branchUser,
    device: ids.staleDevice,
    body: { branchId: ids.branch, idempotencyKey: `HF6B-${ns}-ALLOWED` }
  });
  assert.notEqual(codeOf(allowedCheckoutValidation), "OPERATOR_PERMISSION_DENIED", "backend route passed Employee permission gate before business validation");

  const crossBranchVerify = await request("POST", "/operator/verify", {
    user: ids.branchUser,
    branchId: ids.branch,
    device: `DS-${ns}-WRONG`.slice(0, 80),
    body: { employeeCode: `${ns}-E`, pin, branchId: ids.otherBranch }
  });
  assert.equal(crossBranchVerify.status, 403, JSON.stringify(crossBranchVerify.body));
  assert.ok(["BRANCH_ACCOUNT_FIXED_SCOPE", "EMPLOYEE_BRANCH_ACCESS_DENIED"].includes(codeOf(crossBranchVerify)), "wrong-branch operator verify is denied");

  const auditLogs = await models.AuditLog.findAll({ where: { companyId: ids.company } });
  assert.ok(auditLogs.some((row) => row.action === "employee.authorization.updated" && !JSON.stringify(row.toJSON()).includes(pin)), "authorization audit exists without PIN");
  assert.equal(await models.Permission.count(), 128, "permission count remains unchanged after verifier");
}

(async () => {
  try {
    server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    await cleanup().catch(() => {});
    await runtimeContract();
    await cleanup();
    assertZeroPollution(await pollutionCount());
    console.log("EMPLOYEE PERMISSION CATALOG WIRING PASSED");
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await models.sequelize.close();
  }
})().catch(async (error) => {
  try { await cleanup(); } catch (_) {}
  console.error(error);
  process.exit(1);
});
