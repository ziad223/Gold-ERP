/**
 * Phase RESET-1 — POS reservation deposit workflow + protected customer-deposit
 * account role.
 *
 * Default mode is static and non-mutating. Live mode is explicitly gated by:
 *   VERIFY_POS_RESERVATION_LIVE=true
 *   VERIFY_DATABASE_NAME=darfus_erp
 *
 * Live mode requires an already bootstrapped local company role, creates
 * isolated T32PC records, cleans only that namespace, and never runs
 * reset/seed/remote checks or changes company configuration.
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
const BOOTSTRAP_SERVICE = "backend/src/services/company-bootstrap.service.js";
const ERROR_MIDDLEWARE = "backend/src/middleware/error.middleware.js";
const ROUTES = "backend/src/routes/erp.routes.js";
const POS_PAGE = "app/[locale]/(dashboard)/pos/page.tsx";
const RES_PAGE = "app/[locale]/(dashboard)/sales/reservations/page.tsx";

function accountRoleContract() {
  const bootstrap = read(BOOTSTRAP_SERVICE);
  const errors = read(ERROR_MIDDLEWARE);
  const routes = read(ROUTES);
  assert.ok(bootstrap.includes("new AppError(`${ar} | ${en}`, 422, code)"), "missing or invalid customer-deposit role is an HTTP 422 blocker");
  assert.ok(bootstrap.includes('CUSTOMER_DEPOSIT_LIABILITY: "CUSTOMER_DEPOSIT_LIABILITY"'), "customer-deposit role has a stable protected identifier");
  assert.ok(bootstrap.includes('where: { companyId, roleCode }'), "role lookup is company-scoped");
  assert.ok(bootstrap.includes('where: { id: accountId, companyId, isActive: true }'), "mapped account must belong to the company and be active");
  assert.ok(bootstrap.includes('account.type !== "liability" || account.nature !== "credit"'), "mapped account must be liability/credit classified");
  assert.ok(bootstrap.includes('"CUSTOMER_DEPOSIT_ROLE_NOT_CONFIGURED"'), "missing role has the current stable blocker code");
  assert.ok(bootstrap.includes('"CUSTOMER_DEPOSIT_ROLE_INVALID"'), "invalid or cross-company role has a stable blocker code");
  assert.ok(bootstrap.includes("reservationAdvancesAccountId") && bootstrap.includes("report.adopted"), "bootstrap adopts a valid existing company setting into the protected role");
  assert.ok(!/CMP-DEMO|findOne\(\{[^}]*companyId[^}]*\}\)/.test(bootstrap.slice(bootstrap.indexOf("async resolveSystemAccountRole"), bootstrap.indexOf("async readConfiguredDepositAccount"))), "role resolution has no demo or first-account fallback");
  assert.ok(routes.includes('router.get("/readiness/operations"') && routes.includes("companyReadiness(req.companyId)"), "readiness is company-scoped");
  assert.ok(errors.includes("res.status(statusCode).json") && errors.includes("code: errorCode") && errors.includes("error: {"), "stable errors use the documented safe response envelope");
}

function backendContract() {
  const service = read(SERVICE);
  const createFn = service.slice(service.indexOf("_createReservationInTransaction"), service.indexOf("async addPayment"));
  assert.ok(service.includes("resolveSystemAccountRole(companyId, SYSTEM_ACCOUNT_ROLES.CUSTOMER_DEPOSIT_LIABILITY"), "reservation deposit liability account is resolved server-side by protected role");
  assert.ok(!service.includes("RESERVATION_ADVANCES_ACCOUNT_NOT_CONFIGURED") && !service.includes("RESERVATION_ADVANCES_ACCOUNT_INVALID"), "retired settings-only error codes are not asserted by the posting service");
  assert.ok(service.includes("RESERVATION_INITIAL_PAYMENT_REQUIRED"), "backend enforces the mandatory initial payment");
  // The mandatory-initial-payment check lives in the public manual creation path,
  // not in the internal renewal successor path.
  assert.ok(createFn.includes("RESERVATION_INITIAL_PAYMENT_REQUIRED"), "manual creation requires an initial payment");
  assert.ok(createFn.indexOf("getReservationAdvancesAccount(companyId, transaction)") < createFn.indexOf("models.Reservation.create"), "missing or invalid role blocks before reservation/deposit/journal writes");
  assert.ok(createFn.includes("models.sequelize.transaction") || service.includes("models.sequelize.transaction"), "reservation creation is transactional with no partial write on blocker");
  assert.ok(!/findOne\([^)]*Account[^)]*\)(?![\s\S]*companyId)/.test(service), "reservation posting has no first-account fallback");
  assert.ok(!/findOne\([^)]*(nameAr|name)[^)]*\)/.test(service.slice(service.indexOf("async getReservationAdvancesAccount"), service.indexOf("function reservationStatusForTotals"))), "reservation role resolution has no localized-name lookup");
  assert.ok(!/CMP-DEMO|ACC-2300|SYS-CUSTOMER-DEPOSIT-LIABILITY/.test(service), "reservation posting has no demo-id or hardcoded deposit-account dependency");
  assert.ok(service.includes("_renewInTransaction") && service.includes("_transferAndActivateSuccessor"), "internal renewal path remains intact");
  const renewFn = service.slice(service.indexOf("_renewInTransaction"), service.indexOf("_transferAndActivateSuccessor"));
  assert.ok(!renewFn.includes("RESERVATION_INITIAL_PAYMENT_REQUIRED"), "internal renewal successor creation is not gated by the manual initial-payment rule");
  // No installment scheduling was introduced into the reservation service.
  assert.ok(!/installmentSchedule|installmentPlan|dueDateSchedule/i.test(service), "no installment schedule added to reservations");
}

function posContract() {
  const pos = read(POS_PAGE);
  assert.ok(pos.includes('method === "deposit"'), "POS branches on the deposit method into reservation mode");
  assert.ok(pos.includes("createReservationFromPos"), "POS has a dedicated reservation creation handler");
  assert.ok(pos.includes('apiClient<{ success: boolean; data: { reservation: any } }>("/reservations"') || /apiClient\([^)]*"\/reservations"/.test(pos), "POS creates the reservation via the dedicated endpoint");
  assert.ok(pos.includes("Create Reservation and Record Initial Payment") || pos.includes("إنشاء الحجز وتسجيل الدفعة الأولى"), "POS reservation confirm label is explicit");
  // The deposit branch must return before the normal invoice/sale posting path.
  const completeFn = pos.slice(pos.indexOf("const completeSale"), pos.indexOf("createReservationFromPos"));
  const depositStart = completeFn.indexOf('if (method === "deposit")');
  const depositBranch = completeFn.slice(depositStart, completeFn.indexOf('if (method === "split")', depositStart));
  assert.ok(depositBranch.includes("setShowReservationDialog(true)") && depositBranch.includes("return;"), "deposit mode opens the reservation dialog and returns before invoice posting");
  assert.ok(!depositBranch.includes("postInvoice("), "deposit mode never calls the normal invoice post");
  // The reservation payload submits asset ids + operational fields only, never trusted financials.
  const resFn = pos.slice(pos.indexOf("const createReservationFromPos"), pos.indexOf("// Keyboard shortcuts"));
  assert.ok(resFn.includes("initialPayment") && resFn.includes("expiresAt") && resFn.includes("assetId: item.id"), "reservation payload carries initial payment, expiry, and asset ids");
  // Scope the trusted-value check to the request body only (response handling may read server values).
  const bodyStart = resFn.indexOf("body: JSON.stringify");
  const requestBody = resFn.slice(bodyStart, resFn.indexOf("});", bodyStart) + 3);
  for (const forbidden of ["tax:", "vatAmount", "vatRate", "journalLines", "cogs", "reservationAdvancesAccountId", "accountId", "liabilityAccountId", "agreedTotal", "paidTotal", "remainingTotal", "total:"]) {
    assert.ok(!requestBody.includes(forbidden), `POS reservation payload does not submit trusted ${forbidden}`);
  }
  assert.ok(requestBody.includes("paymentMethod: resMethod"), "POS retains cash/bank/payment-destination selection without selecting the liability account");
  assert.ok(!resFn.includes("retry:") && pos.includes("disabled={creatingReservation"), "POS reservation mutation has no automatic retry/replay and disables duplicate submit");
}

function reservationPageContract() {
  const page = read(RES_PAGE);
  assert.ok(page.includes("An initial payment greater than zero is required") || page.includes("يجب إدخال دفعة أولى أكبر من صفر"), "reservation page enforces mandatory initial payment");
  assert.ok(page.includes("depositMethod"), "reservation page collects a payment method");
  const requestStart = page.indexOf('apiClient("/reservations"');
  const request = page.slice(requestStart, page.indexOf("});", requestStart) + 3);
  for (const forbidden of ["reservationAdvancesAccountId", "accountId", "liabilityAccountId"]) {
    assert.ok(!request.includes(forbidden), `reservation page does not expose or submit ${forbidden} to a business user`);
  }
  assert.ok(request.includes("paymentMethod: depositMethod"), "reservation page retains payment-destination selection");
  assert.ok(!page.includes("liabilityAccounts"), "reservation deposit flow has no business-user ledger-account selector");
}

function docsAndPackage() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["verify:pos-reservation-deposit-configuration"], "node scripts/verify-pos-reservation-deposit-configuration.js", "package verifier script registered");
  for (const doc of ["docs/AI_HANDOFF.md", "docs/CLIENT_SCOPE_LOCK.md"]) {
    const src = read(doc);
    assert.ok(src.includes("Phase 32.6-Post-C"), `${doc} documents Post-C`);
    assert.ok(/reservation advances/i.test(src) && /initial payment/i.test(src), `${doc} documents account config + initial payment rule`);
  }
}

function scopeGuard() {
  const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/).map((l) => l.trim().replace(/\\/g, "/")).filter(Boolean);
  const forbidden = changed.filter((file) => [
    /^backend\/src\/services\/source-aware-statement\.service\.js$/,
    /^backend\/src\/services\/customer-credit\.service\.js$/,
    /^features\/printing\//,
  ].some((p) => p.test(file)));
  assert.deepEqual(forbidden, [], `Post-C must not touch protected statement/customer-credit/print files (found: ${forbidden.join(", ")})`);
}

function runStatic() {
  accountRoleContract();
  backendContract();
  posContract();
  reservationPageContract();
  docsAndPackage();
  scopeGuard();
}

function assertLocalLiveEnvironment() {
  assert.equal(process.env.VERIFY_POS_RESERVATION_LIVE, "true", "live verification requires VERIFY_POS_RESERVATION_LIVE=true");
  assert.equal(process.env.VERIFY_DATABASE_NAME, "darfus_erp", "live verification requires VERIFY_DATABASE_NAME=darfus_erp");
  assert.ok(["development", "test", "demo"].includes(process.env.NODE_ENV), "live verification requires development/test/demo NODE_ENV");
  assert.ok(["localhost", "127.0.0.1"].includes(process.env.DB_HOST), `live verification requires local DB host, got ${process.env.DB_HOST}`);
  assert.equal(String(process.env.DB_PORT), "5433", "live verification requires DB_PORT=5433");
  assert.equal(process.env.DB_NAME, process.env.VERIFY_DATABASE_NAME, "live verification DB_NAME must match VERIFY_DATABASE_NAME");
  for (const key of ["ALLOW_CLIENT_DEMO_RESET", "RESET_TARGET", "CONFIRM_DATABASE_NAME"]) {
    assert.ok(!process.env[key], `${key} must not be set for the live verifier`);
  }
  const url = `${process.env.DATABASE_URL || ""} ${process.env.RENDER || ""}`.toLowerCase();
  assert.ok(!url.includes("render") && !url.includes("amazonaws") && !url.includes("supabase"), "remote/managed database indicators are rejected");
}

function money(n) { return Number(n).toFixed(4); }
function asNum(v) { return Number(Number(v || 0).toFixed(4)); }

async function runLive() {
  assertLocalLiveEnvironment();
  const models = require(path.resolve(BACKEND, "src/models"));
  const reservationService = require(path.resolve(BACKEND, "src/services/reservation.service"));
  const { QueryTypes } = require(path.resolve(BACKEND, "node_modules/sequelize"));
  models.sequelize.options.logging = false;

  const namespace = `T32PC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const user = { id: `${namespace}-USR`, firstName: "Verifier", lastName: "PosReservation", email: "verifier@example.invalid" };
  const q = (sql, r = {}) => models.sequelize.query(sql, { type: QueryTypes.SELECT, replacements: r });
  const exec = (sql, r = {}) => models.sequelize.query(sql, { replacements: r });
  const count = async (t, w = "true", r = {}) => Number((await q(`select count(*)::int c from ${t} where ${w}`, r))[0].c);
  const counts = async () => ({
    reservations: await count("reservations"),
    reservationItems: await count("reservation_items"),
    reservationPayments: await count("reservation_payments"),
    invoices: await count("invoices"),
    journals: await count("journal_entries"),
    journalLines: await count("journal_lines"),
    assets: await count("assets"),
    cashTransactions: await count("cash_transactions"),
    settings: await count("settings"),
  });

  async function cleanup() {
    const succWhere = "(id like :ns or predecessor_reservation_id like :ns)";
    await exec(`delete from reservation_payment_transfers where source_reservation_id like :ns or target_reservation_id in (select id from reservations where ${succWhere}) or renewal_id in (select id from reservation_renewals where source_reservation_id like :ns)`, { ns: `${namespace}%` });
    await exec("delete from reservation_renewals where source_reservation_id like :ns or successor_reservation_id in (select id from reservations where "+succWhere+")", { ns: `${namespace}%` });
    await exec("delete from reservation_amendment_items where reservation_id like :ns", { ns: `${namespace}%` });
    await exec("delete from reservation_amendments where reservation_id like :ns", { ns: `${namespace}%` });
    await exec("delete from reservation_expiry_extensions where reservation_id like :ns", { ns: `${namespace}%` });
    await exec(`delete from reservation_payment_applications where reservation_id like :ns or reservation_id in (select id from reservations where ${succWhere})`, { ns: `${namespace}%` });
    await exec("delete from reservation_payments where reservation_id like :ns or id like :ns or idempotency_key like :ns", { ns: `${namespace}%` });
    await exec("delete from journal_lines where journal_entry_id in (select id from journal_entries where source_id like :ns or description like :d)", { ns: `${namespace}%`, d: `%${namespace}%` });
    await exec("delete from journal_entries where source_id like :ns or description like :d", { ns: `${namespace}%`, d: `%${namespace}%` });
    await exec("delete from cash_transactions where id like :ns or reference like :ns or description like :d", { ns: `${namespace}%`, d: `%${namespace}%` });
    await exec("delete from asset_events where asset_id like :ns or source_document like :ns or note like :d", { ns: `${namespace}%`, d: `%${namespace}%` });
    await exec("delete from reservation_items where reservation_id like :ns or asset_id like :ns", { ns: `${namespace}%` });
    await exec("delete from reservations where id like :ns or asset_id like :ns", { ns: `${namespace}%` });
    await exec("delete from assets where id like :ns", { ns: `${namespace}%` });
    await exec("delete from idempotency_requests where key like :ns", { ns: `${namespace}%` }).catch(() => {});
  }

  let assetSeq = 0;
  async function createAsset(companyId, branch, price = 100, cost = 55) {
    assetSeq += 1;
    return models.Asset.create({
      id: `${namespace}-AST-${assetSeq}`, companyId, name: `PC Asset ${assetSeq}`, type: "gold-piece", category: "ring",
      karat: 21, purity: 0.875, grossWeight: 10, netWeight: 9, goldWeight: 9, price, cost,
      branch: branch.name, branchId: branch.id, location: "Verifier", status: "available",
      barcode: `${namespace}-BC-${assetSeq}`, source: "verifier"
    });
  }
  let resSeq = 0;
  const nextResId = () => { resSeq += 1; return `${namespace}-RES-${resSeq}`; };
  async function expectReject(label, fn, code) {
    let err = null;
    try { await fn(); } catch (e) { err = e; }
    assert.ok(err, `${label} must reject`);
    if (code) assert.equal(err.errorCode, code, `${label} returns ${code} (got ${err.errorCode})`);
  }

  const before = await counts();
  let company, branch, customer;
  try {
    console.log(`LIVE DB IDENTITY host=${process.env.DB_HOST} port=${process.env.DB_PORT} db=${process.env.DB_NAME} env=${process.env.NODE_ENV}`);
    [company] = await q("select id from companies limit 1");
    assert.ok(company?.id, "company exists");
    [branch] = await q("select id, name from branches where company_id = :c limit 1", { c: company.id });
    [customer] = await q("select id, name from customers where company_id = :c limit 1", { c: company.id });
    assert.ok(branch?.id && customer?.id, "branch and customer exist");

    // Live mode never changes company account mappings. It is available only when
    // local bootstrap has already installed a valid protected role.
    const role = await models.SystemAccountRole.findOne({ where: { companyId: company.id, roleCode: "CUSTOMER_DEPOSIT_LIABILITY" } });
    assert.ok(role, "live verifier requires an already bootstrapped CUSTOMER_DEPOSIT_LIABILITY role");
    const account = await models.Account.findOne({ where: { id: role.accountId, companyId: company.id, type: "liability", nature: "credit", isActive: true } });
    assert.ok(account, "live verifier requires an active company-scoped liability/credit role account");

    // (1-6) Initial payment validation.
    const mk = (over = {}) => ({ id: nextResId(), customerId: customer.id, branchId: branch.id, expiresAt: "2027-12-31T00:00:00.000Z", ...over });
    const a1 = await createAsset(company.id, branch, 100);
    await expectReject("no initial payment", () => reservationService.createReservation({ companyId: company.id, branchId: branch.id, user, idempotencyKey: `${namespace}-NOPAY`, body: mk({ items: [{ assetId: a1.id, agreedPrice: money(100) }] }) }), "RESERVATION_INITIAL_PAYMENT_REQUIRED");
    await expectReject("zero initial payment", () => reservationService.createReservation({ companyId: company.id, branchId: branch.id, user, idempotencyKey: `${namespace}-ZERO`, body: mk({ items: [{ assetId: a1.id, agreedPrice: money(100) }], initialPayment: { amount: money(0), paymentMethod: "cash" } }) }), "RESERVATION_INITIAL_PAYMENT_REQUIRED");
    await expectReject("negative initial payment", () => reservationService.createReservation({ companyId: company.id, branchId: branch.id, user, idempotencyKey: `${namespace}-NEG`, body: mk({ items: [{ assetId: a1.id, agreedPrice: money(100) }], initialPayment: { amount: "-5", paymentMethod: "cash" } }) }));
    await expectReject("over-total initial payment", () => reservationService.createReservation({ companyId: company.id, branchId: branch.id, user, idempotencyKey: `${namespace}-OVER`, body: mk({ items: [{ assetId: a1.id, agreedPrice: money(100) }], initialPayment: { amount: money(150), paymentMethod: "cash" } }) }));
    await expectReject("missing payment method", () => reservationService.createReservation({ companyId: company.id, branchId: branch.id, user, idempotencyKey: `${namespace}-NOMETH`, body: mk({ items: [{ assetId: a1.id, agreedPrice: money(100) }], initialPayment: { amount: money(50) } }) }), "RESERVATION_PAYMENT_METHOD_REQUIRED");

    // (9-22) Valid multi-item reservation with initial payment.
    const b1 = await createAsset(company.id, branch, 100, 40);
    const b2 = await createAsset(company.id, branch, 60, 25);
    const resId = nextResId();
    const created = await reservationService.createReservation({ companyId: company.id, branchId: branch.id, user, idempotencyKey: `${namespace}-OK`, body: mk({ id: resId, items: [{ assetId: b1.id, agreedPrice: money(100) }, { assetId: b2.id, agreedPrice: money(60) }], initialPayment: { amount: money(100), paymentMethod: "cash" } }) });
    assert.equal(created.statusCode, 201, "valid reservation created");
    const [row] = await q("select status, agreed_total, paid_total, remaining_total, final_invoice_id from reservations where id = :id", { id: resId });
    assert.equal(asNum(row.agreed_total), 160, "server-calculated total");
    assert.equal(asNum(row.paid_total), 100, "initial payment recorded");
    assert.equal(asNum(row.remaining_total), 60, "remaining recalculated");
    assert.equal(row.status, "partially_paid", "partial payment → partially_paid");
    assert.equal(row.final_invoice_id, null, "no final invoice created");
    assert.equal(await count("reservation_items", "reservation_id = :id and status = 'active'", { id: resId }), 2, "both assets reserved as items");
    assert.equal((await models.Asset.findByPk(b1.id)).status, "reserved", "asset 1 reserved");
    assert.equal((await models.Asset.findByPk(b2.id)).status, "reserved", "asset 2 reserved");
    assert.equal(await count("reservation_payments", "reservation_id = :id and status = 'posted'", { id: resId }), 1, "one initial payment");
    // Payment journal: Dr Cash/Bank, Cr Reservation Advances only.
    const payJournals = await q("select id from journal_entries where source_type = 'reservation_payment' and id in (select journal_entry_id from reservation_payments where reservation_id = :id)", { id: resId });
    assert.equal(payJournals.length, 1, "one reservation payment journal");
    const lines = await q("select account_code, debit, credit from journal_lines where journal_entry_id = :j", { j: payJournals[0].id });
    const codes = lines.map((l) => l.account_code);
    assert.ok(codes.includes(account.code), "payment credits the configured advances account");
    assert.ok(!codes.includes("4100") && !codes.includes("2200") && !codes.includes("1300") && !codes.includes("5000") && !codes.includes("1200"), "no sales/VAT/AR/COGS/inventory line in reservation payment");
    assert.equal(await count("journal_entries", "source_type = 'invoice' and source_id like :ns", { ns: `${namespace}%` }), 0, "no sales invoice journal");

    // (21) Fully paid when payment == total.
    const c1 = await createAsset(company.id, branch, 80);
    const fpId = nextResId();
    await reservationService.createReservation({ companyId: company.id, branchId: branch.id, user, idempotencyKey: `${namespace}-FP`, body: mk({ id: fpId, items: [{ assetId: c1.id, agreedPrice: money(80) }], initialPayment: { amount: money(80), paymentMethod: "cash" } }) });
    assert.equal((await q("select status from reservations where id = :id", { id: fpId }))[0].status, "fully_paid", "payment == total → fully_paid");

    // (23) Idempotency — same key does not duplicate.
    const d1 = await createAsset(company.id, branch, 50);
    const idemId = nextResId();
    const first = await reservationService.createReservation({ companyId: company.id, branchId: branch.id, user, idempotencyKey: `${namespace}-IDEM`, body: mk({ id: idemId, items: [{ assetId: d1.id, agreedPrice: money(50) }], initialPayment: { amount: money(25), paymentMethod: "cash" } }) });
    const replay = await reservationService.createReservation({ companyId: company.id, branchId: branch.id, user, idempotencyKey: `${namespace}-IDEM`, body: mk({ id: idemId, items: [{ assetId: d1.id, agreedPrice: money(50) }], initialPayment: { amount: money(25), paymentMethod: "cash" } }) });
    assert.equal(replay.statusCode, first.statusCode, "same key replays");
    assert.equal(await count("reservation_payments", "reservation_id = :id", { id: idemId }), 1, "idempotent creation posts one payment");

    // (24) One invalid asset rolls back the whole cart.
    const e1 = await createAsset(company.id, branch, 100);
    const rbId = nextResId();
    await expectReject("invalid asset rolls back", () => reservationService.createReservation({ companyId: company.id, branchId: branch.id, user, idempotencyKey: `${namespace}-RB`, body: mk({ id: rbId, items: [{ assetId: e1.id, agreedPrice: money(100) }, { assetId: `${namespace}-MISSING`, agreedPrice: money(10) }], initialPayment: { amount: money(50), paymentMethod: "cash" } }) }));
    assert.equal(await count("reservations", "id = :id", { id: rbId }), 0, "rolled-back reservation not created");
    assert.equal((await models.Asset.findByPk(e1.id)).status, "available", "asset left available after rollback");

    // (26-27) Later payments unlimited + overpayment rejected.
    await reservationService.addPayment({ companyId: company.id, branchId: branch.id, user, reservationId: resId, idempotencyKey: `${namespace}-LP1`, body: { amount: money(20), paymentMethod: "cash" } });
    await reservationService.addPayment({ companyId: company.id, branchId: branch.id, user, reservationId: resId, idempotencyKey: `${namespace}-LP2`, body: { amount: money(10), paymentMethod: "card" } });
    const [afterLater] = await q("select paid_total, remaining_total from reservations where id = :id", { id: resId });
    assert.equal(asNum(afterLater.paid_total), 130, "later payments accumulate (100+20+10)");
    assert.equal(asNum(afterLater.remaining_total), 30, "remaining recalculated after later payments");
    await expectReject("overpayment beyond remaining", () => reservationService.addPayment({ companyId: company.id, branchId: branch.id, user, reservationId: resId, idempotencyKey: `${namespace}-LP3`, body: { amount: money(1000), paymentMethod: "cash" } }));

    // (25) Internal renewal still works without a manual cash initial payment.
    const rnAsset = await createAsset(company.id, branch, 100);
    const rnId = nextResId();
    await reservationService.createReservation({ companyId: company.id, branchId: branch.id, user, idempotencyKey: `${namespace}-RNSRC`, body: mk({ id: rnId, items: [{ assetId: rnAsset.id, agreedPrice: money(100) }], initialPayment: { amount: money(100), paymentMethod: "cash" }, expiresAt: "2020-01-01T00:00:00.000Z" }) });
    await reservationService.processDueExpirations({ companyId: company.id, idPrefix: `${namespace}%`, limit: 50 });
    const succAsset = await createAsset(company.id, branch, 100);
    const renew = await reservationService.renewReservation({ companyId: company.id, branchId: branch.id, user, reservationId: rnId, idempotencyKey: `${namespace}-RENEW`, body: { successorId: `${namespace}-SUC-1`, successorAssetIds: [succAsset.id], newExpiry: "2027-12-31T00:00:00.000Z", reason: "renew after expiry" } });
    assert.equal(renew.statusCode, 201, "internal renewal succeeds without a manual initial payment");
    const [succ] = await q("select status, paid_total from reservations where id = :id", { id: `${namespace}-SUC-1` });
    assert.equal(succ.status, "fully_paid", "renewal successor funded by transfer");

    await cleanup();
    const after = await counts();
    assert.deepEqual(after, before, `live verifier cleanup preserved counts before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
    console.log("LIVE TESTS EXECUTED");
    console.log("No persistent test pollution detected.");
  } catch (error) {
    try {
      // Company account mappings are deliberately not mutated by this verifier.
    } catch (_) {}
    try { await cleanup(); } catch (e) { console.error(`Cleanup failed for ${namespace}: ${e.message}`); }
    throw error;
  } finally {
    await models.sequelize.close();
  }
}

(async function main() {
  runStatic();
  if (process.env.VERIFY_POS_RESERVATION_LIVE === "true") {
    await runLive();
  } else {
    console.log("STATIC ONLY — LIVE DATA NOT VERIFIED");
  }
  console.log("verify-pos-reservation-deposit-configuration: ok");
})().catch((error) => {
  console.error(`verify-pos-reservation-deposit-configuration: failed: ${error.stack || error.message}`);
  process.exit(1);
});
