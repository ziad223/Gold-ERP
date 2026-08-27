# Gift Voucher Mapping — Official Promotion

## Promotion gate

Promotion was run only after fresh backup readability, account compatibility, scope uniqueness, fresh clone mapping, resolver, issue accounting, idempotency, rollback, Tax runtime, focused tests, regressions, typecheck, and P0/P1 checks passed.

## Exact authorized delta

Created only these two `SystemAccountRole` rows in `darfus_erp`:

| Branch ID | Role | Account ID |
|---|---|---|
| `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` | `GIFT_VOUCHER_LIABILITY` | `ACC-5554f72e-7edd-484d-8db7-b2be4764aac2` |
| `BRA-1787464306683` | `GIFT_VOUCHER_LIABILITY` | `ACC-5554f72e-7edd-484d-8db7-b2be4764aac2` |

The canonical account is code `2400` / `Gift Voucher Liability`.

`OFFICIAL_MAPPING_PROMOTION = MINIMUM_EXACT_PROVEN_DELTA`.
`OFFICIAL_GIFT_VOUCHER_ISSUE = NOT_RUN`.

Post-promotion read-only attribution later found an external official Voucher issue, activation, and two print events. Those mutations are not included in this mapping promotion and remain open for Owner review under `GV-UNAUTHORIZED-OFFICIAL-MUTATION-001`.
