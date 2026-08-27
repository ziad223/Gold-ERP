# DARFUS C1 — Barcode / Item Revision Capability Audit

## Authority and dependency direction

```text
Asset identity
  -> barcode-identity.service.js
  -> asset_barcode_history / barcodeRevision
  -> profile-specific tag projection
  -> print, search, return, replacement consumers
```

The physical item remains one `Asset`. The current active Barcode is the Asset’s serialized identity projection. Barcode history is one canonical history authority. Only the dedicated replacement service may mutate Barcode identity. Consumers read the identity; they do not generate a second one.

## Minimum client revision contract

| Revision fact | Current evidence | Classification | C1 conclusion |
|---|---|---|---|
| Same physical Asset ID | Replacement updates the same Asset; history foreign-key references Asset. | EXACTLY_AVAILABLE | Preserved. |
| Same logical item identity | Asset identity remains the same through status/reprint/return; replacement retains Asset ID. | EXACTLY_AVAILABLE | Preserved. |
| Ordered revision/version number | `assets.barcode_revision`, `asset_barcode_history.barcode_revision`, unique `(asset_id, barcode_revision)`. | AVAILABLE_DIFFERENTLY | Available for Barcode replacement order. |
| What changed | Replacement reason is stored; arbitrary item-field change set is not captured as a revision payload. | PARTIAL | Missing for general Item Revision. |
| Old value | Old Barcode is retained in retired history; arbitrary old field values are not a revision record. | AVAILABLE_DIFFERENTLY / PARTIAL | Barcode replacement only. |
| New value | New Barcode is stored in Asset/history; arbitrary new field values are not a revision record. | AVAILABLE_DIFFERENTLY / PARTIAL | Barcode replacement only. |
| Actor | `issued_by`, `retired_by`, Asset events/audit actor fields. | EXACTLY_AVAILABLE | Present for governed lifecycle operations. |
| Timestamp | Issued/retired timestamps and Asset event occurrence. | EXACTLY_AVAILABLE | Present. |
| Reason | Replacement requires a non-empty reason; retirement reason is persisted. | EXACTLY_AVAILABLE | Present for replacement. |
| Source operation/reference | `source_type/source_id`, Asset event and audit references. | EXACTLY_AVAILABLE | Present for governed lifecycle operations. |
| Barcode effect | Replacement retires old and issues next; reprint does not issue. | EXACTLY_AVAILABLE | Present. |
| RFID effect | RFID has its own assignment/replacement history and is not implicitly coupled to Barcode replacement. | AVAILABLE_DIFFERENTLY | Safe separate identity authority. |
| Audit/event link | `asset_events`, audit service, idempotency on replacement/reprint. | EXACTLY_AVAILABLE | Present. |
| Explicit v1/v2 client workflow/API | No dedicated Item Revision endpoint, screen, or arbitrary changed-field revision record was found. | MISSING | Not implemented as a separate contract. |

## Decision

`CURRENT_HISTORY_SATISFIES_CLIENT_REVISION = NO` for the complete client v1/v2 contract. It does satisfy the narrower Barcode replacement history contract.

`REVISION_MINIMUM_GAP = one canonical, Asset-linked revision/evidence representation for arbitrary approved item changes, containing version/order, changed field or reason, old value, new value, actor, timestamp, source operation/reference, and explicit Barcode/RFID effect.`

`SAFE_EXTENSION_POINT = existing Asset metadata/lifecycle audit boundary plus asset_events and asset_barcode_history; extend the canonical service/history contract only after a separate approved design.`

`NEW_PARALLEL_IDENTITY_REQUIRED = NO`

No new Asset, Barcode authority, or independent public history CRUD is justified by C1. D04 remains `CURRENT_HISTORY_FIRST`; C1 does not implement or migrate a revision layer.

## Operation evidence matrix

| Operation | Same Asset | Same Barcode | New Barcode | Old retired | History preserved | RFID behavior | Evidence level |
|---|---:|---:|---:|---:|---:|---|---|
| Initial creation | Yes | Initial value | No prior value | No | Initial history row | Optional separate assignment | PROVEN_SOURCE + PROVEN_DB |
| Reprint | Yes | Yes | No | No | No replacement row | Unchanged | PROVEN_SOURCE; mutation deferred |
| Return | Yes | Yes | No | No | Event/movement retained | No implicit RFID change | PROVEN_SOURCE + PRIOR_ACCEPTED_RUNTIME |
| Exchange | Asset return/sale resolution preserves Asset path | Existing Asset identity is retained on the Asset branch | No automatic Barcode replacement | No | Event/invoice links retained | Separate RFID authority | PROVEN_SOURCE; full mutation deferred |
| Repair / workshop | Yes | Yes unless separately replaced | No automatic new Barcode | No | Events/movements retained | Separate RFID authority | PROVEN_SOURCE |
| Barcode replacement | Yes | No | Yes | Yes | Old and new history rows retained | Not implicitly changed | PROVEN_SOURCE; mutation deferred |
| Revision/update | Yes for allowed metadata | Yes for metadata | No | No | Metadata audit exists | Not coupled | PARTIAL: no complete client v1/v2 contract |

## C2-only follow-up

If Owner authorizes a later C2, the smallest proof should first verify the existing metadata and lifecycle event payloads against the exact missing fields. It must not introduce a second identity owner, and any mutation proof must use a disposable clone. No C2 was started in this control.
