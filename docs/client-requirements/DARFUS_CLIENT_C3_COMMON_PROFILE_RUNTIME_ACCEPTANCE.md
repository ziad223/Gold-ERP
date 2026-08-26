# DARFUS C3 — Common Profile Runtime Acceptance

بالعربي المختصر: تم تنفيذ الحد الأدنى الآمن لعقد الحقول المشتركة كعقد قراءة إضافي، ثم فحص الـmain runtime ونسخة PostgreSQL منفصلة. لم تُنفّذ أي عملية Receive أو أي كتابة أعمال في `darfus_erp`. الشاشات العربية والإنجليزية للملفات الخمسة عرضت الغلاف المشترك نفسه، والاختبارات المركزة نجحت.

## Control and safety

| Item | Evidence | Result |
|---|---|---|
| Control | `DARFUS-CLIENT-C3-COMMON-PROFILE-FIELDS-EXACT-PARITY-01` | C3 |
| Main frontend | `http://localhost:3000` | Existing runtime inspected read-only |
| Main backend | `http://localhost:8000` | Health 200; restarted once to load the additive route change |
| Official database | `darfus_erp` | `SELECT current_database()` returned `darfus_erp` |
| Disposable target | `darfus_c3_common_profile_fields_01` | Created from an official read-only dump; exact `current_database()` verified before restore |
| Business mutations in official DB | No POST/PUT/PATCH/DELETE business operation was executed | 0 |
| C3 Receive mutations | No new Receive/Asset/PO/Journal was executed | 0 |

The disposable backend was started on port `8001` with `DB_NAME=darfus_c3_common_profile_fields_01`, `DB_HOST=darfus-postgres`, and Redis on `darfus-redis`. Its health, DB, Redis, and Gold endpoints returned 200. An unauthenticated call to the protected profile endpoint returned the expected 401. A GET using a pre-existing test session in the disposable clone returned 200 with `success=true`, contract version `1`, 15 fields, five top-level families, and nine internal strategies. No password or official session was transmitted.

## Runtime health

| Target | Health | DB | Redis | Gold | Notes |
|---|---:|---:|---:|---:|---|
| Main `:8000` | 200 | 200 | 200 | 200 / HEALTHY | `GOLDAPI_IO`, AED, `LIVE_PROVIDER` |
| Disposable `:8001` | 200 | 200 | 200 | 200 / HEALTHY | DB target proven disposable |

## Profile coverage

The main browser was navigated read-only to both AR and EN routes. Each route rendered Supplier, Location, Purchase Date, Tax Treatment, Notes, and Tax Summary through `SharedReceiveSection`.

| Profile family | AR route | EN route | Common envelope | Existing synthetic Asset rows in disposable clone |
|---|---|---|---|---:|
| GBW | `/ar/inventory/gold-by-weight` | `/en/inventory/gold-by-weight` | PASS | 3 |
| GBP | `/ar/inventory/gold-by-piece` | `/en/inventory/gold-by-piece` | PASS | 3 |
| Diamond | `/ar/inventory/diamond-jewellery` | `/en/inventory/diamond-jewellery` | PASS | 3 |
| Gem Stone | `/ar/inventory/gem-stone` | `/en/inventory/gem-stone` | PASS | 1 |
| Pearl | `/ar/inventory/pearl` | `/en/inventory/pearl` | PASS | 1 |

The list page also passed AR/EN read-only checks: one row per physical Asset, bilingual profile selector, branch/location columns, and Asset-only inventory wording. Browser console warnings/errors observed during the run: none.

## C3 scenarios

| Scenario | Evidence | Result |
|---|---|---|
| C3-A GBW common fields | Shared receive source, profile route, Asset projection, clone read-only rows | PASS |
| C3-B GBP common fields | Shared receive source, profile route, Asset projection, clone read-only rows | PASS |
| C3-C Diamond common fields | Shared receive source, profile route, Asset projection, clone read-only rows | PASS |
| C3-D Gem Stone common fields | Shared receive source, profile route, Asset projection, clone read-only rows | PASS |
| C3-E Pearl common fields | Shared receive source, profile route, Asset projection, clone read-only rows | PASS |
| C3-F invalid common value | `assertCommonField` fail-closed focused test | PASS |
| C3-G unknown field | `COMMON_PROFILE_FIELD_NOT_ALLOWED` focused test | PASS |
| C3-H dedicated authority routed as common | `COMMON_PROFILE_DEDICATED_AUTHORITY_REQUIRED` focused test | PASS |
| C3-I AR browser | AR list and all five AR profile forms | PASS |
| C3-J EN browser | EN list and all five EN profile forms | PASS |

No synthetic C3 Receive was sent. The implementation is an additive read-only contract; existing synthetic profile rows were used only for read-only reconciliation. Therefore this document does not claim a new transactional create proof.

## Browser preflight

`BROWSER_PREFLIGHT = PASS` for the performed read-only scope:

- URL and DOM were checked after each navigation.
- AR RTL labels and EN LTR labels were present.
- No confirmation or Receive action was clicked.
- No business POST was sent from the C3 browser run.
- Console error/warning collection was empty.

## Findings / limitations

1. The additive `commonFieldContract` is protected by the existing `inventory.view` route boundary, was directly read with a disposable-clone test session (200), and is covered by a focused test. The unauthenticated direct call correctly returned 401.
2. `SKU` and universal `image` remain intentionally unproven and are not synthesized.
3. Existing official rows show no RFID assignments and no Brand values; both are allowed by the current source contract and were not provisioned or backfilled.
4. No tag-layout parity, Barcode redesign, RFID redesign, accounting change, or profile-specific business change was attempted. Those remain outside C3.
