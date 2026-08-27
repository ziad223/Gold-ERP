# Owner Decision Register — Gift Voucher 01

| Decision | Current state |
|---|---|
| Official DB promotion | Not authorized; `darfus_erp` remains read-only |
| Named Gift Voucher schema promotion | AUTHORIZED_AND_COMPLETED for `darfus_erp` and `20260827010000-gift-voucher-purchased-foundation.js` in this control only |
| Purchased-only scope | Frozen and implemented; non-purchased classes fail closed |
| Partial voucher balance | FROZEN: not implemented; full face only |
| Pearl markup data | Separate Owner decision/track; not changed here |
| Official Gift Voucher business acceptance | Not authorized by this schema-promotion control |
| Next batch | No automatic start |

No new Owner decision was assumed during this batch.

| Official Voucher business acceptance authorization | OWNER-AUTHORIZED for exactly one minimum Purchased Gift Voucher cycle on `darfus_erp`: one issue, optional required activation, one full POS redemption; no additional Voucher/Checkout, mixed payment, concurrency, print mutation, Pearl repair, or cleanup | Consumed only as one issue attempt in this control; it failed HTTP 403 before persistence |
| Official acceptance failed mutation handling | FROZEN: no retry, no restore, no deletion, no second business attempt after an ambiguous/failed result | Applied; zero official business delta |
| Runtime parity blocker | Separate Owner review required before any future acceptance; this record does not authorize refresh or another financial mutation | OPEN |

| Runtime parity recovery | Owner-authorized backend-only refresh of the normal local service; no frontend/DB/Redis restart and no business retry | COMPLETED; authenticated read proof passed; future financial retry requires a new explicit authorization |

| POS Gift Voucher payment composition | Voucher is a settlement component, not a discount; one canonical UI/state path | FROZEN/PRESERVED; no tax/accounting/payment-engine business change |
| Gift Voucher + Installment/Deposit | Current server contract does not support these combinations | OWNER REVIEW REQUIRED before any backend capability work; current UI must fail closed |
| POS Gift Voucher UI control | No official financial retry, checkout, issue, activation, redemption, print, or DB mutation in this control | COMPLETED; read-only browser proof only |
| POS-GV-INSTALLMENT-DEPOSIT-VISIBILITY-001 | Installment/Deposit + Voucher remain visible but unsupported | FROZEN; UI must remain disabled/fail-closed; no backend capability change in visual control |

| POS-GV-I18N-NARROW-CLOSEOUT-001 | Error presentation uses locale catalog; unsupported payment combinations remain visible but disabled | FROZEN/PRESERVED; no financial retry or backend capability change authorized | CLOSED for read-only UI control; future financial acceptance needs separate authorization |
