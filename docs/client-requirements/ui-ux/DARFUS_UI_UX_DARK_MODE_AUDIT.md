# Dark Mode Audit

Dark mode is class-based (`tailwind.config.ts`, `contexts/theme-context.tsx`, `app/globals.css`) and was toggled in the internal browser. The authenticated POS and dashboard rendered with dark surfaces, readable foregrounds, teal/gold accents, visible borders, buttons, and disabled checkout state.

| Component/state | Result |
|---|---|
| Shell/cards/inputs/selects/tables | Mostly readable through semantic tokens and global overrides |
| Status/alerts/focus | Visible, but contrast must be checked per page and hardcoded colors remain in source |
| Print/receipt surface | Explicit light-paper overrides exist; this is a special-case variant |
| Scrollbar/placeholder/disabled | Implemented; page-specific contrast is not uniformly proven |
| Critical issue | `DARFUS-DARK-MODE-CONTRAST-001` remains OPEN for modernization; no closure claimed |

Source signal: 93 files contain `dark:` classes and 111 hardcoded hex occurrences across audited UI source. This indicates scattered theming and a future token-consolidation need, not proof that every instance fails.
