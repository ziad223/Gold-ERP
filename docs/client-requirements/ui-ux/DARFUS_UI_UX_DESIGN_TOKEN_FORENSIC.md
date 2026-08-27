# Design Token Forensic

Theme tokens are defined in `app/globals.css` for background, foreground, panel, border, surface, card, popover, primary, secondary, status colors, input, table and sidebar; Tailwind maps them in `tailwind.config.ts`. Dark mode overrides the same variables, and spacing/radius/shadows are extended in Tailwind.

Source signals: 111 hardcoded hex occurrences, 146 inline-style/style-pattern occurrences, 93 files using `dark:`. Brand palette includes teal, navy and gold; shadows/radii are generous and repeated. Finding: token foundation exists but is not yet a strict token-only system. Future UX-1 should consolidate hardcoded colors and define typography/spacing/radius/breakpoint contracts without touching business behavior.
