# POS Gift Voucher Payment Mode Matrix

| UI primary mode | Server capability | UI behavior | Payload behavior | Status |
|---|---|---|---|---|
| Cash | Supported through existing split contract | Shared Voucher section enabled | `paymentMethod=split`; cash remainder + full Voucher leg | ENABLED |
| Card | Supported through existing split contract | Shared Voucher section enabled | `paymentMethod=split`; card remainder + full Voucher leg | ENABLED |
| Bank Transfer | Supported through existing split contract | Shared Voucher section enabled | `paymentMethod=split`; transfer remainder + full Voucher leg | ENABLED |
| Split | Canonical Gift Voucher authority | Shared section enabled; existing allocation inputs retained | Existing split legs + full Voucher leg | ENABLED |
| Installment | Backend rejects Voucher unless top-level mode is Split; installment rules cannot be bypassed | Shared section visibly fails closed; validation disabled for this combination | No Voucher payload is emitted for Installment | BLOCKED_BY_SERVER_CAPABILITY |
| Deposit | Deposit is a Reservation authority and backend Voucher combination is not supported | Shared section visibly fails closed; no fake combination | No Voucher payload is emitted for Deposit | BLOCKED_BY_SERVER_CAPABILITY |

`INSTALLMENT_COMBINATION_SERVER_SUPPORT = NO`

`DEPOSIT_COMBINATION_SERVER_SUPPORT = NO`

No backend capability change is included in this control.
