# DARFUS UI/UX Rollback Register

| Control | State | Scope | Evidence |
|---|---|---|---|
| CLASSIC_BASELINE | AVAILABLE | 48-file snapshot + SHA-256 | `PRE_UX2_CLASSIC_DESIGN_20260828_020614` |
| UX2_ROLLBACK | READY_AFTER_REHEARSAL | `app/globals.css` only | UX2 rollback proof |
| UX3_ROLLBACK | READY_AFTER_REHEARSAL | Shell/navigation files listed in UX3 restore map | `ux3/DARFUS_UX3_ROLLBACK_PROOF.md` + `UX3_SHELL_NAVIGATION_20260828_023226/rollback-rehearsal-v3/rollback-proof.json` |
| UX4_ROLLBACK | READY_AFTER_REHEARSAL | UX4 shared UI files listed in `ux4/DARFUS_UX4_CORE_COMPONENT_RESTORE_MAP.md` | `ux4/DARFUS_UX4_ROLLBACK_PROOF.md` + before/after snapshots and manifests |
| UX4C_ROLLBACK | READY_AFTER_REHEARSAL | `components/ui/drawer.tsx` only; public contract unchanged | `ux4c/DARFUS_UX4C_ROLLBACK_PROOF.md` + before/after SHA manifests |
| UX5_ROLLBACK | READY_AFTER_REHEARSAL | POS page and UX5 focused test only; no shared component/API contract change | `ux5/DARFUS_UIUX_UX5_POS_SALES_IMPLEMENTATION_WITH_ROLLBACK_01_REPORT.md` + `backups/ui-ux/UX5_POS_20260828_081104Z/rollback-rehearsal` |
| UX5C_ROLLBACK | READY_AFTER_REHEARSAL | POS page and UX5C focused test only; deferred Sidebar and Gift Voucher issues excluded | `ux5c/DARFUS_UX5C_ROLLBACK_PROOF.md` + `backups/ui-ux/UX5C_OWNER_VISUAL_20260828_090140Z/rollback-rehearsal` |
| UX5D_ROLLBACK | READY_AFTER_REHEARSAL | `GiftVoucherPaymentSection.tsx` presentation only; public contract unchanged | `ux5d/DARFUS_UX5D_ROLLBACK_PROOF.md` + before/after SHA manifests + isolated restore/reapply proof |
| UX5B_ROLLBACK | NOT_REQUIRED_FOR_PRODUCTION_CHANGE; FIXTURE_SCOPED | Isolated evidence fixture/server/screenshots only; no production file changed | `ux5b/DARFUS_UX5B_ROLLBACK_STATUS.md` + after SHA manifest + temporary clone absence/restore proof |

`UX2_ROLLBACK = READY`

Future UX batches must add their own scoped snapshot, ledger row and rollback rehearsal. Classic files must not be deleted as cleanup.
## UX6

| Control | Status | Restore scope | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX6-INVENTORY-ASSETS-IMPLEMENTATION-WITH-ROLLBACK-01` | READY_AFTER_REHEARSAL | Two inventory presentation pages and the UX6 focused test only; no authority/handler changes | `ui-ux/ux6/DARFUS_UX6_ROLLBACK_PROOF.md`, before/after manifests, isolated rehearsal |

## UX6B

| Control | Status | Restore scope | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX6B-ASSET-TAG-BARCODE-PREVIEW-DARK-MODE-VISUAL-FIX-AND-PREVENTION-GATE-01` | READY | `ClientBarcodeTagTemplate.tsx` visual CSS only; no barcode/data/handler authority | `ui-ux/ux6b/DARFUS_UX6B_ROLLBACK_PROOF.md`, before/after manifests, isolated rehearsal |

## UX7

| Control | Status | Restore scope | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX7-CUSTOMERS-SUPPLIERS-IMPLEMENTATION-WITH-ROLLBACK-01` | READY | `globals.css`, Customer/Supplier list/detail presentation classes and UX7 focused test; no authority/handler changes | `ui-ux/ux7/DARFUS_UX7_ROLLBACK_PROOF.md`, before/after manifests, isolated rehearsal |

## UX-8

| Control | Status | Restore scope | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX8-GOLD-CENTER-IMPLEMENTATION-WITH-ROLLBACK-01` | READY | UX8-scoped Gold Center panel CSS/classes, existing karat-input aria labels, and focused test; restore from UX8 before snapshots | `ui-ux/ux8/DARFUS_UX8_AFTER_HASH_MANIFEST.md`, `backups/ui-ux/UX8_GOLD_CENTER_20260828T171500Z/rollback/ROLLBACK_REHEARSAL_HASHES.txt` |

## UX-9

| Control | Status | Restore scope | Evidence |
|---|---|---|---|
| `DARFUS-UIUX-UX9-ACCOUNTING-TREASURY-IMPLEMENTATION-WITH-ROLLBACK-01` | READY | UX9-scoped CSS import/root hooks and focused test; restore from UX9 before snapshot only after Owner review | `ui-ux/ux9/DARFUS_UX9_AFTER_HASH_MANIFEST.md`, `backups/ui-ux/UX9_ACCOUNTING_TREASURY_20260828T183500Z/` |
