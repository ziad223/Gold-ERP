#!/usr/bin/env node
"use strict";

// F003 disposable HTTP contract. The caller must create/migrate an owned
// database and set FINANCIAL_F003_VERIFY_DATABASE plus DB_NAME to it. This
// verifier never permits the persistent local acceptance database.

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");

const database = String(process.env.FINANCIAL_F003_VERIFY_DATABASE || "");
if (!/^darfus_fin_f003_verify_[a-z0-9_]+$/i.test(database) || process.env.DB_NAME !== database) {
  throw new Error("FINANCIAL_F003_VERIFY_DATABASE and DB_NAME must name the owned disposable F003 database");
}

require(path.join(__dirname, "..", "backend", "node_modules", "dotenv")).config({ path: path.join(__dirname, "..", "backend", ".env") });
const app = require(path.join(__dirname, "..", "backend", "src", "app"));
const models = require(path.join(__dirname, "..", "backend", "src", "models"));
const financialBootstrap = require(path.join(__dirname, "..", "backend", "src", "services", "financial-bootstrap.service"));
const technicalSessions = require(path.join(__dirname, "..", "backend", "src", "services", "technical-session.service"));

const { Company, Branch, Customer, Invoice, Installment, Payment, CashTransaction, JournalEntry, JournalLine, User, sequelize } = models;
const stamp = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
const ids = {
  company: `CMP-F003-${stamp}`,
  branch: `BR-F003-${stamp}`,
  user: `USR-F003-${stamp}`,
  customer: `CUS-F003-${stamp}`,
  exactInvoice: `INV-F003-E-${stamp}`,
  exactInstallment: `INST-F003-E-${stamp}`,
  precisionInvoice: `INV-F003-P-${stamp}`,
  precisionInstallment: `INST-F003-P-${stamp}`,
  concurrentInvoice: `INV-F003-C-${stamp}`,
  concurrentInstallment: `INST-F003-C-${stamp}`,
};

let server;

function assertUnits(value, expected, message) {
  assert.equal(Number(value).toFixed(4), expected, message);
}

async function createInstallment(invoiceId, installmentId, amount) {
  await Invoice.create({
    id: invoiceId,
    companyId: ids.company,
    customerId: ids.customer,
    customerName: "F003 customer",
    type: "installment",
    total: amount,
    subtotal: amount,
    tax: 0,
    paidAmount: 0,
    remainingAmount: amount,
    date: "2026-07-30",
    status: "due",
    postingStatus: "posted",
    paymentMethod: "installment",
    branch: "F003 branch",
    branchId: ids.branch,
  });
  await Installment.create({
    id: installmentId,
    companyId: ids.company,
    invoiceId,
    customerId: ids.customer,
    customerName: "F003 customer",
    sequence: 1,
    dueDate: "2026-08-30",
    amount,
    paidAmount: 0,
    status: "pending",
    branch: "F003 branch",
  });
}

async function main() {
  await sequelize.authenticate();
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;

  try {
    await Company.create({ id: ids.company, businessName: "F003 verifier", workspace: `f003-${stamp}`, currency: "AED" });
    await Branch.create({ id: ids.branch, companyId: ids.company, name: "F003 branch", code: `F003-${stamp.slice(-4)}`, type: "store", isActive: true });
    await financialBootstrap.reconcile({ models, companyId: ids.company, branchId: ids.branch, actorId: "f003-verifier" });
    await Customer.create({ id: ids.customer, companyId: ids.company, name: "F003 customer", phone: "000", balance: 3 });
    const user = await User.create({
      id: ids.user,
      companyId: ids.company,
      firstName: "F003",
      lastName: "Verifier",
      email: `f003-${stamp}@local.invalid`,
      phone: "000",
      password: "not-used-by-verifier",
      role: "admin",
      accountType: "legacy",
      branchId: ids.branch,
      isActive: true,
    });
    const tokens = await technicalSessions.issueTokens(user, { headers: {}, ip: "127.0.0.1" });
    const headers = {
      Authorization: `Bearer ${tokens.token}`,
      "X-Company-ID": ids.company,
      "X-Branch-ID": ids.branch,
      "Content-Type": "application/json",
    };
    const pay = async (installmentId, amount, key) => {
      const response = await fetch(`${base}/installments/${installmentId}/pay`, {
        method: "POST",
        headers: { ...headers, "Idempotency-Key": key },
        body: JSON.stringify({ amount, paymentMethod: "Cash" }),
      });
      return { status: response.status, body: await response.json() };
    };

    await createInstallment(ids.exactInvoice, ids.exactInstallment, "1.0000");
    const countsBeforeRejected = {
      payments: await Payment.count({ where: { companyId: ids.company, invoiceId: ids.exactInvoice } }),
      treasury: await CashTransaction.count({ where: { companyId: ids.company, reference: ids.exactInvoice } }),
      journals: await JournalEntry.count({ where: { companyId: ids.company, sourceType: "installment_collection" } }),
      lines: await JournalLine.count(),
    };
    const rejected = await pay(ids.exactInstallment, "1.0001", `F003-over-${stamp}`);
    assert.equal(rejected.status, 422, "one minor unit above outstanding is rejected");
    assert.equal(rejected.body?.error?.code || rejected.body?.code, "INSTALLMENT_COLLECTION_AMOUNT_EXCEEDS_OUTSTANDING", "rejection uses the stable validation code");
    assert.deepEqual({
      payments: await Payment.count({ where: { companyId: ids.company, invoiceId: ids.exactInvoice } }),
      treasury: await CashTransaction.count({ where: { companyId: ids.company, reference: ids.exactInvoice } }),
      journals: await JournalEntry.count({ where: { companyId: ids.company, sourceType: "installment_collection" } }),
      lines: await JournalLine.count(),
    }, countsBeforeRejected, "over-limit rejection creates no financial rows");
    const unchanged = await Installment.findByPk(ids.exactInstallment);
    assertUnits(unchanged.paidAmount, "0.0000", "rejected amount does not update the installment");

    const exact = await pay(ids.exactInstallment, "1.0000", `F003-exact-${stamp}`);
    assert.equal(exact.status, 200, "exact outstanding succeeds");
    const replay = await pay(ids.exactInstallment, "1.0000", `F003-exact-${stamp}`);
    assert.equal(replay.status, 200, "same-key exact replay succeeds without duplication");
    assert.equal(await Payment.count({ where: { companyId: ids.company, invoiceId: ids.exactInvoice } }), 1, "exact replay does not duplicate the Payment event");

    await createInstallment(ids.precisionInvoice, ids.precisionInstallment, "1.0000");
    assert.equal((await pay(ids.precisionInstallment, "0.3333", `F003-p1-${stamp}`)).status, 200, "four-decimal partial collection succeeds");
    assert.equal((await pay(ids.precisionInstallment, "0.6667", `F003-p2-${stamp}`)).status, 200, "exact four-decimal remainder succeeds");
    const precision = await Installment.findByPk(ids.precisionInstallment);
    assertUnits(precision.paidAmount, "1.0000", "four-decimal partials settle exactly without float drift");

    await createInstallment(ids.concurrentInvoice, ids.concurrentInstallment, "1.0000");
    const concurrent = await Promise.all([
      pay(ids.concurrentInstallment, "0.6000", `F003-c1-${stamp}`),
      pay(ids.concurrentInstallment, "0.6000", `F003-c2-${stamp}`),
    ]);
    assert.deepEqual(concurrent.map((result) => result.status).sort((a, b) => a - b), [200, 422], "concurrent over-collection serializes to one success and one rejection");
    const concurrentInstallment = await Installment.findByPk(ids.concurrentInstallment);
    assertUnits(concurrentInstallment.paidAmount, "0.6000", "concurrent accepted total never exceeds the opening outstanding");
    assert.equal(await Payment.count({ where: { companyId: ids.company, invoiceId: ids.concurrentInvoice } }), 1, "concurrent rejection creates no duplicate Payment");
    assert.equal(await CashTransaction.count({ where: { companyId: ids.company, reference: ids.concurrentInvoice } }), 1, "concurrent rejection creates no duplicate Treasury movement");
    const journals = await JournalEntry.findAll({ where: { companyId: ids.company, sourceType: "installment_collection" } });
    assert.equal(journals.length, 4, "each accepted collection retains one durable event journal");
    for (const journal of journals) assert.equal(Number(journal.totalDebit), Number(journal.totalCredit), "accepted collection journal is balanced");

    console.log("verify-installment-overcollection-concurrency: ok");
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error(`verify-installment-overcollection-concurrency: failed: ${error.message}`);
  process.exitCode = 1;
});
