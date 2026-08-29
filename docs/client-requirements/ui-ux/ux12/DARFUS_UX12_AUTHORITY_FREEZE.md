# UX-12 Authority Freeze

| Authority | Frozen statement | UX-12 result |
|---|---|---|
| Business | closed business rules are not reinterpreted for visual checks | preserved |
| API/route | existing route and request contracts remain authoritative | preserved |
| Inventory | Asset/barcode identity and one canonical workflow remain authoritative | preserved |
| Accounting/tax | existing journal/tax engines remain authoritative | preserved |
| Security | User/Auth/RBAC and company/branch fail-closed behavior remain authoritative | preserved |
| Data | `darfus_erp` is read-only in this control | 0 business writes |
| Print | document identity, barcode/QR payload and print behavior remain unchanged | preserved |

The only UX-12 source line added was `aria-label={resetLabel}` on the existing reset button in `components/ui/data-toolbar.tsx`.
