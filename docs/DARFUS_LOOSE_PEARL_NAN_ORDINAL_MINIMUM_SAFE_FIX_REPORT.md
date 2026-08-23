# DARFUS ERP — Loose Pearl NaN Ordinal Minimum Safe Fix Report

Control ID: DARFUS-LOOSE-PEARL-NAN-ORDINAL-MINIMUM-SAFE-FIX

## 1. Executive Summary

تم تحليل فشل Official السابق، وإثبات boundary، وتنفيذ أقل إصلاح مصدر للـreceipt evidence ordinal. الاختبارات المركزة والـregressions نجحت، لكن Disposable Clone لم يصل إلى Receive؛ توقف عند auth guard بسبب غياب company context لحساب Super Admin. لذلك لا يمكن إعلان runtime acceptance أو السماح بـOfficial Retry.

## 2. Authorization / Scope

النطاق كان source proof، minimum fix، focused tests، وClone فقط. لا Official Retry، لا Business Rule أو Tax أو Accounting أو Asset/Barcode change، لا migration، ولا Historical Journal Remediation.

## 3. Failed Official Attempt Evidence

Request ID = 70e0c2c4-f4e1-48f8-94da-f5e5c5b5، HTTP 500، وpersistent business delta = 0. الفشل كان في persistReceiptEvidence.

## 4. Root Cause

الـSQL replacement كان ordinal = piece.pieceIndex + 1. الـexact request لا يحتوي pieceIndex، فنتج undefined + 1 = NaN، وسجل PostgreSQL column "nan" does not exist. لا توجد حاجة إلى cleanup.

## 5. First Broken Boundary

FIRST_PROVEN_BROKEN_BOUNDARY = persistReceiptEvidence ordinal calculation before SQL. الـrequest mapper لا يضمن metadata القادم من العميل، والـSQL boundary لم يكن يثبت finite integer قبل الإرسال.

## 6. LP-LESSON-002 Link

هذا تكرار لنفس مشكلة LP-LESSON-002، وليس Lesson جديدة. SAME_CAUSE_REPEAT_COUNT = 1، وprevention gate السابق كان فاشلًا.

## 7. Minimum Safe Fix

أضيف resolveReceiptEvidenceOrdinal: يستخدم piece.pieceIndex إذا كان valid، وإلا يستخدم runtime array position الممررة من qtyIndex. يرفض NaN/Infinity/undefined/invalid قبل SQL بـcontrolled error. ordinal الناتج safe integer موجب.

## 8. Changed Files

- backend/src/services/inventory-v2-runtime.service.js: helper والتحقق قبل SQL.
- backend/src/routes/erp.routes.js: تمرير qtyIndex كـfallback deterministic.
- backend/tests/loose-pearl-nan-ordinal-minimum-safe-fix.test.cjs: ستة اختبارات مركزة.

الملفان الأولان كانا ضمن dirty/untracked worktree قبل هذا Control؛ لم يتم تنظيف أو إعادة ضبط أي drift.

## 9. Focused Tests

`node --test backend/tests/loose-pearl-nan-ordinal-minimum-safe-fix.test.cjs` = 6 passed، 0 failed.

## 10. LP003 Preservation

LP003 = CLOSED. pearlColor = Black بقي ضمن request/normalization tests. لم يظهر Asset رسمي جديد يعيد فتح LP003.

## 11. Relevant Regression

Relevant regression set = 52 passed، 0 failed، ويشمل Loose Pearl، G2C، G2A2، G3 precision، Asset، Barcode، labels، وLP003 preservation.

## 12. Typecheck / Build

`npm run typecheck` = PASS. Frontend build لم يُشغّل لأن Owner-approved next-env/build guard ما زال فعالًا؛ التعديل Backend JavaScript مباشر ولا يتطلب compiled backend build.

## 13. Official DB Baseline

current_database() = darfus_erp. Baseline: PO 13، PO items 13، Assets 13، journal entries 16، journal lines 45، idempotency 17، cash 3، Loose Pearl assets 0. Unbalanced posted set = JE-1787090870905 فقط.

## 14. Disposable Clone

تم إنشاء clone جديد باسم darfus_erp_loose_pearl_nan_fix_20260822_01 من backup، وتشغيل temporary backend على port 18003، وإثبات current_database exact clone. لم تُشغّل migration. بعد الفشل تم إيقاف backend وإسقاط clone فقط.

## 15. Clone Exact Request

الطلب الاصطناعي حافظ على shape الفشل: LOOSE_PEARL، quantity 1، perPiece length 1، pieceIndex/itemIndex absent، purchase 100، current 120، selling 200، Black، STANDARD_VAT، taxIncluded false، applyVat true.

## 16. Clone Receive

تمت محاولة Clone Receive واحدة فقط. النتيجة HTTP 422، code SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED، request ID 0616640e-268d-47db-ada8-0e1245989476. الفشل حدث قبل transaction/business mutation. لا Retry.

## 17. Receipt Evidence Ordinal Proof

Pure/source tests أثبتت ordinal 1 للطلب الفاشل، 1 للـpieceIndex 0، 1/2/3 للـmulti-piece، fallback آمن للـinvalid metadata، وfail-closed عند غياب كل المصادر. Clone runtime لم يصل إلى SQL بسبب auth guard.

## 18. Clone Business Chain

كل deltas في Clone = 0؛ لم ينشأ PO أو Asset أو detail أو origin أو cost revision أو valuation أو movement أو barcode أو journal أو payable.

## 19. Asset / Barcode

NOT REACHED: لا Asset ولا Barcode. لذلك لا يمكن إعلان one physical pearl = one Asset runtime أو PLLOS barcode في هذا Control.

## 20. Pearl Field Persistence

request/normalization لـBlack محفوظان بالاختبار. persistence وAR/EN readback لم يُنفذا لأن Receive لم يصل إلى business path. LP003 مغلق.

## 21. Tax

طلب Clone كان dynamic STANDARD_VAT بمعدل 14%، base 100. لم تحدث tax persistence في Clone.

## 22. Accounting

لم ينشأ Journal Clone. لا يوجد فرق جديد. الاستثناء التاريخي في Official لم يُلمس.

## 23. POS Read-only

NOT RUN: لا Barcode Clone.

## 24. Idempotency Exact Replay

NOT RUN لأن 201 لم يتحقق. لا يجوز replay بعد preflight 422.

## 25. Idempotency Conflict

NOT RUN لأن 201 لم يتحقق. لا يجوز changed-payload request.

## 26. Clone Final Integrity

Clone قبل إسقاطه بقي بنفس counts: 13 PO، 13 Asset، 16 journals، 17 idempotency، Loose Pearl assets 0، وكل delta = 0.

## 27. Clone Cleanup

تم إسقاط clone المحدد فقط، وتصنيفه ENVIRONMENT_CLEANUP_ONLY. لا official rows حُذفت.

## 28. Official DB Zero-Write Recheck

بعد cleanup: current_database() = darfus_erp، counts مطابقة للbaseline، business delta = 0، وsecond Official Receive = NO. Journal unbalanced الوحيد ما زال JE-1787090870905.

## 29. Prevention Gate

Source gate = PASS، focused tests = PASS، SQL boundary = fail-closed. Runtime clone gate = BLOCKED بسبب missing Super Admin company context؛ لذلك overall prevention acceptance غير مكتمل.

## 30. Lesson Status

LP-LESSON-002_STATUS = PREVENTION_GATE_REINFORCED_FOR_SOURCE_AND_TESTS_ONLY. لا Lesson جديدة، ولا يمكن إعلان runtime permanent prevention قبل Clone 201.

## 31. P0/P1/P2

| Priority | Count | Finding |
|---|---:|---|
| P0 | 0 | لا persisted data loss أو financial corruption |
| P1 | 1 | Clone runtime acceptance blocked before Receive by missing Super Admin company context |
| P2 | 0 | لا gap جديد؛ LP003 remains CLOSED |

## 32. Gate

GATE = BLOCKED_LOOSE_PEARL_NAN_ORDINAL_FIX

السبب: source/tests نجحت، لكن Clone Receive لم يعد HTTP 201، ولذلك لم تُثبت receipt evidence persistence أو chain أو accounting أو replay/conflict.

## 33. Final Tokens

CURRENT_CONTROL = DARFUS-LOOSE-PEARL-NAN-ORDINAL-MINIMUM-SAFE-FIX
LOCAL_MAIN_DB = darfus_erp
FAILED_OFFICIAL_REQUEST_ID = 70e0c2c4-f4e1-48f8-94da-f5e5c5b5
FAILED_OFFICIAL_HTTP = 500
FAILED_OFFICIAL_PERSISTENT_BUSINESS_DELTA = 0
ROOT_CAUSE = MISSING_OR_DROPPED_PIECE_ORDINAL_METADATA_CAUSING_NAN
FIRST_PROVEN_BROKEN_BOUNDARY = persistReceiptEvidence_ordinal_before_SQL
LP_LESSON = LP-LESSON-002
SAME_CAUSE_REPEAT_COUNT = 1
MINIMUM_SAFE_FIX = validated_canonical_pieceIndex_or_qtyIndex_fallback_then_fail_closed
CHANGED_FILES = inventory-v2-runtime.service.js; erp.routes.js; new focused test
BUSINESS_LOGIC_CHANGE = NO
DB_SCHEMA_CHANGE = NO
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
FOCUSED_TESTS = PASS_6_OF_6
LP003 = CLOSED
LP003_REGRESSION = PASS_NO_NEW_EVIDENCE
RELEVANT_REGRESSION = PASS_52_OF_52
TYPECHECK = PASS
BUILD = NOT_RUN_OWNER_BUILD_GUARD
CLONE_NAME = darfus_erp_loose_pearl_nan_fix_20260822_01
CLONE_RECEIVE_HTTP = 422_SUPER_ADMIN_COMPANY_CONTEXT_REQUIRED
CLONE_REQUEST_ID = 0616640e-268d-47db-ada8-0e1245989476
CLONE_PO_ID = NONE
CLONE_ASSET_ID = NONE
CLONE_BARCODE = NONE
CLONE_JOURNAL_ID = NONE
RECEIPT_EVIDENCE_ORDINAL = SOURCE_TEST_PASS_RUNTIME_NOT_REACHED
ORDINAL_IS_FINITE = PASS_UNIT
ORDINAL_IS_INTEGER = PASS_UNIT
NAN_REACHED_SQL = NO_AFTER_FIX_UNIT_PATH
ONE_PHYSICAL_PEARL_ONE_ASSET = NOT_REACHED_CLONE
PEARL_COLOR_PERSISTENCE = REQUEST_NORMALIZATION_PASS_PERSISTENCE_NOT_REACHED
TAX_APPLICATION_COUNT = 0_CLONE_PERSISTED
NEW_JOURNAL_BALANCED = NOT_CREATED
POS_READ_ONLY = NOT_RUN
IDEMPOTENCY_EXACT_REPLAY = NOT_RUN
IDEMPOTENCY_CHANGED_PAYLOAD_409 = NOT_RUN
CLONE_FINAL_INTEGRITY = PASS_ZERO_DELTA_BEFORE_DROP
CLONE_DROPPED = YES
CLONE_DROP_CLASSIFICATION = ENVIRONMENT_CLEANUP_ONLY
OFFICIAL_DB_BUSINESS_DELTA = 0
OFFICIAL_RETRY_EXECUTED = NO
SECOND_OFFICIAL_RECEIVE_ATTEMPT = NO
P0_COUNT = 0
P1_COUNT = 1
P2_COUNT = 0
GATE = BLOCKED_LOOSE_PEARL_NAN_ORDINAL_FIX
LOOSE_PEARL_MODULE_STATUS = NOT_READY_FOR_OFFICIAL_RETRY
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_AUTH_CONTEXT_THEN_NEW_CONTROL_FOR_ONE_CLONE_RECEIVE_AND_OFFICIAL_RETRY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

## 34. STOP

توقف. لا Official Retry، لا Second Confirm، لا Stage B، لا Deployment. يتطلب أي محاولة Clone جديدة أو Official Retry تفويض Owner جديد.
