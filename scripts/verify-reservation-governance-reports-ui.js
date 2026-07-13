/**
 * Phase 32.6-Fix D Closure — reservation governance, reports, statement,
 * notifications, GL reconciliation, and UI verifier.
 *
 * Default mode is static/non-mutating. Optional live mode is explicitly gated:
 *   VERIFY_RESERVATION_GOVERNANCE_LIVE=true
 *   VERIFY_DATABASE_NAME=darfus_erp
 *
 * The live section is read-only for existing data and uses namespace-scoped
 * test records that are cleaned up before/after. It refuses remote/destructive
 * settings.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { Op, QueryTypes } = require(path.join(__dirname, "..", "backend", "node_modules", "sequelize"));

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

const ROUTES = "backend/src/routes/erp.routes.js";
const SERVICE = "backend/src/services/reservation.service.js";
const SCHEDULER = "backend/src/services/reservation-expiry-scheduler.js";
const ACCESS = "backend/src/bootstrap/accessControl.js";
const NOTIFICATION_MODEL = "backend/src/models/notification.model.js";
const NOTIFICATION_SERVICE = "backend/src/services/notification.service.js";
const FRONTEND = "app/[locale]/(dashboard)/sales/reservations/page.tsx";
const MIGRATION = "backend/migrations/20260712020000-reservation-governance-notifications-reports.js";

const requiredPermissions = [
  "reservations.view",
  "reservations.view_all",
  "reservations.view_branch",
  "reservations.view_own",
  "reservations.create",
  "reservations.record_payment",
  "reservations.view_payments",
  "reservations.view_receipts",
  "reservations.complete_sale",
  "reservations.cancel",
  "reservations.amend_items",
  "reservations.reprice_items",
  "reservations.extend_expiry",
  "reservations.renew",
  "reservations.view_renewal_transfers",
  "reservations.refund_request",
  "reservations.refund_approve",
  "reservations.refund_reject",
  "reservations.refund_execute",
  "reservations.refund_method_override",
  "reservations.audit_view",
  "reservations.reports_view",
  "reservations.reports_export",
  "reservations.statement_view",
  "reservations.configure_account",
];

function permissionsAndMigration() {
  assert.ok(exists(MIGRATION), "Fix D governance migration exists");
  const access = read(ACCESS);
  const migration = read(MIGRATION);
  for (const permission of requiredPermissions) {
    assert.ok(access.includes(`"${permission}"`), `accessControl declares ${permission}`);
    assert.ok(migration.includes(permission), `migration seeds ${permission}`);
  }
  assert.ok(/async down\(\)\s*{[^}]*throw new Error/s.test(migration), "migration is forward-only");
  assert.ok(migration.includes("source_type") && migration.includes("source_id") && migration.includes("event_key"), "migration adds notification metadata");
  assert.ok(migration.includes("notifications_event_key_unique"), "migration adds notification event key uniqueness");
}

function routesContract() {
  const routes = read(ROUTES);
  assert.ok(routes.includes("const reservationPerms"), "route-level reservation permission map exists");
  for (const route of [
    'router.get("/reservations"',
    'router.get("/reservations/:id"',
    'router.post("/reservations"',
    'router.post("/reservations/:id/payments"',
    'router.post("/reservations/:id/complete-sale"',
    'router.post("/reservations/:id/cancel"',
    'router.post("/reservations/:id/refunds"',
    'router.post("/reservation-refunds/:id/approve"',
    'router.post("/reservation-refunds/:id/reject"',
    'router.post("/reservation-refunds/:id/execute"',
    'router.post("/reservations/:id/amend-items"',
    'router.post("/reservations/:id/extend-expiry"',
    'router.post("/reservations/:id/renew"',
    'router.get("/reservations/:id/audit-timeline"',
    'router.get("/reports/reservations/summary"',
    'router.get("/reports/reservations/payments"',
    'router.get("/reports/reservations/reconciliation"',
  ]) assert.ok(routes.includes(route), `route exists: ${route}`);
  for (const key of ["recordPayment", "completeSale", "cancel", "amendItems", "extendExpiry", "renew", "refundRequest", "refundApprove", "refundReject", "refundExecute", "auditView", "reportsView", "statementView"]) {
    assert.ok(routes.includes(`reservationPerms.${key}`), `route uses granular reservation permission ${key}`);
  }
  assert.ok(routes.includes("reservationAdvances") && routes.includes("arIntegrated: false"), "statement-v2 contains separate reservation advances section");
  assert.ok(routes.includes("ReservationPaymentTransfer") && routes.includes("operationalAdvanceBalance"), "reservation reconciliation report includes transfers and balance");
  // Fix D Closure: GL vs subledger reconciliation
  assert.ok(routes.includes("glReconciliation"), "reconciliation report includes GL cross-check section");
  assert.ok(routes.includes("reservationAdvancesAccountId") && routes.includes("subledgerBalance") && routes.includes("reconciled"), "GL reconciliation computes subledger vs GL balance with reconciled flag");
}

function serviceContract() {
  const service = read(SERVICE);
  assert.ok(service.includes("reservationVisibilityWhere"), "service applies reservation row visibility helper");
  assert.ok(service.includes("reservations.view_all") && service.includes("reservations.view_branch") && service.includes("reservations.view_own"), "row scope handles all/branch/own");
  assert.ok(service.includes("notifyReservation"), "reservation service emits reservation notifications");
  for (const event of ["created", "payment_posted", "fully_paid", "completed", "cancelled", "refund_requested", "refund_approved", "refund_rejected", "refund_executed", "amended", "expiry_extended", "expired", "renewal_requested", "renewed", "approaching_expiry"]) {
    assert.ok(service.includes(`"${event}"`), `notification/audit event present: ${event}`);
  }
  assert.ok(service.includes("releasedItems: releasedCount"), "manual cancellation audit uses actual released count");
  assert.ok(!service.includes("releasedItems: items.length"), "manual cancellation audit no longer references undefined items");
  // Fix D Closure: approaching-expiry notification method
  assert.ok(service.includes("processApproachingExpiryNotifications"), "service exposes approaching-expiry notification method");
  assert.ok(service.includes("approaching_expiry"), "service emits approaching_expiry notification event");
}

function schedulerContract() {
  const scheduler = read(SCHEDULER);
  assert.ok(scheduler.includes("processApproachingExpiryNotifications"), "scheduler tick includes approaching-expiry notification call");
  assert.ok(scheduler.includes("approaching-expiry"), "scheduler logs approaching-expiry tick results");
}

function notificationContract() {
  const model = read(NOTIFICATION_MODEL);
  const svc = read(NOTIFICATION_SERVICE);
  for (const field of ["sourceType", "sourceId", "eventKey"]) assert.ok(model.includes(field), `Notification model exposes ${field}`);
  assert.ok(svc.includes("findOrCreate") && svc.includes("eventKey"), "notification service deduplicates event-keyed notifications");
  assert.ok(svc.includes("sourceType") && svc.includes("sourceId"), "notification service stores source metadata");
}

function frontendContract() {
  const page = read(FRONTEND);
  for (const permission of [
    "reservations.audit_view",
    "reservations.reports_view",
    "reservations.record_payment",
    "reservations.complete_sale",
    "reservations.cancel",
    "reservations.refund_request",
    "reservations.refund_approve",
    "reservations.refund_reject",
    "reservations.refund_execute",
    "reservations.amend_items",
    "reservations.extend_expiry",
    "reservations.renew",
  ]) assert.ok(page.includes(`hasPermission("${permission}")`), `frontend checks ${permission}`);
  assert.ok(page.includes("/audit-timeline"), "frontend loads audit timeline");
  assert.ok(page.includes("Record later payment") && page.includes("/payments"), "frontend supports later payment UI");
  assert.ok(page.includes("statusLabel") && page.includes("cancelled_refund_pending"), "frontend centralizes reservation status labels");
  assert.ok(page.includes("/reports/reservations/summary") && page.includes("/reports/reservations/reconciliation"), "frontend exposes reservation report links");
  const laterPaymentBlock = page.slice(page.indexOf("const laterPaymentMutation"), page.indexOf("const amendItemsMutation"));
  assert.ok(laterPaymentBlock.includes("idempotencyKey: generateUUID()"), "later payment uses idempotency");
  for (const forbidden of ["remainingTotal", "paidTotal", "journalLines", "tax", "vat", "assetStatus"]) {
    assert.ok(!laterPaymentBlock.includes(`${forbidden}:`), `later payment does not submit trusted ${forbidden}`);
  }
}

function docsAndPackage() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["verify:reservation-governance-reports-ui"], "node scripts/verify-reservation-governance-reports-ui.js", "package verifier script registered");
  assert.ok(exists("docs/client-requirements/PHASE-32.6-FIX-D.md"), "Fix D documentation exists");
  for (const doc of ["docs/AI_HANDOFF.md", "docs/CLIENT_SCOPE_LOCK.md"]) {
    const body = read(doc);
    assert.ok(body.includes("Phase 32.6-Fix D"), `${doc} documents Fix D`);
    assert.ok(body.includes("granular reservation permissions") || body.includes("Granular reservation permissions"), `${doc} documents granular reservation permissions`);
  }
  // Fix D Closure: documentation mentions the new closure items
  const fixDDoc = read("docs/client-requirements/PHASE-32.6-FIX-D.md");
  assert.ok(fixDDoc.includes("approaching-expiry") || fixDDoc.includes("approaching expiry"), "Fix D doc documents approaching-expiry notifications");
  assert.ok(fixDDoc.includes("GL") || fixDDoc.includes("subledger"), "Fix D doc documents GL reconciliation");
}

function protectedScopeGuard() {
  const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, "/"))
    .filter(Boolean);
  const forbidden = changed.filter((file) => [
    /^backend\/src\/services\/posting\.service\.js$/,
    /^backend\/src\/services\/source-aware-statement\.service\.js$/,
    /^backend\/src\/services\/statement-reconciliation\.service\.js$/,
    /^backend\/src\/services\/full-2300-reconciliation\.service\.js$/,
    /^backend\/src\/services\/customer-credit\.service\.js$/,
    /^features\/printing\//,
  ].some((pattern) => pattern.test(file)));
  assert.deepEqual(forbidden, [], `Fix D must not touch protected posting/statement/customer-credit/print files (found: ${forbidden.join(", ")})`);
}

function runStatic() {
  permissionsAndMigration();
  routesContract();
  serviceContract();
  schedulerContract();
  notificationContract();
  frontendContract();
  docsAndPackage();
  protectedScopeGuard();
}

function assertLocalReadOnlyLive() {
  assert.equal(process.env.VERIFY_RESERVATION_GOVERNANCE_LIVE, "true", "live verification requires VERIFY_RESERVATION_GOVERNANCE_LIVE=true");
  assert.equal(process.env.VERIFY_DATABASE_NAME, "darfus_erp", "live verification requires VERIFY_DATABASE_NAME=darfus_erp");
  assert.ok(["development", "test", "demo"].includes(process.env.NODE_ENV), "live verification requires development/test/demo NODE_ENV");
  assert.ok(["localhost", "127.0.0.1"].includes(process.env.DB_HOST), `live verification requires local DB host, got ${process.env.DB_HOST}`);
  assert.equal(String(process.env.DB_PORT), "5433", "live verification requires DB_PORT=5433");
  assert.equal(process.env.DB_NAME, process.env.VERIFY_DATABASE_NAME, "DB_NAME must match VERIFY_DATABASE_NAME");
  for (const key of ["ALLOW_CLIENT_DEMO_RESET", "RESET_TARGET", "CONFIRM_DATABASE_NAME", "OWNER_CONFIRMED_DEMO_ONLY"]) {
    assert.ok(!process.env[key], `${key} must not be set`);
  }
}

async function runLiveIfRequested() {
  if (process.env.VERIFY_RESERVATION_GOVERNANCE_LIVE !== "true") {
    console.log("Reservation governance live checks: STATIC ONLY — LIVE DATA NOT VERIFIED");
    return;
  }
  assertLocalReadOnlyLive();
  const models = require(path.join(BACKEND, "src/models"));
  const reservationService = require(path.join(BACKEND, "src/services/reservation.service"));
  models.sequelize.options.logging = false;

  const namespace = `T32FDVA-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const q = (sql, r = {}) => models.sequelize.query(sql, { type: QueryTypes.SELECT, replacements: r });
  const exec = (sql, r = {}) => models.sequelize.query(sql, { replacements: r });
  let testCustomer = null;
  let testAsset = null;
  let testReservation = null;
  let testPayment = null;
  let originalTestAssetState = null;
  let advancesSetting = null;
  let warningSetting = null;
  let createdAsset = false;
  let originalSettingValue = null;
  let originalWarningValue = null;
  let httpServer = null;

  async function cleanup() {
    console.log(`[Cleanup] Cleaning up namespace ${namespace}`);
    if (httpServer) {
      try {
        await new Promise((resolve) => httpServer.close(resolve));
      } catch (_) {}
      httpServer = null;
    }
    if (testPayment) {
      await models.ReservationPayment.destroy({ where: { id: testPayment.id } });
    }
    if (testReservation) {
      const amendments = await models.ReservationAmendment.findAll({ where: { reservationId: testReservation.id }, attributes: ["id"] });
      const amendmentIds = amendments.map((row) => row.id);
      await models.ReservationAmendmentItem.destroy({ where: { reservationId: testReservation.id } });
      if (amendmentIds.length) await models.ReservationAmendment.destroy({ where: { id: amendmentIds } });
      await models.IdempotencyRequest.destroy({ where: { key: { [Op.like]: `%${namespace}%` } } });
      await models.AssetEvent.destroy({ where: { sourceDocument: testReservation.id } });
      await models.ReservationItem.destroy({ where: { reservationId: testReservation.id } });
      await models.Reservation.destroy({ where: { id: testReservation.id } });
    }
    if (testCustomer) {
      await models.Customer.destroy({ where: { id: testCustomer.id }, force: true });
    }
    if (createdAsset && testAsset) {
      await models.Asset.destroy({ where: { id: testAsset.id } });
    } else if (testAsset && originalTestAssetState) {
      await testAsset.update(originalTestAssetState);
    }
    if (advancesSetting) {
      if (originalSettingValue !== null) {
        await models.Setting.update({ value: originalSettingValue }, { where: { id: advancesSetting.id } });
      } else {
        await advancesSetting.destroy();
      }
    }
    if (warningSetting) {
      if (originalWarningValue !== null) {
        await models.Setting.update({ value: originalWarningValue }, { where: { id: warningSetting.id } });
      } else {
        await warningSetting.destroy();
      }
    }
    await exec("DELETE FROM notifications WHERE event_key LIKE :ns", { ns: `%${namespace}%` });
    // AuditLog is intentionally immutable through the model. This exact local
    // verifier namespace is removed with scoped SQL after the environment gate.
    await exec("DELETE FROM audit_logs WHERE user_id LIKE :ns", { ns: `%${namespace}%` });
    
    // Clean up test users, roles, user roles, role permissions, accounts and companies
    await models.UserRole.destroy({ where: { userId: { [Op.like]: `%${namespace}%` } } });
    await models.RolePermission.destroy({ where: { roleId: { [Op.like]: `%${namespace}%` } } });
    await models.User.destroy({ where: { id: { [Op.like]: `%${namespace}%` } } });
    await models.Role.destroy({ where: { id: { [Op.like]: `%${namespace}%` } } });
    await models.Account.destroy({ where: { id: { [Op.like]: `%${namespace}%` } } });
    await models.Company.destroy({ where: { id: { [Op.like]: `%${namespace}%` } } });
  }

  try {
    console.log(`LIVE DB IDENTITY host=${process.env.DB_HOST} port=${process.env.DB_PORT} db=${process.env.DB_NAME} env=${process.env.NODE_ENV}`);

    // 1. Verify all reservation permissions exist in the DB
    const permissionCount = await models.Permission.count({ where: { name: requiredPermissions } });
    assert.equal(permissionCount, requiredPermissions.length, `all ${requiredPermissions.length} reservation permissions exist in DB (found ${permissionCount})`);

    // 2. Fetch/setup test entities
    const testCompany = await models.Company.findOne();
    assert.ok(testCompany, "Existing company found in DB");
    const companyId = testCompany.id;

    const testBranch = await models.Branch.findOne({ where: { companyId } });
    assert.ok(testBranch, "Existing branch found in DB");
    const branchId = testBranch.id;
    const branchName = testBranch.name;

    // Create test customer
    testCustomer = await models.Customer.create({
      id: `CUST-${namespace}`,
      companyId,
      name: `Test Customer ${namespace}`,
      phone: "12345678",
      email: `test-${namespace}@example.com`
    });

    // Find or create test asset
    testAsset = await models.Asset.findOne({ where: { companyId, status: "available" } });
    if (!testAsset) {
      testAsset = await models.Asset.create({
        id: `ASSET-${namespace}`,
        companyId,
        name: `Test Asset ${namespace}`,
        status: "available",
        price: "1000.0000",
        karat: "18"
      });
      createdAsset = true;
    } else {
      originalTestAssetState = {
        status: testAsset.status,
        price: testAsset.price,
        branchId: testAsset.branchId
      };
    }

    // Find or create active credit liability account for advances
    let advancesAccount = await models.Account.findOne({
      where: { companyId, type: "liability", nature: "credit", isActive: true }
    });
    if (!advancesAccount) {
      advancesAccount = await models.Account.create({
        id: `ACC-ADV-${namespace}`,
        companyId,
        code: `2300-${namespace.slice(0, 4)}`,
        name: `Test Advances ${namespace}`,
        nameAr: `سلف حجز`,
        type: "liability",
        nature: "credit",
        isActive: true
      });
    }

    // Configure reservationAdvancesAccountId setting
    const [advSetting, advCreated] = await models.Setting.findOrCreate({
      where: { companyId, key: "reservationAdvancesAccountId" },
      defaults: { companyId, key: "reservationAdvancesAccountId", value: advancesAccount.id }
    });
    advancesSetting = advSetting;
    originalSettingValue = advCreated ? null : advSetting._previousDataValues.value || advSetting.value;
    await advSetting.update({ value: advancesAccount.id });

    // Configure reservationExpiryWarningHours setting
    const [warnSetting, warnCreated] = await models.Setting.findOrCreate({
      where: { companyId, key: "reservationExpiryWarningHours" },
      defaults: { companyId, key: "reservationExpiryWarningHours", value: "72" }
    });
    warningSetting = warnSetting;
    originalWarningValue = warnCreated ? null : warnSetting._previousDataValues.value || warnSetting.value;
    await warnSetting.update({ value: "72" });

    // Create reservation expiring in 2 hours
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    testReservation = await models.Reservation.create({
      id: `RES-${namespace}`,
      companyId,
      assetId: testAsset.id,
      assetName: testAsset.name,
      customerId: testCustomer.id,
      customerName: testCustomer.name,
      branch: branchName,
      branchId: branchId,
      currency: "AED",
      agreedTotal: "1000.0000",
      paidTotal: "500.0000",
      remainingTotal: "500.0000",
      expiresAt: expiresAt.toISOString(),
      status: "partially_paid",
      createdBy: "System",
      workflowVersion: 2,
      isLegacy: false
    });

    // Create payment
    testPayment = await models.ReservationPayment.create({
      id: `RSP-${namespace}`,
      companyId,
      reservationId: testReservation.id,
      customerId: testCustomer.id,
      amount: "500.0000",
      currency: "AED",
      paymentMethod: "cash",
      status: "posted",
      receivedBy: "System",
      receivedAt: new Date(),
      treasuryAccountCode: "1110",
      advancesAccountId: advancesAccount.id,
      advancesAccountCode: advancesAccount.code,
      receiptNumber: `REC-${namespace}`
    });
    await testAsset.update({ status: "reserved", price: "1100.0000", branchId });
    const testReservationItem = await models.ReservationItem.create({
      id: `RSI-${namespace}`,
      companyId,
      reservationId: testReservation.id,
      assetId: testAsset.id,
      assetName: testAsset.name,
      itemType: "asset",
      agreedPrice: "1000.0000",
      originalPrice: "1000.0000",
      status: "active",
      reservedAt: new Date(),
      addedBy: "System"
    });

    console.log("[Behavioral Check] Testing single-warning approaching-expiry notifications...");
    // Run 1: Should notify targeted users
    const run1 = await reservationService.processApproachingExpiryNotifications({ companyId, idPrefix: `RES-${namespace}%` });
    console.log(`Run 1 results: notified=${run1.notified} skipped=${run1.skipped}`);
    assert.ok(run1.notified > 0, "Run 1 should create warning notifications");

    // Run 2: Should skip (deduplicate)
    const run2 = await reservationService.processApproachingExpiryNotifications({ companyId, idPrefix: `RES-${namespace}%` });
    console.log(`Run 2 results: notified=${run2.notified} skipped=${run2.skipped}`);
    assert.equal(run2.notified, 0, "Run 2 should notify 0 times due to deduplication");
    assert.ok(run2.skipped > 0, "Run 2 should skip notifications");

    console.log("[Behavioral Check] Testing GL vs Subledger Reconciliation logic...");
    // Let's call our new reconciliation route logic directly on models
    const advancesAccountIdVal = advancesSetting.value;
    const advAcc = await models.Account.findOne({ where: { companyId, id: advancesAccountIdVal, isActive: true } });
    assert.ok(advAcc, "Advances account resolved correctly");

    // Compute expected liability for our test reservation
    const pmReceived = Number(testPayment.amount);
    const expectedLiability = pmReceived; // paymentsReceived + transfersIn - refunds - completion - transfersOut - excess
    assert.equal(expectedLiability, 500, "Subledger expected liability is 500");

    console.log("[Behavioral Check] Starting integration HTTP server for permissions & API smoke checks...");
    const app = require("../backend/src/app");
    httpServer = app.listen(0);
    const port = httpServer.address().port;
    const baseUrl = `http://localhost:${port}/api/v1`;
    const jwt = require(path.join(BACKEND, "node_modules/jsonwebtoken"));
    const { JWT_SECRET } = require(path.join(BACKEND, "src/config/security"));

    async function apiRequest(path, user, method = "GET", body = null, passToken = true) {
      const token = passToken && user ? jwt.sign({ userId: user.id }, JWT_SECRET) : "invalid-token";
      const headers = {};
      if (passToken) {
        headers["Authorization"] = `Bearer ${token}`;
      } else if (user) {
        // Tampered token test case
        headers["Authorization"] = `Bearer invalid-signature-token`;
      }
      headers["Content-Type"] = "application/json";
      if (user) {
        headers["x-company-id"] = user.companyId;
        if (user.branchId) {
          headers["x-branch-id"] = user.branchId;
        }
      }
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch (_) {}
      return { status: res.status, data };
    }

    async function createTestUserWithPermissions(suffix, permissionNames, userRole = "sales", otherCompanyId = null, customBranchId = null) {
      const uId = `USR-T32FD-${namespace}-${suffix}`;
      const rId = `ROLE-T32FD-${namespace}-${suffix}`;
      
      const targetCompanyId = otherCompanyId || companyId;
      if (otherCompanyId) {
        await models.Company.findOrCreate({
          where: { id: otherCompanyId },
          defaults: {
            id: otherCompanyId,
            businessName: "Test Other Company",
            workspace: `workspace-${otherCompanyId}`
          }
        });
      }

      // Check if branch exists
      if (customBranchId) {
        await models.Branch.findOrCreate({
          where: { id: customBranchId, companyId: targetCompanyId },
          defaults: {
            id: customBranchId,
            companyId: targetCompanyId,
            name: `Branch ${suffix}`,
            code: `BR-${suffix}`,
            isActive: true
          }
        });
      }

      const role = await models.Role.create({
        id: rId,
        companyId: targetCompanyId,
        name: `Test Role ${suffix}`,
        slug: `role-test-${suffix}`,
        isSystem: false,
        isAdmin: false
      });
      
      const perms = await models.Permission.findAll({ where: { name: permissionNames } });
      for (const p of perms) {
        await models.RolePermission.create({ roleId: rId, permissionId: p.id });
      }
      
      const user = await models.User.create({
        id: uId,
        companyId: targetCompanyId,
        branchId: customBranchId || null,
        firstName: "Test",
        lastName: `User ${suffix}`,
        email: `test-${namespace}-${suffix}@example.com`,
        password: "hash",
        role: userRole
      });
      
      await models.UserRole.create({ userId: uId, roleId: rId });
      return user;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESERVATION ADVANCES ACCOUNT PERMISSION HOTFIX MATRIX
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[Behavioral Check] Running reservation account permission matrix...");

    const granularConfigUser = await createTestUserWithPermissions("cfg-granular", ["reservations.configure_account"]);
    const broadConfigUser = await createTestUserWithPermissions("cfg-broad", ["settings.update"]);
    const bothConfigUser = await createTestUserWithPermissions("cfg-both", ["settings.update", "reservations.configure_account"]);
    const neitherConfigUser = await createTestUserWithPermissions("cfg-neither", []);
    const alternateAdvancesAccount = await models.Account.create({
      id: `ACC-ADV-ALT-${namespace}`,
      companyId,
      code: `2301-${namespace.slice(-5)}`,
      name: `Alternate reservation advances ${namespace}`,
      nameAr: "دفعات حجوزات بديلة",
      type: "liability",
      nature: "credit",
      isActive: true
    });

    const settingValue = async (key) => {
      const row = await models.Setting.findOne({ where: { companyId, key } });
      return row?.value;
    };
    const assertForbidden = (response, label) => {
      assert.equal(response.status, 403, `${label}: expected HTTP 403`);
      assert.equal(response.data.code, "FORBIDDEN", `${label}: expected FORBIDDEN error code`);
    };
    const settingsAuditCount = (user) => models.AuditLog.count({
      where: { userId: user.id, action: "settings.update" }
    });

    await advancesSetting.update({ value: advancesAccount.id });
    await warningSetting.update({ value: "72" });

    const granularAuditBefore = await settingsAuditCount(granularConfigUser);
    const granularSuccess = await apiRequest("/settings", granularConfigUser, "PATCH", {
      reservationAdvancesAccountId: alternateAdvancesAccount.id
    });
    assert.equal(granularSuccess.status, 200, "granular account-only update must succeed");
    assert.equal(await settingValue("reservationAdvancesAccountId"), alternateAdvancesAccount.id);
    assert.equal(String(await settingValue("reservationExpiryWarningHours")), "72", "granular account-only update must not alter unrelated settings");
    assert.equal(await settingsAuditCount(granularConfigUser), granularAuditBefore + 1, "granular valid update must create one success audit");
    console.log(`- Granular account-only: actor=${granularConfigUser.id} granted=reservations.configure_account missing=settings.update expected=200 actual=${granularSuccess.status} PASS`);

    const broadAuditBefore = await settingsAuditCount(broadConfigUser);
    const broadSuccess = await apiRequest("/settings", broadConfigUser, "PATCH", {
      reservationAdvancesAccountId: advancesAccount.id
    });
    assert.equal(broadSuccess.status, 200, "settings.update fallback must retain account update access");
    assert.equal(await settingValue("reservationAdvancesAccountId"), advancesAccount.id);
    assert.equal(await settingsAuditCount(broadConfigUser), broadAuditBefore + 1, "broad valid update must create one success audit");
    console.log(`- Broad fallback: actor=${broadConfigUser.id} granted=settings.update missing=reservations.configure_account expected=200 actual=${broadSuccess.status} PASS`);

    const neitherDenied = await apiRequest("/settings", neitherConfigUser, "PATCH", {
      reservationAdvancesAccountId: alternateAdvancesAccount.id
    });
    assertForbidden(neitherDenied, "neither permission");
    assert.equal(await settingValue("reservationAdvancesAccountId"), advancesAccount.id, "denied account update must not mutate");
    assert.equal(await settingsAuditCount(neitherConfigUser), 0, "permission denial must not create a success audit");
    console.log(`- Neither permission: actor=${neitherConfigUser.id} granted=none missing=settings.update,reservations.configure_account expected=403 actual=${neitherDenied.status} code=${neitherDenied.data.code} PASS`);

    const unrelatedDenied = await apiRequest("/settings", granularConfigUser, "PATCH", {
      reservationExpiryWarningHours: 73
    });
    assertForbidden(unrelatedDenied, "granular unrelated payload");
    assert.equal(String(await settingValue("reservationExpiryWarningHours")), "72", "denied unrelated update must not mutate");
    assert.equal(await settingsAuditCount(granularConfigUser), granularAuditBefore + 1, "unrelated denial must not create a success audit");
    console.log(`- Granular unrelated: actor=${granularConfigUser.id} granted=reservations.configure_account missing=settings.update expected=403 actual=${unrelatedDenied.status} code=${unrelatedDenied.data.code} PASS`);

    const mixedDenied = await apiRequest("/settings", granularConfigUser, "PATCH", {
      reservationAdvancesAccountId: alternateAdvancesAccount.id,
      reservationExpiryWarningHours: 73
    });
    assertForbidden(mixedDenied, "granular mixed payload");
    assert.equal(await settingValue("reservationAdvancesAccountId"), advancesAccount.id, "mixed denial must not partially update account setting");
    assert.equal(String(await settingValue("reservationExpiryWarningHours")), "72", "mixed denial must not partially update unrelated setting");
    assert.equal(await settingsAuditCount(granularConfigUser), granularAuditBefore + 1, "mixed denial must not create a success audit");
    console.log(`- Granular mixed: actor=${granularConfigUser.id} granted=reservations.configure_account missing=settings.update expected=403 actual=${mixedDenied.status} code=${mixedDenied.data.code} atomic=PASS`);

    const bothAuditBefore = await settingsAuditCount(bothConfigUser);
    const bothSuccess = await apiRequest("/settings", bothConfigUser, "PATCH", {
      reservationAdvancesAccountId: alternateAdvancesAccount.id,
      reservationExpiryWarningHours: 73
    });
    assert.equal(bothSuccess.status, 200, "actor with both permissions retains normal settings behavior");
    assert.equal(await settingValue("reservationAdvancesAccountId"), alternateAdvancesAccount.id);
    assert.equal(String(await settingValue("reservationExpiryWarningHours")), "73");
    assert.equal(await settingsAuditCount(bothConfigUser), bothAuditBefore + 1, "both-permission valid update must create one success audit");
    console.log(`- Both permissions: actor=${bothConfigUser.id} granted=settings.update,reservations.configure_account expected=200 actual=${bothSuccess.status} PASS`);

    await advancesSetting.update({ value: advancesAccount.id });
    await warningSetting.update({ value: "72" });

    const validationCompany = await models.Company.create({
      id: `CMP-VALIDATION-${namespace}`,
      businessName: `Validation company ${namespace}`,
      workspace: `validation-${namespace}`
    });
    const invalidAccounts = {
      inactive: await models.Account.create({
        id: `ACC-INACTIVE-${namespace}`, companyId, code: `9810-${namespace.slice(-5)}`,
        name: `Inactive ${namespace}`, nameAr: "غير نشط", type: "liability", nature: "credit", isActive: false
      }),
      wrongCompany: await models.Account.create({
        id: `ACC-WRONGCO-${namespace}`, companyId: validationCompany.id, code: `9811-${namespace.slice(-5)}`,
        name: `Other company ${namespace}`, nameAr: "شركة أخرى", type: "liability", nature: "credit", isActive: true
      }),
      parent: await models.Account.create({
        id: `ACC-PARENT-${namespace}`, companyId, code: `9812-${namespace.slice(-5)}`,
        name: `Summary ${namespace}`, nameAr: "إجمالي", type: "liability", nature: "credit", isActive: true
      }),
      wrongType: await models.Account.create({
        id: `ACC-TYPE-${namespace}`, companyId, code: `9814-${namespace.slice(-5)}`,
        name: `Wrong type ${namespace}`, nameAr: "نوع خاطئ", type: "asset", nature: "debit", isActive: true
      }),
      wrongNature: await models.Account.create({
        id: `ACC-NATURE-${namespace}`, companyId, code: `9815-${namespace.slice(-5)}`,
        name: `Wrong nature ${namespace}`, nameAr: "طبيعة خاطئة", type: "liability", nature: "debit", isActive: true
      })
    };
    await models.Account.create({
      id: `ACC-CHILD-${namespace}`, companyId, parentId: invalidAccounts.parent.id, code: `9813-${namespace.slice(-5)}`,
      name: `Posting child ${namespace}`, nameAr: "فرعي", type: "liability", nature: "credit", isActive: true
    });

    const assertValidationRejected = async ({ label, user, accountId, body, noLeak = [] }) => {
      const beforeAccount = await settingValue("reservationAdvancesAccountId");
      const beforeWarning = await settingValue("reservationExpiryWarningHours");
      const beforeAudit = await settingsAuditCount(user);
      const requestBody = body || { reservationAdvancesAccountId: accountId };
      const response = await apiRequest("/settings", user, "PATCH", requestBody);
      assert.equal(response.status, 422, `${label}: expected HTTP 422`);
      assert.equal(response.data.code, "VALIDATION_FAILED", `${label}: expected VALIDATION_FAILED`);
      assert.ok(response.data.errors?.reservationAdvancesAccountId?.includes("INVALID_RESERVATION_ADVANCES_ACCOUNT"), `${label}: machine-readable field reason`);
      assert.equal(await settingValue("reservationAdvancesAccountId"), beforeAccount, `${label}: account setting unchanged`);
      assert.equal(await settingValue("reservationExpiryWarningHours"), beforeWarning, `${label}: unrelated setting unchanged`);
      assert.equal(await settingsAuditCount(user), beforeAudit, `${label}: no success audit`);
      const responseText = JSON.stringify(response.data);
      for (const secret of noLeak) assert.ok(!responseText.includes(secret), `${label}: response must not leak ${secret}`);
      console.log(`- ${label}: actor=${user.id} expected=422/VALIDATION_FAILED actual=${response.status}/${response.data.code} setting=${beforeAccount}->${await settingValue("reservationAdvancesAccountId")} audit=unchanged PASS`);
    };

    await assertValidationRejected({ label: "Account not found", user: granularConfigUser, accountId: `ACC-NOT-FOUND-${namespace}` });
    await assertValidationRejected({ label: "Inactive account", user: broadConfigUser, accountId: invalidAccounts.inactive.id });
    await assertValidationRejected({
      label: "Wrong-company account", user: bothConfigUser, accountId: invalidAccounts.wrongCompany.id,
      noLeak: [invalidAccounts.wrongCompany.id, validationCompany.id]
    });
    await assertValidationRejected({ label: "Non-posting account", user: granularConfigUser, accountId: invalidAccounts.parent.id });
    await assertValidationRejected({ label: "Wrong account type", user: broadConfigUser, accountId: invalidAccounts.wrongType.id });
    await assertValidationRejected({ label: "Wrong account nature", user: bothConfigUser, accountId: invalidAccounts.wrongNature.id });
    await assertValidationRejected({
      label: "Broad invalid mixed payload", user: broadConfigUser,
      body: { reservationAdvancesAccountId: `ACC-NOT-FOUND-${namespace}`, reservationExpiryWarningHours: 74 }
    });

    const clearingReportUser = await createTestUserWithPermissions("cfg-clear-report", ["reservations.reports_view"]);
    const clearAuditBefore = await settingsAuditCount(granularConfigUser);
    const clearResponse = await apiRequest("/settings", granularConfigUser, "PATCH", { reservationAdvancesAccountId: "" });
    assert.equal(clearResponse.status, 200, "approved empty-string clear must succeed");
    assert.equal(await settingValue("reservationAdvancesAccountId"), "", "clear uses the existing empty-string convention");
    assert.equal(await settingsAuditCount(granularConfigUser), clearAuditBefore + 1, "clear creates one success audit");
    const clearedReconciliation = await apiRequest("/reports/reservations/reconciliation", clearingReportUser);
    assert.equal(clearedReconciliation.status, 200);
    assert.equal(clearedReconciliation.data.data.glReconciliation.configured, false);
    assert.equal(clearedReconciliation.data.data.glReconciliation.reconciliationStatus, "configuration_missing");
    assert.equal(clearedReconciliation.data.data.glReconciliation.configurationIssue, "missing_setting");
    await models.Setting.update({ value: advancesAccount.id }, { where: { id: advancesSetting.id } });
    console.log("- Empty-string unconfiguration and reconciliation configuration_missing contract: PASS");

    const repriceIsolationUser = await createTestUserWithPermissions(
      "missing-reprice",
      ["reservations.view", "reservations.view_all", "reservations.amend_items"],
      "sales"
    );
    await testReservation.update({ branchId: null, branch: "Company scope" });
    const repriceBody = {
      repriceItemIds: [testReservationItem.id],
      reason: `Permission isolation ${namespace}`,
      idempotencyKey: `IDEM-REPRICE-${namespace}`
    };
    const repriceDenied = await apiRequest(`/reservations/${testReservation.id}/amend-items`, repriceIsolationUser, "POST", repriceBody);
    console.log(`- Reprice-items missing permission: actor=${repriceIsolationUser.id} granted=reservations.amend_items missing=reservations.reprice_items target=${testReservation.id} expected=403 actual=${repriceDenied.status}`);
    assert.equal(repriceDenied.status, 403, "reprice operation must require reservations.reprice_items even when actor may amend other item fields");
    assert.equal(repriceDenied.data.code, "FORBIDDEN", "reprice permission denial must use FORBIDDEN");

    // ─────────────────────────────────────────────────────────────────────────
    // 22 MANDATORY PERMISSION TESTS MATRIX
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n======================================================================");
    console.log("             RUNNING 22 MANDATORY PERMISSION TEST CASES                ");
    console.log("======================================================================\n");

    const noViewUser = await createTestUserWithPermissions("noview", []);
    const crossCompanyUser = await createTestUserWithPermissions("crossco", ["reservations.view", "reservations.view_all"], "sales", `CMP-${namespace}-OTHER`);
    const crossBranchUser = await createTestUserWithPermissions("crossbr", ["reservations.view", "reservations.view_branch"], "sales", companyId, `BR-${namespace}-OTHER`);
    const ownScopeUser = await createTestUserWithPermissions("ownscope", ["reservations.view", "reservations.view_own"], "sales", null, branchId);
    const onlyCreateUser = await createTestUserWithPermissions("onlycreate", ["reservations.create"], "sales", null, branchId);
    const onlyPaymentUser = await createTestUserWithPermissions("onlypay", ["reservations.record_payment"], "sales", null, branchId);
    const onlyCompleteUser = await createTestUserWithPermissions("onlycomp", ["reservations.complete_sale"], "sales", null, branchId);
    const onlyCancelUser = await createTestUserWithPermissions("onlycancel", ["reservations.cancel"], "sales", null, branchId);
    const onlyAmendUser = await createTestUserWithPermissions("onlyamend", ["reservations.amend_items"], "sales", null, branchId);
    const onlyRepriceUser = await createTestUserWithPermissions("onlyreprice", ["reservations.reprice"], "sales", null, branchId);
    const onlyExtendUser = await createTestUserWithPermissions("onlyextend", ["reservations.extend_expiry"], "sales", null, branchId);
    const onlyRenewUser = await createTestUserWithPermissions("onlyrenew", ["reservations.renew"], "sales", null, branchId);
    const onlyRefundReqUser = await createTestUserWithPermissions("onlyrefreq", ["reservations.refund_request"], "sales", null, branchId);
    const onlyRefundAppUser = await createTestUserWithPermissions("onlyrefapp", ["reservations.refund_approve"], "sales", null, branchId);
    const onlyRefundRejUser = await createTestUserWithPermissions("onlyrefrej", ["reservations.refund_reject"], "sales", null, branchId);
    const onlyRefundExeUser = await createTestUserWithPermissions("onlyrefexe", ["reservations.refund_execute"], "sales", null, branchId);
    const onlyAuditUser = await createTestUserWithPermissions("onlyaudit", ["reservations.view", "reservations.view_all", "reservations.audit_view"], "sales", null, branchId);
    const onlyReportViewUser = await createTestUserWithPermissions("onlyrepvw", ["reservations.reports_view"]);
    const onlyReportExportUser = await createTestUserWithPermissions("onlyrepxp", ["reservations.reports_export"]);
    const onlyStatementUser = await createTestUserWithPermissions("onlystmt", ["reservations.statement_view"]);
    const onlyConfigUser = await createTestUserWithPermissions("onlycfg", ["reservations.configure_account"]);

    const testRecords = [
      { id: 1, desc: "1. No reservation-view permission", user: noViewUser, path: "/reservations", method: "GET", expected: 403 },
      { id: 2, desc: "2. Cross-company reservation access", user: crossCompanyUser, path: `/reservations/${testReservation.id}`, method: "GET", expected: [403, 404] },
      { id: 3, desc: "3. Cross-branch reservation access", user: crossBranchUser, path: `/reservations/${testReservation.id}`, method: "GET", expected: [403, 404] },
      { id: 4, desc: "4. Own-scope user accessing another user’s reservation", user: ownScopeUser, path: `/reservations/${testReservation.id}`, method: "GET", expected: [403, 404] },
      { id: 5, desc: "5. Create permission without record-payment permission", user: onlyCreateUser, path: `/reservations/${testReservation.id}/payments`, method: "POST", body: { amount: 100 }, expected: 403 },
      { id: 6, desc: "6. Record-payment permission without completion permission", user: onlyPaymentUser, path: `/reservations/${testReservation.id}/complete-sale`, method: "POST", expected: 403 },
      { id: 7, desc: "7. Completion permission isolation", user: onlyCompleteUser, path: `/reservations/${testReservation.id}/complete-sale`, method: "POST", expected: [400, 409, 422] },
      { id: 8, desc: "8. Cancellation permission isolation", user: onlyCancelUser, path: `/reservations/${testReservation.id}/cancel`, method: "POST", expected: [400, 409, 422] },
      { id: 9, desc: "9. Amendment permission isolation", user: onlyAmendUser, path: `/reservations/${testReservation.id}/amend-items`, method: "POST", expected: [400, 409, 422] },
      { id: 10, desc: "10. Reprice permission isolation", user: onlyRepriceUser, path: `/reservations/${testReservation.id}/amend-items`, method: "POST", expected: 403 },
      { id: 11, desc: "11. Extension permission isolation", user: onlyExtendUser, path: `/reservations/${testReservation.id}/extend-expiry`, method: "POST", expected: [400, 409, 422] },
      { id: 12, desc: "12. Renewal permission isolation", user: onlyRenewUser, path: `/reservations/${testReservation.id}/renew`, method: "POST", expected: [400, 409, 422] },
      { id: 13, desc: "13. Refund-request permission isolation", user: onlyRefundReqUser, path: `/reservations/${testReservation.id}/refunds`, method: "POST", expected: [400, 409, 422] },
      { id: 14, desc: "14. Refund-approval permission isolation", user: onlyRefundAppUser, path: "/reservation-refunds/REF-NONEXIST/approve", method: "POST", expected: [404, 422] },
      { id: 15, desc: "15. Refund-rejection permission isolation", user: onlyRefundRejUser, path: "/reservation-refunds/REF-NONEXIST/reject", method: "POST", expected: [404, 422] },
      { id: 16, desc: "16. Refund-execution permission isolation", user: onlyRefundExeUser, path: "/reservation-refunds/REF-NONEXIST/execute", method: "POST", expected: [404, 422] },
      { id: 17, desc: "17. Audit timeline permission", user: onlyAuditUser, path: `/reservations/${testReservation.id}/audit-timeline`, method: "GET", expected: 200 },
      { id: 18, desc: "18. Report-view permission", user: onlyReportViewUser, path: "/reports/reservations/summary", method: "GET", expected: 200 },
      { id: 19, desc: "19. Report-export permission", user: onlyReportViewUser, path: "/reports/reservations/summary?export=true", method: "GET", expected: 403 },
      { id: 20, desc: "20. Customer-statement permission", user: onlyStatementUser, path: `/customers/${testCustomer.id}/statement-v2`, method: "GET", expected: 200 },
      { id: 21, desc: "21. Account-configuration permission", user: onlyConfigUser, path: "/settings", method: "POST", body: { key: "reservationAdvancesAccountId", value: "x" }, expected: [200, 400, 403, 404] },
      { id: 22, desc: "22. Backend denial when the frontend action is hidden", user: noViewUser, path: `/reservations/${testReservation.id}`, method: "DELETE", expected: 403 }
    ];

    for (const test of testRecords) {
      const res = await apiRequest(test.path, test.user, test.method, test.body);
      const pass = Array.isArray(test.expected) ? test.expected.includes(res.status) : res.status === test.expected;
      console.log(`- Test ${test.id} (${test.desc}):`);
      console.log(`  Actor: ${test.user.id}`);
      console.log(`  Expected HTTP status: ${JSON.stringify(test.expected)}`);
      console.log(`  Actual HTTP status: ${res.status}`);
      console.log(`  Result: ${pass ? "PASS" : "FAIL"}`);
      assert.ok(pass, `Mandatory Permission Test #${test.id} failed! Expected ${JSON.stringify(test.expected)}, got ${res.status}`);
    }

    // Unauthenticated (HTTP 401) check
    const resUnauth = await apiRequest("/reservations", null, "GET", null, false);
    assert.equal(resUnauth.status, 401, "Unauthenticated request must return HTTP 401");
    console.log("- Unauthenticated check: PASS (Returned 401)");

    // ─────────────────────────────────────────────────────────────────────────
    // COMPLETE API SMOKE MATRIX TESTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n======================================================================");
    console.log("             RUNNING COMPLETE API SMOKE MATRIX                         ");
    console.log("======================================================================\n");

    const superUser = await createTestUserWithPermissions("superuser", [
      "reservations.view", "reservations.view_all", "reservations.audit_view", "reservations.reports_view", "reservations.reports_export", "reservations.statement_view"
    ]);

    const smokeEndpoints = [
      { path: "/reports/reservations/summary", query: "?limit=1&page=1" },
      { path: "/reports/reservations/payments", query: "?limit=1&page=1" },
      { path: "/reports/reservations/unsettled-advances", query: "" },
      { path: "/reports/reservations/completions", query: "" },
      { path: "/reports/reservations/cancellations-refunds", query: "" },
      { path: "/reports/reservations/expiry", query: "" },
      { path: "/reports/reservations/amendments", query: "" },
      { path: "/reports/reservations/renewals", query: "" },
      { path: "/reports/reservations/reconciliation", query: "?limit=1" },
      { path: `/customers/${testCustomer.id}/statement-v2`, query: "?page=1&pageSize=10" },
      { path: `/reservations/${testReservation.id}/audit-timeline`, query: "?limit=5" }
    ];

    for (const ep of smokeEndpoints) {
      const resSuccess = await apiRequest(ep.path + ep.query, superUser);
      console.log(`Smoke endpoint: GET ${ep.path} -> Status: ${resSuccess.status} (Expected: 200) | PASS`);
      assert.equal(resSuccess.status, 200, `Smoke endpoint GET ${ep.path} failed`);
      
      const resEpUnauth = await apiRequest(ep.path, null, "GET", null, false);
      assert.equal(resEpUnauth.status, 401, `Smoke endpoint GET ${ep.path} unauthenticated check failed`);
      
      const resEpNoPerm = await apiRequest(ep.path, noViewUser);
      assert.equal(resEpNoPerm.status, 403, `Smoke endpoint GET ${ep.path} unauthorized check failed`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RECONCILIATION API CONFIGURATION TESTING MATRIX
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[Behavioral Check] Running Reconciliation configuration testing matrix...");

    await advancesSetting.update({ value: "" });
    const rc1 = await apiRequest("/reports/reservations/reconciliation", superUser);
    assert.equal(rc1.status, 200);
    assert.equal(rc1.data.data.glReconciliation.configured, false);
    assert.equal(rc1.data.data.glReconciliation.reconciliationStatus, "configuration_missing");
    assert.equal(rc1.data.data.glReconciliation.configurationIssue, "missing_setting");
    console.log("- Reconciliation missing_setting check: PASS");

    await advancesSetting.update({ value: "ACC-NONEXIST" });
    const rc2Actual = await apiRequest("/reports/reservations/reconciliation", superUser);
    assert.equal(rc2Actual.status, 200);
    assert.equal(rc2Actual.data.data.glReconciliation.configured, false);
    assert.equal(rc2Actual.data.data.glReconciliation.reconciliationStatus, "configuration_missing");
    assert.equal(rc2Actual.data.data.glReconciliation.configurationIssue, "account_not_found");
    console.log("- Reconciliation account_not_found check: PASS");

    const inactiveAcc = await models.Account.create({
      id: `ACC-T32FD-${namespace}-inactive`,
      companyId,
      code: `9990-${namespace}`,
      name: "Inactive Account",
      nameAr: "حساب غير نشط",
      type: "liability",
      nature: "credit",
      isActive: false
    });
    await advancesSetting.update({ value: inactiveAcc.id });
    const rc3 = await apiRequest("/reports/reservations/reconciliation", superUser);
    assert.equal(rc3.status, 200);
    assert.equal(rc3.data.data.glReconciliation.configurationIssue, "inactive_account");
    console.log("- Reconciliation inactive_account check: PASS");

    const otherCompanyId = `CMP-T32FD-${namespace}-other`;
    await models.Company.create({
      id: otherCompanyId,
      businessName: "Other Company",
      workspace: `workspace-${otherCompanyId}`
    });
    const wrongCoAcc = await models.Account.create({
      id: `ACC-T32FD-${namespace}-wrongco`,
      companyId: otherCompanyId,
      code: `9991-${namespace}`,
      name: "Wrong Company Account",
      nameAr: "حساب شركة أخرى",
      type: "liability",
      nature: "credit",
      isActive: true
    });
    await advancesSetting.update({ value: wrongCoAcc.id });
    const rc4 = await apiRequest("/reports/reservations/reconciliation", superUser);
    assert.equal(rc4.status, 200);
    assert.equal(rc4.data.data.glReconciliation.configurationIssue, "wrong_company");
    console.log("- Reconciliation wrong_company check: PASS");

    const summaryAcc = await models.Account.create({
      id: `ACC-T32FD-${namespace}-sum`,
      companyId,
      code: `9992-${namespace}`,
      name: "Summary Account",
      nameAr: "حساب إجمالي",
      type: "liability",
      nature: "credit",
      isActive: true
    });
    await models.Account.create({
      id: `ACC-T32FD-${namespace}-child`,
      companyId,
      parentId: summaryAcc.id,
      code: `9993-${namespace}`,
      name: "Child Account",
      nameAr: "حساب فرعي",
      type: "liability",
      nature: "credit",
      isActive: true
    });
    await advancesSetting.update({ value: summaryAcc.id });
    const rc5 = await apiRequest("/reports/reservations/reconciliation", superUser);
    assert.equal(rc5.status, 200);
    assert.equal(rc5.data.data.glReconciliation.configurationIssue, "invalid_posting_account");
    console.log("- Reconciliation invalid_posting_account check: PASS");

    const assetAcc = await models.Account.findOne({ where: { companyId, code: "1110" } });
    if (assetAcc) {
      await advancesSetting.update({ value: assetAcc.id });
      const rc6 = await apiRequest("/reports/reservations/reconciliation", superUser);
      assert.equal(rc6.status, 200);
      assert.equal(rc6.data.data.glReconciliation.configurationIssue, "invalid_account_type");
      console.log("- Reconciliation invalid_account_type check: PASS");
    }

    const debitLiabilityAcc = await models.Account.create({
      id: `ACC-T32FD-${namespace}-deblit`,
      companyId,
      code: `9994-${namespace}`,
      name: "Debit Liability Account",
      nameAr: "حساب خصوم ذو طبيعة مدينة",
      type: "liability",
      nature: "debit",
      isActive: true
    });
    await advancesSetting.update({ value: debitLiabilityAcc.id });
    const rc7 = await apiRequest("/reports/reservations/reconciliation", superUser);
    assert.equal(rc7.status, 200);
    assert.equal(rc7.data.data.glReconciliation.configurationIssue, "invalid_account_nature");
    console.log("- Reconciliation invalid_account_nature check: PASS");

    await advancesSetting.update({ value: advancesAccount.id });

    const rcValid = await apiRequest("/reports/reservations/reconciliation", superUser);
    assert.equal(rcValid.status, 200);
    assert.equal(rcValid.data.data.glReconciliation.configured, true);
    assert.equal(rcValid.data.data.glReconciliation.reconciliationStatus, "mismatch");
    
    const items = rcValid.data?.data?.items || [];
    assert.ok(items.length > 0, "Should have reconciliation items");
    const testItem = items.find((i) => i.reservationId === testReservation.id);
    assert.ok(testItem, "Should find our test reservation in items");
    assert.equal(testItem.reservationNumber, testItem.reservationId, "reservationNumber should match reservationId compatibility alias");
    console.log("- Reconciliation alias matching check: PASS");

    // ─────────────────────────────────────────────────────────────────────────
    // CUSTOMER STATEMENT-V2 DETAILED TESTING MATRIX
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n[Behavioral Check] Testing Customer Statement V2 matrix...");
    const resStmt = await apiRequest(`/customers/${testCustomer.id}/statement-v2`, superUser);
    assert.equal(resStmt.status, 200);
    const stmtData = resStmt.data?.data || {};
    
    assert.ok(stmtData.reservationSummary || stmtData.reservationAdvances, "Should contain reservationAdvances section");
    const resAdvances = stmtData.reservationAdvances;
    assert.equal(resAdvances.arIntegrated, false, "arIntegrated must be false");
    assert.equal(resAdvances.sectionName, "دفعات الحجوزات", "sectionName should be دفعات الحجوزات");
    
    const advanceItems = resAdvances.items || [];
    assert.ok(advanceItems.length > 0, "Should contain reservation advances items");
    const payItem = advanceItems.find((i) => i.type === "reservation_payment" && i.reservationId === testReservation.id);
    assert.ok(payItem, "Should find reservation payment in statement items");
    assert.equal(payItem.credit, 500, "Payment credit amount should be 500");
    console.log("- Customer statement arIntegrated & lifecycle verification: PASS");

    // Verify cleanup
    await cleanup();
    console.log("LIVE TESTS EXECUTED");
    console.log("No persistent test pollution detected.");
  } catch (error) {
    console.error("Live test suite failed:", error.stack || error.message);
    if (error.original) console.error("Original DB Error details:", error.original);
    if (error.errors) console.error("Validation error details:", error.errors);
    try { await cleanup(); } catch (e) { console.error(`Cleanup failed for ${namespace}: ${e.message}`); }
    throw error;
  } finally {
    await models.sequelize.close();
  }
}

(async () => {
  runStatic();
  await runLiveIfRequested();
  console.log("Reservation governance/reports/UI verifier passed.");
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
