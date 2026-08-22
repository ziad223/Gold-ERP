const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function loadDiagnostic({ diagnostics, intercept, hostname }) {
  const relativePath = "lib/debug/pearl-confirm-dispatch.ts";
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: relativePath,
  }).outputText;
  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    process: { env: { NODE_ENV: "production", NEXT_PUBLIC_PEARL_CONFIRM_DIAGNOSTICS: diagnostics ? "true" : "false", NEXT_PUBLIC_PEARL_CONFIRM_INTERCEPT: intercept ? "true" : "false" } },
    window: { location: { hostname } },
    globalThis: {},
    crypto: { randomUUID: () => "00000000-0000-4000-8000-000000000001" },
  };
  context.globalThis = context;
  vm.runInNewContext(output, context, { filename: relativePath });
  return { exports: module.exports, context };
}

function capture(config) {
  const loaded = loadDiagnostic(config);
  const events = [];
  loaded.context.__DARFUS_PEARL_CONFIRM_DIAGNOSTIC_SINK__ = (event) => events.push(event);
  const correlationId = loaded.exports.createPearlConfirmDiagnosticCorrelation();
  loaded.exports.recordPearlConfirmDiagnostic({
    correlationId,
    eventName: "PEARL_CONFIRM_DIAGNOSTIC_READY",
    runtimeMode: "NEXT_PRODUCTION_START_LOCALHOST",
    hostname: config.hostname,
    diagnosticsEnabled: loaded.exports.isPearlConfirmDiagnosticActive(),
    interceptionEnabled: loaded.exports.isPearlConfirmInterceptionActive(),
  });
  return { ...loaded, events };
}

const onOff = capture({ diagnostics: true, intercept: false, hostname: "localhost" });
assert.equal(onOff.exports.isPearlConfirmDiagnosticActive(), true);
assert.equal(onOff.exports.isPearlConfirmInterceptionActive(), false);
assert.equal(onOff.events.length, 1, "telemetry must emit with interception OFF");
assert.equal(onOff.events[0].eventName, "PEARL_CONFIRM_DIAGNOSTIC_READY");
assert.equal(onOff.events[0].interceptionEnabled, false);

const onOn = capture({ diagnostics: true, intercept: true, hostname: "localhost" });
assert.equal(onOn.exports.isPearlConfirmDiagnosticActive(), true);
assert.equal(onOn.exports.isPearlConfirmInterceptionActive(), true, "isolated local interception may activate only with explicit opt-in");

const offOff = capture({ diagnostics: false, intercept: false, hostname: "localhost" });
assert.equal(offOff.exports.isPearlConfirmDiagnosticActive(), false);
assert.equal(offOff.exports.isPearlConfirmInterceptionActive(), false);
assert.equal(offOff.events.length, 0, "normal runtime must remain silent");

const offOn = capture({ diagnostics: false, intercept: true, hostname: "localhost" });
assert.equal(offOn.exports.isPearlConfirmDiagnosticActive(), false);
assert.equal(offOn.exports.isPearlConfirmInterceptionActive(), false, "interception without diagnostic/test permission must be blocked");
assert.equal(offOn.events.length, 0);

const online = capture({ diagnostics: true, intercept: true, hostname: "erp.example.com" });
assert.equal(online.exports.isPearlConfirmDiagnosticActive(), false);
assert.equal(online.exports.isPearlConfirmInterceptionActive(), false, "online production interception must be impossible");
assert.equal(online.events.length, 0);

const pageSource = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/inventory/pearl/page.tsx"), "utf8");
const clientSource = fs.readFileSync(path.join(root, "lib/api/client.ts"), "utf8");
assert.match(pageSource, /PEARL_CONFIRM_DIAGNOSTIC_READY/);
assert.match(pageSource, /isPearlConfirmInterceptionActive/);
assert.match(clientSource, /isPearlConfirmInterceptionActive/);
assert.match(clientSource, /PEARL_CONFIRM_BROWSER_NETWORK_INTERCEPTED/);

console.log("pearl-live-telemetry-no-intercept: PASS");
