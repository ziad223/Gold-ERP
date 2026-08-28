const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/pos/page.tsx"), "utf8");
const voucher = fs.readFileSync(path.join(root, "features/sales/components/GiftVoucherPaymentSection.tsx"), "utf8");

test("UX5 keeps the POS authority areas in one workspace", () => {
  assert.match(page, /data-testid="pos-sales-workspace"/);
  assert.match(page, /Customer/);
  assert.match(page, /Search for product/);
  assert.match(page, /Invoice items/);
  assert.match(page, /Payment & totals/);
  assert.match(page, /style=\{\{ direction: rtl \? "rtl" : "ltr" \}\}/);
});

test("UX5 improves responsive density without changing the POS action contract", () => {
  assert.match(page, /lg:grid-cols-\[minmax\(220px,\.34fr\)_minmax\(0,1fr\)\]/);
  assert.match(page, /2xl:grid-cols-\[minmax\(250px,\.27fr\)_minmax\(0,1fr\)_minmax\(310px,\.35fr\)\]/);
  assert.match(page, /min-h-\[220px\] max-h-\[520px\]/);
  assert.match(page, /grid-cols-2 gap-2 sm:grid-cols-3/);
  assert.match(page, /onClick=\{completeSale\}/);
  assert.match(page, /t\("complete"\)/);
});

test("payment selection exposes an accessible selected state", () => {
  assert.match(page, /role="group" aria-label=\{rtl \? "طرق الدفع" : "Payment methods"\}/);
  assert.match(page, /aria-pressed=\{method === opt\.value\}/);
  assert.match(page, /focus-visible:ring-2 focus-visible:ring-brand-500\/60/);
});

test("UX5 does not change financial or inventory authorities", () => {
  assert.match(page, /calculatePricing\(customerId/);
  assert.match(page, /postInvoice\(invoiceData, idempotencyKey\)/);
  assert.match(page, /assetId: item\.id/);
  assert.match(page, /paymentMethod: finalPaymentMethod/);
  assert.doesNotMatch(page, /fetch\("\/api\/v1\/pos\/checkout/);
  assert.doesNotMatch(voucher, /setDiscount|apiClient|fetch\(/);
  assert.match(voucher, /data-testid="gift-voucher-payment-section"/);
});

test("Gift Voucher remains a payment settlement presentation", () => {
  assert.match(voucher, /description: t\("giftVoucher\.description"\)/);
  assert.match(voucher, /data-gift-voucher-supported/);
  assert.match(voucher, /aria-invalid=\{error \? "true" : undefined\}/);
  assert.match(voucher, /onKeyDown/);
});
