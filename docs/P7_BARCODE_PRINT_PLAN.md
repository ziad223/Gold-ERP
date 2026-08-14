# P7 — Barcode / Print — Discovery & Safety Audit (P7.0)
> Discovery + design ONLY. No operational code changed in P7.0.
> Date: 2026-06-20.

## 1. Current barcode architecture
- **Asset.barcode** — plain STRING column, **NO unique constraint / no collision
  guard** (`backend/src/models/asset.model.js`). Editable.
- **Product** — barcode = `product_code`, with a **company-scoped UNIQUE index**
  `(company_id, product_code)` (`product.model.js`). Unique per company.
- **Generation** — backend creates a 13-digit value
  `String(timestamp).slice(-13).padStart(13,"6")` at receive (erp.routes ~3563),
  customer-gold (~1323), and others (~1800); the suppliers/purchases page also
  generates one client-side. No central generator, no per-company sequence,
  no uniqueness check for assets.

## 2. Current print architecture
- **Frontend-only, CSS print.** No backend print/barcode route exists.
- Inventory page `printBarcodeLabels()` builds items (selected or all filtered,
  per active tab products/assets) → `BarcodePrintTemplate` → `renderPrintDocument`
  → `printHtmlDocument` (paperSize `barcode-label`).
- Components: `features/printing/components/BarcodePrintTemplate.tsx` (the printed
  sheet), `features/barcodes/components/BarcodeLabelPreview.tsx` (a SEPARATE
  on-screen preview), plus Receipt/Invoice/Report print templates.
- **The "barcode" is decorative**: `BarcodeBars` renders 24 `<span>` bars whose
  widths derive from char codes — **NOT a real symbology (Code128/EAN/UPC) and
  NOT scannable**. **`showQrCode` renders a literal `<div>QR</div>` placeholder**,
  not a real QR. **No barcode/QR library is installed** (checked package.json).
- Label dimensions come from config CSS vars (widthMm/heightMm/columns/gaps).
  Batch printing IS supported (per-item `copies`).

## 3. Current barcode settings
- Stored under the central **`barcode` settings key** (company-scoped, API-backed,
  edited in the Settings "Barcode Template" tab — see P2.1). Consumed by the
  inventory print (`settings.barcode`). **Company-level, NOT branch-specific.**
- Fields: showCompanyName, showLogo, showAssetId, showName, showKarat, showWeight,
  showPrice, showType, showBranch, showSupplier, showDate, showQrCode, customText,
  widthMm, heightMm, fontSizePx, columns, copies, direction, showBorder, template.

## 4. What works now
- Printing labels for **all inventory types** (gold-piece/gold-weight/diamond/
  gemstone/pearl/watch + quantity products) — **no type restriction**.
- Both products (tab) and assets (tab); selected items or all filtered; batch with
  `copies`.
- Missing barcode does NOT block print (falls back to `id`).
- Field visibility toggles work; **price is correctly gated by `showPrice`** (no
  price leaks when off).
- Settings are DB-backed and consumed by the print path.

## 5. What does NOT work / is misleading
- **Barcode is not scannable** (decorative bars) — the #1 functional gap.
- **QR is a placeholder** (`<div>QR</div>`), not a real QR.
- **`showLogo` is misleading**: the print template renders the company-NAME text,
  NOT the logo image — the logo never appears on the printed label.
- **Preview ≠ print**: `BarcodeLabelPreview` (screen) and `BarcodePrintTemplate`
  (print) are separate implementations → drift risk between what's previewed and
  what prints.
- **Asset barcode uniqueness is not enforced** → duplicate barcodes possible.
- **No permission gate on the print action** (the button calls `printBarcodeLabels`
  directly; only cost display uses `SensitiveValue permission="viewCosts"`).

## 6. Why "a type won't print"
**No type/status restriction was found in the inventory print path** — products and
all asset types print, and a missing barcode falls back to `id`. The likely real
complaint is **barcode quality (not scannable)** rather than eligibility, OR a
different entry point (per-item label on the asset detail uses `BarcodeLabelPreview`,
which is preview-only). Documented: inventory batch printing is type-unrestricted;
if any block is reported, it is not in `printBarcodeLabels`.

## 7. Gap analysis
| area | gap | severity |
|---|---|---|
| Symbology | decorative bars, not scannable; no library | **high** |
| QR | placeholder only | high |
| Logo | config exists, never rendered on label | medium |
| Preview vs print | two separate components | medium |
| Asset barcode uniqueness | no constraint / collision guard | medium |
| Permission | print action ungated | medium |
| Branch scoping of settings | company-level only | low |
| Cross-company | none — data is API company-scoped (safe) | n/a |

## 8. Phased implementation plan
### P7.1 — Print eligibility + unified print payload
- Confirm/keep all types printable (no restriction); centralize the label payload
  builder so products + assets map to one shape; ensure a non-empty barcode (use
  asset.barcode||id||generated). No symbology change yet.
- **Acceptance:** all types print; one payload shape; missing-barcode handled; no
  regression to receipt/invoice print.

### P7.2 — Barcode label designer settings
- Round out the settings (already DB-backed): expose any missing field, make
  `showLogo` actually render the logo image, validate sizes. Keep company-scoped;
  optional branch override deferred.
- **Acceptance:** every toggle reflects on the label incl. logo; price stays gated.

### P7.3 — Real barcode + QR rendering (print preview parity)
- Add a real symbology library (e.g. JsBarcode/Code128 + a QR lib), render a
  scannable barcode and QR in BOTH the preview and the print template (or share one
  component to kill drift). CSS print dimensions verified.
- **Acceptance:** printed barcode scans; QR scans; preview == print.

### P7.4 — Batch barcode printing
- Solidify batch (selected/all, copies, multi-column sheets); optional cross-tab
  (products + assets together). Performance for large sets.
- **Acceptance:** large batches print correctly with copies + columns.

### P7.5 — Permissions / audit hardening
- Gate the print action with a permission (e.g. `inventory.print` /
  `barcode.print`); audit label-setting changes (already via PATCH /settings);
  confirm no cross-company printing.
- **Acceptance:** only permitted roles print; setting changes audited; company-safe.

## 9. Do we need a migration?
- **P7.1–P7.4: NO migration** (frontend symbology + settings are key/value JSONB).
- **Asset barcode uniqueness (P7.5 or a dedicated step): YES, but gated** — a
  `(company_id, barcode)` unique index needs a **dedup/backfill of existing
  duplicate/null barcodes first** (a unique index fails if duplicates exist). Treat
  as a separate, approved step; not part of the foundation.

## 10. Recommendation
Start with **P7.1** (unified, type-unrestricted print payload — additive, zero
visual regression), then **P7.3** (real scannable barcode + QR with preview/print
parity) as the highest-value fix, **P7.2** (logo + designer rounding), **P7.4**
(batch), **P7.5** (permissions + the gated asset-barcode-uniqueness migration).
No operational change until P7.1 is approved.
