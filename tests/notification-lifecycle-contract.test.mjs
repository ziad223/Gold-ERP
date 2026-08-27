import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lifecyclePath = path.join(repositoryRoot, "lib", "notifications", "company-scoped-lifecycle.ts");

async function lifecycle() {
  const source = await readFile(lifecyclePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: lifecyclePath,
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
}

test("N4: Super Admin without an explicit Company cannot start notification resources", async () => {
  const lifecycleModule = await lifecycle();
  const readiness = {
    authResolved: true,
    authenticated: true,
    terminalAuthHandling: false,
    accountType: "super_admin",
    branchEmployeeReady: true,
  };

  assert.equal(lifecycleModule.canStartCompanyScopedNotifications(readiness), false);
  assert.deepEqual(lifecycleModule.notificationRequestOptions(), { skipBranch: true });
  assert.deepEqual(lifecycleModule.notificationListQueryKey(), ["notifications"]);
  assert.deepEqual(lifecycleModule.notificationUnreadCountQueryKey(), ["notifications", "unread-count"]);
});

test("N7: unauthenticated and terminal-auth states close the lifecycle before any reconnect can start", async () => {
  const lifecycleModule = await lifecycle();
  const base = { authResolved: true, authenticated: true, terminalAuthHandling: false, accountType: "legacy", branchEmployeeReady: true };

  assert.equal(lifecycleModule.canStartCompanyScopedNotifications({ ...base, authenticated: false }), false);
  assert.equal(lifecycleModule.canStartCompanyScopedNotifications({ ...base, terminalAuthHandling: true }), false);
  assert.equal(lifecycleModule.canStartCompanyScopedNotifications({ ...base, authResolved: false }), false);
});

test("non-Super-Admin keeps server-derived notification scope", async () => {
  const lifecycleModule = await lifecycle();
  assert.equal(lifecycleModule.canStartCompanyScopedNotifications({
    authResolved: true,
    authenticated: true,
    terminalAuthHandling: false,
    accountType: "legacy",
    branchEmployeeReady: true,
  }), true);
});

test("future explicit Company context has one REST/SSE authority and Company-safe query keys", async () => {
  const lifecycleModule = await lifecycle();
  const context = "COMPANY_A";
  assert.equal(lifecycleModule.canStartCompanyScopedNotifications({
    authResolved: true,
    authenticated: true,
    terminalAuthHandling: false,
    accountType: "super_admin",
    branchEmployeeReady: true,
    explicitCompanyId: context,
  }), true);
  assert.deepEqual(lifecycleModule.notificationRequestOptions(context), { skipBranch: true, companyId: context });
  assert.deepEqual(lifecycleModule.notificationListQueryKey(context), ["notifications", "company", context]);
  assert.deepEqual(lifecycleModule.notificationUnreadCountQueryKey(context), ["notifications", "unread-count", "company", context]);
  assert.notDeepEqual(lifecycleModule.notificationListQueryKey("COMPANY_B"), lifecycleModule.notificationListQueryKey(context));
  assert.equal(lifecycleModule.notificationSseHeaders("test-token", context)["X-Company-ID"], context);
});

test("terminal SSE errors do not reconnect and transient failures remain bounded-retry candidates", async () => {
  const lifecycleModule = await lifecycle();
  for (const status of [401, 403, 404, 422]) assert.equal(lifecycleModule.classifyNotificationSseFailure(status), "terminal");
  for (const status of [undefined, 500, 503]) assert.equal(lifecycleModule.classifyNotificationSseFailure(status), "transient");
});

test("notification terminal errors have one controlled toast owner while unrelated errors stay outside this contract", async () => {
  const lifecycleModule = await lifecycle();
  const shown = new Map();
  const metadata = lifecycleModule.notificationQueryMetadata();
  const error = { status: 422, errorCode: "SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED" };

  assert.equal(lifecycleModule.shouldShowNotificationTerminalToast(shown, error, metadata, 100), true);
  assert.equal(lifecycleModule.shouldShowNotificationTerminalToast(shown, error, metadata, 101), false);
  assert.equal(lifecycleModule.shouldShowNotificationTerminalToast(shown, { status: 500 }, metadata, 102), false);
  assert.equal(lifecycleModule.shouldShowNotificationTerminalToast(shown, error, metadata, 100 + lifecycleModule.NOTIFICATION_TOAST_DEDUPE_WINDOW_MS), true);
});

test("the list, unread, SSE and global QueryCache all consume the same lifecycle contract", async () => {
  const [hook, realtime, providers] = await Promise.all([
    readFile(path.join(repositoryRoot, "hooks", "use-notifications.ts"), "utf8"),
    readFile(path.join(repositoryRoot, "components", "realtime-provider.tsx"), "utf8"),
    readFile(path.join(repositoryRoot, "app", "providers.tsx"), "utf8"),
  ]);

  assert.match(hook, /canStartCompanyScopedNotifications/);
  assert.match(hook, /notificationRequestOptions\(explicitCompanyId\)/);
  assert.match(hook, /notificationListQueryKey\(explicitCompanyId\)/);
  assert.match(hook, /notificationUnreadCountQueryKey\(explicitCompanyId\)/);
  assert.match(realtime, /canStartCompanyScopedNotifications/);
  assert.match(realtime, /notificationSseHeaders\(token, explicitCompanyId\)/);
  assert.match(realtime, /classifyNotificationSseFailure\(response\.status\)/);
  assert.match(realtime, /Promise\.resolve\(\)\.then\(connect\)/);
  assert.match(providers, /isNotificationQueryMetadata\(metadata\)/);
  assert.match(providers, /shouldShowNotificationTerminalToast/);
});
