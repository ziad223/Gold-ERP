# UX-2 Semantic Token Foundation

`app/globals.css` now exposes one production semantic foundation while preserving the existing RGB custom-property contract:

`--canvas`, `--surface-1`, `--surface-2`, `--surface-3`, `--surface-elevated`, `--surface-interactive`, `--surface-selected`, `--text-primary`, `--text-secondary`, `--text-muted`, `--text-inverse`, `--border-subtle`, `--border-default`, `--border-strong`, `--gold-primary`, `--gold-muted`, `--gold-highlight`, `--gold-contrast`, `--success`, `--warning`, `--danger`, `--info`, `--focus`, `--disabled`, `--overlay`, motion tokens and typography hooks.

Aliases preserve current values and are consumed only by the minimum global canvas/text/border declarations. Existing components continue to use the previous variables. No module migration occurred.

`UX2_SEMANTIC_TOKEN_FOUNDATION = PASS`
