# Gift Voucher Mapping Scope Proof

## Actual uniqueness authority

`system_account_roles_company_branch_role_uq` is a partial unique index on `(company_id, branch_id, role_code)` where `branch_id IS NOT NULL`. The model has no active flag; rows are active role authority by existence. Foreign keys protect company, branch, and account identity.

`SEMANTIC_ROLE_UNIQUENESS_SCOPE = COMPANY + BRANCH + ROLE_CODE`.

## Required active scopes

| Branch | ID | Expected role rows | Actual after promotion |
|---|---|---:|---:|
| Branch-2 | `BR-3241ced9-01ad-4bbf-9de8-7cd26e26767c` | 1 | 1 |
| Branch-1 | `BRA-1787464306683` | 1 | 1 |

No duplicate active role rows exist. The pre-fix official count was zero for each branch; the promotion added exactly one per branch.

