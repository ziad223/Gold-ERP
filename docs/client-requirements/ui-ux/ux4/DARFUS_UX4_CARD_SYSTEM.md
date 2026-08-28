# UX4 Card System

`components/ui/card.tsx` and the existing `.panel` semantic token class were inspected and left unchanged because the current UX2/UX3 presentation already consumed the approved surface, border, radius, and shadow tokens. Dashboard, POS, Inventory, and Accounting browser routes showed the existing card hierarchy without a module redesign.

Result: `CARD_SYSTEM = PASS`; `CARD_SOURCE_CHANGED = NO`.
