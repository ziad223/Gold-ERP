const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const surfaces = [
  "app/[locale]/(dashboard)/settings/page.tsx",
  "app/[locale]/(dashboard)/settings/tax/page.tsx",
  "app/[locale]/(dashboard)/settings/barcode-codes/page.tsx",
  "app/[locale]/(dashboard)/settings/onboarding/page.tsx",
  "app/[locale]/(dashboard)/settings/users/page.tsx",
  "app/[locale]/(dashboard)/audit/page.tsx",
];

test("UX-10 scopes presentation styling to every Settings and Audit surface", () => {
  for (const file of surfaces) {
    const source = read(file);
    assert.match(source, /SettingsAuditUx10\.module\.css/);
    assert.match(source, /ux10\.surface/);
  }
});

test("UX-10 presentation contract covers dense data, long values and accessible motion", () => {
  const css = read("features/settings/components/SettingsAuditUx10.module.css");
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /unicode-bidi:\s*plaintext/);
  assert.match(css, /max-width:\s*900px/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});

test("UX-10 keeps Settings, RBAC and Audit authorities in source", () => {
  const settings = read(surfaces[0]);
  const tax = read(surfaces[1]);
  const barcode = read(surfaces[2]);
  const users = read(surfaces[4]);
  const audit = read(surfaces[5]);
  assert.match(settings, /handleSaveCompany/);
  assert.match(settings, /handleSaveSystem/);
  assert.match(tax, /settings\.update/);
  assert.match(tax, /\/settings/);
  assert.match(barcode, /useBarcodeSettings/);
  assert.match(users, /system_accounts\.manage/);
  assert.match(audit, /useAuditLogs/);
  assert.match(audit, /\/audit-logs\/verify/);
  assert.match(audit, /AuditDiffViewer/);
});
