# DARFUS ERP — D2F Gate C Disposable Print Runtime Mutation Acceptance

## 1. Executive Summary

تم تنفيذ قبول الطباعة/إعادة الطباعة على بيئة Clone مستقلة فقط. نجحت مسارات العرض والطباعة وإعادة الطباعة للمصادر السبعة الحالية، مع بقاء هوية المستند ثابتة وعدم إنشاء مستند أعمال جديد. لم تُكتب أي بيانات إلى `darfus_erp`، ولم يتغير المصدر أو الاختبارات أو إعدادات المشروع.

النتيجة: `PASS_DISPOSABLE_PRINT_RUNTIME_MUTATION`.

الملاحظة الوحيدة غير الحاجبة هي طلب صورة شعار مُسجّل مسبقًا في الإعدادات ويعيد `404` داخل الـClone؛ لم يمنع البحث أو التفاصيل أو print frame، ولم يحدث خطأ Console.

## 2. Accepted Upstream State

| Authority | Accepted state | Evidence |
|---|---|---|
| D2F Gate A | `CLOSED_WITH_OWNER_MANUAL_EVIDENCE_WAIVER` | Upstream D2F Gate A report |
| D2F Gate B | `CLOSED` | Upstream D2F Gate B report |
| Current track | D2F unified invoice projection / print runtime | Current source and runtime |
| Production | Not contacted | No production endpoint was used |

## 3. Read-First

تمت مراجعة control الكامل، وتعريفات projection، routes، print-event services/models، Gift Voucher print authority، CGP projection print path، unified Search & Print، وfocused tests قبل التنفيذ.

أهم الملفات المقروءة:

- `backend/src/services/invoice-projection.service.js`
- `backend/src/routes/erp.routes.js`
- `backend/src/routes/invoice-projection.routes.js`
- `backend/src/services/gift-voucher.service.js`
- `backend/src/models/gift-voucher-print-event.model.js`
- `app/[locale]/(dashboard)/sales/search-print/page.tsx`
- `lib/print/print-service.ts` وملفات `InvoiceDocument` المرتبطة
- تقارير D1 / D2 / D2F / E وGift Voucher print contract كأدلة مساندة فقط

لم يُستخدم تقرير قديم لإثبات runtime الحالي عندما تعارض مع المصدر الحالي.

## 4. Print Authority Map

| Source | View/detail authority | Print mutation authority | Reprint authority | Result |
|---|---|---|---|---|
| Sale | Invoice Projection adapter | `POST /api/v1/invoices/:id/print-events` → `invoice_print_events` | Same invoice, `reprint_authorized` | Proven |
| Return | Invoice Projection adapter | Same generic invoice route | Same invoice | Proven |
| Exchange | Invoice Projection adapter | Same generic invoice route | Same invoice | Proven |
| Installment | Invoice Projection adapter | Same generic invoice route | Same invoice | Proven |
| Deposit | Invoice Projection adapter | Same generic invoice route | Same invoice | Proven |
| Customer Gold Purchase | CGP read-only projection | `POST /api/v1/invoice-projection/customer_gold_purchase/:id/print-events` → audited projection print | Same CGP source identity | Proven |
| Gift Voucher | Dedicated read-only Gift Voucher adapter | `POST /api/v1/gift-vouchers/:code/print-events` → `gift_voucher_print_events` | Same voucher; original/reprint event kinds | Proven |

Gift Voucher unified Search & Print uses the accepted display-only projection print path; the canonical print-event mutation remains the dedicated Gift Voucher endpoint. No second authority was introduced.

## 5. Main DB Read-Only Baseline

### Before and after control counts

| Table | Before | After | Delta |
|---|---:|---:|---:|
| `assets` | 23 | 23 | 0 |
| `audit_logs` | 328 | 328 | 0 |
| `customer_gold_purchase_documents` | 4 | 4 | 0 |
| `gift_voucher_print_events` | 5 | 5 | 0 |
| `gift_vouchers` | 5 | 5 | 0 |
| `idempotency_requests` | 161 | 161 | 0 |
| `inventory_asset_movements` | 82 | 82 | 0 |
| `invoice_items` | 10 | 10 | 0 |
| `invoice_print_events` | 9 | 9 | 0 |
| `invoices` | 10 | 10 | 0 |
| `journal_entries` | 73 | 73 | 0 |
| `journal_lines` | 200 | 200 | 0 |
| `payments` | 20 | 20 | 0 |

Main identity before/after: `darfus_erp`, PostgreSQL 16.15, user `postgres`.

Main runtime health after proof: backend `:8000` = `200`; DB health = `200`; containers `darfus-backend`, `darfus-postgres`, and `darfus-redis` remained running. Main frontend/backend were not restarted or repointed.

## 6. Disposable Clone Identity

| Item | Evidence |
|---|---|
| Clone DB | `darfus_d2f_print_runtime_20260830_01` |
| Clone identity | `current_database()=darfus_d2f_print_runtime_20260830_01`, user `postgres` |
| Creation | `pg_dump` from main followed by `pg_restore --exit-on-error` |
| Dump artifact | `backups/client-requirements/d2f-gate-c/20260829T214125Z/darfus_d2f_print_runtime_20260830_01.dump` |
| Dump SHA-256 | `798CAA10AA540ECF5C7A4A633CA9699CDAF707EF7AE11B3F351D99A710B805F7` |
| Main-before evidence SHA-256 | `B05CCC816DC979448595B3CCE4B4F5BF66EFF3ECAFD8BAC7110BC17B424AE0B6` |
| Clone identity evidence SHA-256 | `B41944581DC31D287069CB3422E91AD6DE2954FA21D4CF8E2A1CA754B30BE2F4` |
| Clone fidelity | Source counts matched main before clone-only fixtures |

## 7. Runtime Isolation

| Runtime | Configuration/result |
|---|---|
| Isolated backend | `localhost:8011`, connected to the named Clone DB |
| Isolated Redis | Redis DB 15 only |
| Isolated frontend | Temporary copy, `localhost:3012`, built with API URL `http://localhost:8011/api/v1` |
| Browser entry | Temporary proxy `localhost:3011` → UI `3012` / API `8011` |
| Main frontend | `localhost:3000` not used for acceptance |
| Main backend | `localhost:8000` not used as the acceptance target |
| Root `.next` | Not rebuilt or repointed |
| `next-env.d.ts` | Unchanged; SHA-256 `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651` |
| Temporary services at completion | Ports 8011/3011/3012 stopped |

The first temporary frontend build attempt failed before compilation due to Turbopack junction handling. A second isolated copy was built successfully with local dependencies and webpack. These failures affected only disposable setup and did not touch product source.

## 8. Fixture Selection

Existing valid Clone rows were used first for sale, installment, CGP, and Gift Voucher. Three clearly synthetic Clone-only invoice fixtures were added because the selected return/exchange/deposit source rows were not present as printable source families:

| Fixture | ID / invoice number | Clone-only data |
|---|---|---|
| Return | `D2F-C-RETURN-20260830-01` / `D2F-RETURN-20260830-01` | 1 invoice + item id 22 |
| Exchange | `D2F-C-EXCHANGE-20260830-01` / `D2F-EXCHANGE-20260830-01` | 1 invoice + item id 23 |
| Deposit | `D2F-C-DEPOSIT-20260830-01` / `D2F-DEPOSIT-20260830-01` | 1 invoice + item id 24 |

Fixture totals were copied from a valid source row as `100000` subtotal, `14000` VAT, `114000` total. They were never copied to the official DB.

## 9. Source-by-Source Print View Matrix

All seven active source families returned `200` detail responses with `success=true`, and the projection source identity was preserved.

| Source | Selected source evidence | Detail | Identity/currency/totals |
|---|---|---:|---|
| Sale | `INV-ID-1787478360975-9vhxi5` | 200 | Invoice identity and AED values preserved |
| Return | `D2F-C-RETURN-20260830-01` | 200 | Return identity and AED values preserved |
| Exchange | `D2F-C-EXCHANGE-20260830-01` | 200 | Exchange identity and AED values preserved |
| Installment | `INV-ID-1787932447390-l7nnms` | 200 | Installment identity and AED values preserved |
| Deposit | `D2F-C-DEPOSIT-20260830-01` | 200 | Deposit identity and AED values preserved |
| Customer Gold Purchase | `CGPD:COMP-48ab554f-427e-4642-9419-bc8616c2dc36:9cfd3293-4d49-4c24-a254-56c96823de1e` | 200 | CGPD source identity and stored totals preserved |
| Gift Voucher | `GV-3dac8467-f1c0-46fb-a09c-5bf52d4b8e3e` | 200 | Voucher identity, code, status, AED value preserved |

`PRINT_VIEW_SOURCE_COUNT = 7` and `PRINT_VIEW_ALL_SUPPORTED_SOURCES = PASS`.

## 10. Mutation Eligibility Matrix

| Source group | Required? | Endpoint | Allowed target | Authority |
|---|---|---|---|---|
| Sale / Return / Exchange / Installment / Deposit | Yes | `/api/v1/invoices/:id/print-events` | Clone only | `invoice_print_events` |
| CGP | Yes | `/api/v1/invoice-projection/customer_gold_purchase/:id/print-events` | Clone only | CGP projection audit print event |
| Gift Voucher | Yes | `/api/v1/gift-vouchers/:code/print-events` | Clone only | `gift_voucher_print_events` |

No business-document creation endpoint was used.

## 11. First Print Results

### Generic Invoice sources

One official print was executed for each of the five generic families; each returned `201`, created one `official_print_authorized` event, and kept the source invoice unchanged.

Result files:

- `sale-official.json`
- `return-official.json`
- `exchange-official.json`
- `installment-official.json`
- `deposit-official.json`

### CGP

Official CGP projection print returned `201`, created the accepted audited projection-print evidence, and returned `readOnlySource=true`.

### Gift Voucher

The canonical original print returned `201` with `printKind=original`. Voucher state, face value, and source identity were unchanged.

## 12. Reprint Results

### Generic Invoice sources

Each of the five generic families returned `201` for canonical reprint, with a new `reprint_authorized` event and the same invoice identity. No invoice, item, payment, journal, movement, or asset was added.

### CGP

CGP reprint returned `201`, preserved the CGP source identity, and recorded `eventType=reprint`, `copyNumber=2` in the projection audit evidence.

### Gift Voucher

Canonical reprint returned `201` with `printKind=reprint`. Clone query showed exactly one original and one reprint event for the selected voucher.

## 13. Gift Voucher Print Contract

| Proof | Result |
|---|---|
| Original event | `201`, `printKind=original` |
| Exact same-key/same-payload replay | Same `201` response/event identity; no duplicate event |
| Changed payload with same key | Expected `409 Conflict`; no new event |
| Reprint | `201`, `printKind=reprint`; same voucher identity |
| Voucher lifecycle/value mutation | None |
| Immutable event model | Existing immutable hooks preserved |
| Unified UI Gift Voucher print | Display-only print frame; no extra Gift Voucher event POST |

## 14. CGP Print Contract / Separate Recovery Track

CGP projection printing used the existing read-only projection route and preserved the accepted CGP source authority. It did not post CGP, settle CGP, mutate gold, or create a generic invoice source.

`CGP_PRINT_RECOVERY_TRACK = OPEN_UNCHANGED`.

## 15. Idempotency / Duplicate Protection

Gift Voucher exact replay evidence:

- Scope: `gift_voucher.print`
- Original and reprint keys were distinct.
- Same key + same body returned the stored successful event rather than inserting another event.
- Same key + changed body returned `409 Conflict`.
- Clone table showed two successful Gift Voucher print idempotency records for the two distinct keys and no extra event for the conflict.

Generic invoice and CGP print contracts were executed through their existing print authorization mechanisms; no new idempotency implementation was added.

## 16. AR Browser

Browser: isolated `http://localhost:3011/ar/sales/search-print`.

- Authenticated successfully against the Clone runtime.
- Selected `Branch-1`.
- Search UI showed all seven supported source types and the read-only badge.
- Search for `D2F-RETURN-20260830-01` returned one row; detail dialog showed return type, branch, total, and item identity.
- Print options opened in Arabic. The fixture had already received API official authorization, so the UI duplicate official attempt correctly returned `409 OFFICIAL_PRINT_ALREADY_AUTHORIZED` and created no event.
- Search for `INV-2026-000010` then completed browser official print and reprint, both `201`, with the same invoice identity in the Arabic print frame.
- Returning to search preserved the same invoice row and URL.

`AR_BROWSER = PASS`.

## 17. EN Browser

Browser: isolated `http://localhost:3011/en/sales/search-print`.

- Existing authenticated session and `Branch-2` context were used.
- Search UI rendered English labels, all seven source types, and read-only state.
- Search for `INV-2026-000009` opened the correct sale detail.
- Browser official print and reprint both returned `201` on the Clone.
- Print frame contained the same invoice number and `Branch-2`.
- Gift Voucher search opened the same voucher, and the unified display-only print frame contained the voucher number/code/value/status without a Gift Voucher print-event POST.
- Returned to search with the same source identity.

`EN_BROWSER = PASS`.

## 18. Network / Console

### Core network evidence

The isolated backend log recorded authenticated GETs and authorized Clone-only print POSTs. Representative results were `200` for health, projection summaries, details, and `201` for authorized print/reprint operations. The single duplicate AR return attempt was the expected `409` guard.

### Console and page state

`tab.dev.logs({levels:["error","warn"]})` returned zero entries after authenticated AR/EN journeys. No visible application error, crash boundary, or page error was observed.

### Explicit limitations/non-core observations

- The browser control surface does not expose raw `requestfailed` interception. Server request logs and DOM/print-frame evidence were used; no raw network event was fabricated.
- The configured optional upload/logo path returned `404` repeatedly in the Clone. It did not block the tested workflow or produce a Console error; recorded as non-core P2 configuration/asset evidence.
- The first stale session after starting the isolated backend produced expected `401` refresh/auth responses before the confirmed login. After login and branch selection, core requests completed successfully.

`CONSOLE_APPLICATION_ERRORS = 0`.
`UNEXPECTED_PAGEERRORS = 0 OBSERVED`.
`UNEXPECTED_REQUEST_FAILURES = 0 FOR CORE WORKFLOW`; `NON_CORE_OPTIONAL_UPLOAD_404 = OBSERVED`.

## 19. Disposable DB Delta Matrix

Clone baseline was captured after clone creation, authentication/GET evidence, and the three Clone-only fixtures:

| Entity | Before print proof | After all Clone proof | Delta | Expected |
|---|---:|---:|---:|---|
| `invoices` | 13 | 13 | 0 | 0 |
| `invoice_items` | 13 | 13 | 0 | 0 |
| `assets` | 23 | 23 | 0 | 0 |
| `payments` | 20 | 20 | 0 | 0 |
| `inventory_asset_movements` | 82 | 82 | 0 | 0 |
| `journal_entries` | 73 | 73 | 0 | 0 |
| `journal_lines` | 200 | 200 | 0 | 0 |
| `gift_vouchers` | 5 | 5 | 0 | 0 |
| `invoice_print_events` | 9 | 23 | +14 | Authorized print/reprint events only |
| `gift_voucher_print_events` | 5 | 7 | +2 | Original + reprint only |
| `idempotency_requests` | 161 | 163 | +2 | Two successful Gift Voucher keys |
| `audit_logs` | 329 | 353 | +24 | Auth/search/print audit evidence |

The `+14` invoice print events comprise five generic official/reprint pairs, one CGP official/reprint pair, and two browser sale official/reprint pairs. No business, financial, inventory, or payment delta occurred.

Clone source fingerprints for unaffected records matched the main source fingerprints:

- assets: `584b3049b1ded7d6b8071bbcdeb52a4e`
- movements: `6a0f2f5314f6354ff18559d3f4ecbb77`
- journals: `dbd1645ee594cd9a32c320168b2e1aa9`
- payments: `5e8e72a7cfd97620cc50bc3d0b195d70`
- CGP: `73bd84eed7e6e50f50d269a83c0c042b`
- Gift Vouchers: `0292b0f77313d21c9a47f3501f12c680`

`UNEXPECTED_BUSINESS_DELTA = 0`.
`UNEXPECTED_FINANCIAL_DELTA = 0`.
`UNEXPECTED_INVENTORY_DELTA = 0`.

## 20. Focused Tests

Existing tests only; no test edits. The following 64 tests passed:

- `tests/d2-final-invoice-search-print.test.cjs` — 5/5
- `backend/tests/d1-unified-invoice-projection.test.cjs` — 7/7
- `backend/tests/d2f-gift-voucher-projection-adapter.test.cjs` — 3/3
- `backend/tests/e-cgp-invoice-projection.test.cjs` — 3/3
- `tests/ux11-print-preview-presentation.test.cjs` — 4/4
- `backend/tests/gift-voucher-purchased-foundation.test.cjs` — 11/11
- `backend/tests/gift-voucher-full-redemption-contract.test.cjs` — 17/17
- `tests/pos-gift-voucher-i18n.test.cjs` — 4/4
- `tests/pos-gift-voucher-payment-ui-composition.test.cjs` — 4/4
- `tests/pos-gift-voucher-visual-ux-correction.test.cjs` — 3/3
- `tests/ux5d-gift-voucher-visual-clarity.test.cjs` — 3/3

`FOCUSED_TESTS = PASS`.
`TEST_CHANGES = 0`.

## 21. Typecheck / Build

- `npm run typecheck` on the project source: exit code `0`, `TYPECHECK = PASS`.
- An isolated temporary frontend copy was built with `npx next build --webpack` and API URL `http://localhost:8011/api/v1`: `BUILD = PASS`.
- The original project build was not run and the original `.next` output was not modified.
- Temporary `npm ci` and build artifacts were outside the project source and were not used as product changes.

## 22. Main DB Final Safety

Final read-only query again returned `current_database()=darfus_erp`. The before/after table counts remained identical for all business, financial, inventory, print-event, and idempotency tables listed in Section 5.

`MAIN_DB_BUSINESS_DELTA_BY_CONTROL = 0`.
`MAIN_DB_FINANCIAL_DELTA_BY_CONTROL = 0`.
`MAIN_DB_INVENTORY_DELTA_BY_CONTROL = 0`.
`MAIN_DB_PRINT_EVENT_DELTA_BY_CONTROL = 0`.
`MAIN_DB_SYNTHETIC_DELTA_BY_CONTROL = 0`.

No main migration, seed, print POST, fixture write, or cleanup was executed.

## 23. Open Separate Tracks

- CGP repeated-print recovery UI remains open and unchanged.
- Gift Voucher projection/dedicated print authority remains source-specific as accepted; no generic print authority was introduced.
- Optional missing upload/logo asset is a non-blocking P2 configuration/asset observation; it was not repaired in this control.

## 24. Gate C Decision

All required Gate C conditions passed on the disposable runtime. No P0 or P1 issue was introduced or observed.

`GATE_C = PASS_DISPOSABLE_PRINT_RUNTIME_MUTATION`
`D2F_GATE_C = CLOSED`

## 25. Final Tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-D2F-GATE-C-DISPOSABLE-PRINT-RUNTIME-MUTATION-ACCEPTANCE-01
MODE = DISPOSABLE_CLONE_PRINT_RUNTIME_MUTATION_ACCEPTANCE_ONLY
OWNER_APPROVAL = EXPLICIT
READ_FIRST = PASS
D2F_GATE_A = CLOSED_WITH_OWNER_MANUAL_EVIDENCE_WAIVER
D2F_GATE_B = CLOSED
MAIN_DB = darfus_erp
MAIN_DB_READ_ONLY = YES
PRINT_ACCEPTANCE_DB = darfus_d2f_print_runtime_20260830_01
PRINT_ACCEPTANCE_DB_IS_DISPOSABLE = YES
ISOLATED_RUNTIME_DB_IDENTITY = PASS
MAIN_BACKEND_UNCHANGED = YES
ACTIVE_SOURCE_COUNT = 7
PRINT_AUTHORITY_MAP_COMPLETE = YES
PRINT_VIEW_SOURCE_COUNT = 7
PRINT_VIEW_ALL_SUPPORTED_SOURCES = PASS
MUTATION_ELIGIBILITY_MATRIX_COMPLETE = YES
ALL_REQUIRED_PRINT_MUTATIONS = PASS
ALL_REQUIRED_REPRINT_MUTATIONS = PASS
REPRINT_PRESERVES_SOURCE_IDENTITY = YES
REPRINT_CREATES_NEW_BUSINESS_DOCUMENT = NO
ONLY_AUTHORIZED_PRINT_EVENT_DELTA = YES
UNEXPECTED_BUSINESS_DELTA = 0
UNEXPECTED_FINANCIAL_DELTA = 0
UNEXPECTED_INVENTORY_DELTA = 0
GIFT_VOUCHER_PRINT_AUTHORITY = PROVEN
GIFT_VOUCHER_EXACT_REPLAY = PASS
GIFT_VOUCHER_CHANGED_PAYLOAD = EXPECTED_409
CGP_PRINT_RECOVERY_TRACK = OPEN_UNCHANGED
AR_BROWSER = PASS
EN_BROWSER = PASS
CONSOLE_APPLICATION_ERRORS = 0
UNEXPECTED_PAGEERRORS = 0 OBSERVED
UNEXPECTED_REQUEST_FAILURES = 0 FOR CORE WORKFLOW
FOCUSED_TESTS = PASS
TEST_CHANGES = 0
TYPECHECK = PASS
BUILD = PASS_ISOLATED_TEMPORARY_COPY
MAIN_DB_BUSINESS_DELTA_BY_CONTROL = 0
MAIN_DB_FINANCIAL_DELTA_BY_CONTROL = 0
MAIN_DB_INVENTORY_DELTA_BY_CONTROL = 0
MAIN_DB_PRINT_EVENT_DELTA_BY_CONTROL = 0
MAIN_DB_SYNTHETIC_DELTA_BY_CONTROL = 0
SOURCE_CHANGES_THIS_CONTROL = 0
TEST_CHANGES_THIS_CONTROL = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
P0 = 0
P1 = 0
P2 = 1 NON_CORE_OPTIONAL_UPLOAD_404
GATE_C = PASS_DISPOSABLE_PRINT_RUNTIME_MUTATION
D2F_GATE_C = CLOSED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

تم إيقاف runtime المؤقت بعد جمع الأدلة. لا يبدأ D2F Gate D أو أي مسار آخر تلقائيًا.
