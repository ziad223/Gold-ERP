#!/usr/bin/env node
"use strict";

// F002 contract: an Installment is an aggregate.  Each successful collection
// is a separate financial event and therefore needs its own journal identity.
// This static verifier intentionally does not connect to a database.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function installmentCollectionHandler(source) {
  const start = source.indexOf('router.post(\n  "/installments/:id/pay"');
  const end = source.indexOf("// ─────────────────────────────────────────────────────────────────────────────\n// GIFT VOUCHERS", start);
  assert.ok(start >= 0 && end > start, "installment collection handler is present");
  return source.slice(start, end);
}

async function disposableDatabaseContract() {
  const database = String(process.env.FINANCIAL_F002_VERIFY_DATABASE || "");
  if (!/^darfus_fin_f002_(fresh|upgrade)_verify_[a-z0-9_]+$/i.test(database)) {
    throw new Error("FINANCIAL_F002_VERIFY_DATABASE must be an owned disposable database name");
  }

  require(path.join(ROOT, "backend", "node_modules", "dotenv")).config({ path: path.join(ROOT, "backend", ".env") });
  const models = require(path.join(ROOT, "backend", "src", "models"));
  const financialBootstrap = require(path.join(ROOT, "backend", "src", "services", "financial-bootstrap.service"));
  const posting = require(path.join(ROOT, "backend", "src", "services", "posting.service"));
  const { sequelize, Company, Branch, Customer, Invoice, Installment, Payment, JournalEntry, JournalLine } = models;
  const stamp = require("node:crypto").randomUUID().replace(/-/g, "").slice(0, 12);
  const companyId = `CMP-F002-${stamp}`;
  const branchId = `LOCAL-F002-${stamp}`;
  const customerId = `CUS-F002-${stamp}`;
  const invoiceId = `INV-F002-${stamp}`;
  const installmentId = `INST-F002-${stamp}`;
  const paymentIds = ["CASH", "BANK", "FINAL"].map((kind) => `PAY-F002-${kind}-${stamp}`);
  const rollback = new Error("ROLLBACK_FINANCIAL_F002_DISPOSABLE_PROOF");

  try {
    await sequelize.authenticate();
    await sequelize.transaction(async (transaction) => {
      await Company.create({ id: companyId, businessName: "F002 verifier", workspace: `f002-${stamp}`, currency: "AED" }, { transaction });
      await Branch.create({ id: branchId, companyId, name: "F002 branch", code: `F002-${stamp.slice(-4)}`, type: "store", isActive: true }, { transaction });
      await financialBootstrap.reconcile({ models, companyId, branchId, actorId: "financial-f002-verifier", transaction });
      await Customer.create({ id: customerId, companyId, name: "F002 customer", phone: "000", balance: 100 }, { transaction });
      await Invoice.create({ id: invoiceId, companyId, customerId, customerName: "F002 customer", type: "installment", total: 100, subtotal: 100, tax: 0, date: "2026-07-30", status: "due", postingStatus: "posted", paymentMethod: "installment", branch: "F002 branch", branchId }, { transaction });
      await Installment.create({ id: installmentId, companyId, invoiceId, customerId, customerName: "F002 customer", sequence: 1, dueDate: "2026-08-30", amount: 100, paidAmount: 0, status: "pending", branch: "F002 branch" }, { transaction });
      await Payment.bulkCreate(paymentIds.map((id, index) => ({ id, companyId, branchId, invoiceId, paymentMethod: index === 1 ? "Bank Transfer" : "Cash", amount: [25, 25, 50][index], reference: "F002", date: "2026-07-30" })), { transaction });

      const installment = await Installment.findByPk(installmentId, { transaction });
      const collections = [];
      for (const [index, collectionEventId] of paymentIds.entries()) {
        collections.push(await posting.postInstallmentPayment(
          installment.toJSON(), [25, 25, 50][index], index === 1 ? "Bank Transfer" : "Cash", "Verifier", { transaction, branchId, collectionEventId }
        ));
      }
      const journals = await JournalEntry.findAll({ where: { companyId, sourceType: "installment_collection" }, order: [["id", "ASC"]], transaction });
      const lines = await JournalLine.findAll({ where: { journalEntryId: collections.map((journal) => journal.id) }, transaction });
      assert.equal(journals.length, 3, "three collection events create three journals for one installment");
      assert.deepEqual(journals.map((journal) => journal.sourceId).sort(), [...paymentIds].sort(), "each journal uses its durable Payment event identity");
      assert.equal(lines.length, 6, "each collection has exactly two balanced journal lines");
      for (const journal of journals) assert.equal(Number(journal.totalDebit), Number(journal.totalCredit), "every collection journal is balanced");
      await assert.rejects(
        () => posting.postInstallmentPayment(installment.toJSON(), 1, "Cash", "Verifier", { transaction, branchId, collectionEventId: paymentIds[0] }),
        (error) => error && (error.name === "SequelizeUniqueConstraintError" || error.parent?.code === "23505")
      );
      await assert.rejects(
        () => posting.postInstallmentPayment(installment.toJSON(), 1, "Cash", "Verifier", { transaction, branchId }),
        (error) => error && error.errorCode === "INSTALLMENT_COLLECTION_EVENT_REQUIRED"
      );
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await sequelize.close();
  }
}

try {
  const route = installmentCollectionHandler(read("backend/src/routes/erp.routes.js"));
  const posting = read("backend/src/services/posting.service.js");

  assert.ok(
    route.includes("collectionEventId: installmentPayment.id"),
    "the durable Payment created by this collection is passed as its journal event identity"
  );
  assert.ok(
    posting.includes('sourceType: "installment_collection"'),
    "installment collections use a distinct journal source domain"
  );
  assert.ok(
    posting.includes("sourceId: collectionEventId"),
    "journal source identity is the individual collection event, not the installment aggregate"
  );
  assert.ok(
    posting.includes("INSTALLMENT_COLLECTION_EVENT_REQUIRED"),
    "posting fails closed if a caller omits the durable collection event"
  );
  assert.equal(
    posting.includes('sourceType: "installment",\n        sourceId: installment.id'),
    false,
    "repeated collections cannot reuse the aggregate installment journal identity"
  );

  if (process.env.FINANCIAL_F002_VERIFY_DATABASE) {
    disposableDatabaseContract()
      .then(() => console.log("REPEATED INSTALLMENT COLLECTION EVENT IDENTITY DISPOSABLE CONTRACT PASSED"))
      .catch((error) => {
        console.error(`REPEATED INSTALLMENT COLLECTION EVENT IDENTITY DISPOSABLE CONTRACT FAILED: ${error.message}`);
        process.exitCode = 1;
      });
  }
  console.log("REPEATED INSTALLMENT COLLECTION EVENT IDENTITY STATIC CONTRACT PASSED");
} catch (error) {
  console.error(`REPEATED INSTALLMENT COLLECTION EVENT IDENTITY STATIC CONTRACT FAILED: ${error.message}`);
  process.exitCode = 1;
}
