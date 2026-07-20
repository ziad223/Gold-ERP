#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function staticContract() {
  const migration = read("backend/migrations/20260720020000-branch-system-account-roles.js");
  const customerMigration = read("backend/migrations/20260720030000-branch-customer-operational-isolation.js");
  const bootstrap = read("backend/src/services/company-bootstrap.service.js");
  const reservation = read("backend/src/services/reservation.service.js");
  const settings = read("app/[locale]/(dashboard)/settings/page.tsx");
  const controller = read("backend/src/controllers/erp.controller.js");
  const routes = read("backend/src/routes/erp.routes.js");
  const pos = read("app/[locale]/(dashboard)/pos/page.tsx");
  const account = read("backend/src/models/account.model.js");
  const role = read("backend/src/models/systemAccountRole.model.js");
  const count = fs.readdirSync(path.join(ROOT, "backend/migrations")).filter((name) => name.endsWith(".js")).length;
  const verifierCount = fs.readdirSync(path.join(ROOT, "scripts")).filter((name) => /^verify-.*\.js$/.test(name)).length;
  assert.equal(count, 47, "BRANCH-1 adds exactly two additive migrations");
  assert.equal(verifierCount, 66, "BRANCH-1 adds the 66th verifier");
  assert.ok(migration.includes("system_account_roles_company_branch_role_uq") && migration.includes("accounts_company_branch_idx"), "role mapping is unique per company/branch/role and accounts have a branch dimension");
  assert.ok(customerMigration.includes("branch_customers") && customerMigration.includes("branch_customers_company_branch_customer_uq"), "selected BranchCustomer model is additive and unique");
  assert.ok(account.includes("branchId") && role.includes("branchId"), "account and role models expose branch attribution");
  assert.ok(bootstrap.includes("bootstrapBranchAccounts") && bootstrap.includes("CUSTOMER_DEPOSIT_ROLE_MANUAL_REVIEW") && bootstrap.includes("branchReadinessReport"), "bootstrap is idempotent and ambiguous legacy mapping blocks/manual-reviews");
  assert.ok(reservation.includes("assertBranchCustomer") && reservation.includes("assertSameBranch") && reservation.includes("resolveSystemAccountRole(companyId, branchId"), "reservation is server-scoped to branch customer, asset, and protected role");
  assert.ok(!settings.includes("Reservation Advances Account") && !settings.includes("reservationAdvancesAccountId:"), "ordinary Settings has no editable deposit account selector");
  assert.ok(settings.includes("Branch reservation-deposit account status") && pos.includes("automatic branch setup"), "UI displays protected branch status instead of a selector");
  assert.ok(controller.includes("applyBranchReadScope") && controller.includes("applyBranchWriteScope") && controller.includes("BranchCustomer"), "generic customer/branch resource reads and writes are server-scoped");
  assert.ok(routes.includes("resolveAuthorizedBranchId(req, body.branchId") && routes.includes("/readiness/branches"), "POS and readiness resolve authoritative branch context server-side");
  assert.ok(routes.includes("GENERIC_INVENTORY_MUTATION_FORBIDDEN") && routes.includes("GENERIC_TRANSFER_MUTATION_FORBIDDEN"), "generic inventory guard and transfer prohibition remain");
  console.log("Branch isolation static contract: PASS");
}

async function runtimeContract() {
  if (process.env.NODE_ENV === "production" || process.env.RENDER || process.env.VERCEL) throw new Error("Refusing production verification");
  if (process.env.DB_NAME !== "darfus_erp_branch1_qa" || !["localhost", "127.0.0.1"].includes(process.env.DB_HOST) || String(process.env.DB_PORT) !== "5433") throw new Error("Verifier requires isolated localhost QA database");
  const models = require(path.join(ROOT, "backend/src/models"));
  const bootstrap = require(path.join(ROOT, "backend/src/services/company-bootstrap.service"));
  const scope = require(path.join(ROOT, "backend/src/services/branch-isolation.service"));
  const ns = `BRANCH1-QA-${Date.now()}`;
  const ids = { company: `CMP-${ns}`, a: `BR-${ns}-A`, b: `BR-${ns}-B`, customer: `CUS-${ns}`, asset: `AST-${ns}` };
  const permissionCountBefore = await models.Permission.count();
  try {
    await models.Company.create({ id: ids.company, businessName: ns, workspace: "qa", companySize: "small", country: "EG", currency: "EGP" });
    await models.Branch.bulkCreate([
      { id: ids.a, companyId: ids.company, name: `${ns} A`, code: `${ns}A`.slice(0, 30), type: "store", isActive: true },
      { id: ids.b, companyId: ids.company, name: `${ns} B`, code: `${ns}B`.slice(0, 30), type: "store", isActive: true },
    ]);
    const a1 = await bootstrap.bootstrapBranchAccounts(ids.company, ids.a);
    const a2 = await bootstrap.bootstrapBranchAccounts(ids.company, ids.a);
    const b1 = await bootstrap.bootstrapBranchAccounts(ids.company, ids.b);
    assert.equal(a1.created.length, 1, "A bootstrap creates one protected account");
    assert.equal(a2.alreadyPresent.length, 1, "A bootstrap is idempotent");
    assert.equal(b1.created.length, 1, "B bootstrap creates one protected account");
    const aAccount = await bootstrap.resolveSystemAccountRole(ids.company, ids.a, bootstrap.SYSTEM_ACCOUNT_ROLES.CUSTOMER_DEPOSIT_LIABILITY);
    const bAccount = await bootstrap.resolveSystemAccountRole(ids.company, ids.b, bootstrap.SYSTEM_ACCOUNT_ROLES.CUSTOMER_DEPOSIT_LIABILITY);
    assert.notEqual(aAccount.id, bAccount.id, "A/B have distinct deposit accounts");
    assert.equal(await models.JournalEntry.count({ where: { companyId: ids.company } }), 0, "bootstrap creates no journals");
    assert.equal(await models.CashTransaction.count({ where: { companyId: ids.company } }), 0, "bootstrap creates no cash transactions");
    await models.Customer.create({ id: ids.customer, companyId: ids.company, name: `${ns} Customer`, phone: `${Date.now()}`, status: "active" });
    await scope.createBranchCustomer({ companyId: ids.company, branchId: ids.a, customerId: ids.customer });
    await scope.assertBranchCustomer({ companyId: ids.company, branchId: ids.a, customerId: ids.customer });
    await assert.rejects(() => scope.assertBranchCustomer({ companyId: ids.company, branchId: ids.b, customerId: ids.customer }));
    await models.Asset.create({ id: ids.asset, companyId: ids.company, branchId: ids.a, name: `${ns} Asset`, type: "gold-piece", category: "qa", grossWeight: 1, netWeight: 1, price: 1, cost: 1, branch: `${ns} A`, location: "QA", barcode: `${ns}-BAR` });
    const asset = await models.Asset.findByPk(ids.asset);
    scope.assertSameBranch(asset, ids.a, "Asset");
    assert.throws(() => scope.assertSameBranch(asset, ids.b, "Asset"));
    const readiness = await bootstrap.branchReadinessReport(ids.company);
    assert.equal(readiness.branches.length, 2, "readiness reports both branches");
    assert.equal(await models.Permission.count(), permissionCountBefore, "verifier creates no permissions");
  } finally {
    await models.BranchCustomer.destroy({ where: { companyId: ids.company }, force: true });
    await models.Asset.destroy({ where: { companyId: ids.company }, force: true });
    await models.SystemAccountRole.destroy({ where: { companyId: ids.company }, force: true });
    await models.Account.destroy({ where: { companyId: ids.company }, force: true });
    await models.Customer.destroy({ where: { companyId: ids.company }, force: true });
    await models.Branch.destroy({ where: { companyId: ids.company }, force: true });
    await models.Company.destroy({ where: { id: ids.company }, force: true });
    await models.sequelize.close();
  }
  console.log("Branch isolation runtime contract: PASS");
}

(async () => { staticContract(); await runtimeContract(); console.log("BRANCH OPERATIONAL ISOLATION PASSED"); })().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
