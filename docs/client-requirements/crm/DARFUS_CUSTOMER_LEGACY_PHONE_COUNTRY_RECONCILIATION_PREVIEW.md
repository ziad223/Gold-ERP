# DARFUS Customer Legacy Phone/Country Reconciliation Preview

Control: CRM-1B4
Mode: read-only preview; no reconciliation, backfill, or customer update was performed.
Official database: `darfus_erp`
Observed at: 2026-08-31 (Africa/Cairo)

## Authority rule

The existing `customers.phone` value is raw historical input. A primary
address country, company country, branch, locale, currency, or nationality is
not sufficient authority to assign `phoneCountry`. Therefore every legacy row
below remains `UNRESOLVED` and its canonical value remains `NOT_COMPUTED`.

## Read-only preview

| Customer ID | Masked raw phone | Primary address country (observation only) | Company country (observation only) | Proposed `phoneCountry` | Proposed `canonicalPhone` |
|---|---|---|---|---|---|
| CUS-0001 | 01***67 | Egypt | empty | UNRESOLVED | NOT_COMPUTED |
| CUS-0002 | 01***38 | Egypt | empty | UNRESOLVED | NOT_COMPUTED |
| CUS-0003 | 01***67 | Egypt | empty | UNRESOLVED | NOT_COMPUTED |

## Evidence and safety

- Official `current_database()` was `darfus_erp`; current customer count was 3.
- All three observed customers had a non-empty raw phone and no persisted
  phone-country or canonical-phone column in the current official schema.
- No address, company, branch, nationality, or locale value was promoted to a
  phone-country decision.
- The CRM-1B4 migration was not executed on `darfus_erp`.
- This artifact contains masked phone values only; no credential or secret was
  read or written.

## Required next authority

An Owner-approved reconciliation process must explicitly confirm each
customer's phone country before computing and persisting an E.164 canonical
value. Until then, historical rows are intentionally unresolved.

