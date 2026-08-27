# Gift Voucher Financial Mapping Root Cause

## Finding

`FINANCIAL_MAPPING_ROOT_CAUSE_CLASS = MISSING_MASTER_DATA`.

## Proof chain

1. The canonical service normalizes cash to `CASH_TREASURY` and resolves Treasury.
2. It resolves `GIFT_VOUCHER_LIABILITY` before creating the Voucher or posting accounting.
3. Official Branch-1 has no active role row for `GIFT_VOUCHER_LIABILITY`.
4. The request returned `FINANCIAL_MAPPING_REQUIRED` and official counts stayed unchanged.

## Classification

| Question | Answer |
|---|---|
| Missing exact role | `GIFT_VOUCHER_LIABILITY` |
| Treasury mapping | found and valid |
| Duplicate/ambiguous active mapping | no |
| Product defect | not proven; fail-closed behavior is correct |
| Provider/network issue | no |
| Tax cause of 422 | no; failure occurs in financial resolver before tax/persistence |
| Official mutation | none |

## Impact

Purchased Gift Voucher issuance is blocked safely. No Voucher, invoice, journal, cash transaction, or idempotency success record was created by the failed request.

