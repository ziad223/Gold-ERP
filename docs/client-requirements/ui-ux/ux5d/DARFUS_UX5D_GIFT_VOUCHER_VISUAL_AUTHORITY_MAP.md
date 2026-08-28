# UX-5D Gift Voucher Visual Authority Map

| Concern | Current authority | Evidence | UX-5D result |
|---|---|---|---|
| Voucher validation | POS page `verifyGiftVoucher` and existing callback | `app/[locale]/(dashboard)/pos/page.tsx` | unchanged |
| Supported payment | POS `voucherSupportedForMethod` | POS consumer | unchanged |
| Active state | `voucher && supported` | `GiftVoucherPaymentSection.tsx` | presentation only |
| Face/applied amount | `formatAmount(voucher.faceValue)` | component | same expression |
| Remaining due | `formatAmount(remainingDue)` | component | same expression |
| Loading/disabled | existing `loading`, `supported`, and `code.trim()` guards | component | unchanged |
| Error | existing `error`, `role=alert` | component | visual emphasis only |
| Remove | parent `onRemove` callback | component/POS page | same handler |
| Locale/direction | existing translations and document direction | POS i18n/runtime | AR/EN presentation verified |
| Theme | existing token utility classes | `app/globals.css`/component | dark/light contrast only |

