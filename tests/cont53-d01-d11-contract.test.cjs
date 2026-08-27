"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.join(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const bootstrap = require("../backend/src/services/financial-bootstrap.service");

function requireTypescriptWithAliases(relative) {
  const originalResolve = Module._resolveFilename;
  const originalTsExtension = Module._extensions[".ts"];
  Module._resolveFilename = function resolve(request, parent, isMain, options) {
    if (request.startsWith("@/")) return path.join(root, `${request.slice(2)}.ts`);
    return originalResolve.call(this, request, parent, isMain, options);
  };
  Module._extensions[".ts"] = (instance, filename) => {
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
      fileName: filename,
    }).outputText;
    instance._compile(output, filename);
  };
  const filename = path.join(root, relative);
  try {
    delete require.cache[filename];
    delete require.cache[path.join(root, "lib/data-source.ts")];
    return require(filename);
  } finally {
    Module._resolveFilename = originalResolve;
    Module._extensions[".ts"] = originalTsExtension;
  }
}

test("D01 current mapping authority ignores inactive history but fails closed for missing or conflicting active authority", () => {
  const active = { id: "active", isActive: true };
  const historical = { id: "historical", isActive: false };
  assert.equal(bootstrap.currentMappingAuthority([active]), active);
  assert.equal(bootstrap.currentMappingAuthority([active, historical]), active);

  for (const rows of [[historical], [active, { id: "active-2", isActive: true }]]) {
    assert.throws(
      () => bootstrap.currentMappingAuthority(rows),
      (error) => error?.errorCode === "FINANCIAL_READINESS_REQUIRED" && error?.statusCode === 422,
    );
  }

  const source = read("backend/src/services/financial-bootstrap.service.js");
  assert.match(source, /currentMappingAuthority\(existingRows\)/);
  assert.match(source, /where: \{ companyId, branchId, isActive: true \}/);
  assert.match(source, /evaluateMappingAccountCompatibility/);
});

test("D11 logo upload uses the canonical API client and retains native multipart handling", () => {
  const settings = read("app/[locale]/(dashboard)/settings/page.tsx");
  const client = read("lib/api/client.ts");
  const routes = read("backend/src/routes/index.js");

  assert.match(settings, /apiClient<[\s\S]*?>\("\/uploads\/logo", \{[\s\S]*?method: "POST",[\s\S]*?body: fd,[\s\S]*?locale,/);
  assert.doesNotMatch(settings, /fetch\(`\$\{apiBaseUrl\}\/uploads\/logo`/);
  assert.doesNotMatch(settings, /localStorage\.getItem\("darfus-token-v1"\)/);
  assert.match(client, /options\.body instanceof FormData/);
  assert.match(client, /headers\["X-Branch-ID"\] = activeBranchId/);
  assert.match(client, /headers\["X-Company-ID"\] = selectedCompanyId/);
  assert.match(routes, /router\.post\(\s*"\/uploads\/logo",\s*authMiddleware,\s*requirePermission\("settings\.update"\),\s*uploadMiddleware\.single\("logo"\)/);
});

test("D11 canonical client sends auth and Company/Branch context with FormData without a manual multipart content type", async () => {
  const previousWindow = global.window;
  const previousFetch = global.fetch;
  const previousDataSource = process.env.NEXT_PUBLIC_DATA_SOURCE;
  const previousApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const storage = new Map();
  let request;
  try {
    process.env.NEXT_PUBLIC_DATA_SOURCE = "api";
    process.env.NEXT_PUBLIC_API_URL = "http://cont53.invalid/api/v1";
    global.window = {
      crypto: global.crypto,
      localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
      sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    };
    global.fetch = async (url, init) => {
      request = { url, init };
      return { ok: true, status: 201, text: async () => JSON.stringify({ success: true, url: "/logo.png" }) };
    };
    const client = requireTypescriptWithAliases("lib/api/client.ts");
    client.setCompanyContextAccessor(() => ({ companyId: "company-cont53", generation: 1 }));
    client.setBranchContextAccessor(() => ({ branchId: "branch-cont53", generation: 1 }));
    await client.apiClient("/uploads/logo", { method: "POST", body: new FormData(), token: "token-cont53" });
    assert.equal(request.url, "http://cont53.invalid/api/v1/uploads/logo");
    assert.equal(request.init.headers.Authorization, "Bearer token-cont53");
    assert.equal(request.init.headers["X-Company-ID"], "company-cont53");
    assert.equal(request.init.headers["X-Branch-ID"], "branch-cont53");
    assert.equal(Object.hasOwn(request.init.headers, "Content-Type"), false);
  } finally {
    process.env.NEXT_PUBLIC_DATA_SOURCE = previousDataSource;
    process.env.NEXT_PUBLIC_API_URL = previousApiUrl;
    global.window = previousWindow;
    global.fetch = previousFetch;
  }
});
