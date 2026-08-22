# DARFUS ERP — Pearl Jewellery Confirm Request Dispatch Minimum Safe Fix

**Control ID:** `DARFUS-PEARL-JEWELLERY-CONFIRM-REQUEST-DISPATCH-MINIMUM-SAFE-FIX`  
**Mode:** `DIAGNOSTIC_DISPATCH_PROOF_ONLY`  
**Official local main DB:** `darfus_erp`  
**Frontend:** `http://localhost:3000`  
**Backend:** `http://localhost:8000`

## 1. Executive Summary

تم تنفيذ إصلاح تشخيصي محدود فقط لإثبات مسار Confirm من الداخل، دون أي Receive أو Retry أو Confirm رسمي. تمت إضافة أحداث redacted إلى مسار Pearl، مع harness معزول لا يرسل Business POST.

النتيجة الحالية:

- المسار الحالي **DISPATCH_CAPABLE** في الحالة الصحيحة: Click=1 → Handler=1 → API Client=1 → Fetch Attempt=1.
- كل حالات الحجب المختبرة توقفت قبل API Client وFetch.
- فرع `AUTH_REFRESHED` يطلب مراجعة جديدة ولا يعيد إرسال POST غير آمن.
- AR وEN routes حمّلت قراءةً فقط بلا console errors؛ لم يتم ضغط Confirm في المتصفح.
- Backend Receive POST = 0، وOfficial DB business delta = 0.
- السبب التاريخي للضغطة السابقة ما زال غير مثبت.

## 2. Scope / Authorization

المسموح والمنفذ:

- Diagnostic source fix only.
- Focused tests and isolated harness.
- AR/EN read-only route proof.
- Backend log and official DB read-only checks.

الممنوع والمنفذ منه صفر:

- Official Receive / Retry / Confirm.
- `POST /api/v1/purchase-orders/receive`.
- Business logic, Tax, Asset, Barcode, Accounting, Idempotency server behavior.
- Migration, seed, master-data mutation, DB cleanup.
- Production contact.

## 3. Prior Forensic Gate

`PRIOR_FORENSIC_GATE = BLOCKED_PEARL_CONFIRM_DISPATCH_ROOT_CAUSE_NOT_PROVEN`.

السابق المثبت: Confirm click واحد، نتيجة Receive غير مرئية، Backend Receive POST = 0، وDB delta = 0. هذا Control لم يعِد تنفيذ ذلك الضغط ولم يحاول استنتاج سببه بأثر رجعي.

## 4. Files Changed

Production source changed only for diagnostics:

- `app/[locale]/(dashboard)/inventory/pearl/page.tsx`
- `lib/api/client.ts`
- `lib/debug/pearl-confirm-dispatch.ts`

Focused test:

- `tests/pearl-confirm-request-dispatch.test.cjs`

Report and redacted artifacts were added under `docs/` and `backend/acceptance-artifacts/`. No backend source was changed.

## 5. Diagnostic Design

`lib/debug/pearl-confirm-dispatch.ts` provides:

- one diagnostic correlation ID per Confirm handler attempt;
- a redacted event sink for isolated/test proof;
- no console logging by default;
- a strict production no-op (`NODE_ENV = production`);
- no persistence and no business request dependency.

Safe fields are limited to event name, correlation ID, timestamp, method/path, guard status, auth status, context/hash booleans, and safe outcome/status metadata.

Never recorded: password, access token, refresh token, cookie, Authorization value, full request body, idempotency key value, or canonical hash value.

## 6. Correlation Model

Correlation format: `PEARL-DISPATCH-<random UUID>`.

The diagnostic correlation is separate from the business idempotency key, is not sent as business data, is not persisted, and is not required by backend production logic.

## 7. Click / Handler Proof

The isolated harness proved:

| Metric | Valid flow |
|---|---:|
| Click events | 1 |
| Handler entries | 1 |
| Double dispatch | NO |

AR and EN browser routes were read-only loaded with zero console errors. No browser Confirm was clicked; the click/handler proof was supplied by the isolated harness so no official business network could be reached.

## 8. Guard Trace

Valid isolated flow:

| Guard | Result |
|---|---|
| canReceive | PASS |
| busy | PASS |
| prepared request/idempotency presence | PASS |
| auth freshness | FRESH/PASS |
| company/branch context | PASS |
| canonical hash parity | PASS |
| ready for API | PASS |

Blocking cases all produced `API_CLIENT_CALLS = 0` and `FETCH_ATTEMPTS = 0`:

- `CAN_RECEIVE_FALSE`
- `BUSY_TRUE`
- `PREPARED_REQUEST_MISSING`
- `AUTH_BLOCKED`
- `AUTH_REFRESHED_REVIEW_REQUIRED`
- `BRANCH_CONTEXT_MISMATCH`
- `HASH_MISMATCH`

`FIRST_BLOCKING_GUARD_VALID_CASE = NONE`.

## 9. Auth Refreshed Review Case

`AUTH_REFRESHED_REVIEW_CASE = PASS`.

When auth status is `REFRESHED`, telemetry records `AUTH_REFRESHED_REVIEW_REQUIRED`; the confirmation closes, the user must review again, and API/Fetch counts remain zero. No unsafe POST auto-replay was introduced.

## 10. Hash Mismatch Case

`HASH_MISMATCH_BLOCK_CASE = PASS`.

Changed prepared/current business state records `HASH_RECOMPARE = FAIL` and `BLOCK_REASON = HASH_MISMATCH`, with zero API calls and zero Fetch attempts.

## 11. apiClient Entry Proof

`API_CLIENT_ENTRY_PROOF = PASS_ISOLATED_HARNESS`.

The Pearl page records a safe `PEARL_CONFIRM_API_CLIENT_ENTERED` event immediately before the receive-path `apiClient()` call. The valid harness observed exactly one entry with method `POST` and path `/purchase-orders/receive`.

## 12. Fetch Attempt Proof

`FETCH_ATTEMPT_PROOF = PASS_ISOLATED_HARNESS`.

`lib/api/client.ts` records the safe `PEARL_CONFIRM_FETCH_ATTEMPT` event only when the receive path is a POST and only immediately before the actual `fetch()`. The valid isolated trace observed exactly one attempt. The harness does not connect to localhost:8000.

## 13. Valid Ready Flow

| Step | Result |
|---|---|
| Click | 1 |
| Handler | 1 |
| Guards | all PASS |
| API client | 1 |
| Fetch attempt | 1 |
| Official network business POST | 0 |
| Double dispatch | NO |

`CURRENT_VALID_FLOW = DISPATCH_CAPABLE`.

## 14. AR Browser Proof

Route: `/ar/inventory/pearl`.

- Route load: PASS, read-only.
- Page title and Pearl form: observed.
- Console errors: 0.
- UI Confirm click: not executed.
- AR click/handler and guard proof: PASS through the isolated diagnostic harness.
- Official Receive POSTs: 0.

Artifact: `10-ar-browser-dispatch-proof.json`.

## 15. EN Browser Proof

Route: `/en/inventory/pearl`.

- Route load: PASS, read-only.
- Pearl Jewellery page and Confirm label: observed.
- Console errors: 0.
- UI Confirm click: not executed.
- EN click/handler and guard proof: PASS through the isolated diagnostic harness.
- Official Receive POSTs: 0.

Artifact: `11-en-browser-dispatch-proof.json`.

## 16. Backend Zero-POST Proof

Read-only Backend log query:

| Request | Count |
|---|---:|
| `POST /api/v1/purchase-orders/receive` | 0 |
| `OPTIONS /api/v1/purchase-orders/receive` | 0 |

No backend mutation occurred.

Artifact: `12-backend-zero-post.json`.

## 17. Official DB Zero-Delta

Read-only query verified `current_database() = darfus_erp`:

| Entity | Count |
|---|---:|
| `purchase_orders` | 12 |
| `assets` | 12 |
| `assets` with `PEARL_JEWELLERY` | 0 |
| `journal_entries` | 15 |
| `idempotency_requests` | 16 |

`OFFICIAL_DB_BUSINESS_DELTA = 0` and `BUSINESS_WRITES = 0`.

Artifact: `13-db-zero-delta.json`.

## 18. Focused Tests

Command:

```text
node --test tests/pearl-confirm-request-dispatch.test.cjs
```

Result: PASS.

Coverage includes one click/handler, valid API/Fetch counts, every required guard block, refreshed-auth review, hash mismatch, double-dispatch prevention, unsafe POST replay guard, and production diagnostics no-op.

## 19. Regression

Command set included:

```text
node --test tests/pearl-confirm-request-dispatch.test.cjs tests/pearl-confirm-auth-freshness.test.cjs tests/pearl-size-ui-binding.test.cjs tests/pearl-jewellery-minimum-safe-implementation.test.cjs tests/authorization-runtime-fix-cont3.test.mjs tests/authorization-runtime-fix-cont4.test.mjs
```

Result: `17/17 PASS`.

## 20. Typecheck / Build

- `npm run typecheck = PASS`
- `npm run build = PASS`
- No Next dev server was started.
- `BACKEND_CHANGE = NO`
- `MIGRATION_REQUIRED = NO`

The build did not require or authorize any database mutation.

## 21. Historical Root Cause Status

`HISTORICAL_ROOT_CAUSE = NOT_PROVEN`.

The current diagnostic proof cannot retroactively identify which branch handled the earlier click. It only proves that the current source path can expose and test that boundary safely.

## 22. Current Dispatch Root Cause / Boundary

`CURRENT_DISPATCH_BOUNDARY = DISPATCH_CAPABLE`.

No deterministic current defect was found. Valid flow reaches the isolated API and Fetch boundaries exactly once; guard failures stop before them.

## 23. Product Fix Required?

`PRODUCT_FIX_REQUIRED = NO`.

The source changes are diagnostic only. No Tax, Supplier Receive, Asset, Barcode, Accounting, Idempotency server, or Pearl calculation behavior was changed.

## 24. LL-013 Prevention Gate

`CRITICAL_CONFIRM_DISPATCH_PROOF_REQUIRED = YES`.

Future critical mutation acceptance must record:

```text
CLICK_EVENT_COUNT = 1
HANDLER_ENTRY_COUNT = 1
FIRST_BLOCKING_GUARD = NONE for valid flow
API_CLIENT_ENTRY_COUNT = 1
FETCH_ATTEMPT_COUNT = 1
BROWSER_REQUEST_OBSERVED = YES
BACKEND_REQUEST_OBSERVED = YES
```

Guard-blocked flows must record API=0 and Fetch=0. A button click alone remains insufficient mutation proof.

## 25. Diagnostic Retention/Removal

Choice: **DEV_ONLY_NOOP_IN_PRODUCTION**.

The diagnostic helper does not emit events in production. It has no customer UI debug text, no secret logging, and no persistent sink. The isolated test sink is injected only by the test harness.

`PRODUCTION_TELEMETRY_EXPOSES_SECRETS = NO`  
`CUSTOMER_UI_DEBUG_TEXT = NO`

## 26. P0/P1

| Priority | Count | Detail |
|---|---:|---|
| P0 | 0 | No data loss/security/financial corruption observed |
| P1 | 1 | Historical ambiguous click remains not proven; current dispatch is now instrumented and dispatch-capable |

The diagnostic gate does not close the historical P1 or authorize a live retry.

## 27. Gate

`GATE = PASS_PEARL_JEWELLERY_CONFIRM_REQUEST_DISPATCH_DIAGNOSTIC_PROOF`.

This PASS is limited to current isolated dispatch diagnostics. It does not authorize a live Confirm, Receive, Retry, Replay, or official DB write.

## 28. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PEARL-JEWELLERY-CONFIRM-REQUEST-DISPATCH-MINIMUM-SAFE-FIX
MODE = DIAGNOSTIC_DISPATCH_PROOF_ONLY
LOCAL_MAIN_DB = darfus_erp
PRIOR_FORENSIC_GATE = BLOCKED_PEARL_CONFIRM_DISPATCH_ROOT_CAUSE_NOT_PROVEN
SOURCE_FILES_CHANGED = 4
BACKEND_CHANGE = NO
MIGRATION_REQUIRED = NO
MIGRATIONS_EXECUTED = 0
BUSINESS_WRITES = 0
LIVE_CONFIRM_CLICKS = 0
LIVE_RECEIVE_POSTS = 0
RETRY_EXECUTED = NO
DIAGNOSTIC_CORRELATION = PASS
CLICK_EVENT_COUNT = 1_ISOLATED_VALID_CASE
HANDLER_ENTRY_COUNT = 1_ISOLATED_VALID_CASE
FIRST_BLOCKING_GUARD_VALID_CASE = NONE
VALID_FLOW_ALL_GUARDS_PASS = PASS
AUTH_REFRESHED_REVIEW_CASE = PASS
HASH_MISMATCH_BLOCK_CASE = PASS
API_CLIENT_ENTRY_COUNT_VALID_CASE = 1
FETCH_ATTEMPT_COUNT_VALID_CASE = 1
DOUBLE_DISPATCH = NO
AR_CLICK_HANDLER_PROOF = PASS_ISOLATED_HARNESS
AR_GUARD_TRACE = PASS_ISOLATED_HARNESS
EN_CLICK_HANDLER_PROOF = PASS_ISOLATED_HARNESS
EN_GUARD_TRACE = PASS_ISOLATED_HARNESS
BACKEND_RECEIVE_POST_COUNT = 0
OFFICIAL_DB_BUSINESS_DELTA = 0
FOCUSED_TESTS = PASS
REGRESSION = PASS_17_OF_17
TYPECHECK = PASS
BUILD = PASS
HISTORICAL_ROOT_CAUSE = NOT_PROVEN
CURRENT_DISPATCH_BOUNDARY = DISPATCH_CAPABLE
PRODUCT_FIX_REQUIRED = NO
LL013_PREVENTION_GATE = CLICK_HANDLER_GUARDS_API_CLIENT_FETCH_NETWORK_BACKEND
DIAGNOSTIC_RETENTION = DEV_ONLY_NOOP_IN_PRODUCTION
P0_COUNT = 0
P1_COUNT = 1
GATE = PASS_PEARL_JEWELLERY_CONFIRM_REQUEST_DISPATCH_DIAGNOSTIC_PROOF
PEARL_JEWELLERY_MODULE_STATUS = OPEN
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_OF_STRICTLY_INSTRUMENTED_LIVE_RETRY_READINESS
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 29. Stop

No live Receive, live Retry, official Confirm, official DB write, or automatic next batch was started. Await Owner review.
