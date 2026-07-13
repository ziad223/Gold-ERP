#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
try {
  require(path.join(ROOT, "backend", "node_modules", "dotenv")).config({ path: path.join(ROOT, "backend", ".env") });
} catch (_) {}
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const posting = read("backend/src/services/posting.service.js");
const routes = read("backend/src/routes/erp.routes.js");
const reset = read("scripts/reset-client-demo-data.js");

function staticChecks() {
  const depositBlock = posting.slice(posting.indexOf("async postDepositEntry"), posting.indexOf("  /**", posting.indexOf("async postDepositEntry") + 10));
  assert.ok(depositBlock.includes("opts.receivedAmount"), "deposit posting must accept an explicit received amount");
  assert.ok(!depositBlock.includes("invoice.deposit || invoice.total"), "deposit posting must not fall back to invoice.total");
  assert.ok(!depositBlock.includes("invoice.total"), "deposit posting block must not use invoice.total");
  assert.ok(/receivedAmount\s*!==\s*undefined/.test(depositBlock), "received amount must use explicit null/undefined handling");
  assert.equal((routes.match(/postDepositEntry\(/g) || []).length, 3, "all three deposit callers must remain explicit");
  assert.ok(/receivedAmount:\s*paidAmount/.test(routes), "resolved paidAmount must reach deposit posting");
  assert.ok(/receivedAmount:\s*Number\(inv\.deposit\)/.test(routes), "immediate deposit caller must pass its explicit deposit");
  assert.ok(!/ALLOW_CLIENT_DEMO_RESET|RESET_TARGET|OWNER_CONFIRMED_DEMO_ONLY/.test(read("scripts/verify-client-demo-data.js").slice(read("scripts/verify-client-demo-data.js").indexOf("async function liveChecks"))), "live verification must not depend on destructive reset gates");
  assert.ok(/VERIFY_CLIENT_DEMO_LIVE/.test(read("scripts/verify-client-demo-data.js")), "read-only live gate is missing");
  assert.ok(!/UPDATE\s+assets\s+SET\s+barcode/i.test(reset), "reset tooling must not backfill historical barcodes");

  const sales = require(path.join(ROOT, "backend", "src", "services", "sales.service.js"));
  const partial = sales.resolvePayment({ paymentMethod: "deposit", total: 2415, body: { deposit: 1500 } });
  assert.equal(partial.paidAmount, 1500, "partial deposit received amount regression failed");
  assert.equal(partial.remainingAmount, 915, "partial deposit remaining regression failed");
  const full = sales.resolvePayment({ paymentMethod: "deposit", total: 2415, body: { deposit: 2415 } });
  assert.equal(full.paidAmount, 2415, "full deposit received amount regression failed");
  assert.equal(full.remainingAmount, 0, "full deposit remaining regression failed");
  assert.throws(() => sales.resolvePayment({ paymentMethod: "deposit", total: 2415, body: { deposit: 0 } }), /العربون|deposit/i, "zero deposit must not silently use invoice total");
  const decimal = sales.resolvePayment({ paymentMethod: "deposit", total: 2415, body: { deposit: 1500.25 } });
  assert.equal(decimal.paidAmount, 1500.25, "decimal deposit precision regression failed");
  assert.equal(decimal.remainingAmount, 914.75, "decimal deposit remaining regression failed");
}

async function liveChecks() {
  if (String(process.env.VERIFY_CLIENT_DEMO_LIVE).toLowerCase() !== "true") {
    console.log("verify-deposit-posting-reconciliation: STATIC ONLY — LIVE DATA NOT VERIFIED");
    return false;
  }
  const name = process.env.DB_NAME || "darfus_erp";
  const verifyName = String(process.env.VERIFY_DATABASE_NAME || "").trim();
  const host = process.env.DB_HOST || "localhost";
  assert.equal(verifyName, name, "VERIFY_DATABASE_NAME must match DB_NAME");
  assert.equal(name, "darfus_erp", "live deposit verification is restricted to local darfus_erp");
  assert.ok(["localhost", "127.0.0.1", "::1"].includes(host), "live deposit verification requires a local host");
  assert.ok(["development", "test", "demo"].includes(String(process.env.NODE_ENV || "development").toLowerCase()), "live deposit verification requires a non-production environment");
  const { Client } = require(path.join(ROOT, "backend", "node_modules", "pg"));
  const client = new Client({ host, port: Number(process.env.DB_PORT || 5432), user: process.env.DB_USER || "postgres", password: process.env.DB_PASS || "postgres", database: name });
  await client.connect();
  try {
    const invoice = (await client.query("SELECT id,total,paid_amount,remaining_amount FROM invoices WHERE type='deposit' ORDER BY created_at DESC LIMIT 1")).rows[0];
    assert.ok(invoice, "deterministic deposit invoice not found");
    const payment = (await client.query("SELECT COALESCE(SUM(amount),0) AS amount FROM payments WHERE invoice_id=$1", [invoice.id])).rows[0];
    const cash = (await client.query("SELECT COALESCE(SUM(amount),0) AS amount FROM cash_transactions WHERE reference=$1", [invoice.id])).rows[0];
    const journal = (await client.query("SELECT COALESCE(SUM(jl.debit) FILTER (WHERE jl.account_code='1110'),0) AS debit,COALESCE(SUM(jl.credit) FILTER (WHERE jl.account_code='2300'),0) AS credit,COALESCE(SUM(jl.debit-jl.credit),0) AS net FROM journal_entries je JOIN journal_lines jl ON jl.journal_entry_id=je.id WHERE je.source_type='deposit' AND je.source_id=$1", [invoice.id])).rows[0];
    assert.equal(Number(invoice.total), 2415);
    assert.equal(Number(invoice.paid_amount), 1500);
    assert.equal(Number(invoice.remaining_amount), 915);
    assert.equal(Number(payment.amount), 1500);
    assert.equal(Number(cash.amount), 1500);
    assert.equal(Number(journal.debit), 1500);
    assert.equal(Number(journal.credit), 1500);
    assert.ok(Math.abs(Number(journal.net)) < 0.01);
    console.log("verify-deposit-posting-reconciliation: LIVE DATA CHECKS EXECUTED");
    return true;
  } finally {
    await client.end();
  }
}

(async () => {
  try {
    staticChecks();
    const live = await liveChecks();
    if (String(process.env.VERIFY_CLIENT_DEMO_LIVE).toLowerCase() === "true" && !live) throw new Error("requested live deposit verification was skipped");
    console.log(live ? "verify-deposit-posting-reconciliation: ok (static + live)" : "verify-deposit-posting-reconciliation: ok (STATIC ONLY)");
  } catch (error) {
    console.error(`verify-deposit-posting-reconciliation FAILED: ${error.message}`);
    process.exit(1);
  }
})();
