"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx"), "utf8");
const backend = fs.readFileSync(path.join(root, "backend/src/routes/erp.routes.js"), "utf8");
const { Decimal } = require("decimal.js");
const compareDecimals = (a, b) => new Decimal(String(a)).comparedTo(new Decimal(String(b)));

test("GBW override reason is scoped to the receiving draft", () => {
  assert.match(page, /purchaseGoldRateOverrideReason: string/);
  assert.match(page, /purchaseGoldRateOverrideReason: \"\"/);
  assert.match(page, /setDraft\(initialDraft\)/);
});

test("equal rate does not activate the reason UI", () => {
  assert.equal(compareDecimals("475.36260000", "475.36260000"), 0);
  assert.match(page, /compareDecimals\(enteredRate, String\(referenceRate\)\) !== 0/);
});

test("lower and higher rates both activate the same presentation-only condition", () => {
  assert.equal(compareDecimals("470.00000000", "475.36260000") !== 0, true);
  assert.equal(compareDecimals("480.00000000", "475.36260000") !== 0, true);
  assert.match(page, /purchaseRateOverrideActive &&/);
});

test("reason field is localized and required only while override is active", () => {
  assert.match(page, /سبب تعديل سعر شراء الذهب/);
  assert.match(page, /Purchase Gold-Rate Override Reason/);
  assert.match(page, /required rows=\{2\}/);
});

test("reason is sent through the existing canonical backend key", () => {
  assert.match(page, /purchaseRateOverrideReason: purchaseRateOverrideActive/);
  assert.match(backend, /piece\.purchaseRateOverrideReason \?\?/);
});

test("client-side blank reason guard is localized without changing the backend contract", () => {
  assert.match(page, /سبب تعديل سعر شراء الذهب مطلوب عند اختلاف السعر عن المرجع/);
  assert.match(page, /A reason is required when the purchase gold rate differs from the reference/);
  assert.match(backend, /Purchase gold-rate override reason is required/);
});

test("frontend does not add tolerance or change server permission", () => {
  assert.doesNotMatch(page, /tolerance|threshold|inventory\.adjust/);
  assert.match(backend, /inventory\.adjust/);
});

test("receive endpoint and inventory authorities remain unchanged", () => {
  assert.match(page, /\/purchase-orders\/receive/);
  assert.match(page, /inventoryV2: true/);
  assert.match(page, /perPiece: \[piece\]/);
});
