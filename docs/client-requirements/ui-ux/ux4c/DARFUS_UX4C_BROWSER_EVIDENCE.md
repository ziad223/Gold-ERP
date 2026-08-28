# UX4C Browser Evidence

| Run | Result | Evidence |
|---|---|---|
| EN desktop, inner close | PASS | Focus entered `Close drawer`; after close active text was `Open drawer`. |
| EN desktop, overlay close | PASS | Dialog removed; focus returned to `Open drawer`. |
| EN desktop, Escape | PRESERVED AS UNSUPPORTED | Escape did not close the Drawer before or after; no new close behavior added. |
| AR/RTL dark | PASS | `lang=ar`, `dir=rtl`, dark root; focus returned to `فتح الدرج`. |
| AR/RTL light | PASS | Light background/class observed; focus returned to `فتح الدرج`. |
| EN/LTR mobile | PASS | Browser-reported 434×938; Drawer fit viewport and focus returned to `Open drawer`. |
| Console | PASS | Fresh tested tabs: zero error/warning entries. |
| Business/network mutation | NONE | Reference surface remains static and API-free; no business action was used. |

