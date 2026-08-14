const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");

const root = path.join(__dirname, "..");
const { canonicalErrorPayload, normalizeErrorResponse } = require(path.join(root, "backend", "src", "utils", "error-contract.js"));
const normalizeResponse = require(path.join(root, "backend", "src", "middleware", "error-response-normalizer.middleware.js"));
const requestId = require(path.join(root, "backend", "src", "middleware", "request-id.middleware.js"));
const app = require(path.join(root, "backend", "src", "app.js"));
const http = require("node:http");

test("canonical envelope has exactly one safe error shape for required statuses", () => {
  for (const status of [400, 401, 403, 404, 409, 422, 500]) {
    const payload = canonicalErrorPayload({ status, requestId: "REQ-contract-123" });
    assert.deepEqual(Object.keys(payload), ["success", "error"]);
    assert.equal(payload.success, false);
    assert.match(payload.error.code, /^[A-Z][A-Z0-9_]+$/);
    assert.equal(payload.error.requestId, "REQ-contract-123");
    assert.equal(Object.hasOwn(payload, "message"), false);
    assert.equal(Object.hasOwn(payload, "errors"), false);
  }
});

test("legacy direct JSON errors are normalized without changing their stable code", () => {
  const payload = normalizeErrorResponse({ success: false, code: "COMPANY_SCOPE_INVALID", message: "internal text", errors: { companyId: ["invalid"] } }, 403, "REQ-direct-123");
  assert.deepEqual(payload, {
    success: false,
    error: {
      code: "COMPANY_SCOPE_INVALID",
      message: "internal text",
      details: null,
      fields: { companyId: ["invalid"] },
      requestId: "REQ-direct-123",
    },
  });
});

test("route-level 5xx messages cannot leak database or ORM internals", () => {
  const payload = normalizeErrorResponse({ success: false, error: { code: "DATABASE_UNAVAILABLE", message: "password=secret SELECT * FROM users" } }, 500, "REQ-safe-500");
  assert.equal(payload.error.code, "DATABASE_UNAVAILABLE");
  assert.equal(payload.error.message, "An unexpected server error occurred.");
  assert.equal(JSON.stringify(payload).includes("password=secret"), false);
  assert.equal(JSON.stringify(payload).includes("SELECT *"), false);
});

test("response adapter normalizes a direct route error once and leaves successful JSON unchanged", () => {
  const output = [];
  const req = { requestId: "REQ-adapter-123" };
  const res = { statusCode: 422, json: (body) => output.push(body) };
  normalizeResponse(req, res, () => {});
  res.json({ success: false, code: "VALIDATION_FAILED", errors: { email: ["Invalid"] } });
  assert.equal(output[0].error.code, "VALIDATION_FAILED");
  assert.deepEqual(output[0].error.fields, { email: ["Invalid"] });
  res.statusCode = 200;
  res.json({ success: true, data: { ok: true } });
  assert.deepEqual(output[1], { success: true, data: { ok: true } });
});

test("request IDs accept bounded safe inbound values and replace unsafe input", () => {
  const safe = { get: (name) => name === "X-Correlation-ID" ? "REQ-safe-123" : undefined };
  const safeResponse = { setHeader: () => {} };
  requestId(safe, safeResponse, () => {});
  assert.equal(safe.requestId, "REQ-safe-123");
  const unsafe = { get: () => "unsafe value with spaces" };
  requestId(unsafe, safeResponse, () => {});
  assert.match(unsafe.requestId, /^[0-9a-f-]{36}$/);
});

test("unknown API routes and malformed JSON use the canonical envelope over HTTP", async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const unknown = await fetch(`http://127.0.0.1:${port}/api/v1/does-not-exist`, { headers: { "X-Correlation-ID": "REQ-http-404" } });
    const unknownPayload = await unknown.json();
    assert.equal(unknown.status, 404);
    assert.equal(unknownPayload.error.code, "ROUTE_NOT_FOUND");
    assert.equal(unknownPayload.error.requestId, "REQ-http-404");

    const malformed = await fetch(`http://127.0.0.1:${port}/api/v1/setup/bootstrap`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Correlation-ID": "REQ-http-400" },
      body: "{",
    });
    const malformedPayload = await malformed.json();
    assert.equal(malformed.status, 400);
    assert.equal(malformedPayload.error.code, "INVALID_JSON");
    assert.equal(malformedPayload.error.requestId, "REQ-http-400");
    assert.equal(JSON.stringify(malformedPayload).includes("Unexpected token"), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
