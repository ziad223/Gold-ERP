const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

function loadTsModule(relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: relativePath,
  }).outputText;
  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    atob: (value) => Buffer.from(value, "base64").toString("binary"),
    TextEncoder,
    crypto: crypto.webcrypto,
  };
  vm.runInNewContext(output, context, { filename: relativePath });
  return module.exports;
}

function jwtWithExpiry(exp) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ exp })}.signature`;
}

async function main() {
  const auth = loadTsModule("lib/api/auth-freshness.ts");
  const hash = loadTsModule("lib/api/canonical-business-hash.ts");
  const now = 1_700_000_000_000;

  assert.equal(auth.classifyAccessToken(jwtWithExpiry(now / 1000 + 600), now).fresh, true, "fresh token must not refresh");

  let refreshCalls = 0;
  let token = jwtWithExpiry(now / 1000 + 30);
  const nearExpiry = await auth.ensureAuthFreshness({
    readToken: () => token,
    now: () => now,
    refresh: async () => { refreshCalls += 1; token = jwtWithExpiry(now / 1000 + 600); return true; },
  });
  assert.equal(nearExpiry.status, "REFRESHED");
  assert.equal(refreshCalls, 1);

  token = jwtWithExpiry(now / 1000 - 1);
  const expired = await auth.ensureAuthFreshness({
    readToken: () => token,
    now: () => now,
    refresh: async () => { token = jwtWithExpiry(now / 1000 + 600); return true; },
  });
  assert.equal(expired.status, "REFRESHED");

  const blocked = await auth.ensureAuthFreshness({
    readToken: () => jwtWithExpiry(now / 1000 - 1),
    now: () => now,
    refresh: async () => false,
  });
  assert.equal(blocked.status, "BLOCKED_AUTH");

  const body = { idempotencyKey: "synthetic-key", supplierId: "supplier", items: [{ unitCost: 123.45, perPiece: [{ barcode: "deferred" }] }] };
  const clientHash = await hash.canonicalBusinessHash("purchase.receive", body);
  const serverHash = require(path.join(root, "backend/src/services/idempotency.service.js")).hashRequest("purchase.receive", body);
  assert.equal(clientHash, serverHash, "client hash must equal server canonical hash");
  assert.notEqual(await hash.canonicalBusinessHash("purchase.receive", { ...body, items: [{ unitCost: 123.46 }] }), serverHash, "changed body must change hash");

  const clientSource = fs.readFileSync(path.join(root, "lib/api/client.ts"), "utf8");
  const pearlSource = fs.readFileSync(path.join(root, "app/[locale]/(dashboard)/inventory/pearl/page.tsx"), "utf8");
  assert.match(clientSource, /AUTH_REFRESHED_RETRY_REQUIRED/);
  assert.match(clientSource, /!isSafeReadMethod\(options\.method\)/, "unsafe 401 must not auto-replay");
  assert.match(pearlSource, /preConfirmAuthFreshness/);
  assert.match(pearlSource, /requestContextSnapshot/);
  assert.match(pearlSource, /canonicalBusinessHash\("purchase\.receive"/);
  assert.match(pearlSource, /preflight\.authStatus === "REFRESHED"/);
  assert.match(pearlSource, /Review the request again before confirming/);
  assert.match(pearlSource, /setConfirmation\(true\)/);

  console.log("pearl-confirm-auth-freshness: PASS");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
