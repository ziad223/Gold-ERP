const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "..", "features", "printing", "lib", "print-template-config.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const sandbox = { exports: {}, module: { exports: {} }, require };
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(output, sandbox, { filename: sourcePath });

const {
  DEFAULT_PRINT_TEMPLATE_CONFIG,
  resolveInvoicePrintTemplateConfig,
  shouldShowArabic,
  shouldShowEnglish,
} = sandbox.module.exports;

// 1) resolve() with no overrides returns the complete defaults.
const base = resolveInvoicePrintTemplateConfig();
assert.equal(base.languageMode, "bilingual", "default languageMode is bilingual");
assert.equal(base.paperSize, "A4", "default paperSize is A4");
assert.ok(base.theme && base.sections && base.fields, "resolved config has theme/sections/fields");

// 2) theme defaults present (incl. watermarkOpacity, gold palette).
for (const key of ["gold", "goldDark", "goldSoft", "text", "muted", "ivory", "fontFamily", "titleFontFamily", "watermarkOpacity"]) {
  assert.ok(key in base.theme, `theme default has ${key}`);
}
assert.equal(typeof base.theme.watermarkOpacity, "number", "watermarkOpacity is numeric");

// 3) section defaults present and all visible by default (preserve current look).
for (const key of ["header", "clientDetails", "invoiceDetails", "itemsTable", "specialSummary", "paymentMethod", "amountDetails", "notes", "terms", "signatures", "footer"]) {
  assert.equal(base.sections[key], true, `section ${key} defaults visible`);
}

// 4) field defaults present and true by default (no fields hidden out of the box).
for (const key of ["companyLogo", "companyTrn", "watermark", "customerPhone", "customerTrn", "customerAddress", "itemKarat", "itemWeight", "itemAssetId", "salesperson", "originalInvoiceRef", "footerPhone", "footerEmail", "footerAddress"]) {
  assert.equal(base.fields[key], true, `field ${key} defaults visible`);
}

// 5) partial overrides merge per group without dropping other defaults.
const merged = resolveInvoicePrintTemplateConfig({
  languageMode: "ar",
  theme: { gold: "#000000" },
  sections: { footer: false },
  fields: { customerPhone: false },
});
assert.equal(merged.languageMode, "ar", "override languageMode applied");
assert.equal(merged.theme.gold, "#000000", "override theme.gold applied");
assert.equal(merged.theme.goldDark, DEFAULT_PRINT_TEMPLATE_CONFIG.theme.goldDark, "other theme keys keep defaults");
assert.equal(merged.sections.footer, false, "override sections.footer applied");
assert.equal(merged.sections.header, true, "other sections keep defaults");
assert.equal(merged.fields.customerPhone, false, "override fields.customerPhone applied");
assert.equal(merged.fields.companyTrn, true, "other fields keep defaults");

// 6) null/undefined overrides never break the resolver.
assert.deepEqual(resolveInvoicePrintTemplateConfig(null), base, "null overrides -> defaults");
assert.deepEqual(resolveInvoicePrintTemplateConfig(undefined), base, "undefined overrides -> defaults");

// 7) language-mode helpers.
assert.ok(shouldShowArabic(base) && shouldShowEnglish(base), "bilingual shows both");
assert.ok(shouldShowArabic(merged) && !shouldShowEnglish(merged), "ar mode shows Arabic only");
assert.ok(shouldShowEnglish(resolveInvoicePrintTemplateConfig({ languageMode: "en" })), "en mode shows English");
assert.ok(!shouldShowArabic(resolveInvoicePrintTemplateConfig({ languageMode: "en" })), "en mode hides Arabic");

console.log("verify-print-template-config: ok");
