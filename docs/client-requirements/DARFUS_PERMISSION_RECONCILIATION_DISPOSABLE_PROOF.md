# DARFUS Permission Reconciliation Disposable Proof

## Result

`DISPOSABLE_RECONCILE = PASS`

`IDEMPOTENT_SECOND_RUN = PASS`

## Targets used

| Target | Purpose | Before | After | Notes |
|---|---|---:|---:|---|
| `darfus_c2b_revision_fresh_01` | schema-only rehearsal | 150 permission rows | 152 | Exact two rows added; second execute wrote 0. It has no RBAC rows, so it is supplementary transaction proof. |
| `darfus_b1_employee_runtime_20260825_01` | full RBAC rehearsal | 150 permissions, 5 roles, 469 role bindings, 1 user role | 152 permissions, same RBAC counts | Used for role/effective-permission proof. |

## Exact rehearsal evidence

On the full-RBAC disposable target, the reconciler first verified:

- actual `current_database()` = `darfus_b1_employee_runtime_20260825_01`;
- source count = 152;
- DB count = 150;
- missing = exactly `inventory.revision.create`, `inventory.revision.view`;
- extra = 0;
- metadata mismatch = 0;
- role-binding gaps against existing role definitions = 0.

The first explicit execute wrote exactly 2 permission rows. It wrote no role bindings. The second explicit execute reported DB count 152, missing 0, extra 0, metadata mismatch 0, and `writes=0`.

## Row and binding proof

- each Revision permission exists exactly once;
- no Revision permission is present in `role_permissions`;
- role count remained 5;
- role binding count remained 469;
- user role count remained 1;
- system account role count remained 26;
- employee role assignments, grants, and denials remained 0;
- no permission was deleted.

The full-RBAC clone has the existing local Admin technical account with `role=admin` and `account_type=super_admin`. After the two rows were added, the existing `permission.service.getUserPermissionNames()` resolver returned both Revision permissions as effective.

## Negative RBAC proof

The focused test suite proves:

- `branch_shell` has no Revision permission;
- a view-only regular role resolves `inventory.revision.view=true` and `inventory.revision.create=false`;
- the intended Super Admin resolves both names as effective;
- duplicate catalog names and strict duplicate module/action inputs fail closed;
- unexpected missing source permissions are blocked;
- protected official execute without approval is refused;
- target/database mismatch is refused;
- historical extras are reported and never deleted.

## Rehearsal safety

No official database operation was performed during the disposable rehearsal. No business rows, assets, movements, journals, payments, or idempotency rows were created or changed by the reconciler.
