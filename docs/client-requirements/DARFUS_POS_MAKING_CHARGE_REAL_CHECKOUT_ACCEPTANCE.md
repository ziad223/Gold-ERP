# DARFUS POS Making Charge — Disposable Real Checkout Acceptance

بالعربي: تم تنفيذ Checkout حقيقي واحد فقط على الـclone المؤقت، وليس على `darfus_erp`. النتيجة أثبتت صيغة 950، الضريبة مرة واحدة، الدفع، القيد المتوازن، حالة Assets، الباركود، الحركة، وIdempotency.

## Pricing preview

```text
POST /api/v1/pricing/calculate = 200
totalMakingCharge = 950
```

The three preview line prices were `2624.41836610`, `2099.53469288`, and `5248.83673220`; the middle stone-bearing line used net 4g for making.

## One checkout

```text
POST /api/v1/pos/checkout = 201
Invoice ID = INV-ID-1787762617594-l7dcc7
Invoice Number = INV-2026-000004
Subtotal = 9972.78979118
VAT rate = 14.000%
VAT = 1396.19060000
Total = 11368.98040000
Invoice making = 950.00000000
Payment = 11368.9804 CASH
```

The VAT arithmetic is once-only: `9972.78979118 × 14% = 1396.1905707652`, rounded by the existing accounting precision to `1396.1906`; `subtotal + VAT = total` at the persisted precision.

## Line proof

| Asset | Persisted weight | Persisted making | Expected |
|---|---:|---:|---:|
| `POS-MC-1787762617045-1` | 5g gross | 250 | 5 × 50 |
| `POS-MC-1787762617045-2` | 5g gross / 4g net | 200 | 4 × 50 |
| `POS-MC-1787762617045-3` | 10g gross | 500 | 10 × 50 |

Invoice line making sum = `950`.

## Accounting and treasury

| Evidence | Actual |
|---|---|
| Journal | `JE-1787762617721`, posted |
| Journal debit | `13268.98000000` |
| Journal credit | `13268.98000000` |
| Journal balance | PASS |
| Journal lines | 5 |
| Payment rows | 1 |
| Cash transaction rows | 1, linked to journal and invoice |
| Payment amount | `11368.9804` |

The journal total exceeds invoice cash by the existing COGS leg (`1900`); debit and credit remain equal. No accounting mapper was changed.

## Inventory and barcode

All three Assets were `available` before and `sold`/`SOLD` after. Each has exactly one `SALE` movement linked to the invoice, no duplicate movement, and unchanged gross/net/net-gold weights. Barcode history contains one `INITIAL` active row per Asset and all three barcodes are unique.

## Forged input defense

The request deliberately supplied aggregate/line `weight=1`, `totalWeight=1`, and `totalMakingCharge=1`. The response and persisted lines used canonical Asset weights and produced `250 + 200 + 500`, proving forged client values were ignored.

## Idempotency

| Request | Status | Business effect |
|---|---:|---|
| Original checkout | 201 | One invoice/payment/journal/3 movements |
| Same body + same key | 201 | Same invoice; no duplicate business rows |
| Changed making rate 51 + same key | 409 | Conflict; no mutation |

The clone idempotency table had one succeeded `pos.checkout` row for the key; post-checkout delta was exactly `+1`.

## Clone count delta after checkout

| Table | Before | After | Delta |
|---|---:|---:|---:|
| invoices | 3 | 4 | +1 |
| invoice_items | 3 | 6 | +3 |
| payments | 3 | 4 | +1 |
| cash_transactions | 11 | 12 | +1 |
| journal_entries | 29 | 30 | +1 |
| journal_lines | 81 | 86 | +5 |
| inventory_asset_movements | 70 | 73 | +3 |
| asset_events | 74 | 77 | +3 |
| audit_logs | 187 | 188 | +1 |
| idempotency_requests | 105 | 106 | +1 |
| assets | 21 | 21 | 0 (status transition only) |

