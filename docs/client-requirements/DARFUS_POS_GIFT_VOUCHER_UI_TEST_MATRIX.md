# POS Gift Voucher Payment UI — Focused Test Matrix

| ID | Assertion | Evidence target |
|---|---|---|
| POS-GV-UI-01 | Shared section is enabled with Cash | component/page test |
| POS-GV-UI-02 | Shared section is enabled with Card | component/page test |
| POS-GV-UI-03 | Shared section is enabled with Transfer | component/page test |
| POS-GV-UI-04 | Installment combination fails closed | page/contract test |
| POS-GV-UI-05 | Deposit combination fails closed | page/contract test |
| POS-GV-UI-06 | Shared section is enabled with Split | component/page test |
| POS-GV-UI-07 | Exactly one canonical component is rendered outside Split | source test |
| POS-GV-UI-08 | Shared Voucher state is parent-owned and not duplicated per mode | source test |
| POS-GV-UI-09 | Applied amount is display-only | component/source test |
| POS-GV-UI-10 | Remaining due derives from current invoice total minus face value | source test |
| POS-GV-UI-11 | Cash/Card/Transfer payload uses existing canonical split semantics | source test |
| POS-GV-UI-12 | Voucher is not placed in the discount field | source test |
| POS-GV-UI-13 | Focus ring and caret use the existing input/button tokens | component/source test |
| POS-GV-UI-14 | Typed code remains visible and LTR-safe | browser proof |
| POS-GV-UI-15 | AR panel is RTL and code input is LTR | browser/source proof |
| POS-GV-UI-16 | EN panel is LTR | browser/source proof |
| POS-GV-UI-17 | Narrow layout keeps input and action usable | browser/source proof |
| POS-GV-UI-18 | Validation error is user-facing and non-technical | component/source test |

No test in this matrix creates or settles a Voucher.
