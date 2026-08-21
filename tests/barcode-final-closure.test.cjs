const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const identity = read("backend/src/services/barcode-identity.service.js");
const runtime = read("backend/src/services/inventory-v2-runtime.service.js");
const routes = read("backend/src/routes/erp.routes.js");
const controller = read("backend/src/controllers/erp.controller.js");
const migration = read("backend/migrations/20260817010000-barcode-replacement-status-foundation.js");
const defaults = read("backend/src/config/barcode-defaults.js");
const inventoryRoute = read("app/[locale]/(dashboard)/inventory/page.tsx");
const detailPage = read("app/[locale]/(dashboard)/inventory/[id]/page.tsx");

test("Barcode format authority preserves inventory/item/karat/serial segments", () => {
  assert.match(identity, /function formatBarcode\(\{ inventoryCode, itemCode, karatCode, serial \}\)/);
  assert.match(identity, /String\(serialNumber\)\.padStart\(6, "0"\)/);
  assert.match(identity, /String\(numeric\)\.padStart\(2, "0"\)/);
  assert.match(defaults, /\["GW", "GP", "DD", "GS", "PL"\]/);
  assert.match(defaults, /const CLIENT_ITEM_CODES/);
  assert.ok(defaults.includes('["ANK", "Anklet"], ["BGL", "Bangle"], ["BAR", "Bar"]'));
  assert.match(defaults, /"ERG", "Earrings"/);
  assert.match(defaults, /"NCK", "Necklace"/);
});

test("Barcode generation is server-authoritative and database-backed", () => {
  assert.match(identity, /async function generateBarcodeForAsset/);
  assert.match(identity, /getEffectiveBarcodeSettings\(companyId/);
  assert.match(identity, /source: "database"/);
  assert.match(identity, /const requestedInventory = inventoryCode/);
  assert.match(identity, /const effectiveItemCode = validateItemCode/);
  assert.match(identity, /return \{[\s\S]*barcode,[\s\S]*barcodeSerial: serial/);
  assert.match(controller, /final stored barcode identity is allocated only by the/);
  assert.match(controller, /Client-supplied final/);
});

test("Serial allocation has a transactional UPSERT and uniqueness backstops", () => {
  assert.match(identity, /INSERT INTO barcode_sequences/);
  assert.match(identity, /ON CONFLICT \(company_id, inventory_code, item_code, karat_code\)/);
  assert.match(identity, /last_serial = barcode_sequences\.last_serial \+ 1/);
  assert.match(identity, /transactional? boundary|concurrency boundary/);
  assert.match(migration, /asset_barcode_history_barcode_uq/);
  assert.match(migration, /asset_barcode_history_one_active_uq/);
  assert.match(migration, /assets_barcode_global_uq|barcode/);
});

test("History and Asset identity are retained across initial and replacement lifecycle", () => {
  assert.match(migration, /createTable\("asset_barcode_history"/);
  assert.match(migration, /state IN \('ACTIVE','RETIRED'\)/);
  assert.match(migration, /action IN \('INITIAL','REPLACEMENT'\)/);
  assert.match(migration, /assets_barcode_history_insert_trg|inventory_asset_barcode_history_insert_guard/);
  assert.match(identity, /async function replaceAssetBarcode/);
  assert.match(identity, /FOR UPDATE/);
  assert.match(identity, /SET state='RETIRED'/);
  assert.match(identity, /INSERT INTO asset_barcode_history/);
  assert.match(routes, /\/inventory-v2\/assets\/:id\/barcode\/replace/);
  assert.match(routes, /BARCODE_REPLACED/);
});

test("Reprint does not replace Barcode identity and is idempotent", () => {
  assert.match(routes, /\/inventory-v2\/assets\/:id\/tags\/print/);
  assert.match(routes, /printKind === "REPRINT" && !String\(req\.body\?\.reason/);
  assert.match(runtime, /TAG_REPRINTED/);
  assert.match(runtime, /printKind: kind/);
  assert.doesNotMatch(runtime, /recordTagPrint[\s\S]{0,1200}barcodeRevision/);
  assert.match(routes, /replayed: true/);
});

test("Direct Barcode identity edits are blocked outside canonical replacement", () => {
  assert.match(controller, /function changedAssetIdentityField/);
  assert.match(controller, /barcodeSerial/);
  assert.match(controller, /barcodeRevision/);
  assert.match(controller, /Barcode identity fields cannot be changed after generation/);
  assert.match(migration, /INVENTORY_ASSET_BARCODE_IMMUTABLE/);
  assert.match(migration, /darfus\.inventory_barcode_replacement/);
});

test("Active Barcode relationship and global uniqueness are database-enforced", () => {
  assert.match(migration, /asset_barcode_history_asset_revision_uq/);
  assert.match(migration, /asset_barcode_history_one_active_uq/);
  assert.match(migration, /asset_barcode_history_barcode_uq/);
  assert.match(migration, /asset_id,company_id,barcode/);
  assert.match(identity, /models\.Asset\.count\(\{ where: \{ barcode \}/);
  assert.match(identity, /SELECT 1 FROM asset_barcode_history WHERE barcode=:barcode/);
});

test("Barcode lookup/search resolves through company and branch-scoped Assets", () => {
  assert.match(routes, /router\.get\("\/inventory-v2\/assets"/);
  assert.match(routes, /requireBusinessPermission\("inventory\.view"\)/);
  assert.match(routes, /a\.company_id=:companyId/);
  assert.match(routes, /a\.branch_id=:branchId/);
  assert.match(routes, /a\.barcode ILIKE :search/);
  assert.match(routes, /findScopedInventoryV2Asset/);
  assert.match(routes, /companyId: req\.companyId, branchId/);
  assert.match(inventoryRoute, /useInventoryV2List/);
  assert.match(inventoryRoute, /Barcode|باركود/);
});

test("Barcode remains an Asset identity through returns and status transitions", () => {
  assert.match(routes, /toStatus: "RETURNED"/);
  assert.match(routes, /inventoryV2Runtime\.transitionAsset/);
  assert.match(routes, /Final client inventory profiles must preserve Asset identity through returns/);
  assert.match(runtime, /const OPERATIONAL_STATUS/);
  assert.match(detailPage, /Barcode/);
  assert.match(detailPage, /Status is read-only here|الحالة للعرض فقط/);
});

test("No independent public Barcode CRUD route is introduced", () => {
  assert.doesNotMatch(routes, /setupCrud\("asset-barcode-history"/);
  assert.doesNotMatch(routes, /router\.(post|put|patch|delete)\("\/barcode-history/);
  assert.match(routes, /\/inventory-v2\/assets\/:id\/barcode\/replace/);
});

test("Accepted profile mappings are represented without activating future runtime profiles", () => {
  assert.match(defaults, /code: "GW"/);
  assert.match(defaults, /code: "GP"/);
  assert.match(identity, /resolveKaratCodeForProfile/);
  assert.match(identity, /LOOSE_PROFILE_KARAT_MUST_BE_00/);
  assert.match(identity, /return "00"/);
});
