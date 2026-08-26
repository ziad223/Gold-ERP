# DARFUS ERP — D1 Invoice Source Authority Map

Control: `DARFUS-CLIENT-D1-UNIFIED-INVOICE-PROJECTION-FOUNDATION-01`

## Read-first boundary

This inventory was captured before the D1 source change. It describes the
current source authorities; the projection introduced by D1 is a read model
and never becomes a source owner.

## Current source-document inventory

| Source type | Business module | Source table / identity | Display number | Date / scope | Party source | Financial authority | Payment / accounting links | Current read / print surface | D1 classification |
|---|---|---|---|---|---|---|---|---|---|
| `sale` | POS / Sales | `invoices.id` | `invoices.invoice_number`, fallback `id` | `date`, `company_id`, `branch_id` | `customer_id`, `customer_name` stored on Invoice; Customer remains party owner | `subtotal`, `discount`, `tax`, `total`, `vat_rate` on the posted Invoice; no D1 recalculation | `payments.invoice_id`; `cash_transactions.reference = invoice.id`; `journal_entries.source_type = invoice`, `source_id = invoice.id`; `invoice_item_asset_links` | `GET /invoices/search-print`; existing read-only detail and print templates | `SUPPORTED_NOW` |
| `return` | Sales Returns | `invoices.id`, `type = return` | invoice number, fallback `id` | Invoice scope fields | Customer fields on Invoice | Invoice source amounts and lifecycle fields | `related_invoice_id`, payment/cash/journal/source links when present | Existing Invoice search/detail/return surfaces | `SUPPORTED_NOW` |
| `exchange` | Sales Exchange | `invoices.id`, `type = exchange` | invoice number, fallback `id` | Invoice scope fields | Customer fields on Invoice | Invoice source amounts; exchange display enrichment is separate and read-only | `related_invoice_id`, exchange display, payment/cash/journal links when present | Existing exchange display, search/detail and print surfaces | `SUPPORTED_NOW` |
| `installment` | Sales Installments | `invoices.id`, `type = installment`; schedules in `installments.invoice_id` | invoice number, fallback `id` | Invoice scope fields | Customer fields on Invoice | Invoice source amounts; installment schedule is a related source | `payments`, `installments`, cash/journal links when present | Existing invoice/installment pages and print model | `SUPPORTED_NOW` |
| `deposit` | Sales Deposit | `invoices.id`, `type = deposit` | invoice number, fallback `id` | Invoice scope fields | Customer fields on Invoice | Invoice source amounts and lifecycle fields | payment/cash/journal links when present | Existing invoice/deposit pages and print model | `SUPPORTED_NOW` |
| `gift_voucher` | Gift Voucher | `gift_vouchers.id` | `code` | `issue_date`, `company_id`, branch text only | `customer_id`, `customer_name` | Voucher value/balance; it is a liability workflow, not an Invoice row | Posting service may link journals; current GET does not expose a client invoice projection | `GET /gift-vouchers`, `GET /gift-vouchers/:code`; issue/redeem write routes are disabled | `SUPPORTED_LATER` |
| `customer_gold_purchase` | CGP | `customer_gold_purchase_documents.id` | `draft_number` / posting reference where available | `transaction_date`, `company_id`, `branch_id` | `customer_id` and Customer authority | CGP aggregate and posting consumers own gold/accounting values | CGP posting/event/accounting/settlement links | `GET /cgp/drafts/:id` and CGP business-view routes | `SUPPORTED_LATER` (future E adapter) |
| `purchase_order` | Supplier / Purchasing | `purchase_orders.id` | PO id / supplier document fields | `date`, `company_id`, `branch_id` | `supplier_id`, `supplier_name` | Purchase order tax snapshot and payable/accounting authority | purchase-order item/asset/origin/movement/payable/journal links | Purchase-order read routes | `NOT_AN_INVOICE` for the client Sales family; mapped for future source coverage |
| `repair` | Repair / Sales-adjacent | `invoices.id`, `type = repair` | invoice number, fallback `id` | Invoice scope fields | Customer fields on Invoice | Invoice source if rows exist | source links where present | Generic Invoice source; not listed in the client document | `NOT_AN_INVOICE` |

## Frozen D1 ownership rules

- `sourceType + sourceId` is the immutable projection identity. The
  projection reference is namespaced metadata, never a replacement invoice ID.
- `displayNumber` is a display value and is not assumed globally unique.
- Posted Invoice financial values are copied as source values. D1 does not
  calculate tax, totals, payment state, COGS, or journal values.
- `InvoiceItem.assetId` and the read-only `invoice_item_asset_links` rows remain
  visible; the projection never collapses a physical Asset into an aggregate.
- Customer and Supplier remain the party authorities. Employee attribution is
  mapped only where the source actually stores an Employee reference.
- Company and branch scope are enforced by the authenticated server context;
  client query/body scope is not trusted.

## Pre-change boundary record

| Boundary | D1 decision |
|---|---|
| Target requirement IDs | D1-INV-001 through D1-INV-032; client Invoice Search & Print rows in the companion matrix |
| Exact gap | No stable registry/adapter/canonical summary-detail GET contract across current invoice-like sources; current Search & Print is a partial Invoice-only UI/API |
| Root cause | Current source ownership is distributed and the existing route returns raw Invoice rows rather than a stable read model |
| Files expected to change | `backend/src/services/invoice-projection.service.js`; `backend/src/routes/invoice-projection.routes.js`; `backend/src/routes/index.js`; `backend/tests/d1-unified-invoice-projection.test.cjs`; seven D1 documentation artifacts |
| Files forbidden to change | source document models, POS/checkout/return/accounting/tax/CGP business services, migrations, frontend Search & Print UI, print templates, `.env`, official DB |
| DB schema change expected | `NO` |
| Business-logic change expected | `NO`; read-only mapping and permission boundary only |
| Accounting impact | `NO`; source links only, no journal writes or recalculation |
| Inventory impact | `NO`; Asset references are read-only |
| Security impact | `NO` weakening; new GET endpoints use existing `sales.view` business permission and authenticated company/branch scope |
| Idempotency impact | `NO`; GET projection reads do not claim or create idempotency records |

## Evidence anchors

- Current route: `backend/src/routes/erp.routes.js`, Phase 31.4 Search & Print
  block around `/invoices/search-print`.
- Current Invoice authority: `backend/src/models/invoice.model.js` and
  `backend/src/models/invoiceItem.model.js`.
- Current payment and accounting links: `payment.model.js`,
  `cashTransaction.model.js`, `journalEntry.model.js`, and the official DB
  `payments`, `cash_transactions`, `journal_entries` rows.
- Current physical identity link: official DB table
  `invoice_item_asset_links` plus `InvoiceItem.assetId`.
- Client authority: `I:/WORK/client-requirements/8- Invoices Search & Print.docx`,
  read completely and visually checked page 1 through page 8 before D1 edits.

