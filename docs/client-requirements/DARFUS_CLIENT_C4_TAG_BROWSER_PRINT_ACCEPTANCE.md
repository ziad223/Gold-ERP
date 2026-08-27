# DARFUS CLIENT C4 — Tag Browser / Print Acceptance

Control: `DARFUS-CLIENT-C4-TAG-PROFILE-EXACT-PARITY-01`  
Mode: `READ_FIRST_PLUS_MINIMUM_SAFE_TAG_RENDERING_PLUS_BROWSER_PRINT_PROOF`

## Browser boundary

The acceptance used the existing authenticated frontend at `http://localhost:3000`. No second frontend was started. The browser interactions were limited to navigation, branch-context selection, visible Asset detail inspection, and the client-side tag print control. No receive, sale, replacement, RFID assignment, tag-write, or other business mutation was submitted.

## Read-only profile proof

| Profile | Asset / Barcode | Branch context | Browser result | Exact visible profile rows | Result |
|---|---|---|---|---|---|
| Gold By Weight | `AST-PUR-1787083585731-1-1-plz5` / `GWRNG21000001` | Branch-1 | `data-c4-tag-preview` count `1` | Barcode, title, `GW`, `ST` when present, `NT`, `MC` when present; no Price | PASS |
| Gold By Piece | `AST-PUR-1787090870838-1-1-9k4e` / `GPRNG21000001` | Branch-1 | `data-c4-tag-preview` count `1` | Barcode, Price, title, `WT`; empty optional rows hidden | PASS |
| Diamond Jewellery | `AST-PUR-1787292943243-1-1-9juc` / `DDBRH21000001` | Branch-1 | `data-c4-tag-preview` count `1` | Barcode, Price, title; empty Carat/CC/DIS rows hidden | PASS |
| Gem Stone Jewellery | `AST-PUR-1787330905253-1-1-zo5f` / `GSRNG21000001` | Branch-1 | `data-c4-tag-preview` count `1` | Barcode, Price, title; ST rows are emitted only from actual stone data | PASS |
| Pearl Jewellery | `AST-PUR-1787391626468-1-1-wf0w` / `PLRNG18000001` | Branch-2 | `data-c4-tag-preview` count `1` | Barcode, Price, title; empty Type/DIS rows hidden | PASS |

The Pearl Asset intentionally failed closed when first opened under Branch-1 because it belongs to Branch-2. After the existing read-only branch selector was changed to Branch-2, the same Asset detail loaded and the tag preview appeared. No backend or database write occurred during that context check.

## Arabic and English proof

| Locale | URL | Direction | Preview | Print control | Console |
|---|---|---|---|---|---|
| English | `http://localhost:3000/en/inventory/AST-PUR-1787391626468-1-1-wf0w` | LTR | `1` | `Print tag`, enabled for the authorized user | No warning/error entries in the fresh tab |
| Arabic | `http://localhost:3000/ar/inventory/AST-PUR-1787391626468-1-1-wf0w` | RTL | `1` | `طباعة التاج`, enabled for the authorized user | No warning/error entries in the fresh tab |

The rendered Arabic notice was: `المعاينة والطبـاعة للعرض فقط؛ الهوية الحالية للأصل والباركود لا تتغير.` The English notice states that preview and print are read-only and that Asset/active Barcode identity is unchanged.

## Print safety

- The visible print control is permission-gated through the existing `printBarcode` permission.
- `ClientAssetTagPreview` uses `renderPrintDocument` and `printHtmlDocument`; it does not import `apiClient` and does not call the backend tag-write endpoint.
- The existing backend `POST /api/v1/inventory-v2/assets/:id/tags/print` remains a separate, governed audit route. C4 did not call it.
- The browser harness exposed the print control and client print handler. System print-popup capture is not treated as a business success signal; no claim is made that a physical printer completed a job.

## Network / mutation observation

Read-only health requests returned:

| Endpoint | Method | Result |
|---|---:|---|
| `/api/v1/health` | GET | 200 |
| `/api/v1/health/db` | GET | 200 |
| `/api/v1/health/redis` | GET | 200 |
| `/api/v1/health/gold` | GET | 200; `HEALTHY`, `GOLDAPI_IO`, `AED`, fresh |

The profile journeys were navigations to existing Asset detail URLs. The C4 preview/print path contains no business POST call. Therefore `TAG_NETWORK_PROOF = PASS` for the C4 no-mutation boundary.

## Browser conclusion

`AR_PRINT_UI = PASS`  
`EN_PRINT_UI = PASS`  
`TAG_NETWORK_PROOF = PASS`  
`TAG_REPRINT_BUSINESS_DELTA = 0`

