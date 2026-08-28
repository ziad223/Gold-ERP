# UX-11 Preview Theme Isolation

`PrintPreviewUx11.module.css` gives screen previews a stable white document/machine-readable frame, while the existing tag template and shared print CSS remain authoritative for fixed output. Browser proof on the mounted Asset tag showed white `barcode-tag-face` with `rgb(255,255,255)` background and `rgb(17,24,39)` text in both light and dark application themes. No document values or payloads changed.

