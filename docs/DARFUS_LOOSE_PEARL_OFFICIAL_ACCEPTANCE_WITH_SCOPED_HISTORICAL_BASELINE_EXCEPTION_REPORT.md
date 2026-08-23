# DARFUS ERP — Loose Pearl Official Acceptance With Scoped Historical Baseline Exception

Control ID: DARFUS-LOOSE-PEARL-OFFICIAL-ACCEPTANCE-WITH-SCOPED-HISTORICAL-BASELINE-EXCEPTION

## 1. Executive Summary

تم تنفيذ الفحص والـpre-confirm قراءةً، ثم أُرسل ضغط Confirm واحد فقط من المسار الرسمي. الطلب وصل إلى backend، لكن النتيجة كانت HTTP 500 أثناء persistReceiptEvidence. تم التوقف فورًا؛ لم يحدث Replay أو Retry أو تنظيف أو تعديل Journal. العدادات الأساسية بعد الفشل مطابقة للـbaseline، ولا يوجد PO أو Asset أو Barcode أو Movement أو Journal أو Payable جديد.

## 2. Owner Decision

التفويض كان لعملية Official Loose Pearl Receive واحدة فقط على darfus_erp. لا يوجد تفويض لمحاولة ثانية أو لمعالجة Journal التاريخي.

## 3. Scoped Historical Exception

الاستثناء الوحيد هو JE-1787090870905 المرتبط بـPO-1787090870807، بفارق 0.01. تم تطبيقه بالنطاق المحدد فقط. لا توجد قيود محاسبية عامة إضافية.

## 4. Prior Loose Pearl Gates

التقارير السابقة تثبت إغلاق implementation/clone/LP003 gates قبل هذا التحكم. LP003 يبقى gap سابقًا موثقًا ولا تمت معالجته هنا.

## 5. Current Accounting Prevention

البوابة PASS: source الحالي يحتوي exact stored-line cent balance guard قبل persistence، واختبار القراءة المركّز السابق أعاد 17 passed و0 failed. هذا يثبت منع إعادة إنتاج نمط 0.01 التاريخي، لكنه لا يتجاوز عيب NaN الذي أوقف الاستلام الحالي.

## 6. Backup

تم إنشاء backup جديد قبل أي Confirm. الحجم 713789 bytes، SHA256 = 579A5DE670A51A59AB8AA64BEF8B64783A96F5E35A68C88E236DD6C16E37ECBF، وpg_restore list داخل حاوية PostgreSQL عاد exit 0.

## 7. Official Baseline

current_database() = darfus_erp. Counts قبل Confirm: purchase_orders 13، purchase_order_items 13، assets 13، asset_origins 13، purchase_order_item_asset_links 13، cost revisions 13، valuations 13، movements 13، barcode history 13، journal_entries 16، journal_lines 45، idempotency_requests 17، cash_transactions 3، LOOSE_PEARL assets 0.

## 8. Scoped Baseline Integrity

وجد Journal منشور غير متوازن واحد فقط: JE-1787090870905، debit 2133.21000000، credit 2133.22000000. كل journals الأخرى متوازنة. Duplicate active barcodes = 0.

## 9. UI Pre-Confirm

المسار العربي الرسمي فتح بنجاح، والـprofile preview والـshared receive preview أعادا READY/200، والبيانات synthetic فقط. Supplier وBranch وLocation وSTANDARD_VAT وpermission ظهرت صحيحة. نافذة التأكيد فتحت، والزر كان enabled.

## 10. Preview

Purchase base = 100.00000000، VAT = 14.00000000، total = 114.00000000. Current valuation base = 120.00000000، VAT = 16.80000000، total = 136.80000000، rate = 14%.

## 11. Exact Request

تم التقاط exact production request قبل Confirm من diagnostics panel. profile = LOOSE_PEARL، quantity = 1، perPiece count = 1، unitCost/purchaseCost = 100.00000000، taxIncluded = false، applyVat = true. Exact idempotency key محفوظ في artifact 09.

## 12. Business Hash

Request body/key capture PASS. Durable server hash was not available because the request failed with HTTP 500 before a successful idempotency result. No replay was attempted.

## 13. Auth/Context

الطلب أُرسل من جلسة authenticated وبـcompany/branch context الصحيحين. لم يتم تسجيل أو تصدير كلمة مرور أو token.

## 14. Safe Post-Success Channel

مسار exact replay كان موجودًا في نفس builder، لكن لم يُستخدم لأن شرط 201 لم يتحقق.

## 15. Observability

Backend health = 200 من /api/v1/health. Diagnostics كانت ON وrequest interception OFF. Request ID: 70e0c2c4-f4e1-48f8-94da-f5e5c5b5.

## 16. Browser Dispatch Chain

Evidence: UI Confirm → API client → POST /api/v1/purchase-orders/receive. سجل backend يثبت POST واحدًا فقط بمدة 337.059ms وHTTP 500.

## 17. Backend Request

Request ID 70e0c2c4-f4e1-48f8-94da-f5e5c5b5. PostgreSQL سجل: column "nan" does not exist في INSERT إلى purchase_order_item_asset_links.

## 18. Official Receive

OFFICIAL_DISTINCT_RECEIVE_ATTEMPT_COUNT = 1. OFFICIAL_RECEIVE_HTTP = 500. لا توجد نتيجة 201. لا Confirm ثانٍ.

## 19. Business Chain

بعد الفشل: PO delta 0، PO item delta 0، Asset delta 0، Pearl detail delta 0، origin delta 0، cost revision delta 0، valuation delta 0، movement delta 0، barcode delta 0، journal delta 0، payable delta 0، cash delta 0.

## 20. New Journal Balance

لا يوجد New Loose Pearl Journal؛ لذلك لا توجد معادلة جديدة يمكن اعتمادها. Journal التاريخي الوحيد بقي كما هو.

## 21. Post-Receive Unbalanced Journal Scan

النتيجة النهائية بقيت Journal واحدًا غير متوازن، وهو الاستثناء المعروف JE-1787090870905 فقط. لم يظهر unbalanced journal جديد.

## 22. Asset/Barcode

LOOSE_PEARL assets = 0 بعد الفشل. لا Asset ID ولا Barcode جديد.

## 23. Pearl Fields

لم يتمكن الاستلام من الوصول إلى persistence. Pearl Color = Black ظهر في exact request، لكن readback الرسمي غير منفذ.

## 24. Historical Cost

Historical purchase base في الطلب كان 100.00000000 قبل الضريبة. لم تُنشأ cost revision رسمية.

## 25. Current Valuation

Current valuation preview كان 120.00000000 قبل الضريبة و136.80000000 شامل الضريبة. لم تُنشأ valuation row رسمية.

## 26. Tax

Tax preview dynamic 14% وطبّق مرة واحدة في preview. لم تُنشأ tax snapshot رسمية بسبب rollback/فشل الاستلام.

## 27. Accounting

لم يتم إنشاء journal جديد. الاستثناء التاريخي لم يُلمس. لا يجوز إعلان accounting PASS للمعاملة الجديدة.

## 28. Supplier/AP

Supplier SUP-001 ظهر في الطلب. لا payable جديد، cash delta = 0.

## 29. AR Readback

NOT RUN: لا يوجد Asset رسمي للقراءة.

## 30. EN Readback

NOT RUN: لا يوجد Asset رسمي للقراءة.

## 31. POS Read-only

NOT RUN: لا يوجد Barcode رسمي، ولم يتم checkout.

## 32. Idempotency Replay

NOT RUN. الـControl يمنع replay بعد فشل Confirm وعدم وجود 201.

## 33. Idempotency Conflict

NOT RUN. لا يجوز إرسال changed-payload بعد HTTP 500.

## 34. Final DB Reconciliation

كل counts الأساسية بعد الفشل مساوية للـbaseline، وbusiness delta = 0. max created_at للـPO/Asset/idempotency بقي قبل محاولة Confirm. هذا يثبت عدم وجود persisted partial business data.

## 35. Final Integrity

لا يوجد persisted PO/Asset/Barcode/Movement/Journal/Payable جديد. لا cleanup ولا تعديل مباشر ولا migration ولا seed تم.

## 36. Delivery/Reset Safety

تم الاحتفاظ بالـbackup. local main DB سيُعاد ضبطه قبل التسليم، ويجب أن تكون قاعدة server النهائية fresh منفصلة ولا تحمل الاستثناء التاريخي.

## 37. Failure/Retry Governance

Root cause مثبت: في inventory-v2-runtime.service.js، persistReceiptEvidence يستخدم ordinal = piece.pieceIndex + 1. exact request الملتقط لم يحمل pieceIndex داخل perPiece، فصار ordinal = NaN، وPostgreSQL رفض SQL. لم يتم تطبيق Minimum Safe Fix في هذا control، ولم تتم أي retry.

التصنيف: P1 PRODUCT/RUNTIME DEFECT، مع P2 سابق LP003 readback gap. لا يوجد P0.

## 38. P0/P1/P2

| Priority | Count | Finding |
|---|---:|---|
| P0 | 0 | لا يوجد data loss أو persisted financial corruption مثبت |
| P1 | 1 | canonical Loose Pearl receive يفشل HTTP 500 بسبب NaN ordinal |
| P2 | 1 | prior LP003 pearlColor persistence gap remains deferred |

## 39. Gate

GATE = BLOCKED_LOOSE_PEARL_OFFICIAL_ACCEPTANCE

السبب: شرط PASS يتطلب 201، سلسلة business chain، journal balance، exact replay و409 conflict. Confirm الوحيد فشل قبل commit، لذلك لا يجوز إعلان closure ولا تنفيذ Retry داخل هذا control.

## 40. Final Tokens

CURRENT_CONTROL = DARFUS-LOOSE-PEARL-OFFICIAL-ACCEPTANCE-WITH-SCOPED-HISTORICAL-BASELINE-EXCEPTION
LOCAL_MAIN_DB = darfus_erp
LOCAL_MAIN_DB_WILL_BE_RESET_BEFORE_CUSTOMER_DELIVERY = YES
FINAL_SERVER_DB = SEPARATE_FRESH_DATABASE
SCOPED_HISTORICAL_EXCEPTION = JE-1787090870905_ONLY
EXCEPTION_ROOT_CAUSE = HISTORICAL_ISOLATED_DATA_DEFECT
CURRENT_CODE_REPRODUCES_EXCEPTION_DEFECT = NO
GENERAL_ACCOUNTING_EXCEPTION = NO
CURRENT_ACCOUNTING_PREVENTION_GATE = PASS
BACKUP = PASS_FRESH_NONEMPTY_VALIDATED
BACKUP_SHA256 = 579A5DE670A51A59AB8AA64BEF8B64783A96F5E35A68C88E236DD6C16E37ECBF
BASELINE_UNBALANCED_POSTED_JOURNALS = 1
BASELINE_UNBALANCED_IDS = JE-1787090870905
ALL_OTHER_BASELINE_UNBALANCED_POSTED_JOURNALS = 0
PROFILE_PREVIEW = PASS_READY_200
SHARED_PREVIEW = PASS_READY_200
EXACT_REQUEST_CAPTURE = PASS
CANONICAL_BUSINESS_HASH = NOT_DURABLY_CAPTURED_AFTER_500
AUTH_FRESHNESS = PASS_AT_DISPATCH
SAFE_POST_SUCCESS_IDEMPOTENCY_CHANNEL = AVAILABLE_NOT_EXECUTED
DIAGNOSTICS = ON
REQUEST_INTERCEPTION = OFF
OFFICIAL_DISTINCT_RECEIVE_ATTEMPT_COUNT = 1
OFFICIAL_RECEIVE_HTTP = 500
REQUEST_ID = 70e0c2c4-f4e1-48f8-94da-f5e5c5b5
PO_ID = NONE_PERSISTED
ASSET_ID = NONE_PERSISTED
BARCODE = NONE_PERSISTED
JOURNAL_ID = NONE_NEW
NEW_LOOSE_PEARL_JOURNAL_BALANCED = NOT_CREATED
NEW_LOOSE_PEARL_JOURNAL_DIFFERENCE = NOT_APPLICABLE
FINAL_TOTAL_UNBALANCED_POSTED_JOURNALS = 1
FINAL_UNBALANCED_POSTED_JOURNAL_IDS = JE-1787090870905
ALL_NEW_OR_OTHER_UNBALANCED_POSTED_JOURNALS = 0
ONE_PHYSICAL_PEARL_ONE_ASSET = NOT_CREATED
PEARL_COLOR_PERSISTENCE = NOT_RUN_OFFICIAL
HISTORICAL_COST = PREVIEW_ONLY_NOT_PERSISTED
CURRENT_VALUATION = PREVIEW_ONLY_NOT_PERSISTED
TAX_APPLICATION_COUNT = 0_PERSISTED
ACCOUNTING = NOT_RUN_FOR_NEW_TRANSACTION
SUPPLIER_AP = NO_PERSISTED_DELTA
CASH_DELTA = 0
AR_READBACK = NOT_RUN_NO_ASSET
EN_READBACK = NOT_RUN_NO_ASSET
POS_READ_ONLY = NOT_RUN_NO_BARCODE
IDEMPOTENCY_EXACT_REPLAY = NOT_RUN
IDEMPOTENCY_CHANGED_PAYLOAD_409 = NOT_RUN
DUPLICATE_BUSINESS_EFFECT = NO
OFFICIAL_LOCAL_MAIN_RECEIVE_EXECUTED = NO_500_FAILED_BEFORE_COMMIT
SECOND_DISTINCT_RECEIVE = NO
AUTOMATIC_RETRY_COUNT = 0
P0_COUNT = 0
P1_COUNT = 1
P2_COUNT = 1
LOOSE_PEARL_MODULE_STATUS = NOT_CLOSED
STAGE_A_STATUS = NOT_CLOSED
GATE = BLOCKED_LOOSE_PEARL_OFFICIAL_ACCEPTANCE
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_SEPARATE_MINIMUM_SAFE_FIX_CONTROL_FOR_NAN_ORDINAL
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

## 41. STOP

توقف هنا. لا Second Confirm، لا Historical Journal Remediation، لا Cleanup، لا Replay، لا Stage B. يتطلب أي إصلاح أو إعادة قبول Owner authorization جديدًا.
