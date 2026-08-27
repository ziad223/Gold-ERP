# POS Gift Voucher Payment UI — Forensic Map

Control: `DARFUS-POS-GIFT-VOUCHER-PAYMENT-UI-COMPOSITION-01`
Mode: read-first plus minimum-safe frontend composition

## Current implementation

| Concern | Current authority/evidence | Finding |
|---|---|---|
| Payment mode selection | `app/[locale]/(dashboard)/pos/page.tsx`, `paymentOptions`, `method` | One parent `method` state drives Cash/Card/Transfer/Split/Installment/Deposit. |
| Split rendering | Same page, `method === "split"` block | Split inputs render only for Split. |
| Voucher rendering | Same page, nested inside the Split block | This is why the voucher appears Split-only. |
| Voucher code state | `splitGiftVoucherCode` | Parent state exists, but its name and placement incorrectly describe it as Split-only. |
| Validated voucher state | `splitGiftVoucher` | Parent state; validation uses the existing `GET /gift-vouchers/:code` endpoint. |
| Applied amount | `splitGiftVoucher.faceValue` | Server-supplied face value; no editable applied amount. |
| Remaining amount | No general voucher remaining display | Only Split total-versus-invoice total is shown. |
| Checkout payload | `completeSale`, `paymentSplits` | Voucher is serialized only when `method === "split"`; non-Split methods cannot carry it. |
| Backend contract | `gift-voucher.service.js:prepareGiftVoucherSettlement` | Voucher settlement is explicitly accepted only with canonical `paymentMethod = split`; ordinary legs are cash/card/transfer. |
| Payment Engine | `sales.service.js:resolvePayment`, `posting.service.js` | Existing split allocation and liability posting remain the business authorities. |
| State switching | `method` changes without clearing voucher state | A validated voucher can remain in parent state; current UI did not present this consistently. |
| Duplication | One current field block | No second API/business validator exists; composition is the defect. |

## Server capability finding

`prepareGiftVoucherSettlement` rejects a Voucher when the top-level payment mode
is not `split`. Therefore Cash/Card/Transfer can use the existing canonical split
representation (ordinary remainder plus one full-value Voucher leg) without a
backend change. Installment and Deposit cannot safely be enabled by UI-only work;
they fail closed with an explanatory message.

## Boundary

This control changes only frontend composition, parent state naming/usage,
display hierarchy, and focused UI tests/docs. It does not change Voucher
validation rules, face value, invoice totals, VAT, accounting, treasury,
inventory, idempotency, or server authority.
