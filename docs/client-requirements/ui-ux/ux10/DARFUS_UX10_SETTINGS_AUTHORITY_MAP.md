# UX-10 Settings Authority Map

| Domain | Source/current authority | Read | Write | Guard |
|---|---|---|---|---|
| Company/general settings | `contexts/settings-context.tsx`, `GET/PATCH /settings` | `/settings` | existing `PATCH /settings` | `settings.update` / existing frozen authority |
| Tax policy | `companyTaxPolicyService`, `/settings` | `/settings` | existing `PATCH /settings` | frozen admin/accounting checks and `settings.update` |
| Branches | settings context, `/branches` | `/branches` | existing branch handlers | existing branch permissions |
| Barcode taxonomy | `use-barcode-settings.ts`, `/barcode-settings` | `/barcode-settings` | existing POST/PATCH handlers | existing settings/inventory guards |
| Printing | print hooks and settings page | existing GET/PUT/PATCH hooks | existing save handlers | existing permissions |
| System settings | settings page and context | `/settings` | existing PATCH | existing settings authority |
| System accounts | `use-user-management.ts`, `/system-accounts` | GET/readiness | existing account mutations | `system_accounts.manage` |

UX-10 changes no key, scope, default, validation, value, API, handler, or permission.
