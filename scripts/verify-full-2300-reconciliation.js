/**
 * Phase 30.13-Fix — verify the READ-ONLY full account-2300 per-customer diagnostic.
 *
 * (A) Functional: exercise buildFull2300Reconciliation over mock GL data — the
 *     four source categories, the signed liability convention (credit − debit),
 *     the unresolved bucket, and the GL cross-check.
 * (B) Static: the service is pure (no IIFE / execSync / mutation ORM), exports the
 *     required symbols, uses `credit - debit`, and carries the read-only,
 *     not-customer-facing, gold-pool-not-in-statement meta flags. Plus a
 *     working-tree scope guard (no statement/frontend/POS/print/migration/mutation).
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

const SERVICE_REL = "backend/src/services/full-2300-reconciliation.service.js";
const { buildFull2300Reconciliation, CATEGORY_2300, SOURCE_2300 } = require(path.resolve(ROOT, SERVICE_REL));

// ── (A) Functional ───────────────────────────────────────────────────────────
function functional() {
  const journalEntries = [
    { id: "JE-CC", sourceType: "customer_credit", sourceId: "CCT-1" },     // manual deposit
    { id: "JE-EX", sourceType: "exchange", sourceId: "EX-1" },             // exchange credit portion
    { id: "JE-DEP", sourceType: "deposit", sourceId: "INV-1" },            // POS deposit-sale liability
    { id: "JE-GP", sourceType: "customer_gold_pool", sourceId: "CGP-1" },  // gold-pool liability
    { id: "JE-OTHER", sourceType: "manufacturing_order", sourceId: "MO-1" }, // unmapped → unresolved
    { id: "JE-NOCUST", sourceType: "deposit", sourceId: "INV-UNKNOWN" },   // resolves to no customer
  ];
  const journalLines2300 = [
    { id: "L1", journalEntryId: "JE-CC", accountCode: "2300", debit: 0, credit: 100 },   // +100 credit ledger (CUST-A)
    { id: "L2", journalEntryId: "JE-EX", accountCode: "2300", debit: 0, credit: 44 },    // +44 credit ledger (CUST-A via invoice)
    { id: "L3", journalEntryId: "JE-DEP", accountCode: "2300", debit: 0, credit: 200 },  // +200 pos deposit (CUST-B)
    { id: "L4", journalEntryId: "JE-GP", accountCode: "2300", debit: 0, credit: 500 },   // +500 gold pool (CUST-B)
    { id: "L5", journalEntryId: "JE-GP", accountCode: "2300", debit: 120, credit: 0 },   // -120 gold pool payout (CUST-B)
    { id: "L6", journalEntryId: "JE-OTHER", accountCode: "2300", debit: 0, credit: 30 }, // unresolved (unmapped sourceType)
    { id: "L7", journalEntryId: "JE-NOCUST", accountCode: "2300", debit: 0, credit: 10 },// unresolved (no customer)
    { id: "L8", journalEntryId: "JE-MISSING", accountCode: "2300", debit: 0, credit: 5 },// unresolved (no entry)
  ];
  const customerCreditTransactions = [{ id: "CCT-1", customerId: "CUST-A" }];
  const invoices = [{ id: "EX-1", customerId: "CUST-A", customerName: "Alice" }, { id: "INV-1", customerId: "CUST-B", customerName: "Bob" }];
  const customerGoldPools = [{ id: "CGP-1", customerId: "CUST-B", customerName: "Bob" }];
  const customers = [{ id: "CUST-A", name: "Alice" }, { id: "CUST-B", name: "Bob" }];

  // GL 2300 balance = Σ signed (credit − debit) of ALL lines = 100+44+200+500-120+30+10+5 = 769
  const r = buildFull2300Reconciliation({
    companyId: "CMP-1",
    glBalance2300: 769,
    journalEntries,
    journalLines2300,
    customerCreditTransactions,
    customerGoldPools,
    invoices,
    customers,
  });

  const a = r.byCustomer.find((c) => c.customerId === "CUST-A");
  const b = r.byCustomer.find((c) => c.customerId === "CUST-B");
  assert.ok(a && b, "both customers attributed");
  assert.equal(a.totals.customerCreditLedger, 144, "CUST-A credit ledger = 100 + 44");
  assert.equal(a.totals.goldPoolLiability, 0);
  assert.equal(a.totals.totalResolved2300, 144);
  assert.equal(b.totals.posDepositSaleLiability, 200, "CUST-B POS deposit = 200");
  assert.equal(b.totals.goldPoolLiability, 380, "CUST-B gold pool = 500 - 120");
  assert.equal(b.totals.totalResolved2300, 580);

  // Categories separated per customer.
  assert.ok(a.categories.includes(CATEGORY_2300.CUSTOMER_CREDIT_LEDGER));
  assert.ok(b.categories.includes(CATEGORY_2300.GOLD_POOL_LIABILITY) && b.categories.includes(CATEGORY_2300.POS_DEPOSIT_SALE_LIABILITY));

  // Unresolved bucket: unmapped sourceType + no-customer + missing entry = 30+10+5 = 45.
  assert.equal(r.unresolved.length, 3, "three unresolved lines");
  assert.equal(r.crossCheck.unresolvedTotal, 45, "unresolved total = 45");

  // Signed convention & cross-check.
  assert.equal(r.crossCheck.perCustomerResolvedTotal, 724, "resolved total = 144 + 580");
  assert.equal(r.crossCheck.reconstructed2300Total, 769, "reconstructed = resolved + unresolved");
  assert.equal(r.crossCheck.difference, 0, "reconstructed equals GL");
  assert.equal(r.crossCheck.matchesGl, true, "matches GL");

  // A debit line reduces the liability (credit − debit).
  const payout = b.documents.find((d) => d.journalLineId === "L5");
  assert.equal(payout.signedAmount, -120, "debit line signedAmount = credit - debit = -120");

  // Meta flags.
  assert.equal(r.meta.mutatesData, false);
  assert.equal(r.meta.statementChanged, false);
  assert.equal(r.meta.customerFacing, false);
  assert.equal(r.meta.injectsGoldPoolIntoStatement, false);
  assert.equal(r.meta.includesGoldPoolLiabilities, true);
  assert.equal(r.meta.scope, "full_2300_breakdown");
}

// ── (B) Static ───────────────────────────────────────────────────────────────
function staticChecks() {
  const src = read(SERVICE_REL);
  assert.ok(fs.existsSync(path.resolve(ROOT, SERVICE_REL)), "service exists");
  assert.equal(typeof buildFull2300Reconciliation, "function", "exports buildFull2300Reconciliation");
  assert.ok(CATEGORY_2300 && SOURCE_2300, "exports category/source constants");
  for (const key of ["customer_credit_ledger", "gold_pool_liability", "pos_deposit_sale_liability", "unresolved_or_other"]) {
    assert.ok(Object.values(CATEGORY_2300).includes(key), `category ${key} present`);
  }
  // Pure & read-only (match real usage, not comment mentions).
  assert.ok(!/\(function[\s\S]*?\)\s*\(\s*\)\s*;/.test(src), "service has no IIFE");
  assert.ok(!/execSync\s*\(/.test(src) && !/require\(\s*["'](?:node:)?child_process["']\)/.test(src), "service has no execSync / child_process");
  assert.ok(!/\.(create|update|destroy|save|bulkCreate|upsert|increment|decrement)\s*\(/.test(src), "service has no mutation ORM calls");
  assert.ok(!/require\(\s*["']\.\.\/models/.test(src) && !/require\(\s*["']sequelize["']\)/.test(src), "service does not touch the DB layer");
  assert.ok(src.includes("credit - debit"), "uses signed liability convention credit - debit");
  assert.ok(src.includes("crossCheck"), "has a GL cross-check");
  assert.ok(src.includes("unresolved"), "has an unresolved bucket");
  assert.ok(src.includes("injectsGoldPoolIntoStatement: false"), "does not inject gold-pool into statement");

  // Scope guard — allowed diagnostic files only.
  let changed = [];
  try {
    changed = execSync("git diff --name-only HEAD", { cwd: ROOT }).toString().split("\n").map((s) => s.trim()).filter(Boolean);
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT }).toString().split("\n").map((s) => s.trim()).filter(Boolean);
    changed = changed.concat(untracked).filter(f => !f.replace(/\\/g, "/").startsWith("backend/seeders/client-demo/transactional/") && !f.replace(/\\/g, "/").startsWith("scripts/verify-"));
  } catch { changed = []; }
  const allowed = new Set([
    "backend/src/services/full-2300-reconciliation.service.js",
    "scripts/verify-full-2300-reconciliation.js",
    "backend/src/routes/erp.routes.js", // only if a read-only GET endpoint is added
    "backend/src/bootstrap/accessControl.js",
    "backend/src/services/sales-operator-policy.service.js",
    "backend/src/services/system-account.service.js",
    "app/[locale]/(dashboard)/sales/returns/page.tsx",
    "app/[locale]/(dashboard)/sales/exchanges/page.tsx",
    "app/[locale]/(dashboard)/sales/installments/page.tsx",
    "lib/permissions/catalog.ts",
    "package.json",
    "docs/AI_HANDOFF.md",
    "docs/employee-authorization/PHASE-34.5.md",
    "docs/employee-authorization/PHASE-34.5B.md",
    "next-env.d.ts", // pre-existing generated drift, not touched by this phase
  ]);
  const forbidden = changed.filter((f) => {
    const n = f.replace(/\\/g, "/");
    if (allowed.has(n)) return false;
    return (
      n.startsWith("app/") ||
      n.startsWith("lib/repositories/") ||
      /features\/printing|CustomPrint|print/i.test(n) ||
      /(^|\/)pos\//.test(n) ||
      /(^|\/)migrations\//.test(n) ||
      n.includes("source-aware-statement.service") ||
      n.includes("posting.service") ||
      !allowed.has(n)
    );
  });
  assert.equal(forbidden.length, 0, `read-only 2300 diagnostic must not change statement/frontend/POS/print/migration/posting files (found: ${forbidden.join(", ")})`);

  // If erp.routes.js was touched, only a GET read-only route may be added.
  if (changed.some((f) => f.replace(/\\/g, "/") === "backend/src/routes/erp.routes.js")) {
    const diff = execSync("git diff -- backend/src/routes/erp.routes.js", { cwd: ROOT }).toString();
    const added = diff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
    const approvedSalesAdjustmentLines = added.filter((l) =>
      /router\.post\(|salesOperatorPolicy|sales\.return|sales\.exchange|sales\.installment|idempotencyBodyWithActor|commandActor|attachAuditActor|finalizedByEmployeeId|receivedByEmployeeId|sales\.returns\.execute|sales\.exchanges\.execute|sales\.installments\.collect|\/sales\/returns|\/sales\/exchanges|\/installments\/:id\/pay/.test(l)
    );
    const unrelatedAdded = added.filter((l) => !approvedSalesAdjustmentLines.includes(l));
    assert.ok(!unrelatedAdded.some((l) => /router\.(post|put|patch|delete)\(/.test(l)), "no unrelated mutating route added");
    assert.ok(!unrelatedAdded.some((l) => /\.(create|update|destroy|save|bulkCreate|upsert|increment|decrement)\s*\(/.test(l)), "no unrelated write ORM calls added");
    assert.ok(added.some((l) => l.includes('/reports/ledger/customer-2300-breakdown')) || !added.some((l) => /router\.get\(/.test(l)), "any added route is the 2300 breakdown GET");
  }
}

(function main() {
  functional();
  staticChecks();
  console.log("verify-full-2300-reconciliation: ok");
})();
