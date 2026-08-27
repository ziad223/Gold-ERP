# DARFUS ERP — Unified Inventory UX Final Closure Report

تم تنفيذ فحص Unified Inventory UX على الـMain Runtime للقراءة فقط. تم إصلاح ترجمة Profile في قائمة Inventory وتفاصيل Asset، وتصحيح رابط إدارة المواقع ليحافظ على اللغة. لم يتم إنشاء Receive جديد، ولم تُنفّذ أي كتابة على `darfus_erp`.

## 1. Executive Summary

| Area | Result | Evidence |
|---|---|---|
| Canonical Inventory entry | PASS | Inventory CTA opens the single chooser; Supplier receive URL resolves to Inventory. |
| Inventory list/detail UX | PASS | Asset-only list, server filters/pagination, detail identity/origin/cost/valuation/history. |
| GBW/GBP unified forms | PASS_STATIC_READ_ONLY | Both forms use shared receive section and `/purchase-orders/receive` with `inventoryV2` and `perPiece`. |
| AR/EN browser | PASS | Arabic and English pages loaded; no console errors/warnings in the tested journeys. |
| Official DB integrity | PASS_READ_ONLY | `darfus_erp` reachable; integrity queries returned zero anomalies in the tested checks. |
| Gold Center readiness | BLOCKED | Current quote is stale; GBW/GBP show unavailable and disable receive. |

The closure cannot be marked PASS because the authoritative pricing prerequisite currently blocks the actual GBW/GBP receive action. This is a runtime freshness/provider-state blocker, not a reason to change a business formula or tax rule in this batch.

## 2. Preconditions

- Official database under test: `darfus_erp`.
- Runtime under test: existing `localhost:3000` frontend and `localhost:8000` backend.
- No disposable clone was created; no clone or temporary backend was used.
- No new receive, payment, asset, barcode, RFID, movement, tax, accounting, migration, seed, backup, or cleanup was executed in this closure.
- Owner-accepted generated `next-env.d.ts` drift was not edited or reverted.
- The existing worktree was already heavily dirty before this closure. No reset, restore, clean, stash, commit, or Git configuration change was performed.

## 3. Frozen UX Authority

| Authority | Current proof |
|---|---|
| One canonical receive entry | `/[locale]/inventory` → `Add / Receive Inventory` → chooser → GBW/GBP. |
| Supplier page role | Master data, purchase/receipt history, balance and documents; no create-receive shortcut. |
| Legacy Supplier receive | `/[locale]/suppliers/purchases` is redirect-only to `/[locale]/inventory`. |
| Physical inventory | One row represents one serialized Asset; list text explicitly excludes Product quantity fallback. |
| Barcode | Asset barcode is displayed as the durable primary identity. |
| RFID | Optional current assignment/history is exposed separately from barcode. |
| Company/Branch | Browser showed `Gold ERP` and `Branch-1`; backend list/detail routes enforce company and branch scope. |
| Receive authority | GBW and GBP source use Supplier V2 canonical receive with `inventoryV2: true`, `perPiece`, shared tax/location data, and idempotency key. |

## 4. Source Forensic

Reviewed the current source paths for:

- Inventory landing/list: `app/[locale]/(dashboard)/inventory/page.tsx`.
- Asset detail: `app/[locale]/(dashboard)/inventory/[id]/page.tsx`.
- Chooser: `components/inventory/inventory-intake-chooser.tsx`.
- Shared receive fields: `components/inventory/shared-receive-section.tsx`.
- GBW/GBP forms and canonical submit contracts.
- Legacy Supplier receive redirect: `app/[locale]/(dashboard)/suppliers/purchases/page.tsx`.
- Backend Asset list/detail/read-only preview routes in `backend/src/routes/erp.routes.js`.

Minimum safe UX changes made in this batch:

1. Inventory list Profile labels now have explicit Arabic and English values.
2. Asset detail Profile badge now has explicit Arabic and English values.
3. Empty-location management uses locale-aware `Link` navigation instead of a raw locale-less anchor.

No backend business logic, tax engine, Gold Center, accounting authority, Asset model, barcode authority, or receive contract was changed.

## 5. Inventory Landing

**Result: PASS.**

- Arabic browser: heading `كل القطع`, CTA `إضافة / استلام مخزون`.
- English browser: heading `All Items`, CTA `Add / Receive Inventory`.
- The CTA is rendered once from the Inventory page and opens `InventoryIntakeChooser`.
- Inventory page links to DB-backed location administration but does not create location data inline.

## 6. Inventory List Authority

**Result: PASS.**

- Current runtime displayed `1–6 / 6` serialized rows.
- Every row displayed Asset ID, profile, barcode, optional RFID, weight, branch/location, supplier and operational status.
- Empty state explicitly says the list does not fall back to Product quantity or grouped Product rows.
- Backend query is constrained by `a.company_id=:companyId` and `a.branch_id=:branchId`.
- Backend search is over Asset identity/description/barcode/RFID/supplier/certificate relations; Products do not provide list stock results.

## 7. Search / Filters / Pagination

**Result: PASS.**

Source and browser evidence cover:

- Search by barcode, RFID, Asset number, description, supplier and certificate.
- Profile, operational status, condition and tag-state filters.
- Server-backed pagination with page sizes 10, 25, 50 and 100.
- Current runtime pagination controls showed page `1 / 1`; no client-side inventory preload was used.

## 8. Status Presentation

**Result: PASS.**

- Status is displayed as a badge in the list and detail page.
- Arabic labels are localized; English uses the canonical status codes.
- Asset detail explicitly states that status is read-only there and changes only through canonical business actions.
- No status mutation was triggered in this batch.

## 9. Asset Details

**Result: PASS_READ_ONLY.**

The tested Asset detail loaded successfully for `AST-PUR-1787094119267-1-1-sulb` and exposed:

- Asset identity, Profile, barcode, branch, location, status and condition.
- Receipt origin.
- Frozen purchase snapshot.
- Separate current valuation.
- Current selling price presentation.
- Unified immutable event and movement history.
- Certificates, attachments and system links.
- RFID current assignment and assignment history.

Protected fields remain protected: price, cost, barcode, weight, karat and operational status are not editable from descriptive metadata controls.

## 10. Barcode / RFID UX

**Result: PASS_READ_ONLY.**

- List and detail preserve barcode as primary Asset identity.
- RFID is shown as optional current relationship and history.
- Detail source contains permission-gated assign/replace/unassign/scan actions with idempotency keys; no action was invoked.
- No barcode replacement, RFID assignment, print, or scan mutation was executed.

## 11. Unified Add / Receive

**Result: PASS_STATIC_READ_ONLY; runtime submit BLOCKED by Gold Center freshness.**

- Inventory CTA opens the single chooser.
- GBW and GBP each have one profile form.
- Both forms load server-backed contracts and shared receive fields.
- Both forms call read-only server preview before the submit control is enabled.
- Both forms submit only to `/purchase-orders/receive` with the canonical V2 shape when enabled.
- No new receive was authorized or executed in this closure.

## 12. Profile Chooser

**Result: PASS.**

Browser and source evidence:

| Profile | Chooser state |
|---|---|
| Gold By Weight | Enabled |
| Gold By Piece | Enabled |
| Diamond | Disabled / Coming next |
| Gem Stone | Disabled / Coming next |
| Pearl | Disabled / Coming next |

Arabic and English chooser labels were verified. No Diamond, Gem Stone or Pearl workflow was started.

## 13. GBW Unified Flow

**Result: PASS_STATIC_READ_ONLY / BLOCKED_RUNTIME_SUBMIT.**

- Arabic route `/ar/inventory/gold-by-weight` loaded with the shared receive section.
- Source uses server-backed Supplier, Location, Purchase Date and Tax Treatment.
- Source uses `/inventory-v2/gold-by-weight/preview`, `/inventory-v2/receive-preview`, and canonical `/purchase-orders/receive`.
- Source sends `inventoryV2: true`, one `perPiece` entry and an idempotency key.
- Gold Center health guard disabled `Receive one Asset` because current Gold Center state is not fresh.

## 14. GBP Unified Flow

**Result: PASS_STATIC_READ_ONLY / BLOCKED_RUNTIME_SUBMIT.**

- English route `/en/inventory/gold-by-piece` loaded with the shared receive section.
- Source uses server-backed contract, shared tax preview and Supplier V2 receive.
- Source carries one GBP physical piece in `perPiece: [piece]` and uses an idempotency key.
- Profile-specific values remain in the GBP form; no GBW formula was copied into this closure.
- Gold Center health guard disabled `Receive one Asset` for the same stale-current-rate reason.

## 15. Shared Receive Section

**Result: PASS.**

The shared component contains:

- Supplier selection from DB-backed contract data.
- Location selection from active DB locations scoped to company and branch.
- Purchase Date.
- Tax Treatment selected from company policy; no frontend default.
- Notes.
- Server Tax Summary with taxable base, VAT/RCM rate, VAT amount and treatment.
- Reverse Charge evidence checklist and fail-closed evidence message.
- Locale-aware location-management link in the empty-location state.

## 16. Supplier / Location / Branch

**Result: PASS_READ_ONLY.**

Current official state:

- Companies: `1`.
- Active branches: `1`.
- Active suppliers: `2`.
- Active locations: `1`.
- Browser context: Company `Gold ERP`, Branch `Branch-1`.
- Contract requests returned 200 in the runtime log; settings/branch/profile reads returned 304 or 200.

Supplier preselection remains server-validated in the GBW/GBP forms; no Supplier receive shortcut was used.

## 17. Tax / RCM / Gold Center

### Tax / RCM

**Result: PASS_STATIC_READ_ONLY.**

- Tax treatment options came from company policy: `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE`, `EXEMPT`, `OUT_OF_SCOPE`.
- The UI displayed the server summary area and RCM evidence requirements.
- No tax settings or snapshots were changed.

### Gold Center

**Result: P1 BLOCKER.**

Observed in the real English GBW browser:

- `Gold Center unavailable`.
- `GOLDAPI_IO · AED`.
- Last quote: `2026-08-19T18:34:57.000Z`.
- `Receive one Asset` was disabled.

Official DB evidence:

- `gold_market_settings`: one enabled `LIVE_PROVIDER` row, provider `GOLDAPI_IO`, currency `AED`, refresh interval `1500`, stale threshold `2500` seconds.
- Latest quote timestamp: `2026-08-19 18:34:57+00`.
- At audit time the quote was older than the configured stale threshold.

Classification: `RUNTIME_PROVIDER_FRESHNESS / GOLD_CACHE_STATE`, confidence high for stale state and medium for the underlying refresh/provider cause. This closure did not call a provider refresh, change a key, change a setting, change a formula, or bypass the health guard.

Impact: authoritative GBW/GBP pricing and the receive button cannot be proven end-to-end on the current main runtime.

## 18. Preview / Submit / Idempotency UX

**Result: PASS_STATIC_READ_ONLY; runtime receive proof NOT RUN by guardrail and Gold Center blocker.**

- Profile preview and shared tax preview are separate read-only server calls.
- Submit controls require branch, supplier, location, tax treatment, profile preview, tax summary, approved barcode code and Gold Center health where applicable.
- Canonical submit generates and sends an idempotency key.
- No submit, replay, conflicting replay, or mutation endpoint was called.
- No claim is made for runtime receive idempotency beyond existing source/static evidence in this closure.

## 19. Legacy Receive Removal / Redirect

**Result: PASS.**

- `app/[locale]/(dashboard)/suppliers/purchases/page.tsx` calls `redirect(\`/${locale}/inventory\`)`.
- Browser verification: `/en/suppliers/purchases` resolved to `/en/inventory`; `/ar/suppliers/purchases` resolved to `/ar/inventory` after navigation completion.
- Supplier detail source has no receive-create shortcut text or intake shortcut marker.
- Supplier legacy screen was not used as acceptance evidence.

## 20. Discoverability

**Result: PASS.**

- Sidebar keeps Inventory discoverable.
- No dedicated daily GBW sidebar entry was added.
- Gold By Piece is discoverable only through the unified Inventory chooser.
- Diamond/Gem/Pearl remain visibly planned but disabled.

## 21. AR / EN / RTL / Keyboard

**Result: PASS for inspected UI surfaces.**

- Arabic Inventory, GBW, chooser, redirect and Asset detail loaded with RTL/localized headings.
- English Inventory, GBP, redirect and Asset detail loaded with English headings.
- Bilingual Profile labels were corrected in list and detail.
- Buttons, links, selects and text inputs are native semantic controls; no keyboard-only mutation test was executed.
- No browser console error or warning was observed in the final tested journeys.

## 22. Loading / Empty / Error States

**Result: PASS_SOURCE_REVIEW.**

- Inventory list has skeleton loading, error retry and empty states.
- Asset detail has skeleton loading and error retry.
- GBW/GBP contracts have skeleton loading and error retry.
- Shared tax summary displays a server-summary-required state before completion.
- Empty locations disable the location selector and provide locale-aware management navigation.

## 23. Network / Console

**Result: PASS for in-scope UX requests, with one unrelated recurring asset 404.**

Observed backend read requests during browser checks:

| Request | Result |
|---|---|
| `GET /api/v1/health` | 200 |
| `GET /api/v1/health/db` | 200 |
| `GET /api/v1/health/redis` | 200 |
| `GET /api/v1/inventory-v2/profiles` | 200/304 |
| `GET /api/v1/inventory-v2/assets` | 200/304 |
| `GET /api/v1/inventory-v2/assets/:id` | 304 |
| `GET /api/v1/inventory-v2/gold-by-weight/contract` | 200 |
| `GET /api/v1/inventory-v2/gold-by-piece/contract` | 200 |
| `GET /api/v1/settings` | 304 |
| `GET /api/v1/branches` | 304 |

The backend log also contains a recurring unrelated `GET /uploads/1787170000339-llv9n0-icons8-instagram-verification-badge-100.png` 404. It is outside the Unified Inventory UX path and did not appear as a browser console error in the tested Inventory/GBW/GBP journeys. It remains a P3 observability/static-asset issue.

No `POST /api/v1/purchase-orders/receive`, `POST /api/v1/inventory-v2/receive-preview`, payment, RFID, barcode, movement or accounting mutation was logged during this closure.

## 24. Security / Scope

**Result: PASS_SOURCE_AND_READ_ONLY_RUNTIME.**

- Inventory list/detail routes require authentication and `inventory.view`.
- Backend list/detail use authorized company and branch resolution.
- RFID and descriptive metadata mutations are permission-gated and were not invoked.
- No frontend toggle was treated as server authority.
- No cross-company or cross-branch write was attempted.
- Full global permission/idempotency audit was outside this batch scope.

## 25. Data Integrity

Official DB was queried read-only. Current target proof: `current_database() = darfus_erp`; PostgreSQL `16.15`.

| Check | Result |
|---|---:|
| Assets | 6 |
| Final-profile assets | 6 |
| Missing active barcode | 0 |
| Blank Asset barcode | 0 |
| Multiple active barcode per Asset | 0 |
| Duplicate active barcode values | 0 |
| Invalid branch/company relation | 0 |
| Invalid location/company/branch relation | 0 |
| Missing Asset origin | 0 |
| Missing current purchase cost revision | 0 |
| Missing current valuation | 0 |
| Invalid operational status | 0 |
| Invalid/negative/inconsistent weights | 0 |
| Inventory movement without Asset | 0 |
| Supplier receive movement without origin | 0 |
| Purchase Asset link without Asset | 0 |
| Purchase Asset link without PO item | 0 |
| Serialized final-profile links with Product quantity authority | 0 |

Counts remained consistent with the pre-check baseline after browser/source verification:

`purchase_orders=6`, `assets=6`, `asset_barcode_history=6`, `inventory_asset_movements=6`, `asset_purchase_cost_revisions=6`, `asset_current_valuations=6`, `journal_entries=9`, `journal_lines=24`, `cash_transactions=3`, `audit_logs=53`, `idempotency_requests=9`.

## 26. Browser Acceptance

| Journey | Result |
|---|---|
| Arabic Inventory landing | PASS |
| Arabic chooser | PASS; GBW/GBP enabled, Diamond/Gem/Pearl disabled |
| English Inventory landing | PASS |
| Arabic GBW direct route | PASS_LOAD; receive blocked by stale Gold Center |
| English GBP direct route | PASS_LOAD; receive blocked by stale Gold Center |
| Arabic Asset detail | PASS_LOAD |
| English Asset detail | PASS_LOAD |
| Arabic Supplier legacy URL | PASS_REDIRECT |
| English Supplier legacy URL | PASS_REDIRECT |
| Console errors/warnings on final journeys | 0 |
| New Receive | NOT RUN; not authorized/required for this UX closure |

## 27. API Acceptance

Read-only health and runtime GET evidence is recorded in Section 23. Authenticated Inventory/contract/detail calls completed through the existing browser session and are visible in the backend request log as 200/304 responses. No mutation API was called.

## 28. Focused Tests

| Test | Result |
|---|---|
| `node --test tests/unified-inventory-ux-final-closure.test.cjs` | 8/8 PASS |
| `node --test tests/unified-inventory-intake-ux-02-r3.test.cjs` | 5/5 PASS |
| `npm run typecheck` | PASS |
| Build | NOT RUN; protected by current guardrails |
| New receive/runtime mutation test | NOT RUN; no mutation authorization and Gold Center stale |

## 29. Files Changed

Intentional changes in this batch:

- `app/[locale]/(dashboard)/inventory/page.tsx` — bilingual list/filter Profile labels.
- `app/[locale]/(dashboard)/inventory/[id]/page.tsx` — bilingual Asset detail Profile badge.
- `components/inventory/shared-receive-section.tsx` — locale-aware management link in empty-location state.
- `tests/unified-inventory-ux-final-closure.test.cjs` — eight focused static/source contract tests.
- `docs/DARFUS_UNIFIED_INVENTORY_UX_FINAL_CLOSURE_REPORT.md` — this report.

The worktree contained extensive pre-existing changes unrelated to this batch. Current read-only status showed approximately 424 tracked/untracked entries; they were not cleaned, reverted or claimed as this batch’s work.

## 30. Gate

Required PASS gate:

`PASS_UNIFIED_INVENTORY_UX_FINAL_CLOSURE`

**Gate result: NOT GRANTED.**

Current gate:

`BLOCKED_UNIFIED_INVENTORY_UX_GOLD_CENTER_STALE`

Reason: the current Gold Center quote is beyond the configured stale threshold, and both GBW/GBP forms fail closed by disabling the authoritative receive button. The remaining UX/static/read-only checks passed, but the final business journey cannot be proven without fresh authorized Gold Center runtime state.

No Gold Center fix, API-key change, provider refresh, tax change, receive, migration, seed, or DB mutation was started.

## 31. Final Tokens

```text
CURRENT_BATCH = DARFUS-UNIFIED-INVENTORY-UX-FINAL-CLOSURE
MODE = READ_ONLY_MAIN_RUNTIME_UNIFIED_INVENTORY_UX_CLOSURE

OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_WRITES = 0
NEW_RECEIVES = 0
PAYMENTS = 0
MUTATIONS = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
BACKUP_CREATED = 0
PRODUCTION_TOUCHED = NO

CANONICAL_INVENTORY_ENTRY = PASS
SINGLE_RECEIVE_ENTRY_POINT = YES
SUPPLIER_RECEIVE_CREATE_UI = REMOVED_REDIRECT_ONLY
LEGACY_SUPPLIER_RECEIVE_WORKFLOW = NOT_AUTHORITY
DUPLICATE_RECEIVE_WORKFLOW = NO

INVENTORY_LIST_ASSET_AUTHORITY = PASS
SEARCH_FILTER_PAGINATION = PASS
STATUS_PRESENTATION = PASS
ASSET_DETAIL = PASS_READ_ONLY
BARCODE_RFID_UX = PASS_READ_ONLY
UNIFIED_RECEIVE_STATIC = PASS
PROFILE_CHOOSER = PASS
GBW_FLOW = PASS_STATIC_READ_ONLY_BLOCKED_RUNTIME
GBP_FLOW = PASS_STATIC_READ_ONLY_BLOCKED_RUNTIME
SHARED_RECEIVE_SECTION = PASS
SUPPLIER_LOCATION_BRANCH_SCOPE = PASS_READ_ONLY
TAX_RCM_UI = PASS_STATIC_READ_ONLY
GOLD_CENTER_STATUS = STALE_BLOCKING_RECEIVE

AR_BROWSER = PASS
EN_BROWSER = PASS
RTL_BROWSER = PASS
CONSOLE_ERRORS = 0
IN_SCOPE_NETWORK_ERRORS = 0
UNRELATED_UPLOAD_404 = PRESENT_P3

OFFICIAL_DB_REACHABLE = YES
DB_INTEGRITY_ANOMALIES = 0
DB_COUNTS_CHANGED_THIS_BATCH = NO

FOCUSED_TESTS = 8
FOCUSED_TESTS_PASS = 8
REGRESSION_TESTS = 5
REGRESSION_TESTS_PASS = 5
TYPECHECK = PASS
BUILD = NOT_RUN_BY_GUARDRAIL

P0_COUNT = 0
P1_COUNT = 1
P2_COUNT = 0
P3_COUNT = 1
P4_COUNT = 0

UNIFIED_INVENTORY_UX_FINAL_CLOSED = NO
GATE = BLOCKED_UNIFIED_INVENTORY_UX_GOLD_CENTER_STALE
NEXT_RECOMMENDED_STEP = RESTORE_OR_APPROVE_FRESH_GOLD_CENTER_RUNTIME_STATE_THEN_RERUN_READ_ONLY_UX_ACCEPTANCE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
DIAMOND_STARTED = NO
```

## STOP

Owner review is required for the Gold Center freshness/provider-state blocker. No Diamond work or new Phase was started.
