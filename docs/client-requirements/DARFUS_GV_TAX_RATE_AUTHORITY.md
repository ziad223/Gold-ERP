# Gift Voucher Tax Rate Authority

## Trace

| Layer | Source of truth | Observed value/meaning |
|---|---|---|
| Company policy | `company-tax-policy.service.js` | reads company and settings; exposes `vatRate` |
| Runtime settings | official `settings` rows | `vatRate = 14`; no explicit `purchaseVatRate`; purchase falls back to `vatRate` |
| Enabled treatments | official settings | `STANDARD_VAT`, `EXEMPT`, `REVERSE_CHARGE`, `OUT_OF_SCOPE` |
| Tax engine metadata | `uae-tax-engine.service.js` | legal standard metadata `5%`; configured rate is validated as 0–100 |
| Transaction context | `transaction-tax-context.service.js` | law version `UAE-VATP043-2025-02-26`, effective date `2025-02-26`; effective rate comes from company policy |
| Sales consumption | `sales.service.js`, ERP routes | computes from passed normalized configured rate |

## Decision

`CURRENT_CONFIGURED_VAT_RATE = 14%`.

`TAX_RATE_AUTHORITY = AMBIGUOUS` because configured company policy is 14%, legal metadata is 5%, and no effective-date field records the policy decision. No tax change was made and no rate is inferred for a future write.

`OWNER_POLICY_DECISION_REQUIRED = YES`.

This unresolved authority blocks the PASS gate for financial mapping recovery. It does not explain the observed Voucher 422, which happens earlier at semantic-role resolution.

## Owner Decision Addendum — Control 01

The above was the prior forensic state. Control `DARFUS-GIFT-VOUCHER-FINANCIAL-MAPPING-MINIMUM-SAFE-FIX-01` records the explicit Owner decision that the company Tax Center setting is the runtime authority, with current company VAT rate `14%`; the `5%` value remains legal/reference metadata only. No Tax code or setting was changed.

`TAX_RATE_AUTHORITY_VERIFY_001 = CLOSED_BY_OWNER_POLICY`.
