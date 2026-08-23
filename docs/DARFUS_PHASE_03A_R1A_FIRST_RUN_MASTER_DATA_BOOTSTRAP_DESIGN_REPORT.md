# DARFUS ERP — PHASE 03A-R1A FIRST-RUN MASTER DATA BOOTSTRAP DESIGN REPORT

**Control ID:** `DARFUS-PHASE-03A-R1A-FIRST-RUN-MASTER-DATA-BOOTSTRAP-DESIGN`  
**Phase:** `03A-R1A`  
**Mode:** `READ_ONLY_DESIGN_ONLY`  
**Official DB:** `darfus_erp`  
**Automatic next batch:** `FORBIDDEN`

## 1. Executive Summary

This Addendum designs a versioned, idempotent, company-aware, auditable First-Run Bootstrap for approved reference-derived Inventory Master Data. It does not implement the design.

The safest source-aligned decision is:

- Inventory Bootstrap is a distinct service step invoked explicitly by the First-Run orchestrator after Company Foundation and financial/COA readiness. It must not provision on ordinary runtime startup.
- Manual rerun is an authenticated, permission-controlled setup/admin action; it is not a public arbitrary endpoint.
- The current global `FirstRunSetupState` is unsuitable as an Inventory dataset-version registry. `financial-bootstrap.service` has a COA-specific version, not an Inventory manifest version. A small company-scoped Inventory Bootstrap state table is therefore designed for a future migration; no migration is created now.
- The canonical dataset is one manifest containing the current 502 approved profile rows, 39 Pearl Sizes, 5 Barcode Inventory Codes, 20 Barcode Item Codes, and the future 157-row R1 delta. Gem Treatment remains a registered field with zero initial values.
- Replay is non-destructive: missing canonical rows are inserted, exact rows are kept, disabled rows remain disabled, user-modified values are not silently overwritten, historical values are never deleted, and collisions fail closed.
- Loose `KT=00` remains a server barcode identity rule. It is not a Master Data row and must not create fake Assets, Barcodes, or sequences.

This is a design-ready gate only. No source, test, migration, database, backup, configuration, build, or runtime state was changed.

## 2. Preconditions

| Precondition | Evidence | Result |
|---|---|---|
| `PHASE_01_FINAL_CLOSED` | `docs/DARFUS_FINAL_OWNER_BUSINESS_AUTHORITY_FREEZE.md` and accepted Phase 01A gate | YES |
| `PHASE_02_VERIFIED_BACKUP` | `backups/official/darfus_erp_FULL_20260818_000425.dump`, custom archive, prior `pg_restore -l` PASS, SHA-256 recorded | YES |
| `PHASE_03A_SAFE_SUBSET_PROVISIONED` | `docs/DARFUS_PHASE_03A_REFERENCE_DERIVED_PROVISIONING_REPORT.md`; 502 + 39 + 5 + 20 rows | YES |
| `PHASE_03A_R1_GATE` | `docs/DARFUS_PHASE_03A_R1_REFERENCE_SCHEMA_GAP_CLOSURE_DESIGN_REPORT.md` | `PASS_PHASE_03A_R1_REFERENCE_SCHEMA_GAP_CLOSURE_DESIGN_READY` |
| Current report exists | Read-only file check before this control | YES |
| Official DB identity | `SELECT current_database(), version()` => `darfus_erp`, PostgreSQL 16.15 | YES |

R1 authority decisions were not reopened. They remain frozen: canonical `Gübelin`, complete Diamond/Gem Position/Setting and Diamond Tone authorities, Gem Treatment field with no canonical initial list, loose `KT=00`, and Option A server derivation.

## 3. Existing First-Run / COA Architecture

### First Run

| Concern | Current source | Observed behavior |
|---|---|---|
| Public status | `backend/src/routes/setup.routes.js`, `GET /status` | Server-derived status; no data write |
| First-run command | `backend/src/routes/setup.routes.js`, `POST /bootstrap` | Rate-limited; deployment token in `X-First-Run-Setup-Token`; idempotency header required |
| Controller | `backend/src/controllers/setup.controller.js` | Delegates to `bootstrapFirstRun`; returns 201 first result and 200 replay |
| Owner service | `backend/src/services/first-run-bootstrap.service.js` | Validates payload/token, starts transaction, locks, creates Company/User/Branch, ensures roles and financial readiness, writes audit, marks ready |
| State | `backend/src/models/firstRunSetupState.model.js` | Singleton `GLOBAL` marker with state, request/payload hashes, result, completion, and error code |
| State resolver | `backend/src/services/first-run-setup-state.service.js` | Counts companies/admins/branches, checks financial readiness, returns setup/recovery/ready state |
| Concurrency | `pg_advisory_xact_lock(736287401)` | Transaction-scoped global first-run lock |
| Failure | Transaction rollback plus marker/state classification | Fail closed; recovery state is explicit |

### COA / financial bootstrap

- `backend/src/services/financial-bootstrap.service.js` owns `reconcile()` and `evaluateReadiness()`.
- `backend/src/services/financial-account-catalog.service.js` owns `BOOTSTRAP_VERSION = 2`, account-role catalog, branch mappings, and posting account catalog.
- COA/account rows carry `accounts.bootstrap_version`; this is an account-level bootstrap version, not a general dataset registry.
- `reconcile()` uses a company/branch advisory lock, transaction-scoped reads/locks, creates missing accounts/mappings, preserves valid existing roles, fails readiness on ambiguous/invalid mappings, and supports `dryRun`.
- `auditService` is used by First Run for a summary event; COA reconciliation itself is transaction-oriented and report-based.

### Source-boundary observation

`backend/src/server.js:19-29` explicitly avoids hidden runtime provisioning in normal startup and prefers an explicit local setup command. This is a strong safety precedent for Inventory Bootstrap.

## 4. Inventory Bootstrap Architecture Decision

**Decision: Option B — an independent Inventory Bootstrap step invoked explicitly by the First-Run orchestrator.**

The future service should be `backend/src/services/inventory-master-data-bootstrap.service.js` (new in R2), with a public contract such as:

```text
bootstrapInventoryMasterData({ models, companyId, actorId, transaction, targetVersion, dryRun })
```

The First-Run orchestrator invokes it only after Company Foundation exists and after the COA/financial readiness gate has passed. The service remains independently callable for an authenticated, permission-controlled rerun for an existing company.

Why this is safer than copying COA blindly:

- Inventory Master Data has different row types, profile applicability, aliases, disabled-value behavior, and historical snapshots.
- It needs a manifest hash and dataset identity, not only a numeric account bootstrap version.
- It must operate at company scope but not branch scope for the current schema.
- It must not mix reference-data reconciliation with financial role reconciliation.

The service may share transaction, advisory-lock, report, and audit patterns with COA, but not its account-specific mutation logic.

## 5. Trigger Decision

| Option | Decision | Reason |
|---|---|---|
| A. Automatic explicit First Run / Local Setup | Partially used as caller | Good lifecycle placement, but Inventory logic remains a separate service |
| B. Explicit admin/setup step called by First Run | **SELECTED** | Company-aware, controlled, replayable, separable, and compatible with current source |
| C. Runtime startup automatic provisioning | Rejected | Startup must not perform business/reference mutation without explicit control |

`BOOTSTRAP_TRIGGER = EXPLICIT_FIRST_RUN_STEP_OR_AUTHORIZED_SETUP_RERUN`.

Normal server startup, health checks, login, GET requests, and frontend loops must never call the mutating bootstrap.

## 6. Bootstrap Service Ownership

**Owner service:** `inventory-master-data-bootstrap.service` (future R2).

Responsibilities:

- Validate mandatory `companyId` and target manifest/version.
- Resolve the single canonical manifest.
- Acquire a company/dataset advisory lock.
- Read and lock existing rows by canonical key.
- Reconcile only allowed system-owned metadata.
- Insert missing rows within a transaction.
- Keep disabled rows disabled and report them.
- Detect duplicates/collisions and fail closed.
- Produce a deterministic summary report and manifest hash.
- Write one summary audit event per bootstrap attempt/outcome.
- Record version state only after the dataset transaction succeeds.

It must not create Suppliers, Locations, VAT settings, transactions, Assets, POs, Movements, Payments, Journals, or POS data.

## 7. Dataset Manifest Design

The manifest must be one source-owned module, proposed as:

`backend/src/services/inventory-master-data-manifest.js` (future R2).

Each manifest entry contains:

| Property | Meaning |
|---|---|
| `datasetId` | Stable dataset family, e.g. `PROFILE_MASTER_DATA`, `PEARL_SIZE_MASTER_DATA`, `BARCODE_INVENTORY_CODES` |
| `version` | Integer dataset version, beginning at 1 |
| `category` | Existing category/table authority |
| `canonicalKey` | Immutable comparison identity; for Profile Master Data: normalized category + canonical value |
| `canonicalValue` | Exact approved value/key |
| `applicableProfiles` | Final-profile scope where applicable |
| `activeInitialState` | Initial active state from approved authority |
| `authoritySource` | Final Owner Authority or named raw reference |
| `aliases` | Controlled aliases, currently `Gubelin` for canonical `Gübelin` |
| `bootstrapAction` | `INSERT`, `KEEP`, or future explicitly approved reconciliation behavior |
| `sortOrder` | Deterministic display order where the table supports it |

The manifest must include the existing canonical taxonomy:

- Inventory codes: `GW`, `GP`, `DD`, `GS`, `PL`.
- Item codes: `ANK`, `BGL`, `BAR`, `BRC`, `BRH`, `CHN`, `CHK`, `CON`, `CRW`, `ERG`, `FST`, `LOS`, `NCK`, `PND`, `PCH`, `RNG`, `TRN`, `WRN`, `ROS`, `CSD`.
- The 502 current profile rows and 39 Pearl Size rows by exact canonical key.
- R1 delta: 16 Certificate Authorities, 14 Diamond Tone, 9 Diamond Tone Level, 10 Diamond Saturation, 7 Diamond Position, 47 Diamond Setting, 7 Gem Position, 47 Gem Setting.
- Gem Treatment category registration may exist in source, but its initial value list is empty.

`WT` and `WCH` are prohibited from the manifest.

## 8. Version Storage Design

### Current mechanisms inspected

- `first_run_setup_states` is a singleton global state, not company/dataset scoped.
- `accounts.bootstrap_version` is tied to COA/account definitions and cannot prove Inventory manifest equivalence.
- `settings` is company-scoped JSON key/value but is general configuration, owner-editable, and lacks a dedicated immutable dataset identity/lock/report contract.
- No Inventory bootstrap state/version registry exists in the inspected schema.

### Minimum safe storage design

Future migration design only:

`inventory_master_data_bootstrap_states`

| Column | Rule |
|---|---|
| `company_id` | Required FK to Company; part of unique scope |
| `dataset_id` | Required immutable dataset family |
| `current_version` | Last successfully applied manifest version |
| `manifest_hash` | Hash of canonical sorted manifest entries |
| `state` | `IN_PROGRESS`, `READY`, `FAILED`, `CONFLICT` |
| `last_report` | JSONB summary, no secrets |
| `last_error_code` | Stable failure code |
| `started_at`, `completed_at` | Lifecycle timestamps |
| `created_at`, `updated_at` | Audit timestamps |

Unique key: `(company_id, dataset_id)`. The state row is system-owned; users cannot edit it through generic Settings.

`BOOTSTRAP_VERSION_SCOPE = COMPANY_AND_DATASET`.

`BOOTSTRAP_VERSION_STORAGE_SCHEMA_CHANGE_REQUIRED = YES` because no existing mechanism safely represents company + dataset + manifest hash + state. This is a future migration design, not a migration execution in R1A.

## 9. Company Scope

The actual schema is company-aware:

- `profile_master_data`, `pearl_size_master_data`, `barcode_inventory_codes`, and `barcode_item_codes` all carry `company_id`.
- The official DB currently has one company, with the 502, 39, 5, and 20 rows all belonging to `COMP-48ab554f-427e-4642-9419-bc8616c2dc36`.
- No branch column is present in these four master-data authorities; the Bootstrap must not invent branch duplication.

Rules:

1. `companyId` is mandatory in the service contract.
2. Every query and write is constrained by the supplied company ID.
3. Company existence and active setup context are validated server-side.
4. Cross-company canonical-key matches are not adopted or updated.
5. One company’s bootstrap state cannot mark another company READY.
6. Global barcode taxonomy is not assumed; the current actual models are company-scoped, so each company receives its own canonical rows through the same manifest.

## 10. Idempotent Replay Rules

| Condition | Required behavior |
|---|---|
| Canonical row missing | `INSERT` inside the transaction |
| Canonical row exact | `KEEP`; count in report |
| Same key with safe system-owned metadata drift | Reconcile only fields explicitly marked system-owned; otherwise report |
| User-modified canonical row | Do not silently overwrite; report `USER_MODIFIED_CANONICAL_ROW` |
| Canonical row disabled by user | `KEEP_DISABLED`; never auto-reactivate |
| Alias resolves to canonical identity | Normalize at comparison boundary and report alias resolution |
| Duplicate canonical key | Fail closed for the affected dataset; transaction rolls back |
| Unknown conflicting row | Report and stop affected dataset; no destructive guess |
| Historically referenced value | Preserve ID, snapshots, and audit; never delete |
| Same version and same manifest hash | No-op success with `replayed=true` |
| Same version with different manifest hash | Fail closed; requires reviewed upgrade |

The operation must be safe on second and third replay and must never use delete-all/reinsert-all.

## 11. Ownership / Editable Fields Matrix

| Authority | Immutable/system-owned | Owner-editable | Disable allowed | Display label policy |
|---|---|---|---|---|
| Barcode inventory codes `GW/GP/DD/GS/PL` | Code, identity, asset-type mapping | None through ordinary label edit | Only explicit controlled retirement policy | Display may be localized separately; code is not editable |
| Barcode item codes incl. `ERG/NCK/ROS/CSD` | Code and compatibility mapping | None through arbitrary label edit | Controlled, usage-aware only | Labels may be presentation metadata, never identity |
| Master category keys | Category key and canonical identity | No | No direct disable of category identity | System-owned |
| Certificate Authority | Canonical normalized value; alias map | Display metadata only through reviewed policy | Yes, permission-controlled | New canonical label `Gübelin`; legacy alias not primary display |
| Gold descriptions/colors | Canonical value/key | Display metadata only under owner permission | Yes, permission-controlled | Do not alter referenced historical snapshots |
| Pearl sizes | Numeric value + unit identity | No identity edit | Controlled disable if supported | Preserve exact numeric value/unit |
| R1 registry values | Canonical key | Metadata only | Yes, permission-controlled | No silent overwrite of user labels |

`SILENT_OVERWRITE_USER_MODIFIED_VALUES = NO`.

## 12. Disabled Value Behavior

`AUTO_REACTIVATE_DISABLED_VALUES = NO`.

On replay, a disabled canonical row is retained as disabled and reported as `CANONICAL_BUT_DISABLED`. The Bootstrap does not reactivate it merely because it remains in the current manifest. A future explicit upgrade policy may request reactivation, but that is a separate Owner decision and must be audited.

## 13. Historical Preservation

`DELETE_HISTORICALLY_USED_VALUES = NO`.

The service must check usage before any proposed identity action. A referenced row keeps its ID, canonical snapshot, label snapshot, Asset references, and audit history. The manifest may mark a removed value as legacy in a future version, but it must not delete or rewrite historical meaning.

Barcode identity history is outside Master Data Bootstrap mutation. No barcode sequence is consumed by Bootstrap.

## 14. V1 → V2 Upgrade Design

### V1

V1 is the initial canonical dataset represented by the current 502 profile rows, 39 Pearl Sizes, 5 Inventory Codes, and 20 Item Codes, plus the source-approved existing canonical manifest.

### V2

V2 adds the approved R1 delta: 157 rows, excluding Gem Treatment values because its initial list is undefined.

Upgrade behavior:

- Existing V1 exact rows: `KEEP`.
- New V2 canonical rows: `INSERT`.
- Existing disabled values: `KEEP_DISABLED`.
- User-modified display metadata: preserve and report.
- Historically used values removed from the current reference: preserve and optionally mark legacy if a supported metadata field exists; do not invent a field solely for this.
- Version state advances only after the complete dataset transaction and audit summary succeed.
- A failed/conflicting V2 upgrade does not mark V2 READY.

## 15. Current 502 Rows Integration

The official DB baseline has 502 `profile_master_data` rows for one company. The future Bootstrap recognizes them by exact `(company_id, category_key, canonical_value)` rather than count alone.

Replay proof must compare:

- expected manifest key set vs actual key set;
- active/disabled state;
- canonical value and display label policy;
- source/authority metadata where the actual table supports it;
- duplicate count and category membership;
- deterministic manifest hash.

No delete, truncation, reseed, or reinsert-all is permitted. An exact 502-row baseline produces 502 `KEEP` decisions and zero duplicate inserts for V1.

## 16. Current Pearl Size Integration

The official DB contains 39 Pearl Size rows for the same company, covering `1.0` through `20.0` mm at `0.5` steps.

Replay rule:

- Compare exact numeric value and unit identity.
- 39 exact rows => `KEEP`, zero insert, zero edit.
- Do not “correct” an existing value through a generic replay. Any mismatch is a conflict requiring a separately audited correction path.
- Do not delete or reinsert the range.

## 17. Current Barcode Taxonomy Integration

The official DB contains 5 Inventory Codes and 20 Item Codes. The future Bootstrap compares the exact code/key and compatibility mappings.

Required exact inventory codes: `GW`, `GP`, `DD`, `GS`, `PL`.  
Required exact item codes: `ANK`, `BGL`, `BAR`, `BRC`, `BRH`, `CHN`, `CHK`, `CON`, `CRW`, `ERG`, `FST`, `LOS`, `NCK`, `PND`, `PCH`, `RNG`, `TRN`, `WRN`, `ROS`, `CSD`.

`barcode_sequences = 0` remains correct. Sequences are allocated lazily by canonical barcode identity generation and must never be manually bootstrapped. `WT` and `WCH` are absent and must remain absent.

## 18. R1 157-row Delta Integration

The R1 delta is a manifest version, not a one-off manual script:

| Dataset/category | Rows |
|---|---:|
| `CERTIFICATE_AUTHORITY` | 16 |
| `DIAMOND_TONE` | 14 |
| `DIAMOND_TONE_LEVEL` | 9 |
| `DIAMOND_SATURATION` | 10 |
| `DIAMOND_POSITION` | 7 |
| `DIAMOND_SETTING` | 47 |
| `GEMSTONE_POSITION` | 7 |
| `GEMSTONE_SETTING` | 47 |
| `GEMSTONE_TREATMENT` | 0 |
| **Total** | **157** |

The R2 manifest version should insert only missing canonical keys, preserve disabled/user-modified rows, and record one dataset-level summary. It must not claim Gem Treatment is incomplete merely because its approved initial row count is zero.

## 19. Gübelin Alias Strategy

| Existing state | Future replay behavior |
|---|---|
| No row | Insert canonical `Gübelin` |
| Exact `Gübelin` row | Keep |
| Legacy `Gubelin`, unused | Recommend controlled alias normalization to canonical identity only through a reviewed, idempotent migration/provisioning action; do not silently overwrite in R1A |
| Legacy `Gubelin`, historically used | Preserve row/ID/history; normalize new input/display to `Gübelin`; do not rewrite historical snapshots |
| Both rows exist | Fail closed as canonical collision until Owner-approved reconciliation; never choose silently |

The alias is an input/lookup compatibility rule, not an additional canonical production value.

## 20. Gem Treatment Zero-List Strategy

`GEMSTONE_TREATMENT_FIELD = ENABLED`.  
`GEMSTONE_TREATMENT_CANONICAL_INITIAL_LIST = NOT_DEFINED_BY_REFERENCE`.

The manifest may register the category/schema field, but contains zero Treatment value rows. This is a successful no-value outcome, not a bootstrap failure. The service must reject arbitrary free-text persistence when a future canonical Master Data reference is required; it must not invent treatment values from Diamond Treatment or general practice.

## 21. Loose KT=00 Relationship

`KT=00` is not a Master Data row. The relationship is:

```text
Inventory Bootstrap
  -> canonical barcode taxonomy ready (DD/GS/PL + LOS mapping)

Server barcode identity policy
  -> exact loose profile derives karat segment 00
```

Bootstrap must not allocate a sequence, create a Barcode, create an Asset, or create a fake loose row. The R1 Option A source change remains a future barcode-boundary implementation concern.

## 22. Transaction Design

### Selected model

Use one logical transaction per company and dataset-version upgrade, with a company/dataset advisory lock. The service may process datasets in deterministic order inside the same transaction:

1. Barcode taxonomy.
2. Profile Master Data.
3. Pearl Size Master Data.
4. R1 registry delta.
5. Version state and summary audit.

### Rationale

- Atomicity prevents a READY version from representing a partial dataset.
- The dataset is small (current 723 rows plus the delta), so one transaction is operationally safe.
- A single transaction gives clean rollback on duplicate/collision/conflict.
- Deterministic ordering and row locks make replay predictable.
- If future dataset size materially grows, logical per-dataset transactions may be introduced only with a state machine that never marks the overall version READY prematurely.

## 23. Audit Design

Use one summary audit event per bootstrap attempt, consistent with the existing audit pattern; avoid one audit row per unchanged canonical row.

Required events/metadata:

- `inventory_master_data_bootstrap.started`
- `inventory_master_data_bootstrap.completed`
- `inventory_master_data_bootstrap.failed`
- `inventory_master_data_bootstrap.conflict`
- dataset ID and target version;
- company ID and actor/setup source;
- manifest hash;
- inserted, kept, disabled, alias-resolved, user-modified, and conflict counts;
- error code and affected dataset;
- prior and resulting version.

The audit record is written transactionally with the result. Failed transactions must not leave a false completed audit/version state.

## 24. Security / Permission

- Public endpoint for arbitrary inventory Bootstrap: **NO**.
- Unauthenticated execution: **NO**.
- Normal runtime startup trigger: **NO**.
- First-run execution: only inside the explicitly authorized setup flow, with the deployment-controlled first-run token and server-generated company context.
- Existing-company rerun: authenticated setup/admin action guarded by the existing `settings.update`/setup permission boundary, with server-resolved `companyId`; exact permission name must be confirmed in R2 implementation tests before exposure.
- Frontend loops cannot be the authority or invoke per-row mutation.
- Company scope is checked server-side for every row and state update.

## 25. Failure / Retry Semantics

| Failure | State/result | Retry |
|---|---|---|
| Missing company/context | `FAILED`, no row mutation | Correct context, retry |
| Duplicate canonical key | `CONFLICT`, transaction rollback | Owner/source correction required |
| User-disabled row | `READY` with warning if all other keys reconcile; remains disabled | No automatic reactivation |
| User-modified metadata | `READY` with warning if identity is safe; preserve metadata | Explicit owner reconciliation only |
| Unknown conflicting row | `CONFLICT`, affected dataset fails closed | Review before retry |
| Database/transaction error | Rollback; no READY version | Safe replay after cause is resolved |
| Same version/hash | No-op replay success | No mutation |
| Same version/different hash | Conflict | New reviewed target version |

If the Inventory step is invoked within First Run, an Inventory conflict should fail the encompassing First-Run transaction so the system cannot report a fully completed First Run with an unprovisioned required baseline. If COA was already completed in a prior run, COA remains completed while Inventory state stays `CONFLICT`/`FAILED`; retry is explicit and does not rerun COA destructively.

## 26. Schema/Migration Requirement

`BOOTSTRAP_VERSION_STORAGE_SCHEMA_CHANGE_REQUIRED = YES`.

Reason: the existing global `first_run_setup_states` cannot represent company + dataset + version + manifest hash, and the COA `accounts.bootstrap_version` is not an Inventory manifest registry. Generic `settings` is not a safe substitute because it is owner-editable configuration and lacks the required concurrency/conflict semantics.

Future migration design only:

- Create `inventory_master_data_bootstrap_states` with the columns and unique key in Section 8.
- Add FK/company indexes and a unique `(company_id, dataset_id)` constraint.
- Do not alter `profile_master_data`, Pearl Size, Barcode taxonomy, Asset, or transaction tables for this design.
- Do not use `SequelizeMeta` as dataset version.

No migration was created or applied.

## 27. Exact Source Touch Map

| File | Function/class | Current behavior | Required future behavior | Reason | Risk |
|---|---|---|---|---|---|
| `backend/src/services/first-run-bootstrap.service.js` | `bootstrapFirstRun` | Creates Company/Branch/User, roles, COA readiness, audit, global marker | Invoke independent Inventory service after Company/COA readiness, passing company/actor/transaction | Lifecycle integration | Coupling/rollback ordering |
| `backend/src/services/first-run-setup-state.service.js` | `resolveSetupState` | Global first-run state | Read Inventory readiness only if approved as a required First-Run gate; do not repurpose marker | Avoid false READY | Recovery-state regression |
| `backend/src/routes/setup.routes.js` | setup routes | `/status`, `/bootstrap` | Keep public first-run boundary token-controlled; no generic public Inventory route | Security | Accidental exposure |
| `backend/src/controllers/setup.controller.js` | `bootstrap` | Delegates First Run | Pass server-owned company context only after company exists | Company safety | Context leakage |
| `backend/src/services/financial-bootstrap.service.js` | `reconcile`, `evaluateReadiness` | COA/account/mapping bootstrap with version 2 | No Inventory logic; only ordering boundary | Separation of authority | Financial regression |
| `backend/src/services/financial-account-catalog.service.js` | `BOOTSTRAP_VERSION` | COA catalog version | Do not reuse for Inventory | Different dataset semantics | Version confusion |
| `backend/src/services/inventory-master-data-bootstrap.service.js` | new `bootstrapInventoryMasterData` | Does not exist | Own lock, manifest, reconciliation, state, report, audit | Single Inventory authority | New service correctness |
| `backend/src/services/inventory-master-data-manifest.js` | new manifest export | Values are split across policy/constants/migration | One canonical versioned dataset manifest | Prevent drift | Manifest divergence |
| `backend/src/services/inventory-master-data-policy.service.js` | current arrays/`initialRows` | Current 502 baseline source plus old Certificate spelling and no R1 categories | Become manifest inputs or be made a thin compatibility export; remove `WT/WCH` from any bootstrap source | Canonical authority | Existing callers |
| `backend/src/services/profile-master-data.service.js` | categories/list/create/update/resolve | Company-scoped values, category registry, references | Support new profile categories and preserve user/history rules | R1 delta | Validation mismatch |
| `backend/src/services/barcode-identity.service.js` | `generateBarcodeForAsset` | Lazy sequence identity; subtype only improves error text | Separate future R2 source change derives loose `00` | R1 frozen policy | Barcode identity regression |
| `backend/src/config/barcode-defaults.js` | taxonomy defaults | Runtime taxonomy fallback/config source | Remain non-authoritative for production manifest; exclude WT/WCH | Avoid provisional values | Fallback confusion |
| `backend/src/routes/erp.routes.js` | setup/admin and master-data routes | Profile Master Data CRUD and financial routes | Add only permission-controlled explicit bootstrap entry if approved | Controlled rerun | Endpoint/security risk |
| `backend/src/models/firstRunSetupState.model.js` | global marker | Singleton setup state | Do not reuse as Inventory state | Scope mismatch | State corruption |
| `backend/src/models/index.js` | model registry | Registers existing models | Register future state model after migration | Runtime access | Boot failure |
| `backend/migrations/*` | future migration | No Inventory bootstrap state table | Add only the approved state table migration in R2 | Version storage | Migration risk |
| `backend/tests/*` | future focused tests | Existing first-run/COA tests and master-data tests | Add manifest/replay/scope/conflict/audit tests | Acceptance proof | Coverage gaps |

## 28. Exact R2 Implementation Scope

R2 may contain only:

1. Fresh verified backup of the current official baseline.
2. The minimum migration for the company/dataset bootstrap state, if confirmed by implementation inspection.
3. The canonical manifest module and source category updates for the R1 delta.
4. The Inventory Bootstrap service with lock, transaction, replay, conflicts, disabled values, aliases, and summary audit.
5. Explicit First-Run orchestration and permission-controlled rerun path.
6. Gübelin alias normalization.
7. Loose `KT=00` server derivation at the canonical barcode boundary.
8. Focused tests and type/static checks permitted by the approved batch.
9. Controlled application of only missing canonical data.
10. Replay proof against the current 502/39/5/20 baseline.
11. DB reconciliation and official DB write accounting.
12. Stop and report.

Explicitly excluded: Supplier, Location, VAT, TRN, payment terms, pricing, Assets, POs, Receives, Movements, Payments, Journals, POS transactions, profile screens, and Diamond/Gem/Pearl feature implementation.

## 29. Bootstrap Acceptance Tests

The following tests are design requirements only; none were added or run in R1A:

| Test | Expected |
|---|---|
| Empty company dataset | Canonical rows created exactly once |
| Second run | Zero duplicates; exact rows kept |
| Third run | Same result; no destructive changes |
| Disabled canonical row | Remains disabled and is reported |
| User-modified safe display metadata | Not silently overwritten |
| Historical used value | ID/snapshot/audit preserved |
| Unknown conflict | Fail closed and rollback affected dataset |
| V1 → V2 | Only new canonical rows inserted |
| Current 5 + 20 taxonomy | Exact codes and mappings; `WT/WCH` absent |
| Pearl sizes | Exact 39 values, 1.0–20.0, 0.5 step; no edits |
| Certificate authority | `Gübelin` canonical; `Gubelin` alias behavior; collision failure |
| Gem Treatment | Bootstrap inserts zero values |
| Diamond categories | Exact 14/9/10/7/47 registry values |
| Gem Position/Setting | Exact 7/47 values and multi-setting contract |
| Cross-company isolation | No read/write adoption across companies |
| Audit summary | Started/completed/failed/conflict summary with counts and hash |
| Loose `KT=00` | Server policy only; no fake Asset/Barcode/sequence |
| Startup safety | Ordinary startup does not provision |
| First-run failure | Inventory conflict prevents false overall First-Run READY |
| Idempotency conflict | Same key/hash replay is safe; changed manifest/version fails closed |

## 30. Fresh Backup Requirement

`FRESH_BACKUP_REQUIRED_BEFORE_03A_R2 = YES`.

Before any R2 implementation mutation or provisioning:

- create a fresh verified backup of exact `darfus_erp` current state;
- verify non-empty archive, format, hash, and readable restore listing;
- confirm the baseline includes 502 profile rows, 39 Pearl Sizes, 5 Inventory Codes, 20 Item Codes, and current audit state;
- record exact start/end baselines;
- do not use the old acceptance database as authority;
- do not perform the backup in R1A.

The existing Phase 02 backup remains historical evidence only for this design.

## 31. Out-of-Scope Confirmation

No implementation or design expansion was performed for:

- Suppliers, Supplier TRN, Locations, Default Location;
- VAT registration/rate, Company TRN, tax treatment;
- Payment Terms, Due Days, pricing thresholds, making thresholds, Gold pricing;
- Assets, Purchase Orders, Receives, Movements, Payments, Journals;
- POS or customer transactions;
- Diamond/Gem/Pearl feature screens or workflows;
- Gold formulas, Gold Center, barcode allocation, sequence consumption;
- migrations, provisioning, backup, build, restart, deploy, or runtime mutation;
- `AGENTS.md` or `next-env.d.ts`.

## 32. Files Changed

Only this report was created by this control:

`docs/DARFUS_PHASE_03A_R1A_FIRST_RUN_MASTER_DATA_BOOTSTRAP_DESIGN_REPORT.md`

No other file was modified. Existing dirty worktree entries, including the Owner-accepted generated `next-env.d.ts` drift, were preserved.

## 33. DB Mutation Proof

Read-only evidence:

```text
current_database() = darfus_erp
PostgreSQL = 16.15
companies = 1
profile_master_data = 502
pearl_size_master_data = 39
barcode_inventory_codes = 5
barcode_item_codes = 20
barcode_sequences = 0
first_run_setup_states = 1
```

The company-scoped baseline rows all belong to the same current company. Only SELECT/schema inspection commands were run. No INSERT, UPDATE, DELETE, TRUNCATE, DDL, migration, seed, backup, restore, or sequence allocation was run by R1A.

`OFFICIAL_DB_WRITES_THIS_CONTROL = 0`.

## 34. Git Safety Proof

Read-only Git inspection before this report:

```text
CURRENT_HEAD = 1657b0e9ba580faef69be48f04637835c201b521
PRE_EXISTING_TRACKED_OR_STAGED_ENTRIES = 86
PRE_EXISTING_UNTRACKED_ENTRIES = 240
PRE_EXISTING_NEXT_ENV_D_TS_DRIFT = M next-env.d.ts
```

No reset, restore, clean, stash, checkout overwrite, add, commit, push, or global Git configuration change was run. `AGENTS.md` and `next-env.d.ts` were not touched.

## 35. Gate

```text
GATE = PASS_PHASE_03A_R1A_FIRST_RUN_MASTER_DATA_BOOTSTRAP_DESIGN_READY
```

The design answers the required trigger, owner service, manifest, version storage, scope, idempotency, disabled-value, historical, user-modification, upgrade, transaction, audit, security, failure/retry, source-touch, and R2-plan questions. The gate authorizes only Owner review of the design. It does not authorize backup, implementation, migration, provisioning, or R2 execution.

## 36. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-R1A-FIRST-RUN-MASTER-DATA-BOOTSTRAP-DESIGN
PHASE = 03A-R1A
PHASE_NAME = FIRST_RUN_MASTER_DATA_BOOTSTRAP_DESIGN_ADDENDUM
MODE = READ_ONLY_DESIGN_ONLY
OFFICIAL_DB = darfus_erp

REFERENCE_MASTER_DATA_FIRST_RUN_BOOTSTRAP = YES
FIRST_RUN_BOOTSTRAP_IDEMPOTENT = YES
FIRST_RUN_BOOTSTRAP_VERSIONED = YES
FIRST_RUN_BOOTSTRAP_COMPANY_AWARE = YES
FIRST_RUN_BOOTSTRAP_AUDITABLE = YES

BOOTSTRAP_TRIGGER = EXPLICIT_FIRST_RUN_STEP_OR_AUTHORIZED_SETUP_RERUN
BOOTSTRAP_OWNER_SERVICE = inventory-master-data-bootstrap.service
BOOTSTRAP_DATASET_MANIFEST = inventory-master-data-manifest.js
BOOTSTRAP_VERSION_STORAGE = inventory_master_data_bootstrap_states
BOOTSTRAP_VERSION_SCOPE = COMPANY_AND_DATASET

CURRENT_PROFILE_MASTER_DATA_ROWS = 502
CURRENT_PEARL_SIZE_ROWS = 39
CURRENT_BARCODE_INVENTORY_CODES = 5
CURRENT_BARCODE_ITEM_CODES = 20
R1_REFERENCE_DELTA_ROWS = 157
GEMSTONE_TREATMENT_INITIAL_BOOTSTRAP_VALUES = 0

CERTIFICATE_CANONICAL = Gübelin
CERTIFICATE_LEGACY_ALIAS = Gubelin
LOOSE_PROFILE_KT_SEGMENT = 00
LOOSE_KT_00_HANDLED_BY_SERVER_POLICY = YES

DELETE_ALL_RESEED = NO
AUTO_REACTIVATE_DISABLED_VALUES = NO
DELETE_HISTORICALLY_USED_VALUES = NO
SILENT_OVERWRITE_USER_MODIFIED_VALUES = NO

BOOTSTRAP_VERSION_STORAGE_SCHEMA_CHANGE_REQUIRED = YES
FRESH_BACKUP_REQUIRED_BEFORE_03A_R2 = YES

OFFICIAL_DB_WRITES_THIS_CONTROL = 0
SOURCE_CODE_CHANGED = NO
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

GATE = PASS_PHASE_03A_R1A_FIRST_RUN_MASTER_DATA_BOOTSTRAP_DESIGN_READY
NEXT_RECOMMENDED_STEP = FRESH_VERIFIED_POST_03A_BACKUP_THEN_PHASE_03A_R2_IMPLEMENTATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP — OWNER REVIEW REQUIRED.**
