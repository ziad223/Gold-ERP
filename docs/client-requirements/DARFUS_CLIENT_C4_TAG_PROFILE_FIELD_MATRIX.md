# DARFUS CLIENT C4 — Tag Profile Field Matrix

Control: `DARFUS-CLIENT-C4-TAG-PROFILE-EXACT-PARITY-01`  
Mode: `READ_FIRST_PLUS_MINIMUM_SAFE_TAG_RENDERING_PLUS_BROWSER_PRINT_PROOF`  
Business authority: `I:\WORK\client-requirements\الباركود.docx`, read through all 8 rendered pages and all embedded tag images. System authority: accepted C1/C2/C3 records and the current Asset/Barcode/RFID authorities.

## Read-first evidence

- The client document defines the barcode as `INVENTORY CODE + ITEM CODE + KT + SERIAL`, with two-digit karat and six-digit serial. Pages 1–2 show the code tables and worked examples.
- The client document defines the common identity/lifecycle rules and the five profile tag examples on pages 5–8. The tag examples are illustrative values, while the field names/order shown on each profile are the tag contract.
- The current client tag implementation is shared: `features/printing/components/ClientBarcodeTagTemplate.tsx` delegates the back face to `features/printing/components/barcode-tags/BarcodeTagBacks.tsx` and the front face to `BarcodeTagFront.tsx`.
- C1 already froze the barcode generator/history authority. C3 already froze the shared profile/receive contract. C4 does not create a new data owner.

## Profile tag matrix

| TAG_FIELD | CLIENT_REQUIRED | PROFILE_FAMILIES | SOURCE_AUTHORITY | SOURCE_PATH | DISPLAY_LABEL_AR | DISPLAY_LABEL_EN | DISPLAY_ORDER | FORMAT_RULE | SHOW_IF_EMPTY | PRINT_ONLY / SCREEN_AND_PRINT | BARCODE_DEPENDENCY | RFID_DEPENDENCY | FINANCIAL_SENSITIVITY | PROFILE_SPECIFIC | STATUS |
|---|---|---|---|---|---|---|---:|---|---|---|---|---|---|---|---|
| Barcode | Yes | GBW, GBP, Diamond, Gem Stone, Pearl | Asset active barcode / barcode history | `Asset.barcode`; `lib/print/barcode-label.ts` | باركود | Barcode | Front / first | Stored value only; no reconstruction | No | Screen and print | Existing Barcode identity | No | No | No | EXACT |
| Price | No for GBW; Yes for GBP, Diamond, Gem Stone, Pearl | All five | Asset selling-price projection | `Asset.price`; dedicated selling-price authority | السعر | Price | Front / after Barcode | Canonical stored selling price; no frontend calculation | No | Screen and print | No | No | Yes | Yes for four families | EXACT |
| Karat + item/type title | Yes where the profile has a karat; loose profiles use the profile name without invented gold karat | GBW, GBP, Diamond, Gem Stone, Pearl | Asset karat/item/profile identity | `fmtKaratName`; profile registry and Asset identity | العيار + النوع | Karat + item/type | Back / first | Existing stored karat and name; loose profiles do not invent karat | No | Screen and print | Existing Barcode segments only | No | No | Yes | EXACT |
| GW | Yes | GBW | Asset gross weight | `Asset.grossWeight` | الوزن الإجمالي | GW | GBW back / 1 | Stored measurement, two decimals + `g` | No | Screen and print | No | No | No | Yes | EXACT |
| ST (stone weight) | Yes | GBW | Gold profile component/weight authority | `metadata.stoneWeight` | وزن الأحجار | ST | GBW back / 2 | Stored measurement, two decimals + `g` | No | Screen and print | No | No | No | Yes | EXACT |
| NT | Yes | GBW | Asset net weight | `Asset.netWeight` | الوزن الصافي | NT | GBW back / 3 | Stored measurement, two decimals + `g`; never recomputed | No | Screen and print | No | No | No | Yes | EXACT |
| MC | Yes | GBW | Gold profile making-charge fields | `metadata.makingCharge` and `metadata.minimumMakingCharge` | المصنعية | MC | GBW back / 4 | Existing seller presentation helper; no new formula | No | Screen and print | No | No | Yes | Yes | EXACT |
| Brand | Optional | GBP | Asset metadata authority | `metadata.brand` | العلامة التجارية | Brand | GBP back / before WT | Omit when empty; never invent | No | Screen and print | No | No | No | Yes | EXACT |
| WT | Yes | GBP | Asset gross weight | `Asset.grossWeight` | الوزن | WT | GBP back / after title | Stored measurement, two decimals + `g` | No | Screen and print | No | No | No | Yes | EXACT |
| DIS | Yes | GBP, Diamond, Gem Stone, Pearl | Profile selling/discount metadata | `metadata.discount` | الحد الأقصى للخصم | DIS | Last profile row | Stored display value; no default | No | Screen and print | No | No | Yes | Yes | EXACT |
| Carat | Yes | Diamond | Diamond component metadata | `metadata.carat` | القيراط | Carat | Diamond back / 1 | Stored value | No | Screen and print | No | No | No | Yes | EXACT |
| CC | Yes | Diamond | Diamond color and clarity metadata | `metadata.color`, `metadata.clarity` | اللون والوضوح | CC | Diamond back / 2 | `color – clarity`; omit only if both absent | No | Screen and print | No | No | No | Yes | EXACT |
| ST (gemstone row) | Yes, repeatable | Gem Stone | Gemstone component metadata | `metadata.stones[]` through `resolveStones` | الحجر | ST | Gem Stone back / one row per stone | `type – carat`; no synthetic rows | No | Screen and print | No | No | No | Yes | EXACT |
| Type | Yes | Pearl | Pearl profile metadata | `metadata.pearlType` | النوع | Type | Pearl back / 1 | Stored value | No | Screen and print | No | No | No | Yes | EXACT |
| SKU | Client common-field wording, but no canonical SKU authority is proven | None in C4 tags | None | C1/C3: `SKU_AUTHORITY = NOT_PROVEN` | — | — | — | Must not be derived from Barcode or item code | No | Neither | No | No | No | No | NOT_REQUIRED |
| RFID | Client common identity field, but not shown in the five tag examples | None in C4 tag face | Dedicated RFID assignment projection | `asset_rfid_assignments`; current Asset detail only | — | — | — | No implicit Barcode coupling | No | Neither for tag; detail remains separate | No | Yes (separate identity) | No | No | NOT_REQUIRED |
| Asset ID | System identity, not a client tag field | None | Asset | `Asset.id` | — | — | — | Do not substitute for Barcode | No | Neither | Yes only as source key | No | No | No | NOT_REQUIRED |
| Company name/logo | Not specified in client tag contract | None | Company settings | Existing generic print config | — | — | — | Must not be part of the exact profile field contract | No | Neither | No | No | No | No | NOT_REQUIRED |
| Branch/supplier/purchase date/status/audit | Common Asset/detail fields, not tag-face fields in the client examples | None | Asset projections | Asset detail endpoint and C3 common contract | — | — | — | Keep in detail/report projections, not tag face | No | Screen/detail only, not print tag | No | No | No | No | NOT_REQUIRED |
| Image | Client common-field wording, but no universal tag image authority is proven | None | No proven universal image owner | C1: `UNIVERSAL_IMAGE_AUTHORITY = NOT_PROVEN` | — | — | — | Must not be invented or copied into tag storage | No | Neither | No | No | No | No | NOT_REQUIRED |

## Exact profile order

| Profile | Front order | Back order | Empty optional rule |
|---|---|---|---|
| GBW | Barcode | title, GW, ST, NT, MC | Hide absent optional values; keep stored NT and do not calculate it in the renderer |
| GBP | Barcode, Price | title, optional Brand, WT, DIS | Hide Brand when empty; no fake price/discount |
| Diamond | Barcode, Price | title, Carat, CC, DIS | Hide absent values; no Cut/Cert rows because they are not in the client tag contract |
| Gem Stone | Barcode, Price | title, zero or more ST rows, DIS | Omit empty stone rows; do not create a synthetic ST row |
| Pearl | Barcode, Price | title, Type, DIS | Hide absent values; no Size/Quality rows because they are not in the client tag contract |

## Explicit exclusions

`SKU_AUTHORITY = NOT_PROVEN`. `UNIVERSAL_IMAGE_AUTHORITY = NOT_PROVEN`. Neither is derived, stored, or rendered by C4. RFID remains a separate Asset-linked identity and is not coupled to Barcode or added to the exact client tag face.

