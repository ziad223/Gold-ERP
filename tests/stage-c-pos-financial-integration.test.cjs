const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const { normalizePhone } = require(path.join(root, "backend/src/services/customer-phone.service.js"));
const routeSource = fs.readFileSync(path.join(root, "backend/src/routes/erp.routes.js"), "utf8");

test("Stage C customer phone normalization is deterministic and read-only", () => {
  assert.equal(normalizePhone("+971 (50) 001-0203"), "971500010203");
  assert.equal(normalizePhone("00050-001-0203"), "500010203");
  assert.equal(normalizePhone(""), "");
});

test("Stage C exposes a company-scoped read-only POS customer lookup", () => {
  assert.match(routeSource, /router\.get\("\/pos\/customer-lookup"/);
  assert.match(routeSource, /CUSTOMER_PHONE_REQUIRED/);
  assert.match(routeSource, /CUSTOMER_PHONE_AMBIGUOUS/);
  assert.match(routeSource, /company_id = :companyId/);
  assert.match(routeSource, /deleted_at IS NULL/);
  assert.doesNotMatch(routeSource, /customer-lookup[\s\S]{0,500}\.create\(/);
});

test("Stage C sale price authority does not trust client item price for Asset sales", () => {
  assert.match(routeSource, /delete pricingItem\.price/);
  assert.match(routeSource, /delete pricingItem\.sellingPrice/);
  assert.match(routeSource, /delete pricingItem\.salePrice/);
  assert.match(routeSource, /const effectiveAssetPrice = Number\(asset\.price\) \|\| 0/);
});
