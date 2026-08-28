# DARFUS ERP — UX5C Regression Results

## Focused

`node --test tests/ux5c-pos-visual-corrections.test.cjs tests/ux5-pos-presentation.test.cjs`

Result: `11/11 PASS`.

## POS regression

The existing POS/Gift Voucher/GBW/CGP/reservation/payment regression set completed
with `41/41 PASS`.

## Static validation

- `npm run typecheck` — PASS
- `npm run build` — PASS, Next.js 16.2.9; 130 static pages generated
- No migration or server source change

`FOCUSED_UX5C_TESTS = PASS`
`POS_UX5C_REGRESSION = PASS`
