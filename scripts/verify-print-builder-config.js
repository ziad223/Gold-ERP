const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

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
      if (id === "zod") {
        return require("zod");
      }
      if (id.startsWith("@/")) {
        const rel = id.replace("@/", "");
        let depPath = path.resolve(__dirname, "..", rel);
        if (!fs.existsSync(depPath) && fs.existsSync(depPath + ".ts")) {
          depPath += ".ts";
        } else if (!fs.existsSync(depPath) && fs.existsSync(depPath + ".tsx")) {
          depPath += ".tsx";
        }
        return loadModule(depPath);
      }
      return require(id);
    }
  };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(output, sandbox, { filename: filePath });
  return sandbox.module.exports;
}

const targetPath = path.resolve(__dirname, "..", "features", "printing", "lib", "print-builder-config.ts");
const mod = loadModule(targetPath);

const {
  DEFAULT_INVOICE_PRINT_BUILDER_CONFIG,
  sanitizeInvoicePrintBuilderConfig,
  getBuilderOverridesForTemplate,
  mergeBuilderConfigWithTemplateDefaults,
} = mod;

// 1. Safe default fallback on null/undefined/garbage
assert.deepEqual(sanitizeInvoicePrintBuilderConfig(null), DEFAULT_INVOICE_PRINT_BUILDER_CONFIG);
assert.deepEqual(sanitizeInvoicePrintBuilderConfig(undefined), DEFAULT_INVOICE_PRINT_BUILDER_CONFIG);
assert.deepEqual(sanitizeInvoicePrintBuilderConfig("random string"), DEFAULT_INVOICE_PRINT_BUILDER_CONFIG);
assert.deepEqual(sanitizeInvoicePrintBuilderConfig({ version: 2 }), DEFAULT_INVOICE_PRINT_BUILDER_CONFIG);

// 2. Unknown keys stripped/rejected
const badConfig = {
  version: 1,
  templates: {
    luxuryGold: {
      languageMode: "en",
      unknownKey: "should be stripped",
    }
  },
  unwantedRootKey: "danger"
};

const sanitized = sanitizeInvoicePrintBuilderConfig(badConfig);
assert.equal(sanitized.version, 1);
assert.ok(sanitized.templates.luxuryGold);
assert.equal(sanitized.templates.luxuryGold.languageMode, "en");
assert.equal(sanitized.templates.luxuryGold.unknownKey, undefined, "unknown template sub-key stripped");
assert.equal(sanitized.unwantedRootKey, undefined, "unknown root key stripped");

// 3. getBuilderOverridesForTemplate behaves correctly
const builderConfig = {
  version: 1,
  templates: {
    compactA4: {
      languageMode: "ar",
      sections: {
        header: false,
      },
      fields: {
        invoiceBranch: false,
      },
    }
  }
};

const overrides = getBuilderOverridesForTemplate("compactA4", builderConfig);
assert.equal(overrides.languageMode, "ar");
assert.equal(overrides.sections.header, false);
assert.equal(overrides.fields.invoiceBranch, false);

const missingOverrides = getBuilderOverridesForTemplate("minimal", builderConfig);
assert.equal(missingOverrides, undefined);

// 4. mergeBuilderConfigWithTemplateDefaults behaves correctly
const merged = mergeBuilderConfigWithTemplateDefaults("compactA4", builderConfig);
assert.equal(merged.languageMode, "ar");
assert.equal(merged.sections.header, false);
assert.equal(merged.sections.footer, true, "unmentioned sections fall back to default (true)");
assert.equal(merged.fields.invoiceBranch, false, "explicit invoiceBranch false is preserved");
// Phase 19Y: new message section toggles default true when unmentioned.
assert.equal(merged.sections.welcomeMessage, true, "welcomeMessage section defaults true");
assert.equal(merged.sections.headerNote, true, "headerNote section defaults true");
assert.equal(merged.sections.footerMessage, true, "footerMessage section defaults true");
assert.equal(merged.sections.customTextBlocks, true, "customTextBlocks section defaults true");

// Phase 19Y: a saved message-section toggle sanitizes and round-trips.
const msgSectionConfig = sanitizeInvoicePrintBuilderConfig({
  version: 1,
  templates: { luxuryGold: { sections: { welcomeMessage: false, headerNote: false, footerMessage: false, customTextBlocks: false } } },
});
assert.equal(msgSectionConfig.templates.luxuryGold.sections.welcomeMessage, false, "welcomeMessage toggle preserved");
assert.equal(msgSectionConfig.templates.luxuryGold.sections.headerNote, false, "headerNote toggle preserved");
assert.equal(msgSectionConfig.templates.luxuryGold.sections.footerMessage, false, "footerMessage toggle preserved");
assert.equal(msgSectionConfig.templates.luxuryGold.sections.customTextBlocks, false, "customTextBlocks toggle preserved");

const missingFieldMerged = mergeBuilderConfigWithTemplateDefaults("luxuryGold", DEFAULT_INVOICE_PRINT_BUILDER_CONFIG);
assert.equal(missingFieldMerged.fields.invoiceBranch, true, "invoiceBranch defaults true for missing saved configs");

// 5. Theme preset validation & sanitization
const themePresetConfig = {
  version: 1,
  templates: {
    luxuryGold: {
      themePreset: "modernDark",
      theme: {
        watermarkOpacity: 0.1,
      }
    },
    compactA4: {
      themePreset: "invalidPresetName", // Should cause validation failure or be stripped
    }
  }
};

const sanitizedPreset = sanitizeInvoicePrintBuilderConfig(themePresetConfig);
assert.equal(sanitizedPreset.templates.luxuryGold.themePreset, "modernDark");
assert.equal(sanitizedPreset.templates.compactA4, undefined, "invalid preset name is stripped/rejected during validation");

// 6. Theme preset merging and default color resolution
const mergedPreset = mergeBuilderConfigWithTemplateDefaults("luxuryGold", sanitizedPreset);
assert.equal(mergedPreset.themePreset, "modernDark");
// modernDark gold colors should merge in
assert.equal(mergedPreset.theme.gold, "#4a5568");
assert.equal(mergedPreset.theme.goldDark, "#1a202c");
// custom color in overrides wins over preset
assert.equal(mergedPreset.theme.watermarkOpacity, 0.1);
// other default fields remain intact
assert.equal(mergedPreset.sections.header, true);
assert.equal(mergedPreset.fields.companyLogo, true);
assert.equal(mergedPreset.fields.invoiceBranch, true);

console.log("verify-print-builder-config: ok");
