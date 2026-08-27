# DARFUS ERP — Inventory Count Active Session Visibility & Closure Forensic

Control ID: `DARFUS-INVENTORY-COUNT-ACTIVE-SESSION-FORENSIC-01`  
Mode: `READ_ONLY_FORENSIC`  
Official DB: `darfus_erp`  
Frontend under observation: `http://localhost:3000`  
Backend under observation: `http://localhost:8000`

## 1. Executive Summary

تم تنفيذ فحص Forensic للـInventory Count بدون إنشاء Count أو Scan أو Complete أو Close أو Cancel، وبدون تعديل Source أو Migration أو Seed.

السبب المباشر للحجب مثبت: يوجد Count بحالة `in-progress` لنفس Company/Branch/Location الخاصة بالموقع `مخزن-7 / HOUSE-7` في Branch-1. الحارس الخلفي يعمل كما هو مصمم ويرفض إنشاء Count ثانٍ للموقع نفسه. المشكلة التشغيلية هي أن واجهة Inventory Count لا تستعلم عن الجلسات النشطة ولا تعرض Open/Resume، ولذلك تعرض للمستخدم مسار “بدء جرد جديد” ولا تقدم طريقًا لاستعادة الجلسة الموجودة.

يوجد عيب Runtime إضافي مثبت في البيئة الحالية: المصدر يحتوي صفحة `/inventory/stock-audit`، لكن `localhost:3000/ar/inventory/stock-audit` أعاد 404 بعد المصادقة، لذلك لم يمكن إثبات عرض الشاشة الحالية من الـruntime نفسه. هذا لا يثبت عيبًا في منطق Count الخلفي، لكنه يثبت عدم تطابق بين Source الحالي والـFrontend runtime تحت الاختبار.

**الحالة:** Root cause مثبتة. لا يوجد إصلاح في هذا الـControl.

## 2. Official DB Baseline

تم التحقق قراءةً من:

```text
SELECT current_database() = darfus_erp
```

Current DB counts:

| Table | Count | Evidence |
|---|---:|---|
| `stock_audits` | 4 | read-only psql query |
| `stock_audit_items` | 15 | read-only psql query |
| `inventory_asset_movements` | 60 | read-only psql query |
| `assets` | 18 | read-only psql query |
| `journal_entries` | 24 | read-only psql query |

Status distribution: `closed = 1`, `in-progress = 3`, `draft = 0`.

## 3. Active Counts

Canonical active statuses are `draft` and `in-progress`.

| Audit Number | Status | Branch | Location | Expected Items | Matched | Missing | Unexpected | Classification |
|---|---|---|---|---:|---:|---:|---:|---|
| `COUNT-20260823080154-1072c619` | `in-progress` | Branch-1 | مخزن-7 / HOUSE-7 | 1 | 0 | 1 | 0 | Blocking active count; empty/unscanned evidence |
| `COUNT-20260823080206-38a95c8e` | `in-progress` | Branch-2 | QA-G2C-RECEIVE-LOCATION-01 | 13 | 0 | 13 | 0 | Preserved test/QA active evidence |
| `COUNT-20260823173908-b1b1852e` | `in-progress` | Branch-2 | QA-G2C-RECEIVE-LOCATION-02 | 0 | 0 | 0 | 0 | Empty active evidence |

`ACTIVE_COUNT_COUNT = 3`.

## 4. Blocking Location Match

The closed count visible in the historical evidence is:

`COUNT-20260823075745-dde82bfe` → Branch-1 → `مخزن-7 / HOUSE-7` → `closed`.

The active count at the same Company/Branch/Location is:

`COUNT-20260823080154-1072c619` → Branch-1 → `مخزن-7 / HOUSE-7` → `in-progress`.

Therefore:

```text
LOCATION_ACTIVE_COUNT_MATCH = PASS
BLOCKING_LOCATION_ID = LOC-2ca3af2d-e01a-454c-a625-4951d0925927
BLOCKING_LOCATION_LABEL = مخزن-7 / HOUSE-7
BLOCKING_BRANCH = Branch-1
BLOCKING_ACTIVE_COUNT = COUNT-20260823080154-1072c619
BLOCKING_ACTIVE_STATUS = in-progress
BLOCKING_ACTIVE_COUNT_HAS_SCANS = NO
```

## 5. Blocking Count Content

The blocking Count contains one frozen expected item:

| Asset | Barcode | Item Status | Result | Observed At | Scan Method |
|---|---|---|---|---|---|
| `AST-PUR-1787083585731-1-1-plz5` | `GWRNG21000001` | `missing` | null | null | null |

This is not a completed/closed Count and has no recorded observation. No evidence supports deleting or auto-closing it in this Control.

## 6. Historical Preserved Count Check

The closed historical Count has one matched item for the same Asset/Barcode:

```text
COUNT-20260823075745-dde82bfe
status       = closed
item_count   = 1
matched      = 1
missing      = 0
unexpected   = 0
asset        = AST-PUR-1787083585731-1-1-plz5
barcode      = GWRNG21000001
```

The active Count was created later and remained `in-progress`; this explains why the duplicate guard still blocks a new Count despite the earlier Count being closed.

## 7. Source Route/Service Map

### Frontend

Source: `app/[locale]/(dashboard)/inventory/stock-audit/page.tsx`

- `loadLocations()` reads `GET /inventory/locations`.
- `loadCountHistory()` reads only `GET /inventory-v2/audits?status=closed`.
- `loadCount(id)` can read a known ID, but no active ID is discovered by the page.
- Start uses `POST /inventory-v2/audits`, then `POST /inventory-v2/audits/:id/start`.
- Scan uses `POST /inventory-v2/audits/:id/observe`.
- Complete uses `POST /inventory-v2/audits/:id/complete`.
- Close uses `POST /inventory-v2/audits/:id/close`.
- No active/in-progress query, Open/Resume action, or Cancel/Abandon action exists in the page.

### Backend

Canonical routes in `backend/src/routes/erp.routes.js`:

- `GET /inventory-v2/audits` supports an optional status filter, including `in-progress`.
- `GET /inventory-v2/audits/:id` returns a scoped Count by Company and Branch.
- POST lifecycle routes exist for create, start, observe, complete, and close.
- No canonical `cancel` or `abandon` route was found.
- Historical legacy definitions are explicitly disabled or occur after the canonical route definitions and are not an alternative authority.

Canonical service: `backend/src/services/inventory-audit-canonical.service.js`.

## 8. UI Query/Rendering Map

### Expected

On load, the page should discover active Counts for the selected Branch and allow the operator to open/resume the exact Count before offering creation.

### Actual source behavior

The page effect calls only `loadLocations()` and `loadCountHistory()`. The latter hard-codes `status=closed`. When `count` is null, the page renders `Start a new count` and does not render an active-session warning or resume control.

### Runtime proof

The authenticated browser was navigated to:

```text
http://localhost:3000/ar/inventory/stock-audit
```

The current runtime returned:

```text
404 — This page could not be found.
```

The source route exists, but the running frontend did not expose it. This is a separate runtime/source-drift finding and prevented a positive visual proof of the source page.

`UI_FIRST_VISIBILITY_BREAK = frontend route/runtime 404; source-level first visibility break is missing active query before the Start form.`

## 9. Conflict Guard

Source: `backend/src/services/inventory-audit-canonical.service.js`, `createAudit`.

The guard queries the same `companyId`, `branchId`, and `locationId` with status in `draft`/`in-progress`, inside the caller transaction with a row lock. If found, it raises:

```text
409 STATE_CONFLICT
An active Inventory Count already exists for this location.
```

The route also claims the action through the existing inventory-count idempotency mechanism and rolls back the transaction on failure.

```text
DUPLICATE_GUARD_SCOPING = PASS
DUPLICATE_GUARD_ACTIVE_STATUSES = draft, in-progress
DUPLICATE_GUARD_TRANSACTION_LOCK = PASS
DUPLICATE_GUARD_IDEMPOTENCY = PASS
```

The guard is correct for the observed database state; the missing capability is discovery/recovery, not duplicate prevention.

## 10. Lifecycle Authority

| Action | Route | Permission | Source Evidence | State Authority |
|---|---|---|---|---|
| Create | `POST /inventory-v2/audits` | `inventory.count.create` | canonical route/service | creates `draft` |
| Start | `POST /inventory-v2/audits/:id/start` | `inventory.count.create` | canonical route/service | `draft → in-progress` |
| Scan/Observe | `POST /inventory-v2/audits/:id/observe` | `inventory.count.scan` | canonical route/service | updates Count items only |
| Complete | `POST /inventory-v2/audits/:id/complete` | `inventory.count.complete` | canonical route/service | `in-progress → completed` |
| Close | `POST /inventory-v2/audits/:id/close` | `inventory.count.complete` | canonical route/service | `completed → closed` |
| Cancel/Abandon | none | none | no canonical route or permission | unavailable |

## 11. Open/Resume Capability

### Backend

Read-only GET by ID exists and is Company/Branch scoped. `startAudit` also safely replays an already `in-progress` audit when called with the same audit ID, but this is not an operator-facing recovery flow.

### Frontend

No active list query and no active Count selector/resume control exists. A user who knows the Count ID could theoretically use the detail path at source level, but the normal page does not discover it.

```text
BACKEND_ACTIVE_READ = IMPLEMENTED
FRONTEND_ACTIVE_DISCOVERY = MISSING
FRONTEND_RESUME_UI = MISSING
RECOVERY_CAPABILITY = PARTIAL / NOT OPERATOR-DISCOVERABLE
```

## 12. Complete/Close Capability

Complete is intentionally restricted to an in-progress Count with zero variance in the UI; the backend completes an in-progress Count and records missing items as evidence. The backend response explicitly states that completion does not mutate Asset state or apply inventory adjustments.

Close is restricted to a completed Count and preserves audit evidence. The page exposes the action only when the loaded Count is completed.

No Complete or Close action was executed in this Control.

## 13. Cancel/Abandon Capability

The model includes `cancelled` in its status enum, but the canonical routes, policy permissions, and page do not provide a Cancel/Abandon operation or cancellation metadata fields such as `cancelledAt`/`cancelledBy`.

```text
CANCEL_ABANDON_ROUTE = MISSING
CANCEL_ABANDON_PERMISSION = MISSING
CANCEL_ABANDON_UI = MISSING
CLASSIFICATION = IMPLEMENTATION_GAP_CANCEL_LIFECYCLE
```

This is proposal-only evidence; no cancellation was attempted.

## 14. Localization

The duplicate guard creates an English business message in the backend service. `ConflictError` maps it to error code `STATE_CONFLICT`. The backend error middleware returns the operational message, and `lib/api/client.ts` prefers `error.message` over the locale fallback. The Count page renders `DarfusApiError.message` directly.

Therefore, an Arabic operator receiving this specific server error can see the English sentence rather than a translated business message.

```text
ERROR_CODE_STABLE = YES (STATE_CONFLICT)
AR_TRANSLATION_FOR_SPECIFIC_GUARD_MESSAGE = NOT_FOUND
AR_UI_MESSAGE_SOURCE = raw API error.message
EN_UI_MESSAGE = source/backend English message
LOCALIZATION_GAP = YES
```

## 15. Business Impact

1. A new Count cannot be safely started at Branch-1 / `مخزن-7` while the active Count remains `in-progress`.
2. The duplicate guard prevents accidental duplicate evidence, which is a strength.
3. The operator is not shown the blocking Count ID or a resume path by the current Count UI.
4. Repeated attempts can produce a 409 conflict without explaining the exact active session in Arabic.
5. Completion is evidence-only and does not automatically change Asset, movement, or accounting state; this reduces financial/inventory mutation risk.
6. The current runtime 404 prevents the operator from using the source Count screen at all.

No evidence was found that the Count guard itself mutates POS, transfers, workshop, Assets, or journals.

## 16. Root Cause Track A — Database State

**Finding:** An active Count exists for the exact location requested by the operator.

- Expected: at most one active Count per Company/Branch/Location.
- Actual: one `in-progress` Count exists for the exact scope.
- Evidence: official DB `stock_audits` and `stock_audit_items` read-only queries.
- Classification: `DB_STATE` / `INVENTORY`.
- Severity: `P1` for the blocked workflow.

## 17. Root Cause Track B — UI Visibility

**Finding:** The source page fetches only closed history and renders the new-count form when no Count is loaded.

- Expected: active Count discovery and resume before create.
- Actual: only `status=closed`; no active query or resume UI.
- Evidence: `page.tsx` `loadCountHistory` and conditional `!count && canCreate` rendering.
- Classification: `PRODUCT_DEFECT` / `ACCEPTANCE_GAP`.
- Severity: `P1`.

## 18. Root Cause Track C — Backend Exposure and Guard

**Finding:** The backend can expose active Counts through read-only list/detail routes and correctly rejects duplicates.

- Expected: scoped active read and fail-closed duplicate guard.
- Actual: both are implemented in source; guard matches the official DB state.
- Evidence: canonical route/service/policy source and focused tests.
- Classification: `NO_ISSUE` for duplicate guard; `ACCEPTANCE_GAP` for missing UI consumption.
- Severity: `P2` for the missing UI integration.

## 19. Root Cause Track D — Runtime/Lifecycle/Localization

Findings:

- The current `localhost:3000` runtime returns 404 for the source route `/ar/inventory/stock-audit`.
- No Cancel/Abandon authority exists despite a model enum value for `cancelled`.
- The specific conflict message has a stable code but no specific Arabic translation path.

Classification: `ENVIRONMENT_CONFIG` or runtime/source drift for 404; `PRODUCT_DEFECT`/`ACCEPTANCE_GAP` for lifecycle and localization.

## 20. Severity

| Priority | Count | Issue |
|---|---:|---|
| P0 | 0 | No data loss, security breach, or financial corruption proven |
| P1 | 2 | Active Count blocks the target workflow; no active-session discovery/resume |
| P2 | 2 | Runtime route 404; no Cancel/Abandon recovery authority |
| P3 | 1 | Specific 409 message is not Arabic-localized |

## 21. Minimum Safe Fix Proposal

Proposal only; not implemented in this Control:

1. Add a read-only active Count query to the canonical Inventory Count page, scoped by current Company/Branch and optionally location.
2. Render the active Count ID, location, status, expected/count/missing/unexpected totals, and an explicit Open/Resume action before the new-count form.
3. Make a duplicate 409 resolve to the same active Count read model where safe, without creating a second Count.
4. Decide and document an owner-approved Cancel/Abandon lifecycle before adding any mutation route; do not infer cancellation semantics from the enum alone.
5. Map `STATE_CONFLICT` plus the active-count business condition to Arabic and English UI messages without exposing internal implementation wording.
6. Resolve the `localhost:3000` runtime/source route mismatch through the approved runtime refresh process; do not modify or rebuild in this forensic Control.

## 22. Prevention Lessons

- A duplicate guard without active-session discovery is safe against duplication but operationally incomplete.
- Closed-history-only reads are insufficient for a workflow with durable in-progress sessions.
- Every durable workflow needs an explicit recovery/abandonment authority, not only a database enum.
- Backend error codes should be consumed by localized UI mappings instead of exposing raw server messages.
- Runtime route existence must be checked against the actual server under test, not only the worktree.

## 23. DB No-Write Proof

No Count business mutation was executed:

```text
COUNT_CREATED   = 0
COUNT_SCANNED   = 0
COUNT_COMPLETED = 0
COUNT_CLOSED    = 0
COUNT_CANCELLED = 0
COUNT_DELETED   = 0
BUSINESS_WRITE_DELTA = 0
```

Read-only before/after business baseline remained:

| Table | Before | After | Delta |
|---|---:|---:|---:|
| `stock_audits` | 4 | 4 | 0 |
| `stock_audit_items` | 15 | 15 | 0 |
| `inventory_asset_movements` | 60 | 60 | 0 |
| `assets` | 18 | 18 | 0 |
| `journal_entries` | 24 | 24 | 0 |

An authenticated browser session was used only to inspect the protected runtime. The backend log records the login request; authentication may update technical login telemetry (`lastLoginAt`/audit telemetry). No Count or inventory business record was created or changed. This technical authentication side effect is explicitly excluded from the business delta above.

## 24. Gate

```text
GATE = PASS_INVENTORY_COUNT_ACTIVE_SESSION_FORENSIC_ROOT_CAUSE_PROVEN
```

The gate is satisfied for a forensic/root-cause report: official DB state, exact blocking location, backend authority, duplicate guard, source UI gap, runtime 404, lifecycle gap, localization gap, and business no-Count-mutation evidence are documented. No fix is authorized or included.

## 25. Final Tokens

```text
CURRENT_CONTROL = DARFUS-INVENTORY-COUNT-ACTIVE-SESSION-FORENSIC-01
MODE = READ_ONLY_FORENSIC
OFFICIAL_DATABASE = darfus_erp
ACTIVE_COUNT_COUNT = 3
ACTIVE_COUNTS = COUNT-20260823080154-1072c619|COUNT-20260823080206-38a95c8e|COUNT-20260823173908-b1b1852e
BLOCKING_LOCATION_ID = LOC-2ca3af2d-e01a-454c-a625-4951d0925927
BLOCKING_LOCATION_LABEL = مخزن-7 / HOUSE-7
BLOCKING_BRANCH = Branch-1
BLOCKING_ACTIVE_COUNT = COUNT-20260823080154-1072c619
BLOCKING_ACTIVE_STATUS = in-progress
BLOCKING_ACTIVE_COUNT_HAS_SCANS = NO
BLOCKING_ACTIVE_COUNT_CLASSIFICATION = EMPTY_ACTIVE_COUNT + PRESERVED_TEST_EVIDENCE
PRESERVED_KNOWN_COUNT_STATUSES = closed:1, in-progress:3, draft:0
DUPLICATE_GUARD = PASS
UI_ACTIVE_FETCH = MISSING
API_ACTIVE_READ = IMPLEMENTED
UI_FIRST_VISIBILITY_BREAK = CURRENT_RUNTIME_404; SOURCE_MISSING_ACTIVE_QUERY
UI_ACTIVE_RENDER = MISSING
OPEN_RESUME_BACKEND = PARTIAL
OPEN_RESUME_UI = MISSING
COMPLETE_CAPABILITY = IMPLEMENTED
CLOSE_CAPABILITY = IMPLEMENTED
CANCEL_ABANDON_CAPABILITY = MISSING
AR_LOCALIZATION = GAP
EN_LOCALIZATION = SOURCE_MESSAGE_AVAILABLE
ROOT_CAUSE_A_DB_STATE = PROVEN
ROOT_CAUSE_B_UI_VISIBILITY = PROVEN
ROOT_CAUSE_C_BACKEND_GUARD = PROVEN
ROOT_CAUSE_D_RUNTIME_LIFECYCLE_LOCALIZATION = PROVEN
MINIMUM_SAFE_FIX = PROPOSAL_ONLY_NOT_IMPLEMENTED
COUNT_CREATED_THIS_CONTROL = 0
COUNT_SCANS_THIS_CONTROL = 0
COUNT_COMPLETED_THIS_CONTROL = 0
COUNT_CLOSED_THIS_CONTROL = 0
COUNT_CANCELLED_THIS_CONTROL = 0
COUNT_DELETED_THIS_CONTROL = 0
BUSINESS_WRITE_DELTA = 0
SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
MIGRATIONS_CREATED = 0
P0_COUNT = 0
P1_COUNT = 2
P2_COUNT = 2
P3_COUNT = 1
GATE = PASS_INVENTORY_COUNT_ACTIVE_SESSION_FORENSIC_ROOT_CAUSE_PROVEN
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

تم التوقف بعد التقرير. لا يوجد تنفيذ إصلاح أو إجراء Count إضافي، وأي معالجة لاحقة تحتاج Owner Approval صريحًا.
