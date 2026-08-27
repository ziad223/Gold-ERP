# DARFUS ERP — C2C3 Revision UI Boundary

بالعربي المختصر: هذا الحد يثبت أن C2C3 يضيف تجربة المستخدم فوق Revision API المغلق في C2C2، ولا يغير أي سلطة أعمال أو قاعدة رسمية.

## Scope

- Asset Detail only.
- One Revision history surface integrated with the existing Asset Detail hierarchy.
- General metadata fields only: `name`, `description`, `category`, `brand`, `notes`.
- AR/EN labels, stable error-code localization, permission visibility, review confirmation, stale-write handling, and duplicate-submit protection.
- Frontend focused tests and real-browser proof on a disposable runtime.

## Reused authorities

- `POST/GET /api/v1/inventory-v2/assets/:assetId/revisions` and detail GET from C2C2.
- `inventory.revision.view` and `inventory.revision.create`.
- Server-derived company, branch, actor, revision number, audit, event, and idempotency authority.

## Forbidden boundary

- No backend service redesign or route change.
- No migration, seed, permission promotion, or write to `darfus_erp`.
- No barcode, RFID, price, cost, valuation, status, branch, location, movement, transfer, workshop, POS, CGP, accounting, or invoice changes.
- No second generic history system and no direct Asset DB write from the browser.

## Expected change boundary

| Area | Expected |
|---|---|
| Frontend source | Asset Detail integration, reusable Revision panel, UI helper, AR/EN messages |
| Backend source | None |
| Schema/migrations | None |
| Official DB | Read-only; zero business mutations |
| Disposable runtime | Allowed for browser/API/DB proof only |

## Stop condition

If a forbidden business file or schema change is required, stop with `BLOCKED_C2C3_SCOPE_EXPANSION` and do not widen the batch.
