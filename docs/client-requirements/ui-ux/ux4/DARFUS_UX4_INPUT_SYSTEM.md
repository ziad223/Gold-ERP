# UX4 Input System

`components/ui/input.tsx` is a new standalone shared visual primitive using the existing `.input-base` semantic contract. It preserves native input attributes, ref, value, disabled, readOnly, and events. `components/ui/data-toolbar.tsx` received only an accessible label for its existing search input. `numeric-input.tsx` and `numeric-token.tsx` were not changed; numeric values remain presentation-only and LTR-safe.

Result: `INPUT_SYSTEM = PASS`; `NUMERIC_PRESENTATION_BEHAVIOR_CHANGED = NO`.
