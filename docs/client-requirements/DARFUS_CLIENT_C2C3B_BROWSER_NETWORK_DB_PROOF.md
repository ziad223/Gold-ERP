# DARFUS Client C2C3B — Browser Network and DB Proof

بالعربي المختصر: تم إثبات targets المعزولة وفحوص GET للخدمات، لكن لم يصل التنفيذ إلى Browser Network/Revision POST؛ لذلك لا توجد business deltas جديدة.

## Runtime target proof

| Request/check | Status/result | Evidence |
|---|---:|---|
| `GET http://localhost:8001/api/v1/health` | 200 | clone backend health |
| `GET http://localhost:8001/api/v1/health/db` | 200 | PostgreSQL connected |
| `GET http://localhost:8001/api/v1/health/redis` | 200 | Redis connected |
| `GET http://localhost:3002/en/inventory/1` | 200 | production frontend |
| `GET http://localhost:3002/ar/inventory/1` | 200 | production frontend |
| `SELECT current_database()` on clone | `darfus_c2c2_revision_runtime_02` | Docker PostgreSQL read-only query |

Gold health remains `503` on the clone. Per C2C3B authority it is `GOLD_HEALTH = UNRELATED`; Gold scope was not opened.

## Browser network proof

```text
BROWSER_NETWORK_PROOF = BLOCKED_BROWSER_CONTROL_UNRECOVERED
POST_REVISION_REQUESTS = 0
GET_REVISION_LIST_FROM_BROWSER = NOT_RUN
GET_REVISION_DETAIL_FROM_BROWSER = NOT_RUN
```

The failure occurred before tab discovery:

```text
failed to write kernel assets: The system cannot find the path specified. (os error 3)
```

No HTTP-only request was used as a substitute for the required browser proof.

## Disposable DB snapshot

Read-only snapshots after the failed browser preflight:

| Database | Assets | Revisions | Revision changes | Asset events | Movements | Journal entries |
|---|---:|---:|---:|---:|---:|---:|
| `darfus_c2c2_revision_runtime_02` | 18 | 6 | 7 | 71 | 62* | 25* |
| `darfus_erp` | 18 | 0 | 0 | 65 | 62 | 25 |

`*` Movement/journal values in the clone were not changed by this control; they are retained clone baseline values, not C2C3B deltas.

```text
CLONE_BROWSER_BUSINESS_WRITES = 0
CLONE_REVISION_DELTA = 0
CLONE_EVENT_DELTA = 0
OFFICIAL_DB_WRITES = 0
OFFICIAL_DB_DAMAGE = 0
```

## Dedicated-domain proof

No browser mutation occurred, so the expected C2C3B dedicated-domain deltas are all zero by execution fact, not by a browser acceptance result:

```text
ASSET_ID_UNCHANGED = YES
BARCODE_DELTA = 0
RFID_DELTA = 0
STATUS_DELTA = 0
BRANCH_DELTA = 0
MOVEMENT_DELTA = 0
JOURNAL_DELTA = 0
COST_DELTA = 0
VALUATION_DELTA = 0
```

This is not a substitute for the required before/after browser proof after recovery.
