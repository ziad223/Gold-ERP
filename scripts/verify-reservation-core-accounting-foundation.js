#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
try {
  require(path.join(ROOT, "backend", "node_modules", "dotenv")).config({ path: path.join(ROOT, "backend", ".env") });
} catch (_) {}
const { Op } = require(path.join(ROOT, "backend", "node_modules", "sequelize"));

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

const files = {
  migration: "backend/migrations/20260711010000-reservation-core-foundation.js",
  reservationModel: "backend/src/models/reservation.model.js",
  itemModel: "backend/src/models/reservationItem.model.js",
  paymentModel: "backend/src/models/reservationPayment.model.js",
  index: "backend/src/models/index.js",
  service: "backend/src/services/reservation.service.js",
  posting: "backend/src/services/posting.service.js",
  routes: "backend/src/routes/erp.routes.js",
  frontend: "app/[locale]/(dashboard)/sales/reservations/page.tsx",
  packageJson: "package.json",
  handoff: "docs/AI_HANDOFF.md",
  scope: "docs/CLIENT_SCOPE_LOCK.md",
  fixDoc: "docs/client-requirements/PHASE-32.6-FIX-A.md"
};

function staticChecks() {
  for (const [name, file] of Object.entries(files)) {
    assert.ok(exists(file), `${name} file exists: ${file}`);
  }

  const migration = read(files.migration);
  for (const token of [
    "reservation_items",
    "reservation_payments",
    "branch_id",
    "agreed_total",
    "paid_total",
    "remaining_total",
    "workflow_version",
    "is_legacy",
    "reservation_items_active_asset_unique",
    "reservation_payments_idempotency_unique",
    "reservation_payments_receipt_unique",
    "partially_paid",
    "fully_paid"
  ]) assert.ok(migration.includes(token), `migration includes ${token}`);
  assert.ok(!/UPDATE\s+reservations\s+SET\s+deposit/i.test(migration), "migration must not convert legacy deposits into payment ledger rows");
  assert.ok(!/INSERT\s+INTO\s+reservation_payments/i.test(migration), "migration must not fabricate historical reservation payments");
  assert.ok(!/INSERT\s+INTO\s+journal_entries/i.test(migration), "migration must not fabricate historical journals");

  const reservationModel = read(files.reservationModel);
  for (const field of ["agreedTotal", "paidTotal", "remainingTotal", "excessTotal", "workflowVersion", "isLegacy", "finalInvoiceId"]) {
    assert.ok(reservationModel.includes(field), `reservation model includes ${field}`);
  }
  assert.ok(read(files.itemModel).includes("ReservationItem") && read(files.paymentModel).includes("ReservationPayment"), "reservation item/payment models exist");
  assert.ok(read(files.index).includes("ReservationItem") && read(files.index).includes("ReservationPayment"), "model index exports reservation item/payment associations");

  const service = read(files.service);
  for (const token of [
    "sequelize.transaction",
    "lock: true",
    "reservationAdvancesAccountId",
    "ReservationPayment.create",
    "ReservationItem.create",
    "AssetEvent.create",
    "postReservationPaymentEntry",
    "reservation.created",
    "reservation.item_reserved",
    "reservation.payment_posted",
    "reservation.fully_paid",
    "Idempotency-Key is required",
    "cannot exceed remaining amount",
    "cannot exceed the reservation total",
    "Legacy reservations cannot receive new ledger payments"
  ]) assert.ok(service.includes(token), `reservation service includes ${token}`);
  assert.ok(!/invoice\.total|postDepositEntry|sales\/invoices\/draft/.test(service), "reservation service does not use invoices or deposit posting");
  assert.ok(!/2300/.test(service), "reservation service has no hardcoded 2300 fallback");

  const posting = read(files.posting);
  const reservationBlock = posting.slice(posting.indexOf("async postReservationPaymentEntry"), posting.indexOf("  /**", posting.indexOf("async postReservationPaymentEntry") + 10));
  assert.ok(reservationBlock.includes('sourceType: "reservation_payment"'), "reservation journal source type is reservation_payment");
  assert.ok(reservationBlock.includes("advancesAccountCode"), "reservation journal credits configured advances account");
  assert.ok(!/2200|4100|1300|5000|1200|2300/.test(reservationBlock), "reservation payment posting has no VAT/revenue/AR/COGS/inventory/deposit-account lines");
  const depositBlock = posting.slice(posting.indexOf("async postDepositEntry"), posting.indexOf("  /**", posting.indexOf("async postDepositEntry") + 10));
  assert.ok(depositBlock.includes('{ accountCode: "2300"'), "legacy deposit posting remains isolated in postDepositEntry");

  const routes = read(files.routes);
  assert.ok(routes.includes('router.post("/reservations"'), "dedicated reservation create route exists");
  assert.ok(routes.includes('router.post("/reservations/:id/payments"'), "dedicated reservation payment route exists");
  assert.ok(!routes.includes('setupCrud("reservations"'), "generic reservation setupCrud is removed");
  assert.ok(routes.includes("Reservation full replacement is disabled") && routes.includes("Reservation deletion is disabled"), "unsafe generic reservation writes are blocked");
  assert.ok(routes.includes('new ForbiddenError("Reservation financial, item, status, asset, and invoice fields are immutable'), "generic PATCH has explicit whitelist guard");
  assert.ok(
    routes.includes("reservationPerms.create") && routes.includes("reservationPerms.recordPayment") && routes.includes("reservationPerms.view"),
    "routes use dedicated reservation permission mapping with transitional fallbacks"
  );
  assert.ok(routes.includes("reservationAdvancesAccountId"), "settings allow reservation advances account key");

  const frontend = read(files.frontend);
  assert.ok(frontend.includes('apiClient("/reservations"'), "frontend posts to dedicated reservation endpoint");
  assert.ok(frontend.includes("idempotencyKey: reservationIdempotencyKeyRef.current"), "frontend sends idempotency key");
  assert.ok(frontend.includes("initialPayment"), "frontend passes optional initial payment through atomic payload");
  assert.ok(!frontend.includes('apiClient(`/assets/${encodeURIComponent(targetAsset.id)}`'), "frontend no longer PATCHes asset after reservation creation");
  assert.ok(!frontend.includes('apiClient("/sales/invoices/draft"'), "frontend no longer creates reservation deposit invoice");
  assert.ok(!/vatRate|tax:|subtotal:/.test(frontend), "frontend no longer submits VAT/tax/subtotal metadata for reservation deposits");
  // Phase 32.6-Fix B implements dedicated, safe reservation cancellation, superseding
  // the Fix A deferral. These durable guards confirm the cancellation UI stays safe:
  // dedicated endpoint, no generic PATCH, no direct status/asset mutation, and no
  // refund/accounting fields posted from the client during cancellation.
  assert.ok(frontend.includes("/reservations/${encodeURIComponent(reservation.id)}/cancel"), "frontend uses the dedicated reservation cancellation endpoint");
  const cancelSection = frontend.slice(frontend.indexOf("const cancelMutation"), frontend.indexOf("const refundRequestMutation"));
  assert.ok(cancelSection.length > 0, "reservation cancellation mutation is present");
  assert.ok(cancelSection.includes('method: "POST"'), "reservation cancellation uses a dedicated POST action, not generic PATCH");
  assert.ok(!cancelSection.includes('method: "PATCH"'), "reservation cancellation does not use generic PATCH");
  assert.ok(!/status:\s*["'](cancelled|cancelled_refund_pending|refunded)/.test(cancelSection), "frontend does not set reservation status directly during cancellation");
  assert.ok(!cancelSection.includes("/assets/"), "frontend does not patch asset status during cancellation");
  assert.ok(!/journalLines|refundAmount|cogs|treasuryAccountCode/.test(cancelSection), "frontend posts no refund/accounting fields during cancellation");

  const packageJson = JSON.parse(read(files.packageJson));
  assert.equal(packageJson.scripts["verify:reservation-core-accounting-foundation"], "node scripts/verify-reservation-core-accounting-foundation.js", "package verifier script is registered");

  const docs = `${read(files.handoff)}\n${read(files.scope)}\n${read(files.fixDoc)}`;
  for (const phrase of [
    "Phase 32.6-Fix A",
    "reservation_items",
    "reservation_payments",
    "reservationAdvancesAccountId",
    "reservation_payment",
    "No final sale completion",
    "No refunds",
    "No expiry scheduler"
  ]) assert.ok(docs.includes(phrase), `documentation includes ${phrase}`);
}

function safeLiveEnvironment() {
  const live = String(process.env.VERIFY_RESERVATION_CORE_LIVE || "").toLowerCase() === "true";
  if (!live) return false;
  const dbName = process.env.DB_NAME || "";
  const verifyName = process.env.VERIFY_DATABASE_NAME || "";
  const host = process.env.DB_HOST || "";
  const nodeEnv = String(process.env.NODE_ENV || "development").toLowerCase();
  assert.equal(verifyName, dbName, "VERIFY_DATABASE_NAME must match DB_NAME");
  assert.equal(dbName, "darfus_erp", "live reservation verification is restricted to darfus_erp");
  assert.ok(["localhost", "127.0.0.1", "::1"].includes(host), "live reservation verification requires localhost DB");
  assert.ok(["development", "test", "demo"].includes(nodeEnv), "live reservation verification requires non-production NODE_ENV");
  for (const key of ["ALLOW_CLIENT_DEMO_RESET", "RESET_TARGET", "CONFIRM_DATABASE_NAME", "OWNER_CONFIRMED_DEMO_ONLY"]) {
    assert.ok(!process.env[key], `${key} must not be set for read-only/live verifier`);
  }
  return true;
}

async function liveChecks() {
  if (!safeLiveEnvironment()) {
    console.log("verify-reservation-core-accounting-foundation: STATIC ONLY — LIVE DATA NOT VERIFIED");
    return false;
  }

  const models = require(path.join(ROOT, "backend", "src", "models"));
  const reservationService = require(path.join(ROOT, "backend", "src", "services", "reservation.service"));
  const t = await models.sequelize.transaction();
  try {
    const company = await models.Company.findOne({ transaction: t });
    const branch = await models.Branch.findOne({ where: { companyId: company.id, isActive: true }, transaction: t });
    assert.ok(company && branch, "live reservation verifier requires an existing local company and active branch");

    const ns = `RSV-LIVE-${Date.now()}`;
    const user = { id: `${ns}-USER`, firstName: "Verifier", lastName: "Reservation" };
    const account = await models.Account.create({
      id: `${ns}-ADV`,
      companyId: company.id,
      code: `${String(Date.now()).slice(-6)}`,
      name: "Reservation Advances Test",
      nameAr: "دفعات حجوزات اختبار",
      type: "liability",
      nature: "credit",
      balance: 0,
      isActive: true,
      level: 2
    }, { transaction: t });
    await models.Setting.upsert({
      companyId: company.id,
      key: "reservationAdvancesAccountId",
      value: account.id
    }, { transaction: t });
    const customer = await models.Customer.create({
      id: `${ns}-CUST`,
      companyId: company.id,
      name: "Reservation Verifier Customer",
      phone: "000",
      balance: 0,
      purchases: 0,
      status: "active"
    }, { transaction: t });

    const assetBase = {
      companyId: company.id,
      type: "gold-piece",
      category: "ring",
      karat: 21,
      grossWeight: 1,
      netWeight: 1,
      price: 1000,
      cost: 500,
      branch: branch.name,
      branchId: branch.id,
      location: "Verifier",
      status: "available",
      source: "verifier"
    };
    const asset1 = await models.Asset.create({ ...assetBase, id: `${ns}-A1`, name: "Verifier Asset 1", barcode: `${ns}-BC1` }, { transaction: t });
    const asset2 = await models.Asset.create({ ...assetBase, id: `${ns}-A2`, name: "Verifier Asset 2", barcode: `${ns}-BC2`, price: 500 }, { transaction: t });
    const soldAsset = await models.Asset.create({ ...assetBase, id: `${ns}-SOLD`, name: "Verifier Sold Asset", barcode: `${ns}-BC3`, status: "sold" }, { transaction: t });

    await assert.rejects(
      () => reservationService._createReservationInTransaction({
        companyId: company.id,
        branchId: branch.id,
        user,
        body: { id: `${ns}-BAD-SOLD`, customerId: customer.id, expiresAt: "2026-12-31", items: [{ assetId: soldAsset.id, agreedPrice: 1000 }] },
        idempotencyKey: `${ns}-bad-sold`,
        transaction: t
      }),
      /not available/i,
      "sold assets must be rejected"
    );

    await assert.rejects(
      () => reservationService._createReservationInTransaction({
        companyId: company.id,
        branchId: branch.id,
        user,
        body: { id: `${ns}-BAD-DUP`, customerId: customer.id, expiresAt: "2026-12-31", items: [{ assetId: asset1.id, agreedPrice: 1000 }, { assetId: asset1.id, agreedPrice: 1000 }] },
        idempotencyKey: `${ns}-bad-dup`,
        transaction: t
      }),
      /same asset/i,
      "same asset twice must be rejected"
    );

    const noPay = await reservationService._createReservationInTransaction({
      companyId: company.id,
      branchId: branch.id,
      user,
      body: { id: `${ns}-NO-PAY`, customerId: customer.id, expiresAt: "2026-12-31", items: [{ assetId: asset1.id, agreedPrice: 1000 }, { assetId: asset2.id, agreedPrice: 500 }] },
      idempotencyKey: `${ns}-no-pay`,
      transaction: t
    });
    assert.equal(noPay.reservation.status, "active");
    assert.equal(Number(noPay.reservation.agreedTotal), 1500);
    assert.equal(Number(noPay.reservation.paidTotal), 0);
    assert.equal(Number(noPay.reservation.remainingTotal), 1500);
    assert.equal((await asset1.reload({ transaction: t })).status, "reserved");
    assert.equal((await asset2.reload({ transaction: t })).status, "reserved");

    const asset3 = await models.Asset.create({ ...assetBase, id: `${ns}-A3`, name: "Verifier Asset 3", barcode: `${ns}-BC4`, price: 1000 }, { transaction: t });
    const withPay = await reservationService._createReservationInTransaction({
      companyId: company.id,
      branchId: branch.id,
      user,
      body: {
        id: `${ns}-WITH-PAY`,
        customerId: customer.id,
        expiresAt: "2026-12-31",
        items: [{ assetId: asset3.id, agreedPrice: 1000 }],
        initialPayment: { amount: 400, paymentMethod: "cash" }
      },
      idempotencyKey: `${ns}-with-pay`,
      transaction: t
    });
    assert.equal(withPay.reservation.status, "partially_paid");
    assert.equal(Number(withPay.reservation.paidTotal), 400);
    assert.equal(Number(withPay.reservation.remainingTotal), 600);
    assert.ok(withPay.payment?.journalEntryId, "initial payment must create a linked journal");
    const journalLines = await models.JournalLine.findAll({ where: { journalEntryId: withPay.payment.journalEntryId }, transaction: t });
    const debit1110 = journalLines.find((line) => line.accountCode === "1110");
    const creditAdvances = journalLines.find((line) => line.accountCode === account.code);
    assert.equal(Number(debit1110?.debit || 0), 400, "reservation payment debits selected treasury account");
    assert.equal(Number(creditAdvances?.credit || 0), 400, "reservation payment credits configured advances liability");
    assert.equal(await models.Invoice.count({ where: { companyId: company.id, id: { [Op.like]: `${ns}%` } }, transaction: t }), 0, "reservation payment must not create invoices");

    await t.rollback();
    console.log("verify-reservation-core-accounting-foundation: LIVE TESTS EXECUTED");
    return true;
  } catch (error) {
    try { await t.rollback(); } catch (_) {}
    throw error;
  } finally {
    await models.sequelize.close();
  }
}

(async () => {
  try {
    staticChecks();
    const live = await liveChecks();
    if (String(process.env.VERIFY_RESERVATION_CORE_LIVE || "").toLowerCase() === "true" && !live) {
      throw new Error("requested live reservation verification was skipped");
    }
    console.log(live ? "verify-reservation-core-accounting-foundation: ok (static + live)" : "verify-reservation-core-accounting-foundation: ok (STATIC ONLY)");
  } catch (error) {
    console.error(`verify-reservation-core-accounting-foundation FAILED: ${error.message}`);
    process.exit(1);
  }
})();
