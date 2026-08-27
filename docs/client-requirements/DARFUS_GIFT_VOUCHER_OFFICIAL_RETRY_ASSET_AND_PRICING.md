# Gift Voucher Official Retry 01 — Asset and Pricing

## Authorized Asset

`AST-PUR-1787087436118-1-1-1v4x` / `GWPND21000001`

| Property | Observed |
|---|---|
| Company | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Branch | Branch-1 / `BRA-1787464306683` |
| Location | `QA-G2C-RECEIVE-LOCATION-01` / `LOC-2ca3af2d-e01a-454c-a625-4951d0925927` |
| Operational status | `AVAILABLE` |
| Inventory profile | `GOLD_BY_WEIGHT_JEWELLERY` |
| Barcode | `GWPND21000001` |
| Price | `4314.00000000` asset row; POS sale projection below |
| Cost | `2866.50869040` |
| Source | `supplier_purchase` |

After selecting the Asset's authorized Branch-1, POS search returned one Asset
result and no Product quantity fallback. No reservation, transfer, workshop, or
repair mutation was performed.

## Current server pricing evidence

Two read-side POS pricing calculations using the same Asset and Branch-1
returned the same current values:

| Value | Current server/UI result |
|---|---:|
| Sale base | AED 2,838.44 |
| VAT rate | 14% current settings |
| VAT | AED 397.38 |
| Final total | AED 3,235.82 |
| Currency | AED |

`SERVER_SALE_PREVIEW = PASS`
`CONFIRMED_TOTAL_STILL_CURRENT = YES`
`AUTO_CONFIRMED_VOUCHER_FACE_VALUE = 3235.82`

The historical amount `3,235.53` was not reused.

