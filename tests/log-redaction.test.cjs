const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");

const root = path.join(__dirname, "..");
const { redactString, redactValue } = require(path.join(root, "backend", "src", "utils", "log-redaction.js"));
const { queryMetadata } = require(path.join(root, "backend", "src", "utils", "query-logger.js"));

test("central redaction removes generated auth, setup, and database values", () => {
  const secrets = {
    email: "acceptance.unique@example.invalid",
    password: "Strong!GeneratedPassword42",
    setupToken: "setup-token-generated-1234567890",
    bearer: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.signature",
    databaseUrl: "postgresql://user:pass@localhost:5432/darfus_erp"
  };
  const redacted = redactString(`email=${secrets.email} password=${secrets.password} token=${secrets.setupToken} Authorization: Bearer ${secrets.bearer} ${secrets.databaseUrl}`);
  for (const value of Object.values(secrets)) assert.equal(redacted.includes(value), false);
  const jsonRedacted = redactString(JSON.stringify({ email: secrets.email, password: secrets.password, token: secrets.setupToken }));
  for (const value of [secrets.email, secrets.password, secrets.setupToken]) assert.equal(jsonRedacted.includes(value), false);
  const metadata = redactValue({ email: secrets.email, password: secrets.password, authorization: `Bearer ${secrets.bearer}`, nested: { token: secrets.setupToken } });
  assert.deepEqual(metadata, { email: "[REDACTED]", password: "[REDACTED]", authorization: "[REDACTED]", nested: { token: "[REDACTED]" } });
});

test("safe query metadata retains only operation, target, and duration", () => {
  const email = "acceptance.unique@example.invalid";
  const metadata = queryMetadata(`Executing (default): SELECT * FROM "users" WHERE "email" = '${email}'`, 12.6);
  assert.deepEqual(metadata, { operation: "SELECT", target: "users", durationMs: 13 });
  assert.equal(JSON.stringify(metadata).includes(email), false);
});
