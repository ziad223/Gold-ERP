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
const ROUTES = "backend/src/routes/erp.routes.js";
const CUSTOMER_PAGE = "app/[locale]/(dashboard)/customers/[id]/page.tsx";
const read = (relativePath) => fs.readFileSync(path.resolve(ROOT, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.resolve(ROOT, relativePath));

function gitLines(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
function assertValidGitRef(ref) {
  try {
    execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], { cwd: ROOT, stdio: "pipe" });
  } catch (_) {
    throw new Error(`Invalid ${HISTORICAL_SCOPE_ENV} Git ref: ${ref}`);
  }
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
    "invoice-type",
    "invoice-status",
  ]) {
    assert.ok(page.includes(token), `page includes required filter: ${token}`);
  }
  assert.ok(page.includes("employee-salesperson") && /employee-salesperson[\s\S]{0,250}disabled/.test(page), "employee/salesperson filter is explicitly disabled");
  assert.ok(/invoices do not store an employee or salesperson field/i.test(page), "employee/salesperson absence is explained");
  assert.ok(hook.includes('`/invoices/search-print?${buildQueryString(queryState)}`'), "page hook uses the dedicated GET search endpoint");

  for (const type of ["sale", "return", "exchange", "installment", "deposit"]) {
    assert.ok(hook.includes(`"${type}"`), `supported invoice type is mapped: ${type}`);
  }
  assert.ok(/Gift vouchers and customer-gold purchases remain/i.test(page), "unsupported non-invoice modules are documented rather than faked");
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
    assert.ok(page.includes(heading), `results include column/action: ${heading}`);
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
  const start = routes.indexOf('// Phase 31.4-Fix — Unified Invoices Search & Print (read-only GET).');
  const end = routes.indexOf('// End Phase 31.4-Fix — Unified Invoices Search & Print.');
  assert.ok(start >= 0 && end > start, "dedicated backend route is delimited for safety checks");
  const endpoint = routes.slice(start, end);

  assert.ok(endpoint.includes('router.get("/invoices/search-print"'), "backend endpoint is GET only");
  assert.ok(endpoint.includes('requireBusinessPermission("sales.view")'), "endpoint uses Employee-aware sales.view permission");
  assert.ok(endpoint.includes("models.Invoice.count") && endpoint.includes("models.Invoice.findAll"), "endpoint uses read-only ORM calls");
  assert.ok(!/\.(create|update|destroy|save|bulkCreate|upsert|increment|decrement)\s*\(/.test(endpoint), "endpoint contains no ORM mutation calls");
  assert.ok(endpoint.includes("employeeFilter: false") && endpoint.includes("employeeName: null"), "employee capability is explicitly guarded, not invented");
  assert.ok(endpoint.includes("resolveSearchPrintStatus") && routes.includes('invoice.status === "paid"'), "Closed is derived without a DB enum change");

  const frontend = `${read(PAGE)}\n${read(HOOK)}`;
  assert.ok(!/method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i.test(frontend), "Search & Print frontend makes no mutation API calls");
  assert.ok(!/\b(?:create|update|delete|post|cancel|payment|settlement|refund)(?:Invoice|Payment|Settlement|Refund)\s*\(/.test(frontend), "Search & Print frontend invokes no financial mutation helpers");
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

  // No UAE E-Invoicing / event-sourcing may be introduced in any changed code file.
  const codeFiles = allChanged.filter((file) => /^(app|components|features|lib|backend)\//.test(file) && exists(file));
  const code = codeFiles.map((file) => read(file)).join("\n");
  assert.ok(!/UAE\s+(?:Government\s+)?E-Invoicing|\bUBL\b/i.test(code), "no UAE E-Invoicing code added");
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

(function main() {
  pageAndFilters();
  resultsAndPrintReuse();
  readOnlyEndpointAndFrontend();
  hiddenAndScopeGuards();
  docsAndPackage();
  console.log("verify-invoices-search-print: ok");
})();
