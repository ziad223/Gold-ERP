# POS Gift Voucher Visual Browser Proof — English

URL: `http://localhost:3000/en/pos`

| State | Observation | Result |
|---|---|---|
| Card normal/filled | Section visible; input dominates and Validate has practical width; synthetic text/caret visible | PASS desktop |
| Installment | Section remains visible; input and Validate disabled; English warning readable | PASS |
| Deposit | Source/shared component keeps the same fail-closed behavior; EN rendered labels verified | PASS |
| Focus | Border/ring visibly changes on the synthetic input | PASS |
| Direction | EN page LTR; code remains readable | PASS |

No Validate click was made. No official Voucher was created or queried.

`EN_VISUAL_ACCEPTANCE = PASS_DESKTOP`

`EN_SCREENSHOT_REVIEW = PASS`

Screenshot artifact: `DARFUS_POS_GIFT_VOUCHER_VISUAL_EN_DESKTOP.png`.
