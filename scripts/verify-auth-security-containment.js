#!/usr/bin/env node
"use strict";

const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

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

  requireText(auth, "authReady: hydrated && !terminalAuthHandling", "AuthProvider exposes the shared readiness state");
  requireText(auth, "beginTerminalAuthHandling", "AuthProvider owns terminal-auth state");
  requireText(core, "authReady && isAuthenticated && !terminalAuthHandling && branchEmployeeReady", "core ERP queries require ready authenticated scope");
  requireText(notifications, "authReady", "notifications require auth readiness");
  requireText(audits, "authReady && isAuthenticated && !terminalAuthHandling", "audit query requires authenticated readiness");
  requireText(accounts, "authReady && isAuthenticated && !terminalAuthHandling", "account queries require authenticated readiness");

  requireText(providers, "retry: shouldRetryApiQuery", "queries use the central retry predicate");
  requireText(providers, "mutations: {\n            retry: false", "mutations do not auto-retry");
  assert.ok(!providers.includes("window.location.reload"), "terminal 401 never reloads the document");
  requireText(providers, "isTerminalTechnicalAuthError(error)", "terminal errors bypass per-query toast handling");
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
}

verifyCoreContainment();
console.log("AUTH SECURITY CONTAINMENT PASSED");
