# DARFUS ERP — External Source Recovery / Docker / Deployment / Local History Forensic Report

أُنجز هذا الـControl كبحث forensic للقراءة فقط عن مصادر خارجية/محلية محتملة للملفات التالفة. وُجدت مرشحات قابلة للقراءة داخل Docker image لـA1 وA3 وA4، لكن مرشح A3 لا يطابق جسم Source Freeze المطلوب، وما زال A8 بلا مصدر صالح. لم تتم استعادة أو استبدال أي ملف، ولم يتم تشغيل أي Container جديد أو Migration أو اتصال بقاعدة البيانات.

**Control ID:** `DARFUS-EXTERNAL-SOURCE-RECOVERY-DOCKER-DEPLOYMENT-LOCAL-HISTORY-FORENSIC-01`  
**Mode:** `EXTERNAL_RECOVERY_SOURCE_DISCOVERY_AND_VALIDATION_ONLY`  
**Project:** `I:\WORK\jewellery-erp-master`  
**Official DB:** `darfus_erp`  
**Date:** `2026-08-31`

## 1. Executive Summary

| Result | Actual | Evidence |
|---|---|---|
| External/local search | Completed within bounded Docker, deployment, editor-history, Windows, and archive scopes | Sections 5–14 |
| New valid Docker candidates | A1, A3, A4 | Unmounted image-layer extraction to `C:\DARFUS-RECOVERY-FORENSIC\20260831T\docker-image` |
| Exact A3 Source Freeze body | Not recovered | Expected 10224 bytes / `E8BC622B...ED51928`; Docker candidate is 15956 bytes / `9411D7BF...7C8131D` |
| A8 candidate | Not found | Docker image, local deployments, editor history, archives, and prior Git channels |
| Primary three targets | Existing upstream valid HEAD/Index candidates remain available | Prior source-corruption recovery report |
| Official DB writes | 0 | No DB client/query/migration/API mutation was run |
| Product source recovery | 0 | No file was copied into the workspace; no Git mutation |
| Control outcome | Partial candidates found; unresolved targets remain | Section 27 |

**Current gate:** `PARTIAL_EXTERNAL_SOURCE_RECOVERY_CANDIDATES_FOUND_REMAINING_SOURCES_UNRESOLVED`

هذا Gate لا يسمح بالـoverwrite أو rename أو delete أو merge. أي استخدام لاحق لمرشح Docker يحتاج Control منفصلًا وموافقة Owner صريحة على اختيار المصدر.

## 2. Upstream Recovery State

الـControl السابق `DARFUS_ADDITIONAL_SOURCE_BINARY_CORRUPTION_RECOVERY_SOURCE_SELECTION_01_REPORT.md` أثبت فساد ثمانية أهداف إضافية وربطها بثلاثة أهداف أساسية، بإجمالي 11 ملف مصدر متأثرًا. لم يُستخدم التقرير السابق كمصدر body؛ استُخدم فقط لتحديد الأهداف والمرشحات التي سبق إثباتها.

| Upstream fact | State |
|---|---|
| Total corrupted source targets | 11 |
| Primary valid HEAD/Index candidates | 3: `app/[locale]/(dashboard)/sales/returns/page.tsx`, `hooks/use-installments.ts`, `hooks/use-invoice-print-custom-blocks.ts` |
| Additional freeze-matched HEAD/Index candidates | A2, A5, A6, A7 |
| Additional valid but freeze-mismatched HEAD/Index candidate | A3 |
| Previously unresolved | A1, A4, A8; A3 exact modified freeze body also unresolved |
| Prior stash target hits | 0 across 11 stashes |
| Prior known backup exact copies | 0 |
| Prior matching unreachable Git blobs | 0 |

## 3. Exact Unresolved Targets

| ID | Exact target | Current state before this Control | Required authority question |
|---|---|---|---|
| A1 | `backend/migrations/20260818010000-create-inventory-master-data-bootstrap-state.js` | 1852 bytes, corrupt, current SHA `DCC77BD8258D5360A275E08958021702A2E9800F021C4953B694035C5EA88919` | Is a valid external migration body an acceptable recovery source? |
| A3 | `backend/src/services/barcode-identity.service.js` | 15956 bytes, corrupt, current SHA `2C3B2DEAC59BAB61EA7DDEABBCD4F70134FFCD8F3857FBA63D0702DF19C80EDD` | Exact 2026-08-15 Freeze body required: 10224 bytes, SHA `E8BC622BE5EA400630061C2F916B689384C32FC132ADC8B65A9D19154ED51928` |
| A4 | `backend/src/services/inventory-master-data-baseline.js` | 78198 bytes, corrupt, current SHA `82D45D0983CEE7DE3852813EBD68BFD104E561B41FF206FCFE943DAF23221588` | Is the packaged baseline body the approved recovery source? |
| A8 | `tests/asset-final-closure.test.cjs` | 5026 bytes, corrupt, current SHA `CBC7D12B2D902802B4C12F63BC287CCBC97FCF8D55DF822CDEE3E815040E7C5C` | Exact approved test body is still missing; assertions must not be invented |

## 4. Original Workspace Safety

The repository was inspected without refreshing the index and without any destructive or state-changing Git operation.

| Field | Observed value | Evidence |
|---|---|---|
| `CURRENT_BRANCH` | `main` | read-only `git branch --show-current` |
| `HEAD_SHA` | `1657b0e9ba580faef69be48f04637835c201b521` | read-only `git rev-parse HEAD` |
| `WORKTREE_DIRTY` | `YES` | read-only `git status --short` |
| `STATUS_LINES` | 1049 | status snapshot before this report |
| `TRACKED_MODIFIED_COUNT` | 147 | status classification |
| `UNTRACKED_COUNT` | 902 | status classification |
| `STASH_COUNT` | 11 | read-only `git stash list` |
| `SOURCE_FREEZE_MANIFEST_FOUND` | `YES` | `backend/reports/local-final-source-freeze-manifest-01-20260815T150848+0300.md` |
| `SOURCE_FREEZE_HASH_MATCH` | `A3 = NO`; A1/A4/A8 not present in the manifest target entries | manifest comparison |
| `NEXT_ENV_D_TS` | Not edited | protected by AGENTS.md and not in the target scope |
| Git mutations | 0 | no reset/restore/checkout/clean/stash/add/commit/index refresh |

The worktree remains the Owner’s pre-existing dirty state. This Control did not normalize or claim any unrelated changes.

## 5. Docker Container Inventory

Inspection was read-only. The existing backend was not restarted by this Control; its observed restart loop was already present.

| Container | Image | Status / health | Restarts | Relevance |
|---|---|---|---:|---|
| `darfus-backend` | `jewellery-erp-master-backend` | `restarting`; no healthcheck | 49 at final observation; exit 1 | Live bind-mounted worktree; not an independent recovery source |
| `darfus-postgres` | `postgres:16-alpine` | running / healthy | 0 | Official local DB service; not accessed for this Control |
| `darfus-redis` | `redis:7-alpine` | running / healthy | 0 | Runtime service; not a source candidate |
| `darfus-b1r-redis` | `redis:7-alpine` | exited | 0 | Historical/unused Redis container; no source files |
| `darfus-source-recovery-forensic-20260831t` | `jewellery-erp-master-backend:latest` | `created`, never started | 0 | Disposable read-only inspection object; network `none`, no mounts |

Observed ports from Docker metadata: PostgreSQL `5433 -> 5432`, Redis `6379 -> 6379`. The backend compose mapping is `BACKEND_PORT` default `8000 -> 8000`.

The existing backend log repeatedly reports `Cannot find module 'libphonenumber-js/max'` while loading `customer-phone.service.js`. This is a current runtime/dependency observation, not a source-recovery candidate and was not fixed in this Control.

## 6. Docker Container Candidate Search

### Existing live backend

`darfus-backend` has:

- image digest `sha256:b125a6f86183ec8d641f197d7a5407cf59eabef0077b36d949d9bc704147bd8e`;
- bind mount `I:\WORK\jewellery-erp-master\backend -> /app`, read/write at runtime;
- `/app/node_modules` volume;
- restart-loop status.

The exact A1/A3/A4 files copied from this container were byte-identical to the currently corrupt worktree files and failed UTF-8/`node --check`. They are therefore classified as `SAME_LIVE_WORKTREE_NOT_RECOVERY_SOURCE`. A8 was absent.

### Disposable image inspection object

The explicitly permitted forensic object `darfus-source-recovery-forensic-20260831t` was created with `docker create`, `--network none`, no mounts, and was never started. `docker cp` copied only candidate paths from that object into the external forensic directory:

`C:\DARFUS-RECOVERY-FORENSIC\20260831T\docker-image\`

This is diagnostic extraction, not source recovery. No extracted file was copied into the repository.

## 7. Docker Image Inventory

| Image | Digest / ID | Created | Size | Candidate value |
|---|---|---|---:|---|
| `jewellery-erp-master-backend:latest` | `sha256:b125a6f86183ec8d641f197d7a5407cf59eabef0077b36d949d9bc704147bd8e` | 2026-08-26 16:37:45Z | 109,214,720 bytes compressed metadata size | Only relevant local application image |
| `postgres:16-alpine` | local image | available | — | No application source |
| `redis:7-alpine` | local image | available | — | No application source |

No older tagged DARFUS backend image was present in the local image inventory. The relevant backend image configuration reports Node `20.20.2`, `NODE_ENV=production`, workdir `/app`, and no database secret was printed.

Image history proves a `COPY . .` application layer created 2026-08-26. It proves packaging provenance for a candidate body, not Owner approval or exact Source Freeze intent.

## 8. Docker Image Candidate Search

| ID | Image path inspected | Present | Size | SHA-256 | UTF-8 | Node parse | Result |
|---|---|---:|---:|---|---|---|---|
| A1 | `/app/migrations/20260818010000-create-inventory-master-data-bootstrap-state.js` | YES | 1852 | `2087CF4FEFC87FE2587AF721A36DC3297C7BE37D41119F7D40B051C0520401BD` | YES | PASS | Strong candidate; not in HEAD/Index |
| A3 | `/app/src/services/barcode-identity.service.js` | YES | 15956 | `9411D7BF9BE267007B785FD9D80AD000E5360A9D7FE6FBEE87841F0657C8131D` | YES | PASS | Strong semantic candidate; not exact Freeze body |
| A4 | `/app/src/services/inventory-master-data-baseline.js` | YES | 78198 | `F22681B8E8F3C5C03CBE07FE07953AFDAFC031E20ABEA0D51E2739103B679CC9` | YES | PASS | Strong baseline candidate; not in HEAD/Index |
| A8 | `/app/tests/asset-final-closure.test.cjs` | NO | — | — | — | — | Not included in backend image |

The A1 and A4 image files retain the same file sizes and filesystem times observed on the corrupted targets, while their bodies are valid and hashes differ. This is corroborating artifact evidence only; it does not prove the actor, corruption moment, or Owner intent.

## 9. Dockerfile / .dockerignore Authority

Read-only source inspection showed:

| File / line | Authority fact | Recovery implication |
|---|---|---|
| `docker-compose.yml:35–36` | backend build context is `./backend` | image can carry backend A1/A3/A4 paths |
| `docker-compose.yml:49` | default `DB_NAME` is `darfus_erp` | normal compose backend is capable of targeting the official DB; the forensic container was never started |
| `docker-compose.yml:64–69` | backend port `8000`; command `npm run db:migrate && npm start`; bind `./backend:/app` | live container is not an independent source and normal restart has mutation risk |
| `backend/Dockerfile:2` | base `node:20-alpine` | image runtime identity |
| `backend/Dockerfile:11–15` | package files installed, then `COPY . .` | application source is packaged into image layer |
| `backend/.dockerignore:1–10` | excludes node_modules, env files, backups, dumps, logs, and `.git` | no backup/.git/test-root recovery source should be inferred from image absence |

Because the build context is `backend`, root-level `tests/asset-final-closure.test.cjs` is not expected in this image. Its absence is not evidence that the test never existed; it is only image-context evidence.

## 10. Local Deployment Copy Search

Exact target basenames were searched read-only in bounded local roots, excluding the live project copy and generated/cache folders where applicable:

- `I:\WORK` outside `I:\WORK\jewellery-erp-master`;
- `C:\Projects`;
- `C:\deploy`;
- `C:\opt`;
- `D:\WORK`;
- `C:\Users\NEGM\Desktop`;
- `C:\Users\NEGM\Downloads`.

Result: **no exact filename/path copies found** for A1, A3, A4, or A8. No deployment copy was opened or treated as a recovery source.

## 11. Authorized VPS/Remote Evidence

No VPS/remote host, repository mirror, deployment credential, or approved remote evidence source was provided for this Control. SSH, remote Docker, remote artifact stores, and deployment systems were not accessed.

`REMOTE_DEPLOYMENT_SOURCE_ACCESSED = NO`  
`REMOTE_EVIDENCE_STATUS = NOT_ACCESSED_NO_AUTHORIZED_ENDPOINT`

This is an evidence boundary, not a claim that no remote copy exists.

## 12. VS Code / Editor Local History

The following local editor state was inspected read-only:

- `C:\Users\NEGM\AppData\Roaming\Code\User\History`;
- `C:\Users\NEGM\AppData\Roaming\Code\Backups` and the surrounding Code state directory for exact target filenames;
- `Code - Insiders` History path when present.

Search terms included all four exact basenames, `inventory_master_data_bootstrap_states`, `BARCODE_HISTORY_STATE`, `V1_PROFILE_MASTER_DATA_ROWS`, and the exact A3 freeze SHA.

Result: no matching local-history body or exact target filename was found. No history entry was restored, copied, or altered.

## 13. Windows File History / Shadow Evidence

`vssadmin list shadows` was attempted read-only, but Windows returned an administrative-permission error. No elevated retry was performed. Known File History roots were absent, and no matching target names were found in the bounded Recycle Bin search.

| Evidence channel | Result | Limitation |
|---|---|---|
| Volume Shadow Copy | `UNAVAILABLE_NO_ELEVATED_PERMISSION` | Cannot conclude whether shadows exist |
| File History paths | No known local path present | Other configured locations cannot be inferred |
| Recycle Bin exact-name search | No hit | Does not prove permanent absence |

No shadow/File History source was extracted.

## 14. Archive Search

Archive candidates were searched by relevant extension and project-related name in bounded roots `I:\WORK`, Desktop, Downloads, and `C:\DARFUS-DIAGNOSTIC`, excluding node_modules/cache trees. No matching DARFUS/jewellery/ERP backup, release, snapshot, source archive, dump, or SQL archive containing the target names was found.

No archive was extracted or modified.

## 15. A1 Candidate Review

### Candidate evidence

| Candidate | State | Hash / parse | Authority assessment |
|---|---|---|---|
| Current worktree | Corrupt | 1852; invalid UTF-8; 18 NUL; `node --check` FAIL | Reject as source |
| HEAD / Index | Absent | No Git object | No candidate |
| 11 stashes | No target hit | `STASH_TARGET_HITS=0` | No candidate |
| Workspace A/B | Same corrupt bytes | no valid parse | Replicated corruption, not source |
| Known backups/reports | No body copy | metadata/report references only | No candidate |
| Docker image | Valid | 1852; SHA `2087CF4F...0401BD`; `node --check` PASS | Strong candidate; Owner selection required |

### Semantic review

The Docker body is a transactional Sequelize migration that creates `inventory_master_data_bootstrap_states`, requires `company_id`, `dataset_id`, `current_version`, `manifest_hash`, and `state`, adds a unique `(company_id, dataset_id)` constraint and `(company_id, state)` index, and uses a forward-only `down()` that throws a non-destructive error. This is sufficient to establish semantic compatibility with the named target, not permission to execute or restore it.

`A1_STATUS = STRONG_RECOVERY_SOURCE_PROVEN`  
`A1_RECOVERY_SOURCE = DOCKER_IMAGE_LAYER`  
`A1_OWNER_APPROVAL_REQUIRED = YES`

## 16. A3 Freeze Candidate Review

### Candidate evidence

| Candidate | Size | SHA-256 | Parse | Freeze relation |
|---|---:|---|---|---|
| Current worktree/live bind | 15956 | `2C3B2DEA...19C80EDD` | FAIL | Corrupt |
| HEAD / Index | 9708 | `E7E30B91...2EE0A9A42` | PASS | Valid but not the manifest’s modified body |
| Source Freeze expected body | 10224 | `E8BC622B...4ED51928` | Metadata only | Exact required body not found |
| Docker image | 15956 | `9411D7BF...7C8131D` | PASS | Valid body, not exact Freeze hash |

### Semantic review of Docker candidate

The image body is materially richer than HEAD (311 lines versus 208) and contains:

- `BARCODE_HISTORY_STATE` and `BARCODE_HISTORY_ACTION`;
- loose-profile karat enforcement for `LOOSE_DIAMOND`, `LOOSE_GEMSTONE`, and `LOOSE_PEARL`;
- collision checks against Asset rows and `asset_barcode_history`;
- non-reuse behavior;
- `replaceAssetBarcode` with transactional history retirement and new active history.

These are strong semantic compatibility signals, but they do not make the body equal to the exact 2026-08-15 Freeze body. The Docker file timestamp (`2026-08-22`) and image build (`2026-08-26`) suggest a later packaged source state than the 2026-08-15 manifest, but exact intent and provenance are not independently proven.

`A3_STATUS = STRONG_RECOVERY_SOURCE_PROVEN_BUT_EXACT_FREEZE_UNRESOLVED`  
`A3_EXACT_FREEZE_BODY_RECOVERED = NO`  
`A3_RECOVERY_SOURCE = DOCKER_IMAGE_ALTERNATE_CANDIDATE`  
`A3_OWNER_DECISION_REQUIRED = YES`

The HEAD body must not be silently promoted as the Freeze body, and the Docker body must not be silently promoted either.

## 17. A4 Candidate Review

### Candidate evidence

| Candidate | State | Hash / parse | Authority assessment |
|---|---|---|---|
| Current worktree/live bind | Corrupt | 78198; invalid UTF-8; 764 NUL; parse FAIL | Reject as source |
| HEAD / Index | Absent | No Git object | No candidate |
| 11 stashes | No target hit | `STASH_TARGET_HITS=0` | No candidate |
| Workspace A/B | Same corrupt bytes | no valid parse | Replicated corruption |
| Known backups/reports | No body copy | no exact source | No candidate |
| Docker image | Valid | 78198; SHA `F22681B8...B679CC9`; `node --check` PASS | Strong candidate; Owner selection required |

### Semantic review

The Docker body exports `V1_PROFILE_MASTER_DATA_ROWS`. A disposable Node require was used only to inspect its in-memory static data; it did not import the application or connect to a database.

| Check | Result |
|---|---:|
| Rows | 502 |
| Categories | 28 |
| Duplicate `(category, canonicalValue)` keys | 0 |
| First row | `DIAMOND_CLARITY::fl` |
| Last row | `PEARL_TYPE::tahitian` |
| Covered families | diamond, gemstone, gold, pearl |

This proves a coherent baseline candidate body, not that it is safe to seed or that it is the final approved master-data state.

`A4_STATUS = STRONG_RECOVERY_SOURCE_PROVEN`  
`A4_RECOVERY_SOURCE = DOCKER_IMAGE_LAYER`  
`A4_OWNER_APPROVAL_REQUIRED = YES`

## 18. A8 Candidate Review

| Candidate channel | Result |
|---|---|
| Current worktree | Corrupt; 5026; invalid UTF-8; 50 NUL; parse FAIL |
| HEAD / Index | Absent |
| 11 stashes | 0 target hits |
| Workspace A/B | Same corrupt bytes |
| Docker image | `/app/tests/asset-final-closure.test.cjs` absent; backend build context excludes root tests |
| Local deployment copies | No exact hit |
| VS Code/editor history | No exact filename/body-marker hit |
| Windows shadow/File History | No accessible candidate; VSS not elevated |
| Archives | No bounded archive candidate |

`A8_STATUS = NO_SAFE_RECOVERY_SOURCE_PROVEN`  
`A8_RECOVERY_SOURCE = NONE_FOUND`  
`A8_OWNER_DECISION_REQUIRED = YES`

No A8 test assertions were reconstructed from test names, reports, or consumers.

## 19. Candidate Hash / Parse Matrix

| ID | Current corrupt SHA | Best candidate SHA | Size relation | UTF-8 / parse | Freeze match | Disposition |
|---|---|---|---|---|---|---|
| A1 | `DCC77BD8...EA88919` | `2087CF4F...0401BD` | same 1852 | YES / PASS | No manifest body | Strong Docker candidate |
| A3 | `2C3B2DEA...19C80EDD` | `9411D7BF...7C8131D` | same 15956 | YES / PASS | NO; expected `E8BC622B...ED51928` | Alternate semantic candidate; Owner decision |
| A4 | `82D45D09...221588` | `F22681B8...B679CC9` | same 78198 | YES / PASS | No manifest body | Strong Docker candidate |
| A8 | `CBC7D12B...0E7C5C` | none | — | no valid candidate | — | Unresolved |

The abbreviated hashes above are only for readability; complete hashes are in Sections 3, 8, 15–18 and the final tokens.

## 20. Semantic Compatibility

| Target | Compatibility conclusion | Evidence | Limitation |
|---|---|---|---|
| A1 | Candidate matches the named bootstrap-state migration role and guarded schema semantics | transactional create, unique company/dataset scope, state index, forward-only down | no exact Freeze body or Git provenance |
| A3 | Docker candidate matches current barcode-history/loose-profile architecture more closely than HEAD | history constants, loose karat rule, collision/history checks, replacement transaction | exact 2026-08-15 Freeze body still missing |
| A4 | Candidate is a structured V1 profile master-data snapshot with no duplicate canonical keys | 502 rows, 28 categories, 0 duplicate keys | no proof that it is approved for official DB provisioning |
| A8 | Cannot assess semantics safely | no valid body | no test reconstruction allowed |

Semantic compatibility is a review signal only. It is not an authorization to write files, run migrations, seed data, or change tests.

## 21. Recovery Authority Ranking

The ranking used for future Owner review is:

1. Exact approved Source Freeze body with matching path, size, SHA, and provenance.
2. Exact HEAD/Index body independently matched to a clean Source Freeze record and semantically reviewed.
3. Unmounted, never-started Docker image body with valid parse and direct target-path evidence.
4. Independent deployment copy or approved archive with complete provenance and matching hash.
5. Editor/File History/Shadow copy with trustworthy path and timestamp provenance.
6. Reports, manifests, generated artifacts, consumer inference, or reconstructed code — metadata only, never a source body.
7. Live bind-mounted corrupt files and byte-identical Workspace A/B copies — not recovery sources.

Under this ranking, A1 and A4 have a rank-3 candidate; A3 has a rank-3 alternate but no rank-1 exact Freeze body; A8 has no candidate.

## 22. All-11 Recovery Readiness

| Group | Count | State |
|---|---:|---|
| Primary targets with upstream valid HEAD/Index candidates | 3 | Candidate proven; controlled recovery approval still required |
| A2, A5, A6, A7 freeze-matched HEAD/Index candidates | 4 | Candidate proven; controlled recovery approval still required |
| A1 Docker strong candidate | 1 | Candidate found; Owner source selection required |
| A4 Docker strong candidate | 1 | Candidate found; Owner source selection required |
| A3 valid Docker alternate, exact Freeze body absent | 1 | Strict latest/freeze readiness unresolved |
| A8 no valid source | 1 | Unresolved |
| Total affected files | 11 | Not all recovery-ready |

Defined strict counts:

- `EXACT_OR_FREEZE_MATCHED_SOURCE_READY_COUNT = 7` from the upstream primary 3 plus A2/A5/A6/A7;
- `STRONG_NONEXACT_DOCKER_CANDIDATE_COUNT = 3` for A1/A3/A4;
- `EXACT_LATEST_INTENT_UNRESOLVED_COUNT = 2` for A3’s exact Freeze body and A8’s missing body;
- `SAFE_CANDIDATE_BODY_FOUND_COUNT = 10` when the valid A3 alternate is counted as a candidate;
- `ALL_11_RECOVERY_READY = NO`.

The control gate remains partial because the requirement is not merely a parseable body: A3’s exact latest/Freeze authority and A8’s exact body are still unresolved.

## 23. Remaining Unresolved Sources

1. **A3 exact Freeze body:** provide the 10224-byte `E8BC622BE5EA400630061C2F916B689384C32FC132ADC8B65A9D19154ED51928` body, or issue an explicit Owner decision accepting the Docker candidate as an alternative semantic source after controlled diff review.
2. **A8 exact test body:** provide an approved external copy of `tests/asset-final-closure.test.cjs`; do not infer it from reports or source consumers.
3. **A1/A4 approval choice:** although strong Docker candidates exist, a future recovery Control must explicitly select them and capture before/after hashes without replacing the current corrupt files automatically.

## 24. Main DB Safety

`darfus_erp` was not connected to, queried, migrated, seeded, backed up, restored, or mutated in this Control.

| Safety check | Result |
|---|---|
| Official DB target touched | NO |
| `current_database()` query | NOT RUN; no DB access was required for source discovery |
| API POST/PUT/PATCH/DELETE | 0 |
| Migration execution | 0 |
| Seed/bootstrap execution | 0 |
| Compose restart/recreate | 0 by this Control |
| Docker forensic object network | `none` |
| Docker forensic object mounts | 0 |
| Docker forensic object started | NO |
| Official DB writes | 0 |

The normal compose command contains `npm run db:migrate && npm start`; this was not invoked for the disposable inspection object and no new normal runtime was started.

## 25. Diagnostic Artifacts Retained

The following evidence was retained outside the repository’s product source:

| Artifact | Location | Purpose |
|---|---|---|
| A1/A3/A4 image-layer copies | `C:\DARFUS-RECOVERY-FORENSIC\20260831T\docker-image\` | read-only candidate review |
| Live bind copies | `C:\DARFUS-RECOVERY-FORENSIC\20260831T\container-live\` | prove they equal current corrupt worktree bytes |
| Disposable inspection object | `darfus-source-recovery-forensic-20260831t` | unmounted, never-started Docker inspection object |
| Prior diagnostic scripts | `C:\DARFUS-DIAGNOSTIC\` | existing read-only evidence tooling; not modified by this Control |

No artifact was copied into `I:\WORK\jewellery-erp-master` except this documentation report.

## 26. Owner Decision Packet

No decision is assumed. The next separately approved recovery Control should resolve:

| Decision | Required Owner input |
|---|---|
| A1 | Accept or reject Docker candidate `2087CF4F...0401BD` as controlled recovery source; migration execution remains separately forbidden |
| A3 | Supply exact Freeze body, or explicitly accept Docker candidate `9411D7BF...7C8131D` as a non-Freeze alternative after semantic diff review; do not silently use HEAD |
| A4 | Accept or reject Docker candidate `F22681B8...B679CC9` as controlled recovery source; no master-data provisioning in recovery |
| A8 | Supply exact approved test body or formally disposition it as unrecoverable; do not invent tests |
| All 11 | Approve one named controlled recovery batch with exact pre/post hashes, no automatic overwrite, and no DB mutation unless separately authorized |

## 27. Gate

### Gate decision

`GATE = PARTIAL_EXTERNAL_SOURCE_RECOVERY_CANDIDATES_FOUND_REMAINING_SOURCES_UNRESOLVED`

### Gate basis

- A1 has a valid unmounted Docker image candidate with direct path, complete hash, UTF-8 validation, and Node parse proof.
- A4 has a valid unmounted Docker image candidate with direct path, complete hash, UTF-8 validation, Node parse proof, and a coherent 502-row/28-category/zero-duplicate semantic summary.
- A3 has a valid Docker candidate with strong barcode-history semantics, but it does not match the exact 2026-08-15 Source Freeze size/hash.
- A8 has no safe recovery source in the inspected Docker, deployment, editor-history, Windows, archive, or prior Git channels.
- The official DB and product source were not mutated.

This is a source-evidence gate, not a product implementation pass/fail and not an authorization to recover files.

## 28. Final Tokens

```text
CURRENT_CONTROL = DARFUS-EXTERNAL-SOURCE-RECOVERY-DOCKER-DEPLOYMENT-LOCAL-HISTORY-FORENSIC-01
MODE = EXTERNAL_RECOVERY_SOURCE_DISCOVERY_AND_VALIDATION_ONLY
OWNER_APPROVAL = EXPLICIT_FOR_FORENSIC_DISCOVERY_ONLY
SOURCE_RECOVERY_ALLOWED = NO
PRODUCT_CHANGE_ALLOWED = NO
DATABASE_CHANGE_ALLOWED = NO
MIGRATION_EXECUTION_ALLOWED = NO

PROJECT = I:\WORK\jewellery-erp-master
OFFICIAL_DATABASE = darfus_erp
CURRENT_BRANCH = main
HEAD_SHA = 1657b0e9ba580faef69be48f04637835c201b521
WORKTREE_DIRTY = YES
STATUS_LINES = 1049
TRACKED_MODIFIED_COUNT = 147
UNTRACKED_COUNT = 902
STASH_COUNT = 11
SOURCE_FREEZE_MANIFEST_FOUND = YES

EXTERNAL_RECOVERY_SOURCE_SEARCHED = YES
DOCKER_INSPECTION = COMPLETE
DOCKER_IMAGE_CANDIDATES_FOUND = A1,A3,A4
LOCAL_DEPLOYMENT_SEARCH = COMPLETE_NO_EXACT_COPY
REMOTE_DEPLOYMENT_SOURCE_ACCESSED = NO
EDITOR_HISTORY_SEARCH = COMPLETE_NO_MATCH
WINDOWS_SHADOW_EVIDENCE = UNAVAILABLE_NO_ELEVATED_VSSADMIN
ARCHIVE_SEARCH = COMPLETE_NO_CANDIDATE

A1_STATUS = STRONG_RECOVERY_SOURCE_PROVEN
A1_RECOVERY_SOURCE = DOCKER_IMAGE_LAYER_JEWELLERY_ERP_MASTER_BACKEND_LATEST
A1_SHA256 = 2087CF4FEFC87FE2587AF721A36DC3297C7BE37D41119F7D40B051C0520401BD
A1_EXACT_LATEST_INTENT = NOT_PROVEN

A3_STATUS = STRONG_RECOVERY_SOURCE_PROVEN_BUT_EXACT_FREEZE_UNRESOLVED
A3_RECOVERY_SOURCE = DOCKER_IMAGE_ALTERNATE_CANDIDATE
A3_SHA256 = 9411D7BF9BE267007B785FD9D80AD000E5360A9D7FE6FBEE87841F0657C8131D
A3_EXACT_FREEZE_EXPECTED_SHA256 = E8BC622BE5EA400630061C2F916B689384C32FC132ADC8B65A9D19154ED51928
A3_EXACT_FREEZE_BODY_RECOVERED = NO

A4_STATUS = STRONG_RECOVERY_SOURCE_PROVEN
A4_RECOVERY_SOURCE = DOCKER_IMAGE_LAYER_JEWELLERY_ERP_MASTER_BACKEND_LATEST
A4_SHA256 = F22681B8E8F3C5C03CBE07FE07953AFDAFC031E20ABEA0D51E2739103B679CC9
A4_EXACT_LATEST_INTENT = NOT_PROVEN

A8_STATUS = NO_SAFE_RECOVERY_SOURCE_PROVEN
A8_RECOVERY_SOURCE = NONE_FOUND
A8_SHA256 = NONE

EXACT_OR_FREEZE_MATCHED_SOURCE_READY_COUNT = 7
STRONG_NONEXACT_DOCKER_CANDIDATE_COUNT = 3
SAFE_CANDIDATE_BODY_FOUND_COUNT = 10
EXACT_LATEST_INTENT_UNRESOLVED_COUNT = 2
UNRESOLVED_SOURCE_COUNT = 2
UNRESOLVED_TARGETS = A3_EXACT_FREEZE_BODY,A8
ALL_11_RECOVERY_READY = NO

SOURCE_RECOVERY_PERFORMED = NO
PRODUCT_SOURCE_FILES_CHANGED_THIS_CONTROL = 0
TEST_FILES_CHANGED_THIS_CONTROL = 0
DOCUMENTATION_REPORT_CREATED = YES
FORENSIC_TEMP_CREATED = YES
FORENSIC_DOCKER_OBJECT_CREATED = YES
FORENSIC_DOCKER_OBJECT_STARTED = NO
GIT_MUTATIONS = 0
DATABASE_WRITES_THIS_CONTROL = 0
OFFICIAL_DB_WRITES = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
BUSINESS_API_MUTATIONS = 0

GATE = PARTIAL_EXTERNAL_SOURCE_RECOVERY_CANDIDATES_FOUND_REMAINING_SOURCES_UNRESOLVED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_A3_FREEZE_OR_ALTERNATE_DECISION_AND_PROVIDE_A8_EXACT_SOURCE_BEFORE_ANY_CONTROLLED_RECOVERY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP.** لا استعادة مصدر، ولا تنفيذ Migration، ولا تعديل Product/DB، ولا بدء Control لاحق تم تنفيذه. يلزم Owner review وقرار مصدر صريح قبل أي controlled recovery.
