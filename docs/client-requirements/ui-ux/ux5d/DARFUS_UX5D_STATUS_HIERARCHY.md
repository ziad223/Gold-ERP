# UX-5D Status Hierarchy

- Active voucher retains the existing semantic success state and text.
- Unsupported payment retains the existing warning/error meaning.
- Validation errors retain `role="alert"` and are visually clearer.
- Loading and disabled controls retain their existing guards.
- No transitional or internal implementation state was exposed to the user.

Result: `STATUS_HIERARCHY = PASS`.

