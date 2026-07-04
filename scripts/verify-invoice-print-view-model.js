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

// Phase 19X.2-D: company master data is the source of truth. Precedence:
//  - identity (displayName, trn): company only (printCompanyInfo identity ignored)
//  - contact (phone/email/website/address): company > printCompanyInfo > receipt
// (A) Company master wins over old hidden printCompanyInfo identity + contact.
const winModel = buildInvoicePrintViewModel(invoice(), {
  currency: "AED",
  company: {
    businessName: "Master Co",
    taxNumber: "TRN-MASTER",
    phone: "PHONE-DB",
    email: "db@co.example",
    website: "https://db.example",
  },
  settings: {
    receipt: { phone: "RCPT-PHONE", address: "RCPT-ADDR", vatNumber: "TRN-RCPT" },
    printCompanyInfo: {
      version: 1,
      displayName: "Print Co",
      taxNumber: "TRN-PRINT",
      phone: "PRINT-PHONE",
      email: "print@co.example",
      website: "https://print.example",
      subtitle: "Fine Jewellery",
    },
  },
});
assert.equal(winModel.company.displayName, "Master Co", "company businessName wins over printInfo.displayName");
assert.equal(winModel.company.trn, "TRN-MASTER", "company taxNumber wins over printInfo.taxNumber");
assert.equal(winModel.company.phone, "PHONE-DB", "company phone wins over printInfo.phone");
assert.equal(winModel.company.email, "db@co.example", "company email wins over printInfo.email");
assert.equal(winModel.company.website, "https://db.example", "company website wins over printInfo.website");
assert.equal(winModel.company.subtitle, "Fine Jewellery", "subtitle still sourced from printInfo");

// (B) Empty company contact → printCompanyInfo fallback; printInfo identity still ignored.
const fbModel = buildInvoicePrintViewModel(invoice(), {
  currency: "AED",
  company: { businessName: "Master Co", taxNumber: "TRN-MASTER" },
  settings: {
    receipt: { phone: "RCPT-PHONE", address: "RCPT-ADDR", vatNumber: "TRN-RCPT" },
    printCompanyInfo: {
      version: 1,
      displayName: "Print Co",
      taxNumber: "TRN-PRINT",
      phone: "PRINT-PHONE",
      email: "print@co.example",
      website: "https://print.example",
    },
  },
});
assert.equal(fbModel.company.displayName, "Master Co", "printInfo.displayName never overrides company identity");
assert.equal(fbModel.company.trn, "TRN-MASTER", "printInfo.taxNumber never overrides company identity");
assert.equal(fbModel.company.phone, "PRINT-PHONE", "phone falls back to printInfo when company empty");
assert.equal(fbModel.company.email, "print@co.example", "email falls back to printInfo when company empty");
assert.equal(fbModel.company.website, "https://print.example", "website falls back to printInfo when company empty");

// (C) Empty company + empty printCompanyInfo → legacy receipt fallback still works.
const rcptModel = buildInvoicePrintViewModel(invoice(), {
  currency: "AED",
  company: { businessName: "Master Co" },
  settings: { receipt: { phone: "RCPT-PHONE", address: "RCPT-ADDR", vatNumber: "TRN-RCPT" } },
});
assert.equal(rcptModel.company.phone, "RCPT-PHONE", "phone falls back to receipt");
assert.equal(rcptModel.company.address, "RCPT-ADDR", "address falls back to receipt");
assert.equal(rcptModel.company.trn, "TRN-RCPT", "trn falls back to receipt vatNumber");
assert.equal(rcptModel.company.email, undefined, "email undefined when no source (no crash)");

// Phase 19X.2-F: official company address is formatted from structured DB fields,
// winning over printCompanyInfo.address then receipt.address.
const addrModel = buildInvoicePrintViewModel(invoice(), {
  currency: "AED",
  company: {
    businessName: "Master Co",
    address1: "12 Gold St",
    address2: "Suite 4",
    city: "Cairo",
    region: "Cairo Gov",
    country: "EGYPT",
    postalCode: "11511",
  },
  settings: {
    receipt: { address: "RCPT-ADDR" },
    printCompanyInfo: { version: 1, address: "PRINT-ADDR" },
  },
});
assert.equal(
  addrModel.company.address,
  "12 Gold St, Suite 4, Cairo, Cairo Gov, EGYPT, 11511",
  "company DB structured address is formatted and wins over printInfo/receipt",
);

// Country-only company still produces a location string (acceptable fallback).
const countryOnlyModel = buildInvoicePrintViewModel(invoice(), {
  currency: "AED",
  company: { businessName: "Master Co", country: "EGYPT" },
  settings: { printCompanyInfo: { version: 1, address: "PRINT-ADDR" } },
});
assert.equal(countryOnlyModel.company.address, "EGYPT", "country-only formats to country (not printInfo)");

// Empty company address → printCompanyInfo.address fallback.
const addrPrintFallback = buildInvoicePrintViewModel(invoice(), {
  currency: "AED",
  company: { businessName: "Master Co" },
  settings: { receipt: { address: "RCPT-ADDR" }, printCompanyInfo: { version: 1, address: "PRINT-ADDR" } },
});
assert.equal(addrPrintFallback.company.address, "PRINT-ADDR", "address falls back to printCompanyInfo when company empty");

// Empty company + empty printCompanyInfo → receipt.address fallback.
const addrReceiptFallback = buildInvoicePrintViewModel(invoice(), {
  currency: "AED",
  company: { businessName: "Master Co" },
  settings: { receipt: { address: "RCPT-ADDR" } },
});
assert.equal(addrReceiptFallback.company.address, "RCPT-ADDR", "address falls back to receipt when company + printInfo empty");

const sourceHasForbiddenTruthReduce = /reduce\s*\([^)]*(subtotal|total|tax|vat)/i.test(source);
assert.equal(sourceHasForbiddenTruthReduce, false);

console.log("verify-invoice-print-view-model: ok");
