# DARFUS Client E — DB Integrity Proof

## Official DB identity

```text
SELECT current_database() = darfus_erp
```

Result: `darfus_erp`.

## Official read-only counts

The following counts were read before implementation/runtime and re-read after. Business counts are unchanged.

| Table | Before | After | Business delta |
|---|---:|---:|---:|
| `customer_gold_purchase_documents` | 4 | 4 | 0 |
| `customer_gold_purchase_items` | 4 | 4 | 0 |
| `customers` | unchanged from baseline | unchanged | 0 |
| `invoices` | 1 | 1 | 0 |
| `invoice_items` | 1 | 1 | 0 |
| `invoice_item_asset_links` | 1 | 1 | 0 |
| `payments` | 1 | 1 | 0 |
| `cash_transactions` | 7 | 7 | 0 |
| `assets` | 18 | 18 | 0 |
| `asset_origins` | 18 | 18 | 0 |
| `inventory_asset_movements` | 62 | 62 | 0 |
| `journal_entries` | 25 | 25 | 0 |
| `journal_lines` | 67 | 67 | 0 |
| `customer_financial_liabilities` | 4 | 4 | 0 |
| `financial_settlements` | 3 | 3 | 0 |
| `audit_logs` | 140 | 140 | 0 |
| `idempotency_requests` | 100 | 100 | 0 |

`technical_account_sessions` was `107` at the E official baseline read and `108` after the acceptance window. The main backend log identifies an independent official `POST /api/v1/auth/login 200` at the exact time of the new session. This is a technical/concurrent environment delta, not a CGP or business delta, and it is recorded rather than hidden.

## Disposable clone delta

The clone started from a read-only dump with 4 CGP documents, 4 CGP items, 18 assets, 25 journals, 67 lines, 4 liabilities, 3 settlements, and 100 idempotency rows. After one synthetic login and GET-only projection checks:

- CGP documents/items: unchanged (`4 / 4`)
- assets/origins: unchanged (`18 / 18`)
- journals/lines: unchanged (`25 / 67`)
- liabilities/settlements: unchanged (`4 / 3`)
- idempotency rows: unchanged (`100`)
- technical sessions: `107 → 108` (allowed synthetic authentication delta)

Therefore `DISPOSABLE_BUSINESS_DELTA = 0`.

## Representative equality

The adapter output was compared with the representative clone source rows:

| Authority | Source value | Projection value | Result |
|---|---|---|---|
| document ID | `CGPD:...:be005e65-...` | same | equal |
| draft number | `CGPD-000001` | same | equal |
| total gold value | `5432.8910` | `5432.891` serialized numeric text | equal at source precision |
| payable total | `5432.8910` | `5432.891` serialized numeric text | equal at source precision |
| item net weight | `10.000000` | `10.000000` | equal |
| approved karat rate | `543.2891` | `543.2891` | equal |
| line gold value | `5432.8910` | `5432.891` serialized numeric text | equal at source precision |
| asset/barcode | `CGPA-e7b09e18b14e4649bad9101a14` / `GWANK24000001` | same | equal |
| journal debit/credit | `5432.89100000 / 5432.89100000` | same balance evidence | equal |
| liability | `0 settled / 5432.8910 outstanding` | `UNPAID` | equal under existing payment-summary rule |

No source row was updated by the adapter.

