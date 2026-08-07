"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const bootstrap = require("../backend/src/services/financial-bootstrap.service");

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
