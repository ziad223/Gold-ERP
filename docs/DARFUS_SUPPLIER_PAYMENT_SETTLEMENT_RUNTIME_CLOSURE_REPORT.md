# DARFUS ERP — Supplier Payment Settlement Fix + Reversal + Controlled Runtime Acceptance

Control ID: `DARFUS-SUPPLIER-PAYMENT-SETTLEMENT-RUNTIME-CLOSURE`

## 1. Executive Summary

تم تنفيذ ومراجعة التغييرات المصدرية الخاصة بتسوية دفعات الموردين: دقة التسوية عند منزلتين عشريتين، اعتماد المبلغ المرحّل في AP، منع الدفع الزائد، وإضافة مسار عكس append-only مع idempotency. نجحت اختبارات المصدر وTypeScript.

لم يُنفّذ أي Payment أو Reversal أو أي Receive على قاعدة البيانات الرسمية. قاعدة `darfus_erp` بقيت دون كتابة. لذلك لم تكتمل أدلة Runtime/DB/Accounting المطلوبة، والبوابة النهائية هي:

`BLOCKED_SUPPLIER_PAYMENT_RUNTIME_AUTHORIZATION_REQUIRED`

الخطر على قاعدة البيانات الرسمية: لا توجد تغييرات جديدة في هذا الـBatch. الخطوة التالية تحتاج Owner approval صريحًا للتشغيل المالي المضبوط على الهدف المحدد، بعد استيفاء حواجز المشروع.

## 2. Owner Business Decision

| Decision | Applied authority |
|---|---|
| PURCHASE_TAX_PRECISION | KEEP_8DP |
| SUPPLIER_SETTLEMENT_PRECISION | 2DP_AED_ACCOUNTING_PRECISION |
| PAYABLE_SETTLEMENT_AUTHORITY | POSTED_AP_AMOUNT_AT_ACCOUNTING_PRECISION |
| PAYMENT_ALLOCATION_SCOPE | SINGLE_PO |
| MULTI_PO | NOT_REQUIRED |
| REVERSAL | REQUIRED |
| POSTED_PAYMENT_HARD_DELETE | FORBIDDEN |
| HISTORICAL_BAD_JOURNAL | PRESERVE; do not update/delete/backfill |

## 3. Preconditions

تم التحقق من أن الإصلاح لا يحتاج Migration: `cash_transactions.amount` موجود كـ `numeric(15,4)`، وهو قادر على تخزين قيم التسوية ذات المنزلتين. لم تُنشأ Migration ولم تُنفذ Seed أو Fixture على القاعدة الرسمية.

الهدف الرسمي الذي تمّت قراءته هو `darfus_erp`. لم يتم إنشاء Disposable Clone في هذا الـBatch، لأن التشغيل المتطلب للـRuntime لم يُسمح بتجاوزه إلى هدف آخر أو إلى الرسمي دون بوابة صلاحية مكتملة.

## 4. Known Blockers

| ID | Finding | State |
|---|---|---|
| SUPP-PAY-001 | التسوية القديمة تعتمد على تقريب/إجمالي غير مناسبين للحساب المرحّل | Source correction implemented; runtime unproven |
| SUPP-PAY-002 | مصدر payable كان يحتاج AP posted بدل raw PO total | Source correction implemented; runtime unproven |
| SUPP-PAY-003 | `JE-1787090870905` غير متوازن تاريخيًا | Preserved historical defect; no rewrite |
| SUPP-PAY-004 | لا يوجد مسار عكس آمن مكتمل | Source implementation added; runtime unproven |
| SUPP-PAY-005 | Runtime financial mutation evidence requires explicit authorization under current guardrails | Blocking gate |

## 5. Read-Only Forensic

المسار السابق كان `POST /purchase-orders/:id/pay` داخل `backend/src/routes/erp.routes.js`، وكان يستخدم حالة دفع مرتبطة بــ PO وCashTransaction. مصدر الحالة القديم موجود في `backend/src/services/supplier-payment-state.service.js`.

المسار الحالي يقرأ AP من posted purchase journal، من خلال `postedPayableByReference`, مع قبول الحساب المرتبط بدور `SUPPLIER_PAYABLE` أو الحساب الدلالي `SYS-AP`. ويستخدم `paidByReference` للدفع ناقصًا العكس. جميع المقارنات النهائية للتسوية تتم عند 2DP.

واجهة المورد القديمة تحتوي Pay modal، لكن لم تُستخدم لإثبات Runtime في هذا الـBatch. لم تُنفذ أي POST من المتصفح.

## 6. Settlement Precision Fix

أضيفت معالجة Decimal وhalf-up عند 2DP داخل `supplier-payment-state.service.js`. بقيت ضريبة الشراء وإجمالي PO الخام عند 8DP؛ لم تتغير معادلات الضريبة أو الشراء. مبلغ التسوية الحسابي هو AED 2DP فقط.

## 7. Canonical AP Authority

المبلغ القابل للتسوية الآن هو مجموع credit لخط SUPPLIER_PAYABLE في posted purchase journal، لا `purchase_orders.total` الخام. للـPO المرجعي:

| Value | Amount |
|---|---:|
| Raw PO total | 2132.96451278 |
| Posted AP amount | 2132.96 |
| Purchase journal | JE-1787094119309 |
| Journal debit | 2132.96 |
| Journal credit | 2132.96 |

## 8. Purchase History Preservation

لم يتم تعديل PO أو Purchase Cost Revision أو Receive أو Asset أو Barcode أو Inventory Movement. الدفع لا يغير تاريخ الشراء. عكس الدفع ينشئ سجلًا جديدًا ويربط JournalEntry الجديد بـ `reversalOf` للجورنال الأصلي.

## 9. Payment State

حالة PO تعرض `originalPayable`, `payableAmount`, `paid`, `paidAmount`, `remainingAmount`, `paymentStatus`, و`canPay`. المدفوع الفعلي = cash-out supplier payment ناقص cash-in supplier payment reversal، مع تقريب 2DP. الصفر الحقيقي فقط يُعتبر Fully Paid؛ لا يوجد tolerance يخلق micro-residual أو يمنع دفع 0.01.

## 10. Allocation Scope

النطاق Single-PO كما قرره Owner. لا توجد Multi-PO allocation في هذا الـBatch. كل Payment وReversal مربوطان بــ PO واحد وبــ Supplier واحد ضمن company/branch scope.

## 11. Payment Route / Accounts

مسار الدفع الحالي يحافظ على `treasury.update`، ويفرض Idempotency-Key، ويفحص company/branch، ويستخدم الحساب النقدي/البنكي المصرح به وSUPPLIER_PAYABLE mapping. لا توجد financial fallback أو hardcoded posting authority.

## 12. Reversal Design

أضيف `POST /purchase-orders/:poId/payments/:paymentId/reverse`:

- يتطلب `treasury.update` وIdempotency-Key وسببًا.
- يقفل PO والدفع الأصلي ويشترط أن يكون Posted.
- يمنع العكس المكرر عبر `reversalOf` وidempotency.
- ينشئ CashTransaction جديدًا من نوع `cash_in` وتصنيف `supplier_payment_reversal`.
- ينشر جورنالًا متوازنًا، ثم يربطه بـ `reversalOf`.
- لا يحذف أو يعدل Payment/Journ​al الأصلي.

## 13. Files Changed

التغييرات المقصودة في هذا الـBatch:

| File | Change |
|---|---|
| `backend/src/services/supplier-payment-state.service.js` | 2DP state, posted AP source, reversal-aware payment history |
| `backend/src/routes/erp.routes.js` | AP-authoritative payment checks, append-only reversal route, statement reconciliation |
| `lib/repositories/interfaces.ts` | reversal contract |
| `lib/repositories/api-impl.ts` | reversal API caller |
| `lib/repositories/local-impl.ts` | explicit unsupported local/mock reversal result |
| `app/[locale]/(dashboard)/suppliers/[id]/page.tsx` | reversal display/action and 2DP UI guards |
| `backend/scripts/verify-supplier-purchase-payment-state.js` | pure helper expected shape only; mutating verifier not run |
| `backend/tests/supplier-payment-settlement-final-closure.test.cjs` | focused static/source tests |
| `docs/DARFUS_SUPPLIER_PAYMENT_SETTLEMENT_RUNTIME_CLOSURE_REPORT.md` | this report |

لا توجد Migration أو تغييرات في DB schema أو Build artifacts مقصودة.

## 14. Runtime Authorization Gate

لم يُعتبر نص الموافقة العام في الطلب تجاوزًا لحواجز `AGENTS.md` الخاصة بالتشغيل المالي المستمر. لا يوجد في هذا الـBatch إثبات مستقل للهدف القابل للكتابة، ولا backup جديد، ولا rehearsal disposable مكتمل، ولا active-business-write check.

بالتالي تم إيقاف Runtime قبل أي mutation. لم تُشغل scripts التحقق التي تنشئ أو تحذف fixtures.

## 15. Runtime Candidate

المرشح المقروء فقط:

| Field | Value |
|---|---|
| Supplier | SUP-001 |
| PO | PO-1787094119240 |
| Raw PO total | 2132.96451278 |
| Posted AP | 2132.96 |
| Current outstanding | 2132.96 |
| Purchase journal | JE-1787094119309 |

لم يتم استخدامه في Payment أو Reversal.

## 16. Baseline Snapshot

تم أخذ snapshot قراءة فقط من `darfus_erp`:

| Entity | Count |
|---|---:|
| SequelizeMeta | 86 |
| Suppliers | 2 |
| Purchase Orders | 6 |
| Assets | 6 |
| Asset Barcode History | 6 |
| Inventory Asset Movements | 6 |
| Asset Purchase Cost Revisions | 6 |
| Cash Transactions | 0 |
| Journal Entries | 6 |
| Journal Lines | 18 |
| Idempotency Requests | 6 |
| Audit Logs | 49 |

## 17. Partial Payment

`BLOCKED_NOT_RUN_OFFICIAL_PERSISTENT_MUTATION_AUTHORIZATION_REQUIRED`.

لم ينفذ Payment جزئي. لذلك لا يوجد runtime proof لــ 2DP allocation أو remaining balance.

## 18. Replay / Conflict

التصميم يحافظ على scope `purchase.payment` وIdempotency-Key، ويعيد نفس النتيجة للـ replay ويمنع conflicting replay وفق framework الحالي. لم يُنفذ أي replay فعلي.

## 19. Overpayment

المسار المصدر يرفض amount أكبر من remaining عند 2DP، ويرفض المبلغ السالب/غير الصالح وفق validation الحالي. Runtime proof غير منفذ.

## 20. Full Settlement

`BLOCKED_NOT_RUN_OFFICIAL_PERSISTENT_MUTATION_AUTHORIZATION_REQUIRED`.

لم يتم تنفيذ Full Payment على الـPO المرجعي.

## 21. No-Micro-Residual Proof

Source proof موجود: المقارنة تعتمد `remainingAmount` بعد round2 ولا تستخدم `<= 0.01` كـFully Paid. Runtime proof لم يُنفذ.

## 22. Reversal

تمت إضافة المسار append-only والتحقق من الأصل والـAP والـbranch والـaccount mapping. لم يُنفذ Reversal فعلي.

## 23. Reversal Replay

التصميم يحتوي scope مستقل `purchase.payment.reversal` ويفرض منع reversal الثاني لنفس Payment. لم يُنفذ replay فعلي أو conflict فعلي.

## 24. Supplier Balance / Statement

Statement source الحالي يعرض posted AP كـcredit، الدفع الأصلي كـdebit، والعكس كـcredit، مع rolling balance عند 2DP. القراءة السابقة لصفحة المورد حملت البيانات دون console errors مرصودة. لا يوجد payment row حقيقي في baseline، لذلك لا توجد UI reversal runtime acceptance.

## 25. AP Reconciliation

الـPO المرجعي متوازن:

`JE-1787094119309: debit 2132.96000000 = credit 2132.96000000`

خط SUPPLIER_PAYABLE المرصود = `2132.96`. لم يتم إجراء reconciliation بعد Payment أو Reversal لأنهما لم يُنفذا.

## 26. Purchase/Inventory Isolation

لم تتغير أعداد PO/Asset/Barcode/Movement/Cost Revision. التصميم لا ينشئ Receive جديدًا، ولا يغير Product quantity أو Gold/POS/Inventory authority. أي runtime acceptance لاحق يجب أن يثبت هذه العدادات قبل وبعد.

## 27. AR / EN Browser

تمت قراءة صفحة المورد السابقة بالعربية والإنجليزية، وعُرضت قائمة POs وStatement. لا توجد mutation browser actions في هذا الـBatch. لا يمكن اعتماد Pay/Reversal browser acceptance دون وجود Payment runtime حقيقي؛ الحالة `READ_ONLY_RUNTIME_PAYMENT_NOT_RUN`.

## 28. API / Network / Console

`GET http://localhost:8000/api/v1/health` أعاد HTTP 200 وحالة `UP`. لم تُرسل POST Payment أو Reversal. في جلسة القراءة المرصودة، console errors = 0. لا تُعتبر health-only evidence بديلًا عن runtime financial proof.

## 29. Audit / Idempotency

المصدر يكتب audit وidempotency داخل transaction قبل commit، ويحافظ على duplicate/conflict semantics. لم تُنشأ مفاتيح payment أو reversal جديدة؛ count delta = 0. لا توجد سجلات audit جديدة لهذا الـBatch.

## 30. Integrity Queries

| Assertion | Result |
|---|---|
| Official DB current_database | `darfus_erp` |
| Official DB writes | 0 |
| PO delta | 0 |
| Asset delta | 0 |
| Barcode history delta | 0 |
| Movement delta | 0 |
| Cost revision delta | 0 |
| Cash transaction delta | 0 |
| Payment/reversal journal delta | 0 |
| Payment/reversal idempotency delta | 0 |
| Payment/reversal audit delta | 0 |
| Historical bad journal | preserved |

## 31. Focused Tests

| Test | Result |
|---|---|
| `backend/tests/supplier-payment-settlement-final-closure.test.cjs` | 6/6 PASS |
| `backend/tests/supplier-all-asset-profiles-acquisition-payable-pricing-fix-01.test.cjs` | 4/4 PASS |
| `tests/supplier-master-final-closure.test.cjs` | 6/6 PASS |
| `tests/asset-final-closure.test.cjs` | PASS (prior verified suite) |
| `tests/barcode-final-closure.test.cjs` | PASS (prior verified suite) |
| `tests/rfid-final-closure.test.cjs` | PASS (prior verified suite) |
| `tests/unified-inventory-intake-ux-02-r3.test.cjs` | 5/5 PASS |
| `backend/tests/g3-financial-reconciliation-correction.test.cjs` | PASS (prior verified suite) |
| `backend/tests/g3-po-tax-precision-schema.test.cjs` | PASS (prior verified suite) |
| `backend/tests/gold-by-piece-rate-calculation-03-r2.test.cjs` | PASS (prior verified suite) |
| `backend/tests/phase-03b-g2a2-transaction-tax.test.cjs` | PASS (prior verified suite) |
| `backend/tests/phase-03b-g2b-location-management.test.cjs` | PASS (prior verified suite) |
| `npm run typecheck` | PASS |
| Mutating verifier scripts | NOT RUN |

## 32. Historical Defect Boundary

`JE-1787090870905` remains `HISTORICAL_PREEXISTING_DEFECT`:

`debit 2133.21 != credit 2133.22`

لم يتم إصلاحه أو حذفه أو backfill له، ولم يُستخدم كمرشح للتسوية. لا يُنسب هذا العيب إلى تغييرات هذا الـBatch.

## 33. Gate

### Result

`BLOCKED_SUPPLIER_PAYMENT_RUNTIME_AUTHORIZATION_REQUIRED`

لم تتحقق شروط PASS لأن runtime controlled payment/reversal، journal replay، supplier balance بعد التسوية، وDB assertions بعد mutation لم تُثبت. لا يوجد P0/P1 regression مُثبت بسبب التغييرات المصدرية، لكن الإغلاق النهائي غير مسموح دون Runtime proof.

## 34. Final Tokens

```text
CURRENT_CONTROL = DARFUS-SUPPLIER-PAYMENT-SETTLEMENT-RUNTIME-CLOSURE
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 86
PURCHASE_TAX_PRECISION = 8DP_PRESERVED
SUPPLIER_SETTLEMENT_PRECISION = 2DP_AED
CANONICAL_PAYABLE_SETTLEMENT_AMOUNT = POSTED_PURCHASE_JOURNAL_SUPPLIER_PAYABLE_CREDIT
PAYMENT_ALLOCATION_SCOPE = SINGLE_PO
MULTI_PO_ALLOCATION = NOT_REQUIRED_CURRENT_SCOPE
SUPPLIER_SETTLEMENT_PRECISION_AUTHORITY = PASS_STATIC_RUNTIME_BLOCKED
PURCHASE_TAX_8DP_PRESERVED = PASS_STATIC_RUNTIME_NOT_RUN
PURCHASE_HISTORY_IMMUTABLE_AFTER_PAYMENT = PASS_STATIC_RUNTIME_NOT_RUN
PAYMENT_ACCOUNT_AUTHORITY = PASS_STATIC_RUNTIME_NOT_RUN
PARTIAL_PAYMENT = BLOCKED
FULL_PAYMENT = BLOCKED
NO_MICRO_RESIDUAL_AFTER_FULL_SETTLEMENT = BLOCKED
OVERPAYMENT_SAFETY = PASS_STATIC_RUNTIME_NOT_RUN
ZERO_NEGATIVE_PAYMENT_SAFETY = PASS_STATIC_RUNTIME_NOT_RUN
PAYMENT_JOURNAL_BALANCE = PASS_STATIC_RUNTIME_NOT_RUN
SUPPLIER_BALANCE_RUNTIME = BLOCKED
SUPPLIER_STATEMENT = PASS_CURRENT_SCOPE_STATIC_RUNTIME_NOT_RUN
PAYMENT_IDEMPOTENCY_REPLAY = PASS_STATIC_RUNTIME_NOT_RUN
PAYMENT_IDEMPOTENCY_CONFLICT = PASS_STATIC_RUNTIME_NOT_RUN
PAYMENT_CONCURRENCY_SAFETY = PASS_STATIC_RUNTIME_NOT_RUN
PAYMENT_REVERSAL_IMPLEMENTATION = IMPLEMENTED_STATICALLY
PAYMENT_REVERSAL_RUNTIME = BLOCKED
PAYMENT_REVERSAL_JOURNAL = PASS_STATIC_RUNTIME_NOT_RUN
PAYMENT_REVERSAL_REOPENS_OUTSTANDING = PASS_STATIC_RUNTIME_NOT_RUN
PAYMENT_REVERSAL_IDEMPOTENCY = PASS_STATIC_RUNTIME_NOT_RUN
POSTED_PAYMENT_HARD_DELETE = BLOCKED
PAYMENT_TEST_SUPPLIER_ID = SUP-001
PAYMENT_TEST_PO_ID = PO-1787094119240
PAYMENT_TEST_POSTED_AP_AMOUNT = 2132.96
PAYMENT_TEST_CURRENT_OUTSTANDING = 2132.96
COMPANY_SCOPE = PASS_STATIC_RUNTIME_NOT_RUN
BRANCH_SCOPE = PASS_STATIC_RUNTIME_NOT_RUN
PERMISSIONS = PASS_STATIC_RUNTIME_NOT_RUN
AUDIT = PASS_STATIC_RUNTIME_NOT_RUN
AR_UI = PASS_READ_ONLY_RUNTIME_PAYMENT_NOT_RUN
EN_UI = PASS_READ_ONLY_RUNTIME_PAYMENT_NOT_RUN
NETWORK = PASS_HEALTH_NO_MUTATION
CONSOLE = 0_OBSERVED_READ_ONLY
FOCUSED_TESTS = PASS_STATIC
TYPECHECK = PASS
PO_COUNT_DELTA = 0
ASSET_COUNT_DELTA = 0
BARCODE_HISTORY_DELTA = 0
RFID_DELTA = 0
INVENTORY_MOVEMENT_DELTA = 0
PURCHASE_COST_REVISION_DELTA = 0
HISTORICAL_UNBALANCED_JOURNAL = JE-1787090870905
HISTORICAL_UNBALANCED_JOURNAL_ACTION = PRESERVED_NO_REWRITE
MIGRATION_CREATED = NO
ONLINE_PRODUCTION_CONTACTED = NO
GATE = BLOCKED_SUPPLIER_PAYMENT_RUNTIME_AUTHORIZATION_REQUIRED
SUPPLIER_ACCOUNTS_FINAL_CLOSED = NO
NEXT_RECOMMENDED_STEP = OWNER_APPROVAL_FOR_CONTROLLED_PAYMENT_AND_REVERSAL_RUNTIME_ON_EXACT_TARGET
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP.
