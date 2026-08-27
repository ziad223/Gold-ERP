# POS Gift Voucher Visual Browser Proof — Arabic

URL: `http://localhost:3000/ar/pos`

| State | Observation | Result |
|---|---|---|
| Cash normal/filled | Section visible; input and Validate are side by side; `GV-TEST-123456` and caret visible | PASS desktop |
| Installment | Section remains visible; input and Validate disabled; Arabic warning readable | PASS |
| Deposit | Section remains visible; input and Validate disabled; Arabic warning readable | PASS |
| Focus | Border/ring visibly changes on the synthetic input | PASS |
| Direction | Arabic container RTL; code input LTR-safe | PASS |

No Validate click was made. No official Voucher was created or queried.

`AR_VISUAL_ACCEPTANCE = PASS_DESKTOP`

`AR_SCREENSHOT_REVIEW = PASS`

Screenshot artifact: `DARFUS_POS_GIFT_VOUCHER_VISUAL_AR_DESKTOP.png`.
