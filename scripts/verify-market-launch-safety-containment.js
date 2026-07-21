#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const erpRoutes = read("backend/src/routes/erp.routes.js");
const treasuryPage = read("app/[locale]/(dashboard)/accounting/treasury/page.tsx");
const treasuryHook = read("hooks/use-treasury.ts");
const enMessages = read("messages/en.json");
const arMessages = read("messages/ar.json");
const packageJson = JSON.parse(read("package.json"));

function assertContains(source, needle, label) {
  assert.ok(source.includes(needle), label);
}

function assertNotContains(source, needle, label) {
  assert.ok(!source.includes(needle), label);
}

function verifyCounts() {
  const migrationCount = fs.readdirSync(path.join(ROOT, "backend", "migrations"))
    .filter((name) => name.endsWith(".js")).length;
  const verifierCount = fs.readdirSync(path.join(ROOT, "scripts"))
    .filter((name) => /^verify-.*\.js$/.test(name)).length;

  assert.equal(migrationCount, 48, "permission baseline reconciliation adds one forward-only migration");
  assert.ok(verifierCount >= 59, "verifier count remains at or above the HF6A baseline");
  assert.equal(
    packageJson.scripts["verify:market-launch-safety-containment"],
    "node scripts/verify-market-launch-safety-containment.js",
    "package verifier script is registered"
  );
}

function verifyPayrollAttendanceGuards() {
  assertContains(erpRoutes, 'router.get("/attendance", authMiddleware, requirePermission("payroll.view")', "attendance list requires payroll.view");
  assertContains(erpRoutes, 'router.post("/attendance/check-in", authMiddleware, requirePermission("payroll.manage")', "attendance check-in requires payroll.manage");
  assertContains(erpRoutes, 'router.post("/attendance/check-out", authMiddleware, requirePermission("payroll.manage")', "attendance check-out requires payroll.manage");
  assertContains(erpRoutes, 'router.get("/payslips", authMiddleware, requirePermission("payroll.view")', "payslip list requires payroll.view");
  assertContains(erpRoutes, 'router.post("/payroll/generate", authMiddleware, requirePermission("payroll.manage")', "payroll generation requires payroll.manage");
  assertContains(erpRoutes, 'router.post("/payslips/:id/pay", authMiddleware, requirePermission("payroll.manage")', "payslip payment requires payroll.manage");

  assertNotContains(erpRoutes, 'router.get("/attendance", authMiddleware, async', "attendance list is not authentication-only");
  assertNotContains(erpRoutes, 'router.post("/payroll/generate", authMiddleware, async', "payroll generation is not authentication-only");
}

function verifyGenericMutationContainment() {
  for (const resource of ["assets", "products", "stock-movements", "transfers", "purchase-orders", "cash-transactions"]) {
    const key = resource.includes("-") ? `${JSON.stringify(resource)}: {` : `${resource}: {`;
    assertContains(erpRoutes, key, `${resource} has generic mutation containment entry`);
  }
  for (const code of [
    "GENERIC_INVENTORY_MUTATION_FORBIDDEN",
    "GENERIC_STOCK_MOVEMENT_MUTATION_FORBIDDEN",
    "GENERIC_TRANSFER_MUTATION_FORBIDDEN",
    "GENERIC_PURCHASE_MUTATION_FORBIDDEN",
    "GENERIC_TREASURY_MUTATION_FORBIDDEN"
  ]) {
    assertContains(erpRoutes, code, `${code} stable error is present`);
  }
  assertContains(erpRoutes, "blockGenericMutation", "generic lifecycle-sensitive write paths are blocked");
  assertContains(erpRoutes, "router.get(`/${resourceName}`", "generic read/list remains wired");
}

function verifyTreasuryValidation() {
  assertContains(erpRoutes, "function normalizeTreasuryAccount", "treasury account normalization exists");
  assertContains(erpRoutes, "must be 'cash' or 'bank'", "treasury rejects unknown account keys");
  assertContains(erpRoutes, "Transfer source and destination treasury accounts must be different.", "same-account transfer is denied");
  assertContains(erpRoutes, "assertTreasuryAccountKey", "treasury GL account existence/type validation is used");
  assertContains(erpRoutes, "counterAccountCode is required for manual treasury cash movements.", "manual cash movement requires explicit counter account");
  assertContains(erpRoutes, "counterAccountCode must not be a treasury cash/bank account.", "manual cash movement rejects treasury counter account");
  assertContains(erpRoutes, "resolveAuthorizedBranch(req, b.branchId || req.headers[\"x-branch-id\"] || req.branchId, { required: true })", "treasury mutations validate branch scope");
  assertNotContains(erpRoutes, 'const type = ["cash_in", "cash_out", "transfer"].includes(b.type) ? b.type : "cash_in"', "treasury transaction type no longer silently defaults");
}

function verifyScopeHardening() {
  assertContains(erpRoutes, "async function resolveAuthorizedBranchId", "shared branch scope resolver exists");
  assertContains(erpRoutes, "BRANCH_SCOPE_FORBIDDEN", "branch widening has stable forbidden code");
  assertContains(erpRoutes, "BRANCH_SCOPE_INVALID", "invalid branch has stable error code");
  assertContains(erpRoutes, "const branchId = await resolveAuthorizedBranchId(req, req.query.branchId);", "ledger/report branch filters are validated");
  assertContains(erpRoutes, "async function buildInvoiceReportWhere(req)", "invoice report scope builder is async for branch validation");
  assertContains(erpRoutes, "await buildInvoiceReportWhere(req)", "invoice reports use validated branch scope");
  assertContains(erpRoutes, "const branchId = await resolveAuthorizedBranchId(req, req.query.branchId || req.query.branch);", "treasury reads validate branch query filters");
}

function verifySensitiveReadGuards() {
  assertContains(erpRoutes, 'router.get("/employees/:id/sessions", authMiddleware, requirePermission("employees.verification.view")', "employee sessions read is guarded");
  assertContains(erpRoutes, 'router.delete("/employees/:id/sessions/:sessionId", authMiddleware, requirePermission("employees.credentials.manage")', "employee session revoke is guarded");
  assertContains(erpRoutes, 'router.get("/suppliers/:id/purchase-orders", authMiddleware, requireBusinessPermission("suppliers.view")', "supplier purchase-orders read uses Employee-aware guard");
  assertContains(erpRoutes, 'router.get("/suppliers/:id/consignments", authMiddleware, requireBusinessPermission("suppliers.view")', "supplier consignments read uses Employee-aware guard");
  assertContains(erpRoutes, 'router.get("/suppliers/:id/documents", authMiddleware, requireBusinessPermission("suppliers.view")', "supplier documents read uses Employee-aware guard");
  assertContains(erpRoutes, 'router.post("/suppliers/:id/documents", authMiddleware, requireAnyBusinessPermission(["suppliers.update", "suppliers.documents.manage"], { touch: true })', "supplier document upload is Employee-aware before upload handling");
  assertContains(erpRoutes, 'router.delete("/suppliers/:id/documents/:docId", authMiddleware, requireAnyBusinessPermission(["suppliers.update", "suppliers.documents.manage"], { touch: true })', "supplier document delete is Employee-aware");
}

function verifyTreasuryUiContract() {
  assertContains(treasuryHook, "counterAccountCode?: string", "treasury transaction type exposes explicit counter account");
  assertContains(treasuryPage, "counterAccountCode", "treasury form sends explicit counter account code");
  assertContains(treasuryPage, 't("counterAccountRequired")', "treasury form validates missing counter account before submit");
  assertContains(treasuryPage, "setCloseError", "treasury closing expected errors are caught in form state");
  assertContains(enMessages, "Counter Account Code", "English counter-account label exists");
  assertContains(enMessages, "Counter account code is required", "English counter-account validation exists");
  assertContains(arMessages, "كود الحساب المقابل", "Arabic counter-account label exists");
  assertContains(arMessages, "كود الحساب المقابل مطلوب", "Arabic counter-account validation exists");
}

verifyCounts();
verifyPayrollAttendanceGuards();
verifyGenericMutationContainment();
verifyTreasuryValidation();
verifyScopeHardening();
verifySensitiveReadGuards();
verifyTreasuryUiContract();

console.log("MARKET LAUNCH SAFETY CONTAINMENT PASSED");
