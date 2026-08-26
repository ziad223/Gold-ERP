# DARFUS Client C2C2 — System Impact Proof

## Source impact

| File | Role | C2C2 impact |
|---|---|---|
| `backend/src/services/asset-revision.service.js` | canonical command/read service | added |
| `backend/src/routes/asset-revision.routes.js` | three API endpoints and permission guard | added |
| `backend/src/models/assetRevision.model.js` | exact C2B header mapping | added |
| `backend/src/models/assetRevisionChange.model.js` | exact C2B change mapping | added |
| `backend/src/models/index.js` | Asset/revision associations and exports | intentional additive wiring; file had pre-existing worktree changes |
| `backend/src/routes/index.js` | route mount | intentional additive wiring; file had pre-existing worktree changes |
| `backend/src/bootstrap/accessControl.js` | catalog composition | intentional additive wiring; file had pre-existing worktree changes |
| `backend/src/bootstrap/permission-catalog-v2.js` | two permission names | intentional additive wiring; file was already untracked worktree content |
| `backend/src/services/inventory-v2-runtime.service.js` | event actor context propagation | additive `employeeCode` propagation; file was already untracked worktree content |
| `backend/tests/c2c2-revision-service-api.test.cjs` | focused static/pure-contract tests | added |

No frontend file was changed for C2C2. No migration file was edited or created.

## Authority preservation

- Asset remains the physical identity authority.
- No barcode or RFID write is reachable from the Revision service.
- No operational status, branch, location, movement, transfer, workshop, POS, CGP, or accounting write is reachable from the Revision service.
- Company and active branch are resolved server-side from authenticated context and validated against the Asset.
- Technical User and optional Employee/operator context are stored as immutable snapshots in the revision and audit evidence.
- Existing central idempotency hashing/claim/succeed/resolve behavior is reused; no second hash implementation was added.
- Existing C2B immutability triggers remain unchanged.
- Existing startup migration guard remains unchanged; the temporary backend used `npm start` and did not run migrations.

## Error and transaction boundaries

Validation and permission failures happen before business writes. Successful creation uses one transaction covering Asset metadata update, revision header, all change rows, one AssetEvent, one audit row, and idempotency success. Any exception rolls back the whole transaction.

## Known limitation carried by the frozen contract

The current generic v1 fields are text metadata fields. Non-string/non-null change values are rejected rather than coerced. Structured canonical comparison helpers preserve object key sorting, array order, and primitive types for the shared comparison contract, while the current Asset metadata boundary remains text-only.

