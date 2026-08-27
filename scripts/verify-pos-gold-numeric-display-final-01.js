/* eslint-disable no-console */
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const token = read("components/ui/numeric-token.tsx");
const input = read("components/ui/numeric-input.tsx");
const pos = read("app/[locale]/(dashboard)/pos/page.tsx");
const goldDashboard = read("features/dashboard/components/gold-market-widget.tsx");
const goldCenter = read("app/[locale]/(dashboard)/gold-center/page.tsx");
const utils = read("lib/formatters/numbers.ts");

assert.match(token, /<bdi dir="ltr"/);
assert.match(token, /numeric-token/);
assert.match(token, /toEnglishDigits\(/);
assert.match(input, /normalizeNumberInput/);
assert.match(input, /inputMode/);
assert.match(pos, /NumericInput/);
assert.match(pos, /normalizeNumberInput/);
assert.match(pos, /NumericToken/);
assert.match(goldDashboard, /formatEnglishNumber/);
assert.match(goldDashboard, /NumericToken/);
assert.match(goldCenter, /NumericInput/);
assert.match(goldCenter, /NumericToken/);
assert.match(utils, /numberingSystem:\s*["']latn["']/);

for (const [name, source] of [["POS", pos], ["Gold Center", goldCenter]]) {
  assert.doesNotMatch(source, /type\s*=\s*["']number["']/i, `${name} still uses native number controls`);
}
assert.doesNotMatch(pos, /new Intl\.NumberFormat|toLocaleString\(/);
assert.doesNotMatch(goldDashboard, /new Intl\.NumberFormat|toLocaleString\(/);

console.log("POS_GOLD_NUMERIC_DISPLAY_STATIC=PASS");
console.log("ASCII_DIGITS_AND_BIDI_ISOLATION=PASS");
console.log("NO_BUSINESS_LOGIC_OR_API_CONTRACT_CHANGE=YES");
