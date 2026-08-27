# Gift Voucher Liability Account Authority

## Frozen meaning

Purchased voucher issuance creates a liability, not revenue. The canonical role is `GIFT_VOUCHER_LIABILITY`; the resolver must return exactly one role mapping for the scoped company and branch.

## Official read-only evidence

| Item | State |
|---|---|
| Semantic role definition | present in source catalog as optional-but-explicitly-resolved |
| Active `SystemAccountRole` rows | zero for `GIFT_VOUCHER_LIABILITY` in Branch-1 and Branch-2 |
| Candidate account | account code `2400`, active liability, credit nature, liability classification, company-scoped |
| Canonical role link | absent |
| Failed command | HTTP 422 `FINANCIAL_MAPPING_REQUIRED` before persistence |

## Authority decision

`GIFT_VOUCHER_LIABILITY_MAPPING = MISSING`.

Account `2400` is evidence of a compatible candidate only; it is not current runtime authority until an approved semantic-role mapping exists. No hardcoded account is authorized.

