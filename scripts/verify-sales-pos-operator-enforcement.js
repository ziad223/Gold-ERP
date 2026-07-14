#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
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

  for (const [operation, permission, level] of [
    ["sales.draft.create", "sales.create", "level: 1"],
    ["sales.draft.update", "sales.create", "level: 1"],
    ["sales.draft.cancel", "sales.create", "level: 1"],
    ["sales.post", "sales.create", "level: 2"],
    ["sales.legacy_immediate_post", "sales.create", "level: 2"],
    ["pos.checkout", "pos.sell", "level: 2"],
    ["pos.discount.override", "pos.discount.approve", "level: 2"],
    ["sales.official_print", "sales.print", "level: 2"],
    ["sales.reprint", "sales.print", "level: 2"]
  ]) {
    assertIncludes(policy, operation, "sales operator policy");
    assertIncludes(policy, permission, `policy ${operation}`);
    assertIncludes(policy, level, `policy ${operation}`);
  }
  assertIncludes(policy, "salesOperatorMode", "rollout mode resolver");
  assertIncludes(policy, "branchOverrides", "branch override resolver");
  assertIncludes(policy, "legacy_users", "legacy default");
  assertIncludes(policy, "shared_employee_operator", "shared mode");

  const protectedRoutes = [
    ['"/pos/checkout"', 'requireSalesOperator("pos.checkout"'],
    ['"/sales/invoices/draft"', 'requireSalesOperator("sales.legacy_immediate_post"'],
    ['"/sales/invoices/drafts"', 'requireSalesOperator("sales.draft.create"'],
    ['"/sales/invoices/:id"', 'requireSalesOperator("sales.draft.update"'],
    ['"/sales/invoices/:id/cancel"', 'requireSalesOperator("sales.draft.cancel"'],
    ['"/sales/invoices/:id/post"', 'requireSalesOperator("sales.post"'],
    ['"/invoices/:id/print-events"', 'requireSalesOperator("sales.official_print"']
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

  for (const excluded of [
    'requireSalesOperator("sales.return"',
    'requireSalesOperator("sales.exchange"',
    'requireSalesOperator("installment.pay"',
    'requireSalesOperator("gold_purchase'
  ]) {
    assert.ok(!routes.includes(excluded), `excluded route wiring absent: ${excluded}`);
  }

  assertIncludes(apiClient, "OPERATOR_ACTION_REQUIRED_EVENT", "frontend recovery event");
  assertIncludes(apiClient, "OPERATOR_STEP_UP_REQUIRED", "frontend operator error handling");
  assertIncludes(operatorBar, "OPERATOR_ACTION_REQUIRED_EVENT", "operator bar recovery listener");

  console.log("Phase 34.5 static Sales/POS operator-enforcement contract: PASS");
}

async function databaseContract() {
  require(path.join(ROOT, "backend/node_modules/dotenv")).config({ path: path.join(ROOT, "backend/.env") });
  if (process.env.NODE_ENV === "production" || process.env.RENDER || process.env.VERCEL) {
    throw new Error("Refusing production/Render verification");
  }
  if (process.env.DATABASE_URL && !/localhost|127\\.0\\.0\\.1|5433/.test(process.env.DATABASE_URL)) {
    throw new Error("Refusing non-local DATABASE_URL");
  }
  const models = require(path.join(ROOT, "backend/src/models"));
  models.sequelize.options.logging = false;
  try {
    const [migrations] = await models.sequelize.query('select count(*)::int c from "SequelizeMeta"');
    assert.equal(Number(migrations[0].c), 41, "migration count is 41");
    const permissionCount = await models.Permission.count();
    assert.equal(permissionCount, 114, "permission count is 114");
    const pos = await models.Permission.findAll({ where: { name: ["pos.view", "pos.sell", "pos.discount.approve"] } });
    assert.equal(pos.length, 3, "all POS permissions exist once");
    const gold = await models.Permission.count({ where: { name: { [require(path.join(ROOT, "backend/node_modules/sequelize")).Op.like]: "gold_purchase.%" } } });
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
  } finally {
    await models.sequelize.close();
  }
}

(async () => {
  staticContract();
  await databaseContract();
  console.log("PHASE 34.5 SALES/POS OPERATOR ENFORCEMENT VERIFIER PASSED");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
