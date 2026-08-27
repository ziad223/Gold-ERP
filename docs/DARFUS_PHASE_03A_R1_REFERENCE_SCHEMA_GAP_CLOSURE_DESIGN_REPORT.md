# DARFUS ERP — PHASE 03A-R1 REFERENCE / SCHEMA GAP CLOSURE DESIGN REPORT

**Control:** `DARFUS-PHASE-03A-R1-REFERENCE-SCHEMA-GAP-CLOSURE-DESIGN`  
**Phase:** `03A-R1`  
**Mode:** `READ_ONLY_DESIGN_ONLY`  
**Official DB:** `darfus_erp`  
**Scope:** The ten approved gaps only. No implementation was performed.

## 1. Executive Summary

The ten approved Phase 03A gaps are now sufficiently evidenced for a minimum-safe closure design. This control made no source, schema, migration, configuration, provisioning, or business-transaction change.

The principal conclusions are:

- The canonical Certificate Authority spelling is **`Gübelin`**, taken from the Diamond reference and the current final authority instruction. Current source/migration text uses the legacy spelling `Gubelin`; the official database has no Certificate Authority rows.
- Diamond Tone, Tone Level, and Saturation are fully defined by the Diamond reference. Current source/database contain the equivalent values only under Gemstone categories, not Diamond-scoped categories.
- Diamond and Gem Position/Setting fields already exist in the current component tables and V2 persistence/read paths. The gap is registry/category and validation authority, not a missing physical column.
- Gem Treatment is a confirmed field, and a generic `GEMSTONE_TREATMENT` category exists in source, but the Gem reference does not provide a canonical treatment list. No treatment value is invented.
- Loose `KT=00` is frozen by authority but is not currently derived from exact loose profile/subtype at barcode generation. The current configuration is Inventory-Code scoped. The minimum safe design is a server-side subtype-aware derivation at the canonical barcode boundary, with no historical-barcode rewrite.

`GATE = PASS_PHASE_03A_R1_REFERENCE_SCHEMA_GAP_CLOSURE_DESIGN_READY` means the design is ready for a separately approved implementation batch. It does not mean the gaps are implemented or provisioned.

## 2. Preconditions Proof

| Check | Evidence | Result |
|---|---|---|
| Phase 01 authority freeze available | `docs/DARFUS_FINAL_OWNER_BUSINESS_AUTHORITY_FREEZE.md`, including `ONE_PHYSICAL_PIECE_ONE_ASSET`, barcode lifecycle, canonical codes, and loose `KT=00` | PASS |
| Prior Phase 03A report available | `docs/DARFUS_PHASE_03A_REFERENCE_DERIVED_PROVISIONING_REPORT.md` | PASS |
| Prior Phase 03A gate understood | Prior report records `BLOCKED_PHASE_03A_AUTHORITY_OR_SCHEMA_CONFLICT` and enumerates the unresolved gaps | PASS |
| Raw reference evidence available | Diamond and Gem extracted text from the prior full-reference reconciliation workspace | PASS |
| Official DB identity | Read-only `SELECT current_database(), version()` returned `darfus_erp`, PostgreSQL 16.15 | PASS |
| No implementation action | No source edit, migration, build, backup, provisioning, or transactional business operation was run in this control | PASS |

The current `next-env.d.ts` generated drift and the existing dirty worktree were not edited or cleaned.

## 3. Official DB Current State Read-Only

Read-only query target: `darfus_erp` on container `darfus-postgres`.

| Entity | Current count | Interpretation |
|---|---:|---|
| `profile_master_data` | 502 | Prior approved reference-derived provisioning; no R1 write |
| `pearl_size_master_data` | 39 | Prior approved reference-derived provisioning; 1.0–20.0 mm at 0.5 step |
| `barcode_inventory_codes` | 5 | `GW`, `GP`, `DD`, `GS`, `PL` |
| `barcode_item_codes` | 20 | Prior canonical item-code provisioning |
| `barcode_sequences` | 0 | Lazy allocation; no physical assets exist |
| `audit_logs` | 19 | Prior Phase 03A provisioning/correction evidence; no R1 write |
| `suppliers` | 0 | Not provisioned; outside this design control |
| `inventory_locations` | 0 | Not provisioned; outside this design control |
| `settings` | 0 | Not provisioned; outside this design control |
| `purchase_orders` | 0 | No business transaction |
| `assets` | 0 | No physical inventory transaction |
| `inventory_asset_movements` | 0 | No movement transaction |
| `payments` | 0 | No payment transaction |
| `journal_entries` | 0 | No accounting transaction |
| `journal_lines` | 0 | No accounting transaction |
| `idempotency_requests` | 0 | No receive/request transaction |

Current `profile_master_data` category counts relevant to the gaps:

| Category | Count |
|---|---:|
| `GEMSTONE_TONE` | 14 |
| `GEMSTONE_TONE_LEVEL` | 9 |
| `GEMSTONE_SATURATION` | 10 |
| `GEMSTONE_TREATMENT` | 0 |
| `DIAMOND_TONE` | 0 / category not registered |
| `DIAMOND_TONE_LEVEL` | 0 / category not registered |
| `DIAMOND_SATURATION` | 0 / category not registered |
| Position/Setting categories | 0 / category not registered |
| `CERTIFICATE_AUTHORITY` | 0; prior provisioning intentionally blocked |

The two component tables exist and have zero business component rows. Their schema was inspected read-only.

## 4. Prior Provisioning Write Accounting

This R1 control did not mutate the official DB. The prior Phase 03A report must be described accurately as follows:

| Prior Phase 03A scope | Count | Status |
|---|---:|---|
| Official DB transactional business writes | 0 | No suppliers, locations, settings, assets, POs, movements, payments, journals, or idempotency rows |
| Official DB reference provisioning writes | 566 | `502 + 39 + 5 + 20` |
| Official DB audit writes from Phase 03A | 2 | Provisioning and verified Pearl Size correction |
| R1 writes | 0 | Read-only design control |

The current audit count is 19 because later approved runtime/audit activity is present in the official DB; no attempt was made to attribute or alter it in R1.

## 5. Gap Matrix

| Gap | Expected authority | Current actual | Classification | Design status |
|---|---|---|---|---|
| GAP-01 Certificate Authority spelling | Canonical `Gübelin` | Source/migration use `Gubelin`; DB has no rows | AUTHORITY / MASTER DATA | Design complete |
| GAP-02 Diamond Tone | Diamond-scoped registry with 14 reference values | Only `GEMSTONE_TONE` exists and is provisioned | MASTER DATA / SOURCE | Design complete |
| GAP-03 Diamond Tone Level | Diamond-scoped registry with 9 reference values | Only `GEMSTONE_TONE_LEVEL` exists and is provisioned | MASTER DATA / SOURCE | Design complete |
| GAP-04 Diamond Saturation | Diamond-scoped registry with 10 reference values | Only `GEMSTONE_SATURATION` exists and is provisioned | MASTER DATA / SOURCE | Design complete |
| GAP-05 Diamond Stone Position | Master Data registry, optional, 7 values | DB column exists; registry/category does not | MASTER DATA / VALIDATION | Design complete |
| GAP-06 Diamond Stone Setting | Master Data registry, optional, 47 values | DB column exists; registry/category does not | MASTER DATA / VALIDATION | Design complete |
| GAP-07 Gem Stone Position | Master Data registry, optional, 7 values | DB column exists; registry/category does not | MASTER DATA / VALIDATION | Design complete |
| GAP-08 Gem Stone Setting | Master Data registry, optional, 47 values | DB column exists; registry/category does not | MASTER DATA / VALIDATION | Design complete |
| GAP-09 Gem Treatment | Field confirmed; value authority must be DB-backed | `GEMSTONE_TREATMENT` category exists in source, but raw reference gives no canonical list | ACCEPTANCE / MASTER DATA | Field design complete; list intentionally open |
| GAP-10 Loose `KT=00` | `DDLOS00...`, `GSLOS00...`, `PLLOS00...` pattern | Karat requirement is Inventory-Code scoped; subtype is not used for derivation | BARCODE / SOURCE DESIGN | Design complete |

No additional gap is promoted into this control. Any other defect is out of scope.

## 6. Certificate Authority Resolution

The canonical value is **`Gübelin`**. The Diamond reference explicitly lists:

`AGS, AIGS, Bellerophon, DCLA, EGL, GCAL, GIA, GIT, GRS, Gübelin, HRD, ICA, IGI, IIDGR, Lotus Gemology, SSEF`.

The current source constant `CERTIFICATE_AUTHORITIES` at `backend/src/services/inventory-master-data-policy.service.js:24-27` and the prior migration seed at `backend/migrations/20260807120000-profile-master-data-and-loose-references.js:23` use `Gubelin` and omit `DCLA` and `IIDGR`. The official DB has no Certificate Authority rows, so no historical row needs rewriting.

Minimum-safe design:

1. Use `Gübelin` as the canonical stored/display label.
2. Normalize the legacy ASCII alias `Gubelin` to `Gübelin` at controlled input/lookup boundaries.
3. Do not delete or rewrite a future historical value already referenced by an Asset; preserve historical snapshots.
4. Provision the 16 canonical Diamond-reference values only in a future approved provisioning batch.
5. Keep alias normalization auditable and server-side; do not rely on frontend labels.

This resolves the old conflict without silently selecting the wrong spelling.

## 7. Diamond Tone/Tone Level/Saturation Analysis

### Diamond Tone

Reference values: `Bright, Cool, Deep, Earthy, Iridescent, Metallic, Neutral, Neon, Pastel, Rich, Smoky, Soft, Warm, Other` — 14 values. The field is optional, primarily for Fancy Color Diamonds, must come from Master Data, supports an audited `Other` description, and does not replace Diamond Color.

### Diamond Tone Level

Reference values: `Extremely Light, Very Light, Light, Medium Light, Medium, Medium Dark, Dark, Very Dark, Extremely Dark` — 9 values. The field is optional and descriptive only.

### Diamond Saturation

Reference values: `Brownish, Exceptional Vivid, Faint, Grayish, Moderate, Moderately Strong, Strong, Very Strong, Vivid, Weak` — 10 values. The field is optional, descriptive, and does not replace Diamond Color.

### Current source and DB evidence

`backend/src/services/inventory-master-data-policy.service.js:38-40` defines equivalent arrays under `GEMSTONE_TONE`, `GEMSTONE_TONE_LEVELS`, and `GEMSTONE_SATURATIONS`; the official DB contains 14, 9, and 10 rows in those Gemstone categories. `backend/src/services/profile-master-data.service.js:16-18, 30-60` does not register Diamond-scoped versions in `CATEGORIES` or the Diamond profile category lists.

Minimum-safe design: add Diamond-scoped category keys and map them only to Diamond Jewellery and Loose Diamond. Reusing the same literal labels is evidence-backed; reusing the Gemstone category authority would couple two profile authorities and is not recommended.

## 8. Diamond Position/Setting Analysis

The Diamond reference defines:

- Position: `Accent Stone, Center Stone, Halo Stone, Hidden Stone, Melee Stone, Other, Side Stone` — 7 values.
- Setting: `Antique, Bar, Basket, Bead, Bead & Bright, Box Bezel, Bright Cut, Burnish, Cathedral, Channel, Claw, Cluster, Double Halo, Double Prong, Eight Prong, Fishtail, Five Prong, Flush, Four Prong, French Pavé, Full Bezel, Grain, Gypsy, Halo Setting, Half Bezel, Hidden Halo, Illusion, Invisible, Micro Pavé, Other Setting, Partial Bezel, Pavé, Peg Head, Petal Prong, Rub Over Bezel, Scallop, Semi Tension, Shared Bead, Shared Prong, Six Prong, Star, Tension, Three Prong, Tiffany, Trellis, Two Prong, V-Prong` — 47 values.

Both fields are optional Master Data selections. `Other` / `Other Setting` requires a description. Position and setting are normally jewellery fields and are not normally used for loose Diamond.

Read-only schema evidence: `asset_diamond_component_details` already has `position` and `setting` as nullable `varchar` columns. Runtime evidence: `backend/src/services/inventory-v2-runtime.service.js:606-620` writes them and `:686-695` reads them. Therefore the gap is not a missing schema column; it is missing profile-scoped registry, server validation, and future provisioning.

## 9. Gem Position/Setting Analysis

The Gem reference defines the same complete lists and rules as the Diamond reference:

- Position: 7 values — `Accent Stone, Center Stone, Halo Stone, Hidden Stone, Melee Stone, Other, Side Stone`.
- Setting: 47 values — the complete list in Section 8.

The Gem reference additionally states that more than one setting may be selected for one stone when the design requires it, that settings may differ per stone, that changes are audited, and that `Other` requires a description.

Read-only schema evidence: `asset_gemstone_component_details` already has nullable `position` and `setting` `varchar` columns. Runtime evidence: `backend/src/services/inventory-v2-runtime.service.js:626-640` writes them and `:700-710` reads them. The minimum-safe closure is therefore category/registry/API validation support, not a new column.

## 10. Gem Treatment Authority Analysis

The Gem reference confirms a `Stone Treatment` field in the Item Details page (`Gem_Stone_Jewellery_Loose_Stone__extract/extracted.txt:960`), but it does not define a canonical value list, requiredness rule, or `Other` behavior for that field. No value is invented in this report.

Current source:

- `backend/src/services/profile-master-data.service.js:18,40-46,72,200` defines `GEMSTONE_TREATMENT`, includes it in Gem profile categories, resolves it through Master Data, and persists a reference snapshot.
- `asset_gemstone_component_details.treatment` exists as a nullable `varchar`; it was added by `backend/migrations/20260807120000-profile-master-data-and-loose-references.js:56`.
- The current initial dataset has no treatment list, and the official DB has zero `GEMSTONE_TREATMENT` rows.

Design: keep the field DB-backed and extensible through the existing permission-controlled Master Data flow. Do not provision a value list until a reference or Owner authority defines it. This is not an implementation blocker for the field plumbing, but it is a blocker for claiming a complete canonical treatment registry.

## 11. Loose KT=00 Forensic

Frozen authority requires `LOOSE_PROFILE_KT_SEGMENT = 00`, with examples `DDLOS00000001`, `GSLOS00000001`, and `PLLOS00000001`.

Current actual:

- `backend/src/config/barcode-defaults.js` marks the five inventory codes as karat-requiring and does not express loose subtype exceptions.
- `backend/src/models/barcodeInventoryCode.model.js` stores `requiresKarat`, `defaultKaratCode`, and `defaultItemCode` at Inventory-Code level.
- `backend/src/models/barcodeSequence.model.js` scopes sequences by `(companyId, inventoryCode, itemCode, karatCode)` and the official DB has zero sequence rows.
- `backend/src/services/barcode-identity.service.js:156-206` accepts `inventorySubtype`, uses it only to improve the missing-karat error text (`:191`), then normalizes the supplied/default karat (`:196`). It does not derive `00` from `LOOSE_DIAMOND`, `LOOSE_GEMSTONE`, or `LOOSE_PEARL`.
- Canonical V2 call sites pass `piece.inventorySubtype` and `legacySubtypeForProfile(piece.profile)`, including `backend/src/routes/erp.routes.js:6179` and `:8312-8341`; the subtype is available at the boundary but is not currently an identity rule.

Root cause: `requires_karat` is Inventory-Code scoped while the frozen `00` exception is final-profile/subtype scoped. Treating `DD`, `GS`, or `PL` as globally non-karat would break Jewellery; treating all of them as karat-required blocks the loose pattern.

## 12. Loose KT=00 Solution Options

| Option | Design | Schema | Risk | Assessment |
|---|---|---|---|---|
| A | Server derives `00` only for exact loose final profiles at canonical barcode generation; reject contradictory loose karat and preserve explicit Jewellery karat | No | Requires complete profile authority at every canonical boundary | Recommended minimum |
| B | Add subtype/profile-aware barcode policy table or columns | Yes | More durable configuration but adds migration, policy, and provisioning surface | Future only if A cannot be proven |
| C | Split DD/GS/PL into separate inventory codes for loose profiles | Yes/major data impact | Breaks frozen canonical inventory-code authority and existing mappings | Reject |
| D | Let frontend send `00` as a normal karat value | No | Not server authoritative; can be bypassed or contradicted | Reject |

## 13. Recommended Minimum Safe Solution

### Recommended path

Use Option A at the canonical server barcode boundary:

1. Resolve the exact server-authoritative profile before barcode generation.
2. For `LOOSE_DIAMOND`, `LOOSE_GEMSTONE`, and `LOOSE_PEARL`, set the identity karat segment to `00`.
3. Reject a non-`00` supplied karat for those exact profiles instead of silently accepting it.
4. For Jewellery profiles, preserve the existing explicit karat validation and sequence behavior.
5. Preserve existing Barcode, Asset, and history rows; do not rewrite historical or retired values.
6. Use the same derivation for new replacements, while keeping reprint identity unchanged.
7. Add focused tests for all three loose profiles, Jewellery non-regression, collision handling, replacement, and server-bypass attempts.

### Master-data path

Add profile-scoped category keys without changing the `profile_master_data` table shape:

`DIAMOND_TONE`, `DIAMOND_TONE_LEVEL`, `DIAMOND_SATURATION`, `DIAMOND_POSITION`, `DIAMOND_SETTING`, `GEMSTONE_POSITION`, `GEMSTONE_SETTING`.

Populate them only in a later approved R2 provisioning step from the literal reference values. Keep `GEMSTONE_TREATMENT` empty until an authoritative list is supplied.

## 14. Schema Change Matrix

| Gap | Current schema capability | Schema migration under recommended design | Reason |
|---|---|---|---|
| GAP-01 | `profile_master_data` stores arbitrary category/value labels | No | Canonical value and alias normalization are source/data-policy concerns |
| GAP-02–04 | `profile_master_data.category_key` is not an enum | No | Add category keys through source registry and rows; duplicate labels are allowed by existing schema |
| GAP-05–08 | Component tables already have nullable `position`/`setting` varchar columns | No | Add registry/validation authority only |
| GAP-09 | Gem component `treatment` varchar exists; Master Data category exists | No | No new column; canonical list remains intentionally unprovisioned |
| GAP-10 | Barcode identity already accepts a normalized two-digit karat segment and lazy sequence allocation | No for Option A | Derivation belongs at canonical barcode identity boundary |

Option B for GAP-10 would require a new subtype-aware policy schema and is not part of the recommended minimum design.

## 15. Source Change Matrix

| File/function | Required future change | Gap |
|---|---|---|
| `backend/src/services/inventory-master-data-policy.service.js` | Canonical `Gübelin` list; Diamond-scoped arrays; Position/Setting arrays; no invented Gem Treatment list | 01–09 |
| `backend/src/services/profile-master-data.service.js` | Category constants, profile category mapping, field-category mapping, and strict profile-scoped reference resolution | 02–09 |
| `backend/src/services/inventory-v2-runtime.service.js` | Validate profile-specific position/setting references and preserve multi-setting semantics where the reference requires it | 05–09 |
| `backend/src/services/barcode-identity.service.js` | Server-derived loose `00`, contradictory-input rejection, and replacement-path consistency | 10 |
| `backend/src/routes/erp.routes.js` | Ensure the canonical receive/asset/replacement calls pass the authoritative profile into the identity rule and expose no frontend override | 10 |
| Master Data read/API/UI callers | Display canonical `Gübelin`; consume server-backed profile categories; preserve audit/permission behavior | 01–09 |

No unrelated Product, POS, accounting, Gold Center, supplier, or client-screen refactor is justified by this design.

## 16. Migration Design

Under the recommended design, **no database schema migration is required**.

Future implementation/provisioning sequencing:

1. Implement and test source category/validation changes in an approved implementation batch.
2. Apply canonical Certificate Authority normalization only through a reviewed, idempotent reference-data operation; no row rewrite if historical references exist.
3. Provision new Diamond and Position/Setting categories in a separately approved reference-data batch.
4. Keep Gem Treatment values unprovisioned until its canonical list is explicitly defined.
5. Implement loose `00` derivation without touching existing barcode or sequence rows.

If a future implementation discovers a required enum, foreign key, or subtype policy table, stop and open a new design decision; do not create a migration under this R1 control.

## 17. Provisioning Delta

Future approved provisioning delta, excluding the intentionally undefined Gem Treatment list:

| Category | Values | Approximate new rows |
|---|---|---:|
| `CERTIFICATE_AUTHORITY` | Diamond canonical union, including `Gübelin`, DCLA, IIDGR | 16 |
| `DIAMOND_TONE` | Full Diamond list | 14 |
| `DIAMOND_TONE_LEVEL` | Full Diamond list | 9 |
| `DIAMOND_SATURATION` | Full Diamond list | 10 |
| `DIAMOND_POSITION` | Full Diamond list | 7 |
| `DIAMOND_SETTING` | Full Diamond list | 47 |
| `GEMSTONE_POSITION` | Full Gem list | 7 |
| `GEMSTONE_SETTING` | Full Gem list | 47 |
| `GEMSTONE_TREATMENT` | Not defined by reference | 0 |
| **Total provisional delta** |  | **157** |

This is a design estimate only. No rows were inserted by R1.

## 18. Existing Data Preservation Plan

- Do not delete, rename, or rewrite any existing `profile_master_data` row.
- Treat `Gubelin` as a legacy alias only if it exists in future data; use `Gübelin` for new canonical rows and display.
- Preserve Asset master-data snapshots and audit history immutably.
- Do not rewrite existing Barcode, Barcode History, Asset, or Sequence rows.
- Do not reinterpret an existing Jewellery barcode as a loose barcode.
- New loose assets and replacements derive `00`; reprints preserve the existing identity.
- Keep existing generic Gemstone Tone/Tone Level/Saturation values for Gem profiles; new Diamond categories are profile-scoped.
- Never infer a Gem Treatment value from Diamond Treatment or general jewellery practice.

## 19. Focused Test Plan

Tests must be added/run only in a separately approved implementation batch; none were run by this design control.

| Area | Required assertions |
|---|---|
| Certificate normalization | `Gubelin` input resolves to canonical `Gübelin`; canonical display/storage; no historical snapshot rewrite |
| Diamond registries | Exact 14/9/10/7/47 values; optionality; `Other` descriptions; profile scoping |
| Gem registries | Exact 7/47 values; optionality; multiple settings; `Other` description; audit contract |
| Gem Treatment | Field may resolve only to an active DB-backed value once a list exists; arbitrary unapproved text rejected; no invented defaults |
| Loose barcode | Three exact loose profiles always produce `00`; conflicting karat rejected; no frontend bypass |
| Jewellery barcode | Existing explicit karat behavior remains unchanged for Diamond/Gem/Pearl Jewellery and Gold profiles |
| Barcode lifecycle | Reprint same identity; replacement retires old and issues non-reused new identity; loose replacement remains `00` |
| Scope/security | Company/branch scoping, permissions, server profile authority, and audit events remain enforced |
| Existing data | Historical Assets, snapshots, barcodes, and master-data references remain unchanged |

## 20. Runtime Proof Plan

No runtime mutation or browser mutation was run in R1. A future approved implementation batch must use the project’s approved disposable/owner-authorized target, not `darfus_erp`.

Minimum read-only/static and controlled runtime proof:

1. Resolve exact `current_database()` before any mutation proof.
2. Prove official DB remains read-only for the implementation rehearsal.
3. Receive one loose Diamond, one loose Gem, and one loose Pearl in a disposable target.
4. Verify `DDLOS00`, `GSLOS00`, and `PLLOS00` shape, one Asset per piece, one active Barcode per Asset, movement, origin, cost, payable, and balanced journal.
5. Verify Jewellery with explicit karat remains unchanged.
6. Verify POS/search and direct server calls cannot use a Product quantity fallback for final profiles.
7. Verify idempotent replay, conflicting replay, barcode collision/replacement, and history preservation.
8. Reconcile all before/after row counts and confirm no official DB writes.

## 21. Fresh Backup Requirement

Before any future R2 implementation/provisioning or controlled mutation proof, obtain a fresh verified backup of the exact current official baseline. The existing Phase 02 backup remains evidence:

`backups/official/darfus_erp_FULL_20260818_000425.dump`  
SHA-256: `7BDC254D6D9512A32D13B0909CCFDDD700907DBB380332974AF4117BB31860E3`  
Format: PostgreSQL custom archive; `pg_restore -l` previously passed.

This R1 control did not create another backup, as prohibited by the current read-only scope.

## 22. Out-of-Scope Confirmation

The following were not investigated as implementation targets and were not changed:

- Any gap outside GAP-01 through GAP-10.
- Supplier, Location, Settings, VAT, Accounting, Payment, POS, Customer, or transaction provisioning.
- Diamond, Gem, or Pearl profile implementation screens.
- Gold By Weight or Gold By Piece business formulas.
- Barcode replacement/status schema changes.
- Migration creation or execution.
- Official DB rollback, cleanup, seed, backup, or restore.
- Build, deployment, runtime restart, or frontend generated-file repair.

## 23. Files Changed

Only this report was created by the current control:

- `docs/DARFUS_PHASE_03A_R1_REFERENCE_SCHEMA_GAP_CLOSURE_DESIGN_REPORT.md`

No product source, test, migration, configuration, `.env`, secret, database row, or Git history was changed. Existing worktree changes and the Owner-accepted `next-env.d.ts` drift are pre-existing and were preserved.

## 24. DB Mutation Proof

Read-only proof executed:

```text
SELECT current_database(), current_user, version()
=> darfus_erp / postgres / PostgreSQL 16.15
```

The count queries in Section 3 were SELECT-only. No INSERT, UPDATE, DELETE, TRUNCATE, DDL, migration, seed, backup, or restore command was executed by R1.

```text
OFFICIAL_DB_WRITES_THIS_CONTROL = 0
```

The prior Phase 03A reference provisioning write accounting is retained in Section 4 and is not misreported as zero total historical writes.

## 25. Git Safety Proof

Before report creation, read-only Git inspection returned:

```text
CURRENT_HEAD = 1657b0e9ba580faef69be48f04637835c201b521
PRE_EXISTING_TRACKED_OR_STAGED_ENTRIES = 86
PRE_EXISTING_UNTRACKED_ENTRIES = 240
PRE_EXISTING_NEXT_ENV_D_TS_DRIFT = M next-env.d.ts
```

The repository had pre-existing dirty worktree state. No reset, restore, clean, stash, checkout, add, commit, push, or global safe-directory configuration change was run. The report itself is the only intended new artifact from this control.

## 26. Gate

### Gate decision

`PASS_PHASE_03A_R1_REFERENCE_SCHEMA_GAP_CLOSURE_DESIGN_READY`

Basis:

- All ten approved gaps have an evidence-backed current-state diagnosis.
- Certificate spelling is resolved from the final authority and raw Diamond reference.
- Diamond Tone/Tone Level/Saturation values and rules are complete.
- Diamond/Gem Position/Setting columns are proven to exist; no schema invention is required.
- Gem Treatment field authority is proven, while the missing canonical list is explicitly left unguessed.
- Loose `KT=00` root cause and minimum-safe Option A are defined.
- Preservation, migration, provisioning, test, runtime, and backup plans are documented.
- No R1 mutation occurred.

This gate permits Owner review of the design only. It does not authorize R2 implementation, migration, provisioning, or production mutation.

## 27. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-R1-REFERENCE-SCHEMA-GAP-CLOSURE-DESIGN
PHASE = 03A-R1
PHASE_NAME = REFERENCE_SCHEMA_GAP_CLOSURE_DESIGN
MODE = READ_ONLY_DESIGN_ONLY
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_TRANSACTIONAL_BUSINESS_WRITES_BEFORE_CONTROL = 0
OFFICIAL_DB_REFERENCE_PROVISIONING_WRITES_BEFORE_CONTROL = 566
OFFICIAL_DB_AUDIT_WRITES_FROM_PHASE_03A = 2
OFFICIAL_DB_WRITES_THIS_CONTROL = 0
CERTIFICATE_AUTHORITY_CANONICAL = Gübelin
DIAMOND_TONE_AUTHORITY = COMPLETE
DIAMOND_TONE_LEVEL_AUTHORITY = COMPLETE
DIAMOND_SATURATION_AUTHORITY = COMPLETE
DIAMOND_POSITION_AUTHORITY = COMPLETE
DIAMOND_SETTING_AUTHORITY = COMPLETE
GEM_POSITION_AUTHORITY = COMPLETE
GEM_SETTING_AUTHORITY = COMPLETE
GEM_TREATMENT_FIELD_AUTHORITY = COMPLETE
GEM_TREATMENT_CANONICAL_LIST = NOT_DEFINED_BY_REFERENCE
LOOSE_PROFILE_KT_SEGMENT = 00
LOOSE_KT_00_ROOT_CAUSE = INVENTORY_CODE_SCOPED_KARAT_CONFIG_WITHOUT_SUBTYPE_DERIVATION
LOOSE_KT_00_MINIMUM_SAFE_SOLUTION = OPTION_A_SERVER_DERIVATION_AT_CANONICAL_BARCODE_BOUNDARY
SCHEMA_CHANGE_REQUIRED = NO_FOR_RECOMMENDED_OPTION_A; YES_ONLY_FOR_OPTION_B
SOURCE_CHANGE_REQUIRED = YES_BARCODE_DERIVATION_AND_MASTER_CATEGORY_REGISTRY
MIGRATION_REQUIRED = NO_FOR_RECOMMENDED_OPTION_A; FUTURE_DATA_MIGRATION_ONLY_FOR_CERT_ALIAS_IF_APPROVED
FRESH_BACKUP_REQUIRED_BEFORE_03A_R2 = YES
INVENTED_BUSINESS_VALUES = 0
SOURCE_BUSINESS_CODE_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED = 0
BUILD_RUN = NO
SUPPLIER_WRITES = 0
LOCATION_WRITES = 0
TAX_SETTINGS_WRITES = 0
ASSET_WRITES = 0
PURCHASE_ORDER_WRITES = 0
MOVEMENT_WRITES = 0
PAYMENT_WRITES = 0
JOURNAL_WRITES = 0
DIAMOND_IMPLEMENTATION = NOT_STARTED
GEM_IMPLEMENTATION = NOT_STARTED
PEARL_IMPLEMENTATION = NOT_STARTED
GATE = PASS_PHASE_03A_R1_REFERENCE_SCHEMA_GAP_CLOSURE_DESIGN_READY
NEXT_RECOMMENDED_STEP = FRESH_BACKUP_THEN_PHASE_03A_R2_MINIMUM_SAFE_SCHEMA_SOURCE_CONVERGENCE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**END — OWNER REVIEW REQUIRED. No automatic start.**
