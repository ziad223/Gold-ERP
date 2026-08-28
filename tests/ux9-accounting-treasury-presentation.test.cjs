const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pageFiles = [
  "app/[locale]/(dashboard)/accounting/page.tsx",
  "app/[locale]/(dashboard)/accounting/chart/page.tsx",
  "app/[locale]/(dashboard)/accounting/reports/page.tsx",
  "app/[locale]/(dashboard)/accounting/treasury/page.tsx",
];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("UX-9 scopes presentation styles to every accounting surface", () => {
  for (const file of pageFiles) {
    const source = read(file);
    assert.match(source, /AccountingTreasuryUx9\.module\.css/);
    assert.match(source, /ux9\.surface/);
  }
});

test("UX-9 presentation contract covers dense financial data and accessible interaction", () => {
  const css = read("features/accounting/components/AccountingTreasuryUx9.module.css");
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /unicode-bidi:\s*plaintext/);
  assert.match(css, /max-width:\s*900px/);
});

test("UX-9 leaves financial authorities and write contracts in place", () => {
  const accounting = read(pageFiles[0]);
  const treasury = read(pageFiles[3]);
  assert.match(accounting, /postJournalEntries/);
  assert.match(accounting, /createManualJournalDraft/);
  assert.match(treasury, /addTransaction/);
  assert.match(treasury, /openRegister/);
  assert.match(treasury, /closeRegister/);
});

test("UX-9 keeps JournalPreview semantic table and balance presentation", () => {
  const source = read("features/accounting/components/JournalPreview.tsx");
  assert.match(source, /<table/);
  assert.match(source, /Balanced/);
  assert.match(source, /Out of balance/);
  assert.match(source, /ux9\.surface/);
});
