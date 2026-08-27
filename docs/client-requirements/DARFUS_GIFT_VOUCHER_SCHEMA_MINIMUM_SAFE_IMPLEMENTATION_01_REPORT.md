# تقرير تنفيذ القسائم — ما تم، ما نجح، ما فشل، وخطوة المراجعة التالية

تم تنفيذ أساس Purchased Gift Voucher فقط. نجحت اختبارات العقد والمالية والواجهتين على Clone معزول. الفشل الوحيد المتبقي خارج نطاق القسائم هو Pearl pricing master data، ولم يتم إصلاحه أو تجاوزه كمنطق أعمال. قاعدة `darfus_erp` بقيت بلا كتابة: 0. الخطوة التالية هي Owner Review فقط.

## 1. Scope and safety

Included: schema boundary, purchased issuance, activation, full-only redemption adapter, branch eligibility, payment linkage, print/reprint events, idempotency, focused tests, clone runtime proof, isolated AR/EN UI.

Excluded: non-purchased vouchers, partial balance, generic payment/tax redesign, invoice projection redesign, master-data provisioning, official migration/data, production deployment.

## 2. Schema

Migration `20260827010000-gift-voucher-purchased-foundation.js` adds the minimum purchased lifecycle contract, semantic branch eligibility, one-to-one voucher Payment linkage, immutable print events, identity protection, and fail-closed legacy data handling. Apply/down/re-apply passed on the disposable clone only.

## 3. Implementation

The server generates code/number, validates company currency and customer scope, resolves treasury and `GIFT_VOUCHER_LIABILITY` semantically, and posts issue liability without revenue/VAT. POS validates and locks active vouchers before Invoice creation, requires exact full face value, preserves canonical tax/accounting, links Payment, transitions Asset, and redeems atomically.

The first clone run proved a shared POS pricing-registry mismatch and an exact four-decimal journal rounding defect. Both were corrected minimally and rerun. A later print test proved the aggregate-row-lock defect; it was corrected by retaining the Voucher-row lock and removing only the invalid `COUNT ... FOR UPDATE`.

## 4. Runtime scenarios

PASS: issue/replay, activation, lookup, full redemption, mixed cash, multiple vouchers, exact idempotent sale replay, same-key changed-payload conflict, branch ineligibility, inactive voucher, second redemption, concurrency exactly-one-success, print/reprint.

The clone has 13 cumulative vouchers (7 redeemed, 4 active, 2 issued), 12 payments, 9 invoices, 48 journals, and 2 print events. These are cumulative clone evidence, not a clean baseline. Canonical asset evidence: 7 voucher-linked invoice assets are sold, linked, and have sale movement/event rows. All voucher-payment links are exact.

## 5. Tests and checks

- Gift Voucher contract + foundation tests: 35 passed.
- Impacted POS/financial regression tests: 36 passed.
- `npm run typecheck`: passed.
- Node syntax checks for changed backend/script files: passed.
- Official DB before/after: unchanged.
- Browser AR/EN on isolated `:3001`: passed; no Console errors; GET-only business inspection.

## 6. Known issues

`GOLD_SALE_PRICING_MARKUP_PERCENT_INVALID` remains for an existing Pearl asset whose profile master data lacks valid `markupPercent`. It is a separate Pearl configuration/master-data issue, not a Gift Voucher defect; no Pearl data or logic was changed.

## 7. Gate

`GIFT_VOUCHER_SCHEMA_IMPLEMENTATION=PASS_STATIC_TESTS_CLONE_RUNTIME`

The official database promotion gate is not authorized. No official migration or business write occurred. No P0/P1 Gift Voucher regression was introduced. Next batch is not automatic.
