const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");

const middleware = require(path.join(__dirname, "..", "backend", "src", "middleware", "error.middleware.js"));

test("unexpected Sequelize database failures are safe internal errors, not validation errors", () => {
  let statusCode;
  let payload;
  middleware(
    Object.assign(new Error("FOR UPDATE is not allowed with aggregate functions"), { name: "SequelizeDatabaseError", parent: { code: "0A000" } }),
    { path: "/api/v1/setup/bootstrap", method: "POST", requestId: "REQ-error-contract", headers: {} },
    { status: (code) => { statusCode = code; return { json: (body) => { payload = body; } }; } },
    () => {}
  );
  assert.equal(statusCode, 500);
  assert.deepEqual(Object.keys(payload), ["success", "error"]);
  assert.equal(payload.error.code, "INTERNAL_SERVER_ERROR");
  assert.equal(payload.error.requestId, "REQ-error-contract");
  assert.equal(JSON.stringify(payload).includes("FOR UPDATE"), false);
  assert.equal(JSON.stringify(payload).includes("0A000"), false);
});
