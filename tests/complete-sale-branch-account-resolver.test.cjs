"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const models = require("../backend/src/models");
const postingService = require("../backend/src/services/posting.service");
const {
  FINAL_SALE_ROLE_DEFINITIONS,
  resolveRequiredFinalSaleAccounts,
} = require("../backend/src/services/company-bootstrap.service");

function accountFor(key, overrides = {}) {
  const definition = FINAL_SALE_ROLE_DEFINITIONS[key];
  return {
    id: `account-${key}`,
    companyId: "company-a",
    branchId: "branch-a",
    isActive: true,
    type: definition.type,
    nature: definition.nature,
    ...overrides,
  };
}

async function withResolverModels({ roles = {}, accounts = {}, branch = { id: "branch-a" } }, run) {
  const original = {
    branchFindOne: models.Branch.findOne,
    roleFindAll: models.SystemAccountRole.findAll,
    accountFindByPk: models.Account.findByPk,
  };
  models.Branch.findOne = async () => branch;
  models.SystemAccountRole.findAll = async ({ where }) => roles[where.roleCode] || [];
  models.Account.findByPk = async id => accounts[id] || null;
  try {
    await run();
  } finally {
    models.Branch.findOne = original.branchFindOne;
    models.SystemAccountRole.findAll = original.roleFindAll;
    models.Account.findByPk = original.accountFindByPk;
  }
}

test("Complete-sale resolver requires every explicit branch-scoped role", async () => {
  const roles = {};
  const accounts = {};
  for (const [key, definition] of Object.entries(FINAL_SALE_ROLE_DEFINITIONS)) {
    const account = accountFor(key);
    accounts[account.id] = account;
    roles[definition.roleCode] = [{ accountId: account.id }];
  }
  await withResolverModels({ roles, accounts }, async () => {
    const resolved = await resolveRequiredFinalSaleAccounts("company-a", "branch-a");
    assert.equal(resolved.accountsReceivable.id, "account-accountsReceivable");
    assert.equal(Object.keys(resolved).length, 6);
  });
});

test("Complete-sale resolver fails closed for missing, cross-scope, inactive, and wrong-role mappings", async t => {
  const validRoles = {};
  const validAccounts = {};
  for (const [key, definition] of Object.entries(FINAL_SALE_ROLE_DEFINITIONS)) {
    const account = accountFor(key);
    validAccounts[account.id] = account;
    validRoles[definition.roleCode] = [{ accountId: account.id }];
  }
  const cases = [
    ["missing", {}, validAccounts, "BRANCH_FINANCIAL_MAPPING_REQUIRED"],
    ["cross-scope", validRoles, { ...validAccounts, "account-accountsReceivable": accountFor("accountsReceivable", { branchId: "branch-b" }) }, "BRANCH_FINANCIAL_ACCOUNT_SCOPE_INVALID"],
    ["inactive", validRoles, { ...validAccounts, "account-salesRevenue": accountFor("salesRevenue", { isActive: false }) }, "BRANCH_FINANCIAL_ACCOUNT_INACTIVE"],
    ["wrong-role", validRoles, { ...validAccounts, "account-vatPayable": accountFor("vatPayable", { type: "asset", nature: "debit" }) }, "BRANCH_FINANCIAL_ACCOUNT_ROLE_INVALID"],
  ];
  for (const [name, roles, accounts, errorCode] of cases) {
    await t.test(name, async () => {
      await withResolverModels({ roles, accounts }, async () => {
        await assert.rejects(
          resolveRequiredFinalSaleAccounts("company-a", "branch-a"),
          error => error.errorCode === errorCode
        );
      });
    });
  }
});

test("Complete-sale resolver rejects ambiguous and unsupported per-karat configuration before writes", async () => {
  const definition = FINAL_SALE_ROLE_DEFINITIONS.accountsReceivable;
  await withResolverModels({ roles: { [definition.roleCode]: [{ accountId: "one" }, { accountId: "two" }] } }, async () => {
    await assert.rejects(resolveRequiredFinalSaleAccounts("company-a", "branch-a"), error => error.errorCode === "BRANCH_FINANCIAL_MAPPING_AMBIGUOUS");
    await assert.rejects(resolveRequiredFinalSaleAccounts("company-a", "branch-a", null, { accountingByKarat: true }), error => error.errorCode === "FINAL_SALE_ACCOUNTING_BY_KARAT_NOT_CONFIGURED");
  });
});

test("explicit Complete-sale roles never invoke the transactional account auto-create path", async () => {
  const originalEnsure = postingService.ensureAccount;
  const originalPostEntry = postingService.postEntry;
  const originalByKarat = postingService.resolveAccountingByKarat;
  const calls = [];
  postingService.ensureAccount = async () => { throw new Error("ensureAccount must not be called"); };
  postingService.resolveAccountingByKarat = async () => false;
  postingService.postEntry = async (_companyId, _opts, lines) => { calls.push(lines); return { id: "journal" }; };
  try {
    const roles = Object.fromEntries(Object.keys(FINAL_SALE_ROLE_DEFINITIONS).map(key => [key, accountFor(key)]));
    await postingService.postInvoiceEntry({ id: "invoice", companyId: "company-a", branchId: "branch-a", total: 20, subtotal: 19, tax: 1, date: "2026-07-27", status: "due" }, [{ cost: 10, quantity: 1 }], "tester", { finalSaleAccounts: roles });
    assert.equal(calls.length, 1);
    assert.ok(calls[0].every(line => line.accountId));
  } finally {
    postingService.ensureAccount = originalEnsure;
    postingService.postEntry = originalPostEntry;
    postingService.resolveAccountingByKarat = originalByKarat;
  }
});
