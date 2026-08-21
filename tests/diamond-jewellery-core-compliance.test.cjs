const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const service = require(path.join(root, "backend/src/services/diamond-jewellery-profile.service.js"));
const runtime = fs.readFileSync(path.join(root, "backend/src/services/inventory-v2-runtime.service.js"), "utf8");
const receiveRoute = fs.readFileSync(path.join(root, "backend/src/routes/erp.routes.js"), "utf8");
const profileRoute = fs.readFileSync(path.join(root, "backend/src/routes/diamond-jewellery-profile.routes.js"), "utf8");
const page = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/inventory/diamond-jewellery/page.tsx"), "utf8");

const validPiece = (overrides = {}) => ({
  profile: "DIAMOND_JEWELLERY",
  description: "Diamond Ring",
  grossWeight: "10",
  totalDiamondWeight: "1",
  karat: 21,
  salePrice: "2500",
  components: [{
    stoneName: "Diamond", stoneCaratWeight: "1", diamondType: "Natural Diamond", color: "Fancy Blue",
    clarity: "VS1", shape: "Round", ...overrides,
  }],
});

test("canonical Diamond item descriptions resolve to one server-owned item code", () => {
  assert.equal(service.resolveItemCode("Diamond Brooch").itemCode, "BRH");
  assert.equal(service.resolveItemCode("Diamond Ring").itemCode, "RNG");
  assert.equal(service.resolveItemCode("Ring").description, "Diamond Ring");
  assert.throws(() => service.resolveItemCode("Diamond Brooch", "RNG"), /DIAMOND_ITEM_CODE_MISMATCH/);
  assert.equal(service.normalizePiece(validPiece()).itemCode, "RNG");
});

test("Diamond Color uses the approved separate Fancy vocabulary and rejects Gold Color", () => {
  assert.equal(service.normalizePiece(validPiece()).components[0].color, "Fancy Blue");
  assert.throws(() => service.normalizePiece(validPiece({ color: "Yellow Gold" })), /DIAMOND_COLOR_INVALID/);
});

test("master-backed optional dimensions and certificate dependency are server-validated", () => {
  const masterData = service.masterIndex([
    { category: "DIAMOND_ORIGIN", label: "Other" },
    { category: "DIAMOND_POSITION", label: "Center" },
    { category: "DIAMOND_SETTING", label: "Prong" },
    { category: "CERTIFICATE_AUTHORITY", label: "GIA" },
  ]);
  const piece = service.normalizePiece(validPiece({
    origin: "Other", originDescription: "Approved source",
    position: "Center", setting: "Prong", toneLevel: "Medium", saturation: "Vivid",
    certificate: { number: "CERT-1", authority: "GIA" },
  }), { masterData });
  assert.equal(piece.components[0].origin, "Other");
  assert.equal(piece.components[0].certificate.authority, "GIA");
  assert.throws(() => service.normalizePiece(validPiece({ certificate: { number: "CERT-2" } })), /DIAMOND_CERTIFICATE_AUTHORITY_REQUIRED/);
  assert.throws(() => service.normalizePiece(validPiece({ origin: "Other" }), { masterData }), /DIAMOND_ORIGIN_DESCRIPTION_REQUIRED/);
});

test("final V2 runtime and receive routes carry Diamond master authority and require sale price", () => {
  assert.match(runtime, /requireSalePrice: true/);
  assert.match(runtime, /context\.diamondMasterData/);
  assert.match(receiveRoute, /loadDiamondMasterData\(req\.companyId, t\)/);
  assert.match(receiveRoute, /requireV2ReceiptPieces\(normalizedItems, \{ vatRateDefault, diamondMasterData \}\)/);
  assert.match(receiveRoute, /DIAMOND_SALE_PRICE_BELOW_MINIMUM/);
  assert.match(receiveRoute, /diamondJewelleryProfileService\.calculatePreview/);
  assert.match(profileRoute, /masterData/);
});

test("full UI has one canonical receive confirmation, shared previews, and deferred optional attachments", () => {
  assert.match(page, /inventory-v2\/diamond-jewellery\/preview/);
  assert.match(page, /inventory-v2\/receive-preview/);
  assert.match(page, /purchase-orders\/receive/);
  assert.match(page, /Confirm Receive/);
  assert.match(page, /Purchase VAT/);
  assert.match(page, /Current VAT/);
  assert.match(page, /Profit Margin/);
  assert.match(page, /optional deferred/);
  assert.doesNotMatch(page, /Owner Authorization/);
  assert.doesNotMatch(page, /type=["']file["']/);
});
