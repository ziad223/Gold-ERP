# Gift Voucher Print / Reprint Proof

The first print attempt exposed a PostgreSQL defect: `FOR UPDATE` was applied to an aggregate `COUNT`, which is invalid. The Voucher row was already locked, so the minimum safe correction removed the aggregate lock and retained serialization on the Voucher identity.

After correction, a targeted clone-only retry produced exactly:

`printKinds=["original","reprint"]`

The voucher code and voucher number remained unchanged. Print events are append-only and immutable; the event table does not change voucher lifecycle, value, payment, or accounting. No browser Print/Reprint button was pressed during UI acceptance; the API proof used the authorized clone harness.
