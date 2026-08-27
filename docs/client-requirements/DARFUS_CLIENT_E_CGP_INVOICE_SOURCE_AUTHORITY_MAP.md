# DARFUS Client E — CGP Invoice Source Authority Map

Control: `DARFUS-CLIENT-E-CGP-INVOICE-PROJECTION-01`

This artifact records the read-only source authority used by the CGP adapter. It does not create a second CGP or invoice owner.

## Fast triage

| Question | Proven answer | Evidence |
|---|---|---|
| Current CGP document table | `customer_gold_purchase_documents` | `CustomerGoldPurchaseDocument` model, `tableName` |
| Immutable source ID | `customer_gold_purchase_documents.id` | model primary key; representative value is `CGPD:COMP-48ab554f-427e-4642-9419-bc8616c2dc36:be005e65-7f60-4a83-94b5-280884b8a926` |
| Business-facing number | `customer_gold_purchase_documents.draft_number` | model field `draftNumber`; representative `CGPD-000001` |
| Current business lifecycle | `DRAFT → VALIDATED → POSTED` (with `REVERSED` in the canonical status set) | `gold-purchase-draft.service.js`, `cgp-posting.service.js` |
| Existing CGP read API | `GET /api/v1/gold-purchases/cgp/drafts/:id` and `/business-view` | `gold-purchase.routes.js` |
| CGP item rows | `customer_gold_purchase_items` | `CustomerGoldPurchaseItem` model; representative item `...:L1` |
| Stored totals | `total_gold_value`, `total_payable_to_customer` | document model; representative both `5432.8910` |
| Gold valuation evidence | `cgp_pricing_snapshots` and posted GoldCoreEvent/source evidence | `CgpPricingSnapshot` model and CGP posting/business-view services |
| Customer authority | existing `customers` row through `CustomerGoldPurchaseDocument.belongsTo(Customer)` | models association; representative `CUS-0002 / Mohamed Negm` |
| Company/branch authority | document `company_id`/`branch_id`, constrained by authenticated server context | model fields and auth middleware; representative company/branch are preserved |
| Payment/settlement authority | `customer_financial_liabilities`; executed settlement evidence from `financial_settlements`, `financial_settlement_legs`, and linked cash transactions | `cgp-payment-summary.js`, models, read-model routes |
| Accounting authority | existing `journal_entries` and `journal_lines`, selected by CGP posting source and liability journal link | `cgp-posting.service.js`, `JournalEntry`, `JournalLine`; representative journal balanced |
| Tax authority | no CGP tax/VAT fields are present in the current document/item source | current CGP models and read-only projection result; adapter emits `NOT_APPLICABLE_SOURCE` and does not synthesize tax |

## Representative source evidence

| Field | Value |
|---|---|
| Source type | `customer_gold_purchase` |
| Source ID | `CGPD:COMP-48ab554f-427e-4642-9419-bc8616c2dc36:be005e65-7f60-4a83-94b5-280884b8a926` |
| Display number | `CGPD-000001` |
| Status | `POSTED` (`status=approved` is retained legacy compatibility) |
| Customer | `CUS-0002 / Mohamed Negm` |
| Company / branch | `COMP-48ab554f-427e-4642-9419-bc8616c2dc36 / BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` |
| Item | one stored item, karat 24, net weight `10.000000` |
| Stored rate/value | `543.2891` / `5432.8910` |
| Asset/barcode | `CGPA-e7b09e18b14e4649bad9101a14` / `GWANK24000001` |
| Accounting | `JE-1787503794404`, debit=`5432.89100000`, credit=`5432.89100000` |
| Customer liability | original=`5432.8910`, settled=`0.0000`, outstanding=`5432.8910` |

## Authority decisions used by E

1. CGP remains the business/source aggregate and owns lifecycle, posted totals, gold evidence, liability, and accounting provenance.
2. The D1 projection is a read-only adapter. It owns neither CGP persistence nor customer, asset, accounting, settlement, or tax truth.
3. Historical gold values are consumed from stored CGP snapshot/source evidence; no live GoldAPI call is made by the adapter.
4. Current CGP has no tax fields; no sale VAT is copied into the projection.
5. The existing `sales.view` permission is reused. Company and branch are derived from authenticated server context; request query/body values are not authority.

