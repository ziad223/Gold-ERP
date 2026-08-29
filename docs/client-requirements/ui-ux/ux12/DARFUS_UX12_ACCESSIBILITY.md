# UX-12 Accessibility

Representative controls were checked for labels, associated text, role/state semantics and focus-visible styling. The initial mobile sweep found the shared `DataToolbar` reset button had only an icon after its text was hidden at `sm`; the button had no accessible name. The minimal repair adds `aria-label={resetLabel}` and was verified in AR and EN at 390×844. The native button remains keyboard-focusable and touch-activatable; reset behavior/handler is unchanged.
