const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const helperPath = path.join(root, "components/inventory/count-semantics.ts");
const helperSource = fs.readFileSync(helperPath, "utf8");
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const helperModule = new Module(helperPath, module);
helperModule.filename = helperPath;
helperModule.paths = Module._nodeModulePaths(path.dirname(helperPath));
helperModule._compile(compiled, helperPath);
const { countTotals } = helperModule.exports;

test("fresh in-progress Count keeps initialized missing status unobserved", () => {
  const totals = countTotals({
    status: "in-progress",
    expectedCount: 3,
    items: [
      { status: "missing", result: null },
      { status: "missing", result: null },
      { status: "missing", result: null },
    ],
  });
  assert.deepEqual(totals, { expected: 3, counted: 0, unobserved: 3, missing: 0, unexpected: 0, variance: null });
});

test("partial in-progress Count separates matched and unobserved", () => {
  const totals = countTotals({
    status: "in-progress",
    expectedCount: 3,
    items: [
      { status: "matched", result: "MATCHED" },
      { status: "missing", result: null },
      { status: "missing", result: null },
    ],
  });
  assert.deepEqual(totals, { expected: 3, counted: 1, unobserved: 2, missing: 0, unexpected: 0, variance: null });
});

test("active-list totals derive Not Counted Yet when detail items are not included", () => {
  const totals = countTotals({
    status: "in-progress",
    expectedCount: 9,
    countedCount: 0,
    missingCount: 0,
    unexpectedCount: 0,
  });
  assert.deepEqual(totals, { expected: 9, counted: 0, unobserved: 9, missing: 0, unexpected: 0, variance: null });
});

test("completed Count exposes finalized missing and variance", () => {
  const totals = countTotals({
    status: "completed",
    expectedCount: 3,
    items: [
      { status: "matched", result: "MATCHED" },
      { status: "missing", result: "MISSING" },
      { status: "missing", result: "MISSING" },
    ],
  });
  assert.deepEqual(totals, { expected: 3, counted: 1, unobserved: 0, missing: 2, unexpected: 0, variance: 2 });
});

test("closed Count preserves completed totals", () => {
  const totals = countTotals({
    status: "closed",
    expectedCount: 3,
    items: [
      { status: "matched", result: "MATCHED" },
      { status: "missing", result: "MISSING" },
      { status: "missing", result: "MISSING" },
    ],
  });
  assert.deepEqual(totals, { expected: 3, counted: 1, unobserved: 0, missing: 2, unexpected: 0, variance: 2 });
});
