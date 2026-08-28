# UX-6B Theme Isolation Contract

The innermost tag face now explicitly declares:

- `background: #ffffff`;
- `color: #111827`;
- `color-scheme: light`;
- `forced-color-adjust: none`;
- white background/dark color on the existing barcode rendering container and its SVG.

The application shell may remain dark. The print-like tag remains a light paper surface and its encoded content is not recolored by `.dark`.

