# DARFUS UX4B — Read First

- Control: `DARFUS-UIUX-UX4B-CORE-COMPONENTS-BROWSER-VISUAL-EVIDENCE-CLOSEOUT-01`
- Mode: evidence closeout; no business/API/DB implementation.
- UX4 implementation is treated as frozen. This control adds only an isolated, localized static reference surface and its isolation test.
- Production routes, shared component contracts, backend routes, database, migrations, permissions, and business workflows are out of scope.
- The connected browser did not expose network instrumentation. Source inspection and the isolation test are used for the static no-fetch/no-write claim; this is not a network-capture PASS.
- A blocker was found: the Drawer opens and receives focus, but after closing focus lands on `BODY` rather than returning to its trigger. Per the control, the defect is recorded and no UX4B fix is applied.

