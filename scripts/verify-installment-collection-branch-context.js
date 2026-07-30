#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function installmentCollectionHandler(source) {
  const start = source.indexOf('router.post(\n  "/installments/:id/pay"');
  const end = source.indexOf("// ─────────────────────────────────────────────────────────────────────────────\n// GIFT VOUCHERS", start);
  assert.ok(start >= 0 && end > start, "installment collection handler is present");
  return source.slice(start, end);
}

async function disposableDatabaseContract() {
  const database = String(process.env.FINANCIAL_F001_VERIFY_DATABASE || "");
  if (!/^darfus_fin_f001_fix_verify_[a-z0-9_]+$/i.test(database)) {
    throw new Error("FINANCIAL_F001_VERIFY_DATABASE must be an owned disposable database name");
  }

  require(path.join(ROOT, "backend", "node_modules", "dotenv")).config({ path: path.join(ROOT, "backend", ".env") });
  const models = require(path.join(ROOT, "backend", "src", "models"));
  const financialBootstrap = require(path.join(ROOT, "backend", "src", "services", "financial-bootstrap.service"));
  const posting = require(path.join(ROOT, "backend", "src", "services", "posting.service"));
  const { sequelize, Company, Branch, Customer, Invoice, Installment, JournalEntry, JournalLine, BranchFinancialMapping } = models;
  const stamp = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const companyId = `CMP-F001-${stamp}`;
  const branchId = `LOCAL-${stamp}`;
  const customerId = `CUS-F001-${stamp}`;
  const cashInvoiceId = `INV-F001-C-${stamp}`;
  const bankInvoiceId = `INV-F001-B-${stamp}`;
  const cashInstallmentId = `INST-F001-C-${stamp}`;
  const bankInstallmentId = `INST-F001-B-${stamp}`;
  const rollback = new Error("ROLLBACK_FINANCIAL_F001_DISPOSABLE_PROOF");

  try {
    await sequelize.authenticate();
    await sequelize.transaction(async (transaction) => {
      await Company.create({ id: companyId, businessName: "F001 verifier", workspace: `f001-${stamp}`, currency: "AED" }, { transaction });
      await Branch.create({ id: branchId, companyId, name: "Display Branch Is Not Authority", code: `F001-${stamp.slice(-4)}`, type: "store", isActive: true }, { transaction });
      await financialBootstrap.reconcile({ models, companyId, branchId, actorId: "financial-f001-verifier", transaction });
      await Customer.create({ id: customerId, companyId, name: "F001 verifier customer", phone: "000", balance: 300 }, { transaction });
      await Invoice.bulkCreate([
        { id: cashInvoiceId, companyId, customerId, customerName: "F001 verifier customer", type: "installment", total: 100, subtotal: 100, tax: 0, date: "2026-07-30", status: "due", postingStatus: "posted", paymentMethod: "installment", branch: "Display Branch Is Not Authority", branchId },
        { id: bankInvoiceId, companyId, customerId, customerName: "F001 verifier customer", type: "installment", total: 200, subtotal: 200, tax: 0, date: "2026-07-30", status: "due", postingStatus: "posted", paymentMethod: "installment", branch: "Display Branch Is Not Authority", branchId },
      ], { transaction });
      await Installment.bulkCreate([
        { id: cashInstallmentId, companyId, invoiceId: cashInvoiceId, customerId, customerName: "F001 verifier customer", sequence: 1, dueDate: "2026-08-30", amount: 100, paidAmount: 0, status: "pending", branch: "Display Branch Is Not Authority" },
        { id: bankInstallmentId, companyId, invoiceId: bankInvoiceId, customerId, customerName: "F001 verifier customer", sequence: 1, dueDate: "2026-08-30", amount: 200, paidAmount: 0, status: "pending", branch: "Display Branch Is Not Authority" },
      ], { transaction });

      const cashInstallment = await Installment.findByPk(cashInstallmentId, { transaction });
      const bankInstallment = await Installment.findByPk(bankInstallmentId, { transaction });
      const cashJournal = await posting.postInstallmentPayment(cashInstallment.toJSON(), 100, "Cash", "Verifier", { transaction, branchId });
      const bankJournal = await posting.postInstallmentPayment(bankInstallment.toJSON(), 200, "Bank Transfer", "Verifier", { transaction, branchId });
      const journals = await JournalEntry.findAll({ where: { id: [cashJournal.id, bankJournal.id], companyId, branchId }, transaction });
      const lines = await JournalLine.findAll({ where: { journalEntryId: [cashJournal.id, bankJournal.id] }, transaction });
      const cashMapping = await BranchFinancialMapping.count({ where: { companyId, branchId, mappingType: "CASH_TREASURY", isActive: true }, transaction });
      const bankMapping = await BranchFinancialMapping.count({ where: { companyId, branchId, mappingType: "BANK_ACCOUNT", isActive: true }, transaction });
      assert.equal(branchId.startsWith("BR-"), false, "disposable proof uses a valid Product Branch ID without the legacy BR- prefix");
      assert.equal(journals.length, 2, "cash and bank installment postings create one Branch-scoped journal each");
      assert.equal(lines.length >= 4, true, "cash and bank installment postings create balanced journal lines");
      assert.equal(cashMapping, 1, "cash collection resolves one configured CASH_TREASURY mapping");
      assert.equal(bankMapping, 1, "bank collection resolves one configured BANK_ACCOUNT mapping");
      for (const journal of journals) {
        assert.equal(Number(journal.totalDebit), Number(journal.totalCredit), "installment journal is balanced");
      }
      await assert.rejects(
        () => posting.postInstallmentPayment(cashInstallment.toJSON(), 1, "Cash", "Verifier", { transaction }),
        (error) => error && error.errorCode === "FINANCIAL_BRANCH_REQUIRED"
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
  const routes = installmentCollectionHandler(read("backend/src/routes/erp.routes.js"));
  const posting = read("backend/src/services/posting.service.js");

  assert.ok(
    routes.includes("resolveAuthorizedBranchId(req, invoice.branchId, { required: true, transaction: t })"),
    "collection resolves the persisted invoice Branch ID through the Company-scoped authorization resolver"
  );
  assert.ok(
    !routes.includes('String(req.branchId).startsWith("BR-")'),
    "collection does not null a valid Product Branch ID with a legacy BR- prefix check"
  );
  assert.ok(
    routes.includes("inst.toJSON(), amount, method, actor, { transaction: t, branchId }"),
    "collection passes the authoritative Branch ID to installment posting"
  );
  assert.ok(
    posting.includes("branchId: opts.branchId || installment.branchId || null"),
    "installment posting accepts only an explicit or persisted identifier, never a display label"
  );
  assert.ok(
    !posting.includes("branchId: installment.branch || opts.branchId"),
    "installment display Branch is not financial mapping authority"
  );

  if (process.env.FINANCIAL_F001_VERIFY_DATABASE) {
    disposableDatabaseContract()
      .then(() => console.log("INSTALLMENT COLLECTION BRANCH CONTEXT DISPOSABLE CONTRACT PASSED"))
      .catch((error) => {
        console.error(`INSTALLMENT COLLECTION BRANCH CONTEXT DISPOSABLE CONTRACT FAILED: ${error.message}`);
        process.exitCode = 1;
      });
  }
  console.log("INSTALLMENT COLLECTION BRANCH CONTEXT STATIC CONTRACT PASSED");
} catch (error) {
  console.error(`INSTALLMENT COLLECTION BRANCH CONTEXT STATIC CONTRACT FAILED: ${error.message}`);
  process.exitCode = 1;
}
