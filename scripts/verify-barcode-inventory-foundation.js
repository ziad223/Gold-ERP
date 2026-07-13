/**
 * Phase 32.1-Fix — static/pure verification for the editable barcode and
 * inventory identity foundation. Does not connect to or mutate a database.
 *
 * Phase 32.6-Fix-A-Hotfix-2 — default global-suite mode checks only the current
 * working tree so approved later commits are not re-litigated. Historical
 * barcode-inventory scope auditing is still available with
 * VERIFY_BARCODE_INVENTORY_SCOPE_BASELINE=<git-ref>. All functional barcode
 * assertions are unchanged.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const HISTORICAL_SCOPE_ENV = "VERIFY_BARCODE_INVENTORY_SCOPE_BASELINE";
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const exists = (file) => fs.existsSync(path.join(ROOT, file));
const gitLines = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
function assertValidGitRef(ref) {
  try {
    execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], { cwd: ROOT, stdio: "pipe" });
  } catch (_) {
    throw new Error(`Invalid ${HISTORICAL_SCOPE_ENV} Git ref: ${ref}`);
  }
}

const SERVICE = "backend/src/services/barcode-identity.service.js";
const MIGRATION = "backend/migrations/20260710000000-barcode-inventory-foundation.js";
const ROUTES = "backend/src/routes/erp.routes.js";
const CONTROLLER = "backend/src/controllers/erp.controller.js";
const ASSET_MODEL = "backend/src/models/asset.model.js";
const SETTINGS_PAGE = "app/[locale]/(dashboard)/settings/barcode-codes/page.tsx";
const INVENTORY_PAGE = "app/[locale]/(dashboard)/inventory/page.tsx";
// Phase 32.2-Fix — the inventory create UI was refactored into the type-driven
// item form; the create-flow checks below follow it there.
const INVENTORY_ITEM_FORM = "features/inventory/components/InventoryItemForm.tsx";

function serviceAndFormat() {
  assert.ok(exists(SERVICE), "central barcode identity service exists");
  const service = require(path.join(ROOT, SERVICE));
  assert.equal(service.formatBarcode({ inventoryCode: "GW", itemCode: "BRC", karatCode: "21", serial: 1 }), "GWBRC21000001", "client barcode format is exact");
  assert.equal(service.formatBarcode({ inventoryCode: "WT", itemCode: "WCH", karatCode: "00", serial: 1 }), "WTWCH00000001", "Watch provisional format is exact");
  assert.equal(service.normalizeKaratCode(9), "09", "karat is normalized to two digits");
  assert.throws(() => service.formatBarcode({ inventoryCode: "GW-", itemCode: "BRC", karatCode: "21", serial: 1 }), /uppercase letters or digits/, "separators are rejected");
  assert.throws(() => service.formatBarcode({ inventoryCode: "GW", itemCode: "BRC", karatCode: "21", serial: 1000000 }), /999999/, "serial is exactly six-digit bounded");
  const source = read(SERVICE);
  for (const exported of ["formatBarcode", "validateInventoryCode", "validateItemCode", "normalizeKaratCode", "getEffectiveBarcodeSettings", "allocateBarcodeSerial", "generateBarcodeForAsset", "isCodeUsed"]) {
    assert.ok(source.includes(exported), `service exposes ${exported}`);
  }
  assert.ok(source.includes("ON CONFLICT (company_id, inventory_code, item_code, karat_code)"), "sequence allocation is atomic and scoped by company+inventory+item+karat");
  assert.ok(source.includes("last_serial + 1") && source.includes("padStart(6"), "serial allocation increments and formats six digits");
  assert.ok(source.includes("defaultKaratCode") && source.includes("Loose inventory"), "loose-item KT policy is guarded by configured defaults");
}

function schemaAndDefaults() {
  for (const file of [
    MIGRATION,
    "backend/src/models/barcodeInventoryCode.model.js",
    "backend/src/models/barcodeItemCode.model.js",
    "backend/src/models/barcodeSequence.model.js",
  ]) assert.ok(exists(file), `foundation file exists: ${file}`);

  const migration = read(MIGRATION);
  const asset = read(ASSET_MODEL);
  for (const dbField of ["inventory_code", "item_code", "karat_code", "barcode_serial", "barcode_generated_at", "barcode_revision", "inventory_subtype", "metadata_schema_version", "metadata"]) {
    assert.ok(migration.includes(`\"${dbField}\"`) || migration.includes(dbField), `migration includes Asset field ${dbField}`);
  }
  for (const modelField of ["inventoryCode", "itemCode", "karatCode", "barcodeSerial", "barcodeGeneratedAt", "barcodeRevision", "inventorySubtype", "metadataSchemaVersion", "metadata"]) {
    assert.ok(asset.includes(modelField), `Asset model includes ${modelField}`);
  }
  assert.ok(migration.includes("Sequelize.JSONB") && asset.includes("DataTypes.JSONB"), "metadata foundation uses PostgreSQL JSONB");
  assert.ok(migration.includes("hasDuplicate") && migration.includes("assets_company_barcode_uq was not created"), "barcode uniqueness is guarded by duplicate preflight");
  assert.ok(migration.includes("assets_company_rfid_uq") && migration.includes("rfid IS NOT NULL AND btrim(rfid) <> ''"), "RFID uniqueness is partial and nonblank-only");
  assert.ok(!/UPDATE\s+assets\s+SET\s+barcode/i.test(migration), "migration performs no old barcode backfill");

  const defaults = require(path.join(ROOT, "backend/src/config/barcode-defaults.js"));
  assert.deepEqual(defaults.DEFAULT_BARCODE_INVENTORY_CODES.map((row) => row.code), ["GW", "GP", "DD", "GS", "PL", "WT"], "six initial inventory codes are bootstrapped");
  const approvedItems = ["ANK", "BGL", "BAR", "BRC", "BRH", "CHN", "CHK", "CON", "CRW", "ERG", "FST", "LOS", "NCK", "PND", "PCH", "RNG", "TRN", "WRN", "WCH"];
  assert.deepEqual(defaults.DEFAULT_BARCODE_ITEM_CODES.map((row) => row.code), approvedItems, "18 client item codes plus WCH are bootstrapped");
  const watchInventory = defaults.DEFAULT_BARCODE_INVENTORY_CODES.find((row) => row.code === "WT");
  const watchItem = defaults.DEFAULT_BARCODE_ITEM_CODES.find((row) => row.code === "WCH");
  assert.ok(watchInventory.isActive && watchInventory.isProvisional && !watchInventory.isClientApproved && watchInventory.defaultKaratCode === "00" && watchInventory.defaultItemCode === "WCH", "WT is active/provisional/client-unapproved with WCH/00 defaults");
  assert.ok(watchItem.isActive && watchItem.isProvisional && !watchItem.isClientApproved, "WCH is active/provisional/client-unapproved");
}

function apiUiAndIdentityGuard() {
  const routes = read(ROUTES);
  const controller = read(CONTROLLER);
  const ui = read(SETTINGS_PAGE);
  const inventory = `${read(INVENTORY_PAGE)}\n${exists(INVENTORY_ITEM_FORM) ? read(INVENTORY_ITEM_FORM) : ""}`;
  for (const endpoint of [
    'router.get("/barcode-settings"',
    'router.post("/barcode-settings/inventory-codes"',
    'router.patch("/barcode-settings/inventory-codes/:id"',
    'router.post("/barcode-settings/item-codes"',
    'router.patch("/barcode-settings/item-codes/:id"',
    'router.get("/barcode-settings/usage/:code"',
  ]) assert.ok(routes.includes(endpoint), `settings API exists: ${endpoint}`);
  assert.ok(routes.includes("settings.view") && routes.includes("inventory.view") && routes.includes("settings.update"), "settings endpoints use existing permission guards");
  assert.ok(routes.includes("auditBarcodeSetting") && routes.includes("auditService.record"), "taxonomy mutations are audited");
  assert.ok(routes.includes("BARCODE_CODE_MUTABLE_WHEN_USED") && routes.includes("Used codes are locked to protect historical barcodes and printed tags."), "used code value/edit lock is enforced");

  assert.ok(exists(SETTINGS_PAGE), "/settings/barcode-codes UI exists");
  for (const token of ["Inventory Codes", "Item Codes", "Client Approved", "Provisional", "Used / Locked", "Allowed Inventory Codes", "Default KT Code", "Used codes are locked to protect historical barcodes and printed tags."]) {
    assert.ok(ui.includes(token), `settings UI includes ${token}`);
  }
  assert.ok(ui.includes("WT") || read("backend/src/config/barcode-defaults.js").includes('code: "WT"'), "Watch is represented in settings source");
  assert.ok(inventory.includes("useBarcodeSettings") && inventory.includes("itemCode"), "inventory create sends a real configured item-code choice");
  assert.ok(inventory.includes('type === "watch"'), "Watch remains visible/supported in inventory create");
  assert.ok(!read("features/assets/hooks/use-assets.ts").includes("const createBarcode"), "frontend no longer generates final stored barcodes");

  for (const field of ["asset.type", "inventory_code", "item_code", "karat_code", "barcode_serial", "barcode", "barcode_generated_at", "barcode_revision", "karat"]) {
    const normalized = field === "asset.type" ? "type" : field;
    assert.ok(controller.includes(normalized), `identity guard covers ${field}`);
  }
  assert.ok(controller.includes("changedAssetIdentityField") && controller.includes("Barcode identity fields cannot be changed after generation"), "generic Asset PATCH blocks identity changes");
}

function safetyAndDocs() {
  const historicalBaseline = String(process.env[HISTORICAL_SCOPE_ENV] || "").trim();
  const historicalMode = Boolean(historicalBaseline);
  if (historicalMode) {
    assertValidGitRef(historicalBaseline);
    console.log(`HISTORICAL BARCODE INVENTORY SCOPE MODE — baseline ${historicalBaseline}`);
  }
  const changedNames = historicalMode
    ? gitLines(["diff", "--name-only", historicalBaseline])
    : gitLines(["diff", "--name-only", "HEAD"]);
  const changed = [...new Set([...changedNames, ...gitLines(["ls-files", "--others", "--exclude-standard"])].map((file) => file.replace(/\\/g, "/")))];
  const forbidden = [
    "backend/src/services/journal.service.js",
    "backend/src/services/source-aware-statement.service.js",
    "backend/src/services/statement-reconciliation.service.js",
    "backend/src/services/full-2300-reconciliation.service.js",
    "backend/src/services/customer-credit.service.js",
  ];
  assert.deepEqual(changed.filter((file) => forbidden.includes(file)), [], "no posting/accounting/statement/reconciliation service changed");

  // Reject seed rewrites and UNSAFE / production reset or historical-barcode
  // backfill tooling — while ALLOWING the sanctioned, environment-gated Phase 32.4
  // demo-reset tooling. Distinguish by content/path, not merely the word "reset".
  const APPROVED_DEMO_TOOLING = new Set([
    "scripts/reset-client-demo-data.js",
    "scripts/verify-client-demo-data.js",
  ]);
  const FORBIDDEN_RESET_PATTERNS = [
    // Seed rewrites in the app seeders directory — EXCEPT the sanctioned Phase 32.4
    // deterministic client-demo seeder (canonical barcode service, accounting-neutral).
    /^backend\/seeders\/(?!client-demo\/)/,
    /production[-_]?reset|reset[-_]?production/i, // production reset tooling
    /backfill[-_].*barcode|migrate[-_]historical[-_]barcode/i, // historical barcode backfill
  ];
  const unsafeResetOrSeed = changed.filter((file) => {
    if (APPROVED_DEMO_TOOLING.has(file)) return false; // sanctioned gated demo tooling
    if (FORBIDDEN_RESET_PATTERNS.some((re) => re.test(file))) return true;
    // Any OTHER reset-named script must prove it is environment-gated; else reject.
    if (/reset/i.test(file)) {
      if (!exists(file)) return true;
      const body = read(file);
      const gated = body.includes("ALLOW_CLIENT_DEMO_RESET") && body.includes("RESET_TARGET") && body.includes("CONFIRM_DATABASE_NAME");
      return !gated;
    }
    return false;
  });
  assert.deepEqual(unsafeResetOrSeed, [], `no seed rewrite or unsafe/production reset script added (found: ${unsafeResetOrSeed.join(", ")})`);
  assert.deepEqual(changed.filter((file) => file.startsWith("features/printing/components/") && /Invoice.*Template|ExchangePrint/.test(file)), [], "invoice/exchange print templates were not changed or deleted");
  const routeDiffBaseline = historicalMode ? historicalBaseline : "HEAD";
  const routeDiff = execFileSync("git", ["diff", "--unified=0", routeDiffBaseline, "--", ROUTES], { cwd: ROOT, encoding: "utf8" });
  for (const forbiddenRoute of ["/pos/checkout", "/sales/returns", "/sales/exchanges"]) {
    assert.ok(!routeDiff.split(/\r?\n/).filter((line) => line.startsWith("+") && !line.startsWith("+++ ")).some((line) => line.includes(forbiddenRoute)), `no ${forbiddenRoute} submit logic added/changed`);
  }
  const customerPage = read("app/[locale]/(dashboard)/customers/[id]/page.tsx");
  assert.ok(/SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS\s*=\s*false/.test(customerPage), "statement-v3/customer reconciliation diagnostics remain hidden");
  const scope = read("docs/CLIENT_SCOPE_LOCK.md");
  assert.ok(scope.includes("full-2300 diagnostic/report UI") && scope.includes("Hidden Until Sign-off"), "full-2300 stays non-customer-facing");
  for (const doc of ["docs/AI_HANDOFF.md", "docs/CLIENT_SCOPE_LOCK.md"]) {
    const source = read(doc);
    assert.ok(source.includes("Phase 32.1-Fix") && source.includes("WT/WCH/00"), `${doc} documents Phase 32.1 and provisional Watch mapping`);
    assert.ok(/RFID.*optional.*future-ready/i.test(source), `${doc} keeps RFID optional/future-ready`);
    assert.ok(/No demo data reset/i.test(source) && /Production reset.*forbidden/i.test(source), `${doc} documents reset boundaries`);
    assert.ok(/UAE E-Invoicing[\s\S]{0,100}deferred/i.test(source), `${doc} keeps UAE E-Invoicing deferred`);
  }
  const packageJson = JSON.parse(read("package.json"));
  assert.equal(packageJson.scripts["verify:barcode-inventory-foundation"], "node scripts/verify-barcode-inventory-foundation.js", "package verifier script is registered");
}

// Phase 32.4-Hotfix — positively assert the sanctioned demo-reset tooling is safe
// (environment-gated, secret-safe, not auto-running). Skips cleanly if the tooling
// is not present, so this file stays valid across earlier baselines.
function approvedDemoResetTooling() {
  const RESET = "scripts/reset-client-demo-data.js";
  if (!exists(RESET)) return;
  const src = read(RESET);
  for (const gate of ["ALLOW_CLIENT_DEMO_RESET", "RESET_TARGET", "CONFIRM_DATABASE_NAME"]) {
    assert.ok(src.includes(gate), `demo reset is environment-gated: ${gate}`);
  }
  assert.ok(/NODE_ENV/.test(src) && /prod/i.test(src), "demo reset rejects production NODE_ENV");
  assert.ok(/darfus_client_demo|DEMO_NAME_ALLOW/.test(src), "demo reset requires a dedicated demo-name allow-rule");
  assert.ok(/REFUSING|process\.exit\(\s*[12]\s*\)/.test(src), "demo reset refuses (exits non-zero) on any safety failure");
  assert.ok(!/console\.(log|error)\([^;]*process\.env\.(DB_PASS|DB_PASSWORD|DATABASE_URL)/.test(src), "demo reset never prints secret values");
  // Not auto-run at app startup and not wired into deployment config.
  assert.ok(!/module\.exports\s*=\s*main|require\(["'].*reset-client-demo-data/.test(src), "demo reset is not auto-invoked as a module export");
}

(function main() {
  serviceAndFormat();
  schemaAndDefaults();
  apiUiAndIdentityGuard();
  safetyAndDocs();
  approvedDemoResetTooling();
  console.log("verify-barcode-inventory-foundation: ok");
})();
