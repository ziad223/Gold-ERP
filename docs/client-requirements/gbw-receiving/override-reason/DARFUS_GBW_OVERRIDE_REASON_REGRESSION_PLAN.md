# Regression plan after explicit approval

## Focused cases

- Equal reference rate: receive contract remains allowed; no reason required; no override audit.
- Lower non-equal rate: reason required; missing reason rejected; authorized reason creates one governed audit record.
- Higher non-equal rate: same as lower.
- Permission denied: 403; no PO/Asset/movement/journal/payable writes.
- Blank/whitespace reason: 422; no business writes.
- Decimal boundary: exact equality and eight-decimal formatting; no tolerance introduced.
- Company/branch scope: reference and permission remain server-owned.
- Idempotency: existing receive key/hash behavior unchanged.
- Arabic/English: localized field, validation, and safe error; keyboard and mobile focus if UI control is added.

## Evidence gate

Use isolated/disposable mutation proof only under a separately approved batch. For official `darfus_erp`, compare read-only counts and verify zero writes unless a new explicit persistent authorization exists.

