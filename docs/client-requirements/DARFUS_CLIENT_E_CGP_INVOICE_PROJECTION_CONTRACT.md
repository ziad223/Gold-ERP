# DARFUS Client E — CGP Invoice Projection Contract

## Identity

```text
sourceType          = customer_gold_purchase
sourceId            = customer_gold_purchase_documents.id
displayNumber       = customer_gold_purchase_documents.draft_number
projectionReference = invoice:customer_gold_purchase:<sourceId>
partyType           = CUSTOMER
```

The adapter never generates a global invoice number and never changes the CGP source ID.

## Summary mapping

| Projection field | Source/meaning |
|---|---|
| `projectionReference` | D1 reference from the CGP source ID |
| `sourceType`, `sourceId`, `displayNumber` | CGP registry and document fields |
| `documentDate` | `transaction_date` |
| `companyId`, `branchId` | source fields after authenticated scope |
| `partyType`, `partyId`, `partyDisplayName` | `CUSTOMER`, document customer ID, existing Customer name |
| `currency` | document currency |
| `subtotal` | stored `total_gold_value` |
| `discountTotal`, `taxTotal` | `null`; no corresponding CGP source fields |
| `grandTotal` | stored `total_payable_to_customer`, falling back only when the source field is absent |
| `paymentStatus` | existing liability/settlement payment-summary rule |
| `businessStatus` | current CGP business status, not a new invoice status |
| `createdBy`, `createdAt` | source creator/timestamp |
| `sourceModule` | `customer_gold_purchase` |
| `canViewDetail`, `canPrint` | active read-only source contract; final print layout remains D2 |

## Detail mapping

Each CGP item remains a CGP item. `lines[].goldPurchase` preserves gross weight, stone weight, net weight, pure gold weight, karat/fineness/purity, proposed/reference rates, and stored pricing snapshot evidence. `lineTotal` is the stored snapshot `line_gold_value`; no new formula is applied.

Asset origin links preserve the existing Asset and barcode identity. Accounting links expose existing journal/line evidence. Settlement rows and linked cash transactions are read-only evidence.

## Tax contract

```text
taxSummary.tax             = null
taxSummary.vatRate         = null
taxSummary.taxableBase     = null
taxSummary.snapshotStatus  = NOT_APPLICABLE_SOURCE
taxSummary.semantics       = CGP source has no tax fields; no tax is synthesized.
```

This is a source-semantic projection, not a VAT calculation. The adapter does not invoke the Tax Engine, recalculate VAT, or copy sales tax behavior into CGP.

## Payment contract

Payment status uses `customer_financial_liabilities.settled_amount` and `outstanding_amount` through the existing `buildPaymentSummary` rule. Executed settlement and cash evidence is exposed from `financial_settlements`, `financial_settlement_legs`, and linked `cash_transactions`; CGP has no invented `payments` row.

## Accounting contract

The projection exposes existing `journal_entries` selected by CGP posting source (`CUSTOMER_GOLD_PURCHASE_ACCOUNTING_RECOGNITION` and the liability journal link) and their existing lines. It does not post, rebalance, or recalculate accounting.

## Read-only contract

The exposed routes are GET-only and use `sales.view`. No adapter path calls create/update/destroy, CGP validation/posting, settlement, repricing, tax calculation, or live GoldAPI retrieval.

