"use strict";

const assert = require("node:assert/strict");
const { isOwnedCompanyId } = require("./cleanup-owned-employee-verifier-fixtures");

assert.equal(isOwnedCompanyId("CMP-T34-2-1784026678771-ndlarr"), true);
assert.equal(isOwnedCompanyId("CMP-T34-3-1784141643008-3brcm5"), true);
assert.equal(isOwnedCompanyId("CMP-T345A-1784141643008-3brcm5"), false);
assert.equal(isOwnedCompanyId("CMP-HF6D-20260721"), false);
assert.equal(isOwnedCompanyId(null), false);
console.log("OWNED EMPLOYEE VERIFIER FIXTURE CLEANUP HELPER PASSED");
