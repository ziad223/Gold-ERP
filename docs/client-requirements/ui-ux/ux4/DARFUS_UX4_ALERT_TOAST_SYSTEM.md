# UX4 Alert / Toast System

Added standalone `Alert` and `Toast` presentation primitives. Alerts expose `role=alert` for danger and `role=status` otherwise; Toast uses `role=status` and `aria-live=polite`. They accept localized caller content and do not translate or expose raw backend messages. No existing notification source or business event was changed.

Result: `ALERT_TOAST_SYSTEM = PASS` by source and focused semantic tests.
