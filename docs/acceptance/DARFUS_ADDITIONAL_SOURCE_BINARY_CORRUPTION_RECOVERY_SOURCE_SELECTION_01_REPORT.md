# DARFUS ERP — Additional Source Binary Corruption Recovery Source Selection Report

أُنجز هذا الـControl كفحص forensic للقراءة فقط. أُعيد إثبات تلف الملفات الثمانية، وفُحصت مرشحات HEAD وIndex وstash وWorkspace A/B والنسخ الاحتياطية وSource Freeze وGit unreachable blobs، ثم روجعت دلالات المرشحات الصالحة والمستهلكون. لم تتم استعادة أي ملف، ولم يتغير مصدر المنتج أو قاعدة البيانات.

**Control ID:** `DARFUS-ADDITIONAL-SOURCE-BINARY-CORRUPTION-RECOVERY-SOURCE-SELECTION-01`  
**Mode:** `READ_ONLY_FORENSIC_RECOVERY_SOURCE_SELECTION_FOR_ADDITIONAL_8_FILES_ONLY`  
**Project:** `I:\WORK\jewellery-erp-master`  
**Official DB:** `darfus_erp`  
**Date:** `2026-08-31`

## 1. Executive Summary

هذا التقرير يغطي الملفات الثمانية الإضافية فقط، مع ربطها بتقرير التلف السابق الذي أثبت إجمالي 11 ملف مصدر تالفًا.

| النتيجة | العدد | الدليل |
|---|---:|---|
| ملفات إضافية فُحصت | 8 | قائمة الأهداف في هذا التقرير |
| ملفات إضافية تلفها مُعاد إثباته | 8 | SHA-256، invalid UTF-8، NUL، و`node --check` فاشل |
| مرشحات HEAD/Index صالحة نحويًا | 5 | A2 وA3 وA5 وA6 وA7 |
| مرشحات HEAD/Index مطابقة للـSource Freeze | 4 | A2 وA5 وA6 وA7 |
| مرشح صالح لكن غير مطابق لحالة الـSource Freeze | 1 | A3؛ الـmanifest يسجل نسخة modified بحجم 10224، بينما HEAD بحجم 9708 |
| أهداف بلا مرشح مصدر صالح | 3 | A1 وA4 وA8؛ غير موجودة في HEAD/Index/stash/النسخ المعروفة |
| تطابقات stash | 0 | `STASH_TARGET_HITS=0` من الفحص المخصص |
| نسخ مصدر مطابقة في مجلدات backup المعروفة | 0 | بحث exact basename/path |
| تطابقات Git unreachable بالحجم المستهدف | 0 | فحص 623 unreachable blob |

**الخلاصة:** توجد مرشحات قابلة للمراجعة لـA2 وA5 وA6 وA7، ومرشح أقدم قابل للقراءة فقط لـA3، لكن A1 وA4 وA8 بلا مصدر استعادة مثبت. لذلك لا يمكن اعتماد استعادة جميع الملفات الإضافية، ولا يمكن إعلان جاهزية استعادة جميع الملفات الـ11.

**Recovery performed:** `NO`  
**Product/database mutation:** `NO`  
**Gate:** `BLOCKED_ADDITIONAL_SOURCE_RECOVERY_SOURCE_UNRESOLVED`

## 2. Upstream Accepted Evidence

تم استخدام الأدلة السابقة لفهم الحالة فقط، دون اعتبارها بديلًا عن مصدر ملف صالح:

| Evidence | استخدامه | حد السلطة |
|---|---|---|
| `docs/acceptance/DARFUS_SOURCE_FILE_BINARY_CORRUPTION_FORENSIC_AND_RECOVERY_SOURCE_SELECTION_01_REPORT.md` | يثبت الأهداف الثلاثة الأصلية، ونتيجة الـ11 ملفًا، ويقدم سياقًا للتلف | ليس نسخة مصدر للاستعادة |
| `backend/reports/local-final-source-freeze-manifest-01-20260815T150848+0300.md` | يثبت SHA/الحجم/حالة المصدر لبعض الأهداف في وقت الـfreeze | metadata فقط؛ لا يحتوي body المصدر |
| `backend/reports/DARFUS-INVENTORY-SOURCE-MIGRATION-RECONCILIATION-01D-R2A-REPORT.md` | دعم دلالي تاريخي لمسار barcode history | تقرير تاريخي، وليس مرشحًا قابلًا للاستعادة |
| `C:\DARFUS-DIAGNOSTIC\additional-audit-candidates.cjs` ومخرجاته | فحص A/B وstash وhash وUTF-8 وparse | أداة فحص خارج المستودع، لا تعدل المستودع |
| `C:\DARFUS-DIAGNOSTIC\fsck-target-scan.cjs` ومخرجاته | فحص blobs غير المرتبطة بدون `--lost-found` أو كتابة Git | لا يعيد أي object إلى المستودع |

الـSource Freeze نفسه يصف A2 وA5 وA6 وA7 كـ`CLEAN` بالـhash المطابق لـHEAD، ويصف A3 كـ`MODIFIED` بحجم/hash مختلفين عن HEAD. A1 وA4 وA8 غير موجودة في الأسطر المصدرية المفحوصة للـmanifest.

## 3. Exact Additional 8 Targets

| ID | Exact path | Current size | Current SHA-256 | Last write (UTC) | Current status |
|---|---|---:|---|---|---|
| A1 | `backend/migrations/20260818010000-create-inventory-master-data-bootstrap-state.js` | 1852 | `DCC77BD8258D5360A275E08958021702A2E9800F021C4953B694035C5EA88919` | 2026-08-18 06:29:44.829Z | untracked / corrupt |
| A2 | `backend/src/config/barcode-defaults.js` | 2565 | `CC0D9D40091157CB604E35E91F7226CD961FA3E8F77B2ED80F229F9EDA790C24` | 2026-08-18 06:34:07.931Z | tracked hash mismatch / corrupt |
| A3 | `backend/src/services/barcode-identity.service.js` | 15956 | `2C3B2DEAC59BAB61EA7DDEABBCD4F70134FFCD8F3857FBA63D0702DF19C80EDD` | 2026-08-22 17:06:31.883Z | tracked hash mismatch / corrupt |
| A4 | `backend/src/services/inventory-master-data-baseline.js` | 78198 | `82D45D0983CEE7DE3852813EBD68BFD104E561B41FF206FCFE943DAF23221588` | 2026-08-18 06:43:15.878Z | untracked / corrupt |
| A5 | `scripts/bootstrap-first-super-admin.js` | 5950 | `684FC2F9B056774618D034A02B7217643D51470D78FA88AD41D7B82BE1AF679E` | 2026-07-21 10:18:01.141Z | Git status blank but content hash mismatch / corrupt |
| A6 | `scripts/verify-apply-customer-credit.js` | 10771 | `557242D06A3A99E17BA9EC453187B8E53DC43F4C0C4C97FB4C0C4B8803A2C52B` | 2026-07-17 22:09:20.959Z | Git status blank but content hash mismatch / corrupt |
| A7 | `scripts/verify-market-launch-safety-containment.js` | 8399 | `D364CA6A1A265340E519ED06CB35CCEE8953BAEEE56EE8D0C89B38AB0A00AA1F` | 2026-07-21 10:43:25.019Z | Git status blank but content hash mismatch / corrupt |
| A8 | `tests/asset-final-closure.test.cjs` | 5026 | `CBC7D12B2D902802B4C12F63BC287CCBC97FCF8D55DF822CDEE3E815040E7C5C` | 2026-08-26 08:51:03.685Z | untracked / corrupt |

The blank Git status for A5–A7 is not treated as clean: direct current-file SHA-256 differs from the valid committed candidate. No index refresh was run because it would mutate Git index state.

## 4. Repository Baseline

| Field | Observed value | Evidence |
|---|---|---|
| `WORKTREE_DIR` | `I:\WORK\jewellery-erp-master` | command working directory |
| `CURRENT_BRANCH` | `main` | `git branch --show-current` |
| `HEAD_SHA` | `1657b0e9ba580faef69be48f04637835c201b521` | `git rev-parse HEAD` |
| `WORKTREE_DIRTY` | `YES` | `git status --short` returned entries |
| `git status --short` lines | 1049 | read-only default status enumeration |
| `TRACKED_MODIFIED_COUNT` | 147 | status entries excluding `??` |
| `UNTRACKED_COUNT` | 902 | status entries with `??` |
| `STASH_COUNT` | 11 | `git stash list` |
| Current migration JS count | 95 | read-only directory count |
| README historical migration count | 81 | `README.md` lines 49/176/238; not treated as current source fact |
| Source Freeze manifest | FOUND | `backend/reports/local-final-source-freeze-manifest-01-20260815T150848+0300.md` |
| `darfus_erp` write authorization | NO | Control guardrail and AGENTS.md |

The dirty worktree is pre-existing context. This Control did not clean, reset, restore, stage, unstage, stash, or otherwise normalize it.

## 5. Current Corruption Reconfirmation

All eight current files exhibit the same leading 32-byte corruption signature:

`24 1A 9C 92 6D 85 CE 6D 6F 93 4C D2 44 FC DC 3B 98 25 67 CF 3F 77 EA C1 C5 B7 19 F8 16 EE F9 6F`

| ID | UTF-8 valid | NUL bytes | Printable ratio | `node --check` | Result |
|---|---:|---:|---:|---|---|
| A1 | NO | 18 | 0.386069 | FAIL | corrupt |
| A2 | NO | 25 | 0.382846 | FAIL | corrupt |
| A3 | NO | 156 | 0.382740 | FAIL | corrupt |
| A4 | NO | 764 | 0.382925 | FAIL | corrupt |
| A5 | NO | 58 | 0.383866 | FAIL | corrupt |
| A6 | NO | 105 | 0.382973 | FAIL | corrupt |
| A7 | NO | 81 | 0.383379 | FAIL | corrupt |
| A8 | NO | 50 | 0.383605 | FAIL | corrupt |

The result is consistent with the upstream bounded scan that found 11 corrupted source files total, including the three earlier targets. This is evidence of a corruption family, not evidence of the actor or exact event time.

## 6. HEAD Candidates

`HEAD` was inspected read-only with an explicit safe-directory override. Validity means UTF-8 and `node --check` passed for the candidate body; it does not mean the candidate is necessarily the latest intended dirty-worktree content.

| ID | HEAD candidate | SHA-256 | Size | UTF-8 / parse | Freeze relation |
|---|---|---|---:|---|---|
| A1 | ABSENT | — | — | — | no HEAD object |
| A2 | PRESENT | `B31D45AA7FE0CE11CA20E2176282C8E069B51DA44E446CD256CAC43E7C22CDD0` | 3081 | YES / PASS | exact match to manifest CLEAN |
| A3 | PRESENT | `E7E30B91DD05B1539A909431EAAA5B76A327EC1B9A11A5C0C03B4512EE0A9A42` | 9708 | YES / PASS | does not match manifest MODIFIED candidate |
| A4 | ABSENT | — | — | — | no HEAD object |
| A5 | PRESENT | `13F555466C333912952BBC1F6120B405B7ACA4A793E2C4D9C74D69E7C76DC968` | 5950 | YES / PASS | exact match to manifest CLEAN |
| A6 | PRESENT | `59AC21EB91FDBD4C841B4938F3C89DF8340E135A5F46A562FD97DD6241C21254` | 10771 | YES / PASS | exact match to manifest CLEAN |
| A7 | PRESENT | `84402580783E6EAE96D1E8485FD25B5256073DD576409D50794CEF9ED014BD2F` | 8399 | YES / PASS | exact match to manifest CLEAN |
| A8 | ABSENT | — | — | — | no HEAD object |

Git path history confirms no committed object for A1, A4, or A8. For A3, the latest committed source is `b0e5fa7` at 2026-08-04 11:12:04 +03; the later Source Freeze recorded a different modified worktree body.

## 7. Index Candidates

| ID | Index candidate | Relation to HEAD | Validity |
|---|---|---|---|
| A1 | ABSENT | no index entry | unresolved |
| A2 | PRESENT, `B31D45AA7FE0CE11CA20E2176282C8E069B51DA44E446CD256CAC43E7C22CDD0` | same as HEAD | UTF-8 / parse PASS |
| A3 | PRESENT, `E7E30B91DD05B1539A909431EAAA5B76A327EC1B9A11A5C0C03B4512EE0A9A42` | same as HEAD | UTF-8 / parse PASS |
| A4 | ABSENT | no index entry | unresolved |
| A5 | PRESENT, `13F555466C333912952BBC1F6120B405B7ACA4A793E2C4D9C74D69E7C76DC968` | same as HEAD | UTF-8 / parse PASS |
| A6 | PRESENT, `59AC21EB91FDBD4C841B4938F3C89DF8340E135A5F46A562FD97DD6241C21254` | same as HEAD | UTF-8 / parse PASS |
| A7 | PRESENT, `84402580783E6EAE96D1E8485FD25B5256073DD576409D50794CEF9ED014BD2F` | same as HEAD | UTF-8 / parse PASS |
| A8 | ABSENT | no index entry | unresolved |

There is no index-only recovery source. No index refresh or staging operation was performed.

## 8. Stash Candidates

The repository has 11 stashes. A read-only candidate probe queried each stash for each of the eight exact paths.

`STASH_TOTAL = 11`  
`STASH_TARGET_HITS = 0`

No stash body, patch, or tree contains any of A1–A8. Existing stashes were not applied, dropped, or modified.

## 9. Workspace A

Workspace A: `C:\DARFUS-DIAGNOSTIC\workspace-a-same-install`

| Result | Evidence |
|---|---|
| All eight files present | candidate probe |
| All eight SHA-256 values equal current corrupted values | exact hash comparison |
| All eight invalid UTF-8 | candidate probe |
| All eight `node --check` FAIL | candidate probe |
| Valid recovery candidate count | 0 |

Workspace A is a replicated corrupted snapshot, not an independent source.

## 10. Workspace B

Workspace B: `C:\DARFUS-DIAGNOSTIC\workspace-b-fresh-install`

| Result | Evidence |
|---|---|
| All eight files present | candidate probe |
| All eight SHA-256 values equal current corrupted values | exact hash comparison |
| All eight invalid UTF-8 | candidate probe |
| All eight `node --check` FAIL | candidate probe |
| Valid recovery candidate count | 0 |

Workspace B is also a replicated corrupted snapshot. It is not a fresh valid source for these files.

## 11. Backup / Source-Freeze Evidence

### Exact source-copy search

The following known roots were searched for exact target basenames/paths:

- `backups`
- `docs/acceptance`
- `backend/acceptance-artifacts`
- `backend/reports`
- `audit-reports`
- `.tmp-c2b-revision`

**Exact source copies found:** `0`.

The `backups` tree contains acceptance data/evidence artifacts, but no exact source file for A1–A8. Reports mentioning a path or hash were not promoted to source candidates.

### Source Freeze manifest

The manifest `backend/reports/local-final-source-freeze-manifest-01-20260815T150848+0300.md` contains:

| ID | Manifest entry | Meaning |
|---|---|---|
| A2 | `B31D45...CDD0`, size 3081, `CLEAN` | exact valid HEAD/Index candidate |
| A3 | `E8BC622BE5EA400630061C2F916B689384C32FC132ADC8B65A9D19154ED51928`, size 10224, `MODIFIED` | a valid-looking freeze-state metadata record, but no body copy was found |
| A5 | `13F555...DC968`, size 5950, `CLEAN` | exact valid HEAD/Index candidate |
| A6 | `59AC21...1254`, size 10771, `CLEAN` | exact valid HEAD/Index candidate |
| A7 | `844025...BD2F`, size 8399, `CLEAN` | exact valid HEAD/Index candidate |
| A1/A4/A8 | no exact source entry found | no freeze candidate proven |

The manifest is provenance evidence only. It cannot restore A3’s 10224-byte body.

### Git unreachable object probe

`git fsck --no-reflogs --unreachable` was used read-only. It found 623 unreachable blobs. A batch size filter covering the eight current target sizes, the A3 manifest size 10224, and the prior primary target sizes found:

`UNREACHABLE_SIZE_MATCH_CANDIDATES = 0`

No `--lost-found`, object write, ref update, or checkout was performed.

## 12. Migration Semantic Review

### A1 — `20260818010000-create-inventory-master-data-bootstrap-state.js`

The current A1 body is not parseable and no valid HEAD/Index/stash/backup candidate exists. Therefore the exact `up`/`down` operations, table shape, columns, constraints, indexes, transaction behavior, and forward-only policy cannot be proven from a valid source body.

The filename is referenced by the current migration directory and the repository migration runner loads the directory through Umzug:

- `backend/scripts/migrate-safe.js:107-116` creates a runner with `path.join(__dirname, "../migrations")`.
- `backend/scripts/migrate-safe.js:171-189` enumerates pending migration files and only executes after explicit target/list checks.

This proves the corrupted A1 is in the migration discovery surface; it does not prove its schema semantics. No migration command was run and no database was touched.

**A1 semantic status:** `UNRESOLVED_SOURCE_BODY`  
**A1 recovery status:** `NO_SAFE_RECOVERY_SOURCE_PROVEN`

## 13. Barcode Defaults Review

### A2 — `backend/src/config/barcode-defaults.js`

The HEAD/Index candidate is valid and exactly matches the Source Freeze clean hash.

Proven candidate semantics from the HEAD body:

- line 3–5: bootstrap/fallback taxonomy and client inventory codes `GW`, `GP`, `DD`, `GS`, `PL`.
- line 7–14: inventory descriptors including client-approved profiles and the provisional `WT` extension.
- line 16–23: client item-code table, including `ERG` Earrings and `NCK` Necklace.
- line 25–46: immutable default descriptors, approval/provisional flags, allowed inventory codes, and sort order.
- line 48–51: `module.exports` of both default catalog arrays.

Current consumers found by read-only `rg` include:

- `backend/migrations/20260710000000-barcode-inventory-foundation.js`
- `backend/src/services/inventory-master-data-bootstrap.service.js`
- `backend/src/services/inventory-master-data-manifest.js`
- `backend/seeders/client-demo/index.js`
- `backend/scripts/provision-master-data-01d.js`
- `scripts/verify-barcode-inventory-foundation.js`
- barcode/master-data focused tests

The corrupted current body cannot be required safely, but the clean HEAD/Index candidate has proven syntax and export compatibility with these import paths. Candidate semantics are reviewed as source evidence only; no runtime execution was performed.

**A2 semantic status:** `PROVEN_FOR_HEAD_INDEX_CANDIDATE`  
**A2 freeze status:** `EXACT_MATCH`

## 14. Barcode Identity Review

### A3 — `backend/src/services/barcode-identity.service.js`

The HEAD/Index candidate is valid UTF-8 and parseable, but it is not the source-freeze body:

- HEAD/Index: size 9708, SHA-256 `E7E30B91...0A9A42`.
- Source Freeze: size 10224, SHA-256 `E8BC622B...51928`, status `MODIFIED`.
- Current corrupted body: size 15956, invalid UTF-8/NUL.

The valid HEAD candidate exposes and implements, at the cited lines:

- lines 5–7: code, karat, and serial bounds.
- lines 42–50: barcode format `inventory + item + two-digit karat + six-digit serial`.
- lines 53–67: company-scoped database settings reads.
- lines 70–102: PostgreSQL upsert sequence scope on `(company_id, inventory_code, item_code, karat_code)` with transaction handling.
- lines 105–118: asset/sequence usage checks.
- lines 153–214: asset barcode generation, allowed-code checks, collision check, and `barcodeRevision: 1`.
- lines 216–226: public exports.

Current consumers include the ERP routes, profile routes, CGP inventory consumer, seeder, barcode tests, and profile-specific tests. A historical R2A report describes a later barcode-history-aware implementation, while the current HEAD candidate shown above does not contain the same history lookup body. This is a semantic warning, not a basis for reconstructing the missing 10224-byte freeze body.

**A3 semantic status:** `VALID_HEAD_CANDIDATE_BUT_FREEZE_STATE_UNPROVEN`  
**A3 freeze status:** `MISMATCH_REQUIRES_OWNER_REVIEW`  
**A3 direct recovery:** not authorized by this Control

## 15. Inventory Baseline Review

### A4 — `backend/src/services/inventory-master-data-baseline.js`

The current A4 body is corrupt and untracked. It is absent from HEAD and Index, absent from all stashes, absent from Workspace A/B as a valid source, and absent from exact backup/source-copy search.

Current valid source consumers prove the dependency boundary:

- `backend/src/services/inventory-master-data-manifest.js:7` imports `V1_PROFILE_MASTER_DATA_ROWS` from A4.
- `backend/src/services/inventory-master-data-manifest.js:79-90` maps the baseline rows into the manifest.
- `backend/src/services/inventory-master-data-bootstrap.service.js:6-16` consumes the manifest and its baseline counts.
- `backend/tests/inventory-master-data-bootstrap-r4.test.cjs:4` requires A4 directly.

The current manifest also records baseline metadata such as `profileMasterData: 502` at line 98, but that is not a substitute for A4’s complete row body, labels, categories, ordering, and exact authority data.

**A4 semantic status:** `UNRESOLVED_SOURCE_BODY`  
**A4 recovery status:** `NO_SAFE_RECOVERY_SOURCE_PROVEN`  
**Do not:** reconstruct rows from the importer or reports.

## 16. Super Admin Bootstrap Review

### A5 — `scripts/bootstrap-first-super-admin.js`

The HEAD/Index candidate is valid and exactly matches the Source Freeze clean hash.

Proven candidate safeguards and semantics:

- lines 8–11: explicit confirmation flag and local development target `darfus_erp` at port 5432.
- lines 24–30: target resolution rejects non-development/non-local/non-official target combinations.
- lines 37–43: explicit email and confirmation arguments are required.
- lines 49–54: authentication and transaction/row lock are used.
- lines 60–73: existing active Super Admin state is checked before changes.
- lines 75–97: password hash preservation and session-version protection are checked.
- lines 83–94: account type/session version update and session revocation occur inside the transaction.
- lines 99–119: audit record is written with the before/after identity and password fingerprint.

This is a mutating bootstrap script in its function, but it was not executed in this Control. Its candidate is a source selection result, not authorization to run it against any database.

**A5 semantic status:** `PROVEN_FOR_HEAD_INDEX_CANDIDATE`  
**A5 freeze status:** `EXACT_MATCH`

## 17. Customer Credit Verification Review

### A6 — `scripts/verify-apply-customer-credit.js`

The HEAD/Index candidate is valid and exactly matches the Source Freeze clean hash.

It is a static verifier: it reads source/package files, asserts route/permission/idempotency/accounting contracts, and runs syntax checks. The reviewed candidate asserts, among other things:

- protected customer-credit routes and employee-aware permissions;
- `Idempotency-Key`, request hashing, claim, conflict/replay, and success handling;
- row locks and credit ledger availability checks;
- `Payment.create` with `customer_credit` and journal/credit links;
- no `CashTransaction.create` or cash-account fallback for this flow;
- no customer-credit application in POS/return/exchange paths;
- frontend stable signature/key behavior;
- no unrelated migration/product-scope changes.

No DB connection or business mutation is performed by this verifier candidate itself. That characterization is source-level evidence only; the current worktree body remains corrupt and was not run.

**A6 semantic status:** `PROVEN_FOR_HEAD_INDEX_CANDIDATE`  
**A6 freeze status:** `EXACT_MATCH`

## 18. Market Launch Safety Review

### A7 — `scripts/verify-market-launch-safety-containment.js`

The HEAD/Index candidate is valid and exactly matches the Source Freeze clean hash.

It is a static safety verifier that checks:

- payroll/attendance/payslip permission guards;
- generic mutation containment for assets, products, stock movements, transfers, purchase orders, and cash transactions;
- explicit treasury account and branch-scope validation;
- branch-scope forbidden/invalid errors;
- guarded employee/supplier sensitive reads and document mutations;
- treasury UI counter-account requirements and AR/EN labels.

Important compatibility note: the candidate contains a fixed assertion for a historical migration count of 48 (`lines 27–33`). The current migration directory contains 95 JavaScript files. This indicates the verifier is historical/stale relative to the present dirty worktree and must not be treated as current runtime proof without a separate contract-alignment decision. It does not invalidate its candidacy as the clean Source Freeze file, but it increases the risk of blindly restoring it as the current verifier.

**A7 semantic status:** `PROVEN_SOURCE_CANDIDATE_WITH_HISTORICAL_ASSERTION`  
**A7 freeze status:** `EXACT_MATCH`

## 19. Asset Closure Test Review

### A8 — `tests/asset-final-closure.test.cjs`

The current A8 test file is corrupt and untracked. It is absent from HEAD and Index, absent from all stashes, absent from valid Workspace A/B copies, and absent from exact source-copy search.

The only current repository evidence located for the filename is a historical acceptance artifact:

`backend/acceptance-artifacts/pearl-jewellery/DARFUS-OWNER-AUTHORIZED-STRICTLY-INSTRUMENTED-PEARL-LIVE-RETRY/30-post-live-regression.json`

That artifact records that the filename was included in a historical test command. It does not contain the test body and cannot prove assertions, fixtures, dependencies, or intended current semantics.

**A8 semantic status:** `UNRESOLVED_SOURCE_BODY`  
**A8 recovery status:** `NO_SAFE_RECOVERY_SOURCE_PROVEN`

## 20. Import / Consumer Compatibility

| ID | Consumer evidence | Impact of current corruption | Candidate compatibility |
|---|---|---|---|
| A1 | Umzug migration runner scans `backend/migrations` via `migrate-safe.js:107-115` | migration discovery/semantic loading cannot be safely proven | no valid candidate |
| A2 | barcode migration, bootstrap service, manifest, seeder, provisioning script, barcode verifier/tests | `require`/runtime and source verifiers cannot safely load current bytes | HEAD/Index exports match known consumers |
| A3 | ERP/profile routes, CGP inventory consumer, seeder, barcode and profile tests | barcode identity service cannot safely load current bytes | HEAD/Index loads, but freeze-state semantics differ |
| A4 | inventory master-data manifest/bootstrap service and R4 tests | master-data manifest/bootstrap cannot safely load complete baseline | no valid candidate |
| A5 | bootstrap config test and `verify-simple-super-admin-access.js` | bootstrap contract tests/source checks cannot safely load current bytes | HEAD/Index valid and freeze-matched |
| A6 | package script `verify:apply-customer-credit` and dependent verifiers | static verification command cannot safely load current bytes | HEAD/Index valid and freeze-matched |
| A7 | package script `verify:market-launch-safety-containment` | safety-containment verification cannot safely load current bytes | HEAD/Index valid and freeze-matched; historical count assertion noted |
| A8 | historical regression command artifact; no valid current import found | historical asset-closure proof cannot be reproduced from current body | no valid candidate |

No import or consumer was edited. No test or verifier was executed as a substitute for source recovery.

## 21. Corruption Timeline

The evidence supports this bounded timeline, without overclaiming the exact corruption event:

1. The current `HEAD` is `1657b0e9...` from 2026-08-04 11:38:43 +03.
2. The Source Freeze manifest was recorded on 2026-08-15 15:08:48 +03. It records valid clean hashes for A2, A5, A6, A7 and a distinct modified valid-looking hash for A3.
3. A1 and A4 have current filesystem times on 2026-08-18; A3 on 2026-08-22; A8 on 2026-08-26. Filesystem mtime is not treated as the corruption event time.
4. Current A1–A8 share the same corruption prefix and invalid-UTF8/NUL pattern.
5. Workspace A/B replicate the same corrupted bytes.
6. All 11 stashes have zero exact target hits.
7. No exact source copies were found in known backup/report/acceptance locations.
8. No matching target-size Git-unreachable blobs were found.

The evidence does not identify the actor, operation, or exact moment that replaced the source bytes.

## 22. Corruption Family Consistency

**Family consistency:** `YES`.

The additional eight have the same 32-byte leading signature as the three primary corrupted sources in the upstream report. All eight have invalid UTF-8, NUL bytes, and `node --check` failure. This supports one corruption family affecting 11 source files, while not proving whether the operation was one event or multiple events using the same bad payload.

No source file was repaired or normalized to make the family disappear.

## 23. Per-File Candidate Matrices

Legend: `CORRUPT` = current bytes fail integrity; `VALID` = UTF-8 and parse pass; `ABSENT` = no candidate; `FREEZE-MATCH` = exact hash/size match to the manifest; `FREEZE-MISMATCH` = a valid candidate exists but is not the manifest state.

### A1 — Migration

| Candidate | Result | Evidence | Selection outcome |
|---|---|---|---|
| Current | CORRUPT; 1852; `DCC77BD8...8919` | invalid UTF-8, 18 NUL, parse FAIL | cannot recover |
| HEAD | ABSENT | `git ls-tree` no path | unresolved |
| Index | ABSENT | no index entry | unresolved |
| Stash | ABSENT | 0/11 hits | unresolved |
| Workspace A | CORRUPT; exact current hash | candidate probe | not a source |
| Workspace B | CORRUPT; exact current hash | candidate probe | not a source |
| Backup / freeze copy | ABSENT | exact search; no manifest row | unresolved |

**Candidate verdict:** no safe source proven.

### A2 — Barcode defaults

| Candidate | Result | Evidence | Selection outcome |
|---|---|---|---|
| Current | CORRUPT; 2565; `CC0D9D40...90C24` | invalid UTF-8, 25 NUL, parse FAIL | preserve as forensic evidence |
| HEAD | VALID; 3081; `B31D45AA...CDD0` | `node --check` PASS | candidate |
| Index | VALID; same as HEAD | exact hash | candidate |
| Stash | ABSENT | 0/11 hits | none |
| Workspace A | CORRUPT; exact current hash | candidate probe | not a source |
| Workspace B | CORRUPT; exact current hash | candidate probe | not a source |
| Backup / freeze copy | manifest metadata exact; body absent | manifest line 325 | HEAD/Index supported |

**Candidate verdict:** HEAD/Index source proven; controlled merge only after Owner recovery approval.

### A3 — Barcode identity

| Candidate | Result | Evidence | Selection outcome |
|---|---|---|---|
| Current | CORRUPT; 15956; `2C3B2DEA...80EDD` | invalid UTF-8, 156 NUL, parse FAIL | preserve as forensic evidence |
| HEAD | VALID; 9708; `E7E30B91...0A9A42` | `node --check` PASS | review base only |
| Index | VALID; same as HEAD | exact hash | review base only |
| Stash | ABSENT | 0/11 hits | none |
| Workspace A | CORRUPT; exact current hash | candidate probe | not a source |
| Workspace B | CORRUPT; exact current hash | candidate probe | not a source |
| Backup / freeze copy | body absent; manifest says 10224 and `E8BC622B...51928` | manifest line 471 | exact freeze recovery unresolved |

**Candidate verdict:** no exact latest freeze-state source proven; do not blindly restore HEAD.

### A4 — Inventory baseline

| Candidate | Result | Evidence | Selection outcome |
|---|---|---|---|
| Current | CORRUPT; 78198; `82D45D09...21588` | invalid UTF-8, 764 NUL, parse FAIL | cannot recover |
| HEAD | ABSENT | `git log --all --follow` no path | unresolved |
| Index | ABSENT | no index entry | unresolved |
| Stash | ABSENT | 0/11 hits | unresolved |
| Workspace A | CORRUPT; exact current hash | candidate probe | not a source |
| Workspace B | CORRUPT; exact current hash | candidate probe | not a source |
| Backup / freeze copy | ABSENT | exact search; no manifest row | unresolved |

**Candidate verdict:** no safe source proven.

### A5 — First Super Admin bootstrap

| Candidate | Result | Evidence | Selection outcome |
|---|---|---|---|
| Current | CORRUPT; 5950; `684FC2F9...F679E` | invalid UTF-8, 58 NUL, parse FAIL | preserve as forensic evidence |
| HEAD | VALID; 5950; `13F55546...DC968` | `node --check` PASS | candidate |
| Index | VALID; same as HEAD | exact hash | candidate |
| Stash | ABSENT | 0/11 hits | none |
| Workspace A | CORRUPT; exact current hash | candidate probe | not a source |
| Workspace B | CORRUPT; exact current hash | candidate probe | not a source |
| Backup / freeze copy | manifest metadata exact; body absent | manifest line 1106 | HEAD/Index supported |

**Candidate verdict:** HEAD/Index source proven; controlled merge only after Owner recovery approval.

### A6 — Customer credit verifier

| Candidate | Result | Evidence | Selection outcome |
|---|---|---|---|
| Current | CORRUPT; 10771; `557242D0...C52B` | invalid UTF-8, 105 NUL, parse FAIL | preserve as forensic evidence |
| HEAD | VALID; 10771; `59AC21EB...1254` | `node --check` PASS | candidate |
| Index | VALID; same as HEAD | exact hash | candidate |
| Stash | ABSENT | 0/11 hits | none |
| Workspace A | CORRUPT; exact current hash | candidate probe | not a source |
| Workspace B | CORRUPT; exact current hash | candidate probe | not a source |
| Backup / freeze copy | manifest metadata exact; body absent | manifest line 1118 | HEAD/Index supported |

**Candidate verdict:** HEAD/Index source proven; controlled merge only after Owner recovery approval.

### A7 — Market-launch safety verifier

| Candidate | Result | Evidence | Selection outcome |
|---|---|---|---|
| Current | CORRUPT; 8399; `D364CA6A...AA1F` | invalid UTF-8, 81 NUL, parse FAIL | preserve as forensic evidence |
| HEAD | VALID; 8399; `84402580...BD2F` | `node --check` PASS | candidate |
| Index | VALID; same as HEAD | exact hash | candidate |
| Stash | ABSENT | 0/11 hits | none |
| Workspace A | CORRUPT; exact current hash | candidate probe | not a source |
| Workspace B | CORRUPT; exact current hash | candidate probe | not a source |
| Backup / freeze copy | manifest metadata exact; body absent | manifest line 1166 | HEAD/Index supported; stale-count caution |

**Candidate verdict:** HEAD/Index source proven as freeze source; historical migration-count assertion requires later verifier review.

### A8 — Asset final closure test

| Candidate | Result | Evidence | Selection outcome |
|---|---|---|---|
| Current | CORRUPT; 5026; `CBC7D12B...E7C5C` | invalid UTF-8, 50 NUL, parse FAIL | cannot recover |
| HEAD | ABSENT | `git log --all --follow` no path | unresolved |
| Index | ABSENT | no index entry | unresolved |
| Stash | ABSENT | 0/11 hits | unresolved |
| Workspace A | CORRUPT; exact current hash | candidate probe | not a source |
| Workspace B | CORRUPT; exact current hash | candidate probe | not a source |
| Backup / freeze copy | ABSENT; only historical command reference | artifact JSON has no body | unresolved |

**Candidate verdict:** no safe source proven.

## 24. Per-File Recovery Recommendations

No recommendation below authorizes action in this Control. Each recommendation is a source-selection disposition for a future Owner-approved recovery control.

| ID | Recommendation | Why | Required future safety condition |
|---|---|---|---|
| A1 | `NO_SAFE_RECOVERY_SOURCE_PROVEN` | untracked, corrupt, absent from HEAD/Index/stashes/backups | obtain an approved external source body; do not reconstruct migration semantics |
| A2 | `CONTROLLED_MERGE_FROM_HEAD_OR_INDEX` | valid candidate, exact manifest match, known consumers | preserve current corrupt bytes, hash before/after, Owner approval, no automatic checkout |
| A3 | `HEAD_INDEX_REVIEW_BASE_ONLY` | valid candidate exists but manifest records a different modified body and semantic history risk | obtain freeze body or Owner-approved diff decision before selecting recovery content |
| A4 | `NO_SAFE_RECOVERY_SOURCE_PROVEN` | untracked, corrupt, absent from all inspected source channels | obtain approved external baseline source; do not rebuild rows from imports/reports |
| A5 | `CONTROLLED_MERGE_FROM_HEAD_OR_INDEX` | valid candidate, exact manifest match, guarded bootstrap semantics | source-only recovery approval; never execute bootstrap as part of recovery |
| A6 | `CONTROLLED_MERGE_FROM_HEAD_OR_INDEX` | valid candidate, exact manifest match, static verifier source | review current test contract before any later execution |
| A7 | `CONTROLLED_MERGE_FROM_HEAD_OR_INDEX_WITH_TEST_CONTRACT_REVIEW` | valid candidate, exact manifest match, but historical migration count is 48 vs current 95 | do not use old assertion as current proof; separate test-alignment decision |
| A8 | `NO_SAFE_RECOVERY_SOURCE_PROVEN` | untracked, corrupt, absent from all inspected source channels; only artifact reference exists | obtain exact approved test source or declare it unrecoverable; do not invent assertions |

## 25. All-11 Recovery Readiness

The three primary targets were previously proven to have valid HEAD/Index candidates by the upstream control. Combining that result with this control:

| Group | Count | Readiness |
|---|---:|---|
| Primary files with upstream valid recovery candidates | 3 | candidate proven, controlled merge still requires approval |
| Additional files with freeze-matched HEAD/Index candidates | 4 | candidate proven: A2, A5, A6, A7 |
| Additional file with valid but freeze-mismatched candidate | 1 | A3 requires Owner/source-freeze decision |
| Additional files with no valid source | 3 | A1, A4, A8 unresolved |
| Total corrupted source files | 11 | no all-11 exact recovery readiness |

`ALL_11_RECOVERY_READY = NO`

The existence of a valid committed file is not proof that all uncommitted worktree intent is recoverable. This is material for A3 and remains a risk for every tracked target whose current bytes differ from HEAD.

## 26. Potential Work-Loss Analysis

### Proven or likely loss risks

- A1, A4, and A8 are untracked and have no valid repository candidate. Their body content is not recoverable from the inspected Git sources.
- A3 has a manifest record for a valid modified 10224-byte worktree body, but no body copy. Using the 9708-byte HEAD candidate may discard later barcode-history or other source changes.
- A2, A5, A6, and A7 have freeze-matched HEAD/Index candidates, so the clean committed source is strongly evidenced; however, the current dirty worktree may still contain unrelated changes not represented by the freeze line.
- Workspace A/B are not independent backups because they are byte-identical corrupt copies.
- A blank `git status` entry is not proof of preservation when the direct file hash differs from HEAD; the filesystem index/stat cache was not refreshed to avoid a Git mutation.

### What was not done

- No file was restored, copied into the repository, or renamed.
- No `git restore`, checkout, reset, clean, stash apply/pop/drop, add, or index refresh was run.
- No source was reconstructed from consumer code, reports, tests, or filenames.
- No database connection, migration, seed, or business API mutation was run.

## 27. Owner Decision Packet

The following decisions are required before any future recovery action:

1. **A1:** provide/approve an exact external source for `20260818010000-create-inventory-master-data-bootstrap-state.js`, or accept that migration source semantics remain unrecovered.
2. **A2:** approve a controlled merge using the freeze-matched HEAD/Index candidate, with current corrupted bytes preserved as evidence.
3. **A3:** decide whether an external freeze artifact is required. Do not treat the older HEAD/Index candidate as equivalent to the 2026-08-15 modified freeze body without a semantic diff decision.
4. **A4:** provide/approve an exact external source for `inventory-master-data-baseline.js`; no row reconstruction is safe from the manifest importer.
5. **A5:** approve controlled source recovery only; do not execute the bootstrap script as part of recovery.
6. **A6:** approve controlled source recovery, followed later by a separate decision on stale verifier/test contract alignment.
7. **A7:** approve controlled source recovery only with explicit recognition that the historical `migrationCount === 48` assertion is not current-system proof while the directory contains 95 migrations.
8. **A8:** provide/approve the exact asset closure test body; the historical command reference is insufficient.
9. **All 11:** after the unresolved sources are supplied or formally dispositioned, approve one separately named controlled recovery batch with exact pre/post SHA-256 evidence. This control itself does not authorize that batch.

## 28. Gate

### Gate decision

`GATE = BLOCKED_ADDITIONAL_SOURCE_RECOVERY_SOURCE_UNRESOLVED`

### Gate basis

- A1, A4, and A8 have no valid recovery source in current worktree, HEAD, Index, 11 stashes, Workspace A, Workspace B, known backup/source-freeze copies, or matching unreachable Git blobs.
- A3 has a valid HEAD/Index candidate but the authoritative Source Freeze metadata records a different modified body; exact latest recovery is not proven.
- Source recovery is explicitly disallowed by this Control.
- No product/database mutation occurred.

### Control outcome

This is a blocked source-selection result, not a product implementation failure and not a database-state finding. The blocker is recovery-source evidence insufficiency.

## 29. Final Tokens

```text
CURRENT_CONTROL = DARFUS-ADDITIONAL-SOURCE-BINARY-CORRUPTION-RECOVERY-SOURCE-SELECTION-01
MODE = READ_ONLY_FORENSIC_RECOVERY_SOURCE_SELECTION_FOR_ADDITIONAL_8_FILES_ONLY
PROJECT = I:\WORK\jewellery-erp-master
OFFICIAL_DATABASE = darfus_erp

ADDITIONAL_TARGET_COUNT = 8
CURRENT_CORRUPTION_RECONFIRMED = YES
ADDITIONAL_CORRUPTED_SOURCE_COUNT = 8
TOTAL_CORRUPTED_SOURCE_COUNT = 11
CORRUPTION_FAMILY_SIGNATURE_MATCH = YES

HEAD_OR_INDEX_VALID_CANDIDATE_COUNT = 5
SOURCE_FREEZE_HASH_MATCH_CANDIDATE_COUNT = 4
A3_VALID_HEAD_CANDIDATE_FREEZE_MISMATCH = YES
RECOVERY_SOURCE_UNRESOLVED_COUNT = 3
UNRESOLVED_TARGETS = A1,A4,A8

WORKSPACE_A_VALID_SOURCE_CANDIDATES = 0
WORKSPACE_B_VALID_SOURCE_CANDIDATES = 0
STASH_TARGET_HITS = 0
BACKUP_EXACT_SOURCE_COPIES_FOUND = 0
UNREACHABLE_SIZE_MATCH_CANDIDATES = 0

CURRENT_BRANCH = main
HEAD_SHA = 1657b0e9ba580faef69be48f04637835c201b521
WORKTREE_DIRTY = YES
STATUS_LINES_DEFAULT = 1049
TRACKED_MODIFIED_COUNT_DEFAULT = 147
UNTRACKED_COUNT_DEFAULT = 902
STASH_COUNT = 11
CURRENT_MIGRATION_JS_COUNT = 95

SOURCE_RECOVERY_PERFORMED = NO
SOURCE_RECOVERY_ALLOWED_THIS_CONTROL = NO
PRODUCT_SOURCE_FILES_CHANGED_THIS_CONTROL = 0
TEST_FILES_CHANGED_THIS_CONTROL = 0
DATABASE_WRITES_THIS_CONTROL = 0
OFFICIAL_DB_WRITES = 0
MIGRATIONS_EXECUTED = 0
SEEDS_EXECUTED = 0
GIT_MUTATIONS = 0

ALL_8_ADDITIONAL_RECOVERY_SOURCES_PROVEN = NO
ALL_11_RECOVERY_READY = NO
POTENTIAL_WORK_LOSS_REMAINS = YES
PRODUCT_BEHAVIOR_CHANGE_INTENDED = NO
DATABASE_CHANGE_INTENDED = NO

GATE = BLOCKED_ADDITIONAL_SOURCE_RECOVERY_SOURCE_UNRESOLVED
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_PROVIDE_OR_APPROVE_EXACT_SOURCES_FOR_A1_A4_A8_AND_RESOLVE_A3_FREEZE_MISMATCH_BEFORE_ANY_ALL_11_CONTROLLED_RECOVERY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

**STOP.** No source recovery, implementation, migration, database mutation, or automatic next batch was started.
