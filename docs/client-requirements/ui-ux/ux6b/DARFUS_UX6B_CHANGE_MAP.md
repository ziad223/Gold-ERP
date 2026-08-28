# UX-6B Change Map

| File | Change |
|---|---|
| `features/printing/components/ClientBarcodeTagTemplate.tsx` | Explicit light paper background, dark ink, light color scheme, forced-color isolation, and explicit barcode rendering-surface colors in the existing embedded CSS |
| `tests/ux6b-asset-tag-preview-theme.test.cjs` | Focused static guard for theme isolation and frozen data/print/mutation boundaries |

Not changed: Asset detail wrapper, barcode generator, mapper, tag data, print service, global CSS, backend/API/DB/business modules.

