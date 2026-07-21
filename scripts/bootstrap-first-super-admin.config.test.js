"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { resolveBootstrapDatabaseTarget } = require("./bootstrap-first-super-admin");

const source = fs.readFileSync(path.join(__dirname, "bootstrap-first-super-admin.js"), "utf8");
assert.ok(!source.includes('"5433"') && !source.includes("'5433'"), "no executable 5433 default remains");
assert.ok(!source.includes("darfus_erp_branch1_qa"), "no obsolete QA database default remains");
assert.deepEqual(resolveBootstrapDatabaseTarget({ NODE_ENV: "development", DB_HOST: "::1", DB_PORT: "5432", DB_NAME: "darfus_erp", DB_USER: "test", DB_PASSWORD: "test" }), { environment: "development", host: "::1", port: 5432, database: "darfus_erp", ssl: false });
for (const environment of ["production", "staging"]) assert.throws(() => resolveBootstrapDatabaseTarget({ NODE_ENV: environment }), (error) => error.message.startsWith("CONFIG_ERROR"));
assert.throws(() => resolveBootstrapDatabaseTarget({ NODE_ENV: "development", DATABASE_URL: "postgres://safe:safe@localhost:5432/darfus_erp", DB_HOST: "::1", DB_PORT: "5432", DB_NAME: "darfus_erp" }), (error) => error.message.startsWith("CONFIG_ERROR") && !error.message.includes("safe:safe"));
assert.throws(() => resolveBootstrapDatabaseTarget({ NODE_ENV: "production", DATABASE_URL: "postgres://safe:safe@localhost:5432/darfus_erp", DB_HOST: "localhost", DB_PORT: "5432", DB_NAME: "darfus_erp", DB_SSL: "false" }), (error) => error.message === "BOOTSTRAP_LOCAL_DATABASE_REQUIRED");
console.log("BOOTSTRAP DATABASE ENV CONTRACT PASSED");
