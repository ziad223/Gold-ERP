const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const bcrypt = require(path.join(__dirname, "..", "backend", "node_modules", "bcryptjs"));

const root = path.join(__dirname, "..");
const setupState = require(path.join(root, "backend", "src", "services", "first-run-setup-state.service.js"));
const bootstrap = require(path.join(root, "backend", "src", "services", "first-run-bootstrap.service.js"));

function record(values) {
  return Object.assign(values, { update: async (next) => Object.assign(values, next) });
}

function fakeModels() {
  const store = { marker: null, companies: [], users: [], branches: [], accounts: [], roles: [], mappings: [], userRoles: [], calls: [] };
  const snapshot = () => Object.fromEntries(Object.entries(store).map(([key, value]) => [key, Array.isArray(value) ? value.map((row) => ({ ...row })) : (value ? { ...value } : null)]));
  const restore = (saved) => {
    for (const key of Object.keys(store)) {
      if (Array.isArray(saved[key])) store[key] = saved[key].map(record);
      else store[key] = saved[key] ? record(saved[key]) : null;
    }
  };
  const matches = (row, where = {}) => Object.entries(where).every(([key, value]) => {
    if (value && typeof value === "object" && Array.isArray(value[Symbol.for("placeholder")])) return true;
    if (value && typeof value === "object" && value[Object.getOwnPropertySymbols(value)[0]]) return true;
    return row[key] === value;
  });
  const models = {
    sequelize: {
      transaction: async (run) => {
        const saved = snapshot();
        try { return await run({ LOCK: { UPDATE: "UPDATE" } }); }
        catch (error) { restore(saved); throw error; }
      },
      query: async (sql) => { store.calls.push({ type: "query", sql: String(sql) }); return []; }
    },
    FirstRunSetupState: {
      findByPk: async (_id, options = {}) => { store.calls.push({ type: "marker.find", lock: Boolean(options.lock) }); return store.marker; },
      create: async (values) => { store.marker = record(values); return store.marker; }
    },
    Company: {
      count: async (options = {}) => { store.calls.push({ type: "company.count", lock: Boolean(options.lock) }); return store.companies.length; },
      findOne: async (options = {}) => { store.calls.push({ type: "company.find", lock: Boolean(options.lock) }); return store.companies[0] || null; },
      create: async (values) => { const row = record(values); store.companies.push(row); return row; }
    },
    User: {
      count: async ({ where = {}, ...options } = {}) => { store.calls.push({ type: "user.count", lock: Boolean(options.lock) }); return store.users.filter((row) => matches(row, where)).length; },
      findOne: async ({ where = {} } = {}) => store.users.find((row) => matches(row, where)) || null,
      create: async (values) => { const row = record(values); store.users.push(row); return row; }
    },
    Branch: {
      count: async ({ where = {}, ...options } = {}) => { store.calls.push({ type: "branch.count", lock: Boolean(options.lock) }); return store.branches.filter((row) => matches(row, where)).length; },
      findOne: async ({ where = {} } = {}) => store.branches.find((row) => matches(row, where)) || null,
      create: async (values) => { const row = record(values); store.branches.push(row); return row; }
    },
    Account: { create: async (values) => { const row = record(values); store.accounts.push(row); return row; } },
    SystemAccountRole: {
      create: async (values) => { const row = record(values); store.roles.push(row); return row; },
      count: async () => store.roles.length
    },
    BranchFinancialMapping: {
      bulkCreate: async (rows) => { store.mappings.push(...rows.map(record)); return rows; },
      count: async () => store.mappings.length
    },
    UserRole: { count: async () => store.userRoles.length }
  };
  return { models, store };
}

const payload = {
  firstName: "First", lastName: "Admin", email: "first.admin@example.test", password: "Strong!Password42", passwordConfirmation: "Strong!Password42",
  companyName: "DARFUS Test", workspace: "darfus-test", branchName: "Main Branch", branchCode: "MAIN", currency: "AED"
};

test("first-run state is setup-required only for a truly empty installation", async () => {
  const { models, store } = fakeModels();
  assert.equal((await setupState.resolveSetupState(models)).state, setupState.STATES.SETUP_REQUIRED);
  store.companies.push(record({ id: "COMP-A" }));
  assert.equal((await setupState.resolveSetupState(models)).state, setupState.STATES.RECOVERY_REQUIRED);
  store.companies.push(record({ id: "COMP-B" }));
  assert.equal((await setupState.resolveSetupState(models)).state, setupState.STATES.CONFIGURATION_CONFLICT);
});

test("locked state resolution never applies row locks to aggregate reads", async () => {
  const { models, store } = fakeModels();
  await setupState.resolveSetupState(models, { transaction: { LOCK: { UPDATE: "UPDATE" } }, lock: true });
  assert.equal(store.calls.find((call) => call.type === "marker.find").lock, true);
  assert.equal(store.calls.find((call) => call.type === "company.count").lock, false);
  assert.equal(store.calls.find((call) => call.type === "user.count").lock, false);
});

test("partial, inactive, and multi-Company states remain fail-closed", async () => {
  const { models, store } = fakeModels();
  store.companies.push(record({ id: "COMP-A" }));
  store.users.push(record({ id: "USR-A", accountType: "super_admin", isActive: false }));
  assert.equal((await setupState.resolveSetupState(models)).state, setupState.STATES.RECOVERY_REQUIRED);
  store.users[0].isActive = true;
  assert.equal((await setupState.resolveSetupState(models)).state, setupState.STATES.RECOVERY_REQUIRED);
  store.branches.push(record({ id: "BR-A", companyId: "COMP-A", isActive: true }));
  assert.equal((await setupState.resolveSetupState(models)).state, setupState.STATES.RECOVERY_REQUIRED);
  store.roles.push(...Array.from({ length: 6 }, (_, index) => record({ id: `ROLE-${index}` })));
  store.mappings.push(record({ id: "MAP-A" }), record({ id: "MAP-B" }));
  store.marker = record({ state: setupState.STATES.READY });
  assert.equal((await setupState.resolveSetupState(models)).state, setupState.STATES.READY);
  store.companies.push(record({ id: "COMP-B" }));
  assert.equal((await setupState.resolveSetupState(models)).state, setupState.STATES.CONFIGURATION_CONFLICT);
});

test("setup authorization fails closed and does not accept a missing or wrong token", () => {
  assert.throws(() => bootstrap.verifyAuthorization(undefined, { FIRST_RUN_SETUP_TOKEN: "approved" }), { errorCode: "FIRST_RUN_TOKEN_REQUIRED" });
  assert.throws(() => bootstrap.verifyAuthorization("wrong", { FIRST_RUN_SETUP_TOKEN: "approved" }), { errorCode: "FIRST_RUN_TOKEN_INVALID" });
  assert.doesNotThrow(() => bootstrap.verifyAuthorization("approved", { FIRST_RUN_SETUP_TOKEN: "approved" }));
});

test("atomic bootstrap creates the direct Super Admin, one Company, one Branch, and mandatory mappings", async () => {
  const { models, store } = fakeModels();
  const dependencies = {
    accessControl: {
      ensureRolesForCompany: async () => undefined,
      assignUserRole: async (userId, companyId) => { store.userRoles.push({ userId, roleId: `ROLE-${companyId}-admin` }); return { id: `ROLE-${companyId}-admin` }; }
    },
    audit: { record: async () => undefined }
  };
  const result = await bootstrap.bootstrapFirstRun({ models, body: payload, token: "approved", idempotencyKey: "1234567890abcdef", environment: { FIRST_RUN_SETUP_TOKEN: "approved" }, dependencies });
  assert.deepEqual(result, { success: true, state: "READY", next: "LOGIN" });
  assert.equal(store.companies.length, 1);
  assert.equal(store.branches.length, 1);
  assert.equal(store.users.length, 1);
  assert.equal(store.users[0].accountType, "super_admin");
  assert.equal(store.users[0].role, "admin");
  assert.equal(await bcrypt.compare(payload.password, store.users[0].password), true);
  assert.equal(store.roles.length, 6);
  assert.equal(store.mappings.length, 2);
  assert.equal(store.marker.state, "READY");
  const advisoryIndex = store.calls.findIndex((call) => call.type === "query" && call.sql.includes("pg_advisory_xact_lock"));
  const stateReadIndex = store.calls.findIndex((call) => call.type === "company.count");
  assert.ok(advisoryIndex >= 0);
  assert.ok(stateReadIndex > advisoryIndex);
  assert.equal(store.calls.filter((call) => /\.count$/.test(call.type)).some((call) => call.lock), false);
  const replay = await bootstrap.bootstrapFirstRun({ models, body: payload, token: "approved", idempotencyKey: "1234567890abcdef", environment: { FIRST_RUN_SETUP_TOKEN: "approved" }, dependencies });
  assert.equal(replay.replayed, true);
  await assert.rejects(() => bootstrap.bootstrapFirstRun({ models, body: payload, token: "approved", idempotencyKey: "different-key-1234", environment: { FIRST_RUN_SETUP_TOKEN: "approved" }, dependencies }), { errorCode: "FIRST_RUN_ALREADY_COMPLETE" });
  await assert.rejects(() => bootstrap.bootstrapFirstRun({ models, body: { ...payload, workspace: "different-workspace" }, token: "approved", idempotencyKey: "1234567890abcdef", environment: { FIRST_RUN_SETUP_TOKEN: "approved" }, dependencies }), { errorCode: "FIRST_RUN_IDEMPOTENCY_CONFLICT" });
});

test("a financial-mapping failure rolls back the first-run marker and every created row", async () => {
  const { models, store } = fakeModels();
  models.BranchFinancialMapping.bulkCreate = async () => { throw Object.assign(new Error("injected"), { errorCode: "FIRST_RUN_FINANCIAL_MAPPING_INCOMPLETE" }); };
  const dependencies = { accessControl: { ensureRolesForCompany: async () => undefined, assignUserRole: async () => ({ id: "ROLE-ADMIN" }) }, audit: { record: async () => undefined } };
  await assert.rejects(() => bootstrap.bootstrapFirstRun({ models, body: payload, token: "approved", idempotencyKey: "rollback-key-12345", environment: { FIRST_RUN_SETUP_TOKEN: "approved" }, dependencies }));
  assert.equal(store.marker, null);
  assert.equal(store.companies.length, 0);
  assert.equal(store.users.length, 0);
  assert.equal(store.branches.length, 0);
  assert.equal(store.accounts.length, 0);
  assert.equal(store.roles.length, 0);
});

test("first-run routes remain context-free, rate-limited, and public registration stays closed", () => {
  const fs = require("node:fs");
  const routes = fs.readFileSync(path.join(root, "backend", "src", "routes", "setup.routes.js"), "utf8");
  const auth = fs.readFileSync(path.join(root, "backend", "src", "routes", "auth.routes.js"), "utf8");
  const service = fs.readFileSync(path.join(root, "backend", "src", "services", "first-run-bootstrap.service.js"), "utf8");
  assert.match(routes, /router\.get\("\/status"/);
  assert.match(routes, /router\.post\("\/bootstrap", setupRateLimit/);
  assert.match(auth, /router\.post\("\/register"[\s\S]*status\(410\)/);
  assert.match(service, /pg_advisory_xact_lock/);
  assert.match(service, /accountType: "super_admin"/);
  assert.match(service, /password: "\[redacted\]"/);
});
