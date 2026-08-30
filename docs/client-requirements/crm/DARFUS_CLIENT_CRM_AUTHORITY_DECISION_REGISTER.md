# DARFUS CLIENT CRM — Authority Decision Register

| ID | Client wording | Frozen DARFUS authority | Current reality | Decision needed | Safe recommendation | Risk |
|---|---|---|---|---|---|---|
| CRM-AUTH-001 | One permanent unified Customer identity and Customer Domain ownership | Customer identity is one company-scoped authority; operational domains retain their owners | Model/references exist; merge absent | Define merge without second identity owner | Keep Customer ID; projections first | P1 |
| CRM-AUTH-002 | Duplicate review and merge | No destructive history rewrite or uncontrolled identity mutation | No merge route/service/model | Approve survivor, remap, audit, concurrency, recovery | Separate merge design; no implementation here | P1 |
| CRM-AUTH-003 | CRM balance/financial relationship | Accounting/Treasury/AR remain source authority | balance, statement and credit models coexist | Choose canonical read projection | Read-only adapter only | P1 |
| CRM-AUTH-004 | Consent/privacy and communication preferences | Auth/RBAC/company/branch fail closed | KYC/AML exists; consent/communication absent | Approve fields, withdrawal, dates, actor, audit, retention | Privacy design before schema/API | P1 |
| CRM-AUTH-005 | Event-driven/CQRS/offline technical language | No new event store/offline engine without proven need | REST/relational projections; dashboard offline UI only | Classify clauses as mandatory or guidance | Business-result adapter first | P2 |
| CRM-AUTH-006 | Complete customer timeline | Operational records source-owned; timeline may project | Timeline/history tables exist but limited rows | Approve event coverage and original navigation | Extend read projection after mapping | P1 |
| CRM-AUTH-007 | Alerts/tags/analytics/government/workshop scope | No new operational/master authority inferred from prose | Partial/unproven | Confirm priority and literal scope | Split future controls | P2 |

