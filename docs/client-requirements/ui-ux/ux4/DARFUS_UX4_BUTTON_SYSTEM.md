# UX4 Button System

`components/ui/button.tsx` was refined in place. Existing variants (`primary`, `secondary`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), native button props, disabled behavior, event callbacks, and className passthrough remain unchanged. The refinement adds a minimum-width guard, color-only transition, and `focus-visible` presentation. No action, payload, permission, or loading contract changed.

Result: `BUTTON_SYSTEM = PASS`; browser evidence: Dashboard and POS; focused UX4 contract test: PASS.
