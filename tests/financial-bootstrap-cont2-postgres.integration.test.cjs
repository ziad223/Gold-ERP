"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

if (process.env.FINANCIAL_CONT2_PG_ACCEPTANCE !== "1") {
  test("financial CONT2 disposable PostgreSQL acceptance requires explicit opt-in", { skip: true }, () => {});
} else {
  const root = path.join(__dirname, "..");
  require(path.join(root, "backend", "node_modules", "dotenv")).config({
    path: path.join(root, "backend", ".env"),
  });
  const { Client } = require(path.join(root, "backend", "node_modules", "pg"));
  const { resolveDatabaseEnv } = require(path.join(root, "backend", "src", "config", "database-env"));

  test("fresh database rejects semantically invalid mappings and preserves readiness", async () => {
    const base = resolveDatabaseEnv({ ...process.env, NODE_ENV: "development" });
    assert.equal(["localhost", "127.0.0.1", "::1"].includes(base.host), true);
    assert.equal(base.port, 5432);
    assert.equal(base.database, "darfus_erp");

    const database = `darfus_financial_fix_cont2_${Date.now()}`;
    assert.match(database, /^darfus_financial_fix_cont2_\d+$/);
    const admin = new Client({
      host: base.host,
      port: base.port,
      user: base.username,
      password: base.password,
      database: "postgres",
      ssl: base.ssl ? { rejectUnauthorized: false } : undefined,
    });
    let server = null;
    let models = null;
    let created = false;
    await admin.connect();
    try {
      await admin.query(`CREATE DATABASE "${database}"`);
      created = true;

      Object.assign(process.env, {
        NODE_ENV: "development",
        DB_HOST: base.host,
        DB_PORT: String(base.port),
        DB_NAME: database,
        DB_USER: base.username,
        DB_PASSWORD: base.password,
        DB_SSL: base.ssl ? "true" : "false",
        FIRST_RUN_SETUP_TOKEN: crypto.randomBytes(32).toString("base64url"),
        ALLOW_RUNTIME_ADMIN_BOOTSTRAP: "false",
      });
      delete process.env.DATABASE_URL;

      const cli = path.join(root, "backend", "node_modules", "sequelize-cli", "lib", "sequelize");
      const migration = spawnSync(process.execPath, [cli, "db:migrate"], {
        cwd: path.join(root, "backend"),
        env: process.env,
        encoding: "utf8",
        stdio: "pipe",
      });
      assert.equal(migration.status, 0, "all source migrations must apply to the disposable database");

      models = require(path.join(root, "backend", "src", "models"));
      const app = require(path.join(root, "backend", "src", "app"));
      const financialCatalog = require(path.join(root, "backend", "src", "services", "financial-account-catalog.service"));
      const resolver = require(path.join(root, "backend", "src", "services", "financial-account-resolver.service"));
      await models.sequelize.authenticate();
      server = await new Promise((resolve) => {
        const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
      });
      const address = server.address();
      const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

      const request = async (route, options = {}) => {
        const response = await fetch(`${baseUrl}${route}`, options);
        const text = await response.text();
        return { status: response.status, body: text ? JSON.parse(text) : null };
      };

      const password = `Aa1!${crypto.randomBytes(18).toString("base64url")}`;
      const email = `financial-cont2-${crypto.randomUUID().slice(0, 12)}@example.invalid`;
      const bootstrap = await request("/setup/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-First-Run-Setup-Token": process.env.FIRST_RUN_SETUP_TOKEN,
          "Idempotency-Key": crypto.randomUUID().replaceAll("-", ""),
        },
        body: JSON.stringify({
          firstName: "Financial",
          lastName: "Acceptance",
          email,
          password,
          passwordConfirmation: password,
          companyName: "Financial CONT2 Acceptance",
          workspace: `financial-cont2-${crypto.randomUUID().slice(0, 12)}`,
          branchName: "Acceptance Branch",
          branchCode: "FAC2",
          currency: "AED",
        }),
      });
      assert.equal(bootstrap.status, 201);

      const company = await models.Company.findOne();
      const branch = await models.Branch.findOne({ where: { companyId: company.id, isActive: true } });
      assert.ok(company && branch);
      assert.equal(await models.SystemAccountRole.count(), Object.keys(financialCatalog.ACCOUNT_ROLE_CATALOG).length);
      assert.equal(await models.BranchFinancialMapping.count({ where: { isActive: true } }), Object.keys(financialCatalog.BRANCH_MAPPING_CATALOG).length);

      const login = await request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      assert.equal(login.status, 200);
      const token = login.body?.data?.token;
      assert.equal(typeof token, "string");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Company-ID": company.id,
        "X-Branch-ID": branch.id,
      };

      const readinessBefore = await request("/financial/readiness", { headers });
      assert.equal(readinessBefore.status, 200);
      assert.equal(readinessBefore.body?.data?.status, "READY");

      const bankRole = await models.SystemAccountRole.findOne({
        where: { companyId: company.id, branchId: branch.id, roleCode: "BANK_ACCOUNT" },
      });
      const bankMapping = await models.BranchFinancialMapping.findOne({
        where: { companyId: company.id, branchId: branch.id, mappingType: "BANK_ACCOUNT", channel: null },
      });
      assert.ok(bankRole && bankMapping);
      const validBankAccountId = bankMapping.accountId;

      const genericAccount = await request("/accounts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: "QA-GENERIC-ASSET",
          name: "Generic Asset",
          nameAr: "أصل عام",
          type: "asset",
          nature: "debit",
          statementClassification: "asset",
          isPosting: true,
          parentId: null,
        }),
      });
      assert.equal(genericAccount.status, 201);
      const genericAccountId = genericAccount.body?.data?.id;
      assert.equal(typeof genericAccountId, "string");

      const beforeReject = {
        accounts: await models.Account.count(),
        mappings: await models.BranchFinancialMapping.count(),
        journals: await models.JournalEntry.count(),
        lines: await models.JournalLine.count(),
        audits: await models.AuditLog.count(),
      };
      const rejected = await request("/financial/branch-mappings/BANK_ACCOUNT", {
        method: "PUT",
        headers,
        body: JSON.stringify({ accountId: genericAccountId }),
      });
      assert.equal(rejected.status, 422);
      assert.equal(rejected.body?.error?.code, "FINANCIAL_MAPPING_ACCOUNT_INCOMPATIBLE");
      assert.deepEqual(rejected.body?.error?.fields?.mappingRole, ["BANK_ACCOUNT"]);
      assert.deepEqual(rejected.body?.error?.fields?.reasonCode, ["ACCOUNT_ROLE_MISSING"]);
      assert.equal(JSON.stringify(rejected.body?.error?.fields || {}).includes(genericAccountId), false);
      await bankMapping.reload();
      assert.equal(bankMapping.accountId, validBankAccountId);
      assert.deepEqual({
        accounts: await models.Account.count(),
        mappings: await models.BranchFinancialMapping.count(),
        journals: await models.JournalEntry.count(),
        lines: await models.JournalLine.count(),
        audits: await models.AuditLog.count(),
      }, beforeReject);

      const accepted = await request("/financial/branch-mappings/BANK_ACCOUNT", {
        method: "PUT",
        headers,
        body: JSON.stringify({ accountId: bankRole.accountId }),
      });
      assert.equal(accepted.status, 200);

      await bankMapping.update({ accountId: genericAccountId });
      await assert.rejects(
        resolver.resolvePostingAccount({
          companyId: company.id,
          branchId: branch.id,
          accountCode: financialCatalog.ACCOUNT_ROLE_CATALOG.BANK_ACCOUNT.code,
        }),
        { errorCode: "FINANCIAL_MAPPING_ACCOUNT_INCOMPATIBLE" },
      );
      await bankMapping.update({ accountId: validBankAccountId });

      const originalExpenseMapping = await models.BranchFinancialMapping.findOne({
        where: { companyId: company.id, branchId: branch.id, mappingType: "DEFAULT_EXPENSE", channel: null },
      });
      const originalExpenseAccountId = originalExpenseMapping.accountId;
      const customExpense = await request("/accounts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: "QA-CUSTOM-EXPENSE",
          name: "Custom Operating Expense",
          nameAr: "مصروف تشغيلي مخصص",
          type: "expense",
          nature: "debit",
          statementClassification: "operating_expense",
          isPosting: true,
          parentId: null,
        }),
      });
      assert.equal(customExpense.status, 201);
      const customExpenseId = customExpense.body?.data?.id;
      assert.equal(typeof customExpenseId, "string");
      const customExpenseRow = await models.Account.findOne({ where: { id: customExpenseId } });
      const compatibility = require(path.join(root, "backend", "src", "services", "financial-mapping-compatibility.service"));
      const customExpenseCompatibility = compatibility.evaluateMappingAccountCompatibility({
        companyId: company.id,
        branchId: branch.id,
        mappingType: "DEFAULT_EXPENSE",
        account: customExpenseRow,
        roleCodes: [],
      });
      assert.equal(customExpenseCompatibility.compatible, true, customExpenseCompatibility.reasonCode);

      const eligibleExpense = await request("/financial/branch-mappings/DEFAULT_EXPENSE/eligible-accounts", { headers });
      assert.equal(eligibleExpense.status, 200);
      const eligibleExpenseAccounts = eligibleExpense.body?.data?.accounts;
      assert.equal(Array.isArray(eligibleExpenseAccounts), true);
      assert.equal(eligibleExpenseAccounts.length > 0, true);
      assert.equal(eligibleExpenseAccounts.some((account) => account.code === "QA-CUSTOM-EXPENSE"), true);
      assert.equal(eligibleExpenseAccounts.some((account) => account.id === customExpenseId), true);
      const acceptedExpense = await request("/financial/branch-mappings/DEFAULT_EXPENSE", {
        method: "PUT",
        headers,
        body: JSON.stringify({ accountId: customExpenseId }),
      });
      assert.equal(acceptedExpense.status, 200);

      const reconcile = await request("/financial/reconcile", {
        method: "POST",
        headers,
        body: JSON.stringify({ dryRun: false }),
      });
      assert.equal(reconcile.status, 200);
      await originalExpenseMapping.reload();
      assert.equal(originalExpenseMapping.accountId, customExpenseId);

      const readinessAfter = await request("/financial/readiness", { headers });
      assert.equal(readinessAfter.status, 200);
      assert.equal(readinessAfter.body?.data?.status, "READY");

      const restoreExpense = await request("/financial/branch-mappings/DEFAULT_EXPENSE", {
        method: "PUT",
        headers,
        body: JSON.stringify({ accountId: originalExpenseAccountId }),
      });
      assert.equal(restoreExpense.status, 200);
      const logout = await request("/auth/logout", { method: "POST", headers });
      assert.equal(logout.status, 200);
    } finally {
      if (server) await new Promise((resolve) => server.close(resolve));
      if (models) await models.sequelize.close();
      if (created) {
        await admin.query(
          "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
          [database],
        );
        await admin.query(`DROP DATABASE "${database}"`);
        const residue = await admin.query("SELECT COUNT(*)::int AS count FROM pg_database WHERE datname = $1", [database]);
        assert.equal(Number(residue.rows[0].count), 0);
      }
      await admin.end();
    }
  });
}
