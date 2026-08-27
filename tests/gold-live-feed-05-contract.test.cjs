const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const admin = fs.readFileSync(path.join(root, "backend/src/services/gold-market-admin.service.js"), "utf8");
const routes = fs.readFileSync(path.join(root, "backend/src/routes/gold-pricing-policy.routes.js"), "utf8");
const panel = fs.readFileSync(path.join(root, "features/gold-center/components/GoldMarketAdminPanels.tsx"), "utf8");
const page = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/gold-center/page.tsx"), "utf8");

assert.match(routes, /\/market\/settings/);
assert.match(routes, /\/market\/test-connection/);
assert.match(routes, /\/market\/quotes\/history/);
assert.match(admin, /companyId/);
assert.match(admin, /SECRET_OR_URL_KEY/);
assert.match(admin, /GOLD_MARKET_LIVE_PROVIDER_NOT_READY/);
assert.match(admin, /GOLD_MARKET_LIVE_POLICY_REQUIRED/);
assert.match(admin, /auditService\.record/);
assert.doesNotMatch(admin, /apiKey|secretValue|providerSecret\s*:/i);
assert.match(panel, /apiClient<any>\("\/gold-pricing\/market\/settings"/);
assert.match(panel, /Test Connection/);
assert.match(panel, /Market rate/);
assert.match(panel, /SPOT is never labelled as BID/);
assert.match(panel, /HEALTHY · FRESH/);
assert.match(panel, /STALE/);
assert.match(panel, /effectiveCgpRates/);
assert.match(panel, /KARATS = \[18, 21, 22, 24\]/);
assert.match(panel, /settings\/market-data/);
assert.doesNotMatch(panel, /goldapi\.io\/api|GOLD_MARKET_PROVIDER_GOLDAPI_IO_API_KEY/);
assert.match(page, /GoldMarketAdminPanels/);
for (const route of ["live-prices", "pricing-rules", "price-history", "settings\\market-data"]) {
  assert.ok(fs.existsSync(path.join(root, `app/[locale]/(dashboard)/gold-center/${route}/page.tsx`)), `missing ${route}`);
}
console.log("gold-live-feed-05 contract checks passed");
