# Gift Voucher Mapping — Account 2400 Compatibility

Database evidence: official `darfus_erp` and fresh disposable clones.

| Check | Result | Evidence |
|---|---|---|
| Exists | PASS | `ACC-5554f72e-7edd-484d-8db7-b2be4764aac2` |
| Same company | PASS | company `COMP-48ab554f-427e-4642-9419-bc8616c2dc36` |
| Code/name | PASS | `2400`, `Gift Voucher Liability` |
| Active | PASS | `is_active = true` |
| Posting-capable | PASS | `is_posting = true` |
| Account type | PASS | `liability` |
| Nature | PASS | `credit` |
| Statement classification | PASS | `liability` |
| Branch scope | PASS | `branch_id = null`; accepted by resolver for branch role mapping |
| Soft-deleted/deprecated | PASS | no such columns exist in `accounts` schema |
| Incompatible semantic assignment | PASS | no existing role assigned to account 2400 before mapping |
| Currency scope | PASS / NOT ENFORCED | `accounts` has no currency column; company currency is AED |

`ACCOUNT_2400_COMPATIBILITY = PASS`.

