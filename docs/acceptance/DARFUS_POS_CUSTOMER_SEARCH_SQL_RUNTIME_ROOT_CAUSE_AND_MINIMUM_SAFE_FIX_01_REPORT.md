# DARFUS ERP — POS Customer Search SQL Runtime Root Cause & Minimum Safe Fix

تم إثبات سبب خطأ SQL وإصلاحه داخل مسار بحث عملاء POS فقط. السبب كان مخالفة PostgreSQL لقاعدة `SELECT DISTINCT` مع `ORDER BY CASE` غير موجود في قائمة `SELECT`. أزيلت `DISTINCT` واستُخدم `EXISTS` لعضوية الفرع، فبقيت كل حدود المصادقة والشركة والفرع والهاتف والنتائج كما هي. اختبارات المصدر والانحدار وقراءة PostgreSQL والمتصفح نجحت، ولم تحدث أي كتابة أعمال على `darfus_erp`.

```text
CURRENT_CONTROL = DARFUS-POS-CUSTOMER-SEARCH-SQL-RUNTIME-ROOT-CAUSE-AND-MINIMUM-SAFE-FIX-01
MODE = FORENSIC_FIRST_THEN_OWNER_APPROVED_MINIMUM_SAFE_FIX
OWNER_APPROVAL = EXPLICIT_WITHIN_EXACT_SCOPE
```

## 1. Executive Summary

| Area | Result | Evidence |
|---|---|---|
| Root cause | PROVEN | PostgreSQL `42P10` at `ORDER BY CASE` in the pre-fix query |
| Minimum fix | IMPLEMENTED | Same GET route; `SELECT` + branch `EXISTS`; no frontend change |
| Security scope | PRESERVED | Auth middleware, POS permissions, company and required branch resolution remain in route |
| Phone authority | PRESERVED | Search-only normalization; no inference, persistence, or rewrite |
| SQL runtime | PASS | Arabic, ASCII, ID-shaped, local phone, international, and no-result queries completed without SQL failure |
| Browser runtime | PASS | AR/EN search results, explicit selection, clear/change, no-result CTA, no 500 |
| Database safety | PASS | `current_database() = darfus_erp`; no business mutation; no migration executed |

## 2. Proven Runtime Baseline

### Pre-fix state

The supplied control established that the backend had already been refreshed and that authenticated requests reached the route but returned HTTP 500 for Arabic, ASCII, and customer-search queries. The pre-fix direct SQL reproduction below independently proves the database failure.

### Runtime after the fix

| Check | Result | Evidence |
|---|---|---|
| Backend container | Running | `darfus-backend`, restart count 0 after controlled refresh |
| Backend listener | PASS | startup log: `Listening on Port: http://localhost:8000` |
| Backend health | 200 | `GET /api/v1/health` |
| PostgreSQL health | 200 | `GET /api/v1/health/db` |
| Redis health | 200 | `GET /api/v1/health/redis` |
| Database identity | `darfus_erp` | read-only `SELECT current_database()` |
| Migration status | `DOWN = 0` | `db:migrate:status`, all listed migrations `up` |
| Migration execution on refresh | 0 | startup log: `No migrations were executed, database schema was already up to date.` |

The only service restart was the explicitly authorized backend refresh after verifying zero pending migrations. No frontend dev server was started.

## 3. Pre-Change Hashes

Captured before the SQL edit:

| File | Pre-change SHA-256 |
|---|---|
| `backend/src/routes/erp.routes.js` | `CC4F84033F569447DEC35C19E100D3C7D4FD6C7C1489993C03BCDEBEBF9B8CBE` |
| `backend/tests/pos-customer-universal-search.test.cjs` | `B3488D48C511F1D264CD8C646DAC3C5B4315A9ACE5CE35A08A1C515A013A349B` |

Relevant worktree state before the edit remained dirty from earlier work:

```text
M  app/[locale]/(dashboard)/pos/page.tsx
M  backend/src/routes/erp.routes.js
M  features/sales/hooks/use-pos.ts
?? backend/src/services/customer-phone.service.js
?? backend/tests/pos-customer-universal-search.test.cjs
```

Those unrelated pre-existing changes were preserved and not cleaned, reset, restored, or stashed.

## 4. Actual DB Schema

Read-only PostgreSQL `information_schema.columns` inspection returned:

| Table.Column | PostgreSQL type | Nullable | Result |
|---|---|---:|---|
| `customers.id` | `character varying` (`varchar`) | NO | Present |
| `customers.company_id` | `varchar` | NO | Present |
| `customers.name` | `varchar` | NO | Present |
| `customers.phone` | `varchar` | NO | Present |
| `customers.phone_country` | `varchar` | YES | Present |
| `customers.canonical_phone` | `varchar` | YES | Present |
| `customers.status` | `USER-DEFINED` (`enum_customers_status`) | YES | Present |
| `customers.deleted_at` | `timestamp with time zone` | YES | Present |
| `branch_customers.customer_id` | `varchar` | NO | Present |
| `branch_customers.company_id` | `varchar` | NO | Present |
| `branch_customers.branch_id` | `varchar` | NO | Present |
| `branch_customers.is_active` | `boolean` | NO | Present |

Required tokens:

```text
CUSTOMER_ID_DB_TYPE = VARCHAR
BRANCH_CUSTOMER_ID_DB_TYPE = VARCHAR
CANONICAL_PHONE_COLUMN_EXISTS = YES
PHONE_COUNTRY_COLUMN_EXISTS = YES
```

Official read-only data summary, with no phone values printed:

```text
customers_total = 3
canonical_phone_count = 0
explicit_country_count = 0
uae_canonical_count = 0
```

## 5. Exact PostgreSQL Error

The pre-fix route-shaped SELECT was reproduced directly through `psql` using a safe read-only context and the ASCII query `cu`:

```text
POSTGRES_ERROR_CODE = 42P10
POSTGRES_ERROR_MESSAGE = for SELECT DISTINCT, ORDER BY expressions must appear in select list
POSTGRES_ERROR_POSITION = LINE 24, at CASE in ORDER BY
FAILING_SQL_FRAGMENT = ORDER BY CASE WHEN c.canonical_phone = :canonicalPhone THEN 0 ... END
```

PostgreSQL verbose output also identified `transformDistinctClause, parse_clause.c:3008`. This is a parse/planner contract failure and does not depend on whether matching rows exist.

## 6. SQL Failure Hypothesis Matrix

| Hypothesis | Proven? | Exact evidence |
|---|---|---|
| H1 — `SELECT DISTINCT` + `ORDER BY CASE` expression absent from SELECT | YES; PRIMARY | Direct pre-fix reproduction returned `42P10` at `CASE` |
| H2 — UUID/non-text `c.id = :query` comparison | NO | `customers.id` is `varchar`; `SELECT count(*) ... WHERE c.id = 'cu'` completed with 0 |
| H3 — invalid/multi-character `ESCAPE` in current SQL | NO | Current SQL’s resulting single-character `ESCAPE '\'` query completed successfully |
| H4 — branch join column/alias mismatch | NO | All four branch columns exist; join query completed and returned an existing ID |
| H5 — missing/type-invalid `canonical_phone` | NO | Column exists as nullable `varchar`; zero-row column probe completed |
| H6 — missing/type-invalid `phone_country` | NO | Column exists as nullable `varchar`; zero-row column probe completed |
| H7 — `regexp_replace` incompatible with phone type | NO | `regexp_replace(COALESCE(c.phone,''),...)` completed on `varchar` |
| H8 — replacement/binding issue | NO | PostgreSQL prepared text binding for name `ILIKE` completed (`PREPARE`, execution count 0, `DEALLOCATE`) |
| H9 — other SQL defect after H1 removal | NO | Final route-shaped query executed for all read-only matrix values without SQL error |

The first failed diagnostic attempt that intentionally used two backslashes in a standalone psql literal is not evidence against the route: it was a malformed diagnostic string. The actual JavaScript route literal resolves to the valid one-character PostgreSQL escape form, confirmed independently.

## 7. Read-Only Pre-Fix Query Matrix

Because H1 occurs at statement analysis, every non-short query was expected to fail before row matching. The supplied runtime evidence showed 500 for Arabic and ASCII queries; the direct reproduction showed the same SQL error for `cu`.

| Query class | Pre-fix expected/observed | Root-cause interpretation |
|---|---|---|
| Arabic text `احمد` | HTTP 500 in supplied authenticated baseline | Same statement-level H1 failure |
| ASCII `cu` | HTTP 500; direct psql `42P10` | Same H1 failure |
| Customer ID-shaped `CUS-0001` | Would fail at statement analysis | Not an ID type failure; H2 rejected |
| Local phone fragment `0101` | Would fail at statement analysis | `regexp_replace` is valid; H7 rejected |
| International input | Would fail at statement analysis before exact branch | No canonical rows existed to match |
| No-result `zzzzz99999` | Would fail at statement analysis before `[]` | H1 was independent of result cardinality |

No customer phone values are reproduced in this report.

## 8. Root Cause

```text
PRIMARY_ROOT_CAUSE = POSTGRES_DISTINCT_ORDER_BY_EXPRESSION_VIOLATION
SECONDARY_ROOT_CAUSES = NONE
CURRENT_FAILURE_LAYER = BACKEND_SQL_RUNTIME
FRONTEND_AS_ROOT_CAUSE = NOT_SUPPORTED
AUTH_AS_ROOT_CAUSE = NOT_SUPPORTED
STALE_BACKEND_AS_ROOT_CAUSE = CLOSED_BY_REFRESH
```

`SELECT DISTINCT` requires every `ORDER BY` expression to be represented in the select list. The pre-fix `CASE` expression was not. `c.name` and `c.id` individually were selected, but the composite `CASE` expression was not. This was the exact reason for HTTP 500.

## 9. Owner Minimum Safe Change Packet

```text
ROOT_CAUSE = POSTGRES_DISTINCT_ORDER_BY_EXPRESSION_VIOLATION
PROPOSED_CHANGE = Remove DISTINCT and replace duplicate-producing branch join with correlated EXISTS; project the resolved branch ID explicitly.
FILES_TO_CHANGE = backend/src/routes/erp.routes.js; backend/tests/pos-customer-universal-search.test.cjs; this report
WHY_THIS_IS_MINIMUM_SAFE_CHANGE = One route SQL shape change; no schema, index, frontend, or business workflow change.
WHY_SECURITY_SCOPE_WILL_NOT_CHANGE = Existing auth, permission, company, branch, active, deleted, and limit predicates remain.
WHY_PHONE_AUTHORITY_WILL_NOT_CHANGE = Phone normalization and canonical matching clauses are unchanged; no write path is added.
WHY_DB_SCHEMA_WILL_NOT_CHANGE = Existing varchar/boolean columns satisfy the corrected query; no DDL is needed.
EXPECTED_RUNTIME_EFFECT = HTTP 500 -> HTTP 200 bounded search, with expected 401/409 behavior preserved.
REGRESSION_RADIUS = POS customer search endpoint only.
ROLLBACK_METHOD = Restore only the exact route hunk from the pre-change bytes/hash; no Git reset/restore used.
BEFORE_HASHES = Recorded in Section 3.
```

## 10. Exact Source Diff

In `backend/src/routes/erp.routes.js`, the final route now:

1. Uses `SELECT` rather than `SELECT DISTINCT`.
2. Projects `CAST(:branchId AS VARCHAR) AS "branchId"`.
3. Removes the row-multiplying `INNER JOIN branch_customers` from the outer query.
4. Uses a correlated `EXISTS` with the same `customer_id`, `company_id`, `branch_id`, and `is_active = TRUE` predicates.
5. Preserves the existing matching clauses, `ORDER BY CASE`, bounded limit, exact-canonical ambiguity guard, and DTO.

The `EXISTS` shape guarantees one outer customer row per customer without adding a hidden deduplication rule or changing customer identity semantics.

Final route hash:

```text
backend/src/routes/erp.routes.js = 1664EDA14E30AF19D0495755531377CBC146C573E545DF62968AB7463F66D1C8
```

No frontend file was changed in this Control. `customer-phone.service.js` was not changed in this Control; its pre-existing search helper was sufficient.

## 11. Focused Tests

Command:

```text
node --test backend/tests/pos-customer-universal-search.test.cjs
```

Result: **4/4 PASS**.

The route test now explicitly guards against reintroducing `SELECT DISTINCT` and requires branch `EXISTS` and explicit branch projection. Other checks cover auth, permission, company/branch scope, active/deleted filters, ambiguity guard, DTO, no writes, phone authority, no full customer preload, and one explicit UI combobox.

The targeted SQL behavior was also validated by one-off read-only PostgreSQL queries, not by inserting fixtures into the official DB.

## 12. Regression Tests

| Command | Result |
|---|---|
| `node --test backend/tests/pos-redesign-phase-02-universal-search-customer.test.cjs` | 4/4 PASS |
| `node --test tests/stage-c-pos-financial-integration.test.cjs` | 3/3 PASS |
| `node --test backend/tests/pos-asset-status-mapping-surgical-correction.test.cjs` | 3/3 PASS |

```text
FOCUSED_TESTS = PASS (4/4)
REGRESSION_TESTS = PASS (10/10)
```

## 13. Syntax Check

```text
node --check backend/src/routes/erp.routes.js = PASS
```

`npm run typecheck` also completed with exit code 0 after the route edit.

## 14. Migration Status Gate

`docker compose exec -T backend npx sequelize-cli db:migrate:status` reported every migration as `up`; no `down` migration was present.

```text
PENDING_MIGRATIONS = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
```

No migration, seed, index, DDL, or schema modification was created.

## 15. Backend Refresh

The explicitly authorized `docker compose restart backend` was performed only after the zero-pending gate. Startup evidence:

```text
No migrations were executed, database schema was already up to date.
Listening on Port: http://localhost:8000
```

The container remained `running` with Docker restart count `0` after the refresh. Health probes after refresh were all 200.

## 16. Unauthenticated Auth Proof

```text
GET /api/v1/pos/customers/search?query=CUS&limit=20 without session = 401
```

This proves the route is loaded and authentication remains enforced. The route does not return a public customer list.

## 17. Authenticated Runtime Search Matrix

The existing authenticated browser session was used after the backend refresh. No customer create/edit or sales action was performed.

| Locale | Query class | Observed result | HTTP/log evidence |
|---|---|---|---|
| AR | Arabic `احمد` | One matching option | Backend search status 200 |
| AR | ASCII `cu` | One matching option | Backend search status 200 |
| AR | ID-shaped `CUS-0001` | No-result state | Backend search status 200 |
| AR | Local phone fragment | One matching option | Backend search status 200 |
| AR | International prefix `+971` | No-result state | Backend search status 200 |
| AR | No-result `zzzzz99999` | `[]` / no-result CTA | Backend search status 200 or conditional 304 with retained read-only result |
| EN | ASCII `cu` | One matching option | Backend search status 200 |
| EN | Full synthetic international input | No-result state | Backend search status 200 |
| EN | No-result `zzzzz99999` | No-result CTA | Backend search status 200/conditional 304 |

The backend request log after refresh contained one expected unauthenticated 401 followed by successful 200 searches and conditional 304 responses; it contained no search 500 after the fix.

```text
HTTP_500_COUNT_POST_FIX = 0
```

## 18. Exact Phone Safety

The current official DB has zero `canonical_phone` and zero explicit `phone_country` values, so no existing exact canonical phone match or ambiguity case was available for live data. No data was created to manufacture one.

The exact safety path remains source-tested and SQL-validated:

- international `00` input normalizes to a canonical search value only;
- local input does not infer country;
- exact company check is capped at two rows;
- more than one active company match raises `409 CUSTOMER_PHONE_AMBIGUOUS`;
- no phone field is written or rewritten.

```text
EXACT_CANONICAL_EXISTING_DATA = NOT_AVAILABLE_IN_CURRENT_DB
EXACT_PHONE_SAFETY = PASS_SOURCE_AND_READ_ONLY_SQL
```

## 19. Browser POS UX

### Arabic

- One field: `ابحث بالاسم أو رقم العميل أو الهاتف`.
- No country selector.
- Initial customer is none.
- `cu`/`0114`/`احمد` produced a candidate.
- Clicking the candidate displayed the selected customer summary.
- `مسح العميل المحدد` cleared selection without reload.
- `CUS-0001`, `+971`, and `zzzzz99999` showed the no-result message and navigation-only Create Customer CTA.

### English

- One field: `Search by customer name, ID, or phone`.
- No country selector.
- Initial customer is none.
- `cu` produced a candidate and explicit click selection worked.
- `Clear selected customer` cleared the selection without reload.
- No-result state showed `Create the customer from Customers` as a link only.

Keyboard behavior was exercised with ArrowDown and Escape; Escape produced `aria-expanded=false`. Tab remains normal focus navigation through the native combobox/button controls.

## 20. AR / EN

```text
AR_SEARCH_RUNTIME = PASS
EN_SEARCH_RUNTIME = PASS
RTL = PASS
LTR = PASS
```

The served paths were `/ar/pos` and `/en/pos`. The displayed customer data was read-only and no mutation action was submitted.

## 21. Console/Network

Current browser diagnostic logs after the new page load contained only React DevTools and HMR informational entries. No current search-caused console error or page error was present.

Server log evidence showed:

```text
SEARCH_500 = 0
POST caused by search = 0
PUT caused by search = 0
PATCH caused by search = 0
DELETE caused by search = 0
```

Conditional `304` responses appeared for repeated cached read-only queries; they were not errors and the UI remained in the correct candidate/no-result state. No request body, credential, token, cookie, or full sensitive phone number was recorded in this report.

## 22. Phone Authority Regression

```text
POS_SEARCH_COUNTRY_SELECTOR = ABSENT
CUSTOMER_CREATE_PHONE_COUNTRY_AUTHORITY = PRESERVED
CUSTOMER_EDIT_PHONE_COUNTRY_AUTHORITY = PRESERVED
CANONICAL_PHONE_PERSISTENCE = PRESERVED
PHONE_SEARCH_IS_READ_ONLY = YES
```

Evidence is the unchanged explicit-country customer-phone service and the focused no-inference/read-only test. No frontend or backend write contract for customer creation/editing was changed.

## 23. DB/Mutation Safety

| Safety item | Result | Evidence |
|---|---|---|
| Official DB identity | PASS | `SELECT current_database() = darfus_erp` |
| Business DB writes | 0 | Only GET health/search and read-only schema/query diagnostics |
| Customer writes | 0 | No create/edit request |
| Financial writes | 0 | No sale/payment/invoice request |
| Inventory writes | 0 | No inventory request |
| Migrations | 0 created/executed | All status `up`; startup explicitly reported none executed |
| Seeds | 0 | No seeder command |
| Schema/index change | 0 | Route-only SQL correction |
| Production | untouched | Only local `localhost:8000`/`darfus_erp` runtime was used |

The backend restart was process control, not a business DB mutation. No SQL `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, or DDL was issued.

## 24. Open Items Not Touched

- CRM-1B4 main migration.
- CRM-1C, A8, and client-requirements parity tracks.
- Customer create/edit implementation and phone uniqueness migration.
- Checkout, sale, payment, invoice, inventory, accounting, and tax logic.
- Inventory Count.
- Theme, Gold provider, Gift Voucher, CGP print recovery, and UX11C.
- No broad global error-handling change.

## 25. Gate

```text
GATE = PASS_POS_CUSTOMER_SEARCH_SQL_RUNTIME_MINIMUM_SAFE_FIX
```

Pass basis:

- exact PostgreSQL root cause proven;
- route-only minimum fix applied;
- auth, permission, company, branch, active/deleted, read-only DTO, result limit, and phone authority preserved;
- unauthenticated route remains 401;
- authenticated AR/EN searches return candidates or no-result without 500;
- focused and regression tests pass;
- syntax/typecheck pass;
- migrations/schema/data/business writes are zero;
- no P0/P1 regression observed.

## 26. Final Tokens

```text
CURRENT_CONTROL = DARFUS-POS-CUSTOMER-SEARCH-SQL-RUNTIME-ROOT-CAUSE-AND-MINIMUM-SAFE-FIX-01
MODE = FORENSIC_FIRST_THEN_OWNER_APPROVED_MINIMUM_SAFE_FIX

EXACT_POSTGRES_ERROR = 42P10: for SELECT DISTINCT, ORDER BY expressions must appear in select list
PRIMARY_ROOT_CAUSE = POSTGRES_DISTINCT_ORDER_BY_EXPRESSION_VIOLATION
SECONDARY_ROOT_CAUSES = NONE
FILES_CHANGED = backend/src/routes/erp.routes.js; backend/tests/pos-customer-universal-search.test.cjs; report only
SQL_QUERY_CHANGED = YES
FRONTEND_CHANGED = NO
AUTH_CHANGED = NO
PERMISSIONS_CHANGED = NO
COMPANY_SCOPE_PRESERVED = YES
BRANCH_SCOPE_PRESERVED = YES
PHONE_AUTHORITY_PRESERVED = YES
RESULT_LIMIT_PRESERVED = YES
FOCUSED_TESTS = PASS 4/4
REGRESSION_TESTS = PASS 10/10
BACKEND_SYNTAX = PASS
PENDING_MIGRATIONS = 0
MIGRATIONS_EXECUTED = 0
BACKEND_RUNTIME = PASS_AFTER_EXPLICIT_REFRESH
UNAUTHENTICATED_ROUTE = 401_EXPECTED
AR_SEARCH_RUNTIME = PASS
EN_SEARCH_RUNTIME = PASS
HTTP_500_COUNT_POST_FIX = 0
DATABASE_WRITES = 0
CUSTOMER_WRITES = 0
FINANCIAL_WRITES = 0
INVENTORY_WRITES = 0
GATE = PASS_POS_CUSTOMER_SEARCH_SQL_RUNTIME_MINIMUM_SAFE_FIX
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_CLOSE_POS_CUSTOMER_UNIVERSAL_SEARCH_IF_RUNTIME_ACCEPTANCE_PASSES
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. Do not start CRM-1B4, CRM-1C, A8, or the next client-parity batch without explicit Owner approval.
