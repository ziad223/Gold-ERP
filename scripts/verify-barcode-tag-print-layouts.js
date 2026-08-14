/**
 * Phase 32.3-Fix — verify the client front/back barcode tag layouts.
 *
 * Static assertions over the additive client tag template + type-specific faces +
 * mapper extension + form metadata capture, plus a forbidden-area scope guard.
 * Default global-suite mode checks only the current working tree so approved
 * later commits are not re-litigated. Historical barcode-phase scope auditing is
 * still available with VERIFY_BARCODE_TAG_SCOPE_BASELINE=<git-ref>.
 *
 * The generic BarcodePrintTemplate and Product label flow must remain intact and
 * unchanged.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const HISTORICAL_SCOPE_ENV = "VERIFY_BARCODE_TAG_SCOPE_BASELINE";

const CLIENT_TEMPLATE = "features/printing/components/ClientBarcodeTagTemplate.tsx";
const FRONT = "features/printing/components/barcode-tags/BarcodeTagFront.tsx";
const BACKS = "features/printing/components/barcode-tags/BarcodeTagBacks.tsx";
const TAG_TYPES = "features/printing/components/barcode-tags/types.ts";
const GENERIC_TEMPLATE = "features/printing/components/BarcodePrintTemplate.tsx";
const SCANNABLE = "features/printing/components/ScannableBarcode.tsx";
const MAPPER = "lib/print/barcode-label.ts";
const FIELDS = "features/inventory/components/InventoryTypeFields.tsx";
const FORM = "features/inventory/components/InventoryItemForm.tsx";
const PAGE = "app/[locale]/(dashboard)/inventory/page.tsx";
const CUSTOMER_PAGE = "app/[locale]/(dashboard)/customers/[id]/page.tsx";

const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");
const exists = (rel) => fs.existsSync(path.resolve(ROOT, rel));
const gitLines = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
function assertValidGitRef(ref) {
  try {
    execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], { cwd: ROOT, stdio: "pipe" });
  } catch (_) {
    throw new Error(`Invalid ${HISTORICAL_SCOPE_ENV} Git ref: ${ref}`);
  }
}

// ── (A) Additive architecture: client template added, generic preserved ──────
function architecture() {
  for (const file of [CLIENT_TEMPLATE, FRONT, BACKS, TAG_TYPES]) assert.ok(exists(file), `client tag file present: ${file}`);
  assert.ok(exists(GENERIC_TEMPLATE), "generic BarcodePrintTemplate still exists");
  assert.ok(exists(SCANNABLE), "ScannableBarcode still exists");
  const page = read(PAGE);
  assert.ok(page.includes("BarcodePrintTemplate") && page.includes("productToLabelData"), "generic/product label flow preserved on the inventory page");
  assert.ok(page.includes("ClientBarcodeTagTemplate") && page.includes("assetToTagData"), "client front/back asset tag flow is wired");
  const client = read(CLIENT_TEMPLATE);
  assert.ok(client.includes("BarcodeTagFront") && client.includes("BarcodeTagBack"), "client template renders both faces");
}

// ── (B) Type-specific back layouts (all 9 variants + Watch) ──────────────────
function typeLayouts() {
  const backs = read(BACKS);
  for (const fn of ["GoldWeightTagBack", "GoldPieceTagBack", "DiamondTagBack", "GemstoneTagBack", "PearlTagBack", "WatchTagBack"]) {
    assert.ok(backs.includes(`export function ${fn}`), `back layout exists: ${fn}`);
  }
  // Jewellery vs loose handled inside Diamond/Gem/Pearl backs.
  assert.ok(/loose/i.test(backs), "loose vs jewellery distinction handled in stone/pearl backs");
  // Client back content markers.
  assert.ok(backs.includes('"GW"') && backs.includes('"ST"') && backs.includes('"NT"') && backs.includes('"MC"'), "Gold By Weight back uses GW/ST/NT/MC");
  assert.ok(backs.includes('"WT"') && backs.includes('"DIS"'), "Gold By Piece back uses WT/DIS");
  assert.ok(backs.includes('"CC"') && backs.includes("Carat"), "Diamond back uses Carat/CC");
  assert.ok(backs.includes("resolveStones"), "Gemstone back renders multiple ST rows via resolveStones");
  assert.ok(/provisional/i.test(backs), "Watch back is marked provisional");
}

// ── (C) Front face + barcode safety + price policy ───────────────────────────
function frontAndPrice() {
  const front = read(FRONT);
  const types = read(TAG_TYPES);
  assert.ok(front.includes("item.barcode") && front.includes("ScannableBarcode"), "front face renders the stored barcode via ScannableBarcode");
  assert.ok(front.includes("barcode-text"), "human-readable barcode is rendered");
  assert.ok(read(SCANNABLE).includes("code128"), "CODE128 remains the default symbology");
  assert.ok(front.includes('type="barcode"'), "front defaults to the linear (CODE128) barcode, QR optional");
  // Price policy: Gold By Weight hidden; others shown; Watch configurable.
  assert.ok(/gold-weight"\s*\)\s*return false/.test(types) || /type === "gold-weight"[\s\S]{0,40}return false/.test(types), "Gold By Weight hides selling price");
  assert.ok(/type === "watch"[\s\S]{0,60}showWatchPrice/.test(types), "Watch price is configurable");
  assert.ok(types.includes("showProvisionalWatchMarker") && front.includes("PROVISIONAL"), "Watch provisional marker is supported");
}

// ── (D) Mapper extension carries the required fields ─────────────────────────
function mapper() {
  const src = read(MAPPER);
  assert.ok(src.includes("export function assetToTagData"), "asset tag mapper added");
  assert.ok(/barcode:\s*String\(asset\.barcode\s*\|\|\s*asset\.id\)/.test(src), "printed barcode equals the stored asset.barcode");
  for (const field of ["inventorySubtype", "inventoryCode", "itemCode", "karatCode", "barcodeSerial", "barcodeRevision", "netWeight", "goldWeight", "metadata"]) {
    assert.ok(src.includes(field), `asset tag payload carries ${field}`);
  }
  // The flat generic payload + product mapper are untouched (still present).
  assert.ok(src.includes("export function assetToLabelData") && src.includes("export function productToLabelData"), "generic + product mappers preserved");
  // No barcode allocation/format in the browser.
  assert.ok(!/allocateBarcodeSerial|generateBarcodeForAsset|formatBarcode/.test([src, read(FRONT), read(BACKS), read(CLIENT_TEMPLATE)].join("\n")), "no barcode allocation/generation runs in the browser");
}

// ── (E) Missing metadata capture added to the forms ──────────────────────────
function metadataCapture() {
  const fields = read(FIELDS);
  const form = read(FORM);
  assert.ok(form.includes('setMeta("discount"'), "common discount capture added");
  assert.ok(fields.includes('setMeta("stoneWeight"'), "gold stone weight capture added");
  assert.ok(fields.includes("minimumMakingCharge"), "minimum making charge capture added");
  assert.ok(fields.includes('setMeta("stones"') && fields.includes("StonesRepeater"), "gemstone multi-stone array capture added");
  assert.ok(read(TAG_TYPES).includes("stoneType") && read(TAG_TYPES).includes("stones"), "gemstone stones resolver falls back to single stoneType/carat");
  assert.ok(read(TAG_TYPES).includes("obfuscateMakingCharge"), "making-charge obfuscation is a configurable display option");
}

// ── (F) Hidden diagnostics + package + docs ──────────────────────────────────
function guardsAndDocs() {
  assert.ok(/const\s+SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS\s*=\s*false\s*;/.test(read(CUSTOMER_PAGE)), "statement-v3 / credit reconciliation stay hidden");
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["verify:barcode-tag-print-layouts"], "node scripts/verify-barcode-tag-print-layouts.js", "package verifier registered");
  for (const doc of ["docs/AI_HANDOFF.md", "docs/CLIENT_SCOPE_LOCK.md"]) {
    assert.ok(read(doc).includes("Phase 32.3"), `${doc} documents Phase 32.3`);
  }
}

// ── (G) Forbidden-area scope guard ───────────────────────────────────────────
function scopeGuard() {
  const historicalBaseline = String(process.env[HISTORICAL_SCOPE_ENV] || "").trim();
  const historicalMode = Boolean(historicalBaseline);
  if (historicalMode) {
    assertValidGitRef(historicalBaseline);
    console.log(`HISTORICAL BARCODE TAG SCOPE MODE — baseline ${historicalBaseline}`);
  }

  const changed = historicalMode
    ? gitLines(["diff", "--name-only", historicalBaseline])
    : gitLines(["diff", "--name-only", "HEAD"]);
  const untracked = gitLines(["ls-files", "--others", "--exclude-standard"]);
  const allChanged = [...new Set([...changed, ...untracked].map((f) => f.replace(/\\/g, "/")))];

  const FORBIDDEN_AREAS = [
    // Tag layouts are frontend-only — but allow the sanctioned Phase 32.4
    // deterministic client-demo seeder (added by a later approved phase).
    /^backend\/(?!seeders\/client-demo\/)/,
    /^backend\/(src\/)?migrations\//,
    /^backend\/src\/seeders\//,
    /^features\/printing\/components\/(InvoiceDocument|InvoicePrintTemplate|CompactInvoicePrintTemplate|MinimalInvoicePrintTemplate|ThermalInvoicePrintTemplate|ExchangePrintSummary|InvoicePrintOptionsDialog)\.tsx$/,
  ];
  const hotfixAllowed = new Set([
    "backend/src/routes/erp.routes.js",
    "backend/src/services/posting.service.js",
    // Phase 34.5B Core approved employee-first operator gate/security files.
    "backend/src/bootstrap/accessControl.js",
    "backend/src/services/sales-operator-policy.service.js",
    "backend/src/services/system-account.service.js",
    // HF6D Employee authorization hydration and Employee-aware business guard.
    "backend/src/routes/employee-authorization.routes.js",
    "backend/src/services/operator-session.service.js",
    "backend/src/middleware/business-permission.middleware.js",
  ]);
  const forbiddenTouched = allChanged.filter((f) => !hotfixAllowed.has(f) && FORBIDDEN_AREAS.some((re) => re.test(f)));
  assert.deepEqual(forbiddenTouched, [], `phase must not touch backend/migrations/seeders/invoice-print templates (found: ${forbiddenTouched.join(", ")})`);

  const nameStatus = historicalMode
    ? gitLines(["diff", "--name-status", historicalBaseline])
    : gitLines(["diff", "--name-status", "HEAD"]);
  const deleted = nameStatus.filter((l) => l.startsWith("D\t")).map((l) => l.slice(2).replace(/\\/g, "/"));
  assert.deepEqual(deleted, [], `no file or template deleted (found: ${deleted.join(", ")})`);
  // The generic barcode template must not be deleted.
  assert.ok(exists(GENERIC_TEMPLATE), "generic BarcodePrintTemplate preserved (not deleted)");

  const codeFiles = allChanged.filter((f) => /^(app|components|features|lib|backend)\//.test(f) && exists(f));
  const code = codeFiles.map((f) => read(f)).join("\n");
  assert.ok(!/UAE\s+(?:Government\s+)?E-Invoicing|\bUBL\b/i.test(code), "no UAE E-Invoicing code added");
  assert.ok(!/event[- ]sourcing|projection architecture/i.test(code), "no event-sourcing/projection architecture added");
  assert.ok(!/production data reset|demo data reset|\.sync\(\s*\{\s*force|TRUNCATE\s+TABLE/i.test(code), "no demo/production reset or seed rewrite added");
}

(function main() {
  architecture();
  typeLayouts();
  frontAndPrice();
  mapper();
  metadataCapture();
  guardsAndDocs();
  scopeGuard();
  console.log("verify-barcode-tag-print-layouts: ok");
})();
