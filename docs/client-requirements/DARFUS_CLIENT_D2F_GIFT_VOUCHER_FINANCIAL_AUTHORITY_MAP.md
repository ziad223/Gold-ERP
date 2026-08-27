# D2F Gate A Re-Entry — Gift Voucher Financial Authority Map

## Authority boundary

The client documents assign shared tax/payment/accounting behavior to the inherited Sales/Deposit frameworks, while Gift Voucher-specific rules define stored-value independence, one-time/full redemption, ownership, restrictions, and final outcomes. The current source does not yet connect those authorities into one active transaction.

| Financial concern | Client authority | Current source/DB | Result |
|---|---|---|---|
| Monetary value | Predefined fixed value, immutable after activation except policy | `value` and `balance` DECIMAL(15,4) | Storage exists; invariant not enforced/proven |
| Currency | Currency is printed and redemption checks compatibility | No Gift Voucher currency mapping/snapshot; UI fallback to company currency | `GIFT_VOUCHER_CURRENCY_AUTHORITY = MISSING_DURABLE_VOUCHER_SOURCE` |
| Tax authority | Tax Engine -> Country Engine -> Company Tax Policy; no manual VAT | No Gift Voucher tax treatment/snapshot in model, route, or DB | `GIFT_VOUCHER_TAX_ENGINE_AUTHORITY = PROVEN`; treatment unproven |
| Tax treatment | Must be the approved legal/business classification for this instrument | No current policy-to-voucher mapping found | Gate blocker |
| Issue funding | Funding Source is assigned at issuance and historically traceable | No funding field/event; POST issue disabled | Implementation gap |
| Liability | Stored value is an organization obligation until redemption/expiry/cancellation | Account 2400 helper exists but no active route/journal source rows | Accounting authority not active/proven |
| Redemption posting | Full value consumed in successful Sales posting only | POST redeem disabled; no source linkage | Not proven |
| Treasury | Only proven financial event changes Treasury | No voucher treasury source rows | Not proven |
| Failed redemption | No voucher/accounting/treasury change before successful Sales posting | No active path | Not proven |
| Payment allocation | Payment Engine owns validation/allocation; Voucher Engine owns lifecycle | `payments` has no voucher source FK; route disabled | Boundary not implemented |
| Reversal/expiry/cancellation | Must follow approved financial event policy and preserve history | No active lifecycle/event model | Policy/implementation gap |

## Exact stop

The client rule is not ambiguous; the current financial authority is incomplete. No safe implementation can select a VAT treatment or activate account 2400 posting merely from the presence of helper code.

`GIFT_VOUCHER_TAX_TREATMENT = UNPROVEN_IN_CURRENT_COMPANY_COUNTRY_POLICY`

`GIFT_VOUCHER_ACCOUNTING_AUTHORITY = INHERITED_FRAMEWORK_NOT_ACTIVE_FOR_VOUCHER`

`GIFT_VOUCHER_LIABILITY_AUTHORITY = ACCOUNT_2400_DESIGN_HINT_ONLY_NOT_RUNTIME_PROVEN`

`GATE_A = BLOCKED_FINANCIAL_AUTHORITY_UNRESOLVED`

## Required owner/system closure before implementation

1. Prove the configured legal/business tax classification for issuance and redemption, including whether/when immutable tax snapshots are required.
2. Approve the exact liability, treasury and revenue entries for issuance, redemption, expiry and cancellation.
3. Prove the durable currency source and branch restriction authority.
4. Then design the additive schema and disposable rehearsal.
