# DARFUS ERP — CRM-1B4 PhoneCountry Duplicate-Check Minimum Safe Fix Report

تم تنفيذ إصلاح Frontend صغير ومحدد بعد إثبات السبب الجذري. أصبح `phoneCountry` يمر من نموذج العميل إلى فحص التكرار ثم إلى طلب `duplicate-check`. نجحت اختبارات المصدر، و`typecheck`، و`build`، وBrowser Create على Clone، وPersistence، وNegative Validation، وDuplicate Create/Update، وCreate/Update Race، وEG/AE/SA. لم يحدث أي Write على `darfus_erp`. لم يُنفذ Backend أو POS أو Schema/Migration change. يظل Gate محجوبًا لأن Mobile customer-surface وFull keyboard/touch evidence لم يكتملَا.

## 1. Executive Summary

| Item | Result |
|---|---|
| Control | `DARFUS-CRM-1B4-PHONECOUNTRY-DUPLICATE-CHECK-MINIMUM-SAFE-FIX-01` |
| Root cause | Frontend duplicate preflight dropped the already-selected `phoneCountry` |
| Minimum fix | Pass `phoneCountry` through `hooks/use-customers.ts` |
| Backend change | No |
| POS change | No |
| Business phone rule change | No |
| DB schema/migration | No / 0 |
| Official DB business writes | 0 |
| Clone Create preflight | 200 with `phoneCountry=EG` |
| Clone Create | 201 |
| Canonical persistence | PASS on disposable Clone |
| Duplicate/race | PASS on disposable Clone |
| Full browser matrix | Blocked by Mobile branch-context visibility and uncompleted full accessibility pass |

## 2. Proven Root Cause

The prior closeout proved that:

1. The Customer Add form had `phoneCountry`.
2. The create payload built by `app/[locale]/(dashboard)/customers/page.tsx:193-202` had `phoneCountry`.
3. `hooks/use-customers.ts:104-111` sent only `{ name, phone }` to `customerRepository.findPotentialDuplicates()`.
4. `lib/repositories/api-impl.ts:111-121` already accepted `phoneCountry` and serialized it into the query.
5. `backend/src/routes/erp.routes.js:5306-5313` already required `req.query.phoneCountry` when phone is supplied.
6. The observed request without country returned HTTP 422 with `CUSTOMER_PHONE_COUNTRY_REQUIRED`.

Therefore:

```text
PRIMARY_ROOT_CAUSE = FRONTEND_DUPLICATE_CHECK_DROPS_EXISTING_PHONECOUNTRY
SERVER_PHONE_AUTHORITY = CORRECT_FAIL_CLOSED
DATABASE_SCHEMA = NOT_ROOT_CAUSE
POS = NOT_ROOT_CAUSE
PHONE_CANONICALIZATION = NOT_ROOT_CAUSE
```

## 3. Read-First Request Chain

| Boundary | Actual evidence | Result |
|---|---|---|
| Form state | `page.tsx:35`, `:124`, `:138`, `:193-202` | `phoneCountry` is explicit and included in create payload |
| Duplicate-check caller | `hooks/use-customers.ts:104-114` | Fixed to forward `input.phoneCountry` |
| Request builder | `lib/repositories/api-impl.ts:111-121` | Already serializes `phoneCountry` when present |
| Backend route | `erp.routes.js:5306-5319` | Reads and validates `req.query.phoneCountry` |
| Phone authority | `customer-phone.service.js:35-55`, `:91-112` | Explicit supported ISO country, server canonicalization, stable 422 errors |
| Create controller | `erp.controller.js:297-317` | Canonicalizes and performs duplicate guard before transaction |
| Update controller | `erp.controller.js:386-420` | Uses the same country-aware authority and duplicate guard |

```text
FORM
  → findPotentialDuplicates({ name, phone, phoneCountry })
  → repository query param phoneCountry
  → GET /customers/duplicate-check?...&phoneCountry=EG
  → server canonicalization / duplicate review
  → create POST only when preflight succeeds
```

## 4. Pre-Change Hashes

Hashes were captured before this control’s hunk was applied. Some files were already modified/untracked by earlier work and were preserved.

| File | Pre-change SHA-256 | Worktree status before |
|---|---|---|
| `hooks/use-customers.ts` | `84C9D038E5726A5CE060B2380575EB8DC4F957D9FC8885CA0EFE66B02ADFB922` | tracked modified by earlier work |
| `lib/repositories/api-impl.ts` | `509FCFD52237627542C4E333DBB5C6507B6131BE20E95BA9D579C40C1402F8C4` | tracked modified by earlier work; not changed here |
| `backend/tests/customer-phone-country-1b4.test.cjs` | `5940693749C375905334238080978EE9B6DB659E3F7A3D7532F46933539E3C9D` | pre-existing untracked test |
| `backend/src/routes/erp.routes.js` | `1664EDA14E30AF19D0495755531377CBC146C573E545DF62968AB7463F66D1C8` | unchanged here |
| `backend/src/services/customer-phone.service.js` | `5EF6BE03E26410B98622EB7A902CFC9457C121B93BB5487C87F06AE6D3C11224` | unchanged here |
| `next-env.d.ts` | `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651` | unchanged here |

## 5. Minimum Safe Change

The only product-code change in this control is in `hooks/use-customers.ts:107-111`:

```ts
return await customerRepository.findPotentialDuplicates({
  name: input.name,
  phone: input.phone,
  phoneCountry: input.phoneCountry,
});
```

This forwards an existing, user-selected value. It does not infer a country, change normalization, change uniqueness, change server errors, or change persistence.

## 6. Exact Diff

### Source

```diff
- customerRepository.findPotentialDuplicates({ name: input.name, phone: input.phone })
+ customerRepository.findPotentialDuplicates({
+   name: input.name,
+   phone: input.phone,
+   phoneCountry: input.phoneCountry,
+ })
```

### Focused test

`backend/tests/customer-phone-country-1b4.test.cjs` was already an untracked prior test artifact. This control:

- changed the stale POS assertion to require `PhoneCountrySelect` in Customer screens only;
- asserted that POS does not import/use the Customer country selector;
- added a source-contract assertion that the Hook forwards `phoneCountry` and the Repository serializes it.

No product POS change was made.

## 7. Stale POS Test Classification

The original assertion required `PhoneCountrySelect` in Customer List, Customer Detail, and POS. That contradicted the frozen POS authority:

```text
POS = one search field, no country selector, read-only search, explicit selection
CUSTOMER_CREATE_EDIT = explicit phone country selector
```

The test was aligned to the accepted semantic boundary. It now asserts:

- Customer List and Customer Detail contain the country selector;
- POS does not contain `PhoneCountrySelect`;
- customer UI does not derive phone country from nationality.

```text
STALE_POS_SELECTOR_ASSERTION = TEST_DRIFT
POS_PRODUCT_CHANGE = NO
```

## 8. Focused Tests

```text
node --test backend/tests/customer-phone-country-1b4.test.cjs
12 passed, 0 failed
```

The suite now covers explicit country normalization, missing/invalid/mismatch fail-closed behavior, server authority, model separation, customer UI selector, POS exclusion, and Hook→Repository propagation.

## 9. Regression Tests

```text
node --test backend/tests/customer-duplicate-detection.test.cjs
13 passed, 0 failed

node --test backend/tests/customer-identity-foundation.test.cjs
2 passed, 0 failed

node --test backend/tests/pos-customer-universal-search.test.cjs
4 passed, 0 failed

node --test tests/branch-context-lifecycle.test.mjs
6 passed, 0 failed

node --test backend/tests/permission-catalog-reconciler.test.cjs
9 passed, 0 failed

node --test backend/tests/route-permission-catalog-coverage.test.cjs
3 passed, 0 failed
```

```text
REGRESSION_TESTS = PASS
TOTAL_RELEVANT_REGRESSION_ASSERTIONS = 37 passed, 0 failed
```

## 10. Typecheck

```text
npm run typecheck
Result: PASS
```

No generated Next file drift occurred. `next-env.d.ts` remained SHA-256:

`7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`

## 11. Build

```text
npm run build
Result: PASS — Next.js 16.2.9, TypeScript, and 130 static pages completed
```

The isolated frontend copy was also rebuilt after the Hook change with the Clone API endpoint and completed successfully with 124 generated pages (test-only routes excluded from that isolated copy). No Next dev server was started.

## 12. Disposable Environment

| Component | Value | Evidence |
|---|---|---|
| Clone DB | `darfus_crm1b4_fix_20260831_01` | `current_database()` verified before writes |
| Backend | `localhost:18014` | startup logged DB connection and Redis connection |
| Frontend | `http://localhost:3001` | isolated production Next server |
| Company | `Gold ERP` | server-resolved context |
| Branch | `Branch-1` | explicit browser branch selection / header context |
| Data | synthetic only | names/emails/phones used only in Clone |
| Official DB | `darfus_erp` | never used for business writes |

The template clone attempt was rejected because the official database had an active session. No connection was terminated. A fresh empty Clone was then created and populated by a `pg_dump` read from `darfus_erp` into the Clone only.

## 13. Create Preflight Retry

The AR Chrome flow on `http://localhost:3001/ar/customers` was rerun after rebuilding the isolated frontend:

1. Authenticated with synthetic/local test credentials without recording them.
2. Selected `Branch-1` explicitly.
3. Opened `عميل جديد`.
4. Selected `مصر (+20)` (`EG`).
5. Entered a synthetic Egyptian phone and synthetic customer data.
6. Clicked Save once.
7. Observed:

```text
GET /api/v1/customers/duplicate-check?...&phoneCountry=EG → 200
POST /api/v1/customers → 201
```

The UI closed the modal and displayed the success notification `تم الحفظ بنجاح`.

```text
CREATE_PREFLIGHT_PHONECOUNTRY = PASS
PHONECOUNTRY_PREFLIGHT = PASS
```

## 14. Canonical Persistence

Read-only Clone DB proof after the successful Create:

```text
current_database = darfus_crm1b4_fix_20260831_01
customer_id = CUS-0004
raw phone = 01012345678
phone_country = EG
canonical_phone = +201012345678
status = active
```

```text
RAW_PHONE_PRESERVED = PASS
CANONICAL_PHONE_PERSISTED = PASS
```

## 15. Missing Country

Authenticated API request on the Clone with phone present and no country:

```text
HTTP 422
code = CUSTOMER_PHONE_COUNTRY_REQUIRED
```

This proves the fix does not weaken the server requirement. The API request was intentionally negative and did not write a customer.

```text
MISSING_COUNTRY = PASS
```

## 16. Invalid Phone

Authenticated API request on the Clone with `phoneCountry=EG` and an invalid phone:

```text
HTTP 422
code = CUSTOMER_PHONE_INVALID
```

```text
INVALID_PHONE = PASS
```

## 17. Country Mismatch

Authenticated API request on the Clone with an AE number and `phoneCountry=EG`:

```text
HTTP 422
code = CUSTOMER_PHONE_COUNTRY_MISMATCH
```

```text
COUNTRY_MISMATCH = PASS
```

## 18. Duplicate Create

The original synthetic Clone customer stored `+201012345678`. A second create with the equivalent international EG representation was attempted on the Clone:

```text
HTTP 409
code = CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED
```

No second customer was persisted.

```text
DUPLICATE_CREATE = PASS
```

## 19. Duplicate Update

A separate synthetic Clone customer was created with a unique phone. An update toward the first customer’s canonical phone was attempted:

```text
HTTP 409
code = CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED
```

The target customer remained on its original unique phone.

```text
DUPLICATE_UPDATE = PASS
```

## 20. Create Race

Two concurrent Clone POST requests used the same canonical EG phone with different synthetic names/emails:

```text
request 1 = HTTP 201
request 2 = HTTP 409 CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED
```

```text
CREATE_RACE = PASS
```

## 21. Update Race

Two synthetic Clone customers were created with unique phones. Two concurrent PUT requests targeted the same new canonical phone:

```text
request 1 = HTTP 200
request 2 = HTTP 409 CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED
```

```text
UPDATE_RACE = PASS
```

## 22. EG/AE/SA Equivalence

On the Clone:

| Country | Local create | International equivalent duplicate | Result |
|---|---:|---:|---|
| EG | 201 for the synthetic local representation | 409 duplicate for the equivalent international representation | PASS |
| AE | 201 for the synthetic local representation | 409 duplicate for the equivalent international representation | PASS |
| SA | 201 for the synthetic local representation | 409 duplicate for the equivalent international representation | PASS |

```text
EG_EQUIVALENCE = PASS
AE_EQUIVALENCE = PASS
SA_EQUIVALENCE = PASS
```

## 23. Cross-Country Collision

The same overlapping local digits were created once with `AE` and once with `SA`; both succeeded as distinct country-aware identities. Equivalent international forms then correctly conflicted only within their own country identity.

```text
CROSS_COUNTRY_FALSE_COLLISION = 0
```

## 24. AR/EN

### AR

Chrome rendered `/ar/customers` on the Clone. The page and Add modal showed Arabic customer labels, `دولة الهاتف`, `رقم الهاتف`, and `حفظ العميل`. The corrected AR flow completed the synthetic Create.

`AR = PASS`

### EN

Chrome rendered `/en/customers` on the Clone. The page and Add modal showed `Phone country`, `Phone number`, `New customer`, and `Save customer`. The saved synthetic records were visible in the English table.

`EN = PASS`

## 25. Light/Dark

On the desktop Chrome customer surface, the theme control was toggled to dark and then restored to light. The document class changed from no dark class to `dark` and back. No business request occurred.

```text
LIGHT = PASS_DESKTOP
DARK = PASS_DESKTOP
LIGHT_DARK = PASS_DESKTOP
```

This is not a reopening of theme work.

## 26. Desktop/Mobile

| View | Evidence | Result |
|---|---|---|
| Desktop Chrome | Customer list, Add modal, country selector, phone field, successful Create | `PASS` |
| Mobile 390×844 | Isolated Browser viewport and responsive shell rendered after login, but branch selector was not exposed at that breakpoint; page stayed at Branch readiness required | `NOT_PROVEN` |

The Mobile limitation prevented direct proof that the customer country selector, validation, dropdown clipping, and no-overflow behavior are usable after operational Branch context. No source change was made to bypass the guard.

```text
DESKTOP_MOBILE = BLOCKED_MOBILE_BRANCH_CONTEXT_EVIDENCE
```

## 27. Accessibility

The desktop form exposed a visible label and native/select-style country control. The country selector was successfully operated by the browser and the AR/EN labels were visible. A complete tab-order, Arrow/Enter/Escape, touch, screen-reader announcement, and error-focus pass was not completed before isolated services were stopped.

```text
KEYBOARD_ACCESSIBILITY = NOT_FULLY_PROVEN
TOUCH_ACCESSIBILITY = NOT_PROVEN
```

## 28. POS Non-Regression

No POS source was changed. The semantic POS suite passed and verifies bounded read-only search, international/local phone interpretation without country inference, one explicit combobox, and no full customer preload. The corrected stale test now explicitly asserts no `PhoneCountrySelect` in POS.

```text
POS_SEARCH_NON_REGRESSION = PASS_SOURCE_TEST
POS_AUTHORITY_CHANGED = NO
```

## 29. Main DB Safety

| Assertion | Before | After | Result |
|---|---:|---:|---|
| `current_database()` | `darfus_erp` | `darfus_erp` | unchanged |
| `customers` | 3 | 3 | delta 0 |
| `branch_customers` | 3 | 3 | delta 0 |
| customers with non-null `phone_country` | 0 | 0 | delta 0 |
| customers with non-null `canonical_phone` | 0 | 0 | delta 0 |
| official customer POSTs | 0 | 0 | delta 0 |

```text
MAIN_DB_CUSTOMER_DELTA = 0
MAIN_DB_BRANCH_CUSTOMER_DELTA = 0
MAIN_DB_BUSINESS_WRITES = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
BACKFILLS_EXECUTED = 0
```

The official database retained its three legacy rows with null phone authority fields. No backfill was run.

## 30. Disposable Cleanup

After proof:

- temporary Frontend was stopped;
- temporary Backend was stopped;
- ports 3001 and 18014 were verified free;
- exact Clone database `darfus_crm1b4_fix_20260831_01` was dropped with `FORCE`;
- database list afterward contained `darfus_erp` only among the two checked names;
- official database was re-read as `darfus_erp|3|3|0|0`.

```text
DISPOSABLE_DB_CLEANED = YES
MAIN_DB_TOUCHED_BY_CLEANUP = NO
```

## 31. Owner Closeout Packet

```text
ROOT_CAUSE = FRONTEND_DUPLICATE_CHECK_DROPPED_PHONECOUNTRY
FILES_CHANGED = hooks/use-customers.ts; backend/tests/customer-phone-country-1b4.test.cjs; this report
WHY_THIS_IS_MINIMUM_SAFE_CHANGE = forwards existing form value through an existing repository/backend contract
BACKEND_PHONE_AUTHORITY_CHANGED = NO
POS_AUTHORITY_CHANGED = NO
DATABASE_SCHEMA_CHANGED = NO
PHONECOUNTRY_PREFLIGHT = PASS
RAW_PHONE_PRESERVED = PASS
CANONICAL_PHONE_PERSISTED = PASS_CLONE
DUPLICATE_CREATE = PASS_CLONE
DUPLICATE_UPDATE = PASS_CLONE
CREATE_RACE = PASS_CLONE
UPDATE_RACE = PASS_CLONE
EG_EQUIVALENCE = PASS_CLONE
AE_EQUIVALENCE = PASS_CLONE
SA_EQUIVALENCE = PASS_CLONE
CROSS_COUNTRY_FALSE_COLLISION = 0
AR_EN = PASS
LIGHT_DARK = PASS_DESKTOP
DESKTOP_MOBILE = BLOCKED_MOBILE_BRANCH_CONTEXT_EVIDENCE
POS_SEARCH_NON_REGRESSION = PASS_SOURCE_TEST
MAIN_DB_BUSINESS_WRITES = 0
```

## 32. Gate

### Passed conditions

- Server-authoritative country-aware phone validation preserved.
- Existing explicit country field reaches duplicate preflight.
- Corrected preflight returns 200 when country is supplied.
- Successful disposable create persisted raw, ISO country, and canonical phone separately.
- Missing/invalid/mismatch inputs remain 422 fail-closed.
- Duplicate Create and Duplicate Update remain 409.
- Create and Update races resolve as one success plus one duplicate conflict.
- EG/AE/SA equivalence and cross-country separation passed.
- POS source and semantic behavior remained unchanged.
- Focused/regression tests passed.
- Typecheck/build passed.
- Official DB before/after delta is zero.
- No migration, seed, backfill, Backend change, POS change, or business-rule change.
- Disposable runtime and DB were cleaned.

### Remaining gate blocker

The final browser matrix was not complete because the Mobile viewport did not expose a Branch selector, leaving the customer surface at the existing fail-closed Branch readiness gate. Full keyboard/touch accessibility proof was consequently not completed. This is an evidence blocker, not a proven phone-business-rule failure.

```text
GATE = BLOCKED_CRM1B4_BROWSER_ACCEPTANCE
CRM_1B4_CLOSEOUT = BLOCKED_BROWSER_MATRIX_INCOMPLETE
```

## 33. Final Tokens

```text
CURRENT_CONTROL = DARFUS-CRM-1B4-PHONECOUNTRY-DUPLICATE-CHECK-MINIMUM-SAFE-FIX-01
MODE = OWNER_APPROVED_MINIMUM_SAFE_FRONTEND_INTEGRATION_FIX
ROOT_CAUSE = FRONTEND_DUPLICATE_CHECK_DROPPED_PHONECOUNTRY

FILES_CHANGED = hooks/use-customers.ts; backend/tests/customer-phone-country-1b4.test.cjs; report
BACKEND_CHANGED = NO
POS_CHANGED = NO
PHONE_BUSINESS_RULES_CHANGED = NO
DATABASE_SCHEMA_CHANGED = NO

PHONECOUNTRY_PREFLIGHT = PASS
RAW_PHONE_PRESERVED = PASS
CANONICAL_PHONE_PERSISTED = PASS_CLONE
MISSING_COUNTRY = PASS_422_CUSTOMER_PHONE_COUNTRY_REQUIRED
INVALID_PHONE = PASS_422_CUSTOMER_PHONE_INVALID
COUNTRY_MISMATCH = PASS_422_CUSTOMER_PHONE_COUNTRY_MISMATCH
DUPLICATE_CREATE = PASS_409_CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED
DUPLICATE_UPDATE = PASS_409_CUSTOMER_DUPLICATE_PHONE_REVIEW_REQUIRED
CREATE_RACE = PASS_ONE_201_ONE_409
UPDATE_RACE = PASS_ONE_200_ONE_409
EG_EQUIVALENCE = PASS
AE_EQUIVALENCE = PASS
SA_EQUIVALENCE = PASS
CROSS_COUNTRY_FALSE_COLLISION = 0

AR = PASS
EN = PASS
RTL = PASS_DOM
LTR = PASS_DOM
LIGHT = PASS_DESKTOP
DARK = PASS_DESKTOP
DESKTOP = PASS
MOBILE = NOT_PROVEN_BRANCH_CONTEXT_BLOCKER
KEYBOARD_ACCESSIBILITY = NOT_FULLY_PROVEN
TOUCH_ACCESSIBILITY = NOT_PROVEN
POS_SEARCH_NON_REGRESSION = PASS_SOURCE_TEST

FOCUSED_TESTS = PASS_12_12
REGRESSION_TESTS = PASS_37_37
TYPECHECK = PASS
BUILD = PASS
NEXT_ENV_D_TS_DRIFT = NONE
MIGRATIONS_EXECUTED = 0
BACKFILLS_EXECUTED = 0
MAIN_DB_BUSINESS_WRITES = 0
DISPOSABLE_DB_CLEANED = YES

GATE = BLOCKED_CRM1B4_BROWSER_ACCEPTANCE
CRM_1B4_CLOSEOUT = BLOCKED_BROWSER_MATRIX_INCOMPLETE
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_CRM_1C
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP. Do not start CRM-1C automatically. Do not backfill legacy customers, change POS, run migrations, or touch `darfus_erp` without a separate authorization.**
