# DARFUS ERP — Pearl Jewellery Confirm Auth Path Forensic Audit Report

## 1. Executive Summary

تم تنفيذ هذا الـControl قراءة فقط. لم يتم الضغط على Confirm، ولم يتم إرسال أي Receive أو Business POST من هذا الـControl، ولم يحدث أي تعديل مصدر أو قاعدة بيانات.

السبب الجذري مثبت: صفحة Pearl كانت تحتفظ بطلب جاهز لفترة أطول من عمر Access JWT. عند Confirm وصل `POST /api/v1/purchase-orders/receive` إلى Backend، وفشل `jwt.verify` في `auth.middleware.js`. قام `apiClient` بتشغيل `POST /auth/refresh` بنجاح، ثم رفض إعادة إرسال POST غير الآمن تلقائيًا وأظهر رسالة المراجعة اليدوية. هذا السلوك يحمي من تكرار Receive، لكنه يعني أن بوابة GET السابقة لم تثبت صلاحية Auth لحظة Confirm.

## 2. Control / Read-Only Proof

| Control | Result |
|---|---|
| Mode | `READ_ONLY_AUTH_FORENSIC` |
| Source changes | `0` |
| Migrations/seeds | `0 / 0` |
| Business writes | `0` |
| Receive/retry in this audit | `NO / NO` |
| Confirm clicks in this audit | `0` |
| Production contacted | `NO` |
| Official DB | Read-only `darfus_erp` |

## 3. Prior Failure Evidence

تمت مراجعة تقرير التنفيذ السابق والـartifacts. الدليل السابق يثبت:

- Protected Pearl contract GET: `200`.
- Failed receive POST: Backend `401`.
- Frontend message: session refreshed; manual retry required.
- Refresh endpoint: `200`.
- Official business delta: `0`.

Server log correlation يحدد الـfailed POST عند `22:39:39`، request id `a7292794-e22f-4a62-a09d-384946e0c9c2`. الخطأ كان `UNAUTHORIZED` من مسار `jwt.verify`، ثم `POST /api/v1/auth/refresh 200` عند نفس الثانية، request id `f82eee68-fd6b-4745-9b6a-1e8f3ae5ed6e`.

آخر Pearl contract GET ظاهر في Backend logs كان `22:28:53`، `200`، أي أن صلاحية GET السابقة لم تكن proof زمنيًا لصلاحية POST بعد مرور نحو 10 دقائق. Artifact السابق وصف GET بأنه قريب من Confirm، لكن الـserver timestamps لا تثبت أنه كان مباشرة قبله.

## 4. GET Call Chain

```text
Pearl page mount / branch ready
→ app/[locale]/(dashboard)/inventory/pearl/page.tsx
→ apiClient("/inventory-v2/pearl-jewellery/contract", { locale, branchId })
→ lib/api/client.ts
→ NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
→ fetch(GET /api/v1/inventory-v2/pearl-jewellery/contract)
→ Authorization Bearer from localStorage/sessionStorage
→ X-Device-Session-ID
→ X-Company-ID from CompanyContext
→ X-Branch-ID from branchId/BranchContext
→ backend routes/pearl-jewellery-profile.routes.js
→ authMiddleware
→ requirePermission("inventory.view")
→ Pearl context/master-data reads
→ HTTP 200
```

## 5. Confirm POST Call Chain

```text
Confirm button
→ Pearl page submit()
→ preparedReceive retained exact object
→ apiClient("/purchase-orders/receive", { method: "POST", branchId, Idempotency-Key })
→ lib/api/client.ts execute()
→ latest stored access token read
→ Authorization/company/branch/device headers
→ fetch(POST /api/v1/purchase-orders/receive)
→ backend authMiddleware
→ jwt.verify fails for access JWT
→ HTTP 401 before route handler/business transaction
→ apiClient refreshAccessToken()
→ POST /api/v1/auth/refresh returns 200 and rotates tokens
→ unsafe original POST is intentionally not replayed
→ DarfusApiError 409 AUTH_REFRESHED_RETRY_REQUIRED
→ Arabic manual-review message
```

`GET_AND_POST_CALL_CHAIN_COMPARISON = COMPLETE`.

## 6. Client/API Instance Comparison

| Question | Finding | Evidence |
|---|---|---|
| GET HTTP client | `lib/api/client.ts:apiClient` | Pearl page contract effect |
| POST HTTP client | `lib/api/client.ts:apiClient` | Pearl `submit()` |
| Same client instance | `YES` | Same exported function |
| Same base URL | `YES` | `NEXT_PUBLIC_API_URL` runtime value |
| Same auth header source | `YES` | `readStoredToken()` and `execute()` |
| Same cookie credential mode | `YES` | No explicit credentials override; browser default applies equally |
| Same 401 interceptor | `YES` | Same `apiClient` response path |
| Same refresh behavior | `YES` | `refreshAccessToken()` shared path |
| Same company injection | `YES` | `resolvedCompanyIdForRequest()` |
| Same branch injection | `YES` | `resolvedBranchIdForRequest()` and explicit page `branchId` |

There is no different Axios/fetch client on the Confirm path. The difference is method safety: GET may be retried after refresh; POST is deliberately not retried.

## 7. Auth Transport Comparison

| Transport item | GET | Confirm POST | Evidence |
|---|---|---|---|
| Authorization header | YES when stored access token exists | YES on initial attempt; token rejected by `jwt.verify` | `apiClient.execute`, Backend 401 |
| Access token source | localStorage or sessionStorage key | same | `readStoredToken()` |
| Refresh token source | localStorage or sessionStorage key | same refresh path | `readStoredRefreshToken()` |
| Cookie value | not recorded | not recorded | bearer-token design; secrets redacted |
| Credentials option | omitted/default browser behavior | omitted/default browser behavior | same `fetch` construction |
| X-Company-ID | injected for both | injected for both | company accessor |
| X-Branch-ID | injected for both | injected for both | branch accessor/page option |
| X-Device-Session-ID | injected with access token | injected with access token | `getOrCreateDeviceSessionId()` |
| Content-Type | `application/json` | `application/json` | `apiClient` |
| Origin | browser origin `http://localhost:3000` | same | runtime configuration |
| CSRF header/token | none identified | none identified | bearer auth/CORS architecture |

No password, access token, refresh token, cookie, session secret, or idempotency key value is reproduced in this report.

## 8. Network Evidence

Safe metadata from the prior failed run and Backend logs:

| Request | Method | Status | Timestamp | Result |
|---|---:|---:|---|---|
| `/api/v1/inventory-v2/pearl-jewellery/contract` | GET | 200 | 22:28:53 | route completed |
| `/api/v1/purchase-orders/receive` | POST | 401 | 22:39:39 | auth failure |
| `/api/v1/auth/refresh` | POST | 200 | 22:39:39 | token rotation succeeded |

The prior browser artifact records the failed UI result and zero DB delta but does not contain a complete header dump. Source inspection supplies the header-name comparison without exposing values.

## 9. Acceptance Artifact Review

Reviewed without modification:

- `04-exact-prepared-request.json`: exact request retained before the previous Confirm.
- `05-canonical-business-payload.sha256`: existing canonical hash artifact.
- `10-auth-session-proof.json`: protected GET `200`, exact request recompare, no automatic retry.
- `13-live-receive-network.json`: one prior Confirm attempt, session-refresh UI result, zero official delta.

The previous auth proof validated a protected GET and request parity. It did not validate that the access token would remain valid until the later critical POST.

## 10. 401 Refresh Path

Source path in `lib/api/client.ts`:

1. Initial response is `401`.
2. `refreshAccessToken()` reads the stored refresh token.
3. It calls `POST /auth/refresh` with JSON body and no business headers.
4. Backend `auth.routes.js` applies rate limiting and `auth.controller.refresh` calls `technicalSessions.rotateRefreshToken()`.
5. Logs show refresh `200` and token rotation.
6. On an unsafe method, `apiClient` throws `AUTH_REFRESHED_RETRY_REQUIRED` instead of replaying the original POST.

```text
REFRESH_ATTEMPTED = YES
REFRESH_RESULT = HTTP 200 / token rotation succeeded
ORIGINAL_POST_RETRIED_AUTOMATICALLY = NO
```

This is intentional duplicate-prevention behavior, not a business-rule failure.

## 11. Session Expiry Timeline

| Event | Evidence |
|---|---|
| T0 | Last recorded refresh issued a new access token at approximately 22:24:23; access expiry configuration is 15 minutes |
| T1/T2 | Pearl contract GET completed `200` at 22:28:53 |
| T3 | Confirm was clicked in the previous control; exact click timestamp is represented by the failed POST log |
| T4 | Receive POST reached Backend at 22:39:39 |
| T5 | `jwt.verify` failed; Backend returned `401` |
| T6 | Refresh POST completed `200`; frontend surfaced manual retry message |

`TOKEN_EXPIRED_BETWEEN_GET_AND_POST = YES, supported by 15m ACCESS_EXPIRY and timestamps; raw JWT/exp was not recorded.` The Backend currently collapses expired, malformed, and signature-invalid JWT verification into the same Unauthorized response, so the exact JWT failure subtype is not separately observable.

## 12. Backend Middleware Comparison

| Layer | Pearl contract GET | Receive POST |
|---|---|---|
| Auth | `authMiddleware` | `authMiddleware` |
| Permission | `requirePermission("inventory.view")` | `requireBusinessPermission("suppliers.create", { touch: true })` |
| Company context | required for Super Admin | required for Super Admin |
| Branch context | header or request branch used for reads | header/request branch validated by receive contract |
| CSRF | none identified | none identified |
| Body parser | JSON app parser | same JSON app parser |
| DB transaction | no business transaction | created only after auth/contract prechecks |
| Idempotency claim | not applicable | after auth and supplier/branch/location validation |

The failed POST stopped inside authentication. It did not reach permission middleware, receive contract validation, transaction creation, or idempotency claim.

## 13. Backend Log Correlation

| Finding | Result |
|---|---|
| Request reached Backend | YES |
| Route matched | YES; morgan recorded `/purchase-orders/receive 401` |
| Auth middleware entered | YES |
| JWT validation failed | YES; stack at `jwt.verify` catch |
| Business permission reached | NO |
| Business handler reached | NO |
| DB transaction opened by receive handler | NO |
| Idempotency claim created | NO |
| PO/Asset/Journal writes | NO |

`BUSINESS_PERSISTENCE = 0` is supported by both route ordering and DB recheck.

## 14. Official DB Zero-Delta Recheck

Read-only query result:

```text
current_database = darfus_erp
purchase_orders = 12
assets = 12
PEARL_JEWELLERY assets = 0
PL barcodes = 0
journal_entries = 15
idempotency_requests = 16
```

`OFFICIAL_DB_BUSINESS_DELTA_FROM_FAILED_CONFIRM = 0`.

## 15. Root Cause

`AUTH_ROOT_CAUSE_STATUS = PROVEN`.

Root cause:

1. The page loaded the contract and previews through `apiClient` and received valid `200` responses.
2. The page retained the exact prepared request while the access token aged.
3. `ACCESS_EXPIRY` is configured as `15m`.
4. At Confirm, Backend `jwt.verify` rejected the access JWT, producing `401` before receive business code.
5. The shared client refreshed successfully, but deliberately did not replay an unsafe POST.

This is an Auth/session timing defect in the critical workflow gate, not a Pearl formula, Tax, Inventory, Barcode, Accounting, or permission-authority defect.

## 16. Why Protected GET 200 Was Insufficient

The previous gate treated “protected GET returned 200” as current POST authorization proof. A GET only proves the token was accepted at the time of that GET. It does not prove:

- the token will remain valid through user review time;
- the same access token is still current at Confirm;
- refresh has not become necessary;
- the unsafe POST can be safely replayed after refresh.

The current client correctly refuses automatic replay, so the missing control was a pre-Confirm auth-freshness gate.

## 17. Minimum Fix Design (No Implementation)

No source fix was applied. Minimum safe design:

- File/function: `lib/api/client.ts`, an exported pre-confirm auth freshness helper used by Pearl `submit()`, or the smallest equivalent shared helper.
- Current behavior: first discovery of an expired access token occurs on the business POST; refresh succeeds; original POST is not replayed.
- Correct behavior: before opening/confirming a critical mutation, use the same client/session transport to ensure the access token is currently valid. If refresh is needed, complete it first, then re-read current auth state and recompare the retained request/hash before allowing Confirm.
- If refresh fails: block Confirm without sending the business POST.
- If the token changes: invalidate the old prepared confirmation and require a fresh review/hash comparison.
- Do not increase token lifetime as a workaround.
- Do not replay the original unsafe POST automatically.
- Security impact: fail closed; no bypass.
- Business logic impact: none expected.
- DB migration: none expected.
- Rollback: revert only the client/helper and focused tests; no business data rollback required.

## 18. LL-011 Prevention Gate

Evidence-based permanent gate:

```text
SAME_CLIENT_AUTH_PATH_PROOF = REQUIRED
PRE_CONFIRM_AUTH_FRESHNESS_CHECK = REQUIRED
IF_ACCESS_TOKEN_NOT_CURRENT:
  REFRESH_WITH_EXISTING_AUTH_REFRESH_PATH
  REQUIRE_REFRESH_SUCCESS
  RECOMPARE_EXACT_PREPARED_REQUEST_AND_CANONICAL_HASH
  THEN_ALLOW_ONE_MANUAL_CONFIRM
NO_AUTOMATIC_RETRY_OF_UNSAFE_POST = REQUIRED
```

The gate must prove auth freshness at Confirm, not merely an earlier GET `200`.

## 19. Regression Test Design

Required tests for the future minimum fix:

1. GET `200`, access token near/at expiry, Confirm preflight refreshes before business POST.
2. Refresh failure blocks Confirm and sends zero `/purchase-orders/receive` requests.
3. Refresh success changes token; exact request and canonical hash are rechecked before Confirm.
4. A `401` received during an unsafe POST never triggers automatic replay.
5. GET and POST use the same base URL, auth source, company/branch headers, and client instance.
6. A successful business Receive still uses one idempotency key and one exact request.
7. Official DB remains untouched in auth-failure tests; use isolated/disposable test state only.

## 20. Retry Readiness

`RETRY_READINESS = READY_AFTER_MINIMUM_AUTH_FIX`.

This audit does not authorize retry. The source/procedure fix must be owner-approved and verified first.

## 21. P0/P1

- `P0 = 0`: no data corruption, accounting corruption, security bypass, or partial persistence.
- `P1 = 1`: official Pearl closure remains blocked by the Confirm auth freshness path.

The P1 is now root-cause classified but remains operationally open until the minimum fix/procedure is approved and verified.

## 22. Gate

```text
GATE = PASS_PEARL_JEWELLERY_CONFIRM_AUTH_PATH_FORENSIC_AUDIT
AUTH_ROOT_CAUSE = PROVEN
OFFICIAL_DB_BUSINESS_DELTA = 0
RETRY_EXECUTED = NO
PEARL_JEWELLERY_MODULE_STATUS = OPEN
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

This is a forensic-audit PASS only. It is not a Receive or final Pearl workflow closure.

## 23. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PEARL-JEWELLERY-CONFIRM-AUTH-PATH-FORENSIC-AUDIT
MODE = READ_ONLY_AUTH_FORENSIC
LOCAL_MAIN_DB = darfus_erp
PRIOR_PROTECTED_GET_HTTP = 200
PRIOR_CONFIRM_HTTP = 401
GET_HTTP_CLIENT_INSTANCE = lib/api/client.ts:apiClient
POST_HTTP_CLIENT_INSTANCE = lib/api/client.ts:apiClient
SAME_CLIENT_INSTANCE = YES
SAME_BASE_URL = YES
SAME_AUTH_HEADER_SOURCE = YES
SAME_COOKIE_CREDENTIAL_MODE = YES_DEFAULT_SAME_ORIGIN
SAME_401_INTERCEPTOR = YES
SAME_REFRESH_BEHAVIOR = YES
SAME_COMPANY_CONTEXT_INJECTION = YES
SAME_BRANCH_CONTEXT_INJECTION = YES
REFRESH_ATTEMPTED = YES
REFRESH_RESULT = HTTP 200 TOKEN ROTATION
TOKEN_EXPIRED_BETWEEN_GET_AND_POST = YES_SUPPORTED_BY_TIMELINE_AND_JWT_VERIFY_FAILURE
FAILED_POST_REACHED_BACKEND = YES
FAILED_POST_REACHED_BUSINESS_TRANSACTION = NO
FAILED_POST_IDEMPOTENCY_CLAIM_CREATED = NO
OFFICIAL_DB_BUSINESS_DELTA_FROM_FAILED_CONFIRM = 0
AUTH_ROOT_CAUSE_STATUS = PROVEN
AUTH_ROOT_CAUSE = ACCESS JWT WAS NO LONGER VALID AT CONFIRM; REFRESH SUCCEEDED; UNSAFE POST WAS NOT AUTOMATICALLY RETRIED
WHY_GET_200_WAS_INSUFFICIENT = GET VALIDATED AN EARLIER TOKEN STATE, NOT AUTH FRESHNESS AT THE LATER CRITICAL POST
MINIMUM_FIX_REQUIRED = YES
MINIMUM_FIX_SCOPE = PRE-CONFIRM AUTH FRESHNESS/REFRESH CHECK IN THE EXISTING API CLIENT PATH; RECOMPARE REQUEST/HASH; NO UNSAFE AUTO-RETRY
LL011_PREVENTION_GATE = SAME CLIENT AUTH FRESHNESS AT CONFIRM; REFRESH IF NEEDED; RECOMPARE EXACT REQUEST/HASH; MANUAL CONFIRM ONLY; NO AUTOMATIC UNSAFE POST RETRY
RETRY_READINESS = READY_AFTER_MINIMUM_AUTH_FIX
SOURCE_CHANGES = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
BUSINESS_WRITES = 0
RECEIVE_EXECUTED = NO
RETRY_EXECUTED = NO
P0_COUNT = 0
P1_COUNT = 1
GATE = PASS_PEARL_JEWELLERY_CONFIRM_AUTH_PATH_FORENSIC_AUDIT
PEARL_JEWELLERY_MODULE_STATUS = OPEN
NEXT_RECOMMENDED_STEP = OWNER REVIEW THEN PEARL_JEWELLERY_CONFIRM_AUTH_PATH_MINIMUM_SAFE_FIX
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 24. Ready-to-Copy LL-011 Continuity Update

```text
LL-011 — PROTECTED GET 200 IS NOT SUFFICIENT AUTH PROOF FOR CRITICAL POST

Problem:
Protected Pearl contract GET returned 200, but the later critical Confirm POST returned 401.

Root Cause:
The access JWT had passed its valid window by Confirm. Backend jwt.verify rejected it before the receive handler. The shared apiClient refreshed the token successfully, then intentionally refused to replay the unsafe POST.

Why the previous gate failed:
It proved an earlier GET and request/hash parity, but did not prove auth freshness at the moment of Confirm or account for the elapsed review time.

Minimum Fix:
Use the existing apiClient/auth refresh path before critical Confirm when the access token is not current. After refresh, re-read auth state and recompare the exact request and canonical hash. Block if refresh or parity fails.

Permanent Prevention Gate:
SAME_CLIENT_AUTH_PATH_PROOF + PRE_CONFIRM_AUTH_FRESHNESS_CHECK + SUCCESSFUL_REFRESH_WHEN_NEEDED + EXACT_REQUEST/HASH_RECOMPARE + NO_AUTOMATIC_UNSAFE_POST_RETRY.

Regression Test:
Expire/age the access token in isolated test state; assert refresh occurs before Confirm, failed refresh sends zero business POSTs, changed request/hash blocks, and no unsafe POST is replayed automatically after a 401.

Affected Critical Modules:
Pearl Jewellery Confirm, Supplier Receive V2 entry, Auth API client, technical session refresh, company/branch context, and all future critical inventory Confirm flows.
```

## Stop

`STOP` — no retry, no Receive, no source fix, no database/config change, and no automatic next batch.
