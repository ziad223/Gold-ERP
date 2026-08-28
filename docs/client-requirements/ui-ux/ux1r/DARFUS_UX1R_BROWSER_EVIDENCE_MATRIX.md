# UX-1R Browser Evidence Matrix

Route: `http://localhost:3000/en/test/ux1-reference`.

| Coverage | Result | Evidence |
|---|---|---|
| EN / Dark: POS, Inventory, Accounting + Gold | PASS | All three selected; correct visible test id |
| AR / Dark: POS, Inventory, Accounting + Gold | PASS | `lang=ar`, `dir=rtl`, no approved Chrome leak |
| EN / Light: POS, Inventory, Accounting + Gold | PASS | `lang=en`, `dir=ltr`, zero Arabic UI characters |
| AR / Light: POS, Inventory, Accounting + Gold | PASS | `lang=ar`, `dir=rtl`, `data-theme=light` |
| Mobile / Tablet / Desktop | PASS | Actual dimensions recorded in responsive artifact |
| POS density | PASS | Three item rows, stone value, discount, VAT, payment and safe states |
| Compact shell | PASS | Breadcrumb, compact heading and immediate prototype surface |
| Focus / named controls | PASS | Customer input outline and ARIA hooks observed |
| Motion / reduced motion | PASS | Animation names and reduced-motion CSS rule observed |
| Console | PASS | No warning/error entries captured |

Focused tests: 7/7 pass across UX-1 and UX-1R. Typecheck and build pass. No API or business request was connected.
