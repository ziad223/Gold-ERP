/**
 * Phase 23-Fix — verify the customer credit ledger infrastructure.
 *
 * (A) Functional: exercise customer-credit.service against a mock
 *     CustomerCreditTransaction store (no DB) — recordCreditIn/Out, the
 *     available-credit sum, the no-negative rule, and amount validation. The mock
 *     exposes ONLY the credit model, so any attempt to touch Customer/Invoice
 *     would throw (proving the service never mutates them).
 * (B) Static: migration + model + registration + service surface exist; the
 *     endpoint exists; only manual deposit/refund routes may create credit;
 *     apply and return/exchange credit modes are still not wired;
 *     the service does not write Customer.balance / Invoice.remainingAmount;
 *     GL posting is optional and requires explicit glPosting context; no
 *     print/report/data-source coupling.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

const svc = require(path.resolve(ROOT, "backend", "src", "services", "customer-credit.service.js"));

// ── (A) Functional ───────────────────────────────────────────────────────────
function makeMockModels() {
  const store = [];
  const CustomerCreditTransaction = {
    async create(data) {
      const row = { ...data, createdAt: new Date(Date.now() + store.length) };
      store.push(row);
      return row;
    },
    async findAll({ where = {}, limit, offset = 0 } = {}) {
      let rows = store.filter((r) =>
        (where.companyId === undefined || r.companyId === where.companyId) &&
        (where.customerId === undefined || r.customerId === where.customerId) &&
        (where.status === undefined || r.status === where.status)
      );
      rows = rows.sort((a, b) => b.createdAt - a.createdAt); // created_at DESC
      if (offset) rows = rows.slice(offset);
      if (limit) rows = rows.slice(0, limit);
      return rows;
    }
  };
  // Deliberately NO Customer / Invoice models — the service must never touch them.
  return { CustomerCreditTransaction, _store: store };
}

async function functional() {
  const models = makeMockModels();
  const base = { models, companyId: "CMP-1", customerId: "CUST-1" };

  await svc.recordCreditIn({ ...base, amount: 100, sourceType: "manual_adjustment", currency: "AED" });
  let s = await svc.getCustomerCreditSummary({ ...base });
  assert.equal(s.availableCredit, 100, "credit_in raises available credit");
  assert.equal(s.totalCreditIn, 100);
  assert.equal(s.totalCreditOut, 0);
  assert.equal(s.currency, "AED");

  await svc.recordCreditOut({ ...base, amount: 30, sourceType: "credit_application" });
  s = await svc.getCustomerCreditSummary({ ...base });
  assert.equal(s.availableCredit, 70, "credit_out lowers available credit");
  assert.equal(s.totalCreditOut, 30);

  // Overdraw is rejected (available credit never goes negative).
  await assert.rejects(
    () => svc.recordCreditOut({ ...base, amount: 1000, sourceType: "credit_application" }),
    /insufficient credit/i,
    "credit_out beyond available is rejected",
  );

  // Non-positive amount is rejected.
  await assert.rejects(
    () => svc.recordCreditIn({ ...base, amount: 0, sourceType: "manual_adjustment" }),
    /greater than zero/i,
    "zero amount is rejected",
  );
  await assert.rejects(
    () => svc.recordCreditIn({ ...base, amount: -5, sourceType: "manual_adjustment" }),
    /greater than zero/i,
    "negative amount is rejected",
  );

  // Company/customer scoping: another customer is independent.
  const s2 = await svc.getCustomerCreditSummary({ models, companyId: "CMP-1", customerId: "CUST-2" });
  assert.equal(s2.availableCredit, 0, "a different customer has independent credit");

  // Transactions listing is read-only and newest-first.
  const txs = await svc.getCustomerCreditTransactions({ ...base, limit: 50 });
  assert.equal(txs.length, 2, "lists all ledger rows for the customer");
  assert.ok(["credit_in", "credit_out"].includes(txs[0].direction), "rows carry a direction");
}

// ── (B) Static ───────────────────────────────────────────────────────────────
function staticChecks() {
  // Migration.
  const migDir = path.resolve(ROOT, "backend", "migrations");
  const migFile = fs.readdirSync(migDir).find((f) => f.includes("create-customer-credit-transactions"));
  assert.ok(migFile, "customer credit migration exists");
  const mig = fs.readFileSync(path.join(migDir, migFile), "utf8");
  assert.ok(mig.includes('createTable("customer_credit_transactions"'), "migration creates customer_credit_transactions");
  assert.ok(mig.includes('dropTable("customer_credit_transactions")'), "migration down drops the table (reversible)");
  for (const col of ["company_id", "customer_id", "source_type", "direction", "amount", "status", "journal_entry_id"]) {
    assert.ok(mig.includes(col), `migration has column ${col}`);
  }

  // Model + registration.
  const model = read("backend/src/models/customerCreditTransaction.model.js");
  assert.ok(model.includes('tableName: "customer_credit_transactions"'), "model maps to the table");
  assert.ok(/isIn:\s*\[\[\s*"credit_in",\s*"credit_out"\s*\]\]/.test(model), "model validates direction");
  const idx = read("backend/src/models/index.js");
  assert.ok(idx.includes('require("./customerCreditTransaction.model")'), "model is required in index");
  assert.ok(/CustomerCreditTransaction,?\s*$/m.test(idx) || idx.includes("CustomerCreditTransaction") || idx.includes("CustomerCreditTransaction\r\n"), "model is exported from index");

  // Service surface.
  const service = read("backend/src/services/customer-credit.service.js");
  for (const fn of ["recordCreditIn", "recordCreditOut", "getCustomerCreditSummary", "getCustomerCreditTransactions"]) {
    assert.ok(service.includes(fn), `service exports ${fn}`);
  }
  // Service must NOT touch the Customer or Invoice models (so it can't mutate
  // Customer.balance or Invoice.remainingAmount). GL remains opt-in only and
  // must not be called by existing routes/flows.
  assert.ok(!/models\.Customer\b/.test(service), "service never accesses the Customer model");
  assert.ok(!/models\.Invoice\b/.test(service), "service never accesses the Invoice model");
  assert.ok(!/remainingAmount\s*[:=]/.test(service), "service never writes Invoice.remainingAmount");
  assert.ok(service.includes("glPosting"), "service exposes optional GL posting context");
  assert.ok(service.includes("pass either journalEntryId or glPosting.enabled"), "service rejects ambiguous journal link inputs");
  assert.ok(!/print/i.test(service), "service has no print coupling");

  // Credit endpoints exist; Phase 29 allows manual deposit/refund plus applying
  // credit to an existing invoice. No adjustment or POS credit endpoint.
  const routes = read("backend/src/routes/erp.routes.js");
  assert.ok(routes.includes('router.get("/customers/:id/credit"'), "GET /customers/:id/credit exists");
  assert.ok(routes.includes('router.post("/customers/:id/credit/deposit"'), "manual deposit credit endpoint exists");
  assert.ok(routes.includes('router.post("/customers/:id/credit/refund"'), "manual refund credit endpoint exists");
  assert.ok(routes.includes('router.post("/invoices/:id/apply-customer-credit"'), "invoice apply-credit endpoint exists");
  assert.ok(!/router\.(post|put|patch|delete)\([^)]*credit\/adjust/.test(routes), "no credit adjustment endpoint");
  assert.ok(!routes.includes('paymentMethod === "customer_credit"'), "POS checkout does not add a customer-credit payment method");

  // Only the manual deposit/refund/apply routes create customer credit movements.
  assert.ok(routes.includes("customerCreditService.recordCreditIn"), "manual deposit records credit_in");
  const refundStart = routes.indexOf('router.post("/customers/:id/credit/refund"');
  const refundEnd = routes.indexOf('router.post("/invoices/:id/apply-customer-credit"', refundStart);
  assert.ok(refundStart >= 0 && refundEnd > refundStart, "refund route section is bounded");
  const refundRoute = routes.slice(refundStart, refundEnd);
  assert.ok(refundRoute.includes("customerCreditService.recordCreditOut"), "manual refund records credit_out");
  const applyStart = routes.indexOf('router.post("/invoices/:id/apply-customer-credit"');
  const applyEnd = routes.indexOf("// ─────────────────────────────────────────────────────────────────────────────\n// GL ACCOUNT STATEMENT", applyStart);
  assert.ok(applyStart >= 0 && applyEnd > applyStart, "apply-credit route section is bounded");
  const applyRoute = routes.slice(applyStart, applyEnd);
  assert.ok(applyRoute.includes("customerCreditService.recordCreditOut"), "invoice apply-credit records credit_out");
  assert.ok(!routes.replace(refundRoute, "").replace(applyRoute, "").includes("customerCreditService.recordCreditOut"), "no non-refund/apply route records credit_out");
  // Only the read helpers are wired.
  assert.ok(routes.includes("customerCreditService.getCustomerCreditSummary"), "endpoint uses the summary helper");

  // Return/exchange behavior unchanged: their receivable-first settlement is intact
  // and they do not touch the credit ledger.
  assert.ok(routes.includes("receivableReliefAmount"), "return/exchange receivable-first settlement still present");
  assert.ok(!/postReturnEntry[\s\S]{0,400}CustomerCreditTransaction/.test(routes), "returns do not write the credit ledger");

  // posting.service not broadly rewritten (2300 chart entry still present).
  const posting = read("backend/src/services/posting.service.js");
  assert.ok(posting.includes('"2300"'), "posting.service still defines 2300 Customer Deposits");
  assert.ok(!/CustomerCreditTransaction/.test(posting), "posting.service has no direct credit-ledger coupling");
}

(async () => {
  await functional();
  staticChecks();
  console.log("verify-customer-credit-ledger: ok");
})().catch((err) => { console.error(err); process.exit(1); });
