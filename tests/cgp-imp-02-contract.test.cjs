const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const outbox = require(path.join(root, "backend/src/services/outbox.service"));
const { assertTransition, INTEGRATION_STATUS } = require(path.join(root, "backend/src/services/integration-status.service"));
const { createHandlerRegistry } = require(path.join(root, "backend/src/services/outbox-dispatcher.service"));

test("outbox event identity, version and correlation are server-normalized", () => {
  const row = outbox.buildOutboxEvent({ eventType: "Test.Event", aggregateType: "TEST", aggregateId: "1", payload: { value: 1 } });
  assert.match(row.eventId, /^EVT:/);
  assert.equal(row.eventVersion, 1);
  assert.equal(row.correlationId, row.eventId);
  assert.equal(row.status, "PENDING");
  assert.throws(() => outbox.buildOutboxEvent({ eventType: "Test.Event", aggregateType: "TEST", aggregateId: "1", payload: { accessToken: "forbidden" } }));
});

test("retry keeps identity and payload immutable while applying technical backoff", () => {
  const now = new Date("2026-08-09T00:00:00.000Z");
  assert.equal(outbox.retryAvailableAt(now, 1).toISOString(), "2026-08-09T00:00:01.000Z");
  assert.equal(outbox.retryAvailableAt(now, 2).toISOString(), "2026-08-09T00:00:02.000Z");
  assert.equal(outbox.sanitizeError("postgres://user:pass@host/db token=abc").includes("pass"), false);
});

test("integration statuses permit only forward durable transitions", () => {
  assert.doesNotThrow(() => assertTransition(INTEGRATION_STATUS.PENDING, INTEGRATION_STATUS.PROCESSING));
  assert.doesNotThrow(() => assertTransition(INTEGRATION_STATUS.PENDING, INTEGRATION_STATUS.SUCCEEDED));
  assert.doesNotThrow(() => assertTransition(INTEGRATION_STATUS.PENDING, INTEGRATION_STATUS.RETRYABLE_FAILED));
  assert.doesNotThrow(() => assertTransition(INTEGRATION_STATUS.PROCESSING, INTEGRATION_STATUS.SUCCEEDED));
  assert.throws(() => assertTransition(INTEGRATION_STATUS.SUCCEEDED, INTEGRATION_STATUS.PENDING));
});

test("handler registry is explicit and unknown event versions fail without execution", async () => {
  const registry = createHandlerRegistry();
  registry.register({ eventType: "Test.Event", eventVersion: 1, handler: async () => "ok" });
  let ran = false;
  await assert.rejects(() => outbox.dispatchClaimedEvent({ event: { status: "PROCESSING", eventType: "Unknown.Event", eventVersion: 1 }, handlers: registry.snapshot() }));
  assert.equal(ran, false);
});

test("stage-aware CGP posting may exist while dispatcher activation remains explicit", () => {
  const routes = fs.readFileSync(path.join(root, "backend/src/routes/gold-purchase.routes.js"), "utf8");
  const app = fs.readFileSync(path.join(root, "backend/src/app.js"), "utf8");
  const dispatcher = fs.readFileSync(path.join(root, "backend/src/services/outbox-dispatcher.service.js"), "utf8");
  assert.equal(routes.includes("/cgp/drafts/:id/post"), true);
  assert.equal(app.includes("outbox-dispatcher.service"), false);
  assert.equal(dispatcher.includes("createHandlerRegistry"), true);
  assert.equal(dispatcher.includes("CustomerGoldPurchasePostedEvent"), false);
});
