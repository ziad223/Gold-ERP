const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const component = fs.readFileSync(path.join(root, "features/sales/components/GiftVoucherPaymentSection.tsx"), "utf8");
const page = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/pos/page.tsx"), "utf8");

test("visual correction keeps one canonical section and uses a non-collapsing grid", () => {
  assert.equal((page.match(/<GiftVoucherPaymentSection\b/g) || []).length, 1);
  assert.match(component, /flex min-w-0 flex-col gap-2 sm:flex-row/);
  assert.match(component, /className="input-base min-w-0 w-full flex-1/);
  assert.match(component, /width: "max-content"/);
  assert.match(component, /minWidth: "7rem"/);
});

test("visual correction preserves code direction, focus, disabled, error, and touch-safe actions", () => {
  assert.match(component, /\[direction:ltr\]/);
  assert.match(component, /focus:border-brand-500|input-base/);
  assert.match(component, /disabled={!supported}/);
  assert.match(component, /role="alert"/);
  assert.match(component, /type="button"/);
  assert.match(component, /onKeyDown/);
});

test("unsupported payment modes stay visible and fail closed without a backend change", () => {
  assert.match(page, /voucherSupportedForMethod/);
  assert.match(page, /giftVoucherErrors\.unsupportedPaymentMethod/);
  assert.match(page, /paymentMethod: finalPaymentMethod/);
  assert.doesNotMatch(component, /apiClient|fetch\(|POST|checkout/);
});
