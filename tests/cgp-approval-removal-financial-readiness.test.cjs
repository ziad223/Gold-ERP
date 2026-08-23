"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const catalog = require(path.join(root, "backend/src/services/financial-account-catalog.service"));
const financialBootstrap = require(path.join(root, "backend/src/services/financial-bootstrap.service"));
const governance = require(path.join(root, "backend/src/services/gold-purchase-governance.service"));
const cgpPosting = require(path.join(root, "backend/src/services/cgp-posting.service"));

test("CGP readiness explicitly includes the customer-creditor semantic role without widening global defaults", () => {
  assert.deepEqual(catalog.CGP_REQUIRED_FINANCIAL_ROLE_CODES, ["INVENTORY_ASSET", "CUSTOMER_CREDITOR"]);
  assert.deepEqual(financialBootstrap.resolveRequiredRoleDefinitions().map(([code]) => code), Object.keys(catalog.ACCOUNT_ROLE_CATALOG));
  const cgpRoles = financialBootstrap.resolveRequiredRoleDefinitions(catalog.CGP_REQUIRED_FINANCIAL_ROLE_CODES).map(([code]) => code);
  assert.equal(cgpRoles.includes("CUSTOMER_CREDITOR"), true);
  assert.equal(cgpRoles.length, Object.keys(catalog.ACCOUNT_ROLE_CATALOG).length + 1);
});

test("CGP posting preflight fails closed on missing financial readiness", async () => {
  const original = financialBootstrap.evaluateReadiness;
  financialBootstrap.evaluateReadiness = async () => ({ status: "BLOCKED", missingRoles: ["CUSTOMER_CREDITOR"] });
  try {
    await assert.rejects(
      () => cgpPosting.assertCgpFinancialReadiness({ context: { companyId: "COMP-1", branchId: "BR-1" }, transaction: {} }),
      (error) => error?.errorCode === "CGP_FINANCIAL_READINESS_REQUIRED" && error.statusCode === 422,
    );
  } finally {
    financialBootstrap.evaluateReadiness = original;
  }
});

test("CGP approval history is visible but never actionable, while IGP actionability is unchanged", () => {
  assert.deepEqual(
    governance.deriveApprovalActionability({ aggregateType: "cgp", approvalStatus: "pending", linkedDocument: { businessStatus: "VALIDATED" } }),
    { actionable: false, actionBlockedCode: "CGP_APPROVAL_DISABLED", linkedBusinessStatus: "VALIDATED" },
  );
  assert.deepEqual(
    governance.deriveApprovalActionability({ aggregateType: "igp", approvalStatus: "pending" }),
    { actionable: true, actionBlockedCode: null, linkedBusinessStatus: null },
  );
});

test("CGP approval mutation routes are disabled and the new UI offers direct validation-to-posting", () => {
  const routes = fs.readFileSync(path.join(root, "backend/src/routes/gold-purchase.routes.js"), "utf8");
  const workspace = fs.readFileSync(path.join(root, "features/gold-purchases/components/GoldPurchaseDraftWorkspace.tsx"), "utf8");
  const posting = fs.readFileSync(path.join(root, "backend/src/services/cgp-posting.service.js"), "utf8");
  assert.match(routes, /CGP_APPROVAL_DISABLED/);
  assert.match(routes, /kind === "cgp" \? cgpApprovalDisabled/);
  assert.match(workspace, /const canSubmit = !isCgp/);
  assert.match(workspace, /financial integration has not completed yet/);
  assert.match(posting, /CGP_FINANCIAL_READINESS_REQUIRED/);
  assert.match(posting, /before pricing snapshots, POSTED state, audit, or outbox/);
});

