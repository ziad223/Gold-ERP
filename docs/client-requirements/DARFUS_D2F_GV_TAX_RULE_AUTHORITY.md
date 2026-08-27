# DARFUS D2F — Gift Voucher Tax Rule Authority

## Tax authority order

1. Actual transaction classification and current company tax policy.
2. Existing Tax Engine.
3. Immutable transaction tax snapshot.
4. Existing Accounting/Posting Engine.

The Gift Voucher service must not become a second Tax Engine.

## Purchased Voucher tax matrix

| Transaction | Tax treatment | Tax base | VAT source | Snapshot requirement |
|---|---|---|---|---|
| Purchased voucher issue | No Output VAT at issue | Not a taxable sale base at issue | No voucher-local VAT calculation | Capture approved classification/policy version when implemented |
| Voucher redemption against Sales Invoice | Actual Sales Invoice classification | Actual invoice taxable base | Current configured Tax Engine | Invoice tax snapshot is authoritative |
| Voucher used with exempt, out-of-scope, or reverse-charge sale | Actual invoice treatment | Actual invoice rules | Tax Engine | Preserve invoice treatment and version |
| Promotional/Loyalty/Compensation/Corporate/Manual issue | Unresolved | Unresolved | No assumption | Fail closed until separately approved |

## Dynamic-rate rule

No numeric VAT rate is hardcoded in the voucher lifecycle. A rate must come from current company/transaction Tax Engine configuration and be traceable to the snapshot/version used by the invoice.

HARDCODED_VAT_RATE = NO
TAX_RULE_VERSION_TRACEABILITY = YES
PURCHASED_VOUCHER_ISSUE_OUTPUT_VAT = NO
REDEMPTION_VAT_OWNER = ACTUAL_SALES_INVOICE_TAX_ENGINE

## Current read-only configuration evidence

On 2026-08-26, read-only inspection of darfus_erp.settings found:

defaultTaxTreatment = STANDARD_VAT
enabledTaxTreatments = STANDARD_VAT, EXEMPT, REVERSE_CHARGE, OUT_OF_SCOPE

This is configuration evidence only. No settings were changed.

## Currency

Currency must be read from durable company/server authority and captured with the financial event/snapshot. The frontend must not hardcode AED or allow a client-supplied currency to override server authority.

## Unresolved boundary

Expiry, cancellation, breakage, refund, write-off, and non-purchased classes have no approved tax rule in this control. They remain fail-closed and must not be inferred from the Purchased Voucher issue policy.

