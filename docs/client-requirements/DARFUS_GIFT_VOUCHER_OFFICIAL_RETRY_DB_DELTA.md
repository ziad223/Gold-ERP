# Gift Voucher Official Retry 01 — Official DB Delta

Baseline was captured after the fresh backup and before the one issue attempt.
The post-failure read-only snapshot matched it exactly.

| Entity | Before | After | Delta | Classification |
|---|---:|---:|---:|---|
| SequelizeMeta | 93 | 93 | 0 | technical |
| gift_vouchers | 0 | 0 | 0 | no issue persisted |
| gift_voucher_branch_eligibilities | 0 | 0 | 0 | no issue persisted |
| gift_voucher_print_events | 0 | 0 | 0 | no print |
| invoices | 3 | 3 | 0 | no checkout |
| invoice_items | 3 | 3 | 0 | no checkout |
| payments | 3 | 3 | 0 | no payment |
| cash_transactions | 11 | 11 | 0 | no treasury write |
| journal_entries | 29 | 29 | 0 | no journal |
| journal_lines | 81 | 81 | 0 | no journal |
| inventory_asset_movements | 70 | 70 | 0 | no inventory write |
| asset_events | 74 | 74 | 0 | no lifecycle event |
| audit_logs | 189 | 189 | 0 | no business audit row |
| idempotency_requests | 105 | 105 | 0 | no replay/result persisted |

`ALL_OFFICIAL_DELTAS_CLASSIFIED = YES`
`UNEXPLAINED_OFFICIAL_BUSINESS_DELTA = 0`
`UNEXPLAINED_OFFICIAL_FINANCIAL_DELTA = 0`
`UNEXPLAINED_OFFICIAL_INVENTORY_DELTA = 0`

