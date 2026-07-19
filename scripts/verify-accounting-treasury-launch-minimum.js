#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function assertLocalDatabaseEnv() {
  const databaseUrl = process.env.DATABASE_URL || "";
  if (databaseUrl && !/(localhost|127\.0\.0\.1).*(5433|darfus_erp)/.test(databaseUrl)) {
    throw new Error("Refusing non-local DATABASE_URL");
  }
  if (process.env.DB_HOST && !["localhost", "127.0.0.1"].includes(process.env.DB_HOST)) {
    throw new Error(`Refusing unexpected DB_HOST ${process.env.DB_HOST}`);
  }
  if (process.env.DB_PORT && String(process.env.DB_PORT) !== "5433") {
    throw new Error(`Refusing unexpected DB_PORT ${process.env.DB_PORT}`);
  }
  if (process.env.DB_NAME && process.env.DB_NAME !== "darfus_erp") {
    throw new Error(`Refusing unexpected DB_NAME ${process.env.DB_NAME}`);
  }
}

function assertContains(source, needle, label) {
  assert.ok(source.includes(needle), label);
}

function staticContract() {
  const migrationFiles = fs.readdirSync(path.join(ROOT, "backend", "migrations")).filter((name) => name.endsWith(".js"));
  const verifierFiles = fs.readdirSync(path.join(ROOT, "scripts")).filter((name) => /^verify-.*\.js$/.test(name));
  const modelsIndex = read("backend/src/models/index.js");
  const migration = read("backend/migrations/20260717010000-accounting-treasury-launch-minimum.js");
  const routes = read("backend/src/routes/erp.routes.js");
  const cashRegisterService = read("backend/src/services/cash-register.service.js");
  const posting = read("backend/src/services/posting.service.js");
  const journal = read("backend/src/services/journal.service.js");
  const treasuryHook = read("hooks/use-treasury.ts");
  const treasuryPage = read("app/[locale]/(dashboard)/accounting/treasury/page.tsx");
  const accountingPage = read("app/[locale]/(dashboard)/accounting/page.tsx");
  const vouchersPage = read("app/[locale]/(dashboard)/sales/gift-vouchers/page.tsx");
  const enMessages = read("messages/en.json");
  const arMessages = read("messages/ar.json");
  const permissions = read("lib/permissions/catalog.ts");
  const packageJson = JSON.parse(read("package.json"));

  assert.ok(migrationFiles.includes("20260717010000-accounting-treasury-launch-minimum.js"), "Phase 35D additive migration is present");
  assert.ok(verifierFiles.includes("verify-accounting-treasury-launch-minimum.js"), "Phase 35D verifier file is present");
  assert.equal(packageJson.scripts["verify:accounting-treasury-launch-minimum"], "node scripts/verify-accounting-treasury-launch-minimum.js", "package verifier script is registered");

  for (const text of ["accounting_locks", "cash_register_sessions", "cash_register_sessions_one_open_uq", "accounting.lock.manage", "treasury.register.open"]) {
    assertContains(migration, text, `migration includes ${text}`);
  }
  assertContains(modelsIndex, "AccountingLock", "AccountingLock model is exported");
  assertContains(modelsIndex, "CashRegisterSession", "CashRegisterSession model is exported");

  assertContains(routes, '"/accounting/lock"', "accounting date lock route exists");
  assertContains(routes, '"/reports/account-balances/reconciliation"', "account balance truth report route exists");
  assertContains(routes, '"/treasury/register/current"', "register current route exists");
  assertContains(routes, '"/treasury/register/open"', "register open route exists");
  assertContains(routes, '"/treasury/register/close"', "register close route exists");
  assertContains(cashRegisterService, "CASH_REGISTER_REQUIRED", "cash mutation without open register has stable error");
  assertContains(routes, 'source: "reportable_ledger_journal_lines"', "treasury summary declares reportable journal-line source");
  assertContains(routes, "ACCOUNT_BALANCE_DIRECT_MUTATION_FORBIDDEN", "direct account balance mutation is denied");
  assertContains(routes, "GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED", "gift voucher write workflow is disabled");
  assertContains(posting, "assertDateUnlocked", "posting engine enforces accounting date lock");
  assertContains(journal, "manual_journal_post", "manual journal post enforces accounting date lock");
  assertContains(journal, "manual_journal_reverse", "manual journal reverse enforces accounting date lock");

  for (const code of ["accounting.lock.manage", "accounting.reconciliation.view", "treasury.register.view", "treasury.register.open", "treasury.register.close"]) {
    assertContains(permissions, code, `permission catalog includes ${code}`);
  }
  assertContains(treasuryHook, "openRegister", "treasury hook exposes openRegister");
  assertContains(treasuryHook, "closeRegister", "treasury hook exposes closeRegister");
  assertContains(treasuryPage, "registerCurrent", "treasury page renders register state");
  assertContains(treasuryPage, 't("varianceReason")', "treasury close form asks for variance reason");
  assertContains(accountingPage, "getAccountBalanceReconciliation", "accounting page loads balance truth");
  assertContains(accountingPage, "setAccountingLock", "accounting page can save date lock");
  assertContains(vouchersPage, "financialWorkflowDisabled", "gift voucher UI surfaces disabled state");

  for (const text of [
    "Accounting date lock",
    "Balance truth",
    "Cash register",
    "Variance reason",
    "Gift voucher issue and redeem are disabled",
    "قفل التاريخ المحاسبي",
    "حقيقة الأرصدة",
    "جلسة الخزنة",
    "سبب الفرق",
    "تم تعطيل إصدار واستخدام قسائم الهدايا"
  ]) {
    assert.ok(enMessages.includes(text) || arMessages.includes(text), `localized text exists: ${text}`);
  }
}

async function databaseContract() {
  assertLocalDatabaseEnv();
  process.env.NODE_ENV = "test";
  process.env.DB_HOST = process.env.DB_HOST || "localhost";
  process.env.DB_PORT = process.env.DB_PORT || "5433";
  process.env.DB_NAME = process.env.DB_NAME || "darfus_erp";
  process.env.DB_USER = process.env.DB_USER || "postgres";
  process.env.DB_PASS = process.env.DB_PASS || "postgres";

  const models = require(path.join(BACKEND, "src/models"));
  const { QueryTypes } = require(path.join(BACKEND, "node_modules/sequelize"));
  const accountingLockService = require(path.join(BACKEND, "src/services/accounting-lock.service"));
  const accountBalanceService = require(path.join(BACKEND, "src/services/account-balance.service"));
  const cashRegisterService = require(path.join(BACKEND, "src/services/cash-register.service"));
  models.sequelize.options.logging = false;

  const [[migrationCount], [permissionCount], schemaRows, permissionRows] = await Promise.all([
    models.sequelize.query('select count(*)::int as count from "SequelizeMeta"', { type: QueryTypes.SELECT }),
    models.sequelize.query("select count(*)::int as count from permissions", { type: QueryTypes.SELECT }),
    models.sequelize.query("select to_regclass('public.accounting_locks') as accounting_locks, to_regclass('public.cash_register_sessions') as cash_register_sessions", { type: QueryTypes.SELECT }),
    models.sequelize.query("select name from permissions where name in ('treasury.register.view','treasury.register.open','treasury.register.close','accounting.lock.manage','accounting.reconciliation.view') order by name", { type: QueryTypes.SELECT }),
  ]);
  assert.equal(migrationCount.count, 44, "migration count is 44 after Phase 35D");
  assert.equal(permissionCount.count, 128, "permission count is 128 after Phase 35D");
  assert.equal(schemaRows[0].accounting_locks, "accounting_locks", "accounting_locks table exists");
  assert.equal(schemaRows[0].cash_register_sessions, "cash_register_sessions", "cash_register_sessions table exists");
  assert.deepEqual(permissionRows.map((row) => row.name), [
    "accounting.lock.manage",
    "accounting.reconciliation.view",
    "treasury.register.close",
    "treasury.register.open",
    "treasury.register.view",
  ], "Phase 35D permissions exist");

  const ns = `P35D-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const rollback = new Error("ROLLBACK_PHASE35D_VERIFIER");
  try {
    await models.sequelize.transaction(async (transaction) => {
      await models.Company.create({
        id: `CMP-${ns}`,
        businessName: "Phase 35D Verifier",
        workspace: `phase35d-${ns}`,
        currency: "AED",
        branchName: "Phase 35D Branch"
      }, { transaction });
      await models.Branch.create({
        id: `BR-${ns}`,
        companyId: `CMP-${ns}`,
        name: "Phase 35D Branch",
        code: `B35D-${ns.slice(-4)}`,
        type: "store",
        isActive: true
      }, { transaction });
      await models.Account.create({
        id: `ACC-${ns}-1110`,
        companyId: `CMP-${ns}`,
        code: "1110",
        name: "Cash on Hand",
        nameAr: "نقدية",
        type: "asset",
        nature: "debit",
        balance: 999,
        isActive: true,
        level: 3
      }, { transaction });
      await models.Account.create({
        id: `ACC-${ns}-4900`,
        companyId: `CMP-${ns}`,
        code: "4900",
        name: "Other Income",
        nameAr: "إيرادات أخرى",
        type: "revenue",
        nature: "credit",
        balance: 0,
        isActive: true,
        level: 2
      }, { transaction });
      await models.JournalEntry.create({
        id: `JE-${ns}`,
        companyId: `CMP-${ns}`,
        branchId: `BR-${ns}`,
        description: "Phase 35D posted cash",
        date: "2026-07-17",
        status: "posted",
        amount: 50,
        totalDebit: 50,
        totalCredit: 50,
        sourceType: "phase35d_verifier",
        sourceId: ns,
        postedBy: "Verifier",
        postedAt: new Date().toISOString()
      }, { transaction });
      await models.JournalLine.bulkCreate([
        {
          id: `JL-${ns}-1`,
          journalEntryId: `JE-${ns}`,
          accountId: `ACC-${ns}-1110`,
          accountCode: "1110",
          accountName: "Cash on Hand",
          debit: 50,
          credit: 0,
          description: "Cash"
        },
        {
          id: `JL-${ns}-2`,
          journalEntryId: `JE-${ns}`,
          accountId: `ACC-${ns}-4900`,
          accountCode: "4900",
          accountName: "Other Income",
          debit: 0,
          credit: 50,
          description: "Income"
        }
      ], { transaction });

      const balance = await accountBalanceService.calculateAccountBalance({
        companyId: `CMP-${ns}`,
        branchId: `BR-${ns}`,
        accountCode: "1110",
        transaction
      });
      assert.equal(balance.calculatedBalance, 50, "cash balance is calculated from posted journal lines");
      assert.equal(balance.storedBalance, 999, "stored balance mirror remains visible");
      assert.equal(balance.difference, 949, "reconciliation exposes divergence");

      await accountingLockService.setLock({
        companyId: `CMP-${ns}`,
        lockedThroughDate: "2026-07-17",
        reason: "Verifier lock",
        user: { id: `USR-${ns}`, firstName: "Phase", lastName: "Verifier" },
        transaction
      });
      await assert.rejects(
        () => accountingLockService.assertDateUnlocked(`CMP-${ns}`, "2026-07-17", { transaction }),
        (error) => error.errorCode === "ACCOUNTING_PERIOD_LOCKED"
      );
      await accountingLockService.assertDateUnlocked(`CMP-${ns}`, "2026-07-18", { transaction });

      await assert.rejects(
        () => cashRegisterService.requireOpenForCashMutation({
          companyId: `CMP-${ns}`,
          branchId: `BR-${ns}`,
          account: "cash",
          transaction
        }),
        (error) => error.errorCode === "CASH_REGISTER_REQUIRED"
      );
      const register = await cashRegisterService.openRegister({
        companyId: `CMP-${ns}`,
        branchId: `BR-${ns}`,
        openingCountedAmount: 100,
        actor: { userId: `USR-${ns}`, employeeId: null, name: "Phase Verifier" },
        transaction
      });
      await cashRegisterService.requireOpenForCashMutation({
        companyId: `CMP-${ns}`,
        branchId: `BR-${ns}`,
        account: "cash",
        transaction
      });
      const expected = await cashRegisterService.calculateExpected(register, { transaction });
      assert.equal(expected, 100, "open register expected balance starts from counted opening amount");
      await assert.rejects(
        () => cashRegisterService.closeRegister({
          companyId: `CMP-${ns}`,
          branchId: `BR-${ns}`,
          countedAmount: 90,
          actor: { userId: `USR-${ns}`, name: "Phase Verifier" },
          transaction
        }),
        /Variance reason is required/
      );
      const closed = await cashRegisterService.closeRegister({
        companyId: `CMP-${ns}`,
        branchId: `BR-${ns}`,
        countedAmount: 90,
        varianceReason: "Verifier variance",
        actor: { userId: `USR-${ns}`, name: "Phase Verifier" },
        transaction
      });
      assert.equal(closed.status, "CLOSED", "register closes with variance reason");
      assert.equal(Number(closed.variance), -10, "server calculates variance");

      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }

  const [fixtureRows] = await models.sequelize.query(`
    SELECT
      (SELECT COUNT(*)::int FROM companies WHERE id LIKE 'CMP-${ns}%') AS companies,
      (SELECT COUNT(*)::int FROM branches WHERE id LIKE 'BR-${ns}%') AS branches,
      (SELECT COUNT(*)::int FROM cash_register_sessions WHERE id LIKE 'CRS-%') AS register_rows_for_information
  `, { type: QueryTypes.SELECT });
  assert.equal(fixtureRows.companies, 0, "verifier company fixture rolled back");
  assert.equal(fixtureRows.branches, 0, "verifier branch fixture rolled back");

  await models.sequelize.close();
}

(async () => {
  staticContract();
  await databaseContract();
  console.log("ACCOUNTING TREASURY LAUNCH MINIMUM PASSED");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
