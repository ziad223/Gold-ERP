# UX-10 Audit Authority Map

| Concern | Authority | Evidence |
|---|---|---|
| Event persistence | `audit.service.js` and `AuditLog` model | append-only service/model inspected |
| Event identity | AuditLog `id` | audit list/detail source |
| Actor attribution | `userId` plus display user/actor fields | audit service and controller routes |
| Scope | company and branch/place context | route auth context and audit records |
| Event meaning | action, description, entity/source references | `audit-logs` list/detail and source calls |
| Time | persisted timestamp/date fields | AuditLog projection |
| Before/after | raw before/after fields consumed by `AuditDiffViewer` | Audit page/detail source |
| Integrity | `GET /audit-logs/verify` → `auditService.verifyChain` | route and UI handler |
| Read permission | authenticated audit route and existing policy | current route and page |

No audit row is rewritten, normalized, deleted, merged, or made mutable by UX-10.
