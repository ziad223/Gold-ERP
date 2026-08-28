const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("UX3 keeps the existing navigation catalog and permission authority", () => {
  const source = read("components/layout/sidebar.tsx");
  const routes = [
    "/dashboard", "/pos", "/sales", "/customers", "/sales/customer-gold/drafts",
    "/inventory", "/inventory/transfers", "/inventory/workshop", "/inventory/stock-audit",
    "/gold-center", "/suppliers", "/accounting", "/accounting/chart", "/accounting/reports",
    "/accounting/treasury", "/reports", "/employees", "/settings/users", "/audit", "/approvals", "/settings",
  ];
  for (const route of routes) assert.match(source, new RegExp(`href: "${route.replaceAll("/", "\\/")}"`));
  assert.match(source, /usePermissions/);
  assert.match(source, /permissionMatches/);
  assert.match(source, /useOperator/);
  assert.match(source, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(source, /id="primary-navigation"/);
  assert.match(source, /aria-expanded=\{!collapsed\}/);
});

test("UX3 shell exposes accessible landmarks without changing business boundaries", () => {
  const shell = read("components/layout/app-shell.tsx");
  const header = read("components/layout/header.tsx");
  const breadcrumbs = read("components/layout/breadcrumbs.tsx");
  assert.match(shell, /data-shell-version="ux3"/);
  assert.match(shell, /id="main-content"/);
  assert.match(header, /data-shell-header="true"/);
  assert.match(header, /aria-controls="primary-navigation"/);
  assert.match(header, /useLocale/);
  assert.match(breadcrumbs, /aria-label=\{rtl \? "مسار الصفحة" : "Page breadcrumb"\}/);
  assert.match(breadcrumbs, /aria-current="page"/);
  assert.doesNotMatch(breadcrumbs, /fetch\(|axios|POST|PUT|PATCH|DELETE|useRouter/);
});

test("UX3 consumes UX2 semantic tokens and provides reduced-motion coverage", () => {
  const css = read("app/globals.css");
  assert.match(css, /\.ux3-shell-header/);
  assert.match(css, /var\(--surface-1\)/);
  assert.match(css, /var\(--motion-standard\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.ux3-nav-item\[data-active="true"\]/);
});
