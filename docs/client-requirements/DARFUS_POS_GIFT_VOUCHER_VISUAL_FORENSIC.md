# POS Gift Voucher Visual Forensic

Control: `DARFUS-POS-GIFT-VOUCHER-VISUAL-UX-CORRECTION-01`

## Before-fix observation

The real authenticated POS page showed the Gift Voucher section, but the old
field/Validate row was visually broken in the payment card: the input collapsed
to a very small control while the action consumed most of the row. Typed text
and caret visibility were poor in RTL. This was captured in the pre-fix browser
screenshots from the current POS runtime; the earlier functional PASS did not
close the visual defect.

## Source/CSS proof

Before correction, the row used a flex layout where both the input (`flex-1`
plus the global `input-base w-full`) and the Button had competing width rules;
the Button was also given `w-full`. In the narrow payment-card width this let
the action consume the row and forced the input to shrink.

The corrected local component uses `flex-col sm:flex-row`, `min-w-0 w-full
flex-1` for the input, and a fixed practical action width via
`width: max-content`, `minWidth: 7rem`, and `maxWidth: 100%`. This removes the
width competition without changing global tokens or business behavior.

## Reviewed properties

| Property | Evidence | Result |
|---|---|---|
| Input width/height | post-fix AR/EN screenshots; `input-base` plus flex sizing | PASS desktop |
| Button width/alignment | post-fix screenshots; max-content inline style | PASS desktop |
| RTL/LTR | AR `dir=rtl` with code input `[direction:ltr]`; EN LTR | PASS |
| Text/caret/placeholder | synthetic `GV-TEST-123456` visibly rendered with focus | PASS desktop |
| Border/focus/background | visible focus ring in screenshots | PASS desktop |
| Disabled opacity/message | Installment and Deposit screenshots | PASS |
| Error layout | `role=alert`, local source contract; no official validation call | SOURCE PASS; visual error-state not separately triggered |
| Narrow viewport | browser resize API unavailable | NOT PROVEN |

`CURRENT_VISUAL_FORENSIC = COMPLETE`

`VISUAL_ROOT_CAUSE_PROVEN = YES`

