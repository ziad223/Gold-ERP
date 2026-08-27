# DARFUS D2F — Gift Voucher Accounting Posting Authority

## Ownership boundary

| Concern | Authority |
|---|---|
| Voucher lifecycle/status/balance | Gift Voucher service |
| Payment allocation | Payment Engine |
| Account-role resolution | Existing financial account resolver and company/branch mapping |
| Journal construction/persistence | Existing Posting Engine |
| Tax calculation | Existing Tax Engine through the actual invoice |
| Treasury movement | Existing treasury/cash/bank authority |
| Audit/idempotency | Existing audit and idempotency services |

No duplicate voucher-specific accounting authority is approved.

## Approved Purchased Voucher issue entry

Debit = resolved treasury role (cash/bank), only when real money is received.
Credit = resolved Gift Voucher Liability role.
VAT = no Output VAT at issue.
Revenue = no Sales Revenue at issue.

The implementation must resolve semantic roles using company/branch authority. It must reject missing, duplicate, inactive, wrong-type, or wrong-scope mappings. It must not introduce numeric COA ids as a new authority.

## Approved redemption boundary

Redemption is not a voucher-created sale entry. The actual Sales Invoice owns taxable base, Output VAT, Sales Revenue, inventory/COGS, invoice lifecycle, and posting. The Payment Engine owns voucher allocation and the corresponding liability reduction. The exact journal composition must be proven against the existing posting contract before implementation.

## Current source evidence and gaps

| Evidence | Current observation | Consequence |
|---|---|---|
| backend/src/services/posting.service.js:869-892 | postVoucherIssueEntry exists and uses a treasury mapping plus literal account code 2400 | Not a compliant runtime implementation; use semantic role resolution before enablement |
| backend/src/services/posting.service.js:894-916 | postVoucherRedeemEntry exists and credits literal 4100 revenue | Conflicts with the approved redemption boundary if used as voucher-service sale authority |
| backend/src/routes/erp.routes.js:16400-16412 | Issue/redeem return GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED before mutation | Current runtime is fail-closed |
| backend/src/models/giftVoucher.model.js | Basic voucher columns only; no proven durable currency, branch id, tax snapshot, payment/accounting references, or complete audit linkage | Later schema/contract work is required |
| backend/migrations/20260617010000-installments-vouchers.js | Basic table and non-unique code index | Schema/idempotency closure is not complete |

## Atomicity and balance requirements

DEBIT = CREDIT
ONE_ISSUE = ONE_JOURNAL
ONE_REDEMPTION_ALLOCATION = NO_DUPLICATE_JOURNAL
FAILED_REDEMPTION = ZERO_VOUCHER_BALANCE_DELTA + ZERO_LIABILITY_DELTA + ZERO_TREASURY_DELTA + DRAFT_INVOICE

The official database remains read-only in this control.

