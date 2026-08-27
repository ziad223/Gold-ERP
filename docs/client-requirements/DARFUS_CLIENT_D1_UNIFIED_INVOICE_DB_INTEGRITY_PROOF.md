# D1 — Unified Invoice Projection DB Integrity Proof

## Official target

`SELECT current_database()` was read before D1 work and returned
`darfus_erp`. No transaction, mutation route, migration, seed, backup, or
cleanup was run for D1.

## Read-only source counts captured before D1 runtime

| Table | Count | Role |
|---|---:|---|
| `invoices` | 1 | Active representative source Invoice |
| `invoice_items` | 1 | Source lines |
| `invoice_item_asset_links` | 1 | Asset traceability |
| `payments` | 1 | Payment source |
| `cash_transactions` | 7 | Treasury/source links |
| `journal_entries` | 25 | Accounting source links |
| `journal_lines` | 67 | Accounting lines |
| `installments` | 0 | Related source table |
| `gift_vouchers` | 0 | Later source family |
| `customer_gold_purchase_documents` | 4 | Separate CGP authority |
| `customer_gold_purchase_items` | 4 | CGP lines |
| `assets` | 18 | Physical identity authority |
| `inventory_asset_movements` | 62 | Physical movement authority |
| `idempotency_requests` | read-only baseline captured | Must remain unchanged by GET projection reads |

## Before/after assertion

The final D1 report records the same counts after runtime GET scenarios. The
assertion is:

```text
PROJECTION_READ_BUSINESS_DELTA = 0
D1_DB_BUSINESS_DELTA = 0
OFFICIAL_BUSINESS_WRITES = 0
OFFICIAL_DB_DAMAGE = 0
```

At minimum compare source and operational tables: `invoices`,
`invoice_items`, `payments`, `cash_transactions`, `journal_entries`,
`journal_lines`, `invoice_item_asset_links`, `audit_logs`, and
`idempotency_requests`.

## Financial/identity checks

For the representative sale source:

- projected `sourceId`, company, branch, customer, and Asset link equal source
  values;
- projected subtotal, discount, tax, and grand total equal Invoice source
  values as strings;
- D1 does not derive a taxable base or recalculate VAT;
- the source journal link is exposed but no journal line is created or changed;
- the source Payment/Cash rows are exposed but no payment/cash row is created;
- repeated GETs return the same semantic body.

