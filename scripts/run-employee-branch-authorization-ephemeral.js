#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { Client } = require(path.join(__dirname, "..", "backend", "node_modules", "pg"));

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
process.chdir(BACKEND);
require(path.join(BACKEND, "node_modules", "dotenv")).config({ path: path.join(BACKEND, ".env") });
const { resolveDatabaseEnv } = require(path.join(BACKEND, "src", "config", "database-env"));

const source = resolveDatabaseEnv();
const name = `darfus_erp_authorization_fix_cont1_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`.toLowerCase();
if (!/^darfus_erp_authorization_fix_cont1_[a-z0-9_]+$/.test(name) || name === "darfus_erp") throw new Error("Unsafe disposable database name.");

function connectionFor(database) {
  if (source.connectionString) {
    const url = new URL(source.connectionString);
    url.pathname = `/${database}`;
    return { connectionString: url.toString(), ...(source.ssl ? { ssl: { rejectUnauthorized: false } } : {}) };
  }
  return { host: source.host, port: source.port, user: source.username, password: source.password, database, ...(source.ssl ? { ssl: { rejectUnauthorized: false } } : {}) };
}

function disposableUrl() {
  if (source.connectionString) {
    const url = new URL(source.connectionString);
    url.pathname = `/${name}`;
    return url.toString();
  }
  const url = new URL("postgres://localhost");
  url.username = source.username || "";
  url.password = source.password || "";
  url.hostname = source.host;
  url.port = String(source.port);
  url.pathname = `/${name}`;
  return url.toString();
}

function run(command, args, env) {
  const result = spawnSync(command, args, { cwd: BACKEND, env, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "isolated verification command failed");
  return result;
}

(async () => {
  const admin = new Client(connectionFor("postgres"));
  let created = false;
  try {
    await admin.connect();
    const existing = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (existing.rowCount) throw new Error("Disposable database already exists.");
    await admin.query(`CREATE DATABASE ${name}`);
    created = true;
    const targetUrl = disposableUrl();
    const parsedTarget = new URL(targetUrl);
    const env = {
      ...process.env,
      DATABASE_URL: targetUrl,
      DB_HOST: parsedTarget.hostname,
      DB_PORT: parsedTarget.port || "5432",
      DB_NAME: name,
    };
    run(process.execPath, [path.join(BACKEND, "node_modules", "sequelize-cli", "lib", "sequelize"), "db:migrate"], env);
    run(process.execPath, [path.join(ROOT, "scripts", "verify-employee-branch-authorization-lifecycle.js")], {
      ...env,
      VERIFY_EMPLOYEE_BRANCH_AUTHORIZATION_EPHEMERAL: "true",
    });
    console.log("EMPLOYEE_BRANCH_AUTHORIZATION_EPHEMERAL = PASS");
    console.log("EMPLOYEE_BRANCH_AUTHORIZATION_EPHEMERAL_CLEANUP = PASS");
  } finally {
    if (created) {
      await admin.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()", [name]);
      await admin.query(`DROP DATABASE IF EXISTS ${name}`);
    }
    await admin.end().catch(() => {});
  }
})().catch((error) => {
  console.error(error.message || "employee Branch isolated acceptance failed");
  process.exit(1);
});
