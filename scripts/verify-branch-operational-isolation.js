#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const ErpController = require(path.join(ROOT, "backend/src/controllers/erp.controller"));
const erpRouter = require(path.join(ROOT, "backend/src/routes/erp.routes"));

async function invokeCustomerCrud(controller, { companyId, branchId, id, method, body = {}, query = {} }) {
  let status = null;
  let payload = null;
  let forwarded = null;
  const req = {
    params: { id }, body, query, companyId, branchId, headers: {},
    user: { id: "USR-BRANCH1-VERIFY", firstName: "QA", lastName: "Verifier" },
  };
  const res = {
    status(code) { status = code; return this; },
    json(value) { payload = value; return value; },
  };
  await controller[method](req, res, (error) => { forwarded = error; });
  return { status, payload, error: forwarded };
}

async function invokeCustomerRoute(routePath, { companyId, branchId, id }) {
  const layer = erpRouter.stack.find((entry) => entry.route?.path === routePath);
  assert.ok(layer, `customer route ${routePath} is registered`);
  const handler = layer.route.stack.at(-1).handle;
  let status = null;
  let payload = null;
  let forwarded = null;
  const req = { params: { id }, body: {}, query: {}, companyId, branchId, headers: {}, user: { id: "USR-BRANCH1-VERIFY" } };
  const res = { status(code) { status = code; return this; }, json(value) { payload = value; return value; } };
  await handler(req, res, (error) => { forwarded = error; });
  return { status, payload, error: forwarded };
}

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
  assert.ok(controller.includes("requestedIdScope") && controller.includes("branchCustomerScope") && controller.includes("whereClause[Op.and]"), "generic by-id customer scope intersects requested ID with the branch relationship");
  for (const routePath of ["/customers/:id/invoices", "/customers/:id/statement", "/customers/:id/statement-v2", "/customers/:id/credit", "/customers/:id/credit/reconciliation", "/customers/:id/statement-v3", "/customers/:id/loyalty"]) {
    assert.ok(routes.includes(routePath) && routes.includes("requireBranchCustomerResource"), `${routePath} is bound to branch-scoped customer resolution`);
  }
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
  const ids = {
    company: `CMP-${ns}`, a: `BR-${ns}-A`, b: `BR-${ns}-B`,
    a1: `CUS-${ns}-A1`, a2: `CUS-${ns}-A2`, b1: `CUS-${ns}-B1`,
    invA1: `INV-${ns}-A1`, invA2: `INV-${ns}-A2`, invB1: `INV-${ns}-B1`, asset: `AST-${ns}`,
  };
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
    await models.Customer.bulkCreate([
      { id: ids.a1, companyId: ids.company, name: `${ns} A1`, phone: `${Date.now()}-1`, balance: 11, status: "active" },
      { id: ids.a2, companyId: ids.company, name: `${ns} A2`, phone: `${Date.now()}-2`, balance: 22, status: "active" },
      { id: ids.b1, companyId: ids.company, name: `${ns} B1`, phone: `${Date.now()}-3`, balance: 33, status: "active" },
    ]);
    await scope.createBranchCustomer({ companyId: ids.company, branchId: ids.a, customerId: ids.a1 });
    await scope.createBranchCustomer({ companyId: ids.company, branchId: ids.a, customerId: ids.a2 });
    await scope.createBranchCustomer({ companyId: ids.company, branchId: ids.b, customerId: ids.b1 });
    await scope.assertBranchCustomer({ companyId: ids.company, branchId: ids.a, customerId: ids.a1 });
    await assert.rejects(() => scope.assertBranchCustomer({ companyId: ids.company, branchId: ids.b, customerId: ids.a1 }));

    const customerController = new ErpController(models.Customer, ["name", "phone"]);
    customerController.logAudit = async () => {};
    for (const customerId of [ids.a1, ids.a2]) {
      const result = await invokeCustomerCrud(customerController, { companyId: ids.company, branchId: ids.a, id: customerId, method: "getById" });
      assert.equal(result.status, 200, "same-branch customer read succeeds");
      assert.equal(result.payload.data.id, customerId, "same-branch customer read returns the requested ID, never a substitute");
    }
    for (const customerId of [ids.b1, `CUS-${ns}-UNKNOWN`]) {
      const result = await invokeCustomerCrud(customerController, { companyId: ids.company, branchId: ids.a, id: customerId, method: "getById" });
      assert.equal(result.status, null, "cross-branch or unknown customer has no success response");
      assert.equal(result.payload, null, "cross-branch or unknown customer has no substitute payload");
      assert.equal(result.error?.statusCode, 404, "cross-branch or unknown customer uses stable not-found rejection");
    }
    const beforeRejectedUpdate = await models.Customer.findAll({ where: { companyId: ids.company }, raw: true, order: [["id", "ASC"]] });
    const rejectedUpdate = await invokeCustomerCrud(customerController, { companyId: ids.company, branchId: ids.a, id: ids.b1, method: "update", body: { notes: "must-not-write" } });
    const afterRejectedUpdate = await models.Customer.findAll({ where: { companyId: ids.company }, raw: true, order: [["id", "ASC"]] });
    assert.equal(rejectedUpdate.error?.statusCode, 404, "cross-branch customer update is safely rejected");
    assert.deepEqual(afterRejectedUpdate, beforeRejectedUpdate, "rejected customer update has zero write effect");
    const forgedBranch = await invokeCustomerCrud(customerController, { companyId: ids.company, branchId: ids.a, id: ids.a1, method: "update", body: { branchId: ids.b, notes: "must-not-write" } });
    assert.equal(forgedBranch.error?.statusCode, 403, "forged client branch cannot alter customer scope");
    const updateA2 = await invokeCustomerCrud(customerController, { companyId: ids.company, branchId: ids.a, id: ids.a2, method: "update", body: { notes: "updated-exactly-a2" } });
    assert.equal(updateA2.status, 200, "same-branch customer update succeeds");
    assert.equal(updateA2.payload.data.id, ids.a2, "same-branch customer update mutates the requested ID");
    assert.equal((await models.Customer.findByPk(ids.a1)).notes, null, "same-branch update does not mutate another permitted customer");
    const listed = await invokeCustomerCrud(customerController, { companyId: ids.company, branchId: ids.a, id: "unused", method: "list" });
    assert.deepEqual(listed.payload.items.map((customer) => customer.id).sort(), [ids.a1, ids.a2].sort(), "customer list remains limited to active BranchCustomer rows");
    await models.Invoice.bulkCreate([
      { id: ids.invA1, companyId: ids.company, customerId: ids.a1, customerName: `${ns} A1`, date: "2026-07-20", total: 11, paymentMethod: "cash", branch: `${ns} A`, branchId: ids.a, status: "paid", postingStatus: "posted" },
      { id: ids.invA2, companyId: ids.company, customerId: ids.a2, customerName: `${ns} A2`, date: "2026-07-20", total: 22, paymentMethod: "cash", branch: `${ns} A`, branchId: ids.a, status: "paid", postingStatus: "posted" },
      { id: ids.invB1, companyId: ids.company, customerId: ids.b1, customerName: `${ns} B1`, date: "2026-07-20", total: 33, paymentMethod: "cash", branch: `${ns} B`, branchId: ids.b, status: "paid", postingStatus: "posted" },
    ]);
    const nestedRoutes = [
      { path: "/customers/:id/invoices", customerId: (payload) => payload.data[0]?.customerId },
      { path: "/customers/:id/statement", customerId: (payload, id) => Number(payload.data.closingBalance) === (id === ids.a1 ? 11 : 22) ? id : null },
      { path: "/customers/:id/statement-v2", customerId: (payload) => payload.data.customer.id },
      { path: "/customers/:id/credit", customerId: (payload) => payload.data.customerId },
      { path: "/customers/:id/credit/reconciliation", customerId: (payload) => payload.data.customerId },
      { path: "/customers/:id/statement-v3", customerId: (payload) => payload.data.customerId },
      { path: "/customers/:id/loyalty", customerId: (payload) => payload.data.customerId },
    ];
    for (const route of nestedRoutes) {
      for (const customerId of [ids.a1, ids.a2]) {
        const result = await invokeCustomerRoute(route.path, { companyId: ids.company, branchId: ids.a, id: customerId });
        assert.equal(result.status, 200, `${route.path} permits same-branch customer`);
        assert.equal(route.customerId(result.payload, customerId), customerId, `${route.path} returns data for the exact requested customer`);
      }
      for (const customerId of [ids.b1, `CUS-${ns}-UNKNOWN`]) {
        const result = await invokeCustomerRoute(route.path, { companyId: ids.company, branchId: ids.a, id: customerId });
        assert.equal(result.status, null, `${route.path} has no cross-branch or unknown success response`);
        assert.equal(result.payload, null, `${route.path} exposes no cross-branch or unknown metadata`);
        assert.equal(result.error?.statusCode, 404, `${route.path} uses stable safe rejection`);
      }
    }
    await models.Asset.create({ id: ids.asset, companyId: ids.company, branchId: ids.a, name: `${ns} Asset`, type: "gold-piece", category: "qa", grossWeight: 1, netWeight: 1, price: 1, cost: 1, branch: `${ns} A`, location: "QA", barcode: `${ns}-BAR` });
    const asset = await models.Asset.findByPk(ids.asset);
    scope.assertSameBranch(asset, ids.a, "Asset");
    assert.throws(() => scope.assertSameBranch(asset, ids.b, "Asset"));
    const readiness = await bootstrap.branchReadinessReport(ids.company);
    assert.equal(readiness.branches.length, 2, "readiness reports both branches");
    assert.equal(await models.Permission.count(), permissionCountBefore, "verifier creates no permissions");
  } finally {
    await models.Invoice.destroy({ where: { companyId: ids.company }, force: true });
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
