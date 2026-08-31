# DARFUS ERP — Source File Binary Corruption Forensic & Recovery Source Selection Report

## 1. Executive Summary

تم تنفيذ الفحص قراءة فقط. ثبت أن الملفات المصدرية الثلاثة المحددة تحتوي على بيانات ثنائية تالفة، وUTF-8 غير صالح، وNUL bytes، مع نفس البصمة التي ظهرت سابقًا في ملفات الاعتمادات ومخرجات `.next/dev`. لم يتم استرجاع أو الكتابة فوق أي ملف مصدر، ولم يتم تطبيق Git stash أو تشغيل `git restore/checkout/reset`.

وجد الفحص المحدود 11 ملف مصدر تالفًا: 3 ملفات الهدف و8 ملفات إضافية. بالنسبة للملفات الثلاثة، يقدم HEAD/Index نسخًا نصية قابلة للتحليل؛ نسخة `returns/page.tsx` موجودة أيضًا سليمة في Workspace A/B، بينما A/B يحتفظان بالنسخة التالفة للملفين الآخرين. المرشح الدلالي الأحدث هو HEAD، لكن وجود فساد في الـworktree يجعل فقدان أي تغيير غير ملتزم به غير قابل للاستبعاد. لذلك لا توجد موافقة على blind overwrite؛ الاستعادة اللاحقة يجب أن تكون controlled merge.

`GATE = PASS_SOURCE_CORRUPTION_RECOVERY_SOURCES_PROVEN_AWAITING_OWNER_RECOVERY_APPROVAL`

هذا Gate يثبت مصادر مرشحة فقط ولا يعني تنفيذ الاستعادة.

## 2. Current Proven Failure

الفشل السابق في `npm run typecheck` أثبت:

- `TS1490: File appears to be binary`.
- `TS1127: Invalid character`.
- فشل قراءة المصدر بسبب `invalid utf-8 sequence` و`failed to convert rope into string`.

الأهداف الثلاثة الحالية لها نفس أول 16 byte:

`24 1A 9C 92 6D 85 CE 6D 6F 93 4C D2 44 FC DC 3B`

الملفات المولدة `.next/dev/types/routes.d.ts` و`.next/dev/types/validator.ts` أدلة ثانوية فقط وليست مصادر استعادة في هذا Control.

## 3. Repository Baseline

| Item | Read-only result |
|---|---|
| Branch | `main` |
| HEAD | `1657b0e9ba580faef69be48f04637835c201b521` |
| Git status lines | 1049 at the forensic snapshot |
| Tracked modified/staged | 147 |
| Untracked | 902 |
| Stashes | 11 |
| Database | `darfus_erp`; not accessed for mutation |
| Git mutation | `NO` |

ملاحظة مهمة: Git porcelain لم يعرض الأهداف الثلاثة كـmodified، لكن `git hash-object` أثبت أن bytes الـworktree تختلف عن HEAD/Index. `git ls-files --debug` أظهر metadata cached تطابق الحجم/التوقيت، ولذلك لا يُستخدم Git status وحده كدليل سلامة لهذه الملفات. لم يتم تشغيل `git update-index` أو أي تصحيح للكاش.

## 4. Target File Metadata

| Target | Exists | Size | Last write (UTC) | SHA-256 | Reported Git status |
|---|---:|---:|---|---|---|
| `app/[locale]/(dashboard)/sales/returns/page.tsx` | YES | 35087 | 2026-07-30T08:11:05.463Z | `658E375E1ECFC09A0A71A2B66BC74C5DC831AFC50C7BC715CD3637B3AF12C184` | blank/stale-clean |
| `hooks/use-installments.ts` | YES | 2197 | 2026-07-06T22:39:10.051Z | `2EA72B728DC306E147554D81F5916CF79933FE5A4E719AAFF2ABE52B1647A19E` | blank/stale-clean |
| `hooks/use-invoice-print-custom-blocks.ts` | YES | 1548 | 2026-07-06T16:53:30.111Z | `C4CF4EF7DB866924711FDD39F5AB5C9B6523D6C4457AC533B75D30E96DF2E78E` | blank/stale-clean |

Independent object comparison:

- Current `git hash-object` values do not equal the corresponding Index/HEAD objects.
- Index object equals HEAD for all three.
- No target was restored or edited.

## 5. Byte / Encoding Proof

| Target | UTF8 valid | BOM | NUL count | Printable ratio | Parse result |
|---|---:|---:|---:|---:|---|
| `returns/page.tsx` | NO | NO | 342 | 0.382877 | not run after invalid UTF8 |
| `use-installments.ts` | NO | NO | 21 | 0.382340 | not run after invalid UTF8 |
| `use-invoice-print-custom-blocks.ts` | NO | NO | 15 | 0.383075 | not run after invalid UTF8 |

The common binary prefix and non-text ratios are not normal TypeScript source characteristics. The required classification is:

`CURRENT_WORKTREE_STATE = BINARY_CORRUPTED`

## 6. HEAD Candidates

HEAD was read through Git object access only; no checkout occurred.

| Target | HEAD size | HEAD SHA-256 | UTF8 | TypeScript parse | Last relevant commit |
|---|---:|---|---:|---:|---|
| `returns/page.tsx` | 35087 | `D6ABB16F207D2E112D29C253DCC2AECFBE7E1F477CE72ABECE7ACE631C2D1C7F` | YES | PASS | `2b97e6a` — 2026-07-30 11:13:23 +03, treasury branch mappings |
| `use-installments.ts` | 2197 | `CAF2A339D5AB030674274174BCC780EE7B67BC7D5D398A2AB8A205BB1788AA9C` | YES | PASS | `fcd7c97` — 2026-07-07 01:46:50 +03, financial idempotency coverage |
| `use-invoice-print-custom-blocks.ts` | 1548 | `5552A3AAD085F9E5F793576575109229FCDCA561EECF0DB33BC02939E31A3ACD` | YES | PASS | `0a41367` — 2026-07-06 20:01:17 +03, custom print text blocks |

HEAD is the latest relevant committed version found by bounded `git log --follow` for each file. It is not automatically accepted as a blind replacement because the worktree is dirty.

## 7. Index Candidates

| Target | Index exists | Index SHA-256 | UTF8 | Parse | Equals HEAD | Equals current worktree |
|---|---:|---|---:|---:|---:|---:|
| `returns/page.tsx` | YES | `D6ABB16F207D2E112D29C253DCC2AECFBE7E1F477CE72ABECE7ACE631C2D1C7F` | YES | PASS | YES | NO |
| `use-installments.ts` | YES | `CAF2A339D5AB030674274174BCC780EE7B67BC7D5D398A2AB8A205BB1788AA9C` | YES | PASS | YES | NO |
| `use-invoice-print-custom-blocks.ts` | YES | `5552A3AAD085F9E5F793576575109229FCDCA561EECF0DB33BC02939E31A3ACD` | YES | PASS | YES | NO |

Index and HEAD agree. This is strong clean-source evidence, but not proof that no newer uncommitted work existed before corruption.

## 8. Stash Candidates

All 11 stashes were inspected by object access; none was applied or popped.

| Stash refs / dates | `returns/page.tsx` | `use-installments.ts` | Print hook |
|---|---|---|---|
| `stash@{0}` — 2026-06-26 16:40:41 +03 | size 18503, SHA `3B66F6AECEC9720ED7CB6B5D2CFCAA32F2EEFE04E6B88E67CD22A7AB4714DD5C`, UTF8/PARSE PASS | size 1522, SHA `794E02C3BA9E6F3D53F8A9B4ECCE56F09D561C603F971193F8E6A5B4B1667FA3`, UTF8/PARSE PASS | absent |
| `stash@{1}` — 2026-06-26 16:33:11 +03 | same bytes as stash 0; UTF8/PARSE PASS | same bytes as stash 0; UTF8/PARSE PASS | absent |
| `stash@{2}`–`stash@{10}` — 2026-06-21 through 2026-06-23 | size 16992, SHA `1A8806FDAA7A30D0D998ACC904C1D18604DCED359037403F664F002D86BBF730`, UTF8/PARSE PASS | size 1522, SHA `794E02C3BA9E6F3D53F8A9B4ECCE56F09D561C603F971193F8E6A5B4B1667FA3`, UTF8/PARSE PASS | absent |

Stash candidates are valid syntax but materially older and incomplete relative to HEAD. No stash contains `use-invoice-print-custom-blocks.ts`.

## 9. Workspace A Candidates

Path: `C:\DARFUS-DIAGNOSTIC\workspace-a-same-install`.

| Target | Exists | SHA-256 | UTF8 | Parse | Equals current | Interpretation |
|---|---:|---|---:|---:|---:|---|
| `returns/page.tsx` | YES | `D6ABB16F207D2E112D29C253DCC2AECFBE7E1F477CE72ABECE7ACE631C2D1C7F` | YES | PASS | NO | valid snapshot, equals HEAD |
| `use-installments.ts` | YES | `2EA72B728DC306E147554D81F5916CF79933FE5A4E719AAFF2ABE52B1647A19E` | NO | not run | YES | copied corruption |
| `use-invoice-print-custom-blocks.ts` | YES | `C4CF4EF7DB866924711FDD39F5AB5C9B6523D6C4457AC533B75D30E96DF2E78E` | NO | not run | YES | copied corruption |

Workspace A was created from the current dirty worktree during the previous diagnostic phase; its per-file result is therefore valuable evidence, not an authority by itself.

## 10. Workspace B Candidates

Path: `C:\DARFUS-DIAGNOSTIC\workspace-b-fresh-install`.

| Target | Exists | SHA-256 | UTF8 | Parse | Equals A | Equals HEAD/Index |
|---|---:|---|---:|---:|---:|---:|
| `returns/page.tsx` | YES | `D6ABB16F207D2E112D29C253DCC2AECFBE7E1F477CE72ABECE7ACE631C2D1C7F` | YES | PASS | YES | YES |
| `use-installments.ts` | YES | `2EA72B728DC306E147554D81F5916CF79933FE5A4E719AAFF2ABE52B1647A19E` | NO | not run | YES | NO |
| `use-invoice-print-custom-blocks.ts` | YES | `C4CF4EF7DB866924711FDD39F5AB5C9B6523D6C4457AC533B75D30E96DF2E78E` | NO | not run | YES | NO |

Workspace B is not a clean source copy for these files; its clean `npm ci` only changed dependencies and retained the source snapshot from the copy operation.

## 11. Backup Candidates

Read-only searches were limited to `backups/`, `docs/acceptance/`, `backend/acceptance-artifacts/`, `audit-reports/`, and `.tmp-c2b-revision/`. No exact source-copy path matching any of the three targets was found.

The 13 unrelated `page.tsx` hits in backups belonged to GBW, UX8, UX10, or other routes and were not accepted as candidates. The local source-freeze manifest:

`backend/reports/local-final-source-freeze-manifest-01-20260815T150848+0300.md`

records all three clean HEAD hashes and `CLEAN|SHARED_PRODUCT_SOURCE`, but it is a hash/provenance record, not a source copy. It supports HEAD validity without becoming a replacement file.

## 12. Git History

Bounded `git log --follow` showed:

| Target | Latest relevant history | Semantic relevance |
|---|---|---|
| Returns | 2026-07-30 treasury branch mappings; 2026-07-18 employee permissions; 2026-07-15 employee operator; 2026-07-07 return settlement and idempotency commits | HEAD includes the newest return/security/settlement surface |
| Installments | 2026-07-07 financial idempotency; 2026-06-29 financial API contracts; 2026-06-28 payment amount | HEAD is newer and preserves payment/idempotency behavior |
| Print custom blocks | 2026-07-06 custom print text blocks | HEAD is the only latest committed candidate |

HEAD is the latest relevant committed version for every target. No historical commit later than HEAD was found for these paths.

## 13. Import/Export Compatibility

| Target | Expected export/function | Current importer evidence | Candidate compatibility |
|---|---|---|---|
| Returns page | default `ReturnsPage` route component | linked from `app/[locale]/(dashboard)/sales/page.tsx`; route is served by the page file | HEAD/Index/A/B PASS; stash versions are older |
| Installments hook | `useInstallments()` and `payInstallment(...)` | `app/[locale]/(dashboard)/sales/installments/page.tsx` imports and calls it | HEAD/Index PASS; A/B and current fail encoding; old stash lacks current idempotency argument |
| Print custom blocks hook | `useInvoicePrintCustomBlocks()` | `app/[locale]/(dashboard)/settings/page.tsx` imports and calls it | HEAD/Index PASS; no stash/backup candidate |

No export rename is proposed. Compatibility is assessed from valid candidates only.

## 14. Semantic Compatibility

### Returns page

HEAD contains the current returns contract: server API lookups, exact invoice/item/asset selection, asset/product compatibility, employee/permission checks, branch context, settlement handling, idempotency-key lifecycle, query invalidation, and asset event updates. The newest stash candidate is 332 lines shorter and lacks the current permission/employee/settlement surface. HEAD is semantically safer than any stash candidate.

### Installments hook

HEAD imports `InstallmentPaymentRequest`, sends `amount` when finite, and passes an optional stable `idempotencyKey` to `/installments/:id/pay`. The stash version does not expose the current idempotency-key argument and uses older amount/error behavior. HEAD is semantically safer.

### Invoice print custom blocks hook

HEAD uses the current sanitizer, company-level settings integration, `/settings/by-key/invoicePrintCustomBlocks`, and `skipBranch: true`. No valid alternate source was found; no behavior change is proposed.

## 15. Corruption Timeline

| Evidence point | Date / meaning |
|---|---|
| Latest valid committed candidates | 2026-07-30 returns; 2026-07-07 installments; 2026-07-06 print hook |
| Source-freeze record | 2026-08-15 manifest records all three clean HEAD hashes |
| First explicit bad-source observation in this evidence chain | 2026-08-31 typecheck/runtime forensic |
| Diagnostic A/B snapshot | 2026-08-31; returns snapshot was clean, two hooks were already corrupt |
| Corruption window | bounded only as after the last known-good candidate and before first observed bad; exact onset is not proven |

The file last-write timestamps are preserved filesystem metadata and do not prove the moment corruption occurred. No narrower time window is claimed.

## 16. Corruption Signature Comparison

`SAME_CORRUPTION_FAMILY = YES`.

Evidence chain:

- Three real source files share the exact 16-byte binary prefix and invalid UTF-8/NUL pattern.
- Nine previously observed corrupted dependency `.js` files share the same prefix, fail `node --check`, and differ from clean B counterparts.
- Five earlier malformed `.next/dev/server/chunks/ssr` artifacts were recorded with the same corruption family.

This establishes structural family similarity only. It does not prove the writer, process, or security cause.

## 17. Bounded Source Corruption Inventory

One read-only scan covered 1,324 current-worktree files with extensions `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, and `.json`, excluding `node_modules`, `.next`, Git, recovery directories, diagnostic copies, backups, acceptance artifacts, uploads, and other generated evidence. The scan found 11 files with invalid UTF-8/NUL/known-signature indicators.

`ADDITIONAL_CORRUPTED_SOURCE_FILES = 8` beyond the three primary targets:

| Additional file | Size | SHA-256 | Strong indicator |
|---|---:|---|---|
| `backend/migrations/20260818010000-create-inventory-master-data-bootstrap-state.js` | 1852 | `DCC77BD8258D5360A275E08958021702A2E9800F021C4953B694035C5EA88919` | invalid UTF8/NUL/signature |
| `backend/src/config/barcode-defaults.js` | 2565 | `CC0D9D40091157CB604E35E91F7226CD961FA3E8F77B2ED80F229F9EDA790C24` | invalid UTF8/NUL/signature |
| `backend/src/services/barcode-identity.service.js` | 15956 | `2C3B2DEAC59BAB61EA7DDEABBCD4F70134FFCD8F3857FBA63D0702DF19C80EDD` | invalid UTF8/NUL/signature |
| `backend/src/services/inventory-master-data-baseline.js` | 78198 | `82D45D0983CEE7DE3852813EBD68BFD104E561B41FF206FCFE943DAF23221588` | invalid UTF8/NUL/signature |
| `scripts/bootstrap-first-super-admin.js` | 5950 | `684FC2F9B056774618D034A02B7217643D51470D78AA8AD41D7B82BE1AF679E` | invalid UTF8/NUL/signature |
| `scripts/verify-apply-customer-credit.js` | 10771 | `557242D06A3A99E17BA9EC453187B8E53DC43F4C0C4C97FB4C0C4B8803A2C52B` | invalid UTF8/NUL/signature |
| `scripts/verify-market-launch-safety-containment.js` | 8399 | `D364CA6A1A265340E519ED06CB35CCEE8953BAEEE56EE8D0C89B38AB0A00AA1F` | invalid UTF8/NUL/signature |
| `tests/asset-final-closure.test.cjs` | 5026 | `CBC7D12B2D902802B4C12F63BC287CCBC97FCF8D55DF822CDEE3E815040E7C5C` | invalid UTF8/NUL/signature |

No additional file was restored, edited, or assigned a recovery source in this Control.

## 18. Per-File Candidate Matrix

### Target 1 — `app/[locale]/(dashboard)/sales/returns/page.tsx`

| Candidate | Exists | Valid UTF8 | Parseable | Recency / provenance | Semantic compatibility | Risk |
|---|---:|---:|---:|---|---|---|
| Worktree | YES | NO | NO | current bytes; bad observed 2026-08-31 | cannot assess | binary replacement; uncommitted loss unknown |
| HEAD | YES | YES | YES | latest relevant commit 2026-07-30 | strongest; current permission/employee/settlement/idempotency surface | may omit unknown uncommitted work |
| Index | YES | YES | YES | equals HEAD | same as HEAD | may omit unknown uncommitted work |
| Stash 0/1 | YES | YES | YES | 2026-06-26 | older/incomplete | regression risk |
| Stash 2–10 | YES | YES | YES | 2026-06-21–23 | older/incomplete | regression risk |
| Workspace A | YES | YES | YES | 2026-08-31 diagnostic snapshot | exact HEAD bytes | snapshot authority risk |
| Workspace B | YES | YES | YES | 2026-08-31 diagnostic snapshot | exact HEAD bytes | snapshot authority risk |
| Backup | NO exact source copy | — | — | none found | — | no candidate |

### Target 2 — `hooks/use-installments.ts`

| Candidate | Exists | Valid UTF8 | Parseable | Recency / provenance | Semantic compatibility | Risk |
|---|---:|---:|---:|---|---|---|
| Worktree | YES | NO | NO | current bytes; bad observed 2026-08-31 | cannot assess | binary replacement; uncommitted loss unknown |
| HEAD | YES | YES | YES | latest relevant commit 2026-07-07 | current amount/idempotency contract | may omit unknown uncommitted work |
| Index | YES | YES | YES | equals HEAD | same as HEAD | may omit unknown uncommitted work |
| Stash 0/1 | YES | YES | YES | 2026-06-26 | lacks current idempotency argument | regression risk |
| Stash 2–10 | YES | YES | YES | 2026-06-21–23 | older payment contract | regression risk |
| Workspace A | YES | NO | NO | 2026-08-31 diagnostic snapshot | same corruption | unusable |
| Workspace B | YES | NO | NO | 2026-08-31 diagnostic snapshot | same corruption | unusable |
| Backup | NO exact source copy | — | — | none found | — | no candidate |

### Target 3 — `hooks/use-invoice-print-custom-blocks.ts`

| Candidate | Exists | Valid UTF8 | Parseable | Recency / provenance | Semantic compatibility | Risk |
|---|---:|---:|---:|---|---|---|
| Worktree | YES | NO | NO | current bytes; bad observed 2026-08-31 | cannot assess | binary replacement; uncommitted loss unknown |
| HEAD | YES | YES | YES | latest relevant commit 2026-07-06 | current sanitizer/settings/print contract | may omit unknown uncommitted work |
| Index | YES | YES | YES | equals HEAD | same as HEAD | may omit unknown uncommitted work |
| Stash 0–10 | NO | — | — | no stash copy | — | no candidate |
| Workspace A | YES | NO | NO | 2026-08-31 diagnostic snapshot | same corruption | unusable |
| Workspace B | YES | NO | NO | 2026-08-31 diagnostic snapshot | same corruption | unusable |
| Backup | NO exact source copy | — | — | none found | — | no candidate |

## 19. Recommended Recovery Source Per File

| Target | Recommended recovery source | Why | Required handling |
|---|---|---|---|
| Returns page | `RECOVER_FROM_HEAD` | latest relevant commit; valid TypeScript; exact match independently confirmed by Index, Workspace A, Workspace B, and source-freeze manifest | controlled merge; do not blind overwrite |
| Installments hook | `RECOVER_FROM_HEAD` | latest valid source; Index equals HEAD; source-freeze manifest confirms clean hash; all stashes are older | controlled merge; do not blind overwrite |
| Invoice print custom blocks hook | `RECOVER_FROM_HEAD` | only latest valid committed source found; Index equals HEAD; source-freeze manifest confirms clean hash | controlled merge; do not blind overwrite |

`HEAD_RECOVERY_RISK = MAY_LOSE_NEWER_WORKTREE_CHANGES` for all three. The recommendation is a content source, not authorization to restore it now.

## 20. Potential Work-Loss Analysis

| Target | Potential uncommitted work loss | Diff to recommended source | Decision |
|---|---|---|---|
| Returns page | UNKNOWN | current bytes are binary; semantic diff cannot be computed; SHA differs from HEAD | controlled merge required |
| Installments hook | UNKNOWN | current bytes are binary; semantic diff cannot be computed; SHA differs from HEAD | controlled merge required |
| Print hook | UNKNOWN | current bytes are binary; semantic diff cannot be computed; SHA differs from HEAD | controlled merge required |

The clean Index/HEAD relation does not prove that the corrupted worktree contained no legitimate edits. No claim of zero work-loss risk is made.

## 21. Owner Decision Packet

| Field | Value |
|---|---|
| ROOT_PROBLEM | `REAL_SOURCE_FILE_BINARY_CORRUPTION` |
| TARGET_FILES | the three files in Section 4 |
| ADDITIONAL_CORRUPTED_SOURCE_FILES | 8; fully listed in Section 17 |
| CORRUPTION_SIGNATURE | common 16-byte prefix `24 1A 9C 92 6D 85 CE 6D 6F 93 4C D2 44 FC DC 3B`, invalid UTF8 and NUL bytes |
| LAST_KNOWN_GOOD | HEAD/Index candidates and 2026-08-15 source-freeze manifest |
| FIRST_KNOWN_BAD | explicit typecheck/forensic observation on 2026-08-31 |
| FILE_1_RECOVERY_SOURCE | `RECOVER_FROM_HEAD` |
| FILE_1_RECOVERY_RISK | UNKNOWN uncommitted-work loss; controlled merge required |
| FILE_2_RECOVERY_SOURCE | `RECOVER_FROM_HEAD` |
| FILE_2_RECOVERY_RISK | UNKNOWN uncommitted-work loss; controlled merge required |
| FILE_3_RECOVERY_SOURCE | `RECOVER_FROM_HEAD` |
| FILE_3_RECOVERY_RISK | UNKNOWN uncommitted-work loss; controlled merge required |
| MANUAL_MERGE_REQUIRED | YES |
| PRODUCT_BEHAVIOR_CHANGE_INTENDED | NO |
| PROPOSED_NEXT_CONTROL | `DARFUS-SOURCE-FILE-BINARY-CORRUPTION-CONTROLLED-RECOVERY-01` |
| OWNER_APPROVAL_REQUIRED | YES |

## 22. Gate

All three corrupted real source files have a valid, parseable, semantically reviewed candidate source. The candidate is HEAD, independently supported by Index/source-freeze evidence; Target 1 is also independently present in A/B. No recovery mutation was performed.

`GATE = PASS_SOURCE_CORRUPTION_RECOVERY_SOURCES_PROVEN_AWAITING_OWNER_RECOVERY_APPROVAL`

This Gate does not authorize `git restore`, checkout, copy-over, source editing, formatting, or stash application.

## 23. Final Tokens

```text
CURRENT_CONTROL = DARFUS-SOURCE-FILE-BINARY-CORRUPTION-FORENSIC-AND-RECOVERY-SOURCE-SELECTION-01
MODE = READ_ONLY_FORENSIC_AND_RECOVERY_SOURCE_SELECTION_ONLY
SOURCE_FILES_MODIFIED = NO
GIT_MUTATION = NO
DATABASE_CHANGED = NO
MIGRATIONS_EXECUTED = 0
TARGET_1_STATE = BINARY_CORRUPTED
TARGET_2_STATE = BINARY_CORRUPTED
TARGET_3_STATE = BINARY_CORRUPTED
ADDITIONAL_CORRUPTED_SOURCE_FILES = 8
SAME_CORRUPTION_FAMILY = YES
TARGET_1_RECOVERY_SOURCE = RECOVER_FROM_HEAD
TARGET_2_RECOVERY_SOURCE = RECOVER_FROM_HEAD
TARGET_3_RECOVERY_SOURCE = RECOVER_FROM_HEAD
MANUAL_MERGE_REQUIRED = YES
PRODUCT_BEHAVIOR_CHANGE_INTENDED = NO
OWNER_APPROVAL_REQUIRED = YES
GATE = PASS_SOURCE_CORRUPTION_RECOVERY_SOURCES_PROVEN_AWAITING_OWNER_RECOVERY_APPROVAL
NEXT_RECOMMENDED_STEP = OWNER_REVIEW_THEN_CONTROLLED_SOURCE_RECOVERY
NEXT_BATCH_ALLOWED = NO_AUTOMATIC_START
```

STOP AFTER REPORT. Do not recover files, apply stashes, run Git restoration, start POS implementation, run CRM‑1B4 migration, or start CRM‑1C without explicit Owner approval.
