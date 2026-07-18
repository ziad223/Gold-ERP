#!/usr/bin/env node
"use strict";

const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
process.chdir(ROOT);
process.env.NODE_ENV = "test";
require(path.join(ROOT, "backend", "node_modules", "dotenv")).config({ path: path.join(ROOT, "backend", ".env") });
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5433";
process.env.DB_NAME = "darfus_erp";

if (process.env.RENDER || process.env.VERCEL || process.env.DB_NAME !== "darfus_erp") {
  throw new Error("Refusing non-local HF6D browser QA target");
}

const bcrypt = require(path.join(ROOT, "backend", "node_modules", "bcryptjs"));
const { chromium } = require(path.join(ROOT, "node_modules", "playwright"));
const assert = require("node:assert/strict");
const models = require(path.join(ROOT, "backend", "src", "models"));
const employeeAuth = require(path.join(ROOT, "backend", "src", "services", "employee-authorization.service"));

const ns = "HF6D-BQA";
const ids = {
  company: `CMP-${ns}`,
  branch: `BR-${ns}`,
  admin: `USR-${ns}-ADMIN`,
  branchUser: `USR-${ns}-BRANCH`,
  employeeA: `EMP-${ns}-A`,
  employeeB: `EMP-${ns}-B`,
};

async function cleanup() {
  await models.EmployeeOperationalSession.destroy({ where: { companyId: ids.company }, force: true });
  await models.TechnicalAccountSession.destroy({ where: { userId: [ids.admin, ids.branchUser] }, force: true });
  await models.EmployeePermissionDenial.destroy({ where: { companyId: ids.company }, force: true });
  await models.EmployeePermissionGrant.destroy({ where: { companyId: ids.company }, force: true });
  await models.EmployeeRoleAssignment.destroy({ where: { companyId: ids.company }, force: true });
  await models.EmployeeBranchAccess.destroy({ where: { companyId: ids.company }, force: true });
  await models.EmployeeCredential.destroy({ where: { companyId: ids.company }, force: true });
  await models.EmployeeVerificationAttempt.destroy({ where: { companyId: ids.company }, force: true });
  await models.sequelize.query("DELETE FROM audit_logs WHERE company_id = :companyId", { replacements: { companyId: ids.company } });
  await models.Employee.destroy({ where: { companyId: ids.company }, force: true });
  await models.User.destroy({ where: { id: [ids.admin, ids.branchUser] }, force: true });
  await models.Branch.destroy({ where: { id: ids.branch }, force: true });
  await models.Company.destroy({ where: { id: ids.company }, force: true });
}

async function setup() {
  await cleanup();
  const [customersView, inventoryView] = await Promise.all([
    models.Permission.findOne({ where: { name: "customers.view" } }),
    models.Permission.findOne({ where: { name: "inventory.view" } }),
  ]);
  if (!customersView || !inventoryView) throw new Error("Required permission catalog entries are missing");

  await models.Company.create({ id: ids.company, businessName: ns, workspace: ns.toLowerCase(), currency: "AED", country: "AE" });
  await models.Branch.create({ id: ids.branch, companyId: ids.company, name: `${ns} Branch`, code: ns, type: "store", isActive: true });
  await models.User.bulkCreate([
    { id: ids.admin, companyId: ids.company, accountType: "super_admin", firstName: ns, lastName: "Admin", email: "hf6d-bqa-admin@example.test", password: await bcrypt.hash("Bqa-Admin-Only!", 4), role: "admin", isActive: true },
    { id: ids.branchUser, companyId: ids.company, branchId: ids.branch, accountType: "branch_shell", firstName: ns, lastName: "Branch", email: "hf6d-bqa-branch@example.test", password: await bcrypt.hash("Bqa-Branch-Only!", 4), role: "sales", isActive: true },
  ]);
  await models.Employee.bulkCreate([
    { id: ids.employeeA, companyId: ids.company, employeeCode: "HF6D-BQA-A", employeeCodeNormalized: "HF6D-BQA-A", name: "HF6D BQA Cashier", role: "Operator", branch: ids.branch, branchId: ids.branch, status: "present" },
    { id: ids.employeeB, companyId: ids.company, employeeCode: "HF6D-BQA-B", employeeCodeNormalized: "HF6D-BQA-B", name: "HF6D BQA Inventory", role: "Operator", branch: ids.branch, branchId: ids.branch, status: "present" },
  ]);
  await models.EmployeeBranchAccess.bulkCreate([
    { id: `EBA-${ns}-A`, companyId: ids.company, employeeId: ids.employeeA, branchId: ids.branch, active: true },
    { id: `EBA-${ns}-B`, companyId: ids.company, employeeId: ids.employeeB, branchId: ids.branch, active: true },
  ]);
  const admin = await models.User.findByPk(ids.admin);
  await employeeAuth.setEmployeePin({ companyId: ids.company, employeeId: ids.employeeA, pin: "864210", actorUser: admin });
  await employeeAuth.setEmployeePin({ companyId: ids.company, employeeId: ids.employeeB, pin: "246801", actorUser: admin });
  await employeeAuth.updateEmployeeAuthorization({ companyId: ids.company, employeeId: ids.employeeA, actorUser: admin, grantPermissionIds: [customersView.id], reason: "HF6D BQA customer access" });
  await employeeAuth.updateEmployeeAuthorization({ companyId: ids.company, employeeId: ids.employeeB, actorUser: admin, grantPermissionIds: [inventoryView.id], reason: "HF6D BQA inventory access" });
}

async function inspectLogin() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:3000/en/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(1_000);
    console.log(JSON.stringify({
      url: page.url(),
      inputs: await page.locator("input").evaluateAll((nodes) => nodes.map((node) => ({ type: node.type, name: node.name, placeholder: node.placeholder, aria: node.getAttribute("aria-label") }))),
      buttons: await page.getByRole("button").allTextContents(),
    }));
  } finally {
    await browser.close();
  }
}

async function signIn(page, email, password) {
  await page.goto("http://localhost:3000/en/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in to DARFUS" }).click();
  await page.waitForTimeout(1_000);
}

async function qa() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await signIn(page, "hf6d-bqa-branch@example.test", "Bqa-Branch-Only!");

    const inline = page.locator('[data-employee-verification-form="inline"]');
    console.log(JSON.stringify({
      stage: "branch-login",
      url: page.url(),
      inlineCount: await inline.count(),
      buttons: await page.getByRole("button").allTextContents(),
      pageText: (await page.locator("main").count()) ? await page.locator("main").innerText() : "",
    }));
    assert.equal(await inline.count(), 1, "Branch Account safe shell must have exactly one inline verification form");
    assert.equal(await inline.isVisible(), true, "inline verification form must be visible after Branch Account login");
    assert.equal(await inline.locator("input").count(), 2, "inline form must expose code and PIN inputs");
    assert.equal(await page.getByRole("button", { name: "Verify Employee" }).count(), 1, "inline form must expose a verify action");

    const inlineInputs = inline.locator("input");
    await inlineInputs.nth(0).fill("HF6D-BQA-A");
    await inlineInputs.nth(1).fill("000000");
    await page.getByRole("button", { name: "Verify Employee" }).click();
    await page.waitForTimeout(500);
    assert.equal(await page.getByText("Employee code or PIN is incorrect", { exact: true }).count(), 1, "invalid PIN must return a controlled generic error");

    await inlineInputs.nth(1).fill("864210");
    await page.getByRole("button", { name: "Verify Employee" }).click();
    await page.waitForTimeout(1_000);
    assert.equal(await page.getByText("HF6D BQA Cashier", { exact: true }).count() > 0, true, "verified Employee identity must render in the operator bar");
    assert.equal(await page.locator('[data-employee-verification-form="inline"]').count(), 0, "inline form must close after verification");

    const statusButton = page.getByRole("button", { name: "Current Employee status" });
    assert.equal(await statusButton.count(), 1, "active Employee must expose an operator control");
    await statusButton.click();
    const changeButton = page.getByRole("button", { name: "Change Employee" });
    const endButton = page.getByRole("button", { name: "End Employee Session" });
    assert.equal(await changeButton.count(), 1, "Change Employee must be available after verification");
    assert.equal(await endButton.count(), 1, "End Employee Session must be available after verification");
    await changeButton.click();
    const dialog = page.locator('[data-employee-verification-form="dialog"]');
    assert.equal(await dialog.count(), 1, "Change Employee must use the shared dialog verification form");
    const dialogInputs = dialog.locator("input");
    await dialogInputs.nth(0).fill("HF6D-BQA-B");
    await dialogInputs.nth(1).fill("246801");
    await dialog.getByRole("button", { name: "Verify Employee" }).click();
    await page.waitForTimeout(1_000);
    assert.equal(await page.getByText("HF6D BQA Inventory", { exact: true }).count() > 0, true, "changing Employee must replace the active authorization");

    await statusButton.click();
    await endButton.click();
    await page.waitForTimeout(500);
    assert.equal(await page.locator('[data-employee-verification-form="inline"]').count(), 1, "ending Employee session must return to a usable inline verification shell");

    await page.goto("http://localhost:3000/ar/dashboard", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(500);
    const arabicInline = page.locator('[data-employee-verification-form="inline"]');
    assert.equal(await arabicInline.count(), 1, "Arabic Branch Account safe shell must retain the inline form");
    assert.equal(await page.getByText("اختر موظفًا للبدء", { exact: true }).count(), 1, "Arabic safe-shell title must render");
    const mobilePage = await context.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto("http://localhost:3000/en/dashboard", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await mobilePage.waitForTimeout(500);
    assert.equal(await mobilePage.locator('[data-employee-verification-form="inline"]').count(), 1, "mobile safe shell must retain the inline form");
    assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "mobile safe shell must not overflow horizontally");

    const adminPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await signIn(adminPage, "hf6d-bqa-admin@example.test", "Bqa-Admin-Only!");
    assert.equal(await adminPage.locator('[data-employee-verification-shell="true"]').count(), 0, "Super Admin must remain Employee-verification-free");
    await context.close();
    await adminPage.context().close();
  } finally {
    await browser.close();
  }
}

(async () => {
  try {
    if (process.argv[2] === "setup") await setup();
    else if (process.argv[2] === "cleanup") await cleanup();
    else if (process.argv[2] === "inspect") await inspectLogin();
    else if (process.argv[2] === "qa") await qa();
    else throw new Error("Use setup, cleanup, inspect, or qa");
    console.log(`HF6D BQA ${process.argv[2]} complete`);
  } finally {
    await models.sequelize.close();
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
