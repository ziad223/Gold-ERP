"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const profile = require(path.join(root, "backend/src/services/gold-by-weight-profile.service"));
const inventoryPolicy = require(path.join(root, "backend/src/services/inventory-master-policy.service"));

const jewellery = (overrides = {}) => ({
  profile: "GOLD_BY_WEIGHT_JEWELLERY",
  description: "Gold Ring",
  karat: 21,
  grossWeight: 10,
  stoneWeight: 2,
  purchaseGoldRate: 450,
  currentGoldRate: 500,
  makingPerGram: 5,
  currentMakingPerGram: 5,
  ...overrides,
});

test("GBW final closure keeps the frozen server formulas and precision", () => {
  const result = profile.calculate({ input: jewellery(), configuredVatRate: 5 });
  assert.equal(result.weights.netGoldWeight, "8.00000000");
  assert.equal(result.weights.pureGoldWeight9999, "7.00000000");
  assert.equal(result.purchase.makingTotal, "40.00000000");
  assert.equal(result.purchase.goldValue, "3600.00000000");
  assert.equal(result.purchase.totalPurchaseCost, "3822.00000000");
});

test("GBW final closure accepts the supported karat set and rejects invalid values", () => {
  for (const karat of [9, 10, 12, 14, 18, 21, 22]) {
    assert.doesNotThrow(() => profile.normalizeInput(jewellery({ karat })));
  }
  assert.throws(() => profile.normalizeInput(jewellery({ karat: 24 })), (error) => error.code === "GBW_JEWELLERY_24K_BAR_SEPARATION");
  assert.throws(() => profile.normalizeInput(jewellery({ karat: 20 })), (error) => error.code === "GBW_KARAT_NOT_ALLOWED");
});

test("GBW final closure enforces weight and physical-authority boundaries", () => {
  assert.throws(() => profile.normalizeInput(jewellery({ grossWeight: 0 })), (error) => error.code === "GBW_GROSS_WEIGHT_INVALID");
  assert.throws(() => profile.normalizeInput(jewellery({ stoneWeight: 11 })), (error) => error.code === "GBW_STONE_WEIGHT_EXCEEDS_GROSS");
  assert.throws(() => profile.normalizeInput(jewellery({ grossWeight: 10, stoneWeight: 10 })), (error) => error.code === "GBW_NET_WEIGHT_INVALID");
  assert.throws(() => inventoryPolicy.calculateGoldWeights({ grossWeight: 10, stoneWeight: 10, karat: 21 }), /INVENTORY_WEIGHT_FACTS_INVALID/);
  assert.throws(() => profile.normalizeInput(jewellery({ quantity: 1 })), (error) => error.code === "GBW_PRODUCT_QUANTITY_AUTHORITY_FORBIDDEN");
  assert.throws(() => profile.normalizeInput(jewellery({ productId: "PRD-1" })), (error) => error.code === "GBW_PRODUCT_QUANTITY_AUTHORITY_FORBIDDEN");
});

test("GBW final closure rejects legacy Product/quantity receive before the canonical transaction", () => {
  const assessment = inventoryPolicy.assessFinalClientSupplierReceive({
    body: { inventoryProfile: "GOLD_BY_WEIGHT_JEWELLERY" },
    items: [{ name: "Gold Ring", productCode: "RNG", quantity: 1, weightPerUnit: 5, unitCost: 100 }],
  });
  assert.equal(assessment.targetsFinalProfile, true);
  assert.equal(assessment.inventoryV2Required, true);
  assert.equal(assessment.rejectLegacy, true);
});

test("GBW final closure keeps the canonical receive, tax, asset and barcode authorities", () => {
  const route = read("backend/src/routes/gold-by-weight-profile.routes.js");
  const page = read("app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx");
  const shared = read("components/inventory/shared-receive-section.tsx");
  const v2 = read("backend/src/services/inventory-v2-runtime.service.js");
  const receiveRoute = read("backend/src/routes/erp.routes.js");
  const policy = read("backend/src/services/inventory-master-policy.service.js");
  assert.match(route, /router\.get\("\/contract"/);
  assert.match(route, /router\.post\("\/preview"/);
  assert.match(page, /inventoryV2:\s*true/);
  assert.match(page, /perPiece:\s*\[piece\]/);
  assert.match(page, /SharedReceiveSection/);
  assert.match(page, /inventory-v2\/receive-preview/);
  assert.match(shared, /No frontend tax default/);
  assert.match(shared, /Server Tax Summary/);
  assert.match(v2, /assertPieceBasedPayload/);
  assert.match(policy, /INVENTORY_STOCK_QUANTITY_FORBIDDEN/);
  assert.match(receiveRoute, /movementType:\s*"PURCHASE_RECEIVE"/);
});

test("GBW final closure keeps Gold Center provider and immutable snapshot boundaries", () => {
  const adapter = read("backend/src/services/goldapi-io.adapter.js");
  const health = read("backend/src/routes/index.js");
  const runtime = read("backend/src/services/gold-market-runtime.service.js");
  assert.match(adapter, /https:\/\/www\.goldapi\.io\/api/);
  assert.match(adapter, /GOLD_MARKET_PROVIDER_GOLDAPI_IO_API_KEY/);
  assert.match(adapter, /GOLDAPI_IO_SCHEMA_INVALID/);
  assert.match(health, /router\.get\("\/health\/gold"/);
  assert.match(runtime, /upsertJobScheduler/);
});

test("GBW final closure preserves unified intake and no dedicated sidebar entry", () => {
  const chooser = read("components/inventory/inventory-intake-chooser.tsx");
  const sidebar = read("components/layout/sidebar.tsx");
  const supplierPurchases = read("app/[locale]/(dashboard)/suppliers/purchases/page.tsx");
  assert.match(chooser, /Gold By Weight/);
  assert.match(chooser, /ذهب بالوزن/);
  assert.doesNotMatch(sidebar, /href: "\/inventory\/gold-by-weight"/);
  assert.doesNotMatch(supplierPurchases, /purchase-orders\/receive/);
});
