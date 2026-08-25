# DARFUS ERP — Inventory Count Step 5 In-Progress UX Surgical Fix + Full AR/EN Rerun

Control ID: `DARFUS-INVENTORY-COUNT-STEP5-INPROGRESS-UX-SURGICAL-FIX-AND-RERUN-01`

## 1. Executive Summary

تم تنفيذ إصلاح واجهة محدود فقط لمعنى حالة الجرد أثناء `in-progress`، ثم أُعيد اختبار المسار كاملًا بالعربية والإنجليزية على Disposable Clone جديد. الإصلاح يفصل بين حالة الصف الانتقالية (`status=missing` مع `result=null`) والنتيجة النهائية، ويعرضها للمستخدم كـ«غير معدود» بدل «مفقود». كما يعيد التحقق من بطاقة الجرود النشطة بعد كل Observe دون تحديث يدوي.

نجح الاختبار المعزول: AR وEN، Expected=9، أول مسح 1/8، ثم 9/9، Complete وClose، مع رفض SOLD وخارج النطاق بسببين متوقعين. لم تتغير Assets أو Movements أو Journals. لم يتغير Backend أو DB schema أو Migration.

الـGate النهائي محجوب فقط لأن فحص الـMain على `localhost:3000/:8000` توقف عند `Branch readiness required`، ولأن نافذة المراجعة الكلية أظهرت قبل هذا الـcontrolled rerun delta خارجيًا على `darfus_erp` (+1 Stock Audit و+9 Audit Items) لا ينتمي إلى runtime الـClone. أثناء الـcontrolled rerun نفسه كان delta الرسمي = صفر.

## 2. Master Plan Position

- Step 5/8: In-Progress UX semantic correction and AR/EN rerun.
- Scope: UI semantic display, active-summary refresh, focused tests, disposable browser proof.
- Not in scope: backend behavior, accounting, inventory mutation, schema, migration, seed, cancellation/abandonment redesign, Client Requirements work.
- `CANCEL_ABANDON_IMPLEMENTED = NO`.

## 3. Proven Defect

Before the final correction, a fresh in-progress Count with nine initialized rows displayed:

| State | Before correction |
|---|---:|
| Expected | 9 |
| Counted | 0 |
| Missing | 9 |
| Variance | 9 |
| DB item state | `status=missing`, `result=NULL` |

This was semantically incorrect. The backend initializes transitional rows with `status=missing` and `result=NULL`; it only finalizes Missing during Complete. Treating `status` as final evidence was the product defect.

## 4. Root Cause Reconfirmation

`page.tsx` previously derived Missing from `item.status === "missing" || item.result === "MISSING"`. The corrected authority is `result`:

- `result=MATCHED` → Matched.
- `result=MISSING` → Missing.
- `result=EXTRA` → Unexpected.
- `result=NULL` while `in-progress` → Not Counted Yet.
- Final variance is `null` until Completed/Closed.

The second forensic pass also proved that the active-list endpoint may omit `items`. The helper now derives `unobserved` from the authoritative summary counters when detail rows are absent. Start now reloads the detail endpoint so initialized rows are visible immediately. Observe reloads both detail and active summaries.

## 5. Files Changed

Intentional files for this control:

- `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx`
- `components/inventory/count-semantics.ts`
- `tests/inventory-count-active-session-discovery.test.cjs`
- `tests/inventory-count-step5-inprogress-ux.test.cjs`
- This report.

No backend source, migration, configuration, official DB data, or accounting code was changed. The worktree contains extensive pre-existing drift; it was not cleaned, reset, stashed, or restored. The owner-accepted generated `next-env.d.ts` drift was not edited.

## 6. UI Semantic Design

`components/inventory/count-semantics.ts` centralizes:

- `isFinalizedCount`.
- `countItemDisplayState`.
- `countTotals`.

In progress now shows six distinct concepts: Expected, Counted, Not Counted Yet, Missing, Unexpected, and Final Variance not calculated yet. Completed/Closed exposes finalized Missing, Unexpected, and Variance. The row labels use the same result authority.

## 7. AR Copy

Verified browser copy:

- `المتوقع`
- `المعدود`
- `غير معدود`
- `المفقود`
- `غير متوقع`
- `الفروقات النهائية` / `غير محسوبة بعد`
- `متطابق`
- `مباعة حاليًا`
- `فرع مختلف` / `موقع مختلف`
- `مغلق`

## 8. EN Copy

Verified browser copy:

- `Expected`
- `Counted`
- `Not Counted Yet`
- `Missing`
- `Unexpected`
- `Final Variance` / `Not calculated yet`
- `Matched`
- `currently sold`
- `different branch` / `different location`
- `Closed`

## 9. Focused Tests

Command:

```text
node --test tests/inventory-count-active-session-discovery.test.cjs tests/inventory-count-step5-inprogress-ux.test.cjs
```

Result: `13 passed, 0 failed`.

Coverage includes fresh in-progress semantics, partial observation, active-list fallback counters, completed/closed variance, Observe active-summary revalidation, Start detail reload, read-first Open/Resume, and no automatic second create.

## 10. Typecheck / Build

- `npm run typecheck` → PASS.
- Main `npm run build` → PASS; Next.js 16.2.9, 125 static pages generated.
- Disposable frontend `npm run build -- --webpack` with API directed to `http://localhost:8001/api/v1` → PASS; 124 static pages generated.
- No Next dev server was started by this control.

## 11. Runtime Parity

The disposable frontend was built with:

- `NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1`.
- `NEXT_PUBLIC_API_ORIGIN=http://localhost:8001`.
- `NEXT_PUBLIC_DATA_SOURCE=api`.

The disposable backend listened on `8001`, frontend on `3001`, and the backend proved PostgreSQL identity as the new Clone. The official backend on `8000` was not used for mutation.

## 12. Disposable Environment

| Item | Evidence |
|---|---|
| Clone | `darfus_erp_count_browser_20260825175500` |
| Clone DB identity | `current_database() = darfus_erp_count_browser_20260825175500` |
| Clone baseline | `6 audits / 33 audit items / 18 assets / 62 movements / 25 journals / 65 asset events` |
| Runtime | backend `8001`, frontend `3001` |
| Mutation scope | only two Count sessions and their audit rows in Clone |
| Cleanup | runtime stopped, tabs closed, Clone dropped, temp frontend removed |

## 13. AR Browser Full Flow

AR route: `http://localhost:3001/ar/inventory/stock-audit`.

One Count was created and started for `Branch-1 / مخزن-7 (HOUSE-7)`.

1. Start: `Expected=9`, `Counted=0`, `Not Counted Yet=9`, `Missing=0`, `Final Variance=غير محسوبة بعد`.
2. First eligible scan `GWRNG21000001`: `Counted=1`, `Not Counted Yet=8`; the active summary updated without manual refresh.
3. SOLD `GWRNG21000002`: rejected with localized sold-state reason.
4. Wrong-scope `GPRNG21000003`: rejected with localized branch/location scope reason.
5. Remaining eight eligible barcodes were counted.
6. Before Complete: `9/9`, `Not Counted Yet=0`, final variance still not calculated.
7. Complete once: `Completed`, Missing=0, Unexpected=0, Variance=0.
8. Close once: `Closed` history evidence visible.

## 14. AR In-Progress Semantic Proof

The exact browser snapshot after Start contained nine rows all labeled `غير معدود`, while the DB rows remained transitional (`result=NULL`). After the first successful Observe, the card changed to `1 counted / 8 not counted / 0 missing / final variance not calculated`.

## 15. AR SOLD / Lifecycle Proof

The SOLD request returned the expected business rejection (`409` in backend log) and no Count row was added for it. The wrong-scope request returned the expected scope rejection (`409`) and no Count row was added. These are expected workflow guards, not failures.

## 16. AR Network

The controlled AR flow used the canonical routes:

- GET locations and Count lists.
- POST create once.
- POST start once.
- GET detail after Start.
- POST observe for each accepted barcode.
- GET detail and active lists after each accepted Observe.
- POST complete once.
- POST close once.

No 5xx occurred. The only non-2xx responses were the two expected eligibility `409` responses and the initial stale-session recovery before explicit login.

## 17. EN Browser Full Flow

EN route: `http://localhost:3001/en/inventory/stock-audit`.

One separate Count was created and started for the same DB location.

1. Start: `Expected=9`, `Counted=0`, `Not Counted Yet=9`, `Missing=0`, `Final Variance=Not calculated yet`.
2. First eligible scan `GWRNG21000001`: `Counted=1`, `Not Counted Yet=8`; active summary updated without manual refresh.
3. SOLD `GWRNG21000002`: rejected with `currently sold` proof.
4. Wrong-scope `GPRNG21000003`: rejected with `different branch/location` proof.
5. Remaining eight eligible barcodes were counted.
6. Before Complete: `9/9`, `Not Counted Yet=0`, final variance not calculated.
7. Complete once: `Completed`, Missing=0, Unexpected=0, Variance=0.
8. Close once: `Closed` history evidence visible.

## 18. EN In-Progress Semantic Proof

The exact browser snapshot after Start contained nine rows labeled `Not Counted Yet`. After the first successful Observe, the card changed to `1 counted / 8 not counted / 0 missing / final variance not calculated`.

## 19. EN SOLD / Lifecycle Proof

The SOLD and wrong-scope requests each produced the expected `409` business guard. No invalid asset was added to either Count.

## 20. EN Network

The same canonical request sequence as AR was observed on the EN route. No 5xx occurred. The backend recorded only expected eligibility `409` responses plus the initial pre-login stale-session recovery.

## 21. AR / EN Business Parity

| Assertion | AR | EN |
|---|---|---|
| Expected at Start | 9 | 9 |
| Counted at Start | 0 | 0 |
| Not Counted Yet at Start | 9 | 9 |
| First Observe | 1 / 8 | 1 / 8 |
| Final matched | 9 | 9 |
| Missing | 0 | 0 |
| Unexpected | 0 | 0 |
| Final variance | 0 | 0 |
| Close evidence | PASS | PASS |

`AR_EN_BUSINESS_PARITY = PASS`.

## 22. No Manual Refresh

`NO_MANUAL_REFRESH_REQUIRED = PASS` for the corrected Observe path. After a successful Observe, `scanBarcode` calls `loadCount` and `loadActiveCounts`; the active summary updated in both AR and EN immediately. No F5 or user refresh was used for that proof.

Open/Resume remains read-first and does not call Start; the focused source-contract test remains PASS. The earlier disposable full-flow run also proved navigation away/back and Open current behavior before this surgical active-summary addition.

## 23. Console / Network Health

- AR browser console blockers: 0.
- EN browser console blockers: 0.
- Clone workflow 5xx blockers: 0.
- Expected non-blocking asset upload icon GET 404s were observed in backend logs; they are unrelated to Inventory Count and do not affect the flow.
- Initial stale-session 401/refresh/logout sequence occurred before explicit login; login then returned 200 and the workflow completed.

## 24. Browser DB Integrity

Clone post-run proof:

| Audit | Status | Items | Matched | Missing | Unexpected | Unresolved | Barcode scans | Distinct Assets |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `COUNT-20260825175039-285d668b` AR | closed | 9 | 9 | 0 | 0 | 0 | 9 | 9 |
| `COUNT-20260825175131-1c3b7061` EN | closed | 9 | 9 | 0 | 0 | 0 | 9 | 9 |

Duplicate audit/asset rows: `0`.

Clone totals after:

`stock_audits=8`, `stock_audit_items=51`, `assets=18`, `inventory_asset_movements=62`, `journal_entries=25`, `asset_events=65`.

Relative to the Clone baseline, the only deltas were `+2 stock_audits` and `+18 stock_audit_items`. Assets, movements, journals, and asset events were unchanged.

## 25. Official Main Read-Only Smoke

Read-only smoke was performed against the existing Main browser/backend surface (`localhost:3000` / `localhost:8000`) without Count mutation. After login, both AR and EN Stock Audit routes reached:

- `Branch readiness required` / `Select an active Branch to continue`.

No Main Count could be started, observed, completed, or closed. Main browser console showed no application error blockers. This is an environment/context readiness blocker, not a proved Count UI defect.

## 26. Main DB No-Write Proof

The controlled rerun began with and ended with the following official snapshot:

`darfus_erp|6|33|18|62|25|65`

Therefore the official delta during this controlled rerun was zero, and this batch issued no official mutation request.

However, the broader audit window had an earlier unexplained external change before this controlled rerun:

- Initial observed official baseline: `darfus_erp|5|24|18|62|25|65`.
- Later official read-only observation before the clean rerun: `darfus_erp|6|33|18|62|25|65`.
- Difference: `+1 stock_audit`, `+9 stock_audit_items`, with Assets/Movements/Journals/Events unchanged.

The affected official audit was `COUNT-20260825172650-c010b637`. It was not created by the Clone runtime, whose DB identity was separately proven. This external delta prevents a clean continuous no-write claim across the entire audit window and requires Owner review.

## 27. Clone Cleanup

- `DISPOSABLE_CLONE_DROPPED = YES`.
- Temporary frontend `.tmp-count-browser-r6` removed.
- Temporary dump files removed.
- Browser tabs closed.
- Listeners on ports `3001` and `8001`: none after cleanup.
- Remaining `darfus_erp_count_browser_*` databases: none.

## 28. Prevention Lesson

The backend’s transitional `status=missing` is not final audit evidence. UI consumers must use `result` for item outcome and the finalized Count status for variance. List endpoints must not be treated as full detail responses; when item rows are omitted, summary counters must be used. Observe must revalidate active summaries when the same screen presents both current detail and active-session cards.

## 29. Remaining Risks

| ID | Risk | Severity | Classification | Effect |
|---|---|---|---|---|
| LL-041 | Official Count DB delta appeared outside the controlled Clone runtime | P1 | DB_STATE / ACCEPTANCE_GAP | Blocks a clean whole-window official no-write gate; requires Owner attribution. |
| LL-042 | Main browser lacks active Branch context on Stock Audit | P2 | ENVIRONMENT_CONFIG / ACCEPTANCE_GAP | Blocks Main AR/EN runtime proof; Clone proof remains valid. |
| LL-043 | Upload icon asset returns 404 in Clone logs | P3 | OBSERVABILITY / UX | Non-blocking unrelated asset request. |

`LL-041 = REGISTERED_AND_TESTED`.

## 30. Gate

The corrected UI behavior and disposable proof pass, but the overall Step 5 gate cannot be marked PASS because the required Main read-only runtime proof is blocked by Branch readiness and the broader official DB window contains an unexplained external delta.

```text
UI_SEMANTIC_FIX = PASS
AR_BROWSER_RERUN = PASS
EN_BROWSER_RERUN = PASS
NO_MANUAL_REFRESH_REQUIRED = PASS
DISPOSABLE_DB_INTEGRITY = PASS
OFFICIAL_MAIN_READ_ONLY = BLOCKED_BRANCH_READINESS
OFFICIAL_DB_WHOLE_WINDOW_NO_WRITE_PROOF = BLOCKED_UNEXPECTED_CONCURRENT_DELTA
GATE = BLOCKED_OFFICIAL_MAIN_READINESS_AND_CONCURRENT_DB_WRITE
STEP_5_FINAL_STATUS = BLOCKED_PENDING_OWNER_REVIEW
```

## 31. Final Tokens

```text
CURRENT_CONTROL = DARFUS-INVENTORY-COUNT-STEP5-INPROGRESS-UX-SURGICAL-FIX-AND-RERUN-01
MODE = MINIMUM_SAFE_UI_FIX_WITH_FULL_AR_EN_RERUN
ROOT_CAUSE_SOURCE_RECONFIRMED = YES
UI_ONLY_FIX = PASS
BACKEND_FILES_CHANGED = 0
FRONTEND_SOURCE_FILES_CHANGED = 2
TEST_FILES_CHANGED = 2
DOCUMENTATION_FILES_CHANGED = 1
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
OFFICIAL_DB_MUTATIONS_BY_THIS_BATCH = 0
OFFICIAL_DB_CONTROLLED_INTERVAL_DELTA = 0
OFFICIAL_DB_EXTERNAL_DELTA_OBSERVED = +1 stock_audit / +9 stock_audit_items before controlled rerun
DISPOSABLE_CLONE = darfus_erp_count_browser_20260825175500
DISPOSABLE_CLONE_DROPPED = YES
DISPOSABLE_RUNTIME_IDENTITY = PASS
FRONTEND_RUNTIME_PARITY = PASS
FRONTEND_INPROGRESS_SEMANTIC_TESTS = PASS
FOCUSED_TESTS = PASS
FOCUSED_TEST_COUNT = 13
TYPECHECK = PASS
BUILD = PASS
AR_BROWSER_FULL_FLOW = PASS
EN_BROWSER_FULL_FLOW = PASS
AR_EN_BUSINESS_PARITY = PASS
NO_MANUAL_REFRESH_REQUIRED = PASS
AR_CONSOLE_BLOCKERS = 0
EN_CONSOLE_BLOCKERS = 0
NETWORK_5XX_BLOCKERS = 0
CLONE_DB_INTEGRITY = PASS
ASSET_MOVEMENT_ACCOUNTING_DELTA_IN_CLONE = 0
OFFICIAL_AR_READ_ONLY = BLOCKED_BRANCH_READINESS
OFFICIAL_EN_READ_ONLY = BLOCKED_BRANCH_READINESS
OFFICIAL_BROWSER_MUTATION_COUNT = 0
CANCEL_ABANDON_IMPLEMENTED = NO
CLIENT_REQUIREMENTS_WORK_STARTED = NO
P0_COUNT = 0
P1_COUNT = 1
P2_COUNT = 1
P3_COUNT = 1
GATE = BLOCKED_OFFICIAL_MAIN_READINESS_AND_CONCURRENT_DB_WRITE
NEXT_MASTER_STEP = 5_OF_8_REQUIRES_OFFICIAL_MAIN_READINESS_AND_DB_BASELINE_DECISION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

Step 6 was not started. No official Count was created or changed by this control. Await Owner review of the Main Branch readiness and the unexplained official DB delta before any further acceptance.
