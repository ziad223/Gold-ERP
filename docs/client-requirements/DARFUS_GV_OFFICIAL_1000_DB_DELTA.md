# Gift Voucher Official AED 1000 — Official DB Delta

Baseline was captured immediately before the control's issue: vouchers 1, invoices 4, invoice items 4, payments 5, cash transactions 13, journals 31, journal lines 89, movements 71, asset events 75, audit logs 196, idempotency rows 111, settings 12, system account roles 28. Branch eligibilities and print events were both zero / 3 respectively.

Read-only after-state:

| Entity | Before | After | Delta | Attribution |
|---|---:|---:|---:|---|
| gift_vouchers | 1 | 3 | +2 | +1 authorized; +1 unrelated external AED 500 issue at 19:05 |
| gift_voucher_branch_eligibilities | 0 | 0 | 0 | expected |
| gift_voucher_print_events | 3 | 3 | 0 | expected |
| invoices | 4 | 5 | +1 | authorized checkout |
| invoice_items | 4 | 5 | +1 | authorized checkout |
| payments | 5 | 7 | +2 | authorized Card + voucher legs |
| cash_transactions | 13 | 16 | +3 | authorized issue + Card sale leg; +1 unrelated external AED 500 issue |
| journal_entries | 31 | 34 | +3 | authorized issue + sale; +1 unrelated external AED 500 issue |
| journal_lines | 89 | 99 | +10 | authorized issue 2 + sale 6; external issue 2 |
| inventory_asset_movements | 71 | 72 | +1 | authorized sale |
| asset_events | 75 | 76 | +1 | authorized sale |
| audit_logs | 196 | 202 | +6 | authorized issue/activation/redemption/sale + 2 external voucher audit rows |
| idempotency_requests | 111 | 116 | +5 | authorized issue/activation/checkout + 2 external voucher rows; both replays added 0 |
| settings | 12 | 12 | 0 | no mutation |
| system_account_roles | 28 | 28 | 0 | no mutation |

The unrelated delta is explicitly attributable to Voucher `GV-05a43035-1aa2-456d-abc5-1c08c966a140`, code `GV-52C01E6242114677`, AED 500, created at 19:05:19, with its own issue/activation keys. It was not created, reused, edited, or cleaned by this control. No unexplained business, financial, or inventory delta remains for this control.

Results: `ALL_CURRENT_CONTROL_DELTAS_ATTRIBUTED = YES`; `UNEXPLAINED_BUSINESS_DELTA = 0`; `UNEXPLAINED_FINANCIAL_DELTA = 0`; `UNEXPLAINED_INVENTORY_DELTA = 0`.
