# DARFUS ERP — Pearl Final Closure Blockers Minimum Safe Fix

بسيطًا: تم تنفيذ إصلاحي Replay المحلي وPOS Pearl، وتم إثبات Exact Replay و409 بدون أي business delta. الـfocused tests وtypecheck وbuild وصحة الخدمات نجحت. توجد ملاحظتان regression قديمتان تتوقعان أن Pearl معطّل، بينما المصدر الحالي يفعّله بعد إغلاق Pearl السابق؛ لذلك Gate النهائي مفتوح للمراجعة ولا أعتبر Pearl مغلقًا تلقائيًا.

## 1. Executive Summary

- Exact same-key/same-body replay: HTTP 201، أعاد النتيجة القائمة، دون إنشاء PO/Asset/Movement/Journal جديد.
- Same-key changed payload: HTTP 409، ودون أي business delta.
- POS barcode read-only: Asset واحد، `PEARL_JEWELLERY`، `AVAILABLE`، سعر 5000، قابل للاختيار، دون Checkout.
- AR/EN Asset readback: PASS، والبيانات الأصلية ثابتة.
- لا migration، لا seed، لا Receive جديد، لا تعديل يدوي للـDB.
- عائق المتابعة الوحيد هو عقدا اختبار UX قديمان، وليس فشلًا في إصلاح Pearl نفسه.

## 2. Scope / Owner Authorization

تم الالتزام بنطاق Control `DARFUS-PEARL-FINAL-CLOSURE-BLOCKERS-MINIMUM-SAFE-FIX`:

- Track A: قناة Replay محلية/اختبارية فقط عبر `apiClient` الحالي.
- Track B: معالجة Pearl POS الضيقة فقط.
- ممنوعات Control لم تُنفذ: New Receive، Checkout، migration، seed، master-data mutation، Tax/Accounting/Pearl formula change، cleanup.

## 3. Prior Forensic Gate

`PASS_PEARL_FINAL_CLOSURE_BLOCKERS_FORENSIC_AUDIT`.

الجذور السابقة كانت:

- Track A: سطح browser evaluation لا يملك قناة آمنة إلى `apiClient` الداخلي.
- Track B: invalid Pearl pricing policy كان يحوّل `Asset.price` الصالح إلى `0/unavailable`.

Evidence: [prior forensic report](I:/WORK/jewellery-erp-master/docs/DARFUS_PEARL_FINAL_CLOSURE_BLOCKERS_FORENSIC_AUDIT_REPORT.md).

## 4. Frozen Official Pearl Transaction

تم الحفاظ على المعاملة القائمة:

| Record | Value |
|---|---|
| PO | `PO-1787391626460` |
| Asset | `AST-PUR-1787391626468-1-1-wf0w` |
| Barcode | `PLRNG18000001` |
| Journal | `JE-1787391626555` |
| Asset.price | `5000` |

## 5. Files Changed

التغييرات المقصودة فقط:

- [erp.routes.js](I:/WORK/jewellery-erp-master/backend/src/routes/erp.routes.js:7740): Pearl positive `Asset.price` authority.
- [client.ts](I:/WORK/jewellery-erp-master/lib/api/client.ts:165): redacted response-status callback للـlocal acceptance helper.
- [pearl-replay-helper.ts](I:/WORK/jewellery-erp-master/lib/debug/pearl-replay-helper.ts:1): helper محلي/query-gated.
- [Pearl page](I:/WORK/jewellery-erp-master/app/[locale]/(dashboard)/inventory/pearl/page.tsx:39): harness غير ظاهر إلا في localhost مع query صريح.
- [focused test](I:/WORK/jewellery-erp-master/tests/pearl-final-closure-minimum-safe-fix.test.cjs:1).

Git status لم يكن متاحًا بسبب `dubious ownership`؛ لم أغيّر Git config ولم أنفذ reset/restore/clean/stash.

## 6. Same-Session Replay Helper Design

الـhelper:

- يعمل فقط على `localhost` ومع `?pearlReplayTest=1`.
- يستخدم `apiClient` نفسه، ويترك المصادقة والـCompany/Branch headers للمسار المعتاد.
- يرسل body المحفوظ كما هو؛ لا يعيد بناءه من form state.
- Exact وchanged زران one-shot، والـchanged لا يُتاح قبل نجاح exact.
- لا يضيف workflow للمستخدم ولا يظهر في الوضع العادي.

## 7. Auth / Secret Safety

- `RAW_TOKEN_EXPORT = NO`.
- `PASSWORD_REENTRY = NO`.
- لا Authorization header يدوي، ولا cookie extraction.
- helper يعيد metadata فقط؛ لا token/refresh token/cookie/password.
- Auth result في الاختبارين: `FRESH`.

## 8. Exact Request / Key Preservation

Evidence أثبت:

- `EXACT_REQUEST_PRESENT = YES`.
- `SAME_KEY_REFERENCE_PRESENT = YES`.
- `BUSINESS_PAYLOAD_RECONSTRUCTION = NO`.
- canonical hash الأصلي مطابق: `315147360599ce7c359c22074dc33dc4f423ea48f7ad70df4e9a7c66a0b03453`.
- `unitCost = 3984` و`perPiece[0].purchaseCost = 3984`.
- `taxIncluded = false`، `applyVat = true`، `inventoryV2 = true`.

قيمة المفتاح نفسها غير معروضة في التقرير.

## 9. Replay Helper Focused Tests

`tests/pearl-final-closure-minimum-safe-fix.test.cjs`: PASS.

يغطي local/query gate، apiClient، عدم كشف الأسرار، parity، one-shot behavior، وchanged conflict path.

## 10. POS Price Fix

في [erp.routes.js](I:/WORK/jewellery-erp-master/backend/src/routes/erp.routes.js:7742)، إذا كان profile هو `PEARL_JEWELLERY` و`Asset.price` رقمًا موجبًا صالحًا، يعاد مباشرة كسعر البيع. هذا يمنع optional invalid pricing policy من تصفير السعر الصالح.

لم تتغير قيمة `Asset.price` في DB.

## 11. Fail-Closed Behavior

إذا كانت `Asset.price` مفقودة أو غير منتهية أو `<= 0`، لا يتم اختراع سعر ولا Product fallback؛ يبقى unavailable وفق المسار السابق.

## 12. POS Focused Tests

PASS للحالات التالية: سعر موجب، policy سالبة غير مؤثرة على السعر، missing/invalid price fail-closed، no Product fallback، وعدم تغيير مسارات أخرى.

## 13. Cross-Profile Regression

الاختبارات الأوسع: 54 PASS و2 FAIL. الفشلان قديمان/stale:

- `unified-inventory-intake-ux-02-r3.test.cjs` يتوقع Pearl disabled.
- `unified-inventory-ux-final-closure.test.cjs` يتوقع Pearl disabled.

المصدر الحالي يعرّف Pearl enabled، ولم يتغير chooser في هذا Control. هذا `ACCEPTANCE_GAP / PRE_EXISTING_TEST_CONTRACT_DRIFT` وليس regression ناتجًا عن Track A/B.

## 14. Typecheck / Build

- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- backend `node --check`: PASS.
- migrations executed: 0.
- seeds executed: 0.

## 15. Runtime Health

بعد تشغيل backend المحلي بأمر `npm start` فقط، دون Compose migration command:

| Check | Result |
|---|---|
| API health | HTTP 200 |
| DB health | HTTP 200 |
| Redis health | HTTP 200 |
| Frontend | `next start` أعيد تشغيله بعد إثبات stale build |
| Frontend Pearl test harness | ظهر فقط مع query المحلي |

## 16. Official DB Baseline

`current_database() = darfus_erp`.

Baseline counts: PO 13، PO items 13، Assets 13، Pearl Assets 1، Components 10، Pearl details 1، Barcode history 13، Origins 13، Cost revisions 13، Valuations 13، Movements 13، Journals 16، Journal lines 45، Idempotency requests 17، Cash transactions 3.

Artifact: [06-pre-acceptance-db-baseline.json](I:/WORK/jewellery-erp-master/backend/acceptance-artifacts/pearl-jewellery/DARFUS-PEARL-FINAL-CLOSURE-BLOCKERS-MINIMUM-SAFE-FIX/06-pre-acceptance-db-baseline.json).

## 17. Fresh Backup

- File: `backend/backups/darfus_erp_pearl_minimum_safe_fix_20260822_1040.dump`
- `pg_dump exit = 0`
- Bytes: `713064`
- SHA256: `8d356e197d201d39d001674465edab90f95778224536661bb4bf32222355b92c`
- `pg_restore -l = PASS`, 1194 TOC lines.

## 18. Exact Replay

Exact replay أُرسل مرة واحدة عبر نفس page/session helper:

- HTTP 201.
- Auth `FRESH`.
- Company context match `true`.
- Branch context match `true`.
- Existing PO/Asset/Barcode result preserved.
- Backend log يثبت POST واحدًا فقط في هذا المسار لهذا replay.

## 19. Exact Replay DB Delta

كل deltas = 0: PO، PO item، Asset، Component، Barcode، Origin، Movement، Cost revision، Valuation، Journal، Journal line، Cash. صف idempotency الأصلي بقي منطقيًا كما هو، والـrequest hash لم يتغير.

## 20. Changed-Payload 409

تم تغيير `notes` فقط مع الإبقاء على نفس المفتاح، وأُرسل الطلب مرة واحدة:

- HTTP 409.
- State `CONFLICT`.
- لا automatic retry.

## 21. Changed-Payload DB Delta

كل business deltas = 0، وصف idempotency الأصلي بقي `succeeded / 201` بنفس hash.

## 22. POS API Readback

`GET /api/v1/pos/search?query=PLRNG18000001&type=all&limit=20&includeUnavailableExact=true` أعاد HTTP 200 ونتيجة Asset واحدة:

- Profile `PEARL_JEWELLERY`.
- Status `AVAILABLE`.
- Price `5000`.
- `priceUnavailable = false`.
- Authority = `Asset.price`.

## 23. POS Browser Readback

بالإنجليزية ظهرت نتيجة `Pearl Ring / PLRNG18000001 / AED 5,000.00`، والزر enabled/selectable. لم يتم Checkout.

## 24. AR Readback

Asset details بالعربية: PASS. السعر، Pearl data، barcode، status ثابتة، ولا يظهر Pearl master ID داخلي.

## 25. EN Readback

Asset details بالإنجليزية: PASS. السعر، Pearl data، barcode، status ثابتة، ولا يظهر Pearl master ID داخلي.

## 26. Accounting / Inventory Non-Regression

- Journal `JE-1787391626555`: debit `4541.76000000` = credit `4541.76000000`.
- Cost revision: row واحدة، total purchase cost `3984.00000000`، VAT `557.76000000`.
- Current valuation: row واحدة، total `7211.98359009`.
- Origin/movement/barcode/component rows الأصلية: كل منها 1 للـAsset.
- Cash delta: 0.
- No new accounting or inventory row from replay/conflict.

## 27. LL-015

`LL015 = CLOSED_WITH_LOCAL_SAME_SESSION_HELPER_AND_PRE_REPLAY_PROOF`.
تم إثبات القناة قبل POST، مع context/hash/auth checks، وبدون raw secret.

## 28. LL-016

`LL016 = CLOSED_WITH_PEARL_EXPLICIT_ASSET_PRICE_FALLBACK_PREVENTION`.
Invalid policy لم يعد يصفّر السعر الصالح، والـmissing price ما زال fail-closed.

## 29. P0/P1

- New P0: 0.
- New P1: 0.
- Historical Pearl blockers: مغلقة بالـprevention proof.
- Remaining acceptance issue: stale test contract، مصنف `P2 / ACCEPTANCE_GAP`، ولا يمنع سلامة DB أو POS fix لكنه يمنع Gate النهائي الآلي.

## 30. Gate

`GATE = OPEN_PREEXISTING_STALE_REGRESSION_TEST_CONTRACT`.

Track A وTrack B وexact replay و409 وPOS وDB safety كلها PASS، لكن لا أستخدم `PASS_PEARL_JEWELLERY_FINAL_CLOSURE_AFTER_IDEMPOTENCY_AND_POS_FIX` بسبب فشل الاختبارين القديمين المذكورين. Pearl module remains `OPEN` pending Owner decision on aligning/removing the stale disabled-Pearl assertions.

## 31. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PEARL-FINAL-CLOSURE-BLOCKERS-MINIMUM-SAFE-FIX
LOCAL_MAIN_DB = darfus_erp
PRIOR_FORENSIC_GATE = PASS_PEARL_FINAL_CLOSURE_BLOCKERS_FORENSIC_AUDIT
SOURCE_FILES_CHANGED = 5 intentional source/test files
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
NEW_RECEIVE_EXECUTED = NO
OFFICIAL_CONFIRM_CLICKS = 0
REPLAY_HELPER_IMPLEMENTED = YES
REPLAY_HELPER_LOCAL_TEST_ONLY = YES
REPLAY_HELPER_USES_EXISTING_APICLIENT = YES
RAW_TOKEN_EXPORT = NO
PASSWORD_REENTRY = NO
EXACT_REQUEST_RECONSTRUCTION = NO
AUTH_FRESHNESS_BEFORE_REPLAY = FRESH
COMPANY_CONTEXT_MATCH = true
BRANCH_CONTEXT_MATCH = true
POS_FIX_IMPLEMENTED = YES
DB_ASSET_PRICE = 5000
POS_API_PRICE_BEFORE = 0
POS_API_PRICE_AFTER = 5000
POS_PRICE_UNAVAILABLE_AFTER = false
POS_SELECTABLE_AFTER = true
FOCUSED_TESTS = PASS
REGRESSION = FAIL_PREEXISTING_STALE_TEST_CONTRACT
TYPECHECK = PASS
BUILD = PASS
PRE_ACCEPTANCE_DB_BASELINE = 13 PO / 13 Asset / 16 Journal / 17 Idempotency
PRE_ACCEPTANCE_BACKUP = VERIFIED
BACKUP_BYTES = 713064
BACKUP_SHA256 = 8d356e197d201d39d001674465edab90f95778224536661bb4bf32222355b92c
BACKUP_RESTORE_LIST = PASS / 1194 TOC lines
EXACT_REPLAY_REQUEST_COUNT = 1
EXACT_REPLAY_HTTP = 201
EXACT_REPLAY_RESULT = EXISTING_IDEMPOTENT_RESULT
EXACT_REPLAY_BUSINESS_DELTA = 0
CHANGED_PAYLOAD_REQUEST_COUNT = 1
CHANGED_PAYLOAD_HTTP = 409
CHANGED_PAYLOAD_STATE = CONFLICT
CHANGED_PAYLOAD_BUSINESS_DELTA = 0
POS_BARCODE = PLRNG18000001
POS_RESULT_COUNT = 1
POS_PRICE = 5000
POS_PRICE_AUTHORITY = ASSET_PRICE
POS_SELECTABLE = YES
POS_CHECKOUT = NO
AR_READBACK = PASS
EN_READBACK = PASS
ACCOUNTING_NON_REGRESSION = PASS
INVENTORY_NON_REGRESSION = PASS
LL015 = CLOSED_WITH_PREVENTION
LL016 = CLOSED_WITH_PREVENTION
P0_COUNT = 0
P1_COUNT = 0
GATE = OPEN_PREEXISTING_STALE_REGRESSION_TEST_CONTRACT
PEARL_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = NO
PEARL_JEWELLERY_MODULE_STATUS = OPEN
NEXT_RECOMMENDED_STEP = OWNER_DECISION_ON_STALE_PEARL_DISABLED_REGRESSION_ASSERTIONS
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 32. STOP

لا يوجد Receive جديد، ولا Checkout، ولا cleanup، ولا migration. توقفت هنا وفق Control. لا يبدأ أي batch لاحق تلقائيًا.
