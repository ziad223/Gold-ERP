"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ADOPTED = Object.freeze({
  hosts: new Set(["localhost", "127.0.0.1", "::1"]),
  port: "5432",
  database: "darfus_erp",
});
const WRITE_CLASSES = new Set(["V2_WRITE_ROLLBACK", "V3_WRITE_CLEANUP", "V4_EXISTING_DATA_MUTATION"]);
const FIXTURE_CLASSES = new Set(["V2_WRITE_ROLLBACK", "V3_WRITE_CLEANUP", "V4_EXISTING_DATA_MUTATION"]);
const BACKUP_ROOT = path.resolve(__dirname, "..", "..", "backend", "backups");

function fail(code, message) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  throw error;
}

function value(env, key) {
  return String(env[key] || "").trim();
}

function isTrue(env, key) {
  return value(env, key) === "true";
}

function assertDatabaseUrl(env, host, port, database) {
  const raw = value(env, "DATABASE_URL");
  if (!raw) return;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    fail("VERIFY_DATABASE_URL_INVALID", "DATABASE_URL must be a valid PostgreSQL URL when present");
  }
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol)) {
    fail("VERIFY_DATABASE_URL_INVALID", "DATABASE_URL must use PostgreSQL");
  }
  if (parsed.hostname !== host || parsed.port !== port || parsed.pathname !== `/${database}`) {
    fail("VERIFY_DATABASE_URL_MISMATCH", "DATABASE_URL must exactly match the approved verifier target");
  }
}

function assertBackup(env) {
  const supplied = value(env, "VERIFY_BACKUP_PATH");
  if (!supplied) fail("VERIFY_BACKUP_REQUIRED", "write-capable verification requires VERIFY_BACKUP_PATH");
  const backup = path.resolve(supplied);
  const relative = path.relative(BACKUP_ROOT, backup);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail("VERIFY_BACKUP_OUTSIDE_LOCAL_STORE", "backup must be stored under backend/backups");
  }
  if (!/\.(dump|backup)$/i.test(backup)) {
    fail("VERIFY_BACKUP_EXTENSION_INVALID", "backup must have a .dump or .backup extension");
  }
  let stat;
  try {
    stat = fs.statSync(backup);
  } catch {
    fail("VERIFY_BACKUP_MISSING", "VERIFY_BACKUP_PATH does not exist");
  }
  if (!stat.isFile() || stat.size <= 0) fail("VERIFY_BACKUP_INVALID", "backup must be a non-empty regular file");
  const listed = spawnSync("pg_restore", ["-l", backup], { encoding: "utf8", windowsHide: true });
  if (listed.error || listed.status !== 0) fail("VERIFY_BACKUP_INVALID", "backup must be readable by pg_restore");
  return backup;
}

function assertAdoptedLocalDatabase({ riskClass, env = process.env, requireLive = true } = {}) {
  if (!riskClass) fail("VERIFY_RISK_CLASS_REQUIRED", "a verifier must declare its risk class");
  if (riskClass === "V0_STATIC") return Object.freeze({ riskClass, mode: "static", fixturePrefix: null, backupPath: null });
  if (riskClass === "V5_DESTRUCTIVE") {
    fail("VERIFY_DESTRUCTIVE_SHARED_DATABASE_FORBIDDEN", "V5 destructive verification is forbidden against darfus_erp");
  }
  if (riskClass === "V4_EXISTING_DATA_MUTATION") {
    fail("VERIFY_EXISTING_DATA_MUTATION_SHARED_DATABASE_FORBIDDEN", "V4 verification is blocked against the shared adopted database");
  }
  if (["production", "staging"].includes(value(env, "NODE_ENV").toLowerCase()) || value(env, "RENDER") || value(env, "VERCEL")) {
    fail("VERIFY_PRODUCTION_FORBIDDEN", "verification refuses production, staging, Render, and Vercel environments");
  }
  if (!isTrue(env, "VERIFY_LOCAL_DATABASE")) fail("VERIFY_LOCAL_DATABASE_CONFIRMATION_REQUIRED", "set VERIFY_LOCAL_DATABASE=true");
  if (!isTrue(env, "OWNER_CONFIRMED_TEST_DATABASE")) fail("VERIFY_OWNER_CONFIRMATION_REQUIRED", "set OWNER_CONFIRMED_TEST_DATABASE=true");
  if (requireLive && !isTrue(env, "VERIFY_LIVE_DATABASE")) fail("VERIFY_LIVE_MODE_CONFIRMATION_REQUIRED", "set VERIFY_LIVE_DATABASE=true");

  const host = value(env, "VERIFY_DATABASE_HOST");
  const port = value(env, "VERIFY_DATABASE_PORT");
  const database = value(env, "VERIFY_DATABASE_NAME");
  if (!ADOPTED.hosts.has(host)) fail("VERIFY_DATABASE_HOST_REJECTED", "VERIFY_DATABASE_HOST must be localhost, 127.0.0.1, or ::1");
  if (port !== ADOPTED.port) fail("VERIFY_DATABASE_PORT_REJECTED", "VERIFY_DATABASE_PORT must be 5432");
  if (database !== ADOPTED.database) fail("VERIFY_DATABASE_NAME_REJECTED", "VERIFY_DATABASE_NAME must be darfus_erp");
  if (value(env, "DB_HOST") !== host || value(env, "DB_PORT") !== port || value(env, "DB_NAME") !== database) {
    fail("VERIFY_DATABASE_IDENTITY_MISMATCH", "DB_HOST, DB_PORT, and DB_NAME must exactly match VERIFY_DATABASE_*");
  }
  assertDatabaseUrl(env, host, port, database);

  const runId = value(env, "VERIFY_RUN_ID");
  if (FIXTURE_CLASSES.has(riskClass) && !/^[A-Za-z0-9][A-Za-z0-9._-]{5,96}$/.test(runId)) {
    fail("VERIFY_RUN_ID_REQUIRED", "write-capable verification requires a safe unique VERIFY_RUN_ID");
  }
  const backupPath = WRITE_CLASSES.has(riskClass) ? assertBackup(env) : null;
  return Object.freeze({ riskClass, mode: "live", host, port, database, runId, fixturePrefix: runId ? `VERIFY-${runId}` : null, backupPath });
}

module.exports = { ADOPTED, assertAdoptedLocalDatabase };
