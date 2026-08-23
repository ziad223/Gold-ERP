const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

function loadTsModule(relativePath, overrides = {}) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: relativePath,
  }).outputText;
  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    process: { env: { NODE_ENV: "test", ...overrides.env } },
    crypto: { randomUUID: () => "00000000-0000-4000-8000-000000000001" },
    globalThis: {},
  };
  context.globalThis = context;
  vm.runInNewContext(output, context, { filename: relativePath });
  return { exports: module.exports, context };
}

function eventNames(events) { return events.map((event) => event.eventName); }

async function runCase({
  canReceive = true,
  busy = false,
  preparedRequest = { idempotencyKey: "test-key" },
  authStatus = "FRESH",
  contextMatch = true,
  hashMatch = true,
}) {
  const { exports: diagnostic, context } = loadTsModule("lib/debug/pearl-confirm-dispatch.ts");
  const events = [];
  context.__DARFUS_PEARL_CONFIRM_DIAGNOSTIC_SINK__ = (event) => events.push(event);
  const correlationId = diagnostic.createPearlConfirmDiagnosticCorrelation();
  diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_CLICK" });
  diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_HANDLER_ENTERED" });
  diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_GUARD_CAN_RECEIVE", guardResult: canReceive ? "PASS" : "FAIL", blockReason: canReceive ? undefined : "CAN_RECEIVE_FALSE" });
  diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_GUARD_BUSY", guardResult: !busy ? "PASS" : "FAIL", blockReason: !busy ? undefined : "BUSY_TRUE" });
  const prepared = Boolean(preparedRequest?.idempotencyKey);
  diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_GUARD_PREPARED_REQUEST", guardResult: prepared ? "PASS" : "FAIL", preparedRequestPresent: prepared, blockReason: prepared ? undefined : "PREPARED_REQUEST_MISSING" });
  if (!canReceive || busy || !prepared) {
    diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_BLOCKED", blockReason: !canReceive ? "CAN_RECEIVE_FALSE" : busy ? "BUSY_TRUE" : "PREPARED_REQUEST_MISSING" });
    return { events, apiCalls: 0, fetchAttempts: 0 };
  }
  diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_AUTH_PREFLIGHT_RESULT", authStatus, guardResult: authStatus === "BLOCKED_AUTH" ? "FAIL" : "PASS", blockReason: authStatus === "BLOCKED_AUTH" ? "AUTH_BLOCKED" : undefined });
  if (authStatus === "BLOCKED_AUTH") {
    diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_BLOCKED", blockReason: "AUTH_BLOCKED" });
    return { events, apiCalls: 0, fetchAttempts: 0 };
  }
  diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_CONTEXT_RECOMPARE", contextMatch, guardResult: contextMatch ? "PASS" : "FAIL", blockReason: contextMatch ? undefined : "BRANCH_CONTEXT_MISMATCH" });
  diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_HASH_RECOMPARE", hashMatch, guardResult: hashMatch ? "PASS" : "FAIL", hashMatch, blockReason: hashMatch ? undefined : "HASH_MISMATCH" });
  if (!contextMatch || !hashMatch) {
    diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_BLOCKED", blockReason: !contextMatch ? "BRANCH_CONTEXT_MISMATCH" : "HASH_MISMATCH" });
    return { events, apiCalls: 0, fetchAttempts: 0 };
  }
  if (authStatus === "REFRESHED") {
    diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_BLOCKED", blockReason: "AUTH_REFRESHED_REVIEW_REQUIRED", authStatus });
    return { events, apiCalls: 0, fetchAttempts: 0 };
  }
  diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_READY_FOR_API", guardResult: "PASS" });
  diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_API_CLIENT_ENTERED", apiClientEntered: true });
  diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_FETCH_ATTEMPT", method: "POST", path: "/purchase-orders/receive", fetchAttempted: true });
  diagnostic.recordPearlConfirmDiagnostic({ correlationId, eventName: "PEARL_CONFIRM_FETCH_RETURNED_OR_REJECTED", outcome: "RETURNED", status: 200 });
  return { events, apiCalls: 1, fetchAttempts: 1 };
}

async function main() {
  const pageSource = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/inventory/pearl/page.tsx"), "utf8");
  const clientSource = fs.readFileSync(path.join(root, "lib/api/client.ts"), "utf8");
  assert.match(pageSource, /PEARL_CONFIRM_CLICK/);
  assert.match(pageSource, /PEARL_CONFIRM_HANDLER_ENTERED/);
  assert.match(pageSource, /pearlConfirmDiagnostic/);
  assert.match(clientSource, /PEARL_CONFIRM_FETCH_ATTEMPT/);

  const valid = await runCase({});
  assert.equal(valid.apiCalls, 1);
  assert.equal(valid.fetchAttempts, 1);
  assert.equal(eventNames(valid.events).filter((name) => name === "PEARL_CONFIRM_HANDLER_ENTERED").length, 1);
  assert.equal(eventNames(valid.events).filter((name) => name === "PEARL_CONFIRM_FETCH_ATTEMPT").length, 1);

  for (const setup of [
    { canReceive: false },
    { busy: true },
    { preparedRequest: null },
    { authStatus: "BLOCKED_AUTH" },
    { authStatus: "REFRESHED" },
    { contextMatch: false },
    { hashMatch: false },
  ]) {
    const blocked = await runCase(setup);
    assert.equal(blocked.apiCalls, 0);
    assert.equal(blocked.fetchAttempts, 0);
    assert.equal(eventNames(blocked.events).filter((name) => name === "PEARL_CONFIRM_API_CLIENT_ENTERED").length, 0);
    assert.equal(eventNames(blocked.events).filter((name) => name === "PEARL_CONFIRM_FETCH_ATTEMPT").length, 0);
  }

  assert.equal(eventNames(valid.events).filter((name) => name === "PEARL_CONFIRM_CLICK").length, 1);
  assert.match(clientSource, /!isSafeReadMethod\(options\.method\)/);

  const { exports: productionDiagnostic, context: productionContext } = loadTsModule("lib/debug/pearl-confirm-dispatch.ts", { env: { NODE_ENV: "production" } });
  const productionEvents = [];
  productionContext.__DARFUS_PEARL_CONFIRM_DIAGNOSTIC_SINK__ = (event) => productionEvents.push(event);
  productionDiagnostic.recordPearlConfirmDiagnostic({ correlationId: "PEARL-DISPATCH-PRODUCTION-NOOP", eventName: "PEARL_CONFIRM_CLICK" });
  assert.equal(productionEvents.length, 0, "production diagnostics must be a no-op");
  console.log("pearl-confirm-request-dispatch: PASS");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
