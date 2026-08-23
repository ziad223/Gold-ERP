# DARFUS ERP — Unbalanced Posted Journal Forensic Report

أُنجز هذا الفحص قراءةً فقط. تم تحديد أول حد مكسور في إنشاء القيد، ولم يتم تنفيذ أي إصلاح أو تعديل أو Receive. قاعدة البيانات الرسمية بقيت `darfus_erp`، ولم تُكتب أي بيانات.

## 1. Executive Summary

القيد `JE-1787090870905` منشور وغير متوازن بفارق `0.01000000`، ومصدره `PO-1787090870807`. مصدر العملية نفسه متوازن عند دقة الـTax Snapshot ذات 8 منازل، لكن مسار الـposting التاريخي قرّب سطور Inventory وVAT وAP إلى السنت ثم سمح بفرق `0.01` بسبب شرط tolerance قديم. لذلك صُنّف العيب كـ`HISTORICAL_ISOLATED_DATA_DEFECT`، وليس تمثيلًا محاسبيًا مشروعًا.

## 2. Scope / Read-Only Proof

- Control: `DARFUS-ACCOUNTING-JE-1787090870905-UNBALANCED-JOURNAL-FORENSIC`
- Mode: `READ_ONLY_FORENSIC`
- لا Journal edit، ولا SQL mutation، ولا reversal، ولا migration، ولا seed، ولا Receive.
- تم الحفاظ على حالة الـworktree المتسخة دون `reset/clean/restore/stash`.
- الاختباران الساكنان اللذان تمت مراجعتهما شُغّلا بنجاح: `17/17`.

## 3. Prior Blocked Gate

الـLoose Pearl Official Receive كان متوقفًا عند:

`BLOCKED_LOOSE_PEARL_OFFICIAL_LOCAL_MAIN_RECEIVE_ACCEPTANCE`

بسبب `FAIL_UNBALANCED_POSTED_JOURNAL`. لم يُعاد فتح Loose Pearl، ولم يُنفذ Receive جديد.

## 4. Target Identity

`SELECT current_database()` أعاد `darfus_erp`. السجلان الهدف موجودان بالهوية المطلوبة:

- Journal: `JE-1787090870905`
- PO: `PO-1787090870807`

## 5. Journal Header

| Field | Actual |
|---|---|
| Status | `posted` |
| Source | `purchase_order / PO-1787090870807` |
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Branch | `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` |
| Date | `2026-08-18` |
| Stored amount | `2133.21000000` |
| Stored total debit | `2133.21000000` |
| Stored total credit | `2133.22000000` |
| Reversal | none |

## 6. Journal Lines

| Line | Account | Role | Debit | Credit |
|---|---|---|---:|---:|
| L1 | `SYS-INVENTORY` | Inventory/Asset | 1871.24000000 | 0 |
| L2 | `1400` | Recoverable Input VAT | 261.97000000 | 0 |
| L3 | `SYS-AP` | Supplier Payable | 0 | 2133.22000000 |

## 7. Exact 0.01 Reconciliation

`L1 + L2 = 1871.24 + 261.97 = 2133.21`.

`L3 = 2133.22`.

الفرق ليس في سطر منفرد؛ هو residual ناتج عن تقريب مكونات المدين والدائن بشكل مستقل. الملخص المخزن يطابق مجموع السطور، لذلك `SUMMARY_FIELD_DEFECT = NO`.

`FIRST_UNBALANCED_LINE_OR_COMPONENT = independent cent rounding of Inventory + VAT versus AP credit, admitted by the historical posting tolerance.`

## 8. Purchase Order

الـPO في حالة `received`، المورد `QA-G2C-SUPPLIER-01`، الفرع `Branch-1`، التاريخ `2026-08-18`، والمدفوع `0`.

| Field | Actual |
|---|---:|
| PO total | 2133.21562382 |
| Tax base column | 1871.24180000 |
| VAT rate | 14.000% |
| Input VAT column | 261.97380000 |
| Tax treatment | STANDARD_VAT |
| Tax included flag | true |
| Remaining | 2133.21562382 |

## 9. Purchase Order Items

يوجد بند واحد:

- `quantity=1`
- `unitPrice=2133.21562382`
- `total=2133.21562382`
- profile `GOLD_BY_PIECE`
- asset `AST-PUR-1787090870838-1-1-9k4e`
- product `NULL`
- `finalPurchaseCost=1871.24000000`

## 10. PO Header vs Items

- PO total مقابل item total: `PASS` بدقة كاملة.
- tax base column + input VAT column = `2133.21560000`، بفارق `-0.00002382` عن PO total.
- النتيجة: `PO_HEADER_VS_ITEMS = FAIL_PRECISION_COMPONENT_RECONCILIATION` مع ملاحظة أن total/item صحيحان وأن الـTax Snapshot المنفصل متوازن.

## 11. Tax Snapshot

الـTax Snapshot يثبت:

- `STANDARD_VAT`
- Rate: `14%`
- Taxable base: `1871.24177528`
- VAT: `261.97384854`
- Rounding scale: `8`
- Version: `DARFUS-UAE-TAX-03B-G2A2-V1`

## 12. Tax Recalculation

`1871.24177528 × 14 / 100 = 261.9738485392`.

بعد `Decimal ROUND_HALF_UP` إلى 8 منازل: `261.97384854`.

الـSnapshot base + VAT = `2133.21562382`، إذن:

`TAX_SNAPSHOT_MATCH = PASS`

لكن أعمدة PO المكونة (`1871.24180000 + 261.97380000`) لا تطابق الـSnapshot عند 8 منازل:

`PO_HEADER_TAX_FIELD_MATCH = FAIL_PRECISION_MISMATCH`.

## 13. Accounting Mapping

المسار يستخدم الشكل القياسي:

- Inventory/Asset: `SYS-INVENTORY`
- Recoverable VAT: `1400`
- Supplier Payable: `SYS-AP`

لا يوجد Cash/Treasury line لأن `paidAmount=0`.

## 14. Source → Journal Recalculation

| Component | Exact source | Actual journal | Delta |
|---|---:|---:|---:|
| Inventory debit | 1871.24177528 | 1871.24000000 | -0.00177528 |
| VAT debit | 261.97384854 | 261.97000000 | -0.00384854 |
| AP credit | 2133.21562382 | 2133.22000000 | +0.00437618 |
| Total debit | 2133.21562382 | 2133.21000000 | -0.00562382 |
| Total credit | 2133.21562382 | 2133.22000000 | +0.00437618 |

`SOURCE_TRANSACTION_BALANCED = YES` عند الـimmutable snapshot.

`JOURNAL_GENERATION_BALANCED = NO`.

## 15. Precision / Rounding Trace

1. Tax Snapshot: Decimal، 8 places، balanced.
2. PO tax component columns: values observed at 4 decimal representation and not exact against the 8-decimal total.
3. Historical `postPurchaseEntry`: `round(value) = Math.round(Number(value) * 100) / 100`.
4. Historical `postEntry`: calculated totals from input lines and used `Math.abs(totalDebit-totalCredit) > 0.01`; a difference exactly `0.01` passed.
5. Journal lines were persisted from rounded amounts, so the unbalanced values became durable ledger rows.

`ROUNDING_BOUNDARY = historical postEntry balance gate after independent cent rounding`.

## 16. Exact Code Path

`POST /purchase-orders/receive`
→ `backend/src/routes/erp.routes.js` receive handler
→ `supplierAcquisitionPreviewService.calculateTotals`
→ `PurchaseOrder.create` / Asset and PO item persistence
→ `backend/src/services/posting.service.js:postPurchaseEntry`
→ Inventory/VAT/AP line construction
→ `postEntry`
→ `JournalEntry.create` and `JournalLine.create`.

The current working tree additionally contains a strict tax snapshot parity check and an exact rounded-line balance guard. Those are pre-existing dirty-worktree changes and were not made in this Control.

## 17. Current Code Reproducibility

Pure calculation with the exact stored inputs gives:

- rounded Inventory: `1871.24`
- rounded VAT: `261.97`
- rounded AP: `2133.22`
- rounded debit: `2133.21`
- rounded credit: `2133.22`

The old HEAD guard accepted this. The current working-tree guard compares the rounded values with exact cent equality and rejects it before persistence.

`CURRENT_CODE_REPRODUCES_DEFECT = NO`.

This is static/pure calculation only; no runtime mutation or official replay was attempted.

## 18. Similar Pattern Scan

Read-only scan of all `posted` journals recalculated from `journal_lines`:

- Total unbalanced posted journals: `1`
- Purchase-order unbalanced journals: `1`
- Exact 0.01 pattern: `1`
- Difference <= 0.05: `1`
- IDs: `JE-1787090870905`

`SAME_CODE_PATH_PATTERN_SCOPE = one exact row; broader equivalence not proven`.

## 19. Historical Code Context

The target transaction was created on `2026-08-18`. Current `HEAD` is dated `2026-08-04` and its committed `postEntry` still used the `> 0.01` tolerance. The current worktree has later uncommitted source changes, including exact balance rejection and strict tax parity. The exact backend process/source snapshot at the historical request is not stored independently, but the persisted outcome is exactly compatible with the older tolerance path.

`TRANSACTION_CREATED_UNDER = OLDER_CODE_PATH` with high confidence for the posting behavior.

## 20. Audit / Idempotency Evidence

Idempotency row:

- scope `purchase.receive`
- key `8209162d-bc81-4428-bcee-2453b49691b2`
- hash `507c38cb2cfb160724d64725cb5c9bf28d75b6dd5e6a268a10d45730aaeb2740`
- status `succeeded`, HTTP `201`

Audit row `purchase.receive` exists and contains PO, Asset, tax snapshot, and total values. The original request body is not retained as a standalone immutable record.

`ORIGINAL_REQUEST_EVIDENCE = INCOMPLETE`.

## 21. Financial Impact

- Ledger persistence difference: `YES`.
- Journal imbalance: `0.01000000`.
- AP credit is `0.00437618` above the exact PO total.
- Inventory journal debit is `0.00177528` below exact Asset purchase cost.
- Recoverable VAT journal debit is `0.00384854` below the tax snapshot.
- Trial balance impact: `YES`, because posted lines are unbalanced.
- Cash/Treasury impact: `0`; no payment/cash transaction exists.
- Asset purchase-cost revision remains exact and internally consistent; it does not repair the ledger imbalance.

`DISPLAY_ONLY_DIFFERENCE = NO`.

## 22. Data Integrity Impact

- One source journal exists for the PO; no duplicate source journal.
- Target source links, Asset origin, movement, cost revision, valuation, and PO-item Asset link are present.
- Asset cost and current purchase-cost revision agree at `1871.24177528`.
- No payment is linked.
- Supplier `due` is `0`; the project handoff/code identifies it as a frozen legacy/reference field, not the payable authority.
- The defect is isolated to the posted journal plus the ledger/source rounding deltas; no duplicate payable or cash effect was proven.

## 23. Baseline Exception Assessment

`BASELINE_EXCEPTION_RECOMMENDED = NO`.

لا يوجد دليل محاسبي يسمح بقيد منشور غير متوازن، ولا يجوز تحويله إلى expected representation.

## 24. Root Cause Classification

`ROOT_CAUSE_CLASS = HISTORICAL_ISOLATED_DATA_DEFECT`.

الأساس:

1. مصدر العملية والـTax Snapshot متوازنان.
2. القيد المنشور وحده غير متوازن.
3. المسح وجد صفًا واحدًا فقط.
4. الكود الحالي في worktree يرفض نفس الحالة قبل persistence.
5. الـHEAD التاريخي يثبت أن tolerance القديم كان يقبل الفرق `0.01`.

`FIRST_PROVEN_BROKEN_BOUNDARY = historical postEntry tolerance after persisted-line rounding`.

## 25. Minimum Future Remediation Design

التصميم فقط، ولم يُنفذ:

`ONE_JOURNAL_ACCOUNTING_REMEDIATION`

يجب أن تكون معالجة Owner-approved وقابلة للتدقيق وتحافظ على القيد الأصلي، الـPO، الـAsset، cost revision، payable source، وTax Snapshot. الخيارات التي يجب تقييمها هي correction/compensating journal controlled، أو canonical reversal/repost إذا كان المسار يدعم هذا المصدر بأمان، أو source-specific remediation workflow.

ممنوع direct update/delete أو balance plug صامت أو restore فوق القاعدة.

## 26. Prevention Gate

الحد الأدنى:

- assert أن مجموع السطور بعد نفس rounding الذي سيُحفظ يساوي صفر فرقًا.
- عدم استخدام tolerance يسمح بقيد غير متوازن.
- اختبار rounding-edge وVAT snapshot/header parity.
- اختبار Supplier Receive accounting invariant وidempotency source uniqueness.

`ABS(totalDebit-totalCredit) = 0` عند دقة التخزين المعتمدة.

## 27. Required Future Tests

تم تصميم الاختبارات التالية ولم يتم تعديلها:

1. إعادة إنتاج القيم الدقيقة للهدف ورفضها قبل persistence.
2. Tax Snapshot 8-decimal base/VAT/total parity.
3. كشف عدم تطابق أعمدة PO ذات الدقة الأقل.
4. Journal line/summary balance invariant.
5. Supplier Receive V2 accounting invariant.
6. Idempotency replay/conflict لا ينشئ journal مصدرًا ثانيًا.

الاختبارات الحالية التي تمت مراجعتها وتشغيلها: `tests/financial-bootstrap-cont4-contract.test.cjs` و`backend/tests/g3-po-tax-precision-schema.test.cjs` — النتيجة `17/17 PASS`.

## 28. DB Zero-Write Proof

إعادة القراءة النهائية أكدت:

`current_database() = darfus_erp`

والأعداد بقيت:

| Entity | Count |
|---|---:|
| purchase_orders | 13 |
| purchase_order_items | 13 |
| assets | 13 |
| journal_entries | 16 |
| journal_lines | 45 |
| idempotency_requests | 17 |
| cash_transactions | 3 |

`DB_WRITES_THIS_CONTROL = 0`، والقيد والـPO والـAsset والـCash لم تتغير.

## 29. P0/P1/P2

- P0: `0`
- P1: `1` — existing posted unbalanced journal blocks the official Loose Pearl baseline gate.
- P2: `0`

## 30. Gate

`GATE = PASS_ACCOUNTING_JE_1787090870905_FORENSIC_ROOT_CAUSE_IDENTIFIED`

هذا PASS يعني اكتمال الـforensic root-cause report فقط، ولا يعني أن القيد تم إصلاحه.

## 31. Final Tokens

```text
CURRENT_CONTROL = DARFUS-ACCOUNTING-JE-1787090870905-UNBALANCED-JOURNAL-FORENSIC
LOCAL_MAIN_DB = darfus_erp
MODE = READ_ONLY_FORENSIC
TARGET_JOURNAL = JE-1787090870905
TARGET_PO = PO-1787090870807
JOURNAL_STATUS = posted
SUM_DEBIT = 2133.21000000
SUM_CREDIT = 2133.22000000
DIFFERENCE = 0.01000000
FIRST_UNBALANCED_LINE_OR_COMPONENT = POSTING_ROUNDING_RESIDUAL_INVENTORY_PLUS_VAT_VS_AP
PO_HEADER_VS_ITEMS = FAIL_PRECISION_COMPONENT_RECONCILIATION
TAX_SNAPSHOT_MATCH = PASS
SOURCE_TRANSACTION_BALANCED = YES
JOURNAL_GENERATION_BALANCED = NO
ROUNDING_BOUNDARY = HISTORICAL_POSTENTRY_AFTER_INDEPENDENT_CENT_ROUNDING
FIRST_PROVEN_BROKEN_BOUNDARY = HISTORICAL_POSTENTRY_TOLERANCE_ACCEPTED_0_01
CURRENT_CODE_REPRODUCES_DEFECT = NO
TOTAL_UNBALANCED_POSTED_JOURNALS = 1
PURCHASE_ORDER_UNBALANCED_COUNT = 1
EXACT_0_01_PATTERN_COUNT = 1
TRANSACTION_CREATED_UNDER = OLDER_CODE_PATH
ROOT_CAUSE_CLASS = HISTORICAL_ISOLATED_DATA_DEFECT
AFFECTED_ROW_SCOPE = JE-1787090870905 / PO-1787090870807
LEDGER_PERSISTENCE_DIFFERENCE = YES
SUPPLIER_PAYABLE_IMPACT = AP_OVER_EXACT_PO_BY_0.00437618
INVENTORY_VALUE_IMPACT = JOURNAL_UNDER_ASSET_COST_BY_0.00177528
TAX_IMPACT = JOURNAL_UNDER_SNAPSHOT_VAT_BY_0.00384854
CASH_TREASURY_IMPACT = 0
BASELINE_EXCEPTION_RECOMMENDED = NO
REMEDIATION_IMPLEMENTED = NO
REMEDIATION_DESIGN = ONE_JOURNAL_ACCOUNTING_REMEDIATION_DESIGN_ONLY
PREVENTION_GATE = EXACT_STORED_LINE_BALANCE_BEFORE_POSTING
DB_WRITES_THIS_CONTROL = 0
JOURNAL_CHANGED = NO
PO_CHANGED = NO
ASSET_CHANGED = NO
CASH_CHANGED = NO
P0_COUNT = 0
P1_COUNT = 1
P2_COUNT = 0
GATE = PASS_ACCOUNTING_JE_1787090870905_FORENSIC_ROOT_CAUSE_IDENTIFIED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_AND_SEPARATE_AUTHORIZATION_FOR_CONTROLLED_ACCOUNTING_REMEDIATION
LOOSE_PEARL_OFFICIAL_RECEIVE_ALLOWED = NO_UNTIL_ACCOUNTING_BASELINE_RESOLVED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 32. STOP

`NO JOURNAL FIX`  
`NO ACCOUNTING CODE FIX`  
`NO DATA REMEDIATION`  
`NO BASELINE EXCEPTION`  
`NO LOOSE PEARL OFFICIAL RECEIVE`  
`NO STAGE B`  
`NO DEPLOYMENT`

توقف هذا الـControl بعد التقرير، بانتظار Owner review وتصريح صريح للـControl التالي.
