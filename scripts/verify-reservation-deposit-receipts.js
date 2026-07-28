"use strict";

// Focused, non-destructive receipt-subsystem contract verifier.  It deliberately
// does not connect to a database: migration execution and authenticated reads
// are verified separately against the approved local development target.
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const migration = require(path.join(root, "backend/migrations/20260721030000-reservation-deposit-receipt-documents.js"));
const receiptService = require(path.join(root, "backend/src/services/reservation-deposit-receipt.service.js"));

async function migrationContract() {
  const calls = [];
  const sequelize = {
    literal: (value) => ({ value }),
    transaction: async (callback) => callback({ id: "test-transaction" })
  };
  const queryInterface = {
    sequelize,
    createTable: async (name, columns, options) => calls.push({ kind: "table", name, columns, options }),
    addIndex: async (name, columns, options) => calls.push({ kind: "index", name, columns, options })
  };
  await migration.up(queryInterface);
  const sequence = calls.find((call) => call.kind === "table" && call.name === "reservation_deposit_receipt_sequences");
  const documents = calls.find((call) => call.kind === "table" && call.name === "reservation_deposit_receipt_documents");
  assert(sequence, "sequence table is created");
  assert(documents, "immutable receipt document table is created");
  for (const field of ["company_id", "branch_id", "sequence_year", "next_value"]) assert(field in sequence.columns, `sequence contains ${field}`);
  for (const field of ["reservation_payment_id", "receipt_number", "snapshot", "posted_at", "employee_id"]) assert(field in documents.columns, `document contains ${field}`);
  assert.equal(documents.columns.reservation_payment_id.references.model, "reservation_payments", "document binds a payment FK");
  assert.equal(documents.columns.employee_id.references.model, "employees", "document binds the trusted employee FK");
  const indexes = calls.filter((call) => call.kind === "index");
  assert(indexes.some((call) => call.options.name === "reservation_deposit_receipt_payment_uq" && call.options.unique), "one receipt per payment is enforced");
  assert(indexes.some((call) => call.options.name === "reservation_deposit_receipt_number_uq" && call.options.unique), "receipt number is globally immutable and unique");
  assert(indexes.some((call) => call.options.name === "reservation_deposit_receipt_sequence_uq" && call.options.unique), "branch/year sequence uniqueness is enforced");
  await assert.rejects(() => migration.down(), /Irreversible financial-document migration/, "down migration refuses unsafe evidence deletion");
}

function sourceContract() {
  const service = read("backend/src/services/reservation-deposit-receipt.service.js");
  const reservationService = read("backend/src/services/reservation.service.js");
  const routes = read("backend/src/routes/erp.routes.js");
  const models = read("backend/src/models/index.js");
  const printPage = read("app/[locale]/(dashboard)/sales/reservations/receipts/[receiptId]/page.tsx");
  const historyPage = read("app/[locale]/(dashboard)/sales/reservations/[id]/receipt-history/page.tsx");

  assert(service.includes("ON CONFLICT (company_id, branch_id, sequence_year) DO NOTHING"), "allocator initializes one branch/year row safely");
  assert(service.includes("SET next_value = next_value + 1") && service.includes("RETURNING next_value - 1 AS value"), "allocator increments atomically");
  assert(service.includes("DEP-${code}-${year}-${String(value).padStart(6, \"0\")}"), "receipt number uses the server-owned branch/year sequence");
  assert(service.includes("LEGACY_PAYMENT_WITHOUT_IMMUTABLE_RECEIPT"), "legacy payment absence has a stable explicit result");
  assert(service.includes("LEGACY_BRANCHLESS_RESERVATION_MANUAL_REVIEW"), "branchless legacy history requires manual review");
  assert(service.includes("depositTaxAmount: \"0.0000\""), "deposit receipt never fabricates deposit VAT");
  assert(service.includes("models.Company.findOne") && service.includes("models.Customer.findOne") && service.includes("models.Asset.findAll"), "snapshot is built from authoritative server records");
  assert(reservationService.includes("createImmutableDocument({ payment, reservation, actor, transaction, allocation })"), "receipt creation is in the payment transaction");
  assert(reservationService.includes("responseBody: { ...prior.responseBody, replay: true }"), "same-key payment replay is explicit");
  assert(routes.includes('"/reservation-deposit-receipts/number/:receiptNumber"') && routes.includes('"/reservation-deposit-receipts/:receiptId"'), "receipt lookup routes exist");
  assert(routes.includes('"/reservation-payments/:paymentId/deposit-receipt"') && routes.includes('"/reservations/:id/deposit-receipts"'), "payment lookup and history routes exist");
  assert(routes.includes("requireBusinessPermission(reservationPerms.viewReceipts)"), "receipt reads require the dedicated permission");
  assert(models.includes("ReservationPayment.hasOne(ReservationDepositReceiptDocument") && models.includes("ReservationDepositReceiptDocument.belongsTo(Employee"), "receipt associations are registered");
  assert(printPage.includes("window.print()") && printPage.includes("receipt.snapshot"), "print UI reads the immutable snapshot only");
  assert(historyPage.includes("/deposit-receipts?limit=50"), "history UI uses the receipt-history endpoint");
}

function resourceContract() {
  const source = {
    id: "RDR-1", receiptNumber: "DEP-BR-2026-000001", reservationId: "RES-1", reservationPaymentId: "PAY-1",
    branchId: "BR-1", postedAt: new Date("2026-07-25T10:00:00.000Z"), status: "issued", snapshotVersion: 1,
    snapshot: { payment: { amount: "12.0000", currency: "AED", method: "cash" }, financialSummary: { cumulativeReceived: "12.0000" } }
  };
  const resource = receiptService.receiptResource(source);
  assert.deepEqual(resource.paymentId, "PAY-1", "receipt response exposes the payment identity");
  assert.equal(resource.snapshot.payment.amount, "12.0000", "receipt response preserves the snapshot exactly");
  const history = receiptService.historyRow(source);
  assert.equal(history.receiptNumber, source.receiptNumber, "history exposes immutable receipt number");
  assert.equal(history.currentPaymentAmount, "12.0000", "history exposes snapshot payment amount");
}

(async () => {
  await migrationContract();
  sourceContract();
  resourceContract();
  console.log("reservation deposit receipt contract verifier: PASS");
})().catch((error) => {
  console.error(`reservation deposit receipt contract verifier: FAIL\n${error.stack || error.message}`);
  process.exitCode = 1;
});
