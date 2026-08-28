# UX-2 Classic Rollback Rehearsal

An isolated rehearsal copy was created from the classic snapshot. A harmless representative comment was appended only to the isolated copy of `app/globals.css`; its SHA-256 differed from the classic baseline. The exact snapshot file was then restored and SHA-256 was recomputed.

| Check | Evidence |
|---|---|
| Classic expected SHA-256 | `63ACA2712543F567123AE89E3C204CAAEDC7E7424BE1BA50DCC65B51F95C257C` |
| Isolated modified SHA-256 | `96932DF4BA918D748C7B52637BB65540B4F74ADAA47592C9F42ED69EBD3658DE` |
| Restored SHA-256 | `63ACA2712543F567123AE89E3C204CAAEDC7E7424BE1BA50DCC65B51F95C257C` |
| Production worktree changed by rehearsal | No |

Machine proof: `backups/ui-ux/PRE_UX2_CLASSIC_DESIGN_20260828_020614/manifests/classic-rollback-rehearsal.json`.

Result: restored classic hashes match the baseline for the rehearsed file; no production worktree or database was used for rehearsal.

`CLASSIC_ROLLBACK_REHEARSAL = PASS`

`RESTORED_HASH_PARITY = PASS`

`ROLLBACK_FOUNDATION_READY = YES`
