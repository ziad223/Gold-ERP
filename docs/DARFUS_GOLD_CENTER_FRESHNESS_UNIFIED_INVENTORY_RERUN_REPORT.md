# DARFUS ERP — Gold Center Freshness Verification + Unified Inventory UX Read-Only Rerun

تمت إعادة الفحص على Main Runtime للقراءة فقط بعد تجدد حالة Gold Center. أصبحت الحالة `HEALTHY` والـquote حديثًا، ونجحت GBW/GBP read-only previews وأصبح زر الاستلام غير محجوب بسبب Gold Center. لم يتم الضغط على Receive ولم تُنفّذ أي business mutation.

## 1. Executive Summary

| Area | Result | Evidence |
|---|---|---|
| Gold Center runtime health | PASS | `GET /api/v1/health/gold = 200`, `HEALTHY`, `GOLDAPI_IO`, `LIVE_PROVIDER`. |
| Gold freshness | PASS | Quote `2026-08-19T20:50:59Z`; final observed age about 271 seconds; fresh=true/stale=false. |
| GBW runtime | PASS | Contract 200, Gold Center ready, profile preview 200, shared receive preview 200. |
| GBP runtime | PASS | Contract 200, Gold Center ready, profile preview 200, shared receive preview 200. |
| Receive eligibility | PASS_READ_ONLY | After valid fields and previews, `Receive one Asset` had no disabled marker; it was not clicked. |
| Unified Inventory UX | PASS | AR/EN landing, chooser, Asset detail, redirects and console checks passed. |
| Official business DB mutation | PASS | Acceptance-domain counts unchanged; no receive/payment/inventory mutation was logged. |

## 2. Context

Previous closure was blocked by:

`GOLD_CENTER_STATUS = STALE_BLOCKING_RECEIVE`

The renewed runtime state was verified on:

- Frontend: `http://localhost:3000`.
- Backend: `http://localhost:8000`.
- Official DB: `darfus_erp`.
- Online Production: not contacted.

No Gold Center setting, stale threshold, API key, provider, tax rule or formula was changed by this control.

Owner/runtime changes visible before this control began included Gold Center settings updates and provider quote refreshes through `20:51:01Z`. The first health request for this control was at `20:52:13Z`; those earlier updates are not attributed to this control.

## 3. Gold Center Runtime Health

**Result: PASS.**

Read-only endpoint result:

| Field | Actual |
|---|---|
| Endpoint | `GET /api/v1/health/gold` |
| HTTP | 200 |
| Health | HEALTHY |
| Provider | GOLDAPI_IO |
| Mode | LIVE_PROVIDER |
| Currency | AED |
| Unit | PER_GRAM |
| Fresh | true |
| Stale | false |
| Configured | true |
| Mock fallback | false |
| Quote status | VALID |
| Quote quality | OFFICIAL_RESPONSE |
| Rate source | PROVIDER_DIRECT |

## 4. Freshness Evidence

| Evidence | Value |
|---|---:|
| Latest quote timestamp | `2026-08-19T20:50:59Z` |
| Final observed quote age | approximately `271.287` seconds |
| Current configured stale threshold | `3500` seconds |
| Current refresh interval | `2500` seconds |
| Provider | `GOLDAPI_IO` |
| Currency | `AED` |
| Unit | `PER_GRAM` |

Current supported provider rates returned by the health projection:

| Karat | Rate |
|---:|---:|
| 18K | 400.5117 |
| 21K | 467.2637 |
| 22K | 489.5143 |
| 24K | 534.0156 |

The quote was fresh even against the previous observed 2500-second threshold; the acceptance did not rely on weakening the stale guard. No threshold change was made by this control.

## 5. Backend Health

| Endpoint | Status | Result |
|---|---:|---|
| `GET /api/v1/health` | 200 | UP |
| `GET /api/v1/health/db` | 200 | PostgreSQL connected |
| `GET /api/v1/health/gold` | 200 | HEALTHY / fresh |
| `GET /api/v1/health/redis` | 200 | Redis connected |

Official DB proof:

`SELECT current_database() = darfus_erp`

Backend runtime remained `darfus-backend-reload-2`; Postgres and Redis were not restarted.

## 6. DB Baseline

The prior report’s count of `audit_logs=53` was pre-renewal. Owner Gold Center settings updates and related audit evidence raised it to 59 before this control’s first health request. The effective control baseline is therefore the post-renewal state at the first control request (`20:52:13Z`).

| Entity | Effective control baseline | Final | Changed by this control |
|---|---:|---:|---|
| purchase_orders | 6 | 6 | NO |
| assets | 6 | 6 | NO |
| asset_barcode_history | 6 | 6 | NO |
| asset_rfid_assignments | 2 | 2 | NO |
| inventory_asset_movements | 6 | 6 | NO |
| asset_purchase_cost_revisions | 6 | 6 | NO |
| asset_current_valuations | 6 | 6 | NO |
| journal_entries | 9 | 9 | NO |
| journal_lines | 24 | 24 | NO |
| cash_transactions | 3 | 3 | NO |
| audit_logs | 59 | 59 | NO |
| idempotency_requests | 9 | 9 | NO |

Latest audit row remained at `2026-08-19 20:51:01.738Z`, before the first control health request. No business audit row was created by the control.

## 7. Inventory Landing

**Result: PASS.**

- `/ar/inventory` loaded with Asset rows and `إضافة / استلام مخزون`.
- `/en/inventory` loaded with Asset rows and `Add / Receive Inventory`.
- No duplicate receive entry was visible.
- Asset list remained server-backed and Asset-authoritative.
- No console error or warning was observed in either journey.

## 8. Profile Chooser

**Result: PASS.**

| Profile | State |
|---|---|
| Gold By Weight | Enabled |
| Gold By Piece | Enabled |
| Diamond | Disabled |
| Gem Stone | Disabled |
| Pearl | Disabled |

No Diamond/Gem Stone/Pearl route was opened.

## 9. GBW Runtime

**Result: PASS.**

Route: `/ar/inventory/gold-by-weight` and English equivalent during field verification.

- `Gold Center متاح` / `Gold Center ready` visible.
- `GOLDAPI_IO · AED` visible.
- Supplier selector loaded from DB.
- Location selector loaded from DB.
- Tax Treatment loaded from company policy.
- Valid test inputs were entered in the browser only; no form submission was performed.
- GBW profile preview returned 200.
- Shared receive preview returned 200.
- Preview values were displayed, including total gold value and total purchase cost.
- `Receive one Asset` had no disabled marker after all mandatory valid fields and previews were present.

## 10. GBP Runtime

**Result: PASS.**

Route: `/en/inventory/gold-by-piece`.

- `Gold Center ready` visible.
- `GOLDAPI_IO · AED · GLOBAL / SPOT` visible.
- Supplier selector loaded from DB.
- Location selector loaded from DB.
- Tax Treatment loaded from company policy.
- Valid test inputs were entered in the browser only; no form submission was performed.
- GBP profile preview returned 200.
- Shared receive preview returned 200.
- Preview values were displayed, including Gold Value, Current Gold Value and Total Purchase Cost.
- `Receive one Asset` had no disabled marker after all mandatory valid fields and previews were present.

## 11. Receive Eligibility

**Result: PASS_READ_ONLY.**

The button eligibility check was performed without clicking Receive:

| Profile | Gold blocker | Other mandatory blockers after valid inputs | Eligibility |
|---|---|---|---|
| GBW | None | None observed | PASS_READ_ONLY |
| GBP | None | None observed | PASS_READ_ONLY |

The browser DOM showed `button "Receive one Asset"` without `[disabled]` for both profiles. No `POST /api/v1/purchase-orders/receive` request occurred.

## 12. Preview Runtime

| Preview | Status | Evidence |
|---|---:|---|
| GBW profile preview | 200 | `POST /api/v1/inventory-v2/gold-by-weight/preview` |
| GBP profile preview | 200 | `POST /api/v1/inventory-v2/gold-by-piece/preview` |
| GBW shared receive preview | 200 | `POST /api/v1/inventory-v2/receive-preview` |
| GBP shared receive preview | 200 | `POST /api/v1/inventory-v2/receive-preview` |
| Receive submit | NOT RUN | No receive mutation authorized or required |

These preview POSTs are read-only server preview contracts; they created no PO, Asset, barcode, movement, payable or journal rows.

## 13. Unified Inventory Regression Rerun

| Area | Result |
|---|---|
| Inventory landing | PASS |
| Asset list | PASS |
| Search/filter/pagination source and runtime | PASS |
| Asset detail | PASS_READ_ONLY |
| Barcode UX | PASS_READ_ONLY |
| RFID UX | PASS_READ_ONLY; no RFID mutation |
| Unified Add/Receive | PASS |
| Profile chooser | PASS |
| Supplier selector | PASS |
| Location selector | PASS |
| Branch context | PASS; Branch-1 displayed |
| Tax/RCM UI | PASS_READ_ONLY |
| Legacy Supplier redirect | PASS |
| AR UI | PASS |
| EN UI | PASS |
| RTL/numeric presentation | PASS_READ_ONLY |
| Network | PASS for in-scope calls |
| Console | PASS; zero errors/warnings in final journeys |

## 14. Legacy Redirect

**Result: PASS.**

- `/ar/suppliers/purchases` resolved to `/ar/inventory`.
- `/en/suppliers/purchases` resolved to `/en/inventory`.
- Supplier legacy receive screen was not used for acceptance.

## 15. Company Branding P3 Boundary

**Result: PRESENT_P3_NON_BLOCKING.**

The known unrelated request continued to appear:

`/uploads/1787170000339-llv9n0-icons8-instagram-verification-badge-100.png` → 404

Classification: `P3_COMPANY_BRANDING_STATIC_ASSET_404`.

It was not fixed and was not treated as a Unified Inventory blocker.

## 16. Network / Console

In-scope request evidence:

| Request family | Result |
|---|---|
| Health, DB, Redis, Gold health | 200 |
| Inventory profiles/assets/detail | 200/304 |
| GBW contract | 200 |
| GBP contract | 200 |
| GBW profile preview | 200 |
| GBP profile preview | 200 |
| Shared receive previews | 200 |
| Receive POST | Not present |
| Payment/reversal POST | Not present |
| Inventory mutation POST/PUT/PATCH/DELETE | Not present |
| Fatal browser console errors | 0 |
| Browser console warnings | 0 |

One automatic auth refresh occurred after the existing browser access token expired. It was infrastructure session rotation, not a business operation; it was not initiated as a test action.

## 17. DB No-Mutation Proof

No PO, Asset, barcode, RFID, movement, cost revision, valuation, journal, cash or idempotency business row changed. Required acceptance-domain counts are identical before and after the effective control window.

The automatic browser auth refresh updated the technical session record at `20:52:36Z`. This is infrastructure session housekeeping, not an inventory/business mutation. Under the acceptance-domain definition, `OFFICIAL_DB_WRITES=0`; if the Owner interprets the hard guardrail as prohibiting even automatic technical session rotation, that technical event must be reviewed separately. No rollback or cleanup was performed.

## 18. Focused Tests

| Command | Result |
|---|---|
| `node --test tests/unified-inventory-ux-final-closure.test.cjs` | 8/8 PASS |
| `node --test tests/unified-inventory-intake-ux-02-r3.test.cjs` | 5/5 PASS |
| `npm run typecheck` | PASS |
| Build | NOT RUN; not required by this control |

## 19. Gate

All mandatory Gold Center and Unified Inventory read-only acceptance criteria passed. The Gold Center health guard was not bypassed; the genuine live quote was fresh before and during the acceptance.

```text
GATE = PASS_UNIFIED_INVENTORY_UX_FINAL_CLOSURE
UNIFIED_INVENTORY_UX_FINAL_CLOSED = YES
```

The known branding 404 is P3 and non-blocking. No Gold Center, tax, formula, receive or database fix was applied.

## 20. Final Tokens

```text
CURRENT_CONTROL = DARFUS-GOLD-CENTER-FRESHNESS-UNIFIED-INVENTORY-RERUN

LOCAL_MAIN_DB = darfus_erp

GOLD_CENTER_RUNTIME_HEALTH = PASS
GOLD_CENTER_FRESHNESS = PASS
GOLD_CENTER_PROVIDER = GOLDAPI_IO
GOLD_CENTER_MODE = LIVE_PROVIDER
GOLD_CENTER_CURRENCY = AED
GOLD_CENTER_UNIT = PER_GRAM
GOLD_CENTER_MOCK_FALLBACK = FALSE

LATEST_QUOTE_TIMESTAMP = 2026-08-19T20:50:59Z
QUOTE_AGE_SECONDS = 271.287_at_final_read
STALE_THRESHOLD_SECONDS = 3500

INVENTORY_LANDING = PASS
PROFILE_CHOOSER = PASS

GBW_GOLD_CENTER_RUNTIME = PASS
GBP_GOLD_CENTER_RUNTIME = PASS

GBW_RECEIVE_ELIGIBILITY = PASS_READ_ONLY
GBP_RECEIVE_ELIGIBILITY = PASS_READ_ONLY

RECEIVE_PREVIEW_RUNTIME = PASS

LEGACY_SUPPLIER_PURCHASE_REDIRECT = PASS

AR_UI = PASS
EN_UI = PASS

NETWORK = PASS
CONSOLE = PASS

COMPANY_BRANDING_404 = PRESENT_P3

OFFICIAL_DB_WRITES = 0_BUSINESS_ACCEPTANCE_DOMAINS
TECHNICAL_SESSION_REFRESH = AUTOMATIC_NON_BUSINESS
DB_COUNTS_CHANGED_THIS_BATCH = NO

FOCUSED_TESTS = PASS
TYPECHECK = PASS

MIGRATION_CREATED = NO
MIGRATION_EXECUTED = NO
ONLINE_PRODUCTION_CONTACTED = NO

GATE = PASS_UNIFIED_INVENTORY_UX_FINAL_CLOSURE
UNIFIED_INVENTORY_UX_FINAL_CLOSED = YES

NEXT_RECOMMENDED_STEP = DIAMOND_JEWELLERY_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## STOP

Gold Center freshness and Unified Inventory UX closure are complete. Do not begin Diamond automatically.
