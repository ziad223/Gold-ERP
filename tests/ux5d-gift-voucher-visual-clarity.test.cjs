const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const componentPath = path.join(root, "features/sales/components/GiftVoucherPaymentSection.tsx");
const component = fs.readFileSync(componentPath, "utf8");

test("UX5D keeps the Gift Voucher public contract and business handlers intact", () => {
  for (const prop of [
    "rtl", "code", "voucher", "loading", "error", "supported", "currency",
    "formatAmount", "remainingDue", "onCodeChange", "onValidate", "onRemove",
  ]) {
    assert.match(component, new RegExp(`\\b${prop}\\b`));
  }
  assert.match(component, /onValidate\(\)/);
  assert.match(component, /onRemove/);
  assert.match(component, /formatAmount\(voucher\.faceValue\)/);
  assert.match(component, /formatAmount\(remainingDue\)/);
  assert.doesNotMatch(component, /useState|useEffect|apiClient|fetch\(|POST|set[A-Z]/);
});

test("UX5D provides clear status and existing-amount hierarchy without recalculation", () => {
  assert.match(component, /border-emerald-300 bg-emerald-50\/90/);
  assert.match(component, /text-xs font-black leading-5/);
  assert.match(component, /grid grid-cols-\[repeat\(auto-fit,minmax\(10rem,1fr\)\)\] gap-2/);
  assert.equal((component.match(/numeric-token mt-1 block text-sm font-black leading-5/g) || []).length, 3);
  assert.doesNotMatch(component, /voucher\.faceValue\s*(?:\+|\-|\*|\/)|remainingDue\s*(?:\+|\-|\*|\/)/);
});

test("UX5D preserves localized, directional, keyboard and touch-safe controls", () => {
  assert.match(component, /dir=\{rtl \? "rtl" : "ltr"\}/);
  assert.match(component, /\[direction:ltr\]/);
  assert.match(component, /onKeyDown/);
  assert.match(component, /focus:ring-2/);
  assert.match(component, /min-h-9 min-w-9/);
  assert.match(component, /aria-label=\{labels\.remove\}/);
  assert.match(component, /role="alert"/);
  assert.match(component, /useTranslations\("POS"\)/);
});
