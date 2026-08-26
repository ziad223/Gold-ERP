# DARFUS Client C2C1 — Idempotency and Concurrency Contract

## Canonical idempotency authority

The future service must use the existing `backend/src/services/idempotency.service.js`; no second hashing implementation is permitted.

Frozen scope:

```text
inventory-v2.asset-revision
```

`Idempotency-Key` is required. The current canonicalizer `stableStringify` recursively sorts object keys, preserves array order, represents null/undefined canonically, and `hashRequest(scope, body, params)` hashes `{scope, params, body}` after removing `idempotencyKey` and `idempotency-key` from the body. For this route, `params` contains the server route `{assetId}` and the body is the validated request without the idempotency key. Company is enforced by the `IdempotencyRequest` unique scope `(company_id, scope, key)` and by Asset scope checks; it is not silently appended by a new hash function.

`IDEMPOTENCY_HASH_INPUT_PROVEN = YES` from the current service implementation (`stableStringify`, `hashRequest`, `claim`, `resolveExisting`, and `succeed`).

## Replay behavior

| Situation | Required result |
|---|---|
| same company/scope/key and same canonical request after success | replay the stored response; no new revision/event/audit row |
| same key with changed canonical body/asset route | 409 `REVISION_IDEMPOTENCY_CONFLICT` |
| same key while first request is processing | 409 according to existing processing contract; no second command |
| prior failed request | preserve the existing service’s failed-state contract; do not claim a new business revision implicitly |
| missing key | validation failure before mutation |
| rejected field/no-op request | no successful business idempotency result is created; the rejection must not poison a future valid request under a different key |

The stored response is the replay authority. A client must retain the exact original request object and key; it must not reconstruct from a later-cleared form.

## Revision-number allocation

Inside one database transaction:

1. Validate company, branch, permission, allowlist, and stale-write precondition.
2. Lock the target Asset row for update.
3. Read the highest existing `revision_no` for that Asset under the lock.
4. Allocate `max + 1` (or `1` when none exists).
5. Rely on the C2B unique `(asset_id, revision_no)` constraint as a backstop.

`MAX+1` without an Asset lock is forbidden. A unique-constraint race is translated to `REVISION_CONCURRENT_CONFLICT` and has no partial event/audit result.

## Concurrency matrix

| Concurrent operation | Contract |
|---|---|
| same key, same Asset | central idempotency claim permits one durable result; loser replays/conflicts |
| different keys, same Asset | Asset row lock serializes revision number and stale-value checks |
| revision vs barcode replacement/RFID | dedicated operation remains authority; generic request rejects the field and cannot overwrite identity |
| revision vs transfer/workshop/status/location | generic request rejects operational fields; separate operations keep their own state transition/movement rules |
| revision vs purchase cost/valuation/accounting | generic request rejects financial fields; no cost or journal side effect |
| different Assets | may proceed independently subject to normal company/branch and database constraints |
| same Asset across company/branch contexts | fail closed; no cross-scope lock can authorize access |

`CROSS_AUTHORITY_COMPOSITE_REVISION = NO`. One command cannot combine a metadata revision with a barcode, financial, movement, workshop, or accounting operation.

## Transaction boundary

The idempotency claim, Asset lock, revision header, change rows, `ASSET_REVISION_RECORDED` event, audit-chain row, and successful idempotency response are one transaction. Any error rolls back all of them. The contract does not require nested transactions.

## Exact replay tests for C2C2

Focused tests must call the real canonicalizer and prove:

- retained original request and retained replay request have identical canonical hash;
- same key/same request does not duplicate revision, event, audit, or response;
- same key/changed field value produces a different hash and the real 409 conflict path;
- concurrent requests produce one revision number and one durable event/audit pair;
- form clearing or UI re-rendering cannot change the retained replay payload.

