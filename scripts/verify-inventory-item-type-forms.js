/**
 * Phase 32.2-Fix — verify the type-driven inventory item-type Add/Edit forms.
 *
 * Static assertions over the new form components + the aligned inventory page,
 * plus a forbidden-area scope guard. Default global-suite mode checks only the
 * current working tree so approved later commits are not re-litigated.
 * Historical inventory-form scope auditing is still available with
 * VERIFY_INVENTORY_ITEM_TYPE_SCOPE_BASELINE=<git-ref>.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const HISTORICAL_SCOPE_ENV = "VERIFY_INVENTORY_ITEM_TYPE_SCOPE_BASELINE";

const FORM = "features/inventory/components/InventoryItemForm.tsx";
const FIELDS = "features/inventory/components/InventoryTypeFields.tsx";
const CONFIG = "features/inventory/components/inventory-item-form-config.ts";
const PREVIEW = "features/inventory/components/BarcodeTagPreview.tsx";
const VIEWER = "features/inventory/components/InventoryMetadataViewer.tsx";
const PAGE = "app/[locale]/(dashboard)/inventory/page.tsx";
const CUSTOMER_PAGE = "app/[locale]/(dashboard)/customers/[id]/page.tsx";

const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), "utf8");
const exists = (rel) => fs.existsSync(path.resolve(ROOT, rel));

function gitLines(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
function assertValidGitRef(ref) {
  try {
    execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], { cwd: ROOT, stdio: "pipe" });
  } catch (_) {
    throw new Error(`Invalid ${HISTORICAL_SCOPE_ENV} Git ref: ${ref}`);
  }
}

// ── (A) Component files present ──────────────────────────────────────────────
function filesPresent() {
  for (const file of [FORM, FIELDS, CONFIG, PREVIEW, VIEWER]) {
    assert.ok(exists(file), `component present: ${file}`);
  }
}

// ── (B) All six item-type field groups + their type-specific fields ──────────
function typeFieldGroups() {
  const fields = read(FIELDS);
  const groups = ["GoldWeightFields", "GoldPieceFields", "DiamondFields", "GemstoneFields", "PearlFields", "WatchFields"];
  for (const group of groups) {
    assert.ok(fields.includes(`export function ${group}`), `field group exists: ${group}`);
  }
  // Representative type-specific attributes must exist per group.
  assert.ok(/goldColor/.test(fields) && /makingCharge/.test(fields), "gold weight/piece fields include gold-specific attributes");
  assert.ok(/pieceCount/.test(fields), "gold-piece includes piece count");
  assert.ok(/carat/i.test(fields) && /clarity/.test(fields) && /"cut"|cut/i.test(fields), "diamond includes carat/clarity/cut");
  assert.ok(/stoneType/.test(fields) && /saturation/.test(fields), "gemstone includes stone type/saturation");
  assert.ok(/pearlType/.test(fields) && /luster/.test(fields), "pearl includes pearl type/luster");
  assert.ok(/brand/.test(fields) && /model/.test(fields) && /movementType/.test(fields), "watch includes brand/model/movement");
}

// ── (C) Form structure: 8 sections, all types wired, foundation used ─────────
function formStructure() {
  const form = read(FORM);
  for (let section = 1; section <= 8; section += 1) {
    assert.ok(form.includes(`index={${section}}`), `8-section structure includes section ${section}`);
  }
  for (const group of ["GoldWeightFields", "GoldPieceFields", "DiamondFields", "GemstoneFields", "PearlFields", "WatchFields"]) {
    assert.ok(form.includes(group), `form wires field group: ${group}`);
  }
  // Uses the Phase 32.1 barcode/inventory foundation.
  assert.ok(form.includes("inventorySubtype"), "form uses inventory_subtype");
  assert.ok(form.includes("metadata") && form.includes("INVENTORY_METADATA_SCHEMA_VERSION"), "form uses metadata + schema version foundation");
  assert.ok(form.includes("inventoryCode:") && form.includes("itemCode:"), "form sends taxonomy (inventory/item code) to the backend allocator");
  // Edit mode must not resend identity fields (backend rejects them post-barcode).
  assert.ok(/mode === "edit"/.test(form) && /updateAsset\(/.test(form), "form supports edit via updateAsset");
}

// ── (D) Barcode safety: frontend never generates the final stored barcode ────
function barcodeSafety() {
  const form = read(FORM);
  const preview = read(PREVIEW);
  // No browser-side final barcode assignment in the create/update payloads.
  assert.ok(!/\bbarcode:\s*[^,\n]/.test(form), "form never sets a final stored barcode field in its payloads");
  assert.ok(!/allocateBarcodeSerial|generateBarcodeForAsset|formatBarcode/.test(form + preview), "no barcode allocation/format logic runs in the browser");
  assert.ok(/backend/i.test(form) && /source of truth|allocates the final/i.test(form), "form documents backend as barcode source of truth");
  assert.ok(/Preview only/i.test(preview) && /NNNNNN|placeholder/i.test(preview), "tag preview is a labelled read-only placeholder");
}

// ── (E) Watch visible + WT/WCH/00 from settings or documented fallback ───────
function watchProvisional() {
  const config = read(CONFIG);
  const fields = read(FIELDS);
  assert.ok(/type:\s*"watch"/.test(config), "watch type is present in the config (visible)");
  assert.ok(/WATCH_FALLBACK_CODES[\s\S]{0,160}"WT"[\s\S]{0,60}"WCH"[\s\S]{0,60}"00"/.test(config), "watch documented fallback is WT / WCH / 00");
  assert.ok(/provisional/i.test(config) && /provisional/i.test(fields), "watch is marked owner-approved provisional");
  assert.ok(read(FORM).includes("WATCH_FALLBACK_CODES"), "form resolves watch taxonomy from settings with documented fallback");
}

// ── (F) Inventory page aligned to the new form (no second flow) ──────────────
function pageAligned() {
  const page = read(PAGE);
  assert.ok(page.includes("InventoryItemForm") && page.includes('mode="add"'), "inventory page Add flow is aligned to the type-driven form");
  assert.ok(read(VIEWER).includes("InventoryMetadataViewer"), "read-only metadata viewer exists");
}

// ── (G) Hidden diagnostics untouched + package + docs ────────────────────────
function guardsAndDocs() {
  assert.ok(/const\s+SHOW_ACCOUNTING_SENSITIVE_DIAGNOSTICS\s*=\s*false\s*;/.test(read(CUSTOMER_PAGE)), "statement-v3 / credit reconciliation stay hidden by default");
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["verify:inventory-item-type-forms"], "node scripts/verify-inventory-item-type-forms.js", "package verifier script registered");
  for (const doc of ["docs/AI_HANDOFF.md", "docs/CLIENT_SCOPE_LOCK.md"]) {
    assert.ok(read(doc).includes("Phase 32.2"), `${doc} documents Phase 32.2`);
  }
}

// ── (H) Working-tree forbidden-area scope guard ──────────────────────────────
function scopeGuard() {
  const historicalBaseline = String(process.env[HISTORICAL_SCOPE_ENV] || "").trim();
  const historicalMode = Boolean(historicalBaseline);
  if (historicalMode) {
    assertValidGitRef(historicalBaseline);
    console.log(`HISTORICAL INVENTORY ITEM TYPE SCOPE MODE — baseline ${historicalBaseline}`);
  }

  const changed = historicalMode
    ? gitLines(["diff", "--name-only", historicalBaseline])
    : gitLines(["diff", "--name-only", "HEAD"]);
  const untracked = gitLines(["ls-files", "--others", "--exclude-standard"]);
  const allChanged = [...new Set([...changed, ...untracked].map((f) => f.replace(/\\/g, "/")))];

  // Protected accounting/posting/mutation areas — including the sales/return/
  // exchange submit routes (erp.routes.js) — must not be touched by this
  // frontend-only phase.
  const FORBIDDEN_AREAS = [
    /^backend\/src\/services\/journal\.service\.js$/,
    /^backend\/src\/services\/source-aware-statement\.service\.js$/,
    /^backend\/src\/services\/statement-reconciliation\.service\.js$/,
    /^backend\/src\/services\/full-2300-reconciliation\.service\.js$/,
    /^backend\/src\/services\/customer-credit\.service\.js$/,
    /^backend\/(src\/)?migrations\//,
    /^backend\/src\/seeders\//,
  ];
  const forbiddenTouched = allChanged.filter((f) => FORBIDDEN_AREAS.some((re) => re.test(f)));
  assert.deepEqual(forbiddenTouched, [], `phase must not touch protected accounting/posting/mutation/migration areas (found: ${forbiddenTouched.join(", ")})`);

  const nameStatus = historicalMode
    ? gitLines(["diff", "--name-status", historicalBaseline])
    : gitLines(["diff", "--name-status", "HEAD"]);
  const deleted = nameStatus.filter((l) => l.startsWith("D\t")).map((l) => l.slice(2).replace(/\\/g, "/"));
  assert.deepEqual(deleted, [], `no file or print template deleted (found: ${deleted.join(", ")})`);

  const codeFiles = allChanged.filter((f) => /^(app|components|features|lib|backend)\//.test(f) && exists(f));
  const code = codeFiles.map((f) => read(f)).join("\n");
  assert.ok(!/UAE\s+(?:Government\s+)?E-Invoicing|\bUBL\b/i.test(code), "no UAE E-Invoicing code added");
  assert.ok(!/event[- ]sourcing|projection architecture/i.test(code), "no event-sourcing/projection architecture added");
  assert.ok(!/production data reset|demo data reset|\.sync\(\s*\{\s*force|TRUNCATE\s+TABLE/i.test(code), "no demo/production reset or seed rewrite added");
}

(function main() {
  filesPresent();
  typeFieldGroups();
  formStructure();
  barcodeSafety();
  watchProvisional();
  pageAligned();
  guardsAndDocs();
  scopeGuard();
  console.log("verify-inventory-item-type-forms: ok");
})();
