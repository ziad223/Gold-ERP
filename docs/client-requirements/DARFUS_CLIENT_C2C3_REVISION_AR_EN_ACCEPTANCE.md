# DARFUS ERP — C2C3 AR/EN Acceptance

## Static parity

AR and EN message keys were added symmetrically under `AssetDetails` for:

- Revision title/description and empty/no-access states.
- Revision number, date, reason, source, actor, and change count.
- Detail dialog, source reference, field, old value, new value, and close action.

Focused contract test: `tests/c2c3-revision-ui.test.cjs` — 4/4 PASS.

## Browser parity

| Surface | AR | EN |
|---|---|---|
| Asset Detail route | BLOCKED — protected frontend runtime drift | BLOCKED — protected frontend runtime drift |
| Revision list | BLOCKED | BLOCKED |
| Revision detail | BLOCKED | BLOCKED |
| Review/submit dialog | BLOCKED | BLOCKED |
| RTL/LTR visual proof | BLOCKED | BLOCKED |

The static UI uses the existing page hierarchy, `Modal`, `Card`, `Button`, `ErrorState`, `EmptyState`, `LoadingState`, and `dir="ltr"` for identifiers/numbers. No browser claim is made from source inspection alone.

