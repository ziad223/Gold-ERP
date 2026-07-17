#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function assertIncludes(src, token, label) {
  assert.ok(src.includes(token), `${label} must include ${token}`);
}

function staticContract() {
  const migration = read("backend/migrations/20260714050000-sales-pos-operator-enforcement.js");
  const access = read("backend/src/bootstrap/accessControl.js");
  const modelIndex = read("backend/src/models/index.js");
  const invoice = read("backend/src/models/invoice.model.js");
  const payment = read("backend/src/models/payment.model.js");
  const printEvent = read("backend/src/models/invoicePrintEvent.model.js");
  const policy = read("backend/src/services/sales-operator-policy.service.js");
  const routes = read("backend/src/routes/erp.routes.js");
  const authGuard = read("components/auth/auth-guard.tsx");
  const apiClient = read("lib/api/client.ts");
  const operatorBar = read("components/operator/operator-bar.tsx");

  for (const token of [
    "created_by_employee_id",
    "finalized_by_employee_id",
    "received_by_employee_id",
    "invoice_print_events",
    "official_print_authorized",
    "reprint_authorized",
    "invoice_print_events_one_official_uq",
    "pos.view",
    "pos.sell",
    "pos.discount.approve"
  ]) assertIncludes(migration, token, "migration");

  for (const permission of ["pos.view", "pos.sell", "pos.discount.approve"]) {
    assertIncludes(access, permission, "permission catalog");
  }

  for (const token of ["InvoicePrintEvent", "printEvents", "createdByEmployee", "finalizedByEmployee", "receivedByEmployee"]) {
    assertIncludes(modelIndex, token, "model index");
  }
  for (const token of ["createdByEmployeeId", "finalizedByEmployeeId"]) assertIncludes(invoice, token, "invoice model");
  assertIncludes(payment, "receivedByEmployeeId", "payment model");
  for (const token of ["technicalUserId", "employeeId", "operatorSessionId", "copyNumber"]) assertIncludes(printEvent, token, "print event model");

  for (const [operation, permission] of [
    ["sales.draft.create", "sales.create"],
    ["sales.draft.update", "sales.create"],
    ["sales.draft.cancel", "sales.create"],
    ["sales.post", "sales.create"],
    ["sales.legacy_immediate_post", "sales.create"],
    ["pos.checkout", "pos.sell"],
    ["sales.official_print", "sales.print"],
    ["sales.reprint", "sales.print"],
    ["pos.discount.override", "pos.discount.approve"]
  ]) {
    assertIncludes(policy, operation, "sales operator policy");
    assertIncludes(policy, permission, `policy ${operation}`);
  }
  assert.ok(!policy.includes("requiredLevel") && !policy.includes("OPERATOR_STEP_UP_REQUIRED"), "Sales/POS policy has no active Level or step-up gate");
  assertIncludes(policy, "salesOperatorMode", "rollout mode resolver");
  assertIncludes(policy, "branchOverrides", "branch override resolver");
  assertIncludes(policy, "legacy_users", "legacy default");
  assertIncludes(policy, "shared_employee_operator", "shared mode");
  assertIncludes(policy, "requireSalesCommandAccess", "centralized Sales/POS command gate");
  assertIncludes(policy, "accountTypeRequiresOperator", "account-type forced operator gate");
  assertIncludes(policy, "accountType === \"legacy\"", "legacy technical permission branch");
  assertIncludes(policy, "accountType === \"branch_shell\"", "Branch Shell command branch");
  assertIncludes(policy, "accountType === \"super_admin\"", "Super Admin command branch");

  const protectedRoutes = [
    ['"/pos/checkout"', 'requireSalesCommandAccess("pos.checkout"'],
    ['"/sales/invoices/draft"', 'requireSalesCommandAccess("sales.legacy_immediate_post"'],
    ['"/sales/invoices/drafts"', 'requireSalesCommandAccess("sales.draft.create"'],
    ['"/sales/invoices/:id"', 'requireSalesCommandAccess("sales.draft.update"'],
    ['"/sales/invoices/:id/cancel"', 'requireSalesCommandAccess("sales.draft.cancel"'],
    ['"/sales/invoices/:id/post"', 'requireSalesCommandAccess("sales.post"'],
    ['"/invoices/:id/print-events"', 'requireSalesCommandAccess("sales.official_print"']
  ];
  for (const [routeToken, guardToken] of protectedRoutes) {
    assertIncludes(routes, routeToken, `route ${routeToken}`);
    assertIncludes(routes, guardToken, `guard ${routeToken}`);
  }

  assertIncludes(routes, 'requireAnyPermission(["pos.view", "pos.sell"])', "POS read-only compatibility");
  assertIncludes(routes, "GENERIC_INVOICE_MUTATION_FORBIDDEN", "generic invoice mutation bypass closure");
  assertIncludes(routes, "POS_DISCOUNT_APPROVAL_REQUIRED", "discount override denial");
  assertIncludes(routes, "OFFICIAL_PRINT_ALREADY_AUTHORIZED", "official print duplicate denial");
  assertIncludes(routes, "REPRINT_REASON_REQUIRED", "reprint reason denial");
  assertIncludes(routes, "INVOICE_NOT_FINALIZED", "print finalized-only rule");
  assertIncludes(routes, "finalizedByEmployeeId: commandActor.employeeId || null", "invoice finalizer attribution");
  assertIncludes(routes, "createdByEmployeeId: commandActor.employeeId || null", "draft creator attribution");
  assertIncludes(routes, "receivedByEmployeeId: commandActor.employeeId || null", "payment receiver attribution");
  assertIncludes(routes, "commandActorContext.attachAuditActor", "dual audit actor propagation");
  assertIncludes(routes, "permissionService.userHasPermission(req.user, \"pos.discount.approve\")", "discount technical permission DB resolution");
  assertIncludes(authGuard, "salesPosOperatorRouteAccess", "frontend Sales/POS operator route compatibility gate");
  assertIncludes(authGuard, 'user?.accountType === "branch_shell"', "frontend Branch Shell Sales/POS route access");
  assertIncludes(authGuard, 'user?.accountType === "super_admin"', "frontend Super Admin Sales/POS route access");
  assertIncludes(authGuard, '/^\\/pos(?:\\/|$)/', "frontend POS route compatibility scope");
  assertIncludes(authGuard, '/^\\/sales(?:\\/|$)/', "frontend Sales route compatibility scope");

  for (const excluded of [
    'requireSalesOperator("sales.return"',
    'requireSalesOperator("sales.exchange"',
    'requireSalesOperator("installment.pay"',
    'requireSalesOperator("gold_purchase'
  ]) {
    assert.ok(!routes.includes(excluded), `excluded route wiring absent: ${excluded}`);
  }

  assertIncludes(apiClient, "OPERATOR_ACTION_REQUIRED_EVENT", "frontend recovery event");
  assert.ok(!apiClient.includes("OPERATOR_STEP_UP_REQUIRED"), "frontend operator recovery has no step-up error");
  assertIncludes(operatorBar, "OPERATOR_ACTION_REQUIRED_EVENT", "operator bar recovery listener");

  console.log("Phase 34.5 static Sales/POS operator-enforcement contract: PASS");
}

require(path.join(BACKEND, "node_modules/dotenv")).config({ path: path.join(BACKEND, ".env") });

function assertLocalEnvironment() {
  if (process.env.NODE_ENV === "production" || process.env.RENDER || process.env.VERCEL) {
    throw new Error("Refusing production/Render verification");
  }
  if (process.env.DATABASE_URL && !/localhost|127\.0\.0\.1|5433/.test(process.env.DATABASE_URL)) {
    throw new Error("Refusing non-local DATABASE_URL");
  }
  if (process.env.DB_NAME && process.env.DB_NAME !== "darfus_erp") {
    throw new Error(`Refusing unexpected DB_NAME ${process.env.DB_NAME}`);
  }
  if (process.env.DB_HOST && !["localhost", "127.0.0.1"].includes(process.env.DB_HOST)) {
    throw new Error(`Refusing unexpected DB_HOST ${process.env.DB_HOST}`);
  }
}

async function databaseContract(models) {
  const { Op } = require(path.join(BACKEND, "node_modules/sequelize"));
  models.sequelize.options.logging = false;
  const [[connection]] = await models.sequelize.query("select current_database() as database, inet_server_addr()::text as server_addr, inet_server_port()::int as server_port");
  assert.equal(connection.database, "darfus_erp", "connected database is darfus_erp");
  const [migrations] = await models.sequelize.query('select count(*)::int c from "SequelizeMeta"');
  assert.equal(Number(migrations[0].c), 43, "migration count is 43 after HF5B");
  const permissionCount = await models.Permission.count();
  assert.equal(permissionCount, 123, "permission count is 123");
  const pos = await models.Permission.findAll({ where: { name: ["pos.view", "pos.sell", "pos.discount.approve"] } });
  assert.equal(pos.length, 3, "all POS permissions exist once");
  const gold = await models.Permission.count({ where: { name: { [Op.like]: "gold_purchase.%" } } });
  assert.equal(gold, 24, "Gold Purchase permission count unchanged");
  const [columns] = await models.sequelize.query(`
    select table_name, column_name
    from information_schema.columns
    where table_schema='public'
      and ((table_name='invoices' and column_name in ('created_by_employee_id','finalized_by_employee_id'))
        or (table_name='payments' and column_name='received_by_employee_id')
        or table_name='invoice_print_events')
  `);
  const keys = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
  for (const key of [
    "invoices.created_by_employee_id",
    "invoices.finalized_by_employee_id",
    "payments.received_by_employee_id",
    "invoice_print_events.invoice_id",
    "invoice_print_events.employee_id",
    "invoice_print_events.operator_session_id",
    "invoice_print_events.copy_number"
  ]) assert.ok(keys.has(key), `schema has ${key}`);
  console.log("Phase 34.5 DB schema/catalog contract: PASS");
}

const ns = `T34-5-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const pin = "258036";
const ids = {
  company: `CMP-${ns}`,
  branchA: `BR-${ns}-A`,
  branchB: `BR-${ns}-B`,
  branchLegacy: `BR-${ns}-LEGACY`
};

let baseUrl = null;
let server = null;
let models = null;
let jwt = null;
let bcrypt = null;
let JWT_SECRET = null;
let Op = null;

const state = {
  users: {},
  employees: {},
  tokens: {},
  roles: {},
  permissions: {},
  customers: [],
  products: [],
  assets: [],
  invoices: [],
  printEvents: [],
  deviceCounter: 0
};

async function tokenFor(user) {
  const session = await models.TechnicalAccountSession.create({
    id: `TAS-${ns}-${user.id}`.slice(0, 190),
    userId: user.id,
    companyId: user.companyId,
    branchId: user.branchId || null,
    refreshTokenHash: `verifier-${ns}-${user.id}`.slice(0, 128),
    passwordVersion: Number(user.passwordVersion || 1),
    sessionVersion: Number(user.sessionVersion || 1),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    lastUsedAt: new Date()
  });
  return jwt.sign({
    userId: user.id,
    passwordVersion: Number(user.passwordVersion || 1),
    sessionVersion: Number(user.sessionVersion || 1),
    technicalSessionId: session.id
  }, JWT_SECRET, { expiresIn: "15m" });
}

function nextDevice(label) {
  state.deviceCounter += 1;
  return `DEV-${ns}-${label}-${state.deviceCounter}`;
}

async function request(method, urlPath, { token, companyId = ids.company, branchId = ids.branchA, deviceId, body, idempotencyKey } = {}) {
  const headers = {
    "Content-Type": "application/json",
    "X-Company-ID": companyId,
    "X-Correlation-ID": `CORR-${ns}`
  };
  if (branchId) headers["X-Branch-ID"] = branchId;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (deviceId) headers["X-Device-Session-ID"] = deviceId;
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await fetch(`${baseUrl}/api/v1${urlPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) { json = { raw: text }; }
  return { status: response.status, body: json, text };
}

function codeOf(response) {
  return response.body?.code || response.body?.errorCode || response.body?.error?.code || null;
}

async function expectError(promise, status, code, label) {
  const response = await promise;
  assert.equal(response.status, status, `${label} HTTP status`);
  assert.equal(codeOf(response), code, `${label} error code`);
  return response;
}

function outData(response) {
  return response.body?.data || response.body || {};
}

async function verifyOperator({ user = "full", employee, branchId = ids.branchA, level = 1, permission = null, operation = null, deviceId = nextDevice(employee) }) {
  const response = await request("POST", "/operator/verify", {
    token: state.tokens[user],
    branchId,
    deviceId,
    body: {
      employeeCode: state.employees[employee].employeeCode,
      pin,
      branchId,
      requestedLevel: level,
      requestedPermission: permission,
      requestedOperation: operation
    }
  });
  assert.equal(response.status, 200, `operator verify ${employee}`);
  assert.equal(outData(response).operatorSession.employee.id, state.employees[employee].id, `operator session employee for ${employee}`);
  return deviceId;
}

async function ensureRole(slug, permissionNames) {
  const role = await models.Role.create({
    id: `ROLE-${ns}-${slug}`,
    companyId: ids.company,
    name: `${ns} ${slug}`,
    slug: `${ns}-${slug}`,
    description: `${ns} verifier role ${slug}`,
    isSystem: false,
    isAdmin: false
  });
  const permissions = await models.Permission.findAll({ where: { name: permissionNames } });
  assert.equal(permissions.length, permissionNames.length, `all permissions exist for ${slug}`);
  await models.RolePermission.bulkCreate(permissions.map((permission) => ({
    roleId: role.id,
    permissionId: permission.id
  })));
  state.roles[slug] = role;
  return role;
}

async function createUser(key, role, branchId = ids.branchA, options = {}) {
  const user = await models.User.create({
    id: `USR-${ns}-${key}`,
    companyId: ids.company,
    firstName: ns,
    lastName: key,
    email: `${ns}-${key}@example.test`.toLowerCase(),
    phone: "000",
    password: "not-used",
    role: options.legacyRole || "sales",
    accountType: options.accountType || "legacy",
    branchId: options.accountType === "super_admin" ? null : branchId
  });
  await models.UserRole.create({ userId: user.id, roleId: state.roles[role].id });
  state.users[key] = user;
  state.tokens[key] = await tokenFor(user);
  return user;
}

async function grantEmployee(employeeId, permissionNames, { deny = false } = {}) {
  const permissions = await models.Permission.findAll({ where: { name: permissionNames } });
  assert.equal(permissions.length, permissionNames.length, `employee permissions exist ${permissionNames.join(",")}`);
  const Model = deny ? models.EmployeePermissionDenial : models.EmployeePermissionGrant;
  await Model.bulkCreate(permissions.map((permission) => ({
    id: `${deny ? "EPD" : "EPG"}-${ns}-${employeeId}-${permission.name}`.replace(/[^A-Za-z0-9_.-]/g, "-").slice(0, 190),
    companyId: ids.company,
    employeeId,
    permissionId: permission.id,
    active: true
  })));
}

async function createEmployee(key, permissionNames, { branches = [ids.branchA], denials = [] } = {}) {
  const employee = await models.Employee.create({
    id: `EMP-${ns}-${key}`,
    companyId: ids.company,
    name: `${ns} ${key}`,
    employeeCode: `${ns}-${key}`,
    employeeCodeNormalized: `${ns}-${key}`.trim().normalize("NFKC").toUpperCase(),
    role: "sales",
    systemRole: "sales",
    branch: branches[0],
    branchId: branches[0],
    status: "present",
    email: `${ns}-${key}@employee.test`.toLowerCase(),
    joinDate: "2026-07-14"
  });
  await models.EmployeeCredential.create({
    id: `ECR-${ns}-${key}`,
    companyId: ids.company,
    employeeId: employee.id,
    pinHash: bcrypt.hashSync(pin, 10),
    credentialVersion: 1,
    active: true
  });
  await models.EmployeeBranchAccess.bulkCreate(branches.map((branchId) => ({
    id: `EBA-${ns}-${key}-${branchId}`.slice(0, 190),
    companyId: ids.company,
    employeeId: employee.id,
    branchId,
    active: true,
    validFrom: null,
    validTo: null,
    createdByUserId: state.users.full?.id || null
  })));
  if (permissionNames.length) await grantEmployee(employee.id, permissionNames);
  if (denials.length) await grantEmployee(employee.id, denials, { deny: true });
  state.employees[key] = employee;
  return employee;
}

async function createProduct(key, branchId = ids.branchA, quantity = 5, price = 100) {
  const product = await models.Product.create({
    id: `PROD-${ns}-${key}`,
    companyId: ids.company,
    productCode: `PC-${ns}-${key}`.slice(0, 80),
    productName: `${ns} Product ${key}`,
    description: ns,
    karat: 21,
    stockType: "jewellery",
    branchId,
    branchName: branchId,
    quantityOnHand: quantity,
    quantityAvailable: quantity,
    quantitySold: 0,
    quantityReserved: 0,
    totalWeight: quantity,
    averageUnitWeight: 1,
    unitCost: 40,
    averageCost: 40,
    salePrice: price,
    isActive: true
  });
  state.products.push(product.id);
  return product;
}

async function createAsset(key, branchId = ids.branchA, price = 120) {
  const asset = await models.Asset.create({
    id: `AST-${ns}-${key}`,
    companyId: ids.company,
    name: `${ns} Asset ${key}`,
    type: "gold-piece",
    category: "ring",
    karat: 21,
    purity: 0.875,
    grossWeight: 10,
    netWeight: 9,
    goldWeight: 9,
    price,
    cost: 50,
    branch: branchId,
    branchId,
    location: "Verifier",
    status: "available",
    barcode: `BAR-${ns}-${key}`,
    source: "phase34.5-verifier"
  });
  state.assets.push(asset.id);
  return asset;
}

async function createCustomer(key) {
  const customer = await models.Customer.create({
    id: `CUS-${ns}-${key}`,
    companyId: ids.company,
    name: `${ns} Customer ${key}`,
    phone: `555-${Math.floor(Math.random() * 100000)}`,
    email: `${ns}-${key}@customer.test`.toLowerCase(),
    balance: 0,
    purchases: 0,
    loyaltyPoints: 0,
    branch: ids.branchA
  });
  state.customers.push(customer.id);
  return customer;
}

function posBody(customer, product, overrides = {}) {
  return {
    branchId: product.branchId,
    customerId: customer.id,
    items: [{ id: product.id, quantity: 1, price: Number(product.salePrice), name: product.productName }],
    paymentMethod: "cash",
    paidAmount: Number(product.salePrice),
    ...overrides
  };
}

function draftBody(customer, asset, overrides = {}) {
  return {
    branchId: asset.branchId,
    customerId: customer.id,
    customerName: customer.name,
    type: "sale",
    items: [{ assetId: asset.id, quantity: 1, price: Number(asset.price), name: asset.name, grossWeight: 10, karat: 21 }],
    paymentMethod: "Cash",
    ...overrides
  };
}

async function businessCounts() {
  const invoiceIds = (await models.Invoice.findAll({
    where: { companyId: ids.company },
    attributes: ["id"],
    raw: true
  })).map((row) => row.id);
  const invoiceWhere = invoiceIds.length ? { invoiceId: invoiceIds } : { invoiceId: "__none__" };
  const journalRows = await models.JournalEntry.findAll({ where: { companyId: ids.company }, attributes: ["id"], raw: true });
  const journalIds = journalRows.map((row) => row.id);
  return {
    invoices: await models.Invoice.count({ where: { companyId: ids.company } }),
    invoiceItems: await models.InvoiceItem.count({ where: invoiceWhere }),
    payments: await models.Payment.count({ where: { companyId: ids.company } }),
    cashTransactions: await models.CashTransaction.count({ where: { companyId: ids.company } }),
    stockMovements: await models.StockMovement.count({ where: { companyId: ids.company } }),
    journalEntries: journalIds.length,
    journalLines: journalIds.length ? await models.JournalLine.count({ where: { journalEntryId: journalIds } }) : 0,
    installments: await models.Installment.count({ where: { companyId: ids.company } }),
    loyaltyTransactions: await models.LoyaltyTransaction.count({ where: { companyId: ids.company } }),
    printEvents: await models.InvoicePrintEvent.count({ where: { companyId: ids.company } }),
    idempotency: await models.IdempotencyRequest.count({ where: { companyId: ids.company, key: { [Op.like]: `%${ns}%` } } }),
    notifications: await models.Notification.count({ where: { companyId: ids.company } }),
    auditLogs: await models.AuditLog.count({ where: { companyId: ids.company } })
  };
}

function diffCounts(before, after) {
  return Object.fromEntries(Object.keys(after).map((key) => [key, Number(after[key]) - Number(before[key] || 0)]));
}

async function assertNoBusinessMutation(before, label) {
  const after = await businessCounts();
  const diff = diffCounts(before, after);
  for (const key of ["invoices", "invoiceItems", "payments", "cashTransactions", "stockMovements", "journalEntries", "journalLines", "installments", "loyaltyTransactions", "printEvents"]) {
    assert.equal(diff[key], 0, `${label} must not change ${key}`);
  }
  return after;
}

async function createFixtures() {
  await models.Company.create({
    id: ids.company,
    businessName: `${ns} Company`,
    workspace: `${ns.toLowerCase()}-workspace`,
    currency: "AED",
    branchName: "Main"
  });
  await models.Branch.bulkCreate([
    { id: ids.branchA, companyId: ids.company, name: `${ns} Branch A`, code: `${ns}-A`.slice(0, 30), type: "store", isActive: true },
    { id: ids.branchB, companyId: ids.company, name: `${ns} Branch B`, code: `${ns}-B`.slice(0, 30), type: "store", isActive: true },
    { id: ids.branchLegacy, companyId: ids.company, name: `${ns} Legacy Branch`, code: `${ns}-L`.slice(0, 30), type: "store", isActive: true }
  ]);

  await ensureRole("full", ["sales.view", "sales.create", "sales.print", "pos.view", "pos.sell", "pos.discount.approve"]);
  await ensureRole("salesOnly", ["sales.view", "sales.create", "sales.print"]);
  await ensureRole("posNoDiscount", ["pos.view", "pos.sell"]);
  await ensureRole("noSales", ["sales.view", "pos.view"]);

  await createUser("full", "full", ids.branchA);
  await createUser("salesOnly", "salesOnly", ids.branchA);
  await createUser("posNoDiscount", "posNoDiscount", ids.branchA);
  await createUser("noSales", "noSales", ids.branchA);
  await createUser("legacyFull", "full", ids.branchLegacy);
  await createUser("branchShell", "full", ids.branchA, { accountType: "branch_shell", legacyRole: "admin" });
  await createUser("superAdmin", "full", null, { accountType: "super_admin", legacyRole: "admin" });

  await createEmployee("all", ["sales.create", "sales.print", "pos.sell", "pos.discount.approve"], { branches: [ids.branchA, ids.branchB, ids.branchLegacy] });
  await createEmployee("pos", ["pos.sell"], { branches: [ids.branchA, ids.branchB] });
  await createEmployee("sales", ["sales.create", "sales.print"], { branches: [ids.branchA] });
  await createEmployee("noPos", ["sales.create"], { branches: [ids.branchA] });
  await createEmployee("deniedPos", ["pos.sell"], { branches: [ids.branchA], denials: ["pos.sell"] });
  await createEmployee("branchB", ["pos.sell"], { branches: [ids.branchA, ids.branchB] });

  await models.Setting.create({
    companyId: ids.company,
    key: "salesOperatorMode",
    value: {
      companyDefault: "legacy_users",
      branchOverrides: {
        [ids.branchA]: "shared_employee_operator",
        [ids.branchB]: "shared_employee_operator",
        [ids.branchLegacy]: "legacy_users"
      }
    }
  });
}

async function testSharedModeDenialsAndAtomicity() {
  const customer = await createCustomer("deny");
  const product = await createProduct("deny-pos", ids.branchA, 3, 100);
  const beforeNoSession = await businessCounts();
  await expectError(
    request("POST", "/pos/checkout", {
      token: state.tokens.full,
      branchId: ids.branchA,
      body: posBody(customer, product),
      idempotencyKey: `IDEM-${ns}-no-session`
    }),
    401,
    "OPERATOR_SESSION_REQUIRED",
    "POS checkout without operator session"
  );
  await assertNoBusinessMutation(beforeNoSession, "no operator session denial");

  const noPosDevice = await verifyOperator({ user: "full", employee: "noPos", branchId: ids.branchA, level: 2 });
  const beforeNoEmployeePermission = await businessCounts();
  await expectError(
    request("POST", "/pos/checkout", {
      token: state.tokens.full,
      branchId: ids.branchA,
      deviceId: noPosDevice,
      body: posBody(customer, product),
      idempotencyKey: `IDEM-${ns}-employee-no-pos`
    }),
    403,
    "OPERATOR_PERMISSION_DENIED",
    "POS checkout employee missing pos.sell"
  );
  await assertNoBusinessMutation(beforeNoEmployeePermission, "employee missing pos.sell denial");

  const deniedDevice = await verifyOperator({ user: "full", employee: "deniedPos", branchId: ids.branchA, level: 2 });
  const beforeDirectDenial = await businessCounts();
  await expectError(
    request("POST", "/pos/checkout", {
      token: state.tokens.full,
      branchId: ids.branchA,
      deviceId: deniedDevice,
      body: posBody(customer, product),
      idempotencyKey: `IDEM-${ns}-direct-denial`
    }),
    403,
    "OPERATOR_PERMISSION_DENIED",
    "POS checkout direct employee denial"
  );
  await assertNoBusinessMutation(beforeDirectDenial, "direct denial");

  const goodDevice = await verifyOperator({ user: "noSales", employee: "pos", branchId: ids.branchA, level: 2 });
  const beforeTechDenied = await businessCounts();
  await expectError(
    request("POST", "/pos/checkout", {
      token: state.tokens.noSales,
      branchId: ids.branchA,
      deviceId: goodDevice,
      body: posBody(customer, product),
      idempotencyKey: `IDEM-${ns}-technical-denied`
    }),
    403,
    "FORBIDDEN",
    "POS checkout technical user missing pos.sell"
  );
  await assertNoBusinessMutation(beforeTechDenied, "technical missing pos.sell");

  const branchBDevice = await verifyOperator({ user: "full", employee: "branchB", branchId: ids.branchB, level: 2 });
  const beforeBranchMismatch = await businessCounts();
  await expectError(
    request("POST", "/pos/checkout", {
      token: state.tokens.full,
      branchId: ids.branchA,
      deviceId: branchBDevice,
      body: posBody(customer, product),
      idempotencyKey: `IDEM-${ns}-branch-mismatch`
    }),
    403,
    "OPERATOR_BRANCH_MISMATCH",
    "POS checkout operator branch mismatch"
  );
  await assertNoBusinessMutation(beforeBranchMismatch, "operator branch mismatch");
}

async function testPosSuccessAndDiscount() {
  const customer = await createCustomer("pos-success");
  const product = await createProduct("pos-success", ids.branchA, 5, 100);
  const deviceId = await verifyOperator({ user: "full", employee: "pos", branchId: ids.branchA, level: 2 });
  const response = await request("POST", "/pos/checkout", {
    token: state.tokens.full,
    branchId: ids.branchA,
    deviceId,
    body: posBody(customer, product),
    idempotencyKey: `IDEM-${ns}-pos-success`
  });
  assert.equal(response.status, 201, "POS checkout shared-mode success status");
  const invoiceId = outData(response).id;
  state.invoices.push(invoiceId);
  const invoice = await models.Invoice.findByPk(invoiceId);
  assert.equal(invoice.finalizedByEmployeeId, state.employees.pos.id, "POS invoice finalizer is operator employee");
  const payment = await models.Payment.findOne({ where: { companyId: ids.company, invoiceId } });
  assert.ok(payment, "POS payment persisted");
  assert.equal(payment.receivedByEmployeeId, state.employees.pos.id, "POS payment receiver is operator employee");
  const stock = await models.StockMovement.count({ where: { companyId: ids.company, referenceId: invoiceId } });
  assert.ok(stock >= 1, "POS success created stock movement");

  const discountProduct = await createProduct("discount-denied", ids.branchA, 2, 100);
  const discountDevice = await verifyOperator({ user: "posNoDiscount", employee: "pos", branchId: ids.branchA, level: 2 });
  const beforeDiscountDenied = await businessCounts();
  await expectError(
    request("POST", "/pos/checkout", {
      token: state.tokens.posNoDiscount,
      branchId: ids.branchA,
      deviceId: discountDevice,
      body: posBody(customer, discountProduct, { discount: 200 }),
      idempotencyKey: `IDEM-${ns}-discount-tech-denied`
    }),
    403,
    "POS_DISCOUNT_APPROVAL_REQUIRED",
    "POS discount technical permission denial"
  );
  await assertNoBusinessMutation(beforeDiscountDenied, "discount technical denial");

  const discountEmployeeDeniedProduct = await createProduct("discount-employee-denied", ids.branchA, 2, 100);
  const discountEmployeeDeniedDevice = await verifyOperator({ user: "full", employee: "pos", branchId: ids.branchA, level: 2 });
  const beforeDiscountEmployeeDenied = await businessCounts();
  await expectError(
    request("POST", "/pos/checkout", {
      token: state.tokens.full,
      branchId: ids.branchA,
      deviceId: discountEmployeeDeniedDevice,
      body: posBody(customer, discountEmployeeDeniedProduct, { discount: 200 }),
      idempotencyKey: `IDEM-${ns}-discount-employee-denied`
    }),
    403,
    "OPERATOR_PERMISSION_DENIED",
    "POS discount employee permission denial"
  );
  await assertNoBusinessMutation(beforeDiscountEmployeeDenied, "discount employee denial");

  const discountSuccessProduct = await createProduct("discount-success", ids.branchA, 2, 100);
  const discountSuccessDevice = await verifyOperator({ user: "full", employee: "all", branchId: ids.branchA, level: 2 });
  const discountSuccess = await request("POST", "/pos/checkout", {
    token: state.tokens.full,
    branchId: ids.branchA,
    deviceId: discountSuccessDevice,
    body: posBody(customer, discountSuccessProduct, { discount: 200 }),
    idempotencyKey: `IDEM-${ns}-discount-success`
  });
  assert.equal(discountSuccess.status, 201, "POS discount override succeeds with technical and employee permission");
  state.invoices.push(outData(discountSuccess).id);
}

async function testDraftPostAndPrint() {
  const customer = await createCustomer("draft");
  const asset = await createAsset("draft", ids.branchA, 125);
  const verifiedDevice = await verifyOperator({ user: "salesOnly", employee: "sales", branchId: ids.branchA, level: 1 });
  const createDraft = await request("POST", "/sales/invoices/drafts", {
    token: state.tokens.salesOnly,
    branchId: ids.branchA,
    deviceId: verifiedDevice,
    body: draftBody(customer, asset),
    idempotencyKey: `IDEM-${ns}-draft-create`
  });
  assert.equal(createDraft.status, 201, "draft create shared-mode success");
  const draftId = outData(createDraft).id;
  state.invoices.push(draftId);
  let invoice = await models.Invoice.findByPk(draftId);
  assert.equal(invoice.createdByEmployeeId, state.employees.sales.id, "draft createdByEmployeeId");
  assert.equal(invoice.finalizedByEmployeeId, null, "draft has no finalizer before post");

  const postResponse = await request("POST", `/sales/invoices/${draftId}/post`, {
    token: state.tokens.salesOnly,
    branchId: ids.branchA,
    deviceId: verifiedDevice,
    body: { idempotencyKey: `IDEM-${ns}-draft-post` },
    idempotencyKey: `IDEM-${ns}-draft-post`
  });
  assert.equal(postResponse.status, 200, "draft post shared-mode success");
  invoice = await models.Invoice.findByPk(draftId);
  assert.equal(invoice.postingStatus, "posted", "draft posted");
  assert.equal(invoice.finalizedByEmployeeId, state.employees.sales.id, "draft finalizer employee");

  const genericBefore = await businessCounts();
  await expectError(
    request("POST", "/invoices", {
      token: state.tokens.salesOnly,
      branchId: ids.branchA,
      body: { id: `INV-${ns}-GENERIC`, companyId: ids.company }
    }),
    403,
    "GENERIC_INVOICE_MUTATION_FORBIDDEN",
    "generic invoice mutation bypass"
  );
  await assertNoBusinessMutation(genericBefore, "generic invoice mutation bypass");

  const official = await request("POST", `/invoices/${draftId}/print-events`, {
    token: state.tokens.salesOnly,
    branchId: ids.branchA,
    deviceId: verifiedDevice,
    body: { type: "official" }
  });
  assert.equal(official.status, 201, "official print authorization");
  assert.equal(outData(official).employeeId, state.employees.sales.id, "official print employee attribution");
  state.printEvents.push(outData(official).id);

  await expectError(
    request("POST", `/invoices/${draftId}/print-events`, {
      token: state.tokens.salesOnly,
      branchId: ids.branchA,
      deviceId: verifiedDevice,
      body: { type: "official" }
    }),
    409,
    "OFFICIAL_PRINT_ALREADY_AUTHORIZED",
    "duplicate official print"
  );
  await expectError(
    request("POST", `/invoices/${draftId}/print-events`, {
      token: state.tokens.salesOnly,
      branchId: ids.branchA,
      deviceId: verifiedDevice,
      body: { type: "reprint" }
    }),
    422,
    "REPRINT_REASON_REQUIRED",
    "reprint reason required"
  );
  const reprint = await request("POST", `/invoices/${draftId}/print-events`, {
    token: state.tokens.salesOnly,
    branchId: ids.branchA,
    deviceId: verifiedDevice,
    body: { type: "reprint", reason: `${ns} verifier reprint` }
  });
  assert.equal(reprint.status, 201, "reprint authorization");
  assert.equal(outData(reprint).copyNumber, 2, "reprint copy number");
  state.printEvents.push(outData(reprint).id);
}

async function testBranchShellEmployeeFirstGate() {
  const permissionService = require(path.join(BACKEND, "src/services/permission.service"));
  const branchShellPermissions = await permissionService.getUserPermissionNames(state.users.branchShell);
  assert.equal(branchShellPermissions.includes("pos.sell"), false, "Branch Shell has no direct pos.sell User permission");
  assert.equal(branchShellPermissions.includes("sales.create"), false, "Branch Shell has no direct sales.create User permission");
  assert.equal(branchShellPermissions.includes("sales.print"), false, "Branch Shell has no direct sales.print User permission");

  const customer = await createCustomer("branch-shell");
  const noEmployeeProduct = await createProduct("branch-shell-no-employee", ids.branchA, 2, 100);
  const beforeNoEmployee = await businessCounts();
  await expectError(
    request("POST", "/pos/checkout", {
      token: state.tokens.branchShell,
      branchId: ids.branchA,
      body: posBody(customer, noEmployeeProduct),
      idempotencyKey: `IDEM-${ns}-branch-shell-no-employee`
    }),
    401,
    "BRANCH_ACCOUNT_EMPLOYEE_REQUIRED",
    "Branch Shell POS checkout without Employee"
  );
  await assertNoBusinessMutation(beforeNoEmployee, "Branch Shell no Employee denial");

  const noPosDevice = await verifyOperator({ user: "branchShell", employee: "noPos", branchId: ids.branchA, level: 2 });
  const noPermissionProduct = await createProduct("branch-shell-no-pos", ids.branchA, 2, 100);
  const beforeNoPermission = await businessCounts();
  await expectError(
    request("POST", "/pos/checkout", {
      token: state.tokens.branchShell,
      branchId: ids.branchA,
      deviceId: noPosDevice,
      body: posBody(customer, noPermissionProduct),
      idempotencyKey: `IDEM-${ns}-branch-shell-no-pos`
    }),
    403,
    "OPERATOR_PERMISSION_DENIED",
    "Branch Shell Employee missing pos.sell"
  );
  await assertNoBusinessMutation(beforeNoPermission, "Branch Shell missing Employee permission");

  const deniedDevice = await verifyOperator({ user: "branchShell", employee: "deniedPos", branchId: ids.branchA, level: 2 });
  const deniedProduct = await createProduct("branch-shell-denied-pos", ids.branchA, 2, 100);
  const beforeDirectDenial = await businessCounts();
  await expectError(
    request("POST", "/pos/checkout", {
      token: state.tokens.branchShell,
      branchId: ids.branchA,
      deviceId: deniedDevice,
      body: posBody(customer, deniedProduct),
      idempotencyKey: `IDEM-${ns}-branch-shell-direct-denial`
    }),
    403,
    "OPERATOR_PERMISSION_DENIED",
    "Branch Shell Employee direct denial"
  );
  await assertNoBusinessMutation(beforeDirectDenial, "Branch Shell direct denial");

  const verifiedPosDevice = await verifyOperator({ user: "branchShell", employee: "pos", branchId: ids.branchA, level: 1 });

  const branchMismatchProduct = await createProduct("branch-shell-branch-mismatch", ids.branchA, 2, 100);
  const beforeBranchMismatch = await businessCounts();
  await expectError(
    request("POST", "/pos/checkout", {
      token: state.tokens.branchShell,
      branchId: ids.branchB,
      deviceId: verifiedPosDevice,
      body: posBody(customer, branchMismatchProduct, { branchId: ids.branchB }),
      idempotencyKey: `IDEM-${ns}-branch-shell-branch-mismatch`
    }),
    403,
    "BRANCH_ACCOUNT_FIXED_SCOPE",
    "Branch Shell fixed branch mismatch"
  );
  await assertNoBusinessMutation(beforeBranchMismatch, "Branch Shell branch mismatch");

  const successProduct = await createProduct("branch-shell-success", ids.branchA, 2, 100);
  const success = await request("POST", "/pos/checkout", {
    token: state.tokens.branchShell,
    branchId: ids.branchA,
    deviceId: verifiedPosDevice,
    body: posBody(customer, successProduct),
    idempotencyKey: `IDEM-${ns}-branch-shell-success`
  });
  assert.equal(success.status, 201, "Branch Shell POS checkout succeeds through Employee authorization");
  const branchShellInvoiceId = outData(success).id;
  state.invoices.push(branchShellInvoiceId);
  const branchShellInvoice = await models.Invoice.findByPk(branchShellInvoiceId);
  assert.equal(branchShellInvoice.finalizedByEmployeeId, state.employees.pos.id, "Branch Shell POS invoice finalizer is Employee");
  const branchShellPayment = await models.Payment.findOne({ where: { companyId: ids.company, invoiceId: branchShellInvoiceId } });
  assert.ok(branchShellPayment, "Branch Shell POS payment persisted");
  assert.equal(branchShellPayment.receivedByEmployeeId, state.employees.pos.id, "Branch Shell POS payment receiver is Employee");

  const verifiedSalesDevice = await verifyOperator({ user: "branchShell", employee: "sales", branchId: ids.branchA, level: 1 });
  const draftCustomer = await createCustomer("branch-shell-draft");
  const cancelAsset = await createAsset("branch-shell-draft-cancel", ids.branchA, 125);
  const draftCreate = await request("POST", "/sales/invoices/drafts", {
    token: state.tokens.branchShell,
    branchId: ids.branchA,
    deviceId: verifiedSalesDevice,
    body: draftBody(draftCustomer, cancelAsset),
    idempotencyKey: `IDEM-${ns}-branch-shell-draft-create`
  });
  assert.equal(draftCreate.status, 201, "Branch Shell draft create succeeds with verified Employee");
  const cancelDraftId = outData(draftCreate).id;
  state.invoices.push(cancelDraftId);
  let cancelDraft = await models.Invoice.findByPk(cancelDraftId);
  assert.equal(cancelDraft.createdByEmployeeId, state.employees.sales.id, "Branch Shell draft creator Employee attribution");

  const draftEdit = await request("PATCH", `/sales/invoices/${cancelDraftId}`, {
    token: state.tokens.branchShell,
    branchId: ids.branchA,
    deviceId: verifiedSalesDevice,
    body: { notes: `${ns} branch shell edit` }
  });
  assert.equal(draftEdit.status, 200, "Branch Shell draft edit succeeds with verified Employee");

  const draftCancel = await request("POST", `/sales/invoices/${cancelDraftId}/cancel`, {
    token: state.tokens.branchShell,
    branchId: ids.branchA,
    deviceId: verifiedSalesDevice,
    body: { reason: `${ns} branch shell cancel` }
  });
  assert.equal(draftCancel.status, 200, "Branch Shell draft cancel succeeds with verified Employee");

  const postAsset = await createAsset("branch-shell-draft-post", ids.branchA, 126);
  const draftPostCreate = await request("POST", "/sales/invoices/drafts", {
    token: state.tokens.branchShell,
    branchId: ids.branchA,
    deviceId: verifiedSalesDevice,
    body: draftBody(draftCustomer, postAsset),
    idempotencyKey: `IDEM-${ns}-branch-shell-draft-post-create`
  });
  assert.equal(draftPostCreate.status, 201, "Branch Shell post-test draft create succeeds");
  const postDraftId = outData(draftPostCreate).id;
  state.invoices.push(postDraftId);

  const branchShellPost = await request("POST", `/sales/invoices/${postDraftId}/post`, {
    token: state.tokens.branchShell,
    branchId: ids.branchA,
    deviceId: verifiedSalesDevice,
    body: { idempotencyKey: `IDEM-${ns}-branch-shell-draft-post` },
    idempotencyKey: `IDEM-${ns}-branch-shell-draft-post`
  });
  assert.equal(branchShellPost.status, 200, "Branch Shell draft post succeeds with verified Employee");
  const postedDraft = await models.Invoice.findByPk(postDraftId);
  assert.equal(postedDraft.finalizedByEmployeeId, state.employees.sales.id, "Branch Shell draft post finalizer Employee attribution");
}

async function testSuperAdminRequiresEmployeeForOperations() {
  const customer = await createCustomer("super-admin");
  const product = await createProduct("super-admin-success", ids.branchA, 2, 100);
  const response = await request("POST", "/pos/checkout", {
    token: state.tokens.superAdmin,
    branchId: ids.branchA,
    body: posBody(customer, product),
    idempotencyKey: `IDEM-${ns}-super-admin-success`
  });
  assert.equal(response.status, 201, "Super Admin POS checkout succeeds without Employee authorization");
  const invoiceId = outData(response).id;
  state.invoices.push(invoiceId);
  const invoice = await models.Invoice.findByPk(invoiceId);
  assert.equal(invoice.finalizedByEmployeeId, null, "Super Admin POS invoice finalizer may be null");
}

async function testLegacyModeCompatibility() {
  const customer = await createCustomer("legacy");
  const product = await createProduct("legacy-pos", ids.branchLegacy, 3, 90);
  const response = await request("POST", "/pos/checkout", {
    token: state.tokens.legacyFull,
    branchId: ids.branchLegacy,
    body: posBody(customer, product),
    idempotencyKey: `IDEM-${ns}-legacy-pos`
  });
  assert.equal(response.status, 201, "legacy mode POS checkout succeeds without operator session");
  const invoiceId = outData(response).id;
  state.invoices.push(invoiceId);
  const invoice = await models.Invoice.findByPk(invoiceId);
  assert.equal(invoice.finalizedByEmployeeId, null, "legacy mode does not force employee finalizer");
  const payment = await models.Payment.findOne({ where: { companyId: ids.company, invoiceId } });
  assert.ok(payment, "legacy mode payment persisted");
  assert.equal(payment.receivedByEmployeeId, null, "legacy mode does not force payment employee");
}

async function runLiveHttpVerifier() {
  assertLocalEnvironment();
  models = require(path.join(BACKEND, "src/models"));
  jwt = require(path.join(BACKEND, "node_modules/jsonwebtoken"));
  bcrypt = require(path.join(BACKEND, "node_modules/bcryptjs"));
  Op = require(path.join(BACKEND, "node_modules/sequelize")).Op;
  JWT_SECRET = require(path.join(BACKEND, "src/config/security")).JWT_SECRET;
  models.sequelize.options.logging = false;
  await databaseContract(models);
  const app = require(path.join(BACKEND, "src/app"));
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await createFixtures();
    const fixtureCounts = await businessCounts();
    assert.equal(fixtureCounts.invoices, 0, "fixtures create no invoices before business actions");
    assert.equal(fixtureCounts.payments, 0, "fixtures create no payments before business actions");
    assert.equal(fixtureCounts.stockMovements, 0, "fixtures create no stock movements before business actions");
    assert.equal(fixtureCounts.journalEntries, 0, "fixtures create no journal entries before business actions");

    await testSharedModeDenialsAndAtomicity();
    await testPosSuccessAndDiscount();
    await testDraftPostAndPrint();
    await testBranchShellEmployeeFirstGate();
    await testSuperAdminRequiresEmployeeForOperations();
    await testLegacyModeCompatibility();
    console.log("LIVE HTTP TESTS EXECUTED");
    console.log("BRANCH SHELL EMPLOYEE-FIRST SALES/POS GATE PASSED");
    console.log("FAILURE ATOMICITY PASSED");
  } finally {
    await cleanupNamespace();
    const remaining = await namespaceCount();
    assert.equal(remaining, 0, "namespace cleanup must leave zero persistent test records");
    console.log("No persistent business test pollution detected");
    await new Promise((resolve) => server.close(resolve));
    await models.sequelize.close();
  }
}

async function namespaceCount() {
  const [rows] = await models.sequelize.query(`
    select
      (select count(*) from companies where id = :companyId)
    + (select count(*) from branches where company_id = :companyId or id like :likeNs)
    + (select count(*) from users where company_id = :companyId or id like :likeNs or email like :likeNs)
    + (select count(*) from employees where company_id = :companyId or id like :likeNs or employee_code like :likeNs)
    + (select count(*) from roles where company_id = :companyId or id like :likeNs or slug like :likeNs)
    + (select count(*) from customers where company_id = :companyId or id like :likeNs or name like :likeNs)
    + (select count(*) from products where company_id = :companyId or id like :likeNs or product_code like :likeNs)
    + (select count(*) from assets where company_id = :companyId or id like :likeNs or barcode like :likeNs)
    + (select count(*) from invoices where company_id = :companyId or id like :likeNs or invoice_number like :likeNs)
    + (select count(*) from payments where company_id = :companyId or invoice_id like :likeNs or reference like :likeNs)
    + (select count(*) from stock_movements where company_id = :companyId or reference_id like :likeNs or product_id like :likeNs or asset_id like :likeNs)
    + (select count(*) from settings where company_id = :companyId)
    + (select count(*) from technical_account_sessions where company_id = :companyId or user_id like :likeNs)
    + (select count(*) from employee_operational_sessions where company_id = :companyId or id like :likeNs)
    + (select count(*) from employee_verification_attempts where company_id = :companyId or id like :likeNs)
    + (select count(*) from invoice_print_events where company_id = :companyId or id like :likeNs)
    + (select count(*) from audit_logs where company_id = :companyId or id like :likeNs or source_document like :likeNs)
    + (select count(*) from notifications where company_id = :companyId or id like :likeNs or entity_id like :likeNs)
    + (select count(*) from idempotency_requests where company_id = :companyId or key like :likeNs)
    as total
  `, { replacements: { companyId: ids.company, likeNs: `%${ns}%` } });
  return Number(rows[0].total || 0);
}

async function cleanupNamespace() {
  if (!models) return;
  const replacements = { companyId: ids.company, likeNs: `%${ns}%` };
  await models.sequelize.query("delete from invoice_print_events where company_id = :companyId or id like :likeNs or invoice_id like :likeNs", { replacements });
  await models.sequelize.query("delete from notifications where company_id = :companyId or id like :likeNs or entity_id like :likeNs or message like :likeNs", { replacements });
  await models.sequelize.query("delete from idempotency_requests where company_id = :companyId or key like :likeNs", { replacements });
  await models.sequelize.query("delete from audit_logs where company_id = :companyId or id like :likeNs or source_document like :likeNs or description like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_operational_sessions where company_id = :companyId or id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_verification_attempts where company_id = :companyId or id like :likeNs or employee_code_normalized like :likeNs", { replacements });
  await models.sequelize.query("delete from cash_transactions where company_id = :companyId or reference like :likeNs", { replacements });
  await models.sequelize.query("delete from journal_lines where journal_entry_id in (select id from journal_entries where company_id = :companyId or source_id like :likeNs or description like :likeNs)", { replacements });
  await models.sequelize.query("delete from journal_entries where company_id = :companyId or source_id like :likeNs or description like :likeNs", { replacements });
  await models.sequelize.query("delete from loyalty_transactions where company_id = :companyId or invoice_id like :likeNs or customer_id like :likeNs", { replacements });
  await models.sequelize.query("delete from installments where company_id = :companyId or invoice_id like :likeNs or customer_id like :likeNs", { replacements });
  await models.sequelize.query("delete from payments where company_id = :companyId or invoice_id like :likeNs or id like :likeNs or reference like :likeNs", { replacements });
  await models.sequelize.query("delete from invoice_items where invoice_id like :likeNs or asset_id like :likeNs", { replacements });
  await models.sequelize.query("delete from asset_events where asset_id like :likeNs or source_document like :likeNs or note like :likeNs or reason like :likeNs", { replacements });
  await models.sequelize.query("delete from invoices where company_id = :companyId or id like :likeNs or invoice_number like :likeNs", { replacements });
  await models.sequelize.query("delete from stock_movements where company_id = :companyId or reference_id like :likeNs or product_id like :likeNs or asset_id like :likeNs", { replacements });
  await models.sequelize.query("delete from products where company_id = :companyId or id like :likeNs or product_code like :likeNs", { replacements });
  await models.sequelize.query("delete from assets where company_id = :companyId or id like :likeNs or barcode like :likeNs", { replacements });
  await models.sequelize.query("delete from settings where company_id = :companyId", { replacements });
  await models.sequelize.query("delete from technical_account_sessions where company_id = :companyId or user_id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_permission_grants where company_id = :companyId or employee_id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_permission_denials where company_id = :companyId or employee_id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_role_assignments where company_id = :companyId or employee_id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_credentials where company_id = :companyId or employee_id like :likeNs or id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_branch_access where company_id = :companyId or employee_id like :likeNs or id like :likeNs", { replacements });
  await models.sequelize.query("delete from employees where company_id = :companyId or id like :likeNs or employee_code like :likeNs", { replacements });
  await models.sequelize.query("delete from user_roles where user_id like :likeNs or role_id like :likeNs", { replacements });
  await models.sequelize.query("delete from role_permissions where role_id like :likeNs", { replacements });
  await models.sequelize.query("delete from roles where company_id = :companyId or id like :likeNs or slug like :likeNs", { replacements });
  await models.sequelize.query("delete from users where company_id = :companyId or id like :likeNs or email like :likeNs", { replacements });
  await models.sequelize.query("delete from customers where company_id = :companyId or id like :likeNs or name like :likeNs", { replacements });
  await models.sequelize.query("delete from branches where company_id = :companyId or id like :likeNs", { replacements });
  await models.sequelize.query("delete from companies where id = :companyId", { replacements });
}

(async () => {
  staticContract();
  await runLiveHttpVerifier();
  console.log("SALES/POS OPERATOR ENFORCEMENT PASSED");
})().catch(async (error) => {
  console.error(error);
  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (models?.sequelize) await models.sequelize.close();
  } catch (_) {
    // best-effort shutdown
  }
  process.exit(1);
});
