import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("core collections are explicitly owned and company-only keys ignore Branch generations", async () => {
  const core = await source("hooks/use-core-erp-data.ts");
  assert.match(core, /type CoreErpDataOptions[\s\S]*resources\?: readonly CoreErpResource\[\]/);
  assert.match(core, /skipBranch \? "company-only" : branchGeneration/);
  assert.match(core, /enabled: requested && DATA_SOURCE === "api"/);
  assert.match(core, /useApiItems<Reservation>\("reservations", "\/reservations", false, requested\("reservations"\)\)/);
});

test("global search and Reservations request only their explicit shared resources", async () => {
  const [header, reservations] = await Promise.all([
    source("components/layout/header.tsx"),
    source("app/[locale]/(dashboard)/sales/reservations/page.tsx"),
  ]);
  assert.match(header, /enabled: query\.trim\(\)\.length >= 2/);
  assert.match(header, /resources: \["assets", "customers", "invoices"\]/);
  assert.match(reservations, /useCoreErpData\(\{ resources: \["assets", "customers"\] \}\)/);
});

test("supplier list has one declarative query owner and does not refetch on a Strict Mode remount", async () => {
  const suppliers = await source("hooks/use-suppliers.ts");
  const listHook = suppliers.slice(0, suppliers.indexOf("export function useSupplier("));
  assert.match(suppliers, /import \{ useQuery \} from "@tanstack\/react-query"/);
  assert.match(listHook, /queryKey: \["suppliers", "list", query\]/);
  assert.match(listHook, /refetchOnMount: false/);
  assert.doesNotMatch(listHook, /rawSuppliers/);
  assert.doesNotMatch(listHook, /useEffect\(\(\) => \{\s*fetchSuppliers/);
});
