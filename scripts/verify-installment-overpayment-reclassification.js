"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const routePath = path.join(root, "backend", "src", "routes", "erp.routes.js");
const servicePath = path.join(root, "backend", "src", "services", "installment-overpayment-reclassification.service.js");
const route = fs.readFileSync(routePath, "utf8");

assert.ok(fs.existsSync(servicePath), "installment overpayment reclassification service must exist");
const service = require(servicePath);

for (const name of ["reclassifyInstallmentOverpayment", "moneyToTenThousandths", "moneyFromTenThousandths"]) {
  assert.equal(typeof service[name], "function", `${name} must be exported`);
}

assert.ok(route.includes('router.post("/installment-collections/:paymentId/reclassify-overpayment"'), "Product route must accept only the original collection payment reference");
assert.ok(route.includes('requireBusinessPermission("accounting.post", { touch: true })'), "route requires canonical accounting.post permission");
assert.ok(route.includes('idemScope = "installment.overpayment_reclassification"'), "route requires dedicated idempotency scope");
assert.ok(!route.includes('reclassify-overpayment", authMiddleware, requireBusinessPermission("accounting.post", { touch: true }), async (req, res, next) => {\n  try {\n    const amount'), "route must not treat a client amount as authority");

const calls = { credit: [], audit: [] };
const ids = { company: "CMP", branch: "BR", invoice: "INV", customer: "CUS", installment: "INST", crossing: "PAY-CROSS", earlier: "PAY-EARLY" };
const paymentRows = [
  { id: ids.earlier, companyId: ids.company, invoiceId: ids.invoice, branchId: ids.branch, amount: "5.0000", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: ids.crossing, companyId: ids.company, invoiceId: ids.invoice, branchId: ids.branch, amount: "5.0001", createdAt: "2026-01-02T00:00:00.000Z" },
];
const auditRows = paymentRows.map((payment) => ({
  action: "sales.installment.collect", sourceDocument: ids.invoice,
  after: JSON.stringify({ installmentId: ids.installment, paymentId: payment.id }),
}));
const models = {
  Payment: {
    async findOne({ where }) { return paymentRows.find((row) => row.id === where.id && row.companyId === where.companyId) || null; },
    async findAll() { return paymentRows; },
  },
  AuditLog: { async findAll() { return auditRows; } },
  Installment: {
    row: { id: ids.installment, companyId: ids.company, invoiceId: ids.invoice, customerId: ids.customer, amount: "10.0000", paidAmount: "10.0001", status: "paid" },
    async findOne() { return { ...this.row, async update(values) { Object.assign(models.Installment.row, values); } }; },
  },
  Invoice: { async findOne() { return { id: ids.invoice, companyId: ids.company, customerId: ids.customer, branchId: ids.branch }; } },
  Customer: { async findOne() { return { id: ids.customer, companyId: ids.company, status: "active" }; } },
  CustomerCreditTransaction: { async findOne() { return null; } },
  JournalEntry: { async findOne() { return { id: "ORIGINAL-JOURNAL", companyId: ids.company }; } },
  CashTransaction: { async findOne() { return { id: "ORIGINAL-TREASURY", companyId: ids.company }; } },
};
const result = service.reclassifyInstallmentOverpayment;

(async () => {
  const out = await result({
    models, companyId: ids.company, branchId: ids.branch, originalPaymentId: ids.crossing,
    transaction: { LOCK: { UPDATE: "UPDATE" } }, actor: { id: "ACTOR", name: "Actor" },
    customerCreditService: {
      async recordCreditIn(args) { calls.credit.push(args); return { id: "CCT", journalEntryId: "JE" }; },
    },
    resolveAccounts: async () => ({ receivableAccount: { id: "AR" }, customerDepositAccount: { id: "DEP" } }),
    auditService: { async record(_companyId, payload) { calls.audit.push(payload); } },
  });
  assert.equal(out.overageAmount, "0.0001", "overage must retain exact four-decimal units");
  assert.equal(calls.credit.length, 1, "one customer-credit event is created");
  assert.equal(calls.credit[0].amount, "0.0001", "credit uses server-calculated exact overage");
  assert.equal(calls.credit[0].sourceType, "overpayment", "credit has canonical overpayment source type");
  assert.equal(calls.credit[0].sourceId, ids.crossing, "credit is immutably linked to the crossing payment");
  assert.equal(calls.credit[0].cashTransactionId, null, "reclassification creates no Treasury movement");
  assert.equal(calls.credit[0].glPosting.debitAccountId, "AR", "receivable is debited");
  assert.equal(calls.credit[0].glPosting.creditAccountId, "DEP", "customer deposit liability is credited");
  assert.equal(calls.audit.length, 1, "one audit event is recorded");
  assert.equal(models.Installment.row.paidAmount, "10.0000", "derived installment applied amount is corrected without editing a Payment");

  await assert.rejects(
    () => result({
      models, companyId: ids.company, branchId: ids.branch, originalPaymentId: ids.earlier,
      transaction: { LOCK: { UPDATE: "UPDATE" } }, actor: { id: "ACTOR", name: "Actor" },
      customerCreditService: { async recordCreditIn() { throw new Error("must not create"); } },
      resolveAccounts: async () => ({ receivableAccount: { id: "AR" }, customerDepositAccount: { id: "DEP" } }),
      auditService: { async record() {} },
    }),
    (error) => error && error.errorCode === "OVERPAYMENT_SOURCE_PAYMENT_INVALID",
    "a non-crossing payment is rejected without an effect",
  );

  console.log("verify-installment-overpayment-reclassification: ok");
})().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
