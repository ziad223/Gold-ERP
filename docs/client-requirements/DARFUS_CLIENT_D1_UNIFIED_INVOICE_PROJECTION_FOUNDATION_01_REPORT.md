# DARFUS ERP — D1 Unified Invoice Projection Foundation Report

**Control:** `DARFUS-CLIENT-D1-UNIFIED-INVOICE-PROJECTION-FOUNDATION-01`  
**Project:** `I:\WORK\jewellery-erp-master`  
**Official DB:** `darfus_erp`  
**Runtime:** `http://localhost:8000`  
**Mode:** Minimum safe implementation with read-only runtime proof  

بالعربي: تم تنفيذ أساس إسقاط الفواتير الموحد فقط، مع الحفاظ على مالكي البيانات الماليين الحاليين. الاختبارات المصدرية والمركزة ناجحة، ولم تحدث أي كتابة أعمال في قاعدة `darfus_erp`. إثبات HTTP المصادق عليه لم يُنفذ لأن الجلسة الحالية لا تحتوي على جلسة Browser قابلة لإعادة الاستخدام، وتسجيل الدخول كان سيكتب جلسة تقنية في قاعدة الإنتاج الرسمية. الخطوة التالية هي Owner review ثم جلسة GET مصادق عليها آمنة قبل إغلاق قبول D1 النهائي.

## 1. Executive Summary

D1 added a read-only unified invoice projection foundation over the existing
`Invoice` authority. It does not create a second invoice owner, materialize a
new invoice table, recalculate tax, post accounting, write print events, or
implement CGP/Gift Voucher adapters.

The client document was read completely and visually checked page 1 through
page 8. It contained 143 non-empty paragraphs, no tables, and no embedded
images. The full atomic matrix contains 59 rows.

| Metric | Result |
|---|---:|
| Atomic requirements indexed | 59 |
| `EXACT_MATCH` | 17 |
| `IMPLEMENTED_DIFFERENTLY` | 15 |
| `PARTIAL` | 17 |
| `MISSING` | 6 |
| `UI_ONLY_GAP` | 1 |
| `BACKEND_GAP` | 1 |
| `DATA_CONFIG_GAP` | 2 |
| D1 source files intentionally changed | 4 |
| Migrations | 0 |
| Official DB business writes | 0 |

The complete row-level evidence is in
[DARFUS_CLIENT_D1_INVOICE_REQUIREMENT_MATRIX.md](./DARFUS_CLIENT_D1_INVOICE_REQUIREMENT_MATRIX.md).

## 2. Authority and Read-First Evidence

Business authority:

- `I:\WORK\client-requirements\8- Invoices Search & Print.docx`
- Complete OOXML/text extraction completed.
- LibreOffice visual rendering completed for pages 1–8.
- No table, image, or mockup content was omitted because the document had no
  tables or embedded images.

Current source and DB were used as implementation reality. Existing reports
were used only as supporting evidence. The accepted CGP lifecycle remains
`DRAFT → VALIDATED → POSTED`; D1 does not reopen or replace it.

## 3. Fast Triage and Current Boundary

The pre-change search/print surface was reviewed:

| Area | Current evidence | D1 disposition |
|---|---|---|
| Existing Search & Print UI | `app/[locale]/(dashboard)/sales/search-print/page.tsx` | Preserved; final unified UI remains D2 |
| Existing search types | `features/sales/hooks/use-invoice-search-print.ts` | Five active Invoice adapters registered in D1 |
| Existing backend search | `backend/src/routes/erp.routes.js` search/print block | Preserved; D1 adds a separate projection surface |
| Print event route | `POST /invoices/:id/print-events` | Not called; remains outside D1 read-only scope |
| CGP | Separate aggregate and routes | Extension point only; no adapter in D1 |
| Gift Voucher | Separate liability source | Extension point only; no adapter in D1 |

D1 intentionally does not close the full client Search & Print parity. It
closes the shared projection foundation needed by later D2 and E work.

## 4. Requirement Coverage Summary

The matrix preserves client terminology and splits compound requirements into
atomic rows. Current statuses are evidence-based:

- `EXACT_MATCH`: the D1 read-only contract and current source values match the
  applicable requirement.
- `IMPLEMENTED_DIFFERENTLY`: the same safe read result is available from the
  relational source authority, but event-store reconstruction or another
  client wording differs.
- `PARTIAL`: a source or foundation exists, but final unified UI, complete
  source-family coverage, or another material dimension remains open.
- `MISSING`: no D1 adapter or equivalent client artifact is proven.
- `UI_ONLY_GAP`, `BACKEND_GAP`, and `DATA_CONFIG_GAP` identify the remaining
  gap class without widening D1.

No client requirement was silently marked exact merely because a similarly
named route or model existed.

## 5. D1 Implementation

### 5.1 Projection service

Added:

- `backend/src/services/invoice-projection.service.js`

The service provides:

- an explicit source registry;
- active adapters for `sale`, `return`, `exchange`, `installment`, and
  `deposit`;
- later extension entries for `gift_voucher`,
  `customer_gold_purchase`, `purchase_order`, and `repair`;
- stable source identity `invoice:<sourceType>:<sourceId>`;
- normalized summary and detail mappers;
- source Invoice, InvoiceItem, Payment, Installment, Asset-link, Cash, Journal,
  and JournalLine read links;
- company/branch scope enforcement;
- stable projection error codes;
- no create/update/delete calls and no tax/accounting recalculation.

### 5.2 Read-only API

Added:

- `backend/src/routes/invoice-projection.routes.js`
- route mount in `backend/src/routes/index.js`

Endpoints:

```text
GET /api/v1/invoice-projection/sources
GET /api/v1/invoice-projection/summaries
GET /api/v1/invoice-projection/:sourceType/:sourceId
```

Every endpoint is protected by authentication and canonical `sales.view`.
The route is GET-only. Query/body branch values do not override the
server-authoritative branch context.

Stable error codes:

```text
PROJECTION_UNSUPPORTED_SOURCE_TYPE
PROJECTION_SOURCE_NOT_FOUND
PROJECTION_SOURCE_FORBIDDEN
PROJECTION_SOURCE_MALFORMED
PROJECTION_MAPPING_FAILED
```

### 5.3 Financial and inventory authority

- Summary/detail values map from source Invoice values.
- D1 does not recalculate VAT or derive a taxable base.
- Where historical tax snapshot information is not available,
  `HISTORICAL_DATA_GAP` is returned rather than guessed.
- Payment status comes from the canonical Invoice/Payment sources.
- Accounting links are read-only JournalEntry/JournalLine links.
- Asset identity and `invoice_item_asset_links` are preserved.
- No Product quantity authority is introduced.
- Customer/Supplier party ownership is not duplicated.

## 6. Contract and Extension Points

The normalized contract is documented in
[DARFUS_CLIENT_D1_UNIFIED_INVOICE_CONTRACT.md](./DARFUS_CLIENT_D1_UNIFIED_INVOICE_CONTRACT.md).

Contract decisions:

| Decision | D1 result |
|---|---|
| Projection owns business data | `NO` |
| Duplicate financial authority | `NO` |
| Global fake invoice ID | `NO` |
| Stable source identity | `sourceType + sourceId` |
| CGP adapter | Extension point only |
| D2 search UI | Extension point only |
| D2 final print | Extension point only |
| New invoice table/migration | `NO` |

`displayNumber` is the source invoice number with an ID fallback; it is not
treated as globally unique across source families.

## 7. Runtime Acceptance Evidence

### 7.1 Backend parity

Evidence collected after restarting only the existing backend container to
load the D1 route:

- `GET http://localhost:8000/api/v1/health` → `200`.
- `GET http://localhost:8000/api/v1/health/db` → `200`.
- Docker services: backend running, PostgreSQL healthy, Redis healthy.
- `next-env.d.ts` SHA256 remained
  `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC`.
  No generated-file edit or Next build/dev run was performed.

### 7.2 Direct read-only service scenarios

The existing representative sale Invoice was read through the D1 service
against the running backend container:

```text
sourceId = INV-ID-1787478360975-9vhxi5
projectionReference = invoice:sale:INV-ID-1787478360975-9vhxi5
subtotal = 2377.7862472
tax = 332.8901
total = 2710.6763
asset = AST-PUR-1787085524749-1-1-dww3
payments = 1
accountingLinks = 1
```

Read-only scenario results:

| Scenario | Evidence | Result |
|---|---|---|
| D1-A registry | Five active adapters plus later entries | PASS |
| D1-B summaries | One source row, stable summary and pagination | PASS |
| D1-C known detail | Identity and financial equality, Asset/payment/accounting links | PASS |
| D1-D unknown ID | `PROJECTION_SOURCE_NOT_FOUND`, expected 404 | PASS |
| D1-E unsupported CGP source | `PROJECTION_UNSUPPORTED_SOURCE_TYPE`, expected 422 | PASS |
| D1-F cross-branch/company | `PROJECTION_SOURCE_FORBIDDEN`, expected 403 | PASS |
| D1-G repeated reads | Semantically stable, no DB delta | PASS |
| D1-H route guard | GET-only route, `sales.view` guard, unauthenticated request returns 401 | PASS (static/unauth guard proof) |

### 7.3 Authenticated HTTP limitation

The in-app Browser had no open authenticated tab (`openTabs=[]`). D1 allows
authenticated GET only. The login controller issues a technical session row,
which would be a persistent write to the official `darfus_erp` database.
Because no existing safe session was available, no login or credential POST
was performed.

Therefore:

```text
AUTHENTICATED_HTTP_RUNTIME_PROOF = BLOCKED_NO_SAFE_EXISTING_SESSION
UNAUTHORIZED_HTTP_GUARD_PROOF = PASS
DIRECT_READ_ONLY_SERVICE_PROOF = PASS
```

This is an evidence limitation, not a product failure, and it must not be
reported as authenticated API PASS.

## 8. Focused Tests and Regression Proof

| Check | Command/result |
|---|---|
| D1 focused tests | `node --test backend/tests/d1-unified-invoice-projection.test.cjs` → 6/6 pass |
| Permission catalog coverage | `node --test backend/tests/route-permission-catalog-coverage.test.cjs` → 3/3 pass |
| Existing invoice verifier | `node scripts/verify-invoices-search-print.js` → `verify-invoices-search-print: ok` |
| JavaScript syntax | `node --check` on new service and route → pass |
| TypeScript | `npm run typecheck` → pass |
| Frontend build/dev | Not run; protected by the current guardrail and outside D1 foundation scope |

The focused tests cover registry exactness, stable errors, source identity,
financial equality, Asset/payment/tax evidence, repeated read stability, and
GET-only route mounting.

## 9. Official DB Integrity Proof

`SELECT current_database()` returned `darfus_erp` before and after the D1
runtime reads. No insert/update/delete/truncate/seed/migration was executed.

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
| installments | 0 | 0 | 0 |
| gift_vouchers | 0 | 0 | 0 |
| customer_gold_purchase_documents | 4 | 4 | 0 |
| customer_gold_purchase_items | 4 | 4 | 0 |
| assets | 18 | 18 | 0 |
| inventory_asset_movements | 62 | 62 | 0 |

```text
PROJECTION_READ_BUSINESS_DELTA = 0
D1_DB_BUSINESS_DELTA = 0
UNEXPECTED_ASSET_DELTA = 0
UNEXPECTED_MOVEMENT_DELTA = 0
UNEXPECTED_JOURNAL_DELTA = 0
UNEXPECTED_PERMISSION_DELTA = 0
```

## 10. Files Changed for D1

Intentional D1 implementation files:

1. `backend/src/services/invoice-projection.service.js`
2. `backend/src/routes/invoice-projection.routes.js`
3. `backend/src/routes/index.js` — D1 route import/mount only
4. `backend/tests/d1-unified-invoice-projection.test.cjs`

Intentional D1 documentation artifacts are the seven files named by the D1
control, including this report. The worktree already contained extensive
unrelated historical/client-requirement files and modifications; they were
not cleaned, reset, staged, or attributed to D1.

## 11. Remaining Scope and Risks

The following are intentionally not implemented in D1:

- final unified Search & Print UI;
- Gift Voucher adapter;
- CGP invoice projection adapter;
- event-store lifecycle reconstruction where the current source does not
  expose that history;
- employee filter parity where the current source does not provide a proven
  employee projection;
- client-required print audit behavior;
- final print layout and print workflow;
- any accounting, payment, tax, inventory, or CGP business mutation.

These remain D2/E or owner-decision scope. The matrix records each gap and its
dependency; no gap was hidden by calling the foundation complete product
parity.

## 12. Gate

Foundation implementation and static/read-only direct-service evidence are
complete. The authenticated HTTP acceptance scenarios cannot be honestly
closed without an existing safe session, and creating one would violate the
official DB read-only boundary.

```text
FAST_TRIAGE_COMPLETE = YES
READ_FIRST_COMPLETE = YES
INVOICE_REQUIREMENT_MATRIX_COMPLETE = YES
CGP_ADAPTER_EXTENSION_POINT = YES
CGP_ADAPTER_IMPLEMENTED = NO
D2_SEARCH_EXTENSION_POINT = YES
D2_SEARCH_UI_IMPLEMENTED = NO
D2_PRINT_EXTENSION_POINT = YES
D2_FINAL_PRINT_IMPLEMENTED = NO
MIGRATION_REQUIRED = NO
STABLE_PROJECTION_ERROR_CODES = YES
GLOBAL_ROUTE_PERMISSION_COVERAGE_TEST = PASS
SOURCE_IDENTITY_EQUALITY = PASS
FINANCIAL_PROJECTION_EQUALITY = PASS
PROJECTION_READ_BUSINESS_DELTA = 0
D1_DB_BUSINESS_DELTA = 0
FOCUSED_TESTS = PASS
REGRESSION_TESTS = PASS
TYPECHECK = PASS
BACKEND_RUNTIME_PARITY = PASS
AUTHENTICATED_HTTP_RUNTIME_PROOF = BLOCKED_NO_SAFE_EXISTING_SESSION
P0_COUNT = 0
P1_COUNT = 0
GATE = BLOCKED_D1_AUTHENTICATED_RUNTIME_SESSION_UNAVAILABLE
```

The block is limited to authenticated HTTP runtime evidence. No product,
financial, inventory, security, or database corruption was introduced.

## 13. Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-D1-UNIFIED-INVOICE-PROJECTION-FOUNDATION-01
CURRENT_TRACK = CLIENT_REQUIREMENTS_EXACT_PARITY_AUDIT
MODE = MINIMUM_SAFE_IMPLEMENTATION_WITH_READ_ONLY_RUNTIME_PROOF
CLIENT_DOC_READ_COMPLETELY = YES
ATOMIC_REQUIREMENTS_INDEXED = 59
ACTIVE_INVOICE_ADAPTERS = 5
CGP_ADAPTER_EXTENSION_POINT = YES
CGP_ADAPTER_IMPLEMENTED = NO
D2_SEARCH_EXTENSION_POINT = YES
D2_SEARCH_UI_IMPLEMENTED = NO
D2_PRINT_EXTENSION_POINT = YES
D2_FINAL_PRINT_IMPLEMENTED = NO
MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_BUSINESS_WRITES = 0
PROJECTION_READ_BUSINESS_DELTA = 0
SOURCE_FILES_CHANGED = 3 intentional source paths plus 1 focused test path
TEST_FILES_CHANGED = 1 intentional focused test
TYPECHECK = PASS
FOCUSED_TESTS = PASS
REGRESSION_TESTS = PASS
BACKEND_RUNTIME_PARITY = PASS
AUTHENTICATED_HTTP_RUNTIME_PROOF = BLOCKED_NO_SAFE_EXISTING_SESSION
P0_COUNT = 0
P1_COUNT = 0
GATE = BLOCKED_D1_AUTHENTICATED_RUNTIME_SESSION_UNAVAILABLE
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_SAFE_AUTHENTICATED_GET_ONLY_RUNTIME_ACCEPTANCE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 14. Stop

No D2, E, migration, invoice write, print-event write, CGP mutation, or
official DB write was started automatically.

**D1 implementation stopped at the authenticated read-only runtime evidence gate.**
