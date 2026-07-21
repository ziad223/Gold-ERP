#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { assertAdoptedLocalDatabase } = require("./lib/verify-local-database-guard");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function routeBlock(source, route) {
  const start = source.indexOf(`router.get(\n  "${route}"`);
  assert.ok(start >= 0, `${route} route exists`);
  const next = source.indexOf('setupCrud("journal-entries"', start + 1);
  return source.slice(start, next >= 0 ? next : source.length);
}

function assertLocalDatabaseEnv() {
  return assertAdoptedLocalDatabase({ riskClass: "V3_WRITE_CLEANUP" });
}

function staticContract() {
  const ledgerReporting = read("backend/src/services/ledger-reporting.service.js");
  const balances = read("backend/src/services/account-balance.service.js");
  const routes = read("backend/src/routes/erp.routes.js");
  const journal = read("backend/src/services/journal.service.js");
  const page = read("app/[locale]/(dashboard)/accounting/page.tsx");
  const hook = read("hooks/use-accounting-dashboard-summary.ts");
  const packageJson = JSON.parse(read("package.json"));
  const dashboardRoute = routeBlock(routes, "/accounting/dashboard-summary");

  assert.ok(ledgerReporting.includes('Object.freeze(["posted", "reversed"])'), "central reportable-ledger statuses include posted and reversed");
  assert.ok(ledgerReporting.includes("buildReportableLedgerPredicate"), "central reportable-ledger predicate exists");
  assert.ok(ledgerReporting.includes("assertReportableLedgerIntegrity"), "reversal linkage integrity assertion exists");
  assert.ok(balances.includes('require("./ledger-reporting.service")'), "account-balance engine uses the central reporting helper");
  assert.ok(!balances.includes("je.status = 'posted'"), "account-balance reporting contains no posted-only journal filter");
  assert.ok(balances.includes("COALESCE(je.reversal_of, je.id)"), "cash activity groups original/reversal pairs");
  assert.ok(balances.includes("net_external_cash_activity"), "cash activity semantics are explicit");
  assert.ok(dashboardRoute.includes("calculateTreasuryLedgerSummary"), "dashboard route uses the ledger summary service");
  assert.ok(routes.includes('source: "reportable_ledger_journal_lines"'), "treasury/dashboard declare the reportable-ledger source");
  assert.ok(!dashboardRoute.includes("models.Account"), "dashboard route does not query Account.balance as financial truth");
  assert.ok(journal.includes('status: "posted"') && journal.includes('status: "reversed"') && journal.includes('reversalOf: id'), "manual reversal workflow remains explicit and unchanged");
  for (const literal of ["486250", "1240800", "328900", "176450", "financialIndicators"]) {
    assert.ok(!page.includes(literal), `accounting page contains no hardcoded ${literal}`);
  }
  assert.ok(hook.includes("reportable_ledger_journal_lines"), "frontend contract names the reportable-ledger source");
  assert.equal(packageJson.scripts["verify:accounting-dashboard-source-of-truth"], "node scripts/verify-accounting-dashboard-source-of-truth.js", "focused verifier script is registered");
}

function line(id, journalEntryId, account, debit, credit) {
  return {
    id,
    journalEntryId,
    accountId: account.id,
    accountCode: account.code,
    accountName: account.name,
    debit,
    credit,
    description: "ACC1-FIX1 verifier",
  };
}

async function databaseContract() {
  const target = assertLocalDatabaseEnv();
  require(path.join(BACKEND, "node_modules", "dotenv")).config({ path: path.join(BACKEND, ".env") });
  process.env.DB_HOST = target.host;
  process.env.DB_PORT = target.port;
  process.env.DB_NAME = target.database;
  process.env.DB_USER = process.env.DB_USER || "postgres";
  process.env.DB_PASS = process.env.DB_PASS || "postgres";

  const models = require(path.join(BACKEND, "src/models"));
  const accountBalanceService = require(path.join(BACKEND, "src/services/account-balance.service"));
  const ledgerReporting = require(path.join(BACKEND, "src/services/ledger-reporting.service"));
  const { Op } = require(path.join(BACKEND, "node_modules/sequelize"));
  models.sequelize.options.logging = false;

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const companyId = `CMP-ACC1-FIX1-${stamp}`;
  const otherCompanyId = `CMP-ACC1-FIX1-OTHER-${stamp}`;
  const branchId = `BR-ACC1-FIX1-A-${stamp}`;
  const otherBranchId = `BR-ACC1-FIX1-B-${stamp}`;
  const rollback = new Error("ROLLBACK_ACC1_FIX1");

  async function createEntry(transaction, { id, company, branch, status, sourceType = "manual", sourceId = null, reversalOf = null, lines }) {
    const totalDebit = lines.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = lines.reduce((sum, item) => sum + item.credit, 0);
    await models.JournalEntry.create({
      id,
      companyId: company,
      branchId: branch,
      description: `ACC1-FIX1 ${id}`,
      date: "2026-07-19",
      status,
      amount: totalDebit,
      totalDebit,
      totalCredit,
      sourceType,
      sourceId,
      reversalOf,
      postedBy: ["posted", "reversed"].includes(status) ? "ACC1 verifier" : null,
      postedAt: ["posted", "reversed"].includes(status) ? new Date().toISOString() : null,
    }, { transaction });
    await models.JournalLine.bulkCreate(lines.map((item, index) => line(`${id}-L${index + 1}`, id, item.account, item.debit, item.credit)), { transaction });
  }

  try {
    await models.sequelize.transaction(async (transaction) => {
      await models.Company.bulkCreate([
        { id: companyId, businessName: "ACC1 FIX1", workspace: `acc1-fix1-${stamp}`, currency: "AED", branchName: "A" },
        { id: otherCompanyId, businessName: "ACC1 FIX1 Other", workspace: `acc1-fix1-other-${stamp}`, currency: "AED", branchName: "Other" },
      ], { transaction });
      await models.Branch.bulkCreate([
        { id: branchId, companyId, name: "ACC1 A", code: `A-${stamp.slice(-5)}`, type: "store", isActive: true },
        { id: otherBranchId, companyId, name: "ACC1 B", code: `B-${stamp.slice(-5)}`, type: "store", isActive: true },
      ], { transaction });

      const cash = await models.Account.create({ id: `ACC-${stamp}-CASH`, companyId, code: "1110", name: "Cash", nameAr: "Cash", type: "asset", nature: "debit", balance: 98765, isActive: true, level: 3 }, { transaction });
      const bank = await models.Account.create({ id: `ACC-${stamp}-BANK`, companyId, code: "1120", name: "Bank", nameAr: "Bank", type: "asset", nature: "debit", balance: 0, isActive: true, level: 3 }, { transaction });
      const counter = await models.Account.create({ id: `ACC-${stamp}-COUNTER`, companyId, code: `4999-${stamp}`, name: "Counter", nameAr: "Counter", type: "revenue", nature: "credit", balance: 0, isActive: true, level: 3 }, { transaction });
      const otherCash = await models.Account.create({ id: `ACC-${stamp}-OTHER-CASH`, companyId: otherCompanyId, code: "1110", name: "Other Cash", nameAr: "Other Cash", type: "asset", nature: "debit", balance: 0, isActive: true, level: 3 }, { transaction });

      await createEntry(transaction, { id: `JE-${stamp}-RECEIPT`, company: companyId, branch: branchId, status: "posted", lines: [{ account: cash, debit: 100, credit: 0 }, { account: counter, debit: 0, credit: 100 }] });
      await createEntry(transaction, { id: `JE-${stamp}-PAYMENT`, company: companyId, branch: branchId, status: "posted", lines: [{ account: cash, debit: 0, credit: 20 }, { account: counter, debit: 20, credit: 0 }] });
      await createEntry(transaction, { id: `JE-${stamp}-DRAFT`, company: companyId, branch: branchId, status: "draft", lines: [{ account: cash, debit: 50, credit: 0 }, { account: counter, debit: 0, credit: 50 }] });

      const originalId = `JE-${stamp}-ORIGINAL`;
      await createEntry(transaction, { id: originalId, company: companyId, branch: branchId, status: "reversed", sourceType: "manual", lines: [{ account: cash, debit: 0, credit: 5000 }, { account: counter, debit: 5000, credit: 0 }] });
      await createEntry(transaction, { id: `JE-${stamp}-REVERSAL`, company: companyId, branch: branchId, status: "posted", sourceType: "manual_reversal", sourceId: originalId, reversalOf: originalId, lines: [{ account: cash, debit: 5000, credit: 0 }, { account: counter, debit: 0, credit: 5000 }] });

      await createEntry(transaction, { id: `JE-${stamp}-TRANSFER`, company: companyId, branch: branchId, status: "posted", lines: [{ account: cash, debit: 0, credit: 75 }, { account: bank, debit: 75, credit: 0 }] });
      await createEntry(transaction, { id: `JE-${stamp}-OTHER-BRANCH`, company: companyId, branch: otherBranchId, status: "posted", lines: [{ account: cash, debit: 33, credit: 0 }, { account: counter, debit: 0, credit: 33 }] });
      await createEntry(transaction, { id: `JE-${stamp}-OTHER-COMPANY`, company: otherCompanyId, branch: null, status: "posted", lines: [{ account: otherCash, debit: 900, credit: 0 }, { account: otherCash, debit: 0, credit: 900 }] });

      const cashBalance = await accountBalanceService.calculateAccountBalance({ companyId, branchId, accountCode: "1110", transaction });
      const bankBalance = await accountBalanceService.calculateAccountBalance({ companyId, branchId, accountCode: "1120", transaction });
      const treasury = await accountBalanceService.calculateTreasuryLedgerSummary({ companyId, branchId, transaction });
      assert.equal(cashBalance.calculatedBalance, 5, "posted cash, payment, reversed original, reversal, and transfer net correctly");
      assert.equal(bankBalance.calculatedBalance, 75, "internal transfer changes the bank balance");
      assert.equal(treasury.cash, 5, "treasury cash reuses the corrected account-balance engine");
      assert.equal(treasury.bank, 75, "treasury bank reuses the corrected account-balance engine");
      assert.equal(treasury.receipts, 100, "net receipts exclude the reversed original/reversal pair");
      assert.equal(treasury.payments, 20, "net payments exclude drafts and preserve real payments");
      assert.equal(treasury.activitySemantics, "net_external_cash_activity", "activity semantics are explicit");
      assert.equal(cashBalance.storedBalance, 98765, "Account.balance is visible only as a reconciliation mirror");

      const companyWideCash = await accountBalanceService.calculateAccountBalance({ companyId, accountCode: "1110", transaction });
      assert.equal(companyWideCash.calculatedBalance, 38, "branch-scoped reporting excludes other branches while company reporting includes them");
      const movement = await accountBalanceService.calculateMovementSince({ companyId, branchId, accountCode: "1110", since: new Date(Date.now() - 60_000).toISOString(), transaction });
      assert.equal(movement, 5, "cash-register movement uses the reportable-ledger predicate");

      const orphanId = `JE-${stamp}-ORPHAN`;
      await createEntry(transaction, { id: orphanId, company: companyId, branch: branchId, status: "reversed", sourceType: "manual", lines: [{ account: cash, debit: 1, credit: 0 }, { account: counter, debit: 0, credit: 1 }] });
      const issues = await ledgerReporting.findReportableLedgerIntegrityIssues({ companyId, branchId, transaction });
      assert.ok(issues.some((issue) => issue.originalId === orphanId), "orphan reversed journal is detected rather than guessed");
      await assert.rejects(
        () => accountBalanceService.calculateBalances({ companyId, branchId, transaction }),
        (error) => error?.errorCode === "LEDGER_REVERSAL_INTEGRITY_FAILED",
        "reporting refuses an orphan reversal",
      );
      await models.JournalLine.destroy({ where: { journalEntryId: orphanId }, transaction });
      await models.JournalEntry.destroy({ where: { id: orphanId }, transaction });

      const finalIssues = await ledgerReporting.findReportableLedgerIntegrityIssues({ companyId, transaction });
      assert.equal(finalIssues.length, 0, "valid reversal pair has one posted same-company same-branch reversal");
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    const [companyRows, entryRows, accountRows] = await Promise.all([
      models.Company.count({ where: { id: [companyId, otherCompanyId] } }),
      models.JournalEntry.count({ where: { id: { [Op.like]: `%${stamp}%` } } }),
      models.Account.count({ where: { id: { [Op.like]: `%${stamp}%` } } }),
    ]);
    assert.equal(companyRows, 0, "ACC1-FIX1 companies rolled back");
    assert.equal(entryRows, 0, "ACC1-FIX1 journals rolled back");
    assert.equal(accountRows, 0, "ACC1-FIX1 accounts rolled back");
  }
}

async function apiContract() {
  const target = assertLocalDatabaseEnv();
  process.env.DB_HOST = target.host;
  process.env.DB_PORT = target.port;
  process.env.DB_NAME = target.database;
  process.env.DB_USER = process.env.DB_USER || "postgres";
  process.env.DB_PASS = process.env.DB_PASS || "postgres";

  const models = require(path.join(BACKEND, "src/models"));
  const app = require(path.join(BACKEND, "src/app"));
  const { JWT_SECRET } = require(path.join(BACKEND, "src/config/security"));
  const jwt = require(path.join(BACKEND, "node_modules/jsonwebtoken"));
  const bcrypt = require(path.join(BACKEND, "node_modules/bcryptjs"));
  const crypto = require("node:crypto");
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const companyId = `CMP-ACC1-API-${stamp}`;
  const branchId = `BR-ACC1-API-${stamp}`;
  const userId = `USR-ACC1-API-${stamp}`;
  const sessionId = `TAS-ACC1-API-${stamp}`;
  const accountIds = {
    cash: `ACC-ACC1-API-CASH-${stamp}`,
    counter: `ACC-ACC1-API-COUNTER-${stamp}`,
  };
  const entryIds = [];
  let server;

  async function createEntry({ id, status, sourceType = "manual", sourceId = null, reversalOf = null, lines }) {
    entryIds.push(id);
    const totalDebit = lines.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = lines.reduce((sum, item) => sum + item.credit, 0);
    await models.JournalEntry.create({
      id,
      companyId,
      branchId,
      description: `ACC1 API ${id}`,
      date: "2026-07-19",
      status,
      amount: totalDebit,
      totalDebit,
      totalCredit,
      sourceType,
      sourceId,
      reversalOf,
      postedBy: ["posted", "reversed"].includes(status) ? "ACC1 API verifier" : null,
      postedAt: ["posted", "reversed"].includes(status) ? new Date().toISOString() : null,
    });
    await models.JournalLine.bulkCreate(lines.map((item, index) => ({
      id: `${id}-L${index + 1}`,
      journalEntryId: id,
      accountId: item.accountId,
      accountCode: item.accountCode,
      accountName: item.accountName,
      debit: item.debit,
      credit: item.credit,
      description: "ACC1 API verifier",
    })));
  }

  try {
    await models.Company.create({ id: companyId, businessName: "ACC1 API", workspace: `acc1-api-${stamp}`, currency: "AED", branchName: "ACC1 API" });
    await models.Branch.create({ id: branchId, companyId, name: "ACC1 API", code: `API-${stamp.slice(-5)}`, type: "store", isActive: true });
    await models.User.create({
      id: userId,
      companyId,
      firstName: "ACC1",
      lastName: "Verifier",
      email: `acc1-api-${stamp}@example.test`,
      password: await bcrypt.hash(crypto.randomBytes(24).toString("base64url"), 10),
      role: "admin",
      accountType: "super_admin",
      isActive: true,
      passwordVersion: 1,
      sessionVersion: 1,
    });
    await models.Account.bulkCreate([
      { id: accountIds.cash, companyId, code: "1110", name: "Cash", nameAr: "Cash", type: "asset", nature: "debit", balance: 123456, isActive: true, level: 3 },
      { id: accountIds.counter, companyId, code: `4998-${stamp}`, name: "Counter", nameAr: "Counter", type: "revenue", nature: "credit", balance: 0, isActive: true, level: 3 },
    ]);
    const cash = { accountId: accountIds.cash, accountCode: "1110", accountName: "Cash" };
    const counter = { accountId: accountIds.counter, accountCode: `4998-${stamp}`, accountName: "Counter" };
    await createEntry({ id: `JE-ACC1-API-RECEIPT-${stamp}`, status: "posted", lines: [{ ...cash, debit: 100, credit: 0 }, { ...counter, debit: 0, credit: 100 }] });
    const originalId = `JE-ACC1-API-ORIGINAL-${stamp}`;
    await createEntry({ id: originalId, status: "reversed", lines: [{ ...cash, debit: 0, credit: 5000 }, { ...counter, debit: 5000, credit: 0 }] });
    await createEntry({ id: `JE-ACC1-API-REVERSAL-${stamp}`, status: "posted", sourceType: "manual_reversal", sourceId: originalId, reversalOf: originalId, lines: [{ ...cash, debit: 5000, credit: 0 }, { ...counter, debit: 0, credit: 5000 }] });
    await createEntry({ id: `JE-ACC1-API-DRAFT-${stamp}`, status: "draft", lines: [{ ...cash, debit: 777, credit: 0 }, { ...counter, debit: 0, credit: 777 }] });

    await models.TechnicalAccountSession.create({
      id: sessionId,
      userId,
      companyId,
      branchId: null,
      refreshTokenHash: crypto.randomBytes(32).toString("hex"),
      deviceSessionId: `DS-ACC1-API-${stamp}`,
      passwordVersion: 1,
      sessionVersion: 1,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      lastUsedAt: new Date(),
    });
    const token = jwt.sign({ userId, passwordVersion: 1, sessionVersion: 1, technicalSessionId: sessionId, accountType: "super_admin" }, JWT_SECRET, { expiresIn: "1h" });
    server = app.listen(0);
    await new Promise((resolve) => server.on("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/v1`;
    const request = async (pathname) => {
      const response = await fetch(`${base}${pathname}`, { headers: { Authorization: `Bearer ${token}`, "X-Company-ID": companyId } });
      return { status: response.status, body: await response.json() };
    };

    const [dashboard, treasury, trialBalance, reconciliation, ledger, cashReconciliation] = await Promise.all([
      request("/accounting/dashboard-summary"),
      request("/treasury/summary"),
      request("/reports/trial-balance?includeZero=true"),
      request("/reports/ledger-reconciliation?includeZero=true&onlyDifferences=false"),
      request("/reports/ledger/account?accountCode=1110"),
      request("/reports/ledger/cash-reconciliation"),
    ]);
    for (const result of [dashboard, treasury, trialBalance, reconciliation, ledger, cashReconciliation]) {
      assert.equal(result.status, 200, `financial API returns 200: ${JSON.stringify(result.body)}`);
    }
    assert.equal(dashboard.body.data.balances.cash, 100, "dashboard API nets reversed original and posted reversal to zero");
    assert.equal(dashboard.body.data.activity.receipts, 100, "dashboard API excludes reversal pair from net receipts");
    assert.equal(dashboard.body.data.activity.payments, 0, "dashboard API excludes reversal pair from net payments");
    assert.equal(dashboard.body.data.source, "reportable_ledger_journal_lines", "dashboard API declares the reportable-ledger source");
    assert.equal(treasury.body.data.cash, 100, "treasury API matches the dashboard ledger balance");
    const trialCash = trialBalance.body.data.items.find((item) => item.code === "1110");
    const reconciliationCash = reconciliation.body.data.items.find((item) => item.code === "1110");
    assert.equal(trialCash.calculatedBalance, 100, "trial balance includes the reversed original and posted reversal pair");
    assert.equal(reconciliationCash.calculatedBalance, 100, "ledger reconciliation includes the reversed original and posted reversal pair");
    assert.equal(ledger.body.data.closingBalance, 100, "account ledger closing balance is reversal-aware");
    const cashReconciliationCash = cashReconciliation.body.data.items.find((item) => item.accountCode === "1110");
    assert.equal(cashReconciliationCash.closingGlBalance, 100, "cash reconciliation is reversal-aware");
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await models.JournalLine.destroy({ where: { journalEntryId: entryIds } });
    await models.JournalEntry.destroy({ where: { id: entryIds } });
    await models.TechnicalAccountSession.destroy({ where: { id: sessionId } });
    await models.Account.destroy({ where: { id: Object.values(accountIds) } });
    await models.User.destroy({ where: { id: userId }, force: true });
    await models.Branch.destroy({ where: { id: branchId } });
    await models.Setting.destroy({ where: { companyId } });
    await models.Company.destroy({ where: { id: companyId } });
    const [companies, journals, sessions] = await Promise.all([
      models.Company.count({ where: { id: companyId } }),
      models.JournalEntry.count({ where: { id: entryIds } }),
      models.TechnicalAccountSession.count({ where: { id: sessionId } }),
    ]);
    assert.equal(companies + journals + sessions, 0, "ACC1 API fixtures are fully cleaned");
    await models.sequelize.close();
  }
}

(async () => {
  staticContract();
  if (process.env.VERIFY_LIVE_DATABASE === "true") {
    await databaseContract();
    await apiContract();
  } else {
    console.log("STATIC ONLY — set VERIFY_LIVE_DATABASE=true for the guarded V3 run");
  }
  console.log("ACCOUNTING DASHBOARD SOURCE OF TRUTH PASSED");
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
