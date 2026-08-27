# DARFUS Client C2C3R — Frontend Runtime Parity Proof

بالعربي المختصر: تم إثبات build/runtime production على Frontend منفصل مربوط بالـclone، ولم يتم تشغيل `next dev` لأن `AGENTS.md` يمنعه أثناء القبول. لا يوجد اتصال من هذا runtime بقاعدة `darfus_erp`.

## Target isolation

| Component | Observed target | Evidence | Result |
|---|---|---|---|
| Temporary backend | `http://localhost:8001` | `GET /api/v1/health` = 200; `GET /api/v1/health/db` = 200 | PASS |
| Temporary backend database | `darfus_c2c2_revision_runtime_02` | read-only `SELECT current_database()` through the clone PostgreSQL service | PASS |
| Temporary frontend | `http://localhost:3002` | `GET /en/inventory/1` = 200 | PASS |
| Official backend | `http://localhost:8000` | not used by the temporary production bundle | PRESERVED |
| Official database | `darfus_erp` | read-only baseline query only | PRESERVED |

## `next-env.d.ts` variants

| Token | Value | Evidence | Result |
|---|---|---|---|
| `DEV_NEXT_ENV_VARIANT` | `./.next/dev/types/routes.d.ts` | prior accepted C2C3 pre-build observation; exact supported policy value | OBSERVED_PRIOR / FRESH_PROOF_BLOCKED |
| `BUILD_NEXT_ENV_VARIANT` | `./.next/types/routes.d.ts` | current file after `npm run build` | PASS |
| `CURRENT_NEXT_ENV_VARIANT` | `./.next/types/routes.d.ts` | current file read after build | PASS |
| `NEXT_ENV_MANUAL_EDITED` | `NO` | no edit command or patch targeted the file | PASS |
| `NEXT_ENV_POLICY_CLASSIFICATION` | `SUPPORTED_GENERATED_VARIANT` | `node --test tests/c2c3r-next-env-runtime-policy.test.cjs` | PASS |

## Build proof

Command executed:

```text
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1 npm run build
```

PowerShell process environment was used only for this command; `.env` was not edited. The build completed with:

- Next.js `16.2.9` (Turbopack)
- compilation successful
- TypeScript successful
- static page generation `125/125`
- production route output included AR and EN Asset Detail routes
- exit code `0`

The built bundle was checked read-only and contained `http://localhost:8001/api/v1`; this is the isolation proof for the temporary frontend.

## Serving proof

`next start -p 3002` was started from the successful build. It reported ready, and the Asset Detail route returned HTTP 200. No `next dev` process was started by this control.

## Dev proof limitation

The requested fresh dev regeneration proof cannot be run under the current project authority because `AGENTS.md` states: `Do not run Next dev during acceptance`. This is recorded as a guardrail block, not treated as a generated-file defect. The policy still accepts the exact dev variant if it is produced by an approved future toolchain run.

## Browser connection limitation

The required browser acceptance could not start. Browser setup failed before tab discovery or page interaction with:

```text
failed to write kernel assets: The system cannot find the path specified. (os error 3)
```

The failure repeated after session reset. Consequently there is no browser/network-console evidence from an actual browser session in this control.

## Safety result

- `darfus_erp` was not written.
- No frontend or backend business mutation was sent.
- No migration, seed, or configuration-file mutation was executed.
- The normal `3000/8000` runtime was not restarted or modified.
