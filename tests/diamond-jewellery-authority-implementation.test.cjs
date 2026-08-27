const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const service = require(path.join(process.cwd(), "backend/src/services/diamond-jewellery-profile.service.js"));

const validPiece = () => ({
  profile: "DIAMOND_JEWELLERY",
  description: "Diamond Ring",
  itemCode: "RNG",
  grossWeight: "10.00000000",
  totalDiamondWeight: "1.50000000",
  karat: 18,
  components: [
    { stoneName: "Diamond", stoneCaratWeight: "1.00000000", diamondType: "Natural", color: "D", clarity: "VS1", shape: "Round", stoneCost: "1000" },
    { stoneName: "Diamond", stoneCaratWeight: "0.50000000", diamondType: "Lab Grown", color: ["F", "Fancy Blue"], clarity: "SI1", shape: "Princess" },
  ],
});

test("Diamond Jewellery normalizes one top-level piece and exact CT reconciliation", () => {
  const result = service.normalizePiece(validPiece());
  assert.equal(result.profile, "DIAMOND_JEWELLERY");
  assert.equal(result.components.length, 2);
  assert.equal(result.stoneWeight, "0.30000000");
  assert.equal(result.netGoldWeight, "9.70000000");
  assert.equal(result.pureGoldWeight9999, "7.27500000");
  assert.equal(result.componentCost, "1000.00000000");
});

test("Diamond Jewellery rejects CT mismatch, missing required 4C, bad karat, and Other without description", () => {
  assert.throws(() => service.normalizePiece({ ...validPiece(), totalDiamondWeight: "1.40000000" }), /DIAMOND_COMPONENT_CARAT_TOTAL_MISMATCH/);
  assert.throws(() => service.normalizePiece({ ...validPiece(), components: [{ ...validPiece().components[0], clarity: "" }, validPiece().components[1]] }), /DIAMOND_CLARITY_REQUIRED/);
  assert.throws(() => service.normalizePiece({ ...validPiece(), karat: 20 }), /DIAMOND_KARAT_UNSUPPORTED/);
  assert.throws(() => service.normalizePiece({ ...validPiece(), components: [{ ...validPiece().components[0], treatment: "Other" }, validPiece().components[1]] }), /DIAMOND_TREATMENT_DESCRIPTION_REQUIRED/);
});

test("Diamond Jewellery certificate and cost semantics remain explicit", () => {
  const piece = service.normalizePiece({ ...validPiece(), certificate: { number: "CERT-1", authority: "GIA" } });
  assert.equal(piece.certificate.authority, "GIA");
  assert.equal(piece.components[1].purchaseCost, null);
  assert.equal(piece.componentCost, "1000.00000000");
  assert.throws(() => service.normalizePiece({ ...validPiece(), certificate: { number: "CERT-1" } }), /DIAMOND_CERTIFICATE_AUTHORITY_REQUIRED/);
});

test("Diamond contract keeps Asset, DD barcode, canonical Supplier V2, and no Loose Diamond UI authority", () => {
  const contract = service.contract();
  assert.equal(contract.profile, "DIAMOND_JEWELLERY");
  assert.equal(contract.authority.physicalInventory, "ASSET");
  assert.equal(contract.authority.quantityAuthority, "NOT_ALLOWED");
  assert.equal(contract.authority.barcode, "ASSET_BARCODE_DD");
  assert.equal(contract.authority.receive, "SUPPLIER_V2_CANONICAL");
  assert.equal(contract.itemCodes.includes("RNG"), true);
  assert.equal(contract.itemCodes.includes("LOS"), false);
});

test("source boundary has read-only previews and a guarded final Receive confirmation in the new page", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "backend/src/routes/diamond-jewellery-profile.routes.js"), "utf8");
  const page = fs.readFileSync(path.join(process.cwd(), "app/[locale]/(dashboard)/inventory/diamond-jewellery/page.tsx"), "utf8");
  assert.match(route, /router\.post\("\/preview"/);
  assert.doesNotMatch(route, /\.create\(|\.update\(|\.destroy\(|INSERT\s+INTO|UPDATE\s+/i);
  assert.match(page, /inventory-v2\/diamond-jewellery\/preview/);
  assert.match(page, /inventory-v2\/receive-preview/);
  assert.match(page, /purchase-orders\/receive/);
  assert.match(page, /Confirm Receive/);
  assert.match(page, /optional deferred/);
  assert.doesNotMatch(page, /Owner Authorization/);
});
