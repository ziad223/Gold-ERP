# UX-2 Rollback Proof

In an isolated source copy, UX2 `app/globals.css` was compared with the classic snapshot, restored to the classic version, and hashed. The restored SHA matched the classic manifest. The UX2 file was then re-applied in the isolated copy and its after hash matched the after snapshot.

| Check | SHA-256 / result |
|---|---|
| Classic | `63ACA2712543F567123AE89E3C204CAAEDC7E7424BE1BA50DCC65B51F95C257C` |
| UX2 after | `9EDE0FBD434D31F443C6AEAAF15D3ACCBA0D321C219F191CE8F6CA7C30CCDB37` |
| Restored classic parity | PASS |
| Re-applied UX2 parity | PASS |
| Active worktree rollback performed | NO |

Machine proof: `backups/ui-ux/UX2_THEME_FOUNDATION_20260828_020614/rollback-rehearsal/ux2-rollback-proof.json`.

No active production rollback was performed merely for proof and no database was touched.

`UX2_ROLLBACK_READY = YES`

`UX2_ROLLBACK_REHEARSAL = PASS`
