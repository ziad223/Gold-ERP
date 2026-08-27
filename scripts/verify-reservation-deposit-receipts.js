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
  const receiptContract = read("lib/api/reservation-deposit-receipt-contract.ts");
  const globalStyles = read("app/globals.css");

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
  assert.match(routes, /router\.get\("\/reservation-deposit-receipts\/number\/:receiptNumber", authMiddleware, requireBusinessPermission\(reservationPerms\.viewReceipts\), async \(req, res, next\) => \{[\s\S]{0,600}resolveAuthorizedBranchId\(/, "receipt-number reads retain authenticated branch authorization");
  assert.match(routes, /router\.get\("\/reservations\/:id\/deposit-receipts", authMiddleware, requireBusinessPermission\(reservationPerms\.viewReceipts\), async \(req, res, next\) => \{[\s\S]{0,600}resolveAuthorizedBranchId\(/, "receipt-history reads retain authenticated branch authorization");
  assert(service.includes("where: { companyId, ...where }") && service.includes("String(receipt.branchId) !== String(branchId)"), "receipt detail lookups remain company and branch scoped");
  assert(service.includes("where: { companyId, branchId, reservationId }") && service.includes("Reservation not found"), "receipt history remains company, branch, and reservation scoped");
  assert(models.includes("ReservationPayment.hasOne(ReservationDepositReceiptDocument") && models.includes("ReservationDepositReceiptDocument.belongsTo(Employee"), "receipt associations are registered");
  assert(receiptContract.includes("export function depositReceiptByIdPath") && receiptContract.includes("/reservation-deposit-receipts/${encodeURIComponent(depositReceiptIdFromRouteParam(receiptId))}"), "immutable RDR IDs have one explicit detail route");
  assert(receiptContract.includes("export function depositReceiptByNumberPath") && receiptContract.includes("/reservation-deposit-receipts/number/${encodeURIComponent(requiredIdentifier(receiptNumber, \"Deposit receipt number\", RECEIPT_NUMBER))}"), "DEP numbers have one explicit number route");
  assert(receiptContract.includes("export function reservationDepositReceiptHistoryPath") && receiptContract.includes("/reservations/${encodeURIComponent(reservationIdFromRouteParam(reservationId))}/deposit-receipts?limit=${safeLimit}"), "receipt history is explicitly reservation-owned");
  assert(!receiptContract.includes("reservations/sales/deposit-receipts") && !receiptContract.includes("reservation-deposit-receipts/receipt-history"), "stale static receipt paths are absent from the contract");
  assert(receiptContract.includes("depositReceiptIdFromRouteParam") && receiptContract.includes("reservationIdFromRouteParam") && receiptContract.includes("RDR_ID") && receiptContract.includes("RESERVATION_ID"), "route identifiers are fail-closed by canonical prefix");
  assert(historyPage.includes("useParams") && historyPage.includes("reservationDepositReceiptHistoryPath(reservationId)") && historyPage.includes("depositReceiptDetailPagePath(row.id)") && !historyPage.includes("window.location.pathname"), "history UI gets a Reservation route param and links only RDR receipt IDs");
  assert(printPage.includes("useParams") && printPage.includes("depositReceiptByIdPath(receiptId)") && !printPage.includes("window.location.pathname") && printPage.includes('data-print-root="true"') && printPage.includes('data-print-page="true"'), "detail UI gets an RDR route param, resets stale state, and marks its printable root");
  assert(historyPage.includes("let active = true") && printPage.includes("let active = true") && historyPage.includes("setError(null)") && printPage.includes("setReceipt(null)"), "navigation changes clear stale state and ignore late responses");
  assert(printPage.includes("window.print()") && printPage.includes("receipt.snapshot"), "print UI reads the immutable snapshot only");
  assert(globalStyles.includes('[data-app-shell="true"]:has([data-print-root="true"])') && globalStyles.includes('[data-print-page="true"] > :not([data-print-root="true"])'), "print CSS preserves only the marked receipt under AppShell");
  assert(globalStyles.includes('[data-app-sidebar="true"]') && globalStyles.includes('[data-app-header="true"]'), "print CSS continues to hide navigation chrome");
  assert(globalStyles.lastIndexOf('[data-app-shell="true"]:has([data-print-root="true"])') > globalStyles.indexOf('[data-app-shell="true"]'), "receipt print override follows the generic AppShell hide rule");
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
