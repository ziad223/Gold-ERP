# UX-3 Responsive Shell

| View | Evidence |
|---|---|
| Wide desktop / desktop | 1440×900 browser matrix; header, sidebar, main and active route present |
| Tablet/mobile representative | 390×844 AR/EN dashboard captures and drawer proof |
| Desktop sidebar collapse | `aria-expanded`: true → false → true |
| Mobile drawer | Open button → visible navigation → close action |
| RTL/LTR | `lang=ar, dir=rtl` and `lang=en, dir=ltr` observed on every tested locale pair |

The desktop margin model and mobile off-canvas behavior are preserved; UX-3 adds semantic hooks only. No module grid, form, table, or action workflow was redesigned.
