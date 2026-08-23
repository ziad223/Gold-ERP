# DARFUS ERP — Loose Pearl Clone Auth Context Recovery + Runtime Proof

## 1. Executive Summary

تم حل عائق القبول السابق الخاص بسياق Super Admin داخل Disposable Clone باستخدام المسار الرسمي الموجود في النظام. تم تنفيذ Receive واحد فقط داخل Clone جديد، ونجح بـ HTTP 201، ثم نجح Exact Idempotency Replay بدون أثر أعمال جديد، وأعاد نفس المفتاح مع payload مختلف HTTP 409 بدون أثر جديد.

قاعدة `darfus_erp` لم تُكتب ولم تُجرَ عليها أي محاولة Receive في هذا Control. الـClone أُسقط بعد حفظ الأدلة. لا توجد مشكلة جديدة في NaN ordinal أو LP003 أو Accounting.

## 2. Scope / Authorization

- Control: `DARFUS-LOOSE-PEARL-CLONE-AUTH-CONTEXT-RECOVERY-AND-RUNTIME-PROOF`
- Mode: `CLONE_RUNTIME_ACCEPTANCE`
- المسموح: Auth/Company context، Clone واحد، Receive واحد، replay/conflict، readback، reconciliation، cleanup.
- غير المسموح ولم يُنفذ: Official Receive، source fix، migration، seed، schema change، deployment، Stage B.
- الحساب/كلمة المرور لم تُطبع في التقرير أو artifacts، ولم يُصدّر access token.
- Dirty worktree تم الحفاظ عليه؛ لا `reset` أو `clean` أو `restore` أو `stash`.

## 3. Previous Blocker

العائق السابق كان `SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED` HTTP 422 قبل بدء transaction. التصنيف الصحيح هو `ACCEPTANCE_HARNESS_AUTH_CONTEXT_BLOCKER`، وليس عيبًا في Loose Pearl أو NaN أو Tax أو Accounting.

## 4. Auth Context Authority

المصدر الحالي يثبت أن Super Admin يحتاج اختيارًا صريحًا عبر `X-Company-ID`، وأن Branch التشغيلي يمر عبر `X-Branch-ID`. لم يتم تعطيل guard أو hardcode bypass أو تغيير middleware.

النتيجة: `SUPER_ADMIN_COMPANY_CONTEXT = SUPPORTED_EXISTING_PATH`.

## 5. Company/Branch Context

تم استخدام كيانات DB الحالية فقط:

| Entity | Value | Result |
|---|---|---|
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` / Gold ERP | Active |
| Branch | `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` / Branch-1 | Active |
| Supplier | `SUP-001` / QA-G2C-SUPPLIER-01 | Active |
| Location | `LOC-9a10f58e-4207-4512-8824-7a7b06159151` | Active, branch-scoped |

Auth login = 200، `accountType=super_admin`، Company context = 200، operational readiness = `READY`.

## 6. Official DB Baseline

قبل Clone:

| Entity | Count |
|---|---:|
| purchase_orders | 13 |
| purchase_order_items | 13 |
| assets | 13 |
| LOOSE_PEARL assets | 0 |
| asset_origins | 13 |
| asset_purchase_cost_revisions | 13 |
| asset_current_valuations | 13 |
| inventory_asset_movements | 13 |
| asset_barcode_history | 13 |
| journal_entries | 16 |
| journal_lines | 45 |
| idempotency_requests | 17 |
| cash_transactions | 3 |

الاستثناء المحاسبي المنشور الوحيد قبل وبعد Control هو `JE-1787090870905` بفارق 0.01. لم يظهر أي استثناء جديد.

## 7. Clone Identity

- Clone: `darfus_erp_loose_pearl_auth_runtime_20260822_02`
- تم إنشاؤه من `pg_dump` قراءة حديث للقاعدة الرسمية.
- `SELECT current_database()` داخل Clone أعاد اسم Clone بالضبط.
- قبل Receive: 13 PO، 13 Asset، 0 Loose Pearl، 16 Journal، 17 Idempotency.

## 8. Temporary Backend

- Port: `18013`
- DB: Clone المحدد فقط
- Health = 200
- DB health = 200
- Redis health = 200
- المصدر: current worktree backend
- لم يتم تشغيل Next build/dev ولم يتم لمس runtime الرسمي على 3000/8000.

## 9. Exact Request

تم استخدام نفس business shape السابق مع:

- `profile=LOOSE_PEARL`
- `quantity=1`
- `perPiece.length=1`
- `pieceIndex` غير موجود في client request
- `itemIndex` غير موجود في client request
- purchase base = `100.00000000`
- current value = `120.00000000`
- selling price = `200.00000000`
- pearl color = `Black`
- `STANDARD_VAT`, `taxIncluded=false`, `applyVat=true`
- Supplier/Branch/Location من DB فقط

تم حفظ الطلب exact في artifact 07 دون أسرار.

## 10. Business Hash

تم تتبع `idempotency.service.hashRequest` الفعلي: scope + params + body canonicalized بترتيب مفاتيح ثابت، مع حذف `idempotencyKey` من hash. Hash المحسوب محليًا طابق hash المخزن في Clone.

`BUSINESS_HASH = PASS`

## 11. Auth Context Preflight

| Check | Result |
|---|---|
| Authenticated session | PASS |
| Super Admin | PASS |
| Explicit Company context | PASS |
| Company matches target | PASS |
| Explicit Branch context | PASS |
| Branch matches target Company | PASS |
| Supplier exists and scoped | PASS |
| Location exists, active, branch-scoped | PASS |

`AUTH_CONTEXT_PREFLIGHT = PASS`.

## 12. Observability

- Diagnostics = ON
- Request interception = OFF
- Backend logs لم تعرض token أو password، وسجلت request IDs redacted-safe.
- Initial receive request ID: `CLONE-RECEIVE-01`
- Replay request ID: `CLONE-REPLAY-01`
- Conflict request ID: `CLONE-CONFLICT-01`

## 13. Clone Receive

تم تنفيذ distinct Clone Receive واحد فقط:

- HTTP = 201
- PO = `PO-1787429166418`
- Asset = `AST-PUR-1787429166426-1-1-e690`
- Barcode = `PLLOS00000001`
- Journal = `JE-1787429166495`
- Receipt evidence/link = `IMPO-0a11e7700e174b249a80537123`

`CLONE_DISTINCT_RECEIVE_ATTEMPT_COUNT = 1`.

## 14. Auth Context Success

الاستلام تجاوز guard الرسمي دون bypass، مع Company/Branch/Supplier/Location الصحيحة. لا توجد fallback مالية أو company غير محددة.

## 15. Receipt Evidence Ordinal

الطلب لم يحتوِ `pieceIndex` أو `itemIndex`. المصدر التنفيذي استخدم runtime array position/`qtyIndex` بعد validation. القيمة persisted في `purchase_order_item_asset_links.ordinal` هي `1`.

| Rule | Result |
|---|---|
| Finite | YES |
| Integer | YES |
| Positive | YES |
| NaN reached SQL | NO |
| Persisted ordinal | 1 |

## 16. LP-LESSON-002 Closure

`LP-LESSON-002_STATUS = CLOSED_WITH_RUNTIME_PROOF`.

قواعد الوقاية أثبتت runtime: ordinal deterministic، finite، integer، `>=1`، والـinvalid metadata يرفض قبل SQL. تكرار السبب نفسه بقي `1`؛ لم يظهر تكرار جديد بعد الإصلاح.

## 17. Business Chain

| Relation | Delta |
|---|---:|
| PO | +1 |
| PO Item | +1 |
| Asset | +1 |
| Loose Pearl Asset | +1 |
| Pearl detail | +1 |
| Origin | +1 |
| Purchase cost revision | +1 |
| Current valuation | +1 |
| Movement | +1 |
| Barcode history | +1 |
| Journal | +1 |
| Journal lines | +3 |
| Cash transactions | 0 |

## 18. Asset / Barcode

`ONE_PHYSICAL_PEARL_ONE_ASSET = PASS`.

Asset profile = `LOOSE_PEARL`، status = `AVAILABLE`، branch/location صحيحان، barcode = `PLLOS00000001`، active barcode واحد، duplicate active barcodes = 0. Product quantity لم يدخل physical chain.

## 19. Pearl Color / LP003

القيمة المطلوبة `Black` ظهرت في request، وتم تطبيعها وتخزينها واسترجاعها في AR وEN كـ`Black`.

`LP003 = CLOSED_CONFIRMED` و`P2 = 0` لهذا المسار.

## 20. Historical Cost

Purchase-cost revision حفظت historical base = `100.00000000` مع `vat_base=100` و`vat_amount=14`. الحقل canonical الحالي `total_purchase_cost` في هذه relation يمثل acquisition base قبل الضريبة، بينما VAT محفوظة في حقول tax المنفصلة. لا يوجد خلط مع current valuation.

## 21. Current Valuation

Current valuation حفظت component/current base = `120.00000000`، VAT = `16.80000000`، total = `136.80000000`. لم تُستبدل القيمة الحالية بالـhistorical purchase base.

## 22. Tax

المعاملة استخدمت الشركة والإعدادات الحالية dynamic rate = 14%:

- Purchase base = 100
- Purchase VAT = 14
- Purchase total = 114
- Current base = 120
- Current VAT = 16.8
- Current total = 136.8
- Tax application count = 1

`TAX = PASS_DYNAMIC_SINGLE_APPLICATION`.

## 23. Accounting

القيد الجديد exact balanced:

- Inventory debit = 100
- Input VAT debit = 14
- Supplier Payable credit = 114
- Total debit = 114
- Total credit = 114
- Difference = 0.00000000

لا payment أو cash/treasury mutation حدثت.

## 24. Supplier/AP

Supplier statement read-only أعاد PO الجديد كسطر credit = `114.00`، debit = `0.00`، delta = `114.00`. المرجع المعتمد للـpayable هو posted purchase journal وsupplier sub-ledger؛ `Supplier.due` بقي reference-only حسب source الحالي ولم يُعدّل في receive.

## 25. AR Readback

GET Asset Details مع `Accept-Language=ar` أعاد 200، مع Loose Pearl، barcode، AVAILABLE، weight `1.25 CT`، size `1.0`، type `Abalone`، color `Black`، historical cost `100`، current value `120`، selling price `200`، Supplier/Branch/Location الصحيحين. لا internal master ID ولا undefined label ظاهر للمستخدم.

## 26. EN Readback

GET Asset Details مع `Accept-Language=en` أعاد 200 بنفس business values. `AR_EN_BUSINESS_PARITY = PASS`.

## 27. POS Read-only

GET `/api/v1/pos/search?query=PLLOS00000001` أعاد:

- items = 1
- Asset id الصحيح
- `isProduct=false`
- profile = `LOOSE_PEARL`
- status = `AVAILABLE`
- available = 1
- price = 200
- branch scope صحيح
- checkout = NOT RUN

## 28. Idempotency Replay

تم استخدام نفس exact body ونفس المفتاح ونفس Company/Branch context بعد نجاح 201. النتيجة HTTP 201 من response المخزن، دون PO/Asset/Barcode/Movement/Journal جديد.

`IDEMPOTENCY_EXACT_REPLAY = PASS_ZERO_DELTA`.

## 29. Idempotency Conflict

تم تغيير `items[0].sellingPrice` فقط إلى `201.00000000` مع إبقاء نفس المفتاح. النتيجة HTTP 409، ولم يتغير أي business row.

`IDEMPOTENCY_CHANGED_PAYLOAD_409 = PASS_ZERO_DELTA`.

## 30. Clone Final Integrity

- Duplicate active barcodes = 0
- Orphan Pearl details = 0
- Orphan origins = 0
- Orphan movements = 0
- New journal difference = 0.00000000
- Cash transactions remained 3
- Duplicate business effect = 0

## 31. Relevant Regression

تم تشغيل مجموعة الأمان ذات الصلة، وشملت NaN ordinal، Loose Pearl، LP003، Supplier Receive/G2C، tax precision، Asset، Barcode، authority، وIdempotency.

- Tests = PASS 52/52
- Typecheck = PASS
- Build = NOT RUN بسبب owner-approved build guard الحالي
- Source changes in this Control = 0

## 32. Clone Cleanup

تم إيقاف Backend المؤقت ثم إسقاط الـClone المحدد فقط. التصنيف: `ENVIRONMENT_CLEANUP_ONLY`. لم يتم حذف أو تعديل أي بيانات من `darfus_erp`.

## 33. Official DB Zero-Write

بعد cleanup:

- `SELECT current_database()` = `darfus_erp`
- counts رجعت/بقيت: 13 PO، 13 PO Item، 13 Asset، 0 Loose Pearl، 13 Origin، 13 Cost revision، 13 Valuation، 13 Movement، 13 Barcode history، 16 Journal، 45 Journal lines، 17 Idempotency، 3 Cash.
- `OFFICIAL_DB_BUSINESS_DELTA = 0`
- `OFFICIAL_RETRY_EXECUTED = NO`
- `SECOND_OFFICIAL_RECEIVE_ATTEMPT = NO`
- unbalanced posted set بقي `JE-1787090870905` فقط.

## 34. P0/P1/P2

| Priority | Count | Finding |
|---|---:|---|
| P0 | 0 | لا data loss أو security/financial corruption جديد |
| P1 | 0 | Auth blocker أُثبت أنه harness context وتم تجاوزه بالمسار الرسمي |
| P2 | 0 | لا runtime defect جديد مثبت |

## 35. Gate

`GATE = PASS_LOOSE_PEARL_CLONE_AUTH_CONTEXT_RECOVERY_AND_RUNTIME_PROOF`

الـPASS يخص Clone runtime proof فقط. لا يصرح بأي Official Receive.

## 36. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-PEARL-CLONE-AUTH-CONTEXT-RECOVERY-AND-RUNTIME-PROOF
LOCAL_MAIN_DB = darfus_erp
MODE = CLONE_RUNTIME_ACCEPTANCE
SOURCE_CHANGE_THIS_CONTROL = 0
SUPER_ADMIN_COMPANY_CONTEXT_METHOD = X-Company-ID
BRANCH_CONTEXT_METHOD = X-Branch-ID
AUTH_CONTEXT_PREFLIGHT = PASS
COMPANY = COMP-48ab554f-427e-4642-9419-bc8616c2dc36
BRANCH = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
SUPPLIER = SUP-001
LOCATION = LOC-9a10f58e-4207-4512-8824-7a7b06159151
CLONE_NAME = darfus_erp_loose_pearl_auth_runtime_20260822_02
TEMP_BACKEND_PORT = 18013
EXACT_REQUEST_CAPTURE = PASS
BUSINESS_HASH = PASS
DIAGNOSTICS = ON
REQUEST_INTERCEPTION = OFF
CLONE_DISTINCT_RECEIVE_ATTEMPT_COUNT = 1
CLONE_RECEIVE_HTTP = 201
CLONE_REQUEST_ID = CLONE-RECEIVE-01
CLONE_PO_ID = PO-1787429166418
CLONE_ASSET_ID = AST-PUR-1787429166426-1-1-e690
CLONE_BARCODE = PLLOS00000001
CLONE_JOURNAL_ID = JE-1787429166495
RECEIPT_EVIDENCE_ORDINAL = 1
ORDINAL_IS_FINITE = YES
ORDINAL_IS_INTEGER = YES
ORDINAL_IS_POSITIVE = YES
NAN_REACHED_SQL = NO
LP_LESSON_002 = CLOSED_WITH_RUNTIME_PROOF
ONE_PHYSICAL_PEARL_ONE_ASSET = PASS
LP003 = CLOSED
PEARL_COLOR_PERSISTENCE = PASS_BLACK
HISTORICAL_COST = PASS_100_PRE_TAX
CURRENT_VALUATION = PASS_120_PRE_TAX_PLUS_DYNAMIC_VAT
TAX_APPLICATION_COUNT = 1
ACCOUNTING = PASS_EXACT_BALANCE
CASH_DELTA = 0
AR_READBACK = PASS
EN_READBACK = PASS
POS_READ_ONLY = PASS
IDEMPOTENCY_EXACT_REPLAY = PASS_ZERO_DELTA
IDEMPOTENCY_CHANGED_PAYLOAD_409 = PASS_ZERO_DELTA
CLONE_FINAL_INTEGRITY = PASS
RELEVANT_REGRESSION = PASS_52_OF_52
TYPECHECK = PASS
CLONE_DROPPED = YES
CLONE_DROP_CLASSIFICATION = ENVIRONMENT_CLEANUP_ONLY
OFFICIAL_DB_BUSINESS_DELTA = 0
OFFICIAL_RETRY_EXECUTED = NO
SECOND_OFFICIAL_RECEIVE_ATTEMPT = NO
P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 0
GATE = PASS_LOOSE_PEARL_CLONE_AUTH_CONTEXT_RECOVERY_AND_RUNTIME_PROOF
LOOSE_PEARL_MODULE_STATUS = READY_FOR_ONE_OWNER_AUTHORIZED_SECOND_OFFICIAL_RECEIVE_ATTEMPT
NEXT_RECOMMENDED_STEP = OWNER_AUTHORIZATION_FOR_ONE_CONTROLLED_SECOND_OFFICIAL_LOOSE_PEARL_RECEIVE_ATTEMPT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 37. STOP

توقف التنفيذ هنا. لا Official Retry، ولا Second Official Confirm، ولا Stage B، ولا Deployment. أي Official Receive لاحق يحتاج Owner authorization صريحًا منفصلًا.
