# UX-1 Numeric Presentation System

`STORED_PRECISION != DISPLAY_PRECISION`. Display formatting must follow the actual business/domain authority; this document never changes calculation precision, rounding, tax, pricing or accounting.

| Domain | Display proposal | Alignment / direction |
|---|---|---|
| AED | explicit currency and grouped value | LTR numeric island |
| Gold Rate | explicit `/ g`, freshness/source visible | tabular, LTR |
| Gross/Net/Stone Weight | explicit unit, preserved meaningful decimals | tabular, LTR |
| Karat | canonical `K` presentation where approved | LTR island |
| Making / g | explicit label and unit | LTR island |
| VAT | percentage and amount separated | LTR island |
| Debit/Credit/Balance | stable aligned columns and totals | LTR numeric island |
| Quantity | separate from serialized Asset authority | LTR island |
| Percent / document reference | explicit symbol/reference label | source-safe direction |

No global two-decimal rule is introduced.
