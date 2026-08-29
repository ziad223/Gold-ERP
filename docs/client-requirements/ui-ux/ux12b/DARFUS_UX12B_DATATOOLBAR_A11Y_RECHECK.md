# UX-12B DataToolbar Accessibility Recheck

At 390×844, AR `/customers`, `/accounting`, `/audit` each exposed one Reset button with the existing Arabic `resetLabel` as `aria-label`. EN `/customers`, `/accounting`, `/audit` exposed the existing English `Reset` accessible name. The enabled path was exercised in AR after a local search filter: the button was enabled and pressing Enter restored the query. The button is a native `<button>` with unchanged `onReset` and disabled logic; the source repair remains only `aria-label={resetLabel}`.
