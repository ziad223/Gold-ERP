# DARFUS CLIENT CRM — Current-State Capability Matrix

### Evidence key
- DOC-CRM: I:\WORK\client-requirements\7- Customers CRM.docx, SHA-256 EA2799BA2276202C78315D1D97C3700805D1DA643683FD178E2D793194D8C526; actual render 238 pages.
- SRC-CUST-PAGE / SRC-CUST-DETAIL: customer list/detail pages.
- SRC-CUST-MODEL: Customer, BranchCustomer, CustomerAttachment, CustomerTimeline, CustomerTransactionHistory, LoyaltyTransaction and related models.
- SRC-CUST-API: customer invoice/statement/credit/loyalty routes with auth/permission/branch checks.
- SRC-CUST-PROJECTION: invoice/CGP read projections and routes.
- SRC-NO-MERGE / SRC-NO-COMM: no matching merge or dedicated communication-center implementation found.
- SRC-OFFLINE: dashboard offline snapshot/banner only; no complete customer offline sync contract.
- SRC-RBAC: auth middleware, usePermissions, customers.* and statement/loyalty guards.
- DB-CRM: companies=1, branches=2, users=1, employees=0, customers=3, branch_customers=3, customer_attachments=0, customer_timelines=4, customer_transaction_history=4, customer_credit_transactions=1, customer_financial_liabilities=4, customer_gold_purchase_documents=4, customer_gold_purchase_items=4, loyalty_transactions=10, invoices=10, reservations=1, installments=6, gift_vouchers=5.
- RUN-GET-CRM-SCREENS: AR/EN customer list/detail/loyalty HTML GET 200; health/db/redis/gold GET 200.
- TEST-CRM-PURE-39: 39 non-mutating customer/CRM contract/UI/static tests passed. customer-master-phase-02-browser-runtime.cjs excluded because it writes a clone.

| Capability | Status | Evidence | Current limitation | Severity | Root cause |
|---|---|---|---|---|---|
| Customer Foundation | PARTIAL | Customer model/page has contact, tier/status, nationality, KYC/AML, credit/loyalty, addresses, notes | Preferences, tags, alerts, communication preferences, consent incomplete | P1 | Identity/Foundation |
| Identity / cross-module reference | IMPLEMENTED_DIFFERENTLY | Customer ID and associations across invoices, reservations, CGP, loyalty, credit, history/timeline, attachments | Merge and permanent-identity guarantees not proven | P1 | Duplicate/Merge |
| Lifecycle | IMPLEMENTED_DIFFERENTLY | Deactivate/reactivate routes/UI | Archived restrictions and lifecycle audit parity unproven | P1 | Lifecycle |
| Dashboard | PARTIAL | Customer list metrics/filters; loyalty tier cards | New/follow-up/installment/communication/KPI projections not proven | P2 | Dashboard/Analytics |
| Profile / Customer 360 | PARTIAL | Detail identity, KYC/AML, address, invoices, statements, credit, attachments, loyalty/credit | Complete CGP/GV/reservation/repair/communication 360 not proven | P1 | 360 Read Models |
| Transactions History | PARTIAL | Invoice/statement routes and history/timeline tables | All client source types and original navigation not proven | P1 | Timeline/History |
| Balance | IMPLEMENTED_DIFFERENTLY | Customer.balance AR/reference; statement-v2/v3 and credit ledger separate | Single client read meaning not reconciled; Accounting remains authority | P1 | Balance Adapter |
| Timeline | PARTIAL | Source/event/time/branch/customer fields; unique source-event indexes; four rows | Full cross-domain collection/navigation not proven | P1 | Timeline/History |
| Segmentation | PARTIAL | Loyalty thresholds and tier/status/balance filters | No general manual/dynamic multi-dimensional authority | P2 | Segmentation |
| Loyalty | IMPLEMENTED_DIFFERENTLY | Append-only ledger, earn/redeem routes, sale award; 10 rows | Adjustment/expiry/eligibility/all-event/audit parity incomplete | P1 | Loyalty |
| Communication Center | MISSING | No dedicated model/route/page | Channel, actor, content, status, history, audit absent/unproven | P1 | Communication/Privacy |
| Duplicate Prevention | MISSING | Local phone normalization/create guard; no server review workflow | No complete detection/review contract or phone/email semantics | P1 | Duplicate/Merge |
| Merge | MISSING | No merge route/service/model | Surviving identity/reference remap/atomicity/idempotency unproven | P1 | Duplicate/Merge |
| Archive / Reactivation | IMPLEMENTED_DIFFERENTLY | Deactivate/reactivate UI/API retains record | Exact Archive naming/restrictions/audit not proven | P1 | Lifecycle |
| Privacy / Consent | SECURITY_GAP | KYC/AML and RBAC exist | Consent lifecycle/withdrawal/effective dates/channel consent not proven | P1 | Privacy/Consent |
| Audit / Notifications | PARTIAL | Generic audit/entity events and timeline; notification foundation elsewhere | CRM-specific projection/notification center incomplete | P2 | Observability |
| Integrations | PARTIAL | Customer refs across invoice, reservation, CGP, loyalty, credit, history and timeline | Workshop/government/dashboard/notifications incomplete/unproven | P1 | Integrations |
| Offline | MISSING | Dashboard offline UI only | No customer local queue/sync/conflict/recovery/audit | P2 | Offline |
| Technical Architecture | IMPLEMENTED_DIFFERENTLY | Relational models, REST routes, projections, auth guards, indexes | Complete literal CQRS/event/offline contract not proven | P2 | Architecture |

