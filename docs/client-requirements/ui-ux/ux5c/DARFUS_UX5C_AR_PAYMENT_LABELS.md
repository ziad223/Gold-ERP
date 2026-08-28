# UX5C — Arabic Payment Labels

The payment identifiers and values are unchanged. Only rendered UI chrome is
localized by the existing `rtl` flag.

| Locale | Payment UI result |
|---|---|
| AR | `نقدي`, `بطاقة`, `تحويل`, `مجزأ`, `تقسيط`, `عربون`; split/installment sublabels Arabic-only |
| EN | `Cash`, `Card`, `Transfer`, `Split`, `Installment`, `Deposit`; sublabels English-only |

Browser checks found no English payment leaks in AR and no Arabic payment leaks in
EN, including the split allocation state.

`AR_PAYMENT_UI_ENGLISH_LEAKS = 0`
`EN_PAYMENT_UI_ARABIC_LEAKS = 0`
