# DARFUS Gift Voucher Main Runtime — Source Identity

Control: `DARFUS-GIFT-VOUCHER-MAIN-RUNTIME-PARITY-RECOVERY-01`

| Artifact | Host SHA-256 | Container SHA-256 | Result |
|---|---|---|---|
| `backend/src/routes/erp.routes.js` | `2DCD68C0A42B827DB937B89C1FC77B0AAC48931EA03232CA549C4532E14F25C8` | `2DCD68C0A42B827DB937B89C1FC77B0AAC48931EA03232CA549C4532E14F25C8` | MATCH |
| `backend/src/server.js` | `D6A51A8BCB7F6A1159631AE607BB1E96724C007075D2F5E7E2717D82C580A823` | `D6A51A8BCB7F6A1159631AE607BB1E96724C007075D2F5E7E2717D82C580A823` | MATCH |

The compose service uses the approved backend source bind mount and starts with
`npm start`. The current route source contains the active Gift Voucher GET and
issue route and does not contain the historical
`GIFT_VOUCHER_FINANCIAL_WORKFLOW_DISABLED` guard.

The earlier 403/500 evidence therefore identifies a loaded-process freshness
mismatch, not a current source/config mismatch. No product or configuration
file was changed in this recovery.

## Worktree note

The repository was already dirty before this control (pre-existing tracked and
untracked worktree content). No reset, restore, clean, stash, add, or commit was
performed. This document records runtime/source identity only and does not claim
a clean worktree.
