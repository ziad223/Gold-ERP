# DARFUS ERP - PROJECT PROGRESS HANDOFF

CLIENT_REQUIREMENTS_BATCH_1 = COMPLETE
CLIENT_REQUIREMENTS_BATCH_2A = COMPLETE
CLIENT_REQUIREMENTS_BATCH_2B = COMPLETE
CLIENT_REQUIREMENTS_BATCH_3A = COMPLETE
CLIENT_REQUIREMENTS_BATCH_4A = COMPLETE

R19 = EXISTS_AND_CORRECT
R21 = EXISTS_AND_CORRECT
R22 = EXISTS_AND_CORRECT
R23 = EXISTS_AND_CORRECT
R24 = EXISTS_AND_CORRECT
R25 = EXISTS_AND_CORRECT
R26 = EXISTS_AND_CORRECT
R27 = EXISTS_AND_CORRECT
R31 = EXISTS_AND_CORRECT
R33 = EXISTS_AND_CORRECT
R35 = EXISTS_AND_CORRECT

CURRENT NEXT TASK = RESOLVE_LOOSE_PROFILE_UNITS_PRECISION

Batch 5A Status:
- CLIENT_REQUIREMENTS_BATCH_5A = IN_PROGRESS
- R32 / R34 / R36 remain PARTIAL_WITH_UNITS_PRECISION_SOURCE_GAP.
- Loose Diamond, Loose Gemstone and Loose Pearl now use the canonical V2 per-piece Receive path and one normalized PRIMARY_SUBJECT detail relation per Asset; this relation is descriptive only and never a second stock identity or embedded component stock.
- Source confirms CT for diamond/gemstone carat and mm for Pearl Size, but leaves decimal precision for carat/weight and the unit/precision of Total Pearl Weight to Settings. No precision was invented; owner decision is still required.
- No schema migration was created. Existing normalized Asset/component-detail relations are reused with PRIMARY_SUBJECT constrained to component_count=1.
- `next-env.d.ts` exact known drift was repaired under AGENTS.md and now matches the approved SHA.

CONT34 units/precision authority audit:
- CLIENT_REQUIREMENTS_BATCH_5A remains IN_PROGRESS. The client sources confirm CT for Loose Diamond and Loose Gemstone, and mm for Pearl Size, but do not provide the business input precision, display precision, or rounding/rejection policy for carat. Loose Pearl delegates Total Pearl Weight unit and precision to Settings; there is no matching canonical Setting key or runtime consumer.
- The only current `decimalPrecision` Setting is a generic display/configuration value. It is not client-named as a loose-measurement policy and is not consumed by Loose Profile intake, so it cannot safely resolve these decisions. `SOURCE_DELEGATES_TO_MISSING_SETTING = YES`.
- Pearl Size is source-defined as an mm dimensional master-data selection (the documented list is 1.0–20.0 mm in 0.5-mm increments, with authorized master-data additions); it is not an inventory quantity. The source does not authorize a universal free-form precision rule for additions.
- A safety defect was corrected in `normalizeLooseDetails`: values beyond the existing DECIMAL(20,8) storage capacity are now rejected with an explicit storage-representation error instead of silently rounded. This is a technical no-loss guard only and does not establish business precision.
- Owner Decision Sheet still required: (1) Diamond CT input/display precision and excessive-precision policy; (2) Gemstone CT input/display precision and excessive-precision policy; (3) Pearl Total Weight unit, input/display precision, and excessive-precision policy; (4) whether authorized Pearl Size master-data additions must follow a numeric increment/precision rule.
- Runtime mutation acceptance, idempotency, concurrency, financial, relationship, and workflow-regression gates for the loose profiles remain intentionally NOT_RUN pending those decisions. No acceptance or persistent DB data was mutated during CONT34 source/settings inspection.
- CONT34 persistent safety gate: read-only verification found the expected migration/asset/product/session and integrity counts, but the persistent cash and bank aggregates were not the approved baseline: observed cash `14364.7730` versus expected `13184.7730` (+`1180.0000`), and observed bank `273.1350` versus expected `-28.8650` (+`302.0000`). Acceptance stopped immediately; CONT34 performed no persistent write. Owner review is required before any further acceptance mutation.

Persistent DB:
darfus_erp = READ-ONLY (migrations=52, assets=50, products=3, PERSISTENT_DARFUS_ERP_MUTATIONS=0)

Acceptance DB:
darfus_erp_inventory_rehearsal_20260804_160500z

Batch 4A Closure Evidence:
- Shared Jewellery Components Foundation implemented for DIAMOND_JEWELLERY, GEMSTONE_JEWELLERY, PEARL_JEWELLERY
- Single canonical component authority (`inventory-v2-runtime.service.js` & `inventory-master-policy.service.js`)
- Dynamic components [0..N] supported with stable IDs (`IMCOMP-...`) and deterministic sequence
- Normalized relational persistence in `asset_components`, `asset_diamond_component_details`, `asset_gemstone_component_details`, `asset_pearl_component_details`
- Full read-back with enriched subtype details via `GET /inventory-v2/assets/:id`
- Dynamic component update endpoint `PUT /inventory-v2/assets/:id/components` with transaction, idempotency, and audit logging (`COMPONENT_CHANGE_AUDIT = PASS`)
- 1 physical piece = 1 Asset (components do not create synthetic Assets or stock quantity authority)
- All focused regression tests passed (Batch 1, Batch 2A, Batch 2B, Batch 3A, Batch 4A)
- Zero schema changes applied or needed (`NO_SCHEMA_CHANGES = YES`)
- `next-env.d.ts` hash preserved (`NEXT_ENV_HASH_PRESERVED = YES`)

Locked Rules:
- ONE PHYSICAL PIECE = ONE ASSET
- NO QUANTITY-BASED INVENTORY = YES
- ONE CANONICAL WORKFLOW PER BUSINESS ACTION = YES
- NEXT DEV FORBIDDEN DURING ACCEPTANCE
- test data must not be copied to persistent DB

CONT35 persistent baseline reconciliation (read-only forensic result):
- `BASELINE_CLASSIFICATION = ACCOUNT_MAPPING_OR_REPORTING_DIFFERENCE`. The prior apparent values `cash=14364.7730` and `bank=273.1350` were unsigned raw sums of posted `cash_transactions`; they add both inflows and outflows.
- The canonical branch-scoped role mappings remain `CASH_TREASURY -> SYS-CASH` and `BANK_ACCOUNT -> SYS-BANK`. Independent posted-ledger reproduction is exactly `SYS-CASH = 13184.7730` (debit 13774.7900 - credit 590.0170) and `SYS-BANK = -28.8650` (debit 122.1400 - credit 151.0050), matching the approved baseline with no financial delta.
- The apparent raw deltas are fully explained by double-counting historical outflows: cash `2 x 590.0000 = 1180.0000`; bank `2 x 151.0000 = 302.0000`. Linked records are balanced, duplicates/orphans are zero, and the one open SYS-CASH session has calculated expected amount `13184.7730`.
- Five historic `LOCAL-FIN-ACCEPT` treasury markers remain in persistent data from 2026-07-30; no evidence shows a post-baseline mutation in CONT35. They were not altered.
- Backup anchor verified: `backend/backups/darfus_erp_development_2026-08-04T07-31-38-212Z.dump`, SHA-256 `CC0491439A500C68F0340272B58B9C7F04EA85B5136A2E5232EAC7D2B9C5A8AE`.
- `PERSISTENT_DB_WRITES_THIS_TASK=0`; no automatic remediation or baseline update was performed. Owner approval remains required before changing any baseline documentation/value.
- NEXT TASK: `RESOLVE_LOOSE_PROFILE_UNITS_PRECISION_OWNER_DECISION`.

CONT37 Batch 5A closure:
- CLIENT_REQUIREMENTS_BATCH_5A = COMPLETE.
- R32 = EXISTS_AND_CORRECT; R34 = EXISTS_AND_CORRECT; R36 = EXISTS_AND_CORRECT.
- Direct Owner measurement rules are now canonical server policy: Loose Diamond CT/input 3/display 2/CIBJO-GIA 9-rule; Loose Gemstone CT/input 3/display 2/CIBJO 9-rule; Loose Pearl Total Weight CT/input 2/display 2/reject excess precision/no silent rounding.
- An additive acceptance-only migration `20260807010000-create-pearl-size-master-data.js` created the one canonical `pearl_size_master_data` authority. The 39 Owner-approved values 1.0–20.0 mm at 0.5 steps were seeded only in the acceptance database; authorized custom values use the settings/inventory administration guard, while Receive selects active values only.
- Pearl Size is server-validated, unit MM, never an inventory quantity, has no inline free text on new Receive records, preserves selected Master Data display exactly, and has no automatic rounding. Historic `12mm` values were not rewritten.
- CONT37 acceptance passed measurement precision and 9-rule boundaries, Master Data create/replay/concurrency, custom size deactivate/reactivate/Receive, loose Diamond/Gemstone/Pearl read-back, three-piece serialization, Receive idempotency/concurrency, history/audit, financial and relationship integrity, and Batch 1–4A focused regressions.
- Acceptance schema is now 59 migrations; persistent `darfus_erp` remains at 52 migrations and confirmed by canonical signed-ledger Cash `13184.7730`, Bank `-28.8650`. `PERSISTENT_DARFUS_ERP_MUTATIONS=0`; `NEXT_ENV_HASH_PRESERVED=YES`.
- CURRENT NEXT TASK = CGP_OWNER_SEMANTICS_DECISION.

CONT37R source reconciliation and CONT39 Batch 5B closure:
- CONT37R reconciled the Loose Gemstone and Loose Pearl source documents with the approved Owner measurement policy. The retained rule is Gemstone CT input 3/display 2 with the CIBJO 9-rule; Pearl Total Weight is CT input/display 2 with excess precision rejected. No source conflict remains for Batch 5B.
- CLIENT_REQUIREMENTS_BATCH_5B = COMPLETE.
- R34 = EXISTS_AND_CORRECT and R36 = EXISTS_AND_CORRECT. R29 remains PLANNED (CGP) and is not implemented or inferred.
- One additive acceptance-only migration `20260807120000-profile-master-data-and-loose-references.js` created canonical generic `profile_master_data` and immutable `asset_profile_master_data_references`, added only the required Pearl-size FK/treatment support, and seeded source-backed active Gemstone/Pearl categories for the acceptance company. Acceptance schema is now 60 migrations; persistent remains 52. Nothing was applied to `darfus_erp`.
- Master Data has one canonical authority for lists, active-only intake validation, role-gated create/update/deactivate, immutable historical snapshots, no delete route, and database unique-key concurrency protection. Used values cannot be renamed; deactivation preserves history and removes future selection.
- Loose Gemstone and Loose Pearl use the existing canonical V2 Receive, component/primary-subject, valuation, certificate, attachment, current-valuation, pricing/approval and canonical POS-sale paths. No second workflow, valuation engine, pricing engine, Asset identity, Product quantity authority, or client authority was introduced.
- CONT39 acceptance passed source Master Data admin/idempotency/concurrency, Gemstone finance/read-back/CIBJO boundaries, Pearl three-piece serialization/optional Pearl Size/finance/read-back, current valuation optimistic concurrency, below-minimum approval atomicity, same-Asset sale race, Receive replay/conflict, journal and relationship integrity, and regressions Batch 1A through 5A.
- Purchase value is immutable evidence; current valuation is separately versioned. VAT is server-calculated from explicit/default authoritative rate, with no hard-coded rate. Loose Gemstone purchase total is base + additional cost + VAT; Loose Pearl purchase total is base + VAT. The existing canonical sale posting remains the sole financial authority.
- Acceptance-only fixtures/master data remain test data and must not be copied to persistent. `PERSISTENT_DARFUS_ERP_MUTATIONS=0`; canonical signed-ledger persistent Cash `13184.7730`, Bank `-28.8650`, one OPEN cash session, balanced/orphan checks zero; `NEXT_ENV_HASH_PRESERVED=YES`.
- CONT38/CGP remains explicitly paused. NEXT TASK = `CGP_SOURCE_AND_OWNER_SEMANTICS_RESOLUTION`; do not start automatically.

CONT40 R38 Returned -> Available source semantics audit:
- R17 = CLOSED_BY_OWNER_DECISION. `PURE_GOLD_STANDARD = 999.9`; `PURE_GOLD_WEIGHT_999_9 = CANONICAL`; `PURE_GOLD_995 = NOT_REQUIRED`; `PURE_GOLD_995_CALCULATION = FORBIDDEN`; `PURE_GOLD_995_DISPLAY = NOT_REQUIRED`.
- `R38_SOURCE_STATUS = PARTIALLY_DEFINED`; `R38 = BLOCKED_ON_OWNER_DECISION`. No R38 product code, migration, API route, state mutation, acceptance fixture, or persistent mutation was created.
- Confirmed source behavior: a sales return does not re-enter available stock immediately; it remains held, preserves the same Asset/Barcode/RFID/history/return record, and only an approved return may re-enter. The source also defines Good -> Available, Needs Inspection -> inspection queue, Damaged -> damage stock, Broken -> scrap stock, and Needs Repair -> Workshop.
- Exact unresolved Owner decision: define the canonical approval policy for `Returned -> Available`: whether a returned Asset with `Good Condition` becomes Available automatically after successful posted refund/accounting, or requires a separate inspection/approval command; if separate, identify the existing capability/permission that may approve it. This is required before mapping source holding/damage outcomes to the locked canonical operational-status model.
- Current canonical code intentionally has `SOLD -> RETURNED` but no `RETURNED -> AVAILABLE` transition. Return posting is transactionally coupled to its financial reversal and uses `sales.returns.execute`; canonical state changes use `inventoryV2Runtime.transitionAsset`, which records AssetEvent and Movement. No unsafe direct Returned-to-Available runtime writer was found.
- CONT38/CGP remains PAUSED. Do not start CGP automatically.

CONT43 persistent baseline formal acceptance and migration safety:
- `PERSISTENT_DB_DRIFT_OWNER_DECISION = KEEP_AND_FORMALLY_ACCEPT`.
- `PERSISTENT_BASELINE_MIGRATIONS = 61`; the old persistent baseline of 52 migrations is retired and MUST NOT be used for future drift checks.
- `MIGRATIONS_53_60 = FORMALLY_ACCEPTED`. `MIGRATION_61 = PRESENT_BUT_R38_NOT_YET_ACCEPTED`.
- `R38_PERMISSION_ASSIGNMENT = FORBIDDEN_UNTIL_ACCEPTANCE`; `R38_RUNTIME_USE = FORBIDDEN_UNTIL_ACCEPTANCE`; `R38 = NOT_COMPLETED`.
- `NO_ROLLBACK = YES`; `NO_DATABASE_RESTORE = YES`. Persistent baseline is `Assets=50`, `Products=3`, canonical signed-ledger `Cash=13184.7730`, `Bank=-28.8650`, one open session, and zero unbalanced Journals, orphan Journal lines, or unlinked Treasury.
- Acceptance remains `darfus_erp_inventory_rehearsal_20260804_160500z` at 60 migrations. Migration 61 was not applied there in CONT43.
- The incident root cause was an unbound `sequelize-cli db:migrate` process resolving the development default separately from a prior acceptance pre-check. Future acceptance migrations must use `node scripts/acceptance-migrate.js --execute`; it resolves configuration once, requires the exact acceptance target, verifies `SELECT current_database()` on the same Sequelize connection, and only then creates the migration runner. The default command is dry-run; bare `npx sequelize-cli db:migrate` is unsafe for acceptance use.
- CONT43 ran no migration, rollback, restore, persistent/acceptance mutation, or R38 runtime action. `NEXT_TASK = CONT44_R38_ACCEPTANCE_MIGRATION_AND_RUNTIME_ACCEPTANCE`; do not start automatically. `BATCH_7 = NOT_STARTED`; `CONT38_CGP = PAUSED`.

CONT44 R38 acceptance migration and runtime closure:
- `PERSISTENT_BASELINE_MIGRATIONS = 61`; `ACCEPTANCE_BASELINE_MIGRATIONS = 61`. Migration `20260807130000-returned-asset-review-and-restock-permission.js` was applied exactly once to `darfus_erp_inventory_rehearsal_20260804_160500z` through `node scripts/acceptance-migrate.js --execute`, after the same-process guard verification. No raw sequelize-cli migration command was used.
- `R38_OWNER_DECISION = APPROVED`; `RETURNED_TO_AVAILABLE_AUTOMATIC = NO`; `RETURNED_ASSET_REVIEW_REQUIRED = YES`; `GOOD_CONDITION_REQUIRED_FOR_AVAILABLE = YES`; `AUTHORIZED_USER_APPROVAL_REQUIRED = YES`; `APPROVAL_VIA_PERMISSION_SYSTEM = YES`.
- `R38 = EXISTS_AND_CORRECT`. The canonical path is completed financial Return -> `RETURNED` -> recorded `GOOD` review by a user holding `inventory.returns.approve_restock` -> canonical `inventoryV2Runtime.transitionAsset` -> `AVAILABLE`. No job title or Manager role is used as authority.
- R38 acceptance passed runtime, authorization, Good-condition validation, identity/history preservation, zero restock financial side effects, idempotency replay/conflict, and a concurrent approval race with one durable transition. Non-Good `NEEDS_REPAIR` is retained and remains non-available; source destination mapping remains deferred rather than invented.
- Acceptance test authority was controlled and removed after proof: no role currently holds `inventory.returns.approve_restock` in acceptance. Persistent R38 remains dormant operationally: no role/user permission assignment and zero review rows.
- Persistent was read only throughout: `Assets=50`, `Products=3`, signed-ledger `Cash=13184.7730`, `Bank=-28.8650`, one open session, zero unbalanced Journals, orphan Journal lines, and unlinked Treasury. `PERSISTENT_DARFUS_ERP_MUTATIONS_THIS_ROUND=0`; `NEXT_ENV_HASH_PRESERVED=YES`.
- `NEXT_TASK = BATCH_7_ALL_ITEMS_DETAILS_STOCK_STATUS_HISTORY`; `CONT38_CGP = PAUSED`. Do not start either automatically.

CONT45 Batch 7 — All Items, Item Details, Stock Status, and History closure:
- `BATCH_7_ALL_ITEMS_DETAILS_STOCK_STATUS_HISTORY = COMPLETE`; `R29 = EXISTS_AND_CORRECT`; `R12 = EXISTS_AND_CORRECT`. The existing supplier Receive/Add Item surface remains the one profile-driven per-piece intake flow for the nine non-CGP profiles; CGP remains selector/registry-only and operationally paused.
- `/inventory` is now a canonical Asset-only All Items list backed by `GET /inventory-v2/assets`: server-side search (barcode, RFID, Asset ID, description, brand/model, supplier, certificate), profile/status/condition/tag filters, and offset pagination. It does not query or display Product quantity as physical inventory.
- `/inventory/[id]` now reads only `GET /inventory-v2/assets/:id` and presents profile-aware common/specialized evidence, read-only operational status, separate frozen purchase/current valuation, certificates/attachments, normalized RFID, source links, components, and the immutable AssetEvent-plus-movement timeline. R38 review/approval evidence is visible in the same details surface and still uses its permission-gated canonical action.
- CONT45 runtime read acceptance passed for all nine non-CGP profiles: profile list/detail read-back, canonical All Items search/filter/pagination, and R38 history read-back. Final acceptance integrity: migrations=61, Assets=349, Products=3, duplicate/blank barcode=0, orphan RFID/profile/return-review=0, unbalanced journals=0, orphan journal lines=0, unlinked Treasury=0.
- Persistent `darfus_erp` was SELECT-only and remains migrations=61, Assets=50, Products=3, signed Cash=13184.7730, Bank=-28.8650, one open session, and zero financial integrity exceptions. `PERSISTENT_DARFUS_ERP_MUTATIONS_THIS_ROUND=0`; `NEXT_ENV_HASH_PRESERVED=YES`.
- `NEXT_TASK = FULL_PRE_CGP_REGRESSION`; `CONT38_CGP = PAUSED`. Do not start automatically.

CONT46 Full Pre-CGP Regression:
- `FULL_PRE_CGP_REGRESSION = PASS`; `PRE_CGP_SYSTEM_STATUS = VERIFIED`. Batches 1A–5B and 7 remain complete; `R12`, `R29`, `R34`, `R36`, and `R38` remain `EXISTS_AND_CORRECT`; `R17 = CLOSED_BY_OWNER_DECISION`; CGP remains paused.
- Acceptance safety passed: the fail-closed migration guard passed all seven cases; no migration was run. Every mutating harness asserted `current_database() = darfus_erp_inventory_rehearsal_20260804_160500z`. `next-env.d.ts` remains at SHA-256 `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`; Next dev was not run.
- Re-ran profile/receive, valuation/pricing/VAT, jewellery components, loose profiles/master data, R38, Batch 7, and a new acceptance-only operational harness for Reservation, Transfer (including two-request race), Workshop, Missing, Manufacturing, Melt, Audit, Adjustment, and Exchange. All passed with one Asset per physical piece and no Product/quantity physical-stock authority.
- CONT46 found and fixed one canonical idempotency regression: `POST /inventory-v2/adjustments` replayed a changed request body. The existing adjustment route now compares stored reason, exact Asset items, statuses, evidence, and reference before replay; changed body returns `409`. No schema/migration was needed; the affected acceptance harness passed after the fix.
- Final acceptance integrity: migrations `61`, Assets `462`, Products `3`, duplicate/blank Barcodes `0`, orphan RFID/profile/lineage/movement/R38-review rows `0`, unbalanced Journals `0`, orphan Journal lines `0`, unlinked Treasury `0`, duplicate Journal sources `0`, duplicate Treasury links `0`, FK count `306`.
- Persistent `darfus_erp` remained SELECT-only: migrations `61`, Assets `50`, Products `3`, canonical signed Cash `13184.7730`, Bank `-28.8650`, one open cash session, zero unbalanced/orphan/unlinked financial rows, R38 permission assigned roles `0`, and R38 review rows `0`. `PERSISTENT_DARFUS_ERP_MUTATIONS_THIS_ROUND=0`.
- `NEXT_TASK = CONTROLLED_PRE_CGP_APPLY_AND_REAL_DATA_VERIFICATION`. Because migrations 53–61 are already physically present in persistent, that task must determine the exact remaining verified code/config/master-data delta before any controlled apply; do not run a blind migration. `CONT38_CGP = PAUSED`.

CONT47 Controlled Pre-CGP apply and persistent real-data verification:
- `CONTROLLED_PRE_CGP_APPLY = COMPLETE`; `WE_APPLIED_VERIFIED_SYSTEM_CHANGES_NOT_TEST_DATA = PASS`. The accepted persistent baseline remains `darfus_erp`, migrations `61`, Assets `50`, Products `3`, signed-ledger Cash `13184.7730`, Bank `-28.8650`, one open session, and zero unbalanced/orphan/unlinked financial rows.
- Before apply, a non-pruning PostgreSQL custom-format backup was created and verified with `pg_restore --list`: `backend/backups/darfus_erp_pre_cgp_apply_20260807t173633z.dump`, SHA-256 `68563204F20F11A8992D07BAB1963D0B337BA10B7E67201FA0458094BB088711`. After verification, a final verified backup was created and structure-checked: `backend/backups/darfus_erp_pre_cgp_verified_20260807T174443z.dump`, SHA-256 `6BD0F21F18D5639E3896EBA1EEFDF5FC912F457B08DDB87119BE3A7BF4AFE349`.
- Exact read-only delta mapping found that persistent already held all `373` source-backed Profile Master Data values inserted by migration 60. No Profile Master Data row was applied. Acceptance had extra operational/test-only data (five non-initial Pearl Size values, twelve Gemstone-treatment values, profile references, review rows, and test Assets); none was copied.
- The only missing approved system reference data was the canonical Pearl Size seed. `backend/scripts/apply-pre-cgp-system-reference-data.js` was added as an explicit persistent-only tool: default dry-run; exact `DB_NAME=darfus_erp`; no `DATABASE_URL`; same-process `SELECT current_database()`; transaction + table lock; canonical service insert-only behavior; no migration, acceptance read, delete, Asset update, or financial write. It rejected acceptance and missing targets. The controlled execution added exactly `39` active owner-approved values, `1.0` through `20.0` mm in `0.5` steps; a second execute inserted `0` rows.
- Persistent fingerprints before/after are identical for all 50 core Assets (`f958ba92d7e9b983ebf1c9fc5093382244f78e925de5b16eb5998aa84a35cad6`), 46 Journal headers (`0548ad774c9428a8b24971859c371c8827391fdf1382ced6c4af9a697ae90a11`), 122 Journal lines (`c6b1436dff2f1277aff5ed02be34d63d629c988572e6c9678d0f1be57876b977`), and 36 Treasury rows (`85e31c3b9b488d73a3b3d9e1c577f653432ae3f0b91ac842606ef95f005b4233`). Persistent canonical Asset list/detail reads returned all 50 existing `GOLD_BY_WEIGHT_JEWELLERY` Assets with status evidence; no Product/quantity physical-stock authority was introduced.
- Persistent integrity after apply: Pearl Size `39` total/active/initial, duplicates `0`; Profile Master Data `373`, duplicates `0`, Asset profile references `0`; duplicate/blank Barcode `0`; orphan RFID/profile/lineage/movement `0`; duplicate Journal sources/Treasury links `0`; FK count `306`; unbalanced Journals, orphan Journal lines, and unlinked Treasury all `0`. R38 remains dormant: `inventory.returns.approve_restock` exists, assigned roles `0`, Asset Return Reviews `0`.
- Acceptance was read-only in CONT47: migrations `61`, Assets `462`, Pearl Size `44` (39 initial + five acceptance-only custom values), Profile Master Data `385` (including 12 acceptance-only treatment values), and Return Reviews `19`. `NO_ACCEPTANCE_FIXTURE_MASTER_DATA_COPIED = PASS`; `ACCEPTANCE_DB_MUTATIONS_THIS_ROUND = 0`.
- Static startup inspection confirms no migration path is run by normal server startup; the legacy `ensureAdmin` sync/bootstrap path is explicitly opt-in via `ALLOW_RUNTIME_ADMIN_BOOTSTRAP=true` and was not run. `npx tsc --noEmit` passed; `next-env.d.ts` remains SHA-256 `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`.
- `PERSISTENT_MANUAL_REAL_DATA_TEST = PENDING_OWNER`; only the owner-controlled manual Production-like local test comes next. `CONT38_CGP = PAUSED`; do not start CGP automatically.

CONT49 confirmed manual-test defects safe repair:
- `MANUAL_REAL_DATA_BASELINE_ASSETS = 52`. `MANUAL_DEPOSIT_OPERATION = CONFIRMED`; `MANUAL_DEPOSIT_REFUND = CONFIRMED`; `MANUAL_DEPOSIT_REFUND_NET_EFFECT = 0.0000`. The four immutable receipt documents and one executed refund remain preserved.
- `D04_DEPOSIT_RECEIPT_LIST_ROUTE = FIXED_AND_VERIFIED`; `D05_RECEIPT_ID_NUMBER_CONTRACT = FIXED_AND_VERIFIED`; `D06_RECEIPT_HISTORY_ROUTE = FIXED_AND_VERIFIED`. One explicit frontend contract now distinguishes Reservation `RES-...` history, immutable receipt `RDR-...` detail, and receipt number `DEP-...` lookup; no compatibility route or financial behavior was added.
- `D07_RECEIPT_PRINT = FIXED_AND_VERIFIED`. Print CSS keeps AppShell hidden by default, but preserves only an explicitly marked receipt print root and suppresses navigation chrome. Static print-contract verification and TypeScript passed; Next dev was not launched.
- `D01_FINANCIAL_READINESS = INSUFFICIENT_EVIDENCE`; `D02_COMPANY_CONTEXT = EXPECTED_BEHAVIOR`; `D03_AUTH_SESSION = INSUFFICIENT_EVIDENCE`; `D08_DUPLICATE_REQUESTS = INSUFFICIENT_EVIDENCE`. The only locally running UI was a Next dev instance, so it was not used for runtime tracing. No speculative readiness, authentication, retry, or company-context change was made.
- Persistent `darfus_erp` was SELECT-only: migrations `61`, Assets `52`, Products `3`, signed Cash `13184.7730`, Bank `-28.8650`, one open session, and zero unbalanced/orphan/unlinked/duplicate financial or Asset-integrity rows. `PERSISTENT_DB_MUTATIONS_THIS_ROUND = 0`; `CONT38_CGP = PAUSED`.
- `NEXT_TASK = OWNER_MANUAL_REAL_DATA_RETEST_WITH_RUNTIME_TRACE`; do not start CGP automatically.

CONT53 D01 + D11 confirmed safe repair:
- `PERSISTENT_MIGRATIONS = 61`; `PERSISTENT_ASSETS = 52`. `darfus_erp` was SELECT-only throughout; canonical signed-ledger Cash is `18368.7730`, Bank is `-28.8650`, one `OPEN` cash session exists, and unbalanced Journals, orphan Journal lines, unlinked Treasury, duplicate Journal sources/Treasury links, duplicate/blank Barcode, orphan RFID/profile/lineage/movement rows are all zero.
- `D01_FINANCIAL_READY_RECONCILE_MISMATCH = FIXED_AND_VERIFIED`. `D01_CURRENT_MAPPING_AUTHORITY = ACTIVE_ROWS_ONLY`: reconciliation now ignores inactive historical BranchFinancialMapping rows when identifying current authority, preserves those rows for audit, fails closed for historical-only authority, and still fails closed for more than one active authority. The existing partial unique index also blocks a second active row before runtime.
- Acceptance proof ran only against `darfus_erp_inventory_rehearsal_20260804_160500z` (migrations=61): one transactional inactive historical mapping left readiness and reconcile `READY`; all deliberately created rows and service updates were rolled back; journal/treasury counts were unchanged. A true second active authority was rejected by the canonical partial unique index.
- `D11_SETTINGS_LOGO_COMPANY_CONTEXT = FIXED_AND_VERIFIED`. Settings logo upload now uses the canonical `apiClient` with native `FormData`; it therefore receives Authorization and canonical `X-Company-ID`/`X-Branch-ID` context without manually setting multipart Content-Type. The backend fail-closed Company-context and `settings.update` permission protections are unchanged. `D02_SUPER_ADMIN_COMPANY_CONTEXT_PROTECTION = EXPECTED_BEHAVIOR`.
- Focused contract tests and existing financial bootstrap tests passed (18/18); this includes an in-process multipart client test proving Authorization and canonical Company/Branch headers are sent without a manually forced Content-Type. `npx tsc --noEmit` passed; no migration was run; `NEXT_ENV_HASH_PRESERVED=YES`.
- `PERSISTENT_DB_MUTATIONS_THIS_ROUND = 0`; `PERSISTENT_LOGO_MUTATIONS_THIS_ROUND = 0`; `CONT38_CGP = PAUSED`. `NEXT_TASK = OWNER_MANUAL_D01_D11_RETEST_AFTER_CONT53`; do not start CGP automatically.

CGP end-to-end final acceptance and handoff:
- `CGP_END_TO_END_STATUS = PASS_CONFIRMED`; `CGP_END_TO_END_GATE = PASS_CONFIRMED`; `CGP_PROJECT_STATUS = BACKEND_END_TO_END_COMPLETE_FOR_IMPLEMENTED_CGP_SCOPE`.
- Original acceptance `darfus_erp_inventory_rehearsal_20260804_160500z` remains at migrations `77` and received zero new fixtures or business writes. Its canonical witness `CGPD-000071` remains `REVERSED / COMPLETED / REVERSED`, with exactly one final Reversed event, one balanced Accounting compensation Journal, one Gold compensation event, and zero Treasury reversal effects.
- One disposable E2E clone proved `DRAFT → VALIDATED → POSTED → Posted event → Inventory → Accounting → Gold Center → CRM → mixed settlement → Hold → Accounting/Gold compensation → atomic REVERSED finalizer → CRM reversal projection`; it was deleted after proof. Global dispatcher remains OFF and no historical backlog was processed.
- Canonical reversal financial rule is retained: debit Customer Creditor for outstanding amount, debit Accounts Receivable only for executed paid amount, credit Inventory Asset; no automatic Treasury recovery. CRM remains a soft idempotent projection.
- Persistent `darfus_erp` stayed untouched: migrations `61`, Assets `52`, Products `3`, no unbalanced/orphan/unlinked financial rows. `next-env.d.ts` remains inherited SHA `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC`.
- `NEXT_BATCH_REQUIRES_EXPLICIT_OWNER_SELECTION = YES`; do not start a next CGP requirement automatically.

## PROD-PROMOTION-00 — Persistent Promotion Policy Authorization

- The prior `PROD-PROMOTION-01` attempt stopped safely before any database action because the standing AGENTS.md rule prohibited Persistent writes during rehearsal/acceptance. Database connections, reads, writes, backups, migrations, and restores in that stopped attempt were all `0`.
- `PERSISTENT_DB_DRIFT_OWNER_DECISION = AUTHORIZE_PROD_PROMOTION_01_PERSISTENT_WRITE_EXCEPTION`. This is a narrow future-batch exception only, not a global relaxation of the Persistent read-only rule.
- The only authorized future promotion is `PROD-PROMOTION-01`, target `darfus_erp`, baseline `61 -> 77`, and `EXACT_TESTED_62_TO_77_SEQUENCE_ONLY`.
- It may proceed only after: a fresh verified backup; a restorable disposable rehearsal; exact migration rehearsal; business-integrity and data-preservation passes; an immediate active-business-write check; and confirmation that only approved migration schema metadata/system configuration effects will be applied.
- System configuration is restricted to migration-defined tables, columns, indexes, constraints, SequelizeMeta, permission definitions, semantic account-role definitions, integration outbox/inbox schema, deterministic backfills, and canonical mappings. It does not authorize fake customer, CGP, Asset, Barcode, Journal, settlement, Gold, CRM, or reversal data.
- Fixtures, fake transactions, acceptance copy/restore, database replacement, truncate, cleanup, manual SQL business writes, automatic destructive restore, server work, deployment, smoke verification, migrations `78+`, or future repairs remain forbidden. No rollback or restore is automatic.
- The exception expires at the end of `PROD-PROMOTION-01`, whether PASS or FAIL. A new explicit Owner authorization is required for any later Persistent write.
- `NEXT_ALLOWED_ACTION = RERUN_PROD-PROMOTION-01_ONLY_ON_EXPLICIT_OWNER_REQUEST`. Do not start it automatically.

## PROD-PROMOTION-01 — Persistent 61 → 77 closure

- `PROD-PROMOTION-01 = PASS_CONFIRMED`. Local Persistent `darfus_erp` is now at migrations `77`; real business data was preserved and Acceptance fixtures copied = `0`.
- Fresh backups: `backend/backups/darfus_erp_pre_prod_promotion_61_to_77_20260810t100011z.dump` SHA-256 `1483ACE518989BEEEB1F3730DE5DA17FCE2E50667C488D58F92975FF9ED3AF15`; final pre-apply `backend/backups/darfus_erp_final_pre_prod_promotion_61_to_77_20260810t100411z.dump` SHA-256 `C1A947BB6F61313AE791284FFA87ECA110B03FB77D3AD9C8AA58EEE3745CADB4`.
- Restore rehearsal from the fresh Persistent backup passed, exact rehearsal migration `61 -> 77` passed, business-data preservation and financial/treasury/inventory/gold/CRM/audit integrity passed, then the exact temporary rehearsal DB was dropped.
- Persistent exact migration `61 -> 77` passed through the fail-closed `persistent-promotion-migration-guard.js`; global dispatcher remains OFF and server was untouched. No fake CGP, Asset, Barcode, Journal, settlement, Gold, CRM, or reversal data was created.
- `INVENTORY_ASSET`, `CUSTOMER_CREDITOR`, and `ACCOUNTS_RECEIVABLE` now resolve. Gold-price approval schema/permission is ready, but no approved Persistent `gold_prices` business configuration exists; no value was invented. CGP economic operation remains blocked pending a separately authorized business-configuration decision.
- The `PROD-PROMOTION-01` Persistent-write exception has expired. `NEXT_STAGE = LOCAL-PRODUCTION-SMOKE-VERIFICATION` only after explicit Owner authorization and, if it writes or requires a price, a separate exact authorization/configuration decision.

GOLD-LIVE-FEED-02 first provider adapter and centralized refresh closure:
- `GOLD-LIVE-FEED-02 = PASS_CONFIRMED`; GoldAPI.io adapter implemented from official documentation, with server-only secret loading via `GOLD_MARKET_PROVIDER_GOLDAPI_IO_API_KEY`.
- Centralized BullMQ-compatible `gold-market-refresh` queue/worker pipeline, deterministic overlap key, bounded retry/backoff, rate-limit/auth classification, normalized quote persistence, freshness, deduplication, and in-memory provider health foundation implemented. Redis was not configured, so no polling worker was activated.
- `LIVE_PROVIDER_CONNECTIVITY_GATE = BLOCKED_BY_MISSING_PROVIDER_SECRET`; no external HTTP request was made. GoldAPI is not activated as a financial authority.
- No Migration 79 was required. Acceptance remains migration `78`; Persistent `darfus_erp` remains migration `77` and read-only. `gold_market_quotes` and `gold_market_settings` remain empty in Acceptance and absent from Persistent.
- `CURRENT_CGP_PRICE_AUTHORITY = MANUAL_APPROVED`; CGP Posting, pricing snapshots, reversal, settlement, Gold Center UI, Metals API networking, and global dispatcher were unchanged/off.
- Rehearsal DB-backed quote insert/replay/latest/freshness tests passed and the disposable database was dropped safely. Foundation, adapter, health, queue, TypeScript, CGP regression, and diff checks passed.
- `NEXT_TASK = GOLD-LIVE-FEED-03_CGP_PRICING_POLICY_ENGINE`; do not start automatically.

GOLD-LIVE-FEED-01 Provider abstraction and normalized market quote foundation:
- `GOLD_LIVE_FEED_01 = PASS_CONFIRMED`.
- Migration `20260810010000-gold-live-feed-foundation.js` was rehearsed on a disposable guarded database and applied exactly once to `darfus_erp_inventory_rehearsal_20260804_160500z`, which is now migration `78`. Persistent `darfus_erp` remains migration `77` and read-only.
- Added provider-neutral quote contract/registry for `GOLDAPI_IO` and `METALS_API`, normalized `XAU/PER_GRAM` quote validation, freshness primitives, deterministic latest-quote repository, Company-scoped `gold_market_quotes`, and non-secret `gold_market_settings` foundation.
- No fixtures, no destructive business writes, no `gold_prices` changes, no external HTTP adapter, no API key, no polling worker, no CGP live-price integration, no pricing policy, and no Gold Center UI were activated.
- Acceptance business counts were preserved; new quote/settings tables contain zero rows. The acceptance pre-78 backup is `backend/backups/gold_live_feed_01_acceptance_before_78_20260810_120000z.dump` (SHA-256 `CC12B7E6CF9FA6DE08F3302607557CFAEA6376D9BBF23FBEFD60713934091399`).
- Guard tests, foundation tests, TypeScript, CGP IMP-01/02/03 contract regressions, manual approved-price authority verifier, and `git diff --check` passed. `next-env.d.ts` stayed at inherited SHA `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC`.
- `CURRENT_CGP_POSTING_AUTHORITY = MANUAL_APPROVED_UNCHANGED`; `LIVE_PROVIDER_CGP_INTEGRATION = NOT_YET_ACTIVE`; `GLOBAL_DISPATCHER = OFF`; `SERVER_MUTATIONS = 0`.
- `NEXT_TASK = GOLD-LIVE-FEED-02_FIRST_PROVIDER_ADAPTER_AND_REFRESH_PIPELINE_IF_PASS_CONFIRMED`; do not start automatically.

GOLD-LIVE-FEED-03 CGP Pricing Policy Engine:
- `GOLD-LIVE-FEED-03 = PASS_CONFIRMED`. A company-scoped, CGP-only, versioned pricing-policy engine now resolves an active per-karat override before the active global default, supports `MANUAL_APPROVED`/`LIVE_PROVIDER`, `BID`/`SPOT`/`ASK`, and `NONE`/`FIXED_PER_GRAM`/`PERCENTAGE`, with Decimal arithmetic, HALF_UP four-decimal final rates, effective windows, overlap protection, immutable history, audit lineage, and privileged `gold.manage_pricing_policy` enforcement.
- Acceptance migration `20260810020000-gold-cgp-pricing-policies.js` was applied exactly once through the guarded `--gold-live-feed-03` path: Acceptance is migration `79`, `gold_pricing_policies` has `0` rows, and the new permission has no role assignments. Acceptance business counts were preserved. Persistent `darfus_erp` remained migration `77`, read-only, with no policy table or production policy row.
- `CURRENT_CGP_PRICE_AUTHORITY = MANUAL_APPROVED`; `CGP_LIVE_PRICE_INTEGRATION_ACTIVE = NO`; Posting, reversal, settlement, Gold Center, CRM, and the global dispatcher remain unchanged/off. No GoldAPI secret, real spread, external HTTP, server connection, or deployment was used.
- Focused policy/feed/CGP regressions, permission/company isolation, overlap/concurrency rehearsal, TypeScript, and diff checks passed. `next-env.d.ts` remained the inherited known-drift SHA and was not regenerated.
- `NEXT_TASK = GOLD-LIVE-FEED-04_CGP_POSTING_LIVE_PRICE_INTEGRATION`; do not start automatically.
