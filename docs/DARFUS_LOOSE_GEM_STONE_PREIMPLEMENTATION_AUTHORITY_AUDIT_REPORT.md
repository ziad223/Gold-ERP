# DARFUS ERP — Loose Gem Stone Pre-Implementation Authority Audit

تم تنفيذ التدقيق المطلوب قراءةً فقط على مرجع العميل والكود وقاعدة `darfus_erp`. تم إثبات نسخة مرجع العميل، وقراءة ملف DOCX كاملًا، ورندر الصفحات ذات الصلة بصريًا، ومراجعة مصدر الـprofile والـMaster Data والـBarcode ومسارات V2 وDB الرسمي. نجح التدقيق في إثبات أن قاعدة البيانات لم تتغير وأنه لا توجد أي `LOOSE_GEMSTONE` Assets أو Receives حالية. فشل التنفيذ التشغيلي المقصود لأنه غير مسموح في هذا الـControl، كما أن النظام لا يملك شاشة Loose Gem Stone مستقلة ولا يثبت mapping صريحًا لـ`GS/LOS/00`. الخطر على قاعدة البيانات الرسمية = صفر؛ لم تحدث كتابة أو Receive. الخطوة التالية هي Owner Review ثم تجميد عقد التنفيذ الأدنى، وليس بدء Implementation تلقائيًا.

## 1. Executive Summary

| Result | Status | Evidence |
|---|---|---|
| Client authority version | PASS | Actual SHA-256 equals expected SHA-256; size 60,496 bytes |
| Complete document read | PASS | 73 rendered pages; complete OOXML/text extraction; no media images or tables |
| Loose Gem Stone contract | PASS | Eight sections and field/rule/validation requirements extracted |
| One physical loose stone = one Asset | PROVEN | Frozen DARFUS authority plus runtime policy `LOOSE_GEMSTONE`; no loose Asset exists in DB |
| Dedicated Loose Gem UI | GAP | No `inventory/loose-gemstone` page and no dedicated loose-gem profile route |
| Generic backend profile | PARTIAL | Registry, normalization, generic receive-preview, V2 runtime and finance helper exist |
| GS/LOS/00 barcode mapping | GAP | `GS`, `LOS`, and forced loose `00` capabilities exist, but explicit `LOOSE_GEMSTONE -> LOS` enforcement is absent |
| Official DB mutation | NONE | Read-only SELECTs only; no Receive, seed, migration, provisioning, or business write |

This is a completed authority audit, not an implementation approval. `LOOSE_GEM_STONE_IMPLEMENTATION_AUTHORIZED = NO`.

## 2. Control / Mode

| Key | Value |
|---|---|
| Control ID | `DARFUS-LOOSE-GEM-STONE-PREIMPLEMENTATION-AUTHORITY-AUDIT` |
| Mode | `READ_ONLY_PREIMPLEMENTATION_AUTHORITY_AUDIT` |
| Primary scope | `LOOSE_GEM_STONE` |
| Closed reference scope | `GEM_STONE_JEWELLERY_SCOPE = CLOSED_REFERENCE_ONLY` |
| Official DB | `darfus_erp` |
| Implementation | Not authorized |
| Receive | Not executed |
| Next batch | No automatic start |

## 3. Client Authority File + SHA

| Item | Actual |
|---|---|
| File | `I:/WORK/client-requirements/Gem Stone (Jewellery  Loose Stone).docx` |
| Expected size | 60,496 bytes |
| Actual size | 60,496 bytes |
| Expected SHA-256 | `F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3` |
| Actual SHA-256 | `F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3` |
| Version check | PASS |

The file was treated as the Business Requirements Authority for Loose Gem Stone only. No other profile DOCX was used as a business authority.

## 4. Client Document Read Completeness

The DOCX was read from start to finish using OOXML/text extraction and rendered with LibreOffice for visual verification. The render produced 73 pages. The document contained 1,186 paragraphs, zero tables, zero embedded media images, one section, and three drawing/textbox XML elements without media-backed requirements. Relevant Loose pages were pages 27–48; shared All Items pages 48–60; Barcode/RFID pages 61–66; Returned/Closed pages 67–70; Inventory Audit pages 70–73. Visual inspection confirmed that the rendered headings, lists, validation rules, shared pages, barcode/RFID requirements, and audit pages added no requirement absent from extraction. No screenshot or image requirement was present to add to the matrix.

`CLIENT_DOC_READ_COMPLETE = YES`.

## 5. Loose Gem Stone 8-Section Contract

| # | Client section | Contract meaning |
|---:|---|---|
| 1 | Item Identification Information | Supplier, purchase date, optional item images and named attachments |
| 2 | Gem Stone Information | One loose-stone identity with required carat and stone name plus optional gem attributes, certificate, notes, and the duplicated Stone Cost wording |
| 3 | Purchase Information | Historical Purchase Cost, automatic Purchase VAT, optional Additional Cost, automatic total |
| 4 | Current Cost Information | Current Stone Value, automatic Current VAT, independent current total |
| 5 | Sales Information | Markup, selling price, maximum discount, minimum price, profit and margin |
| 6 | Tag Information | Automatic unique permanent Barcode; optional RFID |
| 7 | Item Status Information | Status, Branch, Location and controlled lifecycle |
| 8 | Audit & System Information | Asset identity, timestamps, actor fields, notes and immutable audit events |

The client Loose flow does not define the Gold Jewellery weight/making/pure-gold form. Those fields were not imported into this contract.

## 6. Item Identification

| Requirement | Client authority | Current reality | Classification |
|---|---|---|---|
| Supplier | Required; list or permissioned controlled add | DB-backed supplier model and Supplier V2 company scope exist; no Loose UI | IMPLEMENTATION_GAP |
| Purchase date | Required; manual, prefer current date | Asset and receive models have purchase-date fields; no Loose form | IMPLEMENTATION_GAP |
| Item images | Optional; multiple, each named | `asset_attachments` has Asset ownership, name, type, URL, uploader and timestamp | PARTIAL_CAPABILITY |
| Supplier free text | Client text allows manual/new only under permission | Frozen DARFUS authority requires DB master and permissioned add | SYSTEM_AUTHORITY_NORMALIZATION |
| Edit audit | All edits audited | Existing audit service and Asset metadata/price audit paths exist; no Loose intake mapping proven | IMPLEMENTATION_GAP |

No supplier was created and no image was uploaded.

## 7. Gem Stone Field Matrix

The following matrix records every Loose Add Item field identified in the client document. “No dedicated UI” is intentional: this audit did not implement or enable one.

| Field | Client rule | Master/free text | Current DB category / source | Backend persistence / authority | Frontend | Audit / permission |
|---|---|---|---|---|---|---|
| Stone Carat Weight | Required, positive manual CT | Manual physical measure | No master category; `LOOSE_GEMSTONE` contract uses `carat` | Primary loose subject component carat; Asset is top-level authority | No Loose UI | Server precision/positivity exists generically; final UI not proven |
| Stone Name | Required | DB list; permissioned add | `GEMSTONE_NAME`, DB 67 | Primary subject name plus master reference | No Loose UI | Master add/update is permissioned and audited by service boundary |
| Stone Type | Optional | DB list; permissioned add | `GEMSTONE_TYPE`, DB 6 | Loose detail/component type | No Loose UI | Master controlled |
| Stone Shape | Optional | DB list; permissioned add | `GEMSTONE_SHAPE`, DB 19 | `asset_gemstone_component_details.shape` | No Loose UI | Master controlled |
| Stone Color | Optional | DB list or approved manual/list value | `GEMSTONE_COLOR`, DB 45 | `asset_gemstone_component_details.color` | No Loose UI | Master reference expected |
| Stone Tone | Optional | DB list | `GEMSTONE_TONE`, DB 14 | Gemstone detail tone | No Loose UI | Master controlled |
| Tone Levels | Optional | DB list | `GEMSTONE_TONE_LEVEL`, DB 9 | Gemstone detail tone level | No Loose UI | Master controlled |
| Saturation | Optional | DB list | `GEMSTONE_SATURATION`, DB 10 | Gemstone detail saturation | No Loose UI | Master controlled |
| Optical Effect | Optional | DB list | `GEMSTONE_OPTICAL_EFFECT`, DB 11 | Gemstone detail optical effect | No Loose UI | Master controlled |
| Origin | Optional | DB list; approved add | `GEMSTONE_ORIGIN`, DB 25 | Gemstone detail origin | No Loose UI | Master controlled |
| Certificate Authority | Optional | DB list | `CERTIFICATE_AUTHORITY`, DB 16 | Asset certificate issuer/reference | No Loose UI | Existing certificate model; permissioned lifecycle not mapped to Loose |
| Certificate Number | Optional manual | Manual identifier | No dedicated category required | `asset_certificates.certificate_number` | No Loose UI | Certificate actions require audit mapping |
| Certificate Image(s) | Optional; multiple/named | Attachment | `asset_certificates.url` plus Asset attachments | Asset-owned attachment/certificate storage | No Loose UI | Read/write acceptance not proven |
| Gem Stone Notes | Optional manual | Free text notes | Asset/component notes fields | Asset/component notes | No Loose UI | Metadata edits have an audit path; full Loose coverage not proven |
| Stone Cost | Optional per-stone manual text | Manual | No separate Loose authority | Existing generic component cost can store a component value | No Loose UI | Duplicates singular Purchase Cost; classified copy/semantic gap below |
| Purchase Cost | Required historical base | Manual economic value | No category | Supplier V2 purchase-cost and purchase revision authority | No Loose UI | Server nonnegative validation exists in generic finance |
| Purchase VAT | Automatic; may be zero | Tax Engine | Company tax settings | Tax snapshot / PO / payable authority | No Loose UI | Server tax authority |
| Additional Cost | Optional manual | Client examples are descriptive; itemization not defined | No dedicated category | `loose-profile-finance.service.js` supports an aggregate `additionalCost` for Loose Gem | No Loose UI | Itemization/taxability not proven |
| Total Purchase Cost | Automatic | Derived | N/A | Transaction total; must not redefine pre-tax Asset acquisition cost | No Loose UI | Tax/accounting reconciliation not proven for Loose |
| Current Stone Value | Required manual | Manual current valuation input | No category | `asset_current_valuations.component_value`-style generic mapping | No Loose UI | Current valuation update path exists generically |
| Current VAT | Automatic | Tax Engine | Company tax settings | Current valuation snapshot | No Loose UI | Business meaning is valuation/display, not automatically purchase VAT |
| Current Total Cost | Automatic | Derived | N/A | Current valuation total | No Loose UI | Historical/current separation exists in design, Loose acceptance absent |
| Markup % | Optional | Manual/policy | Pricing policy | Asset pricing policy | No Loose UI | Permissioned pricing architecture exists |
| Stone Selling Price | Required | Manual or policy | Asset `price` | Asset.price is authority | No Loose UI | Existing audited selling-price action |
| Maximum Discount % | Optional | Manual/policy | Asset pricing policy | `asset_pricing_policies.maximum_discount_percent` | No Loose UI | Approval/permission path generic for Loose pricing |
| Minimum Allowed Selling Price | Automatic | Derived/policy | Asset pricing policy | Server policy, not client authority | No Loose UI | Below-minimum approval path exists generically |
| Expected Profit | Automatic | Derived | N/A | Pricing calculation | No Loose UI | Generic Loose pricing helper exists |
| Profit Margin | Automatic | Derived | N/A | Pricing calculation | No Loose UI | Generic Loose pricing helper exists |
| Barcode | Automatic, unique, permanent | Server generated | Barcode code/sequence tables | Asset barcode plus permanent history | No Loose UI | Collision/history service exists |
| RFID | Optional | Server lifecycle | RFID assignment tables | Current RFID-to-Asset relationship | No Loose UI | Existing audited assignment lifecycle |
| Status | Required list | Controlled enum/transition | Asset operational status | Asset operationalStatus | No Loose UI | Transition service and audit paths |
| Branch | Required list | Server-authoritative context | Branch DB master | Asset branch/company scope | No Loose UI | Fail-closed context rules |
| Location | Optional list/manual in client; normalized by system | Branch-scoped DB master only | `inventory_locations` | Asset locationId | No Loose UI | Permissioned location management |
| Asset ID | System generated, unique/non-reusable | Server | Asset primary key | Asset identity | No Loose UI | Audit/event identity |
| Created/modified fields | System generated | Server | Asset timestamps/actor fields | Asset + audit | No Loose UI | Existing audit service; complete Loose proof absent |

## 8. Client Internal Consistency / Copy Artifacts

The Loose section includes copied text about unlimited gemstones, Add/Delete Gem Stone, independent component costs, and matching a Section 2 total to Section 3 details. The same document identifies Loose Gem Stone as a singular loose item, while frozen DARFUS authority is one physical loose stone = one Asset. The copied multi-stone wording is therefore classified as `CLIENT_DOC_COPY_ARTIFACT` / `CLIENT_DOC_INTERNAL_CONTRADICTION`, not as permission to create multiple loose stones inside one Asset.

Resolution: implement one top-level Loose Gem Stone Asset per physical stone. If a future Owner-approved business requirement explicitly changes that model, it must be a new authority decision; this audit does not reopen it.

## 9. Jewellery-Only Field Leakage Check

| Field / concept | Loose Add Item authority | Decision |
|---|---|---|
| Gold fields, net/pure gold, gold rate | Absent from Loose Add Item | Do not invent |
| Making/workmanship | Absent from Loose purchase model | Do not inherit Gem Jewellery or GBW formulas |
| Position | Not listed in Loose Add Item; appears in shared/other master data | Not an automatic Loose input |
| Setting | Not listed in Loose Add Item; appears in Gem Jewellery/shared data | Not an automatic Loose input |
| Treatment | Not listed in Loose Add Item; shared details/source has a field | Treat as shared/display or future contract question, not an input by default |
| Jewellery gold description/item-code behavior | Not a Loose business rule | Do not copy |

The audit intentionally did not read or use the Gold By Weight business formulas.

## 10. Master Data

| Category | Client list count | Current DB active count | Source provisioning count | Drift / status |
|---|---:|---:|---:|---|
| GEMSTONE_NAME | 67 | 67 | 67 | MATCH |
| GEMSTONE_TYPE | 6 | 6 | 6 | MATCH |
| GEMSTONE_SHAPE | 19 | 19 | 19 | MATCH |
| GEMSTONE_COLOR | 45 | 45 | 45 | MATCH |
| GEMSTONE_TONE | 14 | 14 | 14 | MATCH |
| GEMSTONE_TONE_LEVEL | 9 | 9 | 9 | MATCH |
| GEMSTONE_SATURATION | 10 | 10 | 10 | MATCH |
| GEMSTONE_OPTICAL_EFFECT | 11 | 11 | 11 | MATCH |
| GEMSTONE_ORIGIN | 25 | 25 | 25 | MATCH |
| CERTIFICATE_AUTHORITY | 14 | 16 | 14 | DB has 2 additional shared values; P2 drift |
| GEMSTONE_POSITION | Not required by Loose Add Item | 7 | 0 in Loose dataset | Not applicable to Loose input |
| GEMSTONE_SETTING | Not required by Loose Add Item | 47 | 0 in Loose dataset | Not applicable to Loose input |
| GEMSTONE_TREATMENT | Not required by Loose Add Item | 0 | 0 | Not applicable unless future authority adds it |

The source provisioning authority is `profile-master-data.service.js` / `inventory-master-data-policy.service.js` and the applied migration set. No provisioning or seed was run in this control. Current DB also has two active suppliers and two branch-scoped location rows, one inactive and one active; these are existing data, not created here.

`LOOSE_REQUIRED_MASTER_CATEGORIES = GEMSTONE_NAME` plus optional controlled categories in the table. `LOOSE_NOT_APPLICABLE_MASTER_CATEGORIES = GEMSTONE_POSITION, GEMSTONE_SETTING, GEMSTONE_TREATMENT` for the current Add Item contract.

## 11. Purchase Information

Client contract: Purchase Cost is the required historical pre-tax base; Purchase VAT is automatic through the Tax Engine; Additional Cost is optional; displayed total is Purchase Cost + Additional Cost + Purchase VAT.

Current source capability:

- `loose-profile-finance.service.js` accepts a pre-tax purchase input, an aggregate Loose Gem `additionalCost`, and configured VAT; it returns purchase base, VAT base, VAT amount, and tax-inclusive total.
- Supplier V2 and the receive-preview route are shared authorities and use `perPiece`/Asset semantics.
- Accounting must retain pre-tax acquisition cost as the Asset cost where the configured tax treatment is recoverable and post VAT separately; the client display total must not be silently used as the Asset base.
- The current Loose Gem path has no dedicated UI or end-to-end accounting proof, so `CLIENT DISPLAY TOTAL`, `ACCOUNTING ASSET ACQUISITION COST`, `RECOVERABLE VAT`, and `SUPPLIER PAYABLE` are not yet proven as one complete Loose contract.

Additional Cost is currently an aggregate scalar. The client does not define itemized cost rows, taxability per row, or accounting distribution. This is an engineering contract gap, not permission to invent a richer breakdown.

## 12. Historical Purchase Snapshot

The existing V2 runtime has purchase cost revision persistence, supplier/source linkage, tax values, PO item linkage, and immutable evidence concepts. It can store the canonical historical facts in the existing authorities, but no Loose Gem row exists and no Loose acceptance proves the mapper. Historical purchase must remain immutable and independent from current valuation.

Required future proof fields: Purchase Cost, Additional Cost, tax treatment, VAT rate/amount, display total, Asset acquisition cost, supplier, purchase date, PO/Receive source and idempotency evidence.

`HISTORICAL_PURCHASE_IMMUTABLE = REQUIRED; CURRENT_IMPLEMENTATION_PROOF = NOT_RUN_BY_CONTROL`.

## 13. Current Cost

The client requires Current Stone Value, automatic Current VAT, and Current Total = Current Stone Value + Current VAT, independent from historical purchase. The generic `loose-profile-finance.service.js` exposes `calculateCurrent`, and V2 has an `asset_current_valuations` table. This is a reusable server-side foundation, not a completed Loose Gem profile contract. A future mapper must reject any generic fallback that substitutes historical Purchase Cost when an explicit current value is required.

`LOOSE_CURRENT_VALUATION_STATUS = GENERIC_SERVER_CALCULATOR_PRESENT_NOT_PROFILE_ACCEPTANCE_PROVEN`.

## 14. Sales / Pricing

The frozen authority is `assets.price`, with permissioned and audited selling-price management. The existing price service enforces positive decimal input, reason, optimistic concurrency, immutable terminal statuses, and approved minimum selling price. The existing sale-pricing service includes `LOOSE_GEMSTONE` in its generic Loose pricing branch and calculates minimum price, expected profit, margin, discount, and VAT.

What remains unproven is the full Loose Gem path from future form values to Asset pricing policy, POS search, checkout, return, exchange, and audit. No sale or pricing mutation was executed. No Product quantity authority may be introduced.

## 15. Barcode

The frozen identity is `GS` inventory code + `LOS` item code + `00` loose karat segment + six-digit serial: `GSLOS00xxxxxx`.

Current reality:

- Active DB `GS` inventory code exists for asset type `gemstone`; it is client-approved and active.
- Active DB `LOS` item code exists as “Loose Stone” and is allowed for `GS` among other inventory codes.
- Barcode formatting supports two-character inventory/item codes, two-digit karat, and six-digit serial.
- `resolveKaratCodeForProfile` forces loose profiles to `00`.
- The generator explicitly forces `LOS` only for `LOOSE_DIAMOND`; for `LOOSE_GEMSTONE`, if no item code/default is supplied, the current compatible-item fallback is not an explicit Loose Gem authority and may select the first active compatible item.
- No `GSLOS00xxxxxx` Asset, sequence, or history row exists in the official DB.

`LOOSE_GEM_BARCODE_AUTHORITY = GAP_EXPLICIT_LOOSE_GEM_MAPPING_NOT_PROVEN`.

No barcode was generated in this audit.

## 16. RFID

RFID is optional in the client document. The existing RFID assignment, uniqueness, current-link, scan, and audit lifecycle is reusable for Assets. No Loose Gem RFID row exists and no assignment was performed.

`LOOSE_GEM_RFID_SUPPORT = EXISTING_ASSET_RFID_LIFECYCLE_REUSABLE_NOT_PROFILE_ACCEPTANCE_PROVEN`.

## 17. Status / Branch / Location

The client states Available, Reserved, Pending Transfer, Workshop, Returned, Missing, Melted, and Sold. The existing Asset operational status/transition service and sale eligibility rules provide the platform authority. Branch/company context is server-authoritative and fail-closed.

The client permits list/manual Location text, but frozen DARFUS authority normalizes this to an active branch-scoped DB master. Current DB has two locations for the only branch: one inactive QA row and one active QA row. Direct free text is not accepted as the durable transaction authority. This is `SYSTEM_AUTHORITY_NORMALIZATION`, not an Owner question.

No state transition, branch change, location change, sale, return, or exchange was executed.

## 18. Audit / System Information

The Asset model contains server identity, company/branch, supplier, location, status, barcode/RFID, dates, actor fields, and metadata. The append-only audit service records old/new values, actor context, operation, branch/device/session fields where provided, and hash-chain evidence. Asset metadata and selling-price changes already use audited commands.

The client’s complete Loose event list—create, edit, cost, price, certificate, barcode reprint, RFID link, status/location/branch, and below-minimum sale—has no dedicated Loose UI mapping yet. Reuse the existing audit system; do not create a parallel audit subsystem.

## 19. Validation

| Validation | Current source evidence | Status |
|---|---|---|
| Supplier required | Supplier V2/company scope; no Loose form | PARTIAL |
| Purchase date required | Asset/receive fields exist; no Loose form contract | PARTIAL |
| Stone name required | Loose detail normalizer requires it | SERVER FOUNDATION |
| Stone carat > 0 / no negative | Measurement validator and storage precision gates | SERVER FOUNDATION |
| Purchase cost required/nonnegative | Loose finance and V2 normalization | SERVER FOUNDATION |
| Current stone value nonnegative | Loose current calculator | SERVER FOUNDATION |
| Selling price nonnegative | Asset price service requires positive value | SERVER FOUNDATION |
| Asset ID unique | DB Asset identity | PASS PLATFORM |
| Barcode unique | Generator, sequence, permanent history checks | PASS PLATFORM; Loose mapping gap |
| Required fields before save | No Loose screen/save boundary | GAP |

`SERVER_VALIDATION_GAPS = dedicated Loose request/schema, Supplier/Location/UI contract, exact final field parity, explicit GS/LOS/00 mapping, and end-to-end validation proof`.

## 20. Certificates / Images

`AssetCertificate` supports Asset ownership, issuer, certificate number, issue/expiry dates, URL, and timestamps. `AssetAttachment` supports Asset ownership, named attachments, type, URL, uploader and upload timestamp. These are suitable existing storage authorities for certificate images and stone images, including multiple named attachments, but no Loose UI upload/readback/audit proof exists. No parallel attachment subsystem is authorized.

`LOOSE_CERTIFICATE_IMAGE_STATUS = EXISTING_ASSET_STORAGE_PARTIAL; LOOSE_UI_AND_RUNTIME_READBACK_NOT_PROVEN`.

## 21. Profile / Asset Model

`LOOSE_GEMSTONE` exists in the source profile registry. It maps to Asset type `gemstone`, Loose Asset strategy, no mounted components, and Loose details with required `stoneName` and `carat` at the detail level. The generic V2 runtime converts Loose details into exactly one `PRIMARY_SUBJECT` with `componentCount = 1` and persists gemstone details in `asset_gemstone_component_details`.

This storage is technically reusable only as the primary subject of the top-level Asset. It must not be used to represent multiple loose stones inside one Asset. The one-Asset identity remains the top-level Asset, not a Product quantity or a mounted component.

## 22. Backend Reality

| Capability | Evidence | Reality |
|---|---|---|
| Profile registry | `inventory-master-policy.service.js` | `LOOSE_GEMSTONE` exists, asset type gemstone, loose strategy |
| Detail normalization | same service | Stone name/carat contract and precision foundation exist |
| Supplier V2 | `inventory-v2-runtime.service.js`, `erp.routes.js` | Generic per-piece receive and Asset creation foundation exists |
| Read-only preview | `POST /inventory-v2/receive-preview` | Shared preview exists; no dedicated Loose profile preview |
| Tax | shared tax/loose finance services | Server authority exists; Loose end-to-end semantics unproven |
| Purchase/current valuation | V2 persistence tables/services | Generic persistence exists; no Loose acceptance |
| Master references | `profile-master-data.service.js` | Controlled DB-backed references exist |
| Barcode | `barcode-identity.service.js` | Generic generator exists; explicit Loose Gem item mapping absent |
| RFID/audit/price | existing Asset services | Reusable platform foundations |
| Idempotency | `idempotency.service.js` | Stable hash and replay/conflict persistence exist; request body artifact absent |

No backend file was changed.

## 23. Frontend Reality

The unified Inventory chooser has an enabled `GEM_STONE` card linking to `/inventory/gem-stone`. That page is the Gem Stone Jewellery page and contains multi-stone jewellery fields, gold/weight/making fields, and a settings multi-select. There is no separate `LOOSE_GEMSTONE` chooser card, no `/inventory/loose-gemstone` page, and no dedicated Loose Gem Stone profile route/service. The chooser’s labels and route therefore do not prove Loose support.

The existing Gem Jewellery page is outside this primary Loose scope and remains closed reference/runtime evidence only. No browser receive or UI enablement was performed. Source inspection was the authoritative frontend check for this read-only audit; no usable browser tab was discoverable for a new runtime proof, and no runtime action was needed or authorized.

`LOOSE_FRONTEND_STATUS = NO_DEDICATED_CANONICAL_UI`.

## 24. DB Baseline

Read-only connection identity:

`SELECT current_database()` returned `darfus_erp`.

| Entity | Official DB count |
|---|---:|
| companies | 1 |
| branches | 1 |
| suppliers | 2 |
| inventory_locations | 2 (1 active, 1 inactive) |
| assets | 11 |
| asset_components | 8 |
| asset_gemstone_component_details | 1 |
| purchase_orders | 11 |
| purchase_order_items | 11 |
| asset_origins | 11 |
| asset_purchase_cost_revisions | 11 |
| asset_current_valuations | 11 |
| inventory_asset_movements | 11 |
| journal_entries | 14 |
| journal_lines | 39 |
| idempotency_requests | 15 |
| profile_master_data | 660 |
| barcode_sequences | 7 |
| asset_barcode_history | 11 |
| `LOOSE_GEMSTONE` Assets | 0 |
| `GSLOS00%` barcodes | 0 |
| Loose Gem purchase rows | 0 |
| Loose Gem movements/revisions/valuations | 0 |

Existing data is unrelated historical/accepted evidence; it was not altered. No new Loose Gem business row exists.

## 25. Fresh DB / Provisioning Reality

Source contains 88 migration files and the official `SequelizeMeta` table contains 88 applied migrations. The latest applied profile-related migrations include the Loose Diamond master-data migration and Gemstone Jewellery multi-setting/master alignment migration. There is no dedicated Loose Gem Stone screen/route migration. No migration, seed, bootstrap, provisioning, or fresh disposable database was run in this audit.

The current DB already has shared Gemstone master values and operational QA supplier/location rows. The audit does not treat those rows as proof that Loose Gem workflow is ready.

## 26. POS / Sale / Return / Exchange Authority

The platform’s canonical sale orchestration resolves Asset identity, rejects Product quantity for final profiles, uses Asset status/branch scope, links invoice items to Assets, and preserves Asset identity through the Asset return path. Product return compatibility remains limited to non-final legacy scope. The generic pricing service includes `LOOSE_GEMSTONE`, but no Loose Gem Asset exists and no Loose POS/return/exchange runtime was executed.

Future Loose work must use Asset-only physical sale, Asset.price authority, server minimum/discount policy, and the existing audited return/exchange path. No Product fallback may be introduced.

## 27. Reuse from Loose Diamond / Gem Jewellery

| Reusable platform authority | Safe reuse status |
|---|---|
| One Asset per loose item | Reuse; frozen |
| Supplier Receive V2 | Reuse after Loose contract mapping |
| Historical/current separation | Reuse; must be proven for Loose |
| Asset.price and audited price management | Reuse |
| Asset POS pricing | Reuse after runtime acceptance |
| GS barcode family | Reuse taxonomy, but add explicit Loose Gem mapping before implementation |
| Tax Engine | Reuse; no second tax subsystem |
| Idempotency | Reuse canonical service; add evidence artifact capture |
| RFID/audit/attachments | Reuse existing Asset services |
| Diamond fields/formulas | Do not copy |
| Gem Jewellery gold/component formulas | Do not copy; only primary-subject storage pattern may be reused |
| Gem Jewellery Setting/Position/Treatment inputs | Do not import without Loose authority |

## 28. Exact Request Evidence Capability

| Required evidence | Current capability | Assessment |
|---|---|---|
| Exact prepared request body | Some pages retain a prepared object in browser memory; no durable artifact contract | PARTIAL_IN_MEMORY_ONLY |
| Canonical business payload hash | `idempotency.service.js` stable stringify + SHA-256 over scope/params/body excluding idempotency key | PROVEN_SERVER_CAPABILITY |
| Exact rollback request body | No recoverable canonical rollback artifact was proven; prior Gem evidence exposed the same gap | NOT_READY |
| Preview response artifact | No standard Loose artifact directory or persisted report artifact | NOT_READY |
| Pre/post DB baseline | Read-only audit can capture counts; no future Receive artifact contract yet | PARTIAL |
| Live network capture | Not performed; no Receive authorized | NOT_RUN |

Recommended future evidence directory (not created here):

`backend/acceptance-artifacts/loose-gem-stone/<control-id>/`

Recommended named artifacts: `preview-response.json`, `exact-prepared-request.json`, `canonical-business-payload.sha256`, `rollback-request.json`, `rollback-result.json`, `pre-receive-db-baseline.json`, `pre-receive-backup-metadata.json`, `live-receive-network.json`, and `post-receive-db-reconciliation.json`.

`FUTURE_LIVE_RECEIVE_EVIDENCE_GATE_READY = NO`.

## 29. Contradiction Register

| ID | Client text / issue | Frozen/system authority | Source reality | Classification | Resolution |
|---|---|---|---|---|---|
| LG-C01 | Loose section says unlimited/add/delete gemstones and matching totals | One loose physical stone = one Asset | Generic runtime supports one primary subject for Loose | CLIENT_DOC_COPY_ARTIFACT / INTERNAL_CONTRADICTION | Keep one Asset per loose stone |
| LG-C02 | Location list/manual entry | Location is branch-scoped DB master | Inventory location table and selector authority exist | SYSTEM_AUTHORITY_NORMALIZATION | No free-text durable location |
| LG-C03 | Stone Cost plus Purchase Cost | Loose is singular and Section 3 defines Purchase Cost | Generic component cost and purchase cost both exist | CLIENT_DOC_SEMANTIC_DUPLICATION | Treat Stone Cost as copied/duplicate until Owner contract; Purchase Cost is historical authority |
| LG-C04 | Treatment appears in shared details but not Loose Add | Do not invent absent business fields | Detail table has treatment column; no Loose UI | SHARED_DISPLAY_FIELD / IMPLEMENTATION_BOUNDARY | Do not add Loose input |
| LG-C05 | Position/Setting appear in Gem Jewellery/shared masters | Do not import Jewellery-only fields | Master rows exist; Loose profile category excludes setting | SYSTEM_AUTHORITY + NOT_APPLICABLE | Exclude from Loose Add |
| LG-C06 | Section numbering/content repeats around Loose | Eight-section Loose list is clear | Render/text shows repeated headings and copied validation | CLIENT_DOC_COPY_ARTIFACT | Use explicit eight-section contract |
| LG-C07 | Client total includes VAT vs Asset cost/accounting base | Tax Engine and accounting authority separate base/VAT/AP | Generic finance returns both base and tax-inclusive total; no Loose acceptance | ACCOUNTING_SEMANTIC_BOUNDARY | Map pre-tax Asset cost, VAT separately, payable total after proof |
| LG-C08 | Current valuation independent from purchase | Historical purchase != current valuation | Generic current calculator/table exists; no Loose mapper proof | IMPLEMENTATION_GAP | Require explicit current inputs and no historical fallback |
| LG-C09 | Selling/minimum policy fields | Asset.price and audited minimum policy are frozen | Generic Loose pricing branch exists; no UI/acceptance | IMPLEMENTATION_GAP | Reuse existing pricing service only |
| LG-C10 | Required GS/LOS/00 barcode family | Frozen explicit family | GS/LOS rows and loose 00 helper exist, explicit Loose Gem LOS enforcement absent | IMPLEMENTATION_GAP | Add explicit server mapping before acceptance |

## 30. P0/P1/P2 Gap Register

| ID | Area | Requirement | Current reality | Risk | Minimum safe direction | Authority | Owner decision? |
|---|---|---|---|---|---|---|---|
| LG-GAP-P1-01 | Frontend/contract | Dedicated canonical Loose Gem flow | No Loose page, chooser card, or dedicated profile route | Cannot collect or prove client contract | Freeze one canonical Inventory intake page and shared preview/receive contract | Client + frozen workflow | NO |
| LG-GAP-P1-02 | Barcode | `GSLOS00xxxxxx` | Explicit `LOS` enforcement is only proven for Loose Diamond | Wrong barcode family / identity risk | Add server-resolved Loose Gem mapping and focused tests | Frozen barcode authority | NO |
| LG-GAP-P1-03 | Finance | Purchase/current/tax/accounting parity | Generic Loose calculator exists; no end-to-end Loose mapper or proof | Tax double-application or wrong Asset/AP semantics | Trace and map existing V2/Tax/Accounting authorities; do not create a second calculator | Tax/Accounting authority | NO |
| LG-GAP-P1-04 | Evidence | Exact request + rollback artifacts | In-memory prepared request/hash only; no recoverable artifact set | Cannot prove exact replay/rollback evidence | Add acceptance artifact capture before any future live Receive | Frozen evidence rule | NO |
| LG-GAP-P1-05 | Attachments | Named multiple stone/certificate images | Storage models exist; no Loose UI/readback/audit proof | Requirement cannot be accepted | Reuse Asset attachments/certificates with explicit Loose mapping | Client + existing schema | NO |
| LG-GAP-P1-06 | Contract field | Current profile requires `grossWeight` | Client Loose Add Item does not clearly define gross weight; carat is required | Form may require an unapproved field or fail server validation | Resolve before implementation; do not silently add or remove it | Source vs client authority | YES |
| LG-GAP-P2-01 | Master data | Certificate authority list parity | Client list 14; DB 16 shared values | Selector drift, low operational risk | Reconcile source/DB under separate approved master-data decision | Client + master policy | NO |
| LG-GAP-P2-02 | Additional Cost | Examples but no itemization/taxability rule | Aggregate scalar only | Later reporting/accounting depth gap | Keep aggregate field unless Owner defines itemized contract | Client ambiguity | NO |
| LG-GAP-P2-03 | Lifecycle | Full Loose POS/return/exchange acceptance | Generic Asset paths exist; no Loose data | Workflow readiness unproven | Run separate controlled read-only/authorized acceptance after implementation | Frozen Asset authority | NO |

`P0_IMPLEMENTATION_BLOCKERS = 0`.

## 31. True Owner Decisions

Only one genuine decision remains after applying the frozen authorities:

**OD-LG-01 — Gross Weight contract:** The current `LOOSE_GEMSTONE` profile registry lists `grossWeight` as a required top-level receive field, while the Loose Gem Stone client Add Item contract explicitly requires Stone Carat Weight and does not clearly define a gross-weight input. Should the implementation contract retain gross weight as a technical physical Asset field, or should the profile contract be aligned to the client’s carat-only Loose model? This affects the request schema and validation, so it cannot be guessed.

No Owner decision is requested for one-Asset identity, DB-master Supplier/Location, Tax Engine authority, historical/current separation, Asset.price, or GS/LOS/00; those are already frozen authorities.

## 32. Current DB No-Mutation Proof

The DB connection was checked with `current_database() = darfus_erp`. Two read-only count passes returned the same values for the required baseline entities and Loose-specific predicates. The audit performed no `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, migration, seed, provisioning, Receive, backup, or cleanup.

| Proof | Result |
|---|---|
| Official DB target | `darfus_erp` |
| Loose Asset delta | 0 |
| GSLOS barcode delta | 0 |
| Loose PO/movement/revision/valuation delta | 0 |
| Overall business delta | 0 |
| Source code changes | 0 |
| Migration execution | 0 |
| Seed/provisioning execution | 0 |
| Receive execution | NO |

`CURRENT_DB_BUSINESS_DELTA = 0`.

## 33. Recommended Minimum Implementation Boundary

Future work should be a separate Owner-approved batch with this order:

1. Resolve OD-LG-01 and freeze the exact Loose request/field contract.
2. Implement one Inventory canonical Loose Gem page only; do not add a Supplier duplicate workflow.
3. Reuse Supplier V2, shared receive-preview, Tax Engine, Asset, Asset attachments/certificates, Asset.price, RFID, audit, and idempotency authorities.
4. Enforce server-resolved `LOOSE_GEMSTONE -> GS/LOS/00`; never trust labels or frontend flags.
5. Persist one primary Loose Gem subject per Asset; never use Product.quantity.
6. Map historical Purchase Cost, Additional Cost, VAT, payable, current valuation, and selling price explicitly.
7. Add durable evidence artifacts before any live Receive; prove rollback and exact request/hash parity on a permitted target.
8. Run focused tests, AR/EN read-only preview, then a separately authorized controlled acceptance. Do not start implementation from this audit automatically.

## 34. Gate

`GATE = PASS_LOOSE_GEM_STONE_PREIMPLEMENTATION_AUTHORITY_AUDIT`

The read-only audit is complete and the client authority hash is valid. There is no read-only access blocker preventing the current state from being understood. The P1 items are implementation blockers recorded for the next contract/implementation batch; they do not convert this audit into an implementation pass.

`LOOSE_GEM_STONE_IMPLEMENTATION_AUTHORIZED = NO`.

## 35. Final Tokens

```text
CURRENT_CONTROL = DARFUS-LOOSE-GEM-STONE-PREIMPLEMENTATION-AUTHORITY-AUDIT
MODE = READ_ONLY_PREIMPLEMENTATION_AUTHORITY_AUDIT
PRIMARY_SCOPE = LOOSE_GEM_STONE
CLIENT_AUTHORITY_FILE = I:/WORK/client-requirements/Gem Stone (Jewellery  Loose Stone).docx
EXPECTED_CLIENT_AUTHORITY_SHA256 = F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3
ACTUAL_CLIENT_AUTHORITY_SHA256 = F605E01954A0910A804C77C202F7C273E8BBA64380CA19738331B33B4A74D9C3
CLIENT_AUTHORITY_VERSION_CHECK = PASS
CLIENT_DOC_READ_COMPLETE = YES
OFFICIAL_DATABASE = darfus_erp
LOOSE_GEM_STONE_8_SECTION_CONTRACT = EXTRACTED
LOOSE_ASSET_IDENTITY_MODEL = ONE_PHYSICAL_LOOSE_STONE_ONE_ASSET_PROVEN
MULTI_STONE_COPY_WORDING = CLIENT_DOC_COPY_ARTIFACT_AND_INTERNAL_CONTRADICTION
LOOSE_PROFILE_STATUS = BACKEND_REGISTRY_PRESENT_NO_DEDICATED_UI
LOOSE_FRONTEND_STATUS = NO_DEDICATED_CANONICAL_UI
LOOSE_BACKEND_STATUS = GENERIC_V2_AND_FINANCE_FOUNDATION_PARTIAL
LOOSE_SCHEMA_STATUS = TOP_LEVEL_ASSET_PLUS_PRIMARY_SUBJECT_DETAIL_REUSABLE_NOT_ACCEPTED
LOOSE_MASTER_DATA_STATUS = REQUIRED_SHARED_CATEGORIES_PRESENT_WITH_CERTIFICATE_DRIFT
LOOSE_PURCHASE_FINANCIAL_CONTRACT = MAPPED_FOUNDATION_NOT_RUNTIME_PROVEN
LOOSE_CURRENT_VALUATION_STATUS = GENERIC_SERVER_CALCULATOR_PRESENT_NOT_PROFILE_ACCEPTANCE_PROVEN
LOOSE_SELLING_PRICE_AUTHORITY = ASSET_PRICE_PERMISSIONED_AUDITED
LOOSE_POS_PRICE_AUTHORITY = ASSET_ONLY_CANONICAL_PATH_NOT_LOOSE_RUNTIME_PROVEN
LOOSE_BARCODE_AUTHORITY = GAP_EXPLICIT_GS_LOS_00_MAPPING_NOT_PROVEN
LOOSE_RFID_STATUS = OPTIONAL_EXISTING_ASSET_LIFECYCLE_REUSABLE
LOOSE_CERTIFICATE_IMAGE_STATUS = EXISTING_ASSET_STORAGE_PARTIAL
EXACT_REQUEST_ARTIFACT_CAPABILITY = PARTIAL_IN_MEMORY_ONLY
CANONICAL_BUSINESS_HASH_CAPABILITY = PROVEN_SERVER_HASH_NO_DURABLE_ARTIFACT
ROLLBACK_REQUEST_ARTIFACT_CAPABILITY = NOT_PROVEN_NOT_READY
FUTURE_LIVE_RECEIVE_EVIDENCE_GATE_READY = NO
P0_IMPLEMENTATION_BLOCKERS = 0
P1_IMPLEMENTATION_BLOCKERS = 6
P2_DEFERRED_GAPS = 3
TRUE_OWNER_DECISIONS_REMAINING = 1 (OD-LG-01 grossWeight vs carat-only Loose contract)
SOURCE_CHANGES = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
BUSINESS_WRITES = 0
RECEIVE_EXECUTED = NO
CURRENT_DB_BUSINESS_DELTA = 0
ONLINE_PRODUCTION_CONTACTED = NO
GATE = PASS_LOOSE_GEM_STONE_PREIMPLEMENTATION_AUTHORITY_AUDIT
LOOSE_GEM_STONE_IMPLEMENTATION_AUTHORIZED = NO
NEXT_RECOMMENDED_STEP = LOOSE_GEM_STONE_AUTHORITY_NORMALIZATION_AND_MINIMUM_IMPLEMENTATION_CONTRACT_FREEZE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP — Loose Gem Stone pre-implementation authority audit complete. Owner review required. No implementation or next batch started.**
