# UX-10 Dependency Map

```text
Auth/session → company context → branch context
       │              │                 │
       ├── RBAC ──────┼── Settings reads/writes (existing)
       │              ├── Tax / Barcode / Printing authorities
       │              └── System account controls
       └── Audit read scope → AuditLog projection → detail/diff/verify

Settings links remain connected to Tax, Gold Center, Accounting/Treasury,
Inventory, POS and Printing authorities; UX-10 changes none of those dependencies.
```
