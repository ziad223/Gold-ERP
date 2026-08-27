/**
 * Phase 31.4-Fix — verify the unified, read-only Invoices Search & Print layer.
 *
 * Phase 32.6-Fix-A-Hotfix-2 — default global-suite mode checks only the current
 * working tree so approved later commits are not re-litigated. Historical
 * invoices-search-print scope auditing is still available with
 * VERIFY_INVOICES_SEARCH_PRINT_SCOPE_BASELINE=<git-ref>. The functional
 * assertions (filters, results, print reuse, read-only endpoint, no mutation, no
 * financial recalculation, hidden diagnostics, no e-invoicing/event-sourcing) are
 * unchanged.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const HISTORICAL_SCOPE_ENV = "VERIFY_INVOICES_SEARCH_PRINT_SCOPE_BASELINE";
const PAGE = "app/[locale]/(dashboard)/sales/search-print/page.tsx";
const SALES_PAGE = "app/[locale]/(dashboard)/sales/page.tsx";
const HOOK = "features/sales/hooks/use-invoice-search-print.ts";
const DETAIL = "components/sales/InvoiceReadOnlyDetail.tsx";
const ROUTES = "backend/src/routes/invoice-projection.routes.js";
const CUSTOMER_PAGE = "app/[locale]/(dashboard)/customers/[id]/page.tsx";
// Only authoritative Product source is scanned for the deferred-feature guard.
// Reports, evidence, backups, prompts, generated output and dependencies are
// deliberately outside this scope: they may quote policy words without
// representing an implemented runtime feature.
const AUTHORITATIVE_SOURCE_ROOTS = [
  /^(app|components|features|lib)\//,
  /^backend\/(src|migrations|config)\//,
];
const SOURCE_EXTENSIONS = /\.(?:ts|tsx|js|jsx|cjs|mjs)$/i;
const read = (relativePath) => fs.readFileSync(path.resolve(ROOT, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.resolve(ROOT, relativePath));

function gitLines(args) {
  return execFileSync("git", ["-c", `safe.directory=${ROOT}`, ...args], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
function assertValidGitRef(ref) {
  try {
    execFileSync("git", ["-c", `safe.directory=${ROOT}`, "rev-parse", "--verify", `${ref}^{commit}`], { cwd: ROOT, stdio: "pipe" });
  } catch (_) {
    throw new Error(`Invalid ${HISTORICAL_SCOPE_ENV} Git ref: ${ref}`);
  }
}

function isAuthoritativeProductSource(file) {
  return SOURCE_EXTENSIONS.test(file) && AUTHORITATIVE_SOURCE_ROOTS.some((pattern) => pattern.test(file));
}

function scanDeferredUaeTokens(files, sourceRoot = ROOT) {
  return files
    .filter((file) => isAuthoritativeProductSource(file) && fs.existsSync(path.resolve(sourceRoot, file)))
    .flatMap((file) => {
      const source = fs.readFileSync(path.resolve(sourceRoot, file), "utf8");
      return /UAE\s+(?:Government\s+)?E-Invoicing|\bUBL\b/i.test(source) ? [file] : [];
    });
}

function pageAndFilters() {
  assert.ok(exists(PAGE), "dedicated /sales/search-print page exists");
  const page = read(PAGE);
  const hook = read(HOOK);

  for (const token of [
    "invoice-search",
    "customer-name",
    "customer-id",
    "date-from",
    "date-to",
    "invoice-branch",
    "Invoice type",
    "invoice-status",
  ]) {
    assert.ok(page.includes(token), `page includes required filter: ${token}`);
  }
  assert.ok(page.includes("employee-salesperson") && !/employee-salesperson[\s\S]{0,250}disabled/.test(page), "employee/salesperson filter is available");
  assert.ok(hook.includes("/invoice-projection/summaries?"), "page hook uses the D1/E projection GET search endpoint");

  for (const type of ["sale", "return", "exchange", "installment", "deposit", "customer_gold_purchase"]) {
    assert.ok(hook.includes(`"${type}"`), `supported invoice type is mapped: ${type}`);
  }
  assert.ok(/Gift vouchers remain an inactive source/i.test(page), "unsupported non-invoice modules are documented rather than faked");
  for (const status of ["draft", "posted", "closed", "cancelled", "returned"]) {
    assert.ok(hook.includes(`"${status}"`), `requested display status is mapped: ${status}`);
  }
}

function resultsAndPrintReuse() {
  const page = read(PAGE);
  const salesPage = read(SALES_PAGE);
  const detail = read(DETAIL);

  for (const heading of [
    "Invoice number",
    "Invoice type",
    "Status",
    "Date",
    "Customer",
    "Branch",
    "Employee / salesperson",
    "Total",
    "Paid",
    "Remaining",
    "Actions",
  ]) {
    assert.ok(page.toLowerCase().includes(heading.toLowerCase()), `results include column/action: ${heading}`);
  }
  for (const reused of [
    "InvoiceDocument",
    "InvoicePrintOptionsDialog",
    "renderPrintDocument",
    "printHtmlDocument",
    "buildTemplateConfigFromPrintOptions",
  ]) {
    assert.ok(page.includes(reused), `print action reuses existing print system: ${reused}`);
  }
  assert.ok(page.includes("InvoiceReadOnlyDetail") && salesPage.includes("@/components/sales/InvoiceReadOnlyDetail"), "Search & Print reuses the Sales read-only detail view");
  assert.ok(detail.includes("ExchangeSummary"), "shared detail preserves trusted exchange display");
  assert.ok(page.includes("useExchangeDisplay") && page.includes("exchangeDisplay={"), "exchange printing receives trusted exchange-display data");
  assert.ok(salesPage.includes('href="/sales/search-print"'), "Sales page links to the dedicated Search & Print route");

  for (const template of [
    "features/printing/components/InvoicePrintTemplate.tsx",
    "features/printing/components/CompactInvoicePrintTemplate.tsx",
    "features/printing/components/MinimalInvoicePrintTemplate.tsx",
    "features/printing/components/ThermalInvoicePrintTemplate.tsx",
    "features/printing/components/ExchangePrintSummary.tsx",
  ]) {
    assert.ok(exists(template), `existing print asset preserved: ${template}`);
  }
}

function readOnlyEndpointAndFrontend() {
  const routes = read(ROUTES);
  assert.ok(routes.includes('router.get("/summaries"'), "projection search endpoint is GET only");
  assert.ok(routes.includes('router.get("/:sourceType/:sourceId"'), "projection detail endpoint is GET only");
  assert.ok(routes.includes('router.post(\n  "/:sourceType/:sourceId/print-events"'), "print authorization is the only write-shaped route");
  assert.ok(routes.includes('requireBusinessPermission("sales.view")'), "projection GET routes use sales.view permission");
  assert.ok(!/CustomerGoldPurchaseDocument\.(create|update|destroy)|models\.Invoice\.(create|update|destroy)/.test(routes), "projection route contains no business transaction mutation");

  const frontend = `${read(PAGE)}\n${read(HOOK)}`;
  assert.ok(!/purchase-orders\/receive|\/pos\/checkout|payment\/create|settlement\/create/i.test(frontend), "Search & Print frontend invokes no business mutation boundary");
  assert.ok(frontend.includes('method: "POST"') && frontend.includes("print-events"), "only canonical print authorization is POST-shaped");
  assert.ok(!/remainingAmount\s*=(?!=)|paidAmount\s*=(?!=)|total\s*-\s*paid|subtotal\s*\+|tax\s*\+/.test(read(PAGE)), "page does not recalculate financial totals, paid, remaining, or tax");
}

function hiddenAndScopeGuards() {
  const customerPage = read(CUSTOMER_PAGE);
  const scopeDoc = read("docs/CLIENT_SCOPE_LOCK.md");
  assert.ok(/const\s+SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS\s*=\s*false\s*;/.test(customerPage), "statement-v3 and customer-credit diagnostics stay hidden by default");
  assert.ok(scopeDoc.includes("full-2300 diagnostic/report UI") && scopeDoc.includes("Hidden Until Sign-off"), "full-2300 remains documented as non-customer-facing");

  // Working-tree scope guard (forbidden-area based, not a rigid allowed-files list).
  // Reject a changed file only when it touches a protected accounting/posting/
  // mutation area — never merely because it is new since an older base. This lets
  // legitimate later-phase files (e.g. the Phase 32.1 barcode foundation) coexist.
  const historicalBaseline = String(process.env[HISTORICAL_SCOPE_ENV] || "").trim();
  const historicalMode = Boolean(historicalBaseline);
  if (historicalMode) {
    assertValidGitRef(historicalBaseline);
    console.log(`HISTORICAL INVOICES SEARCH PRINT SCOPE MODE — baseline ${historicalBaseline}`);
  }

  const changed = historicalMode
    ? gitLines(["diff", "--name-only", historicalBaseline])
    : gitLines(["diff", "--name-only", "HEAD"]);
  const untracked = gitLines(["ls-files", "--others", "--exclude-standard"]);
  const allChanged = [...new Set([...changed, ...untracked].map((file) => file.replace(/\\/g, "/")))];

  // Protected accounting/posting/journal/reconciliation and customer-credit services
  // must not be modified by Search & Print work.
  const FORBIDDEN_AREAS = [
    /^backend\/src\/services\/journal\.service\.js$/,
    /^backend\/src\/services\/source-aware-statement\.service\.js$/,
    /^backend\/src\/services\/statement-reconciliation\.service\.js$/,
    /^backend\/src\/services\/full-2300-reconciliation\.service\.js$/,
    /^backend\/src\/services\/customer-credit\.service\.js$/,
  ];
  const forbiddenTouched = allChanged.filter((file) => FORBIDDEN_AREAS.some((pattern) => pattern.test(file)));
  assert.deepEqual(forbiddenTouched, [], `no protected accounting/posting/journal/reconciliation service changed (found: ${forbiddenTouched.join(", ")})`);

  // Nothing — including any print template — may be deleted relative to baseline.
  const nameStatus = historicalMode
    ? gitLines(["diff", "--name-status", historicalBaseline])
    : gitLines(["diff", "--name-status", "HEAD"]);
  const deleted = nameStatus.filter((line) => line.startsWith("D\t")).map((line) => line.slice(2).replace(/\\/g, "/"));
  assert.deepEqual(deleted, [], `no file or print template was deleted (found: ${deleted.join(", ")})`);

  // Deferred UAE eInvoicing and event-sourcing guards inspect only bounded,
  // authoritative Product source. Evidence reports and other non-source
  // artifacts are not implementation evidence and must not cause a false
  // failure. The guard remains fail-closed for a real source introduction.
  const codeFiles = allChanged.filter((file) => isAuthoritativeProductSource(file) && exists(file));
  const code = codeFiles.map((file) => read(file)).join("\n");
  assert.deepEqual(scanDeferredUaeTokens(codeFiles), [], "no UAE E-Invoicing code added");
  assert.ok(!/event[- ]sourcing|projection architecture/i.test(code), "no event-sourcing/projection architecture added");
}

function docsAndPackage() {
  const packageJson = JSON.parse(read("package.json"));
  assert.equal(packageJson.scripts["verify:invoices-search-print"], "node scripts/verify-invoices-search-print.js", "package verifier script is registered");
  for (const doc of ["docs/AI_HANDOFF.md", "docs/CLIENT_SCOPE_LOCK.md"]) {
    const source = read(doc);
    assert.ok(source.includes("Phase 31.4-Fix") && source.includes("Unified Invoices Search & Print"), `${doc} contains the Phase 31.4 handoff note`);
    assert.ok(/UAE\s+E-Invoicing\s+remains\s+deferred/i.test(source), `${doc} keeps UAE E-Invoicing deferred`);
    assert.ok(/Event-sourcing\/projection architecture\s+(?:was\s+)?not\s+implemented/i.test(source), `${doc} confirms event-sourcing was not implemented`);
  }
}

function main() {
  pageAndFilters();
  resultsAndPrintReuse();
  readOnlyEndpointAndFrontend();
  hiddenAndScopeGuards();
  docsAndPackage();
  console.log("verify-invoices-search-print: ok");
}

if (require.main === module) main();

module.exports = { isAuthoritativeProductSource, scanDeferredUaeTokens };
