# DARFUS Jewellery ERP — v1.0.0 Product Roadmap

## Product vision and official decisions

DARFUS v1.0.0 is a branch-safe jewellery ERP with controlled Super Admin and
fixed Branch Account access, Employee Code plus PIN operations, auditable
financial flows, Arabic/English desktop/mobile use, and a reversible release
process. The only official workspace is `H:\WORK\jewellery-erp-master`; the
only adopted local development/test database is `localhost:5432/darfus_erp`.

Completed foundations include the Next.js/Express architecture, 47 committed
migrations, 46 frontend pages, 83 models, 40 services, branch-scoped system
account schema, Customer/BranchCustomer scope helpers, reservation workflow v2,
Customer Credit ledger, cash-register/GL services, 66 verifier files, and
Arabic/English route generation. Source presence is not acceptance evidence.

## Ordered delivery plan

| Phase | Goal and allowed scope | Dependencies / risks | Acceptance evidence | Target / status |
| --- | --- | --- | --- | --- |
| MARKET-RELEASE-AUDIT1 | Documentation-only system audit and roadmap. | None. | Audit backup, findings, plans, static validation. | v1.0.0 / COMPLETE |
| LOCAL-DB-VERIFIER-ADOPT1 | Verifier-only classification/adoption for `localhost:5432/darfus_erp`; no Product changes. | Guard and validated backup; V4/V5 remain blocked. | Explicit local-target/backup/run-ID guard; 44 static verifiers passed; V4/V5 require redesign. | v1.0.0 / PARTIAL |
| BRANCH-1-VERIFIER-VALIDATE1 | Run the approved local verifier matrix after adoption. | Previous phase; known permission/catalog state. | Exact PASS/FAIL/BLOCKED results and no shared-data pollution. | v1.0.0 / BLOCKED |
| AUTH-SUPERADMIN-ADOPT1 | Convert the owner-named legacy account only after exact email and local DB proof. | Backup; exact owner target; no Branch Account conversion. | Hash/company preserved, active/unlocked, branch/default Employee cleared, sessionVersion bumped, audit event, reversal procedure. | v1.0.0 / PLANNED |
| DEPOSIT-1-DIAG-CLOSE | Close configuration and behavioral evidence for Customer Credit, reservation Araboon, down payments, and refunds. | Current P1 findings; no posting test without rollback/cleanup. | Branch role readiness, cash-register setup, existing-data classification, approved accounting policy. | v1.0.0 / READY |
| DEPOSIT-1-FIX | Repair only proven deposit/refund authorization, configuration, or GL defects. | Approved diagnostic close. | Server-resolved liability and authoritative treasury source; atomic/idempotent branch-safe posting. | v1.0.0 / BLOCKED |
| DEPOSIT-1-ACCEPT | API, GL, CashRegister, receipt, cancellation/refund and duplicate-submit acceptance. | Deposit fix; safe fixture ownership. | Dr/Cr evidence, no pre-sale VAT/revenue/COGS/inventory, cleanup. | v1.0.0 / BLOCKED |
| BRANCH-1-ACCEPT1 | Two-branch Customer, Reservation, Credit, inventory, journals and direct-deny acceptance. | Verifier adoption and safe fixtures. | Same-branch allow; cross-branch read/write deny; exact-ID responses; zero partial writes. | v1.0.0 / BLOCKED |
| RELEASE-BLOCKERS-FIX1 | Address approved P1 findings: permission baseline, dependency remediation, deployment gaps. | Findings triage and explicit scope. | Focused regression and security evidence. | v1.0.0 / BLOCKED |
| ENV-CONTRACT-FIX1 | Make Product runtime database configuration fail closed for Production while retaining ENV-driven local/staging behavior. | Explicit Product/config authorization. | Shared resolver, strict parsing, URL conflict refusal, focused probes. | v1.0.0 / COMPLETE |
| FULL-REGRESSION-1 | Execute all accepted static, API, financial and Browser matrices. | Prior fixes/acceptance. | Clean report with exact totals and residual warnings. | v1.0.0 / BLOCKED |
| STAGING-FOUNDATION1 | Define isolated staging environment, secrets, backups, tags, service ownership. | Server information and owner approval. | Staging runbook and health gates. | v1.0.0 / PLANNED |
| STAGING-DEPLOY1 | Deploy one approved immutable release candidate to staging. | Staging foundation. | Backup, migration, build, restart, health, rollback readiness. | v1.0.0 / BLOCKED |
| STAGING-ACCEPT1 | Run operational and Browser acceptance in staging. | Staging deployment. | Arabic/English desktop/mobile, roles, deposits, POS, reports and printing evidence. | v1.0.0 / BLOCKED |
| RELEASE-RC1 | Freeze an immutable release candidate and release notes. | Staging acceptance. | Tag `v1.0.0-rc.1`, SBOM/advisory decision, go/no-go owner approval. | v1.0.0 / BLOCKED |
| SECURITY-REVIEW1 | Review auth, CORS, uploads, dependencies, logs, secrets and attack paths. | RC scope. | Findings disposition and remediation validation. | v1.0.0 / BLOCKED |
| BACKUP-RESTORE-DRILL1 | Prove backup restore on a disposable target. | Staging; no shared DB restore. | Archive provenance, restore, integrity checks, RTO/RPO record. | v1.0.0 / BLOCKED |
| PRODUCTION-PRECHECK1 | Verify server commit/tag, clean tree, secret configuration, backup and rollback readiness. | RC and owner approval. | Explicit go/no-go record. | v1.0.0 / BLOCKED |
| PRODUCTION-DEPLOY1 | Deploy only an approved immutable tag. | Precheck and separate authorization. | Server backup, migrations, restart, smoke and rollback gate. | v1.0.0 / BLOCKED |
| POST-DEPLOY-VERIFY1 | Verify real production behavior without unsafe test data. | Deployment. | Health, logs, access, reporting, backup and monitoring record. | v1.0.0 / BLOCKED |
| V1.0.0-CLOSURE1 | Close release evidence and record known residuals. | All prior gates. | Signed owner go-live decision. | v1.0.0 / BLOCKED |

## Change intake

Every future owner request enters the roadmap as a candidate with: business
intent, affected domain, financial/inventory/security/branch impact, migration
need, acceptance evidence, rollback need, target release, and dependency.
Requests are not implemented directly from chat. A named phase is added only
after this triage and must state allowed files, commit strategy, local and
server validation, and owner approval gates. Post-v1 work includes reporting
depth, UX polish, barcode/printing enhancements, and non-blocking lint cleanup.

## LOCAL-DB-VERIFIER-REDESIGN1-RESUME

Verifier-only commit `e3215f9` closes legacy executable 5433 assumptions in the Employee/Super-Admin verifier group. Product scope is unchanged. The phase is partial: exact permission divergence blocks three V3 contracts, V4/V5 remain intentionally blocked, and one untracked local temporary archive blocks clean scope verification. Next: `LOCAL-DB-VERIFIER-REDESIGN2`.

## LOCAL-DB-VERIFIER-REDESIGN2-RESUME

Owner cleanup removed the temporary artifact, and `4fbb977`/`947ce71` close the remaining bootstrap target default. Static 66/66 now passes. The only remaining live-verifier blocker is the unchanged canonical permission baseline; next phase is `PERMISSION-BASELINE-RECONCILE1`.

## PERMISSION-BASELINE-RECONCILE1 — COMPLETE

Canonical v1.0.0 permission baseline is now 128 exact active slugs. The nine branch/customer/supplier lifecycle permissions are retained as active compatibility-required permissions because current routes enforce them; they are admin/owner-only default grants. The three sales adjustment permissions are present in the source and adopted DB and are granted only to built-in admin, owner, and manager roles. Custom roles remain unchanged and require deliberate manual assignment; direct denial remains authoritative; Super Admin and Branch Account/Employee separation are unchanged. Next: `BRANCH-1-VERIFIER-VALIDATE1` for formal branch verification evidence. Deployment remains separately blocked.
