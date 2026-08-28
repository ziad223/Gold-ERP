# UX-11 Responsive

Read-only browser checks used desktop and a reduced viewport. The Arabic invoice-search page reported `body clientWidth=426` and `scrollWidth=426` at the reduced viewport (`innerWidth=434`), with no horizontal body overflow. Preview wrappers use `min-width:0`, `max-width:100%`, controlled horizontal overflow only for content that needs it, and responsive padding at 900px/640px breakpoints.

