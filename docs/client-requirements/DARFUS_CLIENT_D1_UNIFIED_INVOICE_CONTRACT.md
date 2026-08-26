# D1 — Unified Invoice Projection Contract

## Contract status

- Contract: `READ_ONLY_V1`
- Owner: no business data; each canonical source module remains authoritative.
- Identity: `sourceType + sourceId`.
- Projection reference: `invoice:<sourceType>:<sourceId>`; it is namespaced
  metadata and not a replacement invoice number.
- `displayNumber` is source `invoice_number` with an `id` fallback and is not
  assumed globally unique.

## Active source registry

| sourceType | Current adapter | Source | Status |
|---|---|---|---|
| `sale` | Invoice adapter | `invoices.type = sale` | `SUPPORTED_NOW` |
| `return` | Invoice adapter | `invoices.type = return` | `SUPPORTED_NOW` |
| `exchange` | Invoice adapter | `invoices.type = exchange` | `SUPPORTED_NOW` |
| `installment` | Invoice adapter | `invoices.type = installment` | `SUPPORTED_NOW` |
| `deposit` | Invoice adapter | `invoices.type = deposit` | `SUPPORTED_NOW` |
| `gift_voucher` | none | `gift_vouchers` | `SUPPORTED_LATER` |
| `customer_gold_purchase` | none | `customer_gold_purchase_documents` | `SUPPORTED_LATER` / CGP extension point |
| `purchase_order` | none | `purchase_orders` | `NOT_AN_INVOICE` |

## Summary envelope

```json
{
  "projectionReference": "invoice:sale:<invoice.id>",
  "sourceType": "sale",
  "sourceId": "<invoices.id>",
  "displayNumber": "<invoice_number-or-id>",
  "documentDate": "<invoices.date>",
  "companyId": "<invoices.company_id>",
  "branchId": "<invoices.branch_id>",
  "partyType": "CUSTOMER",
  "partyId": "<invoices.customer_id>",
  "partyDisplayName": "<invoices.customer_name>",
  "currency": null,
  "subtotal": "<invoices.subtotal>",
  "discountTotal": "<invoices.discount>",
  "taxTotal": "<invoices.tax>",
  "grandTotal": "<invoices.total>",
  "paymentStatus": "<invoices.status>",
  "businessStatus": "<invoices.posting_status>",
  "createdBy": "<created_by_employee_id-or-null>",
  "createdAt": "<invoices.created_at>",
  "sourceModule": "sales",
  "operatorAttribution": {
    "createdByEmployeeId": "<id-or-null>",
    "createdByEmployeeName": "<source-name-or-null>",
    "finalizedByEmployeeId": "<id-or-null>",
    "finalizedByEmployeeName": "<source-name-or-null>"
  },
  "canViewDetail": true,
  "canPrint": true
}
```

`subtotal`, `discountTotal`, `taxTotal`, and `grandTotal` are copied source
values. D1 does not calculate `taxableBase`, VAT, totals, payment status, or
accounting balances.

## Detail envelope

```json
{
  "summary": "<summary envelope>",
  "lines": [{
    "lineReference": "<invoice_items.id>",
    "itemReference": "<invoice_items.asset_id>",
    "assetReference": "<invoice_items.asset_id>",
    "description": "<invoice_items.name>",
    "quantity": "<invoice_items.quantity>",
    "unit": null,
    "unitPrice": "<invoice_items.price>",
    "discount": "<invoice_items.discount>",
    "tax": null,
    "lineTotal": null,
    "weight": "<source-or-null>",
    "karat": "<source-or-null>",
    "assetLinks": [{
      "invoiceItemId": "<link.invoice_item_id>",
      "assetId": "<link.asset_id>",
      "ordinal": "<link.ordinal>",
      "mappingClassification": "<link.mapping_classification>",
      "costSnapshotRevisionId": "<link.cost_snapshot_revision_id>"
    }]
  }],
  "taxSummary": {
    "subtotal": "<source>",
    "discount": "<source>",
    "taxableBase": null,
    "tax": "<source>",
    "vatRate": "<source-or-null>",
    "grandTotal": "<source>",
    "source": "invoices.tax + invoices.vat_rate",
    "snapshotStatus": "HISTORICAL_DATA_GAP"
  },
  "paymentSummary": {
    "status": "<invoices.status>",
    "statusSource": "invoices.status",
    "rows": "<read-only payments.invoice_id rows>",
    "cashTransactions": "<read-only cash_transactions.reference rows>",
    "installments": "<read-only installments.invoice_id rows>"
  },
  "sourceLinks": {
    "source": "<invoice source identity>",
    "relatedInvoiceId": "<invoices.related_invoice_id-or-null>",
    "assetLinks": "<invoice_item_asset_links>",
    "accounting": "<journal_entries.source_type=invoice/source_id rows and lines>"
  },
  "audit": {
    "sourceCreatedAt": "<source>",
    "sourceUpdatedAt": "<source>",
    "createdByEmployeeId": "<source-or-null>",
    "finalizedByEmployeeId": "<source-or-null>",
    "taxSnapshotStatus": "HISTORICAL_DATA_GAP",
    "readOnly": true
  }
}
```

Missing source values remain `null`; no business value is inferred from a
label, current settings, or another module. `Asset` identity remains
traceable for every source line that has it.

## API boundary

All endpoints require authenticated `sales.view` and are GET-only:

- `GET /api/v1/invoice-projection/sources`
- `GET /api/v1/invoice-projection/summaries`
- `GET /api/v1/invoice-projection/:sourceType/:sourceId`

The server supplies company and branch scope from authenticated context. Query
or body values cannot widen it.

Stable error codes:

- `PROJECTION_UNSUPPORTED_SOURCE_TYPE`
- `PROJECTION_SOURCE_NOT_FOUND`
- `PROJECTION_SOURCE_FORBIDDEN`
- `PROJECTION_SOURCE_MALFORMED`
- `PROJECTION_MAPPING_FAILED`

## Explicit non-responsibilities

- No source document writes, tax recalculation, payment posting, journal
  posting, inventory mutation, barcode mutation, or idempotency claim.
- No new invoice table or materialized projection table.
- No CGP adapter in D1; `customer_gold_purchase` is an extension point for E.
- No final Search & Print UI, row-click behavior, audit-write policy, or final
  print layout; those are D2 scope.

