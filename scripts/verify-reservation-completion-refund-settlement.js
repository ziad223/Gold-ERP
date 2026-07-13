/**
 * Phase 32.6-Fix B — reservation final sale completion and refund settlement.
 *
 * Default mode is static and non-mutating. Live mode is explicitly gated by:
 *   VERIFY_RESERVATION_SETTLEMENT_LIVE=true
 *   VERIFY_DATABASE_NAME=darfus_erp
 *
 * Live mode creates isolated rows under a unique namespace and cleans only that
 * namespace. It never runs reset, seed, migration rollback, or remote checks.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.resolve(ROOT, "backend");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");
const exists = (rel) => fs.existsSync(path.resolve(ROOT, rel));

const SERVICE = "backend/src/services/reservation.service.js";
const POSTING = "backend/src/services/posting.service.js";
const ROUTES = "backend/src/routes/erp.routes.js";
const INDEX = "backend/src/models/index.js";
const FRONTEND = "app/[locale]/(dashboard)/sales/reservations/page.tsx";
const MIGRATION = "backend/migrations/20260711020000-reservation-completion-refund-foundation.js";
const ASSET_STOCK_MOVEMENT_MIGRATION = "backend/migrations/20260711021000-stock-movement-asset-reference.js";

function filesAndSchema() {
  for (const file of [
    MIGRATION,
    "backend/src/models/reservationPaymentApplication.model.js",
    "backend/src/models/reservationRefund.model.js",
    "backend/src/models/reservationRefundAllocation.model.js",
    ASSET_STOCK_MOVEMENT_MIGRATION,
  ]) assert.ok(exists(file), `Fix B file exists: ${file}`);
  const migration = read(MIGRATION);
  for (const column of ["completed_at", "completed_by", "cancelled_at", "cancelled_by", "cancellation_reason", "refunded_at", "refund_status"]) {
    assert.ok(migration.includes(column), `reservation completion/refund column exists: ${column}`);
  }
  assert.ok(migration.includes("reservation_payment_applications"), "payment application table exists");
  assert.ok(migration.includes("reservation_refunds"), "refund table exists");
  assert.ok(migration.includes("reservation_refund_allocations"), "refund allocation table exists");
  assert.ok(migration.includes("reservations_final_invoice_unique"), "one final invoice per reservation is protected");
  assert.ok(migration.includes("reservation_payment_applications_payment_unique"), "one reservation payment can be applied once");
  assert.ok(migration.includes("reservation_refunds_one_open_unique"), "only one open refund per reservation");
  assert.ok(migration.includes("reservation_refunds_one_executed_unique"), "only one executed refund per reservation");
  assert.ok(migration.includes("reservation_refunds_idempotency_unique"), "refund execution idempotency is indexed");
  assert.ok(read("backend/src/models/reservation.model.js").includes("cancelled_refund_pending"), "reservation status includes refund-pending cancellation");
  assert.ok(read("backend/src/models/reservation.model.js").includes("refunded"), "reservation status includes refunded");
  assert.ok(read("backend/src/models/reservationItem.model.js").includes('"sold"'), "reservation item can become sold");
  assert.ok(read(ASSET_STOCK_MOVEMENT_MIGRATION).includes("asset_id"), "stock movements can reference serialized assets");
  assert.ok(read("backend/src/models/stockMovement.model.js").includes("assetId"), "stock movement model includes assetId");
}

function modelRegistration() {
  const index = read(INDEX);
  for (const model of ["ReservationPaymentApplication", "ReservationRefund", "ReservationRefundAllocation"]) {
    assert.ok(index.includes(`const ${model} = require`), `${model} imported`);
    assert.ok(index.includes(model), `${model} exported/associated`);
  }
  assert.ok(index.includes("Reservation.hasMany(ReservationPaymentApplication"), "reservation applications association exists");
  assert.ok(index.includes("Reservation.hasMany(ReservationRefund"), "reservation refunds association exists");
  assert.ok(index.includes("ReservationRefund.hasMany(ReservationRefundAllocation"), "refund allocations association exists");
  assert.ok(index.includes("ReservationPayment.hasOne(ReservationPaymentApplication"), "payment application uniqueness association exists");
}

function postingContract() {
  const posting = read(POSTING);
  assert.ok(posting.includes("postReservationAdvanceSettlementEntry"), "advance settlement posting exists");
  assert.ok(posting.includes('sourceType: "reservation_settlement"'), "settlement source type exists");
  assert.ok(posting.includes('accountCode: advancesAccountCode, debit: amt, credit: 0'), "settlement debits reservation advances");
  assert.ok(posting.includes('accountCode: "1300", debit: 0, credit: amt'), "settlement credits AR/customer control");
  assert.ok(posting.includes("postReservationRefundEntry"), "refund posting exists");
  assert.ok(posting.includes('sourceType: "reservation_refund"'), "refund source type exists");
  assert.ok(posting.includes("accountCode: treasuryAccountCode, debit: 0, credit: amt"), "refund credits selected treasury/bank");
  const refundEnd = posting.indexOf("/**\n   * Supplier purchase receiving");
  const refundSection = posting.slice(posting.indexOf("async postReservationRefundEntry"), refundEnd);
  assert.ok(!/4100|2200|5000|1200|postInvoiceEntry/.test(refundSection), "refund does not post revenue/VAT/COGS/inventory or invoice posting");
}

function serviceContract() {
  const service = read(SERVICE);
  for (const method of ["completeSale", "_completeSaleInTransaction", "cancelReservation", "requestRefund", "approveRefund", "rejectRefund", "executeRefund", "_executeRefundInTransaction"]) {
    assert.ok(service.includes(method), `reservation service implements ${method}`);
  }
  assert.ok(service.includes("vatInclusiveTotalsFromGross"), "completion uses VAT-inclusive reservation total handling");
  assert.ok(!service.includes("computeTotals({\n      subtotal"), "completion does not add VAT on top of agreed reservation total");
  assert.ok(service.includes("StockMovement.create"), "completion records inventory-out stock movement");
  assert.ok(service.includes('referenceType: "reservation_final_sale"'), "reservation sale stock movement is traceable");
  assert.ok(service.includes('scope = "reservation.complete"'), "completion uses idempotency scope");
  assert.ok(service.includes('scope = "reservation.refund.execute"'), "refund execution uses idempotency scope");
  assert.ok(service.includes("Legacy reservations cannot be completed through the new workflow"), "completion blocks legacy rows");
  assert.ok(service.includes("Legacy reservations cannot be refunded through the new workflow"), "refund blocks legacy rows");
  assert.ok(service.includes("Reservation must be fully paid before final sale completion"), "completion requires full payment");
  assert.ok(service.includes("postInvoiceEntry(invoiceForPosting"), "completion uses established invoice posting");
  assert.ok(service.includes('invoiceForPosting.status = "due"'), "invoice posting creates AR before settlement");
  assert.ok(service.includes("postReservationAdvanceSettlementEntry"), "completion settles advances to AR");
  assert.ok(service.includes("ReservationPaymentApplication.create"), "completion records payment applications");
  assert.ok(service.includes("CashTransaction.create") && service.includes("postReservationRefundEntry"), "refund execution records treasury cash-out with refund journal");
  const completionSection = service.slice(service.indexOf("async _completeSaleInTransaction"), service.indexOf("async cancelReservation"));
  assert.ok(!completionSection.includes("CashTransaction.create"), "completion creates no new cash transaction");
  assert.ok(completionSection.includes('status: "completed"'), "completion marks reservation completed");
  assert.ok(completionSection.includes('status: "sold"'), "completion marks reservation items sold");
  assert.ok(completionSection.includes('asset.update({ status: "sold" }'), "completion marks assets sold");
  assert.ok(service.includes('"cancelled_refund_pending"'), "cancellation can enter refund-pending status");
  assert.ok(service.includes("Reservation refunds must be full; partial refunds are not allowed"), "partial refunds are rejected");
  assert.ok(service.includes("Different refund method requires approval before execution"), "method override approval is required");
  assert.ok(service.includes('status: "refunded"'), "executed refund marks reservation refunded");
}

function routesAndPermissions() {
  const routes = read(ROUTES);
  for (const route of [
    'router.post("/reservations/:id/complete-sale"',
    'router.post("/reservations/:id/cancel"',
    'router.post("/reservations/:id/refunds"',
    'router.post("/reservation-refunds/:id/approve"',
    'router.post("/reservation-refunds/:id/reject"',
    'router.post("/reservation-refunds/:id/execute"',
  ]) assert.ok(routes.includes(route), `route exists: ${route}`);
  assert.ok(routes.includes("reservationPerms.completeSale") && routes.includes("completeSale"), "completion is permissioned");
  assert.ok(routes.includes("reservationPerms.cancel") && routes.includes("reservationPerms.refundRequest") && routes.includes("requestRefund"), "refund request/cancel use reservation permissions");
  assert.ok(routes.includes("reservationPerms.refundApprove") && routes.includes("approveRefund"), "refund approval uses reservation approval permission");
  assert.ok(routes.includes("reservationPerms.refundExecute") && routes.includes("executeRefund"), "refund execution uses reservation execution permission");
  assert.ok(routes.includes('headers["idempotency-key"]') && routes.includes("executeRefund"), "mutation routes read Idempotency-Key where required");
}

function frontendContract() {
  const page = read(FRONTEND);
  for (const endpoint of [
    "/reservations/${encodeURIComponent(reservation.id)}/complete-sale",
    "/reservations/${encodeURIComponent(reservation.id)}/cancel",
    "/reservations/${encodeURIComponent(reservation.id)}/refunds",
    "/reservation-refunds/${encodeURIComponent(refund.id)}/approve",
    "/reservation-refunds/${encodeURIComponent(refund.id)}/reject",
    "/reservation-refunds/${encodeURIComponent(refund.id)}/execute",
  ]) assert.ok(page.includes(endpoint), `frontend uses dedicated endpoint: ${endpoint}`);
  for (const permission of ["sales.create", "sales.approve", "approvals.manage", "treasury.update"]) {
    assert.ok(page.includes(`hasPermission("${permission}")`), `frontend action checks ${permission}`);
  }
  assert.ok(page.includes("idempotencyKey: generateUUID()"), "frontend uses idempotency keys for dedicated mutation actions");
  assert.ok(page.includes("isActionBusy") && page.includes("disabled={isActionBusy"), "frontend has duplicate-submit/loading protection");
  assert.ok(page.includes("finalInvoiceId"), "frontend displays final invoice link/reference");
  assert.ok(page.includes("refundStatus"), "frontend displays refund state");
  assert.ok(!/updateAssetWithEvent\([^)]*\{ status: "(sold|available|reserved)"/s.test(page), "frontend does not patch asset state for Fix B transitions");
  assert.ok(!/apiClient\([^)]*method:\s*"PATCH"[^)]*reservation/s.test(page), "frontend does not use generic reservation PATCH for Fix B transitions");
  for (const forbidden of ["tax:", "vatAmount", "vatRate", "journalLines", "cogs", "paymentApplications", "assetStatus"]) {
    const actionSection = page.slice(page.indexOf("const completeSaleMutation"), page.indexOf("return ("));
    assert.ok(!actionSection.includes(forbidden), `frontend does not submit trusted ${forbidden} in Fix B actions`);
  }
}

function docsAndPackage() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["verify:reservation-completion-refund-settlement"], "node scripts/verify-reservation-completion-refund-settlement.js", "package verifier script registered");
  for (const doc of ["docs/AI_HANDOFF.md", "docs/CLIENT_SCOPE_LOCK.md"]) {
    const src = read(doc);
    assert.ok(src.includes("Phase 32.6-Fix B"), `${doc} documents Fix B`);
    assert.ok(src.includes("Final Sale Completion") || src.includes("final sale completion"), `${doc} documents completion`);
    assert.ok(src.includes("refund"), `${doc} documents refund settlement`);
  }
}

function scopeGuard() {
  const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, "/"))
    .filter(Boolean);
  const forbidden = changed.filter((file) => [
    /^backend\/src\/services\/source-aware-statement\.service\.js$/,
    /^backend\/src\/services\/statement-reconciliation\.service\.js$/,
    /^backend\/src\/services\/full-2300-reconciliation\.service\.js$/,
    /^backend\/src\/services\/customer-credit\.service\.js$/,
    /^features\/printing\//,
  ].some((pattern) => pattern.test(file)));
  assert.deepEqual(forbidden, [], `Fix B must not touch protected statement/customer-credit/print files (found: ${forbidden.join(", ")})`);
}

function runStatic() {
  filesAndSchema();
  modelRegistration();
  postingContract();
  serviceContract();
  routesAndPermissions();
  frontendContract();
  docsAndPackage();
  scopeGuard();
}

function assertLocalLiveEnvironment() {
  assert.equal(process.env.VERIFY_RESERVATION_SETTLEMENT_LIVE, "true", "live verification requires VERIFY_RESERVATION_SETTLEMENT_LIVE=true");
  assert.equal(process.env.VERIFY_DATABASE_NAME, "darfus_erp", "live verification requires VERIFY_DATABASE_NAME=darfus_erp");
  assert.ok(["development", "test", "demo"].includes(process.env.NODE_ENV), "live verification requires development/test/demo NODE_ENV");
  assert.ok(["localhost", "127.0.0.1"].includes(process.env.DB_HOST), `live verification requires local DB host, got ${process.env.DB_HOST}`);
  assert.equal(String(process.env.DB_PORT), "5433", "live verification requires DB_PORT=5433");
  assert.equal(process.env.DB_NAME, process.env.VERIFY_DATABASE_NAME, "live verification DB_NAME must match VERIFY_DATABASE_NAME");
  for (const key of ["ALLOW_CLIENT_DEMO_RESET", "RESET_TARGET", "CONFIRM_DATABASE_NAME", "OWNER_CONFIRMED_DEMO_ONLY"]) {
    assert.ok(!process.env[key], `${key} must not be set for read-only/live verifier cleanup mode`);
  }
  const url = `${process.env.DATABASE_URL || ""} ${process.env.RENDER || ""} ${process.env.RENDER_EXTERNAL_URL || ""}`.toLowerCase();
  assert.ok(!url.includes("render") && !url.includes("amazonaws") && !url.includes("supabase"), "remote/managed database indicators are rejected");
}

function money(n) {
  return Number(n).toFixed(4);
}

function asNum(v) {
  return Number(Number(v || 0).toFixed(4));
}

async function runLive() {
  assertLocalLiveEnvironment();
  const models = require(path.resolve(BACKEND, "src/models"));
  const reservationService = require(path.resolve(BACKEND, "src/services/reservation.service"));
  const postingService = require(path.resolve(BACKEND, "src/services/posting.service"));
  const { QueryTypes } = require(path.resolve(BACKEND, "node_modules/sequelize"));
  models.sequelize.options.logging = false;

  const namespace = `T32B-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const user = { id: `${namespace}-USR`, firstName: "Verifier", lastName: "Reservation", email: "verifier@example.invalid" };
  const q = (sql, replacements = {}) => models.sequelize.query(sql, { type: QueryTypes.SELECT, replacements });
  const exec = (sql, replacements = {}) => models.sequelize.query(sql, { replacements });
  const count = async (table, where = "true", replacements = {}) => Number((await q(`select count(*)::int as c from ${table} where ${where}`, replacements))[0].c);
  const counts = async () => ({
    reservations: await count("reservations"),
    reservationItems: await count("reservation_items"),
    reservationPayments: await count("reservation_payments"),
    paymentApplications: await count("reservation_payment_applications"),
    refunds: await count("reservation_refunds"),
    refundAllocations: await count("reservation_refund_allocations"),
    invoices: await count("invoices"),
    invoiceItems: await count("invoice_items"),
    journals: await count("journal_entries"),
    journalLines: await count("journal_lines"),
    assets: await count("assets"),
    stockMovements: await count("stock_movements"),
    cashTransactions: await count("cash_transactions"),
  });

  async function cleanup() {
    await exec("delete from reservation_refund_allocations where reservation_refund_id like :ns", { ns: `${namespace}%` });
    await exec("delete from reservation_payment_applications where reservation_id like :ns or final_invoice_id like :ns", { ns: `${namespace}%` });
    await exec("delete from reservation_refunds where id like :ns or reservation_id like :ns", { ns: `${namespace}%` });
    await exec("delete from reservation_payments where reservation_id like :ns or id like :ns or idempotency_key like :ns", { ns: `${namespace}%` });
    await exec("delete from invoice_items where invoice_id like :ns", { ns: `${namespace}%` });
    await exec("delete from invoices where id like :ns or related_invoice_id like :ns", { ns: `${namespace}%` });
    await exec("delete from journal_lines where journal_entry_id in (select id from journal_entries where source_id like :ns or description like :desc)", { ns: `${namespace}%`, desc: `%${namespace}%` });
    await exec("delete from journal_entries where source_id like :ns or description like :desc", { ns: `${namespace}%`, desc: `%${namespace}%` });
    await exec("delete from cash_transactions where id like :ns or reference like :ns or idempotency_key like :ns or description like :desc", { ns: `${namespace}%`, desc: `%${namespace}%` });
    await exec("delete from asset_events where asset_id like :ns or source_document like :ns or note like :desc", { ns: `${namespace}%`, desc: `%${namespace}%` });
    await exec("delete from reservation_items where reservation_id like :ns or asset_id like :ns", { ns: `${namespace}%` });
    await exec("delete from reservations where id like :ns or asset_id like :ns", { ns: `${namespace}%` });
    await exec("delete from stock_movements where product_id like :ns or asset_id like :ns or reference_id like :ns", { ns: `${namespace}%` });
    await exec("delete from assets where id like :ns", { ns: `${namespace}%` });
    await exec("delete from idempotency_requests where key like :ns or request_hash like :desc or response_body::text like :desc", { ns: `${namespace}%`, desc: `%${namespace}%` }).catch(() => {});
  }

  async function ensureAdvancesSetting(companyId) {
    const existing = await models.Setting.findOne({ where: { companyId, key: "reservationAdvancesAccountId" } });
    if (existing) return { existed: true, row: existing };
    const account = await models.Account.findOne({ where: { companyId, code: "2300", isActive: true } });
    assert.ok(account, "live DB has active 2300 liability account for temporary reservation advances setting");
    const row = await models.Setting.create({ companyId, key: "reservationAdvancesAccountId", value: account.id });
    return { existed: false, row };
  }

  async function restoreAdvancesSetting(state) {
    if (state && !state.existed && state.row) await state.row.destroy();
  }

  async function createAsset(companyId, branch, suffix, price = 105, cost = 60) {
    const id = `${namespace}-AST-${suffix}`;
    return models.Asset.create({
      id,
      companyId,
      name: `Verifier Asset ${suffix}`,
      type: "gold-piece",
      category: "ring",
      karat: 21,
      purity: 0.875,
      grossWeight: 10,
      netWeight: 9,
      goldWeight: 9,
      price,
      cost,
      branch: branch.name,
      branchId: branch.id,
      location: "Verifier",
      status: "available",
      barcode: `${namespace}-BC-${suffix}`,
      source: "verifier"
    });
  }

  async function createReservation(companyId, branch, customer, suffix, price, paymentAmount) {
    const asset = await createAsset(companyId, branch, suffix, price);
    const result = await reservationService.createReservation({
      companyId,
      branchId: branch.id,
      user,
      idempotencyKey: `${namespace}-CREATE-${suffix}`,
      body: {
        id: `${namespace}-RES-${suffix}`,
        customerId: customer.id,
        branchId: branch.id,
        expiresAt: "2026-12-31T23:59:00.000Z",
        items: [{ assetId: asset.id, agreedPrice: money(price) }],
        initialPayment: paymentAmount > 0 ? { amount: money(paymentAmount), paymentMethod: "cash" } : undefined,
        notes: `Verifier reservation ${namespace}`
      }
    });
    assert.equal(result.statusCode, 201, `reservation ${suffix} created`);
    return { asset, reservationId: `${namespace}-RES-${suffix}` };
  }

  async function expectReject(label, fn) {
    let rejected = false;
    try {
      await fn();
    } catch (err) {
      rejected = true;
      assert.ok(err.message, `${label} returned an error message`);
    }
    assert.ok(rejected, `${label} must reject`);
  }

  const before = await counts();
  let settingState = null;
  let company;
  let branch;
  let customer;
  try {
    console.log(`LIVE DB IDENTITY host=${process.env.DB_HOST} port=${process.env.DB_PORT} db=${process.env.DB_NAME} env=${process.env.NODE_ENV}`);
    [company] = await q("select id from companies limit 1");
    assert.ok(company?.id, "company exists");
    [branch] = await q("select id, name from branches where company_id = :companyId limit 1", { companyId: company.id });
    assert.ok(branch?.id, "branch exists");
    [customer] = await q("select id, name from customers where company_id = :companyId limit 1", { companyId: company.id });
    assert.ok(customer?.id, "customer exists");
    settingState = await ensureAdvancesSetting(company.id);

    // Completion success, VAT-inclusive handling, stock movement, AR settlement.
    const completed = await createReservation(company.id, branch, customer, "COMP", 105, 105);
    const completeRes = await reservationService.completeSale({
      companyId: company.id,
      branchId: branch.id,
      user,
      reservationId: completed.reservationId,
      idempotencyKey: `${namespace}-COMPLETE-1`,
      body: { invoiceId: `${namespace}-INV-COMP` }
    });
    assert.equal(completeRes.statusCode, 201, "fully paid reservation completes");
    const [invoice] = await q("select id,total,subtotal,tax,paid_amount,remaining_amount,status from invoices where id = :id", { id: `${namespace}-INV-COMP` });
    assert.equal(asNum(invoice.total), 105, "invoice total equals VAT-inclusive reservation total");
    assert.equal(asNum(invoice.tax), 5, "VAT is extracted from gross total, not added again");
    assert.equal(asNum(invoice.subtotal), 100, "net sales extracted from gross total");
    const [reservationCompleted] = await q("select status, final_invoice_id from reservations where id = :id", { id: completed.reservationId });
    assert.equal(reservationCompleted.status, "completed", "reservation status completed");
    assert.equal(reservationCompleted.final_invoice_id, `${namespace}-INV-COMP`, "final invoice linked");
    assert.equal(await count("reservation_payment_applications", "reservation_id = :id", { id: completed.reservationId }), 1, "payment application recorded");
    assert.equal(await count("stock_movements", "reference_id = :id and type = 'sale'", { id: `${namespace}-INV-COMP` }), 1, "one inventory sale movement recorded");
    assert.equal(await count("cash_transactions", "reference = :id or idempotency_key = :key", { id: `${namespace}-INV-COMP`, key: `${namespace}-COMPLETE-1` }), 0, "completion creates no second cash receipt");
    assert.equal(await count("journal_entries", "source_id = :id and source_type = 'invoice'", { id: `${namespace}-INV-COMP` }), 1, "sales/VAT/COGS journal once");
    assert.equal(await count("journal_entries", "source_id = :id and source_type = 'reservation_settlement'", { id: completed.reservationId }), 1, "advance settlement journal once");
    const arNet = await q("select coalesce(sum(debit-credit),0)::numeric as amount from journal_lines where account_code='1300' and journal_entry_id in (select id from journal_entries where source_id in (:invoiceId, :reservationId))", { invoiceId: `${namespace}-INV-COMP`, reservationId: completed.reservationId });
    assert.equal(asNum(arNet[0].amount), 0, "AR/customer control nets to zero after settlement");
    const assetAfterCompletion = await models.Asset.findByPk(completed.asset.id, { paranoid: false });
    assert.equal(assetAfterCompletion.status, "sold", "asset became sold");
    await expectReject("different duplicate completion", () => reservationService.completeSale({
      companyId: company.id,
      branchId: branch.id,
      user,
      reservationId: completed.reservationId,
      idempotencyKey: `${namespace}-COMPLETE-2`,
      body: { invoiceId: `${namespace}-INV-COMP-2` }
    }));

    // Same idempotency key stable result on a separate reservation.
    const stable = await createReservation(company.id, branch, customer, "IDEMP", 84, 84);
    const stable1 = await reservationService.completeSale({ companyId: company.id, branchId: branch.id, user, reservationId: stable.reservationId, idempotencyKey: `${namespace}-COMPLETE-STABLE`, body: { invoiceId: `${namespace}-INV-IDEMP` } });
    const stable2 = await reservationService.completeSale({ companyId: company.id, branchId: branch.id, user, reservationId: stable.reservationId, idempotencyKey: `${namespace}-COMPLETE-STABLE`, body: { invoiceId: `${namespace}-INV-IDEMP` } });
    assert.equal(stable2.statusCode, stable1.statusCode, "same idempotency key replays stable completion");
    assert.equal(await count("invoices", "related_invoice_id = :id", { id: stable.reservationId }), 1, "idempotent completion creates one invoice");

    // Not fully paid reservations cannot complete.
    const partial = await createReservation(company.id, branch, customer, "PARTIAL", 100, 40);
    await expectReject("partially paid completion", () => reservationService.completeSale({ companyId: company.id, branchId: branch.id, user, reservationId: partial.reservationId, idempotencyKey: `${namespace}-COMPLETE-PARTIAL`, body: { invoiceId: `${namespace}-INV-PARTIAL` } }));
    const unpaid = await createReservation(company.id, branch, customer, "UNPAID", 100, 0);
    await expectReject("unpaid completion", () => reservationService.completeSale({ companyId: company.id, branchId: branch.id, user, reservationId: unpaid.reservationId, idempotencyKey: `${namespace}-COMPLETE-UNPAID`, body: { invoiceId: `${namespace}-INV-UNPAID` } }));

    // Concurrency: one final invoice only.
    const race = await createReservation(company.id, branch, customer, "RACE", 63, 63);
    const results = await Promise.allSettled([
      reservationService.completeSale({ companyId: company.id, branchId: branch.id, user, reservationId: race.reservationId, idempotencyKey: `${namespace}-COMPLETE-RACE-A`, body: { invoiceId: `${namespace}-INV-RACE-A` } }),
      reservationService.completeSale({ companyId: company.id, branchId: branch.id, user, reservationId: race.reservationId, idempotencyKey: `${namespace}-COMPLETE-RACE-B`, body: { invoiceId: `${namespace}-INV-RACE-B` } }),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1, "concurrent completion has exactly one success");
    assert.equal(await count("invoices", "related_invoice_id = :id", { id: race.reservationId }), 1, "concurrent completion creates one invoice");

    // Rollback: force settlement posting failure after invoice posting.
    const rollback = await createReservation(company.id, branch, customer, "ROLLBACK", 42, 42);
    const originalSettlement = postingService.postReservationAdvanceSettlementEntry;
    postingService.postReservationAdvanceSettlementEntry = async () => { throw new Error("forced settlement rollback"); };
    try {
      await expectReject("forced completion rollback", () => reservationService.completeSale({ companyId: company.id, branchId: branch.id, user, reservationId: rollback.reservationId, idempotencyKey: `${namespace}-COMPLETE-ROLLBACK`, body: { invoiceId: `${namespace}-INV-ROLLBACK` } }));
    } finally {
      postingService.postReservationAdvanceSettlementEntry = originalSettlement;
    }
    assert.equal(await count("invoices", "id = :id", { id: `${namespace}-INV-ROLLBACK` }), 0, "rollback removed invoice");
    assert.equal(await count("stock_movements", "reference_id = :id", { id: `${namespace}-INV-ROLLBACK` }), 0, "rollback removed stock movement");
    const rollbackAsset = await models.Asset.findByPk(rollback.asset.id);
    assert.equal(rollbackAsset.status, "reserved", "rollback restores asset reserved status");
    const [rollbackReservation] = await q("select status, final_invoice_id from reservations where id = :id", { id: rollback.reservationId });
    assert.equal(rollbackReservation.status, "fully_paid", "rollback preserves reservation completion status");
    assert.equal(rollbackReservation.final_invoice_id, null, "rollback leaves no final invoice");

    // Cancellation and refund workflow.
    const refundFlow = await createReservation(company.id, branch, customer, "REFUND", 77, 77);
    await reservationService.cancelReservation({ companyId: company.id, branchId: branch.id, user, reservationId: refundFlow.reservationId, body: { reason: "Verifier cancellation" } });
    const [cancelled] = await q("select status, refund_status from reservations where id = :id", { id: refundFlow.reservationId });
    assert.equal(cancelled.status, "cancelled_refund_pending", "paid cancellation enters refund pending");
    assert.equal(await count("journal_entries", "source_id = :id and source_type in ('reservation_refund','invoice','reservation_settlement')", { id: refundFlow.reservationId }), 0, "cancellation posts no sales/refund accounting");
    const cancelAsset = await models.Asset.findByPk(refundFlow.asset.id);
    assert.equal(cancelAsset.status, "available", "cancellation releases asset");
    const cancelJournalCountBefore = await count("journal_entries", "source_id = :id or description like :desc", { id: refundFlow.reservationId, desc: `%${refundFlow.reservationId}%` });
    await reservationService.cancelReservation({ companyId: company.id, branchId: branch.id, user, reservationId: refundFlow.reservationId, body: { reason: "duplicate idempotent cancellation" } });
    const cancelJournalCountAfter = await count("journal_entries", "source_id = :id or description like :desc", { id: refundFlow.reservationId, desc: `%${refundFlow.reservationId}%` });
    assert.equal(cancelJournalCountAfter, cancelJournalCountBefore, "duplicate cancellation is safe and creates no accounting side effects");
    await expectReject("partial refund request", () => reservationService.requestRefund({ companyId: company.id, branchId: branch.id, user, reservationId: refundFlow.reservationId, body: { amount: "1.0000", reason: "partial", refundMethod: "cash" } }));
    const refundReq = await reservationService.requestRefund({ companyId: company.id, branchId: branch.id, user, reservationId: refundFlow.reservationId, body: { reason: "full refund", refundMethod: "cash" } });
    const refundId = refundReq.responseBody.data.refund.id;
    assert.equal(await count("journal_entries", "source_id = :id", { id: refundId }), 0, "refund request posts no accounting");
    await expectReject("execution before approval", () => reservationService.executeRefund({ companyId: company.id, branchId: branch.id, user, refundId, idempotencyKey: `${namespace}-REFUND-EXEC-EARLY`, body: { treasuryAccountCode: "1110" } }));
    await reservationService.approveRefund({ companyId: company.id, branchId: branch.id, user, refundId, body: {} });
    const exec1 = await reservationService.executeRefund({ companyId: company.id, branchId: branch.id, user, refundId, idempotencyKey: `${namespace}-REFUND-EXEC`, body: { treasuryAccountCode: "1110" } });
    assert.equal(exec1.statusCode, 200, "approved refund executes");
    const exec2 = await reservationService.executeRefund({ companyId: company.id, branchId: branch.id, user, refundId, idempotencyKey: `${namespace}-REFUND-EXEC`, body: { treasuryAccountCode: "1110" } });
    assert.equal(exec2.statusCode, 200, "refund execution idempotency replays");
    await expectReject("duplicate refund execution with different key", () => reservationService.executeRefund({ companyId: company.id, branchId: branch.id, user, refundId, idempotencyKey: `${namespace}-REFUND-EXEC-DUP`, body: { treasuryAccountCode: "1110" } }));
    assert.equal(await count("journal_entries", "source_id = :id and source_type = 'reservation_refund'", { id: refundId }), 1, "refund journal once");
    assert.equal(await count("cash_transactions", "reference = :id", { id: refundId }), 1, "refund cash-out once");
    assert.equal(await count("reservation_refund_allocations", "reservation_refund_id = :id", { id: refundId }), 1, "refund allocation links payment");
    const [refunded] = await q("select status, refund_status from reservations where id = :id", { id: refundFlow.reservationId });
    assert.equal(refunded.status, "refunded", "reservation becomes refunded after execution");
    await expectReject("completed reservation cannot cancel", () => reservationService.cancelReservation({ companyId: company.id, branchId: branch.id, user, reservationId: completed.reservationId, body: { reason: "not allowed" } }));
    await expectReject("refunded reservation cannot cancel", () => reservationService.cancelReservation({ companyId: company.id, branchId: branch.id, user, reservationId: refundFlow.reservationId, body: { reason: "not allowed" } }));

    // Refund rejection and method override.
    const rejectFlow = await createReservation(company.id, branch, customer, "REJECT", 33, 33);
    await reservationService.cancelReservation({ companyId: company.id, branchId: branch.id, user, reservationId: rejectFlow.reservationId, body: { reason: "reject flow" } });
    const rejectReq = await reservationService.requestRefund({ companyId: company.id, branchId: branch.id, user, reservationId: rejectFlow.reservationId, body: { reason: "reject", refundMethod: "cash" } });
    await expectReject("rejection requires reason", () => reservationService.rejectRefund({ companyId: company.id, branchId: branch.id, user, refundId: rejectReq.responseBody.data.refund.id, body: {} }));
    await reservationService.rejectRefund({ companyId: company.id, branchId: branch.id, user, refundId: rejectReq.responseBody.data.refund.id, body: { reason: "verified rejection" } });

    const methodFlow = await createReservation(company.id, branch, customer, "METHOD", 55, 55);
    await reservationService.cancelReservation({ companyId: company.id, branchId: branch.id, user, reservationId: methodFlow.reservationId, body: { reason: "method flow" } });
    const methodReq = await reservationService.requestRefund({ companyId: company.id, branchId: branch.id, user, reservationId: methodFlow.reservationId, body: { reason: "method differs", refundMethod: "bank" } });
    const methodRefundId = methodReq.responseBody.data.refund.id;
    await reservationService.approveRefund({ companyId: company.id, branchId: branch.id, user, refundId: methodRefundId, body: {} });
    await expectReject("method difference needs override approval", () => reservationService.executeRefund({ companyId: company.id, branchId: branch.id, user, refundId: methodRefundId, idempotencyKey: `${namespace}-METHOD-EXEC`, body: { treasuryAccountCode: "1120" } }));

    const overrideFlow = await createReservation(company.id, branch, customer, "OVERRIDE", 66, 66);
    await reservationService.cancelReservation({ companyId: company.id, branchId: branch.id, user, reservationId: overrideFlow.reservationId, body: { reason: "override flow" } });
    const overrideReq = await reservationService.requestRefund({ companyId: company.id, branchId: branch.id, user, reservationId: overrideFlow.reservationId, body: { reason: "override", refundMethod: "bank" } });
    await reservationService.approveRefund({ companyId: company.id, branchId: branch.id, user, refundId: overrideReq.responseBody.data.refund.id, body: { methodOverrideApproved: true } });
    await reservationService.executeRefund({ companyId: company.id, branchId: branch.id, user, refundId: overrideReq.responseBody.data.refund.id, idempotencyKey: `${namespace}-OVERRIDE-EXEC`, body: { treasuryAccountCode: "1120" } });

    // Legacy unsupported.
    const legacyAsset = await createAsset(company.id, branch, "LEGACY", 20);
    await models.Reservation.create({
      id: `${namespace}-RES-LEGACY`,
      companyId: company.id,
      assetId: legacyAsset.id,
      assetName: legacyAsset.name,
      customerId: customer.id,
      customerName: customer.name,
      branch: branch.name,
      branchId: branch.id,
      currency: "AED",
      deposit: 0,
      agreedTotal: 20,
      paidTotal: 0,
      remainingTotal: 20,
      excessTotal: 0,
      expiresAt: "2026-12-31",
      workflowVersion: 1,
      isLegacy: true,
      status: "active"
    });
    await expectReject("legacy completion unsupported", () => reservationService.completeSale({ companyId: company.id, branchId: branch.id, user, reservationId: `${namespace}-RES-LEGACY`, idempotencyKey: `${namespace}-LEGACY-COMPLETE`, body: {} }));
    await expectReject("active reservation refund unsupported", () => reservationService.requestRefund({ companyId: company.id, branchId: branch.id, user, reservationId: `${namespace}-RES-LEGACY`, body: { reason: "legacy", refundMethod: "cash" } }));

    // Failed refund posting rolls back execution.
    const refundRollback = await createReservation(company.id, branch, customer, "RREF", 44, 44);
    await reservationService.cancelReservation({ companyId: company.id, branchId: branch.id, user, reservationId: refundRollback.reservationId, body: { reason: "refund rollback" } });
    const rbReq = await reservationService.requestRefund({ companyId: company.id, branchId: branch.id, user, reservationId: refundRollback.reservationId, body: { reason: "refund rollback", refundMethod: "cash" } });
    const rbRefundId = rbReq.responseBody.data.refund.id;
    await reservationService.approveRefund({ companyId: company.id, branchId: branch.id, user, refundId: rbRefundId, body: {} });
    const originalRefundPost = postingService.postReservationRefundEntry;
    postingService.postReservationRefundEntry = async () => { throw new Error("forced refund rollback"); };
    try {
      await expectReject("forced refund rollback", () => reservationService.executeRefund({ companyId: company.id, branchId: branch.id, user, refundId: rbRefundId, idempotencyKey: `${namespace}-RREF-EXEC`, body: { treasuryAccountCode: "1110" } }));
    } finally {
      postingService.postReservationRefundEntry = originalRefundPost;
    }
    const [rbRefund] = await q("select status, journal_entry_id, cash_transaction_id from reservation_refunds where id = :id", { id: rbRefundId });
    assert.equal(rbRefund.status, "approved", "failed refund execution leaves refund approved");
    assert.equal(rbRefund.journal_entry_id, null, "failed refund execution leaves no journal reference");
    assert.equal(await count("cash_transactions", "reference = :id", { id: rbRefundId }), 0, "failed refund execution leaves no cash movement");

    await restoreAdvancesSetting(settingState);
    settingState = null;
    await cleanup();
    const after = await counts();
    assert.deepEqual(after, before, `live verifier cleanup preserved counts before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
    console.log("LIVE TESTS EXECUTED");
    console.log("No persistent test pollution detected.");
  } catch (error) {
    try { await restoreAdvancesSetting(settingState); } catch (_) {}
    try { await cleanup(); } catch (cleanupError) {
      console.error(`Cleanup failed for namespace ${namespace}: ${cleanupError.message}`);
    }
    throw error;
  } finally {
    await models.sequelize.close();
  }
}

(async function main() {
  runStatic();
  if (process.env.VERIFY_RESERVATION_SETTLEMENT_LIVE === "true") {
    await runLive();
  } else {
    console.log("STATIC ONLY — LIVE DATA NOT VERIFIED");
  }
  console.log("verify-reservation-completion-refund-settlement: ok");
})().catch((error) => {
  console.error(`verify-reservation-completion-refund-settlement: failed: ${error.stack || error.message}`);
  process.exit(1);
});
