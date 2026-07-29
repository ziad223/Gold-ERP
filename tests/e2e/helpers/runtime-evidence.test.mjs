import test from "node:test";
import assert from "node:assert/strict";
import { contextPresence, createEvidenceCollector, normalizePath, redactHeaders } from "./runtime-evidence.mjs";

test("runtime evidence removes API prefixes and query strings", () => {
  assert.equal(normalizePath("http://127.0.0.1:8001/api/v1/notifications?cursor=secret"), "/notifications");
  assert.equal(normalizePath("http://127.0.0.1:8001/api/v1/customers/private-customer/invoices"), "/customers/:id/invoices");
  assert.equal(normalizePath("http://127.0.0.1:8001/api/v1/suppliers/private-supplier"), "/suppliers/:id");
  assert.equal(normalizePath("http://127.0.0.1:8001/api/v1/approval-requests/private-request"), "/approval-requests/:id");
});

test("runtime evidence records only Company and Branch header presence", () => {
  assert.deepEqual(contextPresence({ "X-Company-ID": "opaque-company", "X-Branch-ID": "opaque-branch" }), {
    companyContextPresent: true,
    branchContextPresent: true,
  });
  assert.deepEqual(redactHeaders({ Authorization: "token", Cookie: "cookie", "X-Company-ID": "company", Accept: "application/json" }), {
    accept: "REDACTED",
  });
});

test("runtime evidence correlates a response without storing headers or payloads", () => {
  let tick = 0;
  const evidence = createEvidenceCollector(() => ++tick);
  evidence.begin("N5_SINGLE_COMPANY");
  const request = {};
  evidence.request({ request, method: "GET", url: "http://local/api/v1/notifications", headers: { "x-company-id": "opaque" } });
  evidence.response({ request, status: 200 });
  assert.deepEqual(evidence.snapshot(), [{
    sequence: 1,
    relativeMs: 1,
    scenario: "N5_SINGLE_COMPANY",
    method: "GET",
    path: "/notifications",
    status: 200,
    terminalOutcome: "RESPONSE",
    companyContextPresent: true,
    branchContextPresent: false,
    retryOrReconnect: 0,
  }]);
});

test("runtime evidence records a stable error code without retaining an error body", () => {
  const evidence = createEvidenceCollector();
  evidence.begin("N5_SINGLE_COMPANY");
  const request = {};
  evidence.request({ request, method: "GET", url: "http://local/api/v1/current", headers: {} });
  evidence.response({ request, status: 422, stableErrorCode: "SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED" });
  assert.equal(evidence.snapshot()[0].stableErrorCode, "SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED");
});

test("concurrent identical paths resolve by request object when responses arrive out of order", () => {
  const evidence = createEvidenceCollector();
  const requestA = {};
  const requestB = {};
  evidence.begin("BRANCH_A_FINANCIAL");
  evidence.request({ request: requestA, method: "GET", url: "http://local/api/v1/customers/private-a/statement-v2", headers: { "x-company-id": "opaque", "x-branch-id": "opaque" } });
  evidence.request({ request: requestB, method: "GET", url: "http://local/api/v1/customers/private-a/statement-v2", headers: { "x-company-id": "opaque", "x-branch-id": "opaque" } });
  evidence.response({ request: requestB, status: 200 });
  evidence.requestFailed({ request: requestA, aborted: true });
  evidence.requestFinished({ request: requestB });

  const records = evidence.records("/customers/:id/statement-v2");
  assert.equal(records.length, 2);
  assert.deepEqual(records.map((record) => record.terminalOutcome), ["ABORTED", "RESPONSE"]);
  assert.deepEqual(records.map((record) => record.status), [null, 200]);
  assert.equal(records.filter((record) => record.status >= 200 && record.status < 300).length, 1);
  assert.equal(records.filter((record) => record.terminalOutcome === "PENDING").length, 0);
  assert.equal(evidence.correlationCount(), 0);
});

test("same normalized credit path retains distinct terminal failures and original scenario ownership", () => {
  const evidence = createEvidenceCollector();
  const requestC = {};
  const requestD = {};
  evidence.begin("BRANCH_A_FINANCIAL");
  evidence.request({ request: requestC, method: "GET", url: "http://local/api/v1/customers/private-c/credit?private=query", headers: {} });
  evidence.request({ request: requestD, method: "GET", url: "http://local/api/v1/customers/private-d/credit?private=query", headers: {} });
  evidence.begin("BRANCH_A_TO_B");
  evidence.response({ request: requestD, status: 200 });
  evidence.requestFailed({ request: requestC });
  evidence.response({ request: requestD, status: 500 });

  const records = evidence.records("/customers/:id/credit", "BRANCH_A_FINANCIAL");
  assert.deepEqual(records.map((record) => ({ path: record.path, status: record.status, terminalOutcome: record.terminalOutcome, scenario: record.scenario })), [
    { path: "/customers/:id/credit", status: null, terminalOutcome: "FAILED", scenario: "BRANCH_A_FINANCIAL" },
    { path: "/customers/:id/credit", status: 200, terminalOutcome: "RESPONSE", scenario: "BRANCH_A_FINANCIAL" },
  ]);
  assert.equal(evidence.correlationCount(), 0);
  assert.equal(JSON.stringify(evidence.snapshot("BRANCH_A_FINANCIAL")).includes("private-"), false);
});
