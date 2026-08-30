# DARFUS ERP — CRM-1B2 Canonical Phone Uniqueness & Concurrency Hardening

Control ID: `DARFUS-CLIENT-CRM-1B2-CANONICAL-PHONE-UNIQUENESS-AND-CONCURRENCY-HARDENING-01`  
Project: `I:\WORK\jewellery-erp-master`  
Official database: `darfus_erp`  
Mode: `READ_FIRST_THEN_DISPOSABLE_PROOF_THEN_MINIMUM_SAFE_PHONE_UNIQUENESS_HARDENING`

## Executive Summary

تم تنفيذ حماية الهاتف بأقل نطاق آمن: فحص التطبيق الحالي بقي موجودًا، وأضيف فهرس PostgreSQL وظيفي فريد مُسبق التحقق على Disposable Clone، مع تحويل تعارضه إلى كود 409 الثابت، وحماية فحص Customer ID المتسلسل من سباق متزامن. لا توجد كتابة على `darfus_erp`، ولم تُنفّذ Migration الرسمية.

النتيجة: أثبت الـClone أن Customerين متزامنين بنفس الهاتف canonical داخل الشركة لا يمكن أن ينجحا معًا؛ نتيجة واحدة `201` ونتيجة واحدة `409 CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED`. وأثبت تحديثان متزامنان لنفس الهاتف نتيجة واحدة `200` وواحدة `409` بنفس الكود. بقيت قاعدة `darfus_erp` على حالتها السابقة: لا فهرس فريد ولا سجل Migration جديد.

`GATE = PASS_CRM_1B2_PHONE_UNIQUENESS_DESIGN_AND_DISPOSABLE_CONCURRENCY_PROOF_AWAITING_MAIN_MIGRATION_APPROVAL`

هذا PASS خاص بالتصميم واختبار الـClone فقط؛ لا يعني أن Migration طُبقت على القاعدة الرسمية.

## Frozen Owner Phone Policy

| Policy | Frozen value | Evidence |
|---|---|---|
| Phone uniqueness | `ONE_PHONE_PER_CUSTOMER_PER_COMPANY` | Owner control CRM-1B2, Section 1 |
| Shared phone | `NO` | Owner control CRM-1B2, Section 1 |
| Email hard uniqueness | `NO` | Owner control CRM-1B2, Phase I |
| Merge | `NOT_PART_OF_CRM_1B` | CRM-1B authority and control |
| Identity authority | `Customer.id` | CRM-1A frozen authority |
| Company authority | `Customer.companyId` | Customer model/controller |
| Branch role | `BranchCustomer` relationship only | CRM-1A frozen authority |

## Read-First and Change Boundary

The complete CRM-1B2 control was read from the supplied 487-line attachment. The read-first source artifacts were reviewed before editing:

- CRM-1B report: `docs/client-requirements/crm/DARFUS_CLIENT_CRM_1B_DUPLICATE_CUSTOMER_DETECTION_AND_REVIEW_SAFE_CONTROL_01_REPORT.md`
- CRM-1B authority: `docs/client-requirements/crm/DARFUS_CUSTOMER_DUPLICATE_DETECTION_AUTHORITY.md`
- CRM-1A report and canonical identity authority
- Customer model, address sanitization, duplicate service, ERP controller/routes, repositories, customer hooks/UI, POS lookup/summary, invoice snapshots/printing, reservation receipt, and bounded Customer/POS/Sales/Invoice/Reservation/Gift Voucher/CGP/Loyalty/permission tests

`READ_FIRST = PASS`  
`PHONE_SYSTEM_WIDE_USAGE_MAP = COMPLETE`

Declared 1B2 boundary:

| Boundary | Decision |
|---|---|
| Target requirement | Company-scoped canonical phone uniqueness and concurrency guarantee |
| Exact gap | Application precheck existed; database race invariant was absent |
| Root cause | Nonunique `(company_id, phone)` index and no DB canonical uniqueness index |
| Files expected to change | Customer duplicate service, ERP controller, focused test, authority doc, one migration, one report |
| Files forbidden to change | Financial, inventory, POS sale, invoice, voucher, CGP, loyalty, RBAC, customer ID format, UI design system |
| DB change | Migration file only; execute on Disposable Clone only |
| Business logic | Duplicate boundary only; no new business workflow |
| Official DB | Read-only |

## System-Wide Phone Usage Map

| Area | Current writer/reader | Evidence | Mutation in CRM-1B2 |
|---|---|---|---|
| Customer create | `ErpController.createCustomerWithContract`; `sanitizeCustomerMutation`; `Customer.create`; `BranchCustomer.create`; audit | `backend/src/controllers/erp.controller.js:264-379`, `backend/src/services/customer-address.service.js:101-115` | Precheck preserved; DB race mapping and tenant-row lock added |
| Customer update | `ErpController.updateCustomerWithContract`; `Customer.update` | `backend/src/controllers/erp.controller.js:381-432` | Excluding-self precheck and DB race mapping added |
| Generic Customer route | `setupCrud("customers", models.Customer, ["id", "name", "phone", "email"])` | `backend/src/routes/erp.routes.js:5322` | No route/payload redesign |
| Duplicate review | `GET /customers/duplicate-check`; duplicate service | `backend/src/routes/erp.routes.js:5298-5320`, service `:73-122` | Optional `excludeCustomerId` for update |
| POS customer lookup | Normalized phone read only; active, company-scoped, branch context from auth | `backend/src/routes/erp.routes.js:5258-5290` | No change |
| Customer list/search | API repository → `/customers`; server search includes `phone`; local repository normalizes phone for duplicate review | `lib/repositories/api-impl.ts:98-120`, `backend/src/controllers/erp.controller.js:480+`, `lib/repositories/local-impl.ts:193-245` | No change |
| Customer UI create | Review lookup then create; phone field and candidate display | `app/[locale]/(dashboard)/customers/page.tsx:156-210, 682-840` | No layout/design change |
| Customer detail | Profile phone display/edit through Customer update contract | `app/[locale]/(dashboard)/customers/[id]/page.tsx:271-292, 619-625` | No change beyond server update guard |
| POS summary | Selected Customer read projection includes phone | `backend/src/services/customer-pos-summary.service.js:1-45` | No change |
| Invoice snapshots | Customer phone copied into immutable `customer_phone_snapshot` at invoice creation; print model reads snapshot | `backend/src/services/invoice-contact-snapshot.service.js:25-39`, `backend/src/models/invoice.model.js:32-35`, `features/printing/lib/invoice-print-view-model.ts:280-326` | No snapshot rewrite |
| Reservation receipt | Read-only receipt projection includes current customer phone | `backend/src/services/reservation-deposit-receipt.service.js:131-135` | No change |
| Reports/exports | Customer list/report presentation reads `customer.phone` | `app/[locale]/(dashboard)/reports/page.tsx:226`, `reports/exports/page.tsx:130` | No change |
| Sales/installments/Gift Voucher/CGP/loyalty | Source scan found domain references by Customer ID; no independent customer-phone writer or alternate phone authority | Bounded `rg` source scan and CRM-1A ownership map | No change |
| Supplier/company/employee phone | Separate contact fields, not Customer phone identity | Supplier/company/employee models/routes | Out of scope |

No second Customer-phone write authority was found. Document/invoice snapshots remain historical copies and are not rewritten by this control.

## Main DB Conflict Inventory

Read-only connection proof:

```text
TARGET|darfus_erp|postgres
```

| Inventory check | Official `darfus_erp` result | Interpretation |
|---|---:|---|
| Customers | 3 | Existing baseline |
| Raw duplicate `(company_id, phone)` groups | 0 | Compatible |
| Current-normalizer duplicate groups | 0 | Compatible |
| Possible distinct-format collision groups | 0 | Compatible |
| Null/empty canonical phone rows | 0 | Compatible |
| Inactive-customer collision groups | 0 | Compatible |
| Soft-deleted rows | 0 | Compatible |
| Soft-deleted collision groups | 0 | Compatible |
| New unique phone index present | 0 | Official migration not applied |
| New migration row present | 0 | Official migration not executed |

No row was changed to make the future constraint pass.

## Current Normalizer

The current source remains:

```js
String(phone).replace(/[^0-9]/g, "").replace(/^0+/, "")
```

The database expression is the equivalent PostgreSQL expression:

```sql
ltrim(regexp_replace(phone, '[^0-9]', '', 'g'), '0')
```

Stored `Customer.phone` remains the original user-entered value. The canonical value is an index comparison expression, not a new persisted field.

### Country-Code Analysis

No default-country or country-code authority was proven. The current source intentionally does not equate `010...`, `+20 10...`, and `0020 10...` unless the existing normalizer produces the same result. CRM-1B2 did not change this boundary.

`CURRENT_PHONE_NORMALIZATION = DIGITS_ONLY_THEN_LEADING_ZERO_STRIP`  
`CANONICAL_PHONE_NORMALIZATION = SAME_EXISTING_NORMALIZER_AS_FUNCTIONAL_INDEX`  
`COUNTRY_CODE_POLICY = OWNER_DECISION_REQUIRED_FOR_ANY_FUTURE_COUNTRY_EQUIVALENCE`  
`COUNTRY_CODE_ASSUMPTION = NONE`

The country-code uncertainty does not block this control because the proposed invariant intentionally uses the already-proven normalization and does not introduce a new equivalence rule. Any country-aware normalization requires a separate Owner decision and migration analysis.

## Canonical Phone Proposal

| Field | Decision |
|---|---|
| Proposed canonical | Existing digit-only/leading-zero-stripped value |
| Storage | No new column; functional expression in DB index |
| Scope | `company_id` + canonical phone |
| Deleted identity behavior | Full-company index prevents reuse by a soft-deleted identity; current candidate review still filters `deleted_at IS NULL` |
| Existing data impact | Migration fails closed on null/empty canonical values or duplicate groups; official inventory has zero of both |
| POS impact | None; existing normalized read lookup remains unchanged |
| API impact | Same create/update payloads; only duplicate races gain a stable 409 |
| Invoice snapshot impact | None; snapshots remain immutable historical copies |
| Backward compatibility | Raw phone display/search preserved; non-final domains untouched |

## Database Strategy Comparison

| Strategy | Migration/backfill | DB guarantee | App compatibility | Rollback | Risk | Decision |
|---|---|---|---|---|---|---|
| A. Functional unique index `(company_id, expression)` | Preflight only; no backfill | Direct concurrency invariant | Keeps raw phone and payload unchanged | Drop named index on disposable/approved target | Lock duration depends on table size; must measure before main | **Chosen** |
| B. Persisted `canonical_phone` + unique constraint | Adds column, backfill, model/schema contract | Strong | Wider model/API/schema surface | Column/index rollback is broader | Backfill and dual-write drift | Not chosen |
| C. Normalize stored `phone` + unique index | Rewrites user-entered values | Strong | Breaks raw display/history assumptions | Data restoration required | Historical/contact and snapshot risk | Not chosen |
| D. Application/advisory lock only | No DB uniqueness invariant | Not sufficient as sole authority | Requires every writer to cooperate | No schema rollback | Hidden alternate writer/race risk | Not chosen |

Chosen invariant:

```text
UNIQUE(company_id, ltrim(regexp_replace(phone, '[^0-9]', '', 'g'), '0'))
```

## Source Implementation

### Migration

`backend/migrations/20260830010000-customer-phone-uniqueness.js`:

1. Runs in a transaction.
2. Fails closed if any existing phone is null or canonicalizes to empty.
3. Fails closed if any company has a duplicate canonical phone group.
4. Creates `customers_company_id_canonical_phone_uq` as a functional unique index.
5. `down` drops only that named index.

### Stable error mapping

`backend/src/controllers/erp.controller.js:195-216,349-378,428-430`:

- Identifies the named index from Sequelize/PostgreSQL constraint fields.
- Accepts PostgreSQL `23505` only when the named phone index is the source.
- Returns `409 CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED` with a phone field error.
- Does not expose raw PostgreSQL text to the UI.
- Does not retry a phone conflict as a generated-ID conflict.

### Create ID-race protection

`backend/src/controllers/erp.controller.js:334-344` locks the company row inside the existing Customer create transaction before the current sequential Customer-ID scan. This is required because a concurrent generated-ID collision could otherwise abort the transaction before the phone constraint reports its stable conflict. The ID format remains `CUS-####` and is unchanged.

### Update protection

`backend/src/services/customer-duplicate-detection.service.js:73-122` accepts `excludeCustomerId`. The update path performs the existing normalized-phone review before opening its transaction, excluding the same Customer identity, and still maps a DB race through the same 409 contract.

## Disposable Clone Proof

Official source was dumped read-only before clone creation:

| Evidence | Result |
|---|---|
| Dump artifact | `backend/acceptance-artifacts/crm-1b2/darfus_erp_pre_crm_1b2.dump` |
| Dump size | 905,909 bytes; non-empty |
| Dump SHA-256 | `12413099C0C50D293F2A452D6C09990AC2DBE8CAD8A05B490AD400A97CA6C489` |
| Clone | `darfus_crm_1b2_phone_unique_20260830` |
| Clone identity before restore | `darfus_crm_1b2_phone_unique_20260830|postgres` |
| Restored Customer rows | 3 |
| Official DB touched | No |

The migration was executed only on the Clone. Post-apply evidence:

```text
darfus_crm_1b2_phone_unique_20260830|postgres
customers_company_id_canonical_phone_uq|CREATE UNIQUE INDEX ... (company_id, ltrim(regexp_replace(phone, ...), '0'))
invalid canonical rows|0
```

## Migration Proof

`up` applied successfully to the Clone and exposed the exact named unique index. `down` then completed successfully on the same Clone and the named index count became `0`. No official migration row was created; `darfus_erp` still reports `official_migration_row = 0`.

No migration was executed against `darfus_erp`.

## Concurrency Proof

All records below were synthetic and confined to the Disposable Clone.

| Scenario | Observed result | Expected | Status |
|---|---|---|---|
| Normal Customer create through fresh controller | `201`, one Customer/BranchCustomer path | Success | PASS |
| Same canonical phone, alternate formatting | `409 CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED` | Duplicate blocked | PASS |
| Same canonical phone, different email | Phone conflict | Email does not override phone policy | PASS |
| Inactive Customer duplicate | DB unique violation caught; no second row | Inactive identity still blocks reuse | PASS |
| Two direct Sequelize creates concurrently | one fulfilled, one `23505` at named index | one success maximum | PASS |
| Two controller creates concurrently | one `201`, one `409 CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED` with `source=DATABASE_UNIQUE_INDEX` | stable losing response | PASS |
| Two controller updates concurrently | one `200`, one `409` with the same stable code | update cannot bypass create rule | PASS |
| Same email on different phones | accepted in Clone | email is not hard key | PASS |

`CONCURRENCY_DUPLICATE_PROTECTION = PASS`  
`CREATE_PHONE_UNIQUENESS = PASS`  
`UPDATE_PHONE_UNIQUENESS = PASS`

The first exploratory direct-model formatting string was not a canonical equivalent and therefore created a distinct synthetic row in the Clone; it was superseded by the exact equivalent formatting/controller proof above. It never touched the official database.

## Stable Error Mapping

The real controller race returned:

```text
HTTP-equivalent status: 409
code: CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED
details.matchType: EXACT_NORMALIZED_PHONE_MATCH
details.source: DATABASE_UNIQUE_INDEX
```

The losing request did not leak `SequelizeUniqueConstraintError`, PostgreSQL constraint text, or a generated-ID retry failure. The previous unprotected company-ID race was reproduced and then closed by the company-row lock described above.

`DB_UNIQUENESS_ERROR_MAPPING = PASS`

## Create/Update Compatibility

- Customer ID remains permanent and server-generated in the existing `CUS-####` format.
- Normal Customer create remains successful when the company/canonical phone is unused.
- Exact normalized duplicate create is rejected before transaction where visible.
- A race that passes the read precheck is rejected by the DB index and mapped to the same 409 contract.
- Customer update excludes the current ID, so saving the same phone on itself is not treated as a duplicate.
- Update-to-another-customer phone is rejected by precheck or the DB index.
- Inactive customers remain identity conflicts.
- Soft-deleted reuse is blocked by the proposed full-company index; official data contains no soft-deleted rows.
- Email remains non-unique and is not used as a hard signal.
- Name remains review-only.

## Focused Tests

Command:

```text
node --test backend/tests/customer-duplicate-detection.test.cjs
```

Result: `13 pass, 0 fail`.

The focused suite covers the normalizer, country-code non-assumption, signal classification, minimized DTO, create guard ordering, route ordering, UI review ordering, migration preflight/index/down contract, DB error mapping, company-row lock, update exclusion, and email policy.

## Cross-Module Regression

Command: bounded Customer/POS/Sales/Invoice/Reservation/Gift Voucher/CGP/Loyalty/permission suite from the CRM-1B control.

Result: `95 pass, 0 fail`.

The suite did not execute Customer creation, financial posting, inventory mutation, voucher mutation, CGP mutation, merge, remap, or permission mutation against the official DB.

## Typecheck and Build

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `next-env.d.ts` after build | SHA `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`, unchanged from accepted owner drift |
| Next dev started | NO |

## Frontend Design Preservation

No Customer UI file was changed by CRM-1B2. The existing modal, duplicate review state, AR/EN copy, RTL/LTR, light/dark behavior, and responsive layout remain the CRM-1B contract. The DB race response uses the existing stable error code and does not require a new UI or a second duplicate workflow.

`FRONTEND_DESIGN_FREEZE = PRESERVED`  
`LAYOUT_CHANGED = NO`  
`DESIGN_SYSTEM_CHANGED = NO`

## Security

- Authentication is unchanged.
- `customers.view`, `customers.create`, and `customers.update` checks are unchanged.
- Company scope remains server-derived.
- Branch scope remains server-enforced through `BranchCustomer`.
- The company row lock is an internal transaction safety measure, not a permission shortcut.
- No shared account, shared branch login, permission widening, or fail-open fallback was introduced.

`PERMISSION_BEHAVIOR_CHANGED = NO`  
`SECURITY_INTEGRITY = PRESERVED`

## Main DB Safety

### Final read-only identity and counts

| Read-only check | Final value |
|---|---:|
| `current_database()` / `current_user` | `darfus_erp / postgres` |
| customers | 3 |
| branch_customers | 3 |
| assets | 23 |
| invoices | 10 |
| payments | 20 |
| journal_entries | 73 |
| journal_lines | 200 |
| audit_logs | 330 |
| idempotency_requests | 161 |
| official phone unique index | absent (`0`) |
| official CRM-1B2 migration row | absent (`0`) |

The dump command was read-only. Clone creation, restore, migration, synthetic Customer tests, controller tests, and rollback occurred only in `darfus_crm_1b2_phone_unique_20260830`.

`MAIN_DB = darfus_erp`  
`MAIN_DB_READ_ONLY = YES`  
`MAIN_DB_MIGRATIONS_EXECUTED = 0`  
`MAIN_DB_CUSTOMER_DELTA = 0`  
`MAIN_DB_CUSTOMER_ID_REFERENCE_DELTA = 0`  
`MAIN_DB_FINANCIAL_DELTA = 0`  
`MAIN_DB_INVENTORY_DELTA = 0`  
`MAIN_DB_PERMISSION_DELTA = 0`

The Clone is retained as a disposable forensic target; no official data was copied back or cleaned.

## Main Migration Owner Decision Packet

| Required item | Value |
|---|---|
| `ROOT_CAUSE` | Read-before-create is not a concurrency guarantee; current customer phone index is nonunique |
| `PROPOSED_CHANGE` | Apply named functional unique index after fail-closed preflight |
| `MIGRATION_FILE` | `backend/migrations/20260830010000-customer-phone-uniqueness.js` |
| `INDEX_OR_CONSTRAINT` | `customers_company_id_canonical_phone_uq` |
| `NORMALIZATION_RULE` | Existing digits-only then leading-zero stripping; no country mapping |
| `EXISTING_CONFLICT_COUNT` | 0 on official baseline |
| `DISPOSABLE_CONCURRENCY_RESULT` | PASS: one success maximum, one stable duplicate 409 |
| `ROLLBACK_METHOD` | Drop the named index through migration `down` on approved target; tested on Clone |
| `EXPECTED_LOCKING` | PostgreSQL unique-index build lock; Customer create also locks its company row during ID scan |
| `EXPECTED_DURATION` | Not measured on official; requires Owner-approved maintenance window/measurement before promotion |
| `REGRESSION_RADIUS` | Customer create/update and duplicate-check only; no email, invoice, POS sale, accounting, inventory, voucher, CGP, or loyalty authority change |
| `OWNER_APPROVAL_REQUIRED_FOR_MAIN_MIGRATION` | YES |

`MAIN_DB_MIGRATION_EXECUTION = NOT_AUTHORIZED_AUTOMATICALLY`

## Known Risks and Deferred Decisions

| Risk | Severity | Disposition |
|---|---|---|
| Official DB still lacks the unique index, so its race guarantee is not yet active | P1 pending promotion, not introduced by this source change | Owner decision required before official migration |
| Country-code equivalence is not defined | P2/design decision | Do not change current normalizer; separate Owner decision |
| Current duplicate-review query excludes soft-deleted rows while the full-company index blocks phone reuse | P2 UX/documentation edge | No current soft-deleted rows; future tombstone review UX needs separate scope |
| Invalid empty phone values are rejected by migration preflight but no new phone schema validation was added | P2 contract hardening candidate | Separate Owner-approved phone validation decision; no widening in 1B2 |
| Production index-build duration is unmeasured | P2 operational | Measure on approved rehearsal/maintenance plan before main promotion |

No P0 or newly introduced P1 regression was found.

## Prevention Record

| Lesson | Root cause | Prevention |
|---|---|---|
| `CRM-1B2-L01` | Sequential Customer-ID scan was not serialized, so an ID race could abort a transaction before the intended phone conflict was mapped | Lock the company row before the Customer ID scan and test concurrent controller creates |
| Existing duplicate class | Application precheck alone cannot close a DB race | Require a DB-native uniqueness invariant for any future promotion and keep the stable error mapping test |

## Files Changed / Scope Ledger

### 1B2-intended source/document delta

| File | 1B2 change | Baseline / after evidence |
|---|---|---|---|
| `backend/src/controllers/erp.controller.js` | Named phone-index mapping, company-row ID-scan lock, update/create race mapping | Pre-edit hash captured before 1B2; final `00D75421118ED7E7C61D91FD951F351DEC8F35C4861285F0B1EA0FF00D290607` |
| `backend/src/services/customer-duplicate-detection.service.js` | `excludeCustomerId` for update precheck | Pre-edit hash captured before 1B2; final `8544313AF405B4C3F9B98DA78CA8DDB542A72BF10A1A7B18CB04E09F79AFF555` |
| `backend/tests/customer-duplicate-detection.test.cjs` | 4 focused CRM-1B2 contract tests | Pre-edit hash captured before 1B2; final `1449442F984B9B3350AD7E26DFFB03C4150EEC9D4E555B91A4E97017667D343B` |
| `backend/migrations/20260830010000-customer-phone-uniqueness.js` | New fail-closed migration; no official execution | absent before 1B2; final `14101054EAAA514C05C2EDEFF180214EB195AE6395FB6D47E5F32732A3E680D5` |
| `docs/client-requirements/crm/DARFUS_CUSTOMER_DUPLICATE_DETECTION_AUTHORITY.md` | Frozen phone policy and 1B2 concurrency authority | Pre-edit hash captured before 1B2; final `913C2178182FC3CCBE1C435733078A65C8291B6FDD5001F05E55282F24F33D62` |
| `docs/client-requirements/crm/DARFUS_CLIENT_CRM_1B2_CANONICAL_PHONE_UNIQUENESS_AND_CONCURRENCY_HARDENING_01_REPORT.md` | This report | created after final proof |

The worktree was already heavily dirty before CRM-1B2 (pre-existing tracked modifications and untracked CRM/acceptance artifacts). No reset, restore, clean, stash, or unrelated cleanup was performed. The `next-env.d.ts` owner-accepted generated drift was not edited.

## Final Gate

The design, migration rehearsal, create/update, concurrency, stable mapping, focused tests, cross-module regression, typecheck, build, and official read-only safety conditions passed. The only remaining gate is explicit promotion approval for running the migration on `darfus_erp`.

`GATE = PASS_CRM_1B2_PHONE_UNIQUENESS_DESIGN_AND_DISPOSABLE_CONCURRENCY_PROOF_AWAITING_MAIN_MIGRATION_APPROVAL`

## Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-CRM-1B2-CANONICAL-PHONE-UNIQUENESS-AND-CONCURRENCY-HARDENING-01
OWNER_PHONE_POLICY = ONE_PHONE_PER_CUSTOMER_PER_COMPANY
SHARED_PHONE_ALLOWED = NO
CUSTOMER_ID_MUTATION = 0
MERGE_EXECUTED = NO
REFERENCE_REMAP = 0
PHONE_SYSTEM_WIDE_USAGE_MAP = COMPLETE
MAIN_DB_PHONE_CONFLICT_INVENTORY = COMPLETE
CURRENT_PHONE_NORMALIZATION = DIGITS_ONLY_THEN_LEADING_ZERO_STRIP
CANONICAL_PHONE_NORMALIZATION = SAME_EXISTING_NORMALIZER_AS_FUNCTIONAL_INDEX
COUNTRY_CODE_POLICY = OWNER_DECISION_REQUIRED_FOR_ANY_FUTURE_COUNTRY_EQUIVALENCE
DB_UNIQUENESS_STRATEGY = FUNCTIONAL_UNIQUE_INDEX_COMPANY_ID_CANONICAL_PHONE
EXISTING_DATA_CONFLICTS = 0
DISPOSABLE_MIGRATION = PASS
CREATE_PHONE_UNIQUENESS = PASS
UPDATE_PHONE_UNIQUENESS = PASS
CONCURRENCY_DUPLICATE_PROTECTION = PASS
DB_UNIQUENESS_ERROR_MAPPING = PASS
EMAIL_HARD_UNIQUENESS = NO
FRONTEND_DESIGN_FREEZE = PRESERVED
PERMISSION_BEHAVIOR_CHANGED = NO
FOCUSED_TESTS = PASS_13_OF_13
CROSS_MODULE_REGRESSION = PASS_95_OF_95
TYPECHECK = PASS
BUILD = PASS
MAIN_DB = darfus_erp
MAIN_DB_READ_ONLY = YES
MAIN_DB_MIGRATIONS_EXECUTED = 0
MAIN_DB_CUSTOMER_DELTA = 0
MAIN_DB_CUSTOMER_ID_REFERENCE_DELTA = 0
MAIN_DB_FINANCIAL_DELTA = 0
MAIN_DB_INVENTORY_DELTA = 0
P0 = 0
P1_REGRESSION = 0
GATE = PASS_CRM_1B2_PHONE_UNIQUENESS_DESIGN_AND_DISPOSABLE_CONCURRENCY_PROOF_AWAITING_MAIN_MIGRATION_APPROVAL
FULL_CRM = NOT_CLOSED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_MAIN_PHONE_UNIQUENESS_MIGRATION_PACKET
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

Do not run the phone uniqueness migration on `darfus_erp` automatically. Do not start CRM-1C, merge customers, remap references, Customer 360, communication, consent, or another CRM batch. Wait for Owner review and explicit authorization of the main migration packet.
