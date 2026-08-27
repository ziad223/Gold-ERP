"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const workspace = fs.readFileSync(
  path.resolve(__dirname, "../features/gold-purchases/components/GoldPurchaseDraftWorkspace.tsx"),
  "utf8",
);

test("CGP post UI revalidates the canonical business view with bounded GET-only polling", () => {
  assert.match(workspace, /CGP_SYNC_POLL_INTERVAL_MS = 1000/);
  assert.match(workspace, /CGP_SYNC_TIMEOUT_MS = 30_000/);
  assert.match(workspace, /getCgpBusinessView\(selected\.id, locale\)/);
  assert.match(workspace, /window\.setTimeout\(\(\) => \{ void revalidate\(\); \}, CGP_SYNC_POLL_INTERVAL_MS\)/);
  assert.match(workspace, /window\.clearTimeout\(timer\)/);
  assert.doesNotMatch(workspace, /setInterval\(/);
});

test("CGP terminal state requires all canonical integrations and the payable projection", () => {
  assert.match(workspace, /\["INVENTORY", "ACCOUNTING", "GOLD_CENTER", "CRM"\]/);
  assert.match(workspace, /status === "RETRYABLE_FAILED"/);
  assert.match(workspace, /allSucceeded && Boolean\(view\.payable\)/);
  assert.match(workspace, /data-cgp-sync-state="PENDING"/);
  assert.match(workspace, /data-cgp-sync-state="TIMEOUT"/);
  assert.match(workspace, /data-cgp-sync-state="FAILED"/);
});

test("sync revalidation does not add another mutation endpoint", () => {
  const effectStart = workspace.indexOf("const revalidate = async () =>");
  const effectEnd = workspace.indexOf("void revalidate();", effectStart);
  assert.ok(effectStart >= 0 && effectEnd > effectStart);
  const effect = workspace.slice(effectStart, effectEnd);
  assert.match(effect, /getCgpBusinessView/);
  assert.doesNotMatch(effect, /postGoldPurchaseDraft|settleCgpDraft|createGoldPurchaseDraft|updateGoldPurchaseDraft/);
});

console.log("CGP_POST_UI_SYNC_BOUNDED_GET_ONLY: PASS");
console.log("CGP_POST_UI_SYNC_TERMINAL_GATES: PASS");
console.log("CGP_POST_UI_SYNC_NO_MUTATION_REPLAY: PASS");
