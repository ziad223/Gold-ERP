# DARFUS Gift Voucher Main Runtime Parity Recovery — Report

## Executive Summary

تم تنفيذ تحديث Backend محدود ومصرّح به فقط لاستعادة تطابق Runtime مع المصدر
الحالي. نجحت صحة Backend/DB/Redis، ونجح GET المصادق عليه للقسائم، وظهرت واجهة
القسائم بالعربية والإنجليزية بدون أخطاء. لم يتم إصدار Voucher أو تنفيذ Checkout
أو أي كتابة تجارية. خطر قاعدة البيانات الرسمية من هذا التحكم: صفر؛ بقيت كل
العدادات والأصل المرجعي دون تغيير. الخطوة التالية تتطلب Owner authorization
منفصلة قبل أي محاولة مالية جديدة.

## 1. Control and scope

- Control: `DARFUS-GIFT-VOUCHER-MAIN-RUNTIME-PARITY-RECOVERY-01`
- Official DB: `darfus_erp`
- Main frontend/backend: `http://localhost:3000` / `http://localhost:8000`
- Scope: backend-only runtime parity recovery and authenticated read proof
- Business mutation: not authorized and not run
- Production: not contacted

## 2. Preserved prior evidence

The earlier one-authorized Gift Voucher issue attempt returned HTTP 403 with
request id `cbf36216-8071-4b0c-a7b7-f68ac60e33dd` before persistence. It created
no Voucher, activation, checkout, payment, journal, movement, or audit business
row. That failed-acceptance evidence remains unchanged.

## 3. Parity root cause

Before refresh, the running Node process served the historical
`GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED` behavior and the read-side list
returned HTTP 500, while the bind-mounted current source had the active route.
Host and container source hashes now match and the service was restarted. This
is `GV-E-008` / `GV-I-003`, classified as `ENVIRONMENT_CONFIG / RUNTIME_PARITY`.

## 4. Runtime refresh

Only `darfus-backend` was restarted. PostgreSQL, Redis, and frontend were not
restarted. Startup showed successful Redis and PostgreSQL connections, skipped
runtime admin bootstrap, and listening on port 8000. No startup migration was
observed, and the current server source has no normal startup migration runner.

## 5. Health and DB identity

| Check | Result |
|---|---|
| `current_database()` / user | `darfus_erp` / `postgres` |
| `/api/v1/health` | 200 |
| `/api/v1/health/db` | 200 |
| `/api/v1/health/redis` | 200 |
| `SequelizeMeta` | 93 before / 93 after |
| Main backend state | running; started `2026-08-27T11:46:27.857708103Z` |

## 6. Authenticated Gift Voucher read

`GET /api/v1/gift-vouchers` returned HTTP 200 after refresh, followed by normal
304 cache revalidations. The response was an empty list, matching
`gift_vouchers = 0`. The old read-side 500 was not reproduced.

## 7. AR/EN browser proof

Arabic `/ar/sales/gift-vouchers` and English `/en/sales/gift-vouchers` both
rendered the Gift Voucher page and empty state. Console warning/error count was
zero for the inspected tab. No issue/activation/redemption/checkout/print
control was invoked.

## 8. Official DB and Asset delta

All business/financial/inventory counts matched the prior baseline; see
`DARFUS_GIFT_VOUCHER_MAIN_RUNTIME_ZERO_DELTA.md`. The acceptance Asset
`AST-PUR-1787087436118-1-1-1v4x` with barcode `GWPND21000001` remained
`available` / `AVAILABLE`, with its recorded branch, location, and costs
unchanged.

## 9. Registers and prevention

`GV-E-008` and `GV-I-003` are resolved as a runtime freshness/parity blocker for
the read-side recovery. `GV-L-005` remains an active prevention lesson: critical
acceptance must prove process/source freshness immediately before any future
Owner-authorized business attempt. No new financial or product-rule defect was
introduced.

## 10. Gate

`GATE = PASS_GIFT_VOUCHER_MAIN_RUNTIME_PARITY_RECOVERY`

This gate means runtime parity recovery and read-only proof passed. It does not
authorize a Voucher issue, activation, redemption, checkout, payment, print, or
any other business mutation.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-GIFT-VOUCHER-MAIN-RUNTIME-PARITY-RECOVERY-01
RUNTIME_PARITY_MISMATCH_PRE_REFRESH = PROVEN
BACKEND_REFRESH_SCOPE = BACKEND_ONLY
BACKEND_REFRESH_EXECUTED = YES
AUTO_MIGRATION_DURING_REFRESH = NO
AUTHENTICATED_GIFT_VOUCHER_LIST = PASS
LEGACY_DISABLED_GUARD_RUNTIME_AUTHORITY = NO
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_IDENTITY = darfus_erp|postgres
OFFICIAL_BUSINESS_DELTA = 0
OFFICIAL_FINANCIAL_DELTA = 0
OFFICIAL_INVENTORY_DELTA = 0
ACCEPTANCE_ASSET_STATE = AVAILABLE_UNCHANGED
AR_READ_ONLY_BROWSER = PASS
EN_READ_ONLY_BROWSER = PASS
BROWSER_BUSINESS_MUTATIONS = 0
PRODUCT_CODE_CHANGED = NO
CONFIG_CHANGED = NO
MIGRATION_CHANGED = NO
FINANCIAL_RETRY_AUTHORIZED = NO
RUNTIME_PARITY_ERROR_ID = GV-E-008
RUNTIME_PARITY_LESSON_ID = GV-L-005
GATE = PASS_GIFT_VOUCHER_MAIN_RUNTIME_PARITY_RECOVERY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

No Voucher, Checkout, redemption, print, fixture, migration, or cleanup was
started. STOP and await separate Owner review/authorization for any future
business acceptance.
