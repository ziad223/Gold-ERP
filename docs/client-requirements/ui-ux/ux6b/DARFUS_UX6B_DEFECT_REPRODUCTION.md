# UX-6B Defect Reproduction

Asset used: `AST-PUR-1787912070001-1-1-13rw`; stored barcode: `GWBGL22000001`.

Before the edit, the real browser reproduced the defect in EN and AR Dark Mode. The innermost `.barcode-tag-face` computed to `background-color: rgba(0, 0, 0, 0)` and `color: rgb(241, 245, 249)`. The barcode SVG computed to a transparent background with black bars. The captured Dark preview showed black barcode/tag content against the dark inherited surface, while the Light preview was readable.

`DEFECT_REPRODUCED = YES`.

