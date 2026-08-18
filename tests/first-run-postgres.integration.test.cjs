const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");
const test = require("node:test");

const database = process.env.FIRST_RUN_PG_INTEGRATION_DB;
if (!database) {
  test("real PostgreSQL first-run lifecycle requires an explicit disposable database", { skip: true }, () => {});
} else {
  const root = path.join(__dirname, "..");
  const models = require(path.join(root, "backend", "src", "models"));
  const state = require(path.join(root, "backend", "src", "services", "first-run-setup-state.service.js"));
  const bootstrap = require(path.join(root, "backend", "src", "services", "first-run-bootstrap.service.js"));
  const accessControl = require(path.join(root, "backend", "src", "bootstrap", "accessControl.js"));
  const financialCatalog = require(path.join(root, "backend", "src", "services", "financial-account-catalog.service.js"));
  const token = crypto.randomBytes(32).toString("base64url");
  const environment = { FIRST_RUN_SETUP_TOKEN: token };
  const makePayload = (suffix) => {
    const nonce = crypto.randomUUID().replaceAll("-", "");
    const password = `Aa1!${crypto.randomBytes(18).toString("base64url")}`;
    return {
      firstName: "First", lastName: "Run", email: `first-run-${suffix}-${nonce.slice(0, 12)}@example.invalid`, password, passwordConfirmation: password,
      companyName: "First Run Acceptance", workspace: `first-run-${suffix}-${nonce.slice(0, 12)}`, branchName: "Main Branch", branchCode: `FR${suffix.toUpperCase()}`, currency: "AED"
    };
  };
  const count = (model, where = {}) => model.count({ where });
  const tableCount = async (table) => {
    const [rows] = await models.sequelize.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
    return Number(rows[0]?.count || 0);
  };

  test.after(async () => { await models.sequelize.close(); });

  test("real PostgreSQL rollback, advisory-lock bootstrap, concurrency, and idempotency are safe", async () => {
    assert.equal((await state.resolveSetupState(models)).state, state.STATES.SETUP_REQUIRED);
    const rollbackPayload = makePayload("rollback");
    await assert.rejects(
      bootstrap.bootstrapFirstRun({
        models, body: rollbackPayload, token, idempotencyKey: crypto.randomUUID().replaceAll("-", ""), environment,
        dependencies: { accessControl, audit: { record: async () => { throw new Error("INJECTED_AUDIT_FAILURE"); } } }
      }),
      /INJECTED_AUDIT_FAILURE/
    );
    assert.equal(await count(models.User), 0);
    assert.equal(await count(models.Company), 0);
    assert.equal(await count(models.Branch), 0);
    assert.equal(await count(models.FirstRunSetupState), 0);
    for (const table of ["profile_master_data", "pearl_size_master_data", "barcode_inventory_codes", "barcode_item_codes", "barcode_sequences", "inventory_master_data_bootstrap_states"]) {
      assert.equal(await tableCount(table), 0, `rollback must remove ${table}`);
    }
    assert.equal((await state.resolveSetupState(models)).state, state.STATES.SETUP_REQUIRED);

    const attempts = ["a", "b"].map((suffix) => ({ payload: makePayload(suffix), key: crypto.randomUUID().replaceAll("-", "") }));
    const results = await Promise.allSettled(attempts.map(({ payload, key }) => bootstrap.bootstrapFirstRun({ models, body: payload, token, idempotencyKey: key, environment })));
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
    const rejected = results.find((result) => result.status === "rejected").reason;
    assert.equal(rejected.errorCode, "FIRST_RUN_ALREADY_COMPLETE");
    const winnerIndex = results.findIndex((result) => result.status === "fulfilled");
    const winner = attempts[winnerIndex];
    const replay = await bootstrap.bootstrapFirstRun({ models, body: winner.payload, token, idempotencyKey: winner.key, environment });
    assert.equal(replay.replayed, true);
    await assert.rejects(
      bootstrap.bootstrapFirstRun({ models, body: { ...winner.payload, workspace: `${winner.payload.workspace}-changed` }, token, idempotencyKey: winner.key, environment }),
      { errorCode: "FIRST_RUN_IDEMPOTENCY_CONFLICT" }
    );
    assert.equal((await state.resolveSetupState(models)).state, state.STATES.READY);
    assert.equal(await count(models.User, { accountType: "super_admin", isActive: true }), 1);
    assert.equal(await count(models.Company), 1);
    assert.equal(await count(models.Branch, { isActive: true }), 1);
    assert.equal(await count(models.SystemAccountRole), Object.keys(financialCatalog.ACCOUNT_ROLE_CATALOG).length);
    assert.equal(await count(models.BranchFinancialMapping, { isActive: true }), Object.keys(financialCatalog.BRANCH_MAPPING_CATALOG).length);
    assert.equal(await tableCount("profile_master_data"), 659);
    assert.equal(await tableCount("pearl_size_master_data"), 39);
    assert.equal(await tableCount("barcode_inventory_codes"), 5);
    assert.equal(await tableCount("barcode_item_codes"), 20);
    assert.equal(await tableCount("barcode_sequences"), 0);
    assert.equal(await tableCount("inventory_master_data_bootstrap_states"), 1);
    const [bootstrapStates] = await models.sequelize.query("SELECT dataset_id,current_version,state,manifest_hash FROM inventory_master_data_bootstrap_states");
    assert.deepEqual(bootstrapStates, [{
      dataset_id: "INVENTORY_REFERENCE_MASTER_DATA",
      current_version: 2,
      state: "READY",
      manifest_hash: "d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c",
    }]);
    const [categoryRows] = await models.sequelize.query("SELECT category_key,count(*)::int AS count FROM profile_master_data GROUP BY category_key");
    assert.deepEqual(Object.fromEntries(categoryRows.map((row) => [row.category_key, Number(row.count)])), {
      DIAMOND_CLARITY: 11,
      DIAMOND_COLOR: 30,
      DIAMOND_CUT: 5,
      DIAMOND_ORIGIN: 15,
      DIAMOND_POSITION: 7,
      DIAMOND_SATURATION: 10,
      DIAMOND_SETTING: 47,
      DIAMOND_SHAPE: 29,
      DIAMOND_TONE: 14,
      DIAMOND_TONE_LEVEL: 9,
      DIAMOND_TREATMENT: 9,
      DIAMOND_TYPE: 3,
      GEMSTONE_COLOR: 45,
      GEMSTONE_NAME: 67,
      GEMSTONE_OPTICAL_EFFECT: 11,
      GEMSTONE_ORIGIN: 25,
      GEMSTONE_POSITION: 7,
      GEMSTONE_SATURATION: 10,
      GEMSTONE_SETTING: 47,
      GEMSTONE_SHAPE: 19,
      GEMSTONE_TONE: 14,
      GEMSTONE_TONE_LEVEL: 9,
      GEMSTONE_TYPE: 6,
      GOLD_COLOR: 4,
      GOLD_ITEM_DESCRIPTION: 19,
      PEARL_COLOR: 17,
      PEARL_ITEM_DESCRIPTION: 18,
      PEARL_LUSTER: 26,
      PEARL_NACRE_QUALITY: 27,
      PEARL_ORIENT: 6,
      PEARL_ORIGIN: 20,
      PEARL_OVERTONE: 19,
      PEARL_SHAPE: 10,
      PEARL_SURFACE_QUALITY: 18,
      PEARL_TYPE: 10,
      CERTIFICATE_AUTHORITY: 16,
    });
    const [locks] = await models.sequelize.query("SELECT COUNT(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'");
    assert.equal(Number(locks[0].count), 0);
  });
}
