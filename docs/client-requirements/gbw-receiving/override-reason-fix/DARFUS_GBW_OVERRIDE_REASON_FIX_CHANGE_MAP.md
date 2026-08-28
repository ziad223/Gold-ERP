# Change map

| File | Change | Business/API/DB authority changed? |
|---|---|---|
| `app/[locale]/(dashboard)/inventory/gold-by-weight/page.tsx` | Added draft-scoped reason state, conditional UI, presentation-only Decimal comparison, existing-key payload mapping, localized blank/backend validation. | No |
| `tests/gbw-override-reason-fix.test.cjs` | Added focused source/contract behavior tests. | No |

Backend source, DB models/schema, i18n resources, accounting, inventory, tax, and permission files were not changed.

`FRONTEND_CHANGE_SCOPE_MINIMAL = YES`

