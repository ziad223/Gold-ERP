/**
 * Phase 22-Fix — verify strict production data-source hardening.
 *
 * (A) Functional: transpile lib/data-source.ts and exercise getDataSourceMode()
 *     + assertProductionDataSource() under different NODE_ENV / env combos —
 *     production forces "api" and fails loudly on missing/invalid mode or missing
 *     API URL; development defaults to "mock" and throws on an invalid value.
 * (B) Static: no `|| "mock"` default survives; no unsafe cast before validation;
 *     the API client imports the centralized helper and never returns mock on
 *     error; no direct NEXT_PUBLIC_DATA_SOURCE reads outside the central module;
 *     business localStorage persistence stays gated by !isApi; mock files intact.
 *
 * No DB, no live requests.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");

// ── (A) Functional: run the compiled selector under controlled envs ──────────
const dsSource = read("lib/data-source.ts");
const dsJs = ts.transpileModule(dsSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText;

/** Load the module fresh with a specific process.env; returns exports or throws. */
function loadWith(env) {
  const sandbox = { module: { exports: {} }, exports: {}, process: { env: { ...env } }, console };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(dsJs, sandbox, { timeout: 2000 });
  return sandbox.module.exports;
}

function functional() {
  // Production, correctly configured → api, assert passes.
  const prodOk = loadWith({ NODE_ENV: "production", NEXT_PUBLIC_DATA_SOURCE: "api", NEXT_PUBLIC_API_URL: "https://api.example.com/api/v1" });
  assert.equal(prodOk.getDataSourceMode(), "api", "production resolves to api");
  assert.equal(prodOk.DATA_SOURCE, "api", "production DATA_SOURCE const is api");
  assert.doesNotThrow(() => prodOk.assertProductionDataSource(), "valid production passes the guard");

  // Production, missing data source → assert throws (module still loads, forced api).
  const prodMissing = loadWith({ NODE_ENV: "production", NEXT_PUBLIC_DATA_SOURCE: "", NEXT_PUBLIC_API_URL: "https://x/api" });
  assert.equal(prodMissing.getDataSourceMode(), "api", "production never returns mock even when unset");
  assert.throws(() => prodMissing.assertProductionDataSource(), /required in production/, "missing production data source fails loudly");

  // Production, mock explicitly → forbidden.
  const prodMock = loadWith({ NODE_ENV: "production", NEXT_PUBLIC_DATA_SOURCE: "mock", NEXT_PUBLIC_API_URL: "https://x/api" });
  assert.throws(() => prodMock.assertProductionDataSource(), /forbidden in production/, "production mock is forbidden");

  // Production, api but missing URL → throws.
  const prodNoUrl = loadWith({ NODE_ENV: "production", NEXT_PUBLIC_DATA_SOURCE: "api", NEXT_PUBLIC_API_URL: "" });
  assert.throws(() => prodNoUrl.assertProductionDataSource(), /NEXT_PUBLIC_API_URL is required/, "production requires the API URL");

  // Development, unset → mock; assert is a no-op.
  const devDefault = loadWith({ NODE_ENV: "development", NEXT_PUBLIC_DATA_SOURCE: "" });
  assert.equal(devDefault.getDataSourceMode(), "mock", "development defaults to mock");
  assert.doesNotThrow(() => devDefault.assertProductionDataSource(), "assert is a no-op in development");

  // Development, api → api.
  const devApi = loadWith({ NODE_ENV: "development", NEXT_PUBLIC_DATA_SOURCE: "api" });
  assert.equal(devApi.getDataSourceMode(), "api", "development honors api");

  // Development, invalid value → throws (loudly) at module load.
  assert.throws(
    () => loadWith({ NODE_ENV: "development", NEXT_PUBLIC_DATA_SOURCE: "prod" }),
    /Invalid NEXT_PUBLIC_DATA_SOURCE/,
    "an invalid data source throws loudly",
  );
}

// ── (B) Static assertions ────────────────────────────────────────────────────
function staticChecks() {
  assert.ok(fs.existsSync(path.resolve(ROOT, "lib/data-source.ts")), "lib/data-source.ts exists");

  // No `|| "mock"` default remains in the two core files.
  for (const rel of ["lib/data-source.ts", "lib/api/client.ts"]) {
    assert.ok(!read(rel).includes('|| "mock"'), `${rel} has no '|| "mock"' default`);
  }

  // No unsafe cast of the raw env value before validation.
  assert.ok(!dsSource.includes("NEXT_PUBLIC_DATA_SOURCE as DataSourceMode"), "no unsafe cast of the raw env value");
  assert.ok(!/as DataSourceMode\)\s*\|\|/.test(dsSource), "no `as DataSourceMode) ||` default cast");

  // Production guard exists with the three required rules.
  assert.ok(/NODE_ENV\s*===\s*"production"/.test(dsSource), "data-source.ts has a NODE_ENV production guard");
  assert.ok(dsSource.includes("assertProductionDataSource"), "assertProductionDataSource is defined");
  assert.ok(/required in production/.test(dsSource), "production requires NEXT_PUBLIC_DATA_SOURCE=api");
  assert.ok(/forbidden in production/.test(dsSource), "production forbids mock/local");
  assert.ok(/NEXT_PUBLIC_API_URL is required/.test(dsSource), "production requires NEXT_PUBLIC_API_URL");

  // API client uses the centralized helper and guard.
  const client = read("lib/api/client.ts");
  assert.ok(/import\s*\{[^}]*assertProductionDataSource[^}]*\}\s*from\s*"@\/lib\/data-source"/.test(client), "client imports the centralized guard");
  assert.ok(client.includes("assertProductionDataSource()"), "client calls the production guard");
  assert.ok(client.includes("getDataSourceMode()"), "client uses the centralized mode getter");
  // No catch-return-mock / fallback-to-local: the client must not import or
  // return the mock/local repositories or demo data on error.
  assert.ok(!/import[^\n]*local-impl/i.test(client), "client does not import the local repository");
  assert.ok(!/import[^\n]*(mock|demo)-?(data|repo)/i.test(client), "client does not import mock/demo data");
  assert.ok(!/catch[\s\S]{0,120}return\s+(mock|local|demo)/i.test(client), "client catch never returns mock/local/demo data");
  // API errors still throw (both non-OK responses and network errors).
  assert.ok(client.includes("throw new DarfusApiError"), "client still throws on API errors");
  assert.ok(/catch\s*\([\s\S]{0,200}throw\s+/.test(client), "client catch re-throws (no silent swallow)");

  // No direct NEXT_PUBLIC_DATA_SOURCE reads outside the central module.
  const stray = grepTree(["app", "hooks", "contexts", "components", "features", "lib"], /process\.env\.NEXT_PUBLIC_DATA_SOURCE/)
    .filter((f) => f.replace(/\\/g, "/") !== "lib/data-source.ts");
  assert.equal(stray.length, 0, `no direct NEXT_PUBLIC_DATA_SOURCE reads outside lib/data-source.ts (found: ${stray.join(", ")})`);

  // Business localStorage persistence stays gated by !isApi (api mode never persists).
  const erp = read("contexts/erp-context.tsx");
  assert.ok(/if\s*\(\s*DATA_SOURCE\s*===\s*"api"\s*\)\s*return;/.test(erp), "erp-context skips localStorage persistence in api mode");
  assert.ok(erp.includes('window.localStorage.removeItem(STORAGE_KEY)'), "erp-context clears demo state in api mode");
  const settings = read("contexts/settings-context.tsx");
  assert.ok(settings.includes("const isApi = DATA_SOURCE === \"api\"") || settings.includes("DATA_SOURCE === \"api\""), "settings-context gates on api mode");
  assert.ok(/if\s*\(\s*!isApi\s*\)/.test(settings), "settings-context localStorage writes are gated by !isApi");

  // Mock files are NOT deleted.
  assert.ok(fs.existsSync(path.resolve(ROOT, "lib/repositories/local-impl.ts")), "mock/local repository still present (not deleted)");
}

// Minimal recursive grep helper.
function grepTree(dirs, re) {
  const out = [];
  const exts = new Set([".ts", ".tsx", ".js", ".jsx"]);
  const walk = (abs) => {
    let entries;
    try { entries = fs.readdirSync(abs, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      const p = path.join(abs, e.name);
      if (e.isDirectory()) walk(p);
      else if (exts.has(path.extname(e.name))) {
        let src;
        try { src = fs.readFileSync(p, "utf8"); } catch { continue; }
        if (re.test(src)) out.push(path.relative(ROOT, p));
      }
    }
  };
  for (const d of dirs) walk(path.resolve(ROOT, d));
  return out;
}

(function main() {
  functional();
  staticChecks();
  console.log("verify-production-data-source: ok");
})();
