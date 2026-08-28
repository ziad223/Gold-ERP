# UX-7 Rollback Proof

Rollback rehearsal was performed on isolated evidence copies only:

`after -> restored-before -> re-applied-after`

The restore map uses the UX7 before manifest; the re-applied map uses the UX7 after manifest. Before and after hashes matched their respective manifests. No live source restore, Git reset/restore/clean/stash, database action or runtime mutation occurred.

