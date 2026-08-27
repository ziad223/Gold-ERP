# DARFUS ERP — Gift Voucher Official Runtime Business Acceptance Retry 01

## الملخص التنفيذي

ما تم: تم إثبات parity والهوية والصحة، إنشاء Backup صالح، التقاط baseline،
إعادة فحص الـAsset والتسعير الحالي، ثم تنفيذ محاولة Issue واحدة فقط.

القيمة الحالية من السيرفر: Base `AED 2,838.44`، VAT `AED 397.38`، Total
`AED 3,235.82`.

قيمة Voucher المستخدمة: `AED 3,235.82`، وهي القيمة الحالية المؤكدة تلقائيًا.

هل تم إصدار Voucher واحد؟ لا؛ الطلب الوحيد أعاد HTTP 422 قبل الاستمرارية.
هل تم Activation؟ لا. هل تم Checkout واحد؟ لا. هل Full Redemption نجح؟ لا؛ لم
يكن هناك Voucher. هل Issue Idempotency نجح؟ لم يُشغّل. هل Checkout Idempotency
نجح؟ لم يُشغّل. هل المحاسبة متوازنة؟ لا توجد معاملة جديدة للموازنة. هل
Voucher issuance Revenue/VAT = 0؟ نعم، لا توجد صفوف جديدة. هل Sale VAT صحيح؟
غير منطبق؛ لم يحدث Sale. هل Treasury صحيح؟ لم تُنشأ حركة جديدة. هل Asset
أصبح SOLD مرة واحدة؟ لا، بقي AVAILABLE. هل movement/event صحيح؟ لا توجد صفوف
جديدة. هل يوجد Delta غير مفسر؟ لا.

الخطأ الجديد: `FINANCIAL_MAPPING_REQUIRED`، HTTP 422، Request ID
`ded2e4a2-4e74-4abf-a3fa-dc59d5becc50`. السبب المثبت هو غياب/غموض الـsemantic
financial mapping عند `financial-account-resolver.service.js` قبل الاستمرارية.

ما تم تسجيله: preflight، backup، asset/pricing، auto-confirmation، issue
failure، redemption stop، browser/network، accounting/tax/treasury، inventory,
DB delta، والسجلات الستة.

Gate: فشل قبل Business Persistence؛ لا يجوز اعتبار هذا PASS.

الخطوة التالية فقط: Owner review لقرار/إصلاح الـfinancial mapping ثم Control
مسمى جديد؛ لا Retry تلقائي.

## 1. Scope and safety

- Official DB: `darfus_erp`; no restore, cleanup, deletion, direct SQL write,
  migration, seed, schema/config change, or production contact.
- One authorized action occurred: one `POST /api/v1/gift-vouchers/issue`.
- No second issue, activation, checkout, payment, print, or idempotency replay.
- Existing historical journal exception and Pearl issue were not changed.

## 2. Runtime parity and preflight

Health endpoints returned 200. Backend started at `2026-08-27T11:46:27.857708103Z`.
The backend bind mount is the project `backend` directory and host/container
`erp.routes.js` SHA-256 matched. Authenticated Gift Voucher list access was
observed. `OFFICIAL_RUNTIME_ACCEPTANCE_PARITY_GATE = PASS`.

## 3. Backup and baseline

Backup: `backend/backups/darfus_erp_gift_voucher_official_retry_01_pre_20260827T140803Z.dump`;
836130 bytes; SHA-256
`654B48E033EE3209F3CA34DE3104EA85AF8B9A307EDAC4F88C0AA328CC9F4B14`;
`pg_dump=0`; `pg_restore --list=0`.

Baseline and after counts are in the DB delta artifact. The actual schema table
is `gift_voucher_branch_eligibilities` (plural), count 0.

## 4. Asset and current pricing

The accepted Asset was found in Branch-1 after the authenticated UI context was
selected to match its authoritative branch. DB state was `AVAILABLE`, with the
specified barcode and profile. Two immediate read-side pricing calculations
returned Base 2838.44, VAT 397.38 at the current 14% setting, and Total
3235.82 AED. The old historical 3235.53 value was not reused.

## 5. Issue attempt and root cause

The official form sent one Issue request with face value 3235.82 and Cash. The
server returned HTTP 422, code `FINANCIAL_MAPPING_REQUIRED`, before creating a
Voucher, treasury receipt, liability journal, or idempotency result. Backend
stack evidence points to `financial-account-resolver.service.js` called by
`gift-voucher.service.js:issuePurchasedVoucher`.

Classification: `MISSING_MASTER_DATA / ENVIRONMENT_CONFIG` until the owner
decides whether the required semantic mapping is configuration/master-data
provisioning or a product defect. No assumption or fix was made.

## 6. Downstream proofs

Activation, pre-redemption state, full redemption, payment, treasury,
accounting, sale VAT, inventory SOLD transition, audit lifecycle, and issue /
checkout idempotency replays were not run because the control requires immediate
stop after the 422. The Asset remained unchanged and all official count deltas
were zero.

## 7. Browser and network

Internal browser proof captured authenticated AR/EN-capable local runtime,
Branch-1 context, Asset search, pricing, and the single issue response. The
clean browser log had zero console errors. No credentials or tokens were
recorded. No activation or checkout request was sent.

## 8. Files and registers

The required retry artifacts were created/updated. All six Gift Voucher
registers were updated without deleting historical failed-attempt evidence.
The worktree was already dirty; no reset, restore, clean, stash, or unrelated
drift cleanup was performed. No product source or test file was changed in this
retry control.

## 9. Final tokens

```text
CURRENT_CONTROL = DARFUS-GIFT-VOUCHER-OFFICIAL-RUNTIME-BUSINESS-ACCEPTANCE-RETRY-01
MODE = OWNER_AUTHORIZED_AUTO_CONFIRM_CURRENT_SERVER_VALUE_AND_COMPLETE_ACCEPTANCE
AUTO_CONFIRM_CURRENT_SERVER_TOTAL = YES
HISTORICAL_FIXED_VALUE_AUTHORITY = NO
READ_FIRST = YES
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_IDENTITY_PROVEN = YES
OFFICIAL_RUNTIME_ACCEPTANCE_PARITY_GATE = PASS
AUTHENTICATED_GIFT_VOUCHER_LIST = PASS
PRE_RETRY_BACKUP = PASS
BACKUP_READABILITY = PASS
OFFICIAL_RETRY_BASELINE = CAPTURED
ACCEPTANCE_ASSET_STILL_SAFE = YES
SALE_PRICING_AUTHORITY = PASS
SERVER_SALE_PREVIEW = PASS
CURRENT_SERVER_BASE = 2838.44
CURRENT_SERVER_VAT = 397.38
CURRENT_SERVER_FINAL_TOTAL = 3235.82
AUTO_CONFIRMED_VOUCHER_FACE_VALUE = 3235.82
OWNER_CONFIRM_CURRENT_FINANCIAL_WRITE = AUTO_CONFIRMED_BY_OWNER_IN_THIS_CONTROL
CONFIRMED_TOTAL_STILL_CURRENT = YES
OFFICIAL_PURCHASED_VOUCHER_ISSUE = FAIL_BEFORE_PERSISTENCE_HTTP_422
OFFICIAL_ISSUE_IDEMPOTENCY = NOT_RUN
OFFICIAL_VOUCHER_ACTIVATION = NOT_RUN
PRE_REDEMPTION_VOUCHER_STATE = NOT_RUN
OFFICIAL_FULL_REDEMPTION_CHECKOUT = NOT_RUN
OFFICIAL_CHECKOUT_IDEMPOTENCY = NOT_RUN
REAL_BROWSER_BUSINESS_FLOW = FAIL_AT_ISSUE
NETWORK_BUSINESS_FLOW = PARTIAL_ISSUE_422
CONSOLE_APPLICATION_ERRORS = 0
OFFICIAL_VOUCHER_LIFECYCLE = NOT_APPLICABLE_NO_ISSUE
OFFICIAL_GV_PAYMENT = NOT_RUN
OFFICIAL_TREASURY_PROOF = NOT_RUN
OFFICIAL_ISSUE_JOURNAL_BALANCED = NOT_APPLICABLE_NO_ISSUE
OFFICIAL_SALE_JOURNAL_BALANCED = NOT_RUN
OFFICIAL_GV_DIRECT_REVENUE = 0_NEW_ROWS
OFFICIAL_GV_ISSUE_OUTPUT_VAT = 0_NEW_ROWS
OFFICIAL_TAX_AUTHORITY = NO_NEW_TRANSACTION
OFFICIAL_DOUBLE_VAT = NO_NEW_TRANSACTION
OFFICIAL_INVENTORY_PROOF = NO_MUTATION_ASSET_REMAINED_AVAILABLE
OFFICIAL_AUDIT_PROOF = NO_NEW_BUSINESS_AUDIT_ROW
ALL_OFFICIAL_DELTAS_CLASSIFIED = YES
UNEXPLAINED_OFFICIAL_BUSINESS_DELTA = 0
UNEXPLAINED_OFFICIAL_FINANCIAL_DELTA = 0
UNEXPLAINED_OFFICIAL_INVENTORY_DELTA = 0
OFFICIAL_PRINT_REPRINT_MUTATION = NOT_RUN
OFFICIAL_CONCURRENCY_RETEST = NOT_REQUIRED_UPSTREAM_PROVEN
OFFICIAL_MIXED_PAYMENT_RETEST = NOT_REQUIRED_UPSTREAM_PROVEN
OFFICIAL_MULTIPLE_VOUCHER_RETEST = NOT_REQUIRED_UPSTREAM_PROVEN
PRE_EXISTING_JE_EXCEPTION_CHANGED_BY_CONTROL = NO
PEARL_ISSUE_CHANGED_BY_CONTROL = NO
SUCCESS_REGISTER_UPDATED = YES
ERROR_REGISTER_UPDATED = YES
ISSUE_BLOCKER_REGISTER_UPDATED = YES
ROOT_CAUSE_PREVENTION_REGISTER_UPDATED = YES
OWNER_DECISION_REGISTER_UPDATED = YES
CLOSED_EVIDENCE_REGISTER_UPDATED = YES
CURRENT_CONTROL_P0 = 0
CURRENT_CONTROL_P1 = 1_FINANCIAL_MAPPING_BLOCKER
P2 = 0_NEW
P3 = 0_NEW
GIFT_VOUCHER_OFFICIAL_RUNTIME_BUSINESS_ACCEPTANCE = FAIL_BEFORE_BUSINESS_PERSISTENCE
GATE = FAIL_GIFT_VOUCHER_OFFICIAL_RUNTIME_BUSINESS_ACCEPTANCE_FINANCIAL_MAPPING_BLOCKED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_FINANCIAL_MAPPING_BLOCKER; NO_AUTOMATIC_RETRY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## STOP

توقف التنفيذ بعد محاولة الإصدار الوحيدة. لا Voucher آخر، لا Activation، لا
Checkout، لا Replay، لا Print، لا Cleanup، ولا إصلاح تلقائي.

