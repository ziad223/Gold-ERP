const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const route = fs.readFileSync(path.join(root, "backend/src/routes/erp.routes.js"), "utf8");
const helper = fs.readFileSync(path.join(root, "lib/debug/pearl-replay-helper.ts"), "utf8");
const client = fs.readFileSync(path.join(root, "lib/api/client.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/inventory/pearl/page.tsx"), "utf8");
const posPage = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/pos/page.tsx"), "utf8");

test("Pearl POS uses a positive explicit Asset.price before optional policy resolution", () => {
  assert.match(route, /profile === "PEARL_JEWELLERY"/);
  assert.match(route, /Number\.isFinite\(explicitAssetPrice\) && explicitAssetPrice > 0/);
  assert.match(route, /return \{ value: explicitAssetPrice, unavailable: false \}/);
  assert.match(route, /if \(!goldSalePricingService\.isSalePricingProfile\(profile\)\)/);
});

test("Pearl POS remains fail-closed for missing price and has no Product fallback in the Pearl branch", () => {
  const pearlBranch = route.match(/if \(profile === "PEARL_JEWELLERY"\) \{([\s\S]*?)\n      \}/)?.[1] || "";
  assert.match(pearlBranch, /Number\.isFinite\(explicitAssetPrice\) && explicitAssetPrice > 0/);
  assert.doesNotMatch(pearlBranch, /Product|quantity|salePrice/);
  assert.match(posPage, /priceUnavailable = unavailable/);
});

test("Replay helper is local/query gated and uses the existing apiClient without auth material", () => {
  assert.match(helper, /window\.location\.hostname !== "localhost"/);
  assert.match(helper, /pearlReplayTest/);
  assert.match(helper, /preConfirmAuthFreshness/);
  assert.match(helper, /requestContextSnapshot/);
  assert.match(helper, /canonicalBusinessHash\("purchase\.receive"/);
  assert.match(helper, /apiClient<any>\(RECEIVE_PATH/);
  assert.doesNotMatch(helper, /getStoredAccessToken|Authorization|refreshToken|password/i);
  assert.match(client, /onResponseStatus\?\.\(fetched\.status\)/);
  assert.match(page, /data-testid="pearl-replay-exact"/);
  assert.match(page, /data-testid="pearl-replay-changed"/);
  assert.match(page, /mode === "changed" \? \{ \.\.\.saved, notes:/);
});

test("Replay harness is one-shot per mode and changed payload requires exact replay first", () => {
  assert.match(page, /exactReplayDone/);
  assert.match(page, /changedReplayDone/);
  assert.match(page, /!exactReplayDone/);
  assert.match(page, /mode === "exact" && exactReplayDone/);
  assert.match(page, /mode === "changed" && changedReplayDone/);
});

console.log("pearl-final-closure-minimum-safe-fix: PASS");
