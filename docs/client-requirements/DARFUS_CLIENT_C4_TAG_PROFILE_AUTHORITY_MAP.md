# DARFUS CLIENT C4 — Tag Profile Authority Map

Control: `DARFUS-CLIENT-C4-TAG-PROFILE-EXACT-PARITY-01`

| Concern | Canonical authority | Read path | C4 treatment | Mutation? |
|---|---|---|---|---|
| Asset identity | `assets` / Asset model | `GET /api/v1/inventory-v2/assets/:id` | Consumer only | No |
| Barcode | Asset active value plus `asset_barcode_history` | Asset detail/list projection; C1 barcode service | Render stored Barcode exactly; no generation/replacement | No |
| Barcode reprint identity | Asset + active Barcode | Existing `tags/print` contract and client-only print renderer | Same Asset + same active Barcode; no new allocation | No |
| RFID | `asset_rfid_assignments` current assignment | Asset detail projection | Keep separate; not rendered in exact profile tag | No |
| Profile family | Frozen profile registry | `GET /api/v1/inventory-v2/profiles` and Asset inventory profile | Select one of GBW/GBP/Diamond/Gem Stone/Pearl projection | No |
| Profile fields | Existing Asset metadata/components/profile detail | Asset detail plus profile metadata | Read at render time; no tag-specific copy | No |
| Price | Asset selling-price authority | Asset `price` from detail/read projection | Render only for GBP/Diamond/Gem Stone/Pearl; never calculate | No |
| Gold weights | Asset/gold-details/profile authority | `grossWeight`, `netWeight`, profile metadata | Render stored values; no re-calculation | No |
| Diamond fields | Diamond component metadata | `metadata.carat`, `metadata.color`, `metadata.clarity` | Render only client-required rows | No |
| Gemstone fields | `metadata.stones[]` | `resolveStones` | Render one ST row per actual stone | No |
| Pearl fields | Pearl profile metadata | `metadata.pearlType` | Render Type only for exact tag contract | No |
| Labels/order | C4 projection contract | `features/printing/components/barcode-tags/*` | Shared renderer + profile-specific projection | No |
| Print safety | Browser print document | `renderPrintDocument` / `printHtmlDocument` | Client-side print only for C4; no business POST | No |
| Tag audit event | Existing backend route | `POST /api/v1/inventory-v2/assets/:id/tags/print` | Not called by C4 preview/print proof; existing route remains separately governed | No |

## Frozen boundaries

- `TAG_RENDERER_OWNS_BUSINESS_DATA = NO`.
- `DUPLICATE_TAG_DATA_AUTHORITY = NO`.
- `BARCODE_REDESIGN = NO`.
- `BARCODE_RFID_COUPLING = NO`.
- `SKU_AUTHORITY = NOT_PROVEN`.
- `UNIVERSAL_IMAGE_AUTHORITY = NOT_PROVEN`.
- No migration, tag table, tag JSON owner, write endpoint, receive, asset update, barcode replacement, RFID assignment, movement, journal, or revision is part of C4.

