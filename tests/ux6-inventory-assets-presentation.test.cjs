const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const inventoryPage = fs.readFileSync(path.join(ROOT, "app/[locale]/(dashboard)/inventory/page.tsx"), "utf8");
const assetDetailPage = fs.readFileSync(path.join(ROOT, "app/[locale]/(dashboard)/inventory/[id]/page.tsx"), "utf8");

test("UX-6 keeps the Inventory list on the canonical Asset data authority", () => {
  assert.match(inventoryPage, /useInventoryV2List/);
  assert.match(inventoryPage, /every row is exactly one physical Asset/);
  assert.match(inventoryPage, /Asset list/);
  assert.match(inventoryPage, /Serialized Assets/);
  assert.match(inventoryPage, /scope="col"/);
  assert.match(inventoryPage, /sticky top-0/);
  assert.match(inventoryPage, /min-w-\[980px\]/);
  assert.match(inventoryPage, /tabular-nums/);
  assert.match(inventoryPage, /Search inventory assets/);
  assert.match(inventoryPage, /No matching Assets/);
  assert.doesNotMatch(inventoryPage, /Product quantity.*physical stock/i);
});

test("UX-6 improves status readability without changing status authority", () => {
  assert.match(inventoryPage, /const STATUS_LABELS_EN/);
  assert.match(inventoryPage, /statusLabel\(asset\.operationalStatus, rtl\)/);
  assert.match(assetDetailPage, /const STATUS_LABELS_EN/);
  assert.match(assetDetailPage, /lifecycleState\(asset\.operationalStatus, rtl\)/);
  assert.match(assetDetailPage, /Status is read-only here/);
});

test("UX-6 preserves Asset detail workflow authorities and mutation boundaries", () => {
  assert.match(assetDetailPage, /useInventoryV2Detail/);
  assert.match(assetDetailPage, /return-review/);
  assert.match(assetDetailPage, /revisions/);
  assert.match(assetDetailPage, /selling-price/);
  assert.match(assetDetailPage, /rfid/);
  assert.match(assetDetailPage, /Barcode/);
  assert.match(assetDetailPage, /Unified Item History/);
  assert.match(assetDetailPage, /AssetEvents are the chronological authority/);
  assert.doesNotMatch(assetDetailPage, /fetch\([^)]*inventory-v2\/assets[^)]*method:\s*["'](PUT|PATCH|DELETE)["']/i);
});

test("UX-6 keeps the implementation presentation-only", () => {
  for (const source of [inventoryPage, assetDetailPage]) {
    assert.doesNotMatch(source, /purchase-orders\/receive/);
    assert.doesNotMatch(source, /journal_entries|journalLines|cash_transactions/i);
    assert.doesNotMatch(source, /ALTER\s+TABLE|INSERT\s+INTO|UPDATE\s+.*\s+SET|DELETE\s+FROM/i);
  }
});
