const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const pageSource = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/inventory/stock-audit/page.tsx"), "utf8");
const routeSource = fs.readFileSync(path.join(root, "backend/src/routes/erp.routes.js"), "utf8");

test("active Count discovery uses existing scoped read routes", () => {
  assert.match(pageSource, /\/inventory-v2\/audits\?status=draft/);
  assert.match(pageSource, /\/inventory-v2\/audits\?status=in-progress/);
  assert.match(pageSource, /candidate\.status === "draft" \|\| candidate\.status === "in-progress"/);
  assert.match(pageSource, /candidate\.locationId === locationId/);
  assert.match(routeSource, /router\.get\("\/inventory-v2\/audits"/);
  assert.match(routeSource, /const allowedStatuses = new Set\(\["draft", "in-progress", "completed", "closed"\]\)/);
});

test("active Count UI is visible before new Count creation and exposes Open", () => {
  assert.match(pageSource, /Active Counts/);
  assert.match(pageSource, /الجرود النشطة/);
  assert.match(pageSource, /Open current Count/);
  assert.match(pageSource, /فتح الجرد الحالي/);
  assert.match(pageSource, /!selectedActiveCount/);
  assert.match(pageSource, /expected/);
  assert.match(pageSource, /counted/);
  assert.match(pageSource, /missing/);
  assert.match(pageSource, /unexpected/);
  assert.match(pageSource, /variance/);
});

test("active totals preserve unscanned evidence when result is still null", () => {
  assert.match(pageSource, /countItemDisplayState/);
  assert.match(pageSource, /Not Counted Yet/);
  assert.match(pageSource, /Final Variance/);
  assert.match(pageSource, /countTotals/);
  assert.doesNotMatch(pageSource, /item\.status === "missing" \|\| item\.result === "MISSING"/);
});

test("Open/Resume is read-first and does not call Start", () => {
  const openBlock = pageSource.slice(pageSource.indexOf("const openCount"), pageSource.indexOf("const startCount"));
  assert.match(openBlock, /loadCount\(candidate\.id\)/);
  assert.doesNotMatch(openBlock, /method:\s*"POST"/);
  assert.doesNotMatch(openBlock, /\/start/);
});

test("STATE_CONFLICT recovery refreshes active Counts without an automatic second create", () => {
  assert.match(pageSource, /cause\.status === 409 && cause\.errorCode === "STATE_CONFLICT"/);
  assert.match(pageSource, /const refreshed = await loadActiveCounts\(\)/);
  assert.match(pageSource, /يوجد جرد نشط بالفعل لهذا الموقع/);
  assert.match(pageSource, /An active inventory count already exists for this location/);
  const conflictBlock = pageSource.slice(
    pageSource.indexOf("cause.status === 409"),
    pageSource.indexOf("finally { setBusy(false); }", pageSource.indexOf("cause.status === 409")),
  );
  assert.doesNotMatch(conflictBlock, /method:\s*"POST"/);
});

test("Cancel and Abandon remain outside this control", () => {
  assert.doesNotMatch(pageSource, /cancel|abandon/i);
});
