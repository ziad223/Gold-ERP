# DARFUS CLIENT CRM — Root Cause and Dependency Map

| Group | Affected rows | Root cause | Dependencies | Blocks | Minimum safe batch |
|---|---|---|---|---|---|
| G1 Identity/Foundation | CF, ARC identity, BR identity | Foundation exists but field/identity semantics broader | Customer ownership; company/branch | All CRM | CRM-1A |
| G2 Duplicate/Merge | BR-01..03; SCN-03..04; EX-02..03 | No server review/merge workflow | G1; owner merge decision | Lifecycle/360/history | CRM-1B/1C |
| G3 Lifecycle | CF-08; BR-04..06; SCN-05..06 | Deactivate/reactivate exists; archive restrictions unclear | G1; RBAC; audit | 360/dashboard | CRM-1D |
| G4 360 Projections | ARC-03/08/09; MOD-05..07; INT-01..04 | Distributed sources and incomplete projection | G1; source maps | Dashboard/reports | CRM-2A |
| G5 Timeline/History | ARC-07..09; MOD-06; EX-07..08 | Tables exist; event coverage/navigation limited | G4; source events | 360/recovery | CRM-2B |
| G6 Balance Adapter | MOD-07; INT-02; TECH-02 | Multiple financial read semantics | Accounting authority | 360/dashboard | CRM-2C |
| G7 Dashboard/Analytics | MOD-01..04; INT-05; TECH-08 | Metrics lack complete definitions | G4/G6; owner metrics | Reports/segments | CRM-3A |
| G8 Segmentation | MOD-08; CF-07/09 | Tiers/filters limited | Fields; metrics; privacy | Dashboard/comms | CRM-3A |
| G9 Loyalty | MOD-09; BR-08/09; SCN-07 | Ledger exists; policy/event/expiry incomplete | G1; source events | 360/analytics | CRM-3B |
| G10 Communication/Privacy | CF-10; MOD-10; BR-07/10; EX-04 | No communication/consent authority | Privacy decision; RBAC/audit | 360/notifications | CRM-4A |
| G11 Security/Audit/Notifications | SCR-07/09; INT-08/09; EX-10 | Generic foundation; CRM coverage incomplete | G1; privacy | Acceptance | CRM-4B |
| G12 API/CQRS/DTO | ARC-04/06; TECH-03/05..07 | Guidance broader than current REST/relational shape | Owner classification | Integrations | CRM-5A |
| G13 Offline/Recovery | SCN-09; EX-06; TECH-09 | Dashboard offline UI not customer sync | Owner offline scope | Production | CRM-5B |
| G14 Performance/Production | TECH-08..10; FUT-01/02 | No CRM benchmark/production proof | Stable contracts | Final closure | CRM-6 |

Dependency graph: G1 → G2 → G3; G1 + source maps → G4 → G5/G6; G4 + G6 → G7; privacy/RBAC → G8/G9/G10/G11; stable contracts → G12/G13 → G14.

