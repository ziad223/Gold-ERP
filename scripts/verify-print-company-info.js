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
    },
  };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(output, sandbox, { filename: filePath });
  return sandbox.module.exports;
}

const targetPath = path.resolve(
  __dirname,
  "..",
  "features",
  "printing",
  "lib",
  "print-company-info-config.ts",
);
const mod = loadModule(targetPath);

const {
  DEFAULT_PRINT_COMPANY_INFO_CONFIG,
  PRINT_COMPANY_INFO_MAX_LENGTHS,
  sanitizePrintCompanyInfoConfig,
} = mod;

// 1. Default config parses to version 1 with no populated fields.
// (Field/key checks avoid cross-realm deepStrictEqual prototype mismatch — the
// sanitizer runs inside a vm sandbox, so its objects have a different prototype.)
assert.equal(DEFAULT_PRINT_COMPANY_INFO_CONFIG.version, 1);
assert.equal(Object.keys(DEFAULT_PRINT_COMPANY_INFO_CONFIG).length, 1, "default has only version");

// 2. Invalid raw values fall back safely to the default (version only).
for (const bad of [null, undefined, "garbage", 42]) {
  const r = sanitizePrintCompanyInfoConfig(bad);
  assert.equal(r.version, 1, "fallback version is 1");
  assert.equal(Object.keys(r).length, 1, "fallback has only version");
}

// 3. Valid config with email parses and keeps values (trimmed).
const valid = sanitizePrintCompanyInfoConfig({
  version: 1,
  displayName: "  DARFUS Jewellery  ",
  subtitle: "Fine Jewellery",
  phone: " +971 4 000 0000 ",
  email: " info@darfus.example ",
  website: "https://darfus.example",
  address: "Dubai, UAE",
  taxNumber: "123456789012345",
});
assert.equal(valid.version, 1);
assert.equal(valid.displayName, "DARFUS Jewellery", "displayName trimmed");
assert.equal(valid.email, "info@darfus.example", "valid email preserved (trimmed)");
assert.equal(valid.website, "https://darfus.example", "valid website preserved");
assert.equal(valid.phone, "+971 4 000 0000");
assert.equal(valid.taxNumber, "123456789012345");

// 4. Unknown keys are stripped.
const stripped = sanitizePrintCompanyInfoConfig({
  version: 1,
  email: "a@b.co",
  hackerField: "<script>alert(1)</script>",
  nested: { evil: true },
});
assert.equal(stripped.email, "a@b.co");
assert.equal(stripped.hackerField, undefined, "unknown key stripped");
assert.equal(stripped.nested, undefined, "unknown nested key stripped");

// 5. Invalid email is cleared (not rejected) — the rest of the payload survives.
const badEmail = sanitizePrintCompanyInfoConfig({
  version: 1,
  displayName: "Keep Me",
  email: "not-an-email",
});
assert.equal(badEmail.email, undefined, "invalid email cleared");
assert.equal(badEmail.displayName, "Keep Me", "sibling fields preserved when email invalid");

// 6. Invalid website is cleared (must be http/https URL).
const badSite = sanitizePrintCompanyInfoConfig({ version: 1, website: "darfus.example" });
assert.equal(badSite.website, undefined, "website without protocol cleared");
const badSite2 = sanitizePrintCompanyInfoConfig({ version: 1, website: "ftp://x.example" });
assert.equal(badSite2.website, undefined, "non-http(s) website cleared");

// 7. Overly long strings are capped to the configured maximum.
const longName = "x".repeat(500);
const capped = sanitizePrintCompanyInfoConfig({ version: 1, displayName: longName });
assert.equal(
  capped.displayName.length,
  PRINT_COMPANY_INFO_MAX_LENGTHS.displayName,
  "displayName capped at max length",
);

// 8. Empty strings normalize to undefined (consistent absence).
const empties = sanitizePrintCompanyInfoConfig({
  version: 1,
  displayName: "   ",
  email: "",
  phone: "",
});
assert.equal(empties.displayName, undefined, "whitespace-only cleared");
assert.equal(empties.email, undefined, "empty email cleared");
assert.equal(empties.phone, undefined, "empty phone cleared");

// 9. Version is always normalized to 1 regardless of input version.
const badVersion = sanitizePrintCompanyInfoConfig({ version: 99, email: "z@z.co" });
assert.equal(badVersion.version, 1, "version normalized to 1");
assert.equal(badVersion.email, "z@z.co");

console.log("verify-print-company-info: ok");
