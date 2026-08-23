"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pearl = require("../backend/src/services/pearl-jewellery-profile.service");

const masters = pearl.masterIndex([
  { category: "GOLD_COLOR", label: "Yellow" },
  { category: "PEARL_TYPE", label: "Akoya" },
  { category: "PEARL_COLOR", label: "White" },
  { category: "PEARL_LUSTER", label: "High" },
  { category: "PEARL_SHAPE", label: "Round" },
  { category: "PEARL_ORIGIN", label: "Japan" },
  { category: "PEARL_OVERTONE", label: "Rose" },
  { category: "PEARL_ORIENT", label: "Orient" },
  { category: "PEARL_SURFACE_QUALITY", label: "Clean" },
  { category: "PEARL_NACRE_QUALITY", label: "Good" },
  { category: "CERTIFICATE_AUTHORITY", label: "GIA" },
]);

function sample(overrides = {}) {
  return {
    profile: "PEARL_JEWELLERY",
    description: "Pearl Ring",
    goldColor: "Yellow",
    karat: 18,
    grossWeight: "12",
    purchaseGoldPrice: "200",
    makingPerGram: "30",
    currentMakingPerGram: "35",
    taxTreatment: "STANDARD_VAT",
    sellingPrice: "5000",
    components: [{ componentKind: "PEARL", quantity: 2, totalPearlWeight: "1.20", pearlType: "Akoya", pearlColor: "White", luster: "High", pearlShape: "Round", pearlOrigin: "Japan", pearlCost: "1500", currentValue: "1700" }],
    ...overrides,
  };
}

test("Pearl Jewellery item description resolves the server barcode item code and excludes Loose Pearl", () => {
  const normalized = pearl.normalizePiece(sample(), { masterData: masters });
  assert.equal(normalized.itemCode, "RNG");
  assert.equal(normalized.description, "Pearl Ring");
  assert.throws(() => pearl.normalizePiece(sample({ description: "Loose Pearl" }), { masterData: masters }), /PEARL_LOOSE_PEARL_DESCRIPTION_FORBIDDEN/);
});

test("Pearl group quantity is metadata and combined weight/cost are not multiplied", () => {
  const normalized = pearl.normalizePiece(sample(), { masterData: masters });
  assert.equal(normalized.pearlWeight, "1.20000000");
  assert.equal(normalized.pearlCostTotal, "1500.00000000");
  assert.equal(normalized.netGoldWeight, "10.80000000");
  assert.equal(normalized.components[0].componentCount, 2);
});

test("mixed component weights and costs contribute to the server-derived gold and purchase bases", () => {
  const normalized = pearl.normalizePiece(sample({ components: [
    { componentKind: "PEARL", quantity: 2, totalPearlWeight: "1.20", pearlCost: "1500", currentValue: "1700" },
    { componentKind: "DIAMOND", componentWeight: "0.20", purchaseCost: "1000", currentValue: "1200", name: "Diamond" },
  ] }), { masterData: masters });
  assert.equal(normalized.otherStonesWeight, "0.20000000");
  assert.equal(normalized.netGoldWeight, "10.60000000");
  assert.equal(normalized.pearlCostTotal, "1500.00000000");
  assert.equal(normalized.otherStoneCostTotal, "1000.00000000");
});

test("source contract includes the one canonical Pearl route, dynamic pre-tax treatment, and Asset price authority", () => {
  const routeIndex = fs.readFileSync(path.join(__dirname, "..", "backend/src/routes/index.js"), "utf8");
  const erp = fs.readFileSync(path.join(__dirname, "..", "backend/src/routes/erp.routes.js"), "utf8");
  const chooser = fs.readFileSync(path.join(__dirname, "..", "components/inventory/inventory-intake-chooser.tsx"), "utf8");
  const page = fs.readFileSync(path.join(__dirname, "..", "app/[locale]/(dashboard)/inventory/pearl/page.tsx"), "utf8");
  assert.match(routeIndex, /inventory-v2\/pearl-jewellery/);
  assert.match(erp, /PEARL_JEWELLERY.*preTaxV2Piece|preTaxV2Piece.*PEARL_JEWELLERY/s);
  assert.match(erp, /pearlJewelleryProfileService\.calculateReceiptPiece/);
  assert.match(chooser, /key: "PEARL"[^\n]*enabled: true/);
  assert.match(page, /idempotencyKey/);
  assert.match(page, /purchaseBasePreTax/);
  assert.match(page, /sellingPrice/);
});
