# DARFUS ERP — Pearl Final Closure Blockers Forensic Audit

النتيجة: تم تنفيذ تدقيق Read-Only كامل لمساري Replay وPOS. لم يحدث Receive أو Replay أو 409 أو Checkout أو Business Write. تم إثبات سبب العائقين، لذلك Gate التدقيق PASS، لكن Pearl Module يظل OPEN حتى تنفيذ Fix مستقل ثم Acceptance جديد.

## 1. Executive Summary

- Track A: السبب الجذري لـ`BLOCKED_PEARL_IDEMPOTENCY` مثبت.
- Track B: السبب الجذري لـ`PEARL_POS_PRICE_READBACK` مثبت.
- Official DB delta خلال هذا الـControl: `0`.
- لا Source/Product/DB/Migration/Seed/Config changes.
- P0=0، P1=2 pending fix and acceptance.

## 2. Scope / Read-Only Proof

الـControl منع `POST /purchase-orders/receive` وReplay و409 وPOS checkout وأي SQL تجاري. تمت فقط قراءة المصدر، سجلات Backend، Official DB، وGET POS search. الأدلة في artifacts 01–19.

## 3. Frozen Successful Pearl Transaction

المعاملة الناجحة السابقة بقيت كما هي: PO `PO-1787391626460`، Asset `AST-PUR-1787391626468-1-1-wf0w`، Barcode `PLRNG18000001`، Journal `JE-1787391626555`، HTTP `201`.

## 4. Existing Lessons LL-011 to LL-014

لا توجد Regression جديدة: auth freshness، master-label protection، dispatch correlation، واستقلال diagnostics/interception ما زالت مثبتة من الـControl السابق.

## 5. LL-015 Problem Statement

تم تسجيل LL-015: كان يجب إثبات قناة authenticated post-success قبل تنفيذ live mutation. مسار Receive كان مثبتًا، لكن قناة Replay اللاحقة لم تكن قابلة للتنفيذ من سطح المتصفح الآمن.

# TRACK A

## 6. Authenticated Channel Inventory

القناة المدعومة هي `apiClient` داخل الصفحة. تقرأ token/session داخليًا، وتضيف Company/Branch وIdempotency-Key، ولا تتطلب تصدير secret. لكنها ليست global ولا يوجد Pearl replay helper. Browser evaluation قناة Read-Only وليست قناة HTTP مصادق عليها. Acceptance harness لديه request helper، لكنه يحتاج auth material في الذاكرة وليس نفس session الحالي.

## 7. Prior Replay Blocker Evidence

الـartifact السابق حفظ exact request وcanonical hash ومرجع المفتاح، لكن محاولة Replay لم تُرسل. لا يوجد POST Replay أو تغيير DB. السبب ليس فقدان الطلب؛ السبب هو عدم توفر قناة إرسال مصادق عليها من سطح التقييم.

## 8. Browser Evaluation / apiClient Boundary

القراءة الفعلية أعادت: `window.fetch=undefined`، `window.XMLHttpRequest=undefined`، `window.apiClient=undefined`. في المقابل، المصدر يثبت أن `lib/api/client.ts` يستدعي `fetch` داخل page runtime، والـConfirm السابق وصل إلى `201`. إذن page runtime متصل، لكن automation evaluation scope معزول Read-Only وapiClient module-scoped.

## 9. Auth Session Safety

`apiClient` يستخدم token/refresh داخليًا، auth freshness، Company/Branch resolution، وIdempotency header. لم تتم قراءة localStorage/sessionStorage/cookies، ولم يتم استخراج token أو إعادة إدخال password. لذلك لا يجوز استخدام curl أو Authorization يدويًا كحل.

## 10. Exact Request / Key Availability

Exact request artifact موجود، ومرجع المفتاح موجود، وcanonical hash موجود، ولا توجد حاجة لإعادة بناء business payload. هذا الجزء ليس سبب الفشل.

## 11. Official Idempotency Row

الصف الرسمي يثبت `scope=purchase.receive`، `status=succeeded`، HTTP `201`، hash `315147360599ce7c359c22074dc33dc4f423ea48f7ad70df4e9a7c66a0b03453`، والروابط إلى PO/Asset. لم يتم عرض قيمة المفتاح الخام.

## 12. Replay Root Cause

`IDEMPOTENCY_REPLAY_ROOT_CAUSE = PROVEN`: لا يوجد helper Replay داخل Pearl page، والسطح الخارجي لا يملك HTTP capability ولا وصولًا إلى `apiClient` أو session auth. Original page runtime auth ما زال مدعومًا، لكن لا توجد طريقة آمنة لاستدعائه بعد نجاح الصفحة من أداة Read-Only.

## 13. Replay Failure Layer

`REPLAY_BLOCKER_LAYER = BROWSER_EVALUATION_SURFACE + API_CLIENT_ACCESS`.

## 14. Safe Replay Channel Design

`SAFE_AUTHENTICATED_REPLAY_CHANNEL_DESIGN = PASS_DESIGN_ONLY`.

التصميم الأدنى: test-only same-session helper داخل page/module scope يستدعي نفس `apiClient` بالـexact saved body/key، ويترك auth freshness وCompany/Branch وIdempotency middleware كما هي. لا token export ولا password ولا cookie artifact. لم يتم تنفيذ التصميم في هذا الـControl.

## 15. Track A Future Tests

إضافة focused proof لقناة helper، exact same body/key existing result، zero business delta، changed payload `409`، auth refresh behavior، ومنع أي auto-retry غير آمن.

# TRACK B

## 16. POS Static Call Chain

`POS input → GET /pos/search → Asset query → resolveSearchAssetPrice → goldSalePricingService → addAsset(top-level price) → frontend searchItems → priceUnavailable → disabled result`.

المصدر: `app/[locale]/(dashboard)/pos/page.tsx:679-684, 1331-1366` و`backend/src/routes/erp.routes.js:7663-7850`.

## 17. DB Asset / Barcode / Price Proof

Official DB يثبت: `Asset.price=5000`، `inventory_profile=PEARL_JEWELLERY`، `operational_status=AVAILABLE`، barcode active، branch/location صحيحان. كما يثبت pricing policy غير صالح: `markup_percent=-20.964878`، `minimum_selling_price=5000`.

## 18. POS API Runtime Response

قراءة GET أعادت HTTP `304` في Backend correlation. الصفحة عرضت نتيجة واحدة: Pearl Ring، barcode `PLRNG18000001`، Pearl profile، 12g، 18K، top-level price `0.00`، ورسالة `Current selling price unavailable`. لا checkout.

## 19. DB-to-API Mapping

`DB_PRICE=5000` بينما `API_PRICE_FIELD=items[].price` وقيمته runtime `0`. `items[].rawItem.price` يحتفظ بقيمة 5000 حسب المصدر، لكن frontend يستخدم top-level `item.price`. لذلك `DB_TO_API_MAPPING=FAIL`.

## 20. Frontend Price Resolver

في API mode لا يستخدم POS القائمة المحلية أو `currentSellingPriceForAsset`; يعتمد على `response.items`. بطاقة النتيجة لا تعيد حل السعر من `rawItem.price`. أي top-level zero يتحول مباشرة إلى unavailable.

## 21. Availability / Disabled-State Resolver

السبب المثبت: `priceUnavailable = unavailable || (!item.isProduct && (!Number.isFinite(item.price) || item.price <= 0))`. DB availability سليمة، لكن السعر top-level صفر، فتم تعطيل الزر.

## 22. Cross-Profile Comparison

Pearl وGemstone وLoose profiles تمر في backend عبر loose-profile pricing branch؛ Gold profiles تمر عبر branch ديناميكي مختلف. لا يوجد دليل يسمح بتغيير Business Logic أو نقل Pearl إلى Product quantity. المقارنة تثبت gap في backend price-resolution/failure handling فقط.

## 23. POS Root Cause

`POS_ROOT_CAUSE = PROVEN`.

`PEARL_JEWELLERY` يدخل `calculateLooseProfileSalePrice`. هذه الدالة تقرأ policy markup السالب وتتحقق منه بحد أدنى صفر، فتفشل قبل استخدام `Asset.price=5000`. route يمسك الخطأ ويرجع `resolvedPrice=0` و`priceUnavailable=true`.

## 24. POS Failure Layer

`POS_FAILURE_LAYER = BACKEND_SEARCH + PRICE_RESOLVER`، مع أثر frontend في result-card disabled condition.

## 25. POS Minimum Fix Design

`POS_MINIMUM_FIX_DESIGN = PASS_DESIGN_ONLY`.

التصميم الأدنى: تعديل narrow في backend price-resolution boundary ليحافظ على `Asset.price` كسلطة البيع الصريحة عندما تكون صالحة، ولا يحول policy markup غير الصالح إلى zero. يظل fail-closed عند غياب/عدم صلاحية Asset.price. لا تغيير في Asset DB أو Pearl formulas أو Tax/Accounting/Supplier Receive/Barcode.

## 26. Track B Future Tests

اختبارات GET barcode لـPearl: result واحد، top-level price 5000، selectable AVAILABLE Asset، invalid/missing price fail-closed، no Product fallback، no checkout، وعدم Regression للملفات القائمة.

# SHARED

## 27. New Lessons / Prevention Gates

- LL-015 مسجل نهائيًا: authenticated post-success channel يجب إثباته قبل mutation.
- LL-016 مسجل: invalid loose-profile pricing policy لا يجوز أن يحول Asset.price الصالح إلى zero POS result.

## 28. Official DB Zero-Delta

في نهاية التدقيق: `current_database=darfus_erp`، purchase_orders=13، assets=13، Pearl assets=1، journal_entries=16، idempotency_requests=17، cash_transactions=3. لا manual business SQL، ولا delta خلال هذا Control.

## 29. Network Zero-Mutation

المسجل خلال التدقيق: GET POS search فقط، HTTP `304`، request id `35d75c10-329a-4f78-b0f6-c4c0fe1f7996`. Receive POST=0، Replay POST=0، changed-payload POST=0، checkout POST=0، payment POST=0.

## 30. P0/P1

- `P0_COUNT = 0`
- `P1_COUNT = 2_OPEN_PENDING_FIX_AND_ACCEPTANCE`
  - Replay channel not executable safely.
  - Pearl POS price/availability mapping fails.

## 31. Gate

`GATE = PASS_PEARL_FINAL_CLOSURE_BLOCKERS_FORENSIC_AUDIT`

هذا PASS يخص إثبات أسباب الفجوات وتصميم الإصلاح فقط، ولا يعني إغلاق Pearl module.

## 32. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PEARL-FINAL-CLOSURE-BLOCKERS-FORENSIC-AUDIT
MODE = READ_ONLY_FINAL_CLOSURE_BLOCKERS_FORENSIC
LOCAL_MAIN_DB = darfus_erp
FROZEN_LIVE_PO = PO-1787391626460
FROZEN_LIVE_ASSET = AST-PUR-1787391626468-1-1-wf0w
FROZEN_LIVE_BARCODE = PLRNG18000001
FROZEN_LIVE_JOURNAL = JE-1787391626555
LIVE_RECEIVE_HTTP = 201_PREVIOUS_CONTROL
OFFICIAL_CONFIRM_CLICKS_THIS_CONTROL = 0
RECEIVE_EXECUTED = NO
REPLAY_EXECUTED = NO
CHANGED_PAYLOAD_409_TEST_EXECUTED = NO
POS_CHECKOUT_EXECUTED = NO
TRACK_A_CHANNELS_FOUND = 4
SAFE_SUPPORTED_AUTH_CHANNEL_FOUND = YES_EXISTING_PAGE_APICLIENT_BUT_NOT_EXTERNALLY_CALLABLE
RAW_TOKEN_ACCESS_REQUIRED = NO_FOR_DESIGN / YES_FOR_FORBIDDEN_MANUAL_ALTERNATIVE
EXACT_REQUEST_ARTIFACT_PRESENT = YES
SAME_IDEMPOTENCY_KEY_REFERENCE_AVAILABLE = YES
OFFICIAL_IDEMPOTENCY_ROW_STATUS = succeeded
OFFICIAL_IDEMPOTENCY_HTTP = 201
IDEMPOTENCY_REPLAY_ROOT_CAUSE = PROVEN
REPLAY_BLOCKER_LAYER = BROWSER_EVALUATION_SURFACE + API_CLIENT_ACCESS
SAFE_AUTHENTICATED_REPLAY_CHANNEL_DESIGN = PASS_DESIGN_ONLY
LL015 = RECORDED
DB_ASSET_PRICE = 5000
POS_API_PRICE_FIELD = items[].price
POS_API_PRICE_VALUE = 0
POS_API_AVAILABILITY = unavailable=true / ASSET_PRICE_UNAVAILABLE
DB_TO_API_MAPPING = FAIL
PEARL_PROFILE_PRICE_MAPPING_PRESENT = PARTIAL
DISABLED_REASON = top-level item.price <= 0 after backend pricing-service failure
POS_ROOT_CAUSE = PROVEN
POS_FAILURE_LAYER = BACKEND_SEARCH + PRICE_RESOLVER
POS_MINIMUM_FIX_REQUIRED = YES
POS_MINIMUM_FIX_SCOPE = narrow backend Pearl loose-profile price-resolution boundary
NEW_POS_LESSON_ID = LL-016
OFFICIAL_DB_BUSINESS_DELTA_THIS_CONTROL = 0
BUSINESS_WRITES = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
P0_COUNT = 0
P1_COUNT = 2_OPEN_PENDING_FIX_AND_ACCEPTANCE
GATE = PASS_PEARL_FINAL_CLOSURE_BLOCKERS_FORENSIC_AUDIT
PEARL_JEWELLERY_MODULE_STATUS = OPEN
NEXT_RECOMMENDED_STEP = PEARL_FINAL_CLOSURE_BLOCKERS_MINIMUM_SAFE_FIX
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 33. STOP

لا Replay، لا 409، لا POS fix، لا checkout، لا Receive، لا Confirm، لا Business Write. التوقف الآن بانتظار Owner Review.
