"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("versioned financial catalogs contain the complete required baseline", () => {
  const catalog = require("../backend/src/services/financial-account-catalog.service");
  const requiredRoles = [
    "CASH_TREASURY", "BANK_ACCOUNT", "ACCOUNTS_RECEIVABLE", "SUPPLIER_PAYABLE",
    "INVENTORY_ASSET", "COST_OF_GOODS_SOLD", "SALES_REVENUE",
    "CUSTOMER_DEPOSIT_LIABILITY", "VAT_PAYABLE", "OPENING_BALANCE_EQUITY",
    "OPERATING_EXPENSE", "OTHER_INCOME",
  ];
  const requiredMappings = [
    "CASH_TREASURY", "BANK_ACCOUNT", "ACCOUNTS_RECEIVABLE", "SUPPLIER_PAYABLE",
    "INVENTORY_ASSET", "COST_OF_GOODS_SOLD", "SALES_REVENUE",
    "RESERVATION_ADVANCE_LIABILITY", "DEFAULT_EXPENSE", "OTHER_INCOME", "VAT_PAYABLE",
  ];
  assert.equal(catalog.BOOTSTRAP_VERSION >= 2, true);
  assert.deepEqual(requiredRoles.filter((role) => !catalog.ACCOUNT_ROLE_CATALOG[role]), []);
  assert.deepEqual(requiredMappings.filter((role) => !catalog.BRANCH_MAPPING_CATALOG[role]), []);
  assert.equal(Object.values(catalog.ACCOUNT_ROLE_CATALOG).every((entry) => entry.statementClassification), true);
});

test("First Run delegates complete financial bootstrap before READY", () => {
  const source = read("backend/src/services/first-run-bootstrap.service.js");
  assert.match(source, /financialBootstrapService\.reconcile/);
  assert.match(source, /financialBootstrapService\.evaluateReadiness/);
  assert.doesNotMatch(source, /const ACCOUNT_TEMPLATE = Object\.freeze\(\[/);
});

test("financial readiness and reconciliation routes are explicit and permission gated", () => {
  const source = read("backend/src/routes/erp.routes.js");
  assert.match(source, /\/financial\/readiness/);
  assert.match(source, /\/financial\/reconcile/);
  assert.match(source, /FINANCIAL_READINESS_REQUIRED/);
});

test("account administration uses the accounting domain service instead of generic CRUD", () => {
  const source = read("backend/src/routes/erp.routes.js");
  assert.match(source, /financialAccountService\.createAccount/);
  assert.match(source, /financialAccountService\.updateAccount/);
  assert.doesNotMatch(source, /setupCrud\("accounts"/);
  const service = read("backend/src/services/financial-account.service.js");
  assert.match(service, /ACCOUNT_PROTECTED_FIELD_FORBIDDEN/);
  assert.match(service, /hierarchy would contain a cycle/);
  assert.match(service, /ACCOUNT_DELETE_FORBIDDEN/);
  assert.match(service, /Mapped system accounts cannot be deactivated/);
});

test("posting no longer creates accounts inside a business transaction", () => {
  const source = read("backend/src/services/posting.service.js");
  assert.doesNotMatch(source, /async ensureAccount\(/);
  assert.match(source, /financialAccountResolver\.resolvePostingAccount/);
});

test("account statement and GL reports use authorized Branch scope", () => {
  const source = read("backend/src/routes/erp.routes.js");
  const statementStart = source.indexOf('router.get("/accounts/:id/statement"');
  const statementEnd = source.indexOf("\n});", statementStart);
  assert.ok(statementStart > 0 && statementEnd > statementStart);
  assert.match(source.slice(statementStart, statementEnd), /resolveAuthorizedBranchId/);
  assert.match(source, /\/reports\/income-statement/);
  assert.match(source, /\/reports\/balance-sheet/);
});

test("schema migration and model enforce posting and statement semantics", () => {
  const migrations = fs.readdirSync(path.join(root, "backend", "migrations"));
  assert.equal(migrations.some((name) => name.includes("financial-account-bootstrap-integrity")), true);
  const account = read("backend/src/models/account.model.js");
  assert.match(account, /isPosting/);
  assert.match(account, /statementClassification/);
  assert.match(account, /bootstrapVersion/);
  const migration = read(`backend/migrations/${migrations.find((name) => name.includes("financial-account-bootstrap-integrity"))}`);
  assert.match(migration, /accounts_company_code_unique/);
  assert.match(migration, /accounts_parent_id_fk/);
  assert.match(migration, /ON UPDATE CASCADE ON DELETE RESTRICT/);
  assert.match(migration, /journal_entries_company_source_unique/);
});

test("frontend exposes Chart of Accounts, readiness, mappings and GL statements", () => {
  const chart = read("app/[locale]/(dashboard)/accounting/chart/page.tsx");
  assert.match(chart, /financial\/readiness/);
  assert.match(chart, /financial\/branch-mappings/);
  assert.match(chart, /\/accounts/);
  assert.match(chart, /parentId/);
  assert.match(chart, /deactivate/);
  assert.match(chart, /eligibleMappingAccounts/);
  assert.match(chart, /saveMapping/);
  const reports = read("app/[locale]/(dashboard)/accounting/reports/page.tsx");
  assert.match(reports, /reports\/income-statement/);
  assert.match(reports, /reports\/balance-sheet/);
  const sidebar = read("components/layout/sidebar.tsx");
  assert.match(sidebar, /accounting\/chart/);
  assert.match(sidebar, /accounting\/reports/);
});
