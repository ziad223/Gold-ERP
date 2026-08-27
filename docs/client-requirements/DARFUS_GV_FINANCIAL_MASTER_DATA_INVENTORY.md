# Gift Voucher Financial Master-Data Inventory — Official Read-Only

Database: `darfus_erp`

| Entity / authority | Observed state | Evidence | Impact |
|---|---|---|---|
| Company | 1 active company, AED, VAT registered | `companies` read-only query | context available |
| Branches | 2 active branches | `branches` read-only query | branch scope available |
| Accounts | 38 rows | `accounts` read-only query | account catalog exists |
| System semantic roles | 26 rows; 13 per branch | `system_account_roles` read-only query | required GV liability role absent |
| Branch financial mappings | 67 rows, historical inactive duplicates | `branch_financial_mappings` read-only query | active Treasury mapping can resolve |
| Settings | 12 rows | `settings` read-only query | tax/config authority available but rate policy ambiguous |
| Treasuries table | not present | schema inspection | Treasury represented by mappings/accounts/cash sessions/transactions |
| Cash register sessions | 1 existing open Branch-2 session | read-only query | not relevant to failed Branch-1 resolution |
| Gift Vouchers | 0 in official DB at failed-request delta | before/after comparison | no issue persistence occurred |

## Missing exact authority

`GIFT_VOUCHER_LIABILITY` is absent from both branch role sets. Account `2400` exists as a company-level liability account (`Gift Voucher Liability`) but is not linked by the required semantic role. This is a mapping/master-data gap, not permission to write the account directly.

