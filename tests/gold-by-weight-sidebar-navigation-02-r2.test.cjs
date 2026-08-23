const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const sidebar = read("components/layout/sidebar.tsx");
const arabic = JSON.parse(read("messages/ar.json"));
const english = JSON.parse(read("messages/en.json"));

test("02-R3 removes the dedicated Gold By Weight entry while preserving Inventory navigation", () => {
  const entry = /\{ href: "\/inventory\/gold-by-weight", label: "goldByWeight", icon: Scale, permission: "inventory\.view", branchBusiness: true \}/g;
  assert.equal(sidebar.match(entry)?.length ?? 0, 0);
  assert.match(sidebar, /href: "\/inventory", label: "inventory"/);
  assert.match(sidebar, /const groups = \[/);
  assert.match(sidebar, /label: "assetsInventory"/);
  assert.match(sidebar, /useTranslations\("Navigation"\)/);
  assert.match(sidebar, /usePathname\(\)/);
  assert.match(sidebar, /href !== "\/dashboard" && pathname\.startsWith\(item\.href\)/);
});

test("02-R3 keeps the localized chooser labels and the existing locale-aware route", () => {
  assert.equal(arabic.Navigation.goldByWeight, undefined);
  assert.equal(english.Navigation.goldByWeight, undefined);
  const chooser = read("components/inventory/inventory-intake-chooser.tsx");
  assert.match(chooser, /ذهب بالوزن/);
  assert.match(chooser, /Gold By Weight/);
  assert.match(read("app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx"), /export default function GoldByWeightProfilePage/);
  assert.match(read("i18n/navigation.ts"), /createNavigation\(routing\)/);
});
