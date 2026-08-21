const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const pagePath = path.join(__dirname, "..", "app", "[locale]", "(dashboard)", "inventory", "loose-diamond", "page.tsx");
const source = fs.readFileSync(pagePath, "utf8");

test("Loose Diamond prepared request uses the server preview tax snapshot rate", () => {
  assert.match(source, /preview\?\.current\?\.taxSnapshot\?\.effectiveVatRate/);
  assert.match(source, /vatRate: currentValuationVatRate/);
  assert.doesNotMatch(source, /preview\?\.current\?\.currentTax\?\.effectiveVatRate/);
  assert.doesNotMatch(source, /vatRate:\s*14\b/);
});

test("Loose Diamond fails closed when current valuation VAT rate is absent", () => {
  assert.match(source, /currentValuationReady/);
  assert.match(source, /!currentValuationReady/);
  assert.match(source, /current valuation VAT rate is unavailable/i);
});

test("Loose Diamond UI keeps technical implementation details out of user-facing copy", () => {
  const userFacingStrings = [...source.matchAll(/(?:label|text|title|description):\s*([^,}\n]+)/gi)].map((match) => match[1]).join("\n");
  assert.doesNotMatch(userFacingStrings, /Supplier V2|Shared Preview|Backend|Idempotency|request fingerprint/i);
  assert.match(source, /Purchase price help/);
  assert.match(source, /Current value help/);
});
