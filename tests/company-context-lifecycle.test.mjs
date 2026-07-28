import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function stateModule() {
  const source = await readFile(path.join(root, "lib", "company-context-state.ts"), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
}

const companyA = { id: "COMPANY_A", businessName: "Alpha", workspace: "alpha", currency: "AED", logo: "" };
const companyB = { id: "COMPANY_B", businessName: "Beta", workspace: "beta", currency: "AED", logo: "" };

test("hard-refresh bootstrap auto-adopts exactly one server-authorized Company without storage", async () => {
  const state = await stateModule();
  const ready = state.resolveSingleCompanyContext([companyA], 5);
  assert.equal(ready.status, "READY");
  assert.equal(ready.companyId, "COMPANY_A");
  assert.equal(ready.company.businessName, "Alpha");
  assert.equal(ready.source, "BOOTSTRAP");
  assert.equal(ready.generation, 6);
});

test("zero or multiple bootstrap Companies fail closed without a first-row fallback", async () => {
  const state = await stateModule();
  const zero = state.resolveSingleCompanyContext([], 3);
  assert.equal(zero.status, "SETUP_REQUIRED");
  assert.equal(zero.companyId, null);
  const many = state.resolveSingleCompanyContext([companyA, companyB], zero.generation);
  assert.equal(many.status, "CONFIGURATION_CONFLICT");
  assert.equal(many.companyId, null);
  assert.equal(many.company, null);
});

test("legacy selected-Company storage is cleared and cannot override bootstrap authority", async () => {
  const state = await stateModule();
  const storage = new Map([[state.COMPANY_CONTEXT_STORAGE_KEY, JSON.stringify({ version: 1, userId: "USER_A", companyId: "COMPANY_B" })]]);
  globalThis.window = { sessionStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) } };
  state.clearPersistedCompanyContext();
  assert.equal(storage.has(state.COMPANY_CONTEXT_STORAGE_KEY), false);
  assert.equal(state.resolveSingleCompanyContext([companyA]).companyId, "COMPANY_A");
  delete globalThis.window;
});

test("Company context integration bootstraps context-free, auto-adopts one Company, and gates REST/SSE before READY", async () => {
  const [provider, client, dashboard, header, notificationsPage, realtime, gate, switcher, branchSwitcher, settings, operator, auth] = await Promise.all([
    readFile(path.join(root, "contexts", "company-context.tsx"), "utf8"),
    readFile(path.join(root, "lib", "api", "client.ts"), "utf8"),
    readFile(path.join(root, "components", "company", "company-dashboard-shell.tsx"), "utf8"),
    readFile(path.join(root, "components", "layout", "header.tsx"), "utf8"),
    readFile(path.join(root, "app", "[locale]", "(dashboard)", "notifications", "page.tsx"), "utf8"),
    readFile(path.join(root, "components", "realtime-provider.tsx"), "utf8"),
    readFile(path.join(root, "components", "company", "company-context-gate.tsx"), "utf8"),
    readFile(path.join(root, "components", "company", "company-switcher.tsx"), "utf8"),
    readFile(path.join(root, "components", "layout", "branch-switcher.tsx"), "utf8"),
    readFile(path.join(root, "contexts", "settings-context.tsx"), "utf8"),
    readFile(path.join(root, "contexts", "operator-context.tsx"), "utf8"),
    readFile(path.join(root, "contexts", "auth-context.tsx"), "utf8"),
  ]);
  assert.match(provider, /apiClient<AccessibleCompaniesResponse>\("\/auth\/accessible-companies", \{[\s\S]*companyScope: "none"/);
  assert.match(provider, /resolveSingleCompanyContext/);
  assert.match(provider, /clearPersistedCompanyContext\(\);[\s\S]*adoptBootstrapCompany/);
  assert.doesNotMatch(provider, /selectCompany/);
  assert.match(client, /resolvedCompanyIdForRequest/);
  assert.match(client, /reportCompanyContextFailure\(apiError\)/);
  assert.match(dashboard, /CompanyContextGate/);
  assert.match(dashboard, /RealtimeProvider explicitCompanyId=\{companyId\}/);
  assert.match(header, /useNotifications\(\{ explicitCompanyId: selectedCompanyId \}\)/);
  assert.match(notificationsPage, /useNotifications\(\{ explicitCompanyId: companyId \}\)/);
  assert.match(realtime, /reportCompanyContextFailure/);
  assert.match(gate, /CONFIGURATION_CONFLICT/);
  assert.doesNotMatch(gate, /role="listbox"/);
  assert.match(switcher, /data-company-display/);
  assert.doesNotMatch(switcher, /onClick/);
  assert.match(branchSwitcher, /useBranchContext/);
  assert.match(branchSwitcher, /selectBranch/);
  assert.match(settings, /isSuperAdmin && !companyReady/);
  assert.match(operator, /useCompanyContext/);
  assert.match(operator, /isSuperAdmin && !companyReady/);
  assert.match(operator, /COMPANY_CONTEXT_PENDING/);
  assert.match(operator, /if \(isSuperAdmin && !companyReady\)[\s\S]*return;[\s\S]*operatorRepository\.current/);
  const switchBranchSource = auth.slice(auth.indexOf("const switchBranch"), auth.indexOf("const clearBranch"));
  assert.doesNotMatch(switchBranchSource, /queryClient\.clear\(\)/);
  assert.match(auth, /isBranchScopedQueryKey/);
  assert.match(switchBranchSource, /isBranchScopedQueryKey\(query\.queryKey\)/);
  assert.match(switchBranchSource, /cancelQueries\(\{ predicate: isBranchScopedQuery \}\)/);
  assert.match(switchBranchSource, /removeQueries\(\{ predicate: isBranchScopedQuery \}\)/);
});
