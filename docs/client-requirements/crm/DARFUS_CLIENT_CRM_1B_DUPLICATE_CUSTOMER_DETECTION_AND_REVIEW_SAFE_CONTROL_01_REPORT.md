# DARFUS ERP — CRM-1B Duplicate Customer Detection & Review Safe Control

Control ID: `DARFUS-CLIENT-CRM-1B-DUPLICATE-CUSTOMER-DETECTION-AND-REVIEW-SAFE-CONTROL-01`

## ملخص عربي تنفيذي

تم تنفيذ طبقة كشف ومراجعة تكرار العميل بأضيق نطاق مثبت: فحص الهاتف المطبع بدقة داخل الشركة، مع رفض خادمي قبل فتح المعاملة عند التطابق، وإشارة مراجعة للاسم فقط دون اعتباره مفتاحًا فريدًا. أضيفت واجهة مراجعة عربية/إنجليزية، ولم يحدث أي إنشاء أو تعديل لعميل أو كتابة مالية/مخزنية. الاختبارات المركزة والتراجع المرتبط مرّت، والبناء وTypeScript مرّا. الحد المتبقي هو أن الحماية من سباق إنشاء متزامن غير مثبتة لأن قاعدة البيانات لا تحتوي قيد هاتف فريد؛ لم تُنشأ migration.

الخطر على `darfus_erp`: لا توجد كتابة في هذا التحكم، والقراءات أثبتت هوية القاعدة. الخطوة التالية هي Owner review لسياسة البريد/الأرقام المشتركة/التزامن قبل أي Batch لاحق.

## 1. Executive Summary

| Area | Result | Evidence | Classification |
|---|---|---|---|
| Exact normalized phone detection | Implemented | Shared normalizer, company-scoped SQL lookup, server guard before transaction | PRODUCT_DEFECT_CLOSED_FOR_THIS_SCOPE |
| Name review signal | Implemented | Case-folded exact name candidate and explicit UI acknowledgement | ACCEPTANCE_GAP_REDUCED |
| Email duplicate policy | Not implemented | No proven current normalization/uniqueness authority | OWNER_DECISION_REQUIRED |
| Merge/remap | Not implemented | Explicitly outside CRM-1B; Customer ID remains immutable | NO_ISSUE |
| Concurrent create guarantee | Not proven | Official DB has nonunique `(company_id,phone)` index only | DESIGN_LIMITATION |
| Official DB writes | 0 | Read-only SQL only; no POST create was sent | NO_ISSUE |

Gate: `PASS_CRM_1B_DETECTION_REVIEW_WITH_CONCURRENCY_GUARANTEE_DEFERRED`.

This is not a claim that the full client CRM duplicate/merge requirement is
complete. It is the narrow CRM-1B detection/review control with the documented
concurrency boundary.

## 2. Owner Safety Doctrine

- `darfus_erp` remained read-only.
- No Customer ID was changed, merged, remapped, deleted, or recreated.
- No migration, seed, cleanup, financial, inventory, POS, reservation, voucher,
  CGP, accounting, or permission mutation was executed.
- No hard name rule, hard email rule, fuzzy matching, AI matching, or shared
  account behavior was invented.
- The server remains the authority even if the UI is bypassed.

## 3. Read-First Record

Read completely before implementation:

- CRM-1B control supplied for this batch.
- CRM-1A canonical identity/field authority and report.
- CRM-0 customer requirements, gap register, and authority material.
- Client authority document `I:\WORK\client-requirements\7- Customers CRM.docx`;
  the relevant requirement states that potential duplicates require user review
  before creating or merging another identity.
- Existing customer page, customer hook, repository interfaces, API/local
  repositories, Customer model, BranchCustomer model/associations, auth and
  business-permission middleware, Customer create controller, and generic CRUD
  route.
- Existing CRM, Customer, POS, invoice, CGP, voucher, reservation, accounting,
  and permission-focused tests used for bounded regression.

The client document is business authority; frozen Customer identity, User/Auth/
RBAC, company scope, and domain authorities remain system authority.

## 4. Pre-Change Baseline and Worktree Safety

The worktree was already substantially dirty before CRM-1B, including prior
CRM-1A and unrelated historical/current artifacts. No cleanup, reset, restore,
stash, or ownership claim over unrelated changes was made. Only the CRM-1B
duplicate-detection hunks and new CRM-1B artifacts are attributed here.

Pre-existing relevant reality:

- `LocalCustomerRepository` already rejected exact normalized phone matches.
- Server Customer create had no equivalent pre-transaction duplicate check.
- Customer had a nonunique company/phone index, not a unique constraint.
- BranchCustomer was a relationship table, not a second Customer identity.

## 5. Frozen Customer Identity Authority

| Concern | Authority | Evidence |
|---|---|---|
| Permanent identity | `Customer.id` | CRM-1A authority and Customer model primary key |
| Tenant scope | `Customer.company_id` | Customer model, auth context, server query |
| Branch membership | `BranchCustomer` | model association and official schema |
| Authorization | User/Auth/RBAC | existing auth and business-permission middleware |
| Duplicate signal | exact normalized phone for CRM-1B hard guard; name review-only | local repository behavior and new service |
| Merge/remap | none in CRM-1B | no merge/remap code added |

## 6. Current Customer Create Flow

Before CRM-1B, the canonical server create path in
`backend/src/controllers/erp.controller.js` sanitized the request, opened a
Sequelize transaction, created `Customer`, created `BranchCustomer`, wrote the
existing audit entry, and committed. The local repository separately compared
normalized phone values.

After CRM-1B the same path sanitizes and resolves the server company first,
calls the read-only duplicate service, rejects an exact normalized phone match
with HTTP `409` / `CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED`, and opens the
transaction only when that hard signal is absent. Existing create/branch/audit
behavior is otherwise preserved.

## 7. Duplicate Logic Map

| Layer | Before CRM-1B | After CRM-1B |
|---|---|---|
| Normalization | Local helper only | Same helper reused by server service and local repository |
| Phone | Local exact normalized check | Company-wide read-only lookup plus server pre-transaction hard rejection |
| Name | Not exposed as duplicate review | Trimmed/case-folded review signal only |
| Email | No proven duplicate authority | Not used; remains unresolved |
| Customer ID | Server-generated | Unchanged; never a client duplicate key |
| BranchCustomer | Relationship | Relationship summary only; never identity scope |
| Merge | None | None |

Source locations: `backend/src/services/customer-phone.service.js:1-6`,
`backend/src/services/customer-duplicate-detection.service.js:1-130`,
`backend/src/controllers/erp.controller.js:264-328`,
`backend/src/routes/erp.routes.js:5299-5322`.

## 8. Official DB Constraint and State Map

Read-only query result on 2026-08-30:

| Entity | Count |
|---|---:|
| Companies | 1 |
| Branches | 2 |
| Users | 1 |
| Employees | 0 |
| Customers | 3 |
| BranchCustomer rows | 3 |
| Duplicate normalized-phone groups | 0 |
| Duplicate nonempty normalized-email groups | 0 |
| Duplicate case-folded-name groups | 0 |

Identity and index evidence:

- `customers_pkey` is the only Customer unique identity index.
- `customers_company_id_phone` is nonunique.
- `branch_customers_company_branch_customer_uq` is unique on
  `(company_id,branch_id,customer_id)`.
- Customer `phone` is non-null but has no unique constraint.
- Customer is paranoid; the lookup excludes `deleted_at IS NOT NULL`.

Therefore current rows are clean for the observed snapshot, but database-level
race prevention is not proven.

## 9. Deterministic Signal Matrix

| Signal | Normalization | Strength | Action | Evidence | Status |
|---|---|---|---|---|---|
| Phone | remove non-digits, remove leading zeroes | Strong for current helper | Server 409 before transaction | `normalizePhone`, service, controller | IMPLEMENTED |
| Name | trim and lowercase | Weak review signal | Show candidate; explicit acknowledgement | service and UI | IMPLEMENTED |
| Email | no canonical rule proven | Unknown | Do not match or block | current model/repository and CRM-1A | OWNER_DECISION_REQUIRED |
| Customer ID | server-generated | Identity, not duplicate input | Never client supplied as duplicate authority | Customer model/create flow | PRESERVED |
| Address/notes/KYC/balance | not a signal | Sensitive/non-authoritative | Excluded from candidate DTO | service DTO | PRESERVED |

The normalizer does not map country codes. `+20 10...` and `010...` are not
silently treated as the same number unless the existing helper produces the
same normalized value. This limitation is tested and documented.

## 10. Duplicate Scope

Scope is company-wide because Customer identity is company-owned. Branch
relationships are returned as minimized `{branchId,isActive}` summaries and do
not create another identity. Active and inactive candidates are included;
soft-deleted candidates are excluded by `deleted_at IS NULL`. Results are
limited to 25, ordered by Customer ID, and contain no balance, KYC/AML,
address, notes, or transaction-history data.

## 11. Candidate Classification

- `EXACT_NORMALIZED_PHONE_MATCH`: hard pre-create conflict.
- `MULTI_SIGNAL_MATCH`: phone plus name; hard because phone is present.
- `WEAK_NAME_MATCH`: review-only; no automatic rejection.
- `NO_MATCH`: not returned by the SQL candidate predicate.

The server response is minimized to Customer ID, name, phone, email, status,
tier, branch relationship summaries, classification, and match reasons.

## 12. Owner Questions Still Unresolved

These remain explicit Owner decisions and were not guessed:

1. Should normalized phone become a database-enforced unique key per company?
2. Should country-code normalization make local and international forms equal?
3. Are shared phone numbers legitimate, and what review/override is allowed?
4. Is email a hard key or review-only signal? What trim/case policy applies?
5. May an authorized user override a phone conflict, or is it always blocked?
6. If an override is allowed, which audit event and approval are required?
7. Should inactive identities remain hard candidates permanently?

## 13. System-Wide Impact Review

| Consumer | Impact | Authority preserved | Result |
|---|---|---|---|
| Customer create | Pre-check and hard phone block | Customer controller | Covered |
| Customer edit | Unchanged in CRM-1B | Existing update contract | No scope widening |
| POS customer selection | Read-only customer identity unchanged | POS summary/search | Regression passed |
| Sales/invoices | No write or projection change | Invoice source domains | No impact |
| Reservations | No write or identity remap | Reservation customer reference | No impact |
| Gift Voucher | No write or identity remap | Voucher customer reference | No impact |
| CGP | No write or identity remap | CGP aggregate | No impact |
| Loyalty | No write or identity remap | Customer/loyalty authority | No impact |
| Accounting | No write or mapper change | Journal authority | No impact |
| Security | Existing auth, company, branch, permission guards retained | User/Auth/RBAC | No weakening |

## 14. Safe Changes Applied

1. Added deterministic read-only service
   `backend/src/services/customer-duplicate-detection.service.js`.
2. Added authenticated, permission-gated GET route
   `/api/v1/customers/duplicate-check`, before generic Customer ID routing.
3. Added server pre-transaction exact-phone guard with stable 409 error code.
4. Added typed API/local repository lookup contracts and hook.
5. Added Customer create review UI with AR/EN text, candidate links, hard phone
   stop, and name-only acknowledgement.
6. Added focused deterministic tests.

No migration, schema modification, merge logic, new permission, or financial
logic was added.

## 15. Deferred Unsafe or Unproven Changes

- No unique phone index or concurrency lock: future Owner-approved schema/control.
- No country-code normalization.
- No hard email uniqueness.
- No shared phone/email policy.
- No fuzzy, phonetic, weighted, or AI matching.
- No automatic merge, manual merge, remap, or Customer ID rewrite.
- No override workflow or override audit event.
- No changes to inactive/archived identity policy beyond current inclusion.

## 16. Server-Side Authority Proof

The controller performs `findPotentialDuplicates` before
`models.sequelize.transaction()` and throws
`CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED` for an exact normalized phone
candidate. The route itself requires auth and either `customers.view` or
`customers.create`, uses `req.companyId`, and does not accept a client company
scope. Static test evidence asserts the guard ordering and route ordering.

An unauthenticated read-only request to the endpoint returned HTTP `401`,
confirming that the endpoint is not public.

## 17. Concurrency and Race Status

`CONCURRENCY_DUPLICATE_PROTECTION = NOT_PROVEN_REQUIRES_FUTURE_SCHEMA_CONTROL`.

The official database has only a nonunique `(company_id,phone)` index. The
read-then-create guard reduces ordinary duplicate creation but cannot prove
that two concurrent requests cannot both pass the read. This is a documented
design limitation, not a fabricated pass. No migration was created or run.

## 18. Frontend Review Flow

The AR/EN Customer create modal now:

1. Builds the existing create payload.
2. Calls the read-only duplicate lookup before `addCustomer`.
3. Stops on an exact normalized phone match and links the existing Customer.
4. Shows name-only candidates with a statement that name alone is not proof.
5. Requires an explicit review acknowledgement before proceeding with a
   name-only create.

The UI adds no “create anyway” phone override and no merge action.

## 19. Design and Accessibility Boundary

The existing Customer page, modal, controls, Tailwind conventions, AR/EN
direction handling, and permission-driven actions were preserved. The new
review section uses semantic text, a checkbox, links, `aria-live`, and the
existing Button/Modal patterns. No broad visual redesign was performed.

## 20. Security and Data Minimization

- No new permission names.
- Existing User/Auth/RBAC, company scope, and branch scope remain authorities.
- Candidate fields intentionally exclude balance, KYC/AML, addresses, private
  notes, and transaction history.
- The endpoint is GET-only and server company-scoped.
- No customer contact data was added to the report beyond previously observed
  local runtime evidence; credentials, tokens, cookies, and secrets were not
  recorded.

## 21. DB Safety and Delta Proof

`SELECT current_database(), current_user` returned `darfus_erp | postgres`.

No Customer create, update, deactivate, reactivate, delete, merge, seed, or
business POST was sent. Browser interaction used the duplicate lookup path and
stopped before Customer create. Before/after business delta is therefore:

| Authority | Expected delta | Observed delta |
|---|---:|---:|
| Customers | 0 | 0 |
| BranchCustomer | 0 | 0 |
| Customer audit/business events | 0 | 0 |
| Invoices/payments/journals | 0 | 0 |
| Inventory/assets/movements | 0 | 0 |
| Permissions | 0 | 0 |

Post-proof read-only counts remained Companies 1, Branches 2, Users 1,
Employees 0, Customers 3, BranchCustomer 3, with zero observed duplicate
groups for normalized phone, nonempty normalized email, and case-folded name.

## 22. Focused Tests

Command:

`node --test backend/tests/customer-duplicate-detection.test.cjs`

Result: **9 passed, 0 failed**.

Coverage includes phone normalization, explicit country-code limitation, signal
classification, minimized DTO, server guard ordering, route ordering,
permission/company scope assertions, and UI lookup-before-create assertions.

## 23. Bounded Cross-Module Regression

Command: bounded CRM/POS/invoice/CGP/voucher/reservation/permission test set
covering the existing CRM-1A suite and directly affected shared authorities.

Result: **90 passed, 0 failed**.

No Inventory Count behavior was reopened; its accepted closed state was not
changed.

## 24. Typecheck, Build, and Runtime

- `npm run typecheck`: PASS.
- `npm run build`: PASS; Next.js generated the Customer routes including AR/EN.
- `next-env.d.ts` SHA-256 before/after build:
  `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`.
- Backend was refreshed only by restarting the existing `darfus-backend`
  `npm start` container; it uses the bind-mounted project source and did not
  run migrations.
- `GET /api/v1/health`: 200 UP.
- `GET /api/v1/health/db`: 200 PostgreSQL connected.
- `GET /api/v1/health/redis`: 200 Redis connected.
- `GET /api/v1/health/gold`: 200 HEALTHY, configured live provider, AED;
  no Gold mutation occurred.

## 25. AR and EN Read-Only Browser Proof

AR `http://localhost:3000/ar/customers`:

- Customer list loaded with existing rows and company context.
- “عميل جديد” opened the existing modal.
- A duplicate lookup using an already present normalized phone displayed the
  Arabic hard-review message and existing Customer link.
- The form remained open; no create success and no Customer POST occurred.

EN `http://localhost:3000/en/customers`:

- Customer list loaded with existing rows and English labels.
- “New Customer” opened the same create modal.
- Name, phone, email, tier, notes, optional address, cancel, and save controls
  were visible in English.
- Shared source flow contains the same lookup-before-create and review state;
  no mutation was sent.

Console evidence from the browser contained only React DevTools/HMR informational
messages; no error-level entries were observed in the inspected tab.

## 26. API and Permission Matrix

| Endpoint/operation | Method | Evidence | Result |
|---|---|---|---|
| `/api/v1/health` | GET | Local backend | 200 |
| `/api/v1/health/db` | GET | Local backend | 200 |
| `/api/v1/health/redis` | GET | Local backend | 200 |
| `/api/v1/health/gold` | GET | Local backend | 200 |
| `/api/v1/customers/duplicate-check` | GET | Route + browser UI; unauthenticated direct probe | Authenticated UI path; unauthenticated 401 |
| Customer create | POST | Intentionally not sent in this proof | NOT_RUN / no mutation |

The endpoint is registered before `setupCrud("customers",...)`, preventing
`duplicate-check` from being treated as a generic Customer ID.

## 27. Risk / Regression Matrix

| ID | Risk | Severity | Current disposition |
|---|---|---|---|
| CRM1B-R1 | Concurrent creates can race because phone index is nonunique | P2 open design limitation | Future Owner/schema control; no migration here |
| CRM1B-R2 | Country-coded and local phone forms may not match | P2 open policy gap | Owner decision; current helper preserved |
| CRM1B-R3 | Email duplicate policy is undefined | P2 open policy gap | No email hard rule invented |
| CRM1B-R4 | Shared phone/email policy is undefined | P2 open policy gap | No override or exception invented |
| CRM1B-R5 | Full client merge capability remains outside CRM-1B | P2 scope gap | Deferred; identity authority preserved |

`P0 = 0`, `P1 = 0`; no blocking regression was introduced by CRM-1B.

## 28. Rollback Boundary

If Owner rejects CRM-1B, the safe rollback scope is only:

- remove the new duplicate detection service;
- remove its route import/endpoint;
- remove the controller pre-transaction guard;
- remove the repository/interface/type/hook additions;
- remove the Customer page review state/UI;
- remove `backend/tests/customer-duplicate-detection.test.cjs`;
- remove the two CRM-1B documentation artifacts.

Do not revert CRM-1A, unrelated worktree changes, generated Next artifacts, or
historical evidence. No rollback was executed in this control.

## 29. Gate

`PASS_CRM_1B_DETECTION_REVIEW_WITH_CONCURRENCY_GUARANTEE_DEFERRED`

Pass basis:

- deterministic server classification is implemented;
- exact normalized phone is blocked before transaction;
- name-only review is explicit and non-authoritative;
- candidate output is minimized;
- company/auth/permission scope is preserved;
- focused tests are 9/9;
- bounded regression is 90/90;
- typecheck and build pass;
- AR/EN read-only runtime proof completed;
- official DB writes are zero;
- no P0/P1 regression introduced.

This gate explicitly carries the open concurrency guarantee and unresolved Owner
policy questions. It does not authorize CRM-1C, merge, email policy, or schema
work.

## 30. Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-CRM-1B-DUPLICATE-CUSTOMER-DETECTION-AND-REVIEW-SAFE-CONTROL-01
CURRENT_BATCH = CRM-1B
MODE = IMPLEMENTATION_WITH_FOCUSED_TESTS_AND_READ_ONLY_RUNTIME_PROOF

CURRENT_DUPLICATE_LOGIC_MAP = COMPLETE
DB_DUPLICATE_CONSTRAINT_MAP = COMPLETE
DUPLICATE_SIGNAL_MATRIX = COMPLETE
DUPLICATE_SCOPE = COMPANY_WIDE
PHONE_NORMALIZATION_AUTHORITY = SHARED_EXISTING_NORMALIZER_PROVEN; COUNTRY_CODE_MAPPING_NOT_PROVEN
EMAIL_DUPLICATE_AUTHORITY = NOT_PROVEN_OWNER_DECISION_REQUIRED
SERVER_SIDE_DUPLICATE_AUTHORITY = IMPLEMENTED
DUPLICATE_REVIEW_FLOW = IMPLEMENTED_AR_EN
DUPLICATE_LOOKUP_SECURITY = AUTH_AND_CUSTOMERS_VIEW_OR_CREATE; COMPANY_SCOPED
CANDIDATE_DATA_MINIMIZATION = PASS
HARD_DUPLICATE_PREVENTION = EXACT_NORMALIZED_PHONE_PRE_TRANSACTION_409
NAME_MATCH_POLICY = REVIEW_ONLY_EXPLICIT_ACKNOWLEDGEMENT
MERGE_OR_REMAP = NOT_IMPLEMENTED
OVERRIDE_POLICY = OWNER_DECISION_REQUIRED
CONCURRENCY_DUPLICATE_PROTECTION = NOT_PROVEN_REQUIRES_FUTURE_SCHEMA_CONTROL
RACE_CONDITION_RISK = OPEN_P2

FOCUSED_TESTS = PASS_9_OF_9
CRM_REGRESSION_TESTS = PASS_90_OF_90
TYPECHECK = PASS
BUILD = PASS
AR_BROWSER = PASS_READ_ONLY
EN_BROWSER = PASS_READ_ONLY
API_HEALTH = PASS
DB_IDENTITY = darfus_erp
DB_BUSINESS_WRITES = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
PERMISSIONS_CHANGED = 0
INVENTORY_COUNT_REOPENED = NO

SOURCE_FILES_CHANGED = 9_INTENTIONAL_CRM_1B_HUNKS_OR_NEW_FILES_ONLY
TEST_FILES_CHANGED = 1_NEW_CRM_1B_FOCUSED_TEST
DOCUMENTATION_FILES_CHANGED = 2_NEW_CRM_1B_ARTIFACTS
BUSINESS_FEATURES_IMPLEMENTED = DUPLICATE_DETECTION_AND_REVIEW_ONLY
ACCOUNTING_INTEGRITY = UNCHANGED_NO_WRITES
INVENTORY_INTEGRITY = UNCHANGED_NO_WRITES
SECURITY_INTEGRITY = PRESERVED
NEW_LESSONS = NONE_DUPLICATE_OF_EXISTING_CRM_1A_IDENTITY_GUARDRAILS

P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 5_OPEN_DOCUMENTED_LIMITATIONS
P3_COUNT = 0
GATE = PASS_CRM_1B_DETECTION_REVIEW_WITH_CONCURRENCY_GUARANTEE_DEFERRED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 31. Stop / Owner Review

STOP.

No automatic next batch, no merge, no email-policy choice, no unique-index
migration, no shared-account change, and no Customer mutation is authorized by
this report. Wait for explicit Owner review and decision.
