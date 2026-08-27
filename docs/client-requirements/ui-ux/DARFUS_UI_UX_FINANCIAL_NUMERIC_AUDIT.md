# Financial / Gold Numeric Presentation Audit

Observed runtime values use AED, tabular numerals, explicit decimals, and LTR isolation. Gold Center displays provider/rate rows with many decimal places; POS/tables display grouped AED values and VAT percentages. Accounting/Treasury show debit/credit-style amounts and liquidity values.

Risks: precision presentation varies by view (Gold Center rates show long decimals while business totals are two decimals), global table centering is not optimal for ledger comparison, and mixed Arabic/English currency labels occur. These are presentation findings only; no rounding/calculation authority was changed. P1 for financial readability consistency, P2 elsewhere.
