# DARFUS ERP — Inventory Count AR/EN Final Browser Acceptance

Control ID: `DARFUS-INVENTORY-COUNT-AR-EN-FINAL-BROWSER-ACCEPTANCE-01`  
Master stage: `INVENTORY_COUNT_STABILIZATION`  
Master step: `5_OF_8`  
Execution mode: Real Browser + Runtime Parity; stopped at first UX stop condition

## 1. Executive Summary

تم بدء Step 5 على Disposable Clone جديد فقط. نجح بناء وتشغيل الـFrontend المؤقت، وثبت اتصال الـBackend بالـClone. في AR تم تسجيل الدخول، اختيار Branch-1، اختيار مخزن-7، وإنشاء/بدء Count واحد.

عند فتح الجرد الحالي من جديد قبل أي Observe، ظهرت للمستخدم:

```text
المتوقع = 9
المعدود = 0
المفقود = 9
الفروقات = 9
```

لكن DB أثبتت أن العناصر التسعة كلها ما زالت:

```text
status = missing
result = NULL
observed_at = NULL
scan_method = NULL
```

هذا يجعل عبارة `المفقود` و`الفروقات` مضللة قبل Complete، لأنها توحي بفقد نهائي بينما الحالة الفعلية هي Not Counted Yet / Unobserved. تم التوقف فورًا حسب الخطة قبل أي Observe أو SOLD scan أو Complete أو Close أو EN flow.

`AR_IN_PROGRESS_UNOBSERVED_SEMANTIC = FAIL`  
`STEP4_P3_TIMING_SEMANTIC = UX_DEFECT_PROVEN`  
`GATE = BLOCKED_STEP5_IN_PROGRESS_UNOBSERVED_UX_MISLEADING`

لا يوجد Backend/Asset/Movement/Accounting defect مثبت في هذه المحاولة، ولم ينفذ أي إصلاح.

## 2. Master Plan Position

| Step | Status |
|---|---|
| Step 1 — Eligibility + Lifecycle Visibility | CLOSED |
| Step 2 — Reason / Status UX | CLOSED |
| Step 3 — Full Disposable E2E + Physical Semantics | CLOSED |
| Step 4 — Count Integrity Final Proof | CLOSED |
| Step 5 — AR/EN Final Browser Acceptance | BLOCKED at AR in-progress UX |
| Step 6 — Cancel / Abandon Decision | NOT STARTED |
| Step 7 — Preserved Sessions Handling | NOT STARTED |
| Step 8 — Final Inventory Count Closure | NOT STARTED |

Client-requirements parity work was not started.

## 3. Runtime Parity

Disposable Frontend build was created from the current worktree in a temporary directory and completed with Webpack. The temporary runtime served the current stock-audit route successfully.

| Check | Result |
|---|---|
| Temporary frontend build | PASS |
| `/ar/inventory/stock-audit` load | PASS |
| Current source route included | PASS |
| ChunkLoadError | 0 observed |
| Missing SSR chunk | 0 observed |
| Temporary backend health | HTTP 200 |
| Temporary backend port | 8001 |
| Temporary frontend port | 3001 |
| Official frontend/backend used for mutation | NO |

`FRONTEND_RUNTIME_PARITY = PASS`

The first temporary-build issues were isolated to the disposable copy: Turbopack rejected a junction and a copied stale `.next` referenced a removed test page. The temporary copy was rebuilt with Webpack after removing only its own generated outputs; no product source or main build was changed.

## 4. Disposable Environment

| Item | Value |
|---|---|
| Disposable DB | `darfus_erp_count_browser_1787676425954` |
| DB identity | `SELECT current_database()` matched exact Clone name |
| Temporary backend | `http://127.0.0.1:8001` |
| Temporary frontend | `http://localhost:3001` |
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Branch | Branch-1 / `BRA-1787464306683` |
| Location | مخزن-7 / HOUSE-7 / `LOC-2ca3af2d-e01a-454c-a625-4951d0925927` |
| Eligible barcodes | `GWRNG21000001`, `GWPND21000001`, `GPRNG21000001`, `GPRNG21000002`, `DDBRH21000001`, `DDBRH21000002`, `DDLOS00000001`, `GSRNG21000001`, `GSLOS00000001` |
| SOLD barcode | `GWRNG21000002` |
| Wrong-scope barcode | `GPRNG21000003` |

`DISPOSABLE_RUNTIME_IDENTITY = PASS`

## 5. AR Browser Flow

Completed before stop:

1. Loaded `/ar/inventory/stock-audit`.
2. Confirmed Arabic page labels and Branch context.
3. Selected Branch-1.
4. Selected مخزن-7 / HOUSE-7.
5. Created one Count through the canonical UI.
6. Started the Count through the canonical UI.
7. Navigated away and returned through normal application links to discover the active Count; no F5 was used.
8. Active Count appeared with `COUNT-20260825170015-57fb1d77`.

At this point the active Count card displayed `المفقود=9` and `الفروقات=9` before any physical observation. The Stop Condition was met.

Not executed after stop:

- Open current Count button;
- eligible Observe;
- SOLD scan;
- wrong-scope scan;
- Complete;
- Close;
- closed-record open;
- EN browser flow.

`AR_ACTIVE_DISCOVERY = PASS`  
`AR_OPEN_RESUME = NOT_COMPLETED_DUE_STOP`

## 6. AR In-Progress Semantic

### Browser evidence

The AR active Count view showed:

```text
المتوقع = 9
المعدود = 0
المفقود = 9
غير متوقع = 0
الفروقات = 9
حالة الجرد = قيد التنفيذ
```

### DB evidence

The exact Clone Count was `in-progress` with 9 item rows:

| DB assertion | Count |
|---|---:|
| Item rows | 9 |
| `status=missing` | 9 |
| `result IS NULL` | 9 |
| `observed_at IS NULL` | 9 |
| `scan_method IS NULL` | 9 |
| `result=MATCHED` | 0 |

Therefore, the operator-facing word `المفقود` is not the final business result at this point. It is derived from the initialized status and is misleading in an in-progress Count.

`AR_IN_PROGRESS_UNOBSERVED_SEMANTIC = FAIL`

### Root cause

The current UI helper in `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx` counts:

```text
missing = item.status === "missing" OR item.result === "MISSING"
variance = missing + unexpected
```

The canonical Start state is `status=missing/result=null` until physical observation or Complete. The UI therefore presents initialized unresolved rows as final Missing and includes them in Variance before Complete.

### Minimum Safe Fix proposal — not executed

For `in-progress` only:

- display `غير معدود / لم يتم الجرد بعد` instead of final `مفقود`;
- display an explicit `Unobserved / Pending Count` total;
- keep final `مفقود/Missing` and Variance semantics based on finalized `result=MISSING` after Complete;
- preserve the existing backend state machine and Asset authority.

`BACKEND_CHANGE_REQUIRED = NO_PROVEN`

The fix was not implemented because the control requires stopping before a fix.

## 7. AR Eligibility/Lifecycle

SOLD and wrong-scope scans were not executed because the in-progress semantic stop condition occurred first.

The source-level localized reason contract remains present from Step 4, but this Step 5 browser control cannot mark the live AR browser tokens PASS without executing the stopped flow.

```text
AR_SOLD_REASON_LOCALIZATION = NOT_RUN_DUE_STOP
AR_LIFECYCLE_SEPARATION = NOT_RUN_DUE_STOP
```

## 8. AR Network

Observed intended AR mutation requests before the stop:

| Request | Status | Effect |
|---|---:|---|
| `POST /api/v1/inventory-v2/audits` | 201 | one Count created |
| `POST /api/v1/inventory-v2/audits/:id/start` | 200 | same Count started |

No Observe, Complete, Close, retry loop, duplicate POST, or browser refresh mutation occurred.

`AR_UNEXPECTED_MUTATION_COUNT = 0`  
`AR_DUPLICATE_MUTATION_EFFECT = 0`

## 9. EN Browser Flow

Not started. The control stops on the first failing AR in-progress semantic gate, before starting any EN mutations.

```text
EN_ACTIVE_DISCOVERY = NOT_RUN_DUE_AR_STOP
EN_OPEN_RESUME = NOT_RUN_DUE_AR_STOP
EN_IN_PROGRESS_UNOBSERVED_SEMANTIC = NOT_RUN_DUE_AR_STOP
EN_ELIGIBLE_SCAN = NOT_RUN_DUE_AR_STOP
EN_SOLD_REASON = NOT_RUN_DUE_AR_STOP
EN_LIFECYCLE_SEPARATION = NOT_RUN_DUE_AR_STOP
EN_COMPLETE = NOT_RUN_DUE_AR_STOP
EN_CLOSE = NOT_RUN_DUE_AR_STOP
EN_CLOSED_HISTORY = NOT_RUN_DUE_AR_STOP
EN_UNEXPECTED_MUTATION_COUNT = 0
```

## 10. EN In-Progress UX Proof

Not executed because the AR stop condition is locale-independent in the shared `countTotals` helper and must be resolved/approved before continuing.

`EN_IN_PROGRESS_UNOBSERVED_SEMANTIC = NOT_RUN_DUE_AR_STOP`

## 11. EN Eligibility/Lifecycle

Not run due the mandatory AR stop. No EN mutation or claim of EN acceptance was made.

## 12. EN Network

No EN browser mutation requests were sent.

## 13. AR/EN Business Parity

The shared source helper indicates the same behavior would apply to both locales, but EN browser parity was intentionally not exercised after the AR failure.

`AR_EN_BUSINESS_PARITY = NOT_PROVEN_DUE_AR_STOP`

## 14. Console/Runtime Health

| Check | Result |
|---|---|
| AR Console blockers | 0; `browserTab.dev.logs()` returned an empty list |
| EN Console blockers | Not run |
| React error / ChunkLoadError | 0 observed in AR |
| Backend 5xx | 0 during the tested AR path |
| Backend 4xx | no blocking 4xx in the successful login/Count path |
| Non-blocking 404 | upload icon asset GET 404 in runtime logs; not related to Count semantics |

`AR_CONSOLE_BLOCKERS = 0`  
`EN_CONSOLE_BLOCKERS = NOT_RUN_DUE_STOP`  
`NETWORK_5XX_BLOCKERS = 0`

## 15. No Manual Refresh

No manual F5 was used. Normal application navigation was sufficient to reveal the active Count. However, the full no-refresh acceptance cannot pass because the flow stopped before observing/completing the Count.

`NO_MANUAL_REFRESH_REQUIRED = NOT_COMPLETED_DUE_STOP`

## 16. Closed Read-Only UX

Not reached in this fresh browser scenario. The accepted Step 3 clone proof previously showed closed history as read-only, but this Step 5 fresh acceptance did not proceed to Close after the AR stop.

`CLOSED_COUNT_READ_ONLY_UX = NOT_RUN_DUE_STOP`

## 17. Browser DB Integrity

Partial AR Clone integrity before cleanup:

| Entity | Before AR browser flow | After stop | Delta |
|---|---:|---:|---:|
| Count document | baseline | +1 | +1 intended |
| Count item rows | baseline | +9 | +9 intended frozen snapshot |
| Assets | baseline | unchanged | 0 |
| Inventory movements | baseline | unchanged | 0 |
| Journals | baseline | unchanged | 0 |

All 9 item rows remained unobserved (`result=NULL`, no `scan_method`). No Asset/Movement/Accounting effect was caused by the browser flow.

```text
AR_BROWSER_DB_INTEGRITY = PASS_PARTIAL_STOP_BEFORE_FINALIZATION
EN_BROWSER_DB_INTEGRITY = NOT_RUN_DUE_STOP
```

## 18. Focused Regression

The Step 4 focused regression set remained green:

```text
node --test backend/tests/inventory-count-physical-semantics.test.cjs backend/tests/inventory-count-eligibility-reason.test.cjs backend/tests/stage-b-b3-inventory-count.test.cjs tests/inventory-count-active-session-discovery.test.cjs
```

Result: 35 passed, 0 failed.

`FOCUSED_TESTS = PASS`  
`FOCUSED_TEST_COUNT = 35`

## 19. Typecheck/Build

```text
npm run typecheck = PASS
```

The disposable frontend build completed successfully using Webpack after isolated temporary-copy cleanup. Main frontend build was not run.

`TYPECHECK = PASS`  
`BUILD = PASS_DISPOSABLE_CLONE_WEBPACK_BUILD`

## 20. Official Main Read-Only Smoke

Not started because the Clone acceptance failed before the post-Clone main smoke gate. No official browser navigation or mutation was used in this control.

```text
OFFICIAL_AR_READ_ONLY = NOT_RUN_DUE_CLONE_STOP
OFFICIAL_EN_READ_ONLY = NOT_RUN_DUE_CLONE_STOP
OFFICIAL_BROWSER_MUTATION_COUNT = 0
```

## 21. Main DB No-Write Proof

Official DB final read-only identity and counts:

```text
current_database = darfus_erp
stock_audits = 5
stock_audit_items = 24
assets = 18
inventory_asset_movements = 62
journal_entries = 25
asset_events = 65
```

No official mutation was executed.

```text
MAIN_COUNT_DELTA = 0
MAIN_ITEM_DELTA = 0
MAIN_ASSET_DELTA = 0
MAIN_MOVEMENT_DELTA = 0
MAIN_ACCOUNTING_DELTA = 0
MAIN_BUSINESS_WRITE_DELTA = 0
```

## 22. Clone Cleanup

- Temporary backend stopped.
- Temporary frontend stopped.
- No listeners remained on ports 8001/3001.
- Exact Clone `darfus_erp_count_browser_1787676425954` was dropped after identity verification.
- Post-cleanup database query returned no `darfus_erp_count_browser_*` database.
- Temporary frontend copy was removed after exact path verification.

`DISPOSABLE_CLONE_DROPPED = YES`

## 23. Remaining Risks

| Risk | Severity | Status |
|---|---|---|
| In-progress unresolved rows displayed as Missing/Variance before Complete | P2 UX/acceptance defect | Proven; fix not executed |
| AR SOLD/lifecycle browser proof | P2 acceptance gap | Not reached due stop |
| EN final browser proof | P2 acceptance gap | Not started by rule |
| Closed record browser proof | P3 acceptance gap | Not reached in fresh scenario |
| Main read-only smoke | P3 acceptance gap | Not reached after clone block |
| Cancel/Abandon | Out of scope | Step 6 only |

## 24. Gate

The success gate cannot pass because the AR in-progress semantic failed in the real browser. This is a product UX defect/acceptance blocker, not a backend physical-count defect.

```text
GATE = BLOCKED_STEP5_IN_PROGRESS_UNOBSERVED_UX_MISLEADING
```

Required next action is Owner review of the proposed UI-only semantic correction. No correction was implemented in this control.

## 25. Final Tokens

```text
CURRENT_CONTROL = DARFUS-INVENTORY-COUNT-AR-EN-FINAL-BROWSER-ACCEPTANCE-01
MASTER_STAGE = INVENTORY_COUNT_STABILIZATION
MASTER_STEP = 5_OF_8
OFFICIAL_DATABASE = darfus_erp
DISPOSABLE_DATABASE = darfus_erp_count_browser_1787676425954
DISPOSABLE_RUNTIME_IDENTITY = PASS
FRONTEND_RUNTIME_PARITY = PASS
AR_ACTIVE_DISCOVERY = PASS
AR_OPEN_RESUME = NOT_COMPLETED_DUE_STOP
AR_IN_PROGRESS_UNOBSERVED_SEMANTIC = FAIL
AR_ELIGIBLE_SCAN = NOT_RUN_DUE_STOP
AR_SOLD_REASON_LOCALIZATION = NOT_RUN_DUE_STOP
AR_LIFECYCLE_SEPARATION = NOT_RUN_DUE_STOP
AR_COMPLETE = NOT_RUN_DUE_STOP
AR_CLOSE = NOT_RUN_DUE_STOP
AR_CLOSED_HISTORY = NOT_RUN_DUE_STOP
AR_UNEXPECTED_MUTATION_COUNT = 0
EN_ACTIVE_DISCOVERY = NOT_RUN_DUE_AR_STOP
EN_OPEN_RESUME = NOT_RUN_DUE_AR_STOP
EN_IN_PROGRESS_UNOBSERVED_SEMANTIC = NOT_RUN_DUE_AR_STOP
EN_ELIGIBLE_SCAN = NOT_RUN_DUE_AR_STOP
EN_SOLD_REASON = NOT_RUN_DUE_AR_STOP
EN_LIFECYCLE_SEPARATION = NOT_RUN_DUE_AR_STOP
EN_COMPLETE = NOT_RUN_DUE_AR_STOP
EN_CLOSE = NOT_RUN_DUE_AR_STOP
EN_CLOSED_HISTORY = NOT_RUN_DUE_AR_STOP
EN_UNEXPECTED_MUTATION_COUNT = 0
AR_EN_BUSINESS_PARITY = NOT_PROVEN_DUE_AR_STOP
AR_CONSOLE_BLOCKERS = 0
EN_CONSOLE_BLOCKERS = NOT_RUN_DUE_STOP
NETWORK_5XX_BLOCKERS = 0
NO_MANUAL_REFRESH_REQUIRED = NOT_COMPLETED_DUE_STOP
CLOSED_COUNT_READ_ONLY_UX = NOT_RUN_DUE_STOP
AR_BROWSER_DB_INTEGRITY = PASS_PARTIAL_STOP_BEFORE_FINALIZATION
EN_BROWSER_DB_INTEGRITY = NOT_RUN_DUE_STOP
STEP4_P3_TIMING_SEMANTIC = UX_DEFECT_PROVEN
FOCUSED_TESTS = PASS
FOCUSED_TEST_COUNT = 35
TYPECHECK = PASS
BUILD = PASS_DISPOSABLE_CLONE_WEBPACK_BUILD
OFFICIAL_AR_READ_ONLY = NOT_RUN_DUE_CLONE_STOP
OFFICIAL_EN_READ_ONLY = NOT_RUN_DUE_CLONE_STOP
OFFICIAL_BROWSER_MUTATION_COUNT = 0
MAIN_COUNT_DELTA = 0
MAIN_ITEM_DELTA = 0
MAIN_ASSET_DELTA = 0
MAIN_MOVEMENT_DELTA = 0
MAIN_ACCOUNTING_DELTA = 0
MAIN_BUSINESS_WRITE_DELTA = 0
DISPOSABLE_CLONE_DROPPED = YES
CANCEL_ABANDON_IMPLEMENTED = NO
CLIENT_REQUIREMENTS_WORK_STARTED = NO
P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 1
P3_COUNT = 0
GATE = BLOCKED_STEP5_IN_PROGRESS_UNOBSERVED_UX_MISLEADING
NEXT_MASTER_STEP = 5_OF_8_REQUIRES_UI_DECISION_AND_RERUN
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No UI fix, Backend fix, Step 6, Cancel, Abandon, Main mutation, Client Requirements work, Production action, or automatic next batch was started.
