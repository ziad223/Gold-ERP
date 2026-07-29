import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const require = createRequire(import.meta.url);

test("operator restoration waits for validated Branch readiness and guards the fallback", () => {
  const provider = read("contexts/operator-context.tsx");
  const guard = read("components/auth/auth-guard.tsx");

  assert.match(provider, /useBranchContext/);
  assert.match(provider, /branchReady/);
  assert.match(provider, /branchGeneration/);
  assert.match(provider, /lastRestoreKeyRef/);
  assert.match(provider, /OPERATOR_RESTORE_PENDING/);
  assert.match(guard, /const showProtectedLoading/);
  assert.match(guard, /operator\.restoreStatus === "deferred"/);
});

test("fixed Branch shells bootstrap from the authenticated fixed Branch without settings prefetch", () => {
  const settings = read("contexts/settings-context.tsx");

  assert.match(settings, /fixedBranchForShell/);
  assert.match(settings, /user\?\.accountType === "branch_shell"/);
  assert.match(settings, /setBranches\(\[fixedBranchForShell\]\)/);
  assert.match(settings, /setSettings\(DEFAULT_SETTINGS\)/);
});

test("automatic module and notification traffic requires backend-resolved Employee permission", () => {
  const core = read("hooks/use-core-erp-data.ts");
  const notifications = read("hooks/use-notifications.ts");
  const realtime = read("components/realtime-provider.tsx");

  assert.match(core, /CORE_ERP_RESOURCE_PERMISSIONS/);
  assert.match(core, /operatorPermissionReady/);
  assert.match(notifications, /notifications\.view/);
  assert.match(realtime, /notifications\.view/);
});

test("technical logout uses a stable technical-session fingerprint and a transaction", () => {
  const linkagePath = path.join(ROOT, "backend/src/services/technical-session-linkage.service.js");
  assert.equal(fs.existsSync(linkagePath), true);
  const linkage = require(linkagePath);
  const first = linkage.technicalSessionFingerprint("TECHNICAL-A");
  const second = linkage.technicalSessionFingerprint("TECHNICAL-B");

  assert.equal(typeof first, "string");
  assert.equal(first.length, 64);
  assert.equal(first, linkage.technicalSessionFingerprint("TECHNICAL-A"));
  assert.notEqual(first, second);

  const technical = read("backend/src/services/technical-session.service.js");
  const operator = read("backend/src/services/operator-session.service.js");
  const auth = read("backend/src/controllers/auth.controller.js");
  assert.match(technical, /authSessionFingerprint/);
  assert.match(technical, /Op\.or/);
  assert.match(technical, /allUserSessions: true/);
  assert.match(operator, /technicalSessionFingerprint\(req\.technicalSession\?\.id\)/);
  assert.match(auth, /sequelize\.transaction/);
});

test("terminal request logging always emits a numeric duration and explicit outcome", () => {
  const loggingPath = path.join(ROOT, "backend/src/middleware/request-terminal-logging.middleware.js");
  assert.equal(fs.existsSync(loggingPath), true);
  const logging = require(loggingPath);
  const start = 1_000_000_000n;
  assert.equal(logging.durationMs(start, start + 1_500_000n), "1.500");
  assert.equal(logging.classifyOutcome({ aborted: true }, { writableFinished: false, statusCode: 200 }), "aborted");
  assert.equal(logging.classifyOutcome({ aborted: false }, { writableFinished: false, statusCode: 200 }), "client_disconnected");
  assert.equal(logging.classifyOutcome({ aborted: false }, { writableFinished: true, statusCode: 403 }), "completed");

  const app = read("backend/src/app.js");
  assert.doesNotMatch(app, /response-time/);
  assert.match(app, /requestTerminalLogging/);
});
