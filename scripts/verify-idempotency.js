/**
 * Phase 21.3-Fix — verify central race-safe idempotency.
 *
 * (A) Functional: exercises idempotency.service with a mock IdempotencyRequest
 *     model (in-memory unique store, no DB) — claim/replay/conflict/processing,
 *     succeed, and the request-hash contract.
 * (B) Static: migration creates `idempotency_requests` with UNIQUE
 *     (company_id, scope, key) + the required fields; model declares the unique
 *     index; the critical routes use claim+succeed; the frontend sends keys.
 * (C) Regression: no print files referenced by the idempotency changes.
 *
 * No DB reset/seed, no live requests.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const idem = require(path.resolve(__dirname, "..", "backend", "src", "services", "idempotency.service.js"));

// ── (A) Functional service ──────────────────────────────────────────────────
function makeMockModels() {
  const store = new Map(); // companyId|scope|key -> row
  const IdempotencyRequest = {
    async create(data) {
      const k = `${data.companyId}|${data.scope}|${data.key}`;
      if (store.has(k)) {
        const err = new Error("duplicate key");
        err.name = "SequelizeUniqueConstraintError";
        throw err;
      }
      const row = { ...data };
      row.update = async (patch) => { Object.assign(row, patch); };
      store.set(k, row);
      return row;
    },
    async findOne({ where }) {
      return store.get(`${where.companyId}|${where.scope}|${where.key}`) || null;
    }
  };
  return { IdempotencyRequest };
}

async function functional() {
  // hashRequest: stable, key-independent, payload-sensitive.
  const h1 = idem.hashRequest("sales.return", { originalInvoiceId: "INV-1", idempotencyKey: "K1", a: 1, b: 2 });
  const h2 = idem.hashRequest("sales.return", { b: 2, a: 1, originalInvoiceId: "INV-1", idempotencyKey: "K2" });
  assert.equal(h1, h2, "same payload (any key order, different key) → same hash");
  const h3 = idem.hashRequest("sales.return", { originalInvoiceId: "INV-1", a: 1, b: 3 });
  assert.notEqual(h1, h3, "different payload → different hash");
  assert.notEqual(idem.hashRequest("sales.return", { a: 1 }), idem.hashRequest("sales.exchange", { a: 1 }), "scope affects hash");

  const models = makeMockModels();
  const base = { models, companyId: "CMP-1", scope: "sales.return", key: "KEY-A", requestHash: h1 };

  // First claim succeeds.
  const c1 = await idem.claim({ ...base });
  assert.equal(c1.claimed, true, "first claim succeeds");

  // Concurrent duplicate (same key) fails the unique insert.
  const c2 = await idem.claim({ ...base });
  assert.equal(c2.claimed, false, "duplicate claim fails (unique)");

  // While processing, resolve → processing (409).
  const p = await idem.resolveExisting({ ...base });
  assert.equal(p.state, "processing", "processing state before succeed");
  assert.equal(p.statusCode, 409);

  // Succeed stores the response; resolve → replay with saved body/status.
  await idem.succeed({ request: c1.request, statusCode: 201, responseBody: { success: true, data: { id: "CN-1" } }, transaction: null });
  const r = await idem.resolveExisting({ ...base });
  assert.equal(r.state, "replay", "replay after succeed");
  assert.equal(r.statusCode, 201);
  assert.deepEqual(r.responseBody, { success: true, data: { id: "CN-1" } }, "replay returns the saved response");

  // Same key, different request hash → conflict.
  const conflict = await idem.resolveExisting({ ...base, requestHash: h3 });
  assert.equal(conflict.state, "conflict", "same key + different hash → conflict");
  assert.equal(conflict.statusCode, 409);

  // A different key is independent.
  const c3 = await idem.claim({ ...base, key: "KEY-B" });
  assert.equal(c3.claimed, true, "different key claims independently");
}

// ── (B) Static assertions ───────────────────────────────────────────────────
function readRepo(rel) {
  return fs.readFileSync(path.resolve(__dirname, "..", rel), "utf8");
}

function staticChecks() {
  // Migration.
  const migDir = path.resolve(__dirname, "..", "backend", "migrations");
  const migFile = fs.readdirSync(migDir).find((f) => f.includes("create-idempotency-requests"));
  assert.ok(migFile, "idempotency migration exists");
  const mig = fs.readFileSync(path.join(migDir, migFile), "utf8");
  assert.ok(mig.includes('createTable("idempotency_requests"'), "migration creates idempotency_requests");
  assert.ok(/addIndex\(\s*"idempotency_requests",\s*\["company_id",\s*"scope",\s*"key"\][\s\S]{0,120}unique:\s*true/.test(mig), "migration adds UNIQUE (company_id, scope, key)");
  for (const col of ["request_hash", "status", "response_body", "expires_at", "status_code"]) {
    assert.ok(mig.includes(col), `migration has column ${col}`);
  }
  assert.ok(mig.includes('dropTable("idempotency_requests")'), "migration down drops the table");

  // Model.
  const model = readRepo("backend/src/models/idempotencyRequest.model.js");
  assert.ok(model.includes('tableName: "idempotency_requests"'), "model maps to idempotency_requests");
  assert.ok(model.includes("unique: true") && model.includes('"company_id", "scope", "key"'), "model declares the unique index");
  const idx = readRepo("backend/src/models/index.js");
  assert.ok(idx.includes("IdempotencyRequest"), "model registered in index");

  // Routes: critical endpoints use claim + succeed with the right scopes.
  const routes = readRepo("backend/src/routes/erp.routes.js");
  assert.ok(routes.includes('require("../services/idempotency.service")'), "routes import the idempotency service");
  for (const scope of ["pos.checkout", "sales.return", "sales.exchange", "purchase.receive"]) {
    assert.ok(routes.includes(`const idemScope = "${scope}"`), `route wires scope ${scope}`);
  }
  const claimCount = (routes.match(/idempotencyService\.claim\(/g) || []).length;
  const succeedCount = (routes.match(/idempotencyService\.succeed\(/g) || []).length;
  assert.ok(claimCount >= 4, `>=4 endpoints claim idempotency (found ${claimCount})`);
  assert.ok(succeedCount >= 4, `>=4 endpoints persist the response (found ${succeedCount})`);
  // The 4 critical scopes each pair a claim with a succeed (via the idemRequest).
  assert.ok((routes.match(/idempotencyService\.resolveExisting\(/g) || []).length >= 4, "critical routes resolve replay/conflict on duplicate");

  // Frontend: critical submits send the key.
  for (const page of [
    "app/[locale]/(dashboard)/sales/returns/page.tsx",
    "app/[locale]/(dashboard)/sales/exchanges/page.tsx",
    "app/[locale]/(dashboard)/suppliers/purchases/page.tsx",
  ]) {
    const src = readRepo(page);
    assert.ok(src.includes("idempotencyKey: idempotencyKeyRef.current"), `frontend ${page} sends a stable Idempotency-Key`);
    assert.ok(src.includes("generateUUID()"), `frontend ${page} generates the key`);
  }
  // POS already had a stable key (regression guard).
  const pos = readRepo("app/[locale]/(dashboard)/pos/page.tsx");
  assert.ok(pos.includes("postInvoice(invoiceData, idempotencyKey)") || pos.includes("idempotencyKey"), "POS still sends its stable key");

  // No print files touched by the idempotency service/model.
  assert.ok(!idem_toString().includes("print"), "idempotency service has no print coupling");
}

function idem_toString() {
  return fs.readFileSync(path.resolve(__dirname, "..", "backend", "src", "services", "idempotency.service.js"), "utf8");
}

(async () => {
  await functional();
  staticChecks();
  console.log("verify-idempotency: ok");
})().catch((err) => { console.error(err); process.exit(1); });
