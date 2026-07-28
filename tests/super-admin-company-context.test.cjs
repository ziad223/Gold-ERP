const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const backend = path.join(root, "backend");
const jwt = require(path.join(backend, "node_modules", "jsonwebtoken"));
const { JWT_SECRET } = require(path.join(backend, "src", "config", "security"));

const technicalPath = require.resolve(path.join(backend, "src", "services", "technical-session.service"));
const modelsPath = require.resolve(path.join(backend, "src", "models"));
const authPath = require.resolve(path.join(backend, "src", "middleware", "auth.middleware.js"));

const companyById = new Map([["CMP-C10-A", { id: "CMP-C10-A" }]]);
require.cache[technicalPath] = {
  id: technicalPath,
  filename: technicalPath,
  loaded: true,
  exports: {
    assertAccessSession: async () => ({ user: currentUser, session: { id: "TAS-C10" } }),
    safeScope: (user) => ({ accountType: user.accountType, companyId: user.companyId, branchId: user.branchId || null })
  }
};
require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: { Company: { findByPk: async (id) => companyById.get(id) || null }, Branch: { findOne: async () => null } }
};
delete require.cache[authPath];
const { authMiddleware, authMiddlewareWithoutCompanyContext } = require(authPath);
let currentUser = null;

function request(headers = {}) {
  return {
    headers: { authorization: `Bearer ${jwt.sign({ userId: "USR-C10", technicalSessionId: "TAS-C10" }, JWT_SECRET)}`, ...headers },
    path: "/reservations"
  };
}

async function run(middleware, user, headers = {}) {
  currentUser = user;
  const req = request(headers);
  let nextArgument = "not-called";
  await middleware(req, {}, (value) => { nextArgument = value || null; });
  return { req, nextArgument };
}

test("Super Admin operational requests require an explicit company and never use CMP-DEMO", async () => {
  const { req, nextArgument } = await run(authMiddleware, { id: "USR-C10-SA", accountType: "super_admin", companyId: "CMP-DEMO", isActive: true });
  assert.equal(nextArgument?.errorCode, "SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED");
  assert.equal(nextArgument?.statusCode, 422);
  assert.equal(req.companyId, null);
});

test("Super Admin accepts only an explicitly validated selected company", async () => {
  const valid = await run(authMiddleware, { id: "USR-C10-SA", accountType: "super_admin", companyId: "CMP-LEGACY", isActive: true }, { "x-company-id": "CMP-C10-A" });
  assert.equal(valid.nextArgument, null);
  assert.equal(valid.req.companyId, "CMP-C10-A");

  const invalid = await run(authMiddleware, { id: "USR-C10-SA", accountType: "super_admin", companyId: "CMP-LEGACY", isActive: true }, { "x-company-id": "CMP-C10-MISSING" });
  assert.equal(invalid.nextArgument?.errorCode, "COMPANY_SCOPE_INVALID");
  assert.equal(invalid.req.companyId, null);
});

test("non-Super-Admin company derivation and auth-only Super Admin routes remain compatible", async () => {
  const normal = await run(authMiddleware, { id: "USR-C10-NORMAL", accountType: "legacy", companyId: "CMP-C10-A", isActive: true });
  assert.equal(normal.nextArgument, null);
  assert.equal(normal.req.companyId, "CMP-C10-A");

  const technical = await run(authMiddlewareWithoutCompanyContext, { id: "USR-C10-SA", accountType: "super_admin", companyId: "CMP-C10-A", isActive: true });
  assert.equal(technical.nextArgument, null);
  assert.equal(technical.req.companyId, "CMP-C10-A");
});
