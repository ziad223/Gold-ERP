#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const ErpController = require(path.join(ROOT, "backend/src/controllers/erp.controller"));
const erpRouter = require(path.join(ROOT, "backend/src/routes/erp.routes"));
const reservationService = require(path.join(ROOT, "backend/src/services/reservation.service"));

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

async function invokeReservationRoute(routePath, { companyId, branchId, id, body = {} }) {
  const layer = erpRouter.stack.find((entry) => entry.route?.path === routePath);
  assert.ok(layer, `reservation route ${routePath} is registered`);
  const handler = layer.route.stack.at(-1).handle;
  let status = null;
  let payload = null;
  let forwarded = null;
  const req = {
    params: { id }, body, query: {}, companyId, branchId, headers: {},
    user: { id: "USR-BRANCH1-VERIFY", role: "sales", firstName: "QA", lastName: "Verifier" },
  };
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
  assert.ok(reservation.includes("if (branchId)") && reservation.includes("where.branchId = branchId") && reservation.includes("requireReservationInBranch"), "authenticated branch context scopes reservation reads and actions by exact reservation/company/branch");
  for (const operation of ["addPayment", "_completeSaleInTransaction", "cancelReservation", "requestRefund", "approveRefund", "_executeRefundInTransaction", "_amendItemsInTransaction", "extendExpiry", "_renewInTransaction", "approveRenewalExcessRefund", "_executeRenewalExcessRefundInTransaction"]) {
    assert.ok(reservation.includes(`async ${operation}`), `reservation operation ${operation} remains covered by the service contract`);
  }
  assert.ok(!settings.includes("Reservation Advances Account") && !settings.includes("reservationAdvancesAccountId:"), "ordinary Settings has no editable deposit account selector");
  assert.ok(settings.includes("Branch reservation-deposit account status") && pos.includes("automatic branch setup"), "UI displays protected branch status instead of a selector");
  assert.ok(controller.includes("applyBranchReadScope") && controller.includes("applyBranchWriteScope") && controller.includes("BranchCustomer"), "generic customer/branch resource reads and writes are server-scoped");
  assert.ok(controller.includes("requestedIdScope") && controller.includes("branchCustomerScope") && controller.includes("whereClause[Op.and]"), "generic by-id customer scope intersects requested ID with the branch relationship");
  for (const routePath of ["/customers/:id/invoices", "/customers/:id/statement", "/customers/:id/statement-v2", "/customers/:id/credit", "/customers/:id/credit/reconciliation", "/customers/:id/statement-v3", "/customers/:id/loyalty"]) {
    assert.ok(routes.includes(routePath) && routes.includes("requireBranchCustomerResource"), `${routePath} is bound to branch-scoped customer resolution`);
  }
  for (const routePath of ["/reservations/:id/amendments", "/reservations/:id/extensions", "/reservations/:id/renewal"]) {
    assert.ok(routes.includes(routePath) && routes.includes("await reservationService.getById({ companyId: req.companyId, id: req.params.id"), `${routePath} validates the scoped parent reservation before nested reads`);
  }
  assert.ok(routes.includes("const reservation = await reservationService.getById({ companyId: req.companyId, id: req.params.id, user: req.user, branchId: req.branchId });"), "generic reservation note update resolves the exact scoped reservation");
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
    invA1: `INV-${ns}-A1`, invA2: `INV-${ns}-A2`, invB1: `INV-${ns}-B1`, asset: `AST-${ns}-A`, bAsset: `AST-${ns}-B`,
    reservationA1: `RSV-${ns}-A1`, reservationA2: `RSV-${ns}-A2`, reservationB1: `RSV-${ns}-B1`, unknownReservation: `RSV-${ns}-UNKNOWN`,
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
    await models.Asset.bulkCreate([
      { id: ids.asset, companyId: ids.company, branchId: ids.a, name: `${ns} Asset A`, type: "gold-piece", category: "qa", grossWeight: 1, netWeight: 1, price: 1, cost: 1, branch: `${ns} A`, location: "QA", barcode: `${ns}-A` },
      { id: ids.bAsset, companyId: ids.company, branchId: ids.b, name: `${ns} Asset B`, type: "gold-piece", category: "qa", grossWeight: 1, netWeight: 1, price: 1, cost: 1, branch: `${ns} B`, location: "QA", barcode: `${ns}-B` },
    ]);
    const asset = await models.Asset.findByPk(ids.asset);
    scope.assertSameBranch(asset, ids.a, "Asset");
    assert.throws(() => scope.assertSameBranch(asset, ids.b, "Asset"));
    await models.Reservation.bulkCreate([
      { id: ids.reservationA1, companyId: ids.company, branchId: ids.a, branch: `${ns} A`, assetId: ids.asset, assetName: `${ns} Asset A`, customerId: ids.a1, customerName: `${ns} A1`, currency: "EGP", deposit: 0, agreedTotal: 1, paidTotal: 0, remainingTotal: 1, excessTotal: 0, expiresAt: "2027-01-01T00:00:00.000Z", workflowVersion: 2, isLegacy: false, status: "active" },
      { id: ids.reservationA2, companyId: ids.company, branchId: ids.a, branch: `${ns} A`, assetId: ids.asset, assetName: `${ns} Asset A`, customerId: ids.a2, customerName: `${ns} A2`, currency: "EGP", deposit: 0, agreedTotal: 1, paidTotal: 0, remainingTotal: 1, excessTotal: 0, expiresAt: "2027-01-01T00:00:00.000Z", workflowVersion: 2, isLegacy: false, status: "active" },
      { id: ids.reservationB1, companyId: ids.company, branchId: ids.b, branch: `${ns} B`, assetId: ids.bAsset, assetName: `${ns} Asset B`, customerId: ids.b1, customerName: `${ns} B1`, currency: "EGP", deposit: 0, agreedTotal: 1, paidTotal: 0, remainingTotal: 1, excessTotal: 0, expiresAt: "2027-01-01T00:00:00.000Z", workflowVersion: 2, isLegacy: false, status: "active" },
    ]);
    const reservationActor = { id: "USR-BRANCH1-VERIFY", role: "sales", firstName: "QA", lastName: "Verifier" };
    for (const reservationId of [ids.reservationA1, ids.reservationA2]) {
      const reservation = await reservationService.getById({ companyId: ids.company, id: reservationId, user: reservationActor, branchId: ids.a });
      assert.equal(reservation.id, reservationId, "same-branch reservation read returns the exact requested ID");
      assert.equal(reservation.branchId, ids.a, "same-branch reservation read keeps the effective branch");
    }
    for (const reservationId of [ids.reservationB1, ids.unknownReservation]) {
      await assert.rejects(() => reservationService.getById({ companyId: ids.company, id: reservationId, user: reservationActor, branchId: ids.a }), (error) => error?.statusCode === 404, "cross-branch and unknown reservations reject without substitute data");
    }
    const reservationsBefore = await models.Reservation.findAll({ where: { companyId: ids.company }, raw: true, order: [["id", "ASC"]] });
    for (const routePath of ["/reservations/:id/amendments", "/reservations/:id/extensions", "/reservations/:id/renewal"]) {
      const same = await invokeReservationRoute(routePath, { companyId: ids.company, branchId: ids.a, id: ids.reservationA1 });
      assert.equal(same.status, 200, `${routePath} permits the exact same-branch reservation parent`);
      const cross = await invokeReservationRoute(routePath, { companyId: ids.company, branchId: ids.a, id: ids.reservationB1 });
      assert.equal(cross.status, null, `${routePath} has no cross-branch success response`);
      assert.equal(cross.payload, null, `${routePath} leaks no cross-branch nested data`);
      assert.equal(cross.error?.statusCode, 404, `${routePath} rejects the cross-branch parent safely`);
    }
    const noteUpdate = await invokeReservationRoute("/reservations/:id", { companyId: ids.company, branchId: ids.a, id: ids.reservationB1, body: { notes: "must-not-write" } });
    assert.equal(noteUpdate.error?.statusCode, 404, "cross-branch reservation update is safely rejected");
    await assert.rejects(() => reservationService.cancelReservation({ companyId: ids.company, branchId: ids.a, user: reservationActor, reservationId: ids.reservationB1, body: { reason: "must-not-write" } }), (error) => error?.statusCode === 404, "cross-branch cancellation is rejected before writes");
    await assert.rejects(() => reservationService.addPayment({ companyId: ids.company, branchId: ids.a, user: reservationActor, reservationId: ids.reservationB1, body: { amount: "1" }, idempotencyKey: `${ns}-cross-payment` }), (error) => error?.statusCode === 404, "cross-branch payment is rejected before writes");
    await assert.rejects(() => reservationService.completeSale({ companyId: ids.company, branchId: ids.a, user: reservationActor, reservationId: ids.reservationB1, body: {}, idempotencyKey: `${ns}-cross-complete` }), (error) => error?.statusCode === 404, "cross-branch completion is rejected before writes");
    const reservationsAfter = await models.Reservation.findAll({ where: { companyId: ids.company }, raw: true, order: [["id", "ASC"]] });
    assert.deepEqual(reservationsAfter, reservationsBefore, "rejected reservation operations have zero reservation write effect");
    const readiness = await bootstrap.branchReadinessReport(ids.company);
    assert.equal(readiness.branches.length, 2, "readiness reports both branches");
    assert.equal(await models.Permission.count(), permissionCountBefore, "verifier creates no permissions");
  } finally {
    await models.Reservation.destroy({ where: { companyId: ids.company }, force: true });
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
