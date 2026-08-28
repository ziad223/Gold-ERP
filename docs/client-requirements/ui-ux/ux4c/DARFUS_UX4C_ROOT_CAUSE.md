# UX4C Root Cause

| Field | Finding |
|---|---|
| Issue | `UX4B-A11Y-001` |
| Root cause | Drawer focused its close control on open but retained no reference to the invoking trigger and performed no post-unmount focus restoration. |
| Enabling condition | Controlled close unmounted the portal while the close button was focused; the browser therefore placed focus on `BODY`. |
| Minimum safe fix | Capture the active HTMLElement on false→true, then after the open→closed effect transition focus that connected element with `preventScroll`. |
| Prevention | Overlay tests must assert entry focus and exact trigger restoration for every supported close path. |
| Affected consumers | Shared Drawer and the isolated UX4B reference consumer; no business consumer migration required. |

`ROOT_CAUSE_PROVEN = YES` by source trace plus fresh-browser reproduction.

