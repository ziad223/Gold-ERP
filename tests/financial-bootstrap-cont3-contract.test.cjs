"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const catalog = require("../backend/src/services/financial-account-catalog.service");
const {
  validateFinancialAccountProposedState,
} = require("../backend/src/services/financial-account-integrity.service");

const companyId = "COMPANY_TEST";
const branchId = "BRANCH_TEST";

function accountFor(roleCode, overrides = {}) {
  const role = catalog.ACCOUNT_ROLE_CATALOG[roleCode];
  return {
    id: "ACCOUNT_TEST",
    companyId,
    branchId: null,
    type: role.type,
    nature: role.nature,
    statementClassification: role.statementClassification,
    isPosting: role.isPosting,
    isActive: true,
    parentId: null,
    ...overrides,
  };
}

function expectSemanticError(run, reasonCode) {
  assert.throws(run, (error) => {
    assert.equal(error.statusCode, 422);
    assert.equal(error.errorCode, "FINANCIAL_ACCOUNT_SEMANTIC_CHANGE_INCOMPATIBLE");
    assert.deepEqual(error.fieldErrors?.reasonCode, [reasonCode]);
    assert.equal(JSON.stringify(error.fieldErrors).includes("ACCOUNT_TEST"), false);
    return true;
  });
}

test("all 12 stable roles validate proposed type, nature, classification, posting, and active state", () => {
  const roles = Object.keys(catalog.ACCOUNT_ROLE_CATALOG);
  assert.equal(roles.length, 12);
  for (const roleCode of roles) {
    const currentAccount = accountFor(roleCode);
    const stableRoleBindings = [{ roleCode, branchId }];
    assert.doesNotThrow(() => validateFinancialAccountProposedState({
      companyId,
      currentAccount,
      proposedAccount: { ...currentAccount, name: "Safe label" },
      stableRoleBindings,
      activeMappings: [],
      childAccounts: [],
      journalReferenceCount: 0,
    }), roleCode);
    for (const [field, value] of [
      ["type", currentAccount.type === "asset" ? "liability" : "asset"],
      ["nature", currentAccount.nature === "debit" ? "credit" : "debit"],
      ["statementClassification", currentAccount.statementClassification === "asset" ? "liability" : "asset"],
      ["isPosting", false],
      ["isActive", false],
    ]) {
      expectSemanticError(() => validateFinancialAccountProposedState({
        companyId,
        currentAccount,
        proposedAccount: { ...currentAccount, [field]: value },
        stableRoleBindings,
        activeMappings: [],
        childAccounts: [],
        journalReferenceCount: 0,
      }), field === "isPosting" ? "ACCOUNT_NOT_POSTING" : field === "isActive" ? "ACCOUNT_INACTIVE" : "STABLE_ROLE_INCOMPATIBLE");
    }
  }
});

test("all 11 active mapping roles reject incompatible proposed state even with zero journals", () => {
  const mappings = Object.entries(catalog.BRANCH_MAPPING_CATALOG);
  assert.equal(mappings.length, 11);
  for (const [mappingType, mapping] of mappings) {
    const currentAccount = accountFor(mapping.accountRoleCode);
    const stableRoleBindings = [{ roleCode: mapping.accountRoleCode, branchId }];
    const activeMappings = [{ mappingType, branchId, isActive: true }];
    assert.doesNotThrow(() => validateFinancialAccountProposedState({
      companyId,
      currentAccount,
      proposedAccount: currentAccount,
      stableRoleBindings,
      activeMappings,
      childAccounts: [],
      journalReferenceCount: 0,
    }), mappingType);
    expectSemanticError(() => validateFinancialAccountProposedState({
      companyId,
      currentAccount,
      proposedAccount: { ...currentAccount, type: currentAccount.type === "asset" ? "liability" : "asset" },
      stableRoleBindings,
      activeMappings,
      childAccounts: [],
      journalReferenceCount: 0,
    }), "STABLE_ROLE_INCOMPATIBLE");
  }
});

test("one incompatible mapping rejects the whole update while safe display edits remain allowed", () => {
  const currentAccount = accountFor("BANK_ACCOUNT");
  const stableRoleBindings = [{ roleCode: "BANK_ACCOUNT", branchId }];
  const activeMappings = [
    { mappingType: "BANK_ACCOUNT", branchId, isActive: true },
    { mappingType: "CASH_TREASURY", branchId, isActive: true },
  ];
  expectSemanticError(() => validateFinancialAccountProposedState({
    companyId,
    currentAccount,
    proposedAccount: currentAccount,
    stableRoleBindings,
    activeMappings,
    childAccounts: [],
    journalReferenceCount: 1,
  }), "ACCOUNT_ROLE_INCOMPATIBLE");

  assert.doesNotThrow(() => validateFinancialAccountProposedState({
    companyId,
    currentAccount,
    proposedAccount: { ...currentAccount, name: "Updated display", nameAr: "تسمية", description: "Safe description" },
    stableRoleBindings,
    activeMappings: [{ mappingType: "BANK_ACCOUNT", branchId, isActive: true }],
    childAccounts: [],
    journalReferenceCount: 0,
  }));
});

test("Company and hierarchy invariants fail closed", () => {
  const currentAccount = accountFor("BANK_ACCOUNT");
  expectSemanticError(() => validateFinancialAccountProposedState({
    companyId,
    currentAccount,
    proposedAccount: { ...currentAccount, companyId: "FOREIGN_COMPANY" },
    stableRoleBindings: [],
    activeMappings: [],
    childAccounts: [],
    journalReferenceCount: 0,
  }), "ACCOUNT_COMPANY_INVALID");
  expectSemanticError(() => validateFinancialAccountProposedState({
    companyId,
    currentAccount,
    proposedAccount: { ...currentAccount, isPosting: true },
    stableRoleBindings: [],
    activeMappings: [],
    childAccounts: [{ id: "CHILD" }],
    journalReferenceCount: 0,
  }), "ACCOUNT_WITH_CHILDREN_POSTING");
});
