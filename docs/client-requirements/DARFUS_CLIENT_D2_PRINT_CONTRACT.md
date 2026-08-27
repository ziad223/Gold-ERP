# D2 Print Contract

## Client requirements

The client document requires print outputs for Sales, Return, Exchange, Installment, Deposit, Gift Voucher, and Customer Gold Purchase. D2 closes the active six-source contract and keeps Gift Voucher explicitly inactive.

## Contract

| Operation | Route | Authority | Writes | D2 result |
|---|---|---|---|---|
| Open invoice detail | GET /api/v1/invoice-projection/:sourceType/:sourceId | canonical projection/source rows | none | PASS |
| Search | GET /api/v1/invoice-projection/summaries | projection service | expected search audit only | PASS |
| Official/reprint for Invoice source | POST /api/v1/invoices/:id/print-events | existing canonical invoice print-event policy | print-event/audit boundary only | statically verified; not invoked in this read-only acceptance |
| Official/reprint for CGP | POST /api/v1/invoice-projection/customer_gold_purchase/:id/print-events | CGP projection adapter plus sales official-print permission | audit authorization only; no generic Invoice owner | statically verified; not invoked in this read-only acceptance |
| Gift Voucher print | no active route | future source contract | none | NOT ACTIVE / no fake enablement |

## Permission and lifecycle

- Authenticated access plus sales.view is required for search/detail.
- Official/reprint is guarded by the existing sales official-print/reprint policy.
- Reprint requires a reason.
- An official print cannot be authorized twice.
- A reprint cannot precede an official authorization.
- Print authorization does not create a new invoice, payment, journal, asset, or inventory movement.
- CGP print authorization records audit evidence because CGP is not an Invoice row and must not be given a second financial owner.

## Layout authority

The print view model consumes canonical projection/detail data and stored CGP evidence. It does not recompute totals, VAT, gold rate, purchase value, or accounting. Existing invoice templates remain the rendering authority. AR and EN labels are selected by the existing locale-aware template path. No legal, tax, or customer fields were invented.

## Runtime safety result

No Print button was clicked on the official database in D2. The official database showed invoice_print_events = 0 before and after the controlled read-only journey. The print route and permission contract are covered by source inspection and focused tests. Disposable clone mutation was not needed for this read-only D2 gate; no clone credential was used or guessed further.

PRINT_EVENT_STATIC_CONTRACT = PASS
PRINT_EVENT_RUNTIME_MUTATION = NOT_RUN_READ_ONLY_GUARDRAIL
REPRINT_CREATES_NEW_INVOICE = NO

