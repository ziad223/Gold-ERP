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
  const approvedName = "darfus_erp_branch1_qa";
  if (process.env.DB_NAME !== approvedName) throw new Error(`Refusing DB ${process.env.DB_NAME || "<missing>"}`);
  if (!["localhost", "127.0.0.1"].includes(process.env.DB_HOST)) throw new Error(`Refusing DB host ${process.env.DB_HOST || "<missing>"}`);
  if (String(process.env.DB_PORT) !== "5433") throw new Error(`Refusing DB port ${process.env.DB_PORT || "<missing>"}`);
  if (process.env.DATABASE_URL) {
    let target;
    try { target = new URL(process.env.DATABASE_URL); } catch { throw new Error("Refusing malformed DATABASE_URL"); }
    if (!['postgres:', 'postgresql:'].includes(target.protocol) || !["localhost", "127.0.0.1"].includes(target.hostname) || target.port !== "5433" || target.pathname !== `/${approvedName}`) {
      throw new Error("Refusing DATABASE_URL outside the exact isolated QA target");
    }
  }
}

function staticContract() {
  const page = read("app/[locale]/(dashboard)/settings/users/page.tsx");
  const hook = read("hooks/use-user-management.ts");
  const service = read("backend/src/services/system-account.service.js");
  const routes = read("backend/src/routes/system-account.routes.js");
  const employeePage = read("app/[locale]/(dashboard)/employees/[id]/page.tsx");
  const pkg = JSON.parse(read("package.json"));
  const verifierFiles = fs.readdirSync(path.join(ROOT, "scripts")).filter((name) => /^verify-.*\.js$/.test(name));
  const migrationFiles = fs.readdirSync(path.join(ROOT, "backend", "migrations")).filter((name) => name.endsWith(".js"));

  assert.ok(page.includes("Super Admin Security") && page.includes("Change Email") && page.includes("Change Password"), "Super Admin profile/security surface exists");
  assert.ok(page.includes("Create Branch Account") && page.includes("Edit Technical Account") && page.includes("Fixed Branch"), "Branch Account create/edit surface exists");
  assert.ok(page.includes("Employee permissions are not managed here"), "Account Center explicitly separates Employee permissions");
  assert.ok(!page.includes("Technical Roles and System Permissions") && !page.includes("Save Permissions") && !page.includes("permissionLabel("), "Account Center no longer embeds technical role permission editor");
  assert.ok(!hook.includes("/roles") && !hook.includes("/permissions") && !hook.includes("updateRolePermissions"), "Account Center hook no longer loads role/permission catalogs");
  assert.ok(employeePage.includes("assignableCatalog") && employeePage.includes("Direct denial overrides role and direct grant"), "Employee permission management remains in Employee detail");
  assert.ok(service.includes("Current password is required.") && service.includes("bcrypt.compare(currentPassword"), "self email change requires current password");
  assert.ok(service.includes("branch_account_branch_changed") && service.includes("assertNoBranchAccountForBranch(nextBranchId"), "Branch Account branch edit validates uniqueness and invalidates sessions");
  assert.ok(service.includes("passwordSet: true") && !service.includes("generatePolicyCompliantPassword") && !service.includes("return { account: safeUser(user), temporaryPassword"), "technical password operations do not generate or return plaintext passwords");
  assert.ok(routes.includes("/:id/reset-password") && routes.includes("/:id/change-email") && routes.includes("/:id/revoke-sessions"), "technical account action routes remain mounted");
  assert.equal(migrationFiles.length, 47, "BRANCH-1 adds the two authorized branch-isolation migrations");
  assert.equal(verifierFiles.length, 66, `expected 66 verifier files after BRANCH-1, found ${verifierFiles.length}`);
  assert.equal(pkg.scripts["verify:simple-account-center"], "node scripts/verify-simple-account-center.js", "package verifier registered");
}

assertLocalEnvironment();
staticContract();

const bcrypt = require(path.join(BACKEND, "node_modules/bcryptjs"));
const app = require(path.join(BACKEND, "src/app"));
const models = require(path.join(BACKEND, "src/models"));
models.sequelize.options.logging = false;

const ns = `HF6C-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ids = {
  company: `CMP-${ns}`,
  otherCompany: `CMP-${ns}-OTHER`,
  branchA: `BR-${ns}-A`,
  branchB: `BR-${ns}-B`,
  otherBranch: `BR-${ns}-OTHER`,
  superAdmin: `USR-${ns}-SUPER`,
  branchUser: null,
  secondBranchUser: null
};
const passwords = {
  superOld: "OwnerDesk!2345",
  superNew: "OwnerDesk!3456",
  branchOld: "SafeDesk!2345",
  branchNew: "SafeDesk!3456"
};
let server;
let baseUrl;

async function request(method, urlPath, { token, branchId = null, companyId = null, body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Accept-Language": "en",
    "X-Correlation-ID": `COR-${ns}`,
    "X-Device-Session-ID": `DS-${ns}`.slice(0, 120)
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (branchId) headers["X-Branch-ID"] = branchId;
  if (companyId) headers["X-Company-ID"] = companyId;
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

async function login(email, password) {
  return request("POST", "/auth/login", { body: { email, password } });
}

async function setupFixtures() {
  await models.Company.create({
    id: ids.company,
    businessName: `${ns} Company`,
    workspace: `${ns.toLowerCase()}-main`,
    companySize: "1-10",
    country: "AE",
    currency: "AED",
    city: "Dubai",
    region: "Dubai",
    address1: "HF6C",
    postalCode: "00000",
    branchName: "Main"
  });
  await models.Company.create({
    id: ids.otherCompany,
    businessName: `${ns} Other`,
    workspace: `${ns.toLowerCase()}-other`,
    companySize: "1-10",
    country: "AE",
    currency: "AED",
    city: "Dubai",
    region: "Dubai",
    address1: "HF6C",
    postalCode: "00000",
    branchName: "Other"
  });
  await models.Branch.bulkCreate([
    { id: ids.branchA, companyId: ids.company, name: `${ns} Branch A`, code: `${ns}-A`.slice(0, 24), type: "store", isActive: true },
    { id: ids.branchB, companyId: ids.company, name: `${ns} Branch B`, code: `${ns}-B`.slice(0, 24), type: "store", isActive: true },
    { id: ids.otherBranch, companyId: ids.otherCompany, name: `${ns} Other`, code: `${ns}-O`.slice(0, 24), type: "store", isActive: true }
  ]);
  await models.User.create({
    id: ids.superAdmin,
    companyId: ids.company,
    firstName: "HF6C",
    lastName: "Super",
    email: `${ns.toLowerCase()}-super@example.test`,
    role: "admin",
    isActive: true,
    accountType: "super_admin",
    password: await bcrypt.hash(passwords.superOld, 4),
    forcePasswordChange: false
  });
}

async function cleanup() {
  const replacements = { likeNs: "%hf6c%" };
  await models.sequelize.query("delete from audit_logs where lower(coalesce(id::text,'')) like :likeNs or lower(coalesce(source_document::text,'')) like :likeNs or lower(coalesce(description,'')) like :likeNs or lower(coalesce(user_id::text,'')) like 'usr-hf6c-%' or lower(coalesce(technical_user_id::text,'')) like 'usr-hf6c-%'", { replacements });
  await models.sequelize.query("delete from employee_operational_sessions where lower(id::text) like :likeNs or lower(session_user_id::text) like :likeNs or lower(company_id::text) like :likeNs or lower(coalesce(device_session_id::text,'')) like :likeNs", { replacements });
  await models.sequelize.query("delete from technical_account_sessions where lower(id::text) like :likeNs or lower(user_id::text) like :likeNs or lower(company_id::text) like :likeNs", { replacements });
  await models.sequelize.query("delete from user_roles where lower(user_id::text) like :likeNs", { replacements });
  await models.sequelize.query("delete from password_reset_tokens where lower(user_id::text) like :likeNs", { replacements });
  await models.sequelize.query("delete from email_change_tokens where lower(user_id::text) like :likeNs", { replacements });
  await models.sequelize.query("delete from users where lower(company_id::text) like :likeNs or lower(id::text) like :likeNs or lower(email) like :likeNs", { replacements });
  await models.sequelize.query("delete from branches where lower(company_id::text) like :likeNs or lower(id::text) like :likeNs", { replacements });
  await models.sequelize.query("delete from companies where lower(id::text) like :likeNs", { replacements });
}

async function pollutionCounts() {
  const sql = {
    users: "select count(*)::int c from users where lower(company_id::text) like 'cmp-hf6c-%' or lower(id::text) like '%hf6c%' or lower(coalesce(email::text,'')) like '%hf6c%'",
    branches: "select count(*)::int c from branches where lower(company_id::text) like 'cmp-hf6c-%' or lower(id::text) like 'br-hf6c-%'",
    companies: "select count(*)::int c from companies where lower(id::text) like 'cmp-hf6c-%'",
    technicalSessions: "select count(*)::int c from technical_account_sessions where lower(id::text) like '%hf6c%' or lower(user_id::text) like '%hf6c%' or lower(company_id::text) like 'cmp-hf6c-%'",
    operatorSessions: "select count(*)::int c from employee_operational_sessions where lower(id::text) like '%hf6c%' or lower(session_user_id::text) like '%hf6c%' or lower(company_id::text) like 'cmp-hf6c-%' or lower(coalesce(device_session_id::text,'')) like '%hf6c%'",
    auditLogs: "select count(*)::int c from audit_logs where lower(coalesce(id::text,'')) like '%hf6c%' or lower(coalesce(source_document::text,'')) like '%hf6c%' or lower(coalesce(description,'')) like '%hf6c%'"
  };
  const result = {};
  for (const [key, query] of Object.entries(sql)) {
    const [rows] = await models.sequelize.query(query);
    result[key] = rows[0].c;
  }
  return result;
}

async function verifyLiveContract() {
  await cleanup();
  await setupFixtures();
  server = await new Promise((resolve) => {
    const srv = http.createServer(app);
    srv.listen(0, "127.0.0.1", () => resolve(srv));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const superLogin = await login(`${ns.toLowerCase()}-super@example.test`, passwords.superOld);
  assert.equal(superLogin.status, 200, "Super Admin login succeeds");
  let superToken = superLogin.body.data.token;

  const deniedList = await request("GET", "/system-accounts");
  assert.equal(deniedList.status, 401, "unauthenticated account list denied");

  const missingBranch = await request("POST", "/system-accounts/branch-accounts", {
    token: superToken,
    body: { email: `${ns.toLowerCase()}-branch@example.test`, password: passwords.branchOld }
  });
  assert.equal(missingBranch.status, 422, "missing branch denied");
  assert.equal(missingBranch.body.code, "BRANCH_ACCOUNT_BRANCH_REQUIRED");

  const wrongCompanyBranch = await request("POST", "/system-accounts/branch-accounts", {
    token: superToken,
    body: { branchId: ids.otherBranch, email: `${ns.toLowerCase()}-branch@example.test`, password: passwords.branchOld }
  });
  assert.equal(wrongCompanyBranch.status, 422, "wrong-company branch denied");
  assert.equal(wrongCompanyBranch.body.code, "BRANCH_ACCOUNT_COMPANY_MISMATCH");

  const createBranch = await request("POST", "/system-accounts/branch-accounts", {
    token: superToken,
    body: { branchId: ids.branchA, email: `${ns.toLowerCase()}-branch@example.test`, password: passwords.branchOld, active: true }
  });
  assert.equal(createBranch.status, 201, "Branch Account create succeeds");
  assert.equal(createBranch.body.data.account.accountType, "branch_shell");
  assert.equal(createBranch.body.data.account.branchId, ids.branchA);
  assert.equal(createBranch.body.data.account.defaultEmployeeId, null);
  assert.equal(createBranch.body.data.passwordSet, true);
  assert.ok(!JSON.stringify(createBranch.body).includes(passwords.branchOld), "create response does not expose plaintext password");
  assert.ok(!JSON.stringify(createBranch.body).includes("pin"), "Branch Account response has no Employee PIN field");
  ids.branchUser = createBranch.body.data.account.id;

  const duplicateEmail = await request("POST", "/system-accounts/branch-accounts", {
    token: superToken,
    body: { branchId: ids.branchB, email: `${ns.toUpperCase()}-BRANCH@EXAMPLE.TEST`, password: passwords.branchOld }
  });
  assert.equal(duplicateEmail.status, 409, "duplicate email denied");
  assert.equal(duplicateEmail.body.code, "EMAIL_ALREADY_USED");

  const branchLogin = await login(`${ns.toLowerCase()}-branch@example.test`, passwords.branchOld);
  assert.equal(branchLogin.status, 200, "new Branch Account can log in");
  const oldBranchToken = branchLogin.body.data.token;

  const branchSelfList = await request("GET", "/system-accounts", { token: oldBranchToken, branchId: ids.branchA });
  assert.equal(branchSelfList.status, 403, "Branch Account cannot manage accounts");

  const emailEdit = await request("POST", `/system-accounts/${ids.branchUser}/change-email`, {
    token: superToken,
    body: { email: `${ns.toLowerCase()}-branch-new@example.test`, reason: "HF6C verifier email edit" }
  });
  assert.equal(emailEdit.status, 200, "Super Admin edits Branch Account email");

  const oldEmailLogin = await login(`${ns.toLowerCase()}-branch@example.test`, passwords.branchOld);
  assert.notEqual(oldEmailLogin.status, 200, "old Branch Account email cannot log in");
  const staleAfterEmail = await request("GET", "/auth/me", { token: oldBranchToken, branchId: ids.branchA });
  assert.equal(staleAfterEmail.status, 401, "old Branch Account session invalidated by email edit");

  const passwordReset = await request("POST", `/system-accounts/${ids.branchUser}/reset-password`, {
    token: superToken,
    body: { password: passwords.branchNew, reason: "HF6C verifier password reset" }
  });
  assert.equal(passwordReset.status, 200, "Super Admin sets Branch Account new password");
  assert.equal(passwordReset.body.data.passwordSet, true);
  assert.ok(!JSON.stringify(passwordReset.body).includes(passwords.branchNew), "password reset response does not expose plaintext password");

  const oldPasswordLogin = await login(`${ns.toLowerCase()}-branch-new@example.test`, passwords.branchOld);
  assert.notEqual(oldPasswordLogin.status, 200, "old Branch Account password rejected");
  const newPasswordLogin = await login(`${ns.toLowerCase()}-branch-new@example.test`, passwords.branchNew);
  assert.equal(newPasswordLogin.status, 200, "new Branch Account password accepted");
  const branchTokenBeforeBranchEdit = newPasswordLogin.body.data.token;

  const branchEdit = await request("PATCH", `/system-accounts/${ids.branchUser}`, {
    token: superToken,
    body: { branchId: ids.branchB, reason: "HF6C verifier branch reassignment" }
  });
  assert.equal(branchEdit.status, 200, "Branch Account branch can be edited by Super Admin");
  assert.equal(branchEdit.body.data.account.branchId, ids.branchB);
  const staleAfterBranchEdit = await request("GET", "/auth/me", { token: branchTokenBeforeBranchEdit, branchId: ids.branchA });
  assert.equal(staleAfterBranchEdit.status, 401, "Branch Account old session invalidated by branch edit");

  const reloginBranchB = await login(`${ns.toLowerCase()}-branch-new@example.test`, passwords.branchNew);
  assert.equal(reloginBranchB.status, 200, "Branch Account logs in after branch edit");
  assert.equal(reloginBranchB.body.data.user.accountScope.branchId, ids.branchB);

  const deactivate = await request("POST", `/system-accounts/${ids.branchUser}/deactivate`, {
    token: superToken,
    body: { reason: "HF6C verifier deactivate" }
  });
  assert.equal(deactivate.status, 200, "Branch Account deactivate succeeds");
  const inactiveLogin = await login(`${ns.toLowerCase()}-branch-new@example.test`, passwords.branchNew);
  assert.notEqual(inactiveLogin.status, 200, "inactive Branch Account cannot log in");
  const activate = await request("POST", `/system-accounts/${ids.branchUser}/activate`, {
    token: superToken,
    body: { reason: "HF6C verifier activate" }
  });
  assert.equal(activate.status, 200, "Branch Account activate succeeds");

  const selfEmailWithoutPassword = await request("POST", `/system-accounts/${ids.superAdmin}/change-email`, {
    token: superToken,
    body: { email: `${ns.toLowerCase()}-super-new@example.test` }
  });
  assert.equal(selfEmailWithoutPassword.status, 422, "self email change requires current password");

  const selfEmail = await request("POST", `/system-accounts/${ids.superAdmin}/change-email`, {
    token: superToken,
    body: { email: `${ns.toLowerCase()}-super-new@example.test`, currentPassword: passwords.superOld, reason: "HF6C self email" }
  });
  assert.equal(selfEmail.status, 200, "Super Admin changes own email with password confirmation");
  const staleSuper = await request("GET", "/auth/me", { token: superToken });
  assert.equal(staleSuper.status, 401, "Super Admin old session invalidated by own email change");
  const oldSuperEmailLogin = await login(`${ns.toLowerCase()}-super@example.test`, passwords.superOld);
  assert.notEqual(oldSuperEmailLogin.status, 200, "old Super Admin email rejected");
  const newSuperEmailLogin = await login(`${ns.toLowerCase()}-super-new@example.test`, passwords.superOld);
  assert.equal(newSuperEmailLogin.status, 200, "new Super Admin email accepted");
  superToken = newSuperEmailLogin.body.data.token;

  const selfPassword = await request("POST", "/auth/change-password", {
    token: superToken,
    body: { currentPassword: passwords.superOld, newPassword: passwords.superNew, confirmation: passwords.superNew }
  });
  assert.equal(selfPassword.status, 200, "Super Admin changes own password");
  const changedSuper = await models.User.findByPk(ids.superAdmin);
  assert.equal(await bcrypt.compare(passwords.superOld, changedSuper.password), false, "old Super Admin password no longer matches stored hash");
  const newSuperPasswordLogin = await login(`${ns.toLowerCase()}-super-new@example.test`, passwords.superNew);
  assert.equal(newSuperPasswordLogin.status, 200, "new Super Admin password accepted");

  const list = await request("GET", "/system-accounts", { token: newSuperPasswordLogin.body.data.token });
  assert.equal(list.status, 200, "Super Admin lists account center");
  assert.ok(!JSON.stringify(list.body).includes("directGrants") && !JSON.stringify(list.body).includes("directDenials"), "Account Center API does not return Employee permission fields");

  const countsBeforeCleanup = await pollutionCounts();
  assert.ok(Object.values(countsBeforeCleanup).some((value) => Number(value) > 0), "HF6C fixtures existed before cleanup");
}

(async () => {
  try {
    await verifyLiveContract();
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await cleanup();
    const counts = await pollutionCounts();
    for (const [key, value] of Object.entries(counts)) {
      assert.equal(Number(value || 0), 0, `HF6C fixture pollution remains in ${key}`);
    }
    await models.sequelize.close();
  }
  console.log("SIMPLE ACCOUNT CENTER PASSED");
})().catch(async (error) => {
  console.error(error.stack || error.message);
  try { if (server) await new Promise((resolve) => server.close(resolve)); } catch {}
  try { await cleanup(); await models.sequelize.close(); } catch {}
  process.exit(1);
});
