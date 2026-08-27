# DARFUS ERP — D2 Final Unified Invoice Search & Print Exact Parity Report

تم تنفيذ نطاق D2 على projection authority الحالية، ونجحت اختبارات المصدر وواجهة البحث AR/EN وفحص قواعد البيانات دون Business writes. الفجوة المتبقية هي Gift Voucher غير المفعّل وbenchmark/cache للبيانات الكبيرة، وهما موثقان صراحةً ولم يتم تزييفهما كـimplemented. خطر قاعدة البيانات المستمرة منخفض ومحصور في سجلات audit المتوقعة لعمليات GET؛ لم تتغير أي سجلات مالية أو مخزون أو فواتير.

## 1. Executive Summary

| Client document | Exact | Different | Partial | Missing | UI gap | Backend gap | Config gap | Conflict | Owner decision | Total atomic | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 8- Invoices Search & Print.docx | 37 | 14 | 5 | 1 | 0 | 0 | 2 | 0 | 0 | 59 | PARTIAL_FULL_CLIENT_SCOPE / PASS_ACTIVE_D2_SCOPE |

The counts are derived from DARFUS_CLIENT_D2_FINAL_INVOICE_REQUIREMENT_MATRIX.md. D2's exact active scope is the six-source contract: sale, return, exchange, installment, deposit, customer_gold_purchase. Gift Voucher remains explicitly SUPPORTED_LATER as required by the execution boundary; no unsupported match claim is made.

## 2. Client authority and coverage

- Source document: I:\WORK\client-requirements\8- Invoices Search & Print.docx.
- The DOCX was read completely, including all eight pages, tables, examples, and layout-relevant content.
- The 59 D1 atomic rows were re-evaluated; no compound client paragraph was silently merged.
- D1 and E reports were used only as supporting design/evidence context. Current source, DB, and authenticated runtime were rechecked.
- Inventory Count remains closed and was not reopened.

## 3. D2 source and authority result

The source registry is authoritative for active/future classification. Active sources expose one stable projection identity, one source link, source-owned financial values, tax snapshot evidence, payment evidence, and Asset/Barcode links where applicable. The CGP adapter remains a read-only projection over CGP, not a generic Invoice or a second posting owner.

D2 result: PASS for six active source families. Gift Voucher is not active because no complete source/tax/print contract was proven. Purchase Order and Repair remain future extension points.

## 4. Search and filters

The unified UI uses GET /api/v1/invoice-projection/summaries and GET /api/v1/invoice-projection/:sourceType/:sourceId. It presents:

- Invoice Number/search
- Customer ID and Customer Name
- Branch
- Date From and Date To
- Employee
- single/multi Invoice Type
- Draft, Posted, Closed, Cancelled, Returned

The server enforces company/branch scope, validates source types/status/date format, bounds page size to 100, and applies stable createdAt DESC/id DESC ordering. The old /invoices/search-print URL is only a compatibility adapter that delegates to the same projection service. There is no duplicate search ORM or financial authority.

Closed and Returned are explicit display/source mappings; they are not a new lifecycle schema. No client wording caused an unsafe status-model change.

## 5. Detail and reconstruction

Row click opens canonical projection detail. Detail preserves:

- source and display identity
- customer/branch/employee evidence
- Invoice lines and stored financial values
- payment and accounting links
- Asset ID and Barcode identity
- CGP gold purchase stored evidence, including net weight, karat/rate fields where present
- source-specific extension data

No formula is recomputed in the search/detail surface. Missing historical evidence remains null/explicit; it is not invented.

The implementation is IMPLEMENTED_DIFFERENTLY for event-store wording: current DARFUS source authority is relational source rows plus existing links/history, not a newly invented event store. This is a documented authority-preserving difference.

## 6. Print contract and layout

The active print contract is proven statically and by focused tests. Invoice sources use the existing canonical invoice print-event endpoint. CGP uses a projection print authorization route that writes audit authorization only and does not create a generic Invoice.

AR and EN use the existing invoice rendering templates and the D2 print view model. Stored amounts and CGP evidence are displayed; no VAT/tax/gold/accounting recalculation is performed. Reprint requires a reason and cannot create a new invoice.

No Print click was made on darfus_erp. Therefore PRINT_RUNTIME_POST is NOT_RUN_READ_ONLY_GUARDRAIL, not a false runtime PASS. D2 permits this when a read-only contract proof is sufficient and mutation is not required. Official invoice_print_events remained zero.

## 7. Focused tests and static proof

- node --test backend/tests/d1-unified-invoice-projection.test.cjs: PASS, 7/7.
- node --test backend/tests/e-cgp-invoice-projection.test.cjs: PASS, 3/3.
- node --test tests/d2-final-invoice-search-print.test.cjs: PASS, 5/5.
- Combined D1 + E + D2: PASS, 15/15.
- npm run verify:invoices-search-print: PASS.
- npm run typecheck: PASS.
- node --check for D2 backend route/service files: PASS.
- No migration was created or executed.
- Backend was rebuilt; health, db, and redis were all 200.
- Next build was not run because owner/AGENTS next-env.d.ts protection is active; the current generated drift was not edited or reverted.

## 8. Browser and network proof

### English

http://localhost:3000/en/sales/search-print loaded in LTR. All six active type controls were visible, Employee was enabled, two rows loaded, and View opened canonical CGP detail with Asset/Barcode evidence. Browser console errors and warnings were empty.

### Arabic

http://localhost:3000/ar/sales/search-print loaded in RTL. Arabic labels and the same six type controls were visible, Employee was enabled, two rows loaded, and View opened the same canonical CGP detail. Browser console errors and warnings were empty.

### Network

- GET /api/v1/health = 200.
- GET /api/v1/health/db = 200.
- GET /api/v1/health/redis = 200.
- GET /api/v1/invoice-projection/sources = 200 in authenticated runtime evidence.
- GET /api/v1/invoice-projection/summaries with all six active source types = initial 200, browser revalidation 304.
- GET CGP detail = 200.
- No receive, invoice-create, payment, journal, asset, barcode, movement, or print POST was sent by the D2 browser proof.

## 9. Official DB integrity

Official identity was rechecked as darfus_erp/postgres. Before/after business counts were unchanged:

- invoices 1 -> 1
- invoice_items 1 -> 1
- invoice_item_asset_links 1 -> 1
- payments 1 -> 1
- journal_entries 25 -> 25
- journal_lines 67 -> 67
- assets 18 -> 18
- inventory_asset_movements 62 -> 62
- invoice_print_events 0 -> 0
- idempotency_requests 100 -> 100

audit_logs moved 140 -> 152 because D2 search is intentionally audited. This is reported as EXPECTED_READ_AUDIT, not hidden as zero total DB writes. No accounting, inventory, invoice, payment, print-event, or idempotency business delta occurred.

## 10. Source/worktree safety

- HEAD: 1657b0e9ba580faef69be48f04637835c201b521.
- Worktree was already dirty before D2; unrelated changes were preserved.
- The owner-accepted next-env.d.ts generated drift hash remained unchanged and was not edited.
- No git reset, restore, clean, stash, commit, or push.
- Product/source files intentionally associated with D2: 10.
- Focused test files intentionally associated with D2: 3.
- Eight D2 report artifacts created.
- Migrations created/executed: 0.

## 11. Remaining risks and safe disposition

| Risk | Severity | Disposition |
|---|---|---|
| Gift Voucher not active in unified projection/print | P2 / client-scope gap | Separate source/tax/print contract before activation; no fake enablement |
| No large-dataset cache/benchmark proof | P2 / data-config gap | Benchmark with representative data under a future approved gate |
| Print POST not run on official DB | P3 / read-only boundary | Static route/permission/layout proof is complete; do not mutate official without a named gate |
| Next build not run | P3 / owner guardrail | Typecheck and runtime parity passed; do not touch next-env drift |

No P0 or P1 defect was introduced by D2.

## 12. Required artifacts

1. DARFUS_CLIENT_D2_FINAL_INVOICE_REQUIREMENT_MATRIX.md
2. DARFUS_CLIENT_D2_SEARCH_FILTER_AUTHORITY_MAP.md
3. DARFUS_CLIENT_D2_PRINT_CONTRACT.md
4. DARFUS_CLIENT_D2_IMPLEMENTATION_BOUNDARY.md
5. DARFUS_CLIENT_D2_BROWSER_SEARCH_ACCEPTANCE.md
6. DARFUS_CLIENT_D2_PRINT_ACCEPTANCE.md
7. DARFUS_CLIENT_D2_DB_INTEGRITY_PROOF.md
8. DARFUS_CLIENT_D2_FINAL_INVOICE_SEARCH_PRINT_EXACT_PARITY_01_REPORT.md

## 13. Final tokens

CURRENT_CONTROL = DARFUS-CLIENT-D2-FINAL-INVOICE-SEARCH-PRINT-EXACT-PARITY-01
CURRENT_TRACK = CLIENT_REQUIREMENTS_EXACT_PARITY
MODE = IMPLEMENTATION_AND_EXACT_PARITY_ACCEPTANCE
CLIENT_DOCUMENT = 8- Invoices Search & Print.docx
CLIENT_DOCUMENT_READ_COMPLETELY = YES
D1_ATOMIC_ROWS_REEVALUATED = 59
ACTIVE_SOURCE_TYPES = sale, return, exchange, installment, deposit, customer_gold_purchase
FUTURE_INACTIVE_SOURCE_TYPES = gift_voucher, purchase_order, repair
D2_SEARCH_GET_ONLY = PASS
D2_DETAIL_GET_ONLY = PASS
D2_FILTER_MATRIX = PASS
D2_EMPLOYEE_FILTER = PASS
D2_COMPANY_BRANCH_SCOPE = PASS
D2_STABLE_BOUNDED_PAGING = PASS
D2_DETAIL_ASSET_BARCODE_IDENTITY = PASS
D2_NO_FINANCIAL_RECALCULATION = PASS
D2_PRINT_CONTRACT = PASS_STATIC
D2_PRINT_LAYOUT_AR_EN = PASS
D2_PRINT_RUNTIME_POST = NOT_RUN_READ_ONLY_GUARDRAIL
D2_DISPOSABLE_ACCEPTANCE = NOT_NEEDED_FOR_READ_ONLY_D2
D2_AR_BROWSER = PASS
D2_EN_BROWSER = PASS
D2_NETWORK = PASS
D2_CONSOLE = PASS
D2_OFFICIAL_DB_IDENTITY = darfus_erp
D2_OFFICIAL_DB_BUSINESS_WRITES = 0
D2_OFFICIAL_DB_TOTAL_AUDIT_SIDE_EFFECT = +12_EXPECTED_READ_AUDIT
D2_BUSINESS_DB_DELTA = 0
D2_FINANCIAL_DB_DELTA = 0
D2_INVENTORY_DB_DELTA = 0
D2_PRINT_EVENT_DELTA = 0
D2_IDEMPOTENCY_DELTA = 0
D2_FOCUSED_TESTS = PASS_15_OF_15
D2_VERIFIER = PASS
D2_TYPECHECK = PASS
D2_BACKEND_RUNTIME = PASS_HEALTH_DB_REDIS_200
D2_FRONTEND_BUILD = NOT_RUN_OWNER_ACCEPTED_NEXT_ENV_GUARDRAIL
D2_MIGRATIONS_CREATED = 0
D2_MIGRATIONS_EXECUTED = 0
D2_SOURCE_FILES_CHANGED = 10_INTENTIONAL_D2_SCOPE
D2_TEST_FILES_CHANGED = 3_INTENTIONAL_D2_SCOPE
D2_REPORT_FILES_CREATED = 8
D2_P0_COUNT = 0
D2_P1_COUNT = 0
D2_P2_COUNT = 2
D2_P3_COUNT = 2
D2_GATE = PASS_CLIENT_D2_FINAL_INVOICE_SEARCH_PRINT_EXACT_PARITY
NEXT_RECOMMENDED_STEP = CLIENT_CRM_IMPLEMENTATION_ROADMAP
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

## 14. Gate

PASS_CLIENT_D2_FINAL_INVOICE_SEARCH_PRINT_EXACT_PARITY

The PASS applies to the D2 active six-source scope, with Gift Voucher and performance/cache requirements remaining explicitly classified and deferred. It does not authorize CRM implementation or official print mutation.

STOP after Owner review.

