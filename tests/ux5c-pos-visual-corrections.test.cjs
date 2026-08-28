const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pagePath = path.join(root, "app/[locale]/(dashboard)/pos/page.tsx");
const page = fs.readFileSync(pagePath, "utf8");
const voucher = fs.readFileSync(path.join(root, "features/sales/components/GiftVoucherPaymentSection.tsx"), "utf8");
const sidebar = fs.readFileSync(path.join(root, "components/layout/sidebar.tsx"), "utf8");

test("UX5C moves the three POS regions to a readable medium-width layout", () => {
  assert.match(page, /lg:grid-cols-\[minmax\(220px,\.34fr\)_minmax\(0,1fr\)\]/);
  assert.match(page, /lg:col-span-2 2xl:col-span-1/);
  assert.match(page, /2xl:grid-cols-\[minmax\(250px,\.27fr\)_minmax\(0,1fr\)_minmax\(310px,\.35fr\)\]/);
});

test("UX5C keeps payment chrome pure by locale", () => {
  assert.match(page, /label: rtl \? "نقدي" : "Cash"/);
  assert.match(page, /label: rtl \? "بطاقة" : "Card"/);
  assert.match(page, /label: rtl \? "تحويل" : "Transfer"/);
  assert.doesNotMatch(page, /نقدي \/ Cash|بطاقة \/ Card|تحويل \/ Transfer|مجزأ \/ Split|تقسيط \/ Install|عربون \/ Deposit/);
  assert.match(page, /توزيع الدفع" : "Split allocation/);
  assert.match(page, /خطة التقسيط" : "Installment plan/);
});

test("UX5C makes zero discount neutral without changing its input behavior", () => {
  assert.match(page, /Number\(discount\) > 0 \? "text-rose-600 dark:text-rose-400" : "text-foreground"/);
  assert.match(page, /onChange=\{\(e\) => setDiscount\(normalizeNumberInput\(e\.target\.value\)\)\}/);
  assert.match(page, /value=\{discount\}/);
});

test("UX5C clarifies disabled and empty-cart actions without changing handlers", () => {
  assert.match(page, /aria-disabled=\{cart\.length === 0\}/);
  assert.match(page, /cart\.length === 0 \? "cursor-not-allowed text-slate-400"/);
  assert.match(page, /onClick=\{\(\) => setCart\(\[\]\)\}/);
  assert.match(page, /disabled:cursor-not-allowed disabled:border disabled:border-slate-300/);
  assert.match(page, /disabled=\{!cart\.length \|\| isPosting \|\| settingsNotReady/);
  assert.match(page, /min-h-\[170px\].*bg-surface-muted/);
});

test("UX5C preserves search behavior and establishes the gold/teal presentation balance", () => {
  assert.match(page, /<div className="min-w-0">\s*<DataToolbar/);
  assert.match(page, /onQueryChange=\{\(value\) =>/);
  assert.match(page, /bg-gold-50 px-2 py-1 text-gold-700/);
  assert.match(page, /text-gold-700 dark:text-gold-300">\{money\(provisionalTotal\)\}/);
});

test("UX5C leaves both deferred issues and Gift Voucher logic untouched", () => {
  assert.match(page, /<GiftVoucherPaymentSection/);
  assert.doesNotMatch(sidebar, /UX5C/);
  assert.match(voucher, /data-testid="gift-voucher-payment-section"/);
});
