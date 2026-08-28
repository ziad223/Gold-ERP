# UX-10 RBAC Authority Map

| Authority | Current source | UX-10 result |
|---|---|---|
| User/session | auth context/middleware | unchanged |
| Company context | server request context | unchanged |
| Branch context | branch context and server scope | unchanged |
| Settings view/write | `settings.view`, `settings.update` and existing specialized guards | unchanged |
| System accounts | `system_accounts.view/manage`, `users.view` | unchanged |
| Audit view | existing authenticated audit route and page hook | unchanged |
| Employee/operator attribution | existing user/employee distinction | unchanged |

No role, permission, membership, account, session, password, or bypass behavior is changed. Disabled/hidden actions remain governed by the existing source conditions.
