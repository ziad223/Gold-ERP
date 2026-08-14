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

GOLD-LIVE-FEED-04 CGP Posting live-price integration:
- `GOLD-LIVE-FEED-04 = PASS_CONFIRMED`. CGP canonical Posting is now mode-aware: `MANUAL_APPROVED` remains backward compatible and `LIVE_PROVIDER` is available only through server-side Acceptance/test configuration.
- Posting resolves the exact company-scoped fresh normalized quote and active pricing-policy version at Posting time, applies the policy once with Decimal/HALF_UP four-decimal output, and ignores client-submitted rate values as financial authority. No external HTTP request occurs inside the Posting transaction and no automatic manual fallback exists.
- BID/ASK karat semantics are explicit: matching fine-gold BID/ASK is converted by `karat/24` when direct karat BID/ASK is unavailable; direct provider karat fields are SPOT only. No double purity is applied. Gold purity remains canonical 999.9; 995 is not introduced.
- Additive migration `20260810030000-cgp-live-pricing-snapshot-lineage.js` was applied exactly once to Acceptance through `node scripts/acceptance-migrate.js --gold-live-feed-04 --execute` after backup/rehearsal. Acceptance is migration `80`; live snapshot lineage fields are nullable/mode-aware for historical manual rows. Persistent `darfus_erp` remains migration `77` and read-only.
- Disposable end-to-end proof passed manual compatibility, stale-quote zero-side-effects, live `DRAFT -> VALIDATED -> POSTED`, immutable quote/policy snapshot lineage, Inventory, Accounting, Gold Center, CRM, Settlement, and Reversal. Settlement and reversal consume the frozen Posted amount and never reprice from current market data.
- Original Acceptance has `gold_market_settings=0`, `gold_market_quotes=0`, and `gold_pricing_policies=0` after the batch; no synthetic CGP/quote/policy remains. Persistent has no live policy/settings/secret and no business data mutation.
- Migration guard, Gold Live Feed 01/03 tests, CGP contract/account-resolver tests, disposable integration, TypeScript, and diff checks passed. Next dev/server/external HTTP/real GoldAPI secret were not used. `next-env.d.ts` remains the inherited known-drift SHA `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC`.
- Evidence: `backend/reports/gold-live-feed-04-cgp-live-posting-20260810T000000Z.md`.
- `NEXT_TASK = GOLD-LIVE-FEED-05_GOLD_CENTER_FRONTEND_AND_ADMIN_CONTROLS`; do not start automatically. `GLOBAL_DISPATCHER = OFF`; `CONT38_CGP = PAUSED`.

GOLD-LIVE-FEED-05 Gold Center frontend and admin controls:
- `GOLD-LIVE-FEED-05 = PASS_CONFIRMED`. Gold Center now exposes Live Prices, Pricing Rules, paginated Price History, and Market Data Provider Settings through the existing authenticated API client and Company/Branch context.
- Provider settings/status and Test Connection are server-backed and sanitized. API secrets remain server environment-only; the browser receives only configured/not-configured state. `GOLDAPI_IO` is the implemented ERP-backend provider; `METALS_API` remains network-disabled and cannot be activated.
- `gold.manage_pricing_policy` protects provider/policy mutations; `gold.view` protects reads. LIVE_PROVIDER activation fails closed until provider configuration, fresh reachability, and an active CGP policy are present. No automatic fallback/failover was added.
- Market BID/SPOT/ASK is displayed separately from CGP effective buy pricing; SPOT is never labelled as BID. Policy history is immutable and paginated; conflicts remain canonical API errors. The legacy frontend pricing-mode selector was removed to avoid a second authority.
- Acceptance `darfus_erp_inventory_rehearsal_20260804_160500z` remains migration `80`, with zero settings/quotes/policies and no business mutation. Migration `81` was not required and was not created. Persistent `darfus_erp` remains migration `77`, Assets `53`, Products `3`, and read-only; its missing Live Feed foundation is returned as an explicit 503 until controlled promotion.
- TypeScript, Gold Live Feed 01/03, CGP regressions, migration guard (7/7), and GOLD-LIVE-FEED-05 contract checks passed. No Next dev, server, external HTTP, real secret, commit, push, or deployment was used. `next-env.d.ts` remains the inherited known-drift SHA `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC`.
- Evidence: `backend/reports/gold-live-feed-05-gold-center-frontend-admin-20260810T000000Z.md`.
- `NEXT_TASK = GOLD-LIVE-FEED-06_FULL_LIVE_ACCEPTANCE_AND_PRODUCTION_READINESS`; do not start automatically. `GLOBAL_DISPATCHER = OFF`; `CONT38_CGP = PAUSED`.

GOLD-MAKING-CHARGE-01 — Making Charge Per Gram Gold Center + POS:
- `GOLD-MAKING-CHARGE-01 = PASS_CONFIRMED`.
- Making charge input semantics = `PER_GRAM`.
- Making charge weight basis = `ACTUAL_PHYSICAL_ITEM_WEIGHT_GRAMS` (`Asset.grossWeight`).
- Gold Center total making = `weight × making/g`.
- POS total making = `sold Asset weight × making/g`.
- Historical Posted documents = unchanged.
- CGP acquisition pricing = unchanged.
- Persistent = migration `77` untouched.
- Acceptance = migration `80` unchanged.
- GoldAPI secret = still not configured by this batch.
- `GOLD-LIVE-FEED-06` still requires rerun after secret configuration.
- Next: `GOLD-LIVE-FEED-06_RERUN_AFTER_PROVIDER_SECRET`; do not start automatically.

POS-CHECKOUT-MAKING-CHARGE-01 — POS checkout 500 forensic fix:
- `POS-CHECKOUT-MAKING-CHARGE-01 = PASS_CONFIRMED`.
- Original failure was `POST /api/v1/pos/checkout` returning `500 INTERNAL_SERVER_ERROR`; original correlation ID `6393cab8-28fb-454e-bf11-e6491212d316` and request ID `0becbce0-0ebd-481d-8d91-8874d2a9ee84` are retained as incident references. The exact IDs were not present in retained local logs, so the root cause was confirmed with a fresh disposable-clone reproduction.
- Root cause: the legacy POS payload omitted `sellingGoldRate`, while `calculateGoldSalePriceForAsset` required it and threw `GOLD_SALE_PRICING_SELLING_GOLD_RATE_REQUIRED` before checkout could complete.
- Fix: when explicit `sellingGoldRate` is absent, the server derives a compatibility rate from `Asset.price / netGoldWeight`; making remains server-authoritative `Asset.grossWeight × makingChargePerGram`. Client weight and client total making charge remain non-authoritative.
- `MAKING_CHARGE_INPUT_MEANING = PER_GRAM`; `POS_SERVER_WEIGHT_AUTHORITY = Asset.grossWeight`.
- POS checkout acceptance passed for `10g × 10 = 100`, `10g × 100 = 1000`, and `8.75g × 100 = 875`; forged weight/total values were ignored; negative making was rejected; cash payment and balanced accounting passed.
- Same-key replay returned the same invoice under the existing canonical `201` replay behavior; no duplicate financial effect was observed.
- Persistent `darfus_erp` remained migration `77` and read-only. Acceptance remained migration `80`; all mutations were disposable-clone-only and the clone was dropped.
- Evidence: `backend/reports/pos-checkout-making-charge-01-500-forensic-fix-20260811T003500Z.md`.
- `GOLD-LIVE-FEED-06` remains blocked until the provider secret is configured safely and the explicit rerun is requested.
- `NEXT_TASK = CONFIGURE_GOLD_MARKET_PROVIDER_GOLDAPI_IO_API_KEY_SAFELY_THEN_RERUN_GOLD_LIVE_FEED_06_IF_PASS_CONFIRMED`; do not start automatically.

GOLD-LIVE-FEED-06A — Full live GoldAPI acceptance rerun:
- `GOLD-LIVE-FEED-06A = PASS_CONFIRMED`.
- Local runtime secret was safely present through `backend/src/server.js` -> `dotenv` -> `backend/.env`, using only `GOLD_MARKET_PROVIDER_GOLDAPI_IO_API_KEY`. The value was not exposed in source, DB, frontend, logs, reports, or `NEXT_PUBLIC`.
- Official GoldAPI contract was reverified. Four bounded real HTTP requests were used: Test Connection, canonical settings readiness check, one centralized refresh, and one sanitized metadata capture.
- Real GoldAPI Test Connection = PASS; real refresh = PASS; real quote = PASS; provider `GOLDAPI_IO`; currency `AED`; normalized `PER_GRAM`; fresh at acceptance time; BID/SPOT/ASK and 18K/21K/22K/24K semantics PASS; no double purity.
- Disposable clone `darfus_erp_gold_live_feed_06a_rehearsal_20260810215346` matched Acceptance migration `80` baseline. Live test policy was CGP/DEFAULT/BID/NONE/0 and is not production policy.
- Live CGP E2E `DRAFT -> VALIDATED -> POSTED -> Inventory -> Accounting -> Gold Center -> CRM -> Settlement -> Reversal` = PASS. Posting external HTTP requests = `0`; snapshot lineage and immutability = PASS; newer quote did not mutate Posted CGP.
- Inventory, Accounting, Gold Center, CRM, Settlement, Reversal, stale fail-closed, missing-BID fail-closed, currency mismatch fail-closed, making-charge, and legacy POS missing-`sellingGoldRate` regressions = PASS.
- Canonical Acceptance remains migration `80` clean with no task-owned quote/settings/policy/CGP rows. Persistent `darfus_erp` remains migration `77`, read-only, with no mutation.
- Evidence: `backend/reports/gold-live-feed-06a-full-live-rerun-20260811T010000Z.md`.
- `CODE_AND_SCHEMA_PRODUCTION_PROMOTION_READY = YES`; Production Live activation remains `NO_UNTIL_OWNER_POLICY_AND_RUNTIME_SECRET_CONFIG`.
- `NEXT_TASK = PROD-PROMOTION-LIVE-GOLD-01_PERSISTENT_77_TO_80_IF_PASS_CONFIRMED`; this is separate Owner-authorized work and must not start automatically. `CONT38_CGP = PAUSED`.

## PROD-PROMOTION-LIVE-GOLD-01 — Persistent 77 → 80

- `PROD-PROMOTION-LIVE-GOLD-01 = PASS_CONFIRMED` under the explicit Owner authorization for `darfus_erp`, exact start `77`, exact migrations `78,79,80`, and final `80`. Persistent protection was not weakened globally; no separate AGENTS exception was required because this is the named exact exception permitted by the standing rule.
- Fresh Backup #1: `backend/backups/darfus_erp_pre_live_gold_promotion_77_to_80_20260811T070347Z.dump`, SHA-256 `073D661CBCB4A7DA5A557766695582D46403D0381FF33D844B7647F090DE8EBF`; final Backup #2: `backend/backups/darfus_erp_final_pre_live_gold_promotion_77_to_80_20260811T070718Z.dump`, SHA-256 `1F114BBF1EE85A67BB33126C0EA50BAD995FFE542654EFE6EC57B0C480C86293`. Both were readable by `pg_restore --list`.
- A fresh Persistent restore into exact disposable prefix `darfus_erp_live_gold_promotion_01_rehearsal_20260811T070347Z` matched the pre-promotion business fingerprint. Guarded exact `77 → 80` rehearsal passed; schema was verified; business data, historical CGP values/status, financial integrity, barcode integrity, and company isolation were preserved. The rehearsal database was dropped safely.
- Persistent exact guarded apply passed: migrations `78`, `79`, and `80` each applied once; migration `81` is absent. Assets `53`, Products `3`, Customers `1`, CGP documents `2`, Journals `67`, JournalLines `176`, and CashTransactions `50` remained unchanged; deterministic business hashes remained unchanged.
- New Live Gold tables are clean in Persistent: `gold_market_quotes=0`, `gold_market_settings=0`, `gold_pricing_policies=0`, `cgp_pricing_snapshots=0`. `gold.manage_pricing_policy` exists exactly once with zero role assignments and zero user assignments. `CURRENT_CGP_PRICE_AUTHORITY_DEFAULT = MANUAL_APPROVED`; `LIVE_PROVIDER_ACTIVE_IN_PERSISTENT = NO`.
- No production pricing policy, provider settings, market quotes, GoldAPI request, refresh worker, Redis mutation, Acceptance-data copy, server connection, deployment, commit, or push occurred. Making-charge, POS, CGP, accounting, inventory, settlement/reversal, TypeScript, and diff regressions passed.
- Dedicated fail-closed scripts: `backend/scripts/persistent-live-gold-promotion-guard.js`, `backend/scripts/persistent-live-gold-promotion-migrate.js`, and `backend/scripts/verify-persistent-live-gold-promotion-guard.js`; guard negative tests `7/7` passed. Evidence: `backend/reports/prod-promotion-live-gold-01-persistent-77-to-80-20260811T071000Z.md`.
- `CODE_AND_SCHEMA_PERSISTENT_PROMOTION = PASS`; `LIVE_PROVIDER_PRODUCTION_ACTIVATION_READY = NO_UNTIL_OWNER_POLICY_AND_RUNTIME_SECRET_CONFIG`; `PRODUCTION_PRICING_POLICY_CREATED_THIS_BATCH = NO`; `PRODUCTION_PRICING_ADJUSTMENT_OWNER_DECISION_REQUIRED = YES`.
- `next-env.d.ts` remains the inherited known SHA `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC`; no Next dev was run. The narrow promotion exception is expired at batch end. `NEXT_TASK = PRODUCTION-LIVE-GOLD-CONFIG-01`; do not start automatically. `CONT38_CGP = PAUSED`.

## PRODUCTION-LIVE-GOLD-CONFIG-01 — Persistent live Gold configuration

- `PRODUCTION-LIVE-GOLD-CONFIG-01 = PASS_CONFIRMED` under explicit Owner authorization for Persistent `darfus_erp` configuration only. No migration was created or run; migration `81` remains absent.
- Production currency authority is the canonical `DARFUS` Company currency `AED`. Provider is `GOLDAPI_IO`; pricing mode `LIVE_PROVIDER`; base quote `BID`; adjustment `NONE` with value `0`; no per-karat overrides initially; refresh `30s`; stale `120s`.
- Pre-config backup: `backend/backups/darfus_erp_pre_live_gold_config_01_20260811072502.dump` SHA-256 `817758D84D1A9AE6E2723A60A22EF45C6F69E5CD96419D9AC871FF9ED808FDAB`; post-config backup: `backend/backups/darfus_erp_post_live_gold_config_01_20260811073037.dump` SHA-256 `114851FA3F35A8D6CFE1079F0BCB38B70A2AD1CBA403D061FBA498A2B711BFDE`; both are `pg_restore --list` readable.
- One company-scoped settings row, one active CGP DEFAULT policy version, and one bounded real normalized GoldAPI quote now exist. Test Connection passed without quote persistence; the bounded refresh passed with fresh valid `BID/SPOT/ASK` and 18K/21K/22K/24K semantics. Total real provider HTTP requests were `3` (explicit Test Connection, canonical activation readiness check, one refresh).
- `LIVE_PROVIDER` is active only after canonical readiness. Automatic provider failover and automatic manual fallback remain disabled. `gold.manage_pricing_policy` remains unassigned to roles/employees; no permission auto-assignment occurred.
- Persistent business counts remained `Assets=53`, `Products=3`, `Customers=1`, `CGP documents=2`, `Journals=67`, `JournalLines=176`, `CashTransactions=50`. No CGP/Sales fixtures, historical repricing, status changes, inventory, accounting, treasury, CRM, Gold Center, settlement, reversal, or Redis mutations were introduced.
- Financial/inventory integrity, Gold Live Feed contracts, pricing policy contracts, making-charge/POS and CGP regressions, TypeScript, and diff checks passed. Browser Gold Center runtime was not run because no safe signed-in runtime was available. `next-env.d.ts` remains inherited SHA `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC`.
- `NEXT_TASK = LOCAL-PRODUCTION-SMOKE-01`; do not start automatically. `CONT38_CGP = PAUSED`.

## GOLD-CENTER-LIVE-SYNC-FORENSIC-01 — Read-only diagnosis

- `GOLD-CENTER-LIVE-SYNC-FORENSIC-01 = COMPLETE_DIAGNOSIS`. No code, configuration, database, Redis, migration, fixture, provider, policy, server, or translation mutation was made.
- Persistent `darfus_erp` is migration `80` with Assets `53`, Products `3`, one `gold_market_settings`, one real `gold_market_quotes`, and one active `gold_pricing_policies` row. The latest quote was `2026-08-11T07:26:11Z`, received `07:26:13Z`, and was `2513s` old at inspection; health was `STALE` under the configured `120s` threshold.
- Root cause: `30s` is stored configuration only. No production Gold Market repeat job, scheduler, or worker is registered; `REDIS_URL` is absent and no `gold-market-refresh` runtime is active. Effective CGP rates are blank because stale-quote errors are caught and returned as null by `currentState`.
- `NOT_CONFIGURED` is emitted only when the selected server-side provider adapter is not configured. Current `GOLDAPI_IO` is configured; the audit history shows a temporary `METALS_API/providerConfigured=false` state and later restoration, so an untimestamped screenshot cannot identify the exact historical snapshot beyond the server-derived condition.
- The lower Gold Center uses the legacy `/gold/karat-prices` → `gold.service` path, a different `GOLD_API_KEY` model, fixed approximate FX and simulated fallback values when that key is absent. It is not synchronized with the new canonical Live Feed; its 14K support is legacy calculator scope.
- GoldAPI normalization passed (`31.1034768`, BID/SPOT/ASK per gram, direct 18K/21K/22K/24K, no double purity). The external screenshot comparison is not time-aligned and cannot prove provider error.
- Evidence: `backend/reports/gold-center-live-sync-forensic-01-20260811T081000Z.md`.
- Recommended next batch: `GOLD-CENTER-LIVE-RUNTIME-FIX-01`; then status/rate contract and legacy-price semantics decisions. `LOCAL-PRODUCTION-SMOKE-01` must wait for these decisions. No remediation is marked PASS. `CONT38_CGP = PAUSED`.

## GOLDAPI-AUTH-FORENSIC-01 — GoldAPI authentication forensic closure

- `GOLDAPI-AUTH-FORENSIC-01 = PASS_CONFIRMED`.
- The canonical GoldAPI contract remains `GET https://www.goldapi.io/api/XAU/AED`
  with the server-only `x-access-token` header and
  `GOLD_MARKET_PROVIDER_GOLDAPI_IO_API_KEY` loaded from `backend/.env`.
- The prior runtime batch retained only `GOLDAPI_IO_AUTH_ERROR`; it did not
  retain the provider HTTP status/body. This batch did not expose or change the
  key. Current direct adapter and Test Connection calls returned HTTP 200, and
  two real worker refreshes succeeded at the configured 30-second interval.
- Server, Test Connection, and worker use the same lazy adapter/secret path. No
  import-order, header, proxy, alternate-variable, or worker-path defect was
  found. `backend/.env` had changed externally after the failing run; the exact
  previous assignment cannot be reconstructed without exposing a secret.
- Fresh quote and effective 18K/21K/22K/24K CGP rates were observed during the
  bounded runtime. The stale fail-closed rule and zero external HTTP inside CGP
  Posting remain unchanged.
- This batch made no code, schema, migration, policy, legacy Gold Center,
  server, deployment, or persistent business-data changes. Three real quote
  rows were added by the bounded refreshes; no synthetic quote, journal, treasury,
  Asset, Product, Customer, or CGP row was created.
- Evidence: `backend/reports/goldapi-auth-forensic-01-20260811T091600Z.md`.
- `GOLD-CENTER-LIVE-RUNTIME-FIX-01 = PASS_CONFIRMED`.
- `NEXT_TASK = LOCAL-PRODUCTION-SMOKE-01`; do not start automatically. Keep
  `CONT38_CGP = PAUSED`.

## GOLD-CENTER-LEGACY-PRICE-SYNC-01 — Lower Gold Center canonical market reference

- `GOLD-CENTER-LEGACY-PRICE-SYNC-01 = PASS_CONFIRMED`.
- The lower Gold Center consumer is now synchronized through the provider-neutral
  canonical market quote path. `GET /gold/karat-prices` preserves its historical
  response envelope and adds explicit provider, `SPOT`, `PER_GRAM`, timestamp,
  freshness, age, and warning metadata.
- The former request path through `gold.service.getKaratPrices` is no longer
  reachable from the production Gold Center lower display. The old
  `GOLD_API_KEY`, fixed FX, random 2330 USD fallback, and `تغذية محاكاة` display
  are not used for this surface.
- Lower semantics are `GENERAL_MARKET_REFERENCE`; basis is canonical `SPOT`,
  distinct from CGP `BID/NONE/0`. 24K/22K/21K/18K/14K presentation rates derive
  from the fine-gold SPOT quote exactly once; 14K remains lower calculator scope
  only and was not added to CGP.
- STALE displays the last canonical quote with an explicit warning and age;
  UNAVAILABLE/NOT_CONFIGURED fail closed without random or hardcoded prices.
- Manual approved Gold Center fixing compatibility remains available for legacy
  fixing flows; historical fixings, Posted CGP/Sales, settlements, reversals,
  and making-charge semantics were not repriced.
- Persistent `darfus_erp` remained migration `80`, Assets `53`, Products `3`,
  CGP `2`, Journals `67`, JournalLines `176`, CashTransactions `50`, and
  market quotes `4`; no business rows or synthetic quotes were created.
- Evidence: `backend/reports/gold-center-legacy-price-sync-01-20260811T094452Z.md`.
- `NEXT_TASK = GOLD-PROVIDER-SWITCHING-01_OR_LOCAL-PRODUCTION-SMOKE-01`; do not
  start automatically. `CONT38_CGP = PAUSED`.

## LOCAL-GOLD-RUNTIME-AUTH-HEALTH-FORENSIC-01 — Provider quota block

- `LOCAL-GOLD-RUNTIME-AUTH-HEALTH-FORENSIC-01 = BLOCKED_BY_PROVIDER_KEY_REPLACEMENT_REQUIRED`.
- Normal backend PID `25980` uses the canonical `backend/.env` secret source,
  lazy adapter lookup, the official `x-access-token` header, and the correct
  `GET /api/XAU/AED` path. A bounded direct request now returns HTTP `403` with
  the sanitized provider message `Monthly API quota exceeded`; no key was
  printed, changed, rotated, or replaced by this task.
- The 4→13 market-quote increase consists of nine distinct real
  `VALID/OFFICIAL_RESPONSE` rows. Failed 403 attempts do not persist quote rows;
  stale fail-closed CGP behavior remains active.
- `/health/gold` is still a legacy `goldService`/`GOLD_API_KEY` path and reports
  mock fallback; canonical provider-neutral health alignment is deferred until
  the owner resolves the GoldAPI account/quota and manually restarts backend.
- Persistent `darfus_erp` remained read-only: migrations `80`, Assets `53`,
  Products `3`, current canonical GL Cash `0.003`, Bank `20416.405`, balanced
  journals, zero orphan/unlinked/duplicate integrity findings, and no business
  rows changed. Only natural market quote rows changed before quota rejection.
- Evidence: `backend/reports/local-gold-runtime-auth-health-forensic-01-20260811T121524Z.md`.
- `LOCAL-PRODUCTION-SMOKE-01` remains blocked and is not marked PASS. Next exact
  action: owner GoldAPI account/quota remediation, manual backend restart, then
  `LOCAL-PRODUCTION-SMOKE-01-RETRY`; do not start automatically.

## GOLD-RUNTIME-RECOVERY-AND-HEALTH-FIX-01 — PASS_CONFIRMED

- GoldAPI direct canonical request returned HTTP 200 through `GOLDAPI_IO`;
  Redis (`darfus-redis`) is healthy, the worker is running, and one BullMQ
  repeat schedule refreshes approximately every 30 seconds.
- The owner temporarily changed `GoldMarketSetting` to `1000/2000` and then
  restored it to `30/120`; this batch did not write the setting. The latest
  canonical quote is fresh (<120 seconds), with valid BID/SPOT/ASK and AED per
  gram normalization.
- Effective CGP rates are healthy and remain `BID/NONE/0`; stale or missing
  quotes fail closed. CGP posting performs zero external provider requests.
- `/health/gold` now reads the canonical Gold Market provider/settings/quote
  source, has no legacy `GOLD_API_KEY` dependency, performs no provider HTTP
  call, and reports `isMockFallback=false`.
- Dashboard and Gold Center remain on the canonical SPOT reference source;
  no unrelated legacy Gold code was removed.
- Persistent `darfus_erp` remained migration `80`, Assets `53`, Products `3`;
  only real canonical `gold_market_quotes` rows were added by the worker
  (13 → 58). No journals, treasury rows, assets, settings, or synthetic
  business transactions were created; financial and inventory integrity pass.
- Evidence: `backend/reports/gold-runtime-recovery-and-health-fix-01-20260811T125000Z.md`.
- `GOLD-RUNTIME-RECOVERY-AND-HEALTH-FIX-01 = PASS_CONFIRMED`.
- Remaining gates before full smoke: `LOCAL-LOGIN-FORENSIC-01` and
  `SYSTEM-DATE-CONTROLS-COMPLETION-01`; then
  `LOCAL-PRODUCTION-SMOKE-01-RETRY`. Do not start automatically.
- `NEXT_TASK = LOCAL-LOGIN-FORENSIC-01_IF_PASS`; `CONT38_CGP = PAUSED`.

## GOLD-RUNTIME-1500-2500-STABILITY-01 — Owner-approved long refresh stability

- `GOLD-RUNTIME-1500-2500-STABILITY-01 = PASS_CONFIRMED`.
- Owner-approved Live Gold timing is refresh `1500` seconds and stale
  threshold `2500` seconds. The prior `30/120` state is not restored by this
  batch.
- Provider remains `GOLDAPI_IO`, mode `LIVE_PROVIDER`, currency `AED`, with
  CGP policy `BID/NONE/0`. Manual mode, provider switching, auto-failover, and
  CGP pricing changes remain disabled.
- The persistent canonical setting is `1500/2500`; runtime resolved the same
  values. BullMQ has exactly one Gold scheduler at `1500s`, zero old 30-second
  Gold schedulers, and zero duplicates. Redis is healthy.
- A bounded direct GoldAPI request returned HTTP 200. The latest canonical
  quote is valid and fresh under 2500 seconds. `/health/gold` is canonical,
  provider-neutral, uses the configured stale threshold, and has no mock
  fallback or provider HTTP call.
- Effective CGP rates for 18K/21K/22K/24K are ready under `BID/NONE/0`; stale
  quotes over 2500 seconds remain fail-closed; CGP posting performs zero
  provider HTTP requests. Dashboard and Gold Center remain canonical SPOT.
- Persistent `darfus_erp` remained read-only for business data. Counts are
  migration `80`, Assets `53`, Products `3`, CGPs `2`, Journals `67`,
  JournalLines `176`, CashTransactions `50`; only legitimate live quote rows
  increased the quote count. Financial and inventory integrity remain valid.
- Evidence: `backend/reports/gold-runtime-1500-2500-stability-01-20260811T174359Z.md`.
- `NEXT_TASK = SYSTEM-DATE-CONTROLS-COMPLETION-01`; do not start automatically.
- `CONT38_CGP = PAUSED`.

## SYSTEM-DATE-CONTROLS-COMPLETION-01 — PASS_CONFIRMED

- `SYSTEM-DATE-CONTROLS-COMPLETION-01 = PASS_CONFIRMED`.
- Presentation standards are Date `DD/MM/YYYY`, DateTime `DD/MM/YYYY HH:mm`,
  Time `HH:mm`, with Latin `0-9` digits in Arabic and English UI.
- All production-reachable native date/time inputs were migrated to the existing
  `DateInput`/`DateTimeInput` controls (`NATIVE_DATE_CONTROLS_AFTER = 0`).
  Arabic-Indic and Persian input digits normalize to ASCII before parsing.
- Date-only calendar semantics, branch timezone display semantics, raw sorting/
  filtering, API payload contracts, and all business workflows remain unchanged.
- Persistent `darfus_erp` remained migration `80` with business data preserved;
  no migration `81`, database date rewrite, journal, treasury, asset, or login
  mutation was performed. Gold remains `GOLDAPI_IO / LIVE_PROVIDER / 1500 / 2500`.
- Evidence: `backend/reports/system-date-controls-completion-01-20260811T182953Z.md`.
- Remaining: owner fresh login verification if still required, then
  `LOCAL-PRODUCTION-SMOKE-01-RETRY`; do not start automatically.

## POS-GOLD-NUMERIC-DISPLAY-FINAL-01 — PASS_CONFIRMED

- `POS-GOLD-NUMERIC-DISPLAY-FINAL-01 = PASS_CONFIRMED`.
- Gold price cards and POS numeric displays use Latin `0-9` tokens isolated
  with `bdi dir="ltr"` / `unicode-bidi:isolate` inside the Arabic RTL UI.
- POS numeric inputs normalize Arabic-Indic/Persian digits through the central
  number helpers before parsing; decimal, empty, min/max, and payload semantics
  remain unchanged.
- Gold remains `GOLDAPI_IO / LIVE_PROVIDER / AED / refresh 1500 / stale 2500`;
  CGP remains `BID/NONE/0`; no Gold/POS business values or precision changed.
- Persistent `darfus_erp` remained migration `80`, Assets `53`, Products `3`,
  with no journals, treasury, inventory, or synthetic business writes. Quote
  count movement was only natural live-worker refresh.
- Evidence: `backend/reports/pos-gold-numeric-display-final-01-20260811T191545Z.md`.
- Next: `OWNER_FRESH_LOGIN_VERIFICATION_THEN_LOCAL-PRODUCTION-SMOKE-01-RETRY_IF_PASS`;
  do not start automatically.

## CGP-SETTLEMENT-PERMISSION-PERSISTENT-PROMOTION-01 — security metadata promotion

- Owner-authorized Persistent security-metadata promotion completed on `darfus_erp`.
- `gold_purchase.cgp.settle` was materialized through the sanctioned
  `accessControl.ensurePermissions` path and assigned only to the canonical
  `admin` role. No direct user grant and no other role grant was created.
- Posting and Settlement remain separate authorities; Settlement still requires
  the dedicated permission plus a `POSTED` CGP document.
- Persistent migration baseline stayed `80`; Migration 81 was not created or run.
- Persistent business fingerprint remained unchanged (`Assets=53`, `Products=3`,
  `CGP=6`, `Journals=67`, `JournalLines=176`, `CashTransactions=50`).
- Financial and inventory integrity remained valid: unbalanced journals,
  orphan journal lines, unlinked Treasury, blank/duplicate barcodes = `0`.
- Fresh backup evidence:
  `backend/backups/darfus_erp_development_2026-08-12T06-44-52-012Z.dump`
  SHA-256 `76DA6CF57A5ADE59FE62C7654784D4CA7489FB04D4ED5505958861C21451DD43`.
- Evidence: `backend/reports/cgp-settlement-permission-persistent-promotion-01-20260812T064800Z.md`.
- `PERSISTENT_SECURITY_METADATA_PROMOTION = PASS`.
- The owner must perform a fresh `Logout -> Login`; authorized browser button
  verification remains `WAITING_OWNER_FRESH_LOGIN` and the prior Settlement UI
  gate is not falsely closed.
- `CGP_SETTLEMENT_PERMISSION_PERSISTENT_PROMOTION_01_GATE = PASS_PROMOTED_WAITING_OWNER_FRESH_LOGIN`.
- `NEXT_TASK = OWNER_FRESH_LOGIN_THEN_SETTLEMENT_BROWSER_CLOSEOUT`; do not start automatically.

## CGP-RUNTIME-OUTBOX-DISPATCHER-INTEGRATION-REMEDIATION-01 — PASS_IMPLEMENTED_NOT_ACTIVATED

- تم تنفيذ CGP-scoped runtime dispatcher مقيّد فقط بـ
  `CustomerGoldPurchasePostedEvent` مع registry صريح للـInventory وAccounting
  وGold Center وCRM، وإعادة استخدام Availability hard gate وOutbox claim/idempotency
  القائمين. الـGlobal Dispatcher ما زال OFF.
- التفعيل يتطلب `CGP_RUNTIME_DISPATCH_ENABLED=true` وwatermark ثابتًا وصالحًا في
  `CGP_RUNTIME_DISPATCH_MIN_CREATED_AT`. الافتراضي disabled، وmissing/invalid
  watermark يفشل مغلقًا، ولا يُشتق الحد من وقت بدء العملية.
- Disposable Clone أثبت استبعاد Event قبل الـwatermark، والتشغيل التلقائي لحدث
  جديد بعده، إنشاء Asset واحد بحالة AVAILABLE، Accounting Journal و
  CustomerFinancialLiability مفتوحة وجاهزة للتسوية، Gold Center وCRM receipts،
  deduplication، وretry بعد فشل جزئي مع ثبات الحد بعد restart.
- اختبار claim متزامن لمحاولتين أعطى winner واحدًا فقط دون تكرار Asset أو receipts.
- Persistent `darfus_erp` لم يُفعّل عليه runtime ولم تُعالج أحداثه القديمة. بقيت
  الأحداث الأربعة `CustomerGoldPurchasePostedEvent` بحالة `PENDING` ومحاولات صفر،
  مع بقاء fingerprint الحالي (migrations=80، Assets=53، Products=3) وسلامة
  journals/treasury/inventory.
- لا Migration 81، ولا تغيير Settlement/Governance/Presentation، ولا Gold provider
  request. إعداد Gold `GOLDAPI_IO / LIVE_PROVIDER / 1500 / 2500` محفوظ.
- الأدلة: `backend/reports/cgp-runtime-outbox-dispatcher-integration-remediation-01-20260812T080138Z.md`.
- `CGP_RUNTIME_OUTBOX_DISPATCHER_INTEGRATION_REMEDIATION_01_GATE = PASS_IMPLEMENTED_NOT_ACTIVATED`.
- `HANDOFF_RUNTIME_CLAIM_ACCURATE = YES`؛ لا يُفهم هذا كإصلاح أو تفعيل فعلي على
  Persistent. التالي فقط بعد Owner authorization: `CGP-RUNTIME-DISPATCHER-PERSISTENT-ACTIVATION-01_IF_PASS`،
  ولا يبدأ تلقائيًا.

## CGP-RUNTIME-DISPATCHER-PERSISTENT-ACTIVATION-01 — PASS_CONFIG_PROMOTED_WAITING_OWNER_RESTART

- Owner authorized local Persistent runtime activation for future events only.
- `backend/.env` now contains only the two authorized CGP-scoped settings:
  `CGP_RUNTIME_DISPATCH_ENABLED=true` and
  `CGP_RUNTIME_DISPATCH_MIN_CREATED_AT=2026-08-12T08:32:21.028Z`.
- The fixed watermark is later than the four protected pre-activation CGP events;
  no Event ID or document number is hardcoded.
- `darfus_erp` remained read-only for business data. The four old events remain
  `PENDING` with `attempt_count=0`, zero receipts, and zero integrations. No
  backlog recovery or synthetic CGP/Asset/Journal/Liability was performed.
- The backend reads this configuration at startup. The inherited backend was
  not restarted by the tool, so runtime activation is **not yet verified**.
- `CGP_RUNTIME_DISPATCHER_PERSISTENT_ACTIVATION_01_GATE = PASS_CONFIG_PROMOTED_WAITING_OWNER_RESTART`.
- Required next action: Owner manually restarts the backend, then the same
  activation batch must verify the exact watermark, one processor, Global
  Dispatcher OFF, and untouched protected backlog. Do not start automatically.

## CGP-RUNTIME-DISPATCHER-PERSISTENT-ACTIVATION-01 — PASS_CONFIRMED

- Owner restarted the local backend; PID `13564` loaded
  `CGP_RUNTIME_DISPATCH_ENABLED=true` and the exact fixed watermark
  `2026-08-12T08:32:21.028Z`.
- One logical CGP processor is running; the generic Global Dispatcher remains
  OFF. The four protected pre-activation events still match Phase A and remain
  `PENDING`, `attempt_count=0`, with zero consumer receipts/integration rows.
- A multi-cycle read-only observation found no post-watermark Owner CGP event;
  therefore no manual consumer invocation, synthetic Persistent business data,
  backlog recovery, or settlement was performed.
- Persistent migrations remain `80`, Migration 81 was not created, Gold remains
  `GOLDAPI_IO / LIVE_PROVIDER / 1500 / 2500`, and financial/inventory integrity
  remains valid. `next-env` remains the inherited known drift SHA and was not
  repaired.
- Evidence: `backend/reports/cgp-runtime-dispatcher-persistent-activation-01-20260812T083323Z.md`.
- `CGP_RUNTIME_DISPATCHER_PERSISTENT_ACTIVATION_01_GATE = PASS_CONFIRMED`.
- Next task: `CGP-PENDING-POSTED-EVENTS-CONTROLLED-RECOVERY-01`; do not start
  automatically.

## CGP-PENDING-POSTED-EVENTS-CONTROLLED-RECOVERY-01 — PASS_CONFIRMED

- Owner-authorized recovery was limited to the exact four Phase-A protected
  pre-watermark `CustomerGoldPurchasePostedEvent` v1 IDs. A fresh verified
  Persistent backup was created first:
  `backend/backups/darfus_erp_development_2026-08-12T09-10-54-172Z.dump`,
  SHA-256 `1ABF09A9C3B1683A6F0C2A10E69AB2E9090670D75A8065896F1FBF20A7BBB567`;
  `pg_restore -l` passed.
- All four events passed the complete Phase-A eligibility matrix: exact
  protected set, `POSTED`, not voided, immutable pricing snapshots complete,
  untouched outbox `PENDING`/attempt 0, and no pre-existing Asset, Journal,
  Liability, Gold Center, CRM, Settlement, Treasury, receipt, integration, or
  legacy-pool effects.
- Each event was recovered one at a time through the canonical consumer order
  `INVENTORY -> ACCOUNTING -> GOLD_CENTER -> AVAILABILITY -> CRM` using the
  narrowly gated `claimProtectedEventById` / `processProtectedEvent` path. No
  generic scan, repost, payload mutation, repricing, or manual effect creation
  occurred.
- CGPD-000004 produced 1 Asset/Barcode; CGPD-000005 produced 3; CGPD-000006
  produced 1; CGPD-000007 produced 1. All six Assets are `AVAILABLE`, all six
  Barcodes are unique, four balanced source Journals and four OPEN customer
  liabilities exist, four Gold Center events and CRM history/timeline
  projections exist, and every event has four successful consumer receipts and
  integrations.
- Treasury and Settlement writes are zero. Payable outstanding is recognized
  and settlement-ready for authorized administration; no customer was paid.
- Persistent migrations remain `80`, Assets are `59`, Products `3`; posted
  journals are balanced, orphan journal lines/unlinked Treasury/blank or
  duplicate Barcodes and duplicate canonical CGP source effects are all zero.
- Watermark remains exactly `2026-08-12T08:32:21.028Z`; scoped runtime remains
  active and Global Dispatcher remains OFF. Gold remains
  `GOLDAPI_IO / LIVE_PROVIDER / 1500 / 2500`. No Migration 81, `.env` change,
  governance action, presentation fix, settlement, or Gold provider request.
- A dry-run re-invocation after publication was blocked by the untouched-PENDING
  guard and created no new effects, proving the recovery path's replay safety.
- Evidence: `backend/reports/cgp-pending-posted-events-controlled-recovery-01-20260812T092110Z.md`.
- `PROTECTED_PRE_ACTIVATION_CGP_RECOVERY = PASS_CONFIRMED`;
  remaining protected pending recovery events = `0`;
  `HANDOFF_RECOVERY_STATE_ACCURATE = YES`.
- Next task only: `CGP-SETTLEMENT-BROWSER-POST-RECOVERY-CLOSEOUT-01_IF_PASS`;
  do not start automatically. Settlement must remain read-only in that closeout
  unless separately authorized.

## CGP-SETTLEMENT-BROWSER-POST-RECOVERY-CLOSEOUT-01 — PASS_CONFIRMED

- تم فحص مسار المتصفح القانوني `/ar/sales/customer-gold/drafts` في جلسة Owner
  الحالية دون إرسال أي Settlement أو Treasury mutation.
- الوثائق المستعادة الأربعة `CGPD-000004` و`CGPD-000005` و`CGPD-000006` و
  `CGPD-000007` ظهرت POSTED للقراءة فقط، مع تكامل Inventory/Accounting/Gold
  Center/CRM ناجح، وإجمالي 6 Assets و6 Barcodes وحالة كل Asset = `AVAILABLE`.
- `CustomerFinancialLiability` و`outstandingAmount` ظهرا لكل الوثائق، وصلاحية
  `gold_purchase.cgp.settle` حُلّت في جلسة admin؛ زر `تسجيل الدفعة` ظاهر ومفعّل
  للوثائق الأربع. لم يتم فتح النموذج أو الضغط عليه.
- Persistent بقي دون Settlement/Treasury كتابة؛ البصمة الحالية migrations=80،
  Assets=59، Products=3، liabilities=4 بإجمالي outstanding=29060.3184،
  settlements/legs/allocations=0، وسلامة journals/treasury/inventory PASS.
- إعادة تحميل القراءة فقط نجحت بلا 401/403/404/409/422/500 حالي. Governance
  CGPD-000006 ما زال pending وتظهر أزرار Approve/Reject (ملاحظة UX منفصلة ولم
  تتغير). تاريخ العرض المنشور ما زال ISO `YYYY-MM-DD` (ملاحظة عرض فقط).
- Gold runtime محفوظ `GOLDAPI_IO / LIVE_PROVIDER / 1500 / 2500`، والـwatermark
  `2026-08-12T08:32:21.028Z` محفوظ، والـGlobal Dispatcher OFF.
- الدليل: `backend/reports/cgp-settlement-browser-post-recovery-closeout-01-20260812T095003Z.md`.
- `CGP_SETTLEMENT_BROWSER_POST_RECOVERY_CLOSEOUT_01_GATE = PASS_CONFIRMED`.
- `HANDOFF_SETTLEMENT_BROWSER_STATE_ACCURATE = YES`؛ لا تُعتبر هذه الجولة
  تنفيذ Settlement فعليًا على Persistent.
- الخطوة التالية فقط: `CGP-GOVERNANCE-IMMUTABLE-ACTION-UX-FIX-01`، ولا تبدأ
  تلقائيًا.

## CGP-GOVERNANCE-IMMUTABLE-ACTION-UX-FIX-01 — PASS_CONFIRMED

- تم فصل حالة الحوكمة المحفوظة عن قابلية الإجراء: طلبات الموافقة المرتبطة
  بمستند `POSTED` أو `REVERSED` تظل ظاهرة للتاريخ والتدقيق، لكنها لا تعرض
  Approve أو Reject كإجراءات فعالة.
- Approval ما زال منفصلًا عن Posting، ولا يزال `governance_status=PENDING`
  لا يمنع Posting عندما تكون متطلبات Posting القانونية مكتملة.
- تم إثراء read model من حالة CGP المرتبطة على الخادم، مع الحفاظ على حواجز
  `DOCUMENT_IMMUTABLE` للـApprove والـReject وعدم تغيير أي صف حوكمة في Persistent.
- اختبار المتصفح لـ`CGPD-000006` أثبت بقاء الطلب ظاهرًا مع رسالة عربية محلية،
  وبدون أزرار إجراء، وبدون طلبات mutation أو 409 تلقائية عند إعادة التحميل.
- زر Settlement للوثائق الأربع المستعادة ظل ظاهرًا ومتاحًا للقراءة فقط؛ لم
  يتم إرسال Settlement أو Treasury mutation.
- الدليل: `backend/reports/cgp-governance-immutable-action-ux-fix-01-20260812T100741Z.md`.
- `HANDOFF_GOVERNANCE_STATE_ACCURATE = YES`.
- `CGP_GOVERNANCE_IMMUTABLE_ACTION_UX_FIX_01_GATE = PASS_CONFIRMED`.
- الخطوة التالية فقط: `CGP-PRESENTATION-LOCALIZATION-DATE-CLEANUP-01`، ولا تبدأ
  تلقائيًا.

## CGP-PRESENTATION-LOCALIZATION-DATE-CLEANUP-01 — PASS_CONFIRMED

- تم تنظيف العرض داخل CGP canonical فقط: التواريخ `DD/MM/YYYY`، والـdatetime
  `DD/MM/YYYY HH:mm` في Asia/Dubai، مع الحفاظ على Latin digits وRTL.
- حالات CGP والتكامل والأصل والعكس وCRM pending أصبحت تسميات عربية/إنجليزية
  واضحة بدون raw backend tokens في النطاق المختبر. الأموال تعرض بدقة أربع خانات
  دون تغيير القيم أو منطق المحاسبة.
- Governance immutable UX من الدفعة السابقة ظل صحيحًا، وSettlement readiness
  للوثائق الأربع ظل ظاهرًا ومتاحًا للقراءة فقط. لم تحدث أي Persistent business
  write أو Migration 81.
- الدليل: `backend/reports/cgp-presentation-localization-date-cleanup-01-20260812T104823Z.md`.
- `HANDOFF_PRESENTATION_STATE_ACCURATE = YES`.
- `CGP_PRESENTATION_LOCALIZATION_DATE_CLEANUP_01_GATE = PASS_CONFIRMED`.
- الخطوة التالية فقط: `LOCAL-PRODUCTION-SMOKE-01-RETRY`، ولا تبدأ تلقائيًا.

## CGP-SETTLEMENT-FINANCIAL-APPROVAL-POLICY-CONFIGURATION-01 — PASS_POLICY_PROMOTED_APPROVAL_REQUIRED_NOT_ORCHESTRATED

- Owner policy is now recorded as: every `CUSTOMER_PAYOUT` requires a separate
  Financial Approval. There is no amount auto-approval threshold.
- One company-scoped, all-active-branches, AED policy row was promoted through
  the canonical policy service: `CUSTOMER_PAYOUT`, `branch_id=NULL`,
  `currency=AED`, `payment_method=NULL` (all supported methods),
  `min_amount=0.0000`, `max_amount=NULL`, `approval_required=true`.
- Persistent policy metadata promotion was preceded by a fresh verified backup
  `backend/backups/darfus_erp_cgp_policy_promotion_2026-08-12T11-37-17-650Z.dump`;
  `pg_restore --list` passed. No business transaction data was promoted.
- Clone evaluation passed for CASH, BANK_TRANSFER, MIXED, small positive, and
  large positive amounts. Wrong company and wrong currency failed closed;
  zero/negative amounts failed existing settlement validation. Clone policy
  tests created zero Settlement, Treasury, or financial ApprovalRequest rows.
- Persistent pure evaluation for `CGPD-000007` returned `APPROVAL_REQUIRED` for
  CASH, BANK_TRANSFER, and MIXED. The document remains POSTED, its liability
  remains OPEN with outstanding `5182.4854 AED`, settlements remain `0`, and no
  payment journal or Treasury movement was created.
- Settlement request orchestration still does not create a financial approval
  request automatically. The Admin role has the existing `approvals.manage`
  permission, but no approver role/self-approval policy was invented; Owner
  approver authority remains a next-batch decision before execution.
- Cash remains a separate blocker: the current OPEN session has calculated
  available `0.0000 AED`; no cash funding or sufficiency gate was added here.
- Gold remains `GOLDAPI_IO / LIVE_PROVIDER / 1500 / 2500`; the CGP scoped
  dispatcher watermark remains `2026-08-12T08:32:21.028Z`; Global Dispatcher is
  OFF. Migrations remain `80`; Migration 81 was not created.
- Evidence: `backend/reports/cgp-settlement-financial-approval-policy-configuration-01-20260812T114500Z.md`.
- `HANDOFF_FINANCIAL_POLICY_STATE_ACCURATE = YES`.
- Next task only: `CGP-SETTLEMENT-FINANCIAL-APPROVAL-REQUEST-ORCHESTRATION-01`;
  do not start automatically.

## CGP-SETTLEMENT-PERMISSION-AUTHORITY-TREASURY-HARD-GATE-01 — PASS_CONFIRMED

- Owner superseding decision is final: `CUSTOMER_PAYOUT` is authorized by
  `gold_purchase.cgp.settle` only. Financial Approval, `approvals.manage`,
  Approval Requests, and amount-based approval thresholds are not part of
  Customer Payout.
- The exact prior policy `FAP-a7cb52dc-609e-444b-888a-59bce0732f0e` was
  provenance-verified and deactivated through the canonical policy lifecycle;
  no unrelated policy was changed. `ACTIVE_CUSTOMER_PAYOUT_APPROVAL_POLICY_COUNT = 0`.
- Cash sufficiency is now a hard gate using the open branch Cash Session's
  canonical ledger-derived available balance and Decimal comparison. The
  locked session row serializes concurrent payouts; insufficient Cash fails
  before Journal/Treasury/Settlement/Liability writes.
- Clone acceptance passed Cash exact/greater/decimal/partial, Mixed cash-leg
  sufficiency and atomic failure, concurrency overdraw prevention, Bank
  regression, idempotency, and balanced financial integrity. Generic financial
  approval regression passed.
- Persistent remains unpaid and unfunded: `CGPD-000007` is POSTED, Liability
  OPEN with outstanding `5182.4854 AED`, Settled `0.0000`, Settlements `0`.
  Persistent migrations remain `80`; Migration 81 was not created.
- Gold/runtime remains `GOLDAPI_IO / LIVE_PROVIDER / 1500 / 2500`, watermark
  `2026-08-12T08:32:21.028Z`, Global Dispatcher OFF. The known next-env drift
  remains unchanged and was not repaired.
- Evidence: `backend/reports/cgp-settlement-permission-authority-treasury-hard-gate-01-20260812T121500Z.md`.
- `HANDOFF_SETTLEMENT_AUTHORITY_ACCURATE = YES`.
- Next task depends on the existing canonical Treasury funding workflow:
  `TREASURY-CASH-FUNDING-AND-CGP-PAYOUT-ACCEPTANCE-01` if present, otherwise
  `TREASURY-CASH-FUNDING-WORKFLOW-FORENSIC-01`. Do not start automatically.

## CGP-POST-PAYMENT-READMODEL-UX-REDESIGN-01 — PASS_CONFIRMED

- تم إصلاح سبب عرض المتبقي الخاطئ بعد السداد: قيمة `0.0000` أصبحت محفوظة في
  read model، ولا يحدث fallback إلا عند غياب القيمة فعليًا. أُضيفت حالة عرض
  مشتقة فقط: `UNPAID` و`PARTIALLY_PAID` و`FULLY_PAID` من Liability؛ لم تُضف
  سلطة مالية أو حقل تخزين جديد.
- تم إثراء قائمة CGP باستعلام Liability مجمع واحد، مع فصل حالة الترحيل عن حالة
  السداد، وإخفاء نموذج السداد عند اكتمال السداد. أُعيد تنظيم مساحة CGP canonical
  بعناوين واضحة، بطاقات مالية، مراحل عرضية، تاريخ تسوية منظم، تسميات عربية،
  تفاصيل تقنية قابلة للطي، وروابط تنقل محلية، مع الحفاظ على Governance وPosting
  وSettlement authorities دون تغيير.
- اختبار Clone مؤقت أثبت UNPAID → PARTIALLY_PAID → FULLY_PAID، وبقاء المتبقي
  `0.0000` بعد إعادة القراءة، ومنع السداد المزدوج، وعدم تغير عدد Assets أو
  ApprovalRequests، وسلامة Journal/Treasury. تم حذف الـclone بعد الاختبار.
- تحقق المتصفح read-only من `CGPD-000007` أظهر `مدفوع بالكامل`، وبطاقات قيمة
  الشراء/المدفوع/المتبقي، والمتبقي `AED 0.0000`، ورسالة السداد الكامل، وعدم
  ظهور نموذج دفعة إضافية. تحقق desktop/tablet/narrow لم يسجل overflow أفقيًا.
- Persistent بقي `darfus_erp` دون كتابة: migrations=80، Assets=61، Products=3،
  Migration 81 غير موجود، وسلامة journals/treasury/inventory PASS. إعدادات Gold
  بقيت `GOLDAPI_IO / LIVE_PROVIDER / 1500 / 2500`، والـwatermark وdispatcher
  دون تغيير.
- الدليل: `backend/reports/cgp-post-payment-readmodel-ux-redesign-01-20260812T193913Z.md`.
- `HANDOFF_CGP_POST_PAYMENT_UX_ACCURATE = YES`.
- `CGP_POST_PAYMENT_READMODEL_UX_REDESIGN_01_GATE = PASS_CONFIRMED`.
- الخطوة التالية الموصى بها فقط: `LOCAL-PRODUCTION-SMOKE-01-RETRY_IF_PASS`، ولا
  تبدأ تلقائيًا.

## CGP-ASSET-POS-SELLING-PRICE-AND-EDITABLE-METADATA-FIX-01 — PASS_CONFIRMED

- تم تمرير `CGP_CUSTOMER_GOLD_PURCHASE` إلى نفس سلطة تسعير الذهب canonical؛
  POS يحسب سعراً حالياً من Gold Center لكل عيار مع cache على مستوى الطلب، دون
  استدعاء Provider لكل Asset ودون نسخ تكلفة الشراء إلى `Asset.price`.
- حقل POS المستخدم هو `PosItem.price` كـ effective quote مؤقت للعرض والسلة؛
  لا يعيد تعريف `assets.price` المحفوظ ولا يحوله إلى تكلفة شراء.
- أضيفت بوابة خادمية نهائية `POS_SELLING_PRICE_REQUIRED` تمنع السعر الصفري أو
  غير الصالح قبل أي أثر بيع/مخزون/قيد/خزينة، مع تعطيل بطاقة الأصل غير المسعّر
  في POS ورسالة محلية.
- أضيف الأمر المحدود `PATCH /inventory-v2/assets/:id/metadata` بصلاحية
  `inventory.adjust` وallowlist: `name, description, category, brand, notes,
  location`. الحقول المالية والمادية والهوية والفرع والحالة مرفوضة خادمياً؛
  التعديل يسجل before/after/actor في Audit، و`expectedUpdatedAt` يمنع lost update.
- أضيف محرر البيانات الوصفية إلى Asset detail فقط، مع إبقاء التكلفة التاريخية
  والتقييم الحالي وسعر البيع الحالي منفصلة للعرض، ورابط من بطاقة CGP إلى نفس
  صفحة Asset canonical.
- اختبارات Clone in-memory، اختبارات العقود السابقة، Gold Center/Making Charge
  regression، و`npx tsc --noEmit` نجحت. لم تُنفذ عملية بيع أو تعديل أعمال في
  Persistent أو Acceptance، ولم تُنشأ Migration 81.
- تحقق القراءة من `darfus_erp` أعاد migrations=80 وAssets=62 وProducts=3 في
  هذه الجلسة، مع journals/treasury/inventory integrity PASS؛ Acceptance تحقق
  read-only على `darfus_erp_inventory_rehearsal_20260804_160500z` عند migrations=80.
- Gold runtime محفوظ `GOLDAPI_IO / LIVE_PROVIDER / 1500 / 2500`، وnext-env لم
  يتغير (ظل SHA الموروث المعروف). الدليل:
  `backend/reports/cgp-asset-pos-selling-price-and-editable-metadata-fix-01-20260812T205500Z.md`.
- `CGP_ASSET_POS_SELLING_PRICE_AND_METADATA_FIX_01_GATE = PASS_CONFIRMED`.
- الخطوة التالية فقط: `LOCAL-PRODUCTION-SMOKE-01-RETRY`؛ لا تبدأ تلقائياً.

## SUPPLIER-ALL-ASSET-PROFILES-ACQUISITION-PAYABLE-PRICING-FIX-01 — PASS_WITH_ACCEPTANCE_MAPPING_BLOCKER

- تم توحيد ملخص Supplier Receive مع نفس V2 normalization الخادمي عبر معاينة قراءة فقط؛ `PurchaseOrder.total` وSupplier Payable وremaining formula لم تتغير.
- Gold Bar = 24K فقط، شهادة التمويل وCertificate VAT له فقط؛ Gold By Weight = 14/18/21/22/24 بدون شهادة مالية؛ Gold By Piece ظل piece-cost ولا يستخدم weight × Gold Center.
- Diamond/Gemstone/Pearl والـLoose حافظت على سلطات الشراء الحالية. CGP ظاهر disabled وغير قابل للإرسال في Supplier Receive، ويظل محميًا خادميًا.
- تم إضافة حماية profile-switch وloading/unavailable صريحة بدون fallback صفر، واختبارات static/preview وTypeScript وfocused ESLint نجحت.
- Persistent `darfus_erp` بقي read-only: migrations=80، Assets=62، Products=3، وسلامة journals/treasury/inventory محفوظة. Acceptance read-only عند migrations=80.
- الاستلام الكامل ما زال متوقفًا فقط عند `FINANCIAL_MAPPING_REQUIRED` في disposable clone؛ لم يتم تعديل mapping أو إنشاء Migration 81 أو تغيير `.env` أو تشغيل/إعادة تشغيل runtime.
- الدليل: `backend/reports/supplier-all-asset-profiles-acquisition-payable-pricing-fix-01-20260813T082940+0300.md`.
- `HANDOFF_SUPPLIER_PROFILE_PAYABLE_FIX_ACCURATE = YES`.
- الخطوة التالية فقط: `SUPPLIER-CLONE-BRANCH-FINANCIAL-MAPPING-RESOLUTION-01` ثم إعادة E2E؛ لا تبدأ تلقائيًا.

## SUPPLIER-CLONE-BRANCH-FINANCIAL-MAPPING-RESOLUTION-01 — PASS_CONFIRMED

- تم إعادة إنتاج عطل `FINANCIAL_MAPPING_REQUIRED` داخل Clone جديد فقط. السبب
  الدقيق كان اختيار الـrunner للفرع النشط الأول C10 (`BR-C10-1785859057817`)
  بدل فرع MAIN المهيأ؛ C10 لم يكن لديه أي `SystemAccountRole` أو active
  `BranchFinancialMapping`. أول دور فشل في مسار الاستلام كان
  `INVENTORY_ASSET`، ثم يلزم `SUPPLIER_PAYABLE` للاستلام غير المدفوع.
- Acceptance source وPersistent كانا سليمين: فرع MAIN لديه active واحد لكل
  الأدوار الـ11. لم يتم نسخ أي Account ID ثابت ولم يتغير الـresolver أو قاعدة
  fail-closed.
- تم استخدام المسار القانوني الموجود `POST /financial/reconcile` داخل Clone
  فقط، فأنشأ 12 role bindings و11 active mappings وسجل audit reconciliation؛
  لم تُنشأ Accounts جديدة ولم تُمس أي بيانات أعمال في المصدرين.
- نفس Supplier Receive عاد بـ201: PO total=100، paid=0، remaining=100، قطعة
  واحدة = Asset واحدة = Barcode واحد، revision واحدة، Journal متوازن على
  `SYS-INVENTORY`/`SYS-AP`، وبدون Treasury. إعادة نفس Idempotency-Key أعادت نفس
  النتيجة دون آثار مكررة.
- تم إسقاط الـClone والتحقق من عدم وجوده. Persistent وAcceptance source بقيا
  للقراءة فقط، migrations=80، Persistent Assets=62 وProducts=3. لم تُنشأ
  Migration 81 أو يتغير `.env` أو runtime أو Dispatcher، ولم يُشغّل Next dev.
- الدليل: `backend/reports/supplier-clone-branch-financial-mapping-resolution-01-20260813T090000+0300.md`.
- `HANDOFF_CLONE_FINANCIAL_MAPPING_RESOLUTION_ACCURATE = YES`.
- الخطوة التالية فقط: `SUPPLIER-GOLD-BAR-RECEIPT-PRICING-E2E-CLOSEOUT-01-RERUN`؛ لا تبدأ تلقائيًا.

## SUPPLIER-GOLD-BAR-RECEIPT-PRICING-E2E-CLOSEOUT-01-RERUN — PASS_CONFIRMED

- تم إغلاق Supplier Gold E2E على Disposable Clone فقط بعد اختيار فرع `MAIN`
  بطريقة deterministic financially-ready؛ لم يعد الـrunner يعتمد على أول فرع
  نشط، وظل fail-closed mapping behavior محفوظًا.
- نجح Gold Bar receipt حقيقي بقطعة واحدة وAsset/Barcode واحد، مع 24K فقط،
  purchase rate افتراضي من Gold Center، وoverride مصرح بسبب وAudit، ورفض
  override غير مصرح به.
- تم إثبات Certificate finance وVAT للـGold Bar فقط (`7.25%` على certificate
  cost)، وحالة بلا شهادة، وتجميد التاريخي، وتحرك current valuation وPOS quote
  دون تغيير Purchase/Payable.
- نجحت مصفوفتا Gold By Weight وGold By Piece للعيارات `14/18/21/22/24K`؛
  Making Charge بقي على gross weight، وGold By Piece احتفظ بسلطة piece-cost.
  Gold Bar غير 24K، current-rate tampering، POS-price tampering، وzero-price
  كلها فشلت مغلقًا عند الحاجة.
- Supplier Payable وPO total/remaining والـJournal والـAsset/Barcode lineage
  وIdempotency وCGP Supplier isolation اجتازت الاختبار. اختبارات UX السابقة
  للـdesktop/tablet/mobile وفصل acquisition/current بقيت PASS.
- Persistent `darfus_erp` وAcceptance source ظلا للقراءة فقط؛ migrations=80،
  Persistent Assets=62 وProducts=3، وسلامة journals/treasury/inventory PASS.
  لا Migration 81، لا تغيير `.env`، لا restart، ولا Git/deploy.
- Gold runtime بقي `GOLDAPI_IO / LIVE_PROVIDER / AED / 1500 / 2500`، وGlobal
  Dispatcher effective state بقي OFF.
- الدليل: `backend/reports/supplier-gold-bar-receipt-pricing-e2e-closeout-01-rerun-20260813T093600+0300.md`.
- `HANDOFF_SUPPLIER_GOLD_CLOSEOUT_RERUN_ACCURATE = YES`.
- `SUPPLIER_GOLD_BAR_RECEIPT_PRICING_E2E_CLOSEOUT_01_RERUN_GATE = PASS_CONFIRMED`.
- الخطوة التالية فقط: `LOCAL-PRODUCTION-SMOKE-01-RETRY`؛ لا تبدأ تلقائيًا.

## SUPPLIER-RECEIVE-CLONE-GOLD-RUNTIME-BROWSER-RECEIPT-CLOSEOUT-05 — PASS_CONFIRMED

- تم توريث إعداد Gold provider إلى عملية backend Clone مؤقتة من `backend/.env`
  دون طباعة السر أو تعديل `.env`، وأصبح Gold health على Clone
  `GOLDAPI_IO / LIVE_PROVIDER / AED` بحالة HTTP 200 وبدون mock fallback.
- أُثبتت دورة المتصفح نفسها Bar → Weight → Piece → Bar، ثم معاينة `GOLD_BAR_24K`
  فعلية HTTP 200 وإرسال Supplier Receive فعلي من الواجهة HTTP 201؛ total وPayable
  = 5107.25، paid=0، remaining=5107.25، VAT على certificate فقط.
- قراءة Clone أثبتت PO واحداً، item واحداً، Asset واحدة، Barcode واحداً، Revision
  واحدة، Journal واحداً متزناً على SYS-INVENTORY/SYS-AP، ولا Treasury لاستلام غير
  مدفوع. Replay بنفس Idempotency-Key أعاد نفس PO/Asset بلا أثر مكرر.
- تم إيقاف runtime المؤقت وإسقاط قاعدة Clone. Persistent `darfus_erp` وAcceptance
  بقيا read-only عند migrations=80؛ Assets=62 في Persistent و475 في Acceptance؛
  لم تُنشأ Migration 81 ولم يتغير Dispatcher أو `.env` أو next-env.
- الدليل: `backend/reports/supplier-receive-clone-gold-runtime-browser-receipt-closeout-05-20260813T144500+0300.md`.
- `SUPPLIER_RECEIVE_CLONE_GOLD_RUNTIME_BROWSER_RECEIPT_CLOSEOUT_05_GATE = PASS_CONFIRMED`.
- الخطوة التالية فقط: `SUPPLIER-GOLD-BAR-PREVIEW-NETWORK-EVIDENCE-CLOSEOUT-01_IF_PASS`؛ لا تبدأ تلقائياً.

## SUPPLIER-GOLD-BAR-PREVIEW-NETWORK-EVIDENCE-CLOSEOUT-01 — PASS_CONFIRMED

- تم التقاط POST/response حقيقيين للمعاينة من المتصفح على المسار
  `/api/v1/inventory-v2/receive-preview`: 16/16 HTTP 200، مع Bar 24K بلا شهادة
  وبشهادة، وتطابق total/remaining بين الرد والواجهة.
- مصفوفة التبديل Weight/Piece/Bar، ومصفوفات Gold By Weight وGold By Piece،
  واختبار رفض Bar غير 24K اجتازت. لم توجد طلبات متجاورة مكررة أو أخطاء Console.
- أضيف حارس `previewInputReady` لمنع الطلبات الناقصة المعروفة؛ بقيت سلطة التحقق
  والحساب للخادم. عدد الطلبات غير الصالحة القابلة للتجنب بعد الإصلاح = 0.
- Persistent وAcceptance بقيا read-only عند migrations=80؛ لا Migration 81 ولا
  تغيير runtime أو `.env`. Clone disposable أُسقط بعد التحقق.
- إعادة فحص إيصال Clone بعد تغيير الحارس انتهت بمهلة تشغيل، مع بقاء دليل Batch 05
  السابق PASS؛ لا يُخفى هذا القيد التشغيلي.
- الدليل: `backend/reports/supplier-gold-bar-preview-network-evidence-closeout-01-20260813T173000+0300.md`.
- `HANDOFF_SUPPLIER_PREVIEW_NETWORK_CLOSED = YES`.
- `SUPPLIER_GOLD_BAR_PREVIEW_NETWORK_EVIDENCE_CLOSEOUT_01_GATE = PASS_CONFIRMED`.
- الخطوة التالية فقط: `LOCAL-PRODUCTION-SMOKE-01-RETRY-STRICT-RUNTIME`؛ لا تبدأ تلقائياً.

## SUPPLIER-MINIMAL-HARNESS-AUTH-BOOTSTRAP-COMPANY-READINESS-CLOSEOUT-03 — PASS_CONFIRMED

- تم التقاط طلب bootstrap الفعلي قبل جاهزية Supplier Receive. الطلب كان
  `GET http://localhost:8000/api/v1/auth/accessible-companies`، وفشل قبل الإصلاح
  بـ404 / `ROUTE_NOT_FOUND` لأن الـharness كان يضيف `/api/v1` مرتين عند التوجيه
  إلى Clone (`/api/v1/api/v1/...`). هذا ثبت أن التصنيف السابق كان Harness defect،
  وليس عيباً في Product.
- تم إثبات session مصادق عليه، ودور `super_admin`، وCompany من bootstrap القانوني،
  وفرع `MAIN` الجاهز مالياً دون hardcoded Company ID أو first-active fallback. بعد
  إصلاح توجيه الـharness عادت طلبات bootstrap/readiness بـ200 ووصلت صفحة Supplier
  إلى marker الجاهزية.
- في نفس Browser session نجحت دورة Bar → Weight21 → Piece21 → Bar، ثم Preview
  فعلي 200 وUI parity، ثم Submit فعلي من الواجهة وReceipt 201 لـ`GOLD_BAR_24K`/24K:
  total=5106.25، paid=0، remaining=5106.25، purchase rate=500، certificate=100،
  certificate VAT=6.25.
- Clone proof: PO +1، Asset +1، Revision +1، Barcode فريد، Journal متوازن،
  payable مطابق، ولا Treasury لاستلام غير مدفوع. Replay بنفس Idempotency-Key أعاد
  201 دون أي زيادة في PO/Asset/Revision. تم إغلاق المتصفح وإيقاف runtime وإسقاط
  Clone فقط.
- تم تعطيل SSE داخل الـharness فقط لتجنب timeout اصطناعي؛ لا Product code أو
  Security middleware تغيّر. Persistent وAcceptance بقيا read-only، migrations=80،
  لا Migration 81، ولا Next dev أو restart أو deploy. التقرير:
  `backend/reports/supplier-minimal-harness-auth-bootstrap-company-readiness-closeout-03-20260813T153000+0300.md`.
- `HANDOFF_AUTH_BOOTSTRAP_CLOSEOUT_CLOSED = YES`.
- الخطوة التالية فقط: `LOCAL-PRODUCTION-SMOKE-01-RETRY-STRICT-RUNTIME`؛ لا تبدأ تلقائياً.

## POS-REDESIGN-IMPLEMENTATION-PHASE-01-SHELL-AND-LAYOUT-REV02 — PASS_OWNER_REVIEW_READY

- تم تنفيذ Phase 1 بصرياً فقط: POS header/context strip، وLayout مكتبي من ثلاثة أعمدة بترتيب فعلي من اليسار إلى اليمين: العميل، مساحة البحث/أصناف الفاتورة، الدفع والإجماليات.
- تم الحفاظ على `PosPage` كمالك للـstate والـhandlers. لم يتغير Search logic أو API أو pricing أو VAT أو payment أو checkout أو accounting أو inventory أو security، ولم تتم إضافة Universal Search.
- اختفت تسمية Cart/Basket/السلة من واجهة POS واستُخدمت تسمية `أصناف الفاتورة`؛ الأسماء الداخلية بقيت للتوافق الآمن.
- Real-browser proof نجح على 1440×900 و1280×800 و768×800 tablet baseline، مع عدم وجود أخطاء Console أو clipping/overflow في القياسات المسجلة. Payment sticky مطبق على desktop فقط، والـtablet يتكدس بأمان.
- `PERSISTENT_MIGRATIONS_INITIAL = 80` و`PERSISTENT_MIGRATIONS_AFTER = 80`؛ Persistent `darfus_erp` وAcceptance بقيا read-only، و`PERSISTENT_WRITES_THIS_BATCH = 0` و`ACCEPTANCE_SOURCE_WRITES_THIS_BATCH = 0`. لا Migration 81 ولا تغيير runtime أو env.
- التقرير والدليل: `backend/reports/pos-redesign-implementation-phase-01-shell-and-layout-rev02-20260814.md`.
- `PHASE_1_HANDOFF_SCOPE_ONLY = YES`؛ لا يعني ذلك إغلاق POS redesign أو تنفيذ Universal Search.
- `OWNER_VISUAL_REVIEW_REQUIRED = YES`.
- `NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`.
- الخطوة التالية بعد موافقة Owner البصرية فقط: `POS-REDESIGN-IMPLEMENTATION-PHASE-02-UNIVERSAL-SEARCH-AND-CUSTOMER`.

## POS-REDESIGN-PHASE-01-OWNER-VISUAL-REVISION-COMPACT-SEARCH-LAYOUT-01 — PASS_OWNER_REVIEW_READY

- تم تنفيذ المراجعة البصرية المطلوبة بعد رفض Owner للشكل السابق: Grid المنتجات
  مخفي افتراضياً، البحث الحالي compact، و`أصناف الفاتورة` أصبحت المحتوى الرئيسي
  مباشرة أسفل البحث في جدول كثيف بتمرير داخلي.
- عند وجود query/filter فقط تظهر نتائج مؤقتة في قائمة compact، وبعد اختيار الصنف
  تُفرَّغ خانة البحث. لم يتغير search logic أو API أو pricing أو VAT أو payment
  أو checkout أو accounting أو inventory أو security.
- ظل `PosPage` مالكاً لنفس state والـhandlers والبيانات الحالية؛ لا manual free item
  ولا backend change ولا Universal Search في هذه الجولة.
- Real-browser proof اكتمل على 1440×900 و1280×800 و768×800، مع إثبات search
  compact وسطر invoice محلي دون submit، وبدون Console errors أو clipping أفقي.
- Persistent `darfus_erp` وAcceptance بقيا read-only؛ migrations=80، لا Migration 81.
  Persistent integrity وAcceptance target verification وTypeScript وfocused lint و7/7
  focused POS tests نجحت.
- الأدلة والتقرير: `backend/reports/pos-redesign-phase-01-owner-visual-revision-compact-search-layout-01-20260814T114500Z.md`.
- `POS_REDESIGN_PHASE_01_OWNER_VISUAL_REVISION_COMPACT_SEARCH_LAYOUT_01_GATE = PASS_OWNER_REVIEW_READY`.
- `OWNER_REVIEW_CHECKLIST = COMPLETE` و`NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START`.
- الخطوة التالية بعد موافقة Owner البصرية فقط:
  `POS-REDESIGN-IMPLEMENTATION-PHASE-02-UNIVERSAL-SEARCH-AND-CUSTOMER`.
