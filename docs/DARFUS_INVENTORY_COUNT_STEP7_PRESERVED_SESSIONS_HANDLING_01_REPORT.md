# DARFUS ERP — Inventory Count Step 7 Preserved Sessions Handling

Control ID: `DARFUS-INVENTORY-COUNT-STEP7-PRESERVED-SESSIONS-HANDLING-01`  
Mode: `READ_ONLY_FIRST — NO DELETE — NO SQL PATCH — NO UNNECESSARY MUTATION`  
Official database: `darfus_erp`

## 1. Executive Summary

تم تنفيذ Step 7 كـRead-Only Session Triage على `darfus_erp`. أُعيدت قراءة كل Count غير مغلق، وتم تحليل النطاق والـlifecycle ومسار الاستئناف. لم يتم تنفيذ Observe أو Complete أو Close أو Cancel أو Abandon أو Delete أو SQL patch، ولم يتم إنشاء دليل مادي اصطناعي.

النتيجة: السجلات الثلاثة كلها محفوظة محليًا ولا يوجد Blocker حالي لعمليات Branch-1 أو لتسليم المنتج. سجل Branch-1 في حالة `completed`، وسجل Branch-2 الأول `in-progress` جزئيًا، وسجل Branch-2 الثاني `in-progress` بلا صفوف متوقعة؛ كل منها له تفسير ومسار قانوني أو تصنيف residue. لا يتم تنظيف قاعدة البيانات لمجرد جعلها تبدو نظيفة.

للسجل الجزئي تحديدًا، تم تطبيق التصحيح الحسابي المطلوب: إذا تم استدعاء Complete الآن دون Observations إضافية، فالنتيجة ستكون `Matched=2`, `Missing=11`, `Variance=11`، وليس Zero Variance. لذلك لم يتم الضغط على Complete ولم تتم أي محاولة لتصفير residue.

```text
STEP7_DECISION = PRESERVE_WITHOUT_MUTATION
REAL_CURRENT_OPERATIONAL_BLOCKER = NO
LOCAL_RESIDUE_DELIVERY_IMPACT = NONE
NO_ZERO_VARIANCE_ASSUMPTION_WITH_UNRESOLVED_ITEMS = PASS
GATE = PASS_STEP7_PRESERVED_SESSIONS_NO_MUTATION_REQUIRED
```

مخاطر قاعدة البيانات الرسمية: لا توجد كتابة صادرة من هذا الـControl، والأعداد بقيت `6 / 33 / 18 / 62 / 25 / 65`. لا يبدأ Step 8 تلقائيًا.

## 2. Master Plan Position

| Item | State | Evidence |
|---|---|---|
| Master stage | `INVENTORY_COUNT_STABILIZATION` | Current master-plan authority |
| Steps 1–5 | `CLOSED` | Accepted prior controls |
| Step 6 | `CLOSED` | `CANCEL_DECISION = NOT_REQUIRED`; Step 6 report |
| Step 7 | `CURRENT` | This control |
| Step 8 | `NOT_STARTED` | Not started by this control |

Steps 1–6 were not reopened and no feature, cleanup, or lifecycle mutation was introduced.

## 3. Current Non-Final Snapshot

### Official database proof

Read-only identity and counts:

```text
current_database() = darfus_erp
stock_audits = 6
stock_audit_items = 33
assets = 18
inventory_asset_movements = 62
journal_entries = 25
asset_events = 65
```

Status distribution:

```text
closed      = 3
completed   = 1
in-progress = 2
draft       = 0
```

`NON_FINAL_COUNT_COUNT = 3`.

The current `stock_audits` schema does not contain a physical `started_at` column. Therefore `started_at` is reported as `NOT_STORED`; start is proven by the lifecycle status and the presence/time of initialized audit items, not guessed as a timestamp.

| Count ID | Status | Company | Branch | Location | Created At | Started At | Completed At | Closed At | Expected rows | MATCHED | MISSING | EXTRA | result=NULL | Observed rows | Last activity |
|---|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| `COUNT-20260823080154-1072c619` | `completed` | Gold ERP | Branch-1 | مخزن-7 / HOUSE-7 | `2026-08-23 08:01:54Z` | `NOT_STORED` | `2026-08-23T21:56:43Z` | NULL | 1 | 1 | 0 | 0 | 0 | 1 | `2026-08-23 21:56:43Z` |
| `COUNT-20260823080206-38a95c8e` | `in-progress` | Gold ERP | Branch-2 | QA-G2C-RECEIVE-LOCATION-01 / QA-G2C-RECEIVE-LOC-01 | `2026-08-23 08:02:06Z` | `NOT_STORED` | NULL | NULL | 13 | 2 | 0 | 0 | 11 | 2 | `2026-08-25 16:41:18Z` |
| `COUNT-20260823173908-b1b1852e` | `in-progress` | Gold ERP | Branch-2 | QA-G2C-RECEIVE-LOCATION-02 / QA-G2C-RECEIVE-LOC-02 | `2026-08-23 17:39:08Z` | `NOT_STORED` | NULL | NULL | 0 | 0 | 0 | 0 | 0 | 0 | `2026-08-23 17:39:08Z` |

For the zero-item Count, the SQL aggregation uses `COUNT(i.id)`, so `expected rows = 0`; no synthetic expected Asset is inferred from the outer-join summary row.

## 4. Per-Session Classification

The required handling classes were applied exactly:

| Count ID | Handling class | Reason | Mutation |
|---|---|---|---:|
| `COUNT-20260823080154-1072c619` | `KEEP_AS_LOCAL_RESIDUE` | Completed, matched, no active uniqueness block, no delivery requirement to close it now. | 0 |
| `COUNT-20260823080206-38a95c8e` | `KEEP_AS_LOCAL_RESIDUE` | Partial in-progress QA session; no current user need or Branch-1 block proven. | 0 |
| `COUNT-20260823173908-b1b1852e` | `KEEP_AS_LOCAL_RESIDUE` | Zero-item in-progress QA session isolated to Branch-2 QA location; local reset makes it irrelevant to delivery. | 0 |

No session is classified as `BLOCKING_DEFECT_REQUIRES_OWNER_REVIEW`.

## 5. Operational Blocker Analysis

The canonical uniqueness rule is exact: `(company + branch + location)` and active statuses are only `draft` and `in-progress`.

| Count ID | Blocks exact-scope new Count? | Blocks Branch-1 current operation? | Blocks other locations? | Blocks final product delivery? | Evidence |
|---|---|---|---|---|---|
| `COUNT-20260823080154-1072c619` | NO | NO | NO | NO | `completed` is outside active uniqueness; Branch-1 evidence is matched. |
| `COUNT-20260823080206-38a95c8e` | YES, only Branch-2 + QA-G2C-RECEIVE-LOCATION-01 | NO | NO | NO | Exact Branch-2/location scope; 11 unresolved rows remain. |
| `COUNT-20260823173908-b1b1852e` | YES, only Branch-2 + QA-G2C-RECEIVE-LOCATION-02 | NO | NO | NO | Exact Branch-2/location scope; zero frozen expected rows. |

```text
REAL_CURRENT_OPERATIONAL_BLOCKER = NO
```

The two `in-progress` records are not labeled Branch-1 blockers. Their QA location names and prior accepted local evidence classify them as preserved local integration residue.

## 6. Completed Count Decision

Count: `COUNT-20260823080154-1072c619`

- Status is `completed`, not `draft` or `in-progress`.
- It does not participate in active uniqueness.
- It has one matched expected Asset, zero missing, zero unresolved, and zero extra rows.
- Canonical `Close` remains the only relevant terminal transition.
- No customer-delivery requirement requires it to be closed before the planned fresh delivery database.

Decision:

```text
HANDLING = KEEP_AS_LOCAL_RESIDUE
MUTATION = NO
```

No Close was issued merely to tidy the local database.

## 7. Partial In-Progress Decision

Count: `COUNT-20260823080206-38a95c8e`

Current physical evidence:

```text
Expected = 13
Matched = 2
result=NULL / unresolved = 11
Observed rows = 2
Missing before Complete = 0
```

Canonical hypothetical Complete result, if executed immediately:

```text
Matched = 2
Missing = 11
Unexpected = 0
Variance = 11
```

This Count cannot be represented as zero variance without legitimately observing the remaining expected Assets. No barcode was scanned, no fake observation was created, and Complete was not called.

The Count is in a QA-named Branch-2 location and does not block Branch-1 or final delivery. Therefore:

```text
HANDLING = KEEP_AS_LOCAL_RESIDUE
MUTATION = NO
NO_ZERO_VARIANCE_ASSUMPTION_WITH_UNRESOLVED_ITEMS = PASS
```

If a real operator later needs this exact physical count, the safe class would become `RESUME_ONLY_IF_REAL_OPERATIONAL_NEED`, followed by a separate Owner-approved mutation sub-gate before any Observe/Complete action.

## 8. Zero-Item In-Progress Decision

Count: `COUNT-20260823173908-b1b1852e`

- Status is `in-progress`.
- Frozen expected rows = 0.
- It is scoped to Branch-2 and the QA location `QA-G2C-RECEIVE-LOCATION-02`.
- It does not affect Branch-1/current operator scope or final product delivery.
- Completing/closing it only to make the database look clean would create an unnecessary lifecycle mutation.

Decision:

```text
HANDLING = KEEP_AS_LOCAL_RESIDUE
MUTATION = NO
```

## 9. Delivery Reset Relevance

Accepted development policy states that the current local database is an integration/test database and the customer delivery database/server will be fresh. Accordingly:

```text
LOCAL_RESIDUE_DELIVERY_IMPACT = NONE
```

This is a delivery-scope classification only. It does not authorize DELETE, SQL cleanup, status patching, force Close, or database reset in this control.

## 10. Recovery Path Source Check

`CURRENT_RECOVERY_PATHS_STILL_PRESENT = YES`.

| Requirement | Current source proof | Result |
|---|---|---|
| Active discovery | `loadActiveCounts()` reads `status=draft` and `status=in-progress` using validated Branch context. | PASS |
| Open current Count | Active cards call `openCount()`, which calls detail GET and sets the selected Count. | PASS |
| Open is read-first | `openCount()` does not call Start or any mutation route. | PASS |
| Observe guard | Backend `observeAudit` requires `in-progress` and enforces identity, branch, location, and frozen expected-set checks. | PASS |
| Complete guard | Backend `completeAudit` accepts only `in-progress`; unresolved rows become Missing evidence if the action is later authorized. | PASS |
| Close guard | Backend `closeAudit` accepts only `completed`. | PASS |
| Active uniqueness | `createAudit` checks only `draft`/`in-progress` for the same company/branch/location. | PASS |

Focused source-contract tests passed:

```text
node --test tests/inventory-count-active-session-discovery.test.cjs tests/inventory-count-step5-inprogress-ux.test.cjs
13 passed, 0 failed
npm run typecheck
PASS
```

No source file was edited in Step 7. The existing worktree remains dirty from prior work; no cleanup, reset, restore, or stash was performed.

## 11. Main DB No-Write Proof

Read-only snapshots before and after this control were unchanged:

| Table | Before | After | Delta |
|---|---:|---:|---:|
| `stock_audits` | 6 | 6 | 0 |
| `stock_audit_items` | 33 | 33 | 0 |
| `assets` | 18 | 18 | 0 |
| `inventory_asset_movements` | 62 | 62 | 0 |
| `journal_entries` | 25 | 25 | 0 |
| `asset_events` | 65 | 65 | 0 |

```text
CONTROL_ISSUED_BUSINESS_MUTATION = NO
MAIN_BUSINESS_WRITE_DELTA = 0
OBSERVE_EXECUTED = NO
COMPLETE_EXECUTED = NO
CLOSE_EXECUTED = NO
```

No Owner concurrent action was observed during the controlled read-only interval.

## 12. Prevention Lesson

`LL-044` was used by Step 6. The next available lesson ID is registered here without overwriting existing IDs.

### LL-045 — Preserved Test State Is Not a Cleanup Requirement

| Field | Decision |
|---|---|
| Root cause | Old local sessions can visually look like unfinished product work. |
| What allowed it | Clean-looking DB state can be confused with correct product state. |
| Minimum fix | Classify operational impact before any mutation. |
| Prevention gate | No preserved-session mutation unless a real current workflow blocker is proven. |
| Test to prevent regression | Read-only exact-scope blocker analysis. |
| Modules affected | Inventory Count acceptance / local integration DB handling. |
| Register status | `REGISTERED_THIS_CONTROL; NO_CODE_CHANGE` |

## 13. Remaining Risks

| ID | Risk | Classification | Severity | Impact | Disposition |
|---|---|---|---|---|---|
| STEP7-R01 | Two in-progress QA records remain capable of blocking a new Count only at their exact Branch-2 QA scopes. | DB_STATE / INVENTORY | P3 | No Branch-1 or delivery impact proven. | Preserve; handle only under real need or planned reset. |
| STEP7-R02 | Completed Branch-1 evidence remains unclosed. | DB_STATE / INVENTORY | P3 | No active uniqueness or delivery blocker. | Preserve; do not Close for aesthetics. |
| STEP7-R03 | A future operator may request the partial QA Count. | ACCEPTANCE_GAP | P3 | Any continuation must use real observations; immediate Complete would produce variance 11. | Separate Owner-approved mutation gate required. |
| STEP7-R04 | Worktree has pre-existing dirty/untracked files. | SOURCE_DRIFT | P3 | Attribution risk for future source changes. | No cleanup/reset/stash performed. |

No P0 or P1 blocker was proven. No P2 issue was proven in this control.

## 14. Gate

```text
CURRENT_RECOVERY_PATHS_STILL_PRESENT = YES
REAL_CURRENT_OPERATIONAL_BLOCKER = NO
LOCAL_RESIDUE_DELIVERY_IMPACT = NONE
NO_ZERO_VARIANCE_ASSUMPTION_WITH_UNRESOLVED_ITEMS = PASS
CONTROL_ISSUED_BUSINESS_MUTATION = NO
MAIN_BUSINESS_WRITE_DELTA = 0
STEP7_DECISION = PRESERVE_WITHOUT_MUTATION
P0_COUNT = 0
P1_BLOCKING_COUNT = 0
GATE = PASS_STEP7_PRESERVED_SESSIONS_NO_MUTATION_REQUIRED
```

## 15. Final Tokens

```text
CURRENT_CONTROL = DARFUS-INVENTORY-COUNT-STEP7-PRESERVED-SESSIONS-HANDLING-01
MASTER_STAGE = INVENTORY_COUNT_STABILIZATION
MASTER_STEP = 7_OF_8
OFFICIAL_DATABASE = darfus_erp
NON_FINAL_COUNT_COUNT = 3
COUNT_1_ID = COUNT-20260823080154-1072c619
COUNT_1_STATUS = completed
COUNT_1_HANDLING = KEEP_AS_LOCAL_RESIDUE
COUNT_2_ID = COUNT-20260823080206-38a95c8e
COUNT_2_STATUS = in-progress
COUNT_2_HANDLING = KEEP_AS_LOCAL_RESIDUE
COUNT_3_ID = COUNT-20260823173908-b1b1852e
COUNT_3_STATUS = in-progress
COUNT_3_HANDLING = KEEP_AS_LOCAL_RESIDUE
REAL_CURRENT_OPERATIONAL_BLOCKER = NO
LOCAL_RESIDUE_DELIVERY_IMPACT = NONE
CURRENT_RECOVERY_PATHS_STILL_PRESENT = YES
NO_ZERO_VARIANCE_ASSUMPTION_WITH_UNRESOLVED_ITEMS = PASS
CANCEL_ABANDON_IMPLEMENTED = NO
DELETE_EXECUTED = NO
SQL_PATCH_EXECUTED = NO
OBSERVE_EXECUTED = NO
COMPLETE_EXECUTED = NO
CLOSE_EXECUTED = NO
SOURCE_FILES_CHANGED = 0
MIGRATIONS = 0
MAIN_COUNT_DELTA = 0
MAIN_ITEM_DELTA = 0
MAIN_ASSET_DELTA = 0
MAIN_MOVEMENT_DELTA = 0
MAIN_ACCOUNTING_DELTA = 0
MAIN_BUSINESS_WRITE_DELTA = 0
STEP7_DECISION = PRESERVE_WITHOUT_MUTATION
PREVENTION_LESSON = LL-045 — Preserved Test State Is Not a Cleanup Requirement
P0_COUNT = 0
P1_BLOCKING_COUNT = 0
P2_COUNT = 0
P3_COUNT = 4 advisory risks documented; no blocker
STEP_7_FINAL_STATUS = PASS_PRESERVE_WITHOUT_MUTATION
GATE = PASS_STEP7_PRESERVED_SESSIONS_NO_MUTATION_REQUIRED
NEXT_MASTER_STEP = 8_OF_8_ONLY_IF_STEP7_PASS
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

Step 7 is complete as a read-only preservation decision. No Step 8, Count mutation, Delete, SQL patch, Cancel, Abandon, Client Requirements work, or Production action was started.

**FULL STEP 7 READ-ONLY SESSION TRIAGE COMPLETE → OWNER REVIEW → WAIT FOR EXPLICIT NEXT APPROVAL**
