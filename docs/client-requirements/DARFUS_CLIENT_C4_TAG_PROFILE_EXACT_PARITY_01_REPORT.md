# DARFUS ERP — C4 Tag Profile Exact Parity Report

بالعربية المبسطة: تم فحص ملف العميل كاملًا، وإضافة عرض موحّد للـTags من بيانات الـAsset الحالية فقط. نجحت اختبارات الملفات الخمسة، ونجحت معاينة AR/EN، ولم تحدث أي كتابة على `darfus_erp`. لم يبدأ D1 تلقائيًا.

## 1. Executive Summary

The client Barcode document was read completely from the first through the final page. It was rendered to eight PDF pages and each page was visually inspected, including the embedded tag/mockup images. The exact five profile contracts were converted into a single field matrix and authority map.

C4 closed a presentation projection gap only:

- one shared `ClientBarcodeTagTemplate` foundation remains the renderer;
- profile-specific rows are restricted to the client-defined field order;
- unproven rows were removed from the client tag face (Diamond Cut/Cert, Gem Stone Cert, Pearl Size/Quality);
- Barcode remains the stored Asset identity;
- RFID remains separate and is not coupled to Barcode;
- SKU and universal image authority were not invented;
- Asset detail now exposes the same read-only client tag preview/print surface in the accepted inventory workflow.

## 2. Read-first evidence

| Source | Coverage | Result |
|---|---|---|
| `I:\WORK\client-requirements\الباركود.docx` | OOXML/text extraction, all 317 paragraphs, all 5 embedded images | Complete |
| Rendered document | Pages 1–8, visual inspection of every page | Complete |
| Accepted C1/C2/C3 records | Barcode, Asset, RFID, profile and scope authorities | Read |
| Current source | Shared renderer, profile backs, mapper, Asset detail surface | Read and mapped |
| Official DB | Identity, profile, Barcode, branch and count evidence | Read-only |

## 3. Exact client tag matrix result

| Profile | Client front | Client back | Current source proof | Parity |
|---|---|---|---|---|
| GBW | Barcode | title, `GW`, `ST`, `NT`, `MC` | `GoldWeightTagBack` with stored weights and making-charge display helper | PASS |
| GBP | Barcode, Price | title, optional Brand, `WT`, `DIS` | `GoldPieceTagBack` with empty optional rows hidden | PASS |
| Diamond | Barcode, Price | title, Carat, `CC`, `DIS` | `DiamondTagBack`; color + clarity are combined only for display | PASS |
| Gem Stone | Barcode, Price | title, repeatable `ST`, `DIS` | `GemstoneTagBack`; rows come from `metadata.stones[]` / proven fallback | PASS |
| Pearl | Barcode, Price | title, Type, `DIS` | `PearlTagBack`; only client-defined rows are rendered | PASS |

The complete field/authority/order matrix is in [DARFUS_CLIENT_C4_TAG_PROFILE_FIELD_MATRIX.md](./DARFUS_CLIENT_C4_TAG_PROFILE_FIELD_MATRIX.md).

## 4. Authority and rendering boundary

`Asset` and its active Barcode remain the only physical identity authority. The tag renderer consumes read projections and owns no business data. The authority map and minimum-safe boundary are recorded in:

- [DARFUS_CLIENT_C4_TAG_PROFILE_AUTHORITY_MAP.md](./DARFUS_CLIENT_C4_TAG_PROFILE_AUTHORITY_MAP.md)
- [DARFUS_CLIENT_C4_TAG_RENDERING_BOUNDARY.md](./DARFUS_CLIENT_C4_TAG_RENDERING_BOUNDARY.md)

No tag-specific storage, SKU source, universal image source, Barcode redesign, RFID coupling, receive change, POS change, accounting change, migration, or master-data change was introduced.

## 5. Browser / print proof

The existing authenticated frontend on `localhost:3000` loaded the five representative Asset details. Each successful profile page contained exactly one `[data-c4-tag-preview]` surface and one enabled print control for the authorized user. The Pearl Asset was correctly rejected under Branch-1 and loaded after the existing read-only context was changed to Branch-2.

English and Arabic proof:

- EN: `Print tag`, LTR, preview present, no console warning/error entries.
- AR: `طباعة التاج`, RTL, preview present, no console warning/error entries.
- The visible notice explicitly states that preview/print are read-only and Asset/Barcode identity is unchanged.
- The print action is client-side document preparation; it does not call the business tag-write route.

Detailed evidence is in [DARFUS_CLIENT_C4_TAG_BROWSER_PRINT_ACCEPTANCE.md](./DARFUS_CLIENT_C4_TAG_BROWSER_PRINT_ACCEPTANCE.md).

## 6. API / runtime proof

Read-only GET health proof:

| Endpoint | Status | Actual |
|---|---:|---|
| `/api/v1/health` | 200 | Backend UP |
| `/api/v1/health/db` | 200 | PostgreSQL connected |
| `/api/v1/health/redis` | 200 | Redis connected |
| `/api/v1/health/gold` | 200 | `HEALTHY`, `GOLDAPI_IO`, `LIVE_PROVIDER`, AED, fresh |

The main frontend runtime was not replaced or restarted. `next-env.d.ts` was not edited and its owner-accepted SHA remained `7AD303E40D4FDDF44F156129E397511953A71481C5CFD86B1862649AAAF240CC`.

## 7. Database / identity proof

`SELECT current_database()` returned `darfus_erp`. Read-only count reconciliation remained stable:

| Table | Before | After | Delta |
|---|---:|---:|---:|
| `assets` | 18 | 18 | 0 |
| `asset_barcode_history` | 18 | 18 | 0 |
| `asset_rfid_assignments` | 2 | 2 | 0 |
| `inventory_asset_movements` | 62 | 62 | 0 |
| `journal_entries` | 25 | 25 | 0 |

Full identity evidence is in [DARFUS_CLIENT_C4_TAG_DB_IDENTITY_PROOF.md](./DARFUS_CLIENT_C4_TAG_DB_IDENTITY_PROOF.md).

## 8. Focused tests and checks

Passed:

```text
node --test tests/c4-tag-profile-exact-parity.test.cjs \
  tests/barcode-final-closure.test.cjs \
  backend/tests/barcode-status-foundation-01c.test.cjs \
  tests/c3-common-profile-fields.test.cjs \
  tests/asset-final-closure.test.cjs
28 tests passed, 0 failed
npm run typecheck
PASS
npm run verify:barcode-tag-print-layouts
PASS (run with repository safe-directory supplied; no source mutation)
```

Two older verifier scripts were also observed to fail on stale assertions about a removed legacy batch-print path and a legacy large-batch threshold. They are not affected C4 semantic tests and were not changed to make the product satisfy obsolete source markers. They are recorded as P3 evidence/test-drift items, not as C4 product failures.

## 9. Files changed for C4

### C4 source/test additions or targeted edits

- `features/printing/components/barcode-tags/types.ts`
- `features/printing/components/barcode-tags/BarcodeTagBacks.tsx`
- `features/inventory/components/ClientAssetTagPreview.tsx`
- `app/[locale]/(dashboard)/inventory/[id]/page.tsx` — targeted C4 import/render addition in an already-dirty worktree file; unrelated existing changes were preserved
- `tests/c4-tag-profile-exact-parity.test.cjs`

### C4 evidence artifacts

- `docs/client-requirements/DARFUS_CLIENT_C4_TAG_PROFILE_FIELD_MATRIX.md`
- `docs/client-requirements/DARFUS_CLIENT_C4_TAG_PROFILE_AUTHORITY_MAP.md`
- `docs/client-requirements/DARFUS_CLIENT_C4_TAG_RENDERING_BOUNDARY.md`
- `docs/client-requirements/DARFUS_CLIENT_C4_TAG_BROWSER_PRINT_ACCEPTANCE.md`
- `docs/client-requirements/DARFUS_CLIENT_C4_TAG_DB_IDENTITY_PROOF.md`
- `docs/client-requirements/DARFUS_CLIENT_C4_TAG_PROFILE_EXACT_PARITY_01_REPORT.md`

The worktree was already materially dirty before C4. The C4 files above are separated from unrelated pre-existing drift; no cleanup, reset, restore, stash, or ownership claim was made for unrelated files.

## 10. Deferred / non-C4 items

- `SKU_AUTHORITY = NOT_PROVEN_UNLESS_NEW_CLIENT_EVIDENCE_FOUND`.
- `UNIVERSAL_IMAGE_AUTHORITY = NOT_PROVEN_UNLESS_NEW_CLIENT_EVIDENCE_FOUND`.
- Exact printer hardware dimensions remain outside the client business contract; the existing accepted print contract was preserved and no new hardware assumption was introduced.
- Legacy verifier source-marker failures remain test-maintenance work and are not a reason to change C4 product logic.

## 11. Final tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-C4-TAG-PROFILE-EXACT-PARITY-01
MODE = READ_FIRST_PLUS_MINIMUM_SAFE_TAG_RENDERING_PLUS_BROWSER_PRINT_PROOF

TAG_PROFILE_GAP_CLASS = A_UI_RENDERING_PROJECTION_GAP
TAG_COMMON_FIELDS = Barcode/Asset identity and common Asset detail fields remain source-owned; only client-defined common tag fields are rendered
TAG_PROFILE_SPECIFIC_FIELDS = GBW: GW/ST/NT/MC; GBP: Price/Brand/WT/DIS; Diamond: Price/Carat/CC/DIS; Gem Stone: Price/ST*/DIS; Pearl: Price/Type/DIS
SKU_AUTHORITY = NOT_PROVEN_UNLESS_NEW_CLIENT_EVIDENCE_FOUND
UNIVERSAL_IMAGE_AUTHORITY = NOT_PROVEN_UNLESS_NEW_CLIENT_EVIDENCE_FOUND
TAG_RENDERER_OWNS_BUSINESS_DATA = NO
DUPLICATE_TAG_DATA_AUTHORITY = NO
BARCODE_REDESIGN = NO
BARCODE_RFID_COUPLING = NO
ONE_SHARED_TAG_RENDERING_FOUNDATION = YES

GBW_TAG_PARITY = PASS
GBP_TAG_PARITY = PASS
DIAMOND_TAG_PARITY = PASS
GEM_STONE_TAG_PARITY = PASS
PEARL_TAG_PARITY = PASS

TAG_REPRINT_BUSINESS_DELTA = 0
TAG_NETWORK_PROOF = PASS
TAG_DB_BUSINESS_DELTA = 0
AR_PRINT_UI = PASS
EN_PRINT_UI = PASS
C4_FOCUSED_TESTS = PASS
C4_AFFECTED_REGRESSION = PASS
TYPECHECK = PASS
BUILD = NOT_RUN_OWNER_PROTECTED_CURRENT_RUNTIME
OFFICIAL_BUSINESS_WRITES = 0
OFFICIAL_DB_DAMAGE = 0

P0 = 0
P1 = 0
P2 = 0
P3 = 2 (stale legacy verifier assertions; non-blocking evidence/test drift)
GATE = PASS_CLIENT_C4_TAG_PROFILE_EXACT_PARITY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## 12. Stop

`TAG_PROFILE_PARITY = CLOSED` for C4. No D1, Barcode redesign, RFID redesign, tag-specific business storage, migration, production action, or automatic next batch was started.

