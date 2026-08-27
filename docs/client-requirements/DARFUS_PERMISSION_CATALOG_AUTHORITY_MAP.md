# DARFUS Permission Catalog Authority Map

## Control

- Control: `DARFUS-PERMISSION-CATALOG-RECONCILIATION-PREVENTION-01`
- Project: `I:\\WORK\\jewellery-erp-master`
- Official database: `darfus_erp`
- Scope: Revision permission catalog drift only; no business Revision mutation.

## Authority map

| Authority concern | Current authority | Evidence | Boundary |
|---|---|---|---|
| Permission names | `backend/src/bootstrap/permission-catalog-source.js` | `PERMISSION_CATALOG`, validated at module load | Aggregates existing versioned catalogs; not a new Revision-only registry. |
| Baseline names | `permission-baseline-v1.js` | `PERMISSIONS` and existing `ROLE_DEFS` | Historical v1 names and built-in role definitions remain unchanged. |
| Revision names | `permission-catalog-v2.js` | `INVENTORY_REVISION_PERMISSIONS` | Exactly `inventory.revision.create` and `inventory.revision.view`. |
| CGP capability names | `cgp-permission-catalog-v3.js` | `CGP_FUTURE_CAPABILITIES` | Existing future capabilities; no new grants in this control. |
| Gold approval name | `gold-price-approval-permission-catalog.js` | `GOLD_PRICE_APPROVAL_PERMISSION` | Existing Gold Center permission. |
| Gold pricing-policy name | `gold-pricing-policy-permission-catalog.js` | `GOLD_PRICING_POLICY_PERMISSION` | Single descriptor shared with its consumer. |
| Persistent permission rows | `permissions` table | Read-only SQL and reconciler query | Existing id/name/module/action/description conventions are preserved. |
| Role bindings | `roles` + `role_permissions` | Existing role binding rows and `ROLE_DEFS` | No role binding was added for Revision. |
| User-to-role binding | `user_roles` | Existing RBAC model | Not changed. |
| Technical Admin/Super Admin resolution | `permission.service.js` | `getUserPermissionNames()` reads all DB names for `super_admin` | No new bypass was introduced. |
| Employee grants/denials | `employee_permission_grants` / `employee_permission_denials` | Existing models/tables | Not changed. |
| Startup authority | `backend/src/server.js` / `backend/src/app.js` | No reconciler reference | Normal startup does not reconcile or mutate permissions. |
| Explicit reconciliation authority | `permission-catalog-reconciler.js` + CLI | Tests, clone rehearsal, official dry-run | Dry-run is default; `--execute` is required for writes. |

## Canonical source composition

The old `accessControl.PERMISSIONS` export contained 145 names. Audit of current source found seven additional already-supported names in later source catalogs/consumers: five CGP future capabilities, `gold.approve_price`, and `gold.manage_pricing_policy`. The canonical union is therefore 152 names.

Before promotion, `darfus_erp` had 150 rows and was missing only:

- `inventory.revision.create`;
- `inventory.revision.view`.

Sixteen historical metadata differences were traced to later migrations that intentionally changed descriptors for Workshop, Inventory Count, Employee authorization, self-approval, returned-restock, and Gold pricing policy. The source aggregator records those migration-defined descriptors so the promotion diff is not falsely widened. Existing rows were not updated.

## Runtime dependency map

```text
canonical source catalog
        ↓ read-only diff
permissions rows
        ↓ existing resolver
roles / role_permissions / user_roles
        ↓
permission.service.getUserPermissionNames()
        ↓
asset-revision route guard
        ↓
GET /api/v1/inventory-v2/assets/:assetId/revisions
```

The route guard remains fail-closed. It does not trust a UI flag and does not add an Admin/Super Admin bypass. The intended local Admin is an existing `super_admin`; its effective Revision names become available only after the two durable permission rows exist.

## Frozen safety conclusions

- `WHO_OWNS_PERMISSION_NAMES = canonical source catalog`
- `WHO_OWNS_RUNTIME_PERMISSION_ROWS = permissions table`
- `WHO_OWNS_ROLE_BINDINGS = existing RBAC authority`
- `NORMAL_STARTUP_MAY_MUTATE_PERMISSIONS = NO`
- `DUPLICATE_PERMISSION_AUTHORITY = NO`
- `AUTO_RECONCILE_ON_STARTUP = NO`
- `ONE_CANONICAL_REVISION_PERMISSION_REGISTRY = YES`
- `OFFICIAL_REVISION_BUSINESS_MUTATION = NO`
