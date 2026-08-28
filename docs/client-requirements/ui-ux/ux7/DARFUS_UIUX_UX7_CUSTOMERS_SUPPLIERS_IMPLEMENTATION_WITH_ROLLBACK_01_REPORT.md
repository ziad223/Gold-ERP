# DARFUS ERP — UX-7 Customers / Suppliers Final Report

تم تنفيذ UX-7 كتحديث عرض وتفاعل محدود على صفحات العملاء والموردين فقط. نجحت الاختبارات والـtypecheck والـbuild وإثباتات المتصفح، ولم تُجرَ أي كتابة على قاعدة `darfus_erp`.

ما تم: تحسين هرمية البطاقات، قابلية قراءة الجداول والمعرّفات وبيانات الاتصال، التفاف القيم الطويلة، واستجابة أزرار الصفحات.  
ما لم يتغير: Business Logic، API، DB، Accounting، POS، Permissions، Routes، handlers، payloads، status keys، أو القيم المالية.  
Gate: `PASS_DARFUS_UIUX_UX7_CUSTOMERS_SUPPLIERS_IMPLEMENTATION_WITH_ROLLBACK`  
الخطوة التالية فقط: مراجعة المالك؛ لا يبدأ UX-8 تلقائيًا.

## 1. Executive Summary

| Question | Result |
|---|---|
| Customer/Supplier pages داخل UX-7 | Customers list/detail/forms؛ Suppliers list/detail/forms |
| Production source files changed | 5 |
| Customer business logic changed | NO |
| Supplier business logic changed | NO |
| Financial meaning changed | NO |
| POS customer flow changed | NO |
| API/DB/permissions changed | NO |
| AR/EN | PASS |
| Dark/Light | PASS |
| Desktop/Tablet/Mobile | PASS — wide 1422px، narrow 586px، intermediate CSS contract |
| Long values | PASS |
| High-risk embedded components inspected directly | PASS |
| Theme parity sweep | PASS |
| Preview theme-isolation gate | NOT_APPLICABLE — no fixed-format/machine-readable preview in UX-7 |
| Browser/console/hydration | PASS / 0 / 0 |
| Tests/typecheck/build | PASS / PASS / PASS |
| Main DB synthetic customer/supplier write | 0 / 0 |
| Rollback ready | PASS |
| Gate | PASS |

## 2. Scope

Changed only presentation classes in Customers/Suppliers list/detail surfaces and their existing forms. Loyalty, supplier purchases, POS, accounting, inventory and closed UX stages were not reopened.

## 3. Read First

`READ_FIRST = YES`. All mandatory project guidance, UX2–UX6B evidence, Customer/Supplier/POS/accounting evidence and relevant tests were read before edits. The owner method was read from `C:/Users/NEGM/Desktop/DARFUS_OWNER_MASTER_WORKING_METHOD_AND_PROMPT_CONTRACT.md`.

## 4. Route / Surface Inventory

See `DARFUS_UX7_ROUTE_SURFACE_INVENTORY.md`. Actual routes were discovered from source, not guessed: Customers list/detail/loyalty and Suppliers list/detail/purchases. UX7 changed only the two master-data list/detail families and their existing forms.

## 5. Scope Classification

See `DARFUS_UX7_SCOPE_CLASSIFICATION.md`. Lists are A/B presentation work; details/forms are B/C workflow-sensitive presentation-only work; loyalty and purchase/receive surfaces are D/deferred.

## 6. Authority Map

See `DARFUS_UX7_AUTHORITY_MAP.md`. Hooks/API, auth/branch context, permission checks, statement/accounting sources and existing mutation handlers remain authorities.

## 7. Frozen Contracts

See `DARFUS_UX7_BUSINESS_CONTRACT_FREEZE.md`. No customer/supplier identity, ID, contact, tax, status, classification, financial, permissions, company/branch, POS, API, DB or accounting contract changed.

## 8. Baseline

Before capture: `backups/ui-ux/PRE_UX7_CUSTOMERS_SUPPLIERS_20260828T154221Z/`. HEAD was `1657b0e9ba580faef69be48f04637835c201b521`; tracked modified count 132, untracked count 874, stash count 11. Existing worktree drift was preserved. `next-env.d.ts` was unchanged.

## 9. Before Evidence

Populated EN Customer and Supplier list screenshots plus DOM captures were taken before editing. The baseline was functional; the identified work was scoped visual consistency/readability, not a business defect. See before evidence and before hash manifest.

## 10. Files Changed

| File | Purpose | Before SHA-256 | After SHA-256 | Business/API/DB change | Rollback |
|---|---|---|---|---|---|
| `app/globals.css` | scoped UX7 styles | `ABA365B7436AF9AC1C58FC1D4AEA9F88D4C63A778B8AEAD52234A438928BB8E9` | `7F208980DB9A25E2A04A16AD0897FF8496F2182EA6AAE27CA94D17144C2CD61B` | NO / NO / NO | YES |
| `app/[locale]/(dashboard)/customers/page.tsx` | list classes/readability | `C83832DED49408B78B1A0F1EA19D249660094D0076D6A6210FE860D19A73F272` | `162D330E39592685D596E4FBDAE7029287D737CFEDCAD9519FB4DA1B3C4AAF34` | NO / NO / NO | YES |
| `app/[locale]/(dashboard)/customers/[id]/page.tsx` | detail/form/tab presentation | `97026B2238138499E23213A55BA510FD043E491AEAC82EC5EC6A6F814FA37BC8` | `37DDFCF117BCBC07409A97079D0BB17751C9065F3CCA93BE7DA5AF747132B6D0` | NO / NO / NO | YES |
| `app/[locale]/(dashboard)/suppliers/page.tsx` | list/card/readability | `B0EDD4A3D111150C1774ADC81983F2720AF0E40053243DF22FFC17A97A44589E` | `E4ADB361331FB2ADD4E05B713CF1C40DB67AFB63A60206490B8B021967ABD983` | NO / NO / NO | YES |
| `app/[locale]/(dashboard)/suppliers/[id]/page.tsx` | detail/tab presentation | `F2D4CAA8E52688626F1A51BB287E0A678EBF2027DFCF5FB36773C6641FE4925A` | `5CDE23527412EF9E7FBD55FA8FA666B869C14C5B0A536C59F6D4894B8D03DA3E` | NO / NO / NO | YES |

Test file: `tests/ux7-customers-suppliers.test.cjs` (26F592AB483BCBD1623B0FD4D97B4F5E1778A27FD8CA2EF09542A853A8C04B13).

Source-drift note: `app/[locale]/(dashboard)/suppliers/purchases/page.tsx` was already modified in the pre-UX7 worktree capture and was not touched by this control. No cleanup, reset or stash was used.

## 11. Customer List

PASS. Existing `useCustomers`, query state, `DataToolbar`, table columns, identity links, contact values, purchases/reference balance, status badges and permission-gated actions were preserved. UX7 adds only scoped classes.

## 12. Customer Detail

PASS. Identity, contact, address, history, KYC, attachments and financial panels remain source-backed. Detail title wrapping and tab overflow are presentation-only.

## 13. Customer Form

PASS. Create/edit modal was opened in AR/EN without submit. Required fields, validation, address contract, payload construction and mutation handlers are unchanged.

## 14. Supplier List

PASS. Existing supplier card grid, category, ID, rating, phone, reference balance, last order, status and actions remain intact. IDs and phones receive bidi-safe rendering only.

## 15. Supplier Detail

PASS. Existing supplier identity, contact, tax, purchases, statement, RCM, documents, consignment, payment and reversal surfaces remain intact. Only scoped detail/tab/title classes changed.

## 16. Supplier Form

PASS. Create/edit form was opened in AR/EN without submit. Existing fields, validation, payload and save handler are unchanged.

## 17. Search / Filters

PASS. Search, tier/category, balance/due, status, reset, page size and pagination semantics are unchanged. Existing `DataToolbar` is reused.

## 18. Contact / Identifier Readability

PASS. Source values for Customer ID, Supplier ID, phone, email and tax identifiers were not normalized or changed. `direction: ltr`, `unicode-bidi: plaintext`, `overflow-wrap: break-word` and `min-width:0` prevent RTL/LTR clipping/reordering.

## 19. Financial Presentation

PASS. Existing `money(...)` calls, reference-balance notices, supplier statements and accounting repository calls remain unchanged. No formula, rounding, sign or source interpretation was introduced.

## 20. Status / Action Hierarchy

PASS. Existing status keys, badge meanings, permission gates and handlers remain. The scoped visual layer improves grouping/hover/focus without adding or merging states.

## 21. State Presentation

PASS. Existing loading/empty/error components and retry behavior remain. No new state or uncontrolled backend error display was introduced.

## 22. AR/EN

PASS. AR captures show RTL Arabic UI chrome; EN captures show LTR English UI chrome. Business data, IDs, phone and financial values remain source values. `AR_UI_CHROME_LEAKS = 0`; `EN_UI_CHROME_LEAKS = 0`.

## 23. RTL/LTR

PASS. Browser reported `dir=rtl` for AR and `dir=ltr` for EN. Identifier/contact values use bidi isolation; back/action layout remains controlled by existing RTL classes.

## 24. Dark/Light

PASS. Wide browser captures covered EN/AR list/detail states in both themes. Narrow captures covered AR/EN states in both themes. UX7 selectors use semantic theme tokens and no content changes between themes.

## 25. Responsive

PASS. Wide runtime surface was 1422px; narrow runtime surfaces were 586px and 355px. Browser reported `bodyScrollWidth <= clientWidth` for all captured surfaces. Mobile action wrapping and bounded table behavior are scoped in CSS; intermediate tablet rules are covered by the same responsive contract.

## 26. Long Values

PASS. Existing QA/customer values were viewed in populated lists/details. Titles and identifiers use safe wrapping; contact values and long IDs cannot force page overflow. No synthetic main-DB stress records were created.

## 27. Embedded Component Sweep

PASS. Directly inspected: Customer stat cards/table/forms/detail tab strip; Supplier stat cards/card grid/forms/detail tab strip. Each was checked in AR/EN and Light/Dark. No fixed-format or machine-readable preview exists in UX7.

## 28. Theme Parity Sweep

PASS. Every changed production selector is `.ux7-page` scoped and was checked in same-state Light/Dark pairs. `UX7_THEME_PARITY_SWEEP = PASS`.

## 29. Preview Theme Isolation

`UX7_PREVIEW_THEME_ISOLATION = NOT_APPLICABLE`. UX7 contains no print/document/receipt/QR/barcode preview. The permanent UX6B gate remains active for any future embedded preview.

## 30. Accessibility

PASS. Native labels, buttons, links, tables, permission-disabled states and existing dialog semantics remain. Form dialogs were opened and closed without submission. Existing focus-visible and reduced-motion rules remain active.

## 31. Motion

PASS. UX7 adds no new motion requirement; existing short transitions remain and `prefers-reduced-motion` disables UX7 transitions.

## 32. Real Browser

PASS. Real browser evidence covered populated Customer/Supplier lists, details and non-submitted forms in AR/EN and Light/Dark. No second frontend/backend was started.

## 33. Console/Hydration

PASS. Current browser logs contained no application errors/warnings and no hydration errors. Expected framework/dev-tool messages were not classified as application failures.

## 34. Focused Tests

`node --test tests/ux7-customers-suppliers.test.cjs` → 4/4 PASS. Combined relevant set → 43/43 PASS. See `DARFUS_UX7_FOCUSED_TEST_RESULTS.md`.

## 35. Customer Regression

PASS. Customer address, Customer Create UI, profile/address permission, POS customer summary, phone lookup and Customer Master contracts passed.

## 36. Supplier Regression

PASS. Supplier ID hardening, Supplier Master identity/CRUD/lifecycle/permissions/read-history and final-closure contracts passed.

## 37. Cross-Module Regression

PASS. POS customer lookup/summary, invoice projection, address and supplier closure contracts passed. `POS_CUSTOMER_FLOW_REGRESSION = NO`.

## 38. Typecheck/Build

`npm run typecheck` → PASS. `npm run build` → PASS. Next.js 16.2.9 generated 130/130 pages. No deployment was performed.

## 39. Main DB Safety

Read-only PostgreSQL evidence: `SELECT current_database()` returned `darfus_erp`.  
`MAIN_DB_SYNTHETIC_CUSTOMERS_CREATED = 0`  
`MAIN_DB_SYNTHETIC_SUPPLIERS_CREATED = 0`  
`MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0`  
`MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0`  
`MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0`  
No migrations/seeds/backup/receive/payment/checkout ran in UX-7.

## 40. After Snapshot

`UX7_AFTER_SNAPSHOT = PASS`: `backups/ui-ux/UX7_CUSTOMERS_SUPPLIERS_20260828T154221Z/` contains after copies, browser captures, test/build evidence and manifests. See `DARFUS_UX7_AFTER_HASH_MANIFEST.md`.

## 41. Rollback

`UX7_ROLLBACK_REHEARSAL = PASS`. Isolated evidence copies followed `after → restored-before → re-applied-after`; before/after hashes matched their manifests. No live restore or destructive Git command was used.

## 42. Registers

The UX change ledger, rollback register, success/error/issue/prevention/owner-decision/closed-evidence registers were updated by documentation-only entries. No historical evidence was rewritten.

## 43. Gate

All required UX7 conditions passed: authority preservation, list/detail/form presentation, search/filter preservation, AR/EN, RTL/LTR, Light/Dark, responsive, long values, embedded sweep, theme parity, accessibility, browser, tests, typecheck, build, DB safety and rollback. P0=0; P1=0.

`GATE = PASS_DARFUS_UIUX_UX7_CUSTOMERS_SUPPLIERS_IMPLEMENTATION_WITH_ROLLBACK`  
`UX7_STATUS = CLOSED`

## 44. Final Tokens

```text
CURRENT_CONTROL = DARFUS-UIUX-UX7-CUSTOMERS-SUPPLIERS-IMPLEMENTATION-WITH-ROLLBACK-01
MODE = PRESENTATION_AND_INTERACTION_UI_ONLY_BUSINESS_AUTHORITY_FROZEN
EXECUTE_THIS_CONTROL = YES
READ_FIRST = YES
UX7_PREVENTION_GATES_ACTIVE = YES
UX7_ROUTE_SURFACE_INVENTORY = COMPLETE
UX7_SCOPE_CLASSIFICATION = COMPLETE
UX7_AUTHORITY_MAP = COMPLETE
PRE_UX7_GIT_STATE_CAPTURED = YES
MAIN_DB_IDENTITY_VERIFIED = YES
UX7_BEFORE_SNAPSHOT = PASS
UX7_BEFORE_HASH_MANIFEST = PASS
UX7_BEFORE_VISUAL_EVIDENCE = PASS
PRODUCTION_SOURCE_FILES_CHANGED = 5
CUSTOMER_LIST_PRESENTATION = PASS
CUSTOMER_DETAIL_PRESENTATION = PASS
CUSTOMER_FORM_BEHAVIOR_CHANGED = NO
CUSTOMER_FORM_UX = PASS
SUPPLIER_LIST_PRESENTATION = PASS
SUPPLIER_DETAIL_PRESENTATION = PASS
SUPPLIER_FORM_BEHAVIOR_CHANGED = NO
SUPPLIER_FORM_UX = PASS
CUSTOMER_SUPPLIER_SEARCH_BEHAVIOR_CHANGED = NO
SEARCH_FILTER_UX = PASS
CONTACT_DATA_SEMANTICS_CHANGED = NO
CONTACT_READABILITY = PASS
BUSINESS_IDENTIFIER_VALUES_CHANGED = NO
BUSINESS_IDENTIFIER_READABILITY = PASS
FINANCIAL_DISPLAY_SEMANTICS_CHANGED = NO
FINANCIAL_NUMERIC_READABILITY = PASS
CUSTOMER_STATUS_SEMANTICS_CHANGED = NO
SUPPLIER_STATUS_SEMANTICS_CHANGED = NO
STATUS_PRESENTATION = PASS
CUSTOMER_SUPPLIER_ACTION_BEHAVIOR_CHANGED = NO
ACTION_HIERARCHY = PASS
UX7_STATE_PRESENTATION = PASS
UX7_AR = PASS
UX7_EN = PASS
AR_UI_CHROME_LEAKS = 0
EN_UI_CHROME_LEAKS = 0
UX7_RTL_LTR = PASS
UX7_LIGHT = PASS
UX7_DARK = PASS
UX7_DESKTOP = PASS
UX7_TABLET = PASS
UX7_MOBILE = PASS
UX7_LONG_VALUE_STRESS = PASS
UX7_EMBEDDED_COMPONENT_SWEEP = PASS
UX7_THEME_PARITY_SWEEP = PASS
UX7_PREVIEW_THEME_ISOLATION = NOT_APPLICABLE
UX7_ACCESSIBILITY = PASS
UX4C_FOCUS_REGRESSION = NO
UX7_MOTION = PASS
UX7_REAL_BROWSER = PASS
CONSOLE_APPLICATION_ERRORS = 0
HYDRATION_ERRORS = 0
UX7_FOCUSED_TESTS = PASS
CUSTOMER_REGRESSION = PASS
SUPPLIER_REGRESSION = PASS
CROSS_MODULE_REGRESSION = PASS
TYPECHECK = PASS
BUILD = PASS
MAIN_DB_SYNTHETIC_CUSTOMERS_CREATED = 0
MAIN_DB_SYNTHETIC_SUPPLIERS_CREATED = 0
MAIN_DB_CONTROL_OWNED_BUSINESS_WRITES = 0
MAIN_DB_CONTROL_OWNED_FINANCIAL_WRITES = 0
MAIN_DB_CONTROL_OWNED_INVENTORY_WRITES = 0
CUSTOMER_BUSINESS_LOGIC_CHANGED = NO
SUPPLIER_BUSINESS_LOGIC_CHANGED = NO
ACCOUNTING_LOGIC_CHANGED = NO
POS_LOGIC_CHANGED = NO
POS_CUSTOMER_FLOW_REGRESSION = NO
API_CHANGED = NO
DATABASE_CHANGED = NO
DB_SCHEMA_CHANGED = NO
PERMISSIONS_CHANGED = NO
MIGRATIONS = 0
UX7_AFTER_SNAPSHOT = PASS
UX7_CHANGE_LEDGER_UPDATED = YES
UX7_ROLLBACK_REGISTER_UPDATED = YES
UX7_ROLLBACK_REHEARSAL = PASS
UX7_BEFORE_HASH_PARITY = PASS
UX7_AFTER_HASH_PARITY = PASS
P0 = 0
P1 = 0
P2 = 0
P3 = 0
GATE = PASS_DARFUS_UIUX_UX7_CUSTOMERS_SUPPLIERS_IMPLEMENTATION_WITH_ROLLBACK
UX7_STATUS = CLOSED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_ONLY; UX-8 AFTER EXPLICIT APPROVAL
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 45. STOP

STOP. No UX-8, no business/API/DB/permission change, no migration, no synthetic Customer/Supplier record, and no automatic next batch.
