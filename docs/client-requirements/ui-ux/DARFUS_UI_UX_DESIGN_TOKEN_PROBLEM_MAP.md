# Design Token Problem Map

| Token category | Current evidence | Problem | UX-1 target |
|---|---|---|---|
| background / surface / elevated | CSS variables + page-local surfaces | hierarchy varies | semantic surface levels |
| foreground / muted / border | global tokens + overrides | contrast not globally proven | measured contrast pairs |
| gold accent | teal/navy base with gold accents | identity fit partial; risk of overuse | priority/accent only |
| success/warning/danger/info | tokens plus inline colors | semantic consistency varies | status palette contract |
| focus/disabled | shared tokens and local classes | association/visibility partial | visible keyboard states |
| shadow/radius | Tailwind + repeated local values | scattered scale | small canonical scale |
| spacing/type scale | Tailwind and local classes | forms have equal visual weight | density-aware scale |
| motion duration/easing | no formal policy in current audit | ungoverned | safe transform/opacity tokens |
| breakpoints | CSS/Tailwind plus behavior by page | no one matrix | seven tested classes |
| z-index/overlay | dialogs/drawers/page-local | collision risk unproven | overlay layers |

Source signals: 111 hardcoded hex occurrences, 146 inline-style/style-pattern occurrences, and `dark:` in 93 files. This is a consolidation opportunity, not proof that each value is defective. No CSS or token was edited.
