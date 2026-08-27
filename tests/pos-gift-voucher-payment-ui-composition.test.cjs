const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const posPage = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/pos/page.tsx"), "utf8");
const paymentSection = fs.readFileSync(path.join(root, "features/sales/components/GiftVoucherPaymentSection.tsx"), "utf8");
const voucherService = fs.readFileSync(path.join(root, "backend/src/services/gift-voucher.service.js"), "utf8");

test("Gift Voucher uses one shared payment section outside Split", () => {
  assert.equal((posPage.match(/<GiftVoucherPaymentSection\b/g) || []).length, 1);
  assert.doesNotMatch(posPage, /splitGiftVoucher/);
  assert.match(posPage, /giftVoucherCode/);
  assert.match(posPage, /voucherSupportedForMethod/);
  assert.match(paymentSection, /data-testid="gift-voucher-payment-section"/);
  assert.match(paymentSection, /data-testid="gift-voucher-code-input"/);
  assert.match(paymentSection, /role="alert"/);
  assert.match(paymentSection, /remainingDue/);
});

test("Gift Voucher amount is displayed from the validated voucher and is not an editable discount", () => {
  assert.match(paymentSection, /voucher\.faceValue/);
  assert.match(paymentSection, /labels\.applied/);
  assert.doesNotMatch(paymentSection, /name\s*=\s*["'][^"']*discount|setDiscount|NumericInput/);
  assert.match(posPage, /method: "gift_voucher"/);
  assert.match(posPage, /paymentMethod: finalPaymentMethod/);
});

test("supported methods adapt to the canonical split settlement and unsupported methods fail closed", () => {
  assert.match(posPage, /\["cash", "card", "transfer", "split"\]\.includes\(method\)/);
  assert.match(posPage, /\["cash", "card", "transfer"\]\.includes\(method\)/);
  assert.match(posPage, /giftVoucherErrors\.unsupportedPaymentMethod/);
  assert.match(posPage, /finalPaymentMethod = giftVoucher/);
  assert.match(posPage, /finalPaymentSplits = giftVoucher/);
});

test("server contract remains authoritative for Gift Voucher payment combinations", () => {
  assert.match(voucherService, /GIFT_VOUCHER_CANONICAL_SPLIT_REQUIRED/);
  assert.match(voucherService, /\.toLowerCase\(\) !== "split"/);
  assert.match(voucherService, /cash.*card.*transfer/);
});
