/**
 * Phase 26-Fix — verify customer credit optional GL bridge.
 *
 * Functional checks use mock models and a mocked postingService.postEntry, so
 * this script performs no database writes and opens no network connections.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

const postingService = require(path.resolve(ROOT, "backend", "src", "services", "posting.service.js"));
const svc = require(path.resolve(ROOT, "backend", "src", "services", "customer-credit.service.js"));

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
      rows = rows.sort((a, b) => b.createdAt - a.createdAt);
      if (offset) rows = rows.slice(offset);
      if (limit) rows = rows.slice(0, limit);
      return rows;
    },
  };
  const sequelize = {
    async transaction(fn) {
      return fn({ id: "mock-transaction" });
    },
  };
  return { CustomerCreditTransaction, sequelize, _store: store };
}

async function functional() {
  const originalPostEntry = postingService.postEntry;
  const calls = [];
  postingService.postEntry = async (companyId, opts, lines) => {
    calls.push({ companyId, opts, lines });
    return { id: `JE-MOCK-${calls.length}`, lines };
  };

  try {
    const models = makeMockModels();
    const base = { models, companyId: "CMP-1", customerId: "CUST-1", amount: 100, sourceType: "manual_adjustment" };

    const creditIn = await svc.recordCreditIn({
      ...base,
      glPosting: {
        enabled: true,
        debitAccountCode: "1110",
        creditAccountCode: "2300",
        description: "Customer deposit credit",
        date: "2026-07-07",
      },
    });
    assert.equal(creditIn.journalEntryId, "JE-MOCK-1", "credit_in saves generated journalEntryId");
    assert.equal(calls[0].opts.sourceType, "customer_credit", "journal sourceType identifies credit ledger");
    assert.equal(calls[0].opts.sourceId, creditIn.id, "journal sourceId links to credit row");
    assert.deepEqual(
      calls[0].lines.map((line) => [line.accountCode, line.debit, line.credit]),
      [["1110", 100, 0], ["2300", 0, 100]],
      "credit_in debits counter account and credits 2300",
    );

    const creditOut = await svc.recordCreditOut({
      models,
      companyId: "CMP-1",
      customerId: "CUST-1",
      amount: 25,
      sourceType: "credit_application",
      glPosting: {
        enabled: true,
        debitAccountCode: "2300",
        creditAccountCode: "1300",
        description: "Apply customer credit",
      },
    });
    assert.equal(creditOut.journalEntryId, "JE-MOCK-2", "credit_out saves generated journalEntryId");
    assert.deepEqual(
      calls[1].lines.map((line) => [line.accountCode, line.debit, line.credit]),
      [["2300", 25, 0], ["1300", 0, 25]],
      "credit_out debits 2300 and credits counter account",
    );

    const ledgerOnly = await svc.recordCreditIn({
      models,
      companyId: "CMP-1",
      customerId: "CUST-1",
      amount: 10,
      sourceType: "manual_adjustment",
    });
    assert.equal(ledgerOnly.journalEntryId, null, "missing glPosting remains ledger-only");
    assert.equal(calls.length, 2, "ledger-only credit does not post GL");

    await assert.rejects(
      () => svc.recordCreditIn({
        ...base,
        journalEntryId: "JE-EXISTING",
        glPosting: { enabled: true, debitAccountCode: "1110", creditAccountCode: "2300" },
      }),
      /either journalEntryId or glPosting\.enabled/i,
      "journalEntryId plus glPosting.enabled is rejected",
    );
    await assert.rejects(
      () => svc.recordCreditIn({
        ...base,
        glPosting: { enabled: true, debitAccountCode: "1110", creditAccountCode: "1300" },
      }),
      /credit_in GL bridge must credit account 2300/i,
      "credit_in must credit 2300",
    );
    await assert.rejects(
      () => svc.recordCreditOut({
        models,
        companyId: "CMP-1",
        customerId: "CUST-1",
        amount: 5,
        sourceType: "credit_application",
        glPosting: { enabled: true, debitAccountCode: "1300", creditAccountCode: "1110" },
      }),
      /credit_out GL bridge must debit account 2300/i,
      "credit_out must debit 2300",
    );
  } finally {
    postingService.postEntry = originalPostEntry;
  }
}

function staticChecks() {
  const service = read("backend/src/services/customer-credit.service.js");
  assert.ok(service.includes("glPosting"), "service supports glPosting");
  assert.ok(service.includes('creditAccountCode !== CUSTOMER_DEPOSITS_ACCOUNT'), "credit_in validates Cr 2300");
  assert.ok(service.includes('debitAccountCode !== CUSTOMER_DEPOSITS_ACCOUNT'), "credit_out validates Dr 2300");
  assert.ok(service.includes("postingService.postEntry"), "service uses postingService.postEntry");
  assert.ok(service.includes("journalEntryId = journalEntry.id"), "generated journalEntryId is saved");
  assert.ok(service.includes("models.sequelize.transaction"), "service wraps GL bridge when caller gives no transaction");
  assert.ok(!/models\.Customer\b/.test(service), "service does not touch Customer.balance");
  assert.ok(!/models\.Invoice\b/.test(service), "service does not touch Invoice.remainingAmount");
  assert.ok(!/print|CustomPrint/i.test(service), "service has no print coupling");

  const routes = read("backend/src/routes/erp.routes.js");
  assert.ok(routes.includes('router.get("/customers/:id/credit"'), "credit summary endpoint remains");
  assert.ok(routes.includes('router.post("/customers/:id/credit/deposit"'), "manual deposit public POST credit endpoint remains");
  assert.ok(routes.includes('router.post("/customers/:id/credit/refund"'), "manual refund public POST credit endpoint exists");
  assert.ok(routes.includes('router.post("/invoices/:id/apply-customer-credit"'), "invoice apply-credit endpoint exists");
  assert.ok(!/router\.(post|put|patch|delete)\([^)]*credit\/adjust/.test(routes), "no credit adjustment route");
  assert.ok(routes.includes("customerCreditService.recordCreditIn"), "manual deposit route creates credit_in through the service");
  const refundStart = routes.indexOf('router.post("/customers/:id/credit/refund"');
  const refundEnd = routes.indexOf('router.post("/invoices/:id/apply-customer-credit"', refundStart);
  assert.ok(refundStart >= 0 && refundEnd > refundStart, "refund route section is bounded");
  const refundRoute = routes.slice(refundStart, refundEnd);
  assert.ok(refundRoute.includes("customerCreditService.recordCreditOut"), "manual refund route creates credit_out through the service");
  const applyStart = routes.indexOf('router.post("/invoices/:id/apply-customer-credit"');
  const applyEnd = routes.indexOf("// ─────────────────────────────────────────────────────────────────────────────\n// GL ACCOUNT STATEMENT", applyStart);
  assert.ok(applyStart >= 0 && applyEnd > applyStart, "apply-credit route section is bounded");
  const applyRoute = routes.slice(applyStart, applyEnd);
  assert.ok(applyRoute.includes("customerCreditService.recordCreditOut"), "invoice apply-credit route creates credit_out through the service");
  assert.ok(!routes.replace(refundRoute, "").replace(applyRoute, "").includes("customerCreditService.recordCreditOut"), "only refund/apply routes create credit_out");
  assert.ok(routes.includes("postReturnEntry"), "return route remains present");
  assert.ok(routes.includes("postExchangeEntry") || routes.includes('sourceType: "exchange"'), "exchange posting remains present");

  const changed = require("node:child_process")
    .execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  assert.ok(!changed.some((file) => /backend\/migrations|migrations\//.test(file)), "no migration changed");
  assert.ok(!changed.some((file) => /features\/printing|CustomPrint|print/i.test(file)), "no print files touched");
  assert.ok(!changed.some((file) => /features\/dashboard|app\/\[locale\]\/\(dashboard\)\/dashboard/.test(file)), "dashboard not rewritten");

  const pkg = read("package.json");
  assert.ok(pkg.includes('"verify:customer-credit-gl-bridge"'), "package script exists");
  assert.ok(read("backend/src/services/posting.service.js").includes('"2300"'), "posting chart still defines 2300");
  assert.ok(read("backend/src/routes/erp.routes.js").includes("/reports/ledger/ar-ap-reconciliation"), "Phase 25 reconciliation remains available");
}

(async () => {
  await functional();
  staticChecks();
  console.log("verify-customer-credit-gl-bridge: ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
