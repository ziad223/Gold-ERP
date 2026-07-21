#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const {
  PERMISSION_BASELINE_VERSION,
  PERMISSIONS,
  ROLE_DEFS,
  LIFECYCLE_PERMISSIONS,
  SALES_ADJUSTMENT_PERMISSIONS
} = require(path.join(ROOT, "backend", "src", "bootstrap", "permission-baseline-v1"));

assert.equal(PERMISSION_BASELINE_VERSION, "v1.0.0");
assert.equal(PERMISSIONS.length, 128, "v1 canonical baseline has 128 exact slugs");
assert.equal(new Set(PERMISSIONS).size, PERMISSIONS.length, "v1 catalog has no duplicate slugs");
for (const permission of [...LIFECYCLE_PERMISSIONS, ...SALES_ADJUSTMENT_PERMISSIONS]) {
  assert.ok(PERMISSIONS.includes(permission), `${permission} is canonical`);
}
for (const role of ["admin", "owner"]) {
  for (const permission of [...LIFECYCLE_PERMISSIONS, ...SALES_ADJUSTMENT_PERMISSIONS]) {
    assert.ok(ROLE_DEFS[role].includes(permission), `${role} receives ${permission}`);
  }
}
for (const permission of SALES_ADJUSTMENT_PERMISSIONS) {
  assert.ok(ROLE_DEFS.manager.includes(permission), `manager receives ${permission}`);
  assert.ok(!ROLE_DEFS.sales.includes(permission), `sales does not receive ${permission}`);
  assert.ok(!ROLE_DEFS.accountant.includes(permission), `accountant does not receive ${permission}`);
}
for (const permission of LIFECYCLE_PERMISSIONS) {
  assert.ok(!ROLE_DEFS.manager.includes(permission), `manager does not receive lifecycle permission ${permission}`);
  assert.ok(!ROLE_DEFS.sales.includes(permission), `sales does not receive lifecycle permission ${permission}`);
  assert.ok(!ROLE_DEFS.accountant.includes(permission), `accountant does not receive lifecycle permission ${permission}`);
}

const frontendCatalog = fs.readFileSync(path.join(ROOT, "lib", "permissions", "catalog.ts"), "utf8");
const knownCodes = frontendCatalog.slice(frontendCatalog.indexOf("export const KNOWN_PERMISSION_CODES"), frontendCatalog.indexOf("] as const;", frontendCatalog.indexOf("export const KNOWN_PERMISSION_CODES")));
for (const permission of PERMISSIONS) {
  assert.ok(knownCodes.includes(`"${permission}"`), `frontend derivative recognizes ${permission}`);
}

console.log("PERMISSION BASELINE CONTRACT PASSED");
