# DARFUS ERP — CRM-1B4 International Phone Authority Browser Closeout Report

تم تنفيذ فحص CRM-1B4 قراءةً فقط مع Browser وClone مؤقت معزول. نجحت قراءة المصدر، وفحوصات الـAPI الأساسية، وتسجيل الدخول، وسياق الشركة/الفرع، وظهور نموذج العميل باللغتين العربية والإنجليزية. فشل مسار إنشاء العميل قبل أي حفظ لأن واجهة العملاء لا تمرر `phoneCountry` إلى فحص التكرار، فاستجاب الخادم بـ422. لم تُكتب قاعدة `darfus_erp`، ولم يُنفذ إصلاح في هذا الـControl. الخطوة التالية هي Owner review ثم إصلاح UI صغير ومحدد وإعادة الإثبات.

## 1. Executive Summary

| Area | Result | Evidence | Classification |
|---|---|---|---|
| Phone authority in server | Implemented and fail-closed | `customer-phone.service.js` requires a supported two-letter country code and maps stable 422 errors | PASS / PRODUCT_AUTHORITY_PRESERVED |
| Customer form country field | Present in AR/EN | Live Chrome showed `دولة الهاتف` / `Phone country` in the Add Customer modal | PASS_UI |
| Create preflight | Blocked | Duplicate-check GET omitted `phoneCountry`; server returned `CUSTOMER_PHONE_COUNTRY_REQUIRED` / 422 | PRODUCT_DEFECT, P1 |
| Canonical persistence | Not proven in this control | Create did not reach POST because preflight failed | ACCEPTANCE_GAP |
| Duplicate/race browser proof | Not completed | Blocked before safe create; no retry was performed | ACCEPTANCE_GAP |
| Official DB safety | PASS | Before/after official read-only counts unchanged; no business POST was sent | NO_ISSUE |
| Clone cleanup | PASS | Temporary backend stopped and exact disposable database dropped | NO_ISSUE |

**Gate:** `BLOCKED_PHONE_COUNTRY_AUTHORITY_REGRESSION`

The gate is not a product-wide declaration that all phone authority is broken. The server authority, schema, unique-index design, and most focused semantic tests are present. The current blocker is the frontend duplicate-review integration, which prevents the required browser create proof and exposes a real P1 workflow defect.

## 2. Current Migration Reality

- The current phone-country/canonical-phone schema contract is present in source/database inspection.
- `PENDING_PHONE_MIGRATION = NO` for the reviewed current authority.
- No migration was created or executed by this control.
- No backfill was run. Existing null legacy values were preserved.
- Historical migration/report references were treated as supporting evidence only; current source and current DB evidence were authoritative.

## 3. Main DB Read-Only Baseline

Target was verified as `darfus_erp` before and after the isolated proof.

| Read-only assertion | Before | After | Result |
|---|---:|---:|---|
| `current_database()` | `darfus_erp` | `darfus_erp` | unchanged |
| `customers` | 3 | 3 | unchanged |
| `branch_customers` | 3 | 3 | unchanged |
| customers with explicit `phone_country` | 0 | 0 | unchanged |
| customers with `canonical_phone` | 0 | 0 | unchanged |
| Customer business POSTs from this control | 0 | 0 | PASS |

The null values are a legacy state, not an automatically repaired state. They remain documented as:

`LEGACY_PHONE_AUTHORITY_STATE = UNRESOLVED_NULLS_PRESERVED_AWAITING_SEPARATE_OWNER_REMEDIATION_IF_NEEDED`

## 4. Frozen Phone Authority

Read-only source evidence establishes the following contract:

| Rule | Evidence | Result |
|---|---|---|
| Country is an explicit input | Customer page constructs `phoneCountry`; Add modal renders a country selector | PASS |
| Country is not inferred from phone digits | `customer-phone.service.js` requires the explicit two-letter code | PASS |
| Canonicalization is server-side | `assertCanonicalCustomerPhone()` uses the supported phone parser and returns canonical value | PASS |
| Invalid/missing/mismatched values fail closed | Stable errors include `CUSTOMER_PHONE_COUNTRY_REQUIRED`, `CUSTOMER_PHONE_INVALID`, and `CUSTOMER_PHONE_COUNTRY_MISMATCH` | PASS |
| Duplicate identity is canonical phone scoped by accepted authority | Controller performs duplicate guard before the transaction; database uniqueness is covered by focused tests | PASS_SOURCE_TEST |
| Raw input remains separately available | Customer create contract carries raw phone and canonicalized authority separately | PASS_SOURCE_CONTRACT |

## 5. Customer Create/Edit UI Authority

### Create

AR and EN live Chrome inspection showed the country selector and phone field. The form state and create payload include `phoneCountry` in `app/[locale]/(dashboard)/customers/page.tsx:193-202`. However, the duplicate-review call goes through `findPotentialDuplicates()` in `hooks/use-customers.ts:104-111`, which sends only `name` and `phone`.

Observed network contract:

```text
GET /api/v1/customers/duplicate-check?...&phone=01012•••••
→ 422
code = CUSTOMER_PHONE_COUNTRY_REQUIRED
field = phoneCountry
```

No customer POST followed the 422. This is the simplest proven root cause: the UI hook drops a field already available in form state.

### Edit

The AR edit modal for an existing customer visibly included `دولة الهاتف`; the EN Add modal visibly included `Phone country`. No edit save was performed because this is a read-only closeout and the create preflight blocker prevented a safe full mutation workflow. Edit persistence is therefore not claimed as browser-proven here.

## 6. Disposable Environment

The required browser evidence was isolated from the official runtime:

| Component | Isolated value | Result |
|---|---|---|
| Temporary DB | `darfus_crm1b4_browser_20260831_01` | verified separate from official DB |
| Temporary backend | local port `18014` | connected to the clone DB |
| Temporary frontend | `http://localhost:3001` | served the isolated build |
| Gold runtime | intentionally disabled in this clone | `/health/gold` returned 503 by isolation configuration; unrelated to CRM phone proof |
| Clone business writes | 0 | no customer POST was sent |
| Cleanup | exact temporary DB dropped; backend stopped; ports released | PASS |

The temporary frontend was built from an isolated copy only. It was not the project source tree and was not used to modify source files.

## 7. Main DB Write Protection

- Official DB identity was read as `darfus_erp`.
- No official INSERT/UPDATE/DELETE/TRUNCATE was executed.
- No migration, seed, cleanup, or backfill targeted the official DB.
- The browser Save action stopped at the read-only duplicate-check request; the intended customer creation POST was not emitted.
- No credential, token, cookie, or secret value is included in this report.

`MAIN_DB_BUSINESS_WRITES = 0`

## 8. Create Browser Proof

**Runtime:** isolated local Chrome session on `http://localhost:3001/ar/customers`.

1. Fresh authentication succeeded without exposing credentials.
2. Branch context was selected through the visible branch selector; operational page state showed `Branch-1`.
3. The AR Customer/CRM page loaded with existing read-only rows.
4. Add Customer modal showed explicit country and phone controls.
5. Synthetic form values were entered.
6. The pre-create duplicate-check request returned 422 because `phoneCountry` was absent from its query.
7. No create POST and no DB business mutation occurred.

`CREATE_PHONE_COUNTRY = BLOCKED_UI_DUPLICATE_CHECK_OMITS_PHONE_COUNTRY`

## 9. Duplicate Create

The duplicate-create proof was not attempted after the 422 because doing so would require first changing source or bypassing the canonical preflight. No unsafe retry was performed.

`DUPLICATE_CREATE = BLOCKED_BEFORE_CREATE_422`

The server-side duplicate route and stable validation behavior are covered by source and focused tests, but this control does not claim browser duplicate-create acceptance.

## 10. Cross-Country False Collision

Country-aware normalization and the non-collision contract passed the focused semantic tests. No browser business mutation was run in this closeout.

`CROSS_COUNTRY_FALSE_COLLISION = UNIT_SOURCE_PASS_RUNTIME_NOT_RUN`

## 11. Edit Browser Proof

The existing customer edit modal was opened read-only in AR. The explicit `دولة الهاتف` selector was present, and the raw phone input was present. The modal was closed without saving.

`EDIT_PHONE_COUNTRY = PRESENT_NOT_RUNTIME_SAVED`

No assertion is made about a persisted edit because no write was authorized in this control.

## 12. Duplicate Update

The update duplicate guard and precheck are represented in source and semantic tests, including race/conflict coverage. A real browser update was not executed.

`DUPLICATE_UPDATE = NOT_RUNTIME_PROVEN`

## 13. Validation Error Contract

The server maps validation failures to stable 422 responses and field-level error information:

| Case | Proven result |
|---|---|
| Missing country | `CUSTOMER_PHONE_COUNTRY_REQUIRED`, HTTP 422, `phoneCountry` |
| Missing phone | `CUSTOMER_PHONE_REQUIRED`, HTTP 422, `phone` |
| Invalid phone | `CUSTOMER_PHONE_INVALID`, HTTP 422, `phone` |
| Country/number mismatch | `CUSTOMER_PHONE_COUNTRY_MISMATCH`, HTTP 422, `phoneCountry` |

The missing-country error was also observed in the isolated live browser network path. This is a correct server response to an incorrect client request shape.

`MISSING_COUNTRY = OBSERVED_422_CUSTOMER_PHONE_COUNTRY_REQUIRED`

## 14. Create Concurrency

No concurrent customer create was run. Source and focused tests cover duplicate conflict handling and unique-index/race mapping, but this closeout cannot claim browser runtime proof.

`CREATE_RACE = NOT_RUNTIME_PROVEN`

## 15. Update Concurrency

No concurrent customer update was run.

`UPDATE_RACE = NOT_RUNTIME_PROVEN`

## 16. POS Search Non-Regression

Current POS authority intentionally does not use the Customer form country selector. A stale assertion in `backend/tests/customer-phone-country-1b4.test.cjs:110` expects `PhoneCountrySelect` in the POS source, but the accepted POS authority is bounded customer search and does not require that create-form control.

The relevant POS universal-search and branch-scope semantic tests passed. The stale selector assertion was not “fixed” by changing POS code or the test.

`POS_SEARCH_NON_REGRESSION = SOURCE_TEST_PASS_BROWSER_NOT_RUN`

## 17. AR/EN

| Locale | Evidence | Result |
|---|---|---|
| AR | Chrome rendered `/ar/customers`, customer page, Add modal, `دولة الهاتف`, `رقم الهاتف`, and Arabic actions | `PASS_DOM` |
| EN | Chrome rendered `/en/customers`, customer page, Add modal, `Phone country`, `Phone number`, and English actions | `PASS_DOM` |

## 18. RTL/LTR

The live AR and EN DOM/localized layout were inspected. Arabic labels and navigation rendered in the AR route; English labels and navigation rendered in the EN route.

`RTL = PASS_DOM`

`LTR = PASS_DOM`

This does not substitute for the unrun mobile/light/dark direct visual matrix below.

## 19. Light/Dark

The theme toggle matrix was not directly exercised in this control.

`LIGHT = NOT_PROVEN_THIS_CONTROL`

`DARK = NOT_PROVEN_THIS_CONTROL`

No theme-related source change was made.

## 20. Desktop/Mobile

| View | Result |
|---|---|
| Desktop Chrome | `PASS_CHROME`; page, modal, country selector, and phone field rendered |
| Mobile | `NOT_PROVEN_THIS_CONTROL`; no responsive mutation or browser claim made |

## 21. Accessibility

The inspected country control is a native/select-style interactive control with a visible label and is therefore keyboard-addressable by browser semantics. Full tab-order, validation announcement, screen-reader, and touch acceptance were not run in this blocked closeout.

`KEYBOARD_ACCESSIBILITY = PARTIAL_SOURCE_UI_EVIDENCE`

`TOUCH_ACCESSIBILITY = NOT_PROVEN_THIS_CONTROL`

## 22. Console/Network

### Network evidence

| Request | Method | Status | Meaning |
|---|---|---:|---|
| `/api/v1/auth/login` | POST | 200 | isolated authentication succeeded; credentials not recorded |
| `/api/v1/auth/accessible-companies` | GET | 200/304 | company context read |
| `/api/v1/branches` | GET | 200/304 | branch context read |
| `/api/v1/settings` | GET | 200/304 | settings read |
| `/api/v1/customers` | GET | 200/304 | customer list read |
| `/api/v1/customers/duplicate-check?...&phone=01012•••••` | GET | 422 | country omitted by hook; stable server validation |
| `/health` | GET | 200 | backend health |
| `/health/db` | GET | 200 | clone DB connectivity |
| `/health/redis` | GET | 200 | Redis connectivity |
| `/health/gold` | GET | 503 | intentionally disabled in isolated CRM clone |
| `/api/v1/customers` | POST | 0 observed | no business create was sent |

### Console evidence

The final AR/EN Chrome inspection had no console `error` or `warn` entries. Earlier expired IAB-session 401 events were not used as current acceptance evidence; a fresh isolated Chrome authentication succeeded.

## 23. Focused Tests

### Required phone-country test file

```text
node --test backend/tests/customer-phone-country-1b4.test.cjs
Result: 10 passed, 1 failed
```

The single failure is the stale POS source-string expectation at line 110, requiring `PhoneCountrySelect` in POS despite the current accepted POS authority not using the customer-create country selector. It is test drift, not a reason to weaken POS behavior.

### Relevant semantic tests

```text
node --test backend/tests/customer-duplicate-detection.test.cjs \
  backend/tests/customer-identity-foundation.test.cjs \
  backend/tests/pos-customer-universal-search.test.cjs \
  tests/branch-context-lifecycle.test.mjs
Result: 25 passed, 0 failed
```

```text
node --test backend/tests/permission-catalog-reconciler.test.cjs \
  backend/tests/route-permission-catalog-coverage.test.cjs
Result: 12 passed, 0 failed
```

`FOCUSED_TESTS = FAIL_10_PASS_1_STALE_POS_SELECTOR_ASSERTION`

## 24. Regression Tests

The relevant customer identity, duplicate detection, international phone normalization, POS bounded search, branch lifecycle, and permission coverage tests passed as listed above. No unrelated broad suite was used to manufacture a pass.

`REGRESSION_TESTS = PASS_25_25_PLUS_PERMISSION_12_12`

## 25. Typecheck

```text
npm run typecheck
Result: PASS
```

No source modification or Next generated-file drift occurred. The observed `next-env.d.ts` SHA-256 remained:

`7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`

`TYPECHECK = PASS`

## 26. Build

```text
npm run build
Result: PASS — Next.js 16.2.9, TypeScript/static generation completed
```

An isolated temporary frontend copy also built successfully with the clone API endpoint; no production/main frontend instance was replaced or modified.

`BUILD = PASS`

## 27. Main DB Safety Closeout

| Safety item | Result |
|---|---|
| Official DB target verified | `darfus_erp` |
| Official DB business writes | 0 |
| Official DB schema writes | 0 |
| Migrations | 0 created / 0 executed |
| Seeds/backfills | 0 |
| Customer create POST | 0 |
| Supplier/POS/inventory/accounting mutations | 0 |
| Source/test/config edits | 0 |
| Existing official customer rows | preserved at 3 |

`MAIN_DB_WRITE_PROOF = PASS`

## 28. Disposable Cleanup

The exact temporary database `darfus_crm1b4_browser_20260831_01` was verified to exist as a separate database, then dropped after the browser proof. The temporary backend was stopped and ports 3001/18014 were verified free. The official database remained reachable and its counts remained unchanged.

`DISPOSABLE_DB_CLEANED = YES`

## 29. Legacy Null-State Note

The three official customer rows retain null `phone_country` and null `canonical_phone`. No automatic backfill was authorized or executed. This is preserved historical/local state and requires a separate Owner decision only if operational remediation is later needed.

## 30. Open Items Not Touched

- Do not change POS to add a country selector merely to satisfy the stale test marker.
- Do not change the server phone authority or relax the required country code.
- Do not backfill official legacy customers in this control.
- Do not claim canonical persistence until a future authorized proof reaches the create POST.
- Do not claim duplicate-create, duplicate-update, create-race, or update-race browser acceptance from this run.
- Do not claim direct mobile, light-theme, dark-theme, touch, or full accessibility acceptance from this run.
- Do not start an implementation batch automatically.

## 31. Gate

### Proven strengths

1. The server is authoritative and fail-closed for country-aware phone normalization.
2. Stable field-level validation codes exist for missing, invalid, and mismatched phone input.
3. Customer UI exposes an explicit country field in both AR and EN.
4. Duplicate protection and concurrency/unique-index behavior are represented in focused semantic tests.
5. Company/branch and permission authorities remain intact.
6. No official DB mutation occurred, and disposable data was cleaned.

### Blockers

| ID | Issue | Layer | Severity | Classification | Impact |
|---|---|---|---|---|---|
| CRM-1B4-P1-001 | `findPotentialDuplicates()` omits `phoneCountry` although the form payload has it | Frontend integration | P1 | PRODUCT_DEFECT / SECURITY_AUTHORITY / ACCEPTANCE_GAP | New customer creation is blocked before POST; country-aware authority cannot complete its canonical preflight |
| CRM-1B4-P2-002 | Focused test requires `PhoneCountrySelect` in POS | Test contract | P2 | ACCEPTANCE_GAP / STALE_TEST | Test suite reports failure without proving a POS product defect |
| CRM-1B4-P3-003 | Direct mobile/light/dark/full accessibility evidence incomplete | Browser evidence | P3 | ACCEPTANCE_GAP | Full closeout matrix cannot be claimed |

### Minimum safe next step (not executed)

After Owner review, the minimum safe source correction is to pass the already captured `input.phoneCountry` from `hooks/use-customers.ts` into the duplicate-check repository call, then rerun only the smallest affected create/validation/browser proof. Do not alter phone business rules, POS authority, DB state, or legacy rows as part of that correction.

`GATE = BLOCKED_PHONE_COUNTRY_AUTHORITY_REGRESSION`

## 32. Final Tokens

```text
CURRENT_CONTROL = DARFUS-CRM-1B4-INTERNATIONAL-PHONE-AUTHORITY-BROWSER-CLOSEOUT-01
MODE = READ_ONLY_BROWSER_CLOSEOUT_WITH_DISPOSABLE_CLONE
OFFICIAL_DB = darfus_erp
OFFICIAL_DB_BUSINESS_WRITES = 0
SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
CONFIG_FILES_CHANGED = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED_THIS_CONTROL = 0

MIGRATION_STATE = APPLIED_EXPECTED_PHONE_AUTHORITY_NO_PENDING_PHONE_MIGRATION
MAIN_DB_BEFORE = darfus_erp|customers=3|branch_customers=3|phone_country_nonnull=0|canonical_phone_nonnull=0
MAIN_DB_AFTER = darfus_erp|customers=3|branch_customers=3|phone_country_nonnull=0|canonical_phone_nonnull=0
MAIN_DB_BUSINESS_WRITES = 0
LEGACY_ROWS_AUTO_BACKFILLED = NO
LEGACY_PHONE_AUTHORITY_STATE = UNRESOLVED_NULLS_PRESERVED_AWAITING_SEPARATE_OWNER_REMEDIATION_IF_NEEDED

SERVER_PHONE_AUTHORITY = PASS_FAIL_CLOSED_COUNTRY_AWARE
RAW_PHONE_PRESERVED = SOURCE_CONTRACT_PASS
CANONICAL_PHONE_PERSISTED = NOT_RUNTIME_PROVEN
CREATE_PHONE_COUNTRY = BLOCKED_UI_DUPLICATE_CHECK_OMITS_PHONE_COUNTRY
EDIT_PHONE_COUNTRY = PRESENT_NOT_RUNTIME_SAVED
DUPLICATE_CREATE = BLOCKED_BEFORE_CREATE_422
DUPLICATE_UPDATE = NOT_RUNTIME_PROVEN
CREATE_RACE = NOT_RUNTIME_PROVEN
UPDATE_RACE = NOT_RUNTIME_PROVEN
CROSS_COUNTRY_FALSE_COLLISION = UNIT_SOURCE_PASS_RUNTIME_NOT_RUN
MISSING_COUNTRY = OBSERVED_422_CUSTOMER_PHONE_COUNTRY_REQUIRED
INVALID_PHONE = SOURCE_TEST_PASS_RUNTIME_NOT_RUN
COUNTRY_MISMATCH = SOURCE_TEST_PASS_RUNTIME_NOT_RUN

CLONE_DB = darfus_crm1b4_browser_20260831_01
CLONE_BACKEND = localhost:18014
CLONE_FRONTEND = http://localhost:3001
CLONE_DB_CLEANED = YES
CLONE_BUSINESS_WRITES = 0

AUTH = PASS_ISOLATED_CHROME
COMPANY_CONTEXT = PASS_READ_ONLY
BRANCH_CONTEXT = PASS_BRANCH_1
AR = PASS_DOM
EN = PASS_DOM
RTL = PASS_DOM
LTR = PASS_DOM
DESKTOP = PASS_CHROME
MOBILE = NOT_PROVEN_THIS_CONTROL
LIGHT = NOT_PROVEN_THIS_CONTROL
DARK = NOT_PROVEN_THIS_CONTROL
KEYBOARD_ACCESSIBILITY = PARTIAL_SOURCE_UI_EVIDENCE
TOUCH_ACCESSIBILITY = NOT_PROVEN_THIS_CONTROL
POS_SEARCH_NON_REGRESSION = SOURCE_TEST_PASS_BROWSER_NOT_RUN

FOCUSED_TESTS = FAIL_10_PASS_1_STALE_POS_SELECTOR_ASSERTION
REGRESSION_TESTS = PASS_25_25_PLUS_PERMISSION_12_12
TYPECHECK = PASS
BUILD = PASS
NEXT_ENV_D_TS_DRIFT = NONE
NEXT_ENV_D_TS_SHA256 = 7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651

P0 = 0
P1 = 1
P2 = 1
P3 = 1
GATE = BLOCKED_PHONE_COUNTRY_AUTHORITY_REGRESSION
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_MINIMUM_SAFE_PHONECOUNTRY_DUPLICATE_CHECK_FIX_AND_RERUN
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP — CRM-1B4 closeout is blocked at the proven frontend phone-country authority regression. No source fix, test fix, database mutation, migration, or automatic next batch was started.**
