import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const models = require("../backend/src/models");
const financialResolver = require("../backend/src/services/reservation-financial-resolver.service");

test("ReservationPayment registers nullable cash/session association aliases", () => {
  const cashTransaction = models.ReservationPayment.associations.cashTransaction;
  const cashRegisterSession = models.ReservationPayment.associations.cashRegisterSession;

  assert.ok(cashTransaction, "cashTransaction association is registered");
  assert.ok(cashRegisterSession, "cashRegisterSession association is registered");
  assert.equal(cashTransaction.associationType, "BelongsTo");
  assert.equal(cashTransaction.foreignKey, "cashTransactionId");
  assert.equal(cashTransaction.target, models.CashTransaction);
  assert.equal(cashRegisterSession.associationType, "BelongsTo");
  assert.equal(cashRegisterSession.foreignKey, "cashRegisterSessionId");
  assert.equal(cashRegisterSession.target, models.CashRegisterSession);
});

test("branch financial resolver keeps client financial authority out of the schema slice", () => {
  assert.equal(financialResolver.normalizeChannel(), "cash");
  assert.equal(financialResolver.normalizeChannel(" Bank "), "bank");
  assert.throws(
    () => financialResolver.assertNoRawFinancialAuthority({ treasuryAccountCode: "untrusted" }),
    (error) => error?.errorCode === "RAW_FINANCIAL_AUTHORITY_FORBIDDEN"
  );
});

after(async () => {
  await models.sequelize.close();
});
