# DARFUS ERP — Pearl Jewellery Confirm Request Dispatch Forensic Audit

**Control ID:** `DARFUS-PEARL-JEWELLERY-CONFIRM-REQUEST-DISPATCH-FORENSIC-AUDIT`  
**Mode:** `READ_ONLY_REQUEST_DISPATCH_FORENSIC`  
**Official local main DB:** `darfus_erp`  
**Frontend:** `http://localhost:3000`  
**Backend:** `http://localhost:8000`

## 1. Executive Summary

تم تنفيذ الفحص قراءةً فقط. لم يتم الضغط على Confirm، ولم يتم إرسال Receive أو Retry أو Replay، ولم يتم تعديل الكود أو قاعدة البيانات.

النتيجة الحالية: مسار المصدر من زر التأكيد حتى `fetch()` قابل للتتبع بالكامل، لكن لا توجد أدلة runtime محفوظة تثبت دخول handler أو نجاح/فشل guard محدد في الضغطة الرسمية السابقة. المؤكد فقط هو غياب طلب Receive من Backend وثبات قاعدة البيانات عند صفر Delta. لذلك:

`ROOT_CAUSE_STATUS = NOT_PROVEN`  
`GATE = BLOCKED_PEARL_CONFIRM_DISPATCH_ROOT_CAUSE_NOT_PROVEN`

لا يتم إغلاق P1 ولا اعتماد Retry جديد من هذا التقرير.

## 2. Control / Read-Only Proof

| Control | Result |
|---|---|
| Source changes | 0 |
| Migrations executed | 0 |
| Seeds executed | 0 |
| Business writes | 0 |
| Live Confirm clicks in this audit | 0 |
| Receive executed in this audit | NO |
| Retry / Replay in this audit | NO |
| Production contacted | NO |
| DB cleanup | NO |

The previous live-click artifacts were read only. No browser tab was reopened or recreated for this audit, and no business request was sent.

## 3. Prior Live Ambiguous Result

The prior control recorded:

- Confirm clicks: `1`
- Receive HTTP result: `NOT_OBSERVED`
- Backend `POST /api/v1/purchase-orders/receive`: `0`
- Official DB business delta: `0`
- New PO/Asset/Journal: `0`

Evidence read:

- `backend/acceptance-artifacts/pearl-jewellery/DARFUS-PEARL-JEWELLERY-AUTHENTICATED-LIVE-RECEIVE-RETRY/11-live-receive-network.json`
- `backend/acceptance-artifacts/pearl-jewellery/DARFUS-PEARL-JEWELLERY-AUTHENTICATED-LIVE-RECEIVE-RETRY/12-post-receive-db-reconciliation.json`
- `docs/DARFUS_PEARL_JEWELLERY_AUTHENTICATED_LIVE_RECEIVE_RETRY_REPORT.md`

These prove absence of observed business mutation, but they do not prove where the client-side dispatch stopped.

## 4. Static Confirm Call Chain

`CONFIRM_STATIC_CALL_CHAIN = COMPLETE`

| Step | Source | Condition / behavior | Early return or exception |
|---|---|---|---|
| Confirm button render | `app/[locale]/(dashboard)/inventory/pearl/page.tsx:75` | Rendered only when `confirmation` is true; `onClick={() => void submit()}` | Button disabled when `busy || !preparedReceive` |
| Handler | same file `:62` | `submit()` starts with `!canReceive || busy || !preparedReceive?.idempotencyKey` guard | Returns before any API call |
| Exact request read | same file `:62` | `const exactRequest = preparedReceive` | Missing key returns |
| Preflight | same file `:51-59` | Context snapshot, auth freshness, context re-read, canonical hash parity | `BLOCKED_AUTH`, context mismatch, or hash mismatch return |
| Refresh-specific safety | same file `:62` | `preflight.authStatus === "REFRESHED"` closes confirmation and requests review again | Returns before Receive API |
| API client | same file `:62` | `apiClient<any>("/purchase-orders/receive", { method: "POST", ... })` | Client/config/branch guards may throw |
| Request construction | `lib/api/client.ts:339-401` | Builds headers, reads latest token, adds company/branch/idempotency headers | Production/data-source/branch guards may throw |
| Execute | `lib/api/client.ts:395-400` | `execute()` calls `fetch()` with the prepared URL/options | `fetch()` can reject |
| Fetch | `lib/api/client.ts:400` | `${apiBaseUrl}${path}` with `method: POST` | Network/abort/browser failure possible |

`openConfirmation()` at `page.tsx:61` creates one exact request with a new UUID, stores it in `preparedReceive`, runs preflight, and opens the dialog only when preflight returns `ok`.

## 5. Button / Form Semantics

| Item | Proven source behavior |
|---|---|
| `BUTTON_TYPE` | Not explicitly set by the Pearl Confirm call; `Button` forwards props unchanged (`components/ui/button.tsx:11-31`) |
| `INSIDE_FORM` | NO `<form>` element exists in the Pearl page source |
| `ONCLICK_HANDLER` | `onClick={() => void submit()}` (`page.tsx:75`) |
| `ONSUBMIT_HANDLER` | None in the Pearl page |
| `PREVENT_DEFAULT` | None; no form submit event is used |
| `DISABLED_CONDITION` | `busy || !preparedReceive` for Confirm |
| `LOADING_CONDITION` | `busy`; set true at submit entry and false in `finally` |
| `DIALOG_CLOSE_BEHAVIOR` | Conditional unmount via `confirmation`; Cancel closes immediately, success closes after API resolution, guard failure may close on refreshed auth |

There is no evidence of a default form submission, nested form, or an `onSubmit` event swallowing the click. The unspecified HTML button type is not shown to be causal because the button is not inside a form.

## 6. Handler Entry Proof

`CLICK_HANDLER_ENTERED = UNPROVEN`

No source instrumentation was added. The prior artifacts contain preflight/hash metadata and the final no-POST result, but no handler-entry marker, runtime breakpoint capture, or preserved browser event trace. Therefore a UI event-dispatch failure cannot be declared, and handler entry cannot be declared.

## 7. Pre-Confirm Guard Trace

The following is the static order. Runtime status refers specifically to the prior live click and is not inferred from the pre-live READY state.

| Guard | Static input | Prior live click status | Early return |
|---|---|---|---|
| `canReceive` | profile/shared preview, supplier, location, tax, approval | UNPROVEN | YES |
| `busy` | submit state | UNPROVEN | YES |
| `preparedReceive?.idempotencyKey` | retained exact request | PRE-LIVE artifact says present; live click UNPROVEN | YES |
| auth freshness | stored access/refresh token | Pre-live artifact: FRESH; live click: UNPROVEN | YES on blocked auth |
| company context parity | before/after snapshot | Pre-live artifact: unchanged; live click: UNPROVEN | YES |
| branch context parity | before/after snapshot | Pre-live artifact: unchanged; live click: UNPROVEN | YES |
| canonical hash parity | exact request versus current candidate | Pre-live artifact: PASS; live click: UNPROVEN | YES |
| `preflight.ok` | combined guard result | Live click: UNPROVEN | YES |
| refreshed-auth re-review | `authStatus === "REFRESHED"` | Live click: UNPROVEN | YES; closes dialog before Receive POST |

`FIRST_FAILED_OR_NOT_REACHED_GUARD = UNPROVEN`.

## 8. Auth Preflight Trace

| Token | Result |
|---|---|
| `AUTH_PREFLIGHT_CALLED` | UNPROVEN for the prior click |
| `AUTH_PREFLIGHT_RESULT` | UNPROVEN for the prior click; pre-live artifact was `FRESH` |
| `REFRESH_REQUEST_OBSERVED` | One `/auth/refresh` was present in the recent backend log window, but timestamp correlation to the click is not proven |
| `AUTH_PREFLIGHT_EXCEPTION` | UNPROVEN |

The source behavior is clear: `preConfirmAuthFreshness()` calls `ensureAuthFreshness()`; a successful refresh returns `REFRESHED`, and the Pearl submit handler returns before the business POST so the user must review again. This is a safety branch, not proof that it occurred during the prior click.

`AUTH_BLOCKED_DISPATCH = NOT_PROVEN`  
`AUTH_NOT_ROOT_CAUSE = NOT_PROVEN`

## 9. Prepared Request State

The pre-live artifact proves:

- `PREPARED_REQUEST_PRESENT = YES`
- `PREPARED_REQUEST_STATE_VALID = YES` before the click
- `IDEMPOTENCY_KEY_PRESENT = YES` before the click; value not repeated here
- `INVENTORY_V2 = true`
- `ITEMS_COUNT = 1`
- `PER_PIECE_COUNT = 1`

`submit()` reads the retained `preparedReceive` object rather than reconstructing the request from form state. For the prior click itself, post-click state is not available, so request clearing/replacement is `UNPROVEN`.

## 10. Hash / Parity Trace

The pre-live artifact proves canonical hash recompare `PASS` with zero business-field mismatches. The source recomputes:

1. hash of the retained exact request;
2. hash of a candidate built from current `receiveBody` with the same idempotency key;
3. context comparison before allowing `READY_TO_CONFIRM`.

For the prior click:

`HASH_RECOMPARE_CALLED = UNPROVEN`  
`HASH_RECOMPARE_RESULT = UNPROVEN`  
`BUSINESS_FIELD_MISMATCH_COUNT = UNPROVEN`

No live mutation or replay was used to reach this conclusion.

## 11. Submit Function Trace

`SUBMIT_FUNCTION_ENTERED = UNPROVEN`.

If entered, the first possible exits are:

1. `!canReceive || busy || !preparedReceive?.idempotencyKey`;
2. `!preflight.ok` after auth/context/hash checks;
3. `preflight.authStatus === "REFRESHED"`, which explicitly closes the dialog and returns before `apiClient`.

No evidence identifies which branch, if any, occurred.

## 12. apiClient Entry Trace

`API_CLIENT_ENTERED_FOR_RECEIVE = UNPROVEN`.

Static contract if entered:

- method: `POST`
- path: `/purchase-orders/receive`
- base: `process.env.NEXT_PUBLIC_API_URL || "/api/v1"`
- headers: Authorization from stored token, device session, branch/company context, and idempotency key
- body: exact retained request JSON

No request was sent by this audit.

## 13. Fetch Dispatch Trace

| Token | Result |
|---|---|
| `FETCH_CALLED` | UNPROVEN |
| `FETCH_PROMISE_CREATED` | UNPROVEN |
| `REQUEST_ABORTED_BEFORE_NETWORK` | UNPROVEN |
| `ABORT_SIGNAL_USED` | No Pearl-specific abort signal is present in the traced call; runtime cancellation remains unproven |

The source has no Pearl-page route navigation or explicit abort controller between `submit()` and `apiClient()`. This rules out no source-level path, but it does not prove browser dispatch for the historical click.

## 14. Browser Network Evidence

The pre-live network artifact recorded preview traffic and zero Receive POST before Confirm. The post-click artifact records no observable browser result and no Backend Receive POST. A preserved DevTools request record distinguishing “not sent” from “canceled/blocked” is absent.

| Evidence | Result |
|---|---|
| `BROWSER_RECEIVE_REQUEST_OBSERVED` | NO in available evidence |
| `BROWSER_RECEIVE_REQUEST_STATE` | NOT_OBSERVED |
| `OPTIONS_REQUEST_OBSERVED` | 0 in Backend logs; browser-level proof unavailable |
| `CORS_BLOCK` | UNPROVEN |
| `REQUEST_CANCELED` | UNPROVEN |
| Service worker/extension interception | UNPROVEN |

## 15. Backend Log Correlation

Read-only log query for the relevant available window found:

| Backend event | Count / result |
|---|---:|
| `POST /api/v1/purchase-orders/receive` | 0 |
| `OPTIONS /api/v1/purchase-orders/receive` | 0 |
| `/api/v1/auth/refresh` | 1 observed in window; not tied conclusively to the click |
| Pearl profile/shared preview traffic | observed |

Therefore:

`BACKEND_RECEIVE_ROUTE_REACHED = NO`  
`BACKEND_AUTH_MIDDLEWARE_REACHED_FOR_RECEIVE = NO`  
`BACKEND_BUSINESS_HANDLER_REACHED = NO`

These are absence proofs at the backend boundary only; they do not identify the client-side stop point.

## 16. Frontend Runtime Error Trace

`CLIENT_RUNTIME_ERROR_OBSERVED = UNPROVEN` for the click window. The pre-live browser artifact recorded zero console errors, but it did not preserve a post-click console history. No source exception is declared.

Potential error classes were not proven: `TypeError`, `ReferenceError`, `AbortError`, crypto failure, React event error, navigation error, or null request access.

## 17. Modal / State Race Audit

`STATE_RACE_FOUND = UNPROVEN`.

Static observations:

- `preparedReceive` is set before the opening preflight and is read directly by submit.
- `confirmation` is set false before opening preflight, then true only after `ok`.
- The refreshed-auth branch deliberately sets `confirmation(false)` before returning.
- Success sets `result`, then closes confirmation after `apiClient` resolves.
- `finally` clears only `busy`.
- No Pearl-page navigation or explicit unmount is triggered by `submit()`.

The refreshed-auth branch is a possible pre-fetch stop by design, but no live evidence proves it was the prior click’s branch.

## 18. Idempotency-Key Lifecycle

`IDEMPOTENCY_KEY_LIFECYCLE = PROVEN_STATICALLY; LIVE_CLICK_REUSE = UNPROVEN`

- A new UUID is created in `openConfirmation()`.
- It is stored in the exact `preparedReceive` object.
- `submit()` reuses that exact value in the body and `Idempotency-Key` header.
- The canonical business hash excludes the idempotency key by design.
- Auth refresh does not regenerate the key.
- Cancel/reopen creates a new request and therefore a new key.
- No replay was executed in this audit.

## 19. Navigation / Unmount Audit

| Item | Result |
|---|---|
| `NAVIGATION_BEFORE_FETCH` | NO source evidence; live occurrence UNPROVEN |
| `COMPONENT_UNMOUNT_BEFORE_FETCH` | No source-triggered unmount found; live occurrence UNPROVEN |
| `router.push/replace` in submit | Not present |
| `location` change in submit | Not present |
| form navigation | Not present; no form |

## 20. Official DB Zero-Delta Recheck

Read-only query verified `current_database() = darfus_erp` and current counts:

| Entity | Count |
|---|---:|
| `purchase_orders` | 12 |
| `purchase_order_items` | 12 |
| `assets` | 12 |
| `assets` with `inventory_profile = 'PEARL_JEWELLERY'` | 0 |
| `asset_components` | 9 |
| `asset_pearl_component_details` | 0 |
| `asset_barcode_history` | 12 |
| `asset_origins` | 12 |
| `asset_purchase_cost_revisions` | 12 |
| `asset_current_valuations` | 12 |
| `inventory_asset_movements` | 12 |
| `journal_entries` | 15 |
| `journal_lines` | 42 |
| `idempotency_requests` | 16 |
| `cash_transactions` | 3 |

`OFFICIAL_DB_BUSINESS_DELTA_FROM_AMBIGUOUS_CLICK = 0`.

No SQL business mutation was executed.

## 21. Root Cause

`ROOT_CAUSE_STATUS = NOT_PROVEN`

The evidence proves only:

`visible click was reported → no observable Receive request → Backend Receive POST = 0 → DB delta = 0`

The evidence does not prove whether the stop occurred at the UI event, an initial submit guard, auth preflight, context/hash guard, refreshed-auth review return, API client entry, fetch dispatch, or browser/network layer.

## 22. Failure Layer

`FAILURE_LAYER = UI_EVENT_OR_SUBMIT_FUNCTION_UNPROVEN`

This is a boundary classification, not a root-cause declaration. It reflects the first unobserved transition after the visible click.

## 23. Why One Visible Click Produced No Receive Request

The exact reason is **not proven**. The source contains legitimate pre-fetch exits, especially:

- invalidated `canReceive`/busy/prepared-request state;
- blocked auth;
- context or hash mismatch;
- successful auth refresh causing deliberate re-review and no unsafe POST.

None is tied to the historical click by runtime evidence. A visible button state is not proof that the handler entered or that `fetch()` was called.

## 24. Minimum Fix Design (No Implementation)

Because root cause is not proven, no product or business-logic fix is authorized.

Minimum safe diagnostic design for a separately approved follow-up:

1. add non-business, redacted dispatch telemetry or test-only hooks around handler entry, each guard result, apiClient entry, and fetch invocation;
2. capture only status/sequence/correlation metadata, never tokens, passwords, cookies, or full financial payloads;
3. run a read-only/prepared-request proof or isolated disposable rehearsal, not `darfus_erp`;
4. remove or disable diagnostic instrumentation after the boundary is proven.

Security impact: must not expose credentials or business secrets. Business-logic impact: none intended. Rollback: remove the diagnostic-only instrumentation; no DB rollback is applicable.

## 25. LL-013 Prevention Gate

`CRITICAL_CONFIRM_DISPATCH_PROOF_REQUIRED = YES`

Future critical acceptance must prove the sequence:

`CLICK → HANDLER → GUARDS → PREPARED REQUEST → API CLIENT → FETCH → BROWSER NETWORK → BACKEND`

“Button clicked” alone is not mutation proof. The gate must separately record each step and distinguish:

- guard return before API client;
- API client entry without fetch;
- fetch rejection/abort;
- browser request canceled/blocked;
- backend route absence.

This design does not authorize a Receive or Retry.

## 26. Regression Test Design

Future focused tests should prove, without official business writes:

1. one click enters the handler;
2. valid prepared request reaches `apiClient` exactly once;
3. invalid `canReceive`/busy/missing-key state makes zero client calls;
4. hash mismatch makes zero fetch calls;
5. blocked auth makes zero business POST calls;
6. refreshed auth closes/requires review and makes zero unsafe POST calls;
7. valid `READY_TO_CONFIRM` state dispatches exactly one fetch;
8. no navigation/unmount precedes dispatch;
9. one click cannot double-submit;
10. unsafe `401` refresh does not auto-replay the business POST.

Existing auth freshness and canonical-hash tests remain read-only source tests and do not prove the historical click path.

## 27. P0 / P1

| Priority | Issue | Status |
|---|---|---|
| P0 | Data loss/security/financial corruption | 0 |
| P1 | Pearl Confirm dispatch ambiguity | 1, remains open |

`BUSINESS_DELTA = 0` does not close the P1; it only proves no business mutation occurred.

## 28. Gate

`GATE = BLOCKED_PEARL_CONFIRM_DISPATCH_ROOT_CAUSE_NOT_PROVEN`

The PASS forensic gate is unavailable because the exact first stop point was not proven. No retry authorization is created.

## 29. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PEARL-JEWELLERY-CONFIRM-REQUEST-DISPATCH-FORENSIC-AUDIT
MODE = READ_ONLY_REQUEST_DISPATCH_FORENSIC
LOCAL_MAIN_DB = darfus_erp
PRIOR_CONFIRM_CLICKS = 1
PRIOR_RECEIVE_HTTP_STATUS = NOT_OBSERVED
PRIOR_BACKEND_RECEIVE_POST_COUNT = 0
PRIOR_BUSINESS_DELTA = 0
BUTTON_TYPE = NOT_EXPLICITLY_SET
INSIDE_FORM = NO
CLICK_HANDLER_ENTERED = UNPROVEN
FIRST_FAILED_OR_NOT_REACHED_GUARD = UNPROVEN
AUTH_PREFLIGHT_CALLED = UNPROVEN_FOR_PRIOR_CLICK
AUTH_PREFLIGHT_RESULT = UNPROVEN_FOR_PRIOR_CLICK
PREPARED_REQUEST_PRESENT = YES_PRE_LIVE
HASH_RECOMPARE_CALLED = YES_PRE_LIVE_UNPROVEN_LIVE
HASH_RECOMPARE_RESULT = PASS_PRE_LIVE_UNPROVEN_LIVE
SUBMIT_FUNCTION_ENTERED = UNPROVEN
API_CLIENT_ENTERED_FOR_RECEIVE = UNPROVEN
FETCH_CALLED = UNPROVEN
FETCH_PROMISE_CREATED = UNPROVEN
REQUEST_ABORTED_BEFORE_NETWORK = UNPROVEN
BROWSER_RECEIVE_REQUEST_OBSERVED = NO
OPTIONS_REQUEST_OBSERVED = 0_BACKEND_LOGS
CLIENT_RUNTIME_ERROR_OBSERVED = UNPROVEN
STATE_RACE_FOUND = UNPROVEN
NAVIGATION_BEFORE_FETCH = NO_SOURCE_EVIDENCE_LIVE_UNPROVEN
COMPONENT_UNMOUNT_BEFORE_FETCH = NO_SOURCE_EVIDENCE_LIVE_UNPROVEN
BACKEND_RECEIVE_ROUTE_REACHED = NO
BACKEND_BUSINESS_HANDLER_REACHED = NO
OFFICIAL_DB_BUSINESS_DELTA_FROM_AMBIGUOUS_CLICK = 0
ROOT_CAUSE_STATUS = NOT_PROVEN
FAILURE_LAYER = UI_EVENT_OR_SUBMIT_FUNCTION_UNPROVEN
ROOT_CAUSE = NOT_PROVEN
WHY_CLICK_PRODUCED_NO_RECEIVE_REQUEST = NOT_PROVEN; visible click is not dispatch proof
MINIMUM_FIX_REQUIRED = NOT_AUTHORIZED_BEFORE_ROOT_CAUSE_PROOF
MINIMUM_FIX_SCOPE = DIAGNOSTIC_DISPATCH_EVIDENCE_ONLY_IF_OWNER_APPROVED
LL013_PREVENTION_GATE = CLICK_HANDLER_GUARDS_API_CLIENT_FETCH_NETWORK_BACKEND
P0_COUNT = 0
P1_COUNT = 1
SOURCE_CHANGES = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
BUSINESS_WRITES = 0
LIVE_CONFIRM_CLICKS = 0
RECEIVE_EXECUTED = NO
RETRY_EXECUTED = NO
GATE = BLOCKED_PEARL_CONFIRM_DISPATCH_ROOT_CAUSE_NOT_PROVEN
PEARL_JEWELLERY_MODULE_STATUS = OPEN
NEXT_RECOMMENDED_STEP = PEARL_JEWELLERY_CONFIRM_REQUEST_DISPATCH_MINIMUM_SAFE_FIX
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 30. Ready-to-Copy LL-013 Continuity Update

```text
LL-013 — CONFIRM UI STATE IS NOT PROOF OF REQUEST DISPATCH

Problem:
A visible Confirm click occurred, but no HTTP mutation request was observed and Backend received no Receive POST.

Root Cause:
NOT_PROVEN. Static source traces the complete path, but handler entry, guard outcome, apiClient entry, fetch invocation, and browser network state were not preserved for the historical click.

What Allowed It:
The acceptance evidence stopped at visible UI action plus backend absence; it did not record a redacted dispatch sequence proving the first client-side stop point.

Minimum Fix:
No business fix authorized. Obtain Owner-approved diagnostic dispatch evidence around handler, guards, apiClient, and fetch without recording secrets or sending a business POST.

Permanent Prevention Gate:
Critical mutation acceptance must prove CLICK → HANDLER → GUARDS → API CLIENT → FETCH → NETWORK → BACKEND. A clicked button alone is never mutation proof.

Regression Test:
A valid Confirm must dispatch exactly one request; any guard failure must dispatch zero requests; one click must never create more than one request; unsafe POST auto-replay remains disabled.

Affected Modules:
Pearl Jewellery Confirm and future critical mutation Confirm flows.
```

## 31. Stop

No source fix, Receive, Retry, Confirm, Replay, DB mutation, or automatic next batch was started. Await Owner review.
