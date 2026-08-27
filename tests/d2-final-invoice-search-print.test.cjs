const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const service = read("backend/src/services/invoice-projection.service.js");
const route = read("backend/src/routes/invoice-projection.routes.js");
const hook = read("features/sales/hooks/use-invoice-search-print.ts");
const page = read("app/[locale]/(dashboard)/sales/search-print/page.tsx");
const printModel = read("features/printing/lib/invoice-print-view-model.ts");

test("D2 active projection registry is exact and future invoice families remain inactive", () => {
  for (const sourceType of ["sale", "return", "exchange", "installment", "deposit", "customer_gold_purchase"]) {
    assert.match(service, new RegExp(`sourceType: "${sourceType}"`));
  }
  assert.match(service, /gift_voucher:[\s\S]*?status: "SUPPORTED_LATER"[\s\S]*?canViewDetail: false[\s\S]*?canPrint: false/);
  assert.match(service, /purchase_order:[\s\S]*?status: "NOT_AN_INVOICE"[\s\S]*?canViewDetail: false/);
  assert.match(service, /repair:[\s\S]*?status: "NOT_AN_INVOICE"[\s\S]*?canViewDetail: false/);
});

test("D2 projection preserves source authority and enriches read-only identity fields", () => {
  assert.match(service, /branchName: asText\(row\.branch\?\.name\)/);
  assert.match(service, /employeeName: actorName/);
  assert.match(service, /displayStatus: invoiceDisplayStatus\(row\)/);
  assert.match(service, /barcode: asText\(link\.barcode\)/);
  assert.match(service, /model: models\.Branch, as: "branch"/);
  assert.match(service, /order: \[\["createdAt", "DESC"\], \["id", "DESC"\]\]/);
  assert.match(service, /pageSize = Math\.min\(Math\.max\(Number\.parseInt\(filters\.pageSize, 10\) \|\| 25, 1\), 100\)/);
  assert.doesNotMatch(service, /function listSummaries[\s\S]{0,10000}\.(create|update|destroy|bulkCreate|upsert|save)\(/);
});

test("D2 API contract is GET-only for search/detail and print authorization is explicit", () => {
  assert.match(route, /router\.get\("\/summaries"/);
  assert.match(route, /router\.get\("\/:sourceType\/:sourceId"/);
  assert.match(route, /router\.post\(\n\s*"\/:sourceType\/:sourceId\/print-events"/);
  assert.match(route, /salesOperatorPolicy\.requireSalesCommandAccess\("sales\.official_print"/);
  assert.match(route, /requestedType === "reprint" && !reason/);
  assert.match(route, /PROJECTION_OFFICIAL_PRINT_ALREADY_AUTHORIZED/);
  assert.match(route, /invoice_projection\.search/);
  assert.doesNotMatch(route, /router\.(put|patch|delete)\("\/summaries/);
});

test("D2 UI uses the projection source, six-type multi-select, row detail, and employee filter", () => {
  assert.match(hook, /\/invoice-projection\/summaries\?/);
  assert.doesNotMatch(hook, /\/invoices\/search-print/);
  for (const sourceType of ["sale", "return", "exchange", "installment", "deposit", "customer_gold_purchase"]) {
    assert.match(hook, new RegExp(`"${sourceType}"`));
  }
  assert.match(page, /invoice-type|typeLabel/);
  assert.match(page, /type="checkbox"/);
  assert.match(page, /Employee \/ salesperson/);
  assert.doesNotMatch(page, /employee-salesperson[\s\S]{0,300}disabled/);
  assert.match(page, /onClick=\{\(\) => openInvoice\(invoice\)\}/);
  assert.match(page, /sourceType === "customer_gold_purchase"/);
  assert.match(hook, /\/invoice-projection\/\$\{invoice\?\.type\}\/\$\{invoice\?\.id\}/);
  assert.match(page, /InvoiceReadOnlyDetail/);
});

test("D2 CGP detail and print use stored projection evidence without financial recomputation", () => {
  assert.match(hook, /projectionDetail: \{ \.\.\.detail, goldPurchaseDetails \}/);
  assert.match(printModel, /projectionDetail\?\.goldPurchaseDetails/);
  assert.match(printModel, /gold\.rate\?\.value \?\? gold\.proposedRate/);
  assert.doesNotMatch(printModel, /goldWeight[\s\S]{0,500}(\+|\*|\/)[\s\S]{0,500}(rate|vat|tax)/i);
  assert.match(page, /type === "customer_gold_purchase"/);
  assert.match(page, /type: "customerGoldPurchase"/);
});
