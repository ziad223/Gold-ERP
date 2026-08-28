const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const panel = fs.readFileSync(path.join(root, "features/gold-center/components/GoldMarketAdminPanels.tsx"), "utf8");
const styles = fs.readFileSync(path.join(root, "features/gold-center/components/GoldMarketAdminPanels.module.css"), "utf8");

test("UX-8 scopes Gold Center refinement to presentation classes and preserves authorities", () => {
  assert.match(panel, /GoldMarketAdminPanels\.module\.css/);
  assert.match(panel, /\/gold-pricing\/market\/settings/);
  assert.match(panel, /\/gold-pricing\/market\/quotes\/history/);
  assert.match(panel, /\/gold-pricing\/policies\/history/);
  assert.match(panel, /gold\.manage_pricing_policy/);
  assert.match(panel, /method: "PUT"/);
  assert.match(panel, /method: "POST"/);
  assert.match(panel, /className=\{styles\.dataFrame\}/);
  assert.match(panel, /className=\{styles\.dataTable\}/);
  assert.match(panel, /role="alert"/);
  assert.match(panel, /role="alert"/);
});

test("UX-8 presentation styles provide bounded dense-data and responsive treatment", () => {
  assert.match(styles, /\.dataFrame\s*\{[\s\S]*overflow-x:\s*auto/);
  assert.match(styles, /\.dataTable\s*\{[\s\S]*min-width:/);
  assert.match(styles, /@media \(max-width: 640px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /unicode-bidi:\s*plaintext/);
});

test("UX-8 keeps Gold Center business source values as source-owned display values", () => {
  assert.match(panel, /state\.settings\.marketCurrency/);
  assert.match(panel, /state\.health\.status/);
  assert.match(panel, /quote\?\.\[`karat\$\{karat\}Rate`\]/);
  assert.match(panel, /state\.effectiveCgpRates/);
  assert.match(panel, /BID/);
  assert.match(panel, /SPOT/);
  assert.match(panel, /ASK/);
});
