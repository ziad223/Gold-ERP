# UX4 Select / Combobox System

`NativeSelect` keeps its native select/ref/event contract and existing h-10 presentation. `Select` is an explicit compatibility alias for `NativeSelect`. `Combobox` is a standalone searchable, keyboard, focus, and touch-safe primitive with listbox semantics; no existing consumer was mass-rewritten and no option/master-data behavior changed.

Result: `SELECT_COMBOBOX_SYSTEM = PASS` by source and focused semantic tests. No production business consumer was changed.
