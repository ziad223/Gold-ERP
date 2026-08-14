#!/usr/bin/env node
"use strict";

// F003 contract: installment collection must compare decimal amounts exactly
// after locking the authoritative installment inside its transaction. This is
// deliberately static: it never connects to a database or issues HTTP calls.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const routes = fs.readFileSync(path.join(ROOT, "backend", "src", "routes", "erp.routes.js"), "utf8");

function installmentCollectionHandler(source) {
  const start = source.indexOf('router.post(\n  "/installments/:id/pay"');
  const end = source.indexOf("// ─────────────────────────────────────────────────────────────────────────────\n// GIFT VOUCHERS", start);
  assert.ok(start >= 0 && end > start, "installment collection handler is present");
  return source.slice(start, end);
}

try {
  const route = installmentCollectionHandler(routes);
  const transactionStart = route.indexOf("await models.sequelize.transaction(async (t) =>");
  const lockedInstallment = route.indexOf("const lockedInst = await models.Installment.findOne");
  const installmentLock = route.indexOf("lock: { level: t.LOCK.UPDATE, of: models.Installment }");
  const exactValidation = route.indexOf("requestedAmountUnits > outstandingUnits");

  assert.ok(route.includes("moneyToTenThousandths(req.body.amount)"), "request amount uses the canonical decimal-unit parser");
  assert.ok(route.includes("const outstandingUnits = installmentAmountUnits - paidAmountUnits"), "outstanding is calculated from the locked persisted installment");
  assert.ok(route.includes("const newPaidUnits = paidAmountUnits + requestedAmountUnits"), "paid amount is advanced in canonical decimal units");
  assert.ok(route.includes("INSTALLMENT_COLLECTION_AMOUNT_EXCEEDS_OUTSTANDING"), "over-collection has a stable canonical validation code");
  assert.equal(route.includes("remaining + 0.01"), false, "no tolerance permits a positive over-collection");
  assert.equal(route.includes("Number(req.body.amount)"), false, "request validation does not use binary floating-point conversion");
  assert.ok(transactionStart >= 0 && lockedInstallment > transactionStart, "the installment is re-read inside the transaction");
  assert.ok(installmentLock > lockedInstallment && exactValidation > installmentLock, "the exact upper-bound check occurs after the row lock");
  assert.ok(route.includes("collectionEventId: installmentPayment.id"), "F002 durable collection-event journal identity remains wired");
  assert.ok(route.includes("resolveAuthorizedBranchId(req, invoice.branchId"), "F001 authoritative invoice Branch resolution remains wired");
  console.log("verify-installment-overcollection-guard: ok");
} catch (error) {
  console.error(`verify-installment-overcollection-guard: failed: ${error.message}`);
  process.exitCode = 1;
}
