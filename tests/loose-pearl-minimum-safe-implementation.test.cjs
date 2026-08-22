"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const profile = require("../backend/src/services/loose-pearl-profile.service");

const masters = [
  ["PEARL_ITEM_DESCRIPTION", "desc-1", "Loose Pearl"], ["PEARL_TYPE", "type-1", "Akoya"],
  ["PEARL_COLOR", "color-1", "White"], ["PEARL_SHAPE", "shape-1", "Round"],
].map(([category, id, label]) => ({ category, id, value: label.toLowerCase(), label, isActive: true }));
const sizes = [{ id: "size-1", value: "6.00000000", displayValue: "6", label: "6 mm", unit: "MM", isActive: true }];
const taxPolicy = { vatRate: "14", vatRegistered: true, enabledTaxTreatments: ["STANDARD_VAT"] };

function sample(overrides = {}) {
  return { description: "desc-1", looseDetails: { totalPearlWeight: "1.25", pearlSizeId: "size-1", pearlType: "type-1", pearlColor: "color-1" }, purchasePricePreTax: "100", currentPearlValue: "120", sellingPrice: "200", taxTreatment: "STANDARD_VAT", ...overrides };
}

test("Loose Pearl uses CT with two-decimal input precision and no gold fields", () => {
  const normalized = profile.normalizeInput(sample(), masters, sizes);
  assert.equal(normalized.weightUnit, "CT");
  assert.equal(normalized.totalPearlWeight, "1.25000000");
  assert.equal(normalized.masterData.description, "desc-1");
  assert.equal(normalized.karat, undefined);
  assert.throws(() => profile.normalizeInput(sample({ looseDetails: { ...sample().looseDetails, totalPearlWeight: "1.251" } }), masters, sizes), /PRECISION_EXCEEDED/);
});

test("Loose Pearl purchase and current VAT are separate dynamic tax calculations", () => {
  const preview = profile.calculatePreview({ input: sample(), masters, pearlSizes: sizes, taxPolicy });
  assert.equal(preview.purchase.purchaseBasePreTax, "100.00000000");
  assert.equal(preview.purchase.purchaseVAT, "14.00000000");
  assert.equal(preview.purchase.purchaseTotalTaxInclusive, "114.00000000");
  assert.equal(preview.current.currentValuationBasePreTax, "120.00000000");
  assert.equal(preview.current.currentVAT, "16.80000000");
  assert.equal(preview.readiness.profilePreview, "READY");
});

test("canonical Loose Pearl piece is PL/LOS/00 and one physical piece", () => {
  const piece = profile.calculateReceiptPiece({ input: sample(), masters, pearlSizes: sizes, taxPolicy });
  assert.equal(piece.inventoryCode, "PL");
  assert.equal(piece.itemCode, "LOS");
  assert.equal(piece.karatCode, "00");
  assert.equal(piece.looseDetails.weightUnit, "CT");
  assert.equal(piece.purchaseCost, 100);
  assert.equal(piece.currentValuation.componentValue, "120.00000000");
  assert.equal(piece.quantity, undefined);
});

test("Supplier V2 receive-shaped piece preserves explicit current valuation input", () => {
  const preview = profile.calculateReceiptPiece({ input: { ...sample(), purchaseCost: "114", currentPearlValue: undefined, looseFinancial: { purchasePricePreTax: "100" }, looseCurrentValuation: { currentPearlValuePreTax: "120" }, currentValuation: { componentValue: "120" }, itemIndex: 0, pieceIndex: 0 }, masters, pearlSizes: sizes, taxPolicy });
  assert.equal(preview.loosePurchase.purchaseBaseCost, "100.00000000");
  assert.equal(preview.pieceIndex, 0);
  assert.equal(preview.currentValuation.componentValue, "120.00000000");
});

test("source wires the single Loose Pearl contract to canonical intake and receive", () => {
  const root = path.join(__dirname, "..");
  const routeIndex = fs.readFileSync(path.join(root, "backend/src/routes/index.js"), "utf8");
  const erp = fs.readFileSync(path.join(root, "backend/src/routes/erp.routes.js"), "utf8");
  const chooser = fs.readFileSync(path.join(root, "components/inventory/inventory-intake-chooser.tsx"), "utf8");
  const page = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/inventory/loose-pearl/page.tsx"), "utf8");
  const policy = fs.readFileSync(path.join(root, "backend/src/services/inventory-master-policy.service.js"), "utf8");
  const barcode = fs.readFileSync(path.join(root, "backend/src/services/barcode-identity.service.js"), "utf8");
  assert.match(routeIndex, /inventory-v2\/loose-pearl/);
  assert.match(erp, /loosePearlProfileService\.calculateReceiptPiece/);
  assert.match(erp, /\["LOOSE_DIAMOND", "LOOSE_GEMSTONE", "LOOSE_PEARL"\]\.includes/);
  assert.match(fs.readFileSync(path.join(root, "backend/src/services/inventory-v2-runtime.service.js"), "utf8"), /isLoosePearl[\s\S]*INVENTORY_V2_GROSS_WEIGHT_REQUIRED/);
  assert.match(chooser, /key: "LOOSE_PEARL"/);
  assert.match(page, /idempotencyKey/);
  assert.match(page, /purchaseBasePreTax/);
  assert.match(policy, /LOOSE_PEARL:[\s\S]*weightApplicable: false/);
  assert.match(barcode, /LOOSE_PEARL_INVENTORY_CODE_MUST_BE_PL/);
});
