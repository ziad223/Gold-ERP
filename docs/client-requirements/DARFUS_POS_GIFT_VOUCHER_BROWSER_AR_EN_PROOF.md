# DARFUS POS Gift Voucher — Browser AR/EN Proof

Control: `DARFUS-POS-GIFT-VOUCHER-PAYMENT-UI-COMPOSITION-01`

## Scope and safety

The existing authenticated Chrome tab at `http://localhost:3000/ar/pos` was
reused, then navigated to `http://localhost:3000/en/pos`. No checkout, voucher
issue/activation/redemption, print, or other business mutation was performed.

## Observed browser results

| Check | AR | EN | Evidence | Result |
|---|---|---|---|---|
| Shared section visible outside Split | `قسيمة الهدية` visible while Cash is selected | `Gift Voucher` visible while Card is selected | DOM snapshot and screenshots after change | PASS |
| Cash/Card/Transfer/Split capability marker | `true` | `true` | `data-gift-voucher-supported` read after selecting each mode | PASS |
| Installment unsupported behavior | warning visible, input/button disabled | same behavior proven by source contract; EN page loaded and labels rendered | AR DOM and source/backend contract | FAIL-CLOSED |
| Input identity and typing | `id=pos-gift-voucher-code`, value `GV-UI-READONLY` | value `GV-UI-READONLY-EN` | browser fill/readback; no validation click | PASS |
| Focus/input presentation | full practical-width input, visible focus ring in screenshot | same component/classes and screenshot | screenshot + `input-base` focus token | PASS |
| LTR code safety | component `dir=rtl`, input `[direction:ltr]` | page/component LTR | source and rendered DOM | PASS |
| Full-face applied state | not exercised because official DB has zero vouchers | not exercised for same reason | mutation prohibited | NOT RUN SAFE |

The unsupported Installment warning text was visibly rendered in Arabic after
selecting `تقسيط / Install`; the input carried a disabled attribute. The same
shared component is rendered in English and uses the English warning/labels.

## Network and console evidence

Backend logs for the browser interval show only read-side requests such as
`GET /api/v1/branches`, `/settings`, `/customers`, `/assets`, `/invoices`, and
`/readiness/operations` (200/304), plus the existing event stream. There was no
`POST /api/v1/checkout`, voucher issue, activation, redemption, payment, journal,
or inventory mutation. Browser console output contained HMR connection logs and
no application exception; HMR is an existing serving-runtime characteristic,
not a business request.

## Visual evidence

Screenshots were captured for the AR payment panel, AR unsupported Installment
state, and EN unsupported Installment state after the UI change. They show the
shared Gift Voucher panel, readable code input, aligned Validate button, and
fail-closed warning. A validated-voucher screenshot was not produced because
`gift_vouchers = 0` and creating one is outside this control.

`AR_BROWSER_UI = PASS`

`EN_BROWSER_UI = PASS`

`BROWSER_BUSINESS_MUTATIONS = 0`

