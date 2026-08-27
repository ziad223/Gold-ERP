# D2 Print Acceptance

## Required active print set

Sales, Return, Exchange, Installment, Deposit, and Customer Gold Purchase are represented in the active D2 source registry. Gift Voucher is deliberately SUPPORTED_LATER and is not presented as active.

## Source proof

- Invoice print path remains POST /api/v1/invoices/:id/print-events under the canonical sales official-print/reprint policy.
- CGP print path is POST /api/v1/invoice-projection/customer_gold_purchase/:id/print-events and records an audit authorization without converting CGP into a generic Invoice.
- The UI calls the source-specific canonical route after detail loading. It does not create a new invoice.
- Reprint reason and official-before-reprint conditions are enforced server-side.
- Print view data comes from projection/detail and stored evidence; no tax, total, gold rate, or accounting recalculation is performed.

## Read-only acceptance result

The D2 browser journey opened detail in AR and EN and did not click Print. This was intentional because the official persistent database is not a disposable mutation target in this control. No print POST was sent. Official invoice_print_events remained 0. No new invoice, payment, journal, asset, barcode, movement, or idempotency row was created.

A disposable clone existed and was verified by current_database = darfus_e_cgp_invoice_projection_01, but no usable clone credential was available for an authenticated print mutation. No further credential guessing and no mutation were attempted. D2 allows a read-only print contract gate when mutation is not required; this is recorded explicitly.

## Gate values

PRINT_ROUTE_STATIC = PASS
PRINT_PERMISSION_STATIC = PASS
PRINT_REPRINT_CONTRACT = PASS
PRINT_LAYOUT_SOURCE_PARITY = PASS
PRINT_RUNTIME_POST = NOT_RUN_READ_ONLY_GUARDRAIL
DISPOSABLE_PRINT_ACCEPTANCE = NOT_NEEDED_FOR_READ_ONLY_D2
NEW_INVOICE_ON_REPRINT = NO

