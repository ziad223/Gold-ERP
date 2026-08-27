# DARFUS POS Making Charge — Official Main DB Integrity

بالعربي: قاعدة `darfus_erp` بقيت للقراءة فقط. تم أخذ هوية القاعدة والأعداد قبل/بعد، ولم يُنفّذ Checkout أو seed أو migration أو backup أو cleanup.

## Target identity

| Check | Actual |
|---|---|
| `current_database()` | `darfus_erp` |
| `current_user` | `postgres` inside `darfus-backend` |
| Host mapping | PostgreSQL container `5432`, host `5433` |
| Official business writes in this control | `0` |
| Migration created/executed | `NO / NO` |
| Backup | `NOT RUN` |
| Checkout/Receive/Payment POST | `NOT RUN` |

## Before/after read-only counts

| Entity | Before | After | Delta |
|---|---:|---:|---:|
| assets | 18 | 18 | 0 |
| invoices | 3 | 3 | 0 |
| invoice_items | 3 | 3 | 0 |
| payments | 3 | 3 | 0 |
| journal_entries | 29 | 29 | 0 |
| journal_lines | 81 | 81 | 0 |
| inventory_asset_movements | 70 | 70 | 0 |
| asset_pricing_policies | 14 | 14 | 0 |

## Existing financial exception

Read-only integrity query found one pre-existing posted unbalanced journal:

```text
JE-1787090870905
source = purchase_order / PO-1787090870807
debit = 2133.21000000
credit = 2133.22000000
delta = 0.01000000
company = COMP-48ab554f-427e-4642-9419-bc8616c2dc36
branch = BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c
```

This row existed before the POS formula work, is outside the permitted scope, and was not altered. Therefore:

```text
PRE_EXISTING_ACCOUNTING_EXCEPTION = YES
ACCOUNTING_DELTA_INTRODUCED_BY_THIS_CONTROL = 0
ACCOUNTING_CLOSURE_GATE = BLOCKED_BY_PRE_EXISTING_EXCEPTION
```

It must not be presented as evidence that the POS formula fix created a journal defect. It also prevents a blanket financial-integrity PASS for the current database until Owner-approved remediation is handled in a separate control.

## Runtime services

| Service | Evidence | Status |
|---|---|---|
| Backend `/api/v1/health` | HTTP 200 | PASS |
| DB health | HTTP 200, PostgreSQL connected | PASS |
| Redis health | HTTP 200 | PASS |
| Frontend `/ar/pos` | HTTP 200 | GET PASS; browser proof blocked |
| Frontend `/en/pos` | HTTP 200 | GET PASS; browser proof blocked |

The backend container was started at `2026-08-26T15:04:45Z`; no restart/rebuild was performed after source correction. This is an evidence limitation, not an official DB mutation.

