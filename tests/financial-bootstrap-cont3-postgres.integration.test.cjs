"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

if (process.env.FINANCIAL_CONT3_PG_ACCEPTANCE !== "1") {
  test("financial CONT3 disposable PostgreSQL acceptance requires explicit opt-in", { skip: true }, () => {});
} else {
  const root = path.join(__dirname, "..");
  require(path.join(root, "backend", "node_modules", "dotenv")).config({ path: path.join(root, "backend", ".env") });
  const { Client } = require(path.join(root, "backend", "node_modules", "pg"));
  const { resolveDatabaseEnv } = require(path.join(root, "backend", "src", "config", "database-env"));

  test("fresh runtime protects mapped stable-role account semantics atomically", async () => {
    const base = resolveDatabaseEnv({ ...process.env, NODE_ENV: "development" });
    assert.equal(["localhost", "127.0.0.1", "::1"].includes(base.host), true);
    assert.equal(base.port, 5432);
    assert.equal(base.database, "darfus_erp");
    const database = `darfus_financial_fix_cont3_${Date.now()}`;
    const admin = new Client({ host: base.host, port: base.port, user: base.username, password: base.password, database: "postgres" });
    let created = false;
    let server = null;
    let models = null;
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
        DB_SSL: "false",
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
      assert.equal(migration.status, 0);

      models = require(path.join(root, "backend", "src", "models"));
      const app = require(path.join(root, "backend", "src", "app"));
      const catalog = require(path.join(root, "backend", "src", "services", "financial-account-catalog.service"));
      await models.sequelize.authenticate();
      server = await new Promise((resolve) => {
        const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
      });
      const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
      const request = async (route, options = {}) => {
        const response = await fetch(`${baseUrl}${route}`, options);
        const text = await response.text();
        return { status: response.status, body: text ? JSON.parse(text) : null };
      };
      const password = `Aa1!${crypto.randomBytes(18).toString("base64url")}`;
      const email = `financial-cont3-${crypto.randomUUID().slice(0, 12)}@example.invalid`;
      const bootstrap = await request("/setup/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-First-Run-Setup-Token": process.env.FIRST_RUN_SETUP_TOKEN,
          "Idempotency-Key": crypto.randomUUID().replaceAll("-", ""),
        },
        body: JSON.stringify({
          firstName: "Financial",
          lastName: "Integrity",
          email,
          password,
          passwordConfirmation: password,
          companyName: "Financial Integrity Acceptance",
          workspace: `financial-cont3-${crypto.randomUUID().slice(0, 12)}`,
          branchName: "Integrity Branch",
          branchCode: "FIC3",
          currency: "AED",
        }),
      });
      assert.equal(bootstrap.status, 201);
      const company = await models.Company.findOne();
      const branch = await models.Branch.findOne({ where: { companyId: company.id, isActive: true } });
      assert.equal(await models.SystemAccountRole.count(), Object.keys(catalog.ACCOUNT_ROLE_CATALOG).length);
      assert.equal(await models.BranchFinancialMapping.count({ where: { isActive: true } }), Object.keys(catalog.BRANCH_MAPPING_CATALOG).length);

      const login = await request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      assert.equal(login.status, 200);
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${login.body.data.token}`,
        "X-Company-ID": company.id,
        "X-Branch-ID": branch.id,
      };
      const bankRole = await models.SystemAccountRole.findOne({ where: { companyId: company.id, branchId: branch.id, roleCode: "BANK_ACCOUNT" } });
      const bank = await models.Account.findOne({ where: { id: bankRole.accountId } });
      const safeEdit = await request(`/accounts/${encodeURIComponent(bank.id)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name: "Bank Account Display Updated" }),
      });
      assert.equal(safeEdit.status, 200);
      await bank.reload();
      const protectedSnapshot = {
        type: bank.type,
        nature: bank.nature,
        statementClassification: bank.statementClassification,
        isPosting: bank.isPosting,
        isActive: bank.isActive,
        roleCount: await models.SystemAccountRole.count({ where: { accountId: bank.id } }),
        mappingCount: await models.BranchFinancialMapping.count({ where: { accountId: bank.id, isActive: true } }),
        accountCount: await models.Account.count(),
        journalCount: await models.JournalEntry.count(),
        lineCount: await models.JournalLine.count(),
      };
      const cases = [
        { body: { type: "liability", nature: "credit", statementClassification: "liability" }, field: "accountSemantics" },
        { body: { nature: "credit" }, field: "accountSemantics" },
        { body: { statementClassification: "liability" }, field: "accountSemantics" },
        { body: { isPosting: false }, field: "isPosting" },
      ];
      for (const item of cases) {
        const rejected = await request(`/accounts/${encodeURIComponent(bank.id)}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(item.body),
        });
        assert.equal(rejected.status, 422);
        assert.equal(rejected.body?.error?.code, "FINANCIAL_ACCOUNT_SEMANTIC_CHANGE_INCOMPATIBLE");
        assert.deepEqual(rejected.body?.error?.fields?.field, [item.field]);
        assert.equal(JSON.stringify(rejected.body?.error?.fields || {}).includes(bank.id), false);
      }
      const deactivate = await request(`/accounts/${encodeURIComponent(bank.id)}/deactivate`, { method: "POST", headers });
      assert.equal(deactivate.status, 422);
      assert.equal(deactivate.body?.error?.code, "FINANCIAL_ACCOUNT_SEMANTIC_CHANGE_INCOMPATIBLE");

      await bank.reload();
      assert.deepEqual({
        type: bank.type,
        nature: bank.nature,
        statementClassification: bank.statementClassification,
        isPosting: bank.isPosting,
        isActive: bank.isActive,
        roleCount: await models.SystemAccountRole.count({ where: { accountId: bank.id } }),
        mappingCount: await models.BranchFinancialMapping.count({ where: { accountId: bank.id, isActive: true } }),
        accountCount: await models.Account.count(),
        journalCount: await models.JournalEntry.count(),
        lineCount: await models.JournalLine.count(),
      }, protectedSnapshot);
      const readiness = await request("/financial/readiness", { headers });
      assert.equal(readiness.status, 200);
      assert.equal(readiness.body?.data?.status, "READY");
      assert.deepEqual(readiness.body?.data?.invalidMappings, []);
      assert.deepEqual(readiness.body?.data?.missingRoles, []);
      assert.equal((await request("/auth/logout", { method: "POST", headers })).status, 200);
    } finally {
      if (server) await new Promise((resolve) => server.close(resolve));
      if (models) await models.sequelize.close();
      if (created) {
        await admin.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()", [database]);
        await admin.query(`DROP DATABASE "${database}"`);
        assert.equal(Number((await admin.query("SELECT COUNT(*)::int count FROM pg_database WHERE datname=$1", [database])).rows[0].count), 0);
      }
      await admin.end();
    }
  });
}
