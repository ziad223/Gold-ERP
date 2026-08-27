# DARFUS ERP — POS Making Charge Runtime Closeout 01 Report

بالعربي: تم تحديث backend وإثبات الصيغة فعليًا على disposable clone بنجاح: `19g × 50 = 950`، وحالة الحجر استخدمت `4g` الصافي، مع VAT مرة واحدة، Payment، Journal متوازن، Inventory، Barcode، وIdempotency. لم تتغير `darfus_erp`. الإغلاق النهائي محجوب فقط بسبب frontend stale وعدم توفر Browser evidence حقيقي، مع بقاء القيد المالي التاريخي منفصلًا.

## 1. Executive result

```text
SOURCE_CORRECTION_PRESENT = YES
FAST_RUNTIME_PREFLIGHT = PASS
AUTO_STARTUP_MIGRATION_TO_MAIN = NO
BACKEND_RUNTIME_PARITY = PASS
FRONTEND_RUNTIME_PARITY = BLOCKED_STALE_NEXT_BUILD
MAIN_RUNTIME_CHECK = BLOCKED_FRONTEND_PARITY
MAIN_DB_BASELINE = PASS_READ_ONLY
DISPOSABLE_CLONE_CREATED = YES (created, proven, then dropped)
DISPOSABLE_DB_IDENTITY_PROVEN = YES
SERVER_PRICING_PREVIEW = PASS
TOTAL_MAKING_950 = PASS
STONE_NET_WEIGHT_PROOF = PASS
FORGED_WEIGHT_AUTHORITY = IGNORED_BY_SERVER
FORGED_TOTAL_MAKING_AUTHORITY = IGNORED_BY_SERVER
SERVER_FINAL_AUTHORITY = PASS_RUNTIME
CLONE_CHECKOUT = PASS
CLONE_TOTAL_MAKING = 950
CLONE_VAT_ONCE = PASS
CLONE_JOURNAL_BALANCED = PASS
CLONE_PAYMENT_INTEGRITY = PASS
CLONE_INVENTORY_INTEGRITY = PASS
CLONE_WEIGHT_MUTATION = 0
CLONE_IDEMPOTENCY = PASS
```

## 2. Formula and source correction

Frozen rule:

```text
GOLD_BY_WEIGHT_JEWELLERY
eligible weight = Asset netGoldWeight
line making = eligible weight × validated AED/g rate
invoice making = sum(line making)
```

The canonical server authority was already net-based. The controlled source correction retained that authority and corrected only:

- POS display quote: GBW making now uses net eligible weight.
- `/pricing/calculate`: dynamic GBW making is reported instead of being hidden, while the tax base does not add it twice.
- Mock fallback: same GBW net basis.

No Gold Center, Tax Engine, accounting, inventory, CGP, barcode, pricing-policy, manager-approval, or Gift Voucher logic was rewritten.

## 3. Runtime refresh

Backend was rebuilt/recreated with the normal Docker command. Health, DB, and Redis all returned HTTP 200, and startup logs proved no automatic migration or runtime bootstrap. Details are in `DARFUS_POS_MAKING_CHARGE_RUNTIME_REFRESH_PROOF.md`.

The frontend build is stale: `.next/BUILD_ID` is from `09:05`, corrected source is from `19:19`, and the existing `next start` response does not contain the correction. Build was not run under current guidance; no Next dev or second frontend was started.

## 4. Disposable clone acceptance

Clone: `darfus_pos_making_charge_runtime_01`, created from a read-copy of `darfus_erp`, identity verified before mutation, then dropped after proof. The one restore compatibility issue (`transaction_timeout`) was handled in the dump copy only; no product/schema change was made.

Fixtures:

| Fixture | Gross | Stone | Net | Making |
|---|---:|---:|---:|---:|
| `GWRNG21000003` | 5 | 0 | 5 | 250 |
| `GWRNG21000004` | 5 | 1 | 4 | 200 |
| `GWRNG21000005` | 10 | 0 | 10 | 500 |

Total = `950 AED`.

## 5. Real clone checkout

One checkout only:

```text
POST /api/v1/pos/checkout = 201
invoice = INV-ID-1787762617594-l7dcc7 / INV-2026-000004
making = 950.00000000
VAT = 1396.19060000 at 14.000%
total = 11368.98040000
```

The persisted item making values were `250`, `200`, and `500`. The 5g gross/4g net stone case persisted `200`, proving no gross-weight making error.

Financial/inventory outcomes:

- one Payment and one linked cash transaction;
- one posted Journal with debit=`13268.98`, credit=`13268.98`;
- three sold Assets with unchanged weights;
- three unique active initial barcodes;
- three sale movements and three asset events;
- one successful idempotency row.

Exact replay with the same body/key returned the same invoice without duplicates. Changed payload with the same key returned `409`.

## 6. Focused test recheck after refresh

```text
node --test backend/tests/pos-making-charge-formula-closure-01.test.cjs       = 19/19 PASS
node --test backend/tests/gold-by-weight-profile-02.test.cjs                 = 7/7 PASS
node --test backend/tests/gold-by-weight-financial-formula-01b.test.cjs       = 6/6 PASS
node --test backend/tests/phase-03b-g2a2-transaction-tax.test.cjs             = 10/10 PASS
node --test backend/tests/diamond-corrective-tax-valuation-idempotency.test.cjs = 5/5 PASS
node --test backend/tests/gold-live-feed-03-pricing-policy.test.cjs           = 6/6 PASS
node --test tests/pos-journal-preview-p2.test.cjs                              = 3/3 PASS
node --test tests/stage-c-pos-financial-integration.test.cjs                  = 3/3 PASS
npm run typecheck                                                             = PASS
TOTAL                                                                         = 59/59 PASS
```

No build was run.

## 7. Browser/network gate

AR/EN HTTP GETs returned 200, but this is not browser acceptance. Real browser control previously failed its kernel asset setup (`BROWSER_CONTROL_ENVIRONMENT_001`), and the main frontend build is stale. The main frontend targets the official backend, so it was not used for clone mutation proof. Therefore:

```text
AR_BROWSER = BLOCKED_BROWSER_EVIDENCE
AR_NETWORK = BLOCKED_BROWSER_EVIDENCE
AR_CONSOLE_BLOCKERS = BLOCKED_NOT_OBSERVED
EN_BROWSER = BLOCKED_BROWSER_EVIDENCE
EN_NETWORK = BLOCKED_BROWSER_EVIDENCE
EN_CONSOLE_BLOCKERS = BLOCKED_NOT_OBSERVED
```

## 8. Official DB after proof

Official identity remained `darfus_erp`. All protected counts remained unchanged; official business, financial, and inventory deltas are zero. The pre-existing `JE-1787090870905` 0.01 imbalance remains unchanged and is not attributed to this POS correction.

## 9. Risk / issue register

| ID | Severity | Classification | Status |
|---|---|---|---|
| `BROWSER_CONTROL_ENVIRONMENT_001` | P2 | Environment/tooling | Blocks AR/EN visual/network acceptance |
| `POS-FRONTEND-NEXT-BUILD-STALE` | P2 | Runtime/configuration evidence | Requires separately permitted frontend refresh/build |
| `PURCHASE-ORDER-UNBALANCED-JOURNAL-001` | Separate P1 baseline issue | Pre-existing financial integrity | Untouched; requires its own control |

```text
CURRENT_CONTROL_P0 = 0
CURRENT_CONTROL_P1 = 0
P2 = 2
P3 = 0
```

The pre-existing journal is explicitly excluded from `CURRENT_CONTROL_P1` because this control neither created nor changed it.

## 10. Gate

The source, backend, clone, formula, financial, inventory, and idempotency gates pass. The required final gate cannot pass while frontend parity and real AR/EN browser/network evidence remain absent.

```text
POS_MAKING_CHARGE_FORMULA = RUNTIME_PROVEN_ON_DISPOSABLE_CLONE
GATE = BLOCKED_BROWSER_EVIDENCE_AND_FRONTEND_PARITY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 11. Final required tokens

```text
CURRENT_CONTROL = DARFUS-POS-MAKING-CHARGE-RUNTIME-CLOSEOUT-01
SOURCE_CORRECTION_PRESENT = YES
FAST_RUNTIME_PREFLIGHT = PASS
AUTO_STARTUP_MIGRATION_TO_MAIN = NO
BACKEND_RUNTIME_PARITY = PASS
FRONTEND_RUNTIME_PARITY = BLOCKED_STALE_NEXT_BUILD
MAIN_RUNTIME_CHECK = BLOCKED_FRONTEND_PARITY
MAIN_DB_BASELINE = PASS_READ_ONLY
DISPOSABLE_CLONE_CREATED = YES
DISPOSABLE_DB_IDENTITY_PROVEN = YES
SYNTHETIC_FIXTURES = CLONE_ONLY
SERVER_PRICING_PREVIEW = PASS
TOTAL_MAKING_950 = PASS
STONE_NET_WEIGHT_PROOF = PASS
FORGED_WEIGHT_AUTHORITY = IGNORED_BY_SERVER
FORGED_TOTAL_MAKING_AUTHORITY = IGNORED_BY_SERVER
SERVER_FINAL_AUTHORITY = PASS_RUNTIME
CLONE_CHECKOUT = PASS
CLONE_TOTAL_MAKING = 950
CLONE_VAT_ONCE = PASS
CLONE_JOURNAL_BALANCED = PASS
CLONE_PAYMENT_INTEGRITY = PASS
CLONE_INVENTORY_INTEGRITY = PASS
CLONE_WEIGHT_MUTATION = 0
CLONE_IDEMPOTENCY = PASS
AR_BROWSER = BLOCKED_BROWSER_EVIDENCE
AR_NETWORK = BLOCKED_BROWSER_EVIDENCE
AR_CONSOLE_BLOCKERS = BLOCKED_NOT_OBSERVED
EN_BROWSER = BLOCKED_BROWSER_EVIDENCE
EN_NETWORK = BLOCKED_BROWSER_EVIDENCE
EN_CONSOLE_BLOCKERS = BLOCKED_NOT_OBSERVED
FOCUSED_TESTS = PASS (19/19)
AFFECTED_REGRESSION = PASS (40/40)
TYPECHECK = PASS
OFFICIAL_DB = darfus_erp
OFFICIAL_BUSINESS_WRITES_BY_CONTROL = 0
OFFICIAL_FINANCIAL_DELTA_BY_CONTROL = 0
OFFICIAL_INVENTORY_DELTA_BY_CONTROL = 0
PRE_EXISTING_ACCOUNTING_EXCEPTION = YES
PRE_EXISTING_JE_EXCEPTION_CHANGED_BY_CONTROL = NO
CURRENT_CONTROL_P0 = 0
CURRENT_CONTROL_P1 = 0
P2 = 2
P3 = 0
POS_MAKING_CHARGE_FORMULA = RUNTIME_PROVEN_ON_DISPOSABLE_CLONE
GATE = BLOCKED_BROWSER_EVIDENCE_AND_FRONTEND_PARITY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 12. Stop

STOP. No Gift Voucher work, no official Checkout, no official fixture data, no migration, no repair of `JE-1787090870905`, no CRM, and no automatic next batch.

