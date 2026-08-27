# DARFUS ERP — C1 Barcode Exact Parity Read-First Report

## Executive Summary

تم تنفيذ C1 كفحص قراءة فقط. ثبتت قاعدة `darfus_erp`، وصحة format الباركود، وسلطة ERG/NCK، وعدم وجود collisions أو orphan history في baseline الحالي. لم يحدث أي Barcode/Asset/sequence/RFID/movement/journal mutation.

المنتج الحالي قوي في هوية Asset، التوليد server/database-backed، الترتيب التسلسلي، التاريخ، reprint، replacement، وscope الشركة/الفرع. الفجوات المثبتة ليست P0/P1: عقد Item Revision v1/v2 الكامل غير موجود ككيان/contract مستقل، common-field parity غير مكتمل كواجهة مشتركة، وtag layout/business-field parity ما زال جزئيًا. هذه فجوات C2/قرارات لاحقة وليست مبررًا لتغيير الهوية الآن.

`GATE = PASS_CLIENT_C1_BARCODE_EXACT_PARITY_READ_FIRST`

## 1. Scope and authority

- Control: `DARFUS-CLIENT-C1-BARCODE-EXACT-PARITY-READ-FIRST-01`
- Official DB: `darfus_erp`, read-only.
- Frozen decisions: `D02=ERG`, `D03=NCK`, `D04=CURRENT_HISTORY_FIRST`.
- Client Barcode requirements audited: `BC-001` through `BC-044`.
- Supporting evidence is prior accepted closure/runtime evidence; it does not override the client document or frozen architecture.

## 2. Read-only safety and worktree

| Check | Result | Evidence |
|---|---|---|
| Official DB identity | `darfus_erp` | `SELECT current_database()` through `darfus-postgres`. |
| Source branch / HEAD | `main` / `1657b0e9ba580faef69be48f04637835c201b521` | Read-only Git query with explicit safe.directory override; no Git config mutation. |
| Pre-existing worktree status | 637 status lines before C1 artifacts | `git status --short`; preserved untouched. |
| C1 product source edits | 0 | No backend/app/lib file was edited. |
| C1 test edits | 0 | No test file was edited. |
| DB writes | 0 | Only SELECTs and container status inspection. |
| POST/PUT/PATCH/DELETE business requests | 0 | C1 restriction honored. |

The four Markdown artifacts are the only intentional C1 outputs. Their creation is documentation/report output, not product implementation.

## 3. Official DB baseline

| Entity / check | Actual |
|---|---:|
| Database | `darfus_erp` |
| Assets | 18 |
| Barcode history rows | 18 |
| Active history rows | 18 |
| Retired history rows | 0 |
| RFID assignment rows | 2 |
| Barcode inventory-code rows | 5 |
| Barcode item-code rows | 20 |
| Barcode sequence rows | 12 |
| Asset events | 65 |
| Inventory asset movements | Not mutated/read as part of the Barcode anomaly query; no C1 write |
| ERG active rows | 1 |
| ERR active rows | 0 |
| NCK active rows | 1 |
| NLC active rows | 0 |
| Duplicate Asset Barcode values | 0 |
| Duplicate history Barcode values | 0 |
| Active Asset/history mismatches | 0 |
| Assets without expected active history | 0 |
| Active history without Asset | 0 |
| Invalid current Barcode format | 0 |
| Asset parsed-field mismatch | 0 |
| Loose profile karat not `00` | 0 |
| Active Asset item code `ERR`/`NLC` | 0 |

Active master data is company `COMP-48ab554f-427e-4642-9419-bc8616c2dc36`; all five inventory codes are active/client-approved. The 20 item-code rows include all client-required item codes, including `ERG`, `NCK`, and `LOS`.

## 4. Source authority trace

| Authority | Source | Finding |
|---|---|---|
| Format / validation | `backend/src/services/barcode-identity.service.js`: `formatBarcode`, `normalizeKaratCode`, `resolveKaratCodeForProfile` | Exact inventory + item + 2-digit karat + 6-digit serial; loose profiles force `00`/`LOS`. |
| Master configuration | `backend/src/config/barcode-defaults.js`; `BarcodeInventoryCode`, `BarcodeItemCode` models | Defaults are taxonomy only; runtime resolves company DB rows first. |
| Sequence | `allocateBarcodeSerial()` | PostgreSQL UPSERT on company/inventory/item/karat, no MAX()+1 race. |
| Collision/reuse | generator Asset count plus history lookup; DB unique indexes | Current DB has no collision/reuse anomaly. |
| History | `AssetBarcodeHistory` model and `asset_barcode_history` | Active/retired rows, revision, actor, timestamps, reason, source reference. |
| Replacement | `replaceAssetBarcode()` and `POST /inventory-v2/assets/:id/barcode/replace` | Dedicated permission/reason/transaction/idempotency; same Asset, old retired, new active. |
| Reprint | `POST /inventory-v2/assets/:id/tags/print` and `recordTagPrint()` | Records tag print and returns stored Asset Barcode; no identity generation. |
| Identity edit guard | `backend/src/controllers/erp.controller.js`, `changedAssetIdentityField()` | Generic Asset update rejects identity-field changes after Barcode exists. |
| DB guard | `assets_barcode_immutable_trg` and `assets_hard_delete_forbidden_trg` | Direct Barcode identity update/delete is protected at DB boundary. |
| Asset read projection | `GET /inventory-v2/assets`, `GET /inventory-v2/assets/:id` | Server company/authorized-branch scope; barcode search is Asset-only. |
| Tags | `features/printing/components/barcode-tags/*`, `lib/print/barcode-label.ts` | Stored Asset Barcode is rendered; profile backs are explicit but exact visual parity is partial. |
| RFID | `inventory-v2-runtime.service.js` assignment/scan/unassign functions | Separate Asset-linked RFID authority; no implicit Barcode coupling. |

## 5. C1 decision outputs

```text
BARCODE_CORE_FORMAT = EXACT
ERG_AUTHORITY = PASS
NCK_AUTHORITY = PASS
SEQUENCE_COLLISION_AUTHORITY = PASS
REPRINT_SEMANTICS = PASS
RETURN_IDENTITY_SEMANTICS = PASS
REPLACEMENT_SEMANTICS = PASS
ITEM_TYPE_IMMUTABILITY = PASS
KARAT_IMMUTABILITY = PASS
CURRENT_HISTORY_SATISFIES_CLIENT_REVISION = NO
REVISION_MINIMUM_GAP = One canonical Asset-linked revision/evidence contract for arbitrary approved item changes: version/order, changed field or reason, old value, new value, actor, timestamp, source operation/reference, Barcode effect, RFID effect.
COMMON_PROFILE_FIELDS = PARTIAL
TAG_PROFILE_PARITY = PARTIAL
STATUS_MAPPING = IMPLEMENTED_DIFFERENTLY
FUTURE_INTEGRATION_REQUIRES_BARCODE_REBUILD = NO
DUPLICATE_BARCODE_AUTHORITY = NO
CIRCULAR_DEPENDENCY = NO
```

## 6. Lifecycle, revision, and immutability conclusion

- Initial creation is one Asset plus one initial active history row.
- Reprint is a presentation/event operation; it does not replace identity.
- Return/repair/workshop transitions preserve Asset Barcode; evidence is source-level plus prior accepted runtime, because C1 forbids mutation.
- Replacement is the only dedicated Barcode identity change and is transactionally governed.
- Current history is sufficient for Barcode replacement history but not the full client v1/v2 arbitrary-item revision contract.
- Item Type and Karat are protected by the generic update guard, metadata allowlist, and database identity trigger; no alternate post-barcode mutation path was found that changes them in place. Transformation flows create new output Assets rather than changing an existing identity.
- `RFID_BARCODE_COUPLING = SEPARATE_GOVERNED_IDENTITIES; NO_IMPLICIT_COUPLING`.

Detailed evidence is in:

- [C1 exact parity matrix](./DARFUS_CLIENT_C1_BARCODE_EXACT_PARITY_MATRIX.md)
- [C1 revision capability](./DARFUS_CLIENT_C1_BARCODE_REVISION_CAPABILITY.md)
- [C1 status/tag mapping](./DARFUS_CLIENT_C1_BARCODE_STATUS_TAG_MAPPING.md)

## 7. Confirmed gaps and severity

| ID | Finding | Classification | Severity | Next safe disposition |
|---|---|---|---|---|
| C1-GAP-001 | No complete client Item Revision v1/v2 contract for arbitrary changed fields. | PARTIAL / DESIGN GAP | P2 | Owner-approved C2 design/proof at existing history boundary; no parallel identity. |
| C1-GAP-002 | Common-field parity is not proven as one exact UI/tag contract across every profile; SKU/image authority is not independently established. | PARTIAL / UI-DATA CONTRACT | P2 | Read-only profile-by-profile contract audit before implementation. |
| C1-GAP-003 | Tag profile business fields are present, but exact physical layout/order and all mockup semantics are not frozen/proven. | IMPLEMENTED_DIFFERENTLY | P2 | Separate exact tag parity decision/proof; no print mutation in C1. |
| C1-GAP-004 | Editable metadata field/permission matrix is incomplete for image, supplier, making, and notes/price combinations. | PARTIAL / ACCEPTANCE GAP | P2 | Trace existing permissions before any change. |
| C1-GAP-005 | Status vocabulary differs from client labels for Created/In Stock/Repair/Lost/Archived. | IMPLEMENTED_DIFFERENTLY | P3 | Preserve current canonical mapping; do not reopen Inventory Count or add enums from labels alone. |

`P0 = 0`  
`P1 = 0`  
`P2 = 4`  
`P3 = 1`

No active identity-risk defect was found in the official DB baseline.

## 8. Runtime and test evidence boundary

Read-only container status was observed: `darfus-backend` up, `darfus-postgres` healthy, and `darfus-redis` healthy. Prior accepted Barcode closure evidence covers GET Asset list/detail, AR/EN detail, search, source-backed API health, and static tag verification. C1 did not repeat a mutation-dependent browser proof and did not click print/reprint. Any exact reprint/replacement/concurrency runtime proof is:

`RUNTIME_MUTATION_PROOF = NOT_SAFE_IN_C1`  
`DEFER_TO_C2_DISPOSABLE_PROOF`

Current tests were reviewed, not changed. Existing coverage is strong for source contracts, format, sequence UPSERT, history constraints, reprint separation, replacement boundary, loose `00/LOS`, ERG/NCK defaults, RFID separation, and Asset search. Missing semantic coverage is the exact arbitrary-item revision contract, complete common-field parity, and exact tag layout/business matrix.

## 9. C1 gate

```text
ALL_BC_REQUIREMENTS_TRACED = YES
ERG_NCK_FROZEN_AUTHORITY_VERIFIED = YES
REVISION_CAPABILITY_AUDITED = YES
IMMUTABILITY_PATHS_AUDITED = YES
LIFECYCLE_MATRIX_COMPLETE = YES
COMMON_PROFILE_MATRIX_COMPLETE = YES
TAG_MATRIX_COMPLETE = YES
FUTURE_INTEGRATION_CONTRACT_AUDITED = YES

SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
MIGRATIONS = 0
BUSINESS_DB_WRITES = 0
BARCODE_MUTATIONS = 0
ASSET_MUTATIONS = 0
P0 = 0
P1 = 0

GATE = PASS_CLIENT_C1_BARCODE_EXACT_PARITY_READ_FIRST
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

This PASS closes the read-first audit only. It does not claim full client Barcode implementation parity and does not authorize C2, mutation, migration, tag printing, replacement, or status changes.

## 10. Final tokens

```text
CURRENT_CONTROL = DARFUS-CLIENT-C1-BARCODE-EXACT-PARITY-READ-FIRST-01
BATCH = C1
MODE = READ_ONLY_IDENTITY_CRITICAL_AUDIT
FROZEN_EARRINGS_CODE = ERG
FROZEN_NECKLACE_CODE = NCK
FROZEN_REVISION_STRATEGY = CURRENT_HISTORY_FIRST
ALL_BC_REQUIREMENTS_TRACED = YES
BARCODE_CORE_FORMAT = EXACT
ERG_AUTHORITY = PASS
NCK_AUTHORITY = PASS
SEQUENCE_COLLISION_AUTHORITY = PASS
REPRINT_SEMANTICS = PASS
RETURN_IDENTITY_SEMANTICS = PASS
REPLACEMENT_SEMANTICS = PASS
ITEM_TYPE_IMMUTABILITY = PASS
KARAT_IMMUTABILITY = PASS
CURRENT_HISTORY_SATISFIES_CLIENT_REVISION = NO
REVISION_MINIMUM_GAP = One canonical Asset-linked arbitrary-item revision/evidence contract; no parallel identity.
COMMON_PROFILE_FIELDS = PARTIAL
TAG_PROFILE_PARITY = PARTIAL
STATUS_MAPPING = IMPLEMENTED_DIFFERENTLY
FUTURE_INTEGRATION_REQUIRES_BARCODE_REBUILD = NO
DUPLICATE_BARCODE_AUTHORITY = NO
CIRCULAR_DEPENDENCY = NO
SOURCE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
MIGRATIONS = 0
BUSINESS_DB_WRITES = 0
P0 = 0
P1 = 0
P2 = 4
P3 = 1
GATE = PASS_CLIENT_C1_BARCODE_EXACT_PARITY_READ_FIRST
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP — C1 complete. Owner review is required before any C2 decision.**
