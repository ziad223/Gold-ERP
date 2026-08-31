# DARFUS POS Customer Universal Search & Selection — Control 01 Report

تم تنفيذ الحد الأدنى الآمن لتوحيد بحث العميل داخل POS، مع الحفاظ على سلطة الهاتف الحالية وعدم تنفيذ أي عملية أعمال. اختبارات المصدر والـfocused regressions و`typecheck` و`build` نجحت. الصحة العامة للـbackend/DB/Redis سليمة، لكن قبول runtime للبحث محجوب لأن backend الموجود على `localhost:8000` نسخة قديمة لا تحتوي المسار الجديد وتعيد `404`؛ لم تتم إعادة تشغيله لأن أمر الإقلاع الحالي يشغّل migrations تلقائيًا.

## 1. Executive Summary

| Area | Result | Evidence | Impact |
|---|---|---|---|
| POS customer UI contract | Implemented in current source | One explicit customer combobox, no initial selection, keyboard handlers, clear/change path in `app/[locale]/(dashboard)/pos/page.tsx` | Meets the intended UI contract statically and in the served frontend |
| API search contract | Implemented in current source | Auth, `pos.view`/`pos.sell`, required branch, company/branch/customer filters, bounded limit, read-only DTO in `backend/src/routes/erp.routes.js` | Safe server-side authority when the current backend process is refreshed |
| Phone authority | Preserved | `phoneCountry` and `canonicalPhone` remain explicit; search parser does not infer or persist country | No customer identity or phone rewrite |
| Frontend data loading | Corrected | API mode no longer preloads the full `/customers` collection | Avoids full-dataset client filtering |
| Static/focused verification | PASS | 4 focused tests + 10 regression tests, typecheck, build | No P0/P1 regression observed |
| Main runtime search acceptance | BLOCKED | `GET http://localhost:8000/api/v1/pos/customers/search?...` returned `404` while health endpoints returned `200` | Requires safe backend runtime refresh before final browser/API PASS |

`REQUEST_COUNT` for this control was read-only: health GETs plus browser search GETs. `BUSINESS_EVENT_COUNT = 0`; `DB_WRITE_COUNT = 0`.

## 2. Frozen Owner Contract

- One POS customer search field.
- Search by customer name, customer ID/approved code, local phone, and international phone.
- Partial input can return multiple candidates; exact canonical phone is unique within company or fails closed.
- No initial selected customer and no implicit auto-selection.
- Explicit selection only; clear/change selection without page reload.
- Keyboard: Arrow Up/Down, Enter, Escape, and normal Tab focus behavior.
- No country selector in POS search. Explicit `phoneCountry` remains part of create/edit authority.
- No-result state may navigate to the existing Create Customer route; it must not create a customer.
- Authenticated server-side company and authorized branch scope.
- API result bound is `1..20`; short/empty query does not dump customers.
- Product/checkout, CRM, customer creation, and customer phone business rules are outside this control.

## 3. Current POS Customer Flow

### Before the control boundary

The POS had a native customer collection selector, an additional phone-country/phone lookup path, an initial auto-selection effect, and API-mode customer collection loading. Those were incompatible with the frozen single-search contract.

### Current source flow

`app/[locale]/(dashboard)/pos/page.tsx` now has one `pos-customer-search` combobox. The selected candidate is explicit state. The same selection is used by sale and reservation callers; no business POST was executed in this control. API mode calls the bounded customer-search endpoint after a short debounce and protects against abort/stale responses.

## 4. Existing Customer/Phone Authority

The existing customer-phone service remains the authority for explicit country-aware persistence:

- `phoneCountry` is supplied/validated by customer create/edit paths.
- `canonicalPhone` is derived from the explicit country context and persisted separately from the raw phone.
- `normalizeCustomerPhoneSearchInput()` accepts an international `+`/`00` form for exact search only.
- Local/digit search does not infer a country, write a phone, or rewrite a customer.
- The POS search route returns read-only identity data only.

Focused test evidence includes `00971 50 123 4567 -> +971501234567`, while a local number produces no inferred canonical country value.

## 5. Search Architecture Decision

`API_MODE = SERVER_SEARCH` for the real POS runtime. The frontend does not preload `/customers` for API mode. The API applies the company/branch/active/deleted filters and returns a bounded DTO. Mock mode retains its existing local fixture behavior for non-runtime tests.

This is the minimum safe architecture for the requested result-bound and authority rules; it does not create a second customer authority.

## 6. Search Matching Semantics

`GET /api/v1/pos/customers/search?query=<value>&limit=<n>` matches:

- customer name (`ILIKE`, escaped pattern);
- customer ID as text;
- raw phone digits/patterns;
- stored canonical phone and its digits;
- exact canonical international phone when the input is a valid explicit international number.

For an exact canonical phone, the route performs a company-wide active-customer uniqueness check and fails closed with `409 CUSTOMER_PHONE_AMBIGUOUS` when more than one candidate exists. The final candidate query remains branch-scoped.

The route returns no collection for query length below two and clamps the requested result count to 20. It does not infer or persist `phoneCountry`.

## 7. Company/Permission Scope

The route uses:

1. `authMiddleware`;
2. `requireAnyBusinessPermission(["pos.view", "pos.sell"])`;
3. required `resolveAuthorizedBranchId(...)`;
4. `company_id` equality;
5. active branch-customer relation;
6. active customer and `deleted_at IS NULL` filters.

No permission, company, branch, or RBAC source was changed outside this route guard. The browser context displayed `Branch-1` and the authenticated cashier; no unauthorized context was requested.

## 8. Candidate DTO

The server response is deliberately limited to:

```text
id, name, phone, phoneCountry, branchId
```

No customer financial, CRM, address, or sensitive collection data is returned by this POS search route.

## 9. Performance/Result Bound

- Frontend API mode: no full customer preload.
- Debounce: 250 ms.
- AbortController and generation guard prevent stale results from replacing newer input.
- Server bound: `limit` clamped to 1–20; exact ambiguity check capped at two rows.
- Empty/one-character input returns an empty result state, not a customer dump.

## 10. Files Changed

The relevant files were already dirty or untracked in the pre-change worktree snapshot. The current control changed only the listed functions/sections; it did not take ownership of unrelated worktree changes.

| File | Current-control change | Pre-change status |
|---|---|---|
| `app/[locale]/(dashboard)/pos/page.tsx` | Replaced the customer selection/lookup UI state with one explicit combobox and bounded search handling | Already modified |
| `features/sales/hooks/use-pos.ts` | Removed API customer collection preload; retained stable empty API list and mock compatibility | Already modified |
| `backend/src/routes/erp.routes.js` | Added read-only bounded `/pos/customers/search` route and server scope checks | Already modified |
| `backend/src/services/customer-phone.service.js` | Added search-only international-input normalization export; persistence authority unchanged | Already untracked |
| `backend/tests/pos-customer-universal-search.test.cjs` | Added focused static/phone-authority tests | Absent before this control |
| `docs/acceptance/DARFUS_POS_CUSTOMER_UNIVERSAL_SEARCH_AND_SELECTION_01_REPORT.md` | This report | New report |

No migration, seed, config, permission catalog, customer, inventory, invoice, payment, or accounting file was changed.

## 11. Source Diff Summary

The pre-change hashes were captured before the implementation work. The resulting relevant hashes are:

| File | Pre-change SHA-256 | Final SHA-256 |
|---|---|---|
| `app/[locale]/(dashboard)/pos/page.tsx` | `9068C11F47DED9DEA7AABA0401C52B99E22625A17CEFD59A6943D69CB781E4AA` | `510DA1B97A5B2414537C8320B65DDAF20D4C23B5E549A15A1C2A7135450A63CA` |
| `features/sales/hooks/use-pos.ts` | `E5032A73C44AC2C8ACA8911C7B3645AF6C79D169F072F064CF991F4743904221` | `36A1967288CE77010D6A3FDDC4B27E61E1CBA86F037F6CAA857B5E16A93AFFD4` |
| `backend/src/routes/erp.routes.js` | `52E338B60BF978C9CD31C9BB17AD7179301FF9AE64FE374A0E4C52305C6C56DC` | `CC4F84033F569447DEC35C19E100D3C7D4FD6C7C1489993C03BCDEBEBF9B8CBE` |
| `backend/src/services/customer-phone.service.js` | `1FFF49FCDC4683F2EDE0D8515EC81DF735BE467AB422C458C0C5E4280AE7AD88` | `5EF6BE03E26410B98622EB7A902CFC9457C121B93BB5487C87F06AE6D3C11224` |
| `backend/tests/pos-customer-universal-search.test.cjs` | `ABSENT_BEFORE_CHANGE` | `B3488D48C511F1D264CD8C646DAC3C5B4315A9ACE5CE35A08A1C515A013A349B` |
| `next-env.d.ts` | `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651` | `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651` |

The source files above had pre-existing worktree modifications; the hashes document the exact before/after state rather than claiming the complete file diff belongs to this control.

## 12. Backend Focused Tests

`node --test backend/tests/pos-customer-universal-search.test.cjs`

Result: **4/4 passed**.

Covered:

- international phone search normalization without country inference;
- authentication, permission, company/branch/status/deleted filtering, bound, ambiguity response, DTO, and no-write route properties;
- no full customer collection preload in API mode;
- one combobox, keyboard contract, no auto-selection, existing Create Customer navigation CTA, and no old phone lookup UI.

## 13. Frontend Focused Tests

The focused test file statically verifies the one-combobox contract, `selectedCustomer` explicit selection state, keyboard handlers, no initial auto-select, and absence of the old phone-country/lookup surface. No customer was created or selected through a business mutation.

Result: **PASS, 4/4**.

## 14. Regression Tests

| Command | Result |
|---|---|
| `node --test backend/tests/pos-redesign-phase-02-universal-search-customer.test.cjs` | 4/4 PASS |
| `node --test tests/stage-c-pos-financial-integration.test.cjs` | 3/3 PASS |
| `node --test backend/tests/pos-asset-status-mapping-surgical-correction.test.cjs` | 3/3 PASS |

`REGRESSION_TESTS = PASS (10/10)`.

The test set preserves Asset status authority and server-side sale-price authority; it does not reopen Inventory Count or modify checkout behavior.

## 15. Typecheck

`npm run typecheck` completed with no TypeScript errors after the build-generated `.next/types` files were available.

`TYPECHECK = PASS`.

## 16. Production Build

`npm run build` completed successfully with Next.js 16.2.9/Turbopack and generated 130/130 static pages. `next-env.d.ts` remained at the owner-accepted SHA shown above.

`BUILD = PASS`.

## 17. Runtime Health

| Service | Status | Health | Evidence | Errors/Notes |
|---|---|---|---|---|
| Frontend `localhost:3000` | Running/serving | POS page loads | Browser DOM snapshots at `/ar/pos` and `/en/pos` | Existing frontend runtime served the new combobox |
| Backend `localhost:8000` | Running | `/api/v1/health` 200 | PowerShell GET at 2026-08-31 | Process uptime; no restart performed |
| PostgreSQL | Running | `/api/v1/health/db` 200; `current_database() = darfus_erp` | Docker Compose + read-only psql | Official DB was not mutated |
| Redis | Running | `/api/v1/health/redis` 200 | PowerShell GET | No Redis mutation requested |
| Backend container | Running | Docker state `running`, restart count 0 | `docker inspect` | Existing logs included prior expired-session errors; not a search implementation error |

The backend process started before the new route was loaded. The container command is `npm run db:migrate && npm start`; no restart was issued because restarting would invoke the migration command outside this control’s safety boundary.

## 18. Search API Runtime Proof

Direct read-only request:

```text
GET http://localhost:8000/api/v1/pos/customers/search?query=CUS&limit=20
Observed: 404 The requested API route was not found.
```

This is inconsistent with the current source route at `backend/src/routes/erp.routes.js` and proves stale backend/runtime parity, not a missing source implementation. Health and DB/Redis endpoints on the same backend returned 200.

`SEARCH_API_RUNTIME = BLOCKED_STALE_BACKEND_RUNTIME`.

## 19. Browser AR/EN

### Arabic

- `/ar/pos` loaded.
- Customer area showed one combobox: `ابحث بالاسم أو رقم العميل أو الهاتف`.
- Initial selected customer was empty; the DOM showed `اختر عميلًا لعرض ملخصه`.
- Typing `CUS` opened the listbox, but the stale backend returned the visible read-only error `The requested API route was not found.`.
- Escape closed the listbox (`aria-expanded=false`).

### English

- `/en/pos` loaded.
- Customer area showed one combobox: `Search by customer name, ID, or phone`.
- Initial selected customer was empty.
- Typing `zzzz` opened the listbox and exposed the same stale-backend 404 error.
- ArrowDown then Escape closed the listbox.

`AR_UI_STRUCTURE = PASS`, `EN_UI_STRUCTURE = PASS`, `AR_SEARCH_RUNTIME = BLOCKED`, `EN_SEARCH_RUNTIME = BLOCKED`.

## 20. Browser Desktop/Mobile

Verified with the existing in-app Chrome session using explicit temporary viewport overrides, then reset to the default viewport:

- Desktop: `1280x800` — POS page and combobox rendered.
- Tablet: `768x1024` — POS page and combobox rendered.
- Mobile: `390x844` — Arabic POS page and combobox rendered.

No horizontal-layout or crash evidence appeared in the DOM snapshots. Search result population remained blocked by the stale backend, so populated-candidate layout is not claimed as runtime PASS.

## 21. Light/Dark

The existing `Toggle theme` control was present in English. Browser proof toggled the page root from no class to `dark`, then back to an empty class. This was local presentation state only; it did not call a business endpoint or alter the DB.

`LIGHT_DARK = PASS_FOR_CUSTOMER_SEARCH_SURFACE`.

## 22. Network Proof

- Browser customer search request was read-only and returned a 404 from the stale backend.
- Health, DB, and Redis probes were GET-only and returned 200.
- No POST/PUT/PATCH/DELETE business request was issued.
- No request body containing credentials, tokens, or cookies was recorded.

## 23. Console/Page Errors

The browser diagnostic buffer contained `Maximum update depth exceeded` entries timestamped before the stable `EMPTY_API_CUSTOMERS` correction. After reload, the page rendered stably without an error overlay; the diagnostic API has no clear-buffer operation, so a clean-console PASS is not claimed from the accumulated buffer.

The current search error was the backend’s expected stale-route 404, not a page crash.

## 24. Customer Create/Edit Authority Regression

No customer create/edit action was run. Source and focused tests verify that:

- the POS search has no country selector;
- explicit country-aware create/edit normalization remains in `customer-phone.service.js`;
- search-only normalization never persists or infers a country;
- canonical phone remains a separate authority from raw phone.

`CUSTOMER_CREATE_EDIT_AUTHORITY = PRESERVED_BY_SOURCE_AND_TEST; NO_MUTATING_RUNTIME`.

## 25. DB/Mutation Safety

- Read-only `current_database()` returned `darfus_erp`.
- No migration was created or executed by this control.
- No POST/PUT/PATCH/DELETE business request was made.
- No customer, invoice, payment, inventory, Asset, barcode, accounting, CRM, or permission record was inserted/updated/deleted.
- No restart, cleanup, reset, stash, restore, or destructive Git command was run.

`OFFICIAL_DB_WRITES = 0` and `BUSINESS_DB_DELTA_FROM_THIS_CONTROL = 0` by the observed request set. A full historical table-delta comparison was not necessary because this control issued no business mutation and did not use a mutation-capable test database.

## 26. Open Items Not Touched

- No Customer/CRM schema or master-data change.
- No phone uniqueness migration or canonical phone backfill.
- No new customer creation flow.
- No checkout/sale/payment/invoice logic change.
- No Inventory Count reopening.
- No POS product search redesign.
- No permission/RBAC change.
- No backend restart or deployment.

## 27. Owner Closeout Packet

### Strengths

1. The server-side search gate is fail-closed on authentication, permission, branch, company, inactive, and deleted scope.
2. API mode avoids loading the full customer collection and has an explicit result bound.
3. Phone authority remains explicit-country and canonical; search does not become a write path.
4. The UI has one explicit customer selection surface with keyboard dismissal and no initial auto-selection.
5. Existing POS Asset/status and server pricing authority regressions remain passing.

### Weakness / blocker

`P1? = NO`: source implementation is present and focused tests pass.

`P2 ENVIRONMENT/RUNTIME`: the running backend is stale and does not serve the new route. This blocks real authenticated search-result acceptance but does not prove a product defect. Safe next action is a separately controlled runtime refresh that avoids automatic migration execution, followed by the same read-only API/browser checks.

## 28. Gate

`GATE = BLOCKED_POS_SEARCH_RUNTIME_ACCEPTANCE`

Reason: the real main frontend/backend pair cannot prove populated authenticated results because `localhost:8000` is a stale process returning 404 for the new route. The gate is not `PASS_POS_CUSTOMER_UNIVERSAL_SEARCH_AND_SELECTION`.

No P0 or P1 product regression was observed. No official DB mutation occurred.

## 29. Final Tokens

```text
CURRENT_CONTROL = DARFUS-POS-CUSTOMER-UNIVERSAL-SEARCH-AND-SELECTION-01
MODE = OWNER_APPROVED_MINIMUM_SAFE_IMPLEMENTATION
OWNER_APPROVAL = EXPLICIT

POS_CUSTOMER_ONE_SEARCH_FIELD = IMPLEMENTED
POS_SEARCH_NAME_ID_PHONE = IMPLEMENTED
POS_SEARCH_PARTIAL_RESULTS = IMPLEMENTED_SOURCE_ONLY
POS_SEARCH_EXACT_CANONICAL_PHONE = IMPLEMENTED_SOURCE_ONLY
POS_SEARCH_NO_AUTO_SELECTION = PASS
POS_SEARCH_EXPLICIT_SELECTION_ONLY = PASS_SOURCE_AND_UI
POS_SEARCH_CLEAR_CHANGE_WITHOUT_RELOAD = IMPLEMENTED
POS_SEARCH_KEYBOARD = PASS_SOURCE_AND_UI
POS_SEARCH_NO_COUNTRY_SELECTOR = PASS
POS_SEARCH_NO_RESULT_CREATE_CTA_NAVIGATION_ONLY = IMPLEMENTED

SERVER_SEARCH_AUTH = IMPLEMENTED
SERVER_SEARCH_PERMISSION = IMPLEMENTED
SERVER_SEARCH_COMPANY_SCOPE = IMPLEMENTED
SERVER_SEARCH_BRANCH_SCOPE = IMPLEMENTED
SERVER_SEARCH_LIMIT = IMPLEMENTED_20_MAX
SERVER_SEARCH_NO_FULL_DATASET_PRELOAD = PASS
SERVER_SEARCH_READ_ONLY = PASS
PHONE_COUNTRY_AUTHORITY_PRESERVED = YES
CANONICAL_PHONE_AUTHORITY_PRESERVED = YES

FOCUSED_TESTS = PASS
FOCUSED_TEST_COUNT = 4
REGRESSION_TESTS = PASS
REGRESSION_TEST_COUNT = 10
TYPECHECK = PASS
BUILD = PASS
RUNTIME_HEALTH = PASS
SEARCH_API_RUNTIME = BLOCKED_STALE_BACKEND_RUNTIME
AR_BROWSER_UI = PASS_STRUCTURE_BLOCKED_SEARCH
EN_BROWSER_UI = PASS_STRUCTURE_BLOCKED_SEARCH
DESKTOP_BROWSER = PASS_STRUCTURE
TABLET_BROWSER = PASS_STRUCTURE
MOBILE_BROWSER = PASS_STRUCTURE
LIGHT_DARK = PASS
CONSOLE_CLEAN = NOT_CLAIMED_HISTORICAL_BUFFER

MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED_THIS_CONTROL = 0
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_WRITES = 0
BUSINESS_DB_WRITES = 0
BUSINESS_EVENTS = 0
PRODUCT_CHECKOUT_LOGIC_CHANGED = NO
CRM_SCOPE_CHANGED = NO
INVENTORY_COUNT_REOPENED = NO

P0_COUNT = 0
P1_COUNT = 0
P2_COUNT = 1_RUNTIME_STALENESS
P3_COUNT = 1_HISTORICAL_CONSOLE_BUFFER_NOT_CLEARED

GATE = BLOCKED_POS_SEARCH_RUNTIME_ACCEPTANCE
NEXT_RECOMMENDED_STEP = SAFE_BACKEND_RUNTIME_REFRESH_WITHOUT_AUTOMATIC_MIGRATION_THEN_READ_ONLY_POS_SEARCH_PROOF
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. No CRM-1B4, CRM-1C, A8, client-parity batch, customer creation, or additional business operation was started.
