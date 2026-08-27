# DARFUS ERP — Inventory Count Integrity Final Proof

Control ID: `DARFUS-INVENTORY-COUNT-INTEGRITY-FINAL-PROOF-01`  
Master stage: `INVENTORY_COUNT_STABILIZATION`  
Master step: `4_OF_8`  
Execution mode: Test/Prevention Hardening + Disposable Proof

## 1. Executive Summary

تم تنفيذ Step 4 على المصدر والاختبارات وDisposable Clone فقط. أُضيف اختبار مركز لسيناريو Expected=3 / Observe=1 / Complete، ثم أُجري runtime proof معزول على Clone مستقل لإثبات أن العدّ الجزئي ينتج MATCHED للمرصود وMISSING لغير المرصود، وليس MATCHED تلقائيًا.

النتائج الرئيسية:

- Expected=3 / Observe=1 / Complete: Matched=1، Missing=2، Unexpected=0، Variance=2.
- Runtime Clone Expected=9 / Observe=1 / Complete: Matched=1، Missing=8، Unexpected=0، Variance=8.
- جميع missing rows لا تحمل `scanMethod=BARCODE_SCAN`.
- Create/Start/Observe/Complete/Close exact replay: PASS.
- Same-key changed body conflict: PASS.
- Active Count concurrency guard: PASS، Count نشط واحد فقط.
- Company/Branch/Location scope: PASS.
- Asset/Movement/Accounting deltas على Clone: 0.
- Official `darfus_erp`: read-only، business delta=0.

لا يوجد Product defect مثبت، ولا تم تعديل Business Logic أو Migration أو قاعدة البيانات الرسمية.

## 2. Master Plan Position

| Step | Status |
|---|---|
| Step 1 — Eligibility + Lifecycle Visibility | CLOSED |
| Step 2 — Reason / Status UX | CLOSED |
| Step 3 — Full Disposable E2E + Physical Semantics | CLOSED |
| Step 4 — Count Integrity Final Proof | CURRENT / COMPLETE |
| Step 5 — AR/EN Final Browser Acceptance | LATER; not started |
| Step 6 — Cancel / Abandon Decision | LATER; not started |
| Step 7 — Preserved Sessions Handling | LATER |
| Step 8 — Final Inventory Count Closure | LATER |

Client-requirements parity work was not started.

## 3. Source Invariant Check

`STEP3_SOURCE_INVARIANTS_STILL_PRESENT = YES`

The following source invariants remain present:

| Invariant | Evidence |
|---|---|
| Start freezes expected set | `backend/src/services/inventory-audit-canonical.service.js:63-79` creates one item per eligible Asset in company/branch/location scope |
| Initial state is not observed | Start creates `status="missing"`, `result=null` |
| Observe is physical evidence | `...service.js:82-121` resolves identity/scope/frozen membership and sets MATCHED plus `observedAt`/`scanMethod` |
| Complete finalizes unresolved items | `...service.js:125-131` updates only rows with `result=null` to MISSING |
| Close is document state only | `...service.js:134-140` updates the Count status/closure metadata |
| Server summary is result-based | `backend/src/routes/erp.routes.js:6093-6111` |
| UI summary is status/result-based | `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx:28-36` |
| Central idempotency and transactions | canonical routes around `erp.routes.js:6140-6248` |

No source drift invalidating Step 3 was found.

## 4. Expected3/Observe1/Complete Test

Focused test added:

`backend/tests/inventory-count-physical-semantics.test.cjs`

The isolated in-memory model harness exercises the canonical service functions without touching the official DB:

| Point | Result |
|---|---|
| Expected Assets | 3 |
| Observe submitted | 1 Asset, `BARCODE_SCAN` |
| Before Complete | 1 MATCHED, 2 result-null, 1 scan method |
| After Complete | 1 MATCHED, 2 MISSING |
| Unexpected | 0 |
| Variance | 2 |
| Missing rows with `BARCODE_SCAN` | 0 |
| Asset identity/status/branch/location snapshot | unchanged |

`TEST_EXPECTED3_OBSERVE1_COMPLETE = PASS`

The test directly locks the prevention rule: Complete may stamp a finalization timestamp, but it does not create physical scan evidence for missing rows.

## 5. Frozen Snapshot Integrity

Disposable runtime proof confirmed:

- Start created a frozen expected set of 9 items.
- Reload/query after Start preserved the same item membership.
- Observe changed result/evidence on one expected row only.
- Complete changed unresolved rows to MISSING.
- Close changed the Count document state only.
- Asset snapshot (`id`, barcode, status, branch, location) before/after was identical.

No lifecycle mutation was applied to an Asset after Start; the required invariant was proven without widening the scope with an unrelated Asset workflow.

`FROZEN_SNAPSHOT_IMMUTABILITY = PASS`

## 6. Exactly-Once

Disposable runtime used the canonical HTTP routes and exact idempotency keys:

| Action | Exact replay | Result |
|---|---|---|
| Create | same body/key | 201 replay; one Count persisted |
| Create changed body, same key | conflict | 409 |
| Start | same body/key | 200 replay; one expected item set |
| Observe | same body/key | 200 replay; no duplicate item |
| Observe changed body, same key | conflict | 409 |
| Complete | same body/key | 200 replay; no duplicate transition |
| Close | same body/key | 200 replay; no duplicate transition |

```text
CREATE_EXACTLY_ONCE = PASS
START_EXACTLY_ONCE = PASS
OBSERVE_EXACTLY_ONCE = PASS
COMPLETE_EXACTLY_ONCE = PASS
CLOSE_EXACTLY_ONCE = PASS
IDEMPOTENCY_CONFLICT = PASS
```

## 7. Concurrency

Two overlapping Create requests were sent for the same company + branch + location with different audit numbers and keys.

- One request returned `201`.
- One request returned `409`.
- Final active Count count for the scope was `1`.

`ACTIVE_COUNT_CONCURRENCY_GUARD = PASS`

## 8. Scope Integrity

| Scope | Evidence | Result |
|---|---|---|
| Company | Wrong company context was rejected with `403`; no cross-company read was returned | PASS |
| Branch | Wrong-branch Asset rejected by canonical eligibility guard; prior Step 3 runtime reason `ASSET_BRANCH_MISMATCH` | PASS |
| Location | Canonical source and focused policy tests reject location mismatch; frozen set is location-scoped | PASS |
| Company + Branch + Location active uniqueness | Count creation/query is scoped to all three values | PASS |

No fallback to a global branch or global Asset pool was observed.

## 9. Summary Math

### Scenario A — partial physical observation

```text
Expected = 3
Matched = 1
Missing = 2
Unexpected = 0
Variance = Missing + Unexpected = 2
```

`SUMMARY_SCENARIO_A = PASS`

### Scenario B — zero variance baseline

The accepted Step 3 disposable proof covered the all-observed case:

```text
Expected = 9
Matched = 9
Missing = 0
Unexpected = 0
Variance = 0
```

`SUMMARY_SCENARIO_B = PASS`

### Scenario C — unexpected

The canonical Observe path requires frozen expected membership and rejects an Asset outside the frozen set. It does not create an EXTRA row in the current canonical flow.

`UNEXPECTED_CREATION_PATH = NOT_IMPLEMENTED_BY_CURRENT_CANONICAL_FLOW`

No EXTRA path was invented.

`SUMMARY_MATH = PASS`

## 10. Asset Integrity

Disposable proof compared the complete Asset snapshot before and after Count actions:

| Field | Delta |
|---|---:|
| Asset IDs | 0 |
| Barcodes | 0 |
| Operational status | 0 |
| Branch/location | 0 |
| Inventory ownership fields represented in the snapshot | 0 |

`ASSET_ID_DELTA = 0`  
`BARCODE_DELTA = 0`  
`ASSET_STATUS_DELTA = 0`  
`ASSET_BRANCH_LOCATION_DELTA = 0`

Count evidence remains separate from Asset lifecycle authority.

## 11. Inventory Movement Integrity

Clone `inventory_asset_movements` count was unchanged across the partial Count, exact replays, rejection paths, and concurrency create proof.

`COUNT_MOVEMENT_DELTA = 0`

No P1 inventory side effect was found.

## 12. Accounting Integrity

Clone `journal_entries` and available accounting-side tables (`journal_lines`, cash/treasury, payable/payment/liability tables where present) were unchanged.

```text
COUNT_ACCOUNTING_DELTA = 0
OPTIONAL_ACCOUNTING_TABLES_UNCHANGED = YES
```

No journal, cash, payable, or liability effect was created by Count.

## 13. Count Evidence Integrity

The Count itself persisted legitimate evidence in the Clone:

| Evidence | Result |
|---|---|
| Count documents | +2: one closed proof Count and one concurrency winner |
| Count item rows | +9 for the 9-item proof Count |
| MATCHED row | 1 |
| MISSING rows | 8 |
| `observedAt` on matched row | present |
| `scanMethod` on matched row | `BARCODE_SCAN` |
| `scanMethod` on missing rows | absent |
| Status transitions | draft → in-progress → completed → closed |
| Idempotency evidence | successful results retained by the canonical route contract |

`COUNT_EVIDENCE_PRESERVATION = PASS`

## 14. API/DB/UI Read Model Parity

### API ↔ DB

The server read model derives:

```text
expected = item row count
counted = result MATCHED
missing = result MISSING
unexpected = result EXTRA
```

The runtime final rows matched these formulas exactly for Expected=9 / Matched=1 / Missing=8 / Unexpected=0.

`API_DB_SUMMARY_PARITY = PASS`

### UI ↔ API

The UI helper derives counted/missing/unexpected from `status` with result fallback. During `in-progress`, Start initializes `status=missing/result=null`; therefore the UI can show those unresolved expected rows as missing before Complete while the API `missingCount` remains result-based and zero until finalization. This is an explicit timing semantic, not a physical-match conversion.

After Complete/Close, status and result align and the UI/API totals are equal.

`UI_API_SUMMARY_PARITY = PASS_WITH_IN_PROGRESS_TIMING_SEMANTIC_DOCUMENTED`

## 15. Focused Tests

Command:

```text
node --test backend/tests/inventory-count-physical-semantics.test.cjs backend/tests/inventory-count-eligibility-reason.test.cjs backend/tests/stage-b-b3-inventory-count.test.cjs tests/inventory-count-active-session-discovery.test.cjs
```

Result:

```text
35 tests passed
0 failed
```

Coverage includes the new Expected3/Observe1/Complete regression, eligibility, scope, idempotency contracts, frozen set, active Count discovery, read-first resume, localization, and no automatic retry/mutation behavior.

`FOCUSED_TESTS = PASS`

## 16. Typecheck/Build

```text
npm run typecheck
```

Result: exit code 0.

`TYPECHECK = PASS`

Build was not run on the main application in this control. No product source changed, and the current guardrail protects the known generated Next runtime drift; the disposable runtime used the already-built isolated frontend/backend proof path from Step 3.

`BUILD = SKIPPED_WITH_ACCEPTED_REASON_NO_PRODUCT_SOURCE_CHANGE_AND_NEXT_RUNTIME_DRIFT_PROTECTED`

## 17. Disposable Runtime

Fresh Clone:

```text
DISPOSABLE_DATABASE = darfus_erp_count_integrity_1787675847346
DISPOSABLE_RUNTIME_IDENTITY = PASS
```

The temporary backend connected to the Clone; `current_database()` matched the Clone name before mutations. The official database was not used as a write target.

Runtime mutation evidence:

| Operation | Result |
|---|---|
| Expected set | 9 |
| One physical observation | 1 |
| Matched | 1 |
| Missing | 8 |
| Unexpected | 0 |
| Variance | 8 |
| Missing rows without scan method | 8 |
| Asset delta | 0 |
| Movement delta | 0 |
| Accounting delta | 0 |
| Clone cleanup | Dropped and verified absent |

The temporary runtime had no remaining listeners after shutdown.

`DISPOSABLE_CLONE_DROPPED = YES`

## 18. Main DB No-Write Proof

Read-only before/after checks on `darfus_erp` remained:

```text
current_database = darfus_erp
stock_audits = 5
stock_audit_items = 24
assets = 18
inventory_asset_movements = 62
journal_entries = 25
asset_events = 65
```

| Entity | Delta |
|---|---:|
| `stock_audits` | 0 |
| `stock_audit_items` | 0 |
| `assets` | 0 |
| `inventory_asset_movements` | 0 |
| `journal_entries` | 0 |
| `asset_events` | 0 |

`MAIN_COUNT_DELTA = 0`  
`MAIN_ITEM_DELTA = 0`  
`MAIN_ASSET_DELTA = 0`  
`MAIN_MOVEMENT_DELTA = 0`  
`MAIN_ACCOUNTING_DELTA = 0`  
`MAIN_BUSINESS_WRITE_DELTA = 0`

No official browser mutation was used.

## 19. Prevention Lessons

### LL-040 — Expected Inventory Is Not Physical Observation

```text
ROOT_CAUSE = Prior acceptance report omitted multi-barcode request cardinality.
WHAT_ALLOWED_IT_TO_HAPPEN = HTTP request count was mistaken for physical item observation count.
MINIMUM_FIX = Add item-level regression and report request cardinality plus item evidence.
PREVENTION_GATE = Expected=3 -> Observe=1 -> Complete -> Matched=1 / Missing=2.
TEST_TO_PREVENT_REGRESSION = backend/tests/inventory-count-physical-semantics.test.cjs
MODULES_AFFECTED = Inventory Count tests/reporting.
```

No new defect class was found and no Business Logic fix was authorized.

## 20. Remaining Risks

| Risk | Status |
|---|---|
| Cancel/Abandon | Not implemented; Step 6 only |
| AR/EN final browser acceptance | Not started; Step 5 only |
| EXTRA creation | Not implemented by canonical flow; do not infer an EXTRA path |
| In-progress API/UI timing difference | Documented; no source change made |
| Existing worktree drift | Preserved; no cleanup/reset/stash |

## 21. Gate

All Step 4 success-gate conditions passed. No P0 or P1 blocking defect was found.

```text
GATE = PASS_INVENTORY_COUNT_INTEGRITY_FINAL_PROOF
```

This does not authorize Step 5 or any official Count. Owner review is required before progression.

## 22. Final Tokens

```text
CURRENT_CONTROL = DARFUS-INVENTORY-COUNT-INTEGRITY-FINAL-PROOF-01
MASTER_STAGE = INVENTORY_COUNT_STABILIZATION
MASTER_STEP = 4_OF_8
OFFICIAL_DATABASE = darfus_erp
STEP3_SOURCE_INVARIANTS_STILL_PRESENT = YES
TEST_EXPECTED3_OBSERVE1_COMPLETE = PASS
REPRO_EXPECTED = 3
REPRO_OBSERVED = 1
REPRO_MATCHED = 1
REPRO_MISSING = 2
REPRO_UNEXPECTED = 0
REPRO_VARIANCE = 2
FROZEN_SNAPSHOT_IMMUTABILITY = PASS
CREATE_EXACTLY_ONCE = PASS
START_EXACTLY_ONCE = PASS
OBSERVE_EXACTLY_ONCE = PASS
COMPLETE_EXACTLY_ONCE = PASS
CLOSE_EXACTLY_ONCE = PASS
IDEMPOTENCY_CONFLICT = PASS
ACTIVE_COUNT_CONCURRENCY_GUARD = PASS
COMPANY_SCOPE = PASS
BRANCH_SCOPE = PASS
LOCATION_SCOPE = PASS
SUMMARY_MATH = PASS
ASSET_STATUS_DELTA = 0
ASSET_BRANCH_LOCATION_DELTA = 0
COUNT_MOVEMENT_DELTA = 0
COUNT_ACCOUNTING_DELTA = 0
COUNT_EVIDENCE_PRESERVATION = PASS
API_DB_SUMMARY_PARITY = PASS
UI_API_SUMMARY_PARITY = PASS_WITH_IN_PROGRESS_TIMING_SEMANTIC_DOCUMENTED
FOCUSED_TESTS = PASS
FOCUSED_TEST_COUNT = 35
TYPECHECK = PASS
BUILD = SKIPPED_WITH_ACCEPTED_REASON_NO_PRODUCT_SOURCE_CHANGE_AND_NEXT_RUNTIME_DRIFT_PROTECTED
DISPOSABLE_DATABASE = darfus_erp_count_integrity_1787675847346
DISPOSABLE_RUNTIME_IDENTITY = PASS
DISPOSABLE_CLONE_DROPPED = YES
MAIN_COUNT_DELTA = 0
MAIN_ITEM_DELTA = 0
MAIN_ASSET_DELTA = 0
MAIN_MOVEMENT_DELTA = 0
MAIN_ACCOUNTING_DELTA = 0
MAIN_BUSINESS_WRITE_DELTA = 0
LL_040 = CLOSED_FOR_STEP4_WITH_MANDATORY_REGRESSION_TEST_ADDED
PRODUCT_BUSINESS_LOGIC_CHANGED = NO
MIGRATION_CREATED = NO
CANCEL_ABANDON_IMPLEMENTED = NO
CLIENT_REQUIREMENTS_WORK_STARTED = NO
P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 0
P3_COUNT = 1
GATE = PASS_INVENTORY_COUNT_INTEGRITY_FINAL_PROOF
NEXT_MASTER_STEP = 5_OF_8_ONLY_IF_PASS
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No Step 5, main Count mutation, Cancel, Abandon, production action, or automatic next batch was started.
