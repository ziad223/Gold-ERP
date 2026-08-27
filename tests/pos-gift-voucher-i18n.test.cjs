const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const posPage = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/pos/page.tsx"), "utf8");
const paymentSection = fs.readFileSync(path.join(root, "features/sales/components/GiftVoucherPaymentSection.tsx"), "utf8");
const errorMapper = fs.readFileSync(path.join(root, "lib/api/gift-voucher-error.ts"), "utf8");
const ar = JSON.parse(fs.readFileSync(path.join(root, "messages/ar.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(root, "messages/en.json"), "utf8"));

test("Gift Voucher errors use stable code/status classification and never raw API text", () => {
  assert.match(posPage, /getGiftVoucherErrorKey\(error\)/);
  assert.match(posPage, /t\(`giftVoucherErrors\.\$\{getGiftVoucherErrorKey\(error\)\}`\)/);
  assert.doesNotMatch(posPage, /setGiftVoucherError\(error\?\.message/);
  assert.match(errorMapper, /GIFT_VOUCHER_NOT_FOUND: "notFound"/);
  assert.match(errorMapper, /if \(candidate\.status === 404\) return "notFound"/);
  assert.match(errorMapper, /return "generic"/);
});

test("AR and EN have complete matching Gift Voucher UI/error keys", () => {
  const requiredUiKeys = ["title", "description", "code", "placeholder", "validate", "validating", "remove", "active", "faceValue", "applied", "remaining", "unavailable"];
  const requiredErrorKeys = ["notFound", "notRedeemable", "branchIneligible", "currencyMismatch", "fullValueRequired", "unsupportedPaymentMethod", "missingCode", "verifyBeforeCheckout", "valueExceedsInvoice", "generic"];
  for (const key of requiredUiKeys) {
    assert.equal(typeof ar.POS.giftVoucher[key], "string", `AR POS giftVoucher.${key}`);
    assert.equal(typeof en.POS.giftVoucher[key], "string", `EN POS giftVoucher.${key}`);
  }
  for (const key of requiredErrorKeys) {
    assert.equal(typeof ar.POS.giftVoucherErrors[key], "string", `AR POS giftVoucherErrors.${key}`);
    assert.equal(typeof en.POS.giftVoucherErrors[key], "string", `EN POS giftVoucherErrors.${key}`);
  }
  assert.notEqual(ar.POS.giftVoucherErrors.notFound, en.POS.giftVoucherErrors.notFound);
});

test("shared Gift Voucher section consumes the POS translation catalog", () => {
  assert.match(paymentSection, /import \{ useTranslations \} from "next-intl"/);
  assert.match(paymentSection, /const t = useTranslations\("POS"\)/);
  assert.match(paymentSection, /t\("giftVoucher\.title"\)/);
  assert.match(paymentSection, /t\("giftVoucher\.unavailable"\)/);
  assert.doesNotMatch(paymentSection, /قسيمة الهدية|Gift Voucher/);
});

test("supported and unsupported payment behavior remains UI-only and fail-closed", () => {
  assert.match(posPage, /voucherSupportedForMethod/);
  assert.match(posPage, /t\("giftVoucherErrors\.unsupportedPaymentMethod"\)/);
  assert.match(paymentSection, /disabled={!supported}/);
  assert.match(paymentSection, /role="alert"/);
  assert.doesNotMatch(paymentSection, /apiClient|fetch\(|POST|checkout/);
});
