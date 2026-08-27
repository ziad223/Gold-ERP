const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const service = require(path.join(root, "backend/src/services/diamond-jewellery-profile.service.js"));
const sharedRoute = fs.readFileSync(path.join(root, "backend/src/routes/erp.routes.js"), "utf8");
const page = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/inventory/diamond-jewellery/page.tsx"), "utf8");

const validPiece = () => ({
  profile: "DIAMOND_JEWELLERY",
  description: "Ring",
  grossWeight: "10",
  totalDiamondWeight: "1.5",
  karat: 21,
  components: [
    { stoneName: "Diamond", stoneCaratWeight: "1", diamondType: "Natural", color: "D", clarity: "VS1", shape: "Round", stoneCost: "1000" },
    { stoneName: "Diamond", stoneCaratWeight: "0.5", diamondType: "Lab Grown", color: "F", clarity: "SI1", shape: "Princess", stoneCost: null },
  ],
});

test("valid Diamond profile remains normalizable and known invalid inputs become 422 validation errors", () => {
  assert.equal(service.normalizePiece(validPiece()).components.length, 2);
  for (const input of [
    { ...validPiece(), totalDiamondWeight: "1.6" },
    { ...validPiece(), components: [{ ...validPiece().components[0], stoneCaratWeight: "0" }, validPiece().components[1]] },
    { ...validPiece(), certificate: { number: "CERT-READONLY-01" } },
  ]) {
    assert.throws(() => service.normalizePiece(input));
    const error = service.toValidationError(new Error("DIAMOND_COMPONENT_CARAT_TOTAL_MISMATCH"));
    assert.equal(error.statusCode, 422);
    assert.equal(error.errorCode, "DIAMOND_COMPONENT_CARAT_TOTAL_MISMATCH");
  }
});

test("unexpected shared-preview failures remain server errors", () => {
  assert.equal(service.toValidationError(new Error("DATABASE_CONNECTION_FAILED")), null);
});

test("shared preview route and UI guard known Diamond validation failures", () => {
  assert.match(sharedRoute, /toValidationError\(error\)/);
  assert.match(sharedRoute, /INVENTORY_CERTIFICATE_REQUIRED_FIELDS/);
  assert.match(sharedRoute, /DIAMOND_CERTIFICATE_AUTHORITY_REQUIRED/);
  assert.match(page, /profileFingerprint !== profileFormFingerprint/);
  assert.match(page, /setProfileFingerprint\(profileFormFingerprint\)/);
  assert.match(page, /setSharedPreview\(null\)/);
});
