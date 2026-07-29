import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("employee creation is identity-only and never derives a Branch assignment", async () => {
  const [page, routes] = await Promise.all([
    source("app/[locale]/(dashboard)/employees/page.tsx"),
    source("backend/src/routes/erp.routes.js"),
  ]);

  assert.doesNotMatch(page, /company\?\.branchName/);
  assert.match(page, /Branch assignment required/);
  assert.match(page, /branch: ""/);
  assert.doesNotMatch(page, /branch:\s*form\.branch\.trim\(\)/);
  assert.match(routes, /Employee creation is identity-only; assign Branch access separately/);
  assert.doesNotMatch(routes, /if \(employee\.branchId\) \{[\s\S]{0,900}EmployeeBranchAccess\.findOrCreate/);
});

test("explicit Branch changes validate and synchronize the employee default Branch", async () => {
  const [service, routes] = await Promise.all([
    source("backend/src/services/employee-authorization.service.js"),
    source("backend/src/routes/employee-authorization.routes.js"),
  ]);

  assert.match(service, /defaultBranchId/);
  assert.match(service, /Default Branch must be one of the employee's active Branch assignments/);
  assert.match(service, /branchId:\s*nextDefaultBranch\?\.id \|\| null/);
  assert.match(routes, /defaultBranchId:\s*req\.body\?\.defaultBranchId/);
});

test("operator bootstrap fails closed when the employee has no valid default Branch", async () => {
  const [service, operator] = await Promise.all([
    source("backend/src/services/employee-authorization.service.js"),
    source("backend/src/services/operator-session.service.js"),
  ]);

  assert.match(service, /assertEmployeeOperationalReadiness/);
  assert.match(service, /EMPLOYEE_BRANCH_SETUP_REQUIRED/);
  assert.match(operator, /assertEmployeeOperationalReadiness/);
  assert.match(operator, /readiness\.code/);
});
