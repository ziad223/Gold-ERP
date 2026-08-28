# Backend regression

Commands passed:

- `node --test backend/tests/gold-by-weight-profile-02.test.cjs` — 7/7.
- `node --test backend/tests/phase-03b-g2c-receive-tax-location.test.cjs` — 4/4.
- `node --test tests/gbw-final-closure.test.cjs` — 7/7.
- `node --test backend/tests/gold-by-weight-financial-formula-01b.test.cjs` — 6/6.

The current backend source still requires exact non-equality governance, `inventory.adjust`, and nonblank reason; no backend test or source was changed.

`BACKEND_OVERRIDE_REGRESSION = PASS`

