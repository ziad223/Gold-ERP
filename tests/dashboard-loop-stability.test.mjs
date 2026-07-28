import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function source(relativePath) {
  return readFile(path.join(repositoryRoot, relativePath), "utf8");
}

test("dashboard API fallbacks are stable module-level references", async () => {
  const coreData = await source("hooks/use-core-erp-data.ts");
  const fallbacks = {
    customersQuery: "EMPTY_CUSTOMERS",
    suppliersQuery: "EMPTY_SUPPLIERS",
    transfersQuery: "EMPTY_TRANSFERS",
    reservationsQuery: "EMPTY_RESERVATIONS",
    approvalsQuery: "EMPTY_APPROVALS",
    purchaseOrdersQuery: "EMPTY_PURCHASE_ORDERS",
  };

  for (const [query, fallback] of Object.entries(fallbacks)) {
    assert.match(coreData, new RegExp(`const ${fallback}: [A-Za-z]+\\[] = \\[\\];`));
    assert.match(coreData, new RegExp(`${query}\\.data \\?\\? ${fallback}`));
    assert.doesNotMatch(coreData, new RegExp(`${query}\\.data \\?\\? \\[\\]`));
  }
});

test("dashboard provider and initial effect retain their semantic dependencies", async () => {
  const dashboardState = await source("features/dashboard/hooks/use-dashboard-state.ts");

  assert.match(
    dashboardState,
    /const provider = useMemo\([\s\S]*new LocalDashboardProvider\([\s\S]*\[invoices, assets, customers, transfers, reservations, approvals, purchaseOrders, goldPrice, viewCosts, viewMargins\]/,
  );
  assert.match(
    dashboardState,
    /void loadOverview\(\);\n  }, \[loadOverview, prefsHydrated, dataLoading\]\);/,
  );
  assert.doesNotMatch(
    dashboardState,
    /\[loadOverview, prefsHydrated, dataLoading[^\]]*(?:overview|isLoading|isCached|isOffline|error)/,
  );
});
