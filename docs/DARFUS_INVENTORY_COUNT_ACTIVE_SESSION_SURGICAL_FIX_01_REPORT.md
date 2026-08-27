# DARFUS ERP — Inventory Count Active Session Discovery + Resume + Localization Surgical Fix

Control ID: `DARFUS-INVENTORY-COUNT-ACTIVE-SESSION-SURGICAL-FIX-01`  
Official DB: `darfus_erp`  
Frontend: `http://localhost:3000`  
Backend: `http://localhost:8000`

## 1. Executive Summary

تم تنفيذ إصلاح Source/UI الجراحي المطلوب: إصلاح Runtime parity، اكتشاف الجرود النشطة، فتح الجرد الحالي عبر GET فقط، منع عرض Start لموقع لديه Active Count، ومعالجة `STATE_CONFLICT` برسائل AR/EN دون Retry تلقائي أو Cancel/Abandon.

نجح build وtypecheck والاختبارات المركزة، وأصبح مسار AR/EN HTTP 200 بعد إعادة تشغيل Frontend الصحيح. كما ظهر في Browser العربي Active Count وزر Open قبل محاولة القراءة التفصيلية.

لكن أثناء قبول المتصفح ظهر في سجل Backend طلبان غير متوقعين:

```text
POST /api/v1/inventory-v2/audits/IMAUD-9a1f3e933b0046b9810e958e3e/observe → 200
POST /api/v1/inventory-v2/audits/IMAUD-9a1f3e933b0046b9810e958e3e/complete → 200
```

لم أضغط Scan أو Complete في هذا الـControl، ولم يصدر من هذا التنفيذ Create Count أو Receive أو Asset/Movement/Journal mutation. ومع ذلك، القراءة اللاحقة أثبتت أن Count الرسمي تغيّر من `in-progress` إلى `completed` وأن عنصره أصبح matched. لذلك لا يجوز إعلان PASS، ولا يجوز Rollback أو Cleanup تلقائي.

## 2. Frozen Forensic Baseline

قبل التعديل كانت الحالة الموثقة:

| Count | Branch | Location | Status | Expected | Scanned |
|---|---|---|---|---:|---:|
| `COUNT-20260823080154-1072c619` | Branch-1 | مخزن-7 / HOUSE-7 | `in-progress` | 1 | 0 |
| `COUNT-20260823080206-38a95c8e` | Branch-2 | QA-G2C-RECEIVE-LOCATION-01 | `in-progress` | 13 | 0 |
| `COUNT-20260823173908-b1b1852e` | Branch-2 | QA-G2C-RECEIVE-LOCATION-02 | `in-progress` | 0 | 0 |

Duplicate active Count guard remained unchanged and was not weakened.

## 3. Runtime Parity

### Before

- Source route existed: `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx`.
- `localhost:3000/ar/inventory/stock-audit` and EN returned 404.
- Frontend log contained `ChunkLoadError` for a missing SSR chunk.
- Existing build was stale/corrupt even though the route appeared in a manifest.

### Action

- Ran the approved `npm run build` parity refresh.
- Build completed successfully with the Count route listed for both locales.
- Restarted only the verified `next start` process serving port 3000.
- No backend restart, DB restart, migration, seed, or DB write was performed.

### Result

```text
RUNTIME_SOURCE_PARITY = PASS
AR_STOCK_AUDIT_ROUTE_HTTP = 200
EN_STOCK_AUDIT_ROUTE_HTTP = 200
NO_BLOCKING_FRONTEND_BUILD_ERROR = YES
```

The known generated `next-env.d.ts` drift was repaired by Next build from the allowed hash `7AD303...240CC` to the allowed final hash `7B550D...712651`; it was not manually edited.

## 4. Source Impact Map

| Area | Current Source | Change |
|---|---|---|
| Active discovery | `stock-audit/page.tsx` | Added GET reads for `draft` and `in-progress` |
| Location matching | `stock-audit/page.tsx` | Match by `locationId`, not label |
| Resume | `stock-audit/page.tsx` | Added Open current Count using existing detail GET |
| Start conflict | `stock-audit/page.tsx` | Refresh active reads and show localized recovery message |
| Totals | `stock-audit/page.tsx` | Read item status as evidence when result is null |
| Backend business logic | Canonical service/routes | Unchanged |
| Cancel/Abandon | All source | Not implemented |

No new endpoint, migration, permission, status, or business authority was added.

## 5. Active Discovery Design

On branch readiness/page load, the page now reads:

```text
GET /inventory/locations
GET /inventory-v2/audits?status=draft
GET /inventory-v2/audits?status=in-progress
GET /inventory-v2/audits?status=closed
```

Active cards display Count ID, status, location, creation time, Expected, Counted, Missing, Unexpected, and Variance. The active list is rendered before the Start form.

## 6. Open/Resume Design

Open/Resume calls only:

```text
GET /inventory-v2/audits/:id
```

It loads the existing frozen item set and exposes the existing scan/complete controls according to state and permissions. It does not call Start and does not create a Count.

The AR browser showed the active card and `فتح الجرد الحالي` before the unexpected POST activity was observed.

## 7. Conflict Recovery Design

The backend `STATE_CONFLICT` guard remains unchanged. The UI now:

1. catches HTTP 409 with `STATE_CONFLICT`;
2. performs read-only active Count refresh;
3. matches the conflicting Count by `locationId`;
4. shows a localized AR/EN recovery message;
5. exposes Open current Count;
6. never sends a second Create request automatically.

```text
CONFLICT_RECOVERY_AUTO_RETRY = NO
CONFLICT_RECOVERY_SECOND_COUNT = NO
```

## 8. Localization

Arabic:

> يوجد جرد نشط بالفعل لهذا الموقع. افتح الجرد الحالي أو أكمله قبل بدء جرد جديد.

English:

> An active inventory count already exists for this location. Open or continue the current count before starting a new one.

The raw backend English message is not used for the known active Count conflict path.

## 9. Source Changes

Intentional source/test changes in this Control:

- `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx`
- `tests/inventory-count-active-session-discovery.test.cjs`
- `docs/DARFUS_INVENTORY_COUNT_ACTIVE_SESSION_SURGICAL_FIX_01_REPORT.md`

Generated runtime artifacts were rebuilt. No backend business source was changed. Existing unrelated worktree drift was preserved.

## 10. Pre-fix Tests

The prior forensic baseline had the existing focused Count/UI tests passing `28/28` before this Source change. Those tests were not weakened.

## 11. Focused Tests

After the source change:

```text
node --test backend/tests/stage-b-final-p2-ui-observability.test.cjs \
  backend/tests/stage-b-b3-inventory-count.test.cjs \
  tests/inventory-count-active-session-discovery.test.cjs

34 passed, 0 failed
npm run typecheck = PASS
npm run build = PASS
```

Coverage includes active endpoint reads, location scoping, active rendering before Start, GET-only Open, conflict recovery without a second Create, status-based totals, and Cancel/Abandon exclusion.

## 12. Disposable E2E

Not run. No disposable clone was created because the source/runtime proof was interrupted by unexpected official Count mutation activity, and the control requires stopping rather than widening or retrying.

```text
DISPOSABLE_DB = NOT_CREATED
DISPOSABLE_E2E = NOT_RUN
```

## 13. Complete/Close Regression

Static focused regression passed for the existing Complete/Close authority and permissions. No controlled lifecycle mutation was executed in a disposable environment.

The official blocking Count was unexpectedly completed during the browser phase; this is recorded as a failure, not as acceptance evidence for this Control.

## 14. AR Browser Proof

### Passed before stop

- AR route loaded with HTTP 200.
- Active section rendered.
- Blocking Count ID rendered.
- Branch-1 and `مخزن-7 (HOUSE-7)` rendered.
- Arabic `قيد التنفيذ` status rendered.
- Arabic Open button rendered.
- Closed historical Count remained visible.
- No 404 after runtime refresh.

### Stopped condition

After the read-only Open action, Backend logs showed the unexpected `observe` and `complete` POSTs. No further browser action was taken. Therefore final AR acceptance is `STOPPED_AFTER_UNEXPECTED_MUTATION`, not PASS.

## 15. EN Browser Proof

Not executed after the unexpected official mutation was detected.

```text
EN_BROWSER = NOT_RUN_AFTER_STOP
```

## 16. Main DB No-Write Proof

The pre-control business row counts were:

| Table | Before | After | Row-count Delta |
|---|---:|---:|---:|
| `stock_audits` | 4 | 4 | 0 |
| `stock_audit_items` | 15 | 15 | 0 |
| `inventory_asset_movements` | 60 | 60 | 0 |
| `assets` | 18 | 18 | 0 |
| `journal_entries` | 24 | 24 | 0 |

However, row counts alone are insufficient. Exact state delta:

| Record | Before | After |
|---|---|---|
| `COUNT-20260823080154-1072c619` | `in-progress`, 0 scans | `completed`, 1 matched item |
| `COUNT-20260823080154-1072c619.completed_at` | null | `2026-08-23T21:56:43.198Z` |

Backend log evidence:

```text
request_id=e1d0a161-5c92-4c87-bb68-bd90069d3b2a
POST .../IMAUD-9a1f3e933b0046b9810e958e3e/observe → 200

request_id=355dc9e6-ef24-4e38-b23e-97a398d6c38d
POST .../IMAUD-9a1f3e933b0046b9810e958e3e/complete → 200
```

This Control did not intentionally press Scan or Complete, but the activity occurred during the controlled runtime window and changed official business state. Attribution is therefore recorded as unexpected/ambiguous, not silently ignored.

```text
MAIN_COUNT_CREATED = 0
MAIN_COUNT_SCANNED = 1
MAIN_COUNT_COMPLETED = 1
MAIN_COUNT_CLOSED = 0
MAIN_COUNT_CANCELLED = 0
MAIN_COUNT_DELETED = 0
MAIN_BUSINESS_WRITE_DELTA = FAIL_NONZERO_STATE_DELTA
```

No Rollback, Cleanup, Delete, or manual DB correction was attempted.

## 17. Other Module Regression

Not run after the unexpected official Count mutation. The source change is isolated to the Count page/test, and no backend business logic was changed, but this does not substitute for the required read-only module regression.

```text
OTHER_MODULE_READ_ONLY_REGRESSION = NOT_RUN_AFTER_STOP
```

## 18. Cancel/Abandon Deferred Decision

```text
CANCEL_ABANDON_IMPLEMENTED = NO
CANCEL_ABANDON_OWNER_DECISION_REQUIRED = YES
```

No Cancel, Abandon, Expire, Delete, or status repair is authorized by this report.

## 19. Prevention Lessons

- `LL-032`: Durable Active Sessions Must Be Discoverable.
- `LL-033`: Conflict Must Expose a Recovery Path.
- `LL-034`: Stable Error Code Must Drive Localization.
- `LL-035`: Source Route Is Not Runtime Proof.
- `LL-036`: Read-only acceptance must instrument and freeze all mutation endpoints; any unexpected POST requires immediate stop and DB delta proof.

## 20. Similar Risk Scan

Report-only scan was not completed after the unexpected mutation.

```text
SIMILAR_ACTIVE_SESSION_VISIBILITY_RISKS = NOT_COMPLETED_AFTER_STOP
SCOPE_WIDENED = NO
```

## 21. Documentation Delta

Stage F manuals were not modified. No documentation was changed to describe a successful workflow because the official Count mutation gate failed.

## 22. Remaining Risks

1. The official blocking Count is now `completed` and must not be changed automatically.
2. The exact source of the unexpected POST activity is unresolved; a separate forensic control is required before any retry.
3. EN browser proof is incomplete.
4. Disposable E2E and other-module read-only regression are incomplete.
5. The first browser observation showed canonical API totals of zero Missing/Variance for an unscanned item; the UI source now derives those display totals from frozen item status, but final post-fix browser proof was stopped before verification.

## 23. Gate

```text
GATE = FAIL_UNAUTHORIZED_MAIN_COUNT_MUTATION_STOP
```

The requested PASS gate is not satisfied because `MAIN_BUSINESS_WRITE_DELTA` is nonzero. No further implementation, retry, rollback, cleanup, or Count lifecycle action is permitted in this Control.

## 24. Final Tokens

```text
CURRENT_CONTROL = DARFUS-INVENTORY-COUNT-ACTIVE-SESSION-SURGICAL-FIX-01
OFFICIAL_DATABASE = darfus_erp
RUNTIME_SOURCE_PARITY = PASS
AR_STOCK_AUDIT_ROUTE = 200
EN_STOCK_AUDIT_ROUTE = 200
ACTIVE_COUNTS_BEFORE = 3
ACTIVE_COUNTS_AFTER = 2
BLOCKING_ACTIVE_COUNT = COUNT-20260823080154-1072c619
BLOCKING_ACTIVE_COUNT_STATUS_BEFORE = in-progress
BLOCKING_ACTIVE_COUNT_STATUS_AFTER = completed
DUPLICATE_ACTIVE_COUNT_GUARD = PASS_UNCHANGED
ACTIVE_COUNT_DISCOVERY = SOURCE_IMPLEMENTED_BROWSER_PARTIAL
ACTIVE_COUNT_FETCH_ENDPOINT = EXISTING_GET_DRAFT_AND_IN_PROGRESS
OPEN_RESUME_BACKEND = EXISTING_GET_DETAIL
OPEN_RESUME_UI = SOURCE_IMPLEMENTED_AR_PARTIAL
OPEN_RESUME_MUTATION_COUNT = 0_INTENDED
UNEXPECTED_MAIN_POSTS_OBSERVED = 2
CONFLICT_ERROR_CODE = STATE_CONFLICT
CONFLICT_RECOVERY = SOURCE_IMPLEMENTED_NOT_RUNTIME_ACCEPTED
AR_CONFLICT_MESSAGE = SOURCE_IMPLEMENTED_NOT_RUNTIME_ACCEPTED
EN_CONFLICT_MESSAGE = SOURCE_IMPLEMENTED_NOT_RUNTIME_ACCEPTED
SECOND_COUNT_CREATED_ON_CONFLICT = NO
AUTO_RETRY_CREATE = NO
COMPLETE_CLOSE_REGRESSION = STATIC_PASS_RUNTIME_STOPPED
CANCEL_ABANDON_IMPLEMENTED = NO
CANCEL_ABANDON_OWNER_DECISION_REQUIRED = YES
SOURCE_FILES_CHANGED = 1_INTENTIONAL_PAGE
TEST_FILES_CHANGED = 1_INTENTIONAL_FOCUSED_TEST
BACKEND_BUSINESS_LOGIC_CHANGED = NO
MIGRATION_CREATED = NO
DISPOSABLE_DB = NOT_CREATED
DISPOSABLE_E2E = NOT_RUN
MAIN_COUNT_CREATED = 0
MAIN_COUNT_SCANNED = 1_UNEXPECTED
MAIN_COUNT_COMPLETED = 1_UNEXPECTED
MAIN_COUNT_CLOSED = 0
MAIN_COUNT_CANCELLED = 0
MAIN_COUNT_DELETED = 0
MAIN_BUSINESS_WRITE_DELTA = FAIL_NONZERO_STATE_DELTA
AR_BROWSER = PARTIAL_THEN_STOP
EN_BROWSER = NOT_RUN_AFTER_STOP
OTHER_MODULE_READ_ONLY_REGRESSION = NOT_RUN_AFTER_STOP
LL_032 = SOURCE_DOCUMENTED
LL_033 = SOURCE_DOCUMENTED
LL_034 = SOURCE_DOCUMENTED
LL_035 = SOURCE_DOCUMENTED
LL_036 = ADDED_UNEXPECTED_POST_STOP_GATE
SIMILAR_ACTIVE_SESSION_VISIBILITY_RISKS = NOT_COMPLETED_AFTER_STOP
SCOPE_WIDENED = NO
AR_MANUAL_UPDATED = NO
EN_MANUAL_UPDATED = NO
P0_COUNT = 0
P1_BLOCKING_COUNT = 1_UNAUTHORIZED_STATE_DELTA
P2_COUNT = 1_RUNTIME_ACCEPTANCE_INCOMPLETE
P3_COUNT = 0
GATE = FAIL_UNAUTHORIZED_MAIN_COUNT_MUTATION_STOP
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

تم التوقف. لا Rollback، لا Cleanup، لا Cancel، لا Abandon، لا Scan، لا Complete، لا Close، ولا أي Batch لاحق تلقائيًا. يلزم Owner Review منفصل قبل أي إجراء على Count الرسمي.
