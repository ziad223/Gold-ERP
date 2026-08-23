/**
 * Phase 32.6-Fix C — reservation item amendments, automatic expiry, extension,
 * and renewal (with advance transfer + renewal-excess refund).
 *
 * Default mode is static and non-mutating. Live mode is explicitly gated by:
 *   VERIFY_RESERVATION_LIFECYCLE_LIVE=true
 *   VERIFY_DATABASE_NAME=darfus_erp
 *
 * Live mode creates isolated rows under a unique T32C namespace and cleans only
 * that namespace. It never runs reset, seed, migration rollback, or remote
 * checks, and it drives expiry through namespace-scoped service calls so no
 * business record outside the test namespace is ever touched.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { assertAdoptedLocalDatabase } = require("./lib/verify-local-database-guard");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.resolve(ROOT, "backend");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");
const exists = (rel) => fs.existsSync(path.resolve(ROOT, rel));

const SERVICE = "backend/src/services/reservation.service.js";
const SCHEDULER = "backend/src/services/reservation-expiry-scheduler.js";
const ROUTES = "backend/src/routes/erp.routes.js";
const INDEX = "backend/src/models/index.js";
const SERVER = "backend/src/server.js";
const FRONTEND = "app/[locale]/(dashboard)/sales/reservations/page.tsx";
const MIGRATION = "backend/migrations/20260712010000-reservation-lifecycle-amendments-expiry-renewal.js";

function filesAndSchema() {
  for (const file of [
    "backend/src/models/reservationAmendment.model.js",
    "backend/src/models/reservationAmendmentItem.model.js",
    "backend/src/models/reservationExpiryExtension.model.js",
    "backend/src/models/reservationRenewal.model.js",
    "backend/src/models/reservationPaymentTransfer.model.js",
    SCHEDULER,
    MIGRATION,
  ]) assert.ok(exists(file), `Fix C file exists: ${file}`);

  const migration = read(MIGRATION);
  for (const table of [
    "reservation_amendments",
    "reservation_amendment_items",
    "reservation_expiry_extensions",
    "reservation_renewals",
    "reservation_payment_transfers",
  ]) assert.ok(migration.includes(table), `migration creates ${table}`);
  for (const column of ["expiry_processed_at", "expired_by_system", "predecessor_reservation_id", "successor_reservation_id", "renewal_status", "extension_count"]) {
    assert.ok(migration.includes(column), `migration adds reservation column ${column}`);
  }
  assert.ok(migration.includes("ADD VALUE IF NOT EXISTS 'pending_renewal_settlement'") && migration.includes("ADD VALUE IF NOT EXISTS 'renewed'"), "migration adds renewal statuses");
  assert.ok(migration.includes("ADD VALUE IF NOT EXISTS 'transferred'"), "migration adds transferred payment status");
  assert.ok(migration.includes("refund_type") && migration.includes("renewal_id"), "migration adds refund typing");
  assert.ok(/async down\(\)\s*{[^}]*throw new Error/s.test(migration), "migration is forward-only");

  const reservationModel = read("backend/src/models/reservation.model.js");
  assert.ok(reservationModel.includes('"pending_renewal_settlement"') && reservationModel.includes('"renewed"'), "reservation model exposes renewal statuses");
  assert.ok(read("backend/src/models/reservationPayment.model.js").includes('"transferred"'), "payment model exposes transferred status");
  assert.ok(read("backend/src/models/reservationRefund.model.js").includes("renewal_excess"), "refund model exposes renewal_excess type");
}

function modelRegistration() {
  const index = read(INDEX);
  for (const model of ["ReservationAmendment", "ReservationAmendmentItem", "ReservationExpiryExtension", "ReservationRenewal", "ReservationPaymentTransfer"]) {
    assert.ok(index.includes(`require("./${model[0].toLowerCase()}${model.slice(1)}.model")`), `index requires ${model}`);
    assert.ok(new RegExp(`\\b${model}\\b`).test(index), `index registers ${model}`);
  }
  assert.ok(index.includes('as: "amendments"') && index.includes('as: "expiryExtensions"') && index.includes('as: "renewalsAsSource"'), "index wires reservation lifecycle associations");
  assert.ok(index.includes('as: "transfers"'), "index wires renewal transfer association");
}

function serviceContract() {
  const service = read(SERVICE);
  for (const method of [
    "amendItems", "_amendItemsInTransaction",
    "extendExpiry", "processDueExpirations", "_expireOneReservation",
    "renewReservation", "_renewInTransaction", "_transferAndActivateSuccessor",
    "_finalizeSuccessorActivation", "approveRenewalExcessRefund", "executeRenewalExcessRefund",
    "_releaseActiveReservationItems", "calculateTransferableUnits", "allocateAcrossPayments",
  ]) assert.ok(service.includes(method), `service implements ${method}`);

  assert.ok(service.includes("FOR UPDATE SKIP LOCKED"), "expiry scheduler query uses SKIP LOCKED for multi-worker safety");
  assert.ok(service.includes("SELECT now() AS now"), "expiry/extension use trusted database time");
  assert.ok(service.includes("An amendment cannot leave a reservation with no active items"), "amendment blocks zero active items");
  assert.ok(service.includes("would leave the reservation total below the paid amount"), "amendment blocks total below paid");
  assert.ok(service.includes("currentAssetPriceUnits"), "amendment/renewal resolve prices server-side from asset records");
  assert.ok(service.includes("Only automatically expired reservations can be renewed"), "renewal requires automatic expiry");
  assert.ok(service.includes('paymentMethod: "reservation_transfer"'), "renewal transfer creates transfer-origin successor payments");
  assert.ok(service.includes("reservation.payment_transferred"), "transfer audit event exists");
  // The transfer subledger carries the value; no cash/bank/revenue/VAT/AR/COGS/inventory line.
  const transferFn = service.slice(service.indexOf("async _transferAndActivateSuccessor"), service.indexOf("async _finalizeSuccessorActivation"));
  assert.ok(transferFn.includes("journalEntryId: null"), "renewal transfer posts no GL journal (advances/customer/branch/currency unchanged)");
  assert.ok(!/postInvoiceEntry|postEntry|CashTransaction\.create/.test(transferFn), "renewal transfer creates no invoice, journal, or cash movement");
  assert.ok(service.includes("postReservationRefundEntry") && service.includes("reservation.renewal_excess_refund_executed"), "renewal excess refund reuses Dr Advances / Cr Cash posting");
  assert.ok(service.includes('refundType: "renewal_excess"'), "renewal excess refund is a distinct refund type");
}

function schedulerContract() {
  const sched = read(SCHEDULER);
  assert.ok(sched.includes("processDueExpirations"), "scheduler delegates to the reusable service operation");
  assert.ok(sched.includes("setInterval"), "scheduler uses a recurring tick");
  assert.ok(sched.includes("VERIFY_RESERVATION_LIFECYCLE_LIVE") && sched.includes('NODE_ENV') && sched.includes("DISABLE_RESERVATION_EXPIRY_SCHEDULER"), "scheduler is isolated in test/verifier mode");
  assert.ok(sched.includes("unref"), "scheduler timer does not keep the process alive");
  assert.ok(read(SERVER).includes("reservationExpiryScheduler") && read(SERVER).includes(".start("), "server bootstraps the expiry scheduler");
}

function routesAndPermissions() {
  const routes = read(ROUTES);
  for (const route of [
    'router.post("/reservations/:id/amend-items"',
    'router.post("/reservations/:id/extend-expiry"',
    'router.post("/reservations/:id/renew"',
    'router.get("/reservations/:id/amendments"',
    'router.get("/reservations/:id/extensions"',
    'router.get("/reservations/:id/renewal"',
    'router.post("/reservation-renewal-refunds/:id/approve"',
    'router.post("/reservation-renewal-refunds/:id/execute"',
  ]) assert.ok(routes.includes(route), `route exists: ${route}`);
  assert.ok(routes.includes("reservationPerms.amendItems") && routes.includes("amendItems"), "amendment is permissioned");
  assert.ok(routes.includes("extendExpiry") && routes.includes("renewReservation"), "expiry/renewal routes are wired");
  assert.ok(routes.includes("reservationPerms.refundApprove") && routes.includes("approveRenewalExcessRefund"), "renewal excess approval uses reservation refund approval permission");
  assert.ok(routes.includes("reservationPerms.refundExecute") && routes.includes("executeRenewalExcessRefund"), "renewal excess execution uses reservation refund execution permission");
  assert.ok(routes.includes('headers["idempotency-key"]') && routes.includes("amendItems"), "mutation routes read Idempotency-Key");
}

function frontendContract() {
  const page = read(FRONTEND);
  for (const endpoint of [
    "/reservations/${encodeURIComponent(reservation.id)}/amend-items",
    "/reservations/${encodeURIComponent(reservation.id)}/extend-expiry",
    "/reservations/${encodeURIComponent(reservation.id)}/renew",
    "/reservation-renewal-refunds/${encodeURIComponent(refund.id)}/approve",
    "/reservation-renewal-refunds/${encodeURIComponent(refund.id)}/execute",
  ]) assert.ok(page.includes(endpoint), `frontend uses dedicated endpoint: ${endpoint}`);
  assert.ok(page.includes('hasPermission("sales.approve")') && page.includes('hasPermission("approvals.manage")') && page.includes('hasPermission("treasury.update")'), "frontend checks Fix C permissions");
  assert.ok(page.includes("idempotencyKey: generateUUID()"), "frontend sends idempotency keys for Fix C mutations");
  assert.ok(page.includes("successorAssetIds") && page.includes("addAssetIds") && page.includes("removeItemIds"), "frontend submits asset ids only for amend/renew");
  assert.ok(page.includes("expiredBySystem") && page.includes("renewalStatus"), "frontend displays expiry/renewal state");
  // No generic PATCH and no trusted persisted financial values submitted in the Fix C action code.
  const actionSection = page.slice(page.indexOf("const amendItemsMutation"), page.indexOf("return ("));
  assert.ok(!/method:\s*"PATCH"/.test(actionSection), "frontend does not use generic PATCH for Fix C transitions");
  for (const forbidden of ["transferAmount:", "successorTotal:", "excessRefundAmount:", "journalLines", "cogs", "vatRate", "assetStatus"]) {
    assert.ok(!actionSection.includes(forbidden), `frontend does not submit trusted ${forbidden} in Fix C actions`);
  }
}

function docsAndPackage() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["verify:reservation-amendment-expiry-renewal"], "node scripts/verify-reservation-amendment-expiry-renewal.js", "package verifier script registered");
  for (const doc of ["docs/AI_HANDOFF.md", "docs/CLIENT_SCOPE_LOCK.md"]) {
    const src = read(doc);
    assert.ok(src.includes("Phase 32.6-Fix C"), `${doc} documents Fix C`);
    assert.ok(/amendment/i.test(src) && /expiry/i.test(src) && /renewal/i.test(src), `${doc} documents amendment/expiry/renewal`);
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
  assert.deepEqual(forbidden, [], `Fix C must not touch protected statement/customer-credit/print files (found: ${forbidden.join(", ")})`);
}

function runStatic() {
  filesAndSchema();
  modelRegistration();
  serviceContract();
  schedulerContract();
  routesAndPermissions();
  frontendContract();
  docsAndPackage();
  scopeGuard();
}

function assertLocalLiveEnvironment() {
  assert.equal(process.env.VERIFY_RESERVATION_LIFECYCLE_LIVE, "true", "live verification requires VERIFY_RESERVATION_LIFECYCLE_LIVE=true");
  assert.equal(process.env.VERIFY_DATABASE_NAME, "darfus_erp", "live verification requires VERIFY_DATABASE_NAME=darfus_erp");
  assert.ok(["development", "test", "demo"].includes(process.env.NODE_ENV), "live verification requires development/test/demo NODE_ENV");
  assert.ok(["localhost", "127.0.0.1", "::1"].includes(process.env.DB_HOST), `live verification requires local DB host, got ${process.env.DB_HOST}`);
  assert.equal(String(process.env.DB_PORT), "5432", "live verification requires DB_PORT=5432");
  assert.equal(process.env.DB_NAME, process.env.VERIFY_DATABASE_NAME, "live verification DB_NAME must match VERIFY_DATABASE_NAME");
  for (const key of ["ALLOW_CLIENT_DEMO_RESET", "RESET_TARGET", "CONFIRM_DATABASE_NAME", "OWNER_CONFIRMED_DEMO_ONLY"]) {
    assert.ok(!process.env[key], `${key} must not be set for read-only/live verifier cleanup mode`);
  }
  const url = `${process.env.DATABASE_URL || ""} ${process.env.RENDER || ""} ${process.env.RENDER_EXTERNAL_URL || ""}`.toLowerCase();
  assert.ok(!url.includes("render") && !url.includes("amazonaws") && !url.includes("supabase"), "remote/managed database indicators are rejected");
  assertAdoptedLocalDatabase({ riskClass: "V3_WRITE_CLEANUP" });
}

function money(n) { return Number(n).toFixed(4); }
function asNum(v) { return Number(Number(v || 0).toFixed(4)); }

async function runLive() {
  assertLocalLiveEnvironment();
  const models = require(path.resolve(BACKEND, "src/models"));
  const reservationService = require(path.resolve(BACKEND, "src/services/reservation.service"));
  const { QueryTypes } = require(path.resolve(BACKEND, "node_modules/sequelize"));
  models.sequelize.options.logging = false;

  const namespace = `T32C-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const user = { id: `${namespace}-USR`, firstName: "Verifier", lastName: "Lifecycle", email: "verifier@example.invalid" };
  const q = (sql, replacements = {}) => models.sequelize.query(sql, { type: QueryTypes.SELECT, replacements });
  const exec = (sql, replacements = {}) => models.sequelize.query(sql, { replacements });
  const count = async (table, where = "true", replacements = {}) => Number((await q(`select count(*)::int as c from ${table} where ${where}`, replacements))[0].c);
  const counts = async () => ({
    reservations: await count("reservations"),
    reservationItems: await count("reservation_items"),
    reservationPayments: await count("reservation_payments"),
    amendments: await count("reservation_amendments"),
    amendmentItems: await count("reservation_amendment_items"),
    extensions: await count("reservation_expiry_extensions"),
    renewals: await count("reservation_renewals"),
    transfers: await count("reservation_payment_transfers"),
    refunds: await count("reservation_refunds"),
    refundAllocations: await count("reservation_refund_allocations"),
    invoices: await count("invoices"),
    journals: await count("journal_entries"),
    journalLines: await count("journal_lines"),
    assets: await count("assets"),
    stockMovements: await count("stock_movements"),
    cashTransactions: await count("cash_transactions"),
  });

  async function cleanup() {
    await exec("delete from reservation_payment_transfers where id like :ns or renewal_id like :ns or source_reservation_id like :ns", { ns: `${namespace}%` });
    await exec("delete from reservation_amendment_items where id like :ns or reservation_id like :ns", { ns: `${namespace}%` });
    await exec("delete from reservation_amendments where id like :ns or reservation_id like :ns", { ns: `${namespace}%` });
    await exec("delete from reservation_expiry_extensions where id like :ns or reservation_id like :ns", { ns: `${namespace}%` });
    await exec("delete from reservation_renewals where id like :ns or source_reservation_id like :ns", { ns: `${namespace}%` });
    await exec("delete from reservation_refund_allocations where reservation_refund_id like :ns or id like :ns", { ns: `${namespace}%` });
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
    await exec("delete from reservations where id like :ns or asset_id like :ns or predecessor_reservation_id like :ns", { ns: `${namespace}%` });
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
  async function restoreAdvancesSetting(state) { if (state && !state.existed && state.row) await state.row.destroy(); }

  let assetSeq = 0;
  async function createAsset(companyId, branch, price = 100, cost = 55) {
    assetSeq += 1;
    const id = `${namespace}-AST-${assetSeq}`;
    return models.Asset.create({
      id, companyId, name: `Verifier Asset ${assetSeq}`, type: "gold-piece", category: "ring",
      karat: 21, purity: 0.875, grossWeight: 10, netWeight: 9, goldWeight: 9, price, cost,
      branch: branch.name, branchId: branch.id, location: "Verifier", status: "available",
      barcode: `${namespace}-BC-${assetSeq}`, source: "verifier"
    });
  }

  let resSeq = 0;
  async function createReservation(companyId, branch, customer, { assets: assetList, paymentAmount = 0, expiresAt = "2027-12-31T23:59:00.000Z" }) {
    resSeq += 1;
    const id = `${namespace}-RES-${resSeq}`;
    const items = assetList.map((a) => ({ assetId: a.id, agreedPrice: money(a.price) }));
    const result = await reservationService.createReservation({
      companyId, branchId: branch.id, user, idempotencyKey: `${namespace}-CRT-${resSeq}`,
      body: { id, customerId: customer.id, branchId: branch.id, expiresAt, items, initialPayment: paymentAmount > 0 ? { amount: money(paymentAmount), paymentMethod: "cash" } : undefined, notes: `Verifier ${namespace}` }
    });
    assert.equal(result.statusCode, 201, `reservation ${id} created`);
    return id;
  }

  async function expectReject(label, fn) {
    let rejected = false;
    try { await fn(); } catch (err) { rejected = true; assert.ok(err.message, `${label} returned a message`); }
    assert.ok(rejected, `${label} must reject`);
  }

  const before = await counts();
  let settingState = null;
  let company, branch, customer;
  try {
    console.log(`LIVE DB IDENTITY host=${process.env.DB_HOST} port=${process.env.DB_PORT} db=${process.env.DB_NAME} env=${process.env.NODE_ENV}`);
    [company] = await q("select id from companies limit 1");
    assert.ok(company?.id, "company exists");
    [branch] = await q("select id, name from branches where company_id = :companyId limit 1", { companyId: company.id });
    assert.ok(branch?.id, "branch exists");
    [customer] = await q("select id, name from customers where company_id = :companyId limit 1", { companyId: company.id });
    assert.ok(customer?.id, "customer exists");
    settingState = await ensureAdvancesSetting(company.id);
    const CID = company.id;

    // ── Amendments ──────────────────────────────────────────────────────────
    // Add one item.
    {
      const a1 = await createAsset(CID, branch, 100);
      const rid = await createReservation(CID, branch, customer, { assets: [a1] });
      const add = await createAsset(CID, branch, 60);
      const res = await reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM1`, body: { addAssetIds: [add.id], reason: "add one" } });
      assert.equal(res.statusCode, 200, "add one item succeeds");
      const [row] = await q("select agreed_total, status from reservations where id = :id", { id: rid });
      assert.equal(asNum(row.agreed_total), 160, "total reflects added item at current server price");
      assert.equal(await count("reservation_items", "reservation_id = :id and status = 'active'", { id: rid }), 2, "two active items after add");
      assert.equal(await count("journal_entries", "source_id = :id", { id: rid }), 0, "amendment posts no journal");
      const addedAsset = await models.Asset.findByPk(add.id);
      assert.equal(addedAsset.status, "reserved", "added asset reserved");
    }

    // Add multiple atomically.
    {
      const a1 = await createAsset(CID, branch, 100);
      const rid = await createReservation(CID, branch, customer, { assets: [a1] });
      const b1 = await createAsset(CID, branch, 30);
      const b2 = await createAsset(CID, branch, 20);
      await reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM2`, body: { addAssetIds: [b1.id, b2.id], reason: "add many" } });
      assert.equal(await count("reservation_items", "reservation_id = :id and status = 'active'", { id: rid }), 3, "three active items after multi-add");
    }

    // Remove one item + removed remains in history + final items correct.
    {
      const a1 = await createAsset(CID, branch, 100);
      const a2 = await createAsset(CID, branch, 40);
      const rid = await createReservation(CID, branch, customer, { assets: [a1, a2] });
      const items = await models.ReservationItem.findAll({ where: { reservationId: rid, status: "active" } });
      const removeItem = items.find((i) => i.assetId === a2.id);
      await reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM3`, body: { removeItemIds: [removeItem.id], reason: "remove one" } });
      assert.equal(await count("reservation_items", "reservation_id = :id and status = 'active'", { id: rid }), 1, "one active item after remove");
      assert.equal(await count("reservation_items", "id = :id and status = 'released'", { id: removeItem.id }), 1, "removed item preserved as released");
      const releasedAsset = await models.Asset.findByPk(a2.id);
      assert.equal(releasedAsset.status, "available", "removed asset returns available");
      const [row] = await q("select agreed_total from reservations where id = :id", { id: rid });
      assert.equal(asNum(row.agreed_total), 100, "total reflects removal");
    }

    // Replace one item.
    {
      const a1 = await createAsset(CID, branch, 100);
      const rid = await createReservation(CID, branch, customer, { assets: [a1] });
      const items = await models.ReservationItem.findAll({ where: { reservationId: rid, status: "active" } });
      const repl = await createAsset(CID, branch, 130);
      await reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM4`, body: { replacements: [{ removeItemId: items[0].id, addAssetId: repl.id }], reason: "replace" } });
      assert.equal((await models.Asset.findByPk(a1.id)).status, "available", "replaced-out asset available");
      assert.equal((await models.Asset.findByPk(repl.id)).status, "reserved", "replaced-in asset reserved");
      assert.equal(await count("reservation_amendment_items", "reservation_id = :id and action in ('replaced_out','replaced_in')", { id: rid }), 2, "replacement recorded in/out");
      const [row] = await q("select agreed_total from reservations where id = :id", { id: rid });
      assert.equal(asNum(row.agreed_total), 130, "total reflects replacement price");
    }

    // Mixed add/remove + amendment type mixed.
    {
      const a1 = await createAsset(CID, branch, 100);
      const a2 = await createAsset(CID, branch, 50);
      const rid = await createReservation(CID, branch, customer, { assets: [a1, a2] });
      const items = await models.ReservationItem.findAll({ where: { reservationId: rid, status: "active" } });
      const add = await createAsset(CID, branch, 70);
      await reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM5`, body: { addAssetIds: [add.id], removeItemIds: [items.find((i) => i.assetId === a2.id).id], reason: "mixed" } });
      const [am] = await q("select amendment_type from reservation_amendments where reservation_id = :id order by created_at desc limit 1", { id: rid });
      assert.equal(am.amendment_type, "mixed", "mixed amendment type recorded");
    }

    // Reprice: change asset price then reprice refreshes to current server price.
    {
      const a1 = await createAsset(CID, branch, 100);
      const rid = await createReservation(CID, branch, customer, { assets: [a1] });
      const items = await models.ReservationItem.findAll({ where: { reservationId: rid, status: "active" } });
      await a1.update({ price: 150 });
      await reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM6`, body: { repriceItemIds: [items[0].id], reason: "reprice" } });
      const [row] = await q("select agreed_total from reservations where id = :id", { id: rid });
      assert.equal(asNum(row.agreed_total), 150, "reprice refreshes to current server asset price");
    }

    // Reject: duplicate (asset already active), sold asset, zero active items.
    {
      const a1 = await createAsset(CID, branch, 100);
      const rid = await createReservation(CID, branch, customer, { assets: [a1] });
      await expectReject("add asset already reserved in reservation", () => reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM7`, body: { addAssetIds: [a1.id], reason: "dup" } }));
      const sold = await createAsset(CID, branch, 100); await sold.update({ status: "sold" });
      await expectReject("add sold asset", () => reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM8`, body: { addAssetIds: [sold.id], reason: "sold" } }));
      const items = await models.ReservationItem.findAll({ where: { reservationId: rid, status: "active" } });
      await expectReject("remove all items", () => reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM9`, body: { removeItemIds: items.map((i) => i.id), reason: "empty" } }));
    }

    // Reject: asset reserved elsewhere.
    {
      const shared = await createAsset(CID, branch, 100);
      const other = await createReservation(CID, branch, customer, { assets: [shared] });
      const a1 = await createAsset(CID, branch, 100);
      const rid = await createReservation(CID, branch, customer, { assets: [a1] });
      await expectReject("add asset reserved elsewhere", () => reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM10`, body: { addAssetIds: [shared.id], reason: "elsewhere" } }));
      assert.ok(other, "other reservation exists");
    }

    // Paid interactions: equal-to-paid allowed; below-paid rejected; fully_paid → partially_paid on increase.
    {
      const a1 = await createAsset(CID, branch, 100);
      const a2 = await createAsset(CID, branch, 40);
      const rid = await createReservation(CID, branch, customer, { assets: [a1, a2], paymentAmount: 100 });
      // paid 100, total 140. Remove a2 (→100) allowed (equal to paid).
      const items = await models.ReservationItem.findAll({ where: { reservationId: rid, status: "active" } });
      const a2item = items.find((i) => i.assetId === a2.id);
      // First: removing a2 AND a1 would drop below paid → but that's zero items. Test below-paid via a different setup.
      await reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM11`, body: { removeItemIds: [a2item.id], reason: "equal to paid" } });
      const [row] = await q("select agreed_total, paid_total, status from reservations where id = :id", { id: rid });
      assert.equal(asNum(row.agreed_total), 100, "total equals paid after removal");
      assert.equal(asNum(row.paid_total), 100, "paid unchanged by amendment");
      assert.equal(row.status, "fully_paid", "equal total-to-paid is fully_paid");
      assert.equal(await count("reservation_payments", "reservation_id = :id and status = 'posted'", { id: rid }), 1, "historical payment unchanged");
      // Now add a higher-priced item → fully_paid becomes partially_paid.
      const add = await createAsset(CID, branch, 80);
      await reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM12`, body: { addAssetIds: [add.id], reason: "increase" } });
      const [row2] = await q("select status from reservations where id = :id", { id: rid });
      assert.equal(row2.status, "partially_paid", "increasing total moves fully_paid to partially_paid");
    }

    // Below-paid rejection.
    {
      const a1 = await createAsset(CID, branch, 100);
      const a2 = await createAsset(CID, branch, 100);
      const rid = await createReservation(CID, branch, customer, { assets: [a1, a2], paymentAmount: 150 });
      const items = await models.ReservationItem.findAll({ where: { reservationId: rid, status: "active" } });
      await expectReject("removal dropping total below paid", () => reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM13`, body: { removeItemIds: [items[0].id], reason: "below paid" } }));
    }

    // Idempotency + rollback + concurrency.
    {
      const a1 = await createAsset(CID, branch, 100);
      const rid = await createReservation(CID, branch, customer, { assets: [a1] });
      const add = await createAsset(CID, branch, 30);
      const first = await reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM-IDEM`, body: { addAssetIds: [add.id], reason: "idem" } });
      const replay = await reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-AM-IDEM`, body: { addAssetIds: [add.id], reason: "idem" } });
      assert.equal(replay.statusCode, first.statusCode, "same amendment idempotency key replays");
      assert.equal(await count("reservation_amendments", "reservation_id = :id", { id: rid }), 1, "idempotent amendment stored once");

      const rb1 = await createAsset(CID, branch, 100);
      const ridRb = await createReservation(CID, branch, customer, { assets: [rb1] });
      const beforeItems = await count("reservation_items", "reservation_id = :id and status = 'active'", { id: ridRb });
      await expectReject("amendment referencing missing asset rolls back", () => reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: ridRb, idempotencyKey: `${namespace}-AM-RB`, body: { addAssetIds: [`${namespace}-MISSING`], reason: "rollback" } }));
      assert.equal(await count("reservation_items", "reservation_id = :id and status = 'active'", { id: ridRb }), beforeItems, "failed amendment left items unchanged");
      assert.equal(await count("reservation_amendments", "reservation_id = :id", { id: ridRb }), 0, "failed amendment created no record");

      const cc1 = await createAsset(CID, branch, 100);
      const ridCc = await createReservation(CID, branch, customer, { assets: [cc1] });
      const addA = await createAsset(CID, branch, 20);
      const addB = await createAsset(CID, branch, 25);
      const results = await Promise.allSettled([
        reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: ridCc, idempotencyKey: `${namespace}-CC-A`, body: { addAssetIds: [addA.id], reason: "cc-a" } }),
        reservationService.amendItems({ companyId: CID, branchId: branch.id, user, reservationId: ridCc, idempotencyKey: `${namespace}-CC-B`, body: { addAssetIds: [addB.id], reason: "cc-b" } }),
      ]);
      assert.ok(results.filter((r) => r.status === "fulfilled").length >= 1, "at least one concurrent amendment succeeds");
      const activeCc = await count("reservation_items", "reservation_id = :id and status = 'active'", { id: ridCc });
      assert.ok(activeCc >= 2 && activeCc <= 3, "concurrent amendments leave a consistent item set");
    }

    // ── Expiry & extension ───────────────────────────────────────────────────
    // Extend before expiry.
    {
      const a1 = await createAsset(CID, branch, 100);
      const rid = await createReservation(CID, branch, customer, { assets: [a1], expiresAt: "2027-06-01T00:00:00.000Z" });
      const res = await reservationService.extendExpiry({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-EX1`, body: { newExpiry: "2027-09-01T00:00:00.000Z", reason: "extend" } });
      assert.equal(res.statusCode, 200, "extend before expiry succeeds");
      assert.equal(await count("reservation_expiry_extensions", "reservation_id = :id", { id: rid }), 1, "extension history recorded");
      await expectReject("shorten via extension", () => reservationService.extendExpiry({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-EX2`, body: { newExpiry: "2027-07-01T00:00:00.000Z", reason: "shorten" } }));
    }
    // Reject extension after expiry.
    {
      const a1 = await createAsset(CID, branch, 100);
      const rid = await createReservation(CID, branch, customer, { assets: [a1], expiresAt: "2020-01-01T00:00:00.000Z" });
      await expectReject("extend already-expired", () => reservationService.extendExpiry({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-EX3`, body: { newExpiry: "2027-01-01T00:00:00.000Z", reason: "late" } }));
    }
    // Automatic expiry: paid → refund pending; unpaid → cancelled; assets released; no accounting.
    {
      const paidAsset = await createAsset(CID, branch, 100);
      const ridPaid = await createReservation(CID, branch, customer, { assets: [paidAsset], paymentAmount: 100, expiresAt: "2020-01-01T00:00:00.000Z" });
      const unpaidAsset = await createAsset(CID, branch, 100);
      const ridUnpaid = await createReservation(CID, branch, customer, { assets: [unpaidAsset], expiresAt: "2020-01-01T00:00:00.000Z" });
      const summary = await reservationService.processDueExpirations({ companyId: CID, idPrefix: `${namespace}%`, limit: 50 });
      assert.ok(summary.processed >= 2, "scheduler processed due test reservations");
      const [paid] = await q("select status, expired_by_system, refund_status from reservations where id = :id", { id: ridPaid });
      assert.equal(paid.status, "cancelled_refund_pending", "paid expired → cancelled_refund_pending");
      assert.equal(paid.expired_by_system, true, "expiry flagged by system");
      assert.equal((await models.Asset.findByPk(paidAsset.id)).status, "available", "expired reservation released asset");
      const [unpaid] = await q("select status from reservations where id = :id", { id: ridUnpaid });
      assert.equal(unpaid.status, "cancelled", "unpaid expired → cancelled");
      assert.equal(await count("journal_entries", "source_id = :id", { id: ridPaid }), 0, "expiry posts no journal");
      assert.equal(await count("reservation_payments", "reservation_id = :id and status = 'posted'", { id: ridPaid }), 1, "expiry leaves payment posted");
      // Idempotent re-run.
      const summary2 = await reservationService.processDueExpirations({ companyId: CID, idPrefix: `${namespace}%`, limit: 50 });
      assert.equal(summary2.processed, 0, "second expiry run is idempotent (nothing due)");
      // Fully paid does not auto-complete (no sale invoice).
      assert.equal(await count("invoices", "related_invoice_id = :id", { id: ridPaid }), 0, "fully paid expiry does not create a sale invoice");
      // Payment after expiry rejected.
      await expectReject("payment after expiry", () => reservationService.addPayment({ companyId: CID, branchId: branch.id, user, reservationId: ridPaid, idempotencyKey: `${namespace}-PAYEXP`, body: { amount: "10.0000", paymentMethod: "cash" } }));
      // Completion after expiry rejected.
      await expectReject("completion after expiry", () => reservationService.completeSale({ companyId: CID, branchId: branch.id, user, reservationId: ridPaid, idempotencyKey: `${namespace}-CMPEXP`, body: {} }));
    }

    // ── Renewal ──────────────────────────────────────────────────────────────
    // Helper: make an auto-expired paid source reservation.
    async function expiredPaidSource(price, paid) {
      const asset = await createAsset(CID, branch, price);
      const rid = await createReservation(CID, branch, customer, { assets: [asset], paymentAmount: paid, expiresAt: "2020-01-01T00:00:00.000Z" });
      await reservationService.processDueExpirations({ companyId: CID, idPrefix: `${namespace}%`, limit: 50 });
      return { rid, asset };
    }

    // Equal: successor total == transferable → fully_paid, one successor, links, no invoice.
    {
      const { rid } = await expiredPaidSource(100, 100);
      const succAsset = await createAsset(CID, branch, 100);
      const res = await reservationService.renewReservation({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-RN-EQ`, body: { successorId: `${namespace}-SUC-EQ`, successorAssetIds: [succAsset.id], newExpiry: "2027-12-31T00:00:00.000Z", reason: "equal renew" } });
      assert.equal(res.statusCode, 201, "renewal succeeds");
      const successorId = res.responseBody.data.successor.id;
      const [src] = await q("select status, successor_reservation_id from reservations where id = :id", { id: rid });
      assert.equal(src.status, "renewed", "source becomes renewed");
      assert.equal(src.successor_reservation_id, successorId, "source links successor");
      const [succ] = await q("select status, paid_total, predecessor_reservation_id from reservations where id = :id", { id: successorId });
      assert.equal(succ.status, "fully_paid", "equal successor is fully paid");
      assert.equal(asNum(succ.paid_total), 100, "successor funded by transfer");
      assert.equal(succ.predecessor_reservation_id, rid, "successor links predecessor");
      assert.equal(await count("reservation_payment_transfers", "source_reservation_id = :id", { id: rid }), 1, "one transfer recorded");
      assert.equal(await count("cash_transactions", "reference = :id", { id: successorId }), 0, "transfer creates no cash movement");
      assert.equal(await count("invoices", "related_invoice_id = :id", { id: successorId }), 0, "renewal creates no auto invoice");
      // Original source payment immutable (still posted), transferable now 0.
      assert.equal(await count("reservation_payments", "reservation_id = :id and status = 'posted'", { id: rid }), 1, "source original payment immutable/posted");
      // Duplicate renewal prevented.
      const succAsset2 = await createAsset(CID, branch, 100);
      await expectReject("duplicate renewal", () => reservationService.renewReservation({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-RN-EQ2`, body: { successorAssetIds: [succAsset2.id], newExpiry: "2027-12-31T00:00:00.000Z", reason: "dup" } }));
    }

    // Higher: successor total > transferable → transfer all, remaining due, partially_paid.
    {
      const { rid } = await expiredPaidSource(100, 100);
      const s1 = await createAsset(CID, branch, 100);
      const s2 = await createAsset(CID, branch, 60);
      const res = await reservationService.renewReservation({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-RN-HI`, body: { successorId: `${namespace}-SUC-HI`, successorAssetIds: [s1.id, s2.id], newExpiry: "2027-12-31T00:00:00.000Z", reason: "higher renew" } });
      const successorId = res.responseBody.data.successor.id;
      const [succ] = await q("select status, paid_total, remaining_total from reservations where id = :id", { id: successorId });
      assert.equal(succ.status, "partially_paid", "higher successor is partially paid");
      assert.equal(asNum(succ.paid_total), 100, "transferred full source balance");
      assert.equal(asNum(succ.remaining_total), 60, "successor remaining is the difference");
    }

    // Lower: successor total < transferable → pending excess refund; approve+execute; then activate.
    {
      const { rid } = await expiredPaidSource(200, 200);
      const succAsset = await createAsset(CID, branch, 120);
      const res = await reservationService.renewReservation({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-RN-LO`, body: { successorId: `${namespace}-SUC-LO`, successorAssetIds: [succAsset.id], newExpiry: "2027-12-31T00:00:00.000Z", reason: "lower renew", refundMethod: "cash" } });
      const successorId = res.responseBody.data.successor.id;
      const excessRefundId = res.responseBody.data.excessRefund.id;
      assert.equal(res.responseBody.data.mode, "pending_excess_refund", "lower renewal is pending excess refund");
      assert.equal(asNum(res.responseBody.data.excessAmount), 80, "excess is server-derived (200-120)");
      const [succBefore] = await q("select status, paid_total from reservations where id = :id", { id: successorId });
      assert.equal(succBefore.status, "pending_renewal_settlement", "successor pending before excess refund");
      // Cannot execute before approval.
      await expectReject("execute excess before approval", () => reservationService.executeRenewalExcessRefund({ companyId: CID, branchId: branch.id, user, refundId: excessRefundId, idempotencyKey: `${namespace}-XS-EARLY`, body: { treasuryAccountCode: "1110" } }));
      await reservationService.approveRenewalExcessRefund({ companyId: CID, branchId: branch.id, user, refundId: excessRefundId, body: {} });
      const journalsBefore = await count("journal_entries", "source_id = :id", { id: excessRefundId });
      assert.equal(journalsBefore, 0, "excess refund request/approve posts no journal");
      const exec = await reservationService.executeRenewalExcessRefund({ companyId: CID, branchId: branch.id, user, refundId: excessRefundId, idempotencyKey: `${namespace}-XS-EXEC`, body: { treasuryAccountCode: "1110" } });
      assert.equal(exec.statusCode, 200, "excess refund executes");
      // Excess refund posts exactly one journal (Dr Advances / Cr Cash) and one cash-out.
      assert.equal(await count("journal_entries", "source_id = :id and source_type = 'reservation_refund'", { id: excessRefundId }), 1, "excess refund posts one refund journal");
      assert.equal(await count("cash_transactions", "reference = :id", { id: excessRefundId }), 1, "excess refund posts one cash-out");
      // No revenue/VAT/AR/COGS/inventory in the refund journal.
      const refLines = await q("select account_code from journal_lines where journal_entry_id in (select id from journal_entries where source_id = :id)", { id: excessRefundId });
      const refCodes = refLines.map((l) => l.account_code);
      assert.ok(!refCodes.includes("4100") && !refCodes.includes("2200") && !refCodes.includes("1300") && !refCodes.includes("5000") && !refCodes.includes("1200"), "excess refund posts no sales/VAT/AR/COGS/inventory line");
      // Successor activated to fully paid after exact-total transfer.
      const [succAfter] = await q("select status, paid_total from reservations where id = :id", { id: successorId });
      assert.equal(succAfter.status, "fully_paid", "successor fully paid after exact-total transfer");
      assert.equal(asNum(succAfter.paid_total), 120, "successor funded to exact successor total");
      const [srcAfter] = await q("select status from reservations where id = :id", { id: rid });
      assert.equal(srcAfter.status, "renewed", "source renewed after excess settlement");
      // Duplicate execution prevented.
      await expectReject("duplicate excess execution", () => reservationService.executeRenewalExcessRefund({ companyId: CID, branchId: branch.id, user, refundId: excessRefundId, idempotencyKey: `${namespace}-XS-DUP`, body: { treasuryAccountCode: "1110" } }));
    }

    // Manual-cancelled (not auto-expired) cannot be renewed.
    {
      const asset = await createAsset(CID, branch, 100);
      const rid = await createReservation(CID, branch, customer, { assets: [asset], paymentAmount: 100 });
      await reservationService.cancelReservation({ companyId: CID, branchId: branch.id, user, reservationId: rid, body: { reason: "manual" } });
      const succAsset = await createAsset(CID, branch, 100);
      await expectReject("renew manual-cancelled", () => reservationService.renewReservation({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-RN-MAN`, body: { successorAssetIds: [succAsset.id], newExpiry: "2027-12-31T00:00:00.000Z", reason: "no" } }));
    }

    // Excess-refund posting failure rolls back (successor stays pending, no cash, no activation).
    {
      const { rid } = await expiredPaidSource(200, 200);
      const succAsset = await createAsset(CID, branch, 120);
      const res = await reservationService.renewReservation({ companyId: CID, branchId: branch.id, user, reservationId: rid, idempotencyKey: `${namespace}-RN-RB`, body: { successorId: `${namespace}-SUC-RB`, successorAssetIds: [succAsset.id], newExpiry: "2027-12-31T00:00:00.000Z", reason: "rollback", refundMethod: "cash" } });
      const successorId = res.responseBody.data.successor.id;
      const excessRefundId = res.responseBody.data.excessRefund.id;
      await reservationService.approveRenewalExcessRefund({ companyId: CID, branchId: branch.id, user, refundId: excessRefundId, body: {} });
      const postingService = require(path.resolve(BACKEND, "src/services/posting.service"));
      const original = postingService.postReservationRefundEntry;
      postingService.postReservationRefundEntry = async () => { throw new Error("forced excess refund rollback"); };
      try {
        await expectReject("forced excess refund rollback", () => reservationService.executeRenewalExcessRefund({ companyId: CID, branchId: branch.id, user, refundId: excessRefundId, idempotencyKey: `${namespace}-XS-RB`, body: { treasuryAccountCode: "1110" } }));
      } finally {
        postingService.postReservationRefundEntry = original;
      }
      const [succ] = await q("select status from reservations where id = :id", { id: successorId });
      assert.equal(succ.status, "pending_renewal_settlement", "successor still pending after failed excess refund");
      assert.equal(await count("cash_transactions", "reference = :id", { id: excessRefundId }), 0, "failed excess refund leaves no cash movement");
      assert.equal(await count("reservation_payment_transfers", "target_reservation_id = :id", { id: successorId }), 0, "failed excess refund performs no transfer");
    }

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
  if (process.env.VERIFY_RESERVATION_LIFECYCLE_LIVE === "true") {
    await runLive();
  } else {
    console.log("STATIC ONLY — LIVE DATA NOT VERIFIED");
  }
  console.log("verify-reservation-amendment-expiry-renewal: ok");
})().catch((error) => {
  console.error(`verify-reservation-amendment-expiry-renewal: failed: ${error.stack || error.message}`);
  process.exit(1);
});
