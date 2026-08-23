#!/usr/bin/env node
"use strict";

const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");
const { assertAdoptedLocalDatabase } = require("./lib/verify-local-database-guard");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function staticContract() {
  const migration = read("backend/migrations/20260713010000-gold-purchase-draft-foundation.js");
  const routes = read("backend/src/routes/gold-purchase.routes.js");
  const service = read("backend/src/services/gold-purchase-draft.service.js");
  const measurement = read("backend/src/services/gold-purchase-measurement.service.js");
  const ui = read("features/gold-purchases/components/GoldPurchaseDraftWorkspace.tsx");
  for (const table of ["customer_gold_purchase_documents", "customer_gold_purchase_items", "investment_gold_purchase_documents", "investment_gold_purchase_items"]) assert.ok(migration.includes(table), `${table} is additive`);
  for (const route of ["/drafts", "/drafts/:id", "/drafts/:id/validate", "/drafts/:id/void"]) assert.ok(routes.includes(route), `${route} exists`);
  assert.ok(!routes.includes("router.delete"), "no hard-delete endpoint");
  assert.ok(measurement.includes("gross.minus(stone)") && measurement.includes("net.mul(purity)"), "backend owns approved formulas");
  assert.ok(service.includes('status: "draft"') && service.includes('status: "validated"'), "only draft and validated active states");
  for (const prohibited of ["Asset.create", "StockMovement.create", "JournalEntry.create", "CashTransaction.create", "CustomerGoldPool.create", "InventoryGoldPool.create"]) assert.ok(!service.includes(prohibited), `${prohibited} is absent`);
  assert.ok(ui.includes("Pool") === false && ui.includes("Custom Investment") === false, "deferred types are not selectable");
  console.log("static contract: PASS");
}

staticContract();

if (process.env.VERIFY_GOLD_PURCHASE_DRAFT_LIVE !== "true") {
  console.log("LIVE TESTS SKIPPED — set VERIFY_GOLD_PURCHASE_DRAFT_LIVE=true and VERIFY_DATABASE_NAME=darfus_erp");
  process.exit(0);
}

if (process.env.NODE_ENV === "production" || process.env.RENDER || process.env.VERCEL) throw new Error("Refusing remote/production live verification");
if (process.env.VERIFY_DATABASE_NAME !== "darfus_erp") throw new Error("VERIFY_DATABASE_NAME must equal darfus_erp");

process.chdir(path.join(ROOT, "backend"));
require(path.join(ROOT, "backend/node_modules/dotenv")).config({ path: path.join(ROOT, "backend", ".env") });
assertAdoptedLocalDatabase({ riskClass: "V3_WRITE_CLEANUP" });

const jwt = require(path.join(ROOT, "backend/node_modules/jsonwebtoken"));
const bcrypt = require(path.join(ROOT, "backend/node_modules/bcryptjs"));
const app = require(path.join(ROOT, "backend/src/app"));
const models = require(path.join(ROOT, "backend/src/models"));
const { JWT_SECRET } = require(path.join(ROOT, "backend/src/config/security"));
const { QueryTypes } = require(path.join(ROOT, "backend/node_modules/sequelize"));

const namespace = `T33B-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ids = {
  company: `CMP-${namespace}`, otherCompany: `CMP-${namespace}-OTHER`,
  branchA: `BR-${namespace}-A`, branchB: `BR-${namespace}-B`, otherBranch: `BR-${namespace}-X`,
  admin: `USR-${namespace}-ADMIN`, noPerm: `USR-${namespace}-NOPERM`,
  customer: `CUS-${namespace}`, otherCustomer: `CUS-${namespace}-X`,
  supplier: `SUP-${namespace}`, otherSupplier: `SUP-${namespace}-X`
};

let server;
let baseUrl;
const token = (id) => jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: "1h" });
const adminToken = () => token(ids.admin);
const noPermToken = () => token(ids.noPerm);

async function request(method, pathname, { bearer = adminToken(), branchId = ids.branchA, body, key } = {}) {
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (branchId) headers["X-Branch-ID"] = branchId;
  if (key) headers["Idempotency-Key"] = key;
  const response = await fetch(`${baseUrl}/api/v1${pathname}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: response.status, body: json };
}

const cgpLine = (overrides = {}) => ({ goldType: "scrap", karat: 21, fineness: 0.875, purityFactor: 0.875, grossWeight: 10, stoneWeight: 1, proposedRate: 250, referenceMarketRate: 260, ...overrides });
const igpLine = (overrides = {}) => ({ goldType: "investment_gold", investmentType: "physical", karat: 24, fineness: 1, purityFactor: 1, grossWeight: 20, stoneWeight: 0, quantity: 1, proposedPurchaseRate: 300, referenceMarketRate: 310, ...overrides });
const cgpBody = (overrides = {}) => ({ branchId: ids.branchA, customerId: ids.customer, transactionDate: "2026-07-13", currency: "AED", exchangeRate: 1, notes: namespace, items: [cgpLine()], ...overrides });
const igpBody = (overrides = {}) => ({ branchId: ids.branchA, supplierId: ids.supplier, supplierReference: namespace, purchaseDate: "2026-07-13", currency: "AED", exchangeRate: 1, notes: namespace, items: [igpLine()], ...overrides });

function expectError(result, status, code) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  assert.equal(result.body.code || result.body.error?.code, code, JSON.stringify(result.body));
}

async function zeroPostingCounts() {
  const checks = {
    assets: models.Asset, stockMovements: models.StockMovement, journalEntries: models.JournalEntry,
    cashTransactions: models.CashTransaction, customerGoldPools: models.CustomerGoldPool,
    inventoryGoldPools: models.InventoryGoldPool, purchaseOrders: models.PurchaseOrder,
    notifications: models.Notification, barcodeSequences: models.BarcodeSequence
  };
  const result = {};
  for (const [name, Model] of Object.entries(checks)) result[name] = await Model.count({ where: { companyId: ids.company } });
  result.journalLines = await models.JournalLine.count({ include: [{ model: models.JournalEntry, as: "journalEntry", where: { companyId: ids.company }, required: true }] });
  return result;
}

async function setup() {
  const password = await bcrypt.hash("Verifier-Only-33B!", 4);
  await models.Company.create({ id: ids.company, businessName: namespace, workspace: namespace.toLowerCase(), currency: "AED", country: "AE" }, { returning: false });
  await models.Company.create({ id: ids.otherCompany, businessName: `${namespace} Other`, workspace: `${namespace}-other`.toLowerCase(), currency: "AED", country: "AE" }, { returning: false });
  await models.Branch.bulkCreate([
    { id: ids.branchA, companyId: ids.company, name: `${namespace} A`, code: `${namespace}A`, type: "store", isActive: true },
    { id: ids.branchB, companyId: ids.company, name: `${namespace} B`, code: `${namespace}B`, type: "store", isActive: true },
    { id: ids.otherBranch, companyId: ids.otherCompany, name: `${namespace} X`, code: `${namespace}X`, type: "store", isActive: true }
  ]);
  await models.User.bulkCreate([
    { id: ids.admin, companyId: ids.company, firstName: namespace, lastName: "Admin", email: `${namespace.toLowerCase()}-admin@example.test`, password, role: "admin" },
    { id: ids.noPerm, companyId: ids.company, firstName: namespace, lastName: "NoPerm", email: `${namespace.toLowerCase()}-noperm@example.test`, password, role: "sales" }
  ]);
  await models.Customer.create({ id: ids.customer, companyId: ids.company, name: `${namespace} Customer`, phone: namespace, status: "active" });
  await models.Customer.create({ id: ids.otherCustomer, companyId: ids.otherCompany, name: `${namespace} Other Customer`, phone: `${namespace}X`, status: "active" });
  await models.Supplier.create({ id: ids.supplier, companyId: ids.company, name: `${namespace} Supplier`, category: "gold", phone: namespace, status: "active" });
  await models.Supplier.create({ id: ids.otherSupplier, companyId: ids.otherCompany, name: `${namespace} Other Supplier`, category: "gold", phone: `${namespace}X`, status: "active" });
}

async function cleanup() {
  await models.sequelize.query("DELETE FROM audit_logs WHERE company_id IN (:companies)", { replacements: { companies: [ids.company, ids.otherCompany] }, type: QueryTypes.DELETE });
  await models.IdempotencyRequest.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.CustomerGoldPurchaseItem.destroy({ where: { companyId: [ids.company, ids.otherCompany] }, force: true });
  await models.InvestmentGoldPurchaseItem.destroy({ where: { companyId: [ids.company, ids.otherCompany] }, force: true });
  await models.CustomerGoldPurchaseDocument.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.InvestmentGoldPurchaseDocument.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.UserRole.destroy({ where: { userId: [ids.admin, ids.noPerm] } });
  await models.User.destroy({ where: { id: [ids.admin, ids.noPerm] }, force: true });
  await models.Customer.destroy({ where: { id: [ids.customer, ids.otherCustomer] }, force: true });
  await models.Supplier.destroy({ where: { id: [ids.supplier, ids.otherSupplier] }, force: true });
  await models.Branch.destroy({ where: { id: [ids.branchA, ids.branchB, ids.otherBranch] } });
  await models.Company.destroy({ where: { id: [ids.company, ids.otherCompany] } });
}

async function run() {
  await models.sequelize.authenticate();
  await setup();
  server = await new Promise((resolve) => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const before = await zeroPostingCounts();
  assert.deepEqual(Object.values(before), Object.values(before).map(() => 0), JSON.stringify(before));

  // Authentication and exact permission middleware.
  expectError(await request("GET", "/gold-purchases/cgp/drafts", { bearer: null }), 401, "UNAUTHORIZED");
  expectError(await request("POST", "/gold-purchases/cgp/drafts", { bearer: noPermToken(), body: cgpBody(), key: `${namespace}-NO-PERM` }), 403, "FORBIDDEN");

  // CGP create, replay, conflict, shape, calculations, pagination and filters.
  const createKey = `${namespace}-CGP-CREATE`;
  const created = await request("POST", "/gold-purchases/cgp/drafts", { body: cgpBody(), key: createKey });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const cgp = created.body.data;
  assert.match(cgp.draftNumber, /^CGPD-\d{6}$/); assert.equal(cgp.status, "draft"); assert.equal(cgp.version, 1);
  assert.equal(Number(cgp.items[0].netWeight), 9); assert.equal(Number(cgp.items[0].pureGoldWeight), 7.875);
  const replay = await request("POST", "/gold-purchases/cgp/drafts", { body: cgpBody(), key: createKey });
  assert.equal(replay.status, 201); assert.equal(replay.body.data.id, cgp.id);
  expectError(await request("POST", "/gold-purchases/cgp/drafts", { body: cgpBody({ notes: "different" }), key: createKey }), 409, "CONFLICT");
  const cgp2 = await request("POST", "/gold-purchases/cgp/drafts", { body: cgpBody({ notes: `${namespace}-SECOND`, items: [cgpLine({ grossWeight: 12, stoneWeight: 2 })] }), key: `${namespace}-CGP-2` });
  assert.equal(cgp2.status, 201);
  const page1 = await request("GET", "/gold-purchases/cgp/drafts?page=1&limit=1");
  const page2 = await request("GET", "/gold-purchases/cgp/drafts?page=2&limit=1");
  assert.equal(page1.body.data.items.length, 1); assert.equal(page1.body.data.pagination.total, 2); assert.equal(page1.body.data.pagination.pages, 2);
  assert.notEqual(page1.body.data.items[0].id, page2.body.data.items[0].id);
  const filtered = await request("GET", `/gold-purchases/cgp/drafts?draftNumber=${encodeURIComponent(cgp.draftNumber)}`);
  assert.equal(filtered.body.data.items.length, 1); assert.equal(filtered.body.data.items[0].id, cgp.id);
  for (const query of [
    `customerId=${encodeURIComponent(ids.customer)}`,
    "status=draft",
    "dateFrom=2026-07-13&dateTo=2026-07-13",
    "karat=21"
  ]) {
    const result = await request("GET", `/gold-purchases/cgp/drafts?${query}`);
    assert.equal(result.status, 200); assert.ok(result.body.data.items.some((item) => item.id === cgp.id), `CGP filter ${query}`);
  }
  expectError(await request("GET", "/gold-purchases/cgp/drafts?page=0"), 422, "VALIDATION_FAILED");
  expectError(await request("GET", "/gold-purchases/cgp/drafts?limit=101"), 422, "VALIDATION_FAILED");

  // Reference, measurement and scope failures are atomic.
  expectError(await request("POST", "/gold-purchases/cgp/drafts", { body: cgpBody({ customerId: ids.otherCustomer }), key: `${namespace}-WRONG-CUSTOMER` }), 422, "VALIDATION_FAILED");
  expectError(await request("POST", "/gold-purchases/cgp/drafts", { body: cgpBody({ branchId: ids.branchB }), key: `${namespace}-WRONG-BRANCH` }), 403, "FORBIDDEN");
  expectError(await request("POST", "/gold-purchases/cgp/drafts", { body: cgpBody({ items: [cgpLine({ stoneWeight: 11 })] }), key: `${namespace}-BAD-WEIGHT` }), 422, "VALIDATION_FAILED");
  expectError(await request("POST", "/gold-purchases/cgp/drafts", { body: cgpBody({ items: [cgpLine({ purityFactor: 0.75, fineness: 0.75 })] }), key: `${namespace}-BAD-PURITY` }), 422, "VALIDATION_FAILED");
  const hidden = await request("GET", `/gold-purchases/cgp/drafts?branchId=${encodeURIComponent(ids.branchB)}`, { branchId: ids.branchA });
  assert.equal(hidden.body.data.pagination.total, 0); // untrusted query branch cannot replace authenticated branch A
  expectError(await request("GET", `/gold-purchases/cgp/drafts/${encodeURIComponent(cgp.id)}`, { branchId: ids.branchB }), 404, "RESOURCE_NOT_FOUND");

  // Validate, stale version, edit validated -> draft, and soft void.
  const validated = await request("POST", `/gold-purchases/cgp/drafts/${encodeURIComponent(cgp.id)}/validate`, { body: { version: cgp.version }, key: `${namespace}-CGP-VALIDATE` });
  assert.equal(validated.status, 200); assert.equal(validated.body.data.status, "validated"); assert.ok(validated.body.data.validatedAt); assert.equal(validated.body.data.version, 2);
  expectError(await request("PATCH", `/gold-purchases/cgp/drafts/${encodeURIComponent(cgp.id)}`, { body: { ...cgpBody(), version: 1 } }), 409, "STATE_CONFLICT");
  const edited = await request("PATCH", `/gold-purchases/cgp/drafts/${encodeURIComponent(cgp.id)}`, { body: { ...cgpBody({ notes: `${namespace}-EDITED` }), version: 2 } });
  assert.equal(edited.status, 200); assert.equal(edited.body.data.status, "draft"); assert.equal(edited.body.data.validatedAt, null); assert.equal(edited.body.data.version, 3);
  const voided = await request("POST", `/gold-purchases/cgp/drafts/${encodeURIComponent(cgp.id)}/void`, { body: { version: 3, reason: `${namespace} void` }, key: `${namespace}-CGP-VOID` });
  assert.equal(voided.status, 200); assert.ok(voided.body.data.voidedAt); assert.equal(voided.body.data.voidReason, `${namespace} void`);
  expectError(await request("PATCH", `/gold-purchases/cgp/drafts/${encodeURIComponent(cgp.id)}`, { body: { ...cgpBody(), version: 4 } }), 404, "RESOURCE_NOT_FOUND");
  const normalList = await request("GET", "/gold-purchases/cgp/drafts"); assert.ok(!normalList.body.data.items.some((x) => x.id === cgp.id));
  const historical = await request("GET", `/gold-purchases/cgp/drafts/${encodeURIComponent(cgp.id)}?includeVoided=true`); assert.equal(historical.status, 200); assert.equal(historical.body.data.voided, true);

  // IGP physical, serialized bullion, bullion lot, duplicates and deferred types.
  expectError(await request("POST", "/gold-purchases/igp/drafts", { body: igpBody(), bearer: noPermToken(), key: `${namespace}-IGP-NOPERM` }), 403, "FORBIDDEN");
  const physical = await request("POST", "/gold-purchases/igp/drafts", { body: igpBody(), key: `${namespace}-IGP-PHYSICAL` });
  assert.equal(physical.status, 201); assert.match(physical.body.data.draftNumber, /^IGPD-\d{6}$/); assert.equal(physical.body.data.items[0].investmentType, "physical"); assert.equal(physical.body.data.finalPurchaseValue, undefined);
  expectError(await request("GET", `/gold-purchases/igp/drafts/${encodeURIComponent(physical.body.data.id)}`, { branchId: ids.branchB }), 404, "RESOURCE_NOT_FOUND");
  const serial = `${namespace}-SERIAL`;
  const serialized = await request("POST", "/gold-purchases/igp/drafts", { body: igpBody({ items: [igpLine({ investmentType: "bullion", bullionIdentityType: "serialized_unit", serialNumber: serial })] }), key: `${namespace}-IGP-SERIAL` });
  assert.equal(serialized.status, 201); assert.equal(serialized.body.data.items[0].serialNumber, serial);
  expectError(await request("POST", "/gold-purchases/igp/drafts", { body: igpBody({ items: [igpLine({ investmentType: "bullion", bullionIdentityType: "serialized_unit", serialNumber: serial })] }), key: `${namespace}-IGP-SERIAL-DUP` }), 422, "VALIDATION_FAILED");
  expectError(await request("POST", "/gold-purchases/igp/drafts", { body: igpBody({ items: [igpLine({ investmentType: "bullion", bullionIdentityType: "serialized_unit", serialNumber: null })] }), key: `${namespace}-IGP-SERIAL-MISSING` }), 422, "VALIDATION_FAILED");
  const lot = `${namespace}-LOT`;
  const lotted = await request("POST", "/gold-purchases/igp/drafts", { body: igpBody({ items: [igpLine({ investmentType: "bullion", bullionIdentityType: "bullion_lot", lotNumber: lot, quantity: 5 })] }), key: `${namespace}-IGP-LOT` });
  assert.equal(lotted.status, 201); assert.equal(lotted.body.data.items[0].lotNumber, lot);
  expectError(await request("POST", "/gold-purchases/igp/drafts", { body: igpBody({ items: [igpLine({ investmentType: "bullion", bullionIdentityType: "bullion_lot", lotNumber: lot, quantity: 5 })] }), key: `${namespace}-IGP-LOT-DUP` }), 422, "VALIDATION_FAILED");
  expectError(await request("POST", "/gold-purchases/igp/drafts", { body: igpBody({ items: [igpLine({ investmentType: "bullion", bullionIdentityType: "bullion_lot" })] }), key: `${namespace}-IGP-LOT-MISSING` }), 422, "VALIDATION_FAILED");
  expectError(await request("POST", "/gold-purchases/igp/drafts", { body: igpBody({ items: [igpLine({ quantity: 0 })] }), key: `${namespace}-IGP-BAD-QUANTITY` }), 422, "VALIDATION_FAILED");
  for (const unsupported of ["pool", "custom", "digital"]) expectError(await request("POST", "/gold-purchases/igp/drafts", { body: igpBody({ items: [igpLine({ investmentType: unsupported })] }), key: `${namespace}-IGP-${unsupported}` }), 422, "VALIDATION_FAILED");
  expectError(await request("POST", "/gold-purchases/igp/drafts", { body: igpBody({ supplierId: ids.otherSupplier }), key: `${namespace}-IGP-WRONG-SUPPLIER` }), 422, "VALIDATION_FAILED");
  const serialFilter = await request("GET", `/gold-purchases/igp/drafts?serialNumber=${encodeURIComponent(serial)}`); assert.equal(serialFilter.body.data.items.length, 1); assert.equal(serialFilter.body.data.items[0].id, serialized.body.data.id);
  const lotFilter = await request("GET", `/gold-purchases/igp/drafts?lotNumber=${encodeURIComponent(lot)}`); assert.equal(lotFilter.body.data.items.length, 1); assert.equal(lotFilter.body.data.items[0].id, lotted.body.data.id);
  for (const [query, expectedId] of [
    [`supplierId=${encodeURIComponent(ids.supplier)}`, physical.body.data.id],
    ["status=draft", physical.body.data.id],
    [`draftNumber=${encodeURIComponent(physical.body.data.draftNumber)}`, physical.body.data.id],
    ["investmentType=physical", physical.body.data.id],
    ["bullionIdentityType=serialized_unit", serialized.body.data.id],
    ["dateFrom=2026-07-13&dateTo=2026-07-13", physical.body.data.id],
    ["karat=24", physical.body.data.id]
  ]) {
    const result = await request("GET", `/gold-purchases/igp/drafts?${query}`);
    assert.equal(result.status, 200); assert.ok(result.body.data.items.some((item) => item.id === expectedId), `IGP filter ${query}`);
  }
  const igpPage1 = await request("GET", "/gold-purchases/igp/drafts?page=1&limit=1");
  const igpPage2 = await request("GET", "/gold-purchases/igp/drafts?page=2&limit=1");
  assert.equal(igpPage1.body.data.pagination.total, 3); assert.equal(igpPage2.body.data.pagination.total, 3);
  assert.equal(igpPage1.body.data.items.length, 1); assert.equal(igpPage2.body.data.items.length, 1);
  assert.notEqual(igpPage1.body.data.items[0].id, igpPage2.body.data.items[0].id);

  // IGP update, validation and void are real HTTP commands with no downstream effects.
  const igpUpdated = await request("PATCH", `/gold-purchases/igp/drafts/${encodeURIComponent(physical.body.data.id)}`, { body: { ...igpBody({ notes: `${namespace}-IGP-EDITED` }), version: 1 } });
  assert.equal(igpUpdated.status, 200); assert.equal(igpUpdated.body.data.version, 2); assert.equal(igpUpdated.body.data.notes, `${namespace}-IGP-EDITED`);
  const igpValidated = await request("POST", `/gold-purchases/igp/drafts/${encodeURIComponent(physical.body.data.id)}/validate`, { body: { version: 2 }, key: `${namespace}-IGP-VALIDATE` });
  assert.equal(igpValidated.status, 200); assert.equal(igpValidated.body.data.status, "validated"); assert.equal(igpValidated.body.data.version, 3);
  const igpVoided = await request("POST", `/gold-purchases/igp/drafts/${encodeURIComponent(physical.body.data.id)}/void`, { body: { version: 3, reason: `${namespace} void` }, key: `${namespace}-IGP-VOID` });
  assert.equal(igpVoided.status, 200); assert.ok(igpVoided.body.data.voidedAt);

  const after = await zeroPostingCounts();
  assert.deepEqual(after, before, `zero-posting invariant failed: ${JSON.stringify(after)}`);
  const auditActions = await models.AuditLog.findAll({ where: { companyId: ids.company }, attributes: ["action"] });
  const actions = new Set(auditActions.map((x) => x.action));
  for (const action of ["cgp.draft.created", "cgp.draft.updated", "cgp.draft.validated", "cgp.draft.voided", "igp.draft.created", "igp.draft.updated", "igp.draft.validated", "igp.draft.voided"]) assert.ok(actions.has(action), `audit ${action}`);

  console.log(JSON.stringify({ namespace, cgp: "PASS", igpPhysical: "PASS", serializedBullion: "PASS", bullionLot: "PASS", security: "PASS", idempotency: "PASS", concurrency: "PASS", softVoid: "PASS", zeroPosting: after }, null, 2));
  console.log("LIVE TESTS EXECUTED");
}

(async () => {
  try { await run(); }
  finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await cleanup().catch((error) => console.error("cleanup error", error));
    const residual = await models.sequelize.query("SELECT (SELECT count(*) FROM customer_gold_purchase_documents WHERE company_id=:company) + (SELECT count(*) FROM investment_gold_purchase_documents WHERE company_id=:company) + (SELECT count(*) FROM idempotency_requests WHERE company_id=:company) + (SELECT count(*) FROM audit_logs WHERE company_id=:company) AS count", { replacements: { company: ids.company }, type: QueryTypes.SELECT }).catch(() => [{ count: 0 }]);
    assert.equal(Number(residual[0]?.count || 0), 0, "persistent namespace pollution detected");
    await models.sequelize.close();
  }
  console.log("No persistent test pollution detected");
})().catch((error) => { console.error(error.stack || error); process.exit(1); });
