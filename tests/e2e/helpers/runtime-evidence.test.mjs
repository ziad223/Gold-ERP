import test from "node:test";
import assert from "node:assert/strict";
import { contextPresence, createEvidenceCollector, normalizePath, redactHeaders } from "./runtime-evidence.mjs";

test("runtime evidence removes API prefixes and query strings", () => {
  assert.equal(normalizePath("http://127.0.0.1:8001/api/v1/notifications?cursor=secret"), "/notifications");
  assert.equal(normalizePath("http://127.0.0.1:8001/api/v1/customers/private-customer/invoices"), "/customers/:id/invoices");
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
  evidence.request({ method: "GET", url: "http://local/api/v1/notifications", headers: { "x-company-id": "opaque" } });
  evidence.response({ method: "GET", url: "http://local/api/v1/notifications", status: 200 });
  assert.deepEqual(evidence.snapshot(), [{
    sequence: 1,
    relativeMs: 1,
    scenario: "N5_SINGLE_COMPANY",
    method: "GET",
    path: "/notifications",
    status: 200,
    companyContextPresent: true,
    branchContextPresent: false,
    retryOrReconnect: 0,
  }]);
});

test("runtime evidence records a stable error code without retaining an error body", () => {
  const evidence = createEvidenceCollector();
  evidence.begin("N5_SINGLE_COMPANY");
  evidence.request({ method: "GET", url: "http://local/api/v1/current", headers: {} });
  evidence.response({ method: "GET", url: "http://local/api/v1/current", status: 422, stableErrorCode: "SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED" });
  assert.equal(evidence.snapshot()[0].stableErrorCode, "SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED");
});
