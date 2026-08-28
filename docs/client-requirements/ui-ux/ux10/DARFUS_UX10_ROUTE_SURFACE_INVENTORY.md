# UX-10 Route / Surface Inventory

| Surface | Route | Source | Existing behavior |
|---|---|---|---|
| Settings landing | `/ar/settings`, `/en/settings` | `app/[locale]/(dashboard)/settings/page.tsx` | Company, branches, payments, printing, system and barcode tabs; writes are existing permission-guarded handlers |
| Tax settings | `/ar/settings/tax`, `/en/settings/tax` | `.../settings/tax/page.tsx` | Read policy and existing tax save form |
| Barcode codes | `/ar/settings/barcode-codes`, `/en/settings/barcode-codes` | `.../settings/barcode-codes/page.tsx` | Read tables and existing code editor/toggle writes |
| Onboarding/readiness | `/ar/settings/onboarding`, `/en/settings/onboarding` | `.../settings/onboarding/page.tsx` | Read-only readiness guide and refresh |
| System accounts/users | `/ar/settings/users`, `/en/settings/users` | `.../settings/users/page.tsx` | Account cards and existing permission-guarded account actions/forms |
| Audit log | `/ar/audit`, `/en/audit` | `app/[locale]/(dashboard)/audit/page.tsx` | Server-filtered/paginated audit list, verify-chain GET, read-only detail modal/diff |

No new route or workflow is introduced.
