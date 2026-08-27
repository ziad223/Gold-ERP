# Gift Voucher Financial Semantic Role Matrix

| Semantic role | Business meaning | Resolver | Required account properties | Official DB state | Decision |
|---|---|---|---|---|---|
| `CASH_TREASURY` | payment received through cash treasury | `resolveRequiredBranchFinancialAccount` | active asset/debit/asset/posting mapping | one active mapping per branch | FOUND_VALID |
| `BANK_ACCOUNT` | payment received through bank/card/transfer path | same branch resolver | active bank mapping | catalog and resolver available; not used by failed cash request | AVAILABLE_NOT_RUNTIME_PROVEN_HERE |
| `GIFT_VOUCHER_LIABILITY` | obligation created by purchased voucher issuance | `resolveRequiredSemanticAccount` | active liability account, credit nature, liability classification, company/branch compatible | zero role rows in both branches | MISSING_MASTER_DATA |
| `SALES_REVENUE` | revenue on redemption sale | existing posting/catalog role | revenue account | present in role catalog/DB | OUT_OF_SCOPE_FOR_ISSUE |
| `VAT_PAYABLE` | tax on taxable sale/redemption | Tax Engine/accounting path | tax liability account | present in role catalog/DB | OUT_OF_SCOPE_FOR_PURCHASE_ISSUE |

## Explicit prohibition

The role is the authority. Account code `2400` may be a candidate account only after the role mapping resolves it. Literal `2400` or `4100` references in legacy posting helpers are not permitted as canonical authority.

