/**
 * Phase 30.8-Fix / 30.9-Fix — READ-ONLY customer statement reconciliation diagnostic.
 *
 * The pure logic now lives in backend/src/services/statement-reconciliation.service.js
 * (single source of truth, shared with the read-only endpoint). This script:
 *  (A) Functionally tests the categorizer against representative scenarios.
 *  (B) Statically asserts statement-v2 is still source-document based
 *      (`meta.source = "source_documents"`, `ledgerBased: false`, returns→credit,
 *      exchange→ordinary invoice/debit, signed inv.total, reads Payment only — not
 *      CashTransaction / CustomerCreditTransaction), and a working-tree scope guard.
 *
 * It never touches a DB and never mutates data.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

// Phase 30.9 — import the pure logic from the backend service (no duplication).
const { reconcileCustomer, CATEGORY } = require(
  path.resolve(ROOT, "backend", "src", "services", "statement-reconciliation.service.js"),
);

// ── (A) Functional tests of the pure categorizer ────────────────────────────
function functional() {
  // Exchange, customer pays extra, paid_now cash, linked records.
  let r = reconcileCustomer({
    customerId: "C1",
    invoices: [{ id: "EX-1", type: "exchange", total: 100 }],
    customerBalance: 0,
    exchangeMeta: { "EX-1": { policyStatus: "target_policy", settlementSource: "linked_records", settlementMode: "paid_now", amountDueFromCustomer: 100 } },
  });
  assert.ok(r.categories.includes(CATEGORY.EXCHANGE_PAID_NOW_CASH_MISSING), "flags exchange paid_now cash missing");
  assert.equal(r.meta.mutatesData, false, "diagnostic never mutates data");
  assert.equal(r.meta.statementChanged, false, "diagnostic never changes the statement");
  assert.equal(r.meta.source, "diagnostic_read_only");
  assert.equal(r.meta.creditScope, "customer_credit_ledger_only", "credit balance is ledger-only, not full 2300");
  assert.ok(r.documents.find((d) => d.category === CATEGORY.EXCHANGE_PAID_NOW_CASH_MISSING).authoritative === true, "linked_records → authoritative");

  // Exchange, customer owed, excess partly to customer credit (conflation).
  r = reconcileCustomer({
    customerId: "C2",
    invoices: [{ id: "EX-2", type: "exchange", total: -44 }],
    creditTransactions: [{ id: "CCT-1", direction: "credit_in", amount: 44, status: "active" }],
    customerBalance: 0,
    exchangeMeta: { "EX-2": { policyStatus: "target_policy", settlementSource: "linked_records", excessDueToCustomer: 44, creditAmount: 44 } },
  });
  assert.ok(r.categories.includes(CATEGORY.EXCHANGE_EXCESS_OVER_REDUCES_AR), "flags exchange excess over-reduces AR");
  assert.ok(r.categories.includes(CATEGORY.CUSTOMER_CREDIT_2300_CONFLATION), "flags 2300 conflation");
  assert.equal(r.customerCreditBalance, 44, "reads 2300 credit balance");

  // Best-effort settlement → non-authoritative.
  r = reconcileCustomer({
    customerId: "C3",
    invoices: [{ id: "EX-3", type: "exchange", total: -20 }],
    exchangeMeta: { "EX-3": { policyStatus: "target_policy", settlementSource: "best_effort", excessDueToCustomer: 20 } },
  });
  assert.ok(r.categories.includes(CATEGORY.SETTLEMENT_BEST_EFFORT), "flags best_effort settlement");
  assert.equal(r.documents.find((d) => d.category === CATEGORY.SETTLEMENT_BEST_EFFORT).authoritative, false, "best_effort is NOT authoritative");
  assert.equal(r.meta.settlementAuthority, "best_effort");

  // Unavailable settlement → non-authoritative.
  r = reconcileCustomer({
    customerId: "C4",
    invoices: [{ id: "EX-4", type: "exchange", total: -10 }],
    exchangeMeta: { "EX-4": { policyStatus: "target_policy", settlementSource: "unavailable", excessDueToCustomer: 10 } },
  });
  assert.ok(r.categories.includes(CATEGORY.SETTLEMENT_UNAVAILABLE), "flags unavailable settlement");
  assert.equal(r.documents.find((d) => d.category === CATEGORY.SETTLEMENT_UNAVAILABLE).authoritative, false, "unavailable is NOT authoritative");

  // Legacy exchange policy.
  r = reconcileCustomer({
    customerId: "C5",
    invoices: [{ id: "EX-5", type: "exchange", total: -5 }],
    exchangeMeta: { "EX-5": { policyStatus: "legacy_or_unknown", settlementSource: "unavailable" } },
  });
  assert.ok(r.categories.includes(CATEGORY.LEGACY_POLICY), "flags legacy exchange policy");
  assert.equal(r.documents.find((d) => d.category === CATEGORY.LEGACY_POLICY).authoritative, false, "legacy policy is NOT auto-correctable");

  // Return with cash-refunded excess over-credits the statement.
  r = reconcileCustomer({
    customerId: "C6",
    invoices: [{ id: "CN-1", type: "return", total: 800 }],
    customerBalance: 0,
    returnMeta: { "CN-1": { cashRefundExcess: 300 } },
  });
  assert.ok(r.categories.includes(CATEGORY.RETURN_EXCESS_OVER_CREDIT), "flags return excess over-credit");

  // Clean customer (normal invoices + payments) → no categories, statement math mirrored.
  r = reconcileCustomer({
    customerId: "C7",
    invoices: [{ id: "INV-1", type: "invoice", total: 500 }],
    payments: [{ id: "P1", amount: 500 }],
    customerBalance: 0,
  });
  assert.equal(r.categories.length, 0, "clean customer has no divergence categories");
  assert.equal(r.statementClosingBalance, 0, "document-based statement math is mirrored");
  assert.equal(r.meta.settlementAuthority, "unavailable", "no exchanges → settlement authority unavailable");
}

// ── (B) Static checks: statement-v2 limitation + read-only + scope ──────────
function staticChecks() {
  const routes = read("backend/src/routes/erp.routes.js");
  const stmt = routes.slice(
    routes.indexOf('router.get("/customers/:id/statement-v2"'),
    routes.indexOf('router.get("/customers/:id/credit"')
  );
  assert.ok(stmt.length > 0, "statement-v2 route found");
  assert.ok(stmt.includes('source: "source_documents"'), "statement-v2 is source-document based");
  assert.ok(stmt.includes("ledgerBased: false"), "statement-v2 declares ledgerBased: false");
  assert.ok(stmt.includes('inv.type === "return"'), "statement-v2 classifies returns as credit");
  assert.ok(stmt.includes("round4(inv.total)"), "statement-v2 uses signed inv.total");
  assert.ok(stmt.includes("models.Payment.findAll"), "statement-v2 reads Payment rows");
  assert.ok(stmt.includes("reservationAdvances") && stmt.includes("arIntegrated: false"), "statement-v2 keeps reservation advances in a separate non-AR section");
  assert.ok(!stmt.includes("CashTransaction") && !stmt.includes("CustomerCreditTransaction"), "statement-v2 does NOT read CashTransaction / CustomerCreditTransaction");
  assert.ok(!stmt.includes('inv.type === "exchange"'), "statement-v2 does NOT special-case exchange (falls into invoice/debit)");

  // All required diagnostic categories exist (from the shared service).
  for (const key of ["EXCHANGE_PAID_NOW_CASH_MISSING", "EXCHANGE_EXCESS_OVER_REDUCES_AR", "CUSTOMER_CREDIT_2300_CONFLATION", "RETURN_EXCESS_OVER_CREDIT", "SETTLEMENT_BEST_EFFORT", "SETTLEMENT_UNAVAILABLE", "LEGACY_POLICY", "UNKNOWN_POLICY"]) {
    assert.ok(typeof CATEGORY[key] === "string" && CATEGORY[key].length > 0, `category ${key} defined`);
  }

  // The diagnostic reports read-only meta.
  const sample = reconcileCustomer({ customerId: "X" });
  assert.equal(sample.meta.mutatesData, false, "report mutatesData is false");
  assert.equal(sample.meta.statementChanged, false, "report statementChanged is false");

  // Scope guard: allowed diagnostic/report files only (no statement/frontend/print/POS/migration).
  let changed = [];
  try {
    changed = execSync("git diff --name-only HEAD", { cwd: ROOT }).toString().split("\n").map((s) => s.trim()).filter(Boolean);
     const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT }).toString().split("\n").map((s) => s.trim()).filter(Boolean);
     changed = changed.concat(untracked).filter(f => !f.replace(/\\/g, "/").startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));
   } catch { changed = []; }
  const allowed = new Set([
    "scripts/verify-customer-statement-reconciliation.js",
    "scripts/verify-customer-credit-2300-reconciliation.js",
    "backend/src/services/statement-reconciliation.service.js",
    "backend/src/routes/erp.routes.js",
    "package.json",
    "docs/AI_HANDOFF.md",
  ]);
  const forbidden = changed.filter((f) => {
    const n = f.replace(/\\/g, "/");
    return (
      n.startsWith("app/") ||
      /features\/printing|CustomPrint|print/i.test(n) ||
      /(^|\/)pos\//.test(n) ||
      /(^|\/)migrations\//.test(n) ||
      !allowed.has(n)
    );
  });
  assert.equal(forbidden.length, 0, `read-only diagnostic must not change statement/frontend/print/POS/migration files (found: ${forbidden.join(", ")})`);

  // If erp.routes.js was touched, it must add NO mutating route.
  if (changed.some((f) => f.replace(/\\/g, "/") === "backend/src/routes/erp.routes.js")) {
    const diff = execSync("git diff -- backend/src/routes/erp.routes.js", { cwd: ROOT }).toString();
    const addedLines = diff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
    assert.ok(!addedLines.some((l) => /router\.(post|put|patch|delete)\(/.test(l)), "no mutating route added by this phase");
    assert.ok(!addedLines.some((l) => /\.(create|update|destroy|bulkCreate|save|upsert)\(/.test(l)), "no write ORM calls added by this phase");
  }
}

(function main() {
  functional();
  staticChecks();
  console.log("verify-customer-statement-reconciliation: ok");
})();
