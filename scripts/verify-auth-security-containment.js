#!/usr/bin/env node
"use strict";

const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function requireText(source, text, message) {
  assert.ok(source.includes(text), message || `expected ${text}`);
}

function verifyCoreContainment() {
  const auth = read("contexts/auth-context.tsx");
  const api = read("lib/api/client.ts");
  const providers = read("app/providers.tsx");
  const coordinator = read("components/auth/auth-session-coordinator.tsx");
  const core = read("hooks/use-core-erp-data.ts");
  const notifications = read("hooks/use-notifications.ts");
  const audits = read("hooks/use-audit-logs.ts");
  const accounts = read("hooks/use-user-management.ts");
  const realtime = read("components/realtime-provider.tsx");
  const eventsRoute = read("backend/src/routes/events.routes.js");
  const authMiddleware = read("backend/src/middleware/auth.middleware.js");
  const app = read("backend/src/app.js");

  requireText(auth, "authReady: hydrated && !terminalAuthHandling", "AuthProvider exposes the shared readiness state");
  requireText(auth, "beginTerminalAuthHandling", "AuthProvider owns terminal-auth state");
  requireText(auth, 'apiClient("/auth/logout", { method: "POST" })', "API logout revokes the persisted technical session before local cleanup");
  requireText(core, "authReady && isAuthenticated && !terminalAuthHandling && branchEmployeeReady", "core ERP queries require ready authenticated scope");
  requireText(notifications, "authReady", "notifications require auth readiness");
  requireText(audits, "authReady && isAuthenticated && !terminalAuthHandling", "audit query requires authenticated readiness");
  requireText(accounts, "authReady && isAuthenticated && !terminalAuthHandling", "account queries require authenticated readiness");

  requireText(providers, "retry: shouldRetryApiQuery", "queries use the central retry predicate");
  requireText(providers, "mutations: {\n            retry: false", "mutations do not auto-retry");
  assert.ok(!providers.includes("window.location.reload"), "terminal 401 never reloads the document");
  requireText(providers, "isTerminalTechnicalAuthError(error)", "terminal errors bypass per-query toast handling");
  requireText(providers, "if (isTerminalTechnicalAuthError(error)) return;\n              toast.error", "terminal query failures are filtered before any per-query toast");
  requireText(api, "AUTH_REFRESHED_RETRY_REQUIRED", "refresh-required mutation error is typed");
  requireText(api, "isSafeReadMethod", "only safe read methods may replay after refresh");
  requireText(api, "if (!isSafeReadMethod(options.method))", "mutations are blocked from automatic replay");
  requireText(api, "registerTerminalAuthFailureHandler", "API client uses a single terminal-auth handoff");
  requireText(api, "return error.status >= 500 && error.status <= 599", "only transient server failures receive bounded query retry");

  requireText(coordinator, "handlingRef.current", "terminal auth coordination is single-flight");
  requireText(coordinator, "queryClient.cancelQueries()", "terminal auth cancels active queries");
  requireText(coordinator, "clearLocal(\"TECHNICAL_SESSION_EXPIRED\")", "terminal technical failure clears Employee state locally");
  requireText(coordinator, "router.replace(\"/login\", { locale })", "terminal auth performs one localized router redirect");
  requireText(coordinator, "registerTerminalAuthFailureHandler(handleTerminalFailure)", "coordinator registers the shared API callback");

  assert.ok(!realtime.includes("EventSource("), "realtime uses fetch streaming instead of EventSource");
  assert.ok(!realtime.includes("events/stream?token="), "realtime never places an access token in the stream URL");
  requireText(realtime, "Authorization: `Bearer ${token}`", "realtime stream uses a Bearer header");
  requireText(realtime, "AbortController", "realtime stream aborts on cleanup");
  requireText(realtime, "getStoredAccessToken", "reconnect obtains the current token instead of a captured URL token");
  requireText(eventsRoute, "authMiddleware", "SSE uses the normal technical-session middleware");
  assert.ok(!eventsRoute.includes("req.query.token"), "SSE rejects legacy query-token authentication");
  requireText(eventsRoute, '"Cache-Control": "no-cache, no-store"', "SSE response is no-store");
  requireText(authMiddleware, "req.accessTokenPayload = decoded", "the validated access-token payload is available to long-lived routes");
  requireText(eventsRoute, "technicalSessions.assertAccessSession(req.accessTokenPayload)", "SSE revalidates persisted technical-session state while connected");
  requireText(eventsRoute, "closeStream();", "invalidated SSE sessions close their stream");
  requireText(app, "sanitizedRequestUrl", "request logging sanitizes URLs");
  requireText(app, "SENSITIVE_QUERY_KEYS", "request logging redacts sensitive query parameters");
}

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function response(status, payload) {
  return { status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(payload) };
}

async function verifyRefreshReplayContract() {
  const source = read("lib/api/client.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const compiledModule = { exports: {} };
  const originalWindow = global.window;
  const originalFetch = global.fetch;
  const localStorage = storage();
  const sessionStorage = storage();
  global.window = { localStorage, sessionStorage, crypto: { randomUUID: () => "qa-correlation-id" } };
  try {
    new Function("require", "module", "exports", compiled)(
      (name) => name === "@/lib/data-source"
        ? { getDataSourceMode: () => "api", assertProductionDataSource: () => undefined }
        : require(name),
      compiledModule,
      compiledModule.exports,
    );
    const api = compiledModule.exports;
    localStorage.setItem("darfus-token-v1", "initial-token");
    localStorage.setItem("darfus-refresh-v1", "refresh-token");

    const safeCalls = [];
    global.fetch = async (url, options = {}) => {
      safeCalls.push({ url, method: options.method || "GET" });
      if (url.endsWith("/auth/refresh")) return response(200, { data: { token: "fresh-token", refreshToken: "fresh-refresh" } });
      return safeCalls.filter((call) => call.url === url).length === 1
        ? response(401, { message: "expired" })
        : response(200, { success: true, data: { ok: true } });
    };
    const safeResult = await api.apiClient("/safe-read");
    assert.equal(safeResult.data.ok, true, "safe GET succeeds after one refresh");
    assert.equal(safeCalls.filter((call) => call.url.endsWith("/safe-read")).length, 2, "safe GET is replayed at most once");
    assert.equal(safeCalls.filter((call) => call.url.endsWith("/auth/refresh")).length, 1, "safe GET uses one shared refresh");

    localStorage.setItem("darfus-token-v1", "initial-token");
    localStorage.setItem("darfus-refresh-v1", "refresh-token");
    const mutationCalls = [];
    global.fetch = async (url, options = {}) => {
      mutationCalls.push({ url, method: options.method || "GET" });
      if (url.endsWith("/auth/refresh")) return response(200, { data: { token: "fresh-token", refreshToken: "fresh-refresh" } });
      return response(401, { message: "expired" });
    };
    await assert.rejects(
      () => api.apiClient("/unsafe-mutation", { method: "POST", body: "{}" }),
      (error) => error?.errorCode === api.AUTH_REFRESHED_RETRY_REQUIRED,
      "unsafe mutations require an explicit user retry after refresh",
    );
    assert.equal(mutationCalls.filter((call) => call.url.endsWith("/unsafe-mutation")).length, 1, "unsafe mutation is never replayed");
    assert.equal(mutationCalls.filter((call) => call.url.endsWith("/auth/refresh")).length, 1, "unsafe mutation still shares one refresh");

    const networkStorageBefore = localStorage.getItem("darfus-token-v1");
    global.fetch = async () => { throw new Error("offline"); };
    await assert.rejects(() => api.apiClient("/offline"), (error) => error?.status === 503, "network failures are classified without terminal logout");
    assert.equal(localStorage.getItem("darfus-token-v1"), networkStorageBefore, "network failures retain local technical auth");
  } finally {
    global.window = originalWindow;
    global.fetch = originalFetch;
  }
}

(async () => {
  verifyCoreContainment();
  await verifyRefreshReplayContract();
  console.log("AUTH SECURITY CONTAINMENT PASSED");
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
