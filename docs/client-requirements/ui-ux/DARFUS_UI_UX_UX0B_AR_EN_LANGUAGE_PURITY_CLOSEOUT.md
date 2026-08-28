# UX-0B Arabic / English Language Purity Closeout

| Area | Evidence | Result |
|---|---|---|
| AR UI chrome | AR Dashboard and prior AR route sample had Arabic chrome, `lang=ar`, `dir=rtl`, Cairo typography | PASS for sampled rendering; purity not globally closed |
| EN UI chrome | EN routes had `lang=en`, `dir=ltr`, Inter typography and English headings | PARTIAL; Arabic business data and some Arabic strings appeared in data/error surfaces |
| Business data | Arabic customer names, branch/business names, codes, AED, SKU and technical terms may remain source language | EXEMPT from UI-chrome purity |
| Raw backend messages | Prior logs/runtime showed Arabic raw session text; raw backend wording must not surface as the EN user-facing translation | OPEN prevention requirement |
| RTL/LTR geometry | AR RTL and EN LTR were sampled; full dense-table, dialog, tooltip, and focus traversal parity is incomplete | PARTIAL |

Required rules remain frozen: `AR_UI_CHROME=ARABIC_FIRST`, `EN_UI_CHROME=ENGLISH_ONLY`, `BUSINESS_DATA=PRESERVE_SOURCE_LANGUAGE`, `RAW_BACKEND_MESSAGE != USER_FACING_TRANSLATION`.

`AR_UI_CHROME_PURITY = PARTIAL_NEEDS_REVIEW`
`EN_UI_CHROME_PURITY = PARTIAL_NEEDS_REVIEW`
`RTL_VISUAL_INTEGRITY = PASS_WITH_FOLLOW_UP`
`LTR_VISUAL_INTEGRITY = PASS_WITH_FOLLOW_UP`
