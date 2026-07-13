#!/usr/bin/env node
"use strict";

/**
 * Phase 32.4-Run-Hotfix B — Static Safety Verifier
 *
 * Verifies that the transactional seeder implements the required HTTP-based, in-process,
 * deterministic execution strategy, does not call direct DB models/services to write,
 * does not leak credentials, contains plan mode, and is integrated correctly.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const SEED_DIR = path.join(BACKEND, "seeders", "client-demo", "transactional");

const read = (p) => fs.readFileSync(p, "utf8");
const exists = (p) => fs.existsSync(p);

function verifyFilesExist() {
  assert.ok(exists(SEED_DIR), "transactional seed directory exists");
  assert.ok(exists(path.join(SEED_DIR, "index.js")), "index.js exists");
  assert.ok(exists(path.join(SEED_DIR, "config.js")), "config.js exists");
  assert.ok(exists(path.join(SEED_DIR, "http-client.js")), "http-client.js exists");
  assert.ok(exists(path.join(SEED_DIR, "context.js")), "context.js exists");
  assert.ok(exists(path.join(SEED_DIR, "flow-runner.js")), "flow-runner.js exists");
  assert.ok(exists(path.join(SEED_DIR, "verification-manifest.js")), "verification-manifest.js exists");
}

function verifyConstraints() {
  const indexSrc = read(path.join(SEED_DIR, "index.js"));
  const clientSrc = read(path.join(SEED_DIR, "http-client.js"));
  const runnerSrc = read(path.join(SEED_DIR, "flow-runner.js"));
  const configSrc = read(path.join(SEED_DIR, "config.js"));

  // Version constraint
  assert.ok(configSrc.includes("client-demo-transactions-v1"), "config.js must contain version client-demo-transactions-v1");

  // In-process server / port 0 constraint
  assert.ok(clientSrc.includes("app.listen(0"), "http-client.js must listen on ephemeral port 0");
  assert.ok(clientSrc.includes("127.0.0.1"), "http-client.js must bind only to localhost/127.0.0.1");
  assert.ok(!clientSrc.includes("0.0.0.0"), "http-client.js must not bind to public 0.0.0.0");

  // No hardcoded production/remote URL constraints
  const urlRegex = /https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:render\.com|supabase|neon\.tech|railway|aws|amazonaws|gcp)/i;
  assert.ok(!clientSrc.match(urlRegex), "http-client.js must not refer to production/remote URLs");
  assert.ok(!runnerSrc.match(urlRegex), "flow-runner.js must not refer to production/remote URLs");
  assert.ok(!indexSrc.match(urlRegex), "index.js must not refer to production/remote URLs");

  // Real route auth login route
  assert.ok(clientSrc.includes("/api/v1/auth/login"), "http-client.js must use real login endpoint");

  // No bypasses
  assert.ok(!clientSrc.includes("req.user ="), "http-client.js must not bypass auth middleware by setting req.user");
  assert.ok(!runnerSrc.includes("req.user ="), "flow-runner.js must not bypass auth middleware by setting req.user");

  // JWT/passwords logging constraint
  assert.ok(!clientSrc.includes("console.log(authToken)") && !clientSrc.includes("console.log(payload.password)"), "http-client.js must not log JWT/passwords");
  assert.ok(!runnerSrc.includes("console.log(authToken)"), "flow-runner.js must not log JWT/passwords");

  // Plan Mode constraints
  assert.ok(indexSrc.includes("--plan"), "index.js must handle plan mode option");
  assert.ok(indexSrc.includes("PLAN_METADATA"), "index.js must define plan metadata list");
  assert.ok(indexSrc.includes("process.exit(0)"), "index.js plan mode must exit successfully");

  // Dependency runner constraints
  assert.ok(runnerSrc.includes("FLOWS ="), "flow-runner.js must define ordered flow scenarios");
  assert.ok(runnerSrc.includes("stopServer"), "flow-runner.js must call stopServer");
  assert.ok(clientSrc.includes("server.close("), "http-client.js must clean up Express server via server.close");

  // No direct DB mutations / creates on transactions inside seeders folder
  const flowsDir = path.join(SEED_DIR, "flows");
  assert.ok(exists(flowsDir), "flows directory exists");
  const flowFiles = fs.readdirSync(flowsDir);
  assert.ok(flowFiles.length >= 14, "should cover all 14 scenarios");

  flowFiles.forEach((file) => {
    const filePath = path.join(flowsDir, file);
    const flowSrc = read(filePath);

    // Direct Model insertion guards
    const dbMutationRegex = /\.(?:bulkCreate|bulkInsert|create|insert)\s*\(\s*(?:['"`]?invoices|['"`]?payments|['"`]?installments|['"`]?returns|['"`]?exchanges|['"`]?treasury|['"`]?journal_entries|['"`]?journal_lines|['"`]?stock_movements|['"`]?customer_credit_transactions|['"`]?customer_gold_pools|invoices|payments|installments|returns|exchanges|treasury|journalLines|journalEntries|stockMovements|customerCreditTransactions|customerGoldPools)/i;
    assert.ok(!flowSrc.match(dbMutationRegex), `Flow file ${file} must not directly call create/bulkCreate on transactional DB tables`);

    // No direct domain service call check
    const bypassServiceRegex = /(?:postingService|journalService|customerCreditService)\.(?:postEntry|createManualDraft|postManualDraft|reverseManualEntry|recordCreditIn)/i;
    assert.ok(!flowSrc.match(bypassServiceRegex), `Flow file ${file} must not directly call posting/journal/credit services to write`);

    // Idempotency keys must be deterministic
    if (file !== "08-customer-gold.js" && file !== "10-manual-journal-cycle.js" && file !== "11-gift-voucher-cycle.js") {
      assert.ok(flowSrc.includes("deterministicUuid"), `Flow file ${file} must use deterministicUuid for idempotency keys`);
    }

    // Must check response status and capture dynamic response IDs
    assert.ok(flowSrc.includes(".status") && flowSrc.includes(".data"), `Flow file ${file} must validate HTTP status and inspect response data`);

    // Verify all endpoint paths start with /api/v1 or /api
    const pathRegex = /client\.request\(\s*['"`][A-Z]+['"`]\s*,\s*['"``]([^\s'"``]+)/g;
    let match;
    while ((match = pathRegex.exec(flowSrc)) !== null) {
      const pathUsed = match[1];
      assert.ok(pathUsed.startsWith("/api/v1/") || pathUsed.startsWith("/api/"), `Flow file ${file} uses endpoint path '${pathUsed}' which does not start with /api/v1 or /api`);
    }
  });

  // Verification that existing inventory seeder is unchanged
  const invSeederPath = path.join(BACKEND, "seeders", "client-demo", "index.js");
  const invSeederSrc = read(invSeederPath);
  assert.ok(invSeederSrc.includes("client-demo-v1"), "inventory seeder still available and untouched");
  assert.ok(!invSeederSrc.includes("pos/checkout") && !invSeederSrc.includes("fetch("), "inventory seeder is not contaminated with HTTP transaction logic");

  // Verification of reset script integration
  const resetScriptSrc = read(path.join(ROOT, "scripts", "reset-client-demo-data.js"));
  assert.ok(resetScriptSrc.includes("transactional"), "reset script integrated transactional seeder");
}

function verifyHandoffDocs() {
  const handoff = read(path.join(ROOT, "docs", "AI_HANDOFF.md"));
  const scopeLock = read(path.join(ROOT, "docs", "CLIENT_SCOPE_LOCK.md"));

  assert.ok(handoff.includes("Phase 32.4-Run-Hotfix B"), "AI_HANDOFF.md documents Hotfix B");
  assert.ok(scopeLock.includes("Phase 32.4-Run-Hotfix B"), "CLIENT_SCOPE_LOCK.md documents Hotfix B");
}

(function main() {
  console.log("[Verifier] Running static verification checks...");
  verifyFilesExist();
  verifyConstraints();
  verifyHandoffDocs();
  console.log("[Verifier] ✓ Static checks passed successfully.");
})();
