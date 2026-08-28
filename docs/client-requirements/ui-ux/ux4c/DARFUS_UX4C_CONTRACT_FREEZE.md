# UX4C Drawer Contract Freeze

| Contract item | Frozen value | Changed? |
|---|---|---|
| Required props | `open`, `onClose`, `title`, `children` | NO |
| Optional props | `description`, `side` | NO |
| Callback | `onClose(): void` | NO |
| Controlled semantics | `open` controls rendering; parent closes through `onClose` | NO |
| Open/close semantics | Portal mounts while open and unmounts while closed | NO |
| Styling passthrough | Existing internal `cn`/class structure | NO |
| Children | `React.ReactNode` | NO |
| Focus lifecycle | Focus entry retained; trigger restoration added | Focus behavior only |

No public prop, event, route, or consumer contract changed.

