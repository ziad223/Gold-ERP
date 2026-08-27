const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const settingsPage = fs.readFileSync(path.join(__dirname, "../app/[locale]/(dashboard)/settings/page.tsx"), "utf8");
const onboardingPage = path.join(__dirname, "../app/[locale]/(dashboard)/settings/onboarding/page.tsx");

test("Settings exposes exactly one locale-preserving onboarding entry", () => {
  assert.equal(fs.existsSync(onboardingPage), true, "onboarding route must exist");
  const entries = settingsPage.match(/<Link\s+href=\"\/settings\/onboarding\"/g) || [];
  assert.equal(entries.length, 1, "Settings must contain exactly one onboarding entry");
  assert.match(settingsPage, /إعداد الشركة وجاهزية التشغيل/);
  assert.match(settingsPage, /Company Setup & Operational Readiness/);
  assert.match(settingsPage, /data-testid=\"settings-onboarding-entry\"/);
});

test("Settings discoverability guard preserves the canonical localized destination", () => {
  assert.match(settingsPage, /href=\"\/settings\/onboarding\"/);
  assert.doesNotMatch(settingsPage, /href=\"\/ar\/settings\/onboarding\"/);
  assert.doesNotMatch(settingsPage, /href=\"\/en\/settings\/onboarding\"/);
  assert.doesNotMatch(settingsPage, /href=\"\/setup\"/);
});
