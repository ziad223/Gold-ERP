# DARFUS ERP — Diamond Jewellery Client Document Compliance Audit

Control ID: `DARFUS-DIAMOND-JEWELLERY-CLIENT-DOC-COMPLIANCE-AUDIT`  
Audit mode: `READ_ONLY`  
Target: Diamond Jewellery only  
Official DB: `darfus_erp`  
Runtime: `http://localhost:3000` / `http://localhost:8000`  
Online production: not contacted

## 1. Executive Summary

The 82-page client document was read and visually verified from page 1 through page 82. The document contains no tables, images, text boxes, drawings, or screenshots that add requirements outside the extracted text. Diamond Jewellery is defined as one Jewellery Asset containing a Gold Component and one or more independent Diamond Components. Loose Diamond is a separate workflow and was not implemented or tested.

The current source has a real Diamond Jewellery preview flow, server-side CT reconciliation, net-weight validation, Gold Center pricing, tax preview, Asset/Component persistence capability, and canonical Supplier V2 infrastructure. It does not yet provide a normal end-user full Receive journey from this screen. The current page is explicitly preview-only and hardcodes an Owner Authorization stop. Several client fields are absent or only partially wired, and some fields use free text or frontend constants although authoritative master-data rows exist.

The most material compliance gaps are:

1. The current UI does not expose or call a final Receive action.
2. Missing `itemCode` is resolved by barcode configuration fallback rather than by a server-authoritative description-to-item-code mapping. This can produce a barcode segment inconsistent with the selected description.
3. The service-level diamond color list is not the same as the client/master-data list. The service contains `Fancy` while the client and official master data contain the separate Fancy color values; this is the confirmed path for `DIAMOND_COLOR_INVALID`.
4. Tone Levels, certificate attachments, item images, markup, and profit margin are not available in the current Diamond Jewellery receive UI.
5. The UI does not consistently use the server-backed master-data contract for component fields.

No source, test, configuration, migration, or database business data was changed by this audit. Browser actions were limited to read-only contract and Preview requests. No final Receive, PO, Asset, Barcode, RFID mutation, journal, payment, or master-data mutation was executed.

## 2. Client Document Coverage

### 2.1 Document and visual verification

| Evidence | Result |
|---|---|
| Primary client file | `I:\WORK\client-requirements\Diamond (Jewellery  Loose Stone).docx` |
| Pages | 82 |
| Full OOXML/text extraction | Complete, 982 paragraphs; 2,676 extracted lines including empty paragraph structure |
| Tables | 0 |
| Images/media | 0 |
| Drawings/shapes/text boxes | 0 |
| Hyperlinks | 0 |
| Visual rendering | All 82 pages rendered to PNG and inspected in page-order contact sheets |
| Unmapped visual requirements | 0 |

### 2.2 Section map

| Document area | Page evidence | Audit treatment |
|---|---:|---|
| Introduction / Fundamental Rule / Inventory Structure | 25–27 | Read and used as business boundary |
| Diamond Jewellery vs Diamond Loose Stones | 30–50 | Separate workflows preserved |
| Navigation Flow | 43–46 | Used for canonical entry-point audit |
| Diamond Jewellery Add screen | 52 onward | Full nine-section field audit |
| Section 1 — Item Identification | 64 onward | Field matrix |
| Section 2 — Gold Information | 140 onward | Formula and validation matrix |
| Section 3 — Diamond Information | 151 onward | Component matrix |
| Section 4 — Purchase Information | 344 onward | Cost/tax audit |
| Section 5 — Current Cost Information | 363 onward | Gold Center/current-cost audit |
| Section 6 — Sales Information | 380 onward | Pricing/dependency audit |
| Section 7 — Tag Information | 397 onward | Barcode/RFID boundary audit |
| Section 8 — Item Status | 413 onward | Asset/branch/location audit |
| Section 9 — Audit/System | 423 onward | Persistence/audit audit |
| Validation rules | 446–447 and throughout | Complete validation matrix |
| All Items / Details / Status / History | 717 onward | Downstream data sufficiency audit |
| Barcode/RFID | 789 onward | Identity architecture audit |
| Melted/Returned | 853 onward | Downstream lifecycle audit |
| Inventory Audit | 897 onward | Audit-event sufficiency audit |

## 3. Authority Hierarchy

1. The attached client DOCX is the Diamond Jewellery business-requirements authority.
2. Frozen DARFUS architecture is the system, security, Asset, Barcode, Tax, Accounting, and idempotency authority.
3. Current source, API, database, and browser runtime are the implementation reality.

The client document does not override the frozen rules `ONE_PHYSICAL_PIECE = ONE_ASSET`, `NO_QUANTITY_BASED_INVENTORY = YES`, canonical Supplier V2 receive, server-authoritative company/branch, unique Barcode identity, balanced accounting, and idempotent business writes.

## 4. Fundamental Diamond Boundary

| Requirement | Source | Official DB / runtime evidence | Status |
|---|---|---|---|
| One Diamond Jewellery piece = one Asset | `inventory-v2-runtime.service.js`; Asset model | Existing controlled Asset `AST-PUR-1787249363472-1-1-acuh` has profile `DIAMOND_JEWELLERY` | `MATCH_VIA_CANONICAL_ARCHITECTURE` |
| One Asset contains Gold plus 1..N Diamond Components | Diamond runtime service and component detail table | Existing asset has two persisted component/detail rows | `MATCH_VIA_CANONICAL_ARCHITECTURE` |
| One Asset ID, one Barcode, optional RFID | Asset/Barcode/RFID services | Existing asset has one `DDRNG21000001`; no RFID on that asset | `MATCH_VIA_CANONICAL_ARCHITECTURE` |
| One purchase cost/current cost/selling price | Asset cost/current valuation and preview | Existing asset has cost `3037` and price `7000`; preview exposes historical/current totals | `MATCH_VIA_CANONICAL_ARCHITECTURE` |
| Diamond Jewellery separate from Loose Diamond | Profile route/service mapping | `DIAMOND_JEWELLERY` asset count 1; `LOOSE_DIAMOND` asset count 0; no Loose Diamond screen was used | `MATCH_VIA_CANONICAL_ARCHITECTURE` |

## 5. Current Architecture

### 5.1 Frontend

Primary file: `I:\WORK\jewellery-erp-master\app\[locale]\(dashboard)\inventory\diamond-jewellery\page.tsx`.

The page has nine sections and loads the Diamond contract, suppliers, locations, tax policy, and Gold Center health. It calls:

- `GET /api/v1/inventory-v2/diamond-jewellery/contract`
- `POST /api/v1/inventory-v2/diamond-jewellery/preview`
- `POST /api/v1/inventory-v2/receive-preview`

The page does not call the final canonical receive route. Section 8 displays the acceptance-stage text `STOPPED — Owner authorization required` / `متوقف — يحتاج Owner Authorization` and explicitly states that no Receive, PO, Asset, Barcode, or Journal is created.

### 5.2 Backend

Primary files:

- `backend/src/services/diamond-jewellery-profile.service.js`
- `backend/src/routes/diamond-jewellery-profile.routes.js`
- `backend/src/routes/erp.routes.js`
- `backend/src/services/inventory-v2-runtime.service.js`
- `backend/src/services/profile-master-data.service.js`
- `backend/src/services/barcode-identity.service.js`

The profile service normalizes the piece and components, enforces positive carat and exact CT reconciliation, calculates historical/current values, and uses the transaction tax context. The shared preview route validates the same profile payload but neither route performs final Receive in this control.

### 5.3 Persistence capability

The source contains Asset fields for description, brand, model, model number, supplier, purchase date, profile, status, branch/location, tag state, and cost snapshots. Diamond component detail persistence includes treatment, color, tone, saturation, clarity, cut, shape, origin, position, and setting. `asset_certificates` and `asset_attachments` exist, but the current Diamond receive UI does not wire all client attachment/image requirements.

## 6. 9-Section Compliance Summary

| Section | Status | Evidence and exact gap |
|---|---|---|
| 1 Identification | `PARTIAL` | Core fields and supplier/location context render. Images, image naming, complete description semantics, and complete item-code binding are absent/partial. |
| 2 Gold | `PARTIAL` | CT-to-gram, net, override, and pure-gold calculations work in Preview. Scale capture is absent and 24K Gold Bar semantics are not represented distinctly. |
| 3 Diamond | `PARTIAL` | Component cards and core validation exist. Master-backed binding, Fancy color path, Tone Levels, attachments, and several conditional rules are incomplete. |
| 4 Purchase | `PARTIAL` | Historical gold/making/diamond totals and shared tax preview work. Purchase VAT is not a dedicated visible profile field and final freeze-after-receive was not runnable from this UI. |
| 5 Current Cost | `PARTIAL` | Gold Center current rate and current totals populate after valid Preview. Current VAT is not separately rendered and manual-permission behavior is not demonstrated. |
| 6 Sales | `PARTIAL` | Sale, minimum, and expected profit can preview. Markup and margin are missing; sale is not required by the current `basicReady` predicate. |
| 7 Tag | `PARTIAL` | Barcode/RFID inputs and canonical identity exist, but generation/printing/assignment actions are not present in this screen. |
| 8 Status | `MATCH_VIA_CANONICAL_ARCHITECTURE` | Asset status, company/branch, and DB-backed location authority exist; client manual location behavior is safely constrained to server-backed values. |
| 9 Audit/System | `PARTIAL` | Asset/system identity and audit infrastructure exist after persistence; creation is not available from this screen and piece-level Notes/device/reason fields are not fully wired. |

## 7. Complete Field-by-Field Matrix

The matrix covers 71 Diamond Jewellery Add/Receive fields and controls defined in the client document, including optional fields and tag/audit controls. `MATCH` and `MATCH_VIA_CANONICAL_ARCHITECTURE` are both counted as field matches in the final tokens.

| # | Client Section | Client Field | Required/Optional | Client Input Method | Client Rule/Formula | Current UI | Current API/Contract | Current DB/Persistence | Runtime Source | Status | Exact Gap |
|---:|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | Item Description | Required | Manual/dropdown; new values allowed | Diamond Jewellery item description | Select only | Contract item descriptions | Asset description; item code separate | Frontend list | PARTIAL | No free-entry/master extension and no authoritative description→code mapping |
| 2 | 1 | Gold Karat | Required | Dropdown | 9K–24K; 24K Gold Bar is item semantics | Numeric select | Numeric karats | Asset karat | Contract/service | PARTIAL | 24K Gold Bar distinction is not represented |
| 3 | 1 | Gold Color | Optional | Manual/dropdown | Yellow/White/Rose/Multiple; custom allowed | Text input | Master rows available | Asset/profile metadata capability | UI text | PARTIAL | UI does not use the returned GOLD_COLOR master list |
| 4 | 1 | Brand Name | Optional | Manual | Stored identity | Text input | Included in piece payload path | Asset brand column | UI/payload | PARTIAL | Not proven through current final persistence path |
| 5 | 1 | Model Name | Optional | Manual | Stored identity | Text input | Included in draft | Asset model column | UI/payload | PARTIAL | Not proven through current final persistence path |
| 6 | 1 | Model Number | Optional | Manual | Stored identity | Text input | Included in draft | Asset model_number column | UI/payload | PARTIAL | Not proven through current final persistence path |
| 7 | 1 | Supplier Name | Required | Server-backed selector | Supplier required | Shared selector | Contract suppliers | Asset/PO supplier linkage | Contract/runtime | MATCH_VIA_CANONICAL_ARCHITECTURE | Final Receive was not run in this control |
| 8 | 1 | Purchase Date | Required | Manual | Historical date | Shared receive field | Shared preview payload | PO/Asset purchase date capability | Shared preview | MATCH_VIA_CANONICAL_ARCHITECTURE | Final persistence not exercised |
| 9 | 1 | Item Image | Optional | Multiple named uploads | Each image named and persisted | Absent | No Diamond image field | Generic asset attachments exist | UI/source | MISSING | No upload, naming, or post-receive display from this flow |
| 10 | 2 | Gross Weight | Required | Manual or scale | Greater than zero | Numeric input | Required by normalizePiece | Asset gross weight | Preview | MATCH | No scale capture |
| 11 | 2 | Total Diamond Weight CT | Required | Manual | Nonnegative; reconciles to components | Numeric input | CT reconciliation | Component/asset detail capability | Preview | MATCH | No gap in tested valid path |
| 12 | 2 | Net Gold Weight | Required/derived | Automatic plus override | Gross − CT×0.20 | Read-only derived | Server-derived | Asset netGoldWeight | Preview | MATCH | No gap in tested valid path |
| 13 | 2 | Pure Gold Weight | Derived | Automatic | Net × karat / 24; no stones | Read-only derived | Server-derived | Cost/detail capability | Preview | MATCH | No gap in tested valid path |
| 14 | 3 | Add Diamond | Required behavior | Control | One to unlimited components | Present | Components array | Component rows | UI/service | MATCH | Final persistence not run |
| 15 | 3 | Delete Diamond | Required behavior | Control | Remove independent component | Remove-before-save only | Components array | Component deletion path not exercised | UI | PARTIAL | No post-save edit proof and no final receive |
| 16 | 3 | Stone Carat Weight | Required | Manual | >0 | Numeric input | Required and >0 | Component carat | Preview | MATCH | Valid/mismatch paths tested |
| 17 | 3 | Stone Name | Required | Master-backed, default Diamond | No normalized duplicates | Plain text default | Not in diamond master category | Component text/default | UI/service | PARTIAL | Blank is defaulted server-side and master registry is not used |
| 18 | 3 | Diamond Type | Required | Master-backed | Three exact client labels | Select | Normalized aliases | Detail type | Contract/service | PARTIAL | UI/service use shortened internal values and frontend list |
| 19 | 3 | Treatment Type | Conditional | Master-backed | Natural hidden by default; Other description | Select plus always-visible description | Treatment validation | Detail treatment | UI/service | PARTIAL | Conditional visibility/policy behavior absent |
| 20 | 3 | Diamond Color | Required | Master-backed, multiple | D–Z plus separate Fancy colors | Plain text | Service list contains D–Z + `Fancy` only | Detail color | Service/UI | BUG | Client/DB has separate Fancy values; service rejects them as `DIAMOND_COLOR_INVALID` |
| 21 | 3 | Diamond Tone | Optional | Master-backed | Separate tone dimension | Absent | Service accepts free text | Detail tone | Service | PARTIAL | Persistence capability exists but current UI/master binding is absent |
| 22 | 3 | Tone Levels | Optional | Master-backed | Separate level dimension | Absent | Not exposed in current UI contract behavior | Detail column capability | Source/DB | MISSING | No usable current receive field |
| 23 | 3 | Saturation Levels | Optional | Master-backed | Separate saturation dimension | Absent | Service accepts free text | Detail saturation | Service | PARTIAL | Persistence capability exists but no current UI binding |
| 24 | 3 | Diamond Clarity | Required | Master-backed | Exact clarity list | Select | Exact service list | Detail clarity | Contract/service | MATCH | No mismatch found |
| 25 | 3 | Diamond Cut | Optional | Master-backed | Exact cut list | Plain text | Service validates exact list | Detail cut | UI/service | PARTIAL | UI is not master-backed |
| 26 | 3 | Diamond Shape | Required | Master-backed | Exact shape list | Select | Exact service list | Detail shape | Contract/service | MATCH | No mismatch found |
| 27 | 3 | Diamond Origin | Optional | Master-backed | Countries + Other description | Plain text | Free text accepted | Detail origin | UI/service | PARTIAL | Wrong binding; Other-specific description not enforced |
| 28 | 3 | Stone Position | Optional | Master-backed | Position list + Other description | Plain text | Free text accepted | Detail position | UI/service | PARTIAL | Wrong binding and Other-specific description not enforced |
| 29 | 3 | Stone Setting | Optional | Master-backed | Setting list + Other description | Plain text | Free text accepted | Detail setting | UI/service | PARTIAL | Wrong binding and Other-specific description not enforced |
| 30 | 3 | Certificate Authority | Optional | Master-backed | Required when number exists | Plain text | Dependency normalized | Certificate issuer capability | UI/service | PARTIAL | UI does not use certificate master list |
| 31 | 3 | Certificate Number | Optional | Manual | Authority required if entered | Text input | Dependency enforced | Asset certificate table | Service | MATCH | Dependency is server-enforced |
| 32 | 3 | Certificate Attachments | Optional | Multiple named uploads | Persist named attachments | Absent | No UI payload | Asset attachments table exists | UI/schema | MISSING | Existing generic table is not connected to this receive UI |
| 33 | 3 | Diamond Notes | Optional | Manual | Per-stone note | Text input | Included in component normalization | Component/detail capability | UI/service | PARTIAL | Post-receive display/audit not proven |
| 34 | 3 | Stone Cost | Optional | Manual | Nonnegative; null remains null | Numeric input | Optional min 0; total sums null as zero | Component purchase cost | Preview/service | PARTIAL | Per-stone null semantics exist, but final persistence not exercised |
| 35 | 4 | Historical Gold Purchase Price/g | Required | Manual | >0 | Numeric input | Required in calculatePreview | Historical cost snapshot capability | Preview | MATCH | Final freeze not exercised |
| 36 | 4 | Total Gold Value | Derived | Automatic | Net × historical price | Read-only | Calculated | Cost snapshot capability | Preview | MATCH | No gap in tested path |
| 37 | 4 | Making Cost/g | Optional | Manual | Net × making/g | Numeric input | Optional | Cost snapshot capability | Preview | MATCH | No gap in tested path |
| 38 | 4 | Total Making Cost | Derived | Automatic | Net × making/g | Read-only | Calculated | Cost snapshot capability | Preview | MATCH | No gap in tested path |
| 39 | 4 | Total Diamond Cost | Derived | Automatic | Sum stone costs | Read-only | Calculated | Component costs | Preview | MATCH | Null component cost correctly contributes zero to total |
| 40 | 4 | Purchase VAT | Required by policy | VAT Engine | Tax engine result | Shared summary only | Shared preview tax context | Tax snapshot capability | Shared preview | PARTIAL | No dedicated profile field and final freeze not exercised |
| 41 | 4 | Total Purchase Cost | Derived | Automatic | Gold + making + diamond + VAT | Read-only | Calculated/shared | Purchase cost capability | Preview | MATCH | No gap in tested preview |
| 42 | 5 | Current Gold Price/g | Required | Gold Center or authorized manual | Current rate source | Read-only after preview | Gold Center reference | Current valuation capability | Gold Center/preview | MATCH | Blank before valid Preview is expected state, not provider failure |
| 43 | 5 | Current Gold Value | Derived | Automatic | Net × current price | Read-only | Calculated | Current valuation capability | Preview | MATCH | No gap in tested valid path |
| 44 | 5 | Current Making Value | Optional | Manual | Current making value | Numeric input | Accepted | Current valuation capability | UI/service | MATCH | No gap in tested path |
| 45 | 5 | Current Diamond Value | Optional | Manual | Current diamond value | Numeric input | Accepted/defaults to component cost | Current valuation capability | UI/service | MATCH | No gap in tested path |
| 46 | 5 | Current VAT | Required by policy | VAT Engine | Tax engine result | Shared summary only | Shared preview tax context | Tax snapshot capability | Shared preview | PARTIAL | No dedicated current VAT field in profile UI |
| 47 | 5 | Current Total Cost | Derived | Automatic | Current gold + making + diamond + VAT | Read-only | Calculated | Current valuation capability | Preview | MATCH | No gap in tested valid path |
| 48 | 6 | Markup Percentage | Optional | Manual | Pricing input | Absent | Not exposed | No proven Diamond field | UI | MISSING | No current field or binding |
| 49 | 6 | Piece Selling Price | Required | Manual | Nonnegative; below-min rules | Numeric input | Optional in current preview | Asset price capability | UI/service | PARTIAL | Current `basicReady` does not require it |
| 50 | 6 | Maximum Discount | Optional | Manual | Policy-limited discount | Numeric input | Not fully traced | Asset pricing capability | UI | PARTIAL | No end-to-end proof |
| 51 | 6 | Minimum Allowed Selling Price | Derived | Automatic | Current cost/policy | Read-only | Derived from current total | Pricing capability | Preview | MATCH | No gap in tested path |
| 52 | 6 | Expected Profit | Derived | Automatic | Sale − current total | Read-only | Derived | Pricing capability | Preview | MATCH | No gap in tested path |
| 53 | 6 | Profit Margin | Derived | Automatic | Policy-defined margin | Absent | Not exposed | No proven field | UI | MISSING | No current display or persistence proof |
| 54 | 7 | Barcode | Required identity | Automatic/managed | Unique permanent; primary identity | Read-only family + input | Barcode authority available | Asset/barcode history | Runtime service | PARTIAL | Current screen is preview-only; no final allocation here |
| 55 | 7 | RFID | Optional | Generate/assign | Does not replace Barcode | Plain input | Runtime authority exists | RFID assignment table | UI/service | PARTIAL | No generate/assign action in this screen |
| 56 | 7 | Tag Printing | Optional action | Control | Print generated tag | Absent | Separate management capability | Tag infrastructure | Downstream | OUTSIDE_CURRENT_RECEIVE_SCOPE | Valid downstream function, not current preview action |
| 57 | 7 | Generate Barcode | Action | Control | Canonical generator | Absent | Canonical service exists | Barcode history | Downstream | OUTSIDE_CURRENT_RECEIVE_SCOPE | Must occur in canonical receive/management, not a second service |
| 58 | 7 | Print Barcode | Action | Control | Print | Absent | Not part of current route | Barcode/tag management | Downstream | OUTSIDE_CURRENT_RECEIVE_SCOPE | Downstream action |
| 59 | 7 | Generate RFID | Action | Control | Optional unique RFID | Absent | RFID service exists | RFID assignments | Downstream | OUTSIDE_CURRENT_RECEIVE_SCOPE | Downstream action |
| 60 | 7 | Assign RFID | Action | Control | Optional assignment | Absent | RFID service exists | RFID assignments | Downstream | OUTSIDE_CURRENT_RECEIVE_SCOPE | Downstream action |
| 61 | 8 | Item Status | Required | Server lifecycle | Available/Reserved/Pending Transfer/Workshop/Returned/Missing/Melted/Sold | Review/context only | Asset lifecycle authority | Asset operational_status | Server architecture | MATCH_VIA_CANONICAL_ARCHITECTURE | Final transition not run in this control |
| 62 | 8 | Branch | Required | Server context | Company/branch authority | Read-only context | Branch-scoped | Asset branch | Server context | MATCH_VIA_CANONICAL_ARCHITECTURE | Final persistence not run |
| 63 | 8 | Location | Optional/required by workflow | DB-backed selector | Location and audit | Shared DB selector | Branch-scoped locations | Asset location_id | Contract/runtime | MATCH_VIA_CANONICAL_ARCHITECTURE | Client manual-entry option safely constrained to DB authority |
| 64 | 9 | Asset ID | System | Generated | Unique system identity | Read-only context | Runtime-generated | Asset primary identity | Server | MATCH_VIA_CANONICAL_ARCHITECTURE | Final creation not run |
| 65 | 9 | Created By | System | Generated | User identity | Read-only context | Auth context | Asset created_by | Server | MATCH_VIA_CANONICAL_ARCHITECTURE | Final creation not run |
| 66 | 9 | Creation Date/Time | System | Generated | Timestamp | Read-only context | Server timestamps | Asset timestamps | Server | MATCH_VIA_CANONICAL_ARCHITECTURE | Final creation not run |
| 67 | 9 | Last Modified By | System | Generated | Audit identity | Not shown | Audit infrastructure | Asset updated_by capability | Server | PARTIAL | Not displayed/wired in current screen |
| 68 | 9 | Last Modified Date/Time | System | Generated | Audit timestamp | Not shown | Timestamps exist | Asset updated_at | Server | PARTIAL | Not displayed/wired in current screen |
| 69 | 9 | Notes | Optional | Manual | Piece/system notes | No dedicated system Notes field | Shared notes only | No confirmed Diamond piece field | UI/source | PARTIAL | Current note handling is component/shared-path dependent |
| 70 | 9 | Audit Trail | System | Automatic | Audit on create/edit/cost/price/component/tag/status/location | Audit summary only | Audit/event services exist | audit_logs/events | Server | PARTIAL | Complete event coverage cannot be proven without persistence/edit actions |
| 71 | 9 | Device / Employee Code / Reason | System/audit | Generated/manual reason | Audit context | Not shown | No complete current payload | Audit capability partial | Server | PARTIAL | Required audit dimensions not demonstrated |

Field summary: 30 matches including canonical matches, 30 partial, 5 missing, 1 bug, 0 conflicts, and 5 downstream/out-of-current-receive-scope controls. Total = 71.

## 8. Description ↔ Item Code Mapping

The client list covers Diamond Anklet, Bar, Bangle, Bracelet, Brooch, Chain, Choker, Coin, Crown, Earrings, Full Set, Necklace, Pendant, Pendant Chain, Ring, Twins Ring, and Wedding Band.

### Evidence

- `diamond-jewellery-profile.service.js` exposes `ITEM_CODES` and `ITEM_DESCRIPTIONS` as separate arrays.
- The page sends `itemCode: draft.itemCode || undefined` (`page.tsx`, line 102 in the audited source snapshot).
- `barcode-identity.service.js` resolves `itemCode || inventory.defaultItemCode || configuredFallbackItem?.code || ""` and selects the first compatible active configured item when no code is supplied.
- The current Diamond DD inventory configuration has no reliable description-derived code in the UI path.
- The accepted controlled asset has `DDRNG21000001`, which is consistent with an explicitly supplied `RNG` code, not proof that description selection itself performs the mapping.

| Test question | Actual | Status |
|---|---|---|
| Description selection is canonical source for item code | No; item code is a separate optional draft field | `PARTIAL` |
| Brooch selected automatically becomes BRH | Not proven; absent item code can reach fallback selection | `BUG` risk |
| Canonical code reaches barcode item segment | Yes when supplied explicitly | `MATCH_VIA_CANONICAL_ARCHITECTURE` |
| Server rejects inconsistent description/code pair | No such cross-field rule identified | `MISSING` |

Root cause: the UI and profile service maintain description and code independently, while barcode generation intentionally falls back to configured item-code order when no code is supplied. This is a source binding defect, not a barcode-format defect. No fix was applied.

## 9. Gold Information

The runtime service has `CARAT_TO_GRAMS = "0.20"`, computes `net = gross - totalDiamondWeight × 0.20`, validates a net override as nonnegative and not greater than gross, and computes pure gold from net and karat only. The valid Preview used gross 10 and total diamond weight 1.5 CT and returned net 9.70000000, diamond grams 0.30000000, and pure gold 8.48750000.

Scale capture is not implemented in the current UI. The current UI exposes numeric inputs only. The client’s 24K Gold Bar semantic is not represented as a distinct item/product choice; numeric 24K exists.

### Net override read-only proof

With gross `10` and net override `12`, the profile Preview returned HTTP 422 and the page showed `DIAMOND_NET_GOLD_WEIGHT_INVALID`. The shared preview was not marked READY. No mutation followed.

## 10. Diamond Component Matrix

The backend independently normalizes component carat, name, type, color, treatment, clarity, shape, and optional cost. It stores detail columns for tone, saturation, origin, position, and setting, but the current UI uses plain text or omits several fields. Existing database master categories are present for Diamond Type, Color, Clarity, Cut, Shape, Treatment, Origin, Tone, Tone Level, Saturation, Position, Setting, and Certificate Authority.

The principal distinction is therefore capability versus binding: the schema/service can hold more than the current screen can collect or validate against the client’s master-backed rules.

## 11. Diamond Color Root Cause

**Symptom:** client-defined Fancy color values can produce `DIAMOND_COLOR_INVALID`.

**Client requirement:** D–Z plus separate Champagne, Cognac, Fancy Black, Fancy Blue, Fancy Pink, Fancy Red, and Fancy Yellow values; multiple values may be selected.

**Current source:** `diamond-jewellery-profile.service.js` defines `DIAMOND_COLORS` as D–Z plus one literal `Fancy`. `normalizeColors()` rejects values outside that array. The frontend field is plain text and does not use the contract’s master rows.

**Official DB:** `profile_master_data` has 30 active `DIAMOND_COLOR` rows, including Champagne, Cognac, and the separate Fancy color labels.

**Runtime:** valid D color preview returned 200. The source path for a client Fancy subtype would fail normalization with `DIAMOND_COLOR_INVALID`; no mutation was attempted.

**Root cause classification:** `BUG` / master-contract binding mismatch. The issue is not Gold Color contamination; it is a mismatch between the service’s hardcoded list and the official Diamond Color master vocabulary, compounded by a free-text UI.

**Minimum safe fix to be considered in a later approved batch:** make the server contract/normalizer consume the authoritative Diamond Color category with an explicit compatibility decision for stored values, then bind the UI to that contract. No fix was applied.

## 12. CT Reconciliation

| Case | Profile Preview | Shared Preview | Browser evidence | Status |
|---|---|---|---|---|
| Valid declared 1.5 CT and component 1.5 CT | 200 / READY | 200 / READY | Arabic and English screens populated derived values | `MATCH` |
| Declared 1.5 CT and component 1.4 CT | 422 | Not READY | DOM showed `DIAMOND_COMPONENT_CARAT_TOTAL_MISMATCH` | `MATCH` |
| Positive component carat | Accepted | Accepted | Valid preview | `MATCH` |
| Final Receive block on mismatch | Final Receive unavailable in this screen | Not applicable to mutation | Page remains preview-only | `PARTIAL` |

## 13. Purchase Information

Historical gold price, making price, component cost total, VAT base/amount, and total purchase cost were returned by Preview. In the valid test, historical gold value was 1,940.00 AED, total purchase was 2,211.60 AED, and shared tax summary was taxable base 2,211.60 AED with VAT 309.62 AED under `STANDARD_VAT`.

The current page does not expose a separate profile Purchase VAT input; it shows the shared tax summary. Historical freeze after an actual Receive could not be tested because the page has no final Receive action and this control forbids Receive.

## 14. Current Cost / Gold Center Binding

Gold Center health was 200 / HEALTHY with provider `GOLDAPI_IO`, mode `LIVE_PROVIDER`, currency AED, `fresh=true`, `stale=false`, and `isMockFallback=false`. After valid Preview, the page displayed source `GOLDAPI_IO` and current rate `466.92114336`; current total was `5163.21400327`.

The initial blank rate before valid inputs is caused by the preview dependency/state, not by a provider failure: the rate populates after the valid Preview request. No API field-name mismatch or stale provider response was observed. Manual-by-permission current-rate behavior was not demonstrated by this read-only control.

## 15. Derived Field Refresh

| Derived field | Empty state | Valid Preview | Invalid state | Classification |
|---|---|---|---|---|
| Diamond grams | `—` | 0.30000000 | invalid/preview not ready | `AUTO_WORKING` |
| Calculated Net Gold | `—` | 9.70000000 | invalid/preview not ready | `AUTO_WORKING` |
| Final Net Gold | `—` | 9.70000000 | 422 on invalid override | `AUTO_WORKING` |
| Pure Gold | `—` | 8.48750000 | invalid/preview not ready | `AUTO_WORKING` |
| Historical Gold Value | `—` | 1940.00 | invalid/preview not ready | `AUTO_WORKING` |
| Total Making | `—` | 0.00 | invalid/preview not ready | `AUTO_WORKING` |
| Total Diamond Cost | `—` | 0.00 | invalid/preview not ready | `AUTO_WORKING` |
| Purchase VAT | `—` | 309.62 in shared summary | invalid/preview not ready | `AUTO_WORKING` |
| Total Purchase Cost | `—` | 2211.60 | invalid/preview not ready | `AUTO_WORKING` |
| Current Gold Rate | `—` | 466.92114336 | invalid/preview not ready | `AUTO_WORKING` |
| Current Gold Value | `—` | populated | invalid/preview not ready | `AUTO_WORKING` |
| Current VAT | `—` | shared summary only | invalid/preview not ready | `PARTIAL` |
| Current Total Cost | `—` | 5163.21400327 | invalid/preview not ready | `AUTO_WORKING` |
| Minimum Selling Price | `—` | current total | invalid/preview not ready | `AUTO_WORKING` |
| Expected Profit | `—` | 1836.78599673 | invalid/preview not ready | `AUTO_WORKING` |
| Profit Margin | `—` | not displayed | not applicable | `NOT_IMPLEMENTED` |

The invalid-state behavior clears readiness and displays the server error. No stale valid Preview was observed after the tested invalid changes. The missing Profit Margin and separately rendered Current VAT remain compliance gaps.

## 16. Sales

Sale price, maximum discount, minimum price, and expected profit are present to varying degrees. The current `basicReady` predicate does not require sale price, so a user can reach profile/shared Preview readiness without the client-required Piece Selling Price. Markup Percentage and Profit Margin are absent. No below-minimum sale mutation was tested or performed.

## 17. Tag / Barcode / RFID

The frozen architecture correctly treats Barcode as primary and RFID as optional. The current page shows the DD family and RFID input but not generation/printing/assignment controls. Those actions belong to canonical Receive or Barcode/RFID Management; adding a second local generator would conflict with the frozen architecture. Existing controlled DB evidence confirms one barcode history row per controlled Asset, but this audit did not create or allocate another barcode.

## 18. Status

The Asset model and runtime provide branch/location, operational status, condition, tag state, and audit-capable fields. The current receive screen displays branch/company context and a DB-backed location selector. This is a safe canonical difference from a client-entered arbitrary location: the server remains authoritative and branch-scoped. No status mutation was performed.

## 19. Audit / System

The source supports Asset ID, created/updated identity and timestamps, audit logs/events, cost snapshots, barcode history, component detail, and current valuation. The current page is not a saved Asset Details view and does not display the complete client audit field set, device, employee code, reason, or all post-receive actions. This is a partial receive/UI coverage result, not evidence of corruption.

## 20. Validation Matrix

| Validation | Client Rule | UI | Profile Preview | Shared Preview | Receive Backend | DB Constraint | Status |
|---|---|---|---|---|---|---|---|
| Description required | Yes | Basic readiness checks it | Server requires it | Inherited | Canonical path expected | Asset may be nullable for legacy | `PARTIAL` |
| Supplier required | Yes | Shared selector | Shared path | Required in shared payload | Canonical route | Supplier linkage exists | `PARTIAL` |
| Purchase Date required | Yes | Shared field | Shared path | Required in shared payload | Canonical route | Date capability exists | `PARTIAL` |
| Gross Weight required | Yes | Numeric | Required | Inherited | Canonical path | Weight fields | `MATCH` |
| Gross > 0 | Yes | Numeric | `decimal` min | Inherited | Canonical path | Runtime validation | `MATCH` |
| Net required | Derived/override | Derived/override | Derived | Inherited | Canonical path | Net field | `MATCH` |
| Net <= Gross | Yes | Not fully client-blocked before request | 422 | Inherited | Expected | No direct DB proof | `MATCH` |
| Net >= 0 | Yes | Not fully client-blocked before request | 422 | Inherited | Expected | No direct DB proof | `MATCH` |
| Total Diamond Weight >= 0 | Yes | Numeric | Required/nonnegative | Inherited | Canonical path | Weight fields | `MATCH` |
| Stone Carat required | Yes | Numeric | Required | Inherited | Canonical path | Component detail | `MATCH` |
| Stone Carat > 0 | Yes | Numeric | Enforced | Inherited | Canonical path | Runtime validation | `MATCH` |
| Component CT total matches declared | Yes | Preview feedback | 422 mismatch | 422/inherited | Canonical path | No sole DB constraint | `MATCH` |
| Stone Name required | Yes | Default text | Blank defaults to Diamond | Inherited | Canonical path | Text detail | `PARTIAL` |
| Diamond Type required | Yes | Select | Enforced | Inherited | Canonical path | Detail | `MATCH` |
| Diamond Color required | Yes | Text | Enforced but vocabulary mismatch | Inherited | Canonical path | Detail | `BUG` |
| Diamond Clarity required | Yes | Select | Enforced | Inherited | Canonical path | Detail | `MATCH` |
| Diamond Shape required | Yes | Select | Enforced | Inherited | Canonical path | Detail | `MATCH` |
| Pure Gold >= 0 | Derived | Display | Derived | Inherited | Weight/cost logic | `MATCH` |
| Purchase Cost >= 0 | Yes | Inputs | Decimal validation | Inherited | Cost path | `MATCH` |
| Current Cost >= 0 | Yes | Derived/inputs | Decimal validation | Inherited | Valuation path | `MATCH` |
| Selling Price >= 0 | Yes | Input but not basic gate | Optional in current service | Inherited | Asset price | `PARTIAL` |
| Asset ID unique | System | Not in preview | N/A | Canonical receive | Asset identity | `MATCH_VIA_CANONICAL_ARCHITECTURE` |
| Barcode unique | System | Not allocated in preview | N/A | Canonical receive | Barcode/history | `MATCH_VIA_CANONICAL_ARCHITECTURE` |
| Certificate dependency | Number→authority | Plain inputs | Server enforced | Inherited | Certificate table | `MATCH` |
| Other-value descriptions | Required for some Other values | Not consistently conditional | Not consistently enforced | Inherited | No complete constraint | `PARTIAL` |
| All required fields before save | Yes | No final Save/Receive | Preview subset | No final call | No final proof | `PARTIAL` |

## 21. Data Source / Binding Matrix

| UI Field | Expected Source | Actual Source | Data Loaded? | Correct Binding? | Runtime Evidence | Status |
|---|---|---|---|---|---|---|
| Supplier | SERVER_CONTEXT / DB | Contract suppliers | Yes | Yes | QA supplier options rendered | `MATCH` |
| Location | DB_MASTER / SERVER_CONTEXT | Contract branch locations | Yes | Yes | Active location rendered | `MATCH` |
| Tax Treatment | TAX_ENGINE / SERVER | Contract tax policy + shared payload | Yes | Yes | STANDARD_VAT selected; VAT summary returned | `MATCH` |
| Gold rate | GOLD_CENTER | Preview response | Yes after valid Preview | Yes | 466.92114336 rendered | `MATCH` |
| Item Description | DB_MASTER | Frontend static array | Yes | No | UI options differ from DB labels | `PARTIAL` |
| Gold Color | DB_MASTER | Text input | No master binding | No | No returned GOLD_COLOR selector | `PARTIAL` |
| Diamond Type | DB_MASTER | Frontend/service constants | Yes | Partial | Aliases normalize labels | `PARTIAL` |
| Diamond Color | DB_MASTER | Plain text + service constants | DB rows exist, UI not bound | No | Service has D–Z + Fancy only | `BUG` |
| Clarity | DB_MASTER | Frontend/service list | Yes | Partial | Select and 11 DB rows | `PARTIAL` |
| Cut | DB_MASTER | Plain text | DB rows exist | No | Service validates value | `PARTIAL` |
| Shape | DB_MASTER | Frontend/service list | Yes | Partial | Select and 29 DB rows | `PARTIAL` |
| Origin | DB_MASTER | Plain text | DB rows exist | No | Service accepts free text | `PARTIAL` |
| Tone / Level / Saturation | DB_MASTER | Service/detail capability | Not in UI | No | Fields omitted from form | `MISSING`/`PARTIAL` |
| Certificate Authority | DB_MASTER | Plain text | DB rows exist | No | Dependency server-side | `PARTIAL` |
| Preview-derived costs | PROFILE_PREVIEW | Preview response | Yes | Yes | Values populate after 200 | `MATCH` |
| Shared tax summary | SHARED_RECEIVE_PREVIEW | Shared preview response | Yes | Yes | Base/VAT rendered | `MATCH` |
| Barcode | SERVER_GENERATED | Read-only DD family / optional input | Not allocated in preview | Partial | Final Receive absent | `PARTIAL` |
| RFID | SERVER_GENERATED / management | Plain input | No assignment action | Partial | No mutation allowed | `PARTIAL` |
| Asset ID/audit | POST_RECEIVE_DB | Context text only | Pending | Canonical authority correct | Existing asset evidence | `MATCH_VIA_CANONICAL_ARCHITECTURE` |

## 22. Master Data Matrix

| Category | Client values | Official DB | Contract/service | UI | Status |
|---|---|---:|---|---|---|
| DIAMOND_TYPE | 3 exact labels | 3 active | Short internal values + aliases | Select | `PARTIAL` |
| DIAMOND_COLOR | D–Z + separate Fancy colors | 30 active | D–Z + one `Fancy` | Plain text | `BUG` |
| DIAMOND_CLARITY | 11 | 11 active | Matching list | Select | `MATCH_VIA_CANONICAL_ARCHITECTURE` |
| DIAMOND_CUT | 5 | 5 active | Matching list | Plain text | `PARTIAL` |
| DIAMOND_SHAPE | 29 | 29 active | Matching list | Select | `MATCH_VIA_CANONICAL_ARCHITECTURE` |
| DIAMOND_TREATMENT | 9 | 9 active | Matching list | Select | `PARTIAL` |
| DIAMOND_ORIGIN | 15 | 15 active | No UI master selector | Plain text | `PARTIAL` |
| DIAMOND_TONE | 14 | 14 active | Service detail support | Absent | `PARTIAL` |
| DIAMOND_TONE_LEVEL | 9 | 9 active | Not exposed in form | Absent | `MISSING` |
| DIAMOND_SATURATION | 10 | 10 active | Service detail support | Absent | `PARTIAL` |
| DIAMOND_POSITION | 7 | 7 active | Free text accepted | Plain text | `PARTIAL` |
| DIAMOND_SETTING | 47 | 47 active | Free text accepted | Plain text | `PARTIAL` |
| CERTIFICATE_AUTHORITY | 16 | 16 active | Normalized dependency | Plain text | `PARTIAL` |
| GOLD_ITEM_DESCRIPTION | Client Diamond descriptions | 19 active, Gold-labelled | Separate frontend list | Select | `PARTIAL` |
| GOLD_COLOR | Yellow/White/Rose/Multiple | 4 active | Not bound by page | Text | `PARTIAL` |

Master data is present and active for the Diamond categories. The main defect is not missing official rows; it is the failure to use those rows consistently in the contract, service, and UI.

## 23. AR/EN Parity

Both `/ar/inventory/diamond-jewellery` and `/en/inventory/diamond-jewellery` loaded the same nine-section functional surface. Both displayed the same valid Preview values, CT reconciliation status, current Gold Center rate, READY profile/shared preview states, and blocked final Receive state. Arabic uses RTL labels and English uses translated labels; numeric CT/g/AED values remain readable.

Status: `PARTIAL`. The two locales are behaviorally aligned, but both inherit the same missing fields, master-data binding gaps, and acceptance-only gating. No locale-specific business-rule divergence was observed.

## 24. Browser / Network Evidence

Read-only browser evidence:

| Request | Result |
|---|---|
| `GET /api/v1/inventory-v2/diamond-jewellery/contract` | 200 in Arabic and English |
| Valid profile Preview | 200 |
| Valid shared `receive-preview` | 200 |
| CT mismatch profile Preview | 422 with `DIAMOND_COMPONENT_CARAT_TOTAL_MISMATCH` |
| Net override > gross profile Preview | 422 with `DIAMOND_NET_GOLD_WEIGHT_INVALID` |
| Final Receive | Not called |
| Browser console errors/warnings after journey | `[]` |

Non-blocking runtime noise in backend logs included a transient `/api/v1/auth/accessible-companies` 401 and repeated `/uploads/...instagram...png` 404. These were not caused by the Diamond Preview contract and are classified as P3 observability/asset noise.

## 25. Known Symptoms Root Causes

| Symptom | Client requirement | Root cause | Source files | Runtime evidence | Severity | Status | Minimum fix needed |
|---|---|---|---|---|---|---|---|
| `DIAMOND_COLOR_INVALID` | Master-backed D–Z + separate Fancy colors | Hardcoded service list has one `Fancy`; DB has separate values; UI is free text | `diamond-jewellery-profile.service.js`, page, `profile-master-data.service.js` | Master rows present; service normalization rejects unsupported label | P1 | `BUG` | Align contract/normalizer/UI with approved master vocabulary |
| Description/item code mismatch | Selected description must determine canonical code/barcode segment | `itemCode` is optional and barcode service chooses configured fallback when absent | page, `barcode-identity.service.js` | `DDRNG...` only proves explicit RNG path; no description mapping | P1 | `BUG` risk | Add server-authoritative description/code mapping and consistency validation |
| CT mismatch | Sum components exactly equals declared total | Implemented correctly | profile service/routes/page | 422 and readiness cleared | P2 | `MATCH` | None for audited behavior |
| Net override > gross | Override ≤ gross | Implemented in service | profile service/page | 422 `DIAMOND_NET_GOLD_WEIGHT_INVALID` | P2 | `MATCH` | None for audited behavior |
| Gold Center visible but rate blank | Current rate after valid dependencies | Rate is preview-dependent; blank before valid Preview is expected | page, profile service | Populated 466.92114336 after valid Preview | P2 | `MATCH` | Later UX may clarify pre-preview state; no business fix required |
| Derived fields remain `—` | Populate after valid Preview | Empty/invalid state intentionally has no derived result | page/service | Valid state populated; invalid state not READY | P2 | `PARTIAL` | Add complete field coverage and refresh proof in next batch |
| Profile Preview incomplete | Required fields before preview | Current basic gate omits several client-required fields; server catches some later | page/service | Valid test READY; invalid tests INCOMPLETE | P1 | `PARTIAL` | Align readiness gating with client-required field matrix |
| Shared Supplier V2 Preview not ready | Shared preview after profile valid | Depends on profile preview and shared supplier/tax/location values | page/erp route | Valid test READY; invalid test NOT_READY | P1 | `PARTIAL` | Complete canonical field/validation contract before enabling Receive |
| Final Receive still Owner Authorization wording | Normal user should receive when both previews READY | Page is intentionally preview-only acceptance control | page | Exact text rendered in AR/EN | P1 | `MISSING` | Replace acceptance-only control with approved canonical Receive UX in a later implementation batch |

## 26. Full Receive Journey Matrix

| Journey Step | Current Behavior | Expected Client/System Behavior | Status | Blocker |
|---|---|---|---|---|
| Inventory → Add/Receive | Canonical intake exists | Start from unified Inventory intake | `MATCH_VIA_CANONICAL_ARCHITECTURE` | No |
| Select Diamond Jewellery | Route loads | Select profile | `MATCH` | No |
| Load DB/master data | Contract loads suppliers, locations, tax, Diamond categories | All relevant fields use server-backed masters | `PARTIAL` | Yes for compliant data entry |
| Fill identification | Core fields exist | All client fields including images and item semantics | `PARTIAL` | Yes |
| Fill gold | Weight/formulas work | Manual/scale and complete karat semantics | `PARTIAL` | Scale/24K Bar gaps |
| Add components | Cards exist | All independent master-backed fields and conditional rules | `PARTIAL` | Yes |
| Profile Preview | 200/READY for valid tested subset | READY only when all required client fields are complete | `PARTIAL` | Gate incomplete |
| Shared Preview | 200/READY for valid subset | Tax/location/supplier parity | `PARTIAL` | Depends on field gaps |
| Receive button | Absent/blocked text | Enabled for authorized user when both previews READY | `MISSING` | Critical P1 |
| Canonical POST receive | Not called | `/purchase-orders/receive` Supplier V2 | `MATCH_VIA_CANONICAL_ARCHITECTURE` | UI has no caller |
| Confirmation | Not implemented in this page | Confirmation before mutation | `MISSING` | Yes |
| Success/error UX | Not implemented in this page | Show result and errors | `MISSING` | Yes |
| PO + Asset + Barcode | Existing canonical backend capability; no current run | Persist one PO/item/Asset/barcode | `MATCH_VIA_CANONICAL_ARCHITECTURE` | UI gate prevents proof |
| Asset Details navigation | Not available from current page | Navigate to created Asset | `MISSING` | Yes |

## 27. Receive Button / Gating

- A normal final Receive button/function is not present in the audited page.
- Section 8 exposes read-only status text, not an actionable disabled button.
- The page’s `basicReady` predicate requires contract, description, positive gross, declared CT, historical gold price, tax treatment, and at least one component. It does not require every client-required component field, supplier/location at this point, sale price, or all Section 1/9 fields.
- Profile Preview and Shared Preview can both become READY for the tested subset, but the page still shows the acceptance-only Owner Authorization stop.
- No function in the page calls `/purchase-orders/receive` or `/supplier-purchases/receive`.
- Confirmation, final mutation response handling, and Asset Details navigation are not implemented in this page.

This is the main reason `DIAMOND_FULL_RECEIVE_UI_READY = NO`.

## 28. Existing Asset Persistence Coverage

The existing controlled Asset was used read-only; no new Asset was created.

| Persisted evidence | Actual |
|---|---|
| PO | `PO-1787249363466` |
| PO item | `POI-1787249363519-1-1` |
| Asset | `AST-PUR-1787249363472-1-1-acuh` |
| Profile/status | `DIAMOND_JEWELLERY` / `AVAILABLE` |
| Barcode | `DDRNG21000001` |
| Branch/location | Branch-1 / `LOC-9a10f58e-4207-4512-8824-7a7b06159151` |
| Supplier | `SUP-001` |
| Weights/karat | gross 10, net 9.7, karat 21 |
| Cost/price | cost 3037, price 7000 |
| Components | 2 asset components and 2 Diamond detail rows |
| Detail examples | Natural D VS1 Round 1 CT; Lab Grown F SI1 Princess 0.5 CT |
| Supporting rows | origin, purchase cost revision, current valuation, movement, journals, audit, idempotency exist in prior controlled evidence |

This proves backend persistence capability for the exercised subset. It does not prove that every client field is collected or persisted by the current UI. No additional write was made in this audit.

## 29. Downstream Coverage

| Client downstream area | Current evidence | Status |
|---|---|---|
| All Items | Existing inventory/Asset authority and identity | `RECEIVE_DATA_PARTIAL` |
| Item Details | Existing controlled Asset detail shows identity/cost/events/barcode/components | `RECEIVE_DATA_PARTIAL` |
| Stock Status | Asset operational status exists | `RECEIVE_DATA_SUFFICIENT` for core status, not all client columns |
| Item History | Movement/audit/event capability exists | `RECEIVE_DATA_PARTIAL` |
| Barcode/RFID Management | Barcode history and RFID assignment infrastructure exist | `RECEIVE_DATA_PARTIAL` |
| Melted/Returned Items | Lifecycle authority exists in broader system | `OUTSIDE_CURRENT_RECEIVE_SCOPE` |
| Inventory Audit | Audit logs/events exist | `RECEIVE_DATA_PARTIAL` |

Missing/partial persisted coverage is concentrated in named images/attachments, complete component master semantics, markup/margin, and complete audit dimensions.

## 30. Severity List

Severity definitions follow the control: P0 corruption/security/accounting/cross-scope, P1 blocks valid client-compliant Receive or a required field, P2 incomplete required behavior with workaround, P3 non-blocking UX/observability, P4 enhancement.

| ID | Finding | Severity | Classification | Blocks full Receive? |
|---|---|---|---|---|
| DJ-P1-01 | Final Receive action absent; acceptance-only Owner Authorization wording remains | P1 | MISSING / ACCEPTANCE_GAP | Yes |
| DJ-P1-02 | Description does not server-authoritatively resolve item code | P1 | BUG / INVENTORY | Yes for reliable barcode identity |
| DJ-P1-03 | Diamond Color service vocabulary conflicts with official master/client Fancy values | P1 | BUG / MISSING_MASTER_DATA_BINDING | Yes for affected colors |
| DJ-P1-04 | Current readiness predicate does not cover all client-required fields | P1 | ACCEPTANCE_GAP | Yes |
| DJ-P2-01 | Item images and named attachments absent from current flow | P2 | MISSING | No for pieces without attachments; yes for complete client compliance |
| DJ-P2-02 | Tone Levels absent; Tone/Saturation/Origin/Position/Setting not master-bound | P2 | PARTIAL | No for minimal valid preview |
| DJ-P2-03 | 24K Gold Bar item semantics absent | P2 | PARTIAL | Affected item only |
| DJ-P2-04 | Scale capture absent | P2 | MISSING | No, manual workaround |
| DJ-P2-05 | Markup and Profit Margin absent | P2 | MISSING | Yes for complete Sales section |
| DJ-P2-06 | Current/Purchase VAT not separately represented in profile UI | P2 | PARTIAL | No, shared summary workaround |
| DJ-P2-07 | Conditional treatment/Other description rules incomplete in UI | P2 | PARTIAL | Affected values only |
| DJ-P2-08 | Certificate Authority is not master-bound in UI | P2 | PARTIAL | No, server dependency exists |
| DJ-P2-09 | Final freeze-after-receive and duplicate certificate/attachment acceptance not runnable | P2 | OUTSIDE_CURRENT_RECEIVE_SCOPE | Yes for proof |
| DJ-P2-10 | Piece Notes and complete audit dimensions not wired | P2 | PARTIAL | No for core preview |
| DJ-P2-11 | Tag generation/printing actions absent from receive UI | P2 | OUTSIDE_CURRENT_RECEIVE_SCOPE | No if canonical downstream path is used |
| DJ-P2-12 | Asset Details navigation/success UX absent | P2 | MISSING | Yes for end-user journey |
| DJ-P3-01 | Transient accessible-companies 401 log noise | P3 | OBSERVABILITY | No |
| DJ-P3-02 | Repeated Instagram upload 404 noise | P3 | OBSERVABILITY | No |
| DJ-P3-03 | AR/EN labels inherit the same incomplete/acceptance-stage surface | P3 | UX | No |

Counts: P0 = 0, P1 = 4, P2 = 12, P3 = 3, P4 = 0.

## 31. Exact Files Involved

### Client authority

- `I:\WORK\client-requirements\Diamond (Jewellery  Loose Stone).docx`

### Audited source

- `I:\WORK\jewellery-erp-master\app\[locale]\(dashboard)\inventory\diamond-jewellery\page.tsx`
- `I:\WORK\jewellery-erp-master\backend\src\services\diamond-jewellery-profile.service.js`
- `I:\WORK\jewellery-erp-master\backend\src\routes\diamond-jewellery-profile.routes.js`
- `I:\WORK\jewellery-erp-master\backend\src\routes\erp.routes.js`
- `I:\WORK\jewellery-erp-master\backend\src\services\inventory-v2-runtime.service.js`
- `I:\WORK\jewellery-erp-master\backend\src\services\profile-master-data.service.js`
- `I:\WORK\jewellery-erp-master\backend\src\services\barcode-identity.service.js`
- `I:\WORK\jewellery-erp-master\backend\src\models\asset.model.js`
- `I:\WORK\jewellery-erp-master\backend\src\models\assetCertificate.model.js`
- `I:\WORK\jewellery-erp-master\backend\src\models\assetAttachment.model.js`
- `I:\WORK\jewellery-erp-master\backend\src\config\barcode-defaults.js`

### Audited official DB structures/data

- `profile_master_data`
- `assets`
- `asset_components`
- `asset_diamond_component_details`
- `asset_certificates`
- `asset_attachments`
- `asset_barcode_history`
- `asset_origins`
- `asset_purchase_cost_revisions`
- `asset_current_valuations`
- `inventory_asset_movements`
- `journal_entries`
- `journal_lines`
- `audit_logs`
- `idempotency_requests`

No source files other than this report were intentionally changed by this control.

## 32. No-Mutation Proof

| Guardrail | Result |
|---|---|
| Source changes | 0 intentional source changes |
| Test changes | 0 |
| DB business writes | 0 |
| Receives executed | 0 |
| PO created | 0 |
| Asset created | 0 |
| Barcode allocated | 0 |
| RFID mutation | 0 |
| Journal/payment mutation | 0 |
| Master-data mutation | 0 |
| Tax/Gold settings mutation | 0 |
| Migration/seed | Not created or executed |
| Backup | Not performed |
| Official DB | Read-only queries only |
| Browser | Read-only contract/Preview requests; no final Receive |
| Production | Not contacted |

The existing controlled Asset and existing counts were read-only evidence from prior authorized work; they were not created or changed by this audit.

## 33. Compliance Scorecard

| Control | Status |
|---|---|
| CLIENT_DOC_READ_COMPLETELY | YES |
| DIAMOND_JEWELLERY_BOUNDARY | MATCH_VIA_CANONICAL_ARCHITECTURE |
| SECTION_1_IDENTIFICATION | PARTIAL |
| SECTION_2_GOLD | PARTIAL |
| SECTION_3_DIAMOND | PARTIAL |
| SECTION_4_PURCHASE | PARTIAL |
| SECTION_5_CURRENT_COST | PARTIAL |
| SECTION_6_SALES | PARTIAL |
| SECTION_7_TAG | PARTIAL |
| SECTION_8_STATUS | MATCH_VIA_CANONICAL_ARCHITECTURE |
| SECTION_9_AUDIT_SYSTEM | PARTIAL |
| ITEM_DESCRIPTION_ITEM_CODE_MAPPING | BUG |
| MASTER_DATA_BINDING | PARTIAL |
| DIAMOND_COLOR_BINDING | BUG |
| CT_RECONCILIATION | MATCH |
| GOLD_CENTER_CURRENT_RATE_BINDING | MATCH |
| DERIVED_FIELDS | PARTIAL |
| AR_EN_PARITY | PARTIAL |
| CLIENT_VALIDATION_COVERAGE | PARTIAL |
| CANONICAL_RECEIVE_API | MATCH_VIA_CANONICAL_ARCHITECTURE |
| FINAL_RECEIVE_UI_ACTION | MISSING |
| PERSISTENCE_COVERAGE | PARTIAL |
| DOWNSTREAM_DATA_COVERAGE | PARTIAL |

## 34. Recommended Next Implementation Batch

No implementation was performed. The ordered gap list for a separately approved batch is:

A. Missing client-required fields/schema representations: item images, named attachments, Tone Levels, Markup, Profit Margin, complete audit fields, and complete client item semantics.

B. Master-data/source bindings: bind all Diamond component selectors and Gold Color/Description to server-backed categories; reconcile service contract with official rows.

C. Item Description → Item Code binding: define the canonical mapping and reject inconsistent description/code/barcode combinations server-side.

D. Diamond component field/validation fixes: enforce Stone Name/master behavior, conditional Treatment rules, Other descriptions, Fancy colors, and separate Tone/Tone Level/Saturation/Origin/Position/Setting rules.

E. Gold Center/current-cost binding: preserve the proven Gold Center path, add explicit current VAT representation, and prove authorized manual-rate behavior only if required by the client authority.

F. Derived-field refresh: complete current/purchase VAT, markup, margin, and invalid/restore lifecycle coverage.

G. AR/EN parity: preserve the same field/rule set and correct labels/required markers in both locales.

H. Final Receive UI action and permissions: implement one canonical action gated by both Profile Preview READY and Shared Preview READY; remove acceptance-only wording from normal end-user flow.

I. Confirmation/success/error UX: canonical Receive confirmation, result handling, and Asset Details navigation.

J. Focused tests: master binding, color vocabulary, item-code mapping, complete validation, tax parity, and no alternate workflow.

K. Browser acceptance: Arabic and English, contract/network/console, valid/invalid Preview, and final authorized path.

L. One controlled Receive only after UI/source gates pass and only under the separately approved database safety control. It was not performed here.

## 35. Final Tokens

CURRENT_CONTROL = `DARFUS-DIAMOND-JEWELLERY-CLIENT-DOC-COMPLIANCE-AUDIT`

PRIMARY_CLIENT_FILE = `Diamond (Jewellery  Loose Stone).docx`

CLIENT_FILE_READ_COMPLETELY = `YES`

CLIENT_FILE_TOTAL_PAGES = `82`

DIAMOND_JEWELLERY_ONLY_TARGET = `YES`

LOOSE_DIAMOND_IMPLEMENTED = `NO`

FIELD_REQUIREMENTS_TOTAL = `71`

FIELD_MATCH_COUNT = `30`

FIELD_PARTIAL_COUNT = `30`

FIELD_MISSING_COUNT = `5`

FIELD_BUG_COUNT = `1`

FIELD_CONFLICT_COUNT = `0`

FIELD_OUTSIDE_CURRENT_RECEIVE_SCOPE_COUNT = `5`

SECTION_1_IDENTIFICATION = `PARTIAL`

SECTION_2_GOLD = `PARTIAL`

SECTION_3_DIAMOND = `PARTIAL`

SECTION_4_PURCHASE = `PARTIAL`

SECTION_5_CURRENT_COST = `PARTIAL`

SECTION_6_SALES = `PARTIAL`

SECTION_7_TAG = `PARTIAL`

SECTION_8_STATUS = `MATCH_VIA_CANONICAL_ARCHITECTURE`

SECTION_9_AUDIT_SYSTEM = `PARTIAL`

ITEM_DESCRIPTION_ITEM_CODE_MAPPING = `BUG`

DIAMOND_COLOR_BINDING = `BUG`

DIAMOND_COMPONENT_CT_RECONCILIATION = `MATCH`

GOLD_CENTER_CURRENT_RATE_BINDING = `MATCH`

DERIVED_FIELD_REFRESH = `PARTIAL`

MASTER_DATA_BINDING = `PARTIAL`

AR_EN_PARITY = `PARTIAL`

CLIENT_VALIDATION_COVERAGE = `PARTIAL`

CANONICAL_RECEIVE_API = `MATCH_VIA_CANONICAL_ARCHITECTURE`

FINAL_RECEIVE_UI_ACTION = `MISSING`

ACCEPTANCE_ONLY_UI_GATING_PRESENT = `YES`

DIAMOND_FULL_RECEIVE_UI_READY = `NO`

P0_COUNT = `0`

P1_COUNT = `4`

P2_COUNT = `12`

P3_COUNT = `3`

DB_BUSINESS_WRITES = `0`

RECEIVES_EXECUTED = `0`

SOURCE_FILES_CHANGED = `0`

TEST_FILES_CHANGED = `0`

MIGRATION_CREATED = `NO`

MIGRATION_EXECUTED = `NO`

ONLINE_PRODUCTION_CONTACTED = `NO`

GATE = `DIAMOND_CLIENT_DOC_COMPLIANCE_AUDIT_COMPLETE`

NEXT_RECOMMENDED_STEP = `DIAMOND_CLIENT_DOC_GAP_IMPLEMENTATION_AND_FULL_RECEIVE_UI`

IMPLEMENTATION_ALLOWED = `NO_IN_THIS_CONTROL`

NEXT_BATCH_ALLOWED = `NO_AUTOMATIC_START`

STOP

No fix, Receive, Loose Diamond work, or further batch was started. Await Owner review.
