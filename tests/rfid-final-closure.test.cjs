const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const runtime = read("backend/src/services/inventory-v2-runtime.service.js");
const routes = read("backend/src/routes/erp.routes.js");
const controller = read("backend/src/controllers/erp.controller.js");
const policy = read("backend/src/services/inventory-master-policy.service.js");
const migration = read("backend/migrations/20260804020000-inventory-components-rfid-history-foundation.js");
const supportMigration = read("backend/migrations/20260804050000-inventory-compatibility-backfill-support-indexes.js");
const assetModel = read("backend/src/models/asset.model.js");
const inventoryPage = read("app/[locale]/(dashboard)/inventory/page.tsx");
const detailPage = read("app/[locale]/(dashboard)/inventory/[id]/page.tsx");
const inventoryListHook = read("features/inventory/hooks/use-inventory-v2.ts");
const inventoryV2Runtime = require(path.join(root, "backend/src/services/inventory-v2-runtime.service.js"));

test("RFID is an optional Asset-linked identity, not a stock authority", () => {
  assert.match(assetModel, /rfid:\s*\{\s*type: DataTypes\.STRING/);
  assert.match(migration, /createTable\("asset_rfid_assignments"/);
  assert.match(runtime, /async function assignRfid/);
  assert.match(runtime, /async function unassignRfid/);
  assert.match(runtime, /asset\.update\(\{ rfid: normalized/);
  assert.match(inventoryPage, /RFID is optional|RFID اختياري/);
  assert.match(inventoryPage, /Barcode is the permanent primary identity|الباركود هو الهوية الرئيسية الدائمة/);
  assert.match(policy, /rfidAllowed: true/);
});

test("RFID assignment is server-authoritative and scoped to an authorized Asset", () => {
  assert.match(routes, /\/inventory-v2\/assets\/:id\/rfid/);
  assert.match(routes, /requireBusinessPermission\("inventory\.adjust"/);
  assert.match(routes, /resolveAuthorizedBranchId\(req/);
  assert.match(routes, /findScopedInventoryV2Asset\(req, req\.params\.id, branchId/);
  assert.match(runtime, /companyId: context\.companyId/);
  assert.match(runtime, /branchId: asset\.branchId/);
  assert.doesNotMatch(routes, /req\.body\?\.companyId/);
});

test("RFID values are opaque external identifiers and are not Barcode-formatted", () => {
  assert.match(runtime, /const normalized = String\(rfidNumber \|\| ""\)\.trim\(\)/);
  assert.match(runtime, /INVENTORY_V2_RFID_REQUIRED/);
  assert.doesNotMatch(runtime, /formatBarcode\([^)]*rfid/);
  assert.match(migration, /rfid_number: \{ type: Sequelize\.STRING\(128\)/);
});

test("RFID uniqueness and one-current-tag cardinality are database-backed", () => {
  assert.match(migration, /asset_rfid_number_global_uq/);
  assert.match(migration, /asset_rfid_one_current_uq/);
  assert.match(migration, /where: \{ is_current: true \}/);
  assert.match(migration, /asset_rfid_status_ck/);
  assert.match(runtime, /WHERE rfid_number=:rfidNumber FOR UPDATE/);
  assert.match(runtime, /INVENTORY_V2_RFID_REUSE_FORBIDDEN/);
});

test("RFID replacement preserves the Asset and retires the previous assignment", () => {
  assert.match(runtime, /SELECT id,rfid_number FROM asset_rfid_assignments/);
  assert.match(runtime, /WHERE asset_id=:assetId AND is_current=true FOR UPDATE/);
  assert.match(runtime, /SET is_current=false,status='REPLACED'/);
  assert.match(runtime, /replacement_reason=:reason/);
  assert.match(runtime, /RFID_REPLACED/);
  assert.match(routes, /inventory_v2\.rfid_assigned/);
  assert.match(routes, /\/inventory-v2\/assets\/:id\/rfid\/unassign/);
  assert.match(runtime, /SET is_current=false,status='INACTIVE'/);
  assert.match(runtime, /RFID_UNASSIGNED/);
});

test("RFID assignment replay and conflicts use the existing Asset event idempotency contract", () => {
  assert.match(routes, /requireInventoryV2IdempotencyKey\(req\)/);
  assert.match(routes, /asset_events WHERE company_id=:companyId AND idempotency_key=:idempotencyKey/);
  assert.match(routes, /Idempotency-Key body conflict/);
  assert.match(runtime, /idempotencyKey/);
  assert.match(routes, /auditService\.record/);
});

test("RFID assignment and scan service contracts preserve one Asset link without DB writes", async () => {
  const assignmentQueries = [];
  const assignedAsset = {
    id: "ASSET-RFID-UNIT",
    branchId: "BRANCH-RFID-UNIT",
    companyId: "COMPANY-RFID-UNIT",
    operationalStatus: "AVAILABLE",
    inventoryProfile: "GOLD_BY_PIECE",
    async update(values) { Object.assign(this, values); },
  };
  const assignmentModels = {
    sequelize: { query: async (sql) => { assignmentQueries.push(String(sql)); return [[]]; } },
    AssetEvent: { create: async (values) => ({ id: "EVENT-RFID-UNIT", ...values }) },
  };
  const assigned = await inventoryV2Runtime.assignRfid({
    models: assignmentModels,
    transaction: { id: "UNIT-TRANSACTION" },
    asset: assignedAsset,
    context: { companyId: assignedAsset.companyId, branchId: assignedAsset.branchId, actorId: "ACTOR", actorName: "Unit Test", branchName: "Branch" },
    rfidNumber: "EXT-RFID-UNIT-001",
    idempotencyKey: "IDEM-RFID-UNIT",
  });
  assert.equal(assigned.rfidNumber, "EXT-RFID-UNIT-001");
  assert.equal(assignedAsset.rfid, "EXT-RFID-UNIT-001");
  assert.ok(assignmentQueries.some((sql) => sql.includes("INSERT INTO asset_rfid_assignments")));

  const scanModels = {
    sequelize: { query: async (sql) => String(sql).includes("FROM asset_rfid_assignments r JOIN assets a")
      ? [[{ assignment_id: "ASSIGNMENT-RFID-UNIT", asset_id: assignedAsset.id, branch_id: assignedAsset.branchId }]]
      : [[]] },
  };
  const scanned = await inventoryV2Runtime.recordRfidScan({
    models: scanModels,
    transaction: { id: "SCAN-TRANSACTION" },
    context: { companyId: assignedAsset.companyId, branchId: assignedAsset.branchId, actorId: "ACTOR", actorName: "Unit Test" },
    rfidNumber: "EXT-RFID-UNIT-001",
  });
  assert.deepEqual(scanned, { assetId: assignedAsset.id, assignmentId: "ASSIGNMENT-RFID-UNIT" });

  const unassignQueries = [];
  const unassigned = await inventoryV2Runtime.unassignRfid({
    models: {
      sequelize: { query: async (sql) => {
        unassignQueries.push(String(sql));
        return String(sql).includes("status='ACTIVE'") ? [[{ id: "ASSIGNMENT-RFID-UNIT", rfid_number: "EXT-RFID-UNIT-001" }]] : [[]];
      } },
      AssetEvent: { create: async (values) => ({ id: "EVENT-RFID-UNASSIGN-UNIT", ...values }) },
    },
    transaction: { id: "UNASSIGN-TRANSACTION" },
    asset: assignedAsset,
    context: { companyId: assignedAsset.companyId, branchId: assignedAsset.branchId, actorId: "ACTOR", actorName: "Unit Test", branchName: "Branch" },
    reason: "UNIT-UNASSIGN-REASON",
    idempotencyKey: "IDEM-RFID-UNASSIGN-UNIT",
  });
  assert.equal(unassigned.rfidNumber, "EXT-RFID-UNIT-001");
  assert.equal(assignedAsset.rfid, null);
  assert.ok(unassignQueries.some((sql) => sql.includes("status='INACTIVE'")));
});

test("RFID scan resolves one current Asset in the current company", () => {
  assert.match(routes, /\/inventory-v2\/rfid\/scan/);
  assert.match(routes, /requireBusinessPermission\("inventory\.view"/);
  assert.match(runtime, /FROM asset_rfid_assignments r JOIN assets a ON a\.id=r\.asset_id/);
  assert.match(runtime, /rfid_number=:rfidNumber AND r\.company_id=:companyId/);
  assert.match(runtime, /r\.is_current=true AND r\.status='ACTIVE'/);
  assert.match(runtime, /INVENTORY_V2_RFID_NOT_FOUND/);
  assert.match(routes, /findScopedInventoryV2Asset\(req, data\.assetId, branchId/);
});

test("RFID assign, scan, and unassign remain server-scoped to company and branch", () => {
  assert.match(routes, /router\.post\("\/inventory-v2\/assets\/:id\/rfid\/unassign", authMiddleware, requireBusinessPermission\("inventory\.adjust"/);
  assert.match(routes, /resolveAuthorizedBranchId\(req, req\.headers\["x-branch-id"\], \{ required: true \}\)/);
  assert.match(routes, /findScopedInventoryV2Asset\(req, req\.params\.id, branchId, transaction, \{ lock: true \}\)/);
  assert.match(runtime, /context\.companyId/);
  assert.match(runtime, /context\.branchId/);
});

test("RFID scan records evidence without becoming location or stock authority", () => {
  assert.match(runtime, /INSERT INTO rfid_scan_events/);
  assert.match(runtime, /branchId: context\.branchId/);
  assert.match(runtime, /return \{ assetId: row\.asset_id, assignmentId: row\.assignment_id \}/);
  assert.match(supportMigration, /rfid_scan_events/);
  assert.match(supportMigration, /inventory_evidence_immutable_guard/);
  assert.match(inventoryPage, /useInventoryV2List/);
  assert.match(inventoryPage, /a\.rfid|RFID/);
});

test("RFID and Barcode remain separate identities on the same Asset", () => {
  assert.match(detailPage, /Field label="Barcode"/);
  assert.match(detailPage, /Field label="RFID"/);
  assert.match(routes, /a\.barcode/);
  assert.match(routes, /rfid_number AS \\"rfidNumber\\"/);
  assert.match(inventoryPage, /asset\.barcode/);
  assert.match(inventoryPage, /asset\.rfid/);
});

test("Inventory search advertises RFID and the backend searches the Asset RFID source", () => {
  assert.match(inventoryPage, /بحث: باركود، RFID|Search barcode, RFID/);
  assert.match(routes, /OR a\.rfid ILIKE :search/);
  assert.match(routes, /r\.rfid_number/);
  assert.match(inventoryListHook, /\/inventory-v2\/assets\?/);
});

test("RFID history and scan evidence are protected from destructive application edits", () => {
  assert.match(migration, /onDelete: "RESTRICT"/);
  assert.match(supportMigration, /rfid_scan_events/);
  assert.match(supportMigration, /inventory_evidence_immutable_guard/);
  assert.match(routes, /\/inventory-v2\/assets\/:id\/rfid/);
  assert.match(detailPage, /Assign RFID|إسناد RFID/);
  assert.match(detailPage, /Replace RFID|استبدال RFID/);
  assert.match(detailPage, /Unassign RFID|إلغاء ربط RFID/);
  assert.match(detailPage, /Scan RFID|فحص RFID/);
  assert.match(detailPage, /apiClient\("\/inventory-v2\/rfid\/scan"/);
  assert.match(detailPage, /rfid\/unassign/);
  assert.doesNotMatch(routes, /setupCrud\("asset-rfid-assignments"/);
  assert.doesNotMatch(routes, /router\.(put|patch|delete)\("\/rfid/);
});

test("Generic Asset CRUD cannot overwrite RFID identity outside the assignment service", () => {
  assert.match(routes, /setupCrud\("assets", models\.Asset/);
  assert.match(controller, /const ASSET_IDENTITY_FIELDS/);
  assert.match(controller, /rfid: "rfid"/);
  assert.match(controller, /Barcode identity fields cannot be changed after generation/);
});

test("Supplier Receive keeps RFID optional and does not make it a creation authority", () => {
  assert.match(policy, /COMMON_OPTIONAL_FIELDS[\s\S]*rfid/);
  assert.match(runtime, /rfid: normalizeText\(piece\.rfid\)/);
  assert.match(routes, /profileContract:[\s\S]*rfid: v2Piece\.rfid/);
  assert.match(routes, /generateBarcodeForAsset/);
});

test("Hardware and POS RFID expansion remain outside this closure", () => {
  assert.match(routes, /RFID_SCAN/);
  assert.doesNotMatch(routes, /antenna|readerDriver|hardwareSdk/i);
  const posCheckout = routes.match(/router\.post\("\/pos\/checkout[\s\S]*?\n\}\);/)?.[0] || "";
  assert.doesNotMatch(posCheckout, /rfid/i);
});

test("RFID concurrent assignment is serialized in an isolated lock proof", async () => {
  let occupied = false;
  const makeAsset = (id) => ({ id, branchId: "BRANCH", companyId: "COMPANY", operationalStatus: "AVAILABLE", inventoryProfile: "GOLD_BY_PIECE", async update(values) { Object.assign(this, values); } });
  const models = {
    sequelize: { query: async (sql) => {
      const text = String(sql);
      if (text.includes("WHERE rfid_number=:rfidNumber FOR UPDATE")) {
        if (occupied) return [[{ id: "LOCKED", asset_id: "OTHER", status: "ACTIVE", is_current: true }]];
        occupied = true;
        await new Promise((resolve) => setTimeout(resolve, 2));
        return [[]];
      }
      return [[]];
    } },
    AssetEvent: { create: async (values) => ({ id: `EVENT-${values.assetId}`, ...values }) },
  };
  const context = { companyId: "COMPANY", branchId: "BRANCH", actorId: "ACTOR", actorName: "Unit Test" };
  const results = await Promise.allSettled([
    inventoryV2Runtime.assignRfid({ models, transaction: { id: "TX-1" }, asset: makeAsset("ASSET-1"), context, rfidNumber: "CONCURRENT-RFID", idempotencyKey: "KEY-1" }),
    inventoryV2Runtime.assignRfid({ models, transaction: { id: "TX-2" }, asset: makeAsset("ASSET-2"), context, rfidNumber: "CONCURRENT-RFID", idempotencyKey: "KEY-2" }),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected" && String(result.reason?.message).includes("INVENTORY_V2_RFID_REUSE_FORBIDDEN")).length, 1);
});
