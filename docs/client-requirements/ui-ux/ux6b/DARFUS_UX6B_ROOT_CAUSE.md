# UX-6B Root Cause

`ROOT_CAUSE = THEME_ISOLATION_FAILURE_ON_INNER_BARCODE_TAG_FACE`.

The client tag template defined the face border and layout but no explicit background or foreground. The live preview is nested in an application Dark Mode surface, so the face inherited the dark surface and light text. `ScannableBarcode` deliberately emits a transparent SVG with black bars; without a guaranteed light rendering surface, the black bars lost contrast.

Confidence: `HIGH` — source inspection and live computed-style/browser screenshot evidence agree. No barcode generator, payload, mapper, or print handler caused the defect.

