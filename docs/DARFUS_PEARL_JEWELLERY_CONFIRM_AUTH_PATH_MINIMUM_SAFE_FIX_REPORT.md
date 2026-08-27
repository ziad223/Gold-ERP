# DARFUS ERP — Pearl Jewellery Confirm Auth Path Minimum Safe Fix

Control ID: `DARFUS-PEARL-JEWELLERY-CONFIRM-AUTH-PATH-MINIMUM-SAFE-FIX`

## 1. الملخص التنفيذي

تم تنفيذ إصلاح وقائي محدود لمسار التأكيد فقط. لا يوجد Receive جديد، ولا يوجد Confirm click، ولا توجد كتابة أعمال على `darfus_erp`. تمت إضافة فحص صلاحية الجلسة قبل فتح التأكيد وقبل POST الحرج، مع هامش أمان 60 ثانية، وإعادة قراءة حالة الجلسة والسياق ثم مطابقة الطلب والـcanonical business hash. حارس عدم إعادة إرسال POST غير الآمن بعد `401` بقي فعالًا.

النتيجة: الاختبارات المركزة، TypeScript، build الإنتاجي، وAR/EN preflight نجحت. قاعدة البيانات الرسمية بقيت دون تغيير، وسجل الخادم يثبت صفر `POST /api/v1/purchase-orders/receive`.

## 2. Preserved Failed-Acceptance Evidence

تم الحفاظ على دليل الفشل السابق كما هو في:

- `docs/DARFUS_PEARL_JEWELLERY_CONFIRM_AUTH_PATH_FORENSIC_AUDIT_REPORT.md`

السبب السابق المثبت: انتهت صلاحية Access JWT قبل Confirm؛ رفضه `authMiddleware` بـ`401` قبل مسار الأعمال، نجح refresh، ثم رفض العميل إعادة إرسال POST غير الآمن تلقائيًا. لا تعديل على بيانات ذلك الفشل.

## 3. Supplier V2 / Auth Path Contract Trace

| نقطة | الدليل | النتيجة |
|---|---|---|
| مسار refresh | `lib/api/client.ts:239-269`، `refreshAccessToken` | إعادة استخدام المسار القائم ونفس التخزين، دون كشف token |
| مسار الأعمال | `app/.../inventory/pearl/page.tsx:62` | لا يصل إلى POST إلا بعد preflight ناجح |
| POST بعد 401 | `lib/api/client.ts:416-427` | `AUTH_REFRESHED_RETRY_REQUIRED`، لا auto-replay للـunsafe POST |
| الـscope | `backend/src/routes/erp.routes.js` و`backend/src/services/idempotency.service.js:31` | `purchase.receive` |

## 4. Auth Freshness Semantics

تم اختيار هامش أمان `60` ثانية. هذا يمنع انتهاء الجلسة أثناء نافذة المراجعة أو زمن الشبكة دون تمديد lifetime أو تغيير سياسة الخادم. التوكنات لا تُرجع من helper ولا تُسجل في artifacts.

الحالات:

- `FRESH`: الصلاحية تتجاوز هامش الأمان ولا refresh.
- `REFRESHED`: refresh مطلوب ونجح، ثم أعيدت قراءة الحالة وثبتت صلاحيتها.
- `BLOCKED_AUTH`: refresh فشل أو بقيت الصلاحية غير مؤكدة؛ لا يسمح بالتأكيد.

التنفيذ: `lib/api/auth-freshness.ts:1-54`.

## 5. Pearl Pre-Confirm Guard

في `app/[locale]/(dashboard)/inventory/pearl/page.tsx:51-62`:

1. يلتقط الطلب exact مع idempotency key جديد عند فتح المراجعة.
2. يحفظ نسخة immutably في state.
3. يأخذ company/branch context قبل الفحص.
4. ينفذ `preConfirmAuthFreshness` عبر نفس عميل API ومسار refresh.
5. يعيد قراءة context بعد الفحص.
6. يعيد بناء candidate من الحالة الحالية بنفس idempotency key.
7. يقارن canonical hash للطلب المحفوظ مع candidate.
8. عند النجاح فقط يفتح نافذة التأكيد بحالة `READY_TO_CONFIRM`.
9. قبل POST النهائي يعيد نفس الفحص مرة أخرى.

أي اختلاف في السياق أو hash ينتج `REVIEW_REQUIRED` ولا يسمح بالـPOST.

## 6. Tax / Inventory / Accounting Scope

لم يتم تغيير Tax Engine أو VAT أو pricing أو Asset أو Inventory أو Accounting. هذا Control يغير gate الجلسة فقط. لا migrations ولا seed ولا master-data mutation.

## 7. Request Hash Canonicalization

تمت مطابقة الخوارزمية الموجودة في الخادم داخل `lib/api/canonical-business-hash.ts:1-22`:

- scope = `purchase.receive`
- params = `{}`
- object keys مرتبة تصاعديًا
- `idempotencyKey` و`idempotency-key` مستبعدان
- SHA-256 للنص canonical

اختبار العميل قارن الناتج مباشرة مع `backend/src/services/idempotency.service.js:31-39`، وأثبت أن تغيير payload يغير hash.

## 8. Refresh Safety / Unsafe POST Rule

`NO_AUTOMATIC_RETRY_OF_UNSAFE_POST = REQUIRED` ما زال مطبقًا. إذا واجه POST غير آمن `401` ثم نجح refresh، فإن `apiClient` يرفع `409/AUTH_REFRESHED_RETRY_REQUIRED` بدل إعادة إرسال POST. الإصلاح الحالي يسبق هذه الحالة بفحص freshness ولا يحولها إلى retry تلقائي.

## 9. Auth Failure Handling

عند فشل refresh: الحالة `BLOCKED_AUTH`، رسالة مستخدم عامة، ولا business POST. لا token أو refresh token أو raw authorization header في التقرير أو artifacts.

## 10. Context and Request Revalidation

تم استخدام `requestContextSnapshot` من `lib/api/client.ts:291-295`. يعاد فحص company/branch بعد refresh وقبل السماح بالتأكيد. الطلب الحالي يعاد حساب hash له من form state؛ تغيير form أو preview identity أثناء الفحص يمنع فتح التأكيد أو يمنع POST.

## 11. Focused Tests

الأمر:

```text
node --test tests/pearl-confirm-auth-freshness.test.cjs tests/pearl-size-ui-binding.test.cjs
```

النتيجة: `4/4 PASS`.

التغطية:

- fresh token: لا refresh.
- near-expiry: refresh ثم إعادة تحقق.
- expired: refresh ثم إعادة تحقق.
- refresh failure: `BLOCKED_AUTH`.
- client/server canonical hash parity.
- changed payload produces a different hash.
- existing unsafe POST guard remains present.

## 12. Regression Tests

الأمر:

```text
node --test tests/pearl-confirm-auth-freshness.test.cjs tests/pearl-jewellery-minimum-safe-implementation.test.cjs tests/pearl-size-ui-binding.test.cjs tests/authorization-runtime-fix-cont3.test.mjs tests/authorization-runtime-fix-cont4.test.mjs
```

النتيجة: `16/16 PASS`.

## 13. Typecheck and Build

- `npm run typecheck` = `PASS`
- `npm run build` = `PASS`
- Build used production `next build`; no Next dev runtime was started.
- Backend source was not changed; backend rebuild/recreate was not required.

## 14. AR Read-Only Browser Proof

Path: `/ar/inventory/pearl`.

- Profile Preview = `READY`
- Shared Preview = `READY`
- Session preflight = `READY_TO_CONFIRM`
- Prepared request retained = yes
- `inventoryV2` = true
- item count = 1
- perPiece count = 1
- Console errors = 0
- Confirm clicked = no

The browser used synthetic Pearl data only. The browser token was not printed. The page did not require a refresh because the session was valid beyond the 60-second freshness gate; refresh behavior is covered by focused tests.

## 15. EN Read-Only Browser Proof

Path: `/en/inventory/pearl`.

- Profile Preview = `READY`
- Shared Preview = `READY`
- Session preflight = `READY_TO_CONFIRM`
- Prepared request retained = yes
- `inventoryV2` = true
- item count = 1
- perPiece count = 1
- Console errors = 0
- Confirm clicked = no

## 16. Prepared Request Inspection

تم فحص الطلب المحفوظ داخليًا دون طباعته. الإثبات الآمن:

| Field | Proof |
|---|---|
| idempotency key lifecycle | generated once for the retained request; value not recorded |
| `inventoryV2` | `true` |
| `items` | one item |
| `perPiece` | one piece |
| `unitCost` | numeric value present; raw request not exported |
| exact request reuse | same retained object is used by submit path |
| business hash | recomputed before confirm and before POST |

## 17. Network Proof — No Final Receive

Backend logs for the browser proof window showed contract and preview requests only:

- contract: observed
- Pearl profile preview: observed
- shared receive preview: observed
- `POST /api/v1/purchase-orders/receive`: `0`
- Confirm clicks: `0`

## 18. Official DB No-Mutation Proof

Read-only query verified `current_database() = darfus_erp`.

| Entity | Previous baseline | Current observed | Delta |
|---|---:|---:|---:|
| `purchase_orders` | 12 | 12 | 0 |
| `assets` | 12 | 12 | 0 |
| `assets` with `PEARL_JEWELLERY` | 0 | 0 | 0 |
| `journal_entries` | 15 | 15 | 0 |
| `idempotency_requests` | 16 | 16 | 0 |
| `purchase_order_items` | — | 12 | not mutated; no receive POST |
| `journal_lines` | — | 42 | not mutated; no receive POST |
| `pearl_size_master_data` | — | 39 | read-only observed |

`OFFICIAL_DB_BUSINESS_DELTA = 0`. No SQL INSERT/UPDATE/DELETE/TRUNCATE/backfill was run.

## 19. Artifacts

Created under:

`backend/acceptance-artifacts/pearl-jewellery/DARFUS-PEARL-JEWELLERY-CONFIRM-AUTH-PATH-MINIMUM-SAFE-FIX/`

Artifacts 01–11 contain only redacted evidence metadata. No raw token, refresh token, authorization header, idempotency key, or raw hash is stored.

## 20. Files Changed

Intentional files for this Control:

- `lib/api/auth-freshness.ts`
- `lib/api/canonical-business-hash.ts`
- `lib/api/client.ts`
- `app/[locale]/(dashboard)/inventory/pearl/page.tsx`
- `tests/pearl-confirm-auth-freshness.test.cjs`
- `docs/DARFUS_PEARL_JEWELLERY_CONFIRM_AUTH_PATH_MINIMUM_SAFE_FIX_REPORT.md`
- acceptance artifacts 01–11 listed above

The worktree contained extensive pre-existing changes. They were not cleaned, reverted, staged, or otherwise taken over. `next-env.d.ts` remains an Owner-accepted generated drift and was not edited by this Control.

## 21. Risk / Regression Matrix

| Risk | Mitigation | Result |
|---|---|---|
| token expires during review | 60-second preflight margin and refresh path | covered |
| refresh fails | block before business POST | tested |
| context changes | pre/post company/branch comparison | implemented |
| form/preview changes | exact request hash recompare | tested |
| unsafe 401 replay | existing 409 guard preserved | tested statically |
| token leakage | status-only result and redacted artifacts | pass |
| business mutation during proof | no Confirm, zero receive POST, DB delta 0 | pass |

## 22. Remaining Risks

- A live authenticated Receive was intentionally not executed in this Control, so end-to-end business posting remains pending Owner authorization.
- Browser proof used a fresh session that was already beyond the safety margin; the refresh branch is proven by focused synthetic tests rather than a live refresh.
- The pre-existing worktree is dirty and contains unrelated historical/current changes; no cleanup was performed.

## 23. Gate Evidence

| Gate | Result |
|---|---|
| `AUTH_ROOT_CAUSE` | `CLOSED_WITH_PREVENTION` |
| `PRE_CONFIRM_AUTH_FRESHNESS_CHECK` | `PASS` |
| `REFRESH_BEFORE_CRITICAL_CONFIRM` | `PASS_WHEN_NEEDED` |
| `REQUEST_HASH_RECOMPARE_AFTER_REFRESH` | `PASS` |
| `UNSAFE_POST_AUTO_REPLAY` | `NO` |
| `AR_AUTH_PREFLIGHT` | `PASS` |
| `EN_AUTH_PREFLIGHT` | `PASS` |
| `OFFICIAL_DB_BUSINESS_DELTA` | `0` |
| `RETRY_EXECUTED` | `NO` |
| `PEARL_JEWELLERY_MODULE_STATUS` | `OPEN` |
| `RETRY_READINESS` | `READY_FOR_OWNER_AUTHORIZED_RETRY` |

## 24. Final Decision

`GATE = PASS_PEARL_JEWELLERY_CONFIRM_AUTH_PATH_MINIMUM_SAFE_FIX`

This gate does not authorize a live Receive or retry. It only authorizes readiness for a separately approved retry.

## 25. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PEARL-JEWELLERY-CONFIRM-AUTH-PATH-MINIMUM-SAFE-FIX
LOCAL_MAIN_DB = darfus_erp
AUTH_ROOT_CAUSE = CLOSED_WITH_PREVENTION
AUTH_FRESHNESS_SAFETY_MARGIN_SECONDS = 60
PRE_CONFIRM_AUTH_FRESHNESS_CHECK = PASS
REFRESH_BEFORE_CRITICAL_CONFIRM = PASS_WHEN_NEEDED
REQUEST_HASH_RECOMPARE_AFTER_REFRESH = PASS
IDEMPOTENCY_HASH_INPUT_PROVEN = YES
UNSAFE_POST_AUTO_REPLAY = NO
AR_AUTH_PREFLIGHT = PASS
EN_AUTH_PREFLIGHT = PASS
OFFICIAL_DB_BUSINESS_DELTA = 0
OFFICIAL_DB_WRITES = 0
RECEIVE_EXECUTED = NO
RETRY_EXECUTED = NO
CONFIRM_CLICKS = 0
FOCUSED_TESTS = PASS
REGRESSION_TESTS = PASS
TYPECHECK = PASS
BUILD = PASS
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
MASTER_DATA_MUTATION = NO
TAX_SETTINGS_MUTATION = NO
GOLD_SETTINGS_MUTATION = NO
ONLINE_PRODUCTION_CONTACTED = NO
P0_COUNT = 0
P1_COUNT = 0
PEARL_JEWELLERY_MODULE_STATUS = OPEN
RETRY_READINESS = READY_FOR_OWNER_AUTHORIZED_RETRY
GATE = PASS_PEARL_JEWELLERY_CONFIRM_AUTH_PATH_MINIMUM_SAFE_FIX
NEXT_RECOMMENDED_STEP = PEARL_JEWELLERY_AUTHENTICATED_LIVE_RECEIVE_RETRY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

توقف هنا. لا يتم تنفيذ Receive أو Retry أو أي Batch لاحق تلقائيًا.
