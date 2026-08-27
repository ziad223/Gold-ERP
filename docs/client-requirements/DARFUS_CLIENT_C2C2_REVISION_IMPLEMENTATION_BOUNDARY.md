# DARFUS Client C2C2 — Revision Implementation Boundary

Control: `DARFUS-CLIENT-C2C2-REVISION-SERVICE-API-DISPOSABLE-RUNTIME-01`  
Mode: `MINIMUM_BUSINESS_IMPLEMENTATION_PLUS_DISPOSABLE_RUNTIME`

## Frozen authority

- Official persistent database: `darfus_erp`; no write is authorized in this control.
- Disposable runtime database: `darfus_c2c2_revision_runtime_02`.
- One canonical Asset identity is preserved. Revision history does not create an Asset, Barcode, RFID tag, movement, transfer, workshop record, POS sale, CGP record, or accounting entry.
- C2B storage remains the authority: `asset_revisions` and `asset_revision_changes`.
- Generic revision fields are exactly: `name`, `description`, `category`, `brand`, `notes`.
- Barcode, RFID, item type, karat, weight, price/cost, valuation, status, branch, location, tax, journal, and movement fields are outside this service and fail with `REVISION_DEDICATED_OPERATION_REQUIRED`.
- `REVISION_ADMIN_OVERRIDE = NONE`: the route resolves the named catalog permission; it does not add a revision-specific administrative bypass.

## Declared change boundary

| Boundary | C2C2 decision |
|---|---|
| Target requirements | C2C1 frozen revision API/service contract and C2B tables |
| Exact gap | C2B storage existed without a canonical command/read API |
| Root cause | No service, route, minimal storage models, permission catalog entries, or runtime proof existed |
| Source files expected to change | Revision models/service/routes, permission catalog wiring, AssetEvent context propagation, focused C2C2 tests |
| Files forbidden to change | Frontend/UI, existing C2B migration, Barcode/RFID services, inventory movements/status/transfers/workshop/POS/CGP/accounting logic |
| DB schema change | None; C2B migration was already present and was not edited or re-run |
| Business logic change | Asset metadata only for the five general fields, inside one atomic revision command |
| Accounting/inventory impact | No journal, payable, movement, barcode, RFID, or status mutation |
| Security impact | Additive `inventory.revision.create` and `inventory.revision.view` catalog entries; existing User/Auth/RBAC remains authoritative |
| Idempotency impact | Reuses `idempotency.service.js`, scope `inventory-v2.asset-revision` |

## Explicitly not implemented

No UI, no Revision tab/form, no Barcode replacement, no RFID operation, no new status, no migration, no seed against the official database, no schema redesign, and no C2C3 work.

