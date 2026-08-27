# Gift Voucher Financial Resolver Decision Tree

## Purchased issue

```text
issuePurchasedVoucher
  -> validate face value, currency, company/branch, customer and payment method
  -> resolve CASH_TREASURY or BANK_ACCOUNT by branch mapping
  -> resolve GIFT_VOUCHER_LIABILITY by company + branch semantic role
  -> verify account identity/type/nature/classification/branch compatibility
  -> begin canonical transaction work
  -> post Dr resolved Treasury / Cr resolved Gift Voucher Liability
  -> create cash transaction and audit evidence
```

## Fail-closed branches

| Check | Required result | Current result | Evidence | Classification |
|---|---|---|---|---|
| Company/branch context | present and server-authoritative | present | resolver service; official company and two active branches | NO_ISSUE |
| Treasury mapping | exactly one active branch mapping | present for Branch-1 and Branch-2 | `BranchFinancialMapping`, `CASH_TREASURY` | NO_ISSUE |
| Gift Voucher liability role | exactly one active semantic-role row | zero rows in both branches | `SystemAccountRole` query; HTTP 422 | MISSING_MASTER_DATA |
| Account compatibility | active liability account with required classification | clone proves account 2400 is compatible; official role link absent | resolver/catalog/model evidence | BLOCKED_BY_MISSING_MAPPING |
| Persistence after resolution | only after all resolution passes | not reached on failed request | service control flow; unchanged DB counts | NO_ISSUE |

## Canonical accounting invariant

`Treasury debit + Gift Voucher Liability credit = Voucher face value`; Revenue = `0`; Output VAT = `0`. Redemption remains a Sales Invoice concern and must use the existing Tax Engine; this control does not alter redemption.

