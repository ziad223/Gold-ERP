# DARFUS ERP — Tax / VAT Settings UI Audit + Minimum Safe Completion

Control ID: `DARFUS-TAX-VAT-SETTINGS-UI-AUDIT-COMPLETION`

## 1. Executive Summary

The existing backend tax authority was reused without changes. The initial UI was partial: general Settings exposed only a VAT rate, while the company tax policy fields were not user-facing and Onboarding linked to the general Settings page.

Minimum safe completion was applied:

- Added one canonical localized page: `/[locale]/settings/tax`.
- Added exactly one Settings entry: `Tax & VAT Settings` / `إعدادات الضرائب وضريبة القيمة المضافة`.
- Removed the duplicate VAT-rate editor from general System Settings and replaced it with a pointer to the canonical authority.
- Changed the Onboarding tax step to link to the canonical page.
- Kept all policy reads/writes on the existing `/api/v1/settings` contract.
- No Tax Engine, database schema, migration, receive, journal, payment, GBW, GBP, or production changes.

## 2. Existing Backend Authority

Existing authority was verified in:

- `backend/src/services/company-tax-policy.service.js`: reads Company VAT registration/TRN and policy settings; validates and persists only the existing policy keys.
- `backend/src/services/uae-tax-engine.service.js`: server-supported treatments are `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE`, `EXEMPT`, and `OUT_OF_SCOPE`.
- `backend/src/routes/erp.routes.js`: `GET /settings` returns `data.taxPolicy`; `PATCH /settings` delegates policy fields to `company-tax-policy.service.js` and preserves the existing permission and audit guards.

No new tax API, table, enum authority, client legal-eligibility calculation, or accounting authority was added.

## 3. Read-Only UI Forensic

Before implementation:

| Surface | Finding |
|---|---|
| `/ar/settings` | General settings existed; VAT Rate was present inside System Settings; no complete policy editor. |
| `/en/settings` | Same partial UI in English. |
| `/ar/settings/onboarding` | Tax step linked to `/settings`, not a canonical tax page. |
| `/settings/tax`, `/settings/vat`, `/settings/tax-policy` | No existing canonical Tax/VAT page was present. |
| Existing Tax Policy component/form | Not found. |

Initial classification: `PARTIAL_TAX_UI`.

## 4. Classification

`TAX_UI_CLASSIFICATION = PARTIAL_UI_COMPLETED`

The partial UI was completed with one canonical page. No second tax route or duplicate form was created.

## 5. Existing UI Reuse

- Existing Settings page and permission hooks were reused.
- Existing `apiClient` and `/settings` API were reused.
- Existing Company Profile remains the edit authority for `Company.taxNumber`; the Tax page displays TRN read-only and links back to Company Profile.
- Existing Onboarding remains a readiness/navigation guide and contains no save logic.

## 6. Tax Settings UX

The canonical page displays and edits:

| Field | Authority / behavior |
|---|---|
| VAT Registered | Server-backed boolean/null; no inference from TRN, rate, or `vatEnabled`. |
| TRN | Read-only `Company.taxNumber`; no new storage. |
| VAT Rate | Server-backed numeric value; no frontend default authority. |
| Enabled Tax Treatments | Checkboxes generated from `taxPolicy.supportedTaxTreatments`. |
| Default Tax Treatment | Options generated only from enabled treatments; client guard plus existing server validation. |
| Precious Goods Reverse Charge Enabled | Server-backed capability flag with explicit non-automatic-eligibility explanation. |

The UI sends only policy configuration fields to `PATCH /api/v1/settings`. It does not send tax amounts, taxable bases, journal-account overrides, or legal eligibility results.

## 7. Settings Discoverability

- Canonical route: `/ar/settings/tax` and `/en/settings/tax`.
- Settings entry count: exactly one in source and browser (`getByRole("link")` count = 1 for the Arabic Tax/VAT entry).
- No Sidebar tax entry was added.
- The old general VAT-rate editor was removed to avoid a second user-facing tax authority.

## 8. Onboarding Integration

The tax step now points to `/settings/tax`; locale preservation resolves it to `/ar/settings/tax` or `/en/settings/tax`.

Onboarding remains read-only/readiness-oriented. It does not contain PATCH, tax save logic, or a second policy form.

## 9. Browser AR/EN

Read-only browser evidence on the existing `localhost:3000` runtime:

| Check | Result | Evidence |
|---|---|---|
| Arabic Settings entry | PASS | One `إعدادات الضرائب وضريبة القيمة المضافة` link; click resolved to `/ar/settings/tax`. |
| Arabic Tax page | PASS | Displayed VAT Registered = Yes, VAT Rate = 14, three enabled treatments, Standard VAT default, RCM = Yes. |
| English Settings entry | PASS | One `Tax & VAT Settings` link; click resolved to `/en/settings/tax`. |
| English Tax page | PASS | Same server-backed values displayed with English labels. |
| Arabic Onboarding | PASS | Tax step contains `/ar/settings/tax`. |
| English Onboarding | PASS | Tax step contains `/en/settings/tax`. |
| Console/runtime errors | PASS | No application error was observed; only normal React DevTools/HMR messages were present. |

## 10. API Read/Save

- `GET /api/v1/settings`: `PASS` through the authenticated canonical page. The page rendered the policy payload; a non-2xx response would have rendered the existing error state.
- `PATCH /api/v1/settings`: `NOT_REQUIRED_NOOP_PROOF`. No save was executed because the existing local policy was already readable and no business-value change was required.
- No PATCH request was issued by this control.

## 11. DB Evidence

Read-only query target:

- `current_database() = darfus_erp`
- `current_user = postgres`
- `SequelizeMeta = 86`
- `companies.vat_registered = true` for the active company.
- Company TRN is currently empty/null in the official DB.
- Existing tax settings for the active company:

| Key | Current value |
|---|---|
| `vatRate` | `14` |
| `enabledTaxTreatments` | `STANDARD_VAT`, `ZERO_RATED`, `REVERSE_CHARGE` |
| `defaultTaxTreatment` | `STANDARD_VAT` |
| `preciousGoodsRcmEnabled` | `true` |
| `vatEnabled` | No explicit row observed in this read-only query |

No database write, seed, migration, receive, journal, payment, or cleanup occurred in this control.

## 12. Audit Evidence

No policy Save/PATCH was executed, so no new policy mutation audit row was expected.

Existing read-only evidence for the active company:

- `company.tax_policy.updated`: 2 historical rows.
- `company.vat_registration.updated`: 1 historical row.
- Total `audit_logs`: 40 at query time.

The existing backend remains the audit authority; no audit subsystem was added.

## 13. Negative Tests

The existing backend tax-policy tests were run from their intended `backend` working directory:

- G2A1 tax policy suite: 6/6 passed.
- G2A2 transaction-tax suite: 10/10 passed.

Covered negative/authority behavior includes unsupported treatment, duplicate treatment, default treatment not enabled, invalid VAT rate, invalid VAT registration type, disabled/unsupported treatment, and server-side RCM eligibility checks. Cross-company and permission guards remain in the existing route contract and were not exercised through an official-DB mutation.

## 14. Regression Guard

New focused test:

`tests/tax-vat-settings-ui-discoverability.test.cjs`

Result: 3/3 passed.

Existing onboarding discoverability test: 2/2 passed.

The guard verifies one canonical Settings entry, canonical Onboarding navigation, existing `/settings` API reuse, server-driven supported treatments, and absence of a frontend supported-treatment array authority.

## 15. Files Changed

Intentional current-control changes:

- `app/[locale]/(dashboard)/settings/tax/page.tsx` — new canonical Tax/VAT UI.
- `app/[locale]/(dashboard)/settings/page.tsx` — one Tax/VAT entry and removal of duplicate general VAT-rate editor.
- `app/[locale]/(dashboard)/settings/onboarding/page.tsx` — canonical Tax/VAT link.
- `tests/tax-vat-settings-ui-discoverability.test.cjs` — focused regression guard.

Worktree note: `settings/page.tsx` was already modified before this control, and `settings/onboarding/page.tsx` was already untracked before this control. Those pre-existing changes were preserved; only the current-control deltas listed above were applied. No `next-env.d.ts` change was made.

No backend source, Tax Engine, migration, config, official DB, or online production file was changed.

## 16. Gate

All required completion conditions are satisfied:

- Existing backend authority reused.
- Canonical Tax/VAT page is present and discoverable from Settings.
- AR/EN and locale preservation pass.
- All required policy fields are visible; TRN uses Company authority.
- Treatments are server-driven.
- Onboarding links to the canonical page without duplicate save logic.
- Focused tests and typecheck pass.
- No official DB write, migration, receive, or production contact occurred.

`GATE = PASS_TAX_VAT_SETTINGS_UI_CANONICAL_DISCOVERABILITY_AND_ONBOARDING_INTEGRATION`

## 17. Final Tokens

```text
CURRENT_CONTROL = DARFUS-TAX-VAT-SETTINGS-UI-AUDIT-COMPLETION
LOCAL_MAIN_DB = darfus_erp
SEQUELIZE_META = 86
TAX_UI_CLASSIFICATION = PARTIAL_UI_COMPLETED
CANONICAL_TAX_SETTINGS_ROUTE = /[locale]/settings/tax
SETTINGS_TAX_ENTRY = PASS
SETTINGS_TAX_ENTRY_COUNT = 1
VAT_REGISTERED_UI = PASS
VAT_RATE_UI = PASS
ENABLED_TREATMENTS_UI = PASS
DEFAULT_TREATMENT_UI = PASS
RCM_CAPABILITY_UI = PASS
SUPPORTED_TREATMENTS_SERVER_DRIVEN = PASS
AR_SETTINGS_TAX = PASS
EN_SETTINGS_TAX = PASS
ONBOARDING_TAX_LINK = PASS
API_READ = PASS
API_SAVE = NOT_REQUIRED_NOOP_PROOF
DB_SCOPE = PASS
AUDIT = NOT_APPLICABLE_NO_MUTATION
NO_DUPLICATE_API = YES
NO_DUPLICATE_TAX_ENGINE = YES
NO_DUPLICATE_SAVE_LOGIC = YES
NO_HARDCODED_COMPANY_TAX_CONFIG = YES
NEW_RECEIVES = 0
MIGRATION_CREATED = NO
TYPECHECK = PASS
FOCUSED_TESTS = PASS
ONLINE_PRODUCTION_CONTACTED = NO
OFFICIAL_DB_WRITES = 0
TAX_VAT_SETTINGS_UI_FINAL_CLOSED = YES
GATE = PASS_TAX_VAT_SETTINGS_UI_CANONICAL_DISCOVERABILITY_AND_ONBOARDING_INTEGRATION
NEXT_RECOMMENDED_STEP = SUPPLIER_MASTER_FINAL_CLOSURE
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP. Supplier Master Final Closure was not started automatically.
