# Gift Voucher Financial Runtime Proof

Runtime target: `darfus_gift_voucher_schema_impl_01` through isolated backend `:8001`.

| Proof | Result |
|---|---|
| Purchased issue | 201; liability journal only, no sales revenue/VAT at issue |
| Full redemption | 201 through canonical POS; Invoice and Payment linked |
| Mixed voucher + cash | 201; cash leg retained and voucher leg linked |
| Multiple vouchers | 201; all voucher legs linked in one sale |
| Voucher-only cash transaction | 0 |
| Invoice journal balance | 0 unbalanced voucher invoice journals |
| Asset sale state | 0 voucher-linked assets not `sold/SOLD` |
| Asset event/movement | 7 linked voucher invoice assets had canonical `SALE` event and `inventory_asset_movements` row |
| Sub-cent precision | Focused test and clone journal proof use four-decimal precision when required |
| Official DB | unchanged: 0 vouchers, 3 payments, 29 journals |

The clone is cumulative. Counts in the clone include all earlier accepted/rejected scenarios and are not presented as a clean-run delta.
