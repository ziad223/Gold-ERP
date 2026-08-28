# DARFUS ERP — UX5C Owner Finding Map

All findings below are presentation-only. No handler, payload, state transition,
API call, permission, or business authority is changed.

| ID | Current evidence | Current source owner | Visual cause | Minimum correction | Expected files | Business impact | Rollback |
|---|---|---|---|---|---|---|---|
| `DARFUS-UX5C-RESPONSIVE-CORRECTION-001` | UX5 tablet capture showed dense multi-panel layout risk | `app/[locale]/(dashboard)/pos/page.tsx` main grid | Three regions do not get an explicit medium layout contract | Use two columns at `lg`, payment spans row, three columns only at `2xl` | POS page, focused test | NONE | Pre/post snapshot + isolated hash rehearsal |
| `DARFUS-UX5C-AR-PAYMENT-PURITY-001` | AR payment controls contained bilingual UI chrome | POS `paymentOptions` and payment subpanels | Arabic labels concatenate English terms | Render Arabic-only chrome and preserve English-only labels in EN | POS page, focused test | NONE | Same |
| `DARFUS-UX5C-VISUAL-STATE-CLARITY-001` | Zero discount and disabled actions used strong/error-like styling | POS discount/clear/checkout classes | Visual emphasis did not distinguish neutral/disabled states | Neutral zero discount, subdued empty clear action, explicit disabled checkout surface | POS page, focused test | NONE | Same |
| `DARFUS-UX5C-SEARCH-DENSITY-001` | Search controls compete for narrow widths; empty invoice area is tall | POS `DataToolbar` consumer and empty state | Parent layout lacks medium density guard | Constrain search controls through POS layout and compact empty state only | POS page, focused test | NONE | Same |
| `DARFUS-UX5C-TEAL-GOLD-001` | Operational teal dominates identity accents | POS badges/total/icon classes | Brand and premium context use the same accent | Reserve gold for POS identity and key financial emphasis; retain teal for operations | POS page, focused test | NONE | Same |

Deferred and explicitly untouched:

- `DARFUS-UX5-DEFERRED-SIDEBAR-LIGHT-HEIGHT-001`
- `DARFUS-UX5-DEFERRED-VOUCHER-EMPTY-CART-STATE-001`
