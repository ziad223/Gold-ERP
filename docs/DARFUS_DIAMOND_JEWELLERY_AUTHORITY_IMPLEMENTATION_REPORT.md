# DARFUS ERP — Diamond Jewellery Authority Implementation + Source Closure Report

## Executive Summary

تم تنفيذ مصدر وواجهة Diamond Jewellery فقط، مع إبقاء `darfus_erp` دون كتابة ودون تنفيذ Receive أو إنشاء PO/Asset/Barcode/RFID/Journal. نجحت اختبارات التحقق المركزة و`npm run typecheck`. الفحص البصري لمرجع العميل اكتمل على الصفحات 1–82، ولم توجد جداول أو text boxes أو shapes أو images تحمل متطلبات إضافية خارج النص المستخرج.

الـbackend الموجود على `localhost:8000` بدأ قبل إضافة route الجديدة، ولذلك ما زال يعيد `404 ROUTE_NOT_FOUND` للعقد الجديد. لم أُعد تشغيله لأن أمر compose الحالي يشغل migrations عند الإقلاع. هذه فجوة runtime بيئية موثقة، وليست دليلًا على فشل مصدر Diamond الجديد. لم يتم تجاوزها بأي mutation أو تغيير DB.

الحالة النهائية لهذه المرحلة:

```text
DIAMOND_SOURCE_AND_UI_READY = YES (static/source/typecheck)
DIAMOND_JEWELLERY_RUNTIME_ACCEPTANCE = BLOCKED_STALE_BACKEND_RUNTIME
DIAMOND_JEWELLERY_FINAL_CLOSED = NO
OWNER_RUNTIME_AUTHORIZATION = NOT_PROVIDED
OFFICIAL_DB_WRITES = 0
GATE = BLOCKED_DIAMOND_JEWELLERY_RUNTIME_AUTHORIZATION_REQUIRED
```

## Authority Hierarchy

| Authority | Role in this batch | Result |
|---|---|---|
| `Diamond (Jewellery  Loose Stone).docx` | Primary business requirements for Diamond Jewellery | Read completely and used literally |
| Execution prompt | Scope, safety, architecture, evidence, and gate instructions | Applied as control; not converted into extra business fields |
| Frozen DARFUS architecture | Asset/Barcode/Supplier V2/Tax/RBAC/Accounting/Idempotency constraints | Preserved |
| Current source and official DB | Runtime capability and current-state evidence | Read-only reality; no DB provisioning |

The four other profile documents were not used to derive Diamond business rules. Existing shared source constants that predate this batch were treated as current source evidence, not as authority to import another profile’s rules.

## Client Requirements Applied

The reference was read from first page to final page and rendered visually with LibreOffice:

| Coverage item | Evidence |
|---|---|
| DOCX page count | 82 pages |
| OOXML paragraphs | 982 |
| Tables / drawings / text boxes / images | 0 / 0 / 0 / 0 in the DOCX package |
| Visual verification | Pages 1–82 inspected; layout matched extracted text |
| Unmapped visual requirements | 0 |
| `VISUAL_VERIFICATION` | `COMPLETE` |

The DOCX is text-only in the package and rendered pages; no page contained an additional table, callout, image, screenshot, or shape requirement missed by extraction order.

## Conflict Resolution Matrix

| Conflict / gap | Reference says | Current source/DB says | Resolution |
|---|---|---|---|
| Top-level cost authority | Jewellery is one top-level asset containing gold and 1..N diamond components; separate loose flow is distinct | Previous forensic evidence had an unresolved cost question | Resolved in source as `DIAMOND_JEWELLERY` with embedded components; no Loose Diamond implementation |
| Physical identity | One Jewellery piece is one serialized Asset with canonical barcode | Existing Asset/V2 authority is present | Preserved; Product quantity is not used |
| Gold rate | Historical purchase price is manual; current rate is Gold Center | Gold Center runtime health is healthy, but current backend process lacks new route | Source uses manual historical input and Gold Center current rate; runtime proof deferred |
| Component master data | Required selectable stone properties are reference-backed | Existing DB master rows may be incomplete or use older labels; no seed allowed | Contract exposes source-backed lists and current masters; no provisioning in this batch |
| Runtime access | Dedicated read-only contract/preview must be verifiable | Main backend returns 404 because it is stale | Stop at gate; no restart/migration/mutation |

No unresolved P0/P1 business-rule conflict was silently chosen. A later runtime issue must be resolved only after Owner authorization for controlled runtime verification.

## Previous Forensic Gap → Implementation Mapping

| Previous gap | Minimum source closure |
|---|---|
| No dedicated Diamond Jewellery contract | Added `diamond-jewellery-profile.routes.js` `GET /inventory-v2/diamond-jewellery/contract` |
| No dedicated preview authority | Added read-only `POST /inventory-v2/diamond-jewellery/preview` |
| Generic component validation accepted incomplete diamonds | Added `diamond-jewellery-profile.service.js` and V2 normalization gate |
| CT and K could be confused | Separate `totalDiamondWeight`/`stoneCaratWeight` in CT and numeric karat validation |
| No exact CT reconciliation | Server rejects `DIAMOND_COMPONENT_CARAT_TOTAL_MISMATCH` |
| No certificate authority requirement | Certificate number requires authority; runtime duplicate lookup is company + authority scoped |
| Optional stone cost semantics unclear | Missing component cost remains `null` in normalized component data and contributes zero to aggregate cost |
| No unified Diamond intake route | Added `/ar|en/inventory/diamond-jewellery` and chooser link |
| Risk of final receive during source work | New page has no `/purchase-orders/receive` call and displays final receive as stopped |

## Profile / Item Codes / Barcode

`DIAMOND_JEWELLERY` is the only Diamond profile enabled by this batch. `LOOSE_DIAMOND` remains excluded from the chooser and page implementation.

Item description codes implemented in the server contract are:

`ANK, BAR, BGL, BRC, BRH, CHN, CHK, CON, CRW, ERG, FST, NCK, PND, PCH, RNG, TRN, WRN`.

Barcode authority remains the existing server-generated `DD` inventory family. The page displays the family as read-only; it does not accept a manual barcode as physical identity.

## Identification

Implemented in `diamond-jewellery-profile.service.js` and the AR/EN page:

- Item Description / Type: required.
- Gold Karat: required numeric values `9,10,12,14,18,21,22,24`; the `24K Gold Bar` label is not accepted as a karat value.
- Gold Color, Brand, Model, Model Number: optional.
- Supplier and Purchase Date: shared canonical receive fields.
- Condition: existing system field remains available; no new status model was introduced.

## Gold Information

The server calculates with Decimal precision:

```text
diamondWeightGrams = totalDiamondWeightCT × 0.20
netGoldWeight = grossWeight − diamondWeightGrams
pureGoldWeight9999 = netGoldWeight × karat / 24
```

An explicit final net-weight override is accepted and validated server-side. It must remain within `[0, grossWeight]`. Diamond CT is not subtracted a second time.

## Diamond Components

The source requires one or more embedded components. Each component validates:

- Stone Carat Weight > 0.
- Stone Name defaults to `Diamond` when blank.
- Diamond Type: `Natural`, `Lab Grown`, or `Treated`.
- Color: one or more values from `D–Z` or `Fancy`.
- Clarity and Shape: required reference values.
- Treatment, Tone, Saturation, Cut, Origin, Position, Setting, Notes: optional.
- `Treatment = Other` requires a description.
- Stone Cost is optional and non-negative.
- Component-level certificate number requires authority.

The UI supports Add/Remove before save. No post-save destructive removal workflow was added; existing asset-event/audit authorities remain the owner of future non-destructive changes.

## CT vs K / Weight Reconciliation

The server uses lexical decimal validation and exact Decimal equality. A component sum mismatch is rejected before any receive-side persistence. Focused proof:

```text
gross = 10.00000000 g
components = 1.00000000 CT + 0.50000000 CT
totalDiamond = 1.50000000 CT
stoneWeight = 0.30000000 g
netGold = 9.70000000 g
karat = 18
pureGold9999 = 7.27500000 g
```

## Certificate

The existing `AssetCertificate` model is reused. Diamond component certificates are linked through `asset_components.certificate_id`; top-level certificates continue through the existing Asset certificate path. Before a future Diamond receive creates a certificate, the source now performs a read-only company + issuer/authority + certificate number duplicate check inside the receive transaction and fails closed with `DIAMOND_CERTIFICATE_DUPLICATE`.

No certificate rows were created in this batch.

## Historical Purchase Cost

The preview requires a manual historical Gold Purchase Price / gram and keeps it separate from Gold Center. It derives:

- Historical Gold Value = final net gold weight × manual historical rate.
- Total Making = final net gold weight × optional Making / gram.
- Total Diamond Cost = sum of non-null stone costs; missing cost is not stored as semantic zero.
- Taxable base = historical gold value + making total + diamond cost.
- Total purchase cost = canonical UAE transaction tax context result.

The resulting tax context includes treatment, rate, base, VAT amount, rounding scale, and legal snapshot metadata for future immutable receive persistence. No PO or tax snapshot was written.

## Current Cost

The preview resolves current gold rate through the existing Gold Center reference service:

```text
GOLDAPI_IO → AED → PER_GRAM → GLOBAL/SPOT → K/24 derivation
```

Current making and current diamond value remain explicit optional manual inputs. Current cost and historical purchase cost are separate objects. No Gold By Weight formula was copied.

## Sales Information

The page exposes manual Piece Selling Price and Maximum Discount as review inputs only. The server does not generate automatic 4C pricing. If a sale price is supplied, the preview derives a minimum allowed price from current total cost and expected profit. Final sale/checkout is not executed in this batch.

## Tax / RCM

The shared `SharedReceiveSection` is reused for Supplier, Location, Purchase Date, Tax Treatment, Notes, and RCM evidence. Diamond profile preview delegates treatment validation and amounts to the existing `transaction-tax-context.service.js`; it does not create a second UI tax engine. Shared `/inventory-v2/receive-preview` remains the future Supplier V2 tax authority.

## Precision

All newly introduced Diamond calculations use `decimal.js`, lexical decimal input, and 8 decimal places with `ROUND_HALF_UP`. No JavaScript float equality, epsilon, or business rounding shortcut was introduced.

## Master Data

The contract reads current company profile master data for the Diamond categories and certificate authorities, plus current branch-scoped locations and company suppliers. It does not insert, update, seed, or provision any master data. The server also returns the reference-derived option lists needed to make the contract explicit; future production provisioning remains a separate Owner-controlled activity.

## Server Contract

Added:

| Method | Endpoint | Behavior |
|---|---|---|
| GET | `/api/v1/inventory-v2/diamond-jewellery/contract` | Authenticated `inventory.view`, read-only contract and current context |
| POST | `/api/v1/inventory-v2/diamond-jewellery/preview` | Authenticated `inventory.view`, read-only Decimal profile preview |
| POST | `/api/v1/inventory-v2/receive-preview` | Existing shared Supplier V2 preview; Diamond is now validated by the existing V2 normalizer |
| POST | `/api/v1/purchase-orders/receive` | Not called in this batch; future calls fail closed on Diamond component validation |

## Server Preview

`normalizeReceiptPiece()` now resolves `DIAMOND_JEWELLERY` through the dedicated profile validator before normal Supplier V2 calculations. It produces one normalized piece with:

- `profile = DIAMOND_JEWELLERY`;
- `weights` including gross, stone, net, karat, purity, and pure gold;
- embedded Diamond components;
- aggregate component cost;
- no Product quantity authority;
- existing Asset/Barcode/Movement/Accounting persistence hooks unchanged.

## UI AR/EN

Added one shared page for:

- `/ar/inventory/diamond-jewellery`
- `/en/inventory/diamond-jewellery`

The page has nine logical sections: shared receive, identification, gold/weight, components, historical purchase, current cost, sales, barcode/tags, review, and system/audit display. It reuses the existing unified shared receive component and has no Sidebar item and no second Supplier receive form.

## Unified Chooser

The existing Inventory chooser now enables Diamond and links to the new unified route. Gold By Weight and Gold By Piece remain enabled; Gem Stone, Pearl, and Loose Diamond remain unavailable. No Supplier legacy create workflow was added.

## Receive V2 Mapping

Future canonical mapping is:

```text
Inventory chooser
→ Diamond Jewellery page
→ shared Supplier / Location / Date / Tax Treatment
→ profile preview
→ shared Supplier V2 preview
→ Owner-authorized future Receive only
→ one Asset
→ DD barcode
→ origin / purchase cost revision / movement / payable / journal
```

No final step was run. No business record was created.

## Persistence Mapping

The existing V2 persistence path is preserved. The implementation adds only Diamond-specific validation and future-safe certificate handling:

| Concern | Existing authority | Diamond handling |
|---|---|---|
| Physical stock | Asset | Preserved |
| Barcode | Server Barcode Identity Service | `DD`, preserved |
| Components | `asset_components` + `asset_diamond_component_details` | Reused |
| Certificate | `AssetCertificate` | Reused with duplicate guard |
| Origin / source | `asset_origins` and PO asset links | Unchanged |
| Cost | `asset_purchase_cost_revisions` | Existing transaction, future profile values supplied by preview |
| Movement | `inventory_asset_movements` | Unchanged |
| Accounting/payable | Existing Supplier V2 transaction | Unchanged |
| Idempotency | Existing Supplier Receive idempotency contract | Not exercised because no Receive was authorized |

## Security

- Contract and preview require authenticated `inventory.view`.
- Company and branch are server context; locations are queried by company + branch.
- No frontend toggle is treated as physical authority.
- No permission weakening or new permission was added.
- No API key, password, token, or secret was printed.
- No official DB write occurred.

## Focused Tests

Command executed:

```text
node --test tests/diamond-jewellery-authority-implementation.test.cjs
```

Result: **5 passed, 0 failed**.

Coverage includes exact CT reconciliation, 8DP weight derivation, karat rejection, missing required component fields, `Other` treatment description, certificate authority, null stone-cost semantics, Asset/DD/Supplier V2 authority, no Loose Diamond UI authority, and no final Receive call in the new page.

Additional direct V2 normalizer proof passed for one `DIAMOND_JEWELLERY` piece with one component.

## Regression / Typecheck

```text
npm run typecheck
PASS
```

The typecheck was run without a build and without starting Next dev. No migrations were created or executed by this batch.

## Browser Read-Only Acceptance

| Journey | Result | Evidence |
|---|---|---|
| Inventory page | PASS | `localhost:3000/en/inventory` loaded; canonical Add / Receive button visible |
| Unified chooser | PASS | Diamond link visible at `/en/inventory/diamond-jewellery`; no Loose Diamond chooser entry |
| Diamond direct route | BLOCKED | Page requested the new contract but current backend returned `404 ROUTE_NOT_FOUND` |
| Browser console | No captured error logs | `tab.dev.logs({errors,warns})` returned empty |
| Network | BLOCKED at contract | Main backend log records repeated authenticated `GET /api/v1/inventory-v2/diamond-jewellery/contract 404` |
| Final Receive | NOT RUN | Intentionally not present/called |

This is not a business-rule bypass. The current backend container has been up since before the new route and is started by a compose command that automatically runs migrations. It was not restarted in this batch.

## DB No-Mutation Proof

Official target was explicitly verified through read-only SQL:

```text
current_database = darfus_erp
```

Read-only baseline observed after implementation:

| Entity | Count |
|---|---:|
| assets | 6 |
| `DIAMOND_JEWELLERY` assets | 0 |
| `LOOSE_DIAMOND` assets | 0 |
| asset_components | 0 |
| asset_diamond_component_details | 0 |
| purchase_orders | 6 |
| asset_origins | 6 |
| asset_purchase_cost_revisions | 6 |
| inventory_asset_movements | 6 |
| journal_entries | 9 |

No INSERT, UPDATE, DELETE, TRUNCATE, backup, seed, migration, PO receive, asset creation, barcode allocation, payment, or journal operation was executed. This batch has no persistent DB mutation proof because it intentionally has no mutation.

## Files Changed

Intentional Diamond-batch changes:

- `backend/src/services/diamond-jewellery-profile.service.js` — new profile contract, validation, Decimal preview, and source option authority.
- `backend/src/routes/diamond-jewellery-profile.routes.js` — new read-only contract and preview endpoints.
- `backend/src/routes/index.js` — mounts the new route.
- `backend/src/services/inventory-v2-runtime.service.js` — Diamond V2 normalization gate, null component-cost preservation, and certificate duplicate/component linkage handling.
- `components/inventory/inventory-intake-chooser.tsx` — enables only Diamond’s unified route.
- `app/[locale]/(dashboard)/inventory/diamond-jewellery/page.tsx` — shared AR/EN profile page, no final Receive action.
- `tests/diamond-jewellery-authority-implementation.test.cjs` — focused source/service tests.
- `docs/DARFUS_DIAMOND_JEWELLERY_AUTHORITY_IMPLEMENTATION_REPORT.md` — this report.

The worktree contains many pre-existing modified and untracked files from earlier batches, including the existing untracked `inventory-v2-runtime.service.js`, route files, reports, migrations, and `next-env.d.ts`. They were not cleaned, reset, reverted, or claimed as part of this Diamond batch. `next-env.d.ts` was not edited.

## Runtime Authorization Gate

The new source is ready for controlled runtime verification, but final Diamond runtime acceptance requires the Owner’s explicit authorization for the controlled receive/preview environment and a backend process that has loaded the new route without automatically running an unapproved migration sequence. No runtime authorization was provided in the current request.

No current Diamond acceptance evidence was reused as proof of this implementation. No Diamond receive was performed.

## Final Tokens

```text
PRIMARY_BUSINESS_REFERENCE = Diamond (Jewellery  Loose Stone).docx
REFERENCE_MODE = READ_ONLY
REFERENCE_FILE_READ_COMPLETELY = YES
VISUAL_VERIFICATION = COMPLETE
TOTAL_UNMAPPED_REQUIREMENTS = 0
LOOSE_DIAMOND_IMPLEMENTED = NO
DIAMOND_JEWELLERY_PROFILE = DIAMOND_JEWELLERY
ONE_TOP_LEVEL_JEWELLERY_ASSET = YES
ONE_ASSET_PER_PHYSICAL_PIECE = YES
PRODUCT_QUANTITY_PHYSICAL_AUTHORITY = NO
BARCODE_FAMILY = DD
SUPPLIER_V2_CANONICAL_PATH = PRESERVED
GOLD_BY_WEIGHT_BUSINESS_FORMULA_REUSED = NO
TAX_ENGINE_DUPLICATED = NO
OFFICIAL_DATABASE = darfus_erp
OFFICIAL_DB_WRITES = 0
MIGRATIONS_CREATED = 0
MIGRATIONS_EXECUTED = 0
RECEIVES_EXECUTED = 0
PO_ROWS_CREATED = 0
ASSET_ROWS_CREATED = 0
BARCODE_ROWS_CREATED = 0
JOURNAL_ROWS_CREATED = 0
FOCUSED_TESTS = 5
FOCUSED_TESTS_PASS = 5
TYPECHECK = PASS
BROWSER_READ_ONLY = PARTIAL_BLOCKED_BY_STALE_BACKEND
P0_BLOCKERS = 0
P1_BLOCKERS = 0
DIAMOND_SOURCE_AND_UI_READY = YES
DIAMOND_JEWELLERY_FINAL_CLOSED = NO
CAN_REUSE_CURRENT_DIAMOND_ACCEPTANCE_EVIDENCE = NO
NEW_CONTROLLED_DIAMOND_RECEIVE_REQUIRED = YES
OWNER_RUNTIME_AUTHORIZATION = NOT_PROVIDED
GATE = BLOCKED_DIAMOND_JEWELLERY_RUNTIME_AUTHORIZATION_REQUIRED
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

## Stop

No Loose Diamond work was started. No runtime Receive was started. No DB or migration operation was started.

**DIAMOND JEWELLERY SOURCE CLOSURE COMPLETE → OWNER REVIEW → RUNTIME AUTHORIZATION DECISION → WAIT FOR EXPLICIT APPROVAL**
