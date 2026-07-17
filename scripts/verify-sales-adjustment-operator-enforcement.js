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
  const access = read("backend/src/bootstrap/accessControl.js");
  const policy = read("backend/src/services/sales-operator-policy.service.js");
  const routes = read("backend/src/routes/erp.routes.js");
  const catalog = read("lib/permissions/catalog.ts");
  const returnUi = read("app/[locale]/(dashboard)/sales/returns/page.tsx");
  const exchangeUi = read("app/[locale]/(dashboard)/sales/exchanges/page.tsx");
  const installmentsUi = read("app/[locale]/(dashboard)/sales/installments/page.tsx");

  for (const permission of ["sales.returns.execute", "sales.exchanges.execute", "sales.installments.collect"]) {
    assertIncludes(access, permission, "backend access-control catalog");
    assertIncludes(catalog, permission, "frontend permission catalog");
  }
  for (const token of [
    "تنفيذ مرتجعات المبيعات",
    "Execute Sales Returns",
    "تنفيذ استبدال المبيعات",
    "Execute Sales Exchanges",
    "تحصيل الأقساط",
    "Collect Installments"
  ]) assertIncludes(catalog, token, "localized permission catalog");

  for (const [operation, permission, level] of [
    ["sales.return.execute", "sales.returns.execute", "level: 2"],
    ["sales.exchange.execute", "sales.exchanges.execute", "level: 2"],
    ["sales.installment.collect", "sales.installments.collect", "level: 2"]
  ]) {
    assertIncludes(policy, operation, `policy ${operation}`);
    assertIncludes(policy, permission, `policy ${operation}`);
    assertIncludes(policy, level, `policy ${operation}`);
  }

  for (const token of [
    'requireSalesCommandAccess("sales.return.execute"',
    'requireSalesCommandAccess("sales.exchange.preview"',
    'requireSalesCommandAccess("sales.exchange.execute"',
    'requireSalesCommandAccess("sales.installment.collect"',
    "idempotencyBodyWithActor",
    "finalizedByEmployeeId: commandActor.employeeId || null",
    "createdByEmployeeId: commandActor.employeeId || null",
    "receivedByEmployeeId: commandActor.employeeId || null",
    "commandActorContext.attachAuditActor"
  ]) assertIncludes(routes, token, "ERP routes");

  assert.ok(!routes.includes('router.post("/sales/returns", authMiddleware, requirePermission("sales.create")'), "returns are not gated by generic technical permission before operator policy");
  assert.ok(!routes.includes('router.post("/sales/exchanges", authMiddleware, requirePermission("sales.create")'), "exchanges are not gated by generic technical permission before operator policy");
  assert.ok(!routes.includes('router.post("/installments/:id/pay", authMiddleware, async'), "installment collection is not auth-only");

  assertIncludes(returnUi, "canExecuteReturns", "return frontend operator compatibility");
  assertIncludes(returnUi, "sales return permission", "return frontend localized denial");
  assertIncludes(exchangeUi, "canExecuteExchanges", "exchange frontend operator compatibility");
  assertIncludes(exchangeUi, "sales exchange permission", "exchange frontend localized denial");
  assertIncludes(installmentsUi, "canCollectInstallments", "installments frontend operator compatibility");
  assertIncludes(installmentsUi, "installment collection permission", "installments frontend localized denial");

  console.log("Phase 34.5B static Sales adjustment operator-enforcement contract: PASS");
}

require(path.join(BACKEND, "node_modules/dotenv")).config({ path: path.join(BACKEND, ".env") });

function assertLocalEnvironment() {
  if (process.env.NODE_ENV === "production" || process.env.RENDER || process.env.VERCEL) throw new Error("Refusing production verification");
  if (process.env.DATABASE_URL && !/localhost|127\.0\.0\.1|5433/.test(process.env.DATABASE_URL)) throw new Error("Refusing non-local DATABASE_URL");
  if (process.env.DB_NAME && process.env.DB_NAME !== "darfus_erp") throw new Error(`Refusing DB ${process.env.DB_NAME}`);
  if (process.env.DB_HOST && !["localhost", "127.0.0.1"].includes(process.env.DB_HOST)) throw new Error(`Refusing DB host ${process.env.DB_HOST}`);
  if (process.env.DB_PORT && String(process.env.DB_PORT) !== "5433") throw new Error(`Refusing DB port ${process.env.DB_PORT}`);
}

let models;
let bcrypt;
let jwt;
let JWT_SECRET;
let Op;
let server;
let baseUrl;

const ns = `T345B-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const pin = "258036";
const ids = {
  company: `CMP-${ns}`,
  branchA: `BR-${ns}-A`,
  branchB: `BR-${ns}-B`,
  branchLegacy: `BR-${ns}-LEGACY`
};
const state = { roles: {}, users: {}, tokens: {}, employees: {}, devices: 0 };

async function databaseContract() {
  const { ensurePermissions } = require(path.join(BACKEND, "src/bootstrap/accessControl"));
  await ensurePermissions();
  const [[connection]] = await models.sequelize.query("select current_database() as database, inet_server_addr()::text as server_addr, inet_server_port()::int as server_port");
  assert.equal(connection.database, "darfus_erp", "connected database is darfus_erp");
  const [migrations] = await models.sequelize.query('select count(*)::int c from "SequelizeMeta"');
  assert.equal(Number(migrations[0].c), 43, "migration count is 43 after HF5B");
  assert.equal(await models.Permission.count(), 123, "permission count is 123");
  assert.equal(await models.Permission.count({ where: { name: ["sales.returns.execute", "sales.exchanges.execute", "sales.installments.collect"] } }), 3, "all three Phase 34.5B permissions exist");
  assert.equal(await models.Permission.count({ where: { name: ["pos.view", "pos.sell", "pos.discount.approve"] } }), 3, "POS permissions unchanged");
  assert.equal(await models.Permission.count({ where: { name: { [Op.like]: "gold_purchase.%" } } }), 24, "Gold Purchase permissions unchanged");
  console.log("Phase 34.5B DB permission contract: PASS");
}

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
  state.devices += 1;
  return `DEV-${ns}-${label}-${state.devices}`;
}

async function request(method, urlPath, { token, branchId = ids.branchA, deviceId, body, idempotencyKey } = {}) {
  const headers = {
    "Content-Type": "application/json",
    "X-Company-ID": ids.company,
    "X-Correlation-ID": `COR-${ns}`
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
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: response.status, body: json, text };
}

function codeOf(res) {
  return res.body?.code || res.body?.error?.code || res.body?.errorCode || null;
}

function dataOf(res) {
  return res.body?.data || res.body || {};
}

async function expectError(promise, status, code, label) {
  const res = await promise;
  assert.equal(res.status, status, `${label} status`);
  assert.equal(codeOf(res), code, `${label} code`);
  return res;
}

async function ensureRole(slug, permissionNames) {
  const role = await models.Role.create({
    id: `ROLE-${ns}-${slug}`,
    companyId: ids.company,
    name: `${ns} ${slug}`,
    slug: `${ns}-${slug}`,
    isSystem: false,
    isAdmin: false
  });
  const permissions = await models.Permission.findAll({ where: { name: permissionNames } });
  assert.equal(permissions.length, permissionNames.length, `all permissions exist for ${slug}`);
  await models.RolePermission.bulkCreate(permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })));
  state.roles[slug] = role;
  return role;
}

async function createUser(key, roleKey, branchId = ids.branchA, options = {}) {
  const user = await models.User.create({
    id: `USR-${ns}-${key}`,
    companyId: ids.company,
    firstName: ns,
    lastName: key,
    email: `${ns}-${key}@example.test`.toLowerCase(),
    password: "not-used",
    role: options.legacyRole || "sales",
    accountType: options.accountType || "legacy",
    branchId: options.accountType === "super_admin" ? null : branchId
  });
  await models.UserRole.create({ userId: user.id, roleId: state.roles[roleKey].id });
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

async function createEmployee(key, permissions, { branches = [ids.branchA], denials = [] } = {}) {
  const employee = await models.Employee.create({
    id: `EMP-${ns}-${key}`,
    companyId: ids.company,
    name: `${ns} ${key}`,
    employeeCode: `${ns}-${key}`,
    employeeCodeNormalized: `${ns}-${key}`.normalize("NFKC").toUpperCase(),
    role: "sales",
    systemRole: "sales",
    branch: branches[0],
    branchId: branches[0],
    status: "present",
    email: `${ns}-${key}@employee.test`,
    joinDate: "2026-07-15"
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
    validTo: null
  })));
  if (permissions.length) await grantEmployee(employee.id, permissions);
  if (denials.length) await grantEmployee(employee.id, denials, { deny: true });
  state.employees[key] = employee;
  return employee;
}

async function verifyOperator({ user = "branchShell", employee, branchId = ids.branchA, level = 1, permission = null, operation = null, deviceId = nextDevice(employee) }) {
  const res = await request("POST", "/operator/verify", {
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
  assert.equal(res.status, 200, `operator verify ${employee}`);
  assert.equal(dataOf(res).operatorSession.employee.id, state.employees[employee].id, `operator session employee for ${employee}`);
  return deviceId;
}

async function createCustomer(key) {
  return models.Customer.create({
    id: `CUS-${ns}-${key}`,
    companyId: ids.company,
    name: `${ns} Customer ${key}`,
    phone: `555-${Math.floor(Math.random() * 100000)}`,
    email: `${ns}-${key}@customer.test`,
    balance: 0,
    purchases: 0,
    branch: ids.branchA
  });
}

async function createProduct(key, branchId = ids.branchA, { available = 1, sold = 0, price = 100, cost = 40 } = {}) {
  return models.Product.create({
    id: `PROD-${ns}-${key}`,
    companyId: ids.company,
    productCode: `PC-${ns}-${key}`.slice(0, 80),
    productName: `${ns} Product ${key}`,
    description: ns,
    karat: 21,
    stockType: "jewellery",
    branchId,
    branchName: branchId,
    quantityOnHand: available,
    quantityAvailable: available,
    quantitySold: sold,
    quantityReserved: 0,
    totalWeight: available + sold,
    averageUnitWeight: 1,
    unitCost: cost,
    averageCost: cost,
    salePrice: price,
    isActive: true
  });
}

async function createPostedProductInvoice(key, { customer, product, branchId = ids.branchA, type = "sale", total = 100, paid = 100, remaining = 0 } = {}) {
  const invoice = await models.Invoice.create({
    id: `INV-${ns}-${key}`,
    companyId: ids.company,
    branchId,
    branch: branchId,
    customerId: customer.id,
    customerName: customer.name,
    type,
    date: "2026-07-15",
    subtotal: total,
    tax: 0,
    vatRate: 0,
    total,
    status: remaining > 0 ? "partial" : "paid",
    paymentMethod: "Cash",
    paidAmount: paid,
    remainingAmount: remaining,
    postingStatus: "posted",
    invoiceNumber: `INV-${ns}-${key}`,
    postedAt: "2026-07-15 10:00"
  });
  await models.InvoiceItem.create({
    invoiceId: invoice.id,
    assetId: product.id,
    name: product.productName,
    quantity: 1,
    price: total,
    cost: Number(product.unitCost || 0),
    weight: 1,
    karat: 21
  });
  return invoice;
}

async function createInstallmentFixture(key, { customer, branchId = ids.branchA, amount = 90 } = {}) {
  const invoice = await models.Invoice.create({
    id: `INV-${ns}-INST-${key}`,
    companyId: ids.company,
    branchId,
    branch: branchId,
    customerId: customer.id,
    customerName: customer.name,
    type: "installment",
    date: "2026-07-15",
    subtotal: amount,
    tax: 0,
    vatRate: 0,
    total: amount,
    status: "partial",
    paymentMethod: "Installment",
    paidAmount: 0,
    remainingAmount: amount,
    postingStatus: "posted",
    invoiceNumber: `INV-${ns}-INST-${key}`,
    postedAt: "2026-07-15 10:00"
  });
  const inst = await models.Installment.create({
    id: `INS-${ns}-${key}`,
    companyId: ids.company,
    invoiceId: invoice.id,
    customerId: customer.id,
    customerName: customer.name,
    sequence: 1,
    dueDate: "2026-08-15",
    amount,
    paidAmount: 0,
    status: "pending",
    branch: branchId
  });
  return { invoice, inst };
}

async function businessCounts() {
  const invoiceIds = (await models.Invoice.findAll({ where: { companyId: ids.company }, attributes: ["id"], raw: true })).map((r) => r.id);
  const invoiceWhere = invoiceIds.length ? { invoiceId: invoiceIds } : { invoiceId: "__none__" };
  const journalRows = await models.JournalEntry.findAll({ where: { companyId: ids.company }, attributes: ["id"], raw: true });
  const journalIds = journalRows.map((r) => r.id);
  return {
    invoices: await models.Invoice.count({ where: { companyId: ids.company } }),
    invoiceItems: await models.InvoiceItem.count({ where: invoiceWhere }),
    payments: await models.Payment.count({ where: { companyId: ids.company } }),
    installments: await models.Installment.count({ where: { companyId: ids.company } }),
    cashTransactions: await models.CashTransaction.count({ where: { companyId: ids.company } }),
    stockMovements: await models.StockMovement.count({ where: { companyId: ids.company } }),
    journalEntries: journalIds.length,
    journalLines: journalIds.length ? await models.JournalLine.count({ where: { journalEntryId: journalIds } }) : 0,
    customerCreditTransactions: await models.CustomerCreditTransaction.count({ where: { companyId: ids.company } }),
    notifications: await models.Notification.count({ where: { companyId: ids.company } }),
    printEvents: await models.InvoicePrintEvent.count({ where: { companyId: ids.company } }),
    idempotency: await models.IdempotencyRequest.count({ where: { companyId: ids.company, key: { [Op.like]: `%${ns}%` } } }),
    auditLogs: await models.AuditLog.count({ where: { companyId: ids.company } })
  };
}

function diffCounts(before, after) {
  return Object.fromEntries(Object.keys(after).map((key) => [key, Number(after[key]) - Number(before[key] || 0)]));
}

async function assertNoBusinessMutation(before, label) {
  const after = await businessCounts();
  const diff = diffCounts(before, after);
  for (const key of ["invoices", "invoiceItems", "payments", "installments", "cashTransactions", "stockMovements", "journalEntries", "journalLines", "customerCreditTransactions", "notifications", "printEvents"]) {
    assert.equal(diff[key], 0, `${label} must not change ${key}`);
  }
  return after;
}

async function createFixtures() {
  await models.Company.create({ id: ids.company, businessName: `${ns} Company`, workspace: `${ns.toLowerCase()}-workspace`, currency: "AED", branchName: "Main" });
  await models.Branch.bulkCreate([
    { id: ids.branchA, companyId: ids.company, name: `${ns} Branch A`, code: `${ns}-A`.slice(0, 30), type: "store", isActive: true },
    { id: ids.branchB, companyId: ids.company, name: `${ns} Branch B`, code: `${ns}-B`.slice(0, 30), type: "store", isActive: true },
    { id: ids.branchLegacy, companyId: ids.company, name: `${ns} Legacy`, code: `${ns}-L`.slice(0, 30), type: "store", isActive: true }
  ]);
  await ensureRole("full", ["sales.view", "sales.create", "sales.print", "sales.returns.execute", "sales.exchanges.execute", "sales.installments.collect"]);
  await ensureRole("salesOnly", ["sales.view", "sales.create", "sales.print"]);
  await ensureRole("noSales", ["sales.view"]);

  await createUser("full", "full", ids.branchA);
  await createUser("noSales", "noSales", ids.branchA);
  await createUser("branchShell", "full", ids.branchA, { accountType: "branch_shell", legacyRole: "admin" });
  await createUser("superAdmin", "full", null, { accountType: "super_admin", legacyRole: "admin" });
  await createUser("legacyFull", "full", ids.branchLegacy);

  await createEmployee("adjustments", ["sales.create", "sales.print", "sales.returns.execute", "sales.exchanges.execute", "sales.installments.collect"], { branches: [ids.branchA, ids.branchB, ids.branchLegacy] });
  await createEmployee("levelOnly", ["sales.create"], { branches: [ids.branchA] });
  await createEmployee("deniedReturn", ["sales.returns.execute"], { branches: [ids.branchA], denials: ["sales.returns.execute"] });
  await createEmployee("deniedExchange", ["sales.exchanges.execute"], { branches: [ids.branchA], denials: ["sales.exchanges.execute"] });
  await createEmployee("deniedInstallment", ["sales.installments.collect"], { branches: [ids.branchA], denials: ["sales.installments.collect"] });

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

function returnBody(invoice, itemId) {
  return { originalInvoiceId: invoice.id, returnedInvoiceItemIds: [itemId], reason: `${ns} return` };
}

function exchangeBody(invoice, itemId, replacement) {
  return {
    originalInvoiceId: invoice.id,
    returnedInvoiceItemId: itemId,
    newItems: [{ type: "product", id: replacement.id, quantity: 1 }],
    paymentMethod: "Exchange",
    notes: `${ns} exchange`
  };
}

async function invoiceItemId(invoiceId) {
  const item = await models.InvoiceItem.findOne({ where: { invoiceId } });
  assert.ok(item, `invoice item exists for ${invoiceId}`);
  return item.id;
}

async function testBranchShellReturn() {
  const permissionService = require(path.join(BACKEND, "src/services/permission.service"));
  const branchShellPermissions = await permissionService.getUserPermissionNames(state.users.branchShell);
  assert.equal(branchShellPermissions.includes("sales.returns.execute"), false, "Branch Shell has no direct return User permission");
  const customer = await createCustomer("return");
  const sold = await createProduct("return-sold", ids.branchA, { available: 0, sold: 1 });
  const invoice = await createPostedProductInvoice("RETURN", { customer, product: sold });
  const itemId = await invoiceItemId(invoice.id);

  const beforeNoEmployee = await businessCounts();
  await expectError(request("POST", "/sales/returns", {
    token: state.tokens.branchShell,
    body: returnBody(invoice, itemId),
    idempotencyKey: `IDEM-${ns}-return-no-employee`
  }), 401, "BRANCH_ACCOUNT_EMPLOYEE_REQUIRED", "return without Employee");
  await assertNoBusinessMutation(beforeNoEmployee, "return no Employee denial");

  const level1Device = await verifyOperator({ employee: "adjustments", level: 1 });
  const beforeLevel1 = await businessCounts();
  await expectError(request("POST", "/sales/returns", {
    token: state.tokens.branchShell,
    deviceId: level1Device,
    body: returnBody(invoice, itemId),
    idempotencyKey: `IDEM-${ns}-return-level1`
  }), 403, "OPERATOR_STEP_UP_REQUIRED", "return Level 1 denied");
  await assertNoBusinessMutation(beforeLevel1, "return Level 1 denial");

  const deniedDevice = await verifyOperator({ employee: "deniedReturn", level: 2 });
  const beforeDenied = await businessCounts();
  await expectError(request("POST", "/sales/returns", {
    token: state.tokens.branchShell,
    deviceId: deniedDevice,
    body: returnBody(invoice, itemId),
    idempotencyKey: `IDEM-${ns}-return-denied`
  }), 403, "OPERATOR_PERMISSION_DENIED", "return direct denial");
  await assertNoBusinessMutation(beforeDenied, "return direct denial");

  const branchMismatchBefore = await businessCounts();
  await expectError(request("POST", "/sales/returns", {
    token: state.tokens.branchShell,
    branchId: ids.branchB,
    deviceId: deniedDevice,
    body: { ...returnBody(invoice, itemId), branchId: ids.branchB },
    idempotencyKey: `IDEM-${ns}-return-branch`
  }), 403, "BRANCH_ACCOUNT_FIXED_SCOPE", "return branch mismatch");
  await assertNoBusinessMutation(branchMismatchBefore, "return branch mismatch");

  const level2Device = await verifyOperator({ employee: "adjustments", level: 2 });
  const success = await request("POST", "/sales/returns", {
    token: state.tokens.branchShell,
    deviceId: level2Device,
    body: returnBody(invoice, itemId),
    idempotencyKey: `IDEM-${ns}-return-success`
  });
  assert.equal(success.status, 201, "return succeeds with Employee Level 2");
  const returnInvoiceId = dataOf(success).id;
  const returnInvoice = await models.Invoice.findByPk(returnInvoiceId);
  assert.equal(returnInvoice.finalizedByEmployeeId, state.employees.adjustments.id, "return invoice finalized by Employee");
  assert.equal(returnInvoice.createdByEmployeeId, state.employees.adjustments.id, "return invoice created by Employee");

  const replay = await request("POST", "/sales/returns", {
    token: state.tokens.branchShell,
    deviceId: level2Device,
    body: returnBody(invoice, itemId),
    idempotencyKey: `IDEM-${ns}-return-success`
  });
  assert.equal(replay.status, 201, "same Employee return replay succeeds");

  const otherDevice = await verifyOperator({ user: "full", employee: "adjustments", level: 2 });
  const conflict = await request("POST", "/sales/returns", {
    token: state.tokens.full,
    deviceId: otherDevice,
    body: returnBody(invoice, itemId),
    idempotencyKey: `IDEM-${ns}-return-success`
  });
  assert.equal(conflict.status, 409, "different technical actor with same return idempotency key conflicts");
}

async function testBranchShellExchange() {
  const customer = await createCustomer("exchange");
  const sold = await createProduct("exchange-sold", ids.branchA, { available: 0, sold: 1, price: 100 });
  const replacement = await createProduct("exchange-new", ids.branchA, { available: 2, sold: 0, price: 100 });
  const invoice = await createPostedProductInvoice("EXCHANGE", { customer, product: sold });
  const itemId = await invoiceItemId(invoice.id);

  const previewDevice = await verifyOperator({ employee: "levelOnly", level: 1 });
  const preview = await request("POST", "/sales/exchanges/preview", {
    token: state.tokens.branchShell,
    deviceId: previewDevice,
    body: exchangeBody(invoice, itemId, replacement)
  });
  assert.equal(preview.status, 200, "exchange preview succeeds with Level 1 read policy");

  const beforeNoEmployee = await businessCounts();
  await expectError(request("POST", "/sales/exchanges", {
    token: state.tokens.branchShell,
    body: exchangeBody(invoice, itemId, replacement),
    idempotencyKey: `IDEM-${ns}-exchange-no-employee`
  }), 401, "BRANCH_ACCOUNT_EMPLOYEE_REQUIRED", "exchange without Employee");
  await assertNoBusinessMutation(beforeNoEmployee, "exchange no Employee denial");

  const beforeLevel1 = await businessCounts();
  await expectError(request("POST", "/sales/exchanges", {
    token: state.tokens.branchShell,
    deviceId: previewDevice,
    body: exchangeBody(invoice, itemId, replacement),
    idempotencyKey: `IDEM-${ns}-exchange-level1`
  }), 403, "OPERATOR_STEP_UP_REQUIRED", "exchange Level 1 denied");
  await assertNoBusinessMutation(beforeLevel1, "exchange Level 1 denial");

  const deniedDevice = await verifyOperator({ employee: "deniedExchange", level: 2 });
  const beforeDenied = await businessCounts();
  await expectError(request("POST", "/sales/exchanges", {
    token: state.tokens.branchShell,
    deviceId: deniedDevice,
    body: exchangeBody(invoice, itemId, replacement),
    idempotencyKey: `IDEM-${ns}-exchange-denied`
  }), 403, "OPERATOR_PERMISSION_DENIED", "exchange direct denial");
  await assertNoBusinessMutation(beforeDenied, "exchange direct denial");

  const level2Device = await verifyOperator({ employee: "adjustments", level: 2 });
  const success = await request("POST", "/sales/exchanges", {
    token: state.tokens.branchShell,
    deviceId: level2Device,
    body: exchangeBody(invoice, itemId, replacement),
    idempotencyKey: `IDEM-${ns}-exchange-success`
  });
  assert.equal(success.status, 201, "exchange succeeds with Employee Level 2");
  const exchangeInvoice = await models.Invoice.findByPk(dataOf(success).id);
  assert.equal(exchangeInvoice.finalizedByEmployeeId, state.employees.adjustments.id, "exchange invoice finalized by Employee");

  const replay = await request("POST", "/sales/exchanges", {
    token: state.tokens.branchShell,
    deviceId: level2Device,
    body: exchangeBody(invoice, itemId, replacement),
    idempotencyKey: `IDEM-${ns}-exchange-success`
  });
  assert.equal(replay.status, 201, "same Employee exchange replay succeeds");
}

async function testInstallmentCollection() {
  const customer = await createCustomer("installment");
  const { invoice, inst } = await createInstallmentFixture("COLLECT", { customer, amount: 90 });

  const beforeNoEmployee = await businessCounts();
  await expectError(request("POST", `/installments/${inst.id}/pay`, {
    token: state.tokens.branchShell,
    body: { amount: 90, paymentMethod: "Cash" },
    idempotencyKey: `IDEM-${ns}-installment-no-employee`
  }), 401, "BRANCH_ACCOUNT_EMPLOYEE_REQUIRED", "installment without Employee");
  await assertNoBusinessMutation(beforeNoEmployee, "installment no Employee denial");

  const level1Device = await verifyOperator({ employee: "adjustments", level: 1 });
  const beforeLevel1 = await businessCounts();
  await expectError(request("POST", `/installments/${inst.id}/pay`, {
    token: state.tokens.branchShell,
    deviceId: level1Device,
    body: { amount: 90, paymentMethod: "Cash" },
    idempotencyKey: `IDEM-${ns}-installment-level1`
  }), 403, "OPERATOR_STEP_UP_REQUIRED", "installment Level 1 denied");
  await assertNoBusinessMutation(beforeLevel1, "installment Level 1 denial");

  const deniedDevice = await verifyOperator({ employee: "deniedInstallment", level: 2 });
  const beforeDenied = await businessCounts();
  await expectError(request("POST", `/installments/${inst.id}/pay`, {
    token: state.tokens.branchShell,
    deviceId: deniedDevice,
    body: { amount: 90, paymentMethod: "Cash" },
    idempotencyKey: `IDEM-${ns}-installment-denied`
  }), 403, "OPERATOR_PERMISSION_DENIED", "installment direct denial");
  await assertNoBusinessMutation(beforeDenied, "installment direct denial");

  const level2Device = await verifyOperator({ employee: "adjustments", level: 2 });
  const success = await request("POST", `/installments/${inst.id}/pay`, {
    token: state.tokens.branchShell,
    deviceId: level2Device,
    body: { amount: 90, paymentMethod: "Cash" },
    idempotencyKey: `IDEM-${ns}-installment-success`
  });
  assert.equal(success.status, 200, "installment collection succeeds with Employee Level 2");
  const payment = await models.Payment.findOne({ where: { companyId: ids.company, invoiceId: invoice.id } });
  assert.ok(payment, "installment payment persisted");
  assert.equal(payment.receivedByEmployeeId, state.employees.adjustments.id, "installment payment attributed to Employee");

  const replay = await request("POST", `/installments/${inst.id}/pay`, {
    token: state.tokens.branchShell,
    deviceId: level2Device,
    body: { amount: 90, paymentMethod: "Cash" },
    idempotencyKey: `IDEM-${ns}-installment-success`
  });
  assert.equal(replay.status, 409, "paid installment duplicate is blocked before duplicate payment");
}

async function testLegacyAndSuperAdmin() {
  const customer = await createCustomer("legacy-super");
  const sold = await createProduct("legacy-return", ids.branchLegacy, { available: 0, sold: 1 });
  const invoice = await createPostedProductInvoice("LEGACY-RETURN", { customer, product: sold, branchId: ids.branchLegacy });
  const itemId = await invoiceItemId(invoice.id);
  const legacy = await request("POST", "/sales/returns", {
    token: state.tokens.legacyFull,
    branchId: ids.branchLegacy,
    body: returnBody(invoice, itemId),
    idempotencyKey: `IDEM-${ns}-legacy-return`
  });
  assert.equal(legacy.status, 201, "legacy return preserves technical permission behavior without forced Employee in legacy branch");

  const superCustomer = await createCustomer("super");
  const superSold = await createProduct("super-exchange-sold", ids.branchA, { available: 0, sold: 1 });
  const superNew = await createProduct("super-exchange-new", ids.branchA, { available: 2, sold: 0 });
  const superInvoice = await createPostedProductInvoice("SUPER-EXCHANGE", { customer: superCustomer, product: superSold });
  const superItemId = await invoiceItemId(superInvoice.id);
  const ok = await request("POST", "/sales/exchanges", {
    token: state.tokens.superAdmin,
    body: exchangeBody(superInvoice, superItemId, superNew),
    idempotencyKey: `IDEM-${ns}-super-exchange-success`
  });
  assert.equal(ok.status, 201, "Super Admin exchange succeeds without Employee authority");
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
    + (select count(*) from invoices where company_id = :companyId or id like :likeNs or invoice_number like :likeNs)
    + (select count(*) from payments where company_id = :companyId or invoice_id like :likeNs or reference like :likeNs)
    + (select count(*) from installments where company_id = :companyId or invoice_id like :likeNs)
    + (select count(*) from cash_transactions where company_id = :companyId or reference like :likeNs)
    + (select count(*) from stock_movements where company_id = :companyId or reference_id like :likeNs or product_id like :likeNs)
    + (select count(*) from journal_entries where company_id = :companyId or source_id like :likeNs)
    + (select count(*) from customer_credit_transactions where company_id = :companyId or source_id like :likeNs or invoice_id like :likeNs)
    + (select count(*) from settings where company_id = :companyId)
    + (select count(*) from technical_account_sessions where company_id = :companyId or user_id like :likeNs)
    + (select count(*) from employee_operational_sessions where company_id = :companyId or id like :likeNs)
    + (select count(*) from employee_verification_attempts where company_id = :companyId or id like :likeNs)
    + (select count(*) from invoice_print_events where company_id = :companyId or invoice_id like :likeNs)
    + (select count(*) from audit_logs where company_id = :companyId or source_document like :likeNs or description like :likeNs)
    + (select count(*) from notifications where company_id = :companyId or entity_id like :likeNs or message like :likeNs)
    + (select count(*) from idempotency_requests where company_id = :companyId or key like :likeNs)
    as total
  `, { replacements: { companyId: ids.company, likeNs: `%${ns}%` } });
  return Number(rows[0].total || 0);
}

async function cleanupNamespace() {
  if (!models) return;
  const replacements = { companyId: ids.company, likeNs: `%${ns}%` };
  await models.sequelize.query("delete from invoice_print_events where company_id = :companyId or invoice_id like :likeNs", { replacements });
  await models.sequelize.query("delete from notifications where company_id = :companyId or entity_id like :likeNs or message like :likeNs", { replacements });
  await models.sequelize.query("delete from idempotency_requests where company_id = :companyId or key like :likeNs", { replacements });
  await models.sequelize.query("delete from audit_logs where company_id = :companyId or source_document like :likeNs or description like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_operational_sessions where company_id = :companyId or id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_verification_attempts where company_id = :companyId or id like :likeNs or employee_code_normalized like :likeNs", { replacements });
  await models.sequelize.query("delete from cash_transactions where company_id = :companyId or reference like :likeNs", { replacements });
  await models.sequelize.query("delete from journal_lines where journal_entry_id in (select id from journal_entries where company_id = :companyId or source_id like :likeNs)", { replacements });
  await models.sequelize.query("delete from journal_entries where company_id = :companyId or source_id like :likeNs", { replacements });
  await models.sequelize.query("delete from customer_credit_transactions where company_id = :companyId or source_id like :likeNs or invoice_id like :likeNs", { replacements });
  await models.sequelize.query("delete from payments where company_id = :companyId or invoice_id like :likeNs or id like :likeNs or reference like :likeNs", { replacements });
  await models.sequelize.query("delete from installments where company_id = :companyId or invoice_id like :likeNs or customer_id like :likeNs", { replacements });
  await models.sequelize.query("delete from invoice_items where invoice_id like :likeNs or asset_id like :likeNs", { replacements });
  await models.sequelize.query("delete from invoices where company_id = :companyId or id like :likeNs or invoice_number like :likeNs", { replacements });
  await models.sequelize.query("delete from stock_movements where company_id = :companyId or reference_id like :likeNs or product_id like :likeNs", { replacements });
  await models.sequelize.query("delete from products where company_id = :companyId or id like :likeNs or product_code like :likeNs", { replacements });
  await models.sequelize.query("delete from settings where company_id = :companyId", { replacements });
  await models.sequelize.query("delete from technical_account_sessions where company_id = :companyId or user_id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_permission_grants where company_id = :companyId or employee_id like :likeNs", { replacements });
  await models.sequelize.query("delete from employee_permission_denials where company_id = :companyId or employee_id like :likeNs", { replacements });
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

async function runLiveHttpVerifier() {
  assertLocalEnvironment();
  models = require(path.join(BACKEND, "src/models"));
  jwt = require(path.join(BACKEND, "node_modules/jsonwebtoken"));
  bcrypt = require(path.join(BACKEND, "node_modules/bcryptjs"));
  Op = require(path.join(BACKEND, "node_modules/sequelize")).Op;
  JWT_SECRET = require(path.join(BACKEND, "src/config/security")).JWT_SECRET;
  models.sequelize.options.logging = false;
  await databaseContract();
  const app = require(path.join(BACKEND, "src/app"));
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    await createFixtures();
    await testBranchShellReturn();
    await testBranchShellExchange();
    await testInstallmentCollection();
    await testLegacyAndSuperAdmin();
    console.log("LIVE HTTP SALES ADJUSTMENT TESTS EXECUTED");
    console.log("SALES ADJUSTMENT OPERATOR ENFORCEMENT PASSED");
  } finally {
    await cleanupNamespace();
    const remaining = await namespaceCount();
    assert.equal(remaining, 0, "namespace cleanup must leave zero persistent test records");
    console.log("No persistent sales adjustment test pollution detected");
    await new Promise((resolve) => server.close(resolve));
    await models.sequelize.close();
  }
}

(async () => {
  staticContract();
  await runLiveHttpVerifier();
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
