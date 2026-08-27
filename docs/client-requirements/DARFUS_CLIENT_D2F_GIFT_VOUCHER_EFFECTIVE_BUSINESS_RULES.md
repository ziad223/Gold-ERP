# D2F Gate A Re-Entry — Effective Gift Voucher Business Rules

## Authority order applied

1. Gift Voucher-specific rules.
2. Deposit rules only where Gift Voucher does not override them.
3. Sales Invoice rules for shared payment, posting, tax, security, audit, and printing frameworks.

`INHERITANCE_PRECEDENCE_APPLIED = YES`

The specialized document explicitly overrides Deposit customer ownership: an Anonymous Voucher may be issued before a customer is known.

## Effective rules

| Area | Effective rule | Evidence | Current implementation |
|---|---|---|---|
| Nature | Prepaid stored monetary instrument, independent from a future Sales Invoice | Gift Voucher 1.1-1.4 | Model comment/fields exist; financial workflow disabled |
| Value | Predefined fixed value; Full Redemption Only; no partial balance after redemption | Gift Voucher 1.5, 2.5, 9.2-9.5 | `value`/`balance` exist; enforcement not proven |
| Ownership | Anonymous, Customer, or Corporate; customer is not mandatory at issue | Gift Voucher 7.1-7.5 | Nullable customer fields only; no ownership model |
| Identity | Voucher Number plus globally unique, immutable, never-reused human-readable Voucher Code | Gift Voucher 4.5, 10.1-10.8 | `id` PK and `code`; code is not unique in DB |
| QR/barcode | Optional machine representation of the same Voucher Code | Gift Voucher 10.4 | No stored QR/barcode/link proven |
| Issuance | Approved issuance event creates the permanent lifecycle origin | Gift Voucher 4.1-4.7 | POST issue is stable-forbidden |
| Activation | Separate event; immediate/manual/scheduled/event-based policy | Gift Voucher 5.1-5.8 | No activation state/route |
| Distribution | Separate event; does not alter identity/value/lifecycle | Gift Voucher 15.1-15.7 | No distribution source |
| Lifecycle | Draft -> Active -> Redeemed/Expired/Cancelled -> Closed; exactly one final outcome | Gift Voucher 6.1-6.8 | Enum is only active/redeemed/expired |
| Expiry | No expiry, fixed date, defined period, or campaign-based policy | Gift Voucher 8.1-8.8 | Only `expiry_date` exists |
| Redemption | One eligible Sales transaction, full value, one time only | Gift Voucher 9.1-9.7 | POST redeem is stable-forbidden |
| Failed redemption | Before successful Sales posting, voucher/accounting/treasury remain unchanged | Gift Voucher 9.6; Sales 10.3 | No active path to prove |
| Payment | Payment Engine validates amount, state, available balance, expiry, currency, ownership, and allocation | Sales 10.1-10.3; Gift Voucher 9-10 | No voucher payment linkage |
| Tax | Tax Engine/Country Engine/Company Tax Policy remain authority; no manual VAT | Sales 1.4, 10; Deposit inherited financial framework | Gift-specific treatment/snapshot absent; blocked |
| Accounting | Stored value is an organization obligation until final outcome; exact entries must use approved accounting authority | Gift Voucher 2.6, 12.3; Deposit 10 | Helper maps account 2400 but is unused |
| Treasury | Only proven financial events change Treasury; activation/distribution alone do not | Gift Voucher 12.3, 15.6 | No active treasury integration |
| Audit | Every identity and lifecycle operation is traceable to user/employee/date/time/action | Gift Voucher 10.8, 15.7, 16.7, 17.7 | No dedicated voucher audit/event source |
| Restrictions | Products, branches/regions, customers, campaigns, and commercial combinations are policy-evaluated at redemption | Gift Voucher 14.1-14.7 | No restriction model |
| Print | Redeemable voucher presentation, not traditional invoice; standard/optional fields are policy-driven | Gift Voucher 11.1-11.7 | Generic placeholder exists but adapter is inactive |
| Reprint | New physical/digital representation of the same voucher; no new voucher; identity unchanged | Gift Voucher 16.1-16.7 | No voucher reprint route/event |

## Classification rule

`CLIENT_RULE_NOT_CONFUSED_WITH_IMPLEMENTATION = YES`.

The client rules above are now proven. Current source gaps are classified as implementation gaps unless the missing Tax or Accounting/Liability policy prevents a safe financial decision. No client rule was silently weakened to match the current table.

## Gate blocker

The documents place Gift Voucher tax under the Tax Engine but do not establish the actual legal/business treatment for issuance in the current Country/Company policy, and the current source has no Gift Voucher tax mapping or immutable tax snapshot. The inherited accounting framework does not provide a currently active, end-to-end Gift Voucher posting contract; the existing account-2400 helper is unused. Therefore:

`GATE_A = BLOCKED_FINANCIAL_AUTHORITY_UNRESOLVED`

No implementation or disposable mutation is authorized by this report.
