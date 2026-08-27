"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const resolverPath = path.join(root, "backend", "src", "services", "financial-account-resolver.service.js");
const postingPath = path.join(root, "backend", "src", "services", "posting.service.js");
const treasuryPath = path.join(root, "backend", "src", "routes", "erp.routes.js");
const registerPath = path.join(root, "backend", "src", "services", "cash-register.service.js");
const balancePath = path.join(root, "backend", "src", "services", "account-balance.service.js");

const resolverSource = fs.readFileSync(resolverPath, "utf8");
const postingSource = fs.readFileSync(postingPath, "utf8");
const treasurySource = fs.readFileSync(treasuryPath, "utf8");
const registerSource = fs.readFileSync(registerPath, "utf8");
const balanceSource = fs.readFileSync(balancePath, "utf8");
const resolver = require(resolverPath);

function section(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section start: ${start}`);
  assert.notEqual(to, -1, `missing section end: ${end}`);
  return source.slice(from, to);
}

test("central resolver exposes explicit required Branch-mapping resolution", () => {
  assert.equal(typeof resolver.resolveRequiredBranchFinancialAccount, "function");
  assert.match(resolverSource, /mappingRole/);
  assert.match(resolverSource, /FINANCIAL_CONTEXT_REQUIRED/);
  assert.match(resolverSource, /FINANCIAL_BRANCH_REQUIRED/);
  assert.match(resolverSource, /FINANCIAL_MAPPING_REQUIRED/);
  assert.match(resolverSource, /assertMappingAccountCompatibility/);
});

test("treasury route has no fixed cash or bank authority", () => {
  const treasury = section(
    treasurySource,
    'router.post("/treasury/transactions"',
    "// Treasury closing"
  );
  assert.doesNotMatch(treasury, /TREASURY_GL/);
  assert.doesNotMatch(treasury, /assertTreasuryAccountKey/);
  assert.doesNotMatch(treasury, /["']1110["']/);
  assert.doesNotMatch(treasury, /["']1120["']/);
  assert.match(treasury, /CASH_TREASURY/);
  assert.match(treasury, /BANK_ACCOUNT/);
  assert.match(treasury, /resolveRequiredBranchFinancialAccount/);
});

test("cash posting lines use explicit mapping roles and never fixed codes", () => {
  const cash = section(
    postingSource,
    "async postCashEntry",
    "async postDepositEntry"
  );
  assert.doesNotMatch(cash, /["']1110["']/);
  assert.doesNotMatch(cash, /["']1120["']/);
  assert.doesNotMatch(cash, /\|\|\s*["'](?:1110|1120)["']/);
  assert.match(cash, /mappingRole/);
  assert.match(cash, /treasuryMappingRole/);
});

test("cash register stores and queries the mapped cash account", () => {
  assert.doesNotMatch(registerSource, /const CASH_ACCOUNT_CODE = ["']1110["']/);
  assert.doesNotMatch(registerSource, /\|\|\s*CASH_ACCOUNT_CODE/);
  assert.match(registerSource, /resolveRequiredBranchFinancialAccount/);
  assert.match(registerSource, /CASH_TREASURY/);
});

test("treasury summary resolves mapped cash and bank accounts", () => {
  assert.doesNotMatch(balanceSource, /TREASURY_ACCOUNT_CODES\s*=\s*Object\.freeze\(\{\s*cash:\s*["']1110["']/);
  assert.match(balanceSource, /resolveRequiredBranchFinancialAccount/);
  assert.match(balanceSource, /CASH_TREASURY/);
  assert.match(balanceSource, /BANK_ACCOUNT/);
  assert.match(balanceSource, /accountId/);
});

test("deposit posting selects mapped cash or bank and mapped liability", () => {
  const deposit = section(
    postingSource,
    "async postDepositEntry",
    "async postReservationPaymentEntry"
  );
  assert.doesNotMatch(deposit, /["']1110["']/);
  assert.doesNotMatch(deposit, /["']1120["']/);
  assert.match(deposit, /treasuryMappingRole/);
  assert.match(deposit, /RESERVATION_ADVANCE_LIABILITY/);
});

test("purchase posting selects mapped treasury and supplier-payable accounts", () => {
  const purchase = section(
    postingSource,
    "async postPurchaseEntry",
    "async postInstallmentPayment"
  );
  assert.doesNotMatch(purchase, /["']1110["']/);
  assert.doesNotMatch(purchase, /["']1120["']/);
  assert.match(purchase, /treasuryMappingRole/);
  assert.match(purchase, /SUPPLIER_PAYABLE/);
});

test("central resolver passes current transaction into mapping lookup and compatibility", async () => {
  const transaction = { LOCK: { UPDATE: "UPDATE" } };
  const calls = [];
  const account = { id: "ACCOUNT_MAPPED", isPosting: true, isActive: true };
  const modelSet = {
    BranchFinancialMapping: {
      findAll: async (options) => {
        calls.push(["mapping", options]);
        return [{ accountId: account.id }];
      },
    },
  };
  const compatibility = async (options) => {
    calls.push(["compatibility", options]);
    return account;
  };

  const resolved = await resolver.resolveRequiredBranchFinancialAccount({
    companyId: "COMPANY_TEST",
    branchId: "BRANCH_TEST_A",
    mappingRole: "CASH_TREASURY",
    transaction,
    modelSet,
    compatibility,
  });

  assert.equal(resolved, account);
  assert.equal(calls[0][1].where.companyId, "COMPANY_TEST");
  assert.equal(calls[0][1].where.branchId, "BRANCH_TEST_A");
  assert.equal(calls[0][1].where.mappingType, "CASH_TREASURY");
  assert.equal(calls[0][1].transaction, transaction);
  assert.equal(calls[1][1].transaction, transaction);
});

test("cash and bank mappings remain distinct with no fallback", async () => {
  const seen = [];
  const modelSet = {
    BranchFinancialMapping: {
      findAll: async ({ where }) => {
        seen.push(where.mappingType);
        return [{ accountId: `ACCOUNT_${where.mappingType}` }];
      },
    },
  };
  const compatibility = async ({ mappingType, accountId }) => ({
    id: accountId,
    mappingType,
    isPosting: true,
    isActive: true,
  });
  const common = {
    companyId: "COMPANY_TEST",
    branchId: "BRANCH_TEST_A",
    modelSet,
    compatibility,
  };

  const cash = await resolver.resolveRequiredBranchFinancialAccount({
    ...common,
    mappingRole: "CASH_TREASURY",
  });
  const bank = await resolver.resolveRequiredBranchFinancialAccount({
    ...common,
    mappingRole: "BANK_ACCOUNT",
  });

  assert.deepEqual(seen, ["CASH_TREASURY", "BANK_ACCOUNT"]);
  assert.equal(cash.mappingType, "CASH_TREASURY");
  assert.equal(bank.mappingType, "BANK_ACCOUNT");
  assert.notEqual(cash.id, bank.id);
});

test("missing Company, Branch, or mapping fails closed canonically", async () => {
  const fn = resolver.resolveRequiredBranchFinancialAccount;
  await assert.rejects(
    () => fn({ branchId: "BRANCH_TEST_A", mappingRole: "CASH_TREASURY" }),
    { errorCode: "FINANCIAL_CONTEXT_REQUIRED", statusCode: 422 }
  );
  await assert.rejects(
    () => fn({ companyId: "COMPANY_TEST", mappingRole: "CASH_TREASURY" }),
    { errorCode: "FINANCIAL_BRANCH_REQUIRED", statusCode: 422 }
  );
  await assert.rejects(
    () => fn({
      companyId: "COMPANY_TEST",
      branchId: "BRANCH_TEST_A",
      mappingRole: "CASH_TREASURY",
      modelSet: { BranchFinancialMapping: { findAll: async () => [] } },
    }),
    { errorCode: "FINANCIAL_MAPPING_REQUIRED", statusCode: 422 }
  );
});

test("ambiguous mapping fails closed without choosing the first account", async () => {
  await assert.rejects(
    () => resolver.resolveRequiredBranchFinancialAccount({
      companyId: "COMPANY_TEST",
      branchId: "BRANCH_TEST_A",
      mappingRole: "BANK_ACCOUNT",
      modelSet: {
        BranchFinancialMapping: {
          findAll: async () => [{ accountId: "A" }, { accountId: "B" }],
        },
      },
    }),
    { errorCode: "FINANCIAL_MAPPING_REQUIRED", statusCode: 422 }
  );
});

test("invalid or foreign mapped accounts are delegated to semantic compatibility", async () => {
  const invalid = Object.assign(new Error("invalid"), {
    errorCode: "FINANCIAL_MAPPING_ACCOUNT_INCOMPATIBLE",
    statusCode: 422,
  });
  await assert.rejects(
    () => resolver.resolveRequiredBranchFinancialAccount({
      companyId: "COMPANY_TEST",
      branchId: "BRANCH_TEST_A",
      mappingRole: "BANK_ACCOUNT",
      modelSet: {
        BranchFinancialMapping: {
          findAll: async () => [{ accountId: "ACCOUNT_INVALID" }],
        },
      },
      compatibility: async () => { throw invalid; },
    }),
    { errorCode: "FINANCIAL_MAPPING_ACCOUNT_INCOMPATIBLE", statusCode: 422 }
  );
});

test("posting resolves accounts before creating a journal entry", () => {
  const postEntry = section(postingSource, "async postEntry", "async postInvoiceEntry");
  const resolveAt = postEntry.indexOf("resolvePostingAccount");
  const createAt = postEntry.indexOf("JournalEntry.create");
  assert.notEqual(resolveAt, -1);
  assert.notEqual(createAt, -1);
  assert.ok(resolveAt < createAt, "all accounts must resolve before JournalEntry persistence");
});

test("treasury transaction resolves accounts before business persistence", () => {
  const treasury = section(
    treasurySource,
    'router.post("/treasury/transactions"',
    "// Treasury closing"
  );
  const resolveAt = treasury.indexOf("resolveRequiredBranchFinancialAccount");
  const createAt = treasury.indexOf("CashTransaction.create");
  assert.notEqual(resolveAt, -1);
  assert.notEqual(createAt, -1);
  assert.ok(resolveAt < createAt, "treasury mapping resolution must precede business persistence");
  assert.match(treasury, /idempotencyService\.claim/);
  assert.match(treasury, /postingService\.postCashEntry/);
});

test("posting keeps balanced-entry and source-idempotency contracts", () => {
  assert.match(postingSource, /Unbalanced journal entry/);
  assert.match(postingSource, /sourceType/);
  assert.match(postingSource, /sourceId/);
  assert.doesNotMatch(postingSource, /Account\.create/);
  assert.match(treasurySource, /idempotencyService\.claim/);
  assert.match(treasurySource, /idempotencyService\.succeed/);
});
