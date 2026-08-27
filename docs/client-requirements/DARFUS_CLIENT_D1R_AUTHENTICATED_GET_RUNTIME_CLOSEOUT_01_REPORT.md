# DARFUS ERP — D1R Authenticated GET-Only Runtime Closeout Report

Control ID: DARFUS-CLIENT-D1R-AUTHENTICATED-GET-RUNTIME-CLOSEOUT-01  
Project: I:\WORK\jewellery-erp-master  
Main backend: http://localhost:8000  
Disposable backend: http://localhost:8001  
Official DB: darfus_erp  
Mode: AUTHENTICATED_GET_ONLY_RUNTIME_ACCEPTANCE

بالعربي: تم إغلاق إثبات HTTP المصادق عليه لمسارات D1 من خلال Clone منفصل. لم يتم إرسال Login أو Logout أو أي طلب كتابة إلى darfus_erp. كل الجلسات الاصطناعية والكتابات التقنية حدثت داخل Clone فقط. الاختبارات المطلوبة نجحت، وقاعدة الإنتاج الرسمية بقيت دون أي تغيير.

## 1. Objective and Boundary

This control closed the only missing D1 acceptance item:

AUTHENTICATED_HTTP_RUNTIME_PROOF = PASS

No D1 source redesign, frontend work, E implementation, D2 implementation,
invoice mutation, print-event write, migration, seed, or production action was
performed.

## 2. Fast Triage

| Check | Evidence | Result |
|---|---|---|
| Main backend health | GET http://localhost:8000/api/v1/health → 200 | PASS |
| Main D1 route freshness | Unauthenticated GET /api/v1/invoice-projection/sources → 401 UNAUTHORIZED | PASS |
| Browser session inspection | In-app Browser returned no open tabs/session | No safe main session |
| Official DB identity | SELECT current_database() → darfus_erp | PASS |
| Official baseline | Counts captured before and after this control | PASS |

FAST_TRIAGE_COMPLETE = YES  
AUTH_PATH = DISPOSABLE_AUTH_SESSION

No login request was sent to the main backend.

## 3. Authentication Path and Runtime Isolation

No reusable authenticated main session existed. The authorized fallback was
used:

1. Read-only custom dump of darfus_erp.
2. New disposable database: darfus_d1_invoice_projection_01.
3. Disposable backend on port 8001 with explicit DB_NAME=darfus_d1_invoice_projection_01.
4. SELECT current_database() from the disposable backend returned exactly darfus_d1_invoice_projection_01 before synthetic authentication.
5. Synthetic authentication/session rows were created only in the Clone.

The dump was non-empty and verified:

DUMP_BYTES = 796462  
DUMP_SHA256 = B0A6A7C1EDB98505329108A111EF099645DDDA88EE17E2FE4023F6CB2BCF8593

No password, access token, refresh token, cookie, or authorization header is
included in this report.

## 4. Runtime Freshness

| Runtime | Check | Status |
|---|---|---:|
| Main :8000 | Health | 200 |
| Main :8000 | Unauthenticated D1 sources | 401 |
| Disposable :8001 | Health | 200 |
| Disposable :8001 | DB health | 200 |
| Disposable :8001 | Unauthenticated D1 sources | 401 |

MAIN_ROUTE_FRESHNESS = PASS  
DISPOSABLE_RUNTIME_DB_TARGET = darfus_d1_invoice_projection_01

## 5. Acceptance Source

An existing copied source invoice was used; no invoice was created:

| Field | Value |
|---|---|
| Source type | sale |
| Source ID | INV-ID-1787478360975-9vhxi5 |
| Display number | INV-2026-000001 |
| Company | COMP-48ab554f-427e-4642-9419-bc8616c2dc36 |
| Branch | BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c |
| Customer | CUS-0001 |
| Asset link | AST-PUR-1787085524749-1-1-dww3 |

## 6. Authenticated Network Evidence

All requests below were actual HTTP GET requests through the disposable
backend using a disposable authenticated session. Credentials and tokens are
omitted.

| Method | Path | Status | Result |
|---|---|---:|---|
| GET | /api/v1/invoice-projection/sources | 200 | Five active adapters and future extension metadata |
| GET | /api/v1/invoice-projection/summaries | 200 | One normalized source summary |
| GET | /api/v1/invoice-projection/sale/INV-ID-1787478360975-9vhxi5 | 200 | Detail returned |
| GET | /api/v1/invoice-projection/customer_gold_purchase/CGP-D1R-NONMUTATING | 422 | PROJECTION_UNSUPPORTED_SOURCE_TYPE |
| GET | /api/v1/invoice-projection/sale/D1R-SYNTHETIC-NONEXISTENT | 404 | PROJECTION_SOURCE_NOT_FOUND |
| GET | /api/v1/invoice-projection/sources with outside company header | 403 | COMPANY_SCOPE_INVALID, fail-closed |
| GET | known detail repeated | 200 | Semantically identical response |

AUTHENTICATED_SOURCES_GET = 200/PASS  
AUTHENTICATED_SUMMARIES_GET = 200/PASS  
AUTHENTICATED_DETAIL_GET = 200/PASS  
UNSUPPORTED_SOURCE_GET = PASS  
UNKNOWN_SOURCE_GET = PASS  
SCOPE_FAIL_CLOSED = PASS  
AUTHENTICATED_NETWORK_EVIDENCE = PASS

The scope-negative request was rejected by the canonical authentication
middleware before projection mapping because the selected company was outside
the available scope. This is the required fail-closed outcome; no RBAC was
changed.

## 7. Source Identity Equality

The authenticated detail response matched the copied canonical Invoice row:

| Field | Projection | Canonical source | Result |
|---|---|---|---|
| source type | sale | invoices.type=sale | Equal |
| source ID | INV-ID-1787478360975-9vhxi5 | invoices.id | Equal |
| projection reference | invoice:sale:INV-ID-1787478360975-9vhxi5 | D1 contract | Equal |
| display number | INV-2026-000001 | invoices.invoice_number | Equal |
| company | COMP-48ab554f-427e-4642-9419-bc8616c2dc36 | invoices.company_id | Equal |
| branch | BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c | invoices.branch_id | Equal |
| party | CUS-0001 | invoices.customer_id | Equal |
| Asset | AST-PUR-1787085524749-1-1-dww3 | invoice_item_asset_links.asset_id | Equal |

SOURCE_IDENTITY_EQUALITY = PASS

## 8. Financial Projection Equality

No tax was recalculated. The response mapped the source values:

| Value | Projection | Source | Result |
|---|---:|---:|---|
| Subtotal | 2377.7862472 | 2377.7862472 | Equal |
| Discount | 0 | 0 | Equal |
| Tax | 332.8901 | 332.8901 | Equal |
| Total | 2710.6763 | 2710.6763 | Equal |

The detail also returned one Asset link, one payment row, and one accounting
link. The accounting link was balanced in the source projection.

FINANCIAL_PROJECTION_EQUALITY = PASS

## 9. Repeated GET Stability

The known detail endpoint was called twice with the same authenticated
read-only context:

FIRST_STATUS = 200  
SECOND_STATUS = 200  
SEMANTIC_RESPONSE_EQUALITY = PASS  
REPEATED_GET_STABILITY = PASS

No projection endpoint performs idempotency writes, audit business writes, or
invoice/business mutations.

## 10. Official DB Before/After Proof

The main runtime received no login, logout, or business request in this
control. The official database remained darfus_erp; its current snapshot
matched the preflight baseline:

| Table | Before | After | Delta |
|---|---:|---:|---:|
| invoices | 1 | 1 | 0 |
| invoice_items | 1 | 1 | 0 |
| invoice_item_asset_links | 1 | 1 | 0 |
| payments | 1 | 1 | 0 |
| cash_transactions | 7 | 7 | 0 |
| journal_entries | 25 | 25 | 0 |
| journal_lines | 67 | 67 | 0 |
| audit_logs | 140 | 140 | 0 |
| idempotency_requests | 100 | 100 | 0 |
| assets | 18 | 18 | 0 |
| inventory_asset_movements | 62 | 62 | 0 |
| customer_gold_purchase_documents | 4 | 4 | 0 |
| customer_gold_purchase_items | 4 | 4 | 0 |
| technical_account_sessions | 107 | 107 | 0 |

OFFICIAL_SESSION_WRITES = 0  
OFFICIAL_BUSINESS_WRITES = 0  
OFFICIAL_DB_WRITES = 0

## 11. Disposable DB Proof

The disposable Clone was the only mutation target:

| Table | Restored baseline | After GET acceptance | Delta |
|---|---:|---:|---:|
| invoices | 1 | 1 | 0 |
| invoice_items | 1 | 1 | 0 |
| payments | 1 | 1 | 0 |
| cash_transactions | 7 | 7 | 0 |
| journal_entries | 25 | 25 | 0 |
| journal_lines | 67 | 67 | 0 |
| audit_logs | 140 | 140 | 0 |
| idempotency_requests | 100 | 100 | 0 |
| assets | 18 | 18 | 0 |
| inventory_asset_movements | 62 | 62 | 0 |
| technical_account_sessions | 107 | 110 | +3 technical session rows |

DISPOSABLE_AUTH_TECHNICAL_DELTA = +3 technical session rows  
DISPOSABLE_BUSINESS_DELTA = 0

The three disposable session rows are authentication fixtures only. No
disposable invoice, payment, Asset, movement, journal, or idempotency business
row was created.

## 12. Source and Frontend Scope

D1_SOURCE_CHANGE = NO  
NEW_FRONTEND_WORK = NO  
E_IMPLEMENTATION = NO  
D2_IMPLEMENTATION = NO  
MIGRATIONS = 0

No source file or test file was changed in D1R. The existing D1 implementation
was not reimplemented.

## 13. Gate

All D1R acceptance conditions passed:

FAST_TRIAGE_COMPLETE = YES  
MAIN_ROUTE_FRESHNESS = PASS  
AUTHENTICATED_SOURCES_GET = 200/PASS  
AUTHENTICATED_SUMMARIES_GET = 200/PASS  
AUTHENTICATED_DETAIL_GET = 200/PASS  
UNSUPPORTED_SOURCE_GET = PASS  
UNKNOWN_SOURCE_GET = PASS  
SCOPE_FAIL_CLOSED = PASS  
AUTHENTICATED_NETWORK_EVIDENCE = PASS  
SOURCE_IDENTITY_EQUALITY = PASS  
FINANCIAL_PROJECTION_EQUALITY = PASS  
REPEATED_GET_STABILITY = PASS  
OFFICIAL_SESSION_WRITES = 0  
OFFICIAL_BUSINESS_WRITES = 0  
OFFICIAL_DB_WRITES = 0  
DISPOSABLE_BUSINESS_DELTA = 0  
D1_SOURCE_CHANGE = NO  
NEW_FRONTEND_WORK = NO  
P0 = 0  
P1 = 0  
AUTHENTICATED_HTTP_RUNTIME_PROOF = PASS  
UNIFIED_INVOICE_PROJECTION_FOUNDATION = CLOSED  
GATE = PASS_CLIENT_D1_UNIFIED_INVOICE_PROJECTION_FOUNDATION

## 14. Final Tokens

CURRENT_CONTROL = DARFUS-CLIENT-D1R-AUTHENTICATED-GET-RUNTIME-CLOSEOUT-01  
MODE = AUTHENTICATED_GET_ONLY_RUNTIME_ACCEPTANCE  
FAST_TRIAGE_COMPLETE = YES  
AUTH_PATH = DISPOSABLE_AUTH_SESSION  
MAIN_ROUTE_FRESHNESS = PASS  
AUTHENTICATED_SOURCES_GET = 200/PASS  
AUTHENTICATED_SUMMARIES_GET = 200/PASS  
AUTHENTICATED_DETAIL_GET = 200/PASS  
UNSUPPORTED_SOURCE_GET = PASS  
UNKNOWN_SOURCE_GET = PASS  
SCOPE_FAIL_CLOSED = PASS  
AUTHENTICATED_NETWORK_EVIDENCE = PASS  
SOURCE_IDENTITY_EQUALITY = PASS  
FINANCIAL_PROJECTION_EQUALITY = PASS  
REPEATED_GET_STABILITY = PASS  
OFFICIAL_DB = darfus_erp  
OFFICIAL_SESSION_WRITES = 0  
OFFICIAL_BUSINESS_WRITES = 0  
OFFICIAL_DB_WRITES = 0  
DISPOSABLE_AUTH_TECHNICAL_DELTA = +3  
DISPOSABLE_BUSINESS_DELTA = 0  
NEW_FRONTEND_WORK = NO  
D1_SOURCE_CHANGE = NO  
P0 = 0  
P1 = 0  
P2 = 0  
P3 = 0  
AUTHENTICATED_HTTP_RUNTIME_PROOF = PASS  
UNIFIED_INVOICE_PROJECTION_FOUNDATION = CLOSED  
GATE = PASS_CLIENT_D1_UNIFIED_INVOICE_PROJECTION_FOUNDATION  
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

## 15. Stop

The disposable backend was used only for this GET-only proof. No D1
reimplementation, E/D2 start, invoice mutation, CGP mutation, print-event
write, migration, or official DB write was started.

**D1R authenticated runtime closeout complete → Owner review → stop.**
