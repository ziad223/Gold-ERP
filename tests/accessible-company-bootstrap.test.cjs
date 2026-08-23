const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const service = require(path.join(
  __dirname,
  "..",
  "backend",
  "src",
  "services",
  "accessible-company-bootstrap.service.js",
));

function company(id, businessName, extra = {}) {
  return { id, businessName, workspace: businessName.toLowerCase().replace(/\s+/g, "-"), currency: "AED", logo: "", ...extra };
}

test("accessible-company bootstrap is minimal, deterministic, and has no selected-company side effect", async () => {
  let received;
  const Company = {
    findAll: async (options) => {
      received = options;
      return [company("CMP-A", "Alpha"), company("CMP-B", "Beta")];
    },
  };

  const result = await service.listAccessibleCompanies({ Company, user: { accountType: "super_admin", id: "USR-SA" } });

  assert.deepEqual(received.attributes, service.BOOTSTRAP_ATTRIBUTES);
  assert.deepEqual(received.order, service.BOOTSTRAP_ORDER);
  assert.equal(Object.hasOwn(received, "where"), false);
  assert.deepEqual(result, [
    { id: "CMP-A", businessName: "Alpha", workspace: "alpha", currency: "AED", logo: "" },
    { id: "CMP-B", businessName: "Beta", workspace: "beta", currency: "AED", logo: "" },
  ]);
  assert.equal(Object.hasOwn(result[0], "taxNumber"), false);
});

test("non-Super-Admin bootstrap remains restricted to its server-derived Company", async () => {
  let received;
  const Company = {
    findAll: async (options) => {
      received = options;
      return [company("CMP-OWNED", "Owned")];
    },
  };

  const result = await service.listAccessibleCompanies({ Company, user: { accountType: "legacy", companyId: "CMP-OWNED" } });
  assert.deepEqual(received.where, { id: "CMP-OWNED" });
  assert.equal(result[0].id, "CMP-OWNED");
});

test("missing non-Super-Admin Company is fail-closed and does not query a fallback Company", async () => {
  let received;
  const Company = {
    findAll: async (options) => {
      received = options;
      return [];
    },
  };

  const result = await service.listAccessibleCompanies({ Company, user: { accountType: "legacy", companyId: null } });
  assert.deepEqual(received.where, { id: null });
  assert.deepEqual(result, []);
});

test("auth route exposes the context-free bootstrap behind auth-only middleware", async () => {
  const source = require("node:fs").readFileSync(path.join(__dirname, "..", "backend", "src", "routes", "auth.routes.js"), "utf8");
  assert.match(source, /router\.get\("\/accessible-companies", authMiddlewareWithoutCompanyContext, authController\.accessibleCompanies\)/);
});
