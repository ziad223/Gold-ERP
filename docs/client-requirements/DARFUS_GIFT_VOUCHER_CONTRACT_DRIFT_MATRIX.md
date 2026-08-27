# DARFUS ERP - Gift Voucher Contract Drift Matrix

This matrix distinguishes active contract drift from inactive legacy surfaces. It
does not authorize a Gift Voucher workflow or a schema change.

| ID | Evidence | Observed wording/behavior | Correct contract | Classification | Disposition |
|---|---|---|---|---|---|
| GV-DRIFT-001 | `DARFUS_D2F_GV_FINANCIAL_EVENT_MATRIX.md` | Partial redemption was listed as a valid Payment Engine allocation with a remaining balance. | Partial Gift Voucher redemption is invalid; reject before allocation. | `CONTRACT_DRIFT_CORRECTED` | Matrix row corrected in this control. |
| GV-DRIFT-002 | `DARFUS_D2F_GV_PURCHASED_VOUCHER_UAE_FINANCIAL_POLICY.md` | Partial-redemption rounding was grouped with unresolved future policy. | Full-redemption-only is the specialized rule; partial allocation/rounding is not an authorized path and must fail closed. | `CONTRACT_DRIFT_CORRECTED` | Wording clarified without implementing any behavior. |
| GV-DRIFT-003 | `backend/seeders/client-demo/transactional/flows/11-gift-voucher-cycle.js` and its manifest | Historical demo description says “partially redeem”. | Seed/demo material cannot override the specialized contract. | `INACTIVE_LEGACY_ARTIFACT` | Preserved as historical/inactive source; no seeder was run or edited in this control. |
| GV-DRIFT-004 | `app/.../sales/gift-vouchers/page.tsx`, `hooks/use-gift-vouchers.ts` | Disabled redeem UI/hook accepts an optional amount. | No active Gift Voucher UI may offer partial redemption; current workflow remains disabled. | `INACTIVE_DISABLED_SURFACE` | No UI workflow change in this contract-only control; future implementation must remove/replace the amount contract before enablement. |
| GV-DRIFT-005 | Generic reservation/installment payment paths | Other payment paths calculate remaining balances or accept partial payments. | Generic partial payment behavior remains valid outside Gift Voucher. | `NO_ISSUE_OUT_OF_SCOPE` | Preserved; not a Gift Voucher authority. |
| GV-DRIFT-006 | `backend/src/services/posting.service.js:869-916` | Legacy helpers contain literal `2400`/`4100` voucher posting logic. | Voucher issue must resolve semantic roles; voucher redemption must not own Sales Revenue/VAT. | `INACTIVE_DANGEROUS_HELPER` | Routes are fail-closed and do not call helpers. No source rewrite in this control. |
| GV-DRIFT-007 | `backend/src/services/invoice-projection.service.js:87-99` | Gift Voucher projection is `SUPPORTED_LATER`, no adapter/detail/print. | Read-only projection is allowed only after a separately approved implementation contract. | `NO_ISSUE_CORRECT_BOUNDARY` | Preserved. |

## Closure result

`ACTIVE_GIFT_VOUCHER_CONTRACT_DRIFT = 0`

The inactive seeder/UI/helper observations remain explicitly recorded so they are
not mistaken for a completed implementation or silently promoted to authority.

