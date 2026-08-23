# DARFUS ERP — Loose Pearl LP003 Pearl Color Persistence Fix Report

## 1. Executive Summary

تم إصلاح عيب LP003 بأقل تعديل آمن: حفظ المفتاح canonical `pearlColor` داخل `normalizeLooseDetails` لمسار `LOOSE_PEARL` فقط. لم يتغير عقد العميل أو Master Data أو Tax أو Accounting أو Asset/Barcode أو Supplier V2.

تم إثبات الإصلاح على Disposable Clone بعملية Receive واحدة (`201`)، ثم AR/EN readback بقيمة `Black`، وExact Replay (`201`) وSame-key changed payload (`409`). قاعدة `darfus_erp` لم تُكتب.

## 2. Prior Gate

الـprior gate المقبول كان:

`PASS_LOOSE_PEARL_CONTROLLED_FRESH_CLONE_RECEIVE_RETRY`

وكان العيب المفتوح الوحيد هو:

`LP003 = PEARL_COLOR_REQUEST_TO_ASSET_PERSISTENCE_GAP`.

## 3. Scope

النطاق اقتصر على:

- `normalizeLooseDetails` canonical mapping.
- focused tests وaffected regressions.
- Disposable Clone Receive واحد.
- DB persistence/readback، AR/EN، POS، Accounting/Tax، Idempotency.

ممنوعات البرومبت لم تُنفذ: Official Receive، Migration، Master Data mutation، Tax/Accounting redesign، Barcode/Asset identity change، checkout، deployment.

## 4. LP003 Root Cause

المسار المثبت:

```text
Loose Pearl builder
→ looseDetails.pearlColor = Black
→ normalizeLooseDetails
→ looseDetailsAsPrimarySubject
→ persistAssetComponents
→ asset_pearl_component_details.color
→ Asset readback
```

قبل الإصلاح، الـnormalizer كان يقرأ `color / stoneColor` فقط ولا يخرج `pearlColor`. لذلك كان الطلب صحيحًا، لكن قيمة Pearl detail أصبحت `null`.

`FIRST_PROVEN_BROKEN_BOUNDARY = LOOSE_DETAILS_NORMALIZATION_TO_PERSISTENCE_MAPPING`

## 5. Source Reality

المصدر الحالي أكد أن `loose-pearl-profile.service` يرسل `looseDetails.pearlColor`، وأن `inventory-v2-runtime.persistAssetComponents` يستخدم `component.pearlDetails.pearlColor` أو `component.pearlColor`. السبب لم يتغير عن الدليل السابق.

## 6. Minimum Safe Fix

أُضيفت خاصية واحدة فقط:

```js
pearlColor: canonical === "LOOSE_PEARL" ? text(input.pearlColor) : null
```

لا يوجد fallback إلى `color` أو `stoneColor`، ولا إعادة تسمية للـpayload، ولا alias جديد، ولا Master ID يتحول إلى label.

## 7. Files Changed

التغييرات المقصودة لهذا الـControl فقط:

- `backend/src/services/inventory-master-policy.service.js`
- `tests/loose-pearl-minimum-safe-implementation.test.cjs`
- `backend/acceptance-artifacts/loose-pearl/DARFUS-LOOSE-PEARL-LP003-PEARL-COLOR-PERSISTENCE-FIX/`
- `docs/DARFUS_LOOSE_PEARL_LP003_PEARL_COLOR_PERSISTENCE_FIX_REPORT.md`

الـworktree كان dirty مسبقًا؛ لم يتم تنظيف أو إعادة ضبط أي تغييرات غير مرتبطة.

## 8. Focused Tests

```text
node --test tests/loose-pearl-minimum-safe-implementation.test.cjs
7 passed / 7 total
```

أثبتت الاختبارات: `Black` survives normalization، missing value remains `null`، no fallback، non-Pearl color unchanged، وcanonical profile label boundary محفوظ.

`FOCUSED_TESTS = PASS_7_OF_7`

## 9. Regression

تم تشغيل الملفات المتأثرة فقط: Loose Pearl label، Supplier Receive، Pearl، Loose Gem Stone، Loose Diamond، Diamond idempotency، Asset، Barcode، POS، Pearl auth/request dispatch.

`REGRESSION = PASS_59_OF_59`

## 10. Typecheck

`npm run typecheck` نجح.

`TYPECHECK = PASS`

## 11. Build

`npm run build` نجح بعد typecheck، دون تعديل يدوي لـ`next-env.d.ts`.

`BUILD = PASS`

## 12. Official DB Baseline

قبل أي Clone mutation، القراءة أثبتت:

```text
current_database() = darfus_erp
purchase_orders = 13
purchase_order_items = 13
assets = 13
LOOSE_PEARL assets = 0
asset_components = 10
asset_pearl_component_details = 1
asset_origins = 13
asset_purchase_cost_revisions = 13
asset_current_valuations = 13
inventory_asset_movements = 13
asset_barcode_history = 13
journal_entries = 16
journal_lines = 45
idempotency_requests = 17
cash_transactions = 3
```

## 13. Clone Baseline

Disposable target:

```text
CLONE = darfus_erp_loose_pearl_lp003_20260822_01
TEMP_BACKEND = darfus-loose-pearl-lp003-backend
PORT = 18003
BACKEND_DB_NAME = darfus_erp_loose_pearl_lp003_20260822_01
HEALTH = PASS
SELECT current_database() = exact clone name = PASS
```

Contract preflight returned 2 suppliers, 1 active branch-scoped location, 39 Pearl Size values, and dynamic VAT rate 14%. `PEARL_COLOR` Master Data returned label `Black`; the internal ID was retained as technical reference only.

## 14. Exact Request

The saved request artifact contains:

```text
profile = LOOSE_PEARL
quantity = 1
perPiece.length = 1
looseDetails.pearlColor = Black
looseDetails.masterData.pearlColor = PMD-dd204ecef470481782c8b358dd
taxTreatment = STANDARD_VAT
taxIncluded = false
applyVat = true
purchaseCostPreTax = 100
currentPearlValuePreTax = 120
sellingPrice = 200
```

`REQUEST_PERPIECE_PRESENT = YES`، `REQUEST_PERPIECE_LENGTH = 1`، و`DOCUMENT_QUANTITY = 1`.

## 15. Normalization Proof

Read-only profile preview returned `READY` and `pearlColor=Black`. The canonical normalizer returned:

```text
kind = PEARL
totalPearlWeight = 1.25000000
pearlColor = Black
color = []
missing pearlColor = null
```

`PEARL_COLOR_NORMALIZATION = PASS_BLACK`.

## 16. Receive Result

تم تنفيذ Receive واحد فقط على الـClone:

```text
HTTP = 201
PO = PO-1787424200381
Asset = AST-PUR-1787424200390-1-1-nkuz
Barcode = PLLOS00000001
Journal = JE-1787424200493
```

## 17. Pearl Detail Persistence

DB readback أثبت:

```text
component_kind = PEARL
role = PRIMARY_SUBJECT
component_count = 1
pearl_type = Abalone
color = Black
size = 1.0
```

`PEARL_COLOR_PERSISTENCE = PASS_BLACK`.

## 18. AR Readback

Authenticated `GET` مع `Accept-Language=ar` أعاد `200`:

```text
Profile = LOOSE_PEARL
Barcode = PLLOS00000001
Status = AVAILABLE
Weight = 1.25 CT
Pearl Type = Abalone
Pearl Color = Black
Pearl Size = 1.0
```

`AR_PEARL_COLOR_READBACK = PASS_BLACK`.

## 19. EN Readback

Authenticated `GET` مع `Accept-Language=en` أعاد `200` بنفس Asset identity وبـ`Pearl Color = Black`.

`EN_PEARL_COLOR_READBACK = PASS_BLACK`.

## 20. Other Field Non-Regression

تم الحفاظ على: Pearl Type، Pearl Size، CT weight `1.25`، historical cost `100`، current value `120`، Asset price `200`، Barcode، status، branch، location، origin/source، cost revision، valuation، movement، وjournal.

`ONE_PHYSICAL_PEARL_ONE_ASSET = PASS`.

## 21. Tax

```text
Purchase base = 100
Purchase VAT = 14
Purchase total = 114
Current valuation base = 120
Current VAT = 16.8
Current total = 136.8
VAT_APPLICATION_COUNT = 1
```

لا يوجد تغيير في Tax Engine أو tax policy.

## 22. Accounting

Journal debit `114` وcredit `114`. تم الحفاظ على فصل historical cost عن current valuation، ولم تتغير accounting mappings.

`ACCOUNTING = PASS`، `CASH_DELTA = 0`.

## 23. Supplier/AP

Supplier `SUP-001` وcompany/branch/location/source links صحيحة. Payable accounting بقي canonical؛ لا Payment أو cash mutation في Receive.

## 24. POS Read-only

Barcode search أعاد عنصرًا واحدًا:

```text
items = 1
isProduct = false
profile = LOOSE_PEARL
available = 1
price = 200
correct branch = PASS
checkout = NOT RUN
```

## 25. Idempotency Exact Replay

Exact body والـsame key أعادا `201` مع نفس PO/Asset/Barcode، وبدون business rows إضافية. الـcanonical hash المحسوب قبل POST هو:

`d3d4c1da2f9cf081adf4771a7cec644f71203cdba1af209a393af552ce10422c`

## 26. Idempotency Conflict

Same key مع تغيير harmless في `items[0].sellingPrice` من `200` إلى `201` أعاد `409`. لم تُضف أي PO أو Asset أو Barcode أو Journal.

## 27. Failure/Retry Governance

لم يحدث فشل Receive أو partial persistence في هذا الـControl. تم تنفيذ Receive واحد، ثم replay واحد، ثم conflict واحد فقط. لا automatic retry ولا second distinct Receive.

`FAILED_RECEIVE_COUNT_THIS_CONTROL = 0`  
`CONTROLLED_RETRY_COUNT_THIS_CONTROL = 1`  
`SAME_CAUSE_REPEAT_COUNT = 0`

## 28. LP003 Lesson

`LP003` أُغلق. السبب كان غياب canonical key mapping في shared normalizer. Prevention gate هو اختبار request → normalization → persistence → AR/EN readback لكل Pearl categorical field.

## 29. Clone Cleanup

تم إيقاف وإزالة temporary backend وإسقاط قاعدة الـClone المحددة فقط. هذا `ENVIRONMENT_CLEANUP_ONLY` وليس Business rollback.

`BUSINESS_ROLLBACK_ROUTE = NOT_SUPPORTED`.

## 30. Official DB Zero Delta

بعد اكتمال الأدلة، أُعيدت القراءة من `darfus_erp`:

```text
current_database() = darfus_erp
purchase_orders = 13
assets = 13
asset_pearl_component_details = 1
journal_entries = 16
idempotency_requests = 17
cash_transactions = 3
```

Official deltas: Receive `0`، Asset `0`، Barcode `0`، Journal `0`، Idempotency `0`، Cash `0`.

## 31. P0/P1/P2

```text
P0 = 0
P1 = 0
P2 = 0
```

## 32. Gate

```text
GATE = PASS_LOOSE_PEARL_LP003_PEARL_COLOR_PERSISTENCE_FIX
LP003 = CLOSED
OFFICIAL_RECEIVE_ALLOWED_BY_THIS_REPORT = NO
OWNER_REVIEW = REQUIRED
```

الـPASS يثبت الإصلاح على Disposable Clone فقط. لا يصرّح بـOfficial Receive.

## 33. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-PEARL-LP003-PEARL-COLOR-PERSISTENCE-FIX
LOCAL_MAIN_DB = darfus_erp
OPEN_DEFECT = LP003
FIRST_PROVEN_BROKEN_BOUNDARY = LOOSE_DETAILS_NORMALIZATION_TO_PERSISTENCE_MAPPING
ROOT_CAUSE = CANONICAL_PEARL_COLOR_KEY_NOT_MAPPED
MINIMUM_SAFE_FIX = PRESERVE_PEARLCOLOR_IN_LOOSE_PEARL_NORMALIZER_ONLY
FILES_CHANGED = ONE_BACKEND_NORMALIZER_ONE_FOCUSED_TEST_ARTIFACTS_REPORT
BACKEND_CHANGE = YES_MINIMUM_SAFE_NORMALIZATION_ONLY
DB_SCHEMA_CHANGE = NO
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
MASTER_DATA_CHANGE = NO
BUSINESS_RULE_CHANGE = NO
PEARL_COLOR_REQUEST = PASS_BLACK
PEARL_COLOR_NORMALIZATION = PASS_BLACK
PEARL_COLOR_PERSISTENCE = PASS_BLACK
AR_PEARL_COLOR_READBACK = PASS_BLACK
EN_PEARL_COLOR_READBACK = PASS_BLACK
INTERNAL_MASTER_ID_VISIBLE = NO_AS_USER_LABEL
FOCUSED_TESTS = PASS_7_OF_7
REGRESSION = PASS_59_OF_59
TYPECHECK = PASS
BUILD = PASS
CLONE_RECEIVE = PASS_201_ONE_ONLY
ONE_PHYSICAL_PEARL_ONE_ASSET = PASS
BARCODE = PASS_PLLOS00XXXXXX
TAX_APPLICATION_COUNT = 1
ACCOUNTING = PASS
POS_READ_ONLY = PASS
IDEMPOTENCY_EXACT_REPLAY = PASS_201_ZERO_DELTA
IDEMPOTENCY_CHANGED_PAYLOAD_409 = PASS_409_ZERO_DELTA
FAILED_RECEIVE_COUNT_THIS_CONTROL = 0
CONTROLLED_RETRY_COUNT_THIS_CONTROL = 1
SAME_CAUSE_REPEAT_COUNT = 0
BUSINESS_ROLLBACK_ROUTE = NOT_SUPPORTED
DROP_CLONE_CLASSIFICATION = ENVIRONMENT_CLEANUP_ONLY
OFFICIAL_LOCAL_MAIN_RECEIVE_EXECUTED = NO
OFFICIAL_DB_BUSINESS_DELTA = 0
P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 0
GATE = PASS_LOOSE_PEARL_LP003_PEARL_COLOR_PERSISTENCE_FIX
LOOSE_PEARL_MODULE_STATUS = PRE_OFFICIAL_SAFETY_CLOSED_READY_FOR_OWNER_AUTHORIZATION
NEXT_RECOMMENDED_STEP = LOOSE_PEARL_OFFICIAL_LOCAL_MAIN_RECEIVE_ACCEPTANCE_AFTER_EXPLICIT_OWNER_AUTHORIZATION
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 34. STOP

لا Official Receive، ولا retry إضافي، ولا Migration، ولا Deployment، ولا Next Batch. تم التوقف بعد التقرير والأدلة.

**LP003 CLOSED ON DISPOSABLE CLONE → OWNER REVIEW → EXPLICIT AUTHORIZATION REQUIRED FOR OFFICIAL RECEIVE**
