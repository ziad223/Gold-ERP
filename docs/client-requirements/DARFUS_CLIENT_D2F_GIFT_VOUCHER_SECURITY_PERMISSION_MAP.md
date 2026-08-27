# D2F Gate A Re-Entry — Gift Voucher Security and Permission Map

## Frozen security authority

Gift Voucher inherits centralized DARFUS authentication, authorization, permission, session and audit behavior. The current routes use `authMiddleware`; write routes fail closed with `GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED` before mutation.

| Operation | Client rule | Current route/source | Current result |
|---|---|---|---|
| View/list | Authorized users only | `GET /gift-vouchers`, `authMiddleware`, `companyId` filter | Read path exists |
| View by code | Authorized and company-scoped | `GET /gift-vouchers/:code`, `authMiddleware`, company filter | Read path exists; code uniqueness not enforced |
| Issue | Authorized employee; issuance event/audit required | `POST /gift-vouchers/issue` | Fail-closed stable forbidden |
| Activate | Authorized user and activation policy | No route/model state proven | Missing |
| Distribute | Policy-controlled and auditable | No route/model proven | Missing |
| Redeem | Payment/ownership/status/permission validation | `POST /gift-vouchers/redeem` | Fail-closed stable forbidden |
| Cancel/expire | Final-state protection and policy | No route/model proven | Missing |
| Print | Print permission, valid status/template/policy | No active voucher print route | Missing |
| Reprint | Same identity plus reprint audit | No active voucher reprint route | Not proven |
| Lost voucher | Identity/ownership/status verification and approval policy | No route/model proven | Not implemented |

## Security conclusions

- No shared account or frontend authority is introduced.
- No new permission name is invented in this control.
- Current write behavior is fail-closed and therefore safer than exposing an incomplete financial flow.
- `GLOBAL_ROUTE_PERMISSION_COVERAGE_TEST = NOT_RUN_IMPLEMENTATION_NOT_STARTED`; no claim of PASS is made.

## Required future proof

When routes exist, use the canonical permission catalog/reconciler and prove:

- company and branch scope;
- authenticated user and employee attribution;
- fail-closed behavior for missing permissions;
- no route bypass through projection, print, reprint or payment paths;
- audit event identity and actor attribution.
