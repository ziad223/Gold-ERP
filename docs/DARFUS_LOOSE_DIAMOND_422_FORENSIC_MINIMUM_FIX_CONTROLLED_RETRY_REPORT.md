# DARFUS ERP — Loose Diamond 422 Forensic + Minimum Safe Fix + One Controlled Retry

## 1. Executive Summary

تم إثبات سبب رفض الـReceive السابق بدقة، ثم طُبق أقل إصلاح آمن لدعم مراجع Master Data متعددة الألوان. اجتازت الاختبارات المركزة والـregressions والـtypecheck. بعد ذلك تم إنشاء backup جديد وتنفيذ Retry واحد فقط، لكنه انتهى بـ HTTP 500 ولم تُنشأ أي بيانات أعمال. لا يوجد Retry ثانٍ.

## 2. Previous 422 Attempt Attribution

PREVIOUS_RECEIVE_POST_ATTEMPTS = 2
PREVIOUS_TOOL_ATTEMPT = 1
PREVIOUS_OWNER_MANUAL_ATTEMPT = 1
PREVIOUS_SUCCESSFUL_RECEIVES = 0
PREVIOUS_BUSINESS_WRITES = 0
UI_DOUBLE_SUBMIT_BUG = NOT_INDICATED

## 3. DB Baseline

قبل الإصلاح والـRetry: current_database() = darfus_erp؛ purchase_orders=9؛ purchase_order_items=9؛ assets=9؛ asset_barcode_history=9؛ asset_origins=9؛ asset_purchase_cost_revisions=9؛ asset_current_valuations=9؛ inventory_asset_movements=9؛ journal_entries=12؛ journal_lines=33؛ cash_transactions=3؛ idempotency_requests=12؛ audit_logs=63؛ LOOSE_DIAMOND assets=0.

## 4. Exact 422 Response

تم التقاط الاستجابة الآمنة:

HTTP 422
code = VALIDATION_FAILED
message = PROFILE_MASTER_DATA_ACTIVE_VALUE_REQUIRED
fields = {}
request_id = 6123cb7d-6edf-417f-bf7d-eadf05df711f

## 5. Error Observability

تم تعديل logging فقط لإظهار errorCode وmessage وfieldErrors الآمنة. لم يتم تسجيل token أو cookies أو password أو payload كامل. الاستجابة للمستخدم بقيت business-safe.

## 6. Exact Failing Payload

تمت إعادة بناء نفس الحمولة الاصطناعية: LOOSE_DIAMOND، inventoryV2=true، quantity=1، perPiece length=1، DD/LOS/00، 1.25 CT، purchase base=5000، current value=6200، F/G، STANDARD_VAT، dynamic VAT=14%، Supplier/Location/company/branch server-backed.

## 7. Receive Validation Trace

POST /api/v1/purchase-orders/receive
→ erp.routes.js
→ inventoryV2Runtime.requireV2ReceiptPieces
→ inventoryV2Runtime.persistReceiptEvidence
→ profileMasterDataService.resolveLooseReferences
→ profileMasterDataService.requireActive

## 8. Root Cause

looseDetails.masterData.diamondColor يصل كمصفوفة من معرفين نشطين. الكود السابق أرسل المصفوفة كاملة إلى requireActive كمعرف واحد، فلم يطابق أي صف نشط، وصدر PROFILE_MASTER_DATA_ACTIVE_VALUE_REQUIRED.

## 9. Root Cause Classification

ROOT_CAUSE_CLASSIFICATION = BACKEND_VALIDATION_BUG

## 10. Minimum Safe Fix

في backend/src/services/profile-master-data.service.js داخل resolveLooseReferences، أصبحت القيمة المصفوفية تُفحص عنصرًا عنصرًا عبر نفس requireActive، مع بقاء company/category/is_active checks كما هي. لا يوجد bypass أو hardcode أو تغيير Tax/Supplier/Location/Idempotency authority.

## 11. Files Changed

- backend/src/services/profile-master-data.service.js — إصلاح multi-value Master Data resolution.
- backend/src/middleware/error.middleware.js — observability آمن للكود/الرسالة/الحقول.
- backend/tests/loose-diamond-minimum-safe-implementation.test.cjs — exact regression وnegative regression.
- tests/unified-inventory-ux-final-closure.test.cjs — تحديث assertion قديم من Server Tax Summary إلى Tax Summary التجاري.

الـworktree يحتوي تغييرات سابقة كثيرة؛ لم يتم reset/clean/restore/stash.

## 12. Exact 422 Regression

EXACT_422_REGRESSION = PASS

## 13. Negative Fail-Closed Regression

INVALID_CASE_STILL_FAILS_CLOSED = PASS

## 14. Focused Tests

backend/tests/loose-diamond-minimum-safe-implementation.test.cjs: 11 passed, 0 failed.
FOCUSED_TESTS = PASS

## 15. Relevant Regression

تم تشغيل 40 اختبارًا متعلقًا بـSupplier V2 وDiamond وAsset وBarcode وUnified Intake وUX؛ النتيجة 40 passed, 0 failed.
RELEVANT_REGRESSION = PASS

## 16. Typecheck

npm run typecheck = PASS

## 17. Runtime Restart

تمت إعادة تشغيل backend runner فقط، دون migrations أو seed أو حذف volumes. Frontend ظل production runtime على port 3000.

## 18. Health

/api/v1/health = 200
/api/v1/health/db = 200
/api/v1/health/redis = 200
database = darfus_erp

## 19. AR Preview Recheck

PASS: AR reached بيانات الاستلام مكتملة؛ base/VAT/total = 5000 / 700 / 5700؛ current valuation = 6200 / 868 / 7068.

## 20. EN Preview Recheck

PASS: EN reached Receipt data complete؛ base/VAT/total = 5000 / 700 / 5700؛ current valuation = 6200 / 868 / 7068.

## 21. UI Tooltip/Cleanup Regression

TECHNICAL_INTERNAL_NOTES_VISIBLE = NO
USEFUL_BUSINESS_HELP_TOOLTIPS = PASS
AR_TOOLTIPS = PASS
EN_TOOLTIPS = PASS
TOOLTIP_KEYBOARD_ACCESSIBLE = PASS
TOOLTIP_TOUCH_ACCESSIBLE = PASS
UI_CLEANUP_REGRESSION = PASS
DOUBLE_VAT = NO

## 22. New Exact Retry Request

تم إنشاء request object جديد وIdempotency key جديد وتجميدهما قبل الإرسال. المفتاح redacted من التقرير. الحقول الأساسية بقيت unitCost/purchaseCost=5000.00000000 وtaxIncluded=false وapplyVat=true وperPiece.length=1.

## 23. Fresh Pre-Retry Backup

Path: backend/backups/darfus_erp_PRE_LOOSE_DIAMOND_RETRY_20260821_111445Z.dump
Bytes: 694859
SHA-256: A953C22957E4A40227A4AEBC784E316A93EA0B765E4BBF2379FBBFBDFEE3C062
pg_restore -l = PASS؛ TOC entries 1175.
Backup timestamp preceded Retry POST.

## 24. Controlled Retry Result

تم تنفيذ Retry واحد فقط:

HTTP 500
code = INTERNAL_SERVER_ERROR
message = An unexpected server error occurred.
request_id = 1a022287-8947-4448-b0d7-3450017991b0

حسب control، لا يوجد Retry ثانٍ. السبب الداخلي للـ500 لم يُستنتج ولم يتم تخمينه.

## 25. PO / Asset / Barcode

لم يتم إنشاء PO أو PO Item أو Asset أو Barcode. Counts بقيت كما هي، وLOOSE_DIAMOND assets بقيت 0.

## 26. Multi-Color

Payload/master-reference regression: PASS. Persistence proof: NOT RUN بسبب فشل Retry.

## 27. Purchase Cost Revision

NOT RUN after retry failure؛ count remained 9.

## 28. Current Valuation

NOT RUN after retry failure؛ count remained 9. Preview remained 6200 / 868 / 7068.

## 29. Tax Snapshot

Preview parity PASS. Persisted Tax Snapshot: NOT RUN.

## 30. Supplier Payable

NOT RUN؛ no PO was created and no payment was executed.

## 31. Journal

NOT RUN؛ journal entries remained 12 and journal lines 33.

## 32. Financial Reconciliation

Preview arithmetic passed: 5000 + 700 = 5700؛ 6200 + 868 = 7068. Post-persistence reconciliation is NOT RUN.

## 33. Idempotency Exact Replay

NOT RUN because no successful original Receive exists. idempotency_requests remained 12.

## 34. Same-Key Conflict

NOT RUN because no successful original Receive exists.

## 35. AR Persisted Details

NOT RUN؛ no Asset was persisted.

## 36. EN Persisted Details

NOT RUN؛ no Asset was persisted.

## 37. Final DB Deltas

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| purchase_orders | 9 | 9 | 0 |
| purchase_order_items | 9 | 9 | 0 |
| assets | 9 | 9 | 0 |
| asset_barcode_history | 9 | 9 | 0 |
| asset_origins | 9 | 9 | 0 |
| asset_purchase_cost_revisions | 9 | 9 | 0 |
| asset_current_valuations | 9 | 9 | 0 |
| inventory_asset_movements | 9 | 9 | 0 |
| journal_entries | 12 | 12 | 0 |
| journal_lines | 33 | 33 | 0 |
| cash_transactions | 3 | 3 | 0 |
| idempotency_requests | 12 | 12 | 0 |
| audit_logs | 63 | 63 | 0 |

PREVIOUS_BUSINESS_WRITES = 0
RETRY_BUSINESS_WRITES = 0
DUPLICATE_BUSINESS_ROWS = 0
CASH_DELTA = 0

## 38. Existing Unrelated Journal P0

The pre-existing imbalance remains unchanged: JE-1787090870905, debit 2133.21, credit 2133.22, difference -0.01. It was not modified.

## 39. P0 / P1

| Priority | Issue | Classification | Evidence | Impact |
|---|---|---|---|---|
| P0 existing | Unrelated journal imbalance | FINANCIAL | JE unchanged | Existing financial integrity risk |
| P1 new | Controlled Retry returns 500 | OTHER_PROVEN | HTTP 500, no business rows | Loose Diamond workflow remains open |

## 40. Gate

MINIMUM_SAFE_FIX = PASS
RECEIVE_422_ROOT_CAUSE = PROVEN
CONTROLLED_RETRY_HTTP = 500
SUCCESSFUL_NEW_LOOSE_DIAMOND_RECEIVES = 0
GATE = FAIL_LOOSE_DIAMOND_CONTROLLED_RETRY
LOOSE_DIAMOND_FINAL_USER_WORKFLOW_CLOSED = NO
LOOSE_DIAMOND_MODULE_STATUS = OPEN
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

## 41. Final Tokens

CURRENT_CONTROL = DARFUS-LOOSE-DIAMOND-422-FORENSIC-MINIMUM-FIX-CONTROLLED-RETRY
LOCAL_MAIN_DB = darfus_erp
PREVIOUS_RECEIVE_POST_ATTEMPTS = 2
PREVIOUS_TOOL_ATTEMPT = 1
PREVIOUS_OWNER_MANUAL_ATTEMPT = 1
UI_DOUBLE_SUBMIT_BUG = NOT_INDICATED
PREVIOUS_SUCCESSFUL_RECEIVES = 0
PREVIOUS_BUSINESS_WRITES = 0
RECEIVE_422_RESPONSE_BODY = CAPTURED
RECEIVE_422_ERROR_CODE = VALIDATION_FAILED
RECEIVE_422_ERROR_MESSAGE = PROFILE_MASTER_DATA_ACTIVE_VALUE_REQUIRED
REJECTION_LAYER = Supplier Receive V2 receipt evidence / Profile Master Data resolution
REJECTION_FILE = backend/src/services/profile-master-data.service.js
REJECTION_FUNCTION = resolveLooseReferences -> requireActive
REJECTION_CONDITION = diamondColor array was passed as one master-data id
ROOT_CAUSE = multi-color master references were not iterated individually
ROOT_CAUSE_CLASSIFICATION = BACKEND_VALIDATION_BUG
MINIMUM_SAFE_FIX = PASS
EXACT_422_REGRESSION = PASS
INVALID_CASE_STILL_FAILS_CLOSED = PASS
FOCUSED_TESTS = PASS
RELEVANT_REGRESSION = PASS
TYPECHECK = PASS
AR_PREVIEW = PASS
EN_PREVIEW = PASS
PREVIEW_PARITY = PASS
DOUBLE_VAT = NO
UI_CLEANUP_REGRESSION = PASS
NEW_RETRY_REQUEST = YES
NEW_RETRY_IDEMPOTENCY_KEY = YES
PRE_RETRY_BACKUP = PASS
PRE_RETRY_BACKUP_PATH = backend/backups/darfus_erp_PRE_LOOSE_DIAMOND_RETRY_20260821_111445Z.dump
PRE_RETRY_BACKUP_SHA256 = A953C22957E4A40227A4AEBC784E316A93EA0B765E4BBF2379FBBFBDFEE3C062
BACKUP_PRECEDES_RETRY_POST = YES
CONTROLLED_RETRY_HTTP = 500
SUCCESSFUL_NEW_LOOSE_DIAMOND_RECEIVES = 0
PO = NONE
ASSET = NONE
BARCODE = NONE
JOURNAL = NONE
ONE_STONE_ONE_ASSET = NOT_RUN
MOUNTED_COMPONENTS = NOT_RUN
MULTI_COLOR = PASS_PRE_PERSISTENCE_NOT_RUN_AFTER_RETRY
PURCHASE_COST_PRETAX = 5000.00_PREVIEW_ONLY
CURRENT_VALUATION = NOT_RUN_AFTER_RETRY_FAILURE
HISTORICAL_CURRENT_SEPARATION = PASS_PREVIEW_ONLY
TAX_PARITY = PASS_PREVIEW_ONLY
SUPPLIER_PAYABLE = NOT_RUN
PAYMENT_EXECUTED = NO
CASH_DELTA = 0
NEW_JOURNAL_BALANCE = NOT_RUN
IDEMPOTENCY_EXACT_REPLAY = NOT_RUN
IDEMPOTENCY_CONFLICT = NOT_RUN
DUPLICATE_BUSINESS_ROWS = 0
AR_ASSET_DETAILS = NOT_RUN
EN_ASSET_DETAILS = NOT_RUN
PRE_EXISTING_UNRELATED_FINANCIAL_P0 = PRESENT_JE_1787090870905
PRE_EXISTING_P0_CHANGED = NO
ONLINE_PRODUCTION_CONTACTED = NO
P0_NEW = 0
P1_NEW = 1
GATE = FAIL_LOOSE_DIAMOND_CONTROLLED_RETRY
LOOSE_DIAMOND_FINAL_USER_WORKFLOW_CLOSED = NO
LOOSE_DIAMOND_MODULE_STATUS = OPEN
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

## Stop

تم التوقف بعد Retry واحد فقط. لا Payment، لا RFID، لا Cleanup، لا تعديل يدوي للـDB، لا Retry ثانٍ، ولا بدء Gem Stone.
