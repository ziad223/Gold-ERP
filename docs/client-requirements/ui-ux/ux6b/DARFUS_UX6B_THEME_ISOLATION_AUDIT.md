# UX-6B Same-Defect-Class Audit

Audited fixed-format/machine-readable surfaces in the UX-6 Inventory/Asset area:

| Surface | Rendering | Theme inheritance | Explicit surface | Light proof | Dark proof | Risk | Status |
|---|---|---|---|---|---|---|---|
| Asset Tag Preview | HTML/CSS + shared SVG | inner face previously inherited | Yes after UX-6B | PASS | PASS | high | FIXED |
| Barcode SVG inside tag | bwip-js SVG in `ScannableBarcode` | transparent SVG, parent surface controls contrast | Yes via face/container | PASS | PASS | high | FIXED |
| RFID display in tag | HTML text | inherits tag face | Yes via face | PASS | PASS | medium | COVERED |
| QR branch of tag | shared `ScannableBarcode` | parent surface controls contrast | Yes via face/container | source-covered | source-covered | high | NO separate QR runtime fixture |
| Generic BarcodePrintTemplate | separate print template | existing print root CSS | Existing | existing closure evidence | existing closure evidence | high | PRESERVED; not redesigned |
| Receipt/document previews | separate surfaces | out of UX-6B scope | Existing controls | prior closure evidence | prior closure evidence | medium | REGISTERED, not widened |

`UX6_THEME_ISOLATION_AUDIT = COMPLETE`. Only the proven Asset Tag Preview defect was fixed; other surfaces were not silently widened into this control.

