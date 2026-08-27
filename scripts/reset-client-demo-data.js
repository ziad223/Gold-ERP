#!/usr/bin/env node
"use strict";

/**
 * Phase 32.4-Fix — GUARDED client-demo data reset.
 *
 * This script NEVER resets a database unless a dedicated, disposable demo/
 * development database is positively verified AND the operator has explicitly
 * opted in. It refuses (exit non-zero) on any safety failure and prints a masked
 * plan only. It never prints passwords or full connection strings, never changes
 * production configuration, and never runs against production or a shared DB.
 *
 * Required opt-in (ALL must be present and valid):
 *   ALLOW_CLIENT_DEMO_RESET=true
 *   RESET_TARGET=demo
 *   CONFIRM_DATABASE_NAME=<exact effective DB name, and it must be a dedicated
 *                          demo database name>
 *
 * Safe order once gated: backup -> (re)create dedicated demo DB -> migrate from
 * zero -> deterministic client-demo seeds -> keep backup until verified.
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");

// Load backend env first (authoritative for DB), then root as fallback. Never
// print secrets read from these.
try { require(path.join(BACKEND, "node_modules", "dotenv")).config({ path: path.join(BACKEND, ".env") }); } catch { /* optional */ }
try { require("dotenv").config({ path: path.join(BACKEND, ".env") }); } catch { /* optional */ }
try { require("dotenv").config({ path: path.join(ROOT, ".env") }); } catch { /* optional */ }

// ── Effective (masked) database identity ─────────────────────────────────────
function effectiveConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    appEnv: process.env.APP_ENV || process.env.NODE_ENV || "development",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || "darfus_erp",
    user: process.env.DB_USER || "postgres",
    ssl: process.env.DB_SSL === "true",
    resetTarget: process.env.RESET_TARGET || "",
    allowReset: process.env.ALLOW_CLIENT_DEMO_RESET || "",
    confirmName: process.env.CONFIRM_DATABASE_NAME || "",
    // Phase 32.4-Run — extra owner gate required to make darfus_erp eligible.
    ownerConfirmed: process.env.OWNER_CONFIRMED_DEMO_ONLY || "",
    pgContainer: process.env.PG_CONTAINER || "darfus-postgres",
  };
}

// A name is a dedicated demo DB only if it carries a clear disposable marker.
const DEMO_NAME_ALLOW = /^(darfus_client_demo|darfus_demo|darfus_dev_demo|[a-z0-9_]*_(client_demo|dev_demo|demo))$/i;
const PROD_NAME_REJECT = /prod|production|live|staging|shared|main|master/i;
// Reject any remote/managed provider host (Render, Supabase, Neon, Railway, AWS,
// Azure, GCP, …) in addition to production-like names.
const PROD_HOST_REJECT = /prod|production|\.rds\.amazonaws\.|amazonaws|\.azure|\.gcp|\.googleapis|render\.com|supabase|neon\.tech|railway|\.db\.|live|staging/i;
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|::1)$/i;

// Phase 32.4-Run — owner explicitly confirmed the LOCAL `darfus_erp` is demo-only
// and disposable. It becomes eligible ONLY under the full owner gate below; it is
// never generally eligible. The dedicated demo-name allowance is unchanged.
const OWNER_CONFIRMED_DB = "darfus_erp";

function classify(cfg) {
  const failures = [];
  if (String(cfg.allowReset).toLowerCase() !== "true") failures.push("ALLOW_CLIENT_DEMO_RESET is not 'true'");
  if (String(cfg.resetTarget).toLowerCase() !== "demo") failures.push("RESET_TARGET is not 'demo'");
  if (["production", "prod", "staging"].includes(String(cfg.nodeEnv).toLowerCase())) failures.push(`NODE_ENV='${cfg.nodeEnv}' is not development/test/demo`);
  if (PROD_HOST_REJECT.test(cfg.host)) failures.push(`DB host '${cfg.host}' looks production/remote`);
  if (PROD_NAME_REJECT.test(cfg.name)) failures.push(`DB name '${cfg.name}' looks production/shared`);

  const isLocal = LOCAL_HOST.test(cfg.host);
  const ownerConfirmed = String(cfg.ownerConfirmed).toLowerCase() === "true";
  const dedicatedDemoName = DEMO_NAME_ALLOW.test(cfg.name);
  // Owner-confirmed local darfus_erp path: local host + exact name + owner flag.
  const ownerLocalPath = cfg.name === OWNER_CONFIRMED_DB && ownerConfirmed && isLocal;

  if (!dedicatedDemoName && !ownerLocalPath) {
    if (cfg.name === OWNER_CONFIRMED_DB && !ownerConfirmed) {
      failures.push(`DB name '${cfg.name}' requires OWNER_CONFIRMED_DEMO_ONLY=true to be eligible`);
    } else if (cfg.name === OWNER_CONFIRMED_DB && !isLocal) {
      failures.push(`DB name '${cfg.name}' is only eligible on a local host (localhost/127.0.0.1)`);
    } else {
      failures.push(`DB name '${cfg.name}' is not a dedicated demo database (expected e.g. darfus_client_demo)`);
    }
  }

  if (!cfg.confirmName) failures.push("CONFIRM_DATABASE_NAME is not set");
  else if (cfg.confirmName !== cfg.name) failures.push("CONFIRM_DATABASE_NAME does not exactly match the effective DB name");
  return failures;
}

function printPlan(cfg, verified) {
  console.log("── Client-demo reset plan (masked) ─────────────────────────────");
  console.log(`  NODE_ENV            : ${cfg.nodeEnv}`);
  console.log(`  APP_ENV             : ${cfg.appEnv}`);
  console.log(`  DB host             : ${cfg.host}`);
  console.log(`  DB port             : ${cfg.port}`);
  console.log(`  DB name             : ${cfg.name}`);
  console.log(`  DB user             : ${cfg.user}`);
  console.log(`  DB SSL              : ${cfg.ssl ? "on" : "off"}`);
  console.log(`  RESET_TARGET        : ${cfg.resetTarget || "(unset)"}`);
  console.log(`  ALLOW_CLIENT_DEMO_RESET : ${cfg.allowReset || "(unset)"}`);
  console.log(`  CONFIRM match       : ${cfg.confirmName && cfg.confirmName === cfg.name ? "yes" : "no"}`);
  console.log(`  OWNER_CONFIRMED_DEMO_ONLY : ${cfg.ownerConfirmed || "(unset)"}`);
  console.log(`  Local host          : ${LOCAL_HOST.test(cfg.host) ? "yes" : "no"}`);
  console.log(`  Eligible demo DB    : ${verified ? "VERIFIED" : "NOT VERIFIED"}`);
  console.log("  (passwords / connection strings are never printed)");
  console.log("────────────────────────────────────────────────────────────────");
}

function has(cmd, args) {
  try { execFileSync(cmd, args, { stdio: "ignore" }); return true; } catch { return false; }
}

// A verified backup MUST be possible before any reset. Prefer host pg_dump; fall
// back to the local Docker Postgres container. If neither is available, refuse.
function backupCapability(cfg) {
  if (has("pg_dump", ["--version"])) return "host";
  if (has("docker", ["exec", cfg.pgContainer, "pg_dump", "--version"])) return "docker";
  return null;
}

function backup(cfg, stamp, method) {
  const dir = path.join(ROOT, "backups", "client-demo", stamp);
  fs.mkdirSync(dir, { recursive: true });
  const dumpFile = path.join(dir, `${cfg.name}.sql`);
  const pgEnv = { ...process.env, PGPASSWORD: process.env.DB_PASS || process.env.DB_PASSWORD || "" };
  if (method === "docker") {
    // Dump inside the container, capture stdout to the host file (never prints secrets).
    const out = execFileSync("docker", ["exec", cfg.pgContainer, "pg_dump", "-U", cfg.user, "-d", cfg.name], { maxBuffer: 1024 * 1024 * 512 });
    fs.writeFileSync(dumpFile, out);
  } else {
    execFileSync("pg_dump", ["-h", cfg.host, "-p", String(cfg.port), "-U", cfg.user, "-d", cfg.name, "-f", dumpFile], { stdio: "inherit", env: pgEnv });
  }
  if (!fs.existsSync(dumpFile) || fs.statSync(dumpFile).size === 0) {
    throw new Error("Backup file is missing or empty — aborting before any reset.");
  }
  const uploads = path.join(BACKEND, "uploads");
  if (fs.existsSync(uploads)) {
    fs.cpSync(uploads, path.join(dir, "uploads"), { recursive: true });
  }
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({
    timestamp: stamp,
    database: cfg.name,
    gitHead: (() => { try { return execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT }).toString().trim(); } catch { return null; } })(),
    seedVersion: "client-demo-v1",
    rollback: `dropdb ${cfg.name} && createdb ${cfg.name} && psql -d ${cfg.name} -f "${dumpFile}"`,
  }, null, 2));
  return { dir, dumpFile };
}

async function runMigrationsAndSeeds(cfg) {
  const opts = { cwd: BACKEND, stdio: "inherit", env: process.env, shell: process.platform === "win32" };
  console.log("[reset] Dropping and recreating darfus_erp database via Docker...");
  execFileSync("docker", ["exec", "-t", cfg.pgContainer, "psql", "-U", cfg.user, "-d", "postgres", "-c", `DROP DATABASE IF EXISTS ${cfg.name} WITH (FORCE);`], { stdio: "inherit" });
  execFileSync("docker", ["exec", "-t", cfg.pgContainer, "psql", "-U", cfg.user, "-d", "postgres", "-c", `CREATE DATABASE ${cfg.name};`], { stdio: "inherit" });

  console.log("[reset] Running initial migrations up to installment type...");
  execFileSync("npx", ["sequelize", "db:migrate", "--to", "20260619070000-add-invoice-type-installment.js"], opts);

  console.log("[reset] Syncing Product and StockMovement models...");
  const models = require("../backend/src/models");
  await models.Product.sync();
  await models.StockMovement.sync();

  console.log("[reset] Running remaining migrations...");
  execFileSync("npx", ["sequelize", "db:migrate"], opts);

  console.log("[reset] Running seeders...");
  execFileSync("npx", ["sequelize", "db:seed:all"], opts);
  const seed = path.join(BACKEND, "seeders", "client-demo", "index.js");
  if (fs.existsSync(seed)) execFileSync("node", [seed], opts);
  const txSeed = path.join(BACKEND, "seeders", "client-demo", "transactional", "index.js");
  if (fs.existsSync(txSeed)) execFileSync("node", [txSeed], opts);
}

async function main() {
  const cfg = effectiveConfig();
  const failures = classify(cfg);
  const verified = failures.length === 0;
  printPlan(cfg, verified);

  if (!verified) {
    console.error("\nREFUSING to reset — the target is not a positively-verified dedicated demo database:");
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error("\nTo run a client-demo reset, point the backend at a DEDICATED disposable demo");
    console.error("database (e.g. darfus_client_demo) and set:");
    console.error("  ALLOW_CLIENT_DEMO_RESET=true RESET_TARGET=demo CONFIRM_DATABASE_NAME=<that db name>");
    console.error("Production and shared databases are never eligible.");
    process.exit(2);
  }

  // Mandatory backup capability preflight — refuse if no verified backup is
  // possible (host pg_dump or local Docker Postgres). Never reset without a backup.
  const method = backupCapability(cfg);
  if (!method) {
    console.error("\nREFUSING to reset — no backup method available (host pg_dump missing and");
    console.error("no reachable Docker Postgres container). A verified backup is mandatory.");
    process.exit(3);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  console.log(`\n✓ Gate passed. Backing up '${cfg.name}' (${method}) before reset…`);
  const { dir } = backup(cfg, stamp, method);
  console.log(`✓ Backup written to ${path.relative(ROOT, dir)} (kept until verification).`);
  console.log("Running migrations from zero + deterministic client-demo seeds…");
  await runMigrationsAndSeeds(cfg);
  console.log("\n✓ Client-demo reset complete. Run: node scripts/verify-client-demo-data.js");
}

main().catch((error) => {
  console.error(`\nReset aborted: ${error.message}`);
  process.exit(1);
});
