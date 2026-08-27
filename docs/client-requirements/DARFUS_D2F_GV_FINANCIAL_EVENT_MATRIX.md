# DARFUS D2F — Gift Voucher Financial Event Matrix

This matrix is the event-level contract for the Owner-approved Purchased Gift Voucher policy. It is read-only design evidence; no event is executed by this control.

## Purchased Gift Voucher events

| Event | Preconditions | Business owner | Required accounting shape | Tax owner | Durable evidence | Failure rule |
|---|---|---|---|---|---|---|
| Issue | Purchased class, amount, company/branch/currency and real payment are valid | Gift Voucher lifecycle plus Payment Engine | Dr resolved treasury; Cr resolved Gift Voucher Liability | No Output VAT at issue | issue event, payment allocation, tax/accounting references | No voucher or journal write on failure |
| Issue without real money | Explicit non-cash policy exists | Not authorized by this policy | No assumed entry | Unresolved | No implicit financial event | Fail closed |
| Redeem against Sales Invoice | Active voucher, sufficient balance, valid invoice and Payment Engine allocation | Sales Invoice plus Payment Engine | Liability reduction paired with invoice settlement; invoice revenue/VAT remain canonical | Sales Tax Engine on actual invoice | immutable invoice/payment/voucher links | Atomic failure; invoice remains Draft |
| Partial redemption | **Not a valid Gift Voucher event under the specialized contract** | Gift Voucher adapter rejects before allocation | No financial entry and no balance allocation | Not applicable | No voucher balance/status/settlement delta | Reject; no residual balance and no multi-transaction consumption |
| Full redemption | Valid posted invoice and allowed allocation | Payment Engine plus Voucher lifecycle | Liability reduced to zero; invoice remains revenue/VAT authority | Actual invoice Tax Engine | status/balance transition and invoice reference | No duplicate allocation/posting on replay |
| Expiry | Approved expiry policy | Not assigned | Unresolved | Unresolved | No automatic financial event | Fail closed |
| Cancellation | Approved cancellation policy | Not assigned | Unresolved | Unresolved | No destructive deletion | Fail closed |
| Breakage | Approved breakage policy | Not assigned | Unresolved | Unresolved | No automatic revenue | Fail closed |
| Refund | Approved refund policy | Not assigned | Unresolved | Unresolved | No automatic treasury reversal | Fail closed |
| Write-off | Approved write-off policy | Not assigned | Unresolved | Unresolved | No automatic journal | Fail closed |

## Non-purchased classes

| Class | Cash at issue | Liability at issue | Revenue/VAT | Authority |
|---|---:|---:|---|---|
| Promotional | Unresolved | Unresolved | Unresolved | Separate Owner policy |
| Loyalty | Unresolved | Unresolved | Unresolved | Separate Owner policy |
| Compensation | Unresolved | Unresolved | Unresolved | Separate Owner policy |
| Corporate | Unresolved | Unresolved | Unresolved | Separate Owner policy |
| Manual | Unresolved | Unresolved | Unresolved | Separate Owner policy |

## Invariants

ONE_PURCHASED_VOUCHER_ISSUE = ONE_BUSINESS_EVENT
ONE_REDEMPTION_ALLOCATION = ONE_PAYMENT_ENGINE_ALLOCATION
VOUCHER_SERVICE_CALCULATES_SALES_VAT = NO
VOUCHER_SERVICE_OWNS_SALES_REVENUE = NO
FAILED_REDEMPTION_PARTIAL_PERSISTENCE = FORBIDDEN
REPLAY_DUPLICATE_FINANCIAL_EVENT = FORBIDDEN

## Source reality note

The current source contains disabled issue/redeem routes and helper methods, but a helper method is not proof of a reachable production event. Runtime acceptance is a later, separately authorized implementation gate.
