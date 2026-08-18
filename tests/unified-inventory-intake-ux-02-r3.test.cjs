const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const sidebar = read("components/layout/sidebar.tsx");
const inventory = read("app/[locale]/(dashboard)/inventory/page.tsx");
const supplier = read("app/[locale]/(dashboard)/suppliers/[id]/page.tsx");
const chooser = read("components/inventory/inventory-intake-chooser.tsx");
const gbw = read("app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx");
const arabic = JSON.parse(read("messages/ar.json"));
const english = JSON.parse(read("messages/en.json"));

test("02-R3 removes the dedicated GBW daily Sidebar entry without removing the route", () => {
  assert.doesNotMatch(sidebar, /gold-by-weight|goldByWeight/);
  assert.match(gbw, /export default function GoldByWeightProfilePage/);
  assert.match(inventory, /href=\{`\/inventory\/\$\{encodeURIComponent\(asset\.id\)\}`\}/);
});

test("02-R3 provides one Inventory action and exactly five profile choices", () => {
  assert.match(inventory, /data-inventory-intake-action/);
  assert.match(inventory, /إضافة \/ استلام مخزون/);
  assert.match(inventory, /Add \/ Receive Inventory/);
  assert.match(inventory, /InventoryIntakeChooser/);
  assert.deepEqual([...chooser.matchAll(/key: "([A-Z_]+)", icon:/g)].map((match) => match[1]), [
    "GOLD_BY_WEIGHT", "GOLD_BY_PIECE", "DIAMOND", "GEM_STONE", "PEARL",
  ]);
  assert.equal((chooser.match(/enabled: true/g) || []).length, 2);
  assert.equal((chooser.match(/enabled: false/g) || []).length, 3);
  assert.match(chooser, /href=\{key === "GOLD_BY_PIECE" \? gbpHref : gbwHref\}/);
  assert.match(chooser, /supplierId\)\}/);
});

test("G2C correction removes the Supplier receive shortcut while Inventory remains canonical", () => {
  assert.doesNotMatch(supplier, /data-supplier-intake-shortcut|Receive Inventory From Supplier|استلام مخزون من هذا المورد/);
  assert.match(inventory, /data-inventory-intake-action/);
  assert.match(inventory, /InventoryIntakeChooser/);
});

test("02-R3 keeps GBW as the single form and validates supplier preselection from contract data", () => {
  assert.match(gbw, /useSearchParams\(\)/);
  assert.match(gbw, /contract\.suppliers\.find/);
  assert.match(gbw, /item\.id === supplierHint/);
  assert.match(gbw, /item\.status !== "inactive"/);
  assert.match(gbw, /inventoryV2: true/);
  assert.match(gbw, /perPiece: \[piece\]/);
  assert.equal((gbw.match(/export default function GoldByWeightProfilePage/g) || []).length, 1);
});

test("02-R3 keeps the required localized chooser labels", () => {
  assert.equal(arabic.Navigation.goldByWeight, undefined);
  assert.equal(english.Navigation.goldByWeight, undefined);
  assert.match(chooser, /ذهب بالوزن/);
  assert.match(chooser, /ذهب بالقطعة/);
  assert.match(chooser, /ألماس/);
  assert.match(chooser, /أحجار كريمة/);
  assert.match(chooser, /لؤلؤ/);
  assert.match(chooser, /Gold By Weight/);
  assert.match(chooser, /Gold By Piece/);
  assert.match(chooser, /Diamond/);
  assert.match(chooser, /Gem Stone/);
  assert.match(chooser, /Pearl/);
});
