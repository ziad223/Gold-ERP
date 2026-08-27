# DARFUS D2F — Purchased Gift Voucher UAE Financial Policy

## Purpose

This document freezes the Owner-approved UAE financial authority for a Purchased Gift Voucher. It is a policy artifact only: no source implementation, migration, seed, issue, redemption, or database mutation is authorized by this document.

## Authority and scope

| Authority | Frozen decision |
|---|---|
| Business policy | Owner-approved UAE Purchased Voucher model |
| Tax | Existing Tax Engine and transaction classification authority |
| Accounting | Existing Posting Engine and semantic account-role resolver |
| Payment allocation | Payment Engine |
| Voucher lifecycle | Gift Voucher service |
| Currency | Durable server/company authority; never frontend-only |
| Scope | Purchased Voucher only |

## Purchased Voucher issue

The customer pays the face value. The face value is recorded as a liability, not as an immediate sale.

| Event | Debit | Credit | VAT at issue | Revenue at issue |
|---|---|---|---|---|
| Issue with real money received | Resolved cash/bank treasury role | Resolved Gift Voucher Liability role | No Output VAT | No Sales Revenue |

Account identifiers must be resolved through the existing accounting/posting authority. Numeric COA identifiers must not become a new business authority.

PURCHASED_VOUCHER_ISSUE_REVENUE = NO
PURCHASED_VOUCHER_ISSUE_OUTPUT_VAT = NO
PURCHASED_VOUCHER_ISSUE_LIABILITY = YES
PURCHASED_VOUCHER_ISSUE_TREASURY_EFFECT = YES_IF_REAL_MONEY_RECEIVED

## Purchased Voucher redemption

A Purchased Voucher is a payment instrument for a later Sales Invoice. Redemption is not an independent sale and must not calculate a second VAT or revenue amount.

1. The normal Sales/Pricing/Tax authorities create and price the Sales Invoice.
2. The Payment Engine allocates the voucher amount against that invoice.
3. The voucher liability is reduced by the amount actually applied.
4. Sales Revenue and Output VAT come from the actual Sales Invoice and Tax Engine.
5. The voucher service does not own sales revenue, VAT calculation, or a second invoice.

## Atomicity and idempotency

Before a successful Sales Invoice posting, a failed redemption must leave voucher balance/status, liability, treasury, accounting, and invoice state unchanged. The invoice remains Draft when the business action has not successfully posted.

The existing idempotency authority must be reused. A second voucher-specific hash or posting authority is forbidden.

## Other classes and unresolved rules

Promotional, Loyalty, Compensation, Corporate, and Manual vouchers have no approved cash, liability, VAT, revenue, expiry, cancellation, breakage, refund, or write-off policy in this control. They require separate Owner decisions and must fail closed.

Expiry, cancellation, breakage, refund, write-off, and non-purchased funding/tax treatment are unresolved. The specialized Gift Voucher contract is full-redemption-only; therefore partial-redemption allocation/rounding is not an authorized business path, not a deferred partial feature, and must fail closed. No automatic income, refund, reversal, or write-off may be inferred.

## Gate

FINANCIAL_AUTHORITY_GATE = PASS_PURCHASED_GIFT_VOUCHER_UAE_FINANCIAL_POLICY
GIFT_VOUCHER_IMPLEMENTATION = NOT_CLOSED_BY_THIS_POLICY
GIFT_VOUCHER_RUNTIME_ACCEPTANCE = NOT_AUTHORIZED
