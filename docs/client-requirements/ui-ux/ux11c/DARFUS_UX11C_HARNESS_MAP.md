# UX-11C Harness Map

| Temporary element | Purpose | Persistent? |
|---|---|---|
| `app/[locale]/test/ux11c/page.tsx` | Direct ReceiptPreview and BarcodeLabelPreview mount | No |
| `app/[locale]/test/print-export/page.tsx` | Locale alias to the existing fixture | No |
| `evidence-tools/ux11c-runtime.cjs` | Chrome/screenshots/console/network/print-media assertions | No |
| `playwright.ux11c.config.cjs` | Local Chrome + 840x1180 test config | No |

The synthetic value `UX11C-SYNTHETIC-000001` was rendered only in the browser harness and was never persisted.
