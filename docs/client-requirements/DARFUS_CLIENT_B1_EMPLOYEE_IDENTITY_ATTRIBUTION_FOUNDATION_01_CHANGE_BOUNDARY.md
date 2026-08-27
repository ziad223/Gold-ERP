# B1 Change Boundary — Pre-Edit Record

Control: `DARFUS-CLIENT-B1-EMPLOYEE-IDENTITY-ATTRIBUTION-FOUNDATION-01`  
Status: `PRE_EDIT_BOUNDARY_RECORDED`

## Boundary

```text
TARGET_REQUIREMENT_IDS = EMP-001, EMP-002, EMP-003, EMP-004, EMP-005, EMP-006,
                         EMP-007, EMP-031, EMP-032, EMP-034, EMP-035, EMP-037

EXACT_GAPS_TO_CLOSE =
1. Existing command-actor context is reusable but has no explicit stable
   downstream attribution contract containing company, source operation/reference
   and occurred-at semantics.
2. Employee create/update/deactivate/reactivate lifecycle audit writes do not
   consistently attach the existing dual technical-user/employee actor context.
3. Focused semantic tests for the stable attribution contract and lifecycle audit
   authority are absent.

FILES_EXPECTED_TO_CHANGE =
1. backend/src/services/command-actor-context.service.js
2. backend/src/routes/erp.routes.js
3. backend/tests/employee-identity-attribution-foundation.test.cjs
4. docs/client-requirements/DARFUS_CLIENT_B1_EMPLOYEE_IDENTITY_ATTRIBUTION_FOUNDATION_01_REPORT.md

FILES_FORBIDDEN_TO_CHANGE =
all migrations, backend models/schema, frontend Employee screens,
permissions/RBAC catalog, auth middleware, barcode/source files, inventory,
invoice, CGP, CRM, payroll, attendance, documents, production configuration,
official database data, and unrelated tests.

DB_SCHEMA_CHANGE_EXPECTED = NO
BUSINESS_LOGIC_CHANGE_EXPECTED = NO; attribution/audit contract only
ACCOUNTING_IMPACT = NONE
INVENTORY_IMPACT = NONE
SECURITY_IMPACT = PRESERVE_EXISTING_RBAC_ONLY
IDEMPOTENCY_IMPACT = NONE; do not add time-varying attribution to request hashes
FUTURE_INTEGRATION_POINTS = POS, CGP, Invoice Search, Inventory, Transfers,
                             Accounting, Attendance, Payroll, KPI, Reports, Audit
CIRCULAR_DEPENDENCY = NO
DUPLICATE_AUTHORITY = NO
```

## Stop Condition

If implementation requires a migration, a new permission model, a shared-account change, a second Employee identity, a business-table schema change, or a route change outside the allow-list, stop with `BLOCKED_B1_SCOPE_EXPANSION`.
