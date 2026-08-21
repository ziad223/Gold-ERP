const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const inventory = read("app/[locale]/(dashboard)/inventory/page.tsx");
const detail = read("app/[locale]/(dashboard)/inventory/[id]/page.tsx");
const chooser = read("components/inventory/inventory-intake-chooser.tsx");
const shared = read("components/inventory/shared-receive-section.tsx");
const legacyReceive = read("app/[locale]/(dashboard)/suppliers/purchases/page.tsx");
const gbw = read("app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx");
const gbp = read("app/[locale]/(dashboard)/inventory/gold-by-piece/page.tsx");
const inventoryRoute = read("backend/src/routes/erp.routes.js");

test("canonical Inventory landing owns the only intake action and preserves bilingual profile labels", () => {
  assert.match(inventory, /data-inventory-intake-action/);
  assert.match(inventory, /إضافة \/ استلام مخزون/);
  assert.match(inventory, /Add \/ Receive Inventory/);
  assert.match(inventory, /PROFILE_LABELS: Record<string, \{ ar: string; en: string \}>/);
  assert.match(inventory, /Gold By Piece/);
  assert.match(inventory, /ذهب بالقطعة/);
});

test("inventory list is server-backed, Asset-authoritative, filterable and paginated", () => {
  assert.match(inventory, /useInventoryV2List/);
  assert.match(inventory, /search, profile, status, condition, tagState, page, pageSize/);
  assert.match(inventory, /Search, filters, and pagination are executed by the authorized Branch Asset API/);
  assert.match(inventory, /This list never falls back to Product quantity/);
  assert.match(inventory, /ChevronLeft|ChevronRight/);
  assert.match(inventory, /Barcode is the permanent primary identity/);
});

test("chooser enables the approved Gem Stone profile while keeping Pearl disabled", () => {
  assert.deepEqual([...chooser.matchAll(/key: "([A-Z_]+)", icon:/g)].map((match) => match[1]), [
    "GOLD_BY_WEIGHT", "GOLD_BY_PIECE", "DIAMOND", "DIAMOND_LOOSE", "GEM_STONE", "GEM_STONE_LOOSE", "PEARL",
  ]);
  assert.equal((chooser.match(/enabled: true/g) || []).length, 6);
  assert.equal((chooser.match(/enabled: false/g) || []).length, 1);
  assert.match(chooser, /key: "DIAMOND", icon:[\s\S]*?enabled: true/);
  assert.match(chooser, /key: "DIAMOND_LOOSE", icon:[\s\S]*?enabled: true/);
  assert.match(chooser, /key: "GEM_STONE", icon:[\s\S]*?enabled: true/);
  assert.match(chooser, /key: "GEM_STONE_LOOSE", icon:[\s\S]*?enabled: true/);
  assert.match(chooser, /key: "PEARL", icon:[\s\S]*?enabled: false/);
  assert.match(chooser, /key === "GEM_STONE" \? gemStoneHref/);
  assert.match(chooser, /key === "GEM_STONE_LOOSE" \? looseGemStoneHref/);
});

test("shared receive section keeps supplier, DB location, date, tax, notes, RCM evidence and tax summary", () => {
  for (const required of ["Supplier", "Location", "Purchase Date", "Tax Treatment", "Notes", "Tax Summary", "ReverseChargeChecklist"]) {
    assert.match(shared, new RegExp(required));
  }
  assert.match(shared, /Location for the current company and branch/);
  assert.match(shared, /No frontend tax default is used/);
  assert.match(shared, /buildSharedTaxRequest/);
  assert.match(shared, /Link className=\"underline\" href=\"\/inventory\/locations\"/);
});

test("GBW and GBP use one canonical Supplier V2 receive path with server previews and idempotency", () => {
  for (const source of [gbw, gbp]) {
    assert.equal((source.match(/\/purchase-orders\/receive/g) || []).length, 1);
    assert.match(source, /inventoryV2: true/);
    assert.match(source, /perPiece: \[piece\]/);
    assert.match(source, /\/inventory-v2\/receive-preview/);
    assert.match(source, /generateUUID\(\)/);
    assert.match(source, /buildSharedTaxRequest/);
  }
  assert.match(gbw, /One Asset per piece|Product quantity/);
  assert.match(gbp, /One Asset per piece|Product quantity/);
});

test("Asset details expose protected identity, origin, cost, valuation, movements and RFID history", () => {
  for (const required of ["Barcode", "RFID", "Receipt origin", "Frozen Purchase Snapshot", "Separate Current Valuation", "Unified Item History", "RFID assignment history"]) {
    assert.match(detail, new RegExp(required));
  }
  assert.match(detail, /Gold By Piece/);
  assert.match(detail, /ذهب بالقطعة/);
  assert.match(detail, /Price, cost, barcode, weights, karat, and operational status remain protected/);
  assert.match(detail, /Status is read-only here/);
});

test("legacy Supplier receive URL is redirect-only and Supplier page has no create shortcut", () => {
  assert.match(legacyReceive, /redirect\(`\/\$\{locale\}\/inventory`\)/);
  const supplier = read("app/[locale]/(dashboard)/suppliers/[id]/page.tsx");
  assert.doesNotMatch(supplier, /Receive Inventory From Supplier|استلام مخزون من هذا المورد|data-supplier-intake-shortcut/);
});

test("backend read/list/detail/preview boundaries remain read-only and branch/company scoped", () => {
  assert.match(inventoryRoute, /router\.get\("\/inventory-v2\/assets"/);
  assert.match(inventoryRoute, /a\.company_id=:companyId/);
  assert.match(inventoryRoute, /a\.branch_id=:branchId/);
  assert.match(inventoryRoute, /router\.get\("\/inventory-v2\/assets\/:id"/);
  assert.match(inventoryRoute, /router\.post\("\/inventory-v2\/receive-preview"/);
  assert.match(inventoryRoute, /readOnly: true/);
  assert.match(inventoryRoute, /Product.*never provide stock results/);
});
