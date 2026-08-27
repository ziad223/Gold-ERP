# Gift Voucher Treasury Authority

## Current authority

The system does not expose a separate `treasuries` table. Treasury authority is represented by:

`BranchFinancialMapping` → resolved Account → cash register session/transaction where applicable.

For purchased issue, payment method normalization selects:

| Payment method | Required role | Official state |
|---|---|---|
| Cash | `CASH_TREASURY` | exactly one active mapping for each active branch |
| Card / transfer / bank | `BANK_ACCOUNT` | resolver/catalog path exists; not used by the failed cash request |

The active Branch-1 cash mapping resolves to `ACC-25af8d3f-9d2d-4584-afc0-880e53926280` / `SYS-CASH`. Branch-2 has the corresponding active cash authority. Historical inactive mapping rows are not active authority.

## Conclusion

`TREASURY_MAPPING = FOUND_VALID`.
No Treasury repair is proposed in this control.

