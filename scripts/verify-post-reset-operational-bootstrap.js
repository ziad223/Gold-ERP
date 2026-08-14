#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const check = (condition, message) => assert.ok(condition, message);

try {
  const migration = read("backend/migrations/20260720010000-system-account-roles.js");
  const roleService = read("backend/src/services/company-bootstrap.service.js");
  const reservation = read("backend/src/services/reservation.service.js");
  const reset = read("backend/scripts/reset-database.js");
  const backendPackage = read("backend/package.json");
  const server = read("backend/src/server.js");
  const inventoryPage = read("app/[locale]/(dashboard)/inventory/page.tsx");
  const inventoryForm = read("features/inventory/components/InventoryItemForm.tsx");
  const purchases = read("app/[locale]/(dashboard)/suppliers/purchases/page.tsx");
  const routes = read("backend/src/routes/erp.routes.js");

  check(migration.includes("system_account_roles") && migration.includes("system_account_roles_company_role_uq"), "role mapping is additive and unique per company/role");
  check(roleService.includes("CUSTOMER_DEPOSIT_LIABILITY") && roleService.includes("resolveSystemAccountRole"), "customer deposit role resolves server-side");
  check(roleService.includes("CUSTOMER_DEPOSIT_ROLE_MANUAL_REVIEW") && roleService.includes("adopted"), "single-branch legacy mapping adoption is explicit and ambiguous multi-branch mapping blocks");
  check(roleService.includes("created: []") && roleService.includes("alreadyPresent"), "branch bootstrap reports idempotent outcomes");
  check(!/CMP-DEMO|Company\.findOne/i.test(roleService), "bootstrap has no demo or first-company fallback");
  check(reservation.includes("resolveSystemAccountRole(companyId, branchId, SYSTEM_ACCOUNT_ROLES.CUSTOMER_DEPOSIT_LIABILITY"), "reservation cannot choose liability account from client input");
  check(roleService.includes("CUSTOMER_DEPOSIT_ROLE_NOT_CONFIGURED"), "missing mapping returns a stable safe error code");
  check(reset.includes("RESET1_CONFIRM=RESET1_LOCAL_DATABASE") && reset.includes("--dry-run"), "reset requires confirmation and supports dry-run");
  check(reset.includes("LOCAL_HOST") && reset.includes("APPROVED_NAME") && reset.includes("NODE_ENV=production"), "reset default-denies remote, unapproved, and production targets");
  check(!reset.includes("db:seed:all") && backendPackage.includes('"db:reset": "node scripts/reset-database.js"'), "db:reset never auto-runs demo seed");
  check(server.includes("ALLOW_RUNTIME_ADMIN_BOOTSTRAP") && server.includes("Runtime admin bootstrap skipped"), "startup does not run hidden bootstrap by default");
  check(inventoryPage.includes('router.push("/suppliers/purchases")') && !inventoryPage.includes("<InventoryItemForm"), "inventory Add Item routes to purchase receiving");
  check(inventoryForm.includes("Direct inventory-asset creation is unavailable") && !inventoryForm.includes("await createAsset("), "Add Item no longer posts generic assets");
  check(purchases.includes("No suppliers created.") && purchases.includes('href="/suppliers"'), "supplier empty state has a recovery action");
  check(purchases.includes("No active item codes exist") && purchases.includes("disabled={availableItemCodes.length === 0}"), "taxonomy empty state is explicit and blocks receipt");
  check(routes.includes("/readiness/operations") && routes.includes("/bootstrap/branch-accounts"), "bounded branch readiness and bootstrap endpoints exist");
  check(routes.includes("GENERIC_INVENTORY_MUTATION_FORBIDDEN"), "generic inventory mutation guard remains present");
  console.log("POST RESET OPERATIONAL BOOTSTRAP PASSED");
} catch (error) {
  console.error(`POST RESET OPERATIONAL BOOTSTRAP FAILED: ${error.message}`);
  process.exitCode = 1;
}
