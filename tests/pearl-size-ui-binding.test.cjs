"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pearlSizeMasterData = require("../backend/src/services/pearl-size-master-data.service");

const pagePath = path.join(__dirname, "..", "app/[locale]/(dashboard)/inventory/pearl/page.tsx");
const page = fs.readFileSync(pagePath, "utf8");

test("Pearl Size UI separates canonical ID value from business label", () => {
  assert.match(page, /const pearlSizeOptions: SelectOption\[\] = pearlSizes\.map/);
  assert.match(page, /value: String\(row\.id\)/);
  assert.match(page, /label: `\$\{compactValue\} \$\{String\(row\.unit \|\| \"MM\"\)\.toLowerCase\(\)\}`/);
  assert.match(page, /options=\{pearlSizeOptions\}/);
  assert.doesNotMatch(page, /options=\{pearlSizes\.map\(\(row: RecordValue\) => row\.id\)\}/);
});

test("Pearl Size UI sorts by numeric master value and renders option labels", () => {
  assert.match(page, /sort\(\(left: RecordValue, right: RecordValue\) => left\.numericValue - right\.numericValue\)/);
  assert.match(page, /const optionLabel = typeof option === "string" \? option : option\.label/);
  assert.match(page, /<option key=\{optionValue\} value=\{optionValue\}>\{optionLabel\}<\/option>/);
});

test("Pearl Size server contract exposes canonical identity and business label", () => {
  const serialized = pearlSizeMasterData.serialize({ id: "PSMD-TEST", value: "10.00000000", displayValue: "10.0", unit: "MM", isActive: true, sortOrder: 90, isOwnerApprovedInitial: true });
  assert.equal(serialized.id, "PSMD-TEST");
  assert.equal(serialized.label, "10.0 mm");
  assert.equal(serialized.displayValue, "10.0");
  assert.equal(serialized.unit, "MM");
});

