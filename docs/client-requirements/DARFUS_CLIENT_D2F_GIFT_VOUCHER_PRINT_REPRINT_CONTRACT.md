# D2F Gate A Re-Entry — Gift Voucher Print and Reprint Contract

## Client contract

Gift Voucher is not a traditional business/tax invoice. It is a redeemable physical or digital presentation of the stored value.

### Standard fields from Gift Voucher 11.3

- Company Logo
- Company Name
- Voucher Number
- Voucher Code
- QR Code
- Barcode
- Voucher Value
- Currency
- Issue Date
- Expiration Date when applicable

### Optional policy fields from Gift Voucher 11.4

- Recipient Name
- Personalized Message
- Campaign Name
- Terms and Conditions
- Redemption Instructions
- Contact Information

The document says these fields are policy-driven; this audit does not promote any optional field to mandatory.

## Reprint invariant

Reprinting creates a new physical/electronic representation of the same voucher. It must preserve:

`Voucher Number = unchanged`

`Voucher Code = unchanged`

`QR Code = unchanged`

`Barcode = unchanged`

`Voucher Value = unchanged`

The voucher itself is never recreated. Every reprint is audited with date, actor, reason and authorization when required by policy.

## Current implementation comparison

| Contract | Current evidence | Status |
|---|---|---|
| Specialized voucher layout | Gift Voucher doc 11.1-11.7 | Client rule proven |
| Active voucher print route | Projection registry `canPrint=false`, adapter null | Missing |
| Generic print placeholder | `invoice-print-view-model.ts` warns `gift_voucher_fields_missing` | Not authoritative |
| Reprint same identity | No Gift Voucher reprint route/event | Not proven |
| Print audit | No voucher print/reprint event source; main count is zero | Not proven |

`GIFT_VOUCHER_PRINT_LAYOUT_AUTHORITY = PROVEN_CLIENT_CONTRACT_NOT_RUNTIME_IMPLEMENTED`

`GIFT_VOUCHER_REPRINT_CREATES_NEW_VOUCHER = NO`

`GIFT_VOUCHER_REPRINT_IDENTITY_PRESERVED = CLIENT_RULE_PROVEN_IMPLEMENTATION_NOT_PROVEN`

No print mutation was run on main or a clone in this control.
