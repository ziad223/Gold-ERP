# UX-1 Language / Terminology Contract

| Concept | AR UI | EN UI | Technical term | Business-data exemption |
|---|---|---|---|---|
| Inventory | المخزون | Inventory | No | stored names remain source |
| Stock | مخزون (context-specific) | Stock (context-specific) | No | do not blind-replace |
| Asset | أصل | Asset | Yes in EN | IDs/codes remain source |
| Item | صنف/قطعة by context | Item by context | No | source terminology wins |
| Product | منتج | Product | No | source values exempt |
| Tax Treatment | المعاملة الضريبية | Tax Treatment | No | VAT/code values exempt |
| Voucher | قسيمة | Voucher | No | voucher code exempt |
| Journal | قيد اليومية | Journal | No | references exempt |
| Entry | قيد/إدخال by context | Entry | No | domain context required |
| Making Charge | المصنعية | Making Charge | No | no |
| Gold Rate | سعر الذهب | Gold Rate | No | source rate/unit preserved |
| Transfer | تحويل | Transfer | No | document refs exempt |
| Customer/Supplier | العميل/المورد | Customer/Supplier | No | stored names exempt |

Frozen language rules: `AR_UI_CHROME=ARABIC_FIRST`, `EN_UI_CHROME=ENGLISH_ONLY`, `BUSINESS_DATA=PRESERVE_SOURCE_LANGUAGE`, `APPROVED_TECHNICAL_TERMS=PRESERVE_CANONICAL_TERM`, `RAW_BACKEND_MESSAGE != USER_FACING_TRANSLATION`. No blind global replacement is authorized.
