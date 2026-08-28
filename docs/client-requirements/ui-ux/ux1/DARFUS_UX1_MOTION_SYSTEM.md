# UX-1 Motion System

| Category | Default | Reduced motion | Forbidden |
|---|---|---|---|
| Micro interaction | 120–180ms transform/opacity | near-instant | layout jump |
| Navigation/page transition | 160–220ms opacity | none | blocking transition |
| Drawer/modal/popover | 160–220ms transform/opacity | fade/none | delayed action |
| Accordion/row expansion | 140–200ms height/opacity only when stable | instant | shifting critical controls |
| Filter panel | 140–180ms | instant | hiding results |
| Loading | stable, lightweight indicator | static indicator | moving data layout |
| Success/status feedback | brief opacity/color cue | immediate text state | animated financial value |

Minimal or no motion: final POS confirmation, barcode/inventory scanning, rapid data entry, financial tables, accounting value review and error recovery. Honor `prefers-reduced-motion`; no decorative infinite motion, glow loop or moving background. If motion delays or destabilizes operation: `REMOVE MOTION; KEEP FUNCTION`.
