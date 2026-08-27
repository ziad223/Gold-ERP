# Migration Failure Safety

The restored chain was run against nonexistent Disposable target
`darfus_migration_startup_failure_probe_20260827_01` with isolated port 8012.
The canonical migration command returned exit code 1 with PostgreSQL database
not found. Because the chain uses `&&`, no 8012 server process started; only the
pre-existing official runtime remained.

`MIGRATION_FAILURE_BLOCKS_APP_START = PASS`.
`FAIL_OPEN_MIGRATION_BEHAVIOR = NO`.

