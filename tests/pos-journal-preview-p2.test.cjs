const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const posPage = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/pos/page.tsx"), "utf8");
const previewComponent = fs.readFileSync(path.join(root, "features/accounting/components/JournalPreview.tsx"), "utf8");
const erpRoutes = fs.readFileSync(path.join(root, "backend/src/routes/erp.routes.js"), "utf8");
const pricingRoute = erpRoutes.slice(erpRoutes.indexOf('router.post("/pricing/calculate"'), erpRoutes.indexOf('// Create a sales invoice'));

test("POS JournalPreview renders the server contract, not client financial inputs", () => {
  assert.match(posPage, /setJournalPreview\(res\.journalPreview\s*\?\?\s*null\)/);
  assert.match(posPage, /<JournalPreview\s+preview=\{journalPreview\}/);
  assert.doesNotMatch(posPage, /<JournalPreview[\s\S]{0,500}total=\{/);
  assert.match(previewComponent, /preview:\s*ServerJournalPreview\s*\|\s*null/);
  assert.doesNotMatch(previewComponent, /paymentMethod|useMemo|Cost of Goods Sold \(Gold\)/);
});

test("pricing preview is read-only, branch-scoped, and resolves accounts server-side", () => {
  assert.match(pricingRoute, /resolveAuthorizedBranchId\(/);
  assert.match(pricingRoute, /where:\s*\{\s*id:\s*assetIds,\s*companyId:\s*req\.companyId,\s*branchId\s*\}/);
  assert.match(pricingRoute, /postingService\.previewInvoiceLines\(/);
  assert.match(pricingRoute, /financialAccountResolver\.resolvePostingAccount\(/);
  assert.doesNotMatch(pricingRoute, /\.create\(|\.update\(|\.save\(|\.destroy\(|INSERT\s+INTO|UPDATE\s+/i);
});

test("canonical pure server preview includes COGS and inventory at the same resolved cost", () => {
  const posting = require(path.join(root, "backend/src/services/posting.service.js"));
  const preview = posting.previewInvoiceLines({
    total: 114,
    tax: 14,
    subtotal: 100,
    cost: 60,
    paymentMethod: "cash",
    status: "paid",
  });
  const cogs = preview.lines.find((line) => line.account?.code === "5000");
  const inventory = preview.lines.find((line) => line.account?.code === "1200");
  assert.equal(cogs.debit, 60);
  assert.equal(inventory.credit, 60);
  assert.equal(preview.totalDebit, preview.totalCredit);
  assert.equal(preview.balanced, true);
});
