# D2 Official and Disposable Database Integrity Proof

## Official database identity

- current_database: darfus_erp
- current_user: postgres
- Official business writes authorized in D2: NO
- No migration, seed, backup, cleanup, or direct SQL business mutation was run.

## Official before/after counts

The D2 baseline captured before the authenticated browser journey was:

| Table | Before | After | Delta |
|---|---:|---:|---:|
| invoices | 1 | 1 | 0 |
| invoice_items | 1 | 1 | 0 |
| invoice_item_asset_links | 1 | 1 | 0 |
| payments | 1 | 1 | 0 |
| journal_entries | 25 | 25 | 0 |
| journal_lines | 67 | 67 | 0 |
| assets | 18 | 18 | 0 |
| inventory_asset_movements | 62 | 62 | 0 |
| invoice_print_events | 0 | 0 | 0 |
| idempotency_requests | 100 | 100 | 0 |
| audit_logs | 140 | 152 | +12 expected read/audit side effect |

The +12 audit-log delta is not a business transaction. D2 search is intentionally audited with action invoice_projection.search; the browser journey and read-only revalidation produced search audit evidence. No InvoicePrintEvent or business source row changed. Existing audit rows are preserved and not cleaned.

## Disposable runtime proof

Disposable DB: darfus_e_cgp_invoice_projection_01.
A direct SELECT current_database() check returned the exact clone name. The clone baseline included invoices=1, customer_gold_purchase_documents=4, audit_logs=140, invoice_print_events=0. A temporary backend health check on localhost:8003 returned healthy and its logs identified the clone DB. No mutation was performed because D2 did not require a print mutation and a usable clone credential was not available.

## Integrity conclusion

BUSINESS_DB_DELTA = 0
FINANCIAL_DB_DELTA = 0
INVENTORY_DB_DELTA = 0
PRINT_EVENT_DELTA = 0
AUDIT_LOG_DELTA = +12_EXPECTED_READ_AUDIT
UNEXPECTED_BUSINESS_DELTA = 0
MIGRATION_DELTA = 0

