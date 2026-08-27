# Accessibility Audit (not WCAG certification)

Positive evidence: semantic headings, native controls, named primary buttons, visible focus rings in shared Button/NativeSelect/InfoTooltip, tooltip focus support, and permission-denied/branch-readiness messages. The POS DOM sample found two unnamed buttons and several native controls with no explicit label association, though some are structural/selectors with surrounding text.

Status: NEEDS_IMPROVEMENT. P1 candidates are unlabeled critical controls and focus/keyboard parity in dense workflows; P2 candidates are icon-only controls and inconsistent aria labels. A full keyboard traversal and screen-reader announcement audit was not claimed.
