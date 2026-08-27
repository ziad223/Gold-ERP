import test from "node:test";
import assert from "node:assert/strict";
import {
  REQUIRED_MODULE_KEYS,
  moduleKeyForPath,
  summarizeModuleEvidence,
  summarizeModules,
} from "./module-runtime-evidence.mjs";

const response = (path, overrides = {}) => ({
  scenario: "MODULE_PRODUCTS",
  path,
  status: 200,
  terminalOutcome: "RESPONSE",
  companyContextPresent: true,
  branchContextPresent: true,
  retryOrReconnect: 0,
  ...overrides,
});

test("required resource paths map to canonical module keys without retaining dynamic identifiers", () => {
  assert.equal(moduleKeyForPath("/suppliers/:id"), "suppliers");
  assert.equal(moduleKeyForPath("/products/:id"), "products");
  assert.equal(moduleKeyForPath("/assets"), "assets");
  assert.equal(moduleKeyForPath("/stock-movements"), "stockMovements");
  assert.equal(moduleKeyForPath("/transfers/:id"), "transfers");
  assert.equal(moduleKeyForPath("/reservations/:id"), "reservations");
  assert.equal(moduleKeyForPath("/purchase-orders/:id"), "purchaseOrders");
  assert.equal(moduleKeyForPath("/approval-requests/:id"), "approvalRequests");
  assert.equal(moduleKeyForPath("/invoices/:id"), "invoices");
  assert.equal(moduleKeyForPath("/unknown"), null);
});

test("a terminal branch-scoped list response is PASS with bounded sanitized fields", () => {
  const result = summarizeModuleEvidence("products", [response("/products")], { hardRefreshObserved: true });
  assert.equal(result.outcome, "PASS");
  assert.equal(result.routeObserved, true);
  assert.equal(result.completedResponses, 1);
  assert.equal(result.successes, 1);
  assert.deepEqual(result.statuses, [200]);
  assert.equal(result.pending, 0);
  assert.equal(result.companyHeaderPresent, true);
  assert.equal(result.branchHeaderPresent, true);
  assert.equal(result.hardRefreshObserved, true);
  assert.equal(Object.hasOwn(result, "headers"), false);
  assert.equal(JSON.stringify(result).includes("identifier"), false);
});

test("exact terminal accounting treats a superseded abort and authoritative success as settled", () => {
  const result = summarizeModuleEvidence("products", [
    response("/products", { terminalOutcome: "ABORTED", status: null }),
    response("/products"),
  ]);
  assert.equal(result.outcome, "PASS");
  assert.equal(result.aborts, 1);
  assert.equal(result.successes, 1);
  assert.equal(result.pending, 0);
  assert.equal(result.duplicateLogicalLifecycleCount, 0);
});

test("context and server failures produce safe module failures", () => {
  assert.equal(summarizeModuleEvidence("products", [response("/products", { status: 401 })]).outcome, "FAIL");
  assert.equal(summarizeModuleEvidence("products", [response("/products", { status: 422, stableErrorCode: "BRANCH_CONTEXT_REQUIRED" })]).outcome, "FAIL");
  assert.equal(summarizeModuleEvidence("products", [response("/products", { terminalOutcome: "PENDING", status: null })]).outcome, "FAIL");
});

test("controlled domain emptiness requires the required Branch context", () => {
  const controlled = response("/transfers", { status: 404, stableErrorCode: "RESOURCE_NOT_FOUND" });
  assert.equal(summarizeModuleEvidence("transfers", [controlled]).outcome, "CONTROLLED_DOMAIN_EMPTY");
  assert.equal(summarizeModuleEvidence("transfers", [{ ...controlled, branchContextPresent: false }]).outcome, "FAIL");
});

test("module summary preserves request-start scenario ownership, hard-refresh proof, and required-key completeness", () => {
  const records = REQUIRED_MODULE_KEYS.filter((key) => key !== "dashboard").map((key) => {
    const path = {
      suppliers: "/suppliers", products: "/products", assets: "/assets", stockMovements: "/stock-movements",
      transfers: "/transfers", reservations: "/reservations", purchaseOrders: "/purchase-orders",
      approvalRequests: "/approval-requests", invoices: "/invoices",
    }[key];
    const companyOnly = ["suppliers", "purchaseOrders"].includes(key);
    return response(path, { scenario: "N8_HARD_REFRESH", branchContextPresent: !companyOnly });
  });
  const summary = summarizeModules(records, { dashboardRouteObserved: true });
  assert.deepEqual(Object.keys(summary), REQUIRED_MODULE_KEYS);
  assert.equal(summary.dashboard.outcome, "PASS");
  assert.equal(summary.products.hardRefreshObserved, true);
  assert.equal(summary.suppliers.branchHeaderPresent, false);
  assert.equal(summary.transfers.scenarioOwnershipValid, true);
  assert.equal(Object.values(summary).some((item) => item.outcome === "NOT_OBSERVED"), false);
});

test("module-owned hard refresh is retained without reusing the N8 scenario", () => {
  const result = summarizeModuleEvidence("products", [
    response("/products", { scenario: "MODULE_PRODUCTS_HARD_REFRESH" }),
  ]);
  assert.equal(result.hardRefreshObserved, true);
});
