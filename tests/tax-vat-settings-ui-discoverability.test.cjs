const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const settingsPage = fs.readFileSync(path.join(__dirname, "../app/[locale]/(dashboard)/settings/page.tsx"), "utf8");
const onboardingPage = fs.readFileSync(path.join(__dirname, "../app/[locale]/(dashboard)/settings/onboarding/page.tsx"), "utf8");
const taxPage = fs.readFileSync(path.join(__dirname, "../app/[locale]/(dashboard)/settings/tax/page.tsx"), "utf8");

test("Tax/VAT settings has one canonical Settings entry", () => {
  assert.equal((settingsPage.match(/href=\"\/settings\/tax\"/g) || []).length, 1);
  assert.match(settingsPage, /data-testid=\"settings-tax-entry\"/);
  assert.doesNotMatch(settingsPage, /href=\"\/settings\/vat\"|href=\"\/settings\/tax-policy\"/);
});

test("Onboarding points to the canonical Tax/VAT page without a second form", () => {
  assert.match(onboardingPage, /key: \"taxPolicy\"[^\n]+href: \"\/settings\/tax\"/);
  assert.doesNotMatch(onboardingPage, /PATCH|updateSettings|TaxDraft|enabledTaxTreatments/);
});

test("Tax/VAT page uses the existing server policy contract", () => {
  assert.match(taxPage, /apiClient<SettingsResponse>\(\"\/settings\"/);
  assert.match(taxPage, /method: \"PATCH\"/);
  for (const field of ["vatRegistered", "vatRate", "enabledTaxTreatments", "defaultTaxTreatment", "preciousGoodsRcmEnabled", "supportedTaxTreatments"]) {
    assert.match(taxPage, new RegExp(field));
  }
  assert.match(taxPage, /policy\.supportedTaxTreatments\.map/);
  assert.doesNotMatch(taxPage, /supportedTaxTreatments\s*:\s*\[/);
  assert.doesNotMatch(taxPage, /legalStandardVatRate\s*===?\s*(5|14)|vatRate\s*:\s*(5|14)/);
});
