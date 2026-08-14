import { EventEmitter } from "node:events";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  assertOwnedRunRoot,
  cleanupOwnedRunRoot,
  openOwnedLogDestination,
  fingerprintExistingRuntime,
  resolveRuntimeMode,
  runSingleCompanyBrowserAcceptance,
  sanitizeChildEnvironment,
  validateChildLaunch,
} from "../scripts/run-single-company-browser-acceptance.mjs";

const prefix = "darfus-ux-browser-acceptance-test-";

function ownedRoot(suffix) {
  const root = path.join(tmpdir(), `${prefix}${Date.now()}-${suffix}`);
  mkdirSync(path.join(root, "runtime-logs"), { recursive: true });
  return root;
}

function fakeChild({ pid = 0, exitCode = 0 } = {}) {
  const child = new EventEmitter();
  child.pid = pid;
  child.exitCode = exitCode;
  child.kill = () => {};
  return child;
}

function harnessEnvironment() {
  return {
    DARFUS_E2E_EMAIL: "configured",
    DARFUS_E2E_PASSWORD: "configured",
    DARFUS_E2E_BROWSER_PATH: process.execPath,
  };
}

function fingerprintResponse({ status, json, text, contentType = "application/json" }) {
  return {
    status,
    headers: { get: (name) => name.toLowerCase() === "content-type" ? contentType : null },
    clone() { return { json: async () => json }; },
    json: async () => json,
    text: async () => text || "",
  };
}

function reuseEnvironment() {
  return {
    ...harnessEnvironment(),
    DARFUS_E2E_REUSE_RUNTIME: "1",
    DARFUS_E2E_FRONTEND_URL: "http://localhost:3000",
    DARFUS_E2E_BACKEND_URL: "http://localhost:8000",
  };
}

function runtimeFingerprintFetch() {
  return async (url) => {
    if (url.endsWith("/api/v1/auth/me")) {
      return fingerprintResponse({ status: 401, json: { success: false, error: { code: "AUTH_REQUIRED" } } });
    }
    if (url.endsWith("/en/login")) {
      return fingerprintResponse({ status: 200, text: "<html>_next Darfus login</html>", contentType: "text/html" });
    }
    throw new Error("unexpected URL");
  };
}

test("opens a real owned log stream before it can be passed to spawn and closes it idempotently", async () => {
  const root = ownedRoot("open");
  const destination = await openOwnedLogDestination(path.join(root, "runtime-logs", "backend.log"), root);
  try {
    assert.equal(Number.isInteger(destination.stream.fd), true);
    assert.equal(destination.stream.fd >= 0, true);
    await destination.close();
    await destination.close();
    assert.equal(destination.closed, true);
  } finally {
    cleanupOwnedRunRoot(root);
  }
});

test("an actually spawned Node child accepts an already-open owned log stream", async () => {
  const root = ownedRoot("real-child");
  const destination = await openOwnedLogDestination(path.join(root, "runtime-logs", "backend.log"), root);
  try {
    const outcome = await new Promise((resolve) => {
      const child = spawn(process.execPath, ["-e", "process.exit(0)"], {
        stdio: ["ignore", destination.stream, destination.stream],
      });
      child.once("error", (error) => resolve({ type: "error", code: error.code }));
      child.once("exit", (code) => resolve({ type: "exit", code }));
    });
    assert.deepEqual(outcome, { type: "exit", code: 0 });
  } finally {
    await destination.close();
    await cleanupOwnedRunRoot(root);
  }
});

test("the Windows-safe direct Node CLI launcher starts a real child with owned logs", async () => {
  const root = ownedRoot("direct-cli");
  const destination = await openOwnedLogDestination(path.join(root, "runtime-logs", "frontend.log"), root);
  try {
    const nextEntrypoint = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
    const launch = validateChildLaunch({
      command: process.execPath,
      args: [nextEntrypoint, "--version"],
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", destination.stream, destination.stream],
    });
    const outcome = await new Promise((resolve) => {
      const child = spawn(launch.command, launch.args, launch.options);
      child.once("error", (error) => resolve({ type: "error", code: error.code }));
      child.once("exit", (code) => resolve({ type: "exit", code }));
    });
    assert.deepEqual(outcome, { type: "exit", code: 0 });
    assert.equal(launch.diagnostic.commandBasename, path.basename(process.execPath));
    assert.deepEqual(launch.diagnostic.stdioEntryTypes, ["ignore", "openStream", "openStream"]);
  } finally {
    await destination.close();
    await cleanupOwnedRunRoot(root);
  }
});

test("launcher validation rejects invalid cwd and stdio and removes malformed environment values", () => {
  const sanitized = sanitizeChildEnvironment({ SAFE: "value", OMIT: undefined, OBJECT: {} });
  assert.deepEqual(sanitized, { env: { SAFE: "value" }, invalidValueCount: 2 });
  assert.throws(
    () => validateChildLaunch({ command: process.execPath, args: ["-e", ""], cwd: path.join(tmpdir(), "missing-harness-cwd"), env: {}, stdio: "ignore" }),
    /HARNESS_CHILD_INVALID_CWD/,
  );
  assert.throws(
    () => validateChildLaunch({ command: process.execPath, args: ["-e", ""], cwd: process.cwd(), env: {}, stdio: ["ignore", { fd: -1 }, "ignore"] }),
    /HARNESS_CHILD_INVALID_STDIO/,
  );
});

test("reuse mode is explicit and accepts only the approved local runtime origins", () => {
  assert.deepEqual(resolveRuntimeMode({}), { reuseExistingRuntime: false });
  assert.deepEqual(resolveRuntimeMode(reuseEnvironment()), {
    reuseExistingRuntime: true,
    frontendUrl: "http://localhost:3000",
    backendUrl: "http://localhost:8000",
  });
  assert.throws(
    () => resolveRuntimeMode({ ...reuseEnvironment(), DARFUS_E2E_FRONTEND_URL: "https://example.test" }),
    /HARNESS_REUSE_RUNTIME_INVALID_FRONTEND_URL/,
  );
  assert.throws(
    () => resolveRuntimeMode({ ...reuseEnvironment(), DARFUS_E2E_BACKEND_URL: "http://localhost:8001" }),
    /HARNESS_REUSE_RUNTIME_INVALID_BACKEND_URL/,
  );
});

test("reuse-mode service fingerprints require canonical backend and DARFUS frontend responses", async () => {
  const fingerprint = await fingerprintExistingRuntime({
    frontendUrl: "http://localhost:3000",
    backendUrl: "http://localhost:8000",
    fetchImpl: runtimeFingerprintFetch(),
  });
  assert.deepEqual(fingerprint, {
    backendStatus: 401,
    backendCanonicalErrorEnvelope: true,
    frontendStatus: 200,
    frontendNextMarker: true,
    frontendDarfusMarker: true,
  });
  await assert.rejects(
    fingerprintExistingRuntime({ frontendUrl: "http://localhost:3000", backendUrl: "http://localhost:8000", fetchImpl: async () => { throw new Error("offline"); } }),
    /PREEXISTING_BACKEND_UNAVAILABLE/,
  );
});

test("rejects invalid descriptor and non-owned paths before any child can receive stdio", async () => {
  const root = ownedRoot("invalid");
  try {
    const invalidStream = new EventEmitter();
    invalidStream.fd = null;
    invalidStream.destroy = () => {};
    process.nextTick(() => invalidStream.emit("open"));
    await assert.rejects(
      openOwnedLogDestination(path.join(root, "runtime-logs", "backend.log"), root, { createStream: () => invalidStream }),
      /HARNESS_LOG_FD_INVALID/,
    );
    assert.throws(
      () => assertOwnedRunRoot(path.join(tmpdir(), "outside-owned-prefix")),
      /HARNESS_OWNED_ROOT_INVALID/,
    );
  } finally {
    cleanupOwnedRunRoot(root);
  }
});

test("a synchronous spawn failure closes the opened log and removes only owned known files", async () => {
  let spawns = 0;
  const result = await runSingleCompanyBrowserAcceptance({
    environment: harnessEnvironment(),
    spawnProcess: () => {
      spawns += 1;
      throw Object.assign(new Error("invalid stdio"), { code: "ERR_INVALID_ARG_VALUE" });
    },
  });
  assert.equal(spawns, 1);
  assert.equal(result.exitCode, 1);
  assert.equal(result.reason, "HARNESS_SPAWN_STDIO_INVALID");
  assert.equal(result.cleanup.outcome, "REMOVED");
});

test("readiness failure stops after backend startup and cleans its log destination", async () => {
  let spawnCount = 0;
  let clock = 0;
  const result = await runSingleCompanyBrowserAcceptance({
    environment: harnessEnvironment(),
    now: () => clock,
    wait: async () => { clock += 120_001; },
    fetchImpl: async () => { throw new Error("offline"); },
    spawnProcess: () => {
      spawnCount += 1;
      return fakeChild();
    },
  });
  assert.equal(spawnCount, 1);
  assert.equal(result.reason, "HARNESS_READINESS_FAILED_OWNED_BACKEND");
  assert.equal(result.cleanup.outcome, "REMOVED");
});

test("an asynchronous child spawn failure is classified safely and closes its owned log", async () => {
  let clock = 0;
  const result = await runSingleCompanyBrowserAcceptance({
    environment: harnessEnvironment(),
    now: () => clock,
    wait: async () => {
      clock += 1;
      await new Promise((resolve) => setImmediate(resolve));
    },
    fetchImpl: async () => ({ status: 503 }),
    spawnProcess: () => {
      const child = fakeChild();
      process.nextTick(() => child.emit("error", Object.assign(new Error("spawn failure"), { code: "EBADF" })));
      return child;
    },
  });
  assert.equal(result.reason, "HARNESS_CHILD_SPAWN_EBADF");
  assert.equal(result.cleanup.outcome, "REMOVED");
});

test("a command-not-found child error is classified without starting later children", async () => {
  let spawnCount = 0;
  let clock = 0;
  const result = await runSingleCompanyBrowserAcceptance({
    environment: harnessEnvironment(),
    now: () => clock,
    wait: async () => {
      clock += 1;
      await new Promise((resolve) => setImmediate(resolve));
    },
    fetchImpl: async () => ({ status: 503 }),
    spawnProcess: () => {
      spawnCount += 1;
      const child = fakeChild();
      process.nextTick(() => child.emit("error", Object.assign(new Error("not found"), { code: "ENOENT" })));
      return child;
    },
  });
  assert.equal(spawnCount, 1);
  assert.equal(result.reason, "HARNESS_CHILD_COMMAND_NOT_FOUND");
  assert.equal(result.cleanup.outcome, "REMOVED");
});

test("frontend readiness failure does not start Playwright and cleans backend and frontend logs", async () => {
  let spawnCount = 0;
  let fetchCount = 0;
  let clock = 0;
  const result = await runSingleCompanyBrowserAcceptance({
    environment: harnessEnvironment(),
    now: () => clock,
    wait: async () => { clock += 120_001; },
    fetchImpl: async () => {
      fetchCount += 1;
      if (fetchCount === 1) return { status: 401 };
      throw new Error("offline");
    },
    spawnProcess: () => {
      spawnCount += 1;
      return fakeChild();
    },
  });
  assert.equal(spawnCount, 2);
  assert.equal(result.reason, "HARNESS_READINESS_FAILED_OWNED_FRONTEND");
  assert.equal(result.cleanup.outcome, "REMOVED");
});

test("the harness resolves frontend and Playwright through direct Node entrypoints", async () => {
  const launches = [];
  let fetchCount = 0;
  const result = await runSingleCompanyBrowserAcceptance({
    environment: harnessEnvironment(),
    fetchImpl: async () => {
      fetchCount += 1;
      return { status: 200 };
    },
    spawnProcess: (command, args, options) => {
      launches.push({ command, args, options });
      const child = fakeChild();
      if (launches.length === 3) process.nextTick(() => child.emit("exit", 0));
      return child;
    },
  });
  assert.equal(result.reason, "PASS");
  assert.equal(fetchCount, 2);
  assert.equal(launches.length, 3);
  assert.equal(launches[1].command, process.execPath);
  assert.match(launches[1].args[0], /node_modules[\\/]next[\\/]dist[\\/]bin[\\/]next$/);
  assert.equal(launches[2].command, process.execPath);
  assert.match(launches[2].args[0], /node_modules[\\/]@playwright[\\/]test[\\/]cli\.js$/);
  assert.equal(launches.every((launch) => Object.values(launch.options.env).every((value) => typeof value === "string")), true);
});

test("reuse mode fingerprints pre-existing services and never spawns or stops backend/frontend children", async () => {
  const launches = [];
  const result = await runSingleCompanyBrowserAcceptance({
    environment: reuseEnvironment(),
    fetchImpl: runtimeFingerprintFetch(),
    spawnProcess: (command, args, options) => {
      launches.push({ command, args, options });
      const child = fakeChild();
      process.nextTick(() => child.emit("exit", 0));
      return child;
    },
  });
  assert.equal(result.reason, "PASS");
  assert.equal(result.reuseExistingRuntime, true);
  assert.equal(result.started.length, 0);
  assert.equal(launches.length, 1);
  assert.equal(launches[0].command, process.execPath);
  assert.match(launches[0].args[0], /node_modules[\\/]@playwright[\\/]test[\\/]cli\.js$/);
  assert.equal(launches.some((launch) => launch.command === "taskkill"), false);
  assert.equal(result.launcherDiagnostics.some((item) => ["backend", "frontend"].includes(item.child)), false);
  assert.equal(result.cleanup.outcome, "REMOVED");
});

test("a successful mocked launcher path closes every owned handle and leaves no credential values in logs", async () => {
  let spawnCount = 0;
  const result = await runSingleCompanyBrowserAcceptance({
    environment: harnessEnvironment(),
    fetchImpl: async () => ({ status: 200 }),
    spawnProcess: () => {
      spawnCount += 1;
      const child = fakeChild();
      if (spawnCount === 3) process.nextTick(() => child.emit("exit", 0));
      return child;
    },
  });
  assert.equal(spawnCount, 3);
  assert.equal(result.exitCode, 0);
  assert.equal(result.reason, "PASS");
  assert.equal(result.secretLeakageCount, 0);
  assert.equal(result.cleanup.outcome, "REMOVED");
});

test("cleanup preserves an unknown owned file instead of deleting it and is safe to repeat after review", async () => {
  const root = ownedRoot("unknown");
  const unknown = path.join(root, "unknown.txt");
  writeFileSync(unknown, "non-sensitive-test-content", "utf8");
  const first = await cleanupOwnedRunRoot(root);
  try {
    assert.equal(first.outcome, "PARTIAL_UNKNOWN_CONTENT");
    assert.deepEqual(first.unknownFiles, ["unknown.txt"]);
    assert.equal(existsSync(unknown), true);
    assert.equal(readFileSync(unknown, "utf8"), "non-sensitive-test-content");
  } finally {
    rmSync(unknown, { force: true });
    const second = await cleanupOwnedRunRoot(root);
    assert.equal(second.outcome, "REMOVED");
  }
});

test("missing credentials exits before opening a log or starting a listener", async () => {
  const result = await runSingleCompanyBrowserAcceptance({ environment: {} });
  assert.deepEqual(result, { exitCode: 2, reason: "AUTHENTICATED_SESSION_UNAVAILABLE", started: [] });
});
