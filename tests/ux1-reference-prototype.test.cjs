const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(root, "app/test/ux1-reference/page.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app/test/ux1-reference/ux1-reference.module.css"), "utf8");

test("UX-1 prototypes are isolated and static", () => {
  assert.match(page, /data-testid="ux1-reference-root"/);
  assert.match(page, /data-testid="ux1-prototype-pos"/);
  assert.match(page, /data-testid="ux1-prototype-inventory"/);
  assert.match(page, /data-testid="ux1-prototype-finance"/);
  assert.doesNotMatch(page, /fetch\s*\(/);
  assert.doesNotMatch(page, /axios|useQuery|useMutation|POST|PUT|PATCH|DELETE/);
  assert.match(page, /readOnly/);
  assert.match(page, /disabled/);
});

test("UX-1 prototypes provide language, theme, direction and accessible state hooks", () => {
  assert.match(page, /setLocale\("ar"\)/);
  assert.match(page, /setLocale\("en"\)/);
  assert.match(page, /setTheme\("dark"\)/);
  assert.match(page, /setTheme\("light"\)/);
  assert.match(page, /dir=\{locale === "ar" \? "rtl" : "ltr"\}/);
  assert.match(page, /aria-label=/);
  assert.match(page, /aria-selected=/);
  assert.match(page, /aria-pressed=/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus/);
});

test("UX-1 route is not exposed through production navigation", () => {
  const navFiles = [];
  for (const base of ["components", "contexts", "features", "app/[locale]/(dashboard)"]) {
    const dir = path.join(root, base);
    if (!fs.existsSync(dir)) continue;
    const walk = (current) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(tsx?|jsx?)$/.test(entry.name)) navFiles.push(full);
      }
    };
    walk(dir);
  }
  const productionSource = navFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.equal(productionSource.includes("/test/ux1-reference"), false);
});
