# DARFUS ERP — Phase 03A-R3 First-Run Bootstrap Browser/Network Acceptance Report

## 1. Executive Summary

تم التحقق من الـmain runtime والـOfficial DB والـR2 state والـsafety backup بنجاح. الـreal authenticated browser وصل إلى `/ar/setup`، لكن الحالة `READY` تعرض فقط `Setup complete` و`Go to login`، ولا تعرض أي Bootstrap/Replay action. مراجعة المصدر تؤكد أن الواجهة لا تستدعي `/inventory-master-data/bootstrap` عندما تكون الحالة READY، ولا توجد واجهة manual rerun/reconcile بديلة.

لذلك لم يتم اختراع POST مخفي أو استدعاء service/API مباشر كدليل نهائي. النتيجة الصحيحة هي حجب R3 Browser Acceptance، مع بقاء Official DB دون أي mutation.

## 2. Preconditions

تمت قراءة جميع التقارير المطلوبة، وGates السابقة مثبتة:

- R1: `PASS_PHASE_03A_R1_REFERENCE_SCHEMA_GAP_CLOSURE_DESIGN_READY`.
- R1A: `PASS_PHASE_03A_R1A_FIRST_RUN_MASTER_DATA_BOOTSTRAP_DESIGN_READY`.
- R2: `PASS_PHASE_03A_R2_MINIMUM_SAFE_SOURCE_FIRST_RUN_BOOTSTRAP_IMPLEMENTATION`.
- B2: `PASS_PHASE_03A_B2_FRESH_POST_R2_VERIFIED_BACKUP`.

## 3. Safety Backup Reverification

| Item | Actual |
|---|---|
| Backup | `darfus_erp_POST_R2_FULL_20260818_095351.dump` |
| Host size | 646,071 bytes |
| SHA-256 | `844DECEB230C0E3A6766C172780321A4F6B894385053C6BB75D8354000E2A3F1` |
| Required SHA-256 | Same |
| `pg_restore -l` | PASS |
| TOC entries | 1,186 |
| Older backups | Preserved |

The container temp file was recreated only for archive verification and removed afterward; no DB operation was involved.

## 4. Official Environment Identity

| Target | Result |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:8000` |
| PostgreSQL container | `darfus-postgres` |
| Database | `darfus_erp` |
| DB user | `postgres` |
| PostgreSQL | 16.15 |

## 5. Runtime Status

- Frontend main page HTTP: 200.
- Backend `/api/health`: 200 / UP.
- Backend `/api/health/db`: 200 / PostgreSQL connected.
- Backend `/api/health/redis`: 200 / Redis connected.
- PostgreSQL container: running/healthy.
- Redis container: running/healthy.
- No restart and no build.

## 6. Baseline Before

Read-only baseline before browser navigation:

| Entity | Count |
|---|---:|
| SequelizeMeta | 83 |
| profile_master_data | 659 |
| pearl_size_master_data | 39 |
| barcode_inventory_codes / item_codes | 5 / 20 |
| barcode_sequences | 0 |
| bootstrap states | 1 |
| audit_logs | 23 |
| suppliers / locations / settings | 0 / 0 / 0 |
| purchase_orders / items | 0 / 0 |
| assets | 0 |
| inventory_asset_movements | 0 |
| asset_origins / cost revisions / valuations | 0 / 0 / 0 |
| payments | 0 |
| journal_entries / lines | 0 / 0 |
| idempotency_requests | 0 |

## 7. Canonical Master Data Before

All R2 canonical counts matched: Certificate 16; Diamond Tone 14; Tone Level 9; Saturation 10; Position 7; Setting 47; Gem Position 7; Gem Setting 47; Gem Treatment 0. `Gübelin` was present; canonical `Gubelin`, `WT`, `WCH`, `ERR`, and `NLC` were absent.

## 8. Authentication Proof

PASS. The existing browser session loaded the protected dashboard and the protected Gold By Weight page without redirecting to login. No user was created and no credentials/token were entered or exposed.

## 9. Company Context Proof

PASS. The authenticated dashboard rendered the existing user context (`Elsayed`); the Gold By Weight page rendered the server-backed company/currency context (`Gold ERP`, `AED`) and an explicit branch identifier. No company context was supplied by the browser for the bootstrap action.

## 10. Setup Route Browser Proof

PASS for route load. Real browser URL:

`http://localhost:3000/ar/setup`

Rendered state:

`Setup complete — The first workspace is ready. Sign in with the account you just created.`

The only visible action was `Go to login`. There was no Inventory Master Data Bootstrap or Replay control, no blank page, and no bootstrap-related browser exception.

## 11. Network Request Evidence

The setup page performs a status read (`/setup/status`) and renders READY. The main backend read-only status endpoint returned 200 with `{"state":"READY","action":"LOGIN"}`.

Required browser-originated bootstrap POST evidence was not available because the READY UI intentionally suppresses the first-run form and does not expose a manual replay action. Source inspection confirms the READY branch renders only the setup-complete notice; no frontend caller for `/inventory-master-data/bootstrap` exists.

Result: `BROWSER_NETWORK_REQUEST = FAIL_FOR_REQUIRED_BOOTSTRAP_POST`.

## 12. Backend Runtime Evidence

Health and setup-status handlers were reachable on the main backend. The inventory bootstrap handler was not invoked because no approved UI action exists in the READY state. No direct POST/API/service call was used as a substitute.

Result: `BACKEND_BOOTSTRAP_HANDLER = NOT_INVOKED_BY_APPROVED_BROWSER_PATH`.

## 13. Bootstrap Replay Result

Not observed through the real browser. The expected replay values therefore remain unclaimed rather than fabricated:

| Replay field | Result |
|---|---|
| New profile rows | NOT_OBSERVED — UI suppressed by READY |
| New Pearl rows | NOT_OBSERVED — UI suppressed by READY |
| New barcode rows | NOT_OBSERVED — UI suppressed by READY |
| Updates | NOT_OBSERVED |
| Deletes | NOT_OBSERVED |
| Conflicts | NOT_OBSERVED |

The pre-existing R2 direct service replay proof remains valid evidence for R2, but is not counted as R3 browser proof.

## 14. Bootstrap State After

Read-only DB verification after browser navigation:

`row count = 1`, dataset `INVENTORY_REFERENCE_MASTER_DATA`, version `2`, state `READY`, unchanged manifest hash `d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c`.

## 15. Master Data Counts After

Counts remained unchanged: profile 659, Pearl 39, inventory codes 5, item codes 20, sequences 0. All canonical R2 category counts remained unchanged.

## 16. Duplicate Proof

Read-only duplicate checks returned zero for canonical profile keys, Pearl identities, barcode inventory codes, barcode item codes, and bootstrap company/dataset state.

## 17. Barcode Sequence Proof

`barcode_sequences = 0` before and after browser navigation. No Asset or barcode allocation occurred.

## 18. Unauthorized Business Mutation Check

All forbidden business counts remained unchanged at zero: suppliers, locations, settings, purchase orders/items, assets, movements, origins, cost revisions, valuations, payments, journals/lines, and idempotency requests.

`UNAUTHORIZED_BUSINESS_TABLE_MUTATIONS = 0`.

## 19. Audit Reconciliation

`audit_logs = 23` before and after. `AUDIT_DELTA = 0`. No replay audit was emitted because no bootstrap replay was triggered.

## 20. Browser Console Review

No bootstrap-related console error was observed. Logs contained only React DevTools/HMR informational messages and no blocker related to setup, auth, company scope, or bootstrap.

## 21. Backend Log Review

No correlated bootstrap POST existed to review. Backend health/status checks returned 200, and no 5xx, rollback, duplicate-key, auth-bypass, or unhandled bootstrap error was observed. No restart was performed to alter logs.

## 22. Main Runtime Health

PASS for the existing main runtime: frontend 200, backend UP, database connected, and Redis connected.

## 23. Optional Focused Test Recheck

Not rerun in R3. The exact R2 focused subset had already passed 17/17 immediately before B2, and no source code changed in R3.

## 24. Baseline After

Read-only after-navigation baseline remained:

`SequelizeMeta=83`, `profile_master_data=659`, `pearl_size_master_data=39`, barcode inventory/item `5/20`, sequences `0`, bootstrap states `1`, audit `23`, and all forbidden business tables unchanged at zero.

## 25. Before/After Reconciliation

| Area | Result |
|---|---|
| Official DB identity | PASS |
| R2 master data | PASS / unchanged |
| Bootstrap state | PASS / unchanged |
| Business tables | PASS / zero delta |
| Audit | PASS / zero delta |
| Browser setup route | PASS / READY visible |
| Browser bootstrap replay | BLOCKED / no approved UI action |

## 26. Git Safety

No source file was changed. No reset, clean, restore, stash, checkout overwrite, commit, push, add, build, migration, or config edit was performed. `AGENTS.md` and `next-env.d.ts` were not touched. Only this R3 report was created in the project docs.

## 27. Files Created

- `docs/DARFUS_PHASE_03A_R3_FIRST_RUN_BOOTSTRAP_BROWSER_NETWORK_RUNTIME_ACCEPTANCE_CLOSURE_REPORT.md`

No source or DB files were created or changed by R3.

## 28. Remaining Out-of-Scope Work

- An approved UI action or separately approved browser acceptance path for safe Inventory Master Data replay is required.
- No automatic patch was applied to add such an action.
- Supplier/Location/VAT configuration, GBW/GBP final acceptance, Diamond/Gem/Pearl work, and Phase 03B remain out of scope.

## 29. Phase 03A Closure Matrix

| Area | Required Result |
|---|---|
| Main Frontend | PASS |
| Main Backend | PASS |
| Official DB | PASS |
| Authentication | PASS |
| Company Context | PASS |
| Setup Route | PASS |
| Browser UI | PASS — READY state visible |
| Network Request | BLOCKED — no bootstrap POST exposed |
| Backend Handler | BLOCKED — not invoked by approved UI |
| Bootstrap State | PASS |
| Replay Idempotency | NOT PROVEN in R3 browser |
| Profile Master Count | PASS |
| Pearl Master Count | PASS |
| Barcode Taxonomy | PASS |
| Barcode Sequences | PASS |
| Duplicate Check | PASS |
| Unauthorized Business Mutation | PASS |
| Git Safety | PASS |

## 30. Gate

`GATE = BLOCKED_PHASE_03A_R3_BROWSER_ACCEPTANCE`

The blocker is the absence of an approved real-browser Bootstrap/Replay action in the already-READY UI. This control did not patch the product or invoke a hidden endpoint.

## 31. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PHASE-03A-R3-FIRST-RUN-BOOTSTRAP-BROWSER-NETWORK-RUNTIME-ACCEPTANCE-CLOSURE
PHASE = 03A-R3
PHASE_NAME = FIRST_RUN_BOOTSTRAP_BROWSER_NETWORK_RUNTIME_ACCEPTANCE_CLOSURE
MAIN_FRONTEND = http://localhost:3000
MAIN_BACKEND = http://localhost:8000
OFFICIAL_DB = darfus_erp
SAFETY_BACKUP_FILE = darfus_erp_POST_R2_FULL_20260818_095351.dump
SAFETY_BACKUP_SHA256 = 844DECEB230C0E3A6766C172780321A4F6B894385053C6BB75D8354000E2A3F1
BACKUP_SHA256_MATCH = YES
PG_RESTORE_LIST = PASS
MAIN_FRONTEND_RUNTIME = PASS
MAIN_BACKEND_RUNTIME = PASS
OFFICIAL_DB_IDENTITY = PASS
AUTHENTICATION = PASS
COMPANY_CONTEXT = PASS
SETUP_ROUTE_BROWSER = PASS
BROWSER_NETWORK_REQUEST = FAIL_REQUIRED_BOOTSTRAP_POST_NOT_EXPOSED
BACKEND_BOOTSTRAP_HANDLER = NOT_INVOKED_APPROVED_BROWSER_PATH
BOOTSTRAP_DATASET = INVENTORY_REFERENCE_MASTER_DATA
BOOTSTRAP_VERSION = 2
BOOTSTRAP_STATE = READY
BOOTSTRAP_STATE_ROWS_AFTER = 1
BOOTSTRAP_MANIFEST_HASH_AFTER = d3114cd90653b7aea5c1aa582b294fced65db073be3320e60e8c2b75b2d69f6c
PROFILE_MASTER_DATA_BEFORE = 659
PROFILE_MASTER_DATA_AFTER = 659
PEARL_SIZE_BEFORE = 39
PEARL_SIZE_AFTER = 39
BARCODE_INVENTORY_BEFORE = 5
BARCODE_INVENTORY_AFTER = 5
BARCODE_ITEM_BEFORE = 20
BARCODE_ITEM_AFTER = 20
BARCODE_SEQUENCES_BEFORE = 0
BARCODE_SEQUENCES_AFTER = 0
BROWSER_REPLAY_NEW_PROFILE_ROWS = NOT_OBSERVED_UI_SUPPRESSED_READY
BROWSER_REPLAY_NEW_PEARL_ROWS = NOT_OBSERVED_UI_SUPPRESSED_READY
BROWSER_REPLAY_NEW_BARCODE_ROWS = NOT_OBSERVED_UI_SUPPRESSED_READY
BROWSER_REPLAY_UPDATES = NOT_OBSERVED
BROWSER_REPLAY_DELETES = NOT_OBSERVED
BOOTSTRAP_DUPLICATES = 0
UNAUTHORIZED_BUSINESS_TABLE_MUTATIONS = 0
AUDIT_DELTA = 0
SOURCE_CODE_CHANGED = NO
MIGRATIONS_CREATED = 0
MIGRATIONS_APPLIED = 0
PROVISIONING_PERFORMED = NO_NEW_CANONICAL_ROWS_EXPECTED
ASSET_WRITES = 0
PURCHASE_ORDER_WRITES = 0
MOVEMENT_WRITES = 0
PAYMENT_WRITES = 0
JOURNAL_BUSINESS_WRITES = 0
BARCODE_SEQUENCE_CONSUMPTION = 0
BUILD_RUN = NO
PHASE_03A_BROWSER_ACCEPTANCE = FAIL
PHASE_03A_NETWORK_ACCEPTANCE = FAIL
PHASE_03A_BACKEND_RUNTIME_ACCEPTANCE = FAIL_NOT_INVOKED_BY_BROWSER
PHASE_03A_OFFICIAL_DB_ACCEPTANCE = PASS
PHASE_03A_FINAL_CLOSED = NO
GATE = BLOCKED_PHASE_03A_R3_BROWSER_ACCEPTANCE
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_APPROVED_BROWSER_REPLAY_ACTION_OR_SEPARATE_ACCEPTANCE_CONTROL
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. Phase 03B and all feature acceptance batches were not started.
