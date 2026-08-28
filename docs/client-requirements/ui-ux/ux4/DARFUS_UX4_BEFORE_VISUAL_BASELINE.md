# DARFUS UX4 — Before Visual Baseline

The existing local runtime was opened read-only at `http://localhost:3000/en/dashboard` before source edits. It rendered the UX3 shell with dashboard, sidebar, header, branch context, and semantic dark theme. The page DOM was 6,779 characters and captured console error/warning count was 0 at the observation point.

Baseline evidence is intentionally limited to safe presentation reads; no business action, form submission, POST, or mutation was performed.

| Surface | Mode | Observation |
|---|---|---|
| Dashboard | EN / desktop | Loaded; UX3 header/sidebar/page container visible |
| Shared controls | EN / desktop | Button, panel/card, badges, search/control styling present in dashboard |
| Numeric presentation | EN / desktop | Values remained LTR-readable and tabular |
| AR/RTL | Deferred to post-change matrix | Requires route observation after UX4 source is served |
| Dark/light | Deferred to post-change matrix | Existing runtime was dark; light toggle is presentation-only but not changed in UX4 |
| Mobile/narrow | Deferred to post-change matrix | No source change before baseline; verify after change |

`UX4_BEFORE_VISUAL_BASELINE = PASS_OR_DOCUMENTED_PARTIAL` (documented partial because the current runtime had one visible dashboard surface and not every component state is reachable without mutation).
