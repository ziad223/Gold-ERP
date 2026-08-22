# DARFUS ERP — Pearl Stale Regression Test Contract Alignment

تمت مواءمة عقد الاختبارات القديم فقط. تم تحديث 6 assertions خاصة بتوقع Pearl المعطّل، مع إبقاء بقية تغطية GBW/GBP/Diamond/Gem/Loose Profile كما هي. جميع target/regression tests وtypecheck وbuild نجحت. لم تحدث أي كتابة على قاعدة البيانات ولم يُنفذ Receive أو Replay.

## 1. Executive Summary

- تم إغلاق فجوة `P2 / ACCEPTANCE_GAP / PRE_EXISTING_TEST_CONTRACT_DRIFT`.
- Pearl Jewellery الآن ممثل في الاختبارات كـ`ENABLED`.
- Loose Pearl بقي Profile منفصلًا ولم يُضم إلى Pearl Jewellery.
- Target tests: 13/13 PASS.
- Relevant Pearl regression: 56/56 PASS.
- Typecheck وBuild: PASS.
- Business writes: 0.

## 2. Scope / Authorization

Control: `DARFUS-PEARL-STALE-REGRESSION-TEST-CONTRACT-ALIGNMENT`.

النطاق اقتصر على test-contract alignment. لم يتم تعديل product source أو backend logic أو POS أو Receive أو Idempotency أو DB أو config أو migration.

## 3. Prior Closure State

من Control السابق:

- Exact Replay: PASS.
- Changed-payload 409: PASS.
- Replay/409 business delta: 0.
- POS Pearl price: 5000، selectable.
- AR/EN readback: PASS.
- Accounting/Inventory non-regression: PASS.

التقرير السابق: [DARFUS_PEARL_FINAL_CLOSURE_BLOCKERS_MINIMUM_SAFE_FIX_REPORT.md](I:/WORK/jewellery-erp-master/docs/DARFUS_PEARL_FINAL_CLOSURE_BLOCKERS_MINIMUM_SAFE_FIX_REPORT.md).

## 4. Frozen Pearl Authority

- `PEARL_JEWELLERY = ENABLED`.
- `PEARL_JEWELLERY_MODULE_IMPLEMENTATION = ACTIVE`.
- `PEARL_JEWELLERY_POS_SUPPORT = ACTIVE`.
- `LOOSE_PEARL = SEPARATE_CANONICAL_PROFILE`.
- `LOOSE_PEARL_IN_PEARL_JEWELLERY_ITEM_DESCRIPTION = NO`.

المصدر الحالي يثبت ذلك في [inventory-intake-chooser.tsx](I:/WORK/jewellery-erp-master/components/inventory/inventory-intake-chooser.tsx:15).

## 5. Stale Assertions Found

تم العثور على 6 assertions قديمة:

| File | Stale assertions | Old contract |
|---|---:|---|
| `tests/unified-inventory-intake-ux-02-r3.test.cjs` | 3 | Pearl disabled / counts 6 enabled + 1 disabled |
| `tests/unified-inventory-ux-final-closure.test.cjs` | 3 | Pearl disabled / counts 6 enabled + 1 disabled |

## 6. Test Contract Changes

تم تغيير assertions التالية فقط في الملفين:

- enabled count: `6 → 7`.
- disabled count: `1 → 0`.
- Pearl chooser: `enabled: false → enabled: true`.
- إضافة تحقق أن Pearl يفتح `pearlHref`.
- إضافة تحقق أن `LOOSE_PEARL` ليس key داخل chooser.

## 7. Unrelated Assertions Preserved

نعم. بقيت كما هي assertions الخاصة بـ:

- GBW وGBP.
- Diamond Jewellery وLoose Diamond.
- Gem Stone Jewellery وLoose Gem Stone.
- Unified Inventory action.
- Supplier legacy redirect-only behavior.
- Shared Receive section.
- Asset authority، Barcode، Accounting وRBAC-related contracts.
- Localized labels.

## 8. Target Test Results

الأمر:

```text
node --test tests/unified-inventory-intake-ux-02-r3.test.cjs tests/unified-inventory-ux-final-closure.test.cjs
```

النتيجة: `13 tests / 13 pass / 0 fail`.

## 9. Pearl Regression

تم تشغيل نفس مجموعة regression من Control السابق:

- 56 tests.
- 56 pass.
- 0 fail.
- `NEW_FAILURES = 0`.

شملت Pearl final fix، auth freshness، request dispatch، size UI binding، implementation، telemetry، Asset، Barcode، Unified Inventory، Supplier، Tax، وlegacy compatibility checks.

## 10. Typecheck / Build

- `npm run typecheck`: PASS بعد اكتمال build.
- `npm run build`: PASS.

حدث أثناء تشغيلهما بالتوازي خطأ generated مؤقت في `.next/types/validator.ts`، ثم نجح typecheck منفردًا بعد اكتمال build. لم يتم تعديل `.next` أو `next-env.d.ts`.

لا حاجة إلى backend rebuild لأن التغيير كان في test files فقط.

## 11. Zero-Mutation Proof

- `current_database() = darfus_erp`.
- PO count: 13.
- Asset count: 13.
- Journal count: 16.
- Business POST lines خلال التحقق: 0.
- Receive: 0.
- Replay: 0.
- Changed-payload 409: 0.
- POS Checkout: 0.
- Migration: 0.
- Seed: 0.
- Master-data mutation: 0.

لم تكن هناك حاجة إلى backup جديد لأن هذا Control test-only وغير متحور.

## 12. Lesson / Prevention Gate

لا يوجد درس مكافئ في المشروع، لذلك تم تسجيل:

`LL-017 — ACCEPTED PRODUCT STATE MUST REPLACE STALE AUTOMATED TEST CONTRACTS`

Prevention gate: عند انتقال module بقرار Owner من unavailable/blocked إلى enabled/accepted، يجب مراجعة كل acceptance assertions التي ما زالت تعكس الحالة القديمة قبل إغلاق module.

## 13. P0/P1/P2

- P0: 0.
- P1: 0.
- P2 stale test contract: CLOSED.
- لا توجد مشكلة Product أو Business Logic جديدة.

## 14. Final Gate

```text
GATE = PASS_PEARL_JEWELLERY_FINAL_CLOSURE_AFTER_IDEMPOTENCY_POS_AND_TEST_CONTRACT_ALIGNMENT
TARGET_STALE_TESTS = PASS
REGRESSION = PASS
TYPECHECK = PASS
BUILD = PASS
BUSINESS_WRITES = 0
NEW_RECEIVE_EXECUTED = NO
OFFICIAL_CONFIRM_CLICKS = 0
REPLAY_EXECUTED_THIS_CONTROL = NO
POS_CHECKOUT = NO
P0_COUNT = 0
P1_COUNT = 0
P2_STALE_TEST_CONTRACT = CLOSED
PEARL_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = YES
PEARL_JEWELLERY_MODULE_STATUS = CLOSED
NEXT_RECOMMENDED_STEP = LOOSE_PEARL_PREIMPLEMENTATION_AUTHORITY_AUDIT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 15. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PEARL-STALE-REGRESSION-TEST-CONTRACT-ALIGNMENT
LOCAL_MAIN_DB = darfus_erp
SOURCE_SCOPE = TEST_CONTRACT_ALIGNMENT_ONLY
TARGET_TEST_FILES = tests/unified-inventory-intake-ux-02-r3.test.cjs, tests/unified-inventory-ux-final-closure.test.cjs
STALE_ASSERTION_COUNT = 6
PEARL_JEWELLERY_EXPECTED_STATE = ENABLED
LOOSE_PEARL_EXPECTED_STATE = SEPARATE_CANONICAL_PROFILE
UNRELATED_ASSERTIONS_PRESERVED = YES
PRODUCT_SOURCE_CHANGED = NO
BUSINESS_LOGIC_CHANGED = NO
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
BUSINESS_WRITES = 0
NEW_RECEIVE_EXECUTED = NO
OFFICIAL_CONFIRM_CLICKS = 0
REPLAY_EXECUTED_THIS_CONTROL = NO
CHANGED_PAYLOAD_409_EXECUTED_THIS_CONTROL = NO
POS_CHECKOUT = NO
TARGET_STALE_TESTS = PASS
REGRESSION = PASS
NEW_FAILURES = 0
TYPECHECK = PASS
BUILD = PASS
LL017_OR_EXISTING_EQUIVALENT = LL-017_NEW
P0_COUNT = 0
P1_COUNT = 0
P2_STALE_TEST_CONTRACT = CLOSED
GATE = PASS_PEARL_JEWELLERY_FINAL_CLOSURE_AFTER_IDEMPOTENCY_POS_AND_TEST_CONTRACT_ALIGNMENT
PEARL_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = YES
PEARL_JEWELLERY_MODULE_STATUS = CLOSED
NEXT_RECOMMENDED_STEP = LOOSE_PEARL_PREIMPLEMENTATION_AUTHORITY_AUDIT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 16. STOP

تم التوقف. لا يبدأ Loose Pearl أو أي Module آخر تلقائيًا. ينتظر التنفيذ موافقة Owner صريحة للـnext batch.
