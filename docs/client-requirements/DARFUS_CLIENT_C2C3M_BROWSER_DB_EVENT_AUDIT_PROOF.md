# DARFUS Client C2C3M — Browser / DB / Event / Audit Proof

## Disposable target

`darfus_c2c2_revision_runtime_02` was verified with `SELECT current_database()`. The candidate asset was `AST-PUR-1787083585731-1-1-plz5`, barcode `GWRNG21000001`, company `COMP-48ab554f-427e-4642-9419-bc8616c2dc36`, branch `BRA-1787464306683`, status `AVAILABLE`, and profile `GOLD_BY_WEIGHT_JEWELLERY`.

## Before / after counts

| Entity | Before C2C3M | After B5 | Delta attributable to C2C3M |
|---|---:|---:|---:|
| assets | 18 | 18 | 0 |
| asset_revisions | 6 | 11 | +5 accepted revisions; one AR revision was unplanned |
| asset_revision_changes | 7 | 13 | +6 changes |
| asset_events | 71 | 76 | +5 revision events |
| inventory_asset_movements | 62 | 62 | 0 |
| journal_entries | 25 | 25 | 0 |
| revision audit rows | 6 | 11 | +5 accepted audits |
| revision idempotency rows | 6 | 11 | +5 accepted requests |

The C2C3M run produced five 201 revision results plus one stale 409 attempt. B3 and the stale B5 attempt added no durable rows. B4 produced one row despite two concurrent UI click calls. The fifth 201 was an unplanned AR notes revision v11 during the read-only review closeout; it is preserved and explicitly counted, not hidden or removed.

## Accepted revision evidence

| Result | Revision | Changes | Event | Audit | Idempotency |
|---|---|---:|---|---|---|
| B1 notes | v7 `ASREV-1851…` | 1 | `ASEV2-f64e…` | `AUD-1787725735457-rza3` | succeeded 201, key/hash redacted |
| B2 name/description | v8 `ASREV-03ec…` | 2 | `ASEV2-6310…` | `AUD-1787725760615-gpvd` | succeeded 201, key/hash redacted |
| B4 brand | v9 `ASREV-33d20…` | 1 | `ASEV2-b115…` | `AUD-1787725819647-bb6t` | succeeded 201, key/hash redacted |
| B5 fresh category | v10 `ASREV-1218…` | 1 | `ASEV2-d1ce…` | `AUD-1787725875548-fvxo` | succeeded 201, key/hash redacted |
| Unplanned AR notes | v11 `ASREV-3b8d…` | 1 | `ASEV2-934d…` | `AUD-1787726552532-5stb` | succeeded 201, key/hash redacted |

For each accepted row, company, branch, technical user, source operation, old/new values, and revision number are present. `ASSET_REVISION_RECORDED` events preserve `operationalStatus=AVAILABLE` and the same asset identity.

## Asset and dedicated-domain integrity

After B5 the asset remained:

```text
id = AST-PUR-1787083585731-1-1-plz5
barcode = GWRNG21000001
status = available / operational_status = AVAILABLE
branch_id = BRA-1787464306683
location_id = LOC-2ca3af2d-e01a-454c-a625-4951d0925927
gross_weight = 5.00000000
net_weight = 5.00000000
karat = 21
cost = 2244.15431955
price = 0.00000000
```

No corresponding asset, barcode, RFID, status, branch, location, movement, journal, purchase-cost, valuation, invoice-link, or payable request was made by the C2C3M browser flow. The listed asset/movement/journal counts stayed unchanged, and the source allowlist exposes only general metadata to Revision.

## Official database

`darfus_erp` was queried read-only. Identity remained exact. Observed counts were assets 18, revisions 0, revision changes 0, asset events 65, movements 62, and journal entries 25. `OFFICIAL_DB_WRITES = 0`.

```text
DB_REVISION_PROOF = PASS_FOR_DISPOSABLE_CLONE
EVENT_AUDIT_PROOF = PASS_FOR_ACCEPTED_B1_B2_B4_B5_FRESH
NO_OP_DB_DELTA = PASS
STALE_DB_DELTA = PASS
DEDICATED_DOMAIN_DELTA = 0
OFFICIAL_DB_BUSINESS_DELTA = 0
UNEXPECTED_AR_REVISION_DELTA = +1 revision / +1 change / +1 event / +1 audit / +1 idempotency
```

No cleanup or rollback was performed; the disposable evidence is preserved.
