const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const breadcrumbs = fs.readFileSync(path.join(root, "components/layout/breadcrumbs.tsx"), "utf8");

test("breadcrumbs keep the synthetic dashboard crumb out of descendant URLs", () => {
  assert.match(
    breadcrumbs,
    /const href = index === 0 \? "\/dashboard" : `\/\$\{segments\.slice\(0, index\)\.join\("\/"\)\}`;/,
  );
  assert.doesNotMatch(breadcrumbs, /items\.slice\(0, index \+ 1\)\.join\("\/"\)/);
});

test("canonical Gold Center route tree is represented without a dashboard prefix", () => {
  const goldCenterPage = path.join(root, "app/[locale]/(dashboard)/gold-center/page.tsx");
  const pricingRulesPage = path.join(root, "app/[locale]/(dashboard)/gold-center/pricing-rules/page.tsx");
  assert.equal(fs.existsSync(goldCenterPage), true);
  assert.equal(fs.existsSync(pricingRulesPage), true);
  assert.equal(fs.existsSync(path.join(root, "app/[locale]/(dashboard)/dashboard/gold-center/page.tsx")), false);
});

console.log("navigation-canonical-route-audit: PASS");
