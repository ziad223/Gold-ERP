# DARFUS ERP — CRM-0 Exhaustive Client Requirements Audit & Gap Inventory

## 1. Executive Summary

| Client Document | Exact | Different | Partial | Missing | UI Gap | Backend Gap | Config Gap | Conflict | Owner Decision | Total Atomic | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 7- Customers CRM.docx (actual supplied file) | 6 | 26 | 39 | 17 | 3 | 3 | 0 | 0 | 0 | 100 | PARTIAL |

| Metric | Value |
|---|---:|
| Exact matches | 6 |
| Implemented differently | 26 |
| Partial | 39 |
| Missing | 17 |
| Other statuses (Not Applicable) | 6 |
| Blocking non-exact rows | 32 |
| Non-blocking non-exact rows | 62 |
| Actual render pages | 238 |
| Control expected pages | 249 |

بالعربي المبسط: تم تدقيق الملف المتاح كاملًا قراءةً فقط، ومراجعة المصدر والـDB والـruntime والاختبارات. لا توجد كتابة. Customer Foundation موجود لكنه ليس Full CRM. بوابة CRM-0 ستبقى محجوبة لأن النسخة الفعلية 238 صفحة لا 249؛ لا يمكن إثبات صفحات غير موجودة بالتخمين.

## 2. Client Document Integrity

Requested authority name: 7- Customers CRM(1).docx. Located: I:\WORK\client-requirements\7- Customers CRM.docx. SHA-256 EA2799BA2276202C78315D1D97C3700805D1DA643683FD178E2D793194D8C526. Size 223,578 bytes. LibreOffice/PDF render: 238 pages, pages 1-238 visually inspected. OOXML: 3,874 paragraphs, 3,863 non-empty, 0 tables, 0 textboxes, 0 drawings/media, 0 headers/footers. Bilingual pairs were read once and deduped.

## 3. Authority Hierarchy

Client DOCX = business authority; frozen DARFUS decisions = architecture authority; source/DB/runtime = reality; old reports/tests = supporting evidence.

## 4. Customer Domain Ownership

Customer owns identity/profile/relationship/read knowledge. Sales, Accounting/Treasury, Inventory/Assets, Gold Center, Workshop, Transfers, Reservations, Gift Voucher and CGP retain operational ownership. No duplicate operational authority was created.

## 5. Read-First

All ten parts and their sections were reconciled against the full actual extraction and visual render. No tables, text boxes, figures or headers/footers exist in the supplied DOCX.

## 6. Repository / Worktree Baseline

Branch main; HEAD 1657b0e9ba580faef69be48f04637835c201b521; worktree dirty, status total 1034 from pre-existing changes. No reset, clean, restore, stash, source edit, test edit, migration or config edit.

## 7. Current Customer Source Map

Frontend: app/[locale]/(dashboard)/customers/page.tsx, customers/[id]/page.tsx, customers/loyalty/page.tsx, features/customers/components/CustomerAddressFields.tsx, hooks/use-customers.ts, hooks/use-loyalty.ts, repositories. Backend: Customer, BranchCustomer, CustomerAttachment, CustomerTimeline, CustomerTransactionHistory, LoyaltyTransaction, CustomerCreditTransaction, CustomerFinancialLiability models; customer address/phone/purchases/POS summary/credit services; erp.routes.js; invoice-projection routes/service; auth/RBAC/branch isolation/audit.

## 8. Current Customer DB Model

SELECT current_database(), current_user returned darfus_erp|postgres. PostgreSQL 16.15. Current CRM counts and indexes are in the capability matrix. Customer has company-scoped identity, contact, tier/status, KYC/AML, credit/loyalty, JSONB addresses, notes and timestamps. BranchCustomer has unique company/branch/customer index. Timeline/history have unique source-event indexes. Attachments count 0.

## 9. Cross-Module Customer Identity Map

| Domain | Current reference | Nullable/FK | Authority | Gap |
|---|---|---|---|---|
| Sales/returns/exchanges | invoices.customer_id | non-null/FK | Sales/Invoice | 360 partial |
| Installments | installments.customer_id | nullable | Installment/Invoice | projection partial |
| Payments/credit/settlements | source invoice/customer links | mixed | Treasury/Accounting | semantics split |
| Gift Voucher | gift_vouchers.customer_id | nullable | Gift Voucher | 360 partial |
| CGP | CGP document customer_id | non-null/FK | CGP | invoice artifact gap |
| Reservations | reservation/payment/refund customer_id | core non-null | Reservations | 360 partial |
| Workshop/repairs | source link not fully proven | unknown | Workshop | integration gap |
| Inventory | stock_movements.customer_id | nullable | Inventory | source mapping incomplete |
| Timeline/history | customer_id + source event | non-null/unique | Customer read model | limited rows |
| Loyalty | loyalty_transactions.customer_id | non-null | Loyalty ledger | policy partial |
| Audit/notifications | company/user/entity refs | mixed | Audit/Notifications | projection gap |

## 10. Atomic Requirement Decomposition

100 independently testable rows were derived from the ten parts after removing AR/EN duplicates and repeated non-acceptance narrative. The count is generated from the matrix, not preset. All non-exact rows are in the gap register.

## 11. Customer Foundation

Core identity/contact/address/tier/status/KYC/AML/notes/loyalty exist in various forms. Preferences/tags/alerts/communication preferences/consent are incomplete.

## 12. Identity / Duplicate Prevention

One company-scoped Customer authority and cross-module references are proven. Duplicate review, merge, obsolete identity retirement and merge audit are absent/unproven.

## 13. Lifecycle

Deactivate/reactivate exists and retains the record. Archived restrictions and exact lifecycle/audit parity are unproven.

## 14. Customers Dashboard

List metrics and loyalty tier cards exist. New/follow-up/installment/communication/KPI projections are incomplete.

## 15. Customer Profile / 360

Detail has identity, KYC/AML, addresses, invoices, statements, credit, attachments and loyalty/credit areas. Full cross-domain 360 is not proven.

## 16. Transactions History

Invoice/statement/credit routes and history tables exist. All client categories and original-document navigation are not proven.

## 17. Customer Balance

Customer.balance is an AR/reference value; statement-v2/v3 and credit ledger are separate. Accounting/Treasury remain authority; no formula was invented.

## 18. Timeline

Timeline/history include source/event/time/branch/customer fields and unique source-event indexes. Current DB has four timeline and four transaction-history rows; full event collection/navigation is not proven.

## 19. Segmentation / Analytics

Tier threshold segmentation and list filters exist. General manual/dynamic and recency/frequency/value/geography/interests/communication preference rules are absent/unproven.

## 20. Loyalty

Ledger, points/tier UI, earn/redeem routes and sales award exist. Adjustment/expiry/eligibility/all-event/audit parity is incomplete.

## 21. Communication Center

No dedicated communication center was found; no communication was sent.

## 22. Privacy / Consent

KYC/AML and RBAC exist, but do not prove consent records, channel consent, withdrawal, effective dates, protected-field audit or retention.

## 23. Merge

No merge implementation or safe cross-module merge proof exists. P1; owner decision required.

## 24. Archive / Reactivation

Current deactivation/reactivation is reality. It must not be called exact Archive until restrictions/audit are reconciled.

## 25. Screens / Fields / Actions

AR/EN list/detail/loyalty GET routes returned 200. Field/button/filter/action parity remains partial; no mutation control was exercised.

## 26. Permissions / Security

Auth and branch/permission guards exist. Complete client permission matrix for merge/consent/communication/segment administration/loyalty adjustment is not proven; no permission widened.

## 27. Audit / Notifications

Generic audit/entity-change and timeline foundations exist. CRM-specific audit projection and notification center remain incomplete.

## 28. Operational Scenarios

Create, existing-customer use and lifecycle actions have evidence. Duplicate/merge/communication/offline scenarios are absent or partial.

## 29. Exception Handling

Validation/error and durable source-domain recovery exist. Duplicate/merge/communication/offline contracts are missing.

## 30. Integrations

Sales, CGP, loyalty, reservations, invoices, credit and timeline/history links exist. Dashboard, Workshop, Notifications and Government are partial/unproven; Accounting/Inventory ownership remains separate.

## 31. Technical Design / DB

Relational models, FKs, unique indexes and REST routes exist. Complete entity/relationship/state/DTO/performance contract is not proven; no schema changed.

## 32. Events / CQRS

Source-event fields, audit, projections and durable services exist. REST/model presence is not proof of complete CQRS/event collection; differences are recorded.

## 33. APIs / DTO

Customer list/detail repositories and read routes exist; statement/credit/loyalty APIs are protected. Complete standardized DTO/versioning/audit matrix is not proven. Mutation APIs were not called.

## 34. Offline Synchronization

Dashboard offline UI exists. Customer offline queue, central sync, conflict handling, recovery and audit are missing/unproven.

## 35. Performance Evidence

No synthetic benchmark ran against main DB. Existing indexes are visible; CRM performance is NOT_PROVEN / CURRENT_DATA_ONLY.

## 36. Runtime / Browser Read-Only Findings

GET /api/v1/health, /health/db, /health/redis, /health/gold and AR/EN customer list/detail/loyalty HTML returned 200. No business POST/PUT/PATCH/DELETE was made. Protected API GETs were not expanded without an authenticated session.

## 37. Existing Tests

39 non-mutating tests passed. The browser-runtime customer test was excluded because it writes a disposable clone. Merge, communication, consent and offline client parity are not covered.

## 38. Typecheck

Bundled tsc --noEmit exited 0. No source was modified.

## 39. Complete Gap Inventory

All 94 non-exact rows are in the gap register with status, evidence, root cause, severity, dependency and owner approval.

## 40. Additional Problem Inventory

The page-count/provenance mismatch is the control blocker. Worktree drift, protected API runtime boundary and the excluded mutating test are evidence boundaries, not silently converted into product defects.

## 41. Severity Summary

P0=0; P1=32; P2=56; P3=6. P1 includes identity/merge/privacy/financial projection and source provenance. P2 includes dashboard/segmentation/technical/offline/performance. P3 is future/checklist/advisory.

## 42. Root-Cause Groups

14 groups are defined in the root-cause map. No batch per row was started.

## 43. Dependency Graph

Identity → duplicate/merge → lifecycle; identity/source maps → 360 → timeline/balance; 360/balance → dashboard; privacy/RBAC → communication/segmentation; stable contracts → offline/performance.

## 44. Proposed Implementation Batches

14 planning-only batches are listed in the roadmap. All require Owner approval; none started.

## 45. Owner Decisions Required

1. Confirm the supplied DOCX is the authoritative 238-page version or supply the expected 249-page source.
2. Approve duplicate/merge survivor/remap/audit/concurrency/recovery semantics.
3. Approve privacy/consent/communication fields, retention and audit.
4. Approve canonical customer-balance read projection without a second Accounting owner.
5. Classify Event/CQRS/Offline clauses as mandatory contracts or architectural guidance.
6. Approve timeline event coverage and original-document navigation.
7. Confirm priority for Workshop, Government, Dashboard and future extensions.

## 46. Main DB Safety

SELECT current_database(), current_user returned darfus_erp|postgres. No INSERT/UPDATE/DELETE/TRUNCATE/backfill/seed/migration/backup/restore was run. Business, financial, and inventory deltas by this control are 0. No source/test/config/UI/API/schema file was edited by CRM-0.

## 47. Final Tokens

CURRENT_CONTROL = DARFUS-CLIENT-CRM-0-EXHAUSTIVE-REQUIREMENTS-AUDIT-AND-GAP-INVENTORY-01
MODE = READ_ONLY_CLIENT_AUTHORITY_RECONCILIATION_AND_COMPLETE_GAP_INVENTORY
OWNER_APPROVAL = EXPLICIT
CLIENT_DOCUMENT = 7- Customers CRM(1).docx (located actual: 7- Customers CRM.docx)
CLIENT_DOCUMENT_READ_COMPLETELY = YES
CLIENT_DOCUMENT_PAGES_RECONCILED = 238 actual pages visually audited; 249 expected not present
ALL_249_PAGES_AUDITED = NO
ALL_ACTUAL_238_PAGES_AUDITED = YES
ALL_CLIENT_PARTS_RECONCILED = YES
CRM_ATOMIC_REQUIREMENT_ROW_COUNT = 100
ALL_ATOMIC_REQUIREMENTS_INVENTORIED = YES
CURRENT_CUSTOMER_SOURCE_MAP = COMPLETE
CUSTOMER_IDENTITY_CROSS_MODULE_MAP = COMPLETE
ALL_CURRENT_CAPABILITIES_MAPPED = YES
ALL_GAPS_INVENTORIED = YES
ALL_ARCHITECTURE_CONFLICTS_EXPLICIT = YES
ROOT_CAUSE_GROUPING_COMPLETE = YES
DEPENDENCY_GRAPH_COMPLETE = YES
SAFE_IMPLEMENTATION_ROADMAP_READY = YES
CRM_EXACT_MATCH = 6
CRM_IMPLEMENTED_DIFFERENTLY = 26
CRM_PARTIAL = 39
CRM_MISSING = 17
CRM_DATA_CONFIG_GAP = 0
CRM_UI_GAP = 3
CRM_BACKEND_GAP = 3
CRM_DB_SCHEMA_GAP = 0
CRM_INTEGRATION_GAP = 1
CRM_SECURITY_GAP = 1
CRM_PERMISSION_GAP = 1
CRM_EVIDENCE_GAP = 3
CRM_TEST_GAP = 0
CRM_RUNTIME_GAP = 0
CRM_ARCHITECTURE_CONFLICT = 0
CRM_CLIENT_INTERNAL_CONFLICT = 0
CRM_OWNER_DECISION_REQUIRED = 0
CRM_FUTURE_EXTENSION_ROWS = 6
TOTAL_BLOCKING_GAPS = 32
TOTAL_NON_BLOCKING_FINDINGS = 62
TOTAL_ROOT_CAUSE_GROUPS = 14
TOTAL_PROPOSED_IMPLEMENTATION_BATCHES = 14
P0_COUNT = 0
P1_COUNT = 32
P2_COUNT = 56
P3_COUNT = 6
MAIN_DB = darfus_erp
MAIN_DB_READ_ONLY = YES
MAIN_DB_BUSINESS_DELTA_BY_CONTROL = 0
MAIN_DB_FINANCIAL_DELTA_BY_CONTROL = 0
MAIN_DB_INVENTORY_DELTA_BY_CONTROL = 0
SOURCE_CHANGES_THIS_CONTROL = 0
TEST_CHANGES_THIS_CONTROL = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
CRM_0_GATE = BLOCKED_CLIENT_DOCUMENT_PROVENANCE_PAGE_COUNT_MISMATCH
FULL_CRM = NOT_CLOSED_AUDIT_ONLY
NEXT_RECOMMENDED_STEP = OWNER_CONFIRM_238_PAGE_AUTHORITY_OR_SUPPLY_249_PAGE_SOURCE_THEN_OWNER_APPROVE_FIRST_SAFE_CRM_BATCH
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START

STOP: no CRM-1 or other implementation batch was started.
