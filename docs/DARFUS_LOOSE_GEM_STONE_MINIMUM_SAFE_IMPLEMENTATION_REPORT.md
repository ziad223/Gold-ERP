# DARFUS ERP — Loose Gem Stone Minimum Safe Implementation Report

## 1. Executive Summary

تم تنفيذ نطاق Loose Gem Stone فقط، وبُنيت صفحة مستقلة AR/EN، وعقد server-backed، وPreview موحّد، وGS/LOS/00 barcode authority. Profile Preview وShared Preview والاختبارات والـbuild والـclone rollback نجحت. تم فتح نافذة التأكيد ثم تنفيذ ضغط Confirm واحد فقط على البيئة الرسمية، لكن الطلب عاد `401 UNAUTHORIZED` بسبب انتهاء جلسة المصادقة قبل بدء المعاملة. لم يُنشأ PO أو Asset أو Barcode أو Movement أو Journal أو Idempotency business row، وثبتت قراءة post-attempt أن delta الرسمي يساوي صفرًا.

النتيجة النهائية ليست PASS: `GATE = BLOCKED_LOOSE_GEM_STONE_AUTHENTICATION_EXPIRED`. لا يوجد تفويض لإعادة المحاولة أو بدء Receive ثانٍ في هذا التقرير.

## 2. Scope / Authorization

- Control: `DARFUS-LOOSE-GEM-STONE-MINIMUM-SAFE-IMPLEMENTATION`
- Official DB: `darfus_erp`
- Official API: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- `IMPLEMENTATION_AUTHORIZED = YES`
- `LIVE_RECEIVE_MAX = 1`; `LIVE_RECEIVE_ATTEMPTS = 1`; `SECOND_LIVE_RECEIVE = NOT_RUN`
- Production was not contacted.
- No migration was created or executed by this control.
- No manual business SQL was run against the official database.

## 3. Client Authority SHA

`I:/WORK/client-requirements/Gem Stone (Jewellery  Loose Stone).docx` was read and rendered previously as the authority for this control. SHA-256:

`F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3`

`CLIENT_AUTHORITY_VERSION_CHECK = PASS`

## 4. Files Changed

Intentional implementation/test paths for this control:

- `app/[locale]/(dashboard)/inventory/loose-gem-stone/page.tsx`
- `components/inventory/inventory-intake-chooser.tsx`
- `backend/src/routes/index.js`
- `backend/src/routes/loose-gemstone-profile.routes.js`
- `backend/src/routes/erp.routes.js`
- `backend/src/services/loose-gemstone-profile.service.js`
- `backend/src/services/loose-profile-finance.service.js`
- `backend/src/services/inventory-master-policy.service.js`
- `backend/src/services/profile-master-data.service.js`
- `backend/src/services/barcode-identity.service.js`
- `backend/src/services/inventory-v2-runtime.service.js`
- `backend/tests/loose-gem-stone-minimum-safe-implementation.test.cjs`
- `tests/unified-inventory-intake-ux-02-r3.test.cjs`
- `tests/unified-inventory-ux-final-closure.test.cjs`

The worktree was already heavily dirty before this control (HEAD `1657b0e9ba580faef69be48f04637835c201b521`, 490 status lines reported). No reset, restore, clean, stash, or unrelated cleanup was performed. Generated `next-env.d.ts` SHA remained `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651`.

## 5. Implementation Map

| Requirement | Evidence | Result |
|---|---|---|
| Dedicated Loose Gem profile | dedicated route/service/page | PASS |
| Single Inventory intake entry | chooser entry `GEM_STONE_LOOSE` | PASS |
| No Gem Jewellery form reuse | dedicated page/service | PASS |
| Supplier and location DB masters | contract route + shared section | PASS |
| CT authority | `carat` required; server derives grams | PASS |
| No user Gross Weight | no Gross Weight input; runtime derives it | PASS |
| One physical stone = one Asset | V2 `quantity=1`, `perPiece[0]` | PASS static/clone |
| Product quantity authority | not used by V2 path | PASS static |
| Current value explicit | fail-closed required field | PASS |
| Asset price authority | existing sale-pricing mapping reused | PASS static/tests |

## 6. Frontend

The page is available in AR and EN at `/inventory/loose-gem-stone`. It contains exactly eight sections: Identification, Gem Stone, Purchase, Current Cost, Sales, Tag, Status, and Audit/System. It has no manual Gross Weight field, exposes CT and read-only derived grams, uses DB-backed Supplier/Location/Master selectors, and retains the exact prepared request in memory until confirmation.

Browser evidence:

- AR: Profile Preview READY, Shared Preview READY, enabled Receive button, no console errors.
- EN: Profile Preview READY, Shared Preview READY, enabled Receive button, no console errors.
- AR/EN tax values matched: purchase VAT `728.00`, purchase total `5928.00`, current VAT `868.00`, current total `7068.00`.

## 7. Profile / Request Contract

The server contract normalizes `LOOSE_GEMSTONE`, validates active master IDs, requires Supplier, Purchase Date, Stone Name, CT, Purchase Cost, Current Stone Value, Selling Price, and Tax Treatment. `Other` master selections require an explanation and preserve the controlled selection. Certificate number requires Certificate Authority.

## 8. Weight Normalization

`2.500 CT × 0.20 = 0.50000000 g`. The user cannot supply Gross Weight as a second physical authority. Negative, zero, invalid, or over-precision CT values fail closed in the profile service.

## 9. One-Asset Model

The prepared request contains one item, `quantity=1`, and one `perPiece`. The server-side V2 receive path remains Asset-authoritative and rejects quantity-based physical stock authority. The clone rollback route staged one Asset/one primary subject before the forced journal failure and rolled both back.

## 10. Master Data

The page reads `GEMSTONE_NAME`, `GEMSTONE_TYPE`, `GEMSTONE_SHAPE`, `GEMSTONE_COLOR`, `GEMSTONE_TONE`, `GEMSTONE_TONE_LEVEL`, `GEMSTONE_SATURATION`, `GEMSTONE_OPTICAL_EFFECT`, `GEMSTONE_ORIGIN`, and `CERTIFICATE_AUTHORITY`. No Position, Setting, Treatment, or unrelated master data was provisioned.

## 11. Purchase / Tax

Synthetic evidence: Purchase Cost `5000.00000000`, Additional Cost `200.00000000`, pre-tax acquisition base `5200.00000000`, configured VAT `14%`, VAT `728.00000000`, inclusive purchase total `5928.00000000`. A proven shared-finance defect was corrected so aggregate Additional Cost is included in the taxable base and VAT is applied once.

## 12. Historical Snapshot

The prepared request maps `items[0].unitCost` and `purchaseCost` to the canonical pre-tax acquisition base `5200.00000000`; the source Purchase Cost and Additional Cost remain separately visible in `looseFinancial`.

## 13. Current Valuation

Current Stone Value is independent: `6200.00000000`, current VAT `868.00000000`, current total `7068.00000000`. The prepared current valuation uses these current values, not historical purchase values. No official valuation row was created because the official receive request was rejected before transaction start.

## 14. Selling Price

Selling Price input was `8000.00000000`. The server-side loose pricing authority returned minimum selling price `8000.00000000`; Asset.price remains the frozen operational authority. No sale was executed.

## 15. Barcode

The contract and server resolver explicitly require `GS / LOS / 00`; expected persisted regex is `^GSLOS00[0-9]{6}$`. No barcode was allocated officially because the sole official request returned 401. Barcode mapping was covered statically and in focused tests.

## 16. RFID

RFID remains optional and blank in the synthetic acceptance. The final request builder now passes a supplied RFID through the existing Asset RFID lifecycle; no RFID row was created in this control.

## 17. Certificates / Images

Certificate Authority/Number are master-backed and certificate number fail-closes without an authority. Certificate metadata is now attached to the canonical AssetCertificate input when supplied. Existing AssetAttachment routes remain the reuse boundary for post-Asset named images/certificate images. No images were supplied and no attachment mutation was attempted in the blocked official run.

## 18. Audit / Permissions

The page and canonical receive route use the existing permission and company/branch context. The official request was rejected by authentication middleware before business transaction, which is safer than creating partial data. No permission was weakened.

## 19. Exact Evidence Artifacts

All required artifact names `01` through `14` exist under:

`backend/acceptance-artifacts/loose-gem-stone/DARFUS-LOOSE-GEM-STONE-MINIMUM-SAFE-IMPLEMENTATION/`

The exact prepared request JSON parses successfully and contains one item/one perPiece and an idempotency key. It is not reproduced here to avoid unnecessary operational identifier exposure.

## 20. Preview Parity

`PROFILE_PREVIEW_PARITY = PASS` and `SHARED_PREVIEW_PARITY = PASS` for AR and EN. Both showed CT, derived grams, purchase/additional base, dynamic VAT, purchase total, current value/current VAT/current total, and selling price consistently.

## 21. Focused Tests

PASS:

- `backend/tests/loose-gem-stone-minimum-safe-implementation.test.cjs` — 4/4
- `backend/tests/inventory-master-data-bootstrap-r2.test.cjs` — 5/5
- `backend/tests/inventory-authority-foundation-01a.test.cjs` — 6/6
- `backend/tests/loose-diamond-minimum-safe-implementation.test.cjs` — 12/12
- `backend/tests/gem-stone-jewellery-minimum-safe-implementation.test.cjs` — 7/7
- `backend/tests/supplier-all-asset-profiles-acquisition-payable-pricing-fix-01.test.cjs` — 4/4
- `backend/tests/asset-selling-price-management.test.cjs` — 5/5
- `tests/unified-inventory-intake-ux-02-r3.test.cjs` — 5/5
- `tests/unified-inventory-ux-final-closure.test.cjs` — 8/8

## 22. Shared Regression

The listed Loose Diamond, Gem Stone Jewellery, inventory authority, chooser, Supplier V2, Asset price, and unified intake tests passed. No P0/P1 product regression was introduced by the focused change set.

## 23. Typecheck / Build

- `npm run typecheck = PASS`
- `npm run build = PASS`
- Loose Gem AR/EN routes appeared in the build output.
- `next-env.d.ts` unchanged.

## 24. Rollback Request Parity

The rollback request was derived from the exact prepared request with zero business-field mismatches. The only operational difference was the disposable clone target/harness metadata. Canonical hash capture used `purchase.receive` and the existing `idempotency.service.hashRequest` implementation.

## 25. Disposable Clone Rollback

Fresh clone: `darfus_erp_loose_gem_rollback_20260822_000300`. Temporary backend: `http://localhost:8001`. `health/db = 200`; direct `SELECT current_database()` returned the clone name. A clone-only trigger failed at Journal insert after the receive path had staged the Asset/evidence path. The request returned 500 as intentionally forced.

## 26. Rollback Zero-Delta

Clone before and after counts matched exactly: PO 11, PO items 11, Assets 11, Asset components 8, gemstone detail 1, barcode history 11, origins 11, purchase revisions 11, valuations 11, movements 11, journals 14, journal lines 39, cash 3, idempotency 15, audit 70, Loose Gem Assets 0. `ROLLBACK_PERSISTENT_BUSINESS_DELTA = 0`.

## 27. Official DB Pre-Receive Baseline

Immediately before the backup/live gate, `SELECT current_database()` returned `darfus_erp`. Counts were unchanged from `01` and Loose Gem Assets/GSLOS00 barcodes were both zero.

## 28. Backup

Backup: `backend/backups/darfus_erp_PRE_LOOSE_GEM_STONE_RECEIVE_20260822_000500.dump`.

- Custom format
- 707,305 bytes
- SHA-256 `CDB4D7D949C12E91FAE489D943C38477FF5E50D000519BB1B942B90B558E8AB1`
- `pg_restore -l = PASS`

## 29. Live Browser Receive

The English page used the canonical Inventory → Add/Receive → Loose Gem Stone path. Confirmation opened and showed the retained prepared request. Exactly one Confirm click was issued. The official endpoint returned HTTP 401 with session-expired authentication failure before business processing. No retry was issued.

`LIVE_RECEIVE_COUNT = 1` means one attempted official Confirm request; `SUCCESSFUL_RECEIVE_COUNT = 0`.

## 30. DB Reconciliation

Post-attempt official counts remained exactly at baseline: PO 11, PO items 11, Assets 11, origins 11, revisions 11, valuations 11, movements 11, journals 14, journal lines 39, cash 3, idempotency 15, Loose Gem Assets 0, GSLOS00 barcodes 0. `DB_BUSINESS_DELTA = 0`.

## 31. Accounting

Accounting mapper and focused tests preserve the canonical shape (pre-tax acquisition debit, recoverable VAT debit, inclusive AP credit; balanced journal). No official Journal was created in the blocked live attempt, so live accounting proof is not claimed.

## 32. Idempotency

Static canonicalization proof passed: the retained request hash and a changed-payload hash differ. Exact replay and same-key 409 could not be run after the official 401 because doing so would require a successful official transaction and a second POST. `IDEMPOTENCY_REPLAY_RUNTIME = NOT_RUN_BY_GUARD`.

## 33. AR/EN Asset Readback

Not available: the official attempt created no Asset. AR/EN form preview evidence passed; AR/EN Asset-detail evidence is blocked by the authentication failure.

## 34. POS Read-Only

Not run: no official GSLOS00 barcode exists to search. Static POS Asset authority remains covered by existing tests; no sale or checkout was attempted.

## 35. P0/P1

- P0 = 0
- P1 = 1 operational blocker: official browser session expired at the single authorized Confirm request (`401`).
- Classification: `ENVIRONMENT_CONFIG / AUTH_RUNTIME`, not a proven Loose Gem business-rule defect.
- Risk to official DB: none observed; post-attempt delta is zero.

## 36. Gate

`GATE = BLOCKED_LOOSE_GEM_STONE_AUTHENTICATION_EXPIRED`

The implementation and pre-live gates are ready, but final workflow closure cannot be claimed because the one authorized official request did not authenticate. The control intentionally does not retry, replay, create a second Receive, or modify existing data.

## 37. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-GEM-STONE-MINIMUM-SAFE-IMPLEMENTATION
LOCAL_MAIN_DB = darfus_erp
CLIENT_AUTHORITY_SHA256 = F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3
CLIENT_AUTHORITY_VERSION_CHECK = PASS
MIGRATION_REQUIRED = NO
MIGRATIONS_EXECUTED = 0
LOOSE_GEM_CHOOSER_ENTRY = PASS
LOOSE_GEM_DEDICATED_AR_UI = PASS
LOOSE_GEM_DEDICATED_EN_UI = PASS
EIGHT_SECTION_UI = PASS
STONE_CARAT_REQUIRED = PASS
GROSS_WEIGHT_USER_INPUT = ABSENT
CT_TO_GRAM_DERIVATION = PASS
ONE_PHYSICAL_LOOSE_STONE_ONE_ASSET = PASS_STATIC_AND_CLONE
PRIMARY_SUBJECT_COUNT = 1_STAGED_THEN_ROLLED_BACK
MULTI_STONE_LOOSE_ASSET = REJECTED
MASTER_DATA_BINDING = PASS
PURCHASE_COST_AUTHORITY = PASS
ADDITIONAL_COST = PASS
PURCHASE_VAT = 728.00000000
PURCHASE_VAT_APPLICATION_COUNT = 1
CURRENT_STONE_VALUE_REQUIRED = PASS
CURRENT_VALUATION_HISTORY_FALLBACK = FORBIDDEN_AND_TESTED
SELLING_PRICE_AUTHORITY = ASSET_PRICE
SELLING_PRICE = 8000.00000000
MINIMUM_SELLING_PRICE = 8000.00000000
LOOSE_BARCODE = GS/LOS/00
LOOSE_BARCODE_REGEX = ^GSLOS00[0-9]{6}$
LOOSE_BARCODE_MAPPING = PASS_STATIC
RFID = OPTIONAL_BLANK
INITIAL_STATUS = AVAILABLE_SERVER_AUTHORITY
LOCATION_AUTHORITY = DB_MASTER_BRANCH_SCOPED
PROFILE_PREVIEW_PARITY = PASS
SHARED_PREVIEW_PARITY = PASS
AR_PREVIEW = PASS
EN_PREVIEW = PASS
ROLLBACK_PERSISTENT_BUSINESS_DELTA = 0
OFFICIAL_DB_PRE_LIVE_DELTA = 0
OFFICIAL_BACKUP = PASS
LIVE_RECEIVE_ATTEMPTS = 1
LIVE_RECEIVE_SUCCESS = 0
LIVE_RECEIVE_STATUS = 401_UNAUTHORIZED_SESSION_EXPIRED
OFFICIAL_DB_WRITES = 0
OFFICIAL_DB_BUSINESS_DELTA = 0
IDEMPOTENCY_HASH_INPUT_PROVEN = YES
IDEMPOTENCY_REPLAY_RUNTIME = NOT_RUN_BY_GUARD
POS_READ_PROOF = NOT_RUN_BY_GUARD
PRODUCTION_CONTACTED = NO
P0_COUNT = 0
P1_COUNT = 1
GATE = BLOCKED_LOOSE_GEM_STONE_AUTHENTICATION_EXPIRED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_AUTHENTICATED_SESSION_AND_EXPLICIT_DECISION_ON_ONE_RETRY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

No second Receive, replay, POS sale, cleanup, migration, seed, or production action was performed. Owner review is required before any further action.
