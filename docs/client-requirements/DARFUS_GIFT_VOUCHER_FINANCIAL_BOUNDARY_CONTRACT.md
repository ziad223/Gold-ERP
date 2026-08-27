# DARFUS ERP - Gift Voucher Financial Boundary Contract

This contract freezes financial ownership without implementing any financial
workflow.

## Purchased Voucher issuance

| Concern | Authority/meaning | Allowed issue result |
|---|---|---|
| Face value | Fixed voucher value | Stored voucher value; not an invoice sale |
| Treasury | Existing semantic treasury/payment authority | Debit only when real money is received |
| Liability | Existing semantic Gift Voucher Liability role | Credit for the stored obligation |
| Revenue | Sales accounting authority | No Sales Revenue at issue |
| VAT | Tax Engine/company tax policy | No Output VAT at issue |
| Branch/company | Server-authoritative context | No frontend-only financial scope |
| Failure | Existing transaction/idempotency authority | No voucher/journal/payment mutation on failure |

Required shape:

`REAL_MONEY_PURCHASED_VOUCHER_ISSUE = DR_RESOLVED_TREASURY + CR_RESOLVED_GIFT_VOUCHER_LIABILITY`

`PURCHASED_VOUCHER_ISSUE_REVENUE = NO`

`PURCHASED_VOUCHER_ISSUE_OUTPUT_VAT = NO`

## Purchased Voucher redemption

| Concern | Authority/meaning | Voucher boundary |
|---|---|---|
| Sales transaction | Sales Invoice domain | Creates/prices/posts the actual sale |
| Taxable base and Output VAT | Tax Engine through the actual invoice | Voucher service does not calculate a second VAT |
| Revenue and COGS | Sales/Accounting authorities | Voucher service does not create a second revenue sale |
| Payment allocation | Central Payment Engine through strict GV adapter | Allocate the full voucher value once |
| Liability | Voucher/payment/accounting integration | Reduce the liability to zero on full redemption |
| Partial redemption | Forbidden | Reject before allocation; no residual balance |
| Non-purchased funding | Separate owner policy | Fail closed |

`VOUCHER_SERVICE_OWNS_SALES_REVENUE = NO`

`VOUCHER_SERVICE_CALCULATES_SALES_VAT = NO`

`FULL_REDEMPTION_LEAVES_BALANCE = 0`

## Financial safety boundaries

- Account identifiers must be resolved through the existing semantic account-role
  and company/branch mapping authority. Numeric literals are not a new authority.
- Expiry, cancellation, breakage, refund, and write-off require separate approved
  policies and must fail closed until then.
- A durable posted invoice or event is never destructively deleted as “rollback”.
  Before durable commit, normal transaction rollback applies; after publication,
  only approved compensation/recovery preserves the audit trail.
- The current source helper literals in `posting.service.js` are legacy evidence;
  they are unreachable while issue/redeem routes return the stable disabled error.

`ACCOUNTING_AUTHORITY_CHANGED = NO`
`TAX_AUTHORITY_CHANGED = NO`
`PAYMENT_ENGINE_GENERIC_BEHAVIOR_CHANGED = NO`
`FINANCIAL_WORKFLOW_IMPLEMENTED = NO`

