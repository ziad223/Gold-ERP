# DARFUS ERP — A3 Barcode Identity Docker Candidate Semantic Authority Decision Report

هذا الـControl راجع ملف A3 فقط كقرار سلطة دلالية Read-Only. أُعيد التحقق من مرشح HEAD ومرشح Docker، وقورنت الـexports والمستهلكون والـformat والـhistory والـtransactions والـschema والـreports. النتيجة: مرشح Docker صالح ومتوافق دلاليًا مع السلطات اللاحقة والمستهلكين الحاليين، لكنه ليس جسم Source Freeze المؤرخ 2026-08-15، ولم يُقدّم في هذا Control تفويض Owner لقبول مصدر superseding مختلف. لذلك لا تتم استعادته الآن.

**Control ID:** `DARFUS-A3-BARCODE-IDENTITY-DOCKER-CANDIDATE-SEMANTIC-AUTHORITY-DECISION-01`  
**Mode:** `READ_ONLY_SEMANTIC_AUTHORITY_REVIEW_ONLY`  
**Project:** `I:\WORK\jewellery-erp-master`  
**Official DB:** `darfus_erp`  
**Date:** `2026-08-31`

## 1. Executive Summary

| Finding | Result | Evidence |
|---|---|---|
| Target scope | A3 only | `backend/src/services/barcode-identity.service.js` |
| Current worktree | Binary-corrupted | Current hash `2C3B2DEA...19C80EDD`; invalid UTF-8; 156 NUL; parse failed upstream |
| HEAD candidate | Valid but older/different | 9708 bytes; `E7E30B91...2EE0A9A42`; UTF-8/parse PASS |
| Docker candidate | Valid and semantically richer | 15956 bytes; `9411D7BF...7C8131D`; UTF-8/parse PASS |
| Exact 2026-08-15 Freeze body | Not recovered | Expected 10224 bytes; `E8BC622B...ED51928` |
| Docker semantic compatibility | PASS | Exports, current consumers, schema, format, scope, history, collision, transaction and profile checks |
| Owner acceptance of superseding source | Not granted in this review-only Control | `OWNER_APPROVAL = EXPLICIT_FOR_REVIEW_ONLY` |
| A3 authority decision | `REQUIRE_EXTERNAL_EXACT_FREEZE_BODY` | Conservative no-silent-choice rule |
| Recovery performed | NO | No copy into project; no file edit |

`GATE = BLOCKED_A3_EXACT_FREEZE_BODY_REQUIRED`

This Gate blocks source recovery only. It does not claim that the Docker candidate is a product defect; it records that the exact recorded Freeze body or an explicit Owner acceptance of the later packaged body is still required.

## 2. Exact A3 Evidence

| Evidence item | Value |
|---|---|
| Target | `backend/src/services/barcode-identity.service.js` |
| Current state | `BINARY_CORRUPTED` |
| Current size | 15956 bytes |
| Current SHA-256 | `2C3B2DEAC59BAB61EA7DDEABBCD4F70134FFCD8F3857FBA63D0702DF19C80EDD` |
| HEAD size | 9708 bytes |
| HEAD SHA-256 | `E7E30B91DD05B1539A909431EAAA5B76A327EC1B9A11A5C0C03B4512EE0A9A42` |
| Source Freeze date | 2026-08-15 |
| Source Freeze size | 10224 bytes |
| Source Freeze SHA-256 | `E8BC622BE5EA400630061C2F916B689384C32FC132ADC8B65A9D19154ED51928` |
| Freeze body available | NO; metadata only |
| Docker forensic path | `C:\DARFUS-RECOVERY-FORENSIC\20260831T\docker-image\barcode-identity.service.js` |
| Docker size | 15956 bytes |
| Docker SHA-256 | `9411D7BF9BE267007B785FD9D80AD000E5360A9D7FE6FBEE87841F0657C8131D` |
| Docker provenance | Unmounted, never-started forensic container from local image `jewellery-erp-master-backend:latest`; image layer created 2026-08-26 |

The current worktree and live backend bind-mounted copies are not recovery sources. The Docker copy was extracted only to the external forensic directory and was not copied back to the project.

## 3. Candidate Integrity Reverification

The candidates were read without modifying either source. Hashing used the Git object for HEAD and the preserved forensic file for Docker. Parsing used a VM syntax parse of the decoded source; no module was executed.

| Candidate | Size | SHA-256 | UTF8_VALID | NUL_COUNT | LINE_COUNT | NODE/VM_PARSE |
|---|---:|---|---|---:|---:|---|
| HEAD | 9708 | `E7E30B91DD05B1539A909431EAAA5B76A327EC1B9A11A5C0C03B4512EE0A9A42` | YES | 0 | 227 | PASS |
| Docker | 15956 | `9411D7BF9BE267007B785FD9D80AD000E5360A9D7FE6FBEE87841F0657C8131D` | YES | 0 | 336 | PASS |

Required upstream hashes were reproduced exactly. No `BLOCKED_CANDIDATE_EVIDENCE_CHANGED` condition occurred.

## 4. HEAD vs Docker Structural Diff

The comparison is semantic and summarized below; neither candidate was edited.

| Delta class | HEAD | Docker | Assessment |
|---|---|---|---|
| `ADDED_EXPORTS` | None | `resolveKaratCodeForProfile`, `replaceAssetBarcode`, `BARCODE_HISTORY_STATE`, `BARCODE_HISTORY_ACTION` | Later identity/history contract |
| `REMOVED_EXPORTS` | — | None | No HEAD export removed |
| `SIGNATURE_CHANGES` | `generateBarcodeForAsset` accepts `inventorySubtype` | Adds `inventoryProfile`; resolves profile-specific karat/item policy | Backward-compatible addition; current route already passes `inventoryProfile` |
| `NEW_CONSTANTS` | No history constants | ACTIVE/RETIRED and INITIAL/REPLACEMENT constants | Matches current history schema |
| `NEW_HELPERS` | No profile resolver/replacement service | `resolveKaratCodeForProfile`, `replaceAssetBarcode` | Required by current replacement consumer and loose-profile rules |
| `NEW_DB_READS` | Asset collision only | Asset collision plus `asset_barcode_history` collision and locked active-history read | Strengthens historical identity protection |
| `NEW_DB_WRITES` | No replacement operation | Retires history, updates same Asset, inserts next history row | Scoped to canonical replacement transaction |
| `NEW_LOCKING` | No replacement lock | `FOR UPDATE` on active Asset barcode history | Prevents concurrent replacement inconsistency |
| `NEW_TRANSACTIONAL_BEHAVIOR` | Sequence allocation transaction | Replacement requires caller transaction and route rolls back on error | No regression; stronger replacement atomicity |
| `NEW_ERROR_CODES` | Generic validation/conflict messages | Loose profile code/item/karat errors and history conflict errors | Explicit fail-closed semantics |
| `NEW_VALIDATION` | Inventory/item/karat normalization | Enforces loose profile `00`, `DD/GS/PL`, and `LOS` mappings | Compatible with frozen profile authority |
| `NEW_HISTORY_BEHAVIOR` | `barcodeRevision` returned on initial generation | Permanent initial/replacement history integration | Matches migration/model/triggers |
| `NEW_NON_REUSE_RULES` | Asset collision only | Asset plus history collision | Stronger than HEAD |
| `NEW_PROFILE_RULES` | No reliable profile-based karat resolution | `LOOSE_DIAMOND`, `LOOSE_GEMSTONE`, `LOOSE_PEARL` resolve to `00` and `LOS` | Matches later C1/profile evidence |
| `NEW_COMPANY_SCOPE_RULES` | Company-scoped settings/sequence | Same plus replacement company assertion and history company attribution | Preserved |

## 5. Export Contract

`HEAD_EXPORTS`:

```text
formatBarcode
validateInventoryCode
validateItemCode
normalizeKaratCode
getEffectiveBarcodeSettings
allocateBarcodeSerial
generateBarcodeForAsset
isCodeUsed
getCodeUsageSummary
```

`DOCKER_EXPORTS`:

```text
formatBarcode
validateInventoryCode
validateItemCode
normalizeKaratCode
resolveKaratCodeForProfile
getEffectiveBarcodeSettings
allocateBarcodeSerial
generateBarcodeForAsset
replaceAssetBarcode
BARCODE_HISTORY_STATE
BARCODE_HISTORY_ACTION
isCodeUsed
getCodeUsageSummary
```

All nine HEAD exports remain present in Docker. Docker adds four exports and removes none.

### Current consumer expectations

The current source has 15 direct import/read consumers. Runtime consumers include:

- `backend/src/controllers/erp.controller.js`: `generateBarcodeForAsset`;
- `backend/src/routes/erp.routes.js`: generation, validation, settings, usage, and `replaceAssetBarcode`;
- eight profile routes: `getEffectiveBarcodeSettings`;
- `backend/src/services/cgp-inventory-consumer.service.js`: `generateBarcodeForAsset`;
- `backend/seeders/client-demo/index.js`: `generateBarcodeForAsset`.

Verification/test consumers read or assert the same export and history contract.

| Compatibility check | Result | Evidence |
|---|---|---|
| Docker preserves all HEAD exports | PASS | Export comparison above |
| Current replacement route gets required export | PASS for Docker / FAIL for HEAD | `erp.routes.js:5998` calls `replaceAssetBarcode`; HEAD does not export it |
| Current receive passes profile authority | PASS for Docker / incomplete for HEAD | `erp.routes.js:9004` passes `inventoryProfile`; Docker resolves it |
| Current profile routes retain settings API | PASS | `getEffectiveBarcodeSettings` retained |
| Current tests’ expected history symbols | PASS for Docker / FAIL for HEAD | `tests/barcode-final-closure.test.cjs` asserts replacement/history symbols |

`EXPORT_COMPATIBILITY = PASS`  
`CURRENT_CONSUMER_COMPATIBILITY = PASS_FOR_DOCKER_CANDIDATE; HEAD_IS_NOT_COMPATIBLE_WITH_CURRENT_REPLACEMENT_CONSUMER`

## 6. Barcode Format Authority

Both HEAD and Docker construct the core barcode as:

```text
INVENTORY_CODE + ITEM_CODE + TWO_DIGIT_KARAT + SIX_DIGIT_SERIAL
```

| Format dimension | HEAD | Docker | Result |
|---|---|---|---|
| Inventory code | normalized uppercase, 2–6 letters/digits | same | Preserved |
| Item code | normalized uppercase, 2–6 letters/digits | same | Preserved |
| Karat | normalized `00`–`99`, two digits | same core normalization; profile resolver added | Preserved with profile guard |
| Serial | integer 1–999999, `padStart(6)` | same | Preserved |
| Sequence scope | company + inventory + item + karat UPSERT | same | Preserved |
| Asset collision | checks non-paranoid Asset rows | same plus history | Stronger |
| Company settings | `companyId` | `companyId` | Preserved |
| Barcode string format | unchanged | unchanged | No format change |

`BARCODE_FORMAT_CHANGED = NO`

No later candidate change alters the canonical string format. Docker only adds profile-aware input selection before the same formatter.

## 7. ERG/NCK Compatibility

The frozen/current barcode authority is:

```text
D02_EARRINGS_CODE = ERG
D03_NECKLACE_CODE = NCK
```

The service does not replace the configured item taxonomy with display labels. It reads company-scoped database settings, validates the selected item code, and applies allowed-inventory-code rules. The current accepted defaults/source evidence contains `ERG = Earrings` and `NCK = Necklace`; no `ERR`/`NLC` remapping is introduced by Docker.

| Check | Result | Evidence |
|---|---|---|
| `ERG_COMPATIBILITY` | PASS | Current accepted defaults/tests use `ERG`; Docker preserves database-backed item resolution and does not introduce `ERR` |
| `NCK_COMPATIBILITY` | PASS | Current accepted defaults/tests use `NCK`; Docker does not introduce `NLC` |
| Format change for ERG/NCK | NO | Formatter unchanged |
| Second barcode authority | NO | Docker remains the same central service |

The stale pre-approval wording still present in `CLIENT_REQUIREMENTS_BATCH_A_FROZEN_OWNER_DECISIONS.md` was not used to override the current Control’s explicit D02/D03 frozen inputs and later C1 accepted evidence. No documentation reconciliation was performed in this A3-only Control.

## 8. Barcode History Compatibility

### Current schema and model

Read-only inspection found:

- model `backend/src/models/assetBarcodeHistory.model.js` with `asset_id`, `company_id`, `barcode`, `barcode_revision`, `state`, `action`, issue/retirement actor and timestamps, reason, source type and source ID;
- migration `backend/migrations/20260817010000-barcode-replacement-status-foundation.js` creating `asset_barcode_history`;
- state constraint `ACTIVE/RETIRED`;
- action constraint `INITIAL/REPLACEMENT`;
- revision check `barcode_revision >= 1`;
- unique historical barcode index `asset_barcode_history_barcode_uq`;
- unique `(asset_id, barcode_revision)` index;
- partial one-active-per-Asset index;
- company/asset/time index;
- Asset insert trigger creating initial history;
- Asset barcode immutability trigger outside the controlled replacement capability.

The Docker SQL uses fields and states that exist in the current model/migration. It does not require an unproven schema.

| Required result | Actual |
|---|---|
| `BARCODE_HISTORY_TABLE_AUTHORITY` | `PROVEN` |
| `BARCODE_HISTORY_STATE_COMPATIBILITY` | `PASS` |
| `BARCODE_HISTORY_ACTION_COMPATIBILITY` | `PASS` |
| `REPLACEMENT_FLOW_COMPATIBILITY` | `PASS` |
| `DOCKER_REFERENCES_EXISTING_SCHEMA` | `YES` |

## 9. Non-Reuse Guarantee

HEAD checks `assets.barcode` including non-paranoid rows before accepting a generated value. Docker retains that check and also queries `asset_barcode_history` for any historical value. A retired Barcode therefore remains a collision and is not regenerated; sequence gaps are allowed, reuse is not.

| Dimension | Result |
|---|---|
| Active Asset collision | Preserved |
| Retired history collision | Added by Docker |
| Global historical uniqueness | Backed by `asset_barcode_history_barcode_uq` and generator lookup |
| Replacement old identity | Retired, never deleted |
| New identity | New active history row for same Asset |
| Reprint behavior | Not changed by this service |
| `NON_REUSE_GUARANTEE` | `STRONGER_THAN_HEAD` |

`NON_REUSE_NOT_REGRESSED = YES`

## 10. Sequence / Company Scope

Both candidates allocate with:

```text
ON CONFLICT (company_id, inventory_code, item_code, karat_code)
DO UPDATE SET last_serial = barcode_sequences.last_serial + 1
RETURNING last_serial
```

The Docker candidate preserves `companyId` in settings reads, sequence allocation, Asset generation, and history replacement. It also rejects replacement when `asset.companyId !== companyId`.

| Check | Result |
|---|---|
| `SEQUENCE_SCOPE_COMPATIBILITY` | PASS |
| `COMPANY_SCOPE_PRESERVED` | YES |
| Branch scope | Not owned by this service; supplied by caller/routes as existing architecture |
| Cross-company collision | Docker’s Asset/history barcode checks remain global for identity values |

## 11. Transaction Safety

### Generation

Docker retains HEAD’s transaction behavior: if a caller transaction is supplied, sequence allocation and collision checks use it; otherwise the service opens and commits/rolls back its own sequence transaction.

### Replacement

Docker’s replacement service requires a transaction. The current route:

1. opens a transaction;
2. resolves and locks the company/branch-scoped Asset;
3. claims the idempotency key;
4. locks the current `ACTIVE` history row with `FOR UPDATE`;
5. retires the old row;
6. updates the same Asset under the transaction-local replacement capability;
7. inserts the next active history row;
8. records the Asset event and audit evidence;
9. succeeds the idempotency record and commits;
10. rolls back if any step fails.

The service rejects a missing transaction before performing a replacement. The route rolls back on errors and does not expose a partially committed history/Asset identity pair.

| Required result | Actual |
|---|---|
| `ATOMIC_REPLACEMENT` | YES in canonical route |
| `PARTIAL_HISTORY_WRITE_RISK` | NO in canonical transaction; direct service use without transaction is rejected |
| `TRANSACTION_SAFETY` | PASS / NOT REGRESSED |

No transaction was executed in this Control.

## 12. Collision Handling

| Coverage | HEAD | Docker |
|---|---|---|
| Format/input validation | Inventory/item/karat | Same plus loose-profile enforcement |
| Sequence concurrency | PostgreSQL scoped UPSERT | Same |
| Asset collision | Non-paranoid Asset check | Same |
| Historical collision | None in service | `asset_barcode_history` lookup |
| Duplicate historical value | Not handled by HEAD service | DB unique historical barcode index plus lookup |
| Active replacement row | No replacement operation | Locked active-history cardinality check |
| Retired state | No service history | Old row becomes `RETIRED`, never reused |

`COLLISION_COVERAGE_HEAD = ASSET_ROW_COLLISION_AND_TRANSACTIONAL_SEQUENCE`  
`COLLISION_COVERAGE_DOCKER = ASSET_ROW_PLUS_ACTIVE_AND_RETIRED_HISTORY_COLLISION_WITH_LOCKED_REPLACEMENT`  
`DOCKER_COLLISION_SAFETY = IMPROVED`

## 13. Loose Profile Rules

The current accepted profile authority uses the client inventory codes `DD`, `GS`, and `PL`, and loose item code `LOS`. Docker explicitly validates:

| Profile | Required Docker behavior | Result |
|---|---|---|
| `LOOSE_DIAMOND` | inventory `DD`, item `LOS`, karat `00` | COMPATIBLE |
| `LOOSE_GEMSTONE` | inventory `GS`, item `LOS`, karat `00` | COMPATIBLE |
| `LOOSE_PEARL` | inventory `PL`, item `LOS`, karat `00` | COMPATIBLE |

The service rejects a non-`00` supplied loose-profile karat and does not invent a different business profile. This matches the later C1/profile accepted evidence and current receive consumers.

```text
LOOSE_DIAMOND_RULE = COMPATIBLE
LOOSE_GEMSTONE_RULE = COMPATIBLE
LOOSE_PEARL_RULE = COMPATIBLE
LOOSE_PROFILE_COMPATIBILITY = YES
```

## 14. Consumer Inventory

`CONSUMER_COUNT = 15` direct import/read files were identified:

| Consumer group | Files / paths | Expected functions |
|---|---|---|
| Core receive/controller | `backend/src/controllers/erp.controller.js`, `backend/src/routes/erp.routes.js` | `generateBarcodeForAsset`, validators, settings, usage, `replaceAssetBarcode` |
| Profile routes | `diamond-jewellery-profile.routes.js`, `gem-stone-jewellery-profile.routes.js`, `gold-by-piece-profile.routes.js`, `gold-by-weight-profile.routes.js`, `loose-diamond-profile.routes.js`, `loose-gemstone-profile.routes.js`, `loose-pearl-profile.routes.js`, `pearl-jewellery-profile.routes.js` | `getEffectiveBarcodeSettings`; eight profile routes |
| CGP inventory | `backend/src/services/cgp-inventory-consumer.service.js` | `generateBarcodeForAsset` |
| Demo seeder | `backend/seeders/client-demo/index.js` | `generateBarcodeForAsset` |
| Static verifier | `scripts/verify-barcode-inventory-foundation.js` | format/export/sequence assertions |
| Existing tests | `tests/barcode-final-closure.test.cjs`, `tests/loose-pearl-minimum-safe-implementation.test.cjs` | history/format/profile source contract |

The runtime route at `erp.routes.js:5998` directly requires `replaceAssetBarcode`. This is a decisive compatibility difference: HEAD does not export it, while Docker does.

## 15. Consumer Compatibility

| Expected function/contract | HEAD support | Docker support | Result |
|---|---|---|---|
| `formatBarcode` | YES | YES | PASS |
| `validateInventoryCode` | YES | YES | PASS |
| `validateItemCode` | YES | YES | PASS |
| `normalizeKaratCode` | YES | YES | PASS |
| `getEffectiveBarcodeSettings` | YES | YES | PASS |
| `allocateBarcodeSerial` | YES | YES | PASS |
| `generateBarcodeForAsset` | YES, but no profile resolver | YES, profile-aware | Docker matches current caller intent |
| `isCodeUsed` | YES | YES | PASS |
| `getCodeUsageSummary` | YES | YES | PASS |
| `replaceAssetBarcode` | NO | YES | Docker required by current route |
| History constants | NO | YES | Docker matches history tests/contracts |

`CURRENT_CONSUMER_COMPATIBILITY = PASS_FOR_DOCKER_CANDIDATE`

## 16. Current Schema / Migration Compatibility

No schema inference was used. Read-only source evidence proves Docker’s referenced schema exists in current source:

| Docker reference | Current source proof | Result |
|---|---|---|
| `asset_barcode_history` | `assetBarcodeHistory.model.js`; migration `20260817010000-barcode-replacement-status-foundation.js` | YES |
| `asset_id` / active row | model + one-active index + replacement `FOR UPDATE` query | YES |
| `barcode_revision` | Asset model, history model, unique asset/revision index | YES |
| `state` ACTIVE/RETIRED | migration check constraint | YES |
| `action` INITIAL/REPLACEMENT | migration check constraint | YES |
| retirement fields/reason | model and migration | YES |
| source type/id | model and migration | YES |
| Asset immutability capability | migration trigger and replacement transaction-local setting | YES |

`DOCKER_REFERENCES_EXISTING_SCHEMA = YES`

No migration was executed or created.

## 17. Historical Authority Evidence

Historical reports are supporting evidence only and do not replace the missing Freeze body.

| Report | Date/context | Claim | Supports HEAD | Supports Docker semantics |
|---|---|---|---|---|
| `docs/DARFUS_BARCODE_FINAL_CLOSURE_REPORT.md` | Prior Barcode closure | Server/database-backed generation, ERG/NCK, history, replacement, non-reuse, transaction and route authority | Partly; HEAD covers core format only | YES; history/replacement/profile behavior matches Docker |
| `docs/client-requirements/DARFUS_CLIENT_C1_BARCODE_EXACT_PARITY_READ_FIRST_01_REPORT.md` | C1 read-only closure | Frozen ERG/NCK, Asset identity, history, replacement, loose `00/LOS`, no separate revision authority | Partly | YES |
| `docs/client-requirements/DARFUS_CLIENT_C1_BARCODE_REVISION_CAPABILITY.md` | C1 capability record | Existing history is Barcode replacement authority; no parallel identity; D04 history-first | Partly | YES |
| `docs/client-requirements/DARFUS_CLIENT_C1_BARCODE_STATUS_TAG_MAPPING.md` | C1 field/status mapping | Asset + active history identity, return/reprint/replacement continuity | Partly | YES |
| `docs/acceptance/DARFUS_ADDITIONAL_SOURCE_BINARY_CORRUPTION_RECOVERY_SOURCE_SELECTION_01_REPORT.md` | 2026-08-31 recovery discovery | A3 HEAD valid but Freeze-modified body missing; Docker candidate later found by this Control | YES as older base only | Supports Docker as a candidate, not exact Freeze |

`LATER_AUTHORITY_SUPPORT = YES` for Docker semantics. No report claims that Docker SHA is the exact 2026-08-15 body.

## 18. Timeline

| Evidence point | Time | Meaning |
|---|---|---|
| A3 latest committed HEAD source | 2026-08-04 11:12:04 +03 (`b0e5fa7`) | Valid older committed base |
| Source Freeze metadata | 2026-08-15 | Records 10224-byte modified body, SHA `E8BC...`; body unavailable |
| Docker candidate file metadata | 2026-08-22 | Candidate body timestamp in image extraction |
| Docker image build | 2026-08-26 16:37:45Z | Image layer packaged source with `COPY . .` |
| Current corruption observation | 2026-08-31 | Worktree/live bind body invalid |

Required date conclusions:

```text
DOCKER_CANDIDATE_IS_LATER_THAN_FREEZE = YES (filesystem/image evidence; correctness not implied)
DOCKER_CANDIDATE_IS_LATER_THAN_HEAD = YES (filesystem/image evidence; correctness not implied)
```

Dates establish chronology only. They do not establish that the Docker body was the intended Owner-approved Freeze body.

## 19. Test Evidence Classification

No DB-dependent or product runtime tests were executed in this Control.

| Test/tool | Classification | Reason / safe disposition |
|---|---|---|
| VM syntax parse of HEAD/Docker candidates | `STATIC_SAFE` | Reads isolated source bytes; no module execution or DB |
| `tests/barcode-final-closure.test.cjs` | `STATIC_SAFE` in intended design, but current target body is corrupt | Reads source/migration/UI strings; do not claim product pass from current corrupted file |
| `scripts/verify-barcode-inventory-foundation.js` | `STATIC_SAFE` for pure source/format assertions, but not run | Includes Git/source checks; later execution must be reviewed against current dirty worktree |
| `tests/asset-final-closure.test.cjs` | `STATIC_SAFE` by test purpose, but target body is corrupt/unrecoverable | Not executed; A8 remains unresolved |
| `tests/c2c3-revision-ui.test.cjs` | `STATIC_SAFE` source/UI contract | Not necessary for this A3 decision |
| `tests/rfid-final-closure.test.cjs` | `STATIC_SAFE` source contract | Not necessary for this A3 decision |
| Backend verifier/seed scripts | `DISPOSABLE_DB_REQUIRED` or `OFFICIAL_DB_RISK` depending on script | Not run; no DB access permitted |

`FOCUSED_TEST_EXECUTION = NOT_RUN_BY_CONTROL_DESIGN`

## 20. Semantic Delta Matrix

| Area | HEAD | Docker | Later Authority Support | Risk | Decision signal |
|---|---|---|---|---|---|
| Public exports | 9 exports | 13 exports; no removals | Current route requires Docker additions | HEAD route failure | Docker favored |
| Barcode format | Inventory + item + 2-digit karat + 6-digit serial | Same | C1/client format | No format drift | Equal |
| Company scope | Settings/sequence company-scoped | Same plus replacement assertion/history company | Frozen company authority | Low | Pass |
| Sequence scope | Company/inventory/item/karat UPSERT | Same | Accepted concurrency contract | No regression | Pass |
| Asset collision | Non-paranoid Asset check | Same | Accepted identity contract | Low | Docker not weaker |
| History collision | Not in service | Asset plus history | Accepted non-reuse contract | HEAD could reuse retired history | Docker stronger |
| Non-reuse | Asset-only | Asset + permanent history | C1/barcode closure | Identity reuse risk in HEAD | Docker stronger |
| Barcode revision | Initial `barcodeRevision` only | Replacement increments and histories | Current replacement route/history | HEAD missing replacement export | Docker required |
| Replace barcode | Not exported | Transactional service | Current route and closure | HEAD runtime incompatibility | Docker required |
| Transaction behavior | Generation sequence transaction | Same plus replacement transaction/locks | Migration/triggers/route | Direct unwrapped service rejected | Pass |
| Loose diamond | No reliable profile resolution | `DD/LOS/00` | Later profile authority | Wrong profile/karat risk in HEAD | Docker favored |
| Loose gemstone | No reliable profile resolution | `GS/LOS/00` | Later profile authority | Same | Docker favored |
| Loose pearl | No reliable profile resolution | `PL/LOS/00` | Later profile authority | Same | Docker favored |
| Error semantics | Generic validation/conflict | Explicit profile/history errors | Fail-closed architecture | None introduced | Pass |
| Consumer compatibility | Missing current replacement export | Complete current expectations | Current `erp.routes.js` | HEAD would fail at replacement boundary | Docker required |

## 21. Acceptance Conditions

| Condition | Actual | Satisfied |
|---|---|---|
| `DOCKER_HASH_REVERIFIED` | Yes | YES |
| `DOCKER_PARSE` | PASS | YES |
| `EXPORT_COMPATIBILITY` | PASS | YES |
| `CURRENT_CONSUMER_COMPATIBILITY` | PASS for Docker | YES |
| `COMPANY_SCOPE_PRESERVED` | YES | YES |
| `SEQUENCE_SCOPE_COMPATIBILITY` | PASS | YES |
| `DOCKER_REFERENCES_EXISTING_SCHEMA` | YES | YES |
| `BARCODE_HISTORY_TABLE_AUTHORITY` | PROVEN | YES |
| `NON_REUSE_NOT_REGRESSED` | YES; stronger | YES |
| `COLLISION_SAFETY_NOT_REGRESSED` | YES; improved | YES |
| `TRANSACTION_SAFETY_NOT_REGRESSED` | YES | YES |
| `ERG_NCK_COMPATIBILITY` | PASS | YES |
| `LOOSE_PROFILE_RULES_COMPATIBLE` | YES | YES |
| `LATER_ACCEPTED_AUTHORITY_SUPPORTS_DOCKER_SEMANTICS` | YES | YES |
| Exact 2026-08-15 Freeze body | Missing | NO |
| Owner acceptance of superseding body in this Control | Not provided; review-only approval | NO |

The technical/semantic conditions support the Docker candidate as a strong superseding candidate. The authority condition needed to label it accepted is not present in this review-only Control.

## 22. A3 Authority Decision

```text
A3_AUTHORITY_DECISION = REQUIRE_EXTERNAL_EXACT_FREEZE_BODY
```

### Decision basis

- Docker is semantically compatible and is more complete than HEAD for the current source consumers.
- HEAD-only is rejected because the current replacement route calls an export absent from HEAD, and current receive callers pass profile information that HEAD does not resolve.
- The exact 2026-08-15 Freeze body is not available.
- `OWNER_APPROVAL = EXPLICIT_FOR_REVIEW_ONLY`; no Owner acceptance of a superseding later packaged source was supplied in this Control.
- Accepting Docker as Owner authority would therefore be a silent authority choice, which is forbidden.

### What this does not mean

This is not a rejection of Docker’s implementation quality. It is a provenance/authority blocker. A future Owner-approved decision may either:

1. supply the exact 10224-byte Freeze body; or
2. explicitly accept the preserved Docker file as `LATER_PACKAGED_SEMANTICALLY_COMPATIBLE_SOURCE`.

No option authorizes copying the file into the project in this Control.

## 23. A8 Unchanged Note

```text
A8 = tests/asset-final-closure.test.cjs
A8_STATUS = UNRESOLVED_UNCHANGED
```

A8 was not reconstructed, edited, executed, or inferred from reports. This A3-only Control does not change its disposition.

## 24. Product Runtime Recovery Readiness

| Readiness dimension | Result | Reason |
|---|---|---|
| A3 Docker semantic candidate | YES | All technical semantic checks passed |
| A3 accepted recovery authority | NO | Exact Freeze body missing and no Owner superseding acceptance |
| Product runtime source recovery ready | NO | A3 source cannot be restored under current authority |
| Exact all-11 historical recovery ready | NO | A3 exact Freeze body and A8 remain unresolved; no file recovery performed |
| A8 test-only source recovered | NO | Unchanged unresolved |

```text
PRODUCT_RUNTIME_SOURCE_RECOVERY_READY = NO
EXACT_ALL_11_HISTORICAL_RECOVERY_READY = NO
```

## 25. Owner Decision Packet

```text
TARGET = backend/src/services/barcode-identity.service.js

HEAD_SHA256 = E7E30B91DD05B1539A909431EAAA5B76A327EC1B9A11A5C0C03B4512EE0A9A42
FREEZE_SHA256 = E8BC622BE5EA400630061C2F916B689384C32FC132ADC8B65A9D19154ED51928
FREEZE_BODY_RECOVERED = NO
DOCKER_SHA256 = 9411D7BF9BE267007B785FD9D80AD000E5360A9D7FE6FBEE87841F0657C8131D
DOCKER_SOURCE = C:\DARFUS-RECOVERY-FORENSIC\20260831T\docker-image\barcode-identity.service.js

DOCKER_SEMANTIC_DELTA =
  Adds barcode history state/action constants, loose-profile resolver,
  DD/GS/PL + LOS/00 validation, historical collision checks, locked
  transactional replacement, permanent non-reuse protection, and the
  replaceAssetBarcode export; preserves all HEAD exports and core format.

BARCODE_HISTORY_COMPATIBILITY = PASS
NON_REUSE_COMPATIBILITY = STRONGER_THAN_HEAD
TRANSACTION_COMPATIBILITY = PASS
CONSUMER_COMPATIBILITY = PASS_FOR_DOCKER; HEAD_FAILS_CURRENT_REPLACEMENT_EXPORT
FROZEN_BARCODE_AUTHORITY_COMPATIBILITY = PASS

A3_AUTHORITY_DECISION = REQUIRE_EXTERNAL_EXACT_FREEZE_BODY
PRODUCT_BEHAVIOR_CHANGE_INTENDED = NO_NEW_CHANGE
RECOVERY_OF_LATER_PACKAGED_BEHAVIOR_ONLY_IF_OWNER_ACCEPTED = YES
SOURCE_RECOVERY_PERFORMED = NO
PROPOSED_NEXT_CONTROL = DARFUS-ALL-CORRUPTED-PRODUCT-SOURCE-CONTROLLED-RECOVERY-01
OWNER_APPROVAL_REQUIRED = YES
```

## 26. Gate

`GATE = BLOCKED_A3_EXACT_FREEZE_BODY_REQUIRED`

### Gate basis

- The preserved Docker candidate passes all technical semantic acceptance checks.
- The exact Source Freeze body required by the recorded 2026-08-15 authority was not recovered.
- This Control grants review approval only, not superseding-source acceptance or recovery approval.
- The current HEAD candidate is not selected because it lacks the current replacement export and later profile/history behavior.
- No source recovery, product change, migration, seed, DB access, or runtime start occurred.

## 27. Final Tokens

```text
CURRENT_CONTROL = DARFUS-A3-BARCODE-IDENTITY-DOCKER-CANDIDATE-SEMANTIC-AUTHORITY-DECISION-01
MODE = READ_ONLY_SEMANTIC_AUTHORITY_REVIEW_ONLY
TARGET = backend/src/services/barcode-identity.service.js

CURRENT_WORKTREE_STATE = BINARY_CORRUPTED
HEAD_SHA256 = E7E30B91DD05B1539A909431EAAA5B76A327EC1B9A11A5C0C03B4512EE0A9A42
HEAD_UTF8_VALID = YES
HEAD_NUL_COUNT = 0
HEAD_PARSE = PASS
HEAD_LINE_COUNT = 227

FREEZE_SHA256 = E8BC622BE5EA400630061C2F916B689384C32FC132ADC8B65A9D19154ED51928
FREEZE_BODY_RECOVERED = NO

DOCKER_SHA256 = 9411D7BF9BE267007B785FD9D80AD000E5360A9D7FE6FBEE87841F0657C8131D
DOCKER_HASH_REVERIFIED = YES
DOCKER_UTF8_VALID = YES
DOCKER_NUL_COUNT = 0
DOCKER_PARSE = PASS
DOCKER_LINE_COUNT = 336

EXPORT_COMPATIBILITY = PASS
BARCODE_FORMAT_CHANGED = NO
ERG_COMPATIBILITY = PASS
NCK_COMPATIBILITY = PASS
BARCODE_HISTORY_TABLE_AUTHORITY = PROVEN
BARCODE_HISTORY_STATE_COMPATIBILITY = PASS
BARCODE_HISTORY_ACTION_COMPATIBILITY = PASS
REPLACEMENT_FLOW_COMPATIBILITY = PASS
NON_REUSE_GUARANTEE = STRONGER_THAN_HEAD
NON_REUSE_COMPATIBILITY = STRONGER_THAN_HEAD
COMPANY_SCOPE_PRESERVED = YES
SEQUENCE_SCOPE_COMPATIBILITY = PASS
ATOMIC_REPLACEMENT = YES
PARTIAL_HISTORY_WRITE_RISK = NO
TRANSACTION_SAFETY = PASS_NOT_REGRESSED
COLLISION_SAFETY = IMPROVED
LOOSE_DIAMOND_RULE = COMPATIBLE
LOOSE_GEMSTONE_RULE = COMPATIBLE
LOOSE_PEARL_RULE = COMPATIBLE
LOOSE_PROFILE_COMPATIBILITY = YES
CONSUMER_COUNT = 15
CURRENT_CONSUMER_COMPATIBILITY = PASS_FOR_DOCKER; HEAD_INCOMPATIBLE_WITH_CURRENT_REPLACEMENT_CONSUMER
DOCKER_REFERENCES_EXISTING_SCHEMA = YES
LATER_AUTHORITY_SUPPORT = YES
DOCKER_CANDIDATE_IS_LATER_THAN_FREEZE = YES
DOCKER_CANDIDATE_IS_LATER_THAN_HEAD = YES

FOCUSED_TEST_EXECUTION = NOT_RUN_BY_CONTROL_DESIGN
A8_STATUS = UNRESOLVED_UNCHANGED
PRODUCT_RUNTIME_SOURCE_RECOVERY_READY = NO
EXACT_ALL_11_HISTORICAL_RECOVERY_READY = NO

A3_AUTHORITY_DECISION = REQUIRE_EXTERNAL_EXACT_FREEZE_BODY
SOURCE_FILES_MODIFIED = 0
GIT_MUTATIONS = 0
DATABASE_WRITES = 0
MIGRATIONS_EXECUTED = 0
OWNER_APPROVAL_REQUIRED = YES
GATE = BLOCKED_A3_EXACT_FREEZE_BODY_REQUIRED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_SUPPLY_EXACT_FREEZE_BODY_OR_EXPLICITLY_ACCEPT_DOCKER_AS_SUPERSEDING_SOURCE_BEFORE_CONTROLLED_RECOVERY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP.** لا يتم نسخ Docker candidate إلى المشروع، ولا استعادة A3، ولا تشغيل Migration أو Seed أو Backend acceptance أو أي Control تالٍ.
