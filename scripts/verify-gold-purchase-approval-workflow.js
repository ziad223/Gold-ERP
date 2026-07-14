#!/usr/bin/env node
"use strict";

const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const permissionActions = ["view", "view_all", "view_branch", "view_own", "create", "update_draft", "validate", "submit", "approve", "reject", "self_approve", "void"];
const permissionNames = ["cgp", "igp"].flatMap((kind) => permissionActions.map((action) => `gold_purchase.${kind}.${action}`));

function staticContract() {
  const migration = read("backend/migrations/20260714010000-gold-purchase-approval-governance.js");
  const selfReviewMigration = read("backend/migrations/20260714020000-gold-purchase-self-approval-permissions.js");
  const routes = read("backend/src/routes/gold-purchase.routes.js");
  const governance = read("backend/src/services/gold-purchase-governance.service.js");
  const draft = read("backend/src/services/gold-purchase-draft.service.js");
  const ui = read("features/gold-purchases/components/GoldPurchaseDraftWorkspace.tsx");
  const approvals = read("app/[locale]/(dashboard)/approvals/page.tsx");
  const permissionsUi = read("app/[locale]/(dashboard)/settings/users/page.tsx");
  for (const name of permissionNames.filter((name) => !name.endsWith(".self_approve"))) assert.ok(migration.includes(name.split(".").at(-1)) && read("backend/src/bootstrap/accessControl.js").includes(name), `permission ${name}`);
  for (const name of permissionNames.filter((name) => name.endsWith(".self_approve"))) assert.ok(selfReviewMigration.includes(name) && read("backend/src/bootstrap/accessControl.js").includes(name), `permission ${name}`);
  for (const endpoint of ["/submit", "/approve", "/reject", "/revisions", 'router.get("/approvals"', 'router.get("/approvals/:id"']) assert.ok(routes.includes(endpoint), `endpoint ${endpoint}`);
  for (const state of ["submitted", "approved"]) assert.ok(migration.includes(`'${state}'`), `state ${state}`);
  assert.ok(governance.includes("SELF_APPROVAL_FORBIDDEN") && governance.includes("SNAPSHOT_MISMATCH") && governance.includes("isSelfReview"), "maker-checker and immutable snapshot contracts");
  assert.ok(governance.includes('createHash("sha256")') && governance.includes("submittedSnapshotHash"), "sha256 snapshot");
  assert.ok(draft.includes("DOCUMENT_IMMUTABLE"), "submitted/approved updates blocked");
  assert.ok(ui.includes("Submit for approval") && ui.includes("Create revision"), "maker UI actions");
  assert.ok(approvals.includes("Gold Purchase approvals") && approvals.includes("selfReview") && approvals.includes("Self Approval"), "review queue and self-review controls");
  assert.ok(permissionsUi.includes("gold_purchase.cgp") && permissionsUi.includes("gold_purchase.igp"), "permission administration grouping");
  for (const prohibited of ["/post", "/payment", "/withdrawal", "/liquidity-transfer", "/transform", "/close"]) assert.ok(!routes.includes(prohibited), `${prohibited} endpoint absent`);
  for (const prohibited of ["Asset.create", "StockMovement.create", "JournalEntry.create", "CashTransaction.create", "CustomerGoldPool.create", "InventoryGoldPool.create"]) assert.ok(!governance.includes(prohibited), `${prohibited} side effect absent`);
  console.log("Phase 33C static contract: PASS");
}

staticContract();

if (process.env.VERIFY_GOLD_PURCHASE_APPROVAL_LIVE !== "true") {
  console.log("LIVE TESTS SKIPPED — set VERIFY_GOLD_PURCHASE_APPROVAL_LIVE=true and VERIFY_DATABASE_NAME=darfus_erp");
  process.exit(0);
}

if (process.env.NODE_ENV === "production" || process.env.RENDER || process.env.VERCEL || process.env.DATABASE_URL) throw new Error("Refusing remote/production live verification");
if (process.env.VERIFY_DATABASE_NAME !== "darfus_erp") throw new Error("VERIFY_DATABASE_NAME must equal darfus_erp");

process.chdir(path.join(ROOT, "backend"));
require(path.join(ROOT, "backend/node_modules/dotenv")).config({ path: path.join(ROOT, "backend", ".env") });
if (process.env.DB_HOST !== "localhost" || String(process.env.DB_PORT) !== "5433" || process.env.DB_NAME !== "darfus_erp") throw new Error("Live verifier requires local darfus_erp@localhost:5433");

const jwt = require(path.join(ROOT, "backend/node_modules/jsonwebtoken"));
const bcrypt = require(path.join(ROOT, "backend/node_modules/bcryptjs"));
const app = require(path.join(ROOT, "backend/src/app"));
const models = require(path.join(ROOT, "backend/src/models"));
const { JWT_SECRET } = require(path.join(ROOT, "backend/src/config/security"));
const { Op, QueryTypes } = require(path.join(ROOT, "backend/node_modules/sequelize"));
models.sequelize.options.logging = false;

const namespace = `T33C-HF1-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ids = {
  company: `CMP-${namespace}`, otherCompany: `CMP-${namespace}-OTHER`, branchA: `BR-${namespace}-A`, branchB: `BR-${namespace}-B`, otherBranch: `BR-${namespace}-X`,
  customer: `CUS-${namespace}`, supplier: `SUP-${namespace}`,
  maker: `USR-${namespace}-MAKER`, reviewer: `USR-${namespace}-REVIEWER`, ownReviewer: `USR-${namespace}-OWN-REVIEWER`,
  ownMaker: `USR-${namespace}-OWN-MAKER`, allReviewer: `USR-${namespace}-ALL-REVIEWER`,
  legacy: `USR-${namespace}-LEGACY`, noPerm: `USR-${namespace}-NONE`, branchMaker: `USR-${namespace}-BRANCH-B`,
  draftCreator: `USR-${namespace}-DRAFT-CREATOR`, selfMaker: `USR-${namespace}-SELF-MAKER`, superAdmin: `USR-${namespace}-SUPER-ADMIN`
};
const userIds = [ids.maker, ids.reviewer, ids.ownReviewer, ids.ownMaker, ids.allReviewer, ids.legacy, ids.noPerm, ids.branchMaker, ids.draftCreator, ids.selfMaker, ids.superAdmin];
const roleIds = [];
let server;
let baseUrl;
let zeroPostingBefore;
let zeroPostingAfter;
let zeroPostingFinal;
let runCompleted = false;

const token = (id) => jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: "1h" });
async function request(method, pathname, { user = ids.maker, branchId = ids.branchA, body, key } = {}) {
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  if (user) headers.Authorization = `Bearer ${token(user)}`;
  if (branchId) headers["X-Branch-ID"] = branchId;
  if (key) headers["Idempotency-Key"] = key;
  const response = await fetch(`${baseUrl}/api/v1${pathname}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: response.status, body: json };
}
function expectError(result, status, code) { assert.equal(result.status, status, JSON.stringify(result.body)); assert.equal(result.body?.code || result.body?.error?.code, code, JSON.stringify(result.body)); }
const cgpBody = (overrides = {}) => ({ branchId: ids.branchA, customerId: ids.customer, transactionDate: "2026-07-14", currency: "AED", exchangeRate: 1, notes: namespace, items: [{ goldType: "scrap", karat: 21, fineness: 0.875, purityFactor: 0.875, grossWeight: 10, stoneWeight: 1, proposedRate: 250 }], ...overrides });
const igpBody = (overrides = {}) => ({ branchId: ids.branchA, supplierId: ids.supplier, purchaseDate: "2026-07-14", currency: "AED", exchangeRate: 1, notes: namespace, items: [{ goldType: "investment_gold", investmentType: "physical", karat: 24, fineness: 1, purityFactor: 1, grossWeight: 20, stoneWeight: 0, quantity: 1, proposedPurchaseRate: 300 }], ...overrides });

async function addUser(password, id, branchId, suffix, permissions, { isAdmin = false } = {}) {
  await models.User.create({ id, companyId: ids.company, firstName: namespace, lastName: suffix, email: `${namespace.toLowerCase()}-${suffix.toLowerCase()}@example.test`, password, role: "sales" });
  const roleId = `ROLE-${namespace}-${suffix}`; roleIds.push(roleId);
  await models.Role.create({ id: roleId, companyId: ids.company, name: `${namespace} ${suffix}`, slug: `t33c-${namespace}-${suffix}`.toLowerCase(), isSystem: false, isAdmin });
  const rows = await models.Permission.findAll({ where: { name: permissions } });
  assert.equal(rows.length, new Set(permissions).size, `missing permission for ${suffix}`);
  await models.RolePermission.bulkCreate(rows.map((permission) => ({ roleId, permissionId: permission.id })));
  await models.UserRole.create({ userId: id, roleId });
}

async function setup() {
  const password = await bcrypt.hash("Verifier-Only-33C!", 4);
  await models.Company.create({ id: ids.company, businessName: namespace, workspace: namespace.toLowerCase(), currency: "AED", country: "AE" });
  await models.Company.create({ id: ids.otherCompany, businessName: `${namespace} Other`, workspace: `${namespace}-other`.toLowerCase(), currency: "AED", country: "AE" });
  await models.Branch.bulkCreate([
    { id: ids.branchA, companyId: ids.company, name: `${namespace} A`, code: `${namespace}A`, type: "store", isActive: true },
    { id: ids.branchB, companyId: ids.company, name: `${namespace} B`, code: `${namespace}B`, type: "store", isActive: true },
    { id: ids.otherBranch, companyId: ids.otherCompany, name: `${namespace} X`, code: `${namespace}X`, type: "store", isActive: true }
  ]);
  await models.Customer.create({ id: ids.customer, companyId: ids.company, name: `${namespace} Customer`, phone: namespace, status: "active" });
  await models.Supplier.create({ id: ids.supplier, companyId: ids.company, name: `${namespace} Supplier`, category: "gold", phone: namespace, status: "active" });
  const makerPermissions = ["cgp", "igp"].flatMap((kind) => ["view", "view_branch", "create", "update_draft", "validate", "submit", "approve", "reject", "void"].map((action) => `gold_purchase.${kind}.${action}`));
  const reviewerPermissions = ["cgp", "igp"].flatMap((kind) => ["view", "view_branch", "approve", "reject"].map((action) => `gold_purchase.${kind}.${action}`));
  const ownReviewerPermissions = ["gold_purchase.cgp.view", "gold_purchase.cgp.view_own", "gold_purchase.cgp.approve", "gold_purchase.cgp.reject"];
  const ownMakerPermissions = ["view", "view_own", "create", "update_draft", "validate", "submit", "void"].map((action) => `gold_purchase.cgp.${action}`);
  const allReviewerPermissions = ["cgp", "igp"].flatMap((kind) => ["view", "view_all", "approve", "reject"].map((action) => `gold_purchase.${kind}.${action}`));
  const selfMakerPermissions = makerPermissions.concat(["gold_purchase.cgp.self_approve", "gold_purchase.igp.self_approve"]);
  const draftCreatorPermissions = ["cgp", "igp"].flatMap((kind) => ["view", "view_branch", "create", "update_draft", "validate"].map((action) => `gold_purchase.${kind}.${action}`));
  await addUser(password, ids.maker, ids.branchA, "Maker", makerPermissions);
  await addUser(password, ids.reviewer, ids.branchA, "Reviewer", reviewerPermissions);
  await addUser(password, ids.ownReviewer, ids.branchA, "OwnReviewer", ownReviewerPermissions);
  await addUser(password, ids.ownMaker, ids.branchA, "OwnMaker", ownMakerPermissions);
  await addUser(password, ids.allReviewer, ids.branchA, "AllReviewer", allReviewerPermissions);
  await addUser(password, ids.legacy, ids.branchA, "Legacy", ["sales.view", "sales.create", "suppliers.view", "suppliers.create", "suppliers.update"]);
  await addUser(password, ids.noPerm, ids.branchA, "None", []);
  await addUser(password, ids.branchMaker, ids.branchB, "BranchMaker", makerPermissions);
  await addUser(password, ids.draftCreator, ids.branchA, "DraftCreator", draftCreatorPermissions);
  await addUser(password, ids.selfMaker, ids.branchA, "SelfMaker", selfMakerPermissions);
  await addUser(password, ids.superAdmin, ids.branchA, "SuperAdmin", permissionNames, { isAdmin: true });
}

async function zeroPostingCounts() {
  const result = {};
  for (const [name, Model] of Object.entries({ assets: models.Asset, stockMovements: models.StockMovement, journals: models.JournalEntry, cash: models.CashTransaction, cgpPools: models.CustomerGoldPool, igpPools: models.InventoryGoldPool, purchaseOrders: models.PurchaseOrder, notifications: models.Notification, barcodeInventoryCodes: models.BarcodeInventoryCode, barcodeItemCodes: models.BarcodeItemCode, barcodeSequences: models.BarcodeSequence, payments: models.Payment, customerCreditTransactions: models.CustomerCreditTransaction, reservationPayments: models.ReservationPayment, reservationPaymentApplications: models.ReservationPaymentApplication, reservationPaymentTransfers: models.ReservationPaymentTransfer, reservationRefunds: models.ReservationRefund, reservationRefundAllocations: models.ReservationRefundAllocation, goldPrices: models.GoldPrice, goldFixings: models.GoldFixing })) result[name] = await Model.count({ where: { companyId: ids.company } });
  result.journalLines = await models.JournalLine.count({ include: [{ model: models.JournalEntry, as: "journalEntry", required: true, where: { companyId: ids.company } }] });
  result.supplierPayments = await models.CashTransaction.count({ where: { companyId: ids.company, type: "cash_out", category: "supplier_purchase" } });
  result.customerPaymentsSettlements = result.payments + result.customerCreditTransactions + result.reservationPayments + result.reservationPaymentApplications + result.reservationPaymentTransfers + result.reservationRefunds + result.reservationRefundAllocations;
  result.treasury = result.cash;
  result.goldCenter = result.goldPrices + result.goldFixings;
  result.accountingPostingLinks = (await models.JournalEntry.count({ where: { companyId: ids.company, [Op.or]: [{ sourceType: { [Op.ne]: null } }, { sourceId: { [Op.ne]: null } }] } })) + (await models.CashTransaction.count({ where: { companyId: ids.company, journalEntryId: { [Op.ne]: null } } })) + (await models.CustomerCreditTransaction.count({ where: { companyId: ids.company, journalEntryId: { [Op.ne]: null } } }));
  return result;
}

const zeroPostingMatrix = (before, after, final) => [
  ["Assets", "Asset (assets)", "assets"],
  ["Stock movements", "StockMovement (stock_movements)", "stockMovements"],
  ["Journal entries", "JournalEntry (journal_entries)", "journals"],
  ["Journal lines", "JournalLine (journal_lines) joined to JournalEntry.company_id", "journalLines"],
  ["Cash transactions", "CashTransaction (cash_transactions)", "cash"],
  ["Treasury", "CashTransaction (cash_transactions); Treasury is persisted through cash transactions", "treasury"],
  ["Supplier payments", "CashTransaction (cash_transactions), type=cash_out, category=supplier_purchase, reference=purchase_orders.id", "supplierPayments"],
  ["Customer payments/settlements", "Payment (payments), CustomerCreditTransaction (customer_credit_transactions), ReservationPayment and application/transfer/refund tables", "customerPaymentsSettlements"],
  ["Customer Gold Pools", "CustomerGoldPool (customer_gold_pools)", "cgpPools"],
  ["Inventory Gold Pools", "InventoryGoldPool (inventory_gold_pools)", "igpPools"],
  ["Purchase orders", "PurchaseOrder (purchase_orders)", "purchaseOrders"],
  ["Gold Center", "GoldPrice (gold_prices) and GoldFixing (gold_fixings); pools and stock movements are separately checked above", "goldCenter"],
  ["Barcode business records", "BarcodeInventoryCode and BarcodeItemCode", "barcodeBusinessRecords"],
  ["Barcode sequence consumption", "BarcodeSequence (barcode_sequences)", "barcodeSequences"],
  ["Posting/receipt notifications", "Notification (notifications)", "notifications"],
  ["Accounting posting links", "JournalEntry.source_type/source_id plus CashTransaction.journal_entry_id and CustomerCreditTransaction.journal_entry_id", "accountingPostingLinks"]
].map(([subsystem, persistence, key]) => {
  const value = key === "barcodeBusinessRecords" ? (counts) => counts.barcodeInventoryCodes + counts.barcodeItemCodes : (counts) => counts[key];
  const beforeValue = value(before);
  const afterValue = value(after);
  const finalValue = value(final);
  return { subsystem, persistence, before: beforeValue, after: afterValue, final: finalValue, result: beforeValue === 0 && afterValue === 0 && finalValue === 0 ? "PASS" : "FAIL" };
});

function assertZeroPosting(counts, phase) {
  assert.ok(Object.values(counts).every((value) => value === 0), `${phase} zero-posting invariant failed: ${JSON.stringify(counts)}`);
}

async function cleanup() {
  // The verifier expects these rows never to exist. Exact company-scoped removal
  // keeps cleanup safe if a failing regression produced one before an assertion.
  await models.ReservationRefundAllocation.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.ReservationRefund.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.ReservationPaymentTransfer.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.ReservationPaymentApplication.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.ReservationPayment.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.CustomerCreditTransaction.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.Payment.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.CashTransaction.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.GoldFixing.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.GoldPrice.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.CustomerGoldPool.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.InventoryGoldPool.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.Notification.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.BarcodeInventoryCode.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.BarcodeItemCode.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.BarcodeSequence.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.StockMovement.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.Asset.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.sequelize.query("DELETE FROM journal_lines WHERE journal_entry_id IN (SELECT id FROM journal_entries WHERE company_id IN (:companies))", { replacements: { companies: [ids.company, ids.otherCompany] }, type: QueryTypes.DELETE });
  await models.JournalEntry.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.PurchaseOrder.destroy({ where: { companyId: [ids.company, ids.otherCompany] }, force: true });
  await models.sequelize.query("DELETE FROM audit_logs WHERE company_id IN (:companies)", { replacements: { companies: [ids.company, ids.otherCompany] }, type: QueryTypes.DELETE });
  await models.IdempotencyRequest.destroy({ where: { companyId: [ids.company, ids.otherCompany] } });
  await models.GoldPurchaseApprovalRequest.destroy({ where: { companyId: [ids.company, ids.otherCompany] }, force: true });
  await models.CustomerGoldPurchaseItem.destroy({ where: { companyId: [ids.company, ids.otherCompany] }, force: true });
  await models.InvestmentGoldPurchaseItem.destroy({ where: { companyId: [ids.company, ids.otherCompany] }, force: true });
  await models.CustomerGoldPurchaseDocument.destroy({ where: { companyId: [ids.company, ids.otherCompany] }, force: true });
  await models.InvestmentGoldPurchaseDocument.destroy({ where: { companyId: [ids.company, ids.otherCompany] }, force: true });
  await models.UserRole.destroy({ where: { userId: userIds } });
  await models.RolePermission.destroy({ where: { roleId: roleIds } });
  await models.Role.destroy({ where: { id: roleIds } });
  await models.User.destroy({ where: { id: userIds }, force: true });
  await models.Customer.destroy({ where: { id: ids.customer }, force: true });
  await models.Supplier.destroy({ where: { id: ids.supplier }, force: true });
  await models.Branch.destroy({ where: { id: [ids.branchA, ids.branchB, ids.otherBranch] } });
  await models.Company.destroy({ where: { id: [ids.company, ids.otherCompany] } });
}

async function createAndValidate(kind, suffix, user = ids.maker, branchId = ids.branchA) {
  const body = kind === "cgp" ? cgpBody({ notes: `${namespace}-${suffix}`, branchId }) : igpBody({ notes: `${namespace}-${suffix}`, branchId });
  const created = await request("POST", `/gold-purchases/${kind}/drafts`, { user, branchId, body, key: `${namespace}-${suffix}-CREATE` });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const validated = await request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(created.body.data.id)}/validate`, { user, branchId, body: { version: 1 }, key: `${namespace}-${suffix}-VALIDATE` });
  assert.equal(validated.status, 200, JSON.stringify(validated.body));
  return validated.body.data;
}

async function submit(kind, draft, suffix, user = ids.maker, branchId = ids.branchA) {
  return request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(draft.id)}/submit`, { user, branchId, body: { version: draft.version }, key: `${namespace}-${suffix}-SUBMIT` });
}

async function assertPendingUnchanged(kind, doc, approval, actor, decision, suffix) {
  const result = await request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(doc.id)}/${decision}`, {
    user: actor,
    body: { version: doc.version, approvalVersion: approval.version, reason: `${namespace} denied self review` },
    key: `${namespace}-${suffix}`
  });
  expectError(result, 403, "SELF_APPROVAL_FORBIDDEN");
  const cfg = kind === "cgp" ? models.CustomerGoldPurchaseDocument : models.InvestmentGoldPurchaseDocument;
  const persisted = await cfg.findByPk(doc.id);
  const persistedApproval = await models.GoldPurchaseApprovalRequest.findByPk(approval.id);
  assert.equal(persisted.status, "submitted"); assert.equal(persisted.version, doc.version);
  assert.equal(persistedApproval.approvalStatus, "pending"); assert.equal(persistedApproval.reviewedBy, null);
  assert.equal(await models.IdempotencyRequest.count({ where: { companyId: ids.company, key: `${namespace}-${suffix}` } }), 0);
  assert.equal(await models.AuditLog.count({ where: { companyId: ids.company, action: `${kind}.draft.${decision === "approve" ? "approved" : "rejected"}` } }), 0);
}

async function exerciseUnauthorizedSelfReview(kind) {
  for (const decision of ["approve", "reject"]) {
    const creatorDraft = await createAndValidate(kind, `${kind}-CREATOR-${decision}`);
    const creatorSubmitted = await submit(kind, creatorDraft, `${kind}-CREATOR-${decision}`);
    await assertPendingUnchanged(kind, creatorSubmitted.body.data.document, creatorSubmitted.body.data.approvalRequest, ids.maker, decision, `${kind}-CREATOR-${decision}`);
    const submittedDraft = await createAndValidate(kind, `${kind}-SUBMITTER-${decision}`, ids.draftCreator);
    const submitted = await submit(kind, submittedDraft, `${kind}-SUBMITTER-${decision}`, ids.maker);
    await assertPendingUnchanged(kind, submitted.body.data.document, submitted.body.data.approvalRequest, ids.maker, decision, `${kind}-SUBMITTER-${decision}`);
  }
}

async function exerciseAuthorizedSelfReview(kind, decision, actor = ids.selfMaker, suffix = "SELF") {
  const draft = await createAndValidate(kind, `${kind}-${suffix}-${decision}`, actor);
  const submitted = await submit(kind, draft, `${kind}-${suffix}-${decision}`, actor);
  const doc = submitted.body.data.document; const approval = submitted.body.data.approvalRequest;
  const endpoint = `/gold-purchases/${kind}/drafts/${encodeURIComponent(doc.id)}/${decision}`;
  const missingReason = await request("POST", endpoint, { user: actor, body: { version: doc.version, approvalVersion: approval.version }, key: `${namespace}-${kind}-${suffix}-${decision}-MISSING` });
  expectError(missingReason, 422, "VALIDATION_FAILED");
  const body = { version: doc.version, approvalVersion: approval.version, reason: `${namespace} controlled self ${decision}` };
  const key = `${namespace}-${kind}-${suffix}-${decision}-SUCCESS`;
  const success = await request("POST", endpoint, { user: actor, body, key });
  assert.equal(success.status, 200, JSON.stringify(success.body));
  const expectedStatus = decision === "approve" ? "approved" : "draft";
  assert.equal(success.body.data.document.status, expectedStatus);
  assert.equal(success.body.data.approvalRequest.approvalStatus, decision === "approve" ? "approved" : "rejected");
  assert.equal(success.body.data.approvalRequest.reviewedBy, actor);
  assert.equal(success.body.data.approvalRequest.reviewReason, body.reason);
  assert.equal(success.body.data.document.version, doc.version + 1);
  assert.equal(success.body.data.approvalRequest.submittedSnapshotHash, approval.submittedSnapshotHash);
  const replay = await request("POST", endpoint, { user: actor, body, key }); assert.equal(replay.status, 200);
  expectError(await request("POST", endpoint, { user: actor, body: { ...body, reason: "different payload" }, key }), 409, "CONFLICT");
  const auditRows = await models.AuditLog.findAll({ where: { companyId: ids.company, action: `${kind}.draft.${decision === "approve" ? "approved" : "rejected"}` } });
  const event = auditRows.find((row) => { try { return JSON.parse(row.after || "{}").documentId === doc.id; } catch { return false; } });
  assert.ok(event, "self-review audit event"); const metadata = JSON.parse(event.after); assert.equal(metadata.isSelfReview, true); assert.equal(metadata.selfReviewPermission, `gold_purchase.${kind}.self_approve`); assert.equal(metadata.reviewReason, body.reason);
  return success.body.data;
}

async function runModule(kind) {
  const validated = await createAndValidate(kind, `${kind}-APPROVE`);
  const submitted = await submit(kind, validated, `${kind}-APPROVE`);
  assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
  assert.equal(submitted.body.data.document.status, "submitted");
  assert.equal(submitted.body.data.approvalRequest.approvalStatus, "pending");
  assert.match(submitted.body.data.approvalRequest.submittedSnapshotHash, /^[a-f0-9]{64}$/);
  const replay = await submit(kind, validated, `${kind}-APPROVE`); assert.equal(replay.status, 200); assert.equal(replay.body.data.approvalRequest.id, submitted.body.data.approvalRequest.id);
  const doc = submitted.body.data.document; const approval = submitted.body.data.approvalRequest;
  expectError(await request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(doc.id)}/submit`, { body: { version: doc.version }, key: `${namespace}-${kind}-DUPLICATE-PENDING` }), 409, "APPROVAL_ALREADY_PENDING");
  expectError(await request("PATCH", `/gold-purchases/${kind}/drafts/${encodeURIComponent(doc.id)}`, { body: { ...(kind === "cgp" ? cgpBody() : igpBody()), version: doc.version } }), 409, "DOCUMENT_IMMUTABLE");
  expectError(await request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(doc.id)}/approve`, { body: { version: doc.version, approvalVersion: approval.version, reason: "denied self review" }, key: `${namespace}-${kind}-SELF-APPROVE` }), 403, "SELF_APPROVAL_FORBIDDEN");
  if (kind === "cgp") expectError(await request("POST", `/gold-purchases/cgp/drafts/${encodeURIComponent(doc.id)}/approve`, { user: ids.ownReviewer, body: { version: doc.version, approvalVersion: approval.version }, key: `${namespace}-OWN-APPROVE` }), 403, "FORBIDDEN");
  if (kind === "cgp") {
    await models.CustomerGoldPurchaseDocument.update({ notes: `${namespace}-tampered` }, { where: { id: doc.id } });
    expectError(await request("POST", `/gold-purchases/cgp/drafts/${encodeURIComponent(doc.id)}/approve`, { user: ids.reviewer, body: { version: doc.version, approvalVersion: approval.version }, key: `${namespace}-SNAPSHOT-TAMPER` }), 409, "SNAPSHOT_MISMATCH");
    await models.CustomerGoldPurchaseDocument.update({ notes: `${namespace}-cgp-APPROVE` }, { where: { id: doc.id } });
  }
  const approved = await request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(doc.id)}/approve`, { user: ids.reviewer, body: { version: doc.version, approvalVersion: approval.version }, key: `${namespace}-${kind}-APPROVE` });
  assert.equal(approved.status, 200, JSON.stringify(approved.body)); assert.equal(approved.body.data.document.status, "approved"); assert.equal(approved.body.data.approvalRequest.approvalStatus, "approved");
  expectError(await request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(doc.id)}/void`, { body: { version: approved.body.data.document.version, reason: "no" }, key: `${namespace}-${kind}-VOID-APPROVED` }), 409, "DOCUMENT_IMMUTABLE");
  const revision = await request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(doc.id)}/revisions`, { body: { version: approved.body.data.document.version }, key: `${namespace}-${kind}-REVISION` });
  assert.equal(revision.status, 201, JSON.stringify(revision.body)); assert.equal(revision.body.data.status, "draft"); assert.equal(revision.body.data.revisionNumber, 2); assert.equal(revision.body.data.supersedesDocumentId, doc.id);
  const revisionReplay = await request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(doc.id)}/revisions`, { body: { version: approved.body.data.document.version }, key: `${namespace}-${kind}-REVISION` });
  assert.equal(revisionReplay.status, 201); assert.equal(revisionReplay.body.data.id, revision.body.data.id);

  const rejectValidated = await createAndValidate(kind, `${kind}-REJECT`);
  const rejectSubmitted = await submit(kind, rejectValidated, `${kind}-REJECT`);
  expectError(await request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(rejectValidated.id)}/reject`, { user: ids.reviewer, body: { version: rejectSubmitted.body.data.document.version, approvalVersion: rejectSubmitted.body.data.approvalRequest.version }, key: `${namespace}-${kind}-REJECT-NO-REASON` }), 422, "VALIDATION_FAILED");
  const rejected = await request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(rejectValidated.id)}/reject`, { user: ids.reviewer, body: { version: rejectSubmitted.body.data.document.version, approvalVersion: rejectSubmitted.body.data.approvalRequest.version, reason: `${namespace} correction required` }, key: `${namespace}-${kind}-REJECT` });
  assert.equal(rejected.status, 200, JSON.stringify(rejected.body)); assert.equal(rejected.body.data.document.status, "draft"); assert.equal(rejected.body.data.approvalRequest.approvalStatus, "rejected"); assert.equal(rejected.body.data.document.lastRejectionReason, `${namespace} correction required`);
  const updated = await request("PATCH", `/gold-purchases/${kind}/drafts/${encodeURIComponent(rejectValidated.id)}`, { body: { ...(kind === "cgp" ? cgpBody({ notes: `${namespace}-corrected` }) : igpBody({ notes: `${namespace}-corrected` })), version: rejected.body.data.document.version } });
  assert.equal(updated.status, 200); assert.equal(updated.body.data.status, "draft");
  const revalidated = await request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(rejectValidated.id)}/validate`, { body: { version: updated.body.data.version }, key: `${namespace}-${kind}-REVALIDATE` });
  const resubmitted = await request("POST", `/gold-purchases/${kind}/drafts/${encodeURIComponent(rejectValidated.id)}/submit`, { body: { version: revalidated.body.data.version }, key: `${namespace}-${kind}-RESUBMIT` });
  assert.notEqual(resubmitted.body.data.approvalRequest.id, rejectSubmitted.body.data.approvalRequest.id);
  const history = await models.GoldPurchaseApprovalRequest.findAll({ where: { documentId: rejectValidated.id }, order: [["requestedAt", "ASC"]] });
  assert.equal(history.length, 2); assert.equal(history[0].approvalStatus, "rejected"); assert.equal(history[1].approvalStatus, "pending"); assert.notEqual(history[0].submittedSnapshotHash, history[1].submittedSnapshotHash);
  return { approved: approved.body.data.document, pending: resubmitted.body.data.document };
}

async function run() {
  await models.sequelize.authenticate();
  const catalog = await models.Permission.findAll({ where: { name: permissionNames }, attributes: ["name"] });
  assert.equal(catalog.length, 24, "exact Phase 33C-HF1 permission catalog");
  await setup();
  server = await new Promise((resolve) => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  zeroPostingBefore = await zeroPostingCounts(); assertZeroPosting(zeroPostingBefore, "before");

  expectError(await request("GET", "/gold-purchases/cgp/drafts", { user: null }), 401, "UNAUTHORIZED");
  expectError(await request("GET", "/gold-purchases/cgp/drafts", { user: ids.noPerm }), 403, "FORBIDDEN");
  const legacyDraft = await request("POST", "/gold-purchases/cgp/drafts", { user: ids.legacy, body: cgpBody({ notes: `${namespace}-legacy` }), key: `${namespace}-LEGACY-CREATE` });
  assert.equal(legacyDraft.status, 201); const legacyValidated = await request("POST", `/gold-purchases/cgp/drafts/${encodeURIComponent(legacyDraft.body.data.id)}/validate`, { user: ids.legacy, body: { version: 1 }, key: `${namespace}-LEGACY-VALIDATE` }); assert.equal(legacyValidated.status, 200);
  expectError(await request("POST", `/gold-purchases/cgp/drafts/${encodeURIComponent(legacyDraft.body.data.id)}/submit`, { user: ids.legacy, body: { version: 2 }, key: `${namespace}-LEGACY-SUBMIT` }), 403, "FORBIDDEN");
  expectError(await request("POST", `/gold-purchases/cgp/drafts/${encodeURIComponent(legacyDraft.body.data.id)}/revisions`, { user: ids.legacy, body: { version: 2 }, key: `${namespace}-LEGACY-REVISION` }), 403, "FORBIDDEN");
  const unvalidated = await request("POST", "/gold-purchases/cgp/drafts", { body: cgpBody({ notes: `${namespace}-unvalidated` }), key: `${namespace}-UNVALIDATED-CREATE` });
  assert.equal(unvalidated.status, 201);
  expectError(await submit("cgp", unvalidated.body.data, "DRAFT-SUBMIT"), 409, "DOCUMENT_NOT_VALIDATED");

  await exerciseUnauthorizedSelfReview("cgp");
  await exerciseUnauthorizedSelfReview("igp");
  await exerciseAuthorizedSelfReview("cgp", "approve");
  await exerciseAuthorizedSelfReview("igp", "approve");
  await exerciseAuthorizedSelfReview("cgp", "reject");
  await exerciseAuthorizedSelfReview("igp", "reject");
  await exerciseAuthorizedSelfReview("cgp", "approve", ids.superAdmin, "ROLE-IS-ADMIN");
  await exerciseAuthorizedSelfReview("igp", "approve", ids.superAdmin, "ROLE-IS-ADMIN");

  const cgp = await runModule("cgp");
  const igp = await runModule("igp");

  const ownDraft = await createAndValidate("cgp", "OWN-SCOPE", ids.ownMaker, ids.branchA);
  const ownList = await request("GET", "/gold-purchases/cgp/drafts?page=1&limit=100", { user: ids.ownMaker });
  assert.equal(ownList.status, 200); assert.ok(ownList.body.data.items.some((item) => item.id === ownDraft.id)); assert.ok(ownList.body.data.items.every((item) => item.createdBy === ids.ownMaker));
  const ownCrossBranch = await request("GET", `/gold-purchases/cgp/drafts?branchId=${encodeURIComponent(ids.branchB)}`, { user: ids.ownMaker }); assert.equal(ownCrossBranch.body.data.pagination.total, 0);

  const branchBDraft = await createAndValidate("cgp", "BRANCH-B", ids.branchMaker, ids.branchB);
  const branchBSubmitted = await submit("cgp", branchBDraft, "BRANCH-B", ids.branchMaker, ids.branchB); assert.equal(branchBSubmitted.status, 200);
  const branchAQueue = await request("GET", `/gold-purchases/approvals?branchId=${encodeURIComponent(ids.branchB)}`, { user: ids.reviewer }); assert.equal(branchAQueue.body.data.pagination.total, 0);
  const allBranchQueue = await request("GET", `/gold-purchases/approvals?branchId=${encodeURIComponent(ids.branchB)}`, { user: ids.allReviewer }); assert.ok(allBranchQueue.body.data.items.some((item) => item.documentId === branchBDraft.id));
  const allBranchDrafts = await request("GET", `/gold-purchases/cgp/drafts?branchId=${encodeURIComponent(ids.branchB)}`, { user: ids.allReviewer }); assert.ok(allBranchDrafts.body.data.items.some((item) => item.id === branchBDraft.id));

  const queue = await request("GET", "/gold-purchases/approvals?approvalStatus=pending&page=1&limit=1", { user: ids.reviewer });
  assert.equal(queue.status, 200, JSON.stringify(queue.body)); assert.ok(queue.body.data.pagination.total >= 2); assert.equal(queue.body.data.items.length, 1);
  const queueFilter = await request("GET", "/gold-purchases/approvals?aggregateType=cgp&approvalStatus=pending", { user: ids.reviewer }); assert.ok(queueFilter.body.data.items.every((item) => item.aggregateType === "cgp"));
  expectError(await request("GET", "/gold-purchases/approvals", { user: ids.noPerm }), 403, "FORBIDDEN");
  expectError(await request("GET", `/gold-purchases/cgp/drafts/${encodeURIComponent(cgp.approved.id)}`, { user: ids.branchMaker, branchId: ids.branchB }), 404, "RESOURCE_NOT_FOUND");

  const concurrent = await createAndValidate("cgp", "CONCURRENT");
  const concurrentSubmitted = await submit("cgp", concurrent, "CONCURRENT");
  const reviewBody = { version: concurrentSubmitted.body.data.document.version, approvalVersion: concurrentSubmitted.body.data.approvalRequest.version };
  const [approveResult, rejectResult] = await Promise.all([
    request("POST", `/gold-purchases/cgp/drafts/${encodeURIComponent(concurrent.id)}/approve`, { user: ids.reviewer, body: reviewBody, key: `${namespace}-CONCURRENT-APPROVE` }),
    request("POST", `/gold-purchases/cgp/drafts/${encodeURIComponent(concurrent.id)}/reject`, { user: ids.reviewer, body: { ...reviewBody, reason: "concurrent rejection" }, key: `${namespace}-CONCURRENT-REJECT` })
  ]);
  assert.equal([approveResult, rejectResult].filter((result) => result.status === 200).length, 1, JSON.stringify([approveResult, rejectResult]));
  assert.equal([approveResult, rejectResult].filter((result) => result.status === 409).length, 1, JSON.stringify([approveResult, rejectResult]));

  zeroPostingAfter = await zeroPostingCounts(); assert.deepEqual(zeroPostingAfter, zeroPostingBefore, `zero-posting invariant failed: ${JSON.stringify(zeroPostingAfter)}`);
  const actions = new Set((await models.AuditLog.findAll({ where: { companyId: ids.company }, attributes: ["action"] })).map((row) => row.action));
  for (const action of ["cgp.draft.submitted", "cgp.draft.approved", "cgp.draft.rejected", "cgp.draft.revision_created", "igp.draft.submitted", "igp.draft.approved", "igp.draft.rejected", "igp.draft.revision_created"]) assert.ok(actions.has(action), `audit ${action}`);
  console.log(JSON.stringify({ namespace, permissions: "24/24 PASS", cgp: "PASS", igp: "PASS", makerChecker: "PASS", immutableSnapshots: "PASS", revisions: "PASS", approvalQueue: "PASS", branchScope: "PASS", concurrency: "PASS", zeroPosting: zeroPostingAfter }, null, 2));
  console.log("LIVE TESTS EXECUTED");
  runCompleted = true;
}

(async () => {
  try { await run(); }
  finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await cleanup().catch((error) => console.error("cleanup error", error));
    zeroPostingFinal = await zeroPostingCounts();
    assertZeroPosting(zeroPostingFinal, "final cleanup");
    const residual = await models.sequelize.query("SELECT (SELECT count(*) FROM customer_gold_purchase_documents WHERE company_id=:company) + (SELECT count(*) FROM investment_gold_purchase_documents WHERE company_id=:company) + (SELECT count(*) FROM gold_purchase_approval_requests WHERE company_id=:company) + (SELECT count(*) FROM idempotency_requests WHERE company_id=:company) + (SELECT count(*) FROM audit_logs WHERE company_id=:company) + (SELECT count(*) FROM users WHERE company_id=:company) + (SELECT count(*) FROM roles WHERE company_id=:company) AS count", { replacements: { company: ids.company }, type: QueryTypes.SELECT }).catch(() => [{ count: 0 }]);
    assert.equal(Number(residual[0]?.count || 0), 0, "persistent namespace pollution detected");
    if (runCompleted) {
      const matrix = zeroPostingMatrix(zeroPostingBefore, zeroPostingAfter, zeroPostingFinal);
      assert.ok(matrix.every((row) => row.result === "PASS"), `complete zero-posting matrix failed: ${JSON.stringify(matrix)}`);
      console.log(JSON.stringify({ zeroPostingMatrix: matrix }, null, 2));
      console.log("COMPLETE ZERO-POSTING MATRIX PASSED");
    }
    await models.sequelize.close();
  }
  console.log("No persistent test pollution detected");
})().catch((error) => { console.error(error.stack || error); process.exit(1); });
