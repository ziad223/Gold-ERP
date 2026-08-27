import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const RUN_PREFIX = "darfus-ux-browser-acceptance-";
const KNOWN_RUN_FILES = new Set([
  "runtime-logs/backend.log",
  "runtime-logs/frontend.log",
  "single-company-runtime-summary.json",
]);

function normalizedRelative(root, candidate) {
  const relative = path.relative(root, candidate);
  if (!relative || relative === "." || path.isAbsolute(relative) || relative.startsWith("..") || relative.includes(`..${path.sep}`)) {
    throw new Error("HARNESS_OWNED_PATH_INVALID");
  }
  return relative.split(path.sep).join("/");
}

export function assertOwnedRunRoot(runRoot, temporaryRoot = tmpdir()) {
  const root = path.resolve(runRoot);
  const parent = path.resolve(temporaryRoot);
  const relative = path.relative(parent, root);
  if (path.isAbsolute(relative) || relative.startsWith("..") || relative.includes(`..${path.sep}`) || !path.basename(root).startsWith(RUN_PREFIX)) {
    throw new Error("HARNESS_OWNED_ROOT_INVALID");
  }
  return root;
}

export async function openOwnedLogDestination(logPath, runRoot, { createStream = createWriteStream } = {}) {
  const root = assertOwnedRunRoot(runRoot);
  const resolved = path.resolve(logPath);
  const relative = normalizedRelative(root, resolved);
  if (!KNOWN_RUN_FILES.has(relative)) throw new Error("HARNESS_OWNED_LOG_PATH_INVALID");

  const stream = createStream(resolved, { flags: "a", mode: 0o600 });
  try {
    await new Promise((resolve, reject) => {
      const onOpen = () => {
        stream.off("error", onError);
        resolve();
      };
      const onError = (error) => {
        stream.off("open", onOpen);
        reject(error);
      };
      stream.once("open", onOpen);
      stream.once("error", onError);
    });
  } catch {
    stream.destroy();
    throw new Error("HARNESS_LOG_OPEN_FAILED");
  }
  if (!Number.isInteger(stream.fd) || stream.fd < 0) {
    stream.destroy();
    throw new Error("HARNESS_LOG_FD_INVALID");
  }
  stream.on("error", () => {});

  let closed = false;
  let closing = null;
  return {
    stream,
    path: resolved,
    async close() {
      if (closing) return closing;
      if (closed) return undefined;
      closed = true;
      closing = new Promise((resolve) => {
        stream.once("close", resolve);
        stream.once("error", resolve);
        stream.end();
      });
      return closing;
    },
    get closed() {
      return closed;
    },
  };
}

function scanOwnedDirectory(root, directory = root, directories = [], unknownFiles = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    const relative = normalizedRelative(root, candidate);
    if (entry.isDirectory()) {
      scanOwnedDirectory(root, candidate, directories, unknownFiles);
      directories.push(candidate);
    } else if (!entry.isSymbolicLink() && entry.isFile() && KNOWN_RUN_FILES.has(relative)) {
      unlinkSync(candidate);
    } else {
      unknownFiles.push(relative);
    }
  }
  return { directories, unknownFiles };
}

export async function cleanupOwnedRunRoot(runRoot, {
  retries = 3,
  delayMs = 75,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  const root = assertOwnedRunRoot(runRoot);
  if (!existsSync(root)) return { outcome: "REMOVED", unknownFiles: [], errorCode: null };

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { directories, unknownFiles } = scanOwnedDirectory(root);
      if (unknownFiles.length > 0) {
        return { outcome: "PARTIAL_UNKNOWN_CONTENT", unknownFiles, errorCode: null };
      }
      for (const directory of directories) rmdirSync(directory);
      rmdirSync(root);
      return { outcome: "REMOVED", unknownFiles: [], errorCode: null };
    } catch (error) {
      lastError = error;
      if (!["EPERM", "EBUSY", "ENOTEMPTY"].includes(error?.code) || attempt === retries) break;
      await sleep(delayMs);
    }
  }
  return {
    outcome: "PARTIAL_OS_ERROR",
    unknownFiles: [],
    errorCode: lastError?.code || "HARNESS_TEMP_CLEANUP_FAILED",
  };
}

function harnessError(code) {
  return new Error(code);
}

function stdioEntryType(entry) {
  if (["ignore", "pipe", "inherit"].includes(entry)) return entry;
  if (Number.isInteger(entry) && entry >= 0) return "fd";
  if (entry && Number.isInteger(entry.fd) && entry.fd >= 0) return "openStream";
  return "invalid";
}

export function sanitizeChildEnvironment(environment = {}) {
  const env = {};
  let invalidValueCount = 0;
  for (const [key, value] of Object.entries(environment)) {
    if (typeof value === "string") env[key] = value;
    else invalidValueCount += 1;
  }
  return { env, invalidValueCount };
}

export function validateChildLaunch({ command, args = [], cwd, env = {}, stdio, shell = false, windowsHide = false, detached = false }) {
  if (typeof command !== "string" || command.length === 0) throw harnessError("HARNESS_CHILD_INVALID_COMMAND");
  if (!Array.isArray(args) || args.some((argument) => typeof argument !== "string")) throw harnessError("HARNESS_CHILD_INVALID_ARGS");
  if (typeof cwd !== "string" || !path.isAbsolute(cwd) || !existsSync(cwd) || !statSync(cwd).isDirectory()) {
    throw harnessError("HARNESS_CHILD_INVALID_CWD");
  }

  const stdioEntries = Array.isArray(stdio) ? stdio : [stdio];
  const stdioTypes = stdioEntries.map(stdioEntryType);
  if (stdioTypes.includes("invalid")) throw harnessError("HARNESS_CHILD_INVALID_STDIO");

  const { env: safeEnv, invalidValueCount } = sanitizeChildEnvironment(env);
  const stdout = stdioEntries[1];
  const stderr = stdioEntries[2];
  return {
    command,
    args,
    options: { cwd, env: safeEnv, stdio, shell, windowsHide, detached },
    diagnostic: {
      platform: process.platform,
      nodeVersion: process.version,
      launcherMode: "direct-node-entrypoint",
      commandBasename: path.basename(command),
      argumentCount: args.length,
      cwdExists: true,
      cwdIsDirectory: true,
      cwdPathCategory: path.basename(cwd) || "root",
      stdioEntryTypes: stdioTypes,
      stdoutFdValid: Number.isInteger(stdout?.fd) && stdout.fd >= 0,
      stderrFdValid: Number.isInteger(stderr?.fd) && stderr.fd >= 0,
      environmentKeyCount: Object.keys(safeEnv).length,
      invalidEnvironmentValueCount: invalidValueCount,
      shell: Boolean(shell),
      windowsHide: Boolean(windowsHide),
      detached: Boolean(detached),
    },
  };
}

function resolveNodeEntrypoint(repo, segments, errorCode) {
  const entrypoint = path.join(repo, ...segments);
  if (!existsSync(entrypoint)) throw harnessError(errorCode);
  return entrypoint;
}

function waitForChildExit(child, timeoutMs = 5_000) {
  if (!child || child.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function stopOwned({ child }, spawnProcess = spawn) {
  if (!child || !child.pid || child.exitCode !== null) return;
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawnProcess("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      killer.once("error", resolve);
      killer.once("exit", resolve);
    });
  } else {
    child.kill("SIGTERM");
  }
  await waitForChildExit(child);
}

function safeHarnessFailure(error) {
  const message = String(error?.message || error || "HARNESS_EXECUTION_FAILED");
  if (message.includes("HARNESS_")) return message;
  if (error?.code === "ERR_INVALID_ARG_VALUE") return "HARNESS_SPAWN_STDIO_INVALID";
  if (error?.code === "ENOENT") return "HARNESS_CHILD_COMMAND_NOT_FOUND";
  if (error?.code) return `HARNESS_CHILD_SPAWN_${String(error.code).replace(/[^A-Z0-9_]/gi, "_").toUpperCase()}`;
  return "HARNESS_EXECUTION_FAILED";
}

function findBrowser(environment) {
  const candidates = [
    environment.DARFUS_E2E_BROWSER_PATH,
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

function validateLocalRuntimeUrl(rawUrl, label, expectedPort) {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) throw harnessError(`HARNESS_REUSE_RUNTIME_${label}_URL_REQUIRED`);
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw harnessError(`HARNESS_REUSE_RUNTIME_INVALID_${label}_URL`);
  }
  if (
    parsed.protocol !== "http:"
    || !["localhost", "127.0.0.1"].includes(parsed.hostname)
    || parsed.port !== String(expectedPort)
    || parsed.username
    || parsed.password
    || parsed.search
    || parsed.hash
    || !["", "/"].includes(parsed.pathname)
  ) {
    throw harnessError(`HARNESS_REUSE_RUNTIME_INVALID_${label}_URL`);
  }
  return parsed.origin;
}

export function resolveRuntimeMode(environment = {}) {
  if (environment.DARFUS_E2E_REUSE_RUNTIME !== "1") return { reuseExistingRuntime: false };
  return {
    reuseExistingRuntime: true,
    frontendUrl: validateLocalRuntimeUrl(environment.DARFUS_E2E_FRONTEND_URL, "FRONTEND", 3000),
    backendUrl: validateLocalRuntimeUrl(environment.DARFUS_E2E_BACKEND_URL, "BACKEND", 8000),
  };
}

function headerValue(response, name) {
  if (typeof response?.headers?.get === "function") return response.headers.get(name);
  return response?.headers?.[name] || response?.headers?.[name.toLowerCase()] || null;
}

async function hasCanonicalErrorEnvelope(response) {
  try {
    const body = await (typeof response.clone === "function" ? response.clone() : response).json();
    return body?.success === false && typeof body?.error?.code === "string";
  } catch {
    return false;
  }
}

export async function fingerprintExistingRuntime({ frontendUrl, backendUrl, fetchImpl = fetch }) {
  let backend;
  try {
    backend = await fetchImpl(`${backendUrl}/api/v1/auth/me`, { redirect: "manual" });
  } catch {
    throw harnessError("PREEXISTING_BACKEND_UNAVAILABLE");
  }
  const backendCanonical = await hasCanonicalErrorEnvelope(backend);
  if (backend.status !== 401 || !backendCanonical || !String(headerValue(backend, "content-type") || "").includes("application/json")) {
    throw harnessError("PREEXISTING_RUNTIME_MISMATCH");
  }

  let frontend;
  try {
    frontend = await fetchImpl(`${frontendUrl}/en/login`, { redirect: "manual" });
  } catch {
    throw harnessError("PREEXISTING_FRONTEND_UNAVAILABLE");
  }
  let frontendText = "";
  try {
    frontendText = await frontend.text();
  } catch {
    throw harnessError("PREEXISTING_FRONTEND_UNAVAILABLE");
  }
  const nextMarker = /__next|_next/i.test(frontendText);
  const darfusMarker = /darfus|jewellery|login/i.test(frontendText);
  if (frontend.status !== 200 || !nextMarker || !darfusMarker) throw harnessError("PREEXISTING_RUNTIME_MISMATCH");

  return {
    backendStatus: backend.status,
    backendCanonicalErrorEnvelope: backendCanonical,
    frontendStatus: frontend.status,
    frontendNextMarker: nextMarker,
    frontendDarfusMarker: darfusMarker,
  };
}

function readSanitizedSummary(runRoot) {
  const summaryPath = path.join(runRoot, "single-company-runtime-summary.json");
  if (!existsSync(summaryPath)) return null;
  try {
    return JSON.parse(readFileSync(summaryPath, "utf8"));
  } catch {
    return null;
  }
}

function occurrenceCount(content, value) {
  if (!value) return 0;
  let count = 0;
  let cursor = 0;
  while (true) {
    const found = content.indexOf(value, cursor);
    if (found < 0) return count;
    count += 1;
    cursor = found + value.length;
  }
}

function scanOwnedLogSafety(runRoot, values) {
  let occurrences = 0;
  for (const relative of KNOWN_RUN_FILES) {
    const candidate = path.join(runRoot, relative);
    if (!existsSync(candidate)) continue;
    const content = readFileSync(candidate, "utf8");
    for (const value of values) occurrences += occurrenceCount(content, value);
  }
  return occurrences;
}

export async function runSingleCompanyBrowserAcceptance({
  repo = process.cwd(),
  environment = process.env,
  spawnProcess = spawn,
  fetchImpl = fetch,
  now = () => Date.now(),
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  temporaryRoot = tmpdir(),
} = {}) {
  const email = environment.DARFUS_E2E_EMAIL;
  const password = environment.DARFUS_E2E_PASSWORD;
  if (!email || !password) return { exitCode: 2, reason: "AUTHENTICATED_SESSION_UNAVAILABLE", started: [] };

  const browserPath = findBrowser(environment);
  if (!browserPath) return { exitCode: 2, reason: "BROWSER_EXECUTABLE_UNAVAILABLE", started: [] };

  let runtimeMode;
  try {
    runtimeMode = resolveRuntimeMode(environment);
  } catch (error) {
    return { exitCode: 1, reason: safeHarnessFailure(error), started: [] };
  }
  const runTemporaryRoot = runtimeMode.reuseExistingRuntime ? path.join(temporaryRoot, "DARFUS") : temporaryRoot;
  const runRoot = path.join(runTemporaryRoot, `${RUN_PREFIX}${now()}`);
  const logsRoot = path.join(runRoot, "runtime-logs");
  assertOwnedRunRoot(runRoot, runTemporaryRoot);
  mkdirSync(runtimeMode.reuseExistingRuntime ? runRoot : logsRoot, { recursive: true });

  const owned = [];
  const logs = [];
  const started = [];
  const launcherDiagnostics = [];
  let runtimeFingerprint = null;
  let result = { exitCode: 1, reason: "HARNESS_EXECUTION_FAILED", started };

  const openLog = async (name) => {
    const destination = await openOwnedLogDestination(path.join(logsRoot, `${name}.log`), runRoot);
    logs.push(destination);
    return destination;
  };
  const spawnOwned = async (command, args, options, name) => {
    const output = await openLog(name);
    let child;
    try {
      const launch = validateChildLaunch({
        command,
        args,
        ...options,
        stdio: ["ignore", output.stream, output.stream],
      });
      launcherDiagnostics.push({ child: name, ...launch.diagnostic });
      child = spawnProcess(launch.command, launch.args, launch.options);
    } catch (error) {
      await output.close();
      throw error;
    }
    child.once("error", (error) => {
      child.harnessSpawnError = error;
    });
    owned.push({ child, name });
    started.push(name);
    return child;
  };
  const waitFor = async (url, label) => {
    const deadline = now() + 120_000;
    while (now() < deadline) {
      const spawnFailure = owned.find((entry) => entry.child?.harnessSpawnError)?.child?.harnessSpawnError;
      if (spawnFailure) throw spawnFailure;
      try {
        const response = await fetchImpl(url, { redirect: "manual" });
        if (response.status < 500) return;
      } catch {}
      await wait(500);
    }
    throw new Error(`HARNESS_READINESS_FAILED_${label.toUpperCase().replace(/\W+/g, "_")}`);
  };

  try {
    if (runtimeMode.reuseExistingRuntime) {
      runtimeFingerprint = await fingerprintExistingRuntime({ ...runtimeMode, fetchImpl });
    } else {
      await spawnOwned(process.execPath, ["src/server.js"], {
        cwd: path.join(repo, "backend"),
        env: {
          ...environment,
          NODE_ENV: "development",
          PORT: "8001",
          CORS_ALLOWED_ORIGINS: "http://127.0.0.1:3300",
          ALLOW_RUNTIME_ADMIN_BOOTSTRAP: "false",
          DISABLE_RESERVATION_EXPIRY_SCHEDULER: "true",
        },
      }, "backend");
      await waitFor("http://127.0.0.1:8001/api/v1/auth/me", "owned backend");

      const nextEntrypoint = resolveNodeEntrypoint(repo, ["node_modules", "next", "dist", "bin", "next"], "HARNESS_FRONTEND_ENTRYPOINT_UNAVAILABLE");
      await spawnOwned(process.execPath, [nextEntrypoint, "dev", "--hostname", "127.0.0.1", "--port", "3300", "--webpack"], {
        cwd: repo,
        env: {
          ...environment,
          NEXT_PUBLIC_API_URL: "http://127.0.0.1:8001/api/v1",
          NEXT_PUBLIC_DATA_SOURCE: "api",
        },
      }, "frontend");
      await waitFor("http://127.0.0.1:3300/en/login", "owned frontend");
    }

    const playwrightEntrypoint = resolveNodeEntrypoint(repo, ["node_modules", "@playwright", "test", "cli.js"], "HARNESS_PLAYWRIGHT_ENTRYPOINT_UNAVAILABLE");
    const exitCode = await new Promise((resolve, reject) => {
      let child;
      try {
        const launch = validateChildLaunch({
          command: process.execPath,
          args: [playwrightEntrypoint, "test", "--config", "playwright.single-company-runtime.config.ts", "--project", "Local Chrome"],
          cwd: repo,
          env: {
            ...environment,
            DARFUS_E2E_BROWSER_PATH: browserPath,
            DARFUS_E2E_BASE_URL: runtimeMode.reuseExistingRuntime ? runtimeMode.frontendUrl : "http://127.0.0.1:3300",
            DARFUS_E2E_BACKEND_URL: runtimeMode.reuseExistingRuntime ? runtimeMode.backendUrl : "http://127.0.0.1:8001",
            DARFUS_E2E_EVIDENCE_DIR: runRoot,
          },
          stdio: "inherit",
        });
        launcherDiagnostics.push({ child: "playwright", ...launch.diagnostic });
        child = spawnProcess(launch.command, launch.args, launch.options);
      } catch (error) {
        reject(error);
        return;
      }
      child.once("error", reject);
      child.once("exit", (code) => resolve(code ?? 1));
    });
    result = { exitCode, reason: exitCode === 0 ? "PASS" : "PLAYWRIGHT_SCENARIO_FAILED", started, reuseExistingRuntime: runtimeMode.reuseExistingRuntime, runtimeFingerprint, launcherDiagnostics, evidence: readSanitizedSummary(runRoot) };
  } catch (error) {
    result = { exitCode: 1, reason: safeHarnessFailure(error), started, reuseExistingRuntime: runtimeMode.reuseExistingRuntime, runtimeFingerprint, launcherDiagnostics };
  } finally {
    await Promise.all([...owned].reverse().map((entry) => stopOwned(entry, spawnProcess)));
    for (const log of [...logs].reverse()) {
      try {
        await log.close();
      } catch {}
    }
    const evidence = result.evidence || readSanitizedSummary(runRoot);
    const secretLeakageCount = scanOwnedLogSafety(runRoot, [email, password]);
    const cleanup = await cleanupOwnedRunRoot(runRoot, { sleep: wait });
    result = { ...result, evidence, secretLeakageCount, cleanup };
  }
  return result;
}

function isMainModule() {
  return Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  runSingleCompanyBrowserAcceptance()
    .then((result) => {
      console.log(`HARNESS_RESULT=${JSON.stringify(result)}`);
      process.exitCode = result.exitCode;
    })
    .catch((error) => {
      console.error(`HARNESS_RESULT=${JSON.stringify({ exitCode: 1, reason: safeHarnessFailure(error) })}`);
      process.exitCode = 1;
    });
}
