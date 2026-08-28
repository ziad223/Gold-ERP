# UX-0B Dark / Light Closeout

## Dark

The class-based dark theme rendered in the internal browser on Dashboard and POS, with readable foregrounds, dark surfaces, teal/gold accents, borders, disabled controls, and a light-paper print exception. Source evidence still shows 93 files using `dark:` and 111 hardcoded hex occurrences. Component-level contrast parity across all critical routes, states, dialogs, tables, and focus/disabled/error combinations is not proven.

Status: `OPEN_P1_DARFUS-DARK-MODE-CONTRAST-001`.

## Light

Dashboard, AR Dashboard, profile forms, search/finance tables, and Gold Center were observed in light mode. Inputs, table surfaces, status colors, and print surfaces were usable in samples, but a separate all-route light-mode matrix was not completed. Light mode remains an intentional design requirement, not an automatic consequence of dark-mode behavior.

Status: `OPEN_P1_LIGHT_MODE_PARITY_NOT_FULLY_PROVEN`.

## Required component audit checklist

Page background, card, nested surface, input, select, dropdown, table/header, hover, selected, modal, drawer, popover, tooltip, buttons, disabled, readonly, focus, error, success, warning, scrollbar, empty, and loading were either sampled in UX-0 or remain `NOT_RUNTIME_PROVEN` for exhaustive route/state coverage. No contrast certification is claimed.

`DARK_MODE_CLOSEOUT = PARTIAL_OPEN`
`LIGHT_MODE_CLOSEOUT = PARTIAL_OPEN`
