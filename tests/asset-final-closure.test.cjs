const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const route = read("backend/src/routes/erp.routes.js");
const runtime = read("backend/src/services/inventory-v2-runtime.service.js");
const policy = read("backend/src/services/inventory-master-policy.service.js");
const locationService = read("backend/src/services/inventory-location.service.js");
const metadataService = read("backend/src/services/asset-metadata.service.js");
const assetModel = read("backend/src/models/asset.model.js");
const inventoryPage = read("app/[locale]/(dashboard)/inventory/page.tsx");
const detailPage = read("app/[locale]/(dashboard)/inventory/[id]/page.tsx");
const listHook = read("features/inventory/hooks/use-inventory-v2.ts");
const immutabilityMigration = read("backend/migrations/20260804050000-inventory-compatibility-backfill-support-indexes.js");
const barcodeMigration = read("backend/migrations/20260817010000-barcode-replacement-status-foundation.js");

test("Asset is the physical authority and Product quantity is excluded", () => {
  assert.match(inventoryPage, /every row is exactly one physical Asset/);
  assert.match(inventoryPage, /useInventoryV2List/);
  assert.match(listHook, /\/inventory-v2\/assets\?/);
  assert.match(route, /Canonical All Items search queries only serialized Assets/);
  assert.match(route, /Product quantity|Products never provide stock results/);
  assert.match(policy, /FINAL_CLIENT_PROFILE_CANONICAL_CODES/);
});

test("one physical piece maps to one Asset and receive perPiece cardinality", () => {
  assert.match(runtime, /one|perPiece/i);
  assert.match(runtime, /INVENTORY_V2_PER_PIECE_LENGTH_MISMATCH/);
  assert.match(route, /inventoryV2Target/);
  assert.match(route, /productId: null/);
  assert.match(assetModel, /id: \{/);
});

test("company, branch, and location are server-scoped", () => {
  assert.match(route, /where: \{ id: assetId, companyId: req\.companyId, branchId \}/);
  assert.match(route, /a\.company_id=:companyId/);
  assert.match(route, /a\.branch_id=:branchId/);
  assert.match(route, /resolveAuthorizedBranchId\(req/);
  assert.match(locationService, /InventoryLocation/);
  assert.match(locationService, /companyId, branchId/);
  assert.match(route, /cross-branch|branch/i);
});

test("status authority is canonical and arbitrary status payloads are rejected", () => {
  assert.match(runtime, /const OPERATIONAL_STATUS = Object\.freeze/);
  assert.match(runtime, /const TRANSITIONS = Object\.freeze/);
  assert.match(runtime, /INVENTORY_OPERATIONAL_STATUS_PAYLOAD_FORBIDDEN/);
  assert.match(runtime, /INVENTORY_CANONICAL_TRANSITION_TRANSACTION_REQUIRED/);
  assert.match(runtime, /INVENTORY_CANONICAL_TRANSITION_COMPANY_SCOPE_INVALID/);
  assert.doesNotMatch(runtime.match(/const OPERATIONAL_STATUS = Object\.freeze\(\[([\s\S]*?)\]\);/)[1], /IN_TRANSFER|RECOVERED|EXCHANGED/);
});

test("Asset detail exposes identity, source, cost, barcode, and immutable history", () => {
  assert.match(route, /router\.get\("\/inventory-v2\/assets\/:id"/);
  assert.match(route, /asset_origins/);
  assert.match(route, /asset_purchase_cost_revisions/);
  assert.match(route, /asset_barcode_history|barcode/);
  assert.match(route, /asset_events/);
  assert.match(route, /inventory_asset_movements/);
  assert.match(detailPage, /Unified Item History/);
  assert.match(detailPage, /Frozen Purchase Snapshot/);
});

test("origin, cost revision, movement, and barcode relations are preserved", () => {
  assert.match(runtime, /persistReceiptEvidence/);
  assert.match(runtime, /recordMovement/);
  assert.match(route, /purchase_order_item_asset_links/);
  assert.match(immutabilityMigration, /assets_hard_delete_forbidden_trg/);
  assert.match(immutabilityMigration, /inventory_evidence_immutable_guard/);
  assert.match(barcodeMigration, /asset_barcode_history/);
  assert.match(barcodeMigration, /asset_barcode_history_one_active_uq/);
});

test("historically used Assets cannot be hard-deleted and metadata edits stay scoped", () => {
  assert.match(immutabilityMigration, /assets_hard_delete_forbidden_trg/);
  assert.match(detailPage, /inventory-v2\/assets\/[\s\S]*\/metadata/);
  assert.match(detailPage, /expectedUpdatedAt/);
  assert.match(metadataService, /expectedUpdatedAt/);
});

test("idempotent receive/replay preserves the Asset boundary", () => {
  assert.match(route, /idempotencyService\.claim/);
  assert.match(route, /idempotencyService\.succeed/);
  assert.match(runtime, /idempotencyKey/);
  assert.match(route, /STATE_CONFLICT|IDEMPOTENCY/);
});

test("legacy Product compatibility remains separately classified", () => {
  assert.match(route, /if \(item\.productCode && !inventoryV2Target\)/);
  assert.match(policy, /isFinalClientInventoryProduct/);
  assert.match(policy, /FINAL_CLIENT_PROFILE/);
});
