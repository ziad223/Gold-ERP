# Error / Validation / State Audit

Shared `ErrorState`, `LoadingState`, `EmptyState`, `ConflictState`, `Modal`, and `InfoTooltip` components exist. `ErrorState` has locale defaults and optional correlation ID; React Query toasts surface API errors. Browser pages showed guarded/empty/loading states without raw stack traces in the sampled screens.

Risks: raw technical terms are present in source/user-visible strings on some pages (`API mode only`, backend-resolved wording, technical state names); EN/AR mixed data is visible; many screens need page-specific recovery evidence. `InfoTooltip` supports hover, click and focus but should be tested for touch/focus trapping in a future component gate. P1 language/clarity for critical errors, P2 consistency.
