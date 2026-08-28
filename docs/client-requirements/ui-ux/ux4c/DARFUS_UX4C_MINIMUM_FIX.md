# UX4C Minimum Safe Fix

Changed only `components/ui/drawer.tsx`:

1. Add `invokingTriggerRef` and `wasOpenRef`.
2. Capture the active HTMLElement only when transitioning into open.
3. Preserve existing body-scroll lock and close-control focus entry.
4. On close, restore focus only if the original trigger remains connected, using `focus({ preventScroll: true })`.
5. Leave public props, callbacks, portal markup, close behavior, styling, and business consumers unchanged.

No Escape handler was added because Escape was not part of the existing Drawer implementation; adding it would widen this focus-only control.

