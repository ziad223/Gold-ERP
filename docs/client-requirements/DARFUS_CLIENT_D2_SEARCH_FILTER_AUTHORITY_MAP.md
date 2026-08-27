# D2 Search and Filter Authority Map

## Authority

Client authority is I:\WORK\client-requirements\8- Invoices Search & Print.docx. The single runtime search authority is the D1/D2 invoice projection service. The UI does not own invoice, customer, branch, employee, tax, payment, asset, or journal truth.

## Active source registry

| Source type | Source authority | D2 status | Print |
|---|---|---|---|
| sale | invoices.type = sale | SUPPORTED_NOW | canonical invoice print event |
| return | invoices.type = return | SUPPORTED_NOW | canonical invoice print event |
| exchange | invoices.type = exchange | SUPPORTED_NOW | canonical invoice print event |
| installment | invoices.type = installment plus installment rows | SUPPORTED_NOW | canonical invoice print event |
| deposit | invoices.type = deposit | SUPPORTED_NOW | canonical invoice print event |
| customer_gold_purchase | customer_gold_purchase_documents plus CGP read model | SUPPORTED_NOW | projection print authorization |
| gift_voucher | gift_vouchers | SUPPORTED_LATER | not exposed as active |
| purchase_order / repair | separate future source families | NOT_ACTIVE | fail closed |

## Filter map

| Client filter | UI binding | Canonical query | Backend/source authority | Security/validation | Result |
|---|---|---|---|---|---|
| Invoice Number | search input | search | Invoice id or invoiceNumber; CGP id/draftNumber | bounded GET; no client DB access | PASS |
| Customer ID | customerId input | partyId | Invoice.customerId or CGP.customerId | company scoped | PASS |
| Customer Name | customer name input | partyName | Invoice.customerName or Customer authority in CGP | source-owned display value | PASS |
| Date From | date input | dateFrom | invoice.date or CGP.transactionDate | ISO YYYY-MM-DD | PASS |
| Date To | date input | dateTo | same sources, inclusive end of day | ISO YYYY-MM-DD; from <= to | PASS |
| Branch | server context / branch selector | branchId | authenticated req.branchId and Branch | mismatch fails closed; no query override | PASS, implemented differently for branch-scoped accounts |
| Employee | employee input | employee / employeeId | Invoice createdByEmployeeId/finalizedByEmployeeId; CGP createdBy -> User.defaultEmployee | company scoped; no arbitrary display text authority | PASS |
| Invoice Type single | type choice | sourceTypes one value | registry | unsupported/future source fails closed | PASS |
| Invoice Type multi | six checkboxes | sourceTypes CSV/list | registry and source adapters | all values validated | PASS |
| Status | status choice | status | source lifecycle plus explicit derived display status | draft/posted/closed/cancelled/returned | PASS; closed/returned remain derived/source-specific |
| Page | paging control | page | service | min 1 | PASS |
| Page size | page size control | pageSize | service | bounded to 100 | PASS |
| Sort | server-only | createdAt DESC, id DESC; merged source tie-break | projection service | stable, no client order authority | PASS |

## Source functions

- Invoice filters: invoice-projection.service.js listInvoiceSummaries.
- CGP filters: invoice-projection.service.js listCgpSummaries.
- Mixed active source search: invoice-projection.service.js listSummaries.
- Source validation: assertActiveSourceType and normalizeTypeList.
- HTTP read contract: invoice-projection.routes.js GET /sources, GET /summaries, GET /:sourceType/:sourceId.
- Legacy URL: erp.routes.js /invoices/search-print is an adapter delegating to listSummaries; it is not a second ORM search.

## Branch and company rule

The authenticated middleware context is authoritative. A request cannot widen company or branch scope through query parameters. A branch mismatch returns a forbidden scope error. This preserves current RBAC/company/branch authority while satisfying the client filter intent.

## Known deferred boundary

Gift Voucher has no approved active projection/tax/print contract and remains SUPPORTED_LATER. It is not silently included in search results. No new Owner decision was required for D2 because the D2 execution instruction explicitly freezes inactive/future source types as fail-closed.

