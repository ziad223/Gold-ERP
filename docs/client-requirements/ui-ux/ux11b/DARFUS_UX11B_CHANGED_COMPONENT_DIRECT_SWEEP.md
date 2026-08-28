# UX-11B Changed Component Direct Sweep

| Component | Direct runtime result | Evidence / limitation |
|---|---|---|
| `InvoicePrintOptionsDialog` | PASS for direct open and controls | Opened from canonical invoice detail; final Print not clicked; no overflow; select received visible focus. |
| `ReceiptPreview` | BLOCKED | Source declaration inspected, but no current consumer/mount route was found; no safe direct production mount exists. |
| `BarcodeLabelPreview` | BLOCKED | Source declaration inspected, but no current consumer/mount route was found; no safe direct production mount exists. |
| `ClientAssetTagPreview` | PASS | Direct asset detail route mounted the preview at 840x1180 in AR and EN. |

No missing route or test fixture was added to manufacture direct component proof.
