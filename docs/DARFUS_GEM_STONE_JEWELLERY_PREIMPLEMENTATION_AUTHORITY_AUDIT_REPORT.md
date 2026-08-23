# DARFUS ERP — Gem Stone Jewellery Pre-Implementation Authority Audit

**Control ID:** `DARFUS-GEM-STONE-JEWELLERY-PREIMPLEMENTATION-AUTHORITY-AUDIT`  
**Mode:** `READ_ONLY_PREIMPLEMENTATION_AUTHORITY_AUDIT`  
**Scope:** `GEM_STONE_JEWELLERY` only. `LOOSE_GEM_STONE_SCOPE = REFERENCE_ONLY`.  
**Official database:** `darfus_erp`  
**Date:** 2026-08-21

## 1. Executive Summary

تم تنفيذ فحص Authority وGap قبل أي Implementation. تمت قراءة ملف العميل كاملًا، واستخراج النص كاملًا، ثم مراجعته بصريًا صفحةً صفحة من الصفحة 1 إلى الصفحة 73. لم يتم تنفيذ Receive أو Provisioning أو Seed أو Migration أو أي كتابة Business على `darfus_erp`.

الخلاصة التشغيلية: النظام يملك أساسًا عامًا مفيدًا (`GEMSTONE_JEWELLERY` في سجل السيرفر، component schema، GS barcode taxonomy، وMaster Data حالي)، لكنه لا يملك بعد شاشة Gem Stone Jewellery canonical مفعّلة ولا mapper مالي/حسابي خاصًا يثبت عقد العميل. لذلك فهذه نتيجة Audit مكتملة وليست جاهزية Implementation.

أهم الفجوات المثبتة:

- مدخل Gem Stone في Unified Intake موجود لكنه disabled، ولا توجد صفحة Gem Stone Jewellery مخصصة.
- الـV2 العام يقبل `GEMSTONE_JEWELLERY` ويمرر `purchaseCost/unitCost` كقيمة اقتصادية عامة، لكنه لا يثبت معادلات الذهب/الأحجار/المصنعية المطلوبة من وثيقة العميل.
- Current Valuation العامة قد تسقط إلى قيم الشراء التاريخية عند غياب `piece.currentValuation`؛ هذا لا يطابق فصل التاريخي عن الحالي في وثيقة العميل.
- `GEMSTONE_TREATMENT` موجود كتصنيف مصدر، لكن bootstrap يمنع قيمه عمدًا؛ وثيقة العميل تعرض Treatment في Item Details دون تعريف إدخال واضح في Add Item.
- قوائم المصدر المختصرة لا تساوي القوائم الحالية في `darfus_erp` لبعض Gem Stone categories؛ لا يجوز إجراء bootstrap جديد قبل تسوية مصدر السلطة.

**Audit gate:** `PASS_GEM_STONE_JEWELLERY_PREIMPLEMENTATION_AUTHORITY_AUDIT`  
هذا الـPASS يعني أن الفحص والسلطة والفجوات موثقة؛ لا يعني أن Gem Stone جاهز للاستلام أو البيع.

## 2. Authority Hierarchy

ترتيب السلطة المستخدم:

1. `Gem Stone (Jewellery  Loose Stone).docx` — Business Requirements Authority.
2. Frozen DARFUS architecture — Asset/Barcode/Supplier Receive V2/Tax/Accounting/Idempotency.
3. Current source in the worktree — implementation reality فقط، وليس سلطة لتغيير متطلبات العميل.
4. Read-only official DB state — runtime data reality.

لا تم استخدام ملفات Gold By Weight أو Gold By Piece أو Diamond أو Pearl لاشتقاق Business Rules. تم استخدام الإشارة العامة إلى frozen architecture فقط عندما كانت لازمة لفحص التوافق.

## 3. Client Source Version Check

| Check | Result | Evidence |
|---|---|---|
| Client authority file | PASS | `I:/WORK/client-requirements/Gem Stone (Jewellery  Loose Stone).docx` |
| SHA-256 | `F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3` | `Get-FileHash` read-only |
| Size / modified | 60,496 bytes / 2026-06-27 20:39:20 | filesystem metadata |
| Alternate Gem Stone copies | None found | only `Gem Stone*` file in client-requirements directory |
| Silent merge | NO | no alternate copy was merged |
| `CLIENT_AUTHORITY_VERSION_CHECK` | PASS | single supplied/current file identified |

## 4. Scope and Read Completeness

The client document contains Gem Stone Jewellery plus a reference-only Loose Gem Stone branch. This audit covers the nine Gem Stone Jewellery Add Item sections and the shared All Items, Barcode/RFID, Melted/Returned, and Inventory Audit requirements. Loose Gem Stone is recorded only as a shared-reference dependency; no implementation plan is authorized for it here.

Read/render evidence:

- OOXML paragraph nodes: 1,186; non-empty paragraphs: 1,119; extracted text: approximately 8,733 words.
- Tables: 0.
- Embedded media: 0 (`word/media` absent).
- Rendered document: 73 pages, LibreOffice exit 0, Poppler page renders available.
- Visual verification: pages 1–73 reviewed from rendered PNG contact sheets; no table, image, callout, text-box, shape, or page-layout content was found outside the extracted text. No clipping or overlap that could hide a field/rule was observed.
- `CLIENT_DOC_READ_COMPLETE = YES`.

## 5. Nine-Section Client Contract

| Section | Client authority | Current source/DB state | Audit result |
|---|---|---|---|
| 1 Identification | Description, Karat, Color, Brand/Model, Supplier, Purchase Date, images | Generic type form has a small subset; no canonical Gem Stone screen | GAP |
| 2 Gold Information | Gross, total gemstone CT, Net Gold, Pure Gold 999.9 | Generic V2 has gross/components, but Gem Stone is not in gold valuation set | P1 implementation blocker |
| 3 Gem Stone Information | Unlimited independent rows and complete per-stone technical/cost data | Generic component persistence exists; no canonical UI and no proven per-stone financial reconciliation | P1 implementation blocker |
| 4 Purchase | Gold value + making + stone costs + VAT; immutable historical snapshot | Generic V2 single `purchaseCost` path; no Gem-specific formula mapper | P1 implementation blocker |
| 5 Current Cost | Current gold/making/gem/VAT/current total; separate from history | Generic fallback can use historical values | P1 implementation blocker |
| 6 Sales | Markup, piece price, discount, minimum, profit and margin | Sale service handles loose gemstone, not `GEMSTONE_JEWELLERY` | P1 implementation blocker |
| 7 Tag | Barcode primary, RFID optional, print/generate and audit | GS barcode taxonomy exists; no Gem asset proof | Partial |
| 8 Status | Available/Reserved/Pending Transfer/Workshop/Returned/Missing/Melted/Sold, branch/location | Generic Asset status and location foundation exists | Partial; Gem workflow unproven |
| 9 Audit/System | Immutable Asset ID, timestamps, actors, before/after/reason and lifecycle events | Generic Asset event/audit tables exist | Partial; Gem field/event mapping unproven |

## 6. Item Identification Matrix

| Requirement | Required by client | Current reality | Classification |
|---|---:|---|---|
| Item Description / Type | Yes | Generic metadata has type/name; no canonical Gem Stone page or permissioned description list in the active chooser | P1 gap |
| Gold Karat | Yes | Server registry requires gross weight and purchase cost but does not make Gem Stone a `goldProfiles` valuation profile; barcode settings require a karat | P1 gap |
| Gold Color | Inherited/required per client flow | Generic common optional field exists; no Gem-specific UI/validation proof | P1 gap |
| Brand / Model / Model Number | Optional | Generic common fields exist in V2 | Partial |
| Supplier | Required | V2 context and DB supplier relation exist; no Gem-specific acceptance | Partial |
| Purchase Date | Required | Asset and purchase-cost revision columns exist | Partial |
| Item Image | Optional, multi-image with name | Generic attachment infrastructure exists, but no Gem screen proof | P2 gap |

The client’s list includes both standard descriptions and `Loose Gem Stone`; duplicate `Ring` text appears in the supplied list. This is recorded as a source-data quality note, not silently normalized into a new business rule.

## 7. Karat / Gold Color Contract

The client explicitly requires Karat and Gold Color for Gem Stone Jewellery and permits approved/custom values according to permissions. The frozen barcode authority also requires a valid karat code for the GS inventory code. Current DB has active `GS` with `requires_karat = true` and no default karat. This is compatible with the client’s required Karat, but it means a future Gem receive must provide server-resolved Karat; it cannot rely on a default.

Current source does not calculate Gem Stone Pure Gold Weight. `inventory-v2-runtime.service.js` only enters `calculateGoldWeights` for `goldProfiles`, and `GEMSTONE_JEWELLERY` is not in that set. The client formula therefore remains unimplemented/unproven.

## 8. Supplier / Location / Purchase Date

| Authority | Source | Official DB |
|---|---|---|
| Supplier | V2 receive context and `supplierId` fields exist | 2 suppliers; no Gem-specific transaction |
| Location | Canonical V2 route has location resolution and `locationId` | 2 rows, one active and one inactive, both branch-scoped |
| Purchase Date | Asset and purchase-cost revision fields | no Gem rows |

The client document allows location manual entry or selection. Frozen DARFUS authority is stronger: operational Location must be a branch-scoped DB master. The manual-entry wording is therefore a contradiction to be resolved in implementation design, not permission to bypass DB authority.

## 9. Gold Weight Formula Contract

Client formulas captured literally:

- Gross Weight = full physical weight of gold, gemstones, stones and components.
- Total Gem Stone Weight (CT) = sum of all Section 3 stone carats.
- `1 CT = 0.20 gram`, with automatic conversion.
- Net Gold Weight = derived after excluding gemstone/non-gold components, with a manually adjustable override for special components; every override must be audited.
- Pure Gold Weight 999.9 = Net Gold Weight × Karat purity, used for gold cost/value/reports/accounting/Gold Center.

Current generic V2 behavior does not implement this contract for `GEMSTONE_JEWELLERY`: `grossWeight` is accepted, but `weights` is only calculated for gold profiles; there is no exact Gem-specific CT sum, 0.20 conversion, override authorization, or Pure Gold 999.9 persistence path proven. `GEMSTONE_WEIGHT_FORMULA_SOURCE_STATUS = NOT_PROVEN`.

## 10. Asset / Component Cardinality

Frozen platform authority remains intact: one physical jewellery piece is one Asset. Mounted gemstones are component rows, not Product quantity.

Current source supports `asset_components` and `asset_gemstone_component_details`. `normalizeComponentsForProfile` assigns `GEMSTONE` kind for `GEMSTONE_JEWELLERY`, supports multiple component rows, and persists technical attributes. The client’s “unlimited independent stones” requirement is structurally compatible, but no canonical UI, max/validation policy, cost sum, CT reconciliation, certificate lifecycle, or runtime Gem asset exists to prove complete compliance.

## 11. Gemstone Component Field Matrix

| Field | Client status | Source persistence | Current audit result |
|---|---|---|---|
| Stone Carat Weight | Required, CT, primary authority | `asset_components.component_carat` | storage exists; exact aggregate validation missing |
| Stone Name | Required, permissioned master | `asset_components.name` plus profile references | master data exists in DB; canonical UI absent |
| Stone Type | Optional, permissioned master | `component_type` | generic storage exists; UI/permission proof absent |
| Shape | Optional, master | `asset_gemstone_component_details.shape` | column/master exists |
| Color | Optional, manual/master | `...details.color` | column/master exists |
| Tone / Tone Level | Optional | detail columns | columns/master exists |
| Saturation | Optional | detail column | column/master exists |
| Optical Effect | Optional | detail column | column/master exists |
| Origin | Optional, permissioned | detail column | column/master exists |
| Position | Optional, permissioned | detail column | column/master exists |
| Setting | Optional, multi-select | current detail column is scalar | P1 schema/contract design gap for multi-select |
| Certificate Authority/Number/Image | Optional, multiple images | asset-level certificate path exists; non-Diamond component certificate creation is not proven | P1 gap |
| Gem Stone Notes | Optional | component notes | storage exists; UI absent |
| Stone Cost | Optional per stone | component purchase cost/current value columns | sum and tax mapping not proven |
| Stone Treatment | shown in Item Details | `treatment` column exists; master bootstrap intentionally empty | Owner decision required on input/master semantics |

## 12. Total Gem Weight Reconciliation

Client invariant: Section 2 total gemstone CT must equal the sum of all Section 3 stone carat rows. A mismatch must block save/receive. Current `normalizeComponentsForProfile` normalizes component carat but does not expose a Gem-specific document total and does not assert equality against a total field. This is a P1 acceptance blocker for future implementation.

## 13. Gemstone Master Data Matrix

Official DB active counts read-only:

| Category | Count | Current DB state |
|---|---:|---|
| GEMSTONE_NAME | 67 | Ready/current |
| GEMSTONE_TYPE | 6 | Ready/current |
| GEMSTONE_SHAPE | 19 | Ready/current |
| GEMSTONE_COLOR | 45 | Ready/current |
| GEMSTONE_TONE | 14 | Ready/current |
| GEMSTONE_TONE_LEVEL | 9 | Ready/current |
| GEMSTONE_SATURATION | 10 | Ready/current |
| GEMSTONE_OPTICAL_EFFECT | 11 | Ready/current |
| GEMSTONE_ORIGIN | 25 | Ready/current |
| GEMSTONE_POSITION | 7 | Ready/current |
| GEMSTONE_SETTING | 47 | Ready/current |
| GEMSTONE_TREATMENT | 0 | Intentionally empty; not provisioned |

The current DB lists match the full client lists for the categories above. However, `inventory-master-data-policy.service.js` source arrays are shorter for several categories: names 42, shapes 14, colors 40, tone levels 6, optical effects 9. This creates source/bootstrap drift against the current DB (67/19/45/9/11). No bootstrap or correction was executed.

## 14. Purchase Financial Contract

Client authority for Gem Stone Jewellery:

`Total Purchase Cost = Total Gold Value At Purchase + Total Making Cost + Total Gem Stone Cost + Purchase VAT`.

Purchase amount fields are non-negative; required values must be complete before save; the saved historical snapshot must not change with later market prices.

Current V2 for `GEMSTONE_JEWELLERY` does not call a specialized Gem financial calculator. It takes `purchaseCost` from `piece.purchaseCost ?? piece.unitCost`; it derives generic VAT from `vatBase` or that purchase cost; it does not derive gold value, making total, stone total, and total purchase cost from the client fields. This is a P1 implementation blocker, not a DB corruption finding.

## 15. Purchase Gold / Making Formulas

Client formulas:

- `Total Gold Value At Purchase = Net Gold Weight × Gold Purchase Price Per Gram`.
- `Total Making Cost = Net Gold Weight × Making Cost Per Gram`.
- `Total Gem Stone Cost = Σ Stone Cost`.
- VAT is resolved by the server VAT Engine and may be zero; no hardcoded rate.

No Gem-specific source function currently proves these four inputs and their Decimal/rounding contract. The existing gold valuation service is not a safe authority for Gem Stone until the client Gem model is explicitly implemented and tested.

## 16. Tax Engine Integration

Official settings are read-only and show `defaultTaxTreatment = STANDARD_VAT`, enabled treatments including `ZERO_RATED`, `REVERSE_CHARGE`, `EXEMPT`, `OUT_OF_SCOPE`, and `vatRate = 14`. The canonical receive-preview route is `POST /inventory-v2/receive-preview`; it resolves configured VAT and uses the same V2 normalizer/preview path intended for receive. No Gem mutation or tax snapshot was executed.

Current Gem path is generic rather than profile-specific: it can calculate VAT once on a supplied `vatBase`, but it does not prove the client’s additive Gem purchase base. The VAT rate itself is dynamic/configured and was not changed.

## 17. Historical vs Current Cost

Client requires immutable historical purchase values and independent current values. The schema has separate `asset_purchase_cost_revisions` and `asset_current_valuations` authorities. This is a strong platform foundation.

The current V2 persistence fallback is not sufficient for Gem Stone: if no explicit `piece.currentValuation` is passed, the generic path creates an initial valuation using purchase fields, including `totalValue: piece.purchaseCost`. For a future Gem record this could make current valuation equal historical purchase cost, contrary to the client model. `HISTORICAL_CURRENT_SEPARATION_GEM = NOT_PROVEN`.

## 18. Current Valuation Contract

Client formula:

`Current Total Cost = Current Gold Value + Current Making Value + Current Gem Stone Value + Current VAT`.

Current gold price is live/permissioned; current making/gem values are independent; current VAT is VAT Engine output. Current source has a valuation table and supports explicit values, but no Gem-specific mapper and no source proof that current gold/making/gem values are supplied for `GEMSTONE_JEWELLERY`. This is P1 for implementation.

## 19. Sales / Pricing Contract

Client requires Markup %, Piece Selling Price, Max Discount %, Minimum Allowed Selling Price, Expected Profit, and Profit Margin. Expected Profit is explicitly `Piece Selling Price - Current Total Cost`; selling below minimum requires approval and manual changes are audited.

The current sale service explicitly includes `LOOSE_GEMSTONE` in its loose pricing set, but its documented asset sale branch does not include `GEMSTONE_JEWELLERY`. Therefore `GEMSTONE_JEWELLERY` sale price authority is unresolved. Do not copy loose or gold formulas into this profile without owner-approved mapping.

## 20. Selling Price Management Reuse

Frozen system authority says accepted selling-price management must reuse the existing `inventory.adjust`/`assets.price` command, minimum policy, audit, and idempotent command. The required Gem fields align conceptually with `asset_pricing_policies`, but no Gem profile-specific minimum/sale mapping is proven. Future work must reuse the command authority and must not add a parallel price path.

## 21. Barcode / RFID

Current source barcode format is `inventoryCode + itemCode + two-digit karat + six-digit serial` (`barcode-identity.service.js`, `formatBarcode`). The official DB has active client-approved `GS` (Gem Stone) inventory code, all item code rows allow `GS`, and `requires_karat = true`. No Gem barcode sequence or Gem asset exists yet; the only observed sequences are for DD, GP, and GW.

Client authority is preserved by this foundation: Barcode is primary permanent identity; RFID is optional and never replaces Barcode; generation/reprint/assignment must be permissioned and audited. Runtime Gem proof remains outstanding and is intentionally not run in this audit.

## 22. Status Matrix

Client statuses: Available, Reserved, Pending Transfer, Workshop, Returned, Missing, Melted, Sold. Branch is required; Location is optional in the client text but must be DB-master/branch-scoped under frozen DARFUS authority. Non-Available cannot sell; Sold cannot be directly made Available; all status/location changes are audited.

Current Asset schema has `operational_status`, `branch_id`, `location_id`, and event/movement tables. The generic runtime supports the frozen Asset authority. No Gem-specific transition test or UI exists; status compatibility is therefore `FOUNDATION_PRESENT / GEM_ACCEPTANCE_NOT_PROVEN`.

## 23. Audit Matrix

Client audit record must include old/new value, user, employee code, branch, device, date, time, and reason. Required audited events include create, data/cost/price edits, gemstone add/delete, certificate add/edit/delete, barcode reprint, RFID, status/location changes, and below-minimum sale.

Current source has generic `asset_events`, audit services, barcode history, RFID assignment, and pricing policy tables. There is no Gem UI command or event mapping proving every listed event. No audit record was created in this control.

## 24. Permission Matrix

| Capability | Existing generic authority | Gem Stone status |
|---|---|---|
| View inventory/profile | `inventory.view` | available generically |
| Receive | `suppliers.create` with V2 route | no Gem UI |
| Edit asset/metadata | `inventory.adjust` | generic foundation |
| Price adjustment | `inventory.adjust` | Gem mapping unresolved |
| Barcode/RFID | inventory-specific permission families | generic foundation, Gem runtime unproven |
| Master data | settings/inventory permissions | current data exists; source drift unresolved |
| Below-minimum sale approval | existing approval/policy framework | Gem price strategy not resolved |

RBAC was not weakened or changed.

## 25. Unified Receive Discoverability

The canonical page has `Inventory → Add / Receive Inventory` and opens `InventoryIntakeChooser`. The chooser enables Gold By Weight, Gold By Piece, Diamond Jewellery, and Loose Diamond, while `GEM_STONE` is explicitly disabled at `components/inventory/inventory-intake-chooser.tsx:19`. There is no Gem Stone link. This is consistent with the current pre-implementation state and prevents premature enablement.

## 26. Supplier Receive V2 Pipeline

The server exposes a single generic `inventory-v2/receive-preview` route and the canonical purchase receive route. The V2 normalizer has `GEMSTONE_JEWELLERY` in its profile registry and creates `GEMSTONE` component rows. However, the complete client pipeline is not proven for Gem because:

- no canonical Gem form builds the required per-piece payload;
- no exact total CT reconciliation is enforced;
- no Gem purchase/current valuation mapper exists;
- no Gem sales pricing contract is connected;
- no Gem receipt was executed, by instruction.

The existence of a generic route is not acceptance proof.

## 27. Frontend Reality

Dedicated source directories exist for GBW, GBP, Diamond Jewellery, Loose Diamond, and other profiles, but no `app/.../inventory/gem-stone` or `.../gemstone-jewellery` page exists. The legacy generic `InventoryItemForm` has a minimal `GemstoneFields` component, but Add mode intentionally refuses direct Asset creation and links to `/suppliers/purchases`. It is not the canonical Gem Stone receive form and does not implement the nine-section client contract.

Frontend runtime shell responds on port 3000, but no Gem route is an acceptance route. The canonical chooser remains disabled; no browser mutation was performed.

## 28. Backend Reality

Positive evidence:

- `inventory-master-policy.service.js:19` registers `GEMSTONE_JEWELLERY` with asset type `gemstone`, components enabled, certificates/RFID supported.
- `inventory-v2-runtime.service.js:94` maps the profile to the gemstone Asset type.
- `inventory-v2-runtime.service.js:629` defaults component kind to `GEMSTONE`.
- `inventory-v2-runtime.service.js:736` persists gemstone detail columns.
- `erp.routes.js:5219` exposes the read-only profile registry and `erp.routes.js:5245` exposes V2 preview.

Missing/insufficient evidence:

- no Gem profile service/route for the client’s nine sections;
- no specialized Gem formulas or Decimal reconciliation;
- no Gem current valuation mapper;
- no Gem selling-price authority;
- no complete component certificate/image workflow.

## 29. DB Schema Reality

Relevant schema exists: `assets`, `asset_components`, `asset_gemstone_component_details`, `asset_profile_master_data_references`, `asset_purchase_cost_revisions`, `asset_current_valuations`, `asset_events`, `asset_barcode_history`, `asset_rfid_assignments`, and `inventory_asset_movements`.

The schema supports a generic Gem component record but does not by itself prove the client form, formulas, permissions, immutable snapshots, or acceptance workflow. `asset_gemstone_component_details.setting` is scalar while the client permits one or more settings per stone; this requires an owner-approved contract/schema decision before implementation.

## 30. Runtime Master Data

Read-only official DB snapshot for `COMP-48ab554f-427e-4642-9419-bc8616c2dc36`:

- company: 1; branch: 1;
- suppliers: 2;
- locations: 2 (one active, one inactive);
- profile master data: 660 rows;
- active Gem Stone category counts are recorded in Section 13;
- no Gem Stone asset, Gem Stone PO item, or Gem Stone component-detail row exists.

The current master data is sufficient for many selector values, but the source policy arrays and the DB are not the same authority. No provisioning was done to correct that.

## 31. Fresh DB Provisioning

Migration state is `87` source migration files and `87` applied `SequelizeMeta` rows in `darfus_erp`; no migration was created or executed here. The current bootstrap code has a safety check that rejects any `GEMSTONE_TREATMENT` count, while the client document exposes Treatment in Item Details. Fresh-install readiness for Gem Stone is therefore not PASS: source dataset completeness and Treatment ownership require resolution before any new provisioning batch.

`FRESH_DB_GEM_STONE_PROVISIONING = BLOCKED_BY_SOURCE_MASTER_DATA_DRIFT`.

## 32. Shared Code Risk Register

| ID | Risk | Evidence | Severity |
|---|---|---|---|
| GS-SHARED-01 | Generic `purchaseCost/unitCost` may become the only economic authority | V2 normalizer lines 208–224 | P1 |
| GS-SHARED-02 | Current valuation may reuse purchase facts | V2 fallback lines 427–437 | P1 |
| GS-SHARED-03 | No exact CT-total invariant | component normalizer accepts component carat only | P1 |
| GS-SHARED-04 | Pure gold calculation absent for Gem profile | `goldProfiles` excludes Gem Stone | P1 |
| GS-SHARED-05 | Gem Jewellery sale pricing not in the supported asset sale branch | sale service handles loose Gem only | P1 |
| GS-SHARED-06 | Component setting is scalar while client allows multi-select | DB column `setting` is scalar | P1/design |
| GS-SHARED-07 | Component certificates/images are not fully persisted for Gem | V2 creates component certificates only in Diamond-specific branch | P1 |
| GS-SHARED-08 | Source arrays differ from current DB master data | policy counts vs DB counts | P1/fresh-install |
| GS-SHARED-09 | All Items “Quantity” must remain a derived count, not stock authority | client dashboard wording vs frozen Asset authority | P1 guardrail |

## 33. POS Price Authority

No Gem Stone Jewellery POS asset exists in the official DB. Source `isSalePricingProfile` includes `LOOSE_GEMSTONE`, but `GEMSTONE_JEWELLERY` is not proven in the sale pricing branch. Therefore POS search/checkout price authority for Gem Jewellery is unresolved. Future work must use Asset identity and the approved price command; it must not use Product quantity or an unproven fallback.

## 34. Loose Diamond Lessons Applied

The audit explicitly checked the known shared-risk patterns from prior Loose Diamond work without implementing them:

- do not confuse `currentTax` with immutable `taxSnapshot`;
- do not rely on optional named replacements without validating bindings;
- validate master-data arrays/scalars according to field contract;
- use explicit price authority, never silent fallback;
- keep gold and non-gold POS classification explicit;
- prove preview/runtime parity before any receive;
- preserve permissions, audit, and existing data.

`LOOSE_DIAMOND_LESSONS_APPLIED = PASS_AS_AUDIT_CHECKLIST`.

## 35. Contradiction Register

| ID | Client statement | Frozen/current authority | Required treatment |
|---|---|---|---|
| C-01 | Location may be manually entered | Location must be branch-scoped DB master | Owner-approved UI interpretation required; do not free-text operational location |
| C-02 | Stone Setting can be one or more | Current detail column is scalar | Owner decision/schema design required |
| C-03 | Stone Treatment appears in Item Details | No Add Item rule and no initial Treatment master values; bootstrap rejects nonempty Treatment | Owner decision required: display-only vs input/master |
| C-04 | Stock Status includes Quantity | Frozen physical authority is Asset, not Product quantity | Quantity may only be derived count; no quantity authority |
| C-05 | Client has `Gem Stone` label and two branches | Server canonical codes are `GEMSTONE_JEWELLERY` and `LOOSE_GEMSTONE` | Keep mapping explicit; no silent conflation |
| C-06 | Custom descriptions are allowed | Master data is permissioned and source-backed | Owner must define free-text vs controlled-list policy |

## 36. Implementation Gap Register

| ID | Gap | Layer | Classification | Priority |
|---|---|---|---|---|
| GS-GAP-01 | No dedicated Gem Stone Jewellery canonical page/form | Frontend | MISSING_BOOTSTRAP / ACCEPTANCE_GAP | P1 |
| GS-GAP-02 | Gem chooser disabled | UX/routing | ACCEPTANCE_GAP | P1 |
| GS-GAP-03 | No Gem-specific nine-section payload builder | Contract | PRODUCT_DEFECT_FOR_FUTURE_SCOPE | P1 |
| GS-GAP-04 | No CT sum and 0.20g reconciliation | Validation | PRODUCT_DEFECT_FOR_FUTURE_SCOPE | P1 |
| GS-GAP-05 | No Gem gold/net/pure-gold formula authority | Financial | DESIGN_LIMITATION | P1 |
| GS-GAP-06 | Purchase base/VAT/additive cost mapping unproven | Financial | ACCEPTANCE_GAP | P1 |
| GS-GAP-07 | Current valuation can fall back to historical values | Financial | DESIGN_LIMITATION | P1 |
| GS-GAP-08 | Gem Jewellery sale price authority not connected | POS/pricing | ACCEPTANCE_GAP | P1 |
| GS-GAP-09 | Per-stone certificate/image workflow incomplete | Data/audit | ACCEPTANCE_GAP | P1 |
| GS-GAP-10 | Source master arrays drift from current DB | Bootstrap | MIGRATION_STATE / MISSING_BOOTSTRAP | P1 |
| GS-GAP-11 | Multi-setting storage contract unresolved | Schema | DESIGN_LIMITATION | P1 |
| GS-GAP-12 | Image/All Items/Barcode/RFID/Audit screens not Gem-scoped | UX | ACCEPTANCE_GAP | P2 |

These are pre-existing implementation gaps identified by audit. No gap was repaired in this control.

## 37. P0 / P1 / P2

| Priority | Count | Findings |
|---|---:|---|
| P0 | 0 new | No new data-loss/security/financial corruption was created or observed in this audit. Existing unrelated journal mismatch `JE-1787090870905` (`2133.21` debit vs `2133.22` credit) was preserved and not corrected. |
| P1 | 11 implementation blockers | GS-GAP-01 through GS-GAP-11; these block safe Gem implementation/acceptance, not current data integrity because no Gem rows exist. |
| P2 | 1 | GS-GAP-12 shared UX/reporting depth deferred until authority and core contract are closed. |

`P0_NEW = 0`; `P1_NEW = 0`; `P2_NEW = 0`. The P1/P2 counts above are existing audit findings, not regressions introduced by this control.

## 38. DB No-Mutation Proof

Only read-only SQL, source reads, hashing, rendering, and unauthenticated GET health/page observations were used.

| Entity | First read | Final read | Delta |
|---|---:|---:|---:|
| assets | 10 | 10 | 0 |
| asset_components | 7 | 7 | 0 |
| asset_gemstone_component_details | 0 | 0 | 0 |
| purchase_orders | 10 | 10 | 0 |
| purchase_order_items | 10 | 10 | 0 |
| inventory_asset_movements | 10 | 10 | 0 |
| asset_purchase_cost_revisions | 10 | 10 | 0 |
| asset_current_valuations | 10 | 10 | 0 |
| journal_entries | 13 | 13 | 0 |
| journal_lines | 36 | 36 | 0 |
| profile_master_data | 660 | 660 | 0 |
| suppliers | 2 | 2 | 0 |
| inventory_locations | 2 | 2 | 0 |

`SELECT current_database()` returned `darfus_erp` for both read-only snapshots. `RECEIVE_EXECUTED = NO`, `BUSINESS_WRITES = 0`, `PROVISIONING = 0`, `SEED = 0`, `MIGRATION_EXECUTED = 0`.

## 39. Minimum Safe Future Implementation Boundary

No implementation is authorized by this report. Any future batch must first receive owner decisions for C-01 through C-06, then define a single canonical Gem Stone Jewellery form under Unified Intake, a server-authoritative Gem economic contract, exact Decimal reconciliation, historical/current separation, sale-price authority, certificate/image ownership, multi-setting storage, and source-vs-DB master-data alignment. It must preserve Asset/Barcode/Supplier V2/Tax/Accounting/Idempotency authorities and use only a controlled disposable/approved rehearsal target for mutation proof.

## 40. Future Test Plan

Future acceptance must include, without executing now:

1. Arabic and English Unified Intake discoverability with Gem enabled only after owner gate.
2. Required-field and permission tests for all nine sections.
3. Multiple gemstone rows, add/delete/edit audit, CT sum, and `CT × 0.20` conversion.
4. Net Gold/Pure Gold formula and override audit.
5. Purchase base, VAT once, immutable historical snapshot, and balanced journal/AP.
6. Current valuation independent from historical purchase values.
7. GS barcode format, uniqueness, no reuse, RFID optionality, and audit history.
8. Supplier → V2 → Asset → components → movement → accounting idempotency.
9. POS Asset-only selection, price authority, status restrictions, and minimum-price approval.
10. All Items, Stock Status, Item History, Barcode/RFID, Melted/Returned, and Inventory Audit screens.

## 41. True Owner Decisions Required

1. Is Location strictly DB-master selection (recommended by frozen authority), or is client manual wording intended only as a request for adding a master value?
2. Is Stone Treatment an editable Add Item field, a read-only historical display, or deferred?
3. Should multiple Stone Settings be normalized as a child collection rather than the current scalar detail column?
4. What is the exact Gem Stone Jewellery purchase-cost and current-valuation authority, including tax base and rounding?
5. What is the exact Gem Jewellery selling-price/minimum/discount authority?
6. Is client custom Item Description free text, permissioned master data, or both?
7. Which source list is canonical for a fresh DB: the current source arrays or the already populated official DB values?

## 42. Gate

`GATE = PASS_GEM_STONE_JEWELLERY_PREIMPLEMENTATION_AUTHORITY_AUDIT`

Reason: client authority was fully read and visually verified; current source, schema, runtime master data, tax/settings, barcode/RFID, Supplier V2 foundation, POS price authority, contradictions, gaps, and P0/P1/P2 priorities were documented; no prohibited mutation occurred. The gate does not authorize Gem implementation or runtime Receive.

## 43. Final Tokens

```text
CURRENT_CONTROL = DARFUS-GEM-STONE-JEWELLERY-PREIMPLEMENTATION-AUTHORITY-AUDIT
MODE = READ_ONLY_PREIMPLEMENTATION_AUTHORITY_AUDIT
CLIENT_GEM_STONE_AUTHORITY_FILE = I:/WORK/client-requirements/Gem Stone (Jewellery  Loose Stone).docx
CLIENT_GEM_STONE_AUTHORITY_SHA256 = F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3
CLIENT_AUTHORITY_VERSION_CHECK = PASS
CLIENT_DOC_READ_COMPLETE = YES
CLIENT_DOC_VISUAL_VERIFICATION = COMPLETE_PAGES_1_TO_73
CLIENT_DOC_TABLES = 0
CLIENT_DOC_EMBEDDED_IMAGES = 0
PRIMARY_SCOPE = GEM_STONE_JEWELLERY
LOOSE_GEM_STONE_SCOPE = REFERENCE_ONLY
OFFICIAL_DATABASE = darfus_erp
DATABASE_CURRENT_DATABASE_PROOF = darfus_erp
SOURCE_CHANGES = 0
PRODUCT_CODE_FILES_CHANGED = 0
TEST_FILES_CHANGED = 0
MIGRATION_CREATED = NO
MIGRATIONS_EXECUTED = 0
BUSINESS_WRITES = 0
RECEIVE_EXECUTED = NO
PROVISIONING_EXECUTED = NO
SEED_EXECUTED = NO
OFFICIAL_DB_MUTATION = NO
GEM_STONE_FRONTEND_STATUS = MISSING_DEDICATED_CANONICAL_PAGE_AND_DISABLED_CHOOSER
GEM_STONE_BACKEND_STATUS = GENERIC_FOUNDATION_ONLY
GEM_STONE_SCHEMA_STATUS = GENERIC_COMPONENT_SCHEMA_PRESENT
GEM_STONE_MASTER_DATA_STATUS = CURRENT_DB_PRESENT_SOURCE_ARRAY_DRIFT
GEM_STONE_FINANCIAL_CONTRACT_STATUS = UNPROVEN
GEM_STONE_CURRENT_VALUATION_STATUS = UNPROVEN_AND_HISTORY_FALLBACK_RISK
GEM_STONE_POS_PRICE_AUTHORITY = UNRESOLVED
GEM_STONE_BARCODE_AUTHORITY = GS_FOUND_RUNTIME_RECEIVE_UNPROVEN
GEM_STONE_RFID_AUTHORITY = GENERIC_FOUND_RUNTIME_RECEIVE_UNPROVEN
P0_NEW = 0
P1_IMPLEMENTATION_BLOCKERS = 11
P2_DEFERRED_GAPS = 1
P0_COUNT = 0
P1_COUNT = 11
P2_COUNT = 1
CONTRADICTIONS = 6
OWNER_DECISIONS_REQUIRED = 7
CURRENT_DB_ASSETS = 10
CURRENT_DB_GEMSTONE_ASSETS = 0
CURRENT_DB_GEMSTONE_COMPONENT_DETAILS = 0
CURRENT_DB_PROFILE_MASTER_DATA = 660
CURRENT_DB_SUPPLIERS = 2
CURRENT_DB_LOCATIONS = 2
CURRENT_DB_BUSINESS_DELTA = 0
FRESH_DB_GEM_STONE_PROVISIONING = BLOCKED_BY_SOURCE_MASTER_DATA_DRIFT
GEM_STONE_IMPLEMENTATION_AUTHORIZED = NO
GATE = PASS_GEM_STONE_JEWELLERY_PREIMPLEMENTATION_AUTHORITY_AUDIT
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**FULL GEM STONE PRE-IMPLEMENTATION AUTHORITY AUDIT COMPLETE → OWNER REVIEW → WAIT FOR EXPLICIT APPROVAL.**
