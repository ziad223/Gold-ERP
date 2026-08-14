const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const outbox = require(path.join(root, "backend/src/services/outbox.service"));
const runtime = require(path.join(root, "backend/src/services/cgp-runtime-dispatcher.service"));

test("CGP runtime defaults disabled and fails closed without a stable watermark", () => {
  assert.equal(runtime.resolveConfig({}).enabled, false);
  const missing = runtime.resolveConfig({ CGP_RUNTIME_DISPATCH_ENABLED: "true" });
  assert.equal(missing.valid, false);
  assert.equal(missing.reason, "ACTIVATION_WATERMARK_REQUIRED");
  const invalid = runtime.resolveConfig({ CGP_RUNTIME_DISPATCH_ENABLED: "true", CGP_RUNTIME_DISPATCH_MIN_CREATED_AT: "not-a-date" });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.reason, "ACTIVATION_WATERMARK_REQUIRED");
  const stable = runtime.resolveConfig({ CGP_RUNTIME_DISPATCH_ENABLED: "true", CGP_RUNTIME_DISPATCH_MIN_CREATED_AT: "2026-08-12T00:00:00.000Z", CGP_RUNTIME_DISPATCH_POLL_MS: "1000" });
  assert.equal(stable.valid, true);
  assert.equal(stable.watermark.toISOString(), "2026-08-12T00:00:00.000Z");
  assert.equal(runtime.resolveConfig({ CGP_RUNTIME_DISPATCH_ENABLED: "true", CGP_RUNTIME_DISPATCH_MIN_CREATED_AT: "2026-08-12T00:00:00.000Z", CGP_RUNTIME_DISPATCH_POLL_MS: "1000" }).watermark.toISOString(), stable.watermark.toISOString());
});

test("claimEligible uses one atomic scoped claim for the CGP event and watermark", async () => {
  let sql = "";
  const fakeSequelize = { query: async (statement) => { sql = statement; return [{ event_id: "new" }]; } };
  const transaction = {};
  const config = runtime.resolveConfig({ CGP_RUNTIME_DISPATCH_ENABLED: "true", CGP_RUNTIME_DISPATCH_MIN_CREATED_AT: "2026-08-12T00:00:00.000Z", CGP_RUNTIME_DISPATCH_POLL_MS: "1000" });
  const rows = await runtime.claimEligible({ transaction, workerId: "test-worker", now: new Date("2026-08-12T01:00:00.000Z"), limit: 1, config, sequelize: fakeSequelize });
  assert.equal(rows.length, 1);
  assert.match(sql, /event_type = :eventType/);
  assert.match(sql, /event_version = :eventVersion/);
  assert.match(sql, /created_at >= :minCreatedAt/);
  assert.match(sql, /FOR UPDATE SKIP LOCKED/);
  assert.match(sql, /UPDATE outbox_events AS event/);
});

test("CGP registry is explicit and invokes four canonical consumers plus the availability gate", async () => {
  const calls = [];
  const mock = (name, method) => ({ [method]: async ({ eventId }) => { calls.push(`${name}:${eventId}`); return { ok: true }; } });
  const registry = runtime.createCgpConsumerRegistry({
    consumers: {
      inventory: mock("inventory", "consumePostedEvent"),
      accounting: mock("accounting", "consumePostedEvent"),
      goldCenter: mock("gold", "consumePostedEvent"),
      crm: mock("crm", "consumePostedEvent"),
      availability: mock("availability", "evaluateAvailability"),
    },
  });
  const handler = registry.snapshot()[runtime.EVENT_TYPE][String(runtime.EVENT_VERSION)];
  await handler({ event_id: "event-1", event_type: runtime.EVENT_TYPE, event_version: runtime.EVENT_VERSION, status: "PROCESSING" });
  assert.deepEqual(calls, ["inventory:event-1", "accounting:event-1", "gold:event-1", "availability:event-1", "crm:event-1"]);
  await assert.rejects(() => outbox.dispatchClaimedEvent({ event: { status: "PROCESSING", event_type: "Unknown.Event", event_version: 1 }, handlers: registry.snapshot() }));
  await assert.rejects(() => outbox.dispatchClaimedEvent({ event: { status: "PROCESSING", event_type: runtime.EVENT_TYPE, event_version: 99 }, handlers: registry.snapshot() }));
});

test("disabled or invalid runtime never claims an event", async () => {
  const disabled = await runtime.processOnce({ config: runtime.resolveConfig({}), limit: 1 });
  assert.equal(disabled.claimed, 0);
  assert.equal(disabled.skipped, true);
  const invalid = await runtime.processOnce({ config: runtime.resolveConfig({ CGP_RUNTIME_DISPATCH_ENABLED: "true" }), limit: 1 });
  assert.equal(invalid.claimed, 0);
  assert.equal(invalid.reason, "ACTIVATION_WATERMARK_REQUIRED");
});

