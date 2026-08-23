#!/usr/bin/env node
"use strict";

/**
 * Phase 32.4-Fix — verify the guarded client-demo reset tooling, and (only when a
 * positively-verified demo database is present + opted-in) the seeded data.
 *
 * Static/safety checks always run. Live data checks use a separate, read-only
 * verification opt-in; destructive reset authorization is never required.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
// Phase 32.5-Client-Confirmation-Hotfix — the historical Phase 32.4-Run-C
// baseline is no longer a permanent default. Default mode inspects only the
// CURRENT working tree; the frozen baseline below is used ONLY when historical
// scope-audit mode is explicitly requested via VERIFY_CLIENT_DEMO_SCOPE_BASELINE.
const HISTORICAL_SCOPE_BASELINE = "02f870a";
const SCOPE_BASELINE_ENV = "VERIFY_CLIENT_DEMO_SCOPE_BASELINE";
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");
const exists = (rel) => fs.existsSync(path.resolve(ROOT, rel));
const gitLines = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

const RESET = "scripts/reset-client-demo-data.js";
const MIGRATION = "backend/migrations/20260710000000-barcode-inventory-foundation.js";
const CUSTOMER_PAGE = "app/[locale]/(dashboard)/customers/[id]/page.tsx";

// ── (A) Guard script implements the required safety gates ────────────────────
function guardScript() {
  assert.ok(exists(RESET), "reset guard script exists");
  const src = read(RESET);
  for (const token of [
    "ALLOW_CLIENT_DEMO_RESET",
    "RESET_TARGET",
    "CONFIRM_DATABASE_NAME",
    "REFUSING",
  ]) assert.ok(src.includes(token), `reset guard enforces ${token}`);
  assert.ok(/DEMO_NAME_ALLOW/.test(src) && /darfus_client_demo/.test(src), "reset guard requires a dedicated demo DB name allow-rule");
  assert.ok(/PROD_NAME_REJECT|PROD_HOST_REJECT/.test(src), "reset guard rejects production-like hosts/names");
  assert.ok(/process\.exit\(\s*[123]\s*\)/.test(src), "reset guard exits non-zero on any safety failure");
  assert.ok(src.includes("pg_dump"), "reset guard backs up before any reset");
  assert.ok(!/console\.(log|error)\([^;]*process\.env\.(DB_PASS|DB_PASSWORD|DATABASE_URL)/.test(src), "reset guard never prints secret values");
  // Phase 32.4-Run — owner-confirmation gate for the local darfus_erp target.
  assert.ok(src.includes("OWNER_CONFIRMED_DEMO_ONLY"), "reset guard requires OWNER_CONFIRMED_DEMO_ONLY for darfus_erp");
  assert.ok(/OWNER_CONFIRMED_DB\s*=\s*"darfus_erp"|darfus_erp/.test(src) && /ownerLocalPath|owner-confirmed/i.test(src), "reset guard gates darfus_erp behind owner confirmation + local host");
  assert.ok(/LOCAL_HOST/.test(src) && /localhost|127\.0\.0\.1/.test(src), "reset guard requires a local host for the owner-confirmed target");
  assert.ok(/render\.com|supabase|neon\.tech|railway|amazonaws/i.test(src), "reset guard rejects remote/managed provider hosts");
  assert.ok(/backupCapability|no backup method/i.test(src), "reset guard refuses when no verified backup method is available");
}

// ── (B) Migration + docs + package + hidden diagnostics ──────────────────────
function foundationAndDocs() {
  assert.ok(exists(MIGRATION), "barcode/inventory foundation migration exists");
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["verify:client-demo-data"], "node scripts/verify-client-demo-data.js", "verify script registered");
  assert.equal(pkg.scripts["demo:reset:client"], "node scripts/reset-client-demo-data.js", "reset script registered");
  assert.equal(pkg.scripts["seed:client-demo:transactions"], "node backend/seeders/client-demo/transactional/index.js", "transactional seed script registered");
  assert.equal(pkg.scripts["seed:client-demo:transactions:plan"], "node backend/seeders/client-demo/transactional/index.js --plan", "transactional seed plan script registered");
  assert.equal(pkg.scripts["verify:client-demo:transactions"], "node scripts/verify-client-demo-transactional-seeds.js", "transactional seed verification script registered");
  for (const doc of ["docs/AI_HANDOFF.md", "docs/CLIENT_SCOPE_LOCK.md"]) {
    assert.ok(read(doc).includes("Phase 32.4"), `${doc} documents Phase 32.4`);
    assert.ok(/production reset[\s\S]{0,40}forbidden/i.test(read(doc)), `${doc} states production reset is forbidden`);
  }
  assert.ok(/const\s+SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS\s*=\s*false\s*;/.test(read(CUSTOMER_PAGE)), "statement-v3 / credit reconciliation stay hidden");
}

// The Phase 32.4-Run-C hotfix scope (used ONLY in explicit historical scope mode).
const ALLOWED_SCOPE_FILES = new Set([
  "backend/src/services/posting.service.js",
  "backend/src/routes/erp.routes.js",
  "backend/seeders/client-demo/transactional/flows/06-sales-exchange.js",
  "scripts/verify-client-demo-data.js",
  "scripts/verify-deposit-posting-reconciliation.js",
  "scripts/verify-barcode-inventory-foundation.js",
  "scripts/verify-barcode-tag-print-layouts.js",
  "scripts/verify-inventory-item-type-forms.js",
  "scripts/verify-invoices-search-print.js",
  "package.json",
  "docs/AI_HANDOFF.md",
  "docs/CLIENT_SCOPE_LOCK.md",
]);

function isValidGitRef(ref) {
  try {
    execFileSync("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], { cwd: ROOT, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Scan any changed CODE files for forbidden e-invoicing (baseline-independent).
function assertNoUaeInChanged(files) {
  const codeFiles = files.filter((f) => /^(app|components|features|lib|backend)\//.test(f) && exists(f));
  const code = codeFiles.map((f) => read(f)).join("\n");
  assert.ok(!/UAE\s+(?:Government\s+)?E-Invoicing|\bUBL\b/i.test(code), "no UAE E-Invoicing code added");
}

// ── (C) Scope guard ──────────────────────────────────────────────────────────
// Default (global-suite) mode inspects only the CURRENT uncommitted working tree,
// so legitimate committed files from later approved phases never cause a false
// failure. Explicit historical scope-audit mode is opt-in via
// VERIFY_CLIENT_DEMO_SCOPE_BASELINE=<git-ref>; only then is the phase-scoped
// allow-list enforced against that baseline.
function scopeGuard() {
  const baseline = (process.env[SCOPE_BASELINE_ENV] || "").trim();

  if (baseline) {
    if (!isValidGitRef(baseline)) {
      throw new Error(`${SCOPE_BASELINE_ENV}='${baseline}' is not a valid git ref — historical scope mode aborted`);
    }
    console.log(`verify-client-demo-data: HISTORICAL SCOPE MODE — baseline ${baseline}`);
    const changed = gitLines(["diff", "--name-only", baseline]);
    const untracked = gitLines(["ls-files", "--others", "--exclude-standard"]);
    const allChanged = [...new Set([...changed, ...untracked].map((f) => f.replace(/\\/g, "/")))];
    const unexpected = allChanged.filter((f) => !ALLOWED_SCOPE_FILES.has(f));
    assert.deepEqual(unexpected, [], `scope-audit: files outside the allow-list changed since ${baseline} (found: ${unexpected.join(", ")})`);
    const deleted = gitLines(["diff", "--name-status", baseline]).filter((l) => l.startsWith("D\t")).map((l) => l.slice(2));
    assert.deepEqual(deleted, [], `scope-audit: no file deleted since ${baseline} (found: ${deleted.join(", ")})`);
    assertNoUaeInChanged(allChanged);
    return;
  }

  // Default mode: current working tree only — never re-litigates committed history
  // (the frozen ${HISTORICAL_SCOPE_BASELINE} is not used here). Detects unexpected
  // uncommitted changes for the forbidden-code scan; a clean tree passes.
  const staged = gitLines(["diff", "--name-only", "--cached"]);
  const unstaged = gitLines(["diff", "--name-only"]);
  const untracked = gitLines(["ls-files", "--others", "--exclude-standard"]);
  const dirty = [...new Set([...staged, ...unstaged, ...untracked].map((f) => f.replace(/\\/g, "/")))]
    .filter((f) => f !== "next-env.d.ts"); // generated artifact
  assertNoUaeInChanged(dirty);
}

// Load dotenv authoritative for DB from backend
try {
  require(path.join(ROOT, "backend", "node_modules", "dotenv")).config({ path: path.join(ROOT, "backend", ".env") });
} catch (e) {}

// ── (D) Live data checks — separate read-only verification gate ───────────────
async function liveChecks() {
  const name = process.env.DB_NAME || "darfus_erp";
  const liveRequested = String(process.env.VERIFY_CLIENT_DEMO_LIVE).toLowerCase() === "true";
  const verifyName = String(process.env.VERIFY_DATABASE_NAME || "").trim();
  const host = process.env.DB_HOST || "localhost";
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);
  const safeEnvironment = ["development", "test", "demo"].includes(String(process.env.NODE_ENV || "development").toLowerCase());

  if (!liveRequested) {
    console.log("verify-client-demo-data: STATIC ONLY — LIVE DATA NOT VERIFIED.");
    return false;
  }

  assert.ok(safeEnvironment, "live verification requires development, test, or demo NODE_ENV");
  assert.equal(verifyName, name, "VERIFY_DATABASE_NAME must exactly match DB_NAME");
  assert.ok(verifyName, "VERIFY_DATABASE_NAME is required for live verification");
  assert.ok(isLocal, "live verification requires a localhost database host");

  console.log("verify-client-demo-data: LIVE DATA CHECKS EXECUTED");
  console.log("verify-client-demo-data: Read-only local environment classification passed.");

  const { Client } = require(path.join(ROOT, "backend", "node_modules", "pg"));
  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || "postgres",
    database: name,
  });

  await client.connect();

  try {
    // 1. Verify required tables and data counts
    const tables = ["assets", "invoices", "payments", "installments", "journal_entries", "journal_lines", "cash_transactions"];
    const counts = {};
    for (const t of tables) {
      const res = await client.query(`SELECT COUNT(*)::integer as count FROM "${t}"`);
      counts[t] = res.rows[0].count;
    }

    assert.ok(counts.assets >= 20, `Expected at least 20 assets, found ${counts.assets}`);
    assert.ok(counts.invoices >= 12, `Expected at least 12 invoices, found ${counts.invoices}`);
    assert.ok(counts.payments >= 7, `Expected at least 7 payments, found ${counts.payments}`);
    assert.ok(counts.installments >= 6, `Expected at least 6 installments, found ${counts.installments}`);
    assert.ok(counts.journal_entries >= 26, `Expected at least 26 journal entries, found ${counts.journal_entries}`);
    assert.ok(counts.journal_lines >= 73, `Expected at least 73 journal lines, found ${counts.journal_lines}`);
    assert.ok(counts.cash_transactions >= 14, `Expected at least 14 cash transactions, found ${counts.cash_transactions}`);

    console.log("verify-client-demo-data: Required data found.");

    // 2. Verify active inventory codes
    const invCodesRes = await client.query('SELECT code FROM barcode_inventory_codes WHERE is_active = true');
    const invCodes = invCodesRes.rows.map(r => r.code);
    const expectedInvCodes = ["GW", "GP", "DD", "GS", "PL", "WT"];
    for (const c of expectedInvCodes) {
      assert.ok(invCodes.includes(c), `Expected active inventory code ${c} to exist`);
    }

    // 3. Verify item codes
    const itemCodesRes = await client.query('SELECT code FROM barcode_item_codes');
    const itemCodes = itemCodesRes.rows.map(r => r.code);
    assert.ok(itemCodes.includes("WCH"), "Expected item code WCH to exist");
    assert.ok(!itemCodes.includes("ERR") && !itemCodes.includes("NLC"), "ERR and NLC should not be authoritative");

    // 4. Accounting checks
    const trialBalanceRes = await client.query('SELECT SUM(debit - credit)::numeric as diff FROM journal_lines');
    const tbDiff = Math.abs(parseFloat(trialBalanceRes.rows[0].diff || "0"));
    assert.ok(tbDiff < 0.01, `Global trial-balance net is not zero: ${tbDiff}`);

    const zeroLinesRes = await client.query(`
      SELECT je.id FROM journal_entries je
      LEFT JOIN journal_lines jl ON je.id = jl.journal_entry_id
      WHERE je.status = 'posted'
      GROUP BY je.id
      HAVING COUNT(jl.id) = 0
    `);
    assert.equal(zeroLinesRes.rows.length, 0, "Found posted journal entries with zero lines");

    const scalar = async (sql, params = []) => (await client.query(sql, params)).rows[0];
    const companyId = (await scalar("SELECT company_id FROM assets WHERE company_id IS NOT NULL LIMIT 1")).company_id;
    assert.ok(companyId, "Could not resolve demo company");

    // 5. Migration, taxonomy, variants, and barcode identity checks
    const migrationRows = await client.query('SELECT name FROM "SequelizeMeta" ORDER BY name');
    const migrationFiles = fs.readdirSync(path.join(ROOT, "backend", "migrations"))
      .filter((name) => name.endsWith(".js")).sort();
    assert.equal(migrationRows.rows.length, migrationFiles.length, "Migration count mismatch");
    assert.ok(migrationRows.rows.some((row) => row.name === "20260710000000-barcode-inventory-foundation.js"), "Barcode migration is not applied");

    const invRows = await client.query("SELECT code FROM barcode_inventory_codes WHERE company_id=$1 AND is_active=true ORDER BY code", [companyId]);
    assert.deepEqual(invRows.rows.map((row) => row.code).sort(), ["DD", "GP", "GS", "GW", "PL", "WT"], "Inventory code taxonomy mismatch");
    const authoritativeItems = ["ANK", "BGL", "BAR", "BRC", "BRH", "CHN", "CHK", "CON", "CRW", "ERG", "FST", "LOS", "NCK", "PND", "PCH", "RNG", "TRN", "WRN", "WCH"];
    const itemRows = await client.query("SELECT code FROM barcode_item_codes WHERE company_id=$1 ORDER BY code", [companyId]);
    assert.deepEqual(itemRows.rows.map((row) => row.code).sort(), authoritativeItems.slice().sort(), "Item code taxonomy mismatch");
    assert.ok(!itemRows.rows.some((row) => ["ERR", "NLC", "NEC"].includes(row.code)), "Rejected item code is authoritative");

    const variantRows = await client.query("SELECT DISTINCT inventory_subtype FROM assets WHERE company_id=$1 AND inventory_subtype IS NOT NULL ORDER BY inventory_subtype", [companyId]);
    assert.deepEqual(variantRows.rows.map((row) => row.inventory_subtype), [
      "diamond-jewellery", "diamond-loose", "gemstone-jewellery", "gemstone-loose",
      "gold-piece", "gold-weight-bar", "gold-weight-jewellery", "pearl-jewellery",
      "pearl-loose", "watch",
    ], "Inventory variant coverage mismatch");
    const badBarcode = await scalar("SELECT COUNT(*)::integer AS count FROM assets WHERE company_id=$1 AND barcode IS NOT NULL AND btrim(barcode)<>'' AND barcode !~ '^[A-Z0-9]+$'", [companyId]);
    assert.equal(Number(badBarcode.count), 0, "Barcode contains separators or non-uppercase characters");
    const duplicateBarcode = await scalar("SELECT COUNT(*)::integer AS count FROM (SELECT barcode FROM assets WHERE company_id=$1 AND barcode IS NOT NULL AND btrim(barcode)<>'' GROUP BY barcode HAVING COUNT(*)>1) d", [companyId]);
    assert.equal(Number(duplicateBarcode.count), 0, "Duplicate nonblank barcode found");
    const duplicateRfid = await scalar("SELECT COUNT(*)::integer AS count FROM (SELECT rfid FROM assets WHERE company_id=$1 AND rfid IS NOT NULL AND btrim(rfid)<>'' GROUP BY rfid HAVING COUNT(*)>1) d", [companyId]);
    assert.equal(Number(duplicateRfid.count), 0, "Duplicate nonblank RFID found");
    const sequenceProof = await client.query("SELECT barcode_serial FROM assets WHERE company_id=$1 AND inventory_code='GW' AND item_code='BRC' AND karat_code='21' ORDER BY barcode_serial", [companyId]);
    assert.deepEqual(sequenceProof.rows.map((row) => Number(row.barcode_serial)), [1, 2], "Exact same-scope 000001/000002 proof missing");

    // 6. Transaction and identity checks
    assert.equal(counts.invoices, 12, "Unexpected deterministic invoice count");
    assert.equal(counts.payments, 7, "Unexpected deterministic payment count");
    const installmentState = await scalar("SELECT COUNT(*)::integer AS total, COUNT(*) FILTER (WHERE status='partial' AND paid_amount>0)::integer AS paid FROM installments");
    assert.equal(Number(installmentState.total), 6, "Installment schedule count mismatch");
    assert.equal(Number(installmentState.paid), 2, "Installment paid count mismatch");
    const returnedAsset = await scalar("SELECT status,barcode FROM assets WHERE id='AST-CD-gp'");
    assert.equal(returnedAsset.status, "returned", "Returned Asset status mismatch");
    assert.equal(returnedAsset.barcode, "GPERG21000001", "Returned Asset barcode changed");
    assert.ok(Number((await scalar("SELECT COUNT(*) AS count FROM asset_events WHERE asset_id='AST-CD-gp' AND action='RETURNED'")).count) >= 1, "Return AssetEvent missing");
    const exchangeReplacement = await scalar("SELECT a.id,a.status,a.barcode FROM invoice_items ii JOIN invoices i ON i.id=ii.invoice_id JOIN assets a ON a.id=ii.asset_id WHERE i.type='exchange' AND a.id='AST-CD-gs-jewellery'");
    assert.equal(exchangeReplacement.status, "sold", "Exchange replacement status mismatch");
    assert.equal(exchangeReplacement.barcode, "GSNCK18000001", "Exchange replacement barcode changed");
    assert.ok(Number((await scalar("SELECT COUNT(*) AS count FROM asset_events WHERE asset_id='AST-CD-gs-jewellery' AND action='EXCHANGED_IN'")).count) >= 1, "Exchange AssetEvent missing");

    // 7. Deposit reconciliation: cash and liability must equal the actual payment.
    const deposit = await scalar("SELECT id,total,paid_amount,remaining_amount FROM invoices WHERE type='deposit' ORDER BY created_at DESC LIMIT 1");
    assert.equal(Number(deposit.total), 2415, "Deposit invoice total mismatch");
    assert.equal(Number(deposit.paid_amount), 1500, "Deposit paid amount mismatch");
    assert.equal(Number(deposit.remaining_amount), 915, "Deposit remaining amount mismatch");
    const depositPayment = await scalar("SELECT COALESCE(SUM(amount),0) AS amount FROM payments WHERE invoice_id=$1", [deposit.id]);
    const depositCash = await scalar("SELECT COALESCE(SUM(amount),0) AS amount FROM cash_transactions WHERE reference=$1", [deposit.id]);
    const depositJournal = await scalar("SELECT je.id,COALESCE(SUM(jl.debit) FILTER (WHERE jl.account_code='1110'),0) AS cash_debit,COALESCE(SUM(jl.credit) FILTER (WHERE jl.account_code='2300'),0) AS deposits_credit,COALESCE(SUM(jl.debit-jl.credit),0) AS net FROM journal_entries je JOIN journal_lines jl ON jl.journal_entry_id=je.id WHERE je.source_type='deposit' AND je.source_id=$1 GROUP BY je.id", [deposit.id]);
    assert.equal(Number(depositPayment.amount), 1500, "Deposit Payment mismatch");
    assert.equal(Number(depositCash.amount), 1500, "Deposit CashTransaction mismatch");
    assert.equal(Number(depositJournal.cash_debit), 1500, "Deposit cash journal mismatch");
    assert.equal(Number(depositJournal.deposits_credit), 1500, "Deposit liability journal mismatch");
    assert.ok(Math.abs(Number(depositJournal.net)) < 0.01, "Deposit journal is unbalanced");

    // 8. Supplier, liability, idempotency, and supporting modules.
    const supplierBalance = await scalar("SELECT COALESCE((SELECT SUM(total) FROM purchase_orders WHERE supplier_id='SUP-011' AND status='received' AND is_consignment IS NOT TRUE),0)-COALESCE((SELECT SUM(ct.amount) FROM cash_transactions ct JOIN purchase_orders po ON po.id=ct.reference WHERE po.supplier_id='SUP-011' AND ct.type='cash_out' AND ct.category='supplier_purchase'),0) AS balance");
    assert.equal(Number(supplierBalance.balance), 89500, "Supplier dynamic balance mismatch");
    const pendingIdempotency = await scalar("SELECT COUNT(*)::integer AS count FROM idempotency_requests WHERE status IN ('pending','failed')");
    assert.equal(Number(pendingIdempotency.count), 0, "Pending/failed idempotency requests found");
    const voucher = await scalar("SELECT COALESCE(SUM(value),0) AS issued,COALESCE(SUM(balance),0) AS remaining FROM gift_vouchers");
    assert.equal(Number(voucher.issued), 500, "Gift voucher issue total mismatch");
    assert.equal(Number(voucher.remaining), 300, "Gift voucher balance mismatch");
    const gold = await scalar("SELECT COALESCE(SUM(gross_weight),0) AS net_weight FROM customer_gold_pools WHERE customer_id='CUS-0026'");
    assert.equal(Number(gold.net_weight), 5, "Customer gold net balance mismatch");
    assert.equal(counts.cash_transactions, 14, "Treasury transaction count mismatch");

    // 9. Hidden/deferred scope remains protected.
    const customerPage = read(CUSTOMER_PAGE);
    assert.match(customerPage, /const\s+SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS\s*=\s*false/);
    assert.ok(!/UAE\s+(?:Government\s+)?E-Invoicing|\bUBL\b/i.test(read("backend/src/routes/erp.routes.js")), "UAE E-Invoicing code detected");
    console.log("verify-client-demo-data: Migration/taxonomy/variant checks executed.");
    console.log("verify-client-demo-data: Transaction/deposit/supplier regression checks executed.");
    console.log("verify-client-demo-data: Accounting and hidden-scope checks executed.");
  } finally {
    await client.end();
  }

  return true;
}

(async function main() {
  try {
    guardScript();
    foundationAndDocs();
    scopeGuard();
    const liveExecuted = await liveChecks();
    if (String(process.env.VERIFY_CLIENT_DEMO_LIVE).toLowerCase() === "true" && !liveExecuted) {
      throw new Error("Live verification was requested but a live section was skipped");
    }
    console.log(liveExecuted
      ? "verify-client-demo-data: ok (static + live checks passed)"
      : "verify-client-demo-data: ok (STATIC ONLY — LIVE DATA NOT VERIFIED)");
    process.exit(0);
  } catch (err) {
    console.error("verify-client-demo-data FAILED:", err.message);
    process.exit(1);
  }
})();
