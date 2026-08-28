# UX4C Rollback Proof

Rehearsed on an isolated copy under `backups/ui-ux/UX4C_DRAWER_FOCUS_20260828_075000Z/rollback-rehearsal/`; the active worktree was not rolled back.

| Check | Result |
|---|---|
| Restored pre-UX4C copy equals before SHA | PASS — `73B50EF20D2B7251BF803B2F7C83426C32D4009BCB40867BF05FC9FE26E55FB8` |
| Reapplied UX4C copy equals after SHA | PASS — `32251475D47AC86F1A8C64267A4F2188CBDAE956361FD769889B61A505D466E6` |
| Active worktree destructive rollback | NOT RUN |
| Classic baseline | AVAILABLE |
| UX2 rollback | AVAILABLE |
| UX3 rollback | AVAILABLE |
| UX4 rollback | AVAILABLE |
| UX4C rollback | READY |

`UX4C_RESTORED_HASH_PARITY = PASS`.

