# Gift Voucher Mapping — Clone Financial Proof

Clone: `darfus_gv_fin_mapping_fix_01_idem_20260827`.

One disposable purchased Voucher issue was executed through the same Gift Voucher service and resolver path after the minimum mapping write.

| Assertion | Result |
|---|---|
| HTTP-equivalent command result | 201-equivalent service success |
| Voucher delta | +1 |
| Journal delta | +1 |
| Journal line delta | +2 |
| Cash transaction delta | +1 |
| Debit | 3235.53 to resolved Treasury |
| Credit | 3235.53 to resolved Gift Voucher Liability / 2400 |
| Journal balanced | PASS |
| Revenue at issue | 0 |
| Output VAT at issue | 0 |
| Account selection | resolved IDs; no literal account fallback |
| Currency | AED |

`CLONE_PURCHASED_GV_ISSUE = PASS`.
`CLONE_ISSUE_JOURNAL_BALANCED = PASS`.
`CLONE_ISSUE_REVENUE = 0`.
`CLONE_ISSUE_OUTPUT_VAT = 0`.

