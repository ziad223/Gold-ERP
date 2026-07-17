#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const ROOT = path.resolve(__dirname, "..");
process.chdir(ROOT);
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5433";
process.env.DB_NAME = "darfus_erp";
process.env.DB_USER = "postgres";
process.env.DB_PASS = "postgres";

const bcrypt = require(path.join(ROOT, "backend/node_modules/bcryptjs"));
const models = require(path.join(ROOT, "backend/src/models"));
const employeeAuth = require(path.join(ROOT, "backend/src/services/employee-authorization.service"));
models.sequelize.options.logging = false;

const ns = `HF6B-BQA-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const password = `Verifier-${Date.now()}!Aa1`;
const pin = "246810";
const ids = {
  company: `CMP-${ns}`,
  branch: `BR-${ns}`,
  admin: `USR-${ns}-ADMIN`,
  branchUser: `USR-${ns}-BRANCH`,
  limited: `USR-${ns}-LIMITED`,
  employee: `EMP-${ns}`,
  device: `DS-${ns}-BROWSER-0001`.slice(0, 80)
};
const api = "http://localhost:8000/api/v1";

async function cleanup() {
  const companies = [ids.company];
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
  await models.User.destroy({ where: { id: [ids.admin, ids.branchUser, ids.limited] }, force: true });
  await models.Branch.destroy({ where: { id: ids.branch } });
  await models.Company.destroy({ where: { id: companies } });
}

async function setup() {
  await cleanup().catch(() => {});
  const posSell = await models.Permission.findOne({ where: { name: "pos.sell" } });
  assert.ok(posSell, "pos.sell permission exists");
  await models.Company.create({ id: ids.company, businessName: ns, workspace: ns.toLowerCase(), currency: "AED", country: "AE" });
  await models.Branch.create({ id: ids.branch, companyId: ids.company, name: `${ns} Branch`, code: `${ns}B`, type: "store", isActive: true });
  for (const user of [
    { id: ids.admin, type: "legacy", role: "admin", branch: null },
    { id: ids.branchUser, type: "branch_shell", role: "sales", branch: ids.branch },
    { id: ids.limited, type: "legacy", role: "sales", branch: null }
  ]) {
    await models.User.create({
      id: user.id,
      companyId: ids.company,
      branchId: user.branch,
      accountType: user.type,
      firstName: ns,
      lastName: user.id.slice(-6),
      email: `${user.id.toLowerCase()}@example.test`,
      password: await bcrypt.hash(password, 4),
      role: user.role,
      isActive: true
    });
  }
  await models.Employee.create({
    id: ids.employee,
    companyId: ids.company,
    employeeCode: `${ns}-E`,
    employeeCodeNormalized: `${ns}-E`.toUpperCase(),
    name: `${ns} Employee`,
    role: "Cashier",
    branch: "A",
    branchId: ids.branch,
    status: "present"
  });
  await models.EmployeeBranchAccess.create({ id: `EBA-${ns}`, companyId: ids.company, employeeId: ids.employee, branchId: ids.branch, active: true });
  await employeeAuth.setEmployeePin({ companyId: ids.company, employeeId: ids.employee, pin, actorUser: await models.User.findByPk(ids.admin) });
  return posSell;
}

async function login(id) {
  const response = await fetch(`${api}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "X-Device-Session-ID": ids.device },
    body: JSON.stringify({ email: `${id.toLowerCase()}@example.test`, password })
  });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  return body.data;
}

async function apiReq(method, pathname, auth, body) {
  const response = await fetch(`${api}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${auth.token}`,
      "X-Branch-ID": ids.branch,
      "X-Device-Session-ID": ids.device
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function seed(page, auth) {
  await page.addInitScript(({ authData, companyId, branchId, branchName, deviceId }) => {
    const user = { ...authData.user, companyId, branchId: authData.user.branchId || null };
    const company = { ...authData.company, id: companyId, branchId, branchName };
    localStorage.setItem("darfus-token-v1", authData.token);
    localStorage.setItem("darfus-refresh-v1", authData.refreshToken);
    localStorage.setItem("darfus-api-session-v1", JSON.stringify({ user, company }));
    localStorage.setItem("darfus-active-branch-id-v1", branchId);
    localStorage.setItem("darfus-active-branch-name-v1", branchName);
    localStorage.setItem("darfus-device-session-id-v1", deviceId);
  }, { authData: auth, companyId: ids.company, branchId: ids.branch, branchName: `${ns} Branch`, deviceId: ids.device });
}

(async () => {
  const posSell = await setup();
  const adminAuth = await login(ids.admin);
  const branchAuth = await login(ids.branchUser);
  const limitedAuth = await login(ids.limited);
  const dbEmployee = await models.Employee.findOne({ where: { id: ids.employee, companyId: ids.company }, raw: true });
  assert.ok(dbEmployee, "browser QA employee fixture exists before navigation");
  assert.equal(dbEmployee.id, ids.employee, "browser QA URL uses database Employee ID");
  assert.equal(dbEmployee.companyId, ids.company, "browser QA employee fixture company is correct");
  assert.equal(dbEmployee.branchId, ids.branch, "browser QA employee fixture branch is correct");
  const detailProbe = await apiReq("GET", `/employees/${ids.employee}`, adminAuth);
  assert.equal(detailProbe.status, 200, JSON.stringify(detailProbe.body));
  assert.equal(detailProbe.body?.data?.id, ids.employee, "Employee detail API returns intended fixture");
  const permissionProbe = await apiReq("GET", `/employees/${ids.employee}/permissions`, adminAuth);
  assert.equal(permissionProbe.status, 200, JSON.stringify(permissionProbe.body));
  assert.ok((permissionProbe.body?.data?.assignableCatalog || []).length > 0, "Employee permission API returns full catalog before navigation");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

  await seed(page, adminAuth);
  const initialVerify = await apiReq("POST", "/operator/verify", branchAuth, { employeeCode: `${ns}-E`, pin, branchId: ids.branch });
  assert.equal(initialVerify.status, 200, JSON.stringify(initialVerify.body));

  await page.goto(`http://127.0.0.1:3000/en/employees/${ids.employee}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  try {
    await page.getByRole("tab", { name: /Direct Permissions/i }).waitFor({ timeout: 60000 });
  } catch (error) {
    const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch((innerError) => `BODY_READ_FAILED: ${innerError.message}`);
    throw new Error(`Direct Permissions tab not visible. url=${page.url()} body=${bodyText.slice(0, 2000)}`);
  }
  await page.getByRole("tab", { name: /Direct Permissions/i }).click();
  await page.getByText("Direct Grants and Denials").waitFor({ timeout: 60000 });
  await page.getByText("Direct denial overrides role and direct grant").waitFor();
  await page.getByText("Process POS Sales").waitFor();
  await page.getByPlaceholder("Search permission name or module").fill("pos.sell");
  const row = page.locator("div").filter({ hasText: "Process POS Sales" }).filter({ hasText: "pos.sell" }).last();
  await row.locator("label").filter({ hasText: "Direct grant" }).locator("input[type=\"checkbox\"]").check();
  await page.getByRole("button", { name: /Save Permissions/i }).click();
  await page.getByText("Authorization updated").waitFor({ timeout: 30000 });

  const stale = await apiReq("GET", "/operator/current", branchAuth);
  assert.equal(stale.body.data.active, false, "authorization change stales existing Employee session");
  const reverify = await apiReq("POST", "/operator/verify", branchAuth, { employeeCode: `${ns}-E`, pin, branchId: ids.branch });
  assert.equal(reverify.status, 200, JSON.stringify(reverify.body));

  await row.locator("label").filter({ hasText: "Direct denial" }).locator("input[type=\"checkbox\"]").check();
  await page.getByRole("button", { name: /Save Permissions/i }).click();
  await page.getByText("Authorization updated").waitFor({ timeout: 30000 });
  const deniedSession = await apiReq("POST", "/operator/verify", branchAuth, { employeeCode: `${ns}-E`, pin, branchId: ids.branch });
  assert.equal(deniedSession.status, 200, JSON.stringify(deniedSession.body));
  const deniedCheckout = await apiReq("POST", "/pos/checkout", branchAuth, { branchId: ids.branch, idempotencyKey: `${ns}-DENY` });
  assert.equal(deniedCheckout.body.code || deniedCheckout.body.error?.code, "OPERATOR_PERMISSION_DENIED");

  await row.locator("label").filter({ hasText: "Direct denial" }).locator("input[type=\"checkbox\"]").uncheck();
  await row.locator("label").filter({ hasText: "Direct grant" }).locator("input[type=\"checkbox\"]").check();
  await page.getByRole("button", { name: /Save Permissions/i }).click();
  await page.getByText("Authorization updated").waitFor({ timeout: 30000 });
  const allowedSession = await apiReq("POST", "/operator/verify", branchAuth, { employeeCode: `${ns}-E`, pin, branchId: ids.branch });
  assert.equal(allowedSession.status, 200, JSON.stringify(allowedSession.body));
  const allowedCheckout = await apiReq("POST", "/pos/checkout", branchAuth, { branchId: ids.branch, idempotencyKey: `${ns}-ALLOW` });
  assert.notEqual(allowedCheckout.body.code || allowedCheckout.body.error?.code, "OPERATOR_PERMISSION_DENIED");

  const unauthorized = await apiReq("PUT", `/employees/${ids.employee}/permissions`, limitedAuth, { roleIds: [], grantPermissionIds: [posSell.id], denialPermissionIds: [] });
  assert.equal(unauthorized.status, 403, JSON.stringify(unauthorized.body));

  await page.goto(`http://127.0.0.1:3000/ar/employees/${ids.employee}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const arTab = "\u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629";
  const arText = "\u0627\u0644\u0645\u0646\u0639 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u064a\u062a\u062c\u0627\u0648\u0632 \u0627\u0644\u062f\u0648\u0631 \u0648\u0627\u0644\u0633\u0645\u0627\u062d \u0627\u0644\u0645\u0628\u0627\u0634\u0631";
  await page.getByRole("tab", { name: new RegExp(arTab) }).waitFor({ timeout: 60000 });
  await page.getByRole("tab", { name: new RegExp(arTab) }).click();
  await page.getByText(arText).waitFor({ timeout: 30000 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("input.input-base").first().fill("pos.sell");
  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
  assert.equal(noOverflow, true, "mobile permission UI has no horizontal overflow");
  assert.equal(errors.length, 0, errors.join("\n"));

  await browser.close();
  await cleanup();
  const [rows] = await models.sequelize.query(`
    SELECT
      (SELECT COUNT(*) FROM companies WHERE id = :company) AS companies,
      (SELECT COUNT(*) FROM users WHERE id LIKE :likeId) AS users,
      (SELECT COUNT(*) FROM employees WHERE company_id = :company) AS employees,
      (SELECT COUNT(*) FROM employee_credentials WHERE company_id = :company) AS credentials,
      (SELECT COUNT(*) FROM employee_permission_grants WHERE company_id = :company) AS grants,
      (SELECT COUNT(*) FROM employee_permission_denials WHERE company_id = :company) AS denials,
      (SELECT COUNT(*) FROM employee_operational_sessions WHERE company_id = :company) AS operator_sessions,
      (SELECT COUNT(*) FROM technical_account_sessions WHERE company_id = :company) AS technical_sessions
  `, { replacements: { company: ids.company, likeId: `%${ns}%` } });
  for (const [key, value] of Object.entries(rows[0])) assert.equal(Number(value), 0, `cleanup failed for ${key}`);
  await models.sequelize.close();
  console.log("HF6B BROWSER QA PASSED");
})().catch(async (error) => {
  try { await cleanup(); } catch (_) {}
  try { await models.sequelize.close(); } catch (_) {}
  console.error(error);
  process.exit(1);
});
