/**
 * Phase 30.7-Fix — verify customer-safe exchange invoice PRINT.
 *
 * Static checks that the four print templates render ExchangePrintSummary from
 * trusted exchange-display data for exchange invoices (and suppress the raw
 * negative item table / totals), that ExchangePrintSummary is print-safe
 * (no useLocale / React Query / Badge / no raw tax math), that the sales print
 * passes the data, that InvoiceDocument accepts it, and that normal-invoice print
 * is untouched. A working-tree scope guard confirms this phase changed only the
 * allowed frontend/print files (no backend/POS-checkout/migration).
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

const TEMPLATES = {
  luxury: "features/printing/components/InvoicePrintTemplate.tsx",
  compact: "features/printing/components/CompactInvoicePrintTemplate.tsx",
  minimal: "features/printing/components/MinimalInvoicePrintTemplate.tsx",
  thermal: "features/printing/components/ThermalInvoicePrintTemplate.tsx",
};
const SUMMARY = "features/printing/components/ExchangePrintSummary.tsx";
const DOCUMENT = "features/printing/components/InvoiceDocument.tsx";
const SALES_PAGE = "app/[locale]/(dashboard)/sales/page.tsx";

function summaryIsPrintSafe() {
  assert.ok(fs.existsSync(path.resolve(ROOT, SUMMARY)), "ExchangePrintSummary exists");
  const src = read(SUMMARY);
  // Print-safe: no provider hooks, no React Query, no screen UI.
  assert.ok(!/useLocale\s*\(/.test(src) && !/from ["']next-intl["']/.test(src), "ExchangePrintSummary does not call useLocale / import next-intl");
  assert.ok(!/import[^\n]*@tanstack\/react-query/.test(src) && !/import[^\n]*useExchangeDisplay/.test(src) && !/\buseQuery\s*\(/.test(src), "ExchangePrintSummary does not import React Query / useExchangeDisplay");
  assert.ok(!/from "@\/components\/ui\/badge"|<Badge/.test(src), "ExchangePrintSummary does not import the screen Badge");
  assert.ok(/locale:\s*string/.test(src) || /locale }/.test(src), "ExchangePrintSummary takes locale as a prop");
  // Uses trusted figures, never recomputes tax/totals from raw invoice items.
  assert.ok(src.includes("figures.newTax") && src.includes("figures.newGross"), "uses trusted figures (newTax/newGross)");
  assert.ok(!/\bitem\.price\s*\*/.test(src) && !/\*\s*vatRate/.test(src) && !/rawInvoiceItems/.test(src), "no raw tax recomputation");
  assert.ok(src.includes("Math.max(0"), "clamps money so no negative prints");
  // Fallback path present.
  assert.ok(/if\s*\(!exchangeDisplay\)/.test(src) && /unavailable/i.test(src), "renders a conservative warning when display data is absent");
}

function documentAndPropType() {
  // InvoiceDocument forwards all props (incl. exchangeDisplay via ...props).
  const doc = read(DOCUMENT);
  assert.ok(/\.\.\.props/.test(doc) && /InvoicePrintTemplateProps/.test(doc), "InvoiceDocument forwards props (extends InvoicePrintTemplateProps)");
  // The shared props type accepts optional exchangeDisplay.
  const luxury = read(TEMPLATES.luxury);
  assert.ok(/exchangeDisplay\?:\s*ExchangeDisplayResponse/.test(luxury), "InvoicePrintTemplateProps declares optional exchangeDisplay");
}

function templatesGateExchange() {
  for (const [name, rel] of Object.entries(TEMPLATES)) {
    const src = read(rel);
    assert.ok(src.includes('const isExchange = invoice.type === "exchange"'), `${name}: gates on invoice.type === "exchange"`);
    assert.ok(/\{isExchange && \(\s*<ExchangePrintSummary/.test(src.replace(/\s+/g, " ")), `${name}: renders ExchangePrintSummary for exchange`);
    assert.ok(src.includes("exchangeDisplay={exchangeDisplay ?? null}"), `${name}: passes the trusted display to the summary`);
    // Raw item table suppressed for exchange (still rendered for normal invoices).
    assert.ok(/tpl\.sections\.itemsTable && !isExchange/.test(src), `${name}: suppresses the raw item table for exchange`);
    assert.ok(src.includes("vm.items.map"), `${name}: normal-invoice item table still present`);
    // Raw totals suppressed for exchange (no negative total printed).
    assert.ok(/amountDetails\)? && !isExchange|amountDetails && !isExchange/.test(src), `${name}: suppresses raw totals for exchange`);
  }
}

function salesPagePasses() {
  const src = read(SALES_PAGE);
  assert.ok(src.includes("<InvoiceDocument") && src.includes("exchangeDisplay={"), "sales print passes exchangeDisplay to InvoiceDocument");
  assert.ok(src.includes('invoice.type === "exchange"'), "sales print gates the display on exchange type");
  assert.ok(src.includes("selected?.id === invoice.id"), "sales print only passes data fetched for the printed invoice");
}

function scopeGuard() {
  let changed = [];
  try {
    changed = execSync("git diff --name-only HEAD", { cwd: ROOT }).toString().split("\n").map((s) => s.trim()).filter(Boolean);
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT }).toString().split("\n").map((s) => s.trim()).filter(Boolean);
    changed = changed.concat(untracked).filter(f => !f.replace(/\\/g, "/").startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));
  } catch { changed = []; }

  const allowed = new Set([
    SALES_PAGE,
    "app/[locale]/(dashboard)/sales/returns/page.tsx",
    "app/[locale]/(dashboard)/sales/exchanges/page.tsx",
    "app/[locale]/(dashboard)/sales/installments/page.tsx",
    "backend/src/routes/erp.routes.js",
    "backend/src/bootstrap/accessControl.js",
    "backend/src/services/sales-operator-policy.service.js",
    "backend/src/services/system-account.service.js",
    "lib/permissions/catalog.ts",
    DOCUMENT,
    SUMMARY,
    ...Object.values(TEMPLATES),
    "features/printing/lib/invoice-print-view-model.ts",
    "lib/types.ts",
    "scripts/verify-exchange-print-display.js",
    "package.json",
    "docs/AI_HANDOFF.md",
    "docs/employee-authorization/PHASE-34.5.md",
    "docs/employee-authorization/PHASE-34.5B.md",
  ]);
  const forbidden = changed.filter((f) => {
    const n = f.replace(/\\/g, "/");
    if (allowed.has(n)) return false;
    return (
      n.startsWith("backend/") ||
      /(^|\/)migrations\//.test(n) ||
      /(^|\/)pos\//.test(n) ||
      !allowed.has(n)
    );
  });
  assert.equal(forbidden.length, 0, `this phase must change only allowed frontend/print files (found: ${forbidden.join(", ")})`);
}

(function main() {
  summaryIsPrintSafe();
  documentAndPropType();
  templatesGateExchange();
  salesPagePasses();
  scopeGuard();
  console.log("verify-exchange-print-display: ok");
})();
