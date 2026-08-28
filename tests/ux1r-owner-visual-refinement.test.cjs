const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(root, "app/test/ux1-reference/page.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app/test/ux1-reference/ux1-reference.module.css"), "utf8");

test("UX-1R has a compact production-like shell and motion demonstration", () => {
  assert.match(page, /breadcrumb/);
  assert.match(page, /ux1r-motion-demo/);
  assert.match(page, /staticFooter/);
  assert.match(css, /padding: clamp\(22px, 3vw, 38px\)/);
  assert.match(css, /@keyframes prototypeEnter/);
  assert.match(css, /@keyframes motionPulse/);
});

test("UX-1R POS fixture represents production density without business actions", () => {
  assert.match(page, /const items = \[/);
  assert.equal((page.match(/id: "AST-PUR-/g) || []).length, 3);
  assert.match(page, /stoneValue/);
  assert.match(page, /discount/);
  assert.match(page, /paymentMethods/);
  assert.match(page, /disabled>\{t\.checkout\}/);
  assert.match(page, /role="alert"/);
  assert.match(page, /aria-live="polite"/);
  assert.doesNotMatch(page, /fetch\s*\(/);
  assert.doesNotMatch(page, /useMutation|axios/);
});

test("UX-1R Arabic chrome is translated and operational authorities remain isolated", () => {
  const arabicBlock = page.match(/ar: \{([\s\S]*?)\n  \},\n\} as const/);
  assert.ok(arabicBlock, "Arabic copy block must remain explicit");
  for (const leak of ["OPERATE", "TRACE", "RECONCILE", "Live reference", "REFERENCE SURFACE", "ACCOUNT", "REFERENCE", "Filter"]) {
    assert.equal(arabicBlock[1].includes(leak), false, `Arabic chrome leak: ${leak}`);
  }
  assert.match(page, /lang=\{locale\}/);
  assert.match(page, /dir=\{locale === "ar" \? "rtl" : "ltr"\}/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /transform: none !important/);
});

test("UX-1R route stays out of production navigation", () => {
  const dirs = ["components", "contexts", "features", "app/[locale]/(dashboard)"];
  const files = [];
  const walk = (current) => {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
    }
  };
  for (const dir of dirs) walk(path.join(root, dir));
  const productionSource = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.equal(productionSource.includes("/test/ux1-reference"), false);
});
