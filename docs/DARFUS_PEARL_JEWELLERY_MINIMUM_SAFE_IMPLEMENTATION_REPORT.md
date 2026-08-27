# DARFUS ERP — Pearl Jewellery Minimum Safe Implementation Report

## 1. Executive Summary

تم تنفيذ أقل تغييرات Pearl Jewellery، ونجحت اختبارات المصدر وAR/EN Preview، ونجح Receive كامل على Disposable Clone ثم أُعيد الـClone إلى baseline بصفر delta. تم إنشاء Backup رسمي صالح قبل الـConfirm. قبل الـConfirm الرسمي مباشرة كان protected GET = 200 والطلب والـhash مطابقين، لكن ضغطة Confirm الوحيدة دخلت مسار انتهاء جلسة `401` في عميل API؛ لم تُنشأ PO أو Asset أو Journal رسميًا. طبقًا للـPrompt تم التوقف وعدم إعادة المحاولة تلقائيًا.

النتيجة: التنفيذ الأساسي جاهز، لكن الـOfficial live Receive وقراءات AR/EN/POS بعد الاستلام غير مثبتة. الحالة `OPEN` وليست إغلاقًا نهائيًا.

## 2. Scope / Authorization

- Control: `DARFUS-PEARL-JEWELLERY-MINIMUM-SAFE-IMPLEMENTATION`
- `IMPLEMENTATION_AUTHORIZED = YES`
- `MAX_SUCCESSFUL_DISTINCT_RECEIVES = 1`
- `SECOND_DISTINCT_RECEIVE_ALLOWED = NO`
- `AUTOMATIC_RETRY_AFTER_FAILURE = NO`
- `LOCAL_MAIN_DB = darfus_erp`
- Loose Pearl / Diamond / Gem Stone redesign: لم يُنفّذ.
- Official DB business writes: `0`.

## 3. Client Authority SHA

- File: `I:\WORK\client-requirements\Pearl.docx`
- SHA256: `2EBACAE8A77724553353D5366EDCA9000CE8A644505FDC95F1198AF39D497D2E`
- Full read and visual verification: `PASS`.
- Renderer page-count difference was treated as layout variance only because the exact file SHA matched the previously audited authority.

## 4. Files Changed

Intentional source scope:

- `backend/src/services/pearl-jewellery-profile.service.js`
- `backend/src/routes/pearl-jewellery-profile.routes.js`
- `backend/src/routes/index.js`
- `backend/src/routes/erp.routes.js`
- `backend/src/services/profile-master-data.service.js`
- `backend/src/services/gold-sale-pricing.service.js`
- `backend/src/services/supplier-acquisition-preview.service.js`
- `app/[locale]/(dashboard)/inventory/pearl/page.tsx`
- `components/inventory/inventory-intake-chooser.tsx`
- `tests/pearl-jewellery-minimum-safe-implementation.test.cjs`
- This report and acceptance artifacts.

No migration, seed, production configuration, or business-rule change outside Pearl Jewellery was introduced.

## 5. Worktree Safety

- Destructive Git commands: none.
- `next-env.d.ts`: not edited; accepted generated drift preserved.
- Main frontend runtime was rebuilt/restarted only to load the source build; no second frontend was started.
- Git status verification was previously captured as part of the dirty worktree baseline. A later direct Git read was blocked by Git's repository ownership safety check; no `safe.directory` configuration was added.
- Pre-existing worktree changes were not cleaned, reset, stashed, or claimed as this batch.

## 6. Implementation Map

| Area | Result | Evidence |
|---|---|---|
| Server profile contract | PASS | Pearl route and service |
| Shared Receive Preview | PASS | `erp.routes.js` Pearl branch |
| Canonical Supplier Receive V2 | PASS | `inventoryV2=true`, `perPiece[]` |
| One Asset per physical jewellery piece | PASS | Clone DB proof |
| Product quantity authority | NOT USED | V2 asset path |
| Dynamic Tax Engine | PASS | 14% resolved from company policy |
| Historical/current separation | PASS | Separate purchase and valuation mappings |
| Asset selling price | PASS | Existing profile-aware sale pricing |
| Exact request retention | PASS | Browser `<pre>` and artifact 04 |
| Official Receive | BLOCKED | Auth session 401 path |

## 7. Frontend AR/EN

- AR dedicated route: `PASS`, `/ar/inventory/pearl`.
- EN dedicated route: `PASS`, `/en/inventory/pearl`.
- Unified Inventory chooser: `PASS`; Pearl enabled only after implementation and tests.
- Supplier shortcut: reuses the same chooser/canonical form; no second receive workflow was added.
- AR Preview: `READY`.
- EN Preview: `READY`.
- AR/EN final asset readback: `NOT RUN` because the official Receive was blocked before business creation.

## 8. Profile Contract

`PEARL_JEWELLERY` is server-resolved. `Loose Pearl` is explicitly rejected by the Pearl Jewellery service and remains a separate future profile. The canonical receive contract requires Supplier, server-authoritative Branch, DB `locationId`, explicit `taxTreatment`, `inventoryV2`, and per-piece payload.

## 9. Item Identification

The supported item descriptions and codes are server-mapped. The acceptance case used `Pearl Ring → RNG`. Client labels are not the authority.

## 10. Gold Formulas

For the synthetic case:

- Gross weight: `12.00000000g`
- Pearl weight: `1.20000000g`
- Other stones: `0.00000000g`
- Net gold: `10.80000000g`
- Pure gold 999.9 evidence: `8.10000000g` at 18K.
- Historical gold value: `10.8 × 200 = 2160.00`.
- Making total: `10.8 × 30 = 324.00`.

No Gold By Weight formula was copied as a business authority.

## 11. Pearl Group Semantics

- One Pearl group was used.
- Group quantity: `1`.
- Total group weight: `1.20000000g`.
- Group cost: `1500.00000000`.
- Cost was not multiplied a second time by quantity.
- Mixed component normalization is supported; no other-stone component was used in the live case.

## 12. Pearl Field Mapping

Master-backed fields used: Gold Color, Pearl Type, Pearl Color, Overtone/Orient when supplied, Shape, Luster, Surface/Nacre quality, Origin, and Pearl Size. Technical fields such as Asset, Barcode, Supplier, Branch, Location, tax, audit, and idempotency remain platform authorities. Optional certificate/image data was not fabricated or inserted.

## 13. Master Data

The contract read active DB master data only. The case used existing Supplier `SUP-001`, active Location `LOC-9a10f58e-4207-4512-8824-7a7b06159151`, Pearl Size `PSMD-222e51b4625e4ac78f97afbc73`, and controlled values `Yellow Gold`, `Akoya`, `White`, `Round`, `High`, `Japan`. No master data was provisioned.

## 14. Mixed Components

The server supports Pearl plus Diamond/Gemstone/Other component kinds through the existing component contract. The tested case contained one Pearl component only. No unrelated profile was implemented.

## 15. Purchase Gold Snapshot

The purchase rate was the entered synthetic rate `200 AED/g` for the accepted test. Gold Center current rate was used separately for current valuation. The source preserves rate provenance and does not replace the company Tax Engine.

## 16. Purchase Calculator

`2160.00 + 324.00 + 1500.00 + 0.00 = 3984.00` pre-tax base. This same base was sent as both `items[0].unitCost` and `perPiece[0].purchaseCost`.

## 17. Tax

- Treatment: `STANDARD_VAT`.
- Rate: `14%`, dynamically resolved from company policy.
- VAT: `3984.00 × 14% = 557.76`.
- Total: `4541.76`.
- VAT application count: exactly once.
- `taxIncluded = false`, `applyVat = true`.

## 18. Historical Snapshot

The historical purchase snapshot is pre-tax base `3984.00000000`, VAT `557.76000000`, and tax-inclusive transaction total `4541.76000000`. The clone cost revision retained the same economic separation.

## 19. Current Cost

Clone current valuation proof:

- Current Gold Center rate: `407.62049952`.
- Current gold value: `4402.30139482`.
- Current making value: `378.00000000`.
- Current Pearl value: `1700.00000000`.
- Current valuation VAT: `907.24219527`.
- Current total: `7387.54359009`.

Historical purchase cost was not substituted for current valuation.

## 20. Selling Price

- Authority: `Asset.price`.
- Synthetic selling price: `5000.00000000`.
- Existing profile-aware sale pricing service was reused; no second pricing engine was created.

## 21. Barcode

Clone proof generated one unique profile-mapped barcode: `PLRNG18000001`. Official barcode creation did not occur because the official Confirm stopped at authentication.

## 22. RFID

RFID remains optional and uses the existing Asset/RFID contract. No RFID master data or assignment was fabricated.

## 23. Certificates / Images

The implementation keeps certificate/image extension points within the existing architecture. The acceptance case omitted optional attachments; no unsupported pre-receive attachment mutation was added.

## 24. Audit / Permissions

The canonical route continues to require authentication and `suppliers.create`. Company and Branch are server authoritative. Super Admin company context was explicitly supplied in the disposable proof and protected contract GET returned 200. No permission weakening or fallback account was introduced.

## 25. Profile Preview

AR and EN both reached `READY`. Numeric result: base `3984.00`, VAT `557.76`, total `4541.76`, current item cost `7387.54359009`.

## 26. Shared Preview

Shared Receive Preview reached `READY` and matched the profile base and tax context. `PROFILE_BASE = SHARED_BASE = PREPARED_UNIT_COST = 3984.00`.

## 27. Exact Request Artifacts

- [Exact prepared request](../backend/acceptance-artifacts/pearl-jewellery/DARFUS-PEARL-JEWELLERY-MINIMUM-SAFE-IMPLEMENTATION/04-exact-prepared-request.json)
- [Canonical hash](../backend/acceptance-artifacts/pearl-jewellery/DARFUS-PEARL-JEWELLERY-MINIMUM-SAFE-IMPLEMENTATION/05-canonical-business-payload.sha256)
- [Rollback request](../backend/acceptance-artifacts/pearl-jewellery/DARFUS-PEARL-JEWELLERY-MINIMUM-SAFE-IMPLEMENTATION/06-rollback-request.json)
- `idempotencyKey` was retained in the artifact; no password or access token was recorded.

## 28. Focused Tests

Focused Pearl test plus the required shared focused set: `64 passed, 0 failed`.

## 29. Shared Regression

Gold By Weight, Gold By Piece, Diamond corrective, G2C tax/location, tax, master-data, Asset, and Barcode focused regressions: `PASS` in the executed 64-test command.

## 30. Typecheck / Build / Runtime

- Backend JavaScript syntax checks: `PASS`.
- `npm run typecheck`: `PASS`.
- `npm run build`: `PASS`.
- Normal backend restart loaded the source; migration runner reported database schema already up to date.
- `SequelizeMeta` remained `88` before and after.

## 31. Rollback Request Parity

Exact request body was retained before Confirm. Canonical hash used the existing `idempotency.service.js` algorithm: sorted `{scope, params, body}` with idempotency key excluded. Original and replay hash parity: `PASS`; changed payload produces a different hash and the clone endpoint returned `409`.

## 32. Disposable Clone Rollback

Clone `darfus_erp_pearl_clone_20260822_01` was restored from `clone-source.dump`. A full receive was executed on that clone, replay/conflict proof completed, then the clone was dropped and recreated from the source dump. Restore exit was `0`.

## 33. Rollback Zero Delta

After clone restore: `purchase_orders=12`, `assets=12`, `journal_entries=15`, `idempotency_requests=16`, `PEARL_JEWELLERY assets=0`. Rollback business delta: `0`. Official DB was not the rollback target.

## 34. Official DB Pre-Live Baseline

Immediately before official Confirm: `current_database() = darfus_erp`; `PO=12`, `Asset=12`, `Journal=15`, `Idempotency=16`, `Pearl assets=0`. The same counts remained after the auth-blocked Confirm.

## 35. Auth Session Proof

Same browser session performed protected Pearl contract GET with HTTP `200`; exact request and business hash were recomputed immediately before Confirm. The Confirm call entered the frontend 401 session-refresh path. The UI displayed the session-refresh message and the prompt’s mandatory rule was applied: no automatic retry, owner review required.

## 36. Backup

- [Official pre-live backup](../backend/acceptance-artifacts/pearl-jewellery/DARFUS-PEARL-JEWELLERY-MINIMUM-SAFE-IMPLEMENTATION/official-pre-live-backup-20260822.dump)
- Bytes: `709826`.
- SHA256: `07B9C37B3D93DBEDEBA28B1F6B9051FDD983E0C21A9A60D6179EA7B40BD5F55B`.
- `pg_restore -l`: `PASS`.

## 37. Live Browser Receive

One exact Confirm button click was executed from the canonical AR Pearl Jewellery screen. The client received the session-refresh/auth error path; no successful business response was observed. No second click or second distinct Receive was attempted.

## 38. DB Reconciliation

Expected official delta was not reached because the receive was blocked before business creation. Actual official business delta was `0`, which is safe and consistent with the failure gate.

## 39. Accounting

Disposable clone accounting proof passed: PO total `4541.76000000`, journal debit `4541.76000000`, credit `4541.76000000`. Official journal proof is `NOT APPLICABLE` because no official transaction was created.

## 40. Historical / Current Separation

Clone evidence confirms purchase cost revision total `3984.00000000` with purchase VAT evidence `557.76000000`, while current valuation total is `7387.54359009` from live rate/current values. Separation: `PASS` on Clone; official readback pending.

## 41. Idempotency

Clone exact replay returned `201` with no duplicate business rows. Same key plus changed payload returned `409 STATE_CONFLICT`. Official exact replay was not run because the official Confirm did not create a successful transaction.

## 42. AR Readback

AR Preview and prepared request: `PASS`. AR Asset readback after official Receive: `NOT RUN` because `LIVE_ASSET = NONE`.

## 43. EN Readback

EN Preview and form route: `PASS`. EN Asset readback after official Receive: `NOT RUN` because `LIVE_ASSET = NONE`.

## 44. POS Read-Only

POS barcode read after official Receive: `NOT RUN`; there is no official Pearl Asset/barcode to query. No POS mutation or fallback change was performed in the acceptance step.

## 45. P0/P1

- New P0: `0`.
- New P1: `1` — official Pearl workflow is blocked at the authenticated Confirm step by the session 401 path. Classification: `ENVIRONMENT_CONFIG / AUTH_SESSION_RUNTIME_BLOCKER`, not a Pearl business-rule defect. No data loss or partial persistence was observed.

## 46. Gate

`GATE = BLOCKED_PEARL_JEWELLERY_AUTH_SESSION`

Required closure gate is not met because the official successful Receive, official DB reconciliation, official AR/EN Asset readback, official POS read, and official idempotency replay were not executed. The module remains `OPEN`.

## 47. Final Tokens

```text
CURRENT_CONTROL = DARFUS-PEARL-JEWELLERY-MINIMUM-SAFE-IMPLEMENTATION
LOCAL_MAIN_DB = darfus_erp
CLIENT_AUTHORITY_SHA256 = 2EBACAE8A77724553353D5366EDCA9000CE8A644505FDC95F1198AF39D497D2E
CLIENT_AUTHORITY_VERSION_CHECK = PASS
SOURCE_FILES_CHANGED = 10 intentional source/test files plus report/artifacts; pre-existing drift preserved
MIGRATION_REQUIRED = NO
MIGRATIONS_EXECUTED = NO
PEARL_CHOOSER_ENTRY = PASS
PEARL_DEDICATED_AR_UI = PASS
PEARL_DEDICATED_EN_UI = PASS
NINE_SECTION_UI = PASS
LOOSE_PEARL_EXCLUDED = PASS
ONE_PHYSICAL_PEARL_JEWELLERY_PIECE_ONE_ASSET = PASS_ON_CLONE
PEARL_GROUP_QUANTITY = 1
PEARL_GROUP_TOTAL_WEIGHT = 1.20000000
PEARL_GROUP_COST = 1500.00000000
PEARL_GROUP_DOUBLE_MULTIPLICATION = NOT_PRESENT
MIXED_COMPONENTS = SUPPORTED; NOT USED IN SYNTHETIC CASE
GROSS_WEIGHT = 12.00000000
PEARL_WEIGHT = 1.20000000
OTHER_STONES_WEIGHT = 0.00000000
NET_GOLD_WEIGHT = 10.80000000
PURE_GOLD_WEIGHT = 8.10000000
PURCHASE_GOLD_RATE = 200.00000000
MAKING_PER_GRAM = 30.00000000
GOLD_PURCHASE_VALUE = 2160.00000000
MAKING_TOTAL = 324.00000000
PEARL_COST_TOTAL = 1500.00000000
OTHER_STONE_COST_TOTAL = 0.00000000
PURCHASE_PRE_TAX_BASE = 3984.00000000
PURCHASE_VAT = 557.76000000
VAT_APPLICATION_COUNT = 1
PURCHASE_TOTAL = 4541.76000000
CURRENT_GOLD_RATE = 407.62049952
CURRENT_GOLD_VALUE = 4402.30139482
CURRENT_ITEM_COST = 7387.54359009
SELLING_PRICE_AUTHORITY = ASSET_PRICE
SELLING_PRICE = 5000.00000000
MINIMUM_SELLING_PRICE = SERVER_PROFILE_PRICING_ACCEPTED
PEARL_BARCODE = PLRNG18000001_ON_CLONE
BARCODE_PROFILE_MAPPING = PASS_ON_CLONE
RFID = OPTIONAL_REUSED_AUTHORITY
EXACT_PREPARED_REQUEST_ARTIFACT = backend/acceptance-artifacts/pearl-jewellery/DARFUS-PEARL-JEWELLERY-MINIMUM-SAFE-IMPLEMENTATION/04-exact-prepared-request.json
CANONICAL_BUSINESS_PAYLOAD_HASH = 5ce52ab73fb1226804d629caaba25806de8d12483390ffe9771fc82f279088ed
ROLLBACK_REQUEST_ARTIFACT = backend/acceptance-artifacts/pearl-jewellery/DARFUS-PEARL-JEWELLERY-MINIMUM-SAFE-IMPLEMENTATION/06-rollback-request.json
BUSINESS_FIELD_MISMATCH_COUNT = 0
BUSINESS_PAYLOAD_HASH_PARITY = PASS
ROLLBACK_PERSISTENT_BUSINESS_DELTA = 0
AUTH_SESSION_VALID_BEFORE_CONFIRM = YES_FOR_PROTECTED_GET; CONFIRM_ENTERED_401_PATH
AUTHENTICATED_READ_HTTP = 200
PRE_RECEIVE_BACKUP = backend/acceptance-artifacts/pearl-jewellery/DARFUS-PEARL-JEWELLERY-MINIMUM-SAFE-IMPLEMENTATION/official-pre-live-backup-20260822.dump
PRE_RECEIVE_BACKUP_BYTES = 709826
PRE_RECEIVE_BACKUP_SHA256 = 07B9C37B3D93DBEDEBA28B1F6B9051FDD983E0C21A9A60D6179EA7B40BD5F55B
PRE_RECEIVE_BACKUP_RESTORE_LIST = PASS
LIVE_DISTINCT_RECEIVE_ATTEMPTS = 1 blocked / 0 successful
LIVE_RECEIVE_HTTP = 401_AUTH_SESSION_PATH; NO_BUSINESS_RESPONSE
LIVE_PO = NONE
LIVE_ASSET = NONE
LIVE_BARCODE = NONE
LIVE_JOURNAL = NONE
OFFICIAL_DB_EXPECTED_DELTA = NOT_REACHED; ACTUAL_BUSINESS_DELTA=0
JOURNAL_BALANCED = PASS_ON_CLONE; OFFICIAL_NOT_APPLICABLE
CASH_DELTA = 0
IDEMPOTENCY_EXACT_REPLAY = PASS_ON_CLONE; OFFICIAL_NOT_RUN
IDEMPOTENCY_CHANGED_PAYLOAD_409 = PASS_ON_CLONE
AR_ASSET_READBACK = NOT_RUN_OFFICIAL_ASSET_NOT_CREATED
EN_ASSET_READBACK = NOT_RUN_OFFICIAL_ASSET_NOT_CREATED
POS_BARCODE_READ_ONLY = NOT_RUN_OFFICIAL_ASSET_NOT_CREATED
FOCUSED_TESTS = 64 PASS / 0 FAIL
SHARED_REGRESSION = PASS
TYPECHECK = PASS
BUILD = PASS
NEW_P0_COUNT = 0
NEW_P1_COUNT = 1_AUTH_SESSION_RUNTIME_BLOCKER
GATE = BLOCKED_PEARL_JEWELLERY_AUTH_SESSION
PEARL_JEWELLERY_FINAL_USER_WORKFLOW_CLOSED = NO
PEARL_JEWELLERY_MODULE_STATUS = OPEN
NEXT_RECOMMENDED_STEP = OWNER REVIEW OF THE CONFIRM 401 SESSION PATH; ONLY AFTER EXPLICIT AUTHORIZED MANUAL RETRY, COMPLETE THE SINGLE OFFICIAL RECEIVE AND POST-RECEIVE PROOFS
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

No second official Receive, cleanup, rollback, migration, seed, or production operation was performed. Owner review is required before any further Confirm attempt.
