import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("assets wait for Branch READY and use a cancellable Branch-aware query identity", async () => {
  const [assets, core, inventory, inventoryList, keys, acceptance] = await Promise.all([
    source("features/assets/hooks/use-assets.ts"),
    source("hooks/use-core-erp-data.ts"),
    source("app/[locale]/(dashboard)/inventory/page.tsx"),
    source("features/inventory/hooks/use-inventory-list.ts"),
    source("lib/query-keys.ts"),
    source("tests/e2e/single-company-runtime.acceptance.spec.mjs"),
  ]);
  assert.match(assets, /useBranchContext/);
  assert.match(assets, /branchId, generation: branchGeneration, isReady: branchReady/);
  assert.match(assets, /queryKey: \[\.\.\.queryKeys\.assets\(branchId \|\| undefined\), branchGeneration\]/);
  assert.match(assets, /queryFn: async \(\{ signal \}\)/);
  assert.match(assets, /apiClient<any>\(`\/assets`, \{ locale, signal, branchId: branchId \|\| undefined \}\)/);
  assert.match(assets, /enabled: dataSource === "api" && listEnabled && branchReady/);
  assert.doesNotMatch(assets, /skipBranch:\s*true/);
  assert.match(keys, /assets: \(branchId\?: string\) => \(branchId \? \(\["assets", "branch", branchId\] as const\) : \(\["assets"\] as const\)\)/);
  assert.match(inventory, /useCoreErpData\(\{ resources: \["products"\] \}\)/);
  assert.match(inventory, /useAssets\(\{ listEnabled: false \}\)/);
  assert.match(inventory, /const assetsForCurrentQuery = assetsList\.items/);
  assert.match(core, /\.\.\.\(skipBranch \|\| !branchId \? \{\} : \{ branchId \}\)/);
  assert.match(inventoryList, /useBranchContext/);
  assert.match(inventoryList, /branchId, generation: branchGeneration, isReady: branchReady/);
  assert.match(inventoryList, /queryKey: \[entity, "paginated", "branch", branchId \|\| "required", branchGeneration, queryState\]/);
  assert.match(inventoryList, /queryFn: \(\{ signal \}\) => fetchPage\(queryState, signal\)/);
  assert.match(inventoryList, /branchId: branchId \|\| undefined/);
  assert.match(inventoryList, /enabled: dataSource === "api" && branchReady/);
  assert.doesNotMatch(inventoryList, /skipBranch:\s*true/);
  assert.match(acceptance, /evidence\.begin\("BRANCH_B_ASSETS"\)/);
  assert.match(acceptance, /branchBAssets\.branchHeaderPresent\)\.toBe\(true\)/);
  assert.match(acceptance, /await page\.goBack\(\{ waitUntil: "domcontentloaded" \}\)/);
});
