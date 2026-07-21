"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { assertAdoptedLocalDatabase } = require("./verify-local-database-guard");

function expectCode(code, options) {
  assert.throws(() => assertAdoptedLocalDatabase(options), (error) => error.code === code, code);
}

const base = {
  NODE_ENV: "test",
  VERIFY_LOCAL_DATABASE: "true",
  OWNER_CONFIRMED_TEST_DATABASE: "true",
  VERIFY_LIVE_DATABASE: "true",
  VERIFY_DATABASE_HOST: "127.0.0.1",
  VERIFY_DATABASE_PORT: "5432",
  VERIFY_DATABASE_NAME: "darfus_erp",
  DB_HOST: "127.0.0.1",
  DB_PORT: "5432",
  DB_NAME: "darfus_erp",
  VERIFY_RUN_ID: "guard-test-001",
};

assert.equal(assertAdoptedLocalDatabase({ riskClass: "V0_STATIC", env: {} }).mode, "static");
for (const [code, patch] of [
  ["VERIFY_DATABASE_HOST_REJECTED", { VERIFY_DATABASE_HOST: "db.example.test", DB_HOST: "db.example.test" }],
  ["VERIFY_PRODUCTION_FORBIDDEN", { NODE_ENV: "production" }],
  ["VERIFY_DATABASE_NAME_REJECTED", { VERIFY_DATABASE_NAME: "wrong", DB_NAME: "wrong" }],
  ["VERIFY_DATABASE_PORT_REJECTED", { VERIFY_DATABASE_PORT: "5433", DB_PORT: "5433" }],
  ["VERIFY_PRODUCTION_FORBIDDEN", { NODE_ENV: "staging" }],
  ["VERIFY_OWNER_CONFIRMATION_REQUIRED", { OWNER_CONFIRMED_TEST_DATABASE: "false" }],
  ["VERIFY_LIVE_MODE_CONFIRMATION_REQUIRED", { VERIFY_LIVE_DATABASE: "false" }],
  ["VERIFY_BACKUP_REQUIRED", {}],
  ["VERIFY_RUN_ID_REQUIRED", { VERIFY_RUN_ID: "" }],
]) {
  expectCode(code, { riskClass: code === "VERIFY_RUN_ID_REQUIRED" ? "V3_WRITE_CLEANUP" : "V2_WRITE_ROLLBACK", env: { ...base, ...patch } });
}
expectCode("VERIFY_DESTRUCTIVE_SHARED_DATABASE_FORBIDDEN", { riskClass: "V5_DESTRUCTIVE", env: base });
expectCode("VERIFY_EXISTING_DATA_MUTATION_SHARED_DATABASE_FORBIDDEN", { riskClass: "V4_EXISTING_DATA_MUTATION", env: base });
const emptyBackup = path.resolve(__dirname, "..", "..", "backend", "backups", `verify-guard-empty-${process.pid}.dump`);
fs.writeFileSync(emptyBackup, "");
expectCode("VERIFY_BACKUP_INVALID", { riskClass: "V2_WRITE_ROLLBACK", env: { ...base, VERIFY_BACKUP_PATH: emptyBackup } });
fs.unlinkSync(emptyBackup);
const invalidBackup = path.resolve(__dirname, "..", "..", "backend", "backups", `verify-guard-invalid-${process.pid}.dump`);
fs.writeFileSync(invalidBackup, "not a PostgreSQL archive");
expectCode("VERIFY_BACKUP_INVALID", { riskClass: "V2_WRITE_ROLLBACK", env: { ...base, VERIFY_BACKUP_PATH: invalidBackup } });
fs.unlinkSync(invalidBackup);
console.log("LOCAL DATABASE VERIFIER GUARD PASSED");
