# UX5C — Empty Cart Clear Action

The Clear Invoice Items handler remains `setCart([])` and is not disabled or
removed. When the cart is empty, the action is visually subdued and exposes
`aria-disabled="true"`; with items present it retains the destructive accent.
The empty-state panel is compact and contains no fake invoice items.

`EMPTY_CART_CLEAR_ACTION_PRESENTATION = PASS`
`CLEAR_CART_BEHAVIOR_CHANGED = NO`
