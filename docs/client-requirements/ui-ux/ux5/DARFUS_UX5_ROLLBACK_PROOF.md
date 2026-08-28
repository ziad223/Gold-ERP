# DARFUS ERP — UX5 POS Rollback Proof

هذا الدليل يثبت قابلية التراجع المحدود لنطاق UX5 فقط. تم إجراء التحقق على نسخ
معزولة داخل مجلد الإثبات، ولم يتم تنفيذ restore على ملفات المصدر الحية.

## Scope

| File | UX5 scope |
|---|---|
| `app/[locale]/(dashboard)/pos/page.tsx` | Presentation-only POS layout/state accessibility changes |
| `tests/ux5-pos-presentation.test.cjs` | Focused UX5 test coverage |

## Hash Evidence

| Artifact | Before SHA-256 | After SHA-256 | Restored-before SHA-256 | Reapplied-after SHA-256 | Result |
|---|---|---|---|---|---|
| POS page | `AD8D2330D6D1D76C110BA0B5E7741F759185AF2DD4394C475310A85C58BA88A4` | `A02F9F9DC4C3179246DFC701815FBA07E187C4AD80FBE8AB958B2F788F5AE90A` | `AD8D2330D6D1D76C110BA0B5E7741F759185AF2DD4394C475310A85C58BA88A4` | `A02F9F9DC4C3179246DFC701815FBA07E187C4AD80FBE8AB958B2F788F5AE90A` | PASS |

## Evidence Locations

- Before snapshot: `backups/ui-ux/PRE_UX5_POS_20260828_080614Z/`
- After snapshot and isolated rehearsal: `backups/ui-ux/UX5_POS_20260828_081104Z/rollback-rehearsal/`

## Safety Result

`ROLLBACK_REHEARSAL = PASS`

The rehearsal did not touch `darfus_erp`, did not invoke business mutations, and did
not run destructive Git commands. Restoring the complete dirty worktree is outside
this proof and is intentionally forbidden; any future rollback must use this
file-scoped map and preserve unrelated pre-existing worktree changes.
