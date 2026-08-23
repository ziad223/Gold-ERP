"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const routes = fs.readFileSync(path.join(ROOT, "backend/src/routes/erp.routes.js"), "utf8");

const blockedLegacyResources = [
  ["assets", "GENERIC_INVENTORY_MUTATION_FORBIDDEN"],
  ["products", "GENERIC_INVENTORY_MUTATION_FORBIDDEN"],
  ["stock-movements", "GENERIC_STOCK_MOVEMENT_MUTATION_FORBIDDEN"],
  ["transfers", "GENERIC_TRANSFER_MUTATION_FORBIDDEN"],
  ["purchase-orders", "GENERIC_PURCHASE_MUTATION_FORBIDDEN"],
  ["cash-transactions", "GENERIC_TREASURY_MUTATION_FORBIDDEN"],
  ["companies", "GENERIC_COMPANY_MUTATION_FORBIDDEN"],
  ["manufacturing-orders", "GENERIC_MANUFACTURING_MUTATION_FORBIDDEN"],
  ["customer-gold-pools", "GENERIC_CGP_MUTATION_FORBIDDEN"],
  ["inventory-gold-pools", "GENERIC_IGP_MUTATION_FORBIDDEN"],
  ["approval-requests", "GENERIC_APPROVAL_MUTATION_FORBIDDEN"],
  ["journal-entries", "GENERIC_JOURNAL_MUTATION_FORBIDDEN"],
];

test("Stage D generic business mutation resources are fail-closed", () => {
  assert.match(routes, /function stableForbidden\(res, code, message\)/);
  const blockStart = routes.indexOf("const LIFECYCLE_GENERIC_MUTATION_BLOCKS = {");
  const blockEnd = routes.indexOf("function stableForbidden", blockStart);
  const block = routes.slice(blockStart, blockEnd);
  for (const [resource, code] of blockedLegacyResources) {
    assert.ok(block.includes(`${resource}:`) || block.includes(`"${resource}":`), `${resource} has an explicit hard-block resource`);
    assert.ok(block.includes(`code: "${code}"`), `${resource} has the stable hard-block code`);
  }
  assert.match(routes, /if \(LIFECYCLE_GENERIC_MUTATION_BLOCKS\[resourceName\]\)/, "setupCrud applies the lifecycle hard-block before legacy special cases");
});

test("Stage D canonical authorities remain the only mutation owners", () => {
  assert.match(routes, /router\.post\("\/inventory-v2\/manufacturing-orders"[\s\S]{0,220}executeInventoryV2Transformation/);
  assert.match(routes, /router\.post\([\s\S]{0,100}"\/journal-entries\/manual-draft"/);
  assert.match(routes, /router\.post\([\s\S]{0,100}"\/journal-entries\/:id\/post"/);
  assert.match(routes, /router\.post\([\s\S]{0,100}"\/journal-entries\/:id\/reverse"/);
  assert.match(routes, /router\.post\([\s\S]{0,100}"\/journal-entries\/:id\/cancel"/);
  const goldPurchaseRoutes = fs.readFileSync(path.join(ROOT, "backend/src/routes/gold-purchase.routes.js"), "utf8");
  assert.match(goldPurchaseRoutes, /router\.post\(`\/\$\{kind\}\/drafts`[\s\S]{0,240}gold-purchase\.\$\{kind\}\.create/);
});
