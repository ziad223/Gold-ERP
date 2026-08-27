# D2F Gate A Re-Entry — Main DB Integrity Proof

## Read-only identity and baseline

The query `SELECT current_database(), current_user` returned:

`darfus_erp | postgres`

### Protected main snapshot

| Entity/check | Count/state |
|---|---:|
| gift_vouchers | 0 |
| invoices | 3 |
| payments | 3 |
| cash_transactions | 9 |
| journal_entries | 27 |
| journal_lines | 77 |
| audit_logs | 170 |
| idempotency_requests | 102 |
| gift voucher status rows | 0 |
| journal source types containing voucher | 0 |
| invoices type giftVoucher | 0 |

### Gift Voucher schema snapshot

- Columns: `id`, `company_id`, `code`, `value`, `balance`, `customer_id`, `customer_name`, `status`, `issue_date`, `expiry_date`, `payment_method`, `branch`, `created_at`, `updated_at`.
- `id` is the primary key.
- `company_id` has a foreign key to `companies(id)`.
- `code` has a non-unique btree index only.
- `company_id` has a non-unique btree index.
- No currency, tax snapshot, branch FK, restriction, funding, lifecycle-event, payment-source, QR/barcode, or voucher-print-event columns were found.

## Runtime read-only proof

| Endpoint/service | Result |
|---|---|
| `GET http://localhost:8000/api/v1/health` | 200 |
| `GET http://localhost:8000/api/v1/health/db` | 200 |
| `GET http://localhost:8000/api/v1/health/redis` | 200 |
| unauthenticated `GET /api/v1/invoice-projection/sources` | 401, expected auth guard |
| `GET http://localhost:3000/en/sales/gift-vouchers` | 200 HTML shell |

Containers observed: `darfus-backend` on port 8000, `darfus-postgres` healthy on host port 5433, and `darfus-redis` healthy on port 6379.

## Delta statement

This control performed no POST/PUT/PATCH/DELETE business request and no SQL mutation.

`MAIN_DB_BASELINE_CAPTURED = YES`

`MAIN_DB_CHECK = PASS_READ_ONLY`

`OFFICIAL_BUSINESS_DELTA_BY_CONTROL = 0`

`OFFICIAL_FINANCIAL_DELTA_BY_CONTROL = 0`

`OFFICIAL_TREASURY_DELTA_BY_CONTROL = 0`

`OFFICIAL_PRINT_EVENT_DELTA_BY_CONTROL = 0`
