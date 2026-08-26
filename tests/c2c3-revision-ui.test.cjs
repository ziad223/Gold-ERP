const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const detailPage = fs.readFileSync(path.join(root, "app", "[locale]", "(dashboard)", "inventory", "[id]", "page.tsx"), "utf8");
const panel = fs.readFileSync(path.join(root, "components", "inventory", "asset-revision-panel.tsx"), "utf8");
const helper = fs.readFileSync(path.join(root, "lib", "inventory", "revision-ui.ts"), "utf8");
const ar = JSON.parse(fs.readFileSync(path.join(root, "messages", "ar.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(root, "messages", "en.json"), "utf8"));

test("C2C3 uses one Asset Detail Revision surface and the canonical API", () => {
  assert.match(detailPage, /AssetRevisionPanel/);
  assert.match(detailPage, /inventory\.revision\.view/);
  assert.match(detailPage, /inventory\.revision\.create/);
  assert.match(detailPage, /\/revisions/);
  assert.match(detailPage, /expectedUpdatedAt: asset\.updatedAt/);
  assert.match(detailPage, /idempotencyKey: revisionIdempotencyKeyRef\.current/);
  assert.doesNotMatch(detailPage, /metadata\`, \{\s*method: "PATCH"/);
  assert.doesNotMatch(detailPage, /\["location"/);
});

test("C2C3 exposes only the frozen general fields and protects dedicated domains", () => {
  for (const field of ["name", "description", "category", "brand", "notes"]) assert.match(helper, new RegExp(`\\b${field}\\b`));
  for (const forbidden of ["barcode", "rfid", "operationalStatus", "branchId", "locationId", "sellingPrice", "purchaseCost"]) {
    assert.doesNotMatch(helper, new RegExp(`\\b${forbidden}\\b`));
  }
  assert.match(panel, /REVISION_FIELD_NOT_ALLOWED|revisionErrorMessage/);
  assert.match(panel, /No effective change|revisionEmpty/);
  assert.match(panel, /dir="ltr"/);
  assert.match(panel, /canView/); // permission is passed from the page, never trusted as security authority
});

test("C2C3 has AR/EN parity for the Revision surface and stable error localization", () => {
  const keys = [
    "revisionTitle", "revisionDescription", "revisionRefresh", "revisionNoAccess", "revisionEmpty",
    "revisionEmptyDescription", "revisionNumber", "revisionDate", "revisionReason", "revisionSource",
    "revisionActor", "revisionChangeCount", "revisionDetail", "loadingRevision", "revisionSourceReference",
    "revisionField", "revisionOldValue", "revisionNewValue", "revisionClose",
  ];
  for (const key of keys) {
    assert.equal(typeof ar.AssetDetails[key], "string", `AR message missing: ${key}`);
    assert.equal(typeof en.AssetDetails[key], "string", `EN message missing: ${key}`);
  }
  for (const code of [
    "ASSET_NOT_FOUND", "ASSET_SCOPE_INVALID", "REVISION_PERMISSION_DENIED", "REVISION_FIELD_NOT_ALLOWED",
    "REVISION_NO_EFFECTIVE_CHANGE", "REVISION_IDEMPOTENCY_CONFLICT", "REVISION_CONCURRENT_CONFLICT",
    "REVISION_DEDICATED_OPERATION_REQUIRED", "REVISION_INVALID_VALUE", "REVISION_SOURCE_INVALID",
  ]) assert.match(helper, new RegExp(code));
});

test("C2C3 submit behavior is review-gated and fail-closed", () => {
  assert.match(detailPage, /Review changes/);
  assert.match(detailPage, /Revision reason/);
  assert.match(detailPage, /disabled=\{metadataBusy \|\| !metadataReason\.trim\(\)\}/);
  assert.match(detailPage, /setRevisionRefreshToken/);
  assert.match(panel, /onRetry=\{\(\) => void load\(\)\}/);
  assert.doesNotMatch(panel, /Idempotency-Key|requestHash|idempotencyKey/);
});
