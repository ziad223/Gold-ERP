# Real browser evidence

Runtime: existing `http://localhost:3000`, authenticated; no new frontend instance was started and no Receive button was pressed.

| Journey | Result |
|---|---|
| EN equal | Reason field absent after entering the runtime current reference `476.06254062`. |
| EN lower | Reason field visible for `470`; valid reason text was entered; no final action. |
| EN higher | Reason field visible for `480`; previously entered reason remained. |
| AR lower | Arabic label/help visible for `470`. |
| Tablet/mobile | Control visible at 768/390 widths; viewport reset. |
| Console | No error/warn entries captured. |
| Network | Preview POSTs only; no `/purchase-orders/receive` sent by this control. |

`BEFORE_BROWSER_EVIDENCE = PASS`  
`REAL_BROWSER_UI_PROOF = PASS`

