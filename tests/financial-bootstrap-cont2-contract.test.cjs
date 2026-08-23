"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.join(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

function requireTypescript(relative) {
  const filename = path.join(root, relative);
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  instance._compile(output, filename);
  return instance.exports;
}

test("Chart of Accounts hierarchy filtering is deterministic and preserves context", () => {
  const {
    DEFAULT_ACCOUNT_FILTERS,
    filterAccountHierarchy,
    hasActiveAccountFilters,
  } = requireTypescript("lib/financial/account-tree-filter.ts");
  const accounts = [
    { id: "asset", parentId: null, code: "1000", name: "Assets", nameAr: "أصول", type: "asset", statementClassification: "asset", isActive: true, isPosting: false },
    { id: "cash", parentId: "asset", code: "1100", name: "Cash", nameAr: "نقد", type: "asset", statementClassification: "asset", isActive: true, isPosting: true },
    { id: "bank", parentId: "asset", code: "1200", name: "Bank", nameAr: "بنك", type: "asset", statementClassification: "asset", isActive: true, isPosting: true },
    { id: "liability", parentId: null, code: "2000", name: "Liabilities", nameAr: "خصوم", type: "liability", statementClassification: "liability", isActive: true, isPosting: false },
    { id: "expense", parentId: null, code: "5000", name: "Expenses", nameAr: "مصروفات", type: "expense", statementClassification: "operating_expense", isActive: false, isPosting: false },
  ];

  const canonical = filterAccountHierarchy(accounts, DEFAULT_ACCOUNT_FILTERS);
  assert.deepEqual(canonical.map((row) => row.account.id), ["asset", "cash", "bank", "liability", "expense"]);
  assert.equal(hasActiveAccountFilters(DEFAULT_ACCOUNT_FILTERS), false);

  const byCode = filterAccountHierarchy(accounts, { ...DEFAULT_ACCOUNT_FILTERS, search: "12" });
  assert.deepEqual(byCode.map((row) => [row.account.id, row.contextOnly]), [["asset", true], ["bank", false]]);

  const byName = filterAccountHierarchy(accounts, { ...DEFAULT_ACCOUNT_FILTERS, search: "CASH" });
  assert.deepEqual(byName.map((row) => row.account.id), ["asset", "cash"]);

  const inactive = filterAccountHierarchy(accounts, { ...DEFAULT_ACCOUNT_FILTERS, active: "inactive" });
  assert.deepEqual(inactive.map((row) => row.account.id), ["expense"]);

  const combined = filterAccountHierarchy(accounts, {
    ...DEFAULT_ACCOUNT_FILTERS,
    search: "bank",
    type: "asset",
    classification: "asset",
    active: "active",
    posting: "posting",
  });
  assert.deepEqual(combined.map((row) => row.account.id), ["asset", "bank"]);
  assert.equal(new Set(combined.map((row) => row.account.id)).size, combined.length);
});

test("canonical mapping compatibility covers every required mapping role", () => {
  const catalog = require("../backend/src/services/financial-account-catalog.service");
  const compatibility = require("../backend/src/services/financial-mapping-compatibility.service");
  const mappingTypes = Object.keys(catalog.BRANCH_MAPPING_CATALOG);
  assert.equal(mappingTypes.length, 11);

  for (const mappingType of mappingTypes) {
    const mapping = catalog.BRANCH_MAPPING_CATALOG[mappingType];
    const role = catalog.ACCOUNT_ROLE_CATALOG[mapping.accountRoleCode];
    const account = {
      id: `account-${mappingType}`,
      companyId: "company",
      branchId: null,
      isActive: true,
      isPosting: true,
      type: role.type,
      nature: role.nature,
      statementClassification: role.statementClassification,
    };
    const result = compatibility.evaluateMappingAccountCompatibility({
      companyId: "company",
      branchId: "branch",
      mappingType,
      account,
      roleCodes: [mapping.accountRoleCode],
    });
    assert.equal(result.compatible, true, mappingType);
    assert.equal(compatibility.evaluateMappingAccountCompatibility({
      companyId: "company",
      branchId: "branch",
      mappingType,
      account: { ...account, isActive: false },
      roleCodes: [mapping.accountRoleCode],
    }).reasonCode, "ACCOUNT_INACTIVE", mappingType);
    assert.equal(compatibility.evaluateMappingAccountCompatibility({
      companyId: "company",
      branchId: "branch",
      mappingType,
      account: { ...account, isPosting: false },
      roleCodes: [mapping.accountRoleCode],
    }).reasonCode, "ACCOUNT_NOT_POSTING", mappingType);
    assert.equal(compatibility.evaluateMappingAccountCompatibility({
      companyId: "company",
      branchId: "branch",
      mappingType,
      account: { ...account, companyId: "foreign" },
      roleCodes: [mapping.accountRoleCode],
    }).reasonCode, "ACCOUNT_COMPANY_INVALID", mappingType);
    assert.equal(compatibility.evaluateMappingAccountCompatibility({
      companyId: "company",
      branchId: "branch",
      mappingType,
      account: { ...account, statementClassification: "__wrong__" },
      roleCodes: [mapping.accountRoleCode],
    }).reasonCode, "ACCOUNT_CLASSIFICATION_INCOMPATIBLE", mappingType);
  }
});

test("semantic compatibility rejects broad-type lookalikes with stable safe reasons", () => {
  const compatibility = require("../backend/src/services/financial-mapping-compatibility.service");
  const base = {
    id: "generic",
    companyId: "company",
    branchId: null,
    isActive: true,
    isPosting: true,
    type: "asset",
    nature: "debit",
    statementClassification: "asset",
  };

  assert.deepEqual(
    compatibility.evaluateMappingAccountCompatibility({
      companyId: "company",
      branchId: "branch",
      mappingType: "BANK_ACCOUNT",
      account: base,
      roleCodes: [],
    }),
    { compatible: false, mappingType: "BANK_ACCOUNT", reasonCode: "ACCOUNT_ROLE_MISSING" },
  );
  assert.equal(compatibility.evaluateMappingAccountCompatibility({
    companyId: "company",
    branchId: "branch",
    mappingType: "BANK_ACCOUNT",
    account: base,
    roleCodes: ["CASH_TREASURY"],
  }).reasonCode, "ACCOUNT_ROLE_INCOMPATIBLE");
  assert.equal(compatibility.evaluateMappingAccountCompatibility({
    companyId: "company",
    branchId: "branch",
    mappingType: "BANK_ACCOUNT",
    account: { ...base, isActive: false },
    roleCodes: ["BANK_ACCOUNT"],
  }).reasonCode, "ACCOUNT_INACTIVE");
  assert.equal(compatibility.evaluateMappingAccountCompatibility({
    companyId: "company",
    branchId: "branch",
    mappingType: "BANK_ACCOUNT",
    account: { ...base, isPosting: false },
    roleCodes: ["BANK_ACCOUNT"],
  }).reasonCode, "ACCOUNT_NOT_POSTING");
  assert.equal(compatibility.evaluateMappingAccountCompatibility({
    companyId: "company",
    branchId: "branch",
    mappingType: "BANK_ACCOUNT",
    account: { ...base, companyId: "other" },
    roleCodes: ["BANK_ACCOUNT"],
  }).reasonCode, "ACCOUNT_COMPANY_INVALID");
});

test("DEFAULT_EXPENSE permits only its explicit classification family", () => {
  const compatibility = require("../backend/src/services/financial-mapping-compatibility.service");
  const expense = {
    id: "expense",
    companyId: "company",
    branchId: null,
    isActive: true,
    isPosting: true,
    type: "expense",
    nature: "debit",
    statementClassification: "operating_expense",
  };
  assert.equal(compatibility.evaluateMappingAccountCompatibility({
    companyId: "company",
    branchId: "branch",
    mappingType: "DEFAULT_EXPENSE",
    account: expense,
    roleCodes: [],
  }).compatible, true);
  assert.equal(compatibility.evaluateMappingAccountCompatibility({
    companyId: "company",
    branchId: "branch",
    mappingType: "DEFAULT_EXPENSE",
    account: { ...expense, type: "revenue", nature: "credit", statementClassification: "revenue" },
    roleCodes: [],
  }).reasonCode, "ACCOUNT_CLASSIFICATION_INCOMPATIBLE");
  assert.equal(compatibility.evaluateMappingAccountCompatibility({
    companyId: "company",
    branchId: "branch",
    mappingType: "DEFAULT_EXPENSE",
    account: expense,
    roleCodes: ["COST_OF_GOODS_SOLD"],
  }).reasonCode, "ACCOUNT_ROLE_INCOMPATIBLE");
});

test("eligible-account listing and canonical errors do not expose incompatible candidates", async () => {
  const compatibility = require("../backend/src/services/financial-mapping-compatibility.service");
  const accounts = [
    {
      id: "bank",
      companyId: "company",
      branchId: null,
      code: "A",
      name: "A",
      nameAr: "A",
      isActive: true,
      isPosting: true,
      type: "asset",
      nature: "debit",
      statementClassification: "asset",
    },
    {
      id: "generic",
      companyId: "company",
      branchId: null,
      code: "B",
      name: "B",
      nameAr: "B",
      isActive: true,
      isPosting: true,
      type: "asset",
      nature: "debit",
      statementClassification: "asset",
    },
  ];
  const roles = [{ accountId: "bank", roleCode: "BANK_ACCOUNT" }];
  const models = {
    Account: {
      findAll: async () => accounts,
      findOne: async ({ where }) => accounts.find((account) => account.id === where.id) || null,
    },
    SystemAccountRole: {
      findAll: async ({ where }) => roles.filter((role) => !where.accountId || role.accountId === where.accountId),
    },
  };
  const eligible = await compatibility.listEligibleAccounts({
    models,
    companyId: "company",
    branchId: "branch",
    mappingType: "BANK_ACCOUNT",
  });
  assert.deepEqual(eligible.map((account) => account.id), ["bank"]);

  await assert.rejects(
    compatibility.assertMappingAccountCompatibility({
      models,
      companyId: "company",
      branchId: "branch",
      mappingType: "BANK_ACCOUNT",
      accountId: "generic",
    }),
    (error) => {
      assert.equal(error.statusCode, 422);
      assert.equal(error.errorCode, "FINANCIAL_MAPPING_ACCOUNT_INCOMPATIBLE");
      assert.deepEqual(error.fieldErrors, {
        mappingRole: ["BANK_ACCOUNT"],
        reasonCode: ["ACCOUNT_ROLE_MISSING"],
      });
      assert.equal(JSON.stringify(error.fieldErrors).includes("generic"), false);
      return true;
    },
  );
});

test("backend mapping routes and resolver share canonical compatibility enforcement", () => {
  const routes = read("backend/src/routes/erp.routes.js");
  const resolver = read("backend/src/services/financial-account-resolver.service.js");
  const bootstrap = read("backend/src/services/financial-bootstrap.service.js");
  assert.match(routes, /financialMappingCompatibility/);
  assert.match(routes, /eligible-accounts/);
  assert.match(routes, /assertMappingAccountCompatibility/);
  assert.match(resolver, /assertMappingAccountCompatibility/);
  assert.match(bootstrap, /evaluateMappingAccountCompatibility/);
});

test("Chart UI exposes filters and consumes backend eligible-account authority", () => {
  const chart = read("app/[locale]/(dashboard)/accounting/chart/page.tsx");
  assert.match(chart, /account-search/);
  assert.match(chart, /account-type-filter/);
  assert.match(chart, /account-classification-filter/);
  assert.match(chart, /account-status-filter/);
  assert.match(chart, /account-posting-filter/);
  assert.match(chart, /clear-account-filters/);
  assert.match(chart, /filterAccountHierarchy/);
  assert.match(chart, /eligible-accounts/);
  assert.doesNotMatch(chart, /roleAccountType/);
});
