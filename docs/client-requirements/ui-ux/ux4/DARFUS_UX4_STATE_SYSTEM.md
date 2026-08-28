# UX4 Empty / Loading / Error State System

Existing Empty, Loading, Skeleton, and Error primitives remain contract-compatible. Empty now exposes `role=status`, Loading exposes `role=status` and `aria-live=polite`, and Error exposes `role=alert`. Messages, retry callback, correlation ID presentation, and business behavior remain unchanged.

Result: `STATE_SYSTEM = PASS`.
