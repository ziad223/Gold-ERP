#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const rollback = new Error("ROLLBACK_FINANCIAL_PRECISION_DISPOSABLE_PROOF");
const SCALE = 10000n;

function units(value) {
  const text = String(value ?? "").trim();
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * SCALE + BigInt(`${fraction}0000`.slice(0, 4));
}

function money(value) {
  return `${value / SCALE}.${(value % SCALE).toString().padStart(4, "0")}`;
}

function staticContract() {
  const posting = read("backend/src/services/posting.service.js");
  const register = read("backend/src/services/cash-register.service.js");
  const route = read("backend/src/routes/erp.routes.js");
  const remediation = read("backend/src/services/installment-precision-remediation.service.js");

  assert.match(posting, /postInstallmentPayment[\s\S]*?precision: 4/, "installment posting selects exact four-decimal Journal mode");
  const installmentBody = posting.match(/postInstallmentPayment\([\s\S]*?\n  }/)[0];
  assert.equal(installmentBody.includes("const amt = round(amount);"), false, "installment posting no longer rounds to cents before Journal creation");
  assert.match(register, /\* 10000\) \/ 10000/, "cash-register accounting calculation preserves four decimals");
  assert.match(route, /\/installment-collections\/:paymentId\/remediate-precision/, "precision remediation Product route exists");
  assert.match(route, /installment\.precision_remediation/, "precision remediation has a distinct idempotency scope");
  assert.match(remediation, /sourceType: REMEDIATION_SOURCE_TYPE/, "remediation Journal has a distinct source type");
  assert.match(remediation, /sourceId: payment\.id/, "remediation source identity is the original durable Payment");
  assert.match(remediation, /deltaUnits !== arDeltaUnits/, "remediation rejects non-precision economic/AR divergence");
  assert.match(remediation, /cashTransaction|CashTransaction/, "remediation validates original Treasury linkage");
  console.log("verify-installment-precision-remediation: static contract passed");
}

async function runDisposableProof() {
  const database = String(process.env.FINANCIAL_PRECISION_VERIFY_DATABASE || "");
  if (!/^darfus_fin_precision_verify_[a-z0-9_]+$/i.test(database)) {
    throw new Error("FINANCIAL_PRECISION_VERIFY_DATABASE must be an owned disposable database name");
  }

  require(path.join(ROOT, "backend", "node_modules", "dotenv")).config({ path: path.join(ROOT, "backend", ".env") });
  const models = require(path.join(ROOT, "backend", "src", "models"));
  const { Op } = require(path.join(ROOT, "backend", "node_modules", "sequelize"));
  const financialBootstrap = require(path.join(ROOT, "backend", "src", "services", "financial-bootstrap.service"));
  const posting = require(path.join(ROOT, "backend", "src", "services", "posting.service"));
  const remediation = require(path.join(ROOT, "backend", "src", "services", "installment-precision-remediation.service"));
  const { sequelize, Company, Branch, Customer, Invoice, Installment, Payment, JournalEntry, JournalLine, CashTransaction, Account, AuditLog } = models;
  const stamp = require("node:crypto").randomUUID().replace(/-/g, "").slice(0, 12);
  const companyId = `CMP-PREC-${stamp}`;
  const branchId = `LOCAL-PREC-${stamp}`;
  const customerId = `CUS-PREC-${stamp}`;
  const invoiceId = `INV-PREC-${stamp}`;
  const installmentId = `INST-PREC-${stamp}`;
  const amounts = ["5.3750", "5.3850", "4.4150", "4.4150", "5.2980"];
  const accounts = ["cash", "bank", "cash", "cash", "cash"];
  const paymentIds = amounts.map((_, i) => `PAY-PREC-${i}-${stamp}`);

  try {
    await sequelize.authenticate();

    // Prove the repaired normal installment path posts exact four decimals.
    await sequelize.transaction(async (transaction) => {
      await Company.create({ id: companyId, businessName: "Precision verifier exact", workspace: `prec-exact-${stamp}`, currency: "AED" }, { transaction });
      await Branch.create({ id: branchId, companyId, name: "Precision Branch", code: `PREC-${stamp.slice(-4)}`, type: "store", isActive: true }, { transaction });
      await financialBootstrap.reconcile({ models, companyId, branchId, actorId: "precision-verifier", transaction });
      const exactJournal = await posting.postInstallmentPayment(
        { companyId, branchId, invoiceId, sequence: 1 },
        "631.0750",
        "Cash",
        "Verifier",
        { transaction, branchId, collectionEventId: `PAY-EXACT-${stamp}` },
      );
      const lines = await JournalLine.findAll({ where: { journalEntryId: exactJournal.id }, transaction });
      assert.equal(lines.length, 2, "exact installment Journal has two lines");
      assert.deepEqual(lines.map((line) => [money(units(line.debit)), money(units(line.credit))]).sort(), [["0.0000", "631.0750"], ["631.0750", "0.0000"]]);
      throw rollback;
    }).catch((error) => { if (error !== rollback) throw error; });

    // Rehearse all five historical source-linked corrections in one disposable
    // transaction. The fixture intentionally uses the old cent-rounded default
    // posting only to model immutable historical rows; the Product workflow
    // itself uses exact posting and normal Account.balance updates.
    await sequelize.transaction(async (transaction) => {
      await Company.create({ id: companyId, businessName: "Precision verifier remediation", workspace: `prec-rem-${stamp}`, currency: "AED" }, { transaction });
      await Branch.create({ id: branchId, companyId, name: "Precision Branch", code: `PREC-${stamp.slice(-4)}`, type: "store", isActive: true }, { transaction });
      await financialBootstrap.reconcile({ models, companyId, branchId, actorId: "precision-verifier", transaction });
      await Customer.create({ id: customerId, companyId, name: "Precision verifier customer", phone: "000", balance: 1000 }, { transaction });
      await Invoice.create({ id: invoiceId, companyId, customerId, customerName: "Precision verifier customer", type: "installment", total: 1000, subtotal: 1000, tax: 0, date: "2026-08-03", status: "due", postingStatus: "posted", paymentMethod: "installment", branch: "Precision Branch", branchId }, { transaction });
      await Installment.create({ id: installmentId, companyId, invoiceId, customerId, customerName: "Precision verifier customer", sequence: 1, dueDate: "2026-09-03", amount: 1000, paidAmount: 0, status: "pending", branch: "Precision Branch" }, { transaction });

      const originals = [];
      for (let i = 0; i < amounts.length; i += 1) {
        const payment = await Payment.create({ id: paymentIds[i], companyId, branchId, invoiceId, paymentMethod: accounts[i] === "bank" ? "Bank Transfer" : "Cash", amount: amounts[i], reference: `PREC-${i}`, date: "2026-08-03", notes: `Installment #1` }, { transaction });
        const journal = await posting.postEntry(companyId, {
          description: "Historical precision fixture",
          date: "2026-08-03",
          sourceType: "installment_collection",
          sourceId: payment.id,
          postedBy: "Verifier",
          transaction,
          branchId,
        }, [
          { mappingRole: accounts[i] === "cash" ? "CASH_TREASURY" : "BANK_ACCOUNT", debit: amounts[i], credit: 0, description: "Fixture Treasury" },
          { mappingRole: "ACCOUNTS_RECEIVABLE", debit: 0, credit: amounts[i], description: "Fixture AR" },
        ]);
        const treasury = await CashTransaction.create({ id: `TX-PREC-${i}-${stamp}`, companyId, type: "cash_in", account: accounts[i], amount: amounts[i], category: "Precision fixture", description: "Historical precision fixture", reference: invoiceId, branch: "Precision Branch", branchId, date: "2026-08-03", createdBy: "Verifier", status: "posted", journalEntryId: journal.id }, { transaction });
        const journalLines = await JournalLine.findAll({ where: { journalEntryId: journal.id }, transaction });
        originals.push({ paymentAmount: payment.amount, treasuryAmount: treasury.amount, journalId: journal.id, journalLines: journalLines.map((line) => [line.debit, line.credit]) });
      }

      for (let i = 0; i < paymentIds.length; i += 1) {
        const result = await remediation.remediateInstallmentPrecision({ models, companyId, branchId, originalPaymentId: paymentIds[i], transaction, actor: { id: "precision-verifier", name: "Verifier" } });
        assert.equal(result.correctionAmount, ["0.0050", "0.0050", "0.0050", "0.0050", "0.0020"][i]);
        assert.equal(result.treasuryDelta, "0.0000");
      }

      const correctionCount = await JournalEntry.count({ where: { companyId, sourceType: remediation.REMEDIATION_SOURCE_TYPE }, transaction });
      const correctionTreasuryCount = await CashTransaction.count({ where: { companyId, journalEntryId: { [Op.in]: (await JournalEntry.findAll({ where: { companyId, sourceType: remediation.REMEDIATION_SOURCE_TYPE }, attributes: ["id"], transaction })).map((row) => row.id) } }, transaction });
      assert.equal(correctionCount, 5, "five source-linked correction Journals are created");
      assert.equal(correctionTreasuryCount, 0, "correction Journals create no Treasury rows");

      const cashAccount = await Account.findOne({ where: { companyId, code: "SYS-CASH" }, transaction });
      const bankAccount = await Account.findOne({ where: { companyId, code: "SYS-BANK" }, transaction });
      assert.equal(money(units(cashAccount.balance)), "19.5030", "cash mirror equals exact fixture Treasury after correction");
      assert.equal(money(units(bankAccount.balance)), "5.3850", "bank mirror equals exact fixture Treasury after correction");

      for (let i = 0; i < paymentIds.length; i += 1) {
        const payment = await Payment.findByPk(paymentIds[i], { transaction });
        const treasury = await CashTransaction.findOne({ where: { companyId, reference: invoiceId, amount: amounts[i], account: accounts[i] }, order: [["created_at", "ASC"]], transaction });
        const original = originals[i];
        assert.equal(money(units(payment.amount)), money(units(original.paymentAmount)), "original Payment is unchanged");
        assert.equal(money(units(treasury.amount)), money(units(original.treasuryAmount)), "original Treasury is unchanged");
        const originalLines = await JournalLine.findAll({ where: { journalEntryId: original.journalId }, order: [["id", "ASC"]], transaction });
        assert.deepEqual(originalLines.map((line) => [money(units(line.debit)), money(units(line.credit))]), original.journalLines.map((line) => [money(units(line[0])), money(units(line[1]))]), "original Journal lines are unchanged");
        await assert.rejects(
          () => remediation.remediateInstallmentPrecision({ models, companyId, branchId, originalPaymentId: paymentIds[i], transaction, actor: { name: "Verifier" } }),
          (error) => error && error.errorCode === "INSTALLMENT_PRECISION_ALREADY_REMEDIATED",
          "different-key duplicate remediation is rejected",
        );
      }

      const auditCount = await AuditLog.count({ where: { companyId, action: "installment_precision_remediation" }, transaction });
      assert.equal(auditCount, 5, "each correction has an audit record");
      throw rollback;
    }).catch((error) => { if (error !== rollback) throw error; });

    console.log("verify-installment-precision-remediation: disposable contract passed");
  } finally {
    await sequelize.close();
  }
}

try {
  staticContract();
  if (process.env.FINANCIAL_PRECISION_VERIFY_DATABASE) {
    runDisposableProof().catch((error) => {
      console.error(`verify-installment-precision-remediation: disposable contract failed: ${error.message}`);
      process.exitCode = 1;
    });
  }
} catch (error) {
  console.error(`verify-installment-precision-remediation: static contract failed: ${error.message}`);
  process.exitCode = 1;
}
