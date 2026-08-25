# DARFUS ERP — Client Requirements Exact Parity Audit V2

## Executive Summary

| Client Document | Exact | Different | Partial | Missing | UI Gap | Backend Gap | Config Gap | Conflict | Owner Decision | Total Atomic | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 8- Employees.docx | 1 | 9 | 10 | 12 | 1 | 3 | 0 | 0 | 1 | 37 | PARTIAL |
| 8- Invoices Search & Print.docx | 14 | 8 | 4 | 0 | 2 | 4 | 0 | 0 | 0 | 32 | PARTIAL |
| الباركود.docx | 25 | 11 | 3 | 0 | 0 | 0 | 0 | 3 | 2 | 44 | OWNER_DECISION_REQUIRED |
| 7- Customer Gold Purchase Invoice.docx | 6 | 19 | 5 | 0 | 0 | 1 | 0 | 1 | 1 | 33 | PARTIAL |
| 7- Customers CRM.docx | 2 | 13 | 19 | 8 | 1 | 2 | 0 | 0 | 0 | 45 | PARTIAL |
| **Total** | **48** | **60** | **41** | **20** | **4** | **10** | **0** | **4** | **4** | **191** | **AUDIT COMPLETE; PRODUCT PARITY NOT COMPLETE** |

بالعربي: تم تحديد وقراءة الوثائق الخمسة كاملة، ومراجعة 344 صفحة بصريًا، وفحص صور Tags الخمس الخاصة بالباركود. مرّ تدقيق التغطية والمصدر وقراءة قاعدة البيانات وطلبات GET دون كتابة. توجد فجوات حقيقية وتعارضات Owner Decision، ولم يتم تنفيذ أي إصلاح أو فتح مسار Inventory Count. خطر قاعدة `darfus_erp` من هذا الـBatch صفر كتابة، والخطوة التالية هي مراجعة Owner لسجل التعارضات وخارطة التنفيذ فقط.

This PASS is an audit-completeness gate only. It does not claim that the five client modules have exact product parity.

## Scope and Authority

- Control: `DARFUS-CLIENT-REQUIREMENTS-EXACT-PARITY-AUDIT-02`.
- Official database: `darfus_erp`, queried read-only.
- Runtime checked read-only: `http://localhost:3000` and `http://localhost:8000`.
- Client sources: the five named DOCX files are the Business Requirements Authority.
- Current approved architecture remains the implementation authority for User/RBAC, Asset/Barcode, CGP posting, accounting and Customer Domain ownership.
- Prior reports were used only as supporting evidence; they did not override client documents or current source/DB.
- Inventory Count remains closed and was not reopened.

## Document Coverage and Visual Verification

All five documents were located at the supplied paths and read in complete ordered extraction. LibreOffice rendering was verified page 1 through the final page:

| Document | Bytes | Rendered pages | Text paragraphs | Tables | Embedded images | Visual result |
|---|---:|---:|---:|---:|---:|---|
| 8- Employees.docx | 65,957 | 53 | 1,267 | 0 | 0 | COMPLETE |
| 8- Invoices Search & Print.docx | 24,924 | 8 | 166 | 0 | 0 | COMPLETE |
| الباركود.docx | 66,890 | 8 | 211 | 6 | 5 | COMPLETE; 5 tag images inspected |
| 7- Customer Gold Purchase Invoice.docx | 47,318 | 37 | 452 | 0 | 0 | COMPLETE |
| 7- Customers CRM.docx | 223,578 | 238 | 3,874 | 0 | 0 | COMPLETE |
| **Total** | **428,667** | **344** | **5,970** | **6** | **5** | **COMPLETE** |

The Barcode images were not treated as decorative: the visual examples were compared with OOXML/text content. This exposed the `ERG` vs `ERR/GPERR` and `NCK` vs `NLC/GSNLC` internal conflicts, which are preserved in the matrix and conflict register.

## Current Source / Database / Runtime Evidence

### Read-only runtime

| Check | Result | Evidence |
|---|---|---|
| Backend health | PASS | `GET http://localhost:8000/api/v1/health` returned 200. |
| Frontend Employees | PASS | `GET http://localhost:3000/en/employees` returned 200. |
| Frontend Invoice Search/Print | PASS | `GET http://localhost:3000/en/sales/search-print` returned 200. |
| Frontend Customers | PASS | `GET http://localhost:3000/en/customers` returned 200. |
| Frontend Customer Gold route | PASS | `GET http://localhost:3000/en/sales/customer-gold` returned 200. |
| Invalid root health path | 404 | `/health` without `/api/v1` is not the supported route; this is not a product failure. |
| Business mutations | NOT RUN | No POST/PUT/PATCH/DELETE business request was issued. |

### Official DB read-only baseline

`SELECT current_database()` returned `darfus_erp`.

| Entity/table | Count or state | Read-only interpretation |
|---|---:|---|
| companies | 1 | Company foundation exists. |
| branches | 2 | Branch foundation exists. |
| users | 1 | User/RBAC population exists; not an Employee count. |
| employees | 0 | Employee source foundation exists, but no official employee rows. |
| attendance | 0 | No official attendance sample. |
| payslips | 0 | No official payslip sample. |
| invoices | 1 | Invoice domain has one current row. |
| invoice_print_events | 0 | No current print-event sample. |
| customers | 3 | Customer master has three rows. |
| customer_gold_purchase_documents | 4 | CGP document rows exist in a separate domain. |
| customer_gold_purchase_items | 4 | CGP item rows exist. |
| assets | 18 | Asset inventory authority has 18 rows. |
| asset_barcode_history | 18 | 18 history rows; active 18, retired 0. |
| asset_rfid_assignments | 2 | RFID assignments exist. |
| barcode_inventory_codes | 5 | GW/GP/DD/GS/PL master codes present and active. |
| barcode_item_codes | 20 | Client codes plus current-source extras; client list was not silently expanded. |
| barcode_sequences | 12 | Sequence scopes exist. |

The current DB evidence is descriptive only. Counts were not modified and are not treated as proof that a feature is complete merely because a table exists.

## Atomic Traceability Matrix

The complete 191-row matrix is the primary deliverable:

[CLIENT_REQUIREMENTS_EXACT_TRACEABILITY_MATRIX.md](I:/WORK/jewellery-erp-master/docs/client-requirements/CLIENT_REQUIREMENTS_EXACT_TRACEABILITY_MATRIX.md)

It preserves client terminology, splits compound requirements, records exact gaps, and uses one primary status per row. Status totals in this report are derived from the matrix.

## Employees

`EMPLOYEES_OVERALL = PARTIAL`.

The current product has a meaningful Employee/User/operator foundation: Employee CRUD, Employee Code concepts, branch access, operator sessions, attendance check-in/out, payroll/payslip foundation and backend permission guards. The official DB has zero Employee rows, and the client’s contracts/documents, leave, correction, device integration, KPI, offline and full payroll-accounting requirements are not proven. The most important issue is not a missing screen; it is the literal shared-branch-account wording versus the current fail-closed User/RBAC plus Employee operator architecture. This is `CR-EMP-001`, an Owner decision, not an implementation instruction.

Required distinction:

- Employee Role = organizational/reporting role.
- System Permission = User/Auth/RBAC authority.
- Employee Code = responsible employee/operator attribution.

No RBAC weakening or shared-account change was made.

## Invoices Search & Print

`INVOICE_SEARCH_PRINT_OVERALL = PARTIAL`.

The current read-only search/print foundation supports Sales, Return, Exchange, Installment and Deposit, common number/customer/date/branch/status filters, one-row results, detail and generic print actions. It does not present Gift Voucher or Customer Gold Purchase in the unified invoice projection. Employee filtering is visibly disabled because the current invoice records do not store salesperson/employee, and Invoice Type is single-select rather than the required single-plus-multi-select contract. Full event-history reconstruction and complete search/print audit/result-count proof are not established. The 200 route response proves reachability, not exact parity.

## Barcode / Tagging

`BARCODE_OVERALL = OWNER_DECISION_REQUIRED`.

The strong current foundation is evidenced: five inventory codes match, the client item-code table is represented in the DB, format is inventory + item + two-digit karat + six-digit serial, sequence/collision/history services exist, and the current official baseline has 18 active barcode-history rows. Current source also has tag renderers for GBW, GBP, Diamond, Gem Stone and Pearl.

Exact parity is blocked by the client document’s own visual/table conflicts and by the difference between current barcode replacement history and the document’s explicit v1/v2 Item Revision wording. No barcode code, sequence, DB row or historical identity was changed.

## Customer Gold Purchase Invoice

`CGP_INVOICE_OVERALL = PARTIAL`.

The accepted current CGP authority remains `DRAFT → VALIDATED → POSTED`, with validation, post permission and post confirmation; approval is not reintroduced. Source has pricing snapshots, posting/idempotency, outbox/durable events, inventory/accounting/Gold Center consumers and compensation/recovery services. The client’s formula and authority separation are substantially represented, but the client-facing CGP Invoice artifact/search/print/employee/historical reconstruction contract is not proven in the unified invoice screen. The current DB contains four CGP documents/items, but this count is not treated as unified invoice parity.

The client’s rollback wording and Closed/Invoice vocabulary are recorded as conflicts with durable compensation and separate CGP/settlement semantics. No CGP posting or mutation was executed.

## Customers CRM

`CUSTOMERS_CRM_OVERALL = PARTIAL`.

The current Customer foundation is real: three DB customers, customer CRUD, contact/address support, classification/status, deactivate/reactivate, attachments/KYC/AML, invoices/statements/credit, timelines/history, loyalty and reservations-related routes. This is not yet a complete CRM parity implementation. Duplicate detection/merge, consent lifecycle, communication center, complete 360 projections, dashboard indicators, multidimensional segmentation, loyalty adjustment/expiry completeness and offline/conflict recovery remain partial or missing. The matrix intentionally does not treat Customer Master as full CRM.

CRM must remain a read model/consumer of original sales, inventory, accounting, CGP and reservation authorities; it must not become a second owner of those truths.

## Dependency Map

| Shared dependency | Downstream requirements | Evidence-based implication |
|---|---|---|
| Employee Identity Foundation | Invoice Employee filter; CGP Employee field; sensitive-operation attribution; Employee reports | Full Payroll is not a prerequisite for basic employee attribution. |
| User/RBAC + Employee operator authority | Employee security; branch operations; invoice/CGP attribution | Keep individual technical authentication and server-verified operator context. |
| Barcode master + identity/history | Exact tags; Asset identity; returns/exchanges; revision semantics | Resolve internal code conflicts before changing any barcode mapping. |
| Invoice projection | Search/print types, lifecycle reconstruction, Customer 360 sales | Current projection excludes Gift Voucher and CGP. |
| CGP Invoice Artifact | Unified invoice search/print and CRM 360 CGP | CGP posting success does not prove invoice artifact parity. |
| Customer Identity | CRM, Invoice filters, CGP and CRM 360 | Customer Domain remains the identity owner. |
| Customer 360 projection | Transactions, balances, loyalty, reservations, repairs and timeline | Must consume original authorities; no duplicate financial/inventory truth. |
| Privacy/consent decision | CRM fields, segmentation, communications, documents | Required before communication/segmentation implementation. |

## Top 10 Highest-Value Gaps

Ordered from dependency and risk evidence, not subjective completion percentage:

1. `CR-EMP-001`: shared branch account wording versus frozen User/RBAC security authority.
2. Employee Code/Employee attribution projection for invoice and CGP searches.
3. CGP client Invoice artifact/search/print/historical reconstruction.
4. Invoice Search missing Gift Voucher and Customer Gold Purchase types.
5. Barcode `ERG` vs `ERR/GPERR` internal conflict.
6. Barcode `NCK` vs `NLC/GSNLC` internal conflict.
7. Barcode Item Revision v1/v2 equivalence versus current replacement/history model.
8. Invoice Type multi-select and complete type/status lifecycle semantics.
9. CRM duplicate detection/merge with identity/history preservation.
10. Employee Leave/Attendance Corrections/Payroll Accounting foundations.

## Owner Decisions Required

- `CR-EMP-001`: confirm that current User/RBAC + Employee operator identity remains the security authority, or explicitly approve a new security model.
- `CR-BC-001`: choose `ERG` table authority versus `ERR/GPERR` visual example.
- `CR-BC-002`: choose `NCK` table authority versus `NLC/GSNLC` visual example.
- `CR-BC-003`: decide whether current barcode history/replacement satisfies Item Revision v1/v2.
- `CR-CGP-001`: accept durable compensation as the meaning of rollback after durable event publication.
- `CR-CGP-002`: approve a separate CGP invoice projection instead of converting CGP into the generic Invoice owner.
- Confirm whether client terms `Closed`, `Employee`, `Invoice`, `Segment`, `Communication` and `Consent` require literal labels/behaviors or are business-language descriptions of current authorities.

## Quick Wins (proposal only; not implemented)

- Document the current Employee/User/operator distinction in the approved requirements mapping.
- Enable no new barcode codes; annotate current `ERG`/`NCK` authority and preserve the conflicts.
- Add a read-only evidence card for the current invoice type map and disabled Employee filter.
- Document current CGP approval-free lifecycle and durable compensation semantics.

## Foundational Gaps

- Employee Identity and attribution projection.
- Barcode revision/code decision.
- Invoice projection that can safely represent all required invoice types.
- CGP Invoice Artifact projection.
- Customer 360 read model and privacy/consent authority.
- Employee Leave/Attendance Corrections/Payroll Accounting.

## Read-Only Safety and Change Accounting

No source, test, migration, configuration, master-data or business database mutation was performed by this audit. Existing worktree changes were pre-existing and were not cleaned, reset, restored, stashed or claimed as part of this control. The four requested Markdown artifacts are the only intended outputs of this control.

## Gate

`GATE = PASS_CLIENT_REQUIREMENTS_EXACT_PARITY_AUDIT`

The gate means the comparison is complete and the evidence-backed matrix/conflict/roadmap/report were produced. It does not mean the product is exact against all client requirements. No implementation batch is authorized by this report.

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-REQUIREMENTS-EXACT-PARITY-AUDIT-02
CURRENT_TRACK = CLIENT_REQUIREMENTS_EXACT_PARITY_AUDIT
CLIENT_DOC_COUNT = 5
INVENTORY_COUNT_STATUS = CLOSED_NOT_REOPENED
ALL_5_CLIENT_DOCS_LOCATED = YES
ALL_5_CLIENT_DOCS_READ_COMPLETELY = YES
ALL_ATOMIC_REQUIREMENTS_INDEXED = YES
EMPLOYEES_ATOMIC_REQUIREMENT_COUNT = 37
INVOICE_SEARCH_PRINT_ATOMIC_REQUIREMENT_COUNT = 32
BARCODE_ATOMIC_REQUIREMENT_COUNT = 44
CGP_INVOICE_ATOMIC_REQUIREMENT_COUNT = 33
CUSTOMERS_CRM_ATOMIC_REQUIREMENT_COUNT = 45
TOTAL_ATOMIC_REQUIREMENT_COUNT = 191
EMPLOYEES_OVERALL = PARTIAL
INVOICE_SEARCH_PRINT_OVERALL = PARTIAL
BARCODE_OVERALL = OWNER_DECISION_REQUIRED
CGP_INVOICE_OVERALL = PARTIAL
CUSTOMERS_CRM_OVERALL = PARTIAL
EXACT_MATCH_COUNT = 48
IMPLEMENTED_DIFFERENTLY_COUNT = 60
PARTIAL_COUNT = 41
MISSING_COUNT = 20
UI_ONLY_GAP_COUNT = 4
BACKEND_GAP_COUNT = 10
DATA_CONFIG_GAP_COUNT = 0
CONFLICT_WITH_CURRENT_ARCHITECTURE_COUNT = 4
OWNER_DECISION_COUNT = 4
CONFLICT_COUNT = 8
SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
MIGRATIONS = 0
BUSINESS_DB_WRITES = 0
RUNTIME_BUSINESS_MUTATIONS = 0
INVENTORY_COUNT_REOPENED = NO
GATE = PASS_CLIENT_REQUIREMENTS_EXACT_PARITY_AUDIT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

No implementation, migration, DB mutation, security-model change, employee shared-account change, barcode code change, barcode revision implementation, CGP flow change, CRM mutation, payroll implementation, production action or automatic next batch was started.
