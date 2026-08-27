# Gift Voucher Official Acceptance — Official DB Delta

Baseline was captured after the official schema promotion and before the single issue attempt. The same counts were queried after the HTTP 403 response.

| Table | Before | After | Delta | Classification |
|---|---:|---:|---:|---|
| gift_vouchers | 0 | 0 | 0 | No business write |
| gift_voucher_branch_eligibilities | 0 | 0 | 0 | No business write |
| gift_voucher_print_events | 0 | 0 | 0 | No print mutation |
| invoices | 3 | 3 | 0 | No checkout |
| invoice_items | 3 | 3 | 0 | No checkout |
| payments | 3 | 3 | 0 | No payment |
| cash_transactions | 11 | 11 | 0 | No treasury write |
| journal_entries | 29 | 29 | 0 | No journal |
| journal_lines | 81 | 81 | 0 | No journal |
| inventory_asset_movements | 70 | 70 | 0 | No movement |
| asset_events | 74 | 74 | 0 | No event |
| audit_logs | 189 | 189 | 0 | No business audit row |
| idempotency_requests | 105 | 105 | 0 | Guard rejected before idempotency claim |
| SequelizeMeta | 93 | 93 | 0 | No migration |

`UNEXPECTED_OFFICIAL_BUSINESS_DELTA = 0`.
`UNEXPECTED_OFFICIAL_FINANCIAL_DELTA = 0`.
`UNEXPECTED_OFFICIAL_INVENTORY_DELTA = 0`.

The selected Asset remained AVAILABLE. No cleanup, restore, delete, or direct DB business write was performed.

