"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  runMandatoryCell,
  runConfigurationCell,
  withScopedFailure,
  isAllowedNamespace,
  decimalUnits,
  assertJournalBalance,
  signedLineMovement,
  assertNoIntegrityCounts,
  normalizeCell,
} = require("../backend/scripts/verify-reservation-deposit-full-acceptance.js");
const receiptService = require("../backend/src/services/reservation-deposit-receipt.service");
const idempotencyService = require("../backend/src/services/idempotency.service");
const models = require("../backend/src/models");

test("mandatory cell reports PASS and retains its evidence", async () => {
  const result = await runMandatoryCell({
    id: "TEST_PASS",
    title: "pass",
    expected: "evidence",
    run: async cell => { cell.actual = "proved"; },
  });
  assert.equal(result.status, "PASS");
  assert.equal(result.actual, "proved");
});

test("mandatory cell reports FAIL when its assertion fails", async () => {
  await assert.rejects(
    runMandatoryCell({
      id: "TEST_FAIL",
      title: "fail",
      expected: "failure propagation",
      run: async () => { const error = new Error("expected failure"); error.errorCode = "TEST_FAILURE"; throw error; },
    }),
    /expected failure/
  );
});

test("scoped failure confirms the transaction and restores the original method", async () => {
  const original = async () => "original";
  const target = { persist: original };
  const proof = await withScopedFailure({
    target,
    method: "persist",
    errorCode: "TEST_SCOPED_FAILURE",
    run: async observed => {
      await assert.rejects(target.persist({}, { transaction: { rollback() {} } }), error => error.errorCode === "TEST_SCOPED_FAILURE");
      return observed();
    },
  });
  assert.deepEqual(proof, { present: true, finished: null });
  assert.equal(target.persist, original);
  assert.equal(await target.persist(), "original");
});

test("namespace guard accepts only the explicit C16-C1 form", () => {
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C1-20260726-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C2-20260726-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C3-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C4-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C5-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C6-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C7-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C8-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C9-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C10-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C11-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C12-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C12-CONT1-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C13-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C14-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C15-RUN1-20260727-RUN1"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C15-RUN2-20260727-RUN2"), true);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-C15-RUN3-20260727-RUN3"), false);
  assert.equal(isAllowedNamespace("ACC-DEPOSIT-CONT5-C16-ARBITRARY"), false);
});

test("financial reconciliation uses exact fixed-point decimal units", () => {
  assert.equal(decimalUnits("20.0000"), decimalUnits("17.3913") + decimalUnits("2.6087"));
  assert.equal(decimalUnits("10.00000000") - decimalUnits("5.00000000"), decimalUnits("5"));
  assert.throws(() => decimalUnits("1.000000001"), /precision exceeds/);
});

test("financial reconciliation rejects an unbalanced journal and derives natural-side movement", () => {
  assert.throws(() => assertJournalBalance({ id: "JE-BAD", totalDebit: "10", totalCredit: "9", lines: [{ id: "L1", debit: "10", credit: "0" }, { id: "L2", debit: "0", credit: "9" }] }), /must balance/);
  assert.equal(signedLineMovement({ debit: "10", credit: "0" }, "debit"), decimalUnits("10"));
  assert.equal(signedLineMovement({ debit: "0", credit: "10" }, "credit"), decimalUnits("10"));
  assert.equal(signedLineMovement({ debit: "5", credit: "0" }, "credit"), -decimalUnits("5"));
});

test("integrity audit fails closed for an orphan or duplicate count", () => {
  assert.doesNotThrow(() => assertNoIntegrityCounts({ orphan_payment: 0, duplicate_invoice: 0 }, "owned graph"));
  assert.throws(() => assertNoIntegrityCounts({ orphan_payment: 1 }, "owned graph"), /orphan_payment/);
});

test("repeatability normalization retains only stable suite evidence", () => {
  const normalized = normalizeCell({ id: "C15", status: "PASS", total: 2, cells: [{ id: "B", status: "PASS", writesDelta: "zero" }, { id: "A", status: "PASS", replay: "PASS" }] });
  assert.deepEqual(normalized.nested.map(item => item.id), ["A", "B"]);
  assert.equal(normalized.total, 2);
  assert.equal(normalized.status, "PASS");
});

test("configuration cell records exact zero-write rejection evidence", async () => {
  const matrix = { cells: [] };
  const before = { payments: 0, journals: 0 };
  const result = await runConfigurationCell(matrix, { id: "TEST-C12", operation: "Deposit", scenario: "rejected configuration", expected: "no writes", before: async () => before, execute: async () => {}, after: async () => ({ payments: 0, journals: 0 }), assert: row => assert.deepEqual(row.after, row.before) });
  assert.equal(result.status, "PASS");
  assert.equal(result.writesDelta, "zero");
  assert.equal(matrix.cells.length, 1);
});

test("scoped failure restores the immutable receipt persistence function", async () => {
  const original = receiptService.createImmutableDocument;
  await withScopedFailure({
    target: receiptService,
    method: "createImmutableDocument",
    errorCode: "TEST_RECEIPT_FAILURE",
    run: async () => {
      await assert.rejects(
        receiptService.createImmutableDocument({ transaction: { rollback() {} } }),
        error => error.errorCode === "TEST_RECEIPT_FAILURE"
      );
    },
  });
  assert.equal(receiptService.createImmutableDocument, original);
});

test("scoped failure restores idempotency success persistence with its transaction", async () => {
  const original = idempotencyService.succeed;
  await withScopedFailure({
    target: idempotencyService,
    method: "succeed",
    errorCode: "TEST_IDEMPOTENCY_FAILURE",
    verifyArgs: ({ request }) => assert.equal(request.key, "owned-key"),
    run: async observed => {
      await assert.rejects(
        idempotencyService.succeed({ request: { key: "owned-key" }, transaction: { rollback() {} } }),
        error => error.errorCode === "TEST_IDEMPOTENCY_FAILURE"
      );
      assert.deepEqual(observed(), { present: true, finished: null });
    },
  });
  assert.equal(idempotencyService.succeed, original);
});

test("scoped failure restores CashTransaction.create for the refund cash-out seam", async () => {
  const original = models.CashTransaction.create;
  await withScopedFailure({
    target: models.CashTransaction,
    method: "create",
    errorCode: "TEST_REFUND_CASH_FAILURE",
    verifyArgs: (values, opts) => { assert.equal(values.reference, "owned-refund"); assert.ok(opts.transaction); },
    run: async observed => {
      await assert.rejects(
        models.CashTransaction.create({ reference: "owned-refund" }, { transaction: { rollback() {} } }),
        error => error.errorCode === "TEST_REFUND_CASH_FAILURE"
      );
      assert.deepEqual(observed(), { present: true, finished: null });
    },
  });
  assert.equal(models.CashTransaction.create, original);
});

test("scoped failure restores JournalEntry.create for the owned Refund journal seam", async () => {
  const original = models.JournalEntry.create;
  await withScopedFailure({
    target: models.JournalEntry,
    method: "create",
    errorCode: "TEST_REFUND_JOURNAL_FAILURE",
    verifyArgs: (values, opts) => {
      assert.equal(values.sourceType, "reservation_refund");
      assert.equal(values.sourceId, "owned-refund");
      assert.ok(opts.transaction);
    },
    run: async observed => {
      await assert.rejects(
        models.JournalEntry.create({ sourceType: "reservation_refund", sourceId: "owned-refund" }, { transaction: { rollback() {} } }),
        error => error.errorCode === "TEST_REFUND_JOURNAL_FAILURE"
      );
      assert.deepEqual(observed(), { present: true, finished: null });
    },
  });
  assert.equal(models.JournalEntry.create, original);
});

test("scoped failure restores ReservationRefundAllocation.create for the owned Refund allocation seam", async () => {
  const original = models.ReservationRefundAllocation.create;
  await withScopedFailure({
    target: models.ReservationRefundAllocation,
    method: "create",
    errorCode: "TEST_REFUND_ALLOCATION_FAILURE",
    verifyArgs: (values, opts) => {
      assert.equal(values.reservationRefundId, "owned-refund");
      assert.equal(values.reservationPaymentId, "owned-payment");
      assert.equal(values.companyId, "owned-company");
      assert.ok(opts.transaction);
    },
    run: async observed => {
      await assert.rejects(
        models.ReservationRefundAllocation.create({ companyId: "owned-company", reservationRefundId: "owned-refund", reservationPaymentId: "owned-payment" }, { transaction: { rollback() {} } }),
        error => error.errorCode === "TEST_REFUND_ALLOCATION_FAILURE"
      );
      assert.deepEqual(observed(), { present: true, finished: null });
    },
  });
  assert.equal(models.ReservationRefundAllocation.create, original);
});

test("scoped failure restores idempotency success for the owned Refund execution seam", async () => {
  const original = idempotencyService.succeed;
  await withScopedFailure({
    target: idempotencyService,
    method: "succeed",
    errorCode: "TEST_REFUND_IDEMPOTENCY_FAILURE",
    verifyArgs: ({ request, statusCode, responseBody, transaction }) => {
      assert.equal(request.companyId, "owned-company");
      assert.equal(request.scope, "reservation.refund.execute");
      assert.equal(request.key, "owned-refund-key");
      assert.equal(statusCode, 200);
      assert.equal(responseBody.data.refund.id, "owned-refund");
      assert.ok(transaction);
    },
    run: async observed => {
      await assert.rejects(
        idempotencyService.succeed({ request: { companyId: "owned-company", scope: "reservation.refund.execute", key: "owned-refund-key" }, statusCode: 200, responseBody: { data: { refund: { id: "owned-refund" } } }, transaction: { rollback() {} } }),
        error => error.errorCode === "TEST_REFUND_IDEMPOTENCY_FAILURE"
      );
      assert.deepEqual(observed(), { present: true, finished: null });
    },
  });
  assert.equal(idempotencyService.succeed, original);
});

test("scoped failure restores Invoice.create for the owned Complete-sale persistence seam", async () => {
  const original = models.Invoice.create;
  await withScopedFailure({
    target: models.Invoice,
    method: "create",
    errorCode: "TEST_COMPLETE_SALE_INVOICE_FAILURE",
    verifyArgs: (values, opts) => {
      assert.equal(values.companyId, "owned-company");
      assert.equal(values.branchId, "owned-branch");
      assert.equal(values.relatedInvoiceId, "owned-reservation");
      assert.equal(values.type, "sale");
      assert.ok(opts.transaction);
    },
    run: async observed => {
      await assert.rejects(
        models.Invoice.create({ companyId: "owned-company", branchId: "owned-branch", relatedInvoiceId: "owned-reservation", type: "sale" }, { transaction: { rollback() {} } }),
        error => error.errorCode === "TEST_COMPLETE_SALE_INVOICE_FAILURE"
      );
      assert.deepEqual(observed(), { present: true, finished: null });
    },
  });
  assert.equal(models.Invoice.create, original);
});

test("scoped failure restores JournalEntry.create for the owned Complete-sale accounting seam", async () => {
  const original = models.JournalEntry.create;
  await withScopedFailure({
    target: models.JournalEntry,
    method: "create",
    errorCode: "TEST_COMPLETE_SALE_ACCOUNTING_FAILURE",
    verifyArgs: (values, opts) => { assert.equal(values.sourceType, "invoice"); assert.equal(values.sourceId, "owned-invoice"); assert.ok(opts.transaction); },
    run: async observed => {
      await assert.rejects(models.JournalEntry.create({ sourceType: "invoice", sourceId: "owned-invoice" }, { transaction: { rollback() {} } }), error => error.errorCode === "TEST_COMPLETE_SALE_ACCOUNTING_FAILURE");
      assert.deepEqual(observed(), { present: true, finished: null });
    },
  });
  assert.equal(models.JournalEntry.create, original);
});

test("scoped failure restores Deposit-application persistence for Complete-sale", async () => {
  const original = models.ReservationPaymentApplication.create;
  await withScopedFailure({ target: models.ReservationPaymentApplication, method: "create", errorCode: "TEST_COMPLETE_SALE_APPLICATION_FAILURE", verifyArgs: (values, opts) => { assert.equal(values.reservationId, "owned-reservation"); assert.equal(values.reservationPaymentId, "owned-payment"); assert.equal(values.finalInvoiceId, "owned-invoice"); assert.ok(opts.transaction); }, run: async observed => { await assert.rejects(models.ReservationPaymentApplication.create({ reservationId: "owned-reservation", reservationPaymentId: "owned-payment", finalInvoiceId: "owned-invoice" }, { transaction: { rollback() {} } }), error => error.errorCode === "TEST_COMPLETE_SALE_APPLICATION_FAILURE"); assert.deepEqual(observed(), { present: true, finished: null }); } });
  assert.equal(models.ReservationPaymentApplication.create, original);
});

test("scoped failure restores Complete-sale idempotency success persistence", async () => {
  const original = idempotencyService.succeed;
  await withScopedFailure({ target: idempotencyService, method: "succeed", errorCode: "TEST_COMPLETE_SALE_IDEMPOTENCY_FAILURE", verifyArgs: ({ request, statusCode, responseBody, transaction }) => { assert.equal(request.scope, "reservation.complete"); assert.equal(request.key, "owned-completion-key"); assert.equal(statusCode, 201); assert.equal(responseBody.data.invoice.id, "owned-invoice"); assert.ok(transaction); }, run: async observed => { await assert.rejects(idempotencyService.succeed({ request: { scope: "reservation.complete", key: "owned-completion-key" }, statusCode: 201, responseBody: { data: { invoice: { id: "owned-invoice" } } }, transaction: { rollback() {} } }), error => error.errorCode === "TEST_COMPLETE_SALE_IDEMPOTENCY_FAILURE"); assert.deepEqual(observed(), { present: true, finished: null }); } });
  assert.equal(idempotencyService.succeed, original);
});
