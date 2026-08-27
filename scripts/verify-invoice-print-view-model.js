const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function resolveModulePath(id, fromFile) {
  let depPath = id.startsWith("@/")
    ? path.resolve(__dirname, "..", id.replace("@/", ""))
    : path.resolve(path.dirname(fromFile), id);

  if (fs.existsSync(depPath)) return depPath;
  if (fs.existsSync(depPath + ".ts")) return depPath + ".ts";
  if (fs.existsSync(depPath + ".tsx")) return depPath + ".tsx";
  return depPath;
}

function loadModule(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const sandbox = {
    exports: {},
    module: { exports: {} },
    require: (id) => {
      if (id.startsWith("@/") || id.startsWith(".")) {
        return loadModule(resolveModulePath(id, filePath));
      }
      return require(id);
    },
  };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(output, sandbox, { filename: filePath });
  return sandbox.module.exports;
}

const sourcePath = path.join(__dirname, "..", "features", "printing", "lib", "invoice-print-view-model.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const { buildInvoicePrintViewModel, getInvoicePrintDocumentTitle } = loadModule(sourcePath);
const {
  CUSTOM_PRINT_BLOCK_CONTENT_MAX,
  CUSTOM_PRINT_BLOCK_MAX_BLOCKS,
  CUSTOM_PRINT_BLOCK_TITLE_MAX,
  DEFAULT_CUSTOM_PRINT_BLOCK_STYLE,
  getCustomPrintBlocksForTemplate,
  groupCustomPrintBlocksByPlacement,
  sanitizeInvoicePrintCustomBlocksConfig,
} = loadModule(path.join(__dirname, "..", "features", "printing", "lib", "invoice-print-custom-blocks-config.ts"));

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

function assertStyle(actual, expected, message) {
  assert.equal(actual.fontSize, expected.fontSize, `${message}: fontSize`);
  assert.equal(actual.align, expected.align, `${message}: align`);
  assert.equal(actual.bold, expected.bold, `${message}: bold`);
  assert.equal(actual.italic, expected.italic, `${message}: italic`);
  assert.equal(actual.underline, expected.underline, `${message}: underline`);
}

assert.equal(title({ type: "sale", tax: 5, vatRate: 5 }).titleEn, "TAX INVOICE");
assert.equal(title({ type: "sale", tax: 0, vatRate: 0 }).titleEn, "SALES INVOICE");
assert.equal(title({ type: "return" }).titleEn, "RETURN INVOICE");
assert.equal(title({ type: "exchange" }).titleEn, "EXCHANGE INVOICE");
assert.equal(title({ type: "installment" }).titleEn, "INSTALLMENT INVOICE");
assert.equal(title({ type: "deposit" }).titleEn, "DEPOSIT INVOICE");
assert.equal(title({ type: "giftVoucher" }).titleEn, "GIFT VOUCHER INVOICE");
assert.equal(title({ type: "customerGoldPurchase" }).titleEn, "CUSTOMER GOLD PURCHASE INVOICE");

// Phase 20.2: custom block config sanitizer is deterministic and bounded.
const missingCustomBlocksConfig = sanitizeInvoicePrintCustomBlocksConfig(undefined);
assert.equal(missingCustomBlocksConfig.version, 1, "missing custom blocks config defaults version 1");
assert.equal(missingCustomBlocksConfig.blocks.length, 0, "missing custom blocks config defaults empty");
const styleConfig = sanitizeInvoicePrintCustomBlocksConfig({
  version: 1,
  blocks: [
    { id: "old-block", enabled: true, content: "Old block", placement: "afterHeader", sortOrder: 1 },
    {
      id: "invalid-style",
      enabled: true,
      content: "Invalid style",
      placement: "afterHeader",
      sortOrder: 2,
      style: {
        fontSize: "giant",
        align: "justify",
        bold: "yes",
        italic: 1,
        underline: "true",
        color: "red",
        css: "font-size:999px",
      },
    },
    {
      id: "valid-style",
      enabled: true,
      content: "Valid style",
      placement: "afterHeader",
      sortOrder: 3,
      style: {
        fontSize: "xl",
        align: "center",
        bold: true,
        italic: true,
        underline: true,
      },
    },
  ],
});
assertStyle(styleConfig.blocks[0].style, DEFAULT_CUSTOM_PRINT_BLOCK_STYLE, "old blocks without style get default style");
assertStyle(styleConfig.blocks[1].style, DEFAULT_CUSTOM_PRINT_BLOCK_STYLE, "invalid/arbitrary style input falls back to defaults");
assertStyle(
  styleConfig.blocks[2].style,
  { fontSize: "xl", align: "center", bold: true, italic: true, underline: true },
  "valid style enums/booleans are preserved",
);
const longTitle = "T".repeat(CUSTOM_PRINT_BLOCK_TITLE_MAX + 20);
const longContent = "C".repeat(CUSTOM_PRINT_BLOCK_CONTENT_MAX + 20);
const sanitizedCustomBlocks = sanitizeInvoicePrintCustomBlocksConfig({
  version: 1,
  blocks: [
    { id: "long", enabled: true, title: longTitle, content: longContent, placement: "afterTotals", templates: ["luxuryGold", "bad", "luxuryGold"], sortOrder: 2 },
    { id: "disabled", enabled: false, content: "Disabled text", placement: "beforeFooter", sortOrder: 3 },
    { id: "bad-placement", enabled: true, content: "Bad", placement: "notAPlace", sortOrder: 4 },
    { id: "empty-content", enabled: true, content: "   ", placement: "afterItems", sortOrder: 5 },
    { id: "b1", content: "One", placement: "afterHeader", sortOrder: 10 },
    { id: "b2", content: "Two", placement: "afterHeader", sortOrder: 20 },
    { id: "b3", content: "Three", placement: "afterHeader", sortOrder: 30 },
    { id: "b4", content: "Four", placement: "afterHeader", sortOrder: 40 },
    { id: "b5", content: "Five", placement: "afterHeader", sortOrder: 50 },
    { id: "b6", content: "Six", placement: "afterHeader", sortOrder: 60 },
  ],
});
assert.equal(sanitizedCustomBlocks.blocks.length, CUSTOM_PRINT_BLOCK_MAX_BLOCKS, "custom blocks capped at max");
assert.equal(sanitizedCustomBlocks.blocks[0].title.length, CUSTOM_PRINT_BLOCK_TITLE_MAX, "title capped");
assert.equal(sanitizedCustomBlocks.blocks[0].content.length, CUSTOM_PRINT_BLOCK_CONTENT_MAX, "content capped");
assert.deepEqual(sanitizedCustomBlocks.blocks[0].templates, ["luxuryGold"], "invalid/duplicate templates removed");
assert.equal(sanitizedCustomBlocks.blocks.some((block) => block.id === "bad-placement"), false, "invalid placement removed");
assert.equal(sanitizedCustomBlocks.blocks.some((block) => block.id === "empty-content"), false, "empty content removed");
assert.equal(sanitizedCustomBlocks.blocks.some((block) => block.id === "disabled"), true, "disabled valid block remains in saved config");
assert.equal(getCustomPrintBlocksForTemplate(sanitizedCustomBlocks, "thermal").some((block) => block.id === "disabled"), false, "disabled blocks do not render");
assert.equal(getCustomPrintBlocksForTemplate(sanitizedCustomBlocks, "thermal").some((block) => block.id === "long"), false, "template filter excludes nonmatching template");
assert.equal(groupCustomPrintBlocksByPlacement(getCustomPrintBlocksForTemplate(sanitizedCustomBlocks, "luxuryGold")).afterTotals[0].id, "long", "blocks group by placement");

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
assert.equal(vmModel.document.branch, "Main Branch", "invoice.branch is exposed on the print document");
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

const emptyBranchModel = buildInvoicePrintViewModel(invoice({ branch: "   " }), {
  currency: "AED",
  company: { businessName: "Demo Jewellery", branchName: "Company Branch" },
});
assert.equal(emptyBranchModel.document.branch, undefined, "empty invoice.branch becomes undefined");

const noFallbackBranchModel = buildInvoicePrintViewModel(invoice({ branch: undefined }), {
  currency: "AED",
  company: { businessName: "Demo Jewellery", branchName: "Company Branch" },
});
assert.equal(noFallbackBranchModel.document.branch, undefined, "company branchName is not used as a branch fallback");
assert.equal(noFallbackBranchModel.totals.totalAmount, 105, "branch fallback rules do not affect totals");
assert.equal(noFallbackBranchModel.payments[0].amount, 105, "branch fallback rules do not affect payments");

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

// Phase 19Y: company-wide print messages come from settings.receipt into
// vm.messages (display-only), kept separate from invoice.notes.
const msgModel = buildInvoicePrintViewModel(invoice({ notes: "Per-invoice note only" }), {
  currency: "AED",
  company: { businessName: "Master Co" },
  settings: {
    receipt: {
      welcomeMessage: "  Welcome  ",
      headerNote: "Header note",
      footerMessage: "Thank you",
      termsMessage: "Terms text",
    },
  },
});
assert.equal(msgModel.messages.welcomeMessage, "Welcome", "welcomeMessage from receipt (trimmed)");
assert.equal(msgModel.messages.headerNote, "Header note", "headerNote from receipt");
assert.equal(msgModel.messages.footerMessage, "Thank you", "footerMessage from receipt");
assert.equal(msgModel.messages.termsMessage, "Terms text", "termsMessage from receipt");
assert.equal(msgModel.notes, "Per-invoice note only", "invoice.notes stays separate from messages");

// Phase 20.2: custom blocks are grouped by placement, filtered by enabled and
// template, and kept as plain string data for React escaping.
const customBlocksModel = buildInvoicePrintViewModel(invoice({ notes: "Invoice note stays separate" }), {
  currency: "AED",
  templateId: "luxuryGold",
  company: { businessName: "Master Co" },
  settings: {
    receipt: {
      welcomeMessage: "Welcome unchanged",
      headerNote: "Header unchanged",
      footerMessage: "Footer unchanged",
      termsMessage: "Terms unchanged",
    },
    invoicePrintCustomBlocks: {
      version: 1,
      blocks: [
        { id: "second", enabled: true, title: "Second", content: "Second text", placement: "afterTotals", sortOrder: 20 },
        {
          id: "first",
          enabled: true,
          title: "First",
          content: "<script>alert(\"x\")</script>",
          placement: "afterTotals",
          sortOrder: 10,
          style: { fontSize: "lg", align: "right", bold: true, italic: true, underline: true },
        },
        { id: "disabled", enabled: false, content: "Should not render", placement: "afterTotals", sortOrder: 5 },
        { id: "empty", enabled: true, content: "   ", placement: "afterItems", sortOrder: 1 },
        { id: "thermal-only", enabled: true, content: "Thermal text", placement: "beforeFooter", templates: ["thermal"], sortOrder: 1 },
      ],
    },
  },
});
assert.equal(customBlocksModel.customTextBlocksByPlacement.afterTotals.length, 2, "enabled custom blocks render by placement");
assert.equal(customBlocksModel.customTextBlocksByPlacement.afterTotals[0].id, "first", "custom blocks sort by sortOrder");
assert.equal(customBlocksModel.customTextBlocksByPlacement.afterTotals[0].content, "<script>alert(\"x\")</script>", "script-like text remains plain string data");
assertStyle(
  customBlocksModel.customTextBlocksByPlacement.afterTotals[0].style,
  { fontSize: "lg", align: "right", bold: true, italic: true, underline: true },
  "custom block style reaches VM sanitized",
);
assert.equal(customBlocksModel.customTextBlocksByPlacement.beforeFooter, undefined, "template-specific custom block excluded");
assert.equal(customBlocksModel.messages.welcomeMessage, "Welcome unchanged", "custom blocks do not alter receipt messages");
assert.equal(customBlocksModel.notes, "Invoice note stays separate", "custom blocks do not alter invoice.notes");
assert.equal(customBlocksModel.document.branch, "Main Branch", "custom blocks do not alter branch");
assert.equal(customBlocksModel.totals.totalAmount, 105, "custom blocks do not alter totals");
assert.equal(customBlocksModel.items.length, 1, "custom blocks do not alter items");

const thermalCustomBlocksModel = buildInvoicePrintViewModel(invoice(), {
  currency: "AED",
  templateId: "thermal",
  company: { businessName: "Master Co" },
  settings: {
    invoicePrintCustomBlocks: {
      version: 1,
      blocks: [
        { id: "thermal-only", enabled: true, content: "Thermal text", placement: "beforeFooter", templates: ["thermal"], sortOrder: 1 },
      ],
    },
  },
});
assert.equal(thermalCustomBlocksModel.customTextBlocksByPlacement.beforeFooter[0].content, "Thermal text", "matching template-specific custom block renders");

// Empty/whitespace message strings become undefined (blocks collapse).
const emptyMsgModel = buildInvoicePrintViewModel(invoice(), {
  currency: "AED",
  company: { businessName: "Master Co" },
  settings: { receipt: { welcomeMessage: "   ", termsMessage: "" } },
});
assert.equal(emptyMsgModel.messages.welcomeMessage, undefined, "whitespace welcomeMessage → undefined");
assert.equal(emptyMsgModel.messages.termsMessage, undefined, "empty termsMessage → undefined");
assert.equal(emptyMsgModel.messages.headerNote, undefined, "missing headerNote → undefined");

// Messages do not affect totals/items.
assert.equal(msgModel.totals.subtotal, 100, "totals unchanged by messages");
assert.equal(msgModel.items.length, 1, "items unchanged by messages");

const sourceHasForbiddenTruthReduce = /reduce\s*\([^)]*(subtotal|total|tax|vat)/i.test(source);
assert.equal(sourceHasForbiddenTruthReduce, false);

console.log("verify-invoice-print-view-model: ok");
