# Numeric Presentation System Proposal

Presentation-only proposal; it does not change stored precision, calculation precision, rounding, tax, pricing, or accounting.

| Value | Presentation rule |
|---|---|
| AED / totals | currency isolated from number; grouped digits; two-decimal display where current business view uses currency cents |
| Gold Rate | tabular numerals, explicit per-gram unit and source/freshness; retain source precision visually where operationally meaningful |
| Gross/Net/Stone Weight | tabular numerals, explicit unit, aligned decimal point; never infer or recalculate |
| Karat | compact integer with `K` only where canonical copy allows |
| Making/g | explicit unit and label; avoid ambiguous shorthand in critical totals |
| VAT | percentage and amount separated; base → VAT → total hierarchy |
| Debit/Credit/Balance | right-aligned in LTR numeric island, consistent signs/colors plus text |
| Quantity | separate from serialized Asset count; no authority change |

In RTL, wrap numeric values in an LTR isolation region while keeping the Arabic label in RTL. Do not change payload or backend formatting. `NUMERIC_PRESENTATION_SYSTEM_PROPOSED = YES`
