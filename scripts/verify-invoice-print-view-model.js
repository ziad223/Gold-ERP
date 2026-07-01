const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "..", "features", "printing", "lib", "invoice-print-view-model.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const sandbox = {
  exports: {},
  module: { exports: {} },
  require,
};
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(output, sandbox, { filename: sourcePath });

const { buildInvoicePrintViewModel, getInvoicePrintDocumentTitle } = sandbox.module.exports;

function invoice(overrides = {}) {
  return {
    id: "INV-ID-1",
    type: "sale",
    customerId: "CUS-1",
    customerName: "Ahmed Customer",
    date: "2026-07-01",
    total: 105,
    tax: 5,
    vatRate: 5,
    subtotal: 100,
    paidAmount: 105,
    remainingAmount: 0,
    status: "paid",
    postingStatus: "posted",
    invoiceNumber: "INV-2026-000001",
    paymentMethod: "cash",
    branch: "Main Branch",
    items: [{
      id: 7,
      assetId: "AST-1",
      name: "Gold Ring",
      quantity: 2,
      price: 50,
      weight: 3.5,
      karat: 21,
    }],
    ...overrides,
  };
}

function title(overrides) {
  return getInvoicePrintDocumentTitle(invoice(overrides));
}

assert.equal(title({ type: "sale", tax: 5, vatRate: 5 }).titleEn, "TAX INVOICE");
assert.equal(title({ type: "sale", tax: 0, vatRate: 0 }).titleEn, "SALES INVOICE");
assert.equal(title({ type: "return" }).titleEn, "RETURN INVOICE");
assert.equal(title({ type: "exchange" }).titleEn, "EXCHANGE INVOICE");
assert.equal(title({ type: "installment" }).titleEn, "INSTALLMENT INVOICE");
assert.equal(title({ type: "deposit" }).titleEn, "DEPOSIT INVOICE");
assert.equal(title({ type: "giftVoucher" }).titleEn, "GIFT VOUCHER INVOICE");
assert.equal(title({ type: "customerGoldPurchase" }).titleEn, "CUSTOMER GOLD PURCHASE INVOICE");

const vmModel = buildInvoicePrintViewModel(invoice({
  subtotal: 123.45,
  tax: 6.17,
  total: 129.62,
  paidAmount: 100,
  remainingAmount: 29.62,
}), {
  currency: "AED",
  company: { businessName: "Demo Jewellery" },
});

assert.equal(vmModel.totals.subtotal, 123.45);
assert.equal(vmModel.totals.vatAmount, 6.17);
assert.equal(vmModel.totals.totalAmount, 129.62);
assert.equal(vmModel.totals.paidAmount, 100);
assert.equal(vmModel.totals.remainingAmount, 29.62);
assert.equal(vmModel.items[0].unitPrice, 50);
assert.equal(vmModel.items[0].totalAmount, undefined);
assert.ok(vmModel.warnings.includes("line_vat_missing"));
assert.ok(vmModel.warnings.includes("line_total_missing"));
assert.ok(vmModel.warnings.includes("company_logo_missing"));
assert.ok(vmModel.warnings.includes("company_trn_missing"));
assert.ok(vmModel.warnings.includes("payment_rows_not_included_in_invoice_detail"));

const splitModel = buildInvoicePrintViewModel(invoice({
  paymentMethod: "split",
  paymentSplits: [
    { method: "cash", amount: 50 },
    { method: "card", amount: 55 },
  ],
}), { currency: "AED" });

assert.equal(splitModel.payments.length, 2);
assert.equal(splitModel.payments[0].amount, 50);
assert.equal(splitModel.warnings.includes("payment_rows_not_included_in_invoice_detail"), false);

const sourceHasForbiddenTruthReduce = /reduce\s*\([^)]*(subtotal|total|tax|vat)/i.test(source);
assert.equal(sourceHasForbiddenTruthReduce, false);

console.log("verify-invoice-print-view-model: ok");
