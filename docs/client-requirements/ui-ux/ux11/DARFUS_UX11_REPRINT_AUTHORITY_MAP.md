# UX-11 Reprint Authority Map

| Area | Current state | Frozen decision |
|---|---|---|
| Invoice search/reprint | Parent flow can call server authorization before printing | Do not bypass or redesign |
| Gift Voucher print/reprint | Existing page contains original/reprint audit semantics | Preserve; financial mapping prevention remains open |
| CGP repeated print | `CGP-PRINT-RECOVERY-UI-001` remains open from prior authority context | No CGP reprint business change in UX-11 |
| Barcode/Asset tag reprint | Uses existing Asset/barcode value and permission guard | Preserve identity and permission authority |
| Receipt print | Browser print helper consumes already-rendered document | Presentation only |

