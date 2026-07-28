import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function stateModule() {
  const source = await readFile(path.join(root, "lib", "branch-context-state.ts"), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
}

const branchA = { id: "BRANCH_A", name: "A", isActive: true };
const branchB = { id: "BRANCH_B", name: "B", isActive: true };

test("Branch readiness validates a persisted candidate and never chooses the first of many", async () => {
  const state = await stateModule();
  const valid = state.resolveBranchContext([branchA, branchB], branchB.id, 2);
  assert.equal(valid.status, "READY");
  assert.equal(valid.branchId, branchB.id);

  const selection = state.resolveBranchContext([branchA, branchB], null, valid.generation);
  assert.equal(selection.status, "SELECTION_REQUIRED");
  assert.equal(selection.branchId, null);

  const stale = state.resolveBranchContext([branchA, branchB], "STALE_BRANCH", selection.generation);
  assert.equal(stale.status, "INVALID");
  assert.equal(stale.branchId, null);
});

test("zero Branches fails closed while one validated Branch can be adopted", async () => {
  const state = await stateModule();
  const zero = state.resolveBranchContext([], null, 0);
  assert.equal(zero.status, "SETUP_REQUIRED");
  assert.equal(zero.branchId, null);

  const single = state.resolveBranchContext([branchA], null, zero.generation);
  assert.equal(single.status, "READY");
  assert.equal(single.branchId, branchA.id);
});

test("the shared client, customer financial queries, and dashboard gate require validated Branch readiness", async () => {
  const [client, provider, customer, shell, auth, switcher, settings, company] = await Promise.all([
    readFile(path.join(root, "lib", "api", "client.ts"), "utf8"),
    readFile(path.join(root, "contexts", "branch-context.tsx"), "utf8"),
    readFile(path.join(root, "app", "[locale]", "(dashboard)", "customers", "[id]", "page.tsx"), "utf8"),
    readFile(path.join(root, "components", "company", "company-dashboard-shell.tsx"), "utf8"),
    readFile(path.join(root, "contexts", "auth-context.tsx"), "utf8"),
    readFile(path.join(root, "components", "layout", "branch-switcher.tsx"), "utf8"),
    readFile(path.join(root, "contexts", "settings-context.tsx"), "utf8"),
    readFile(path.join(root, "contexts", "company-context.tsx"), "utf8"),
  ]);
  assert.match(client, /resolvedBranchIdForRequest/);
  assert.match(client, /setBranchContextAccessor/);
  assert.match(client, /reportBranchContextFailure\(apiError\)/);
  assert.doesNotMatch(client, /readStoredBranchId/);
  assert.match(provider, /resolveBranchContext/);
  assert.match(provider, /branchesLoaded/);
  assert.match(provider, /setBranchContextAccessor\(\(\) => \(\{ branchId/);
  assert.match(client, /BRANCH_CONTEXT_REQUIRED/);
  assert.match(shell, /BranchContextGate/);
  assert.match(customer, /useBranchContext/);
  assert.match(customer, /enabled: !!id && DATA_SOURCE === "api" && branchReady/);
  assert.match(customer, /enabled: isApi && !!customerId && branchReady && !dateError/);
  assert.match(customer, /customer-invoices", customerId, "branch", branchId \|\| "none"/);
  assert.doesNotMatch(customer.slice(customer.indexOf("const invoicesQuery"), customer.indexOf("const displayInvoices")), /skipBranch: true/);
  assert.match(settings, /branchesLoaded/);
  assert.match(switcher, /selectBranch/);
  const coreData = await readFile(path.join(root, "hooks", "use-core-erp-data.ts"), "utf8");
  assert.match(coreData, /useBranchContext/);
  assert.match(coreData, /skipBranch \|\| branchReady/);
  assert.doesNotMatch(switcher, /const fallback = activeBranches/);
  assert.doesNotMatch(auth, /activeBranchId\] = useState<string>\("BR-DXB"\)/);
  assert.match(company, /clearScopedWork\(\{ clearBranch: false \}\)/);
});
