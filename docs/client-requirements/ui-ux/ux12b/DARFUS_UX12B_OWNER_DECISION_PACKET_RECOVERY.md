# UX-12B Owner Decision Packet

`ROOT_CAUSE = PREEXISTING_ARCHIVE_ARTIFACT_INCLUDED_IN_COMPILATION`

`PROPOSED_CHANGE = Add a narrowly scoped TypeScript exclusion for ignored evidence/archive path backups/**; do not delete, move, restore, or rewrite evidence.`

`FILES_TO_CHANGE = tsconfig.json only, after approval.`

`WHY_THIS_IS_MINIMUM_SAFE_CHANGE = backups/** is ignored operational evidence, 90 backup files enter the compiler only through broad globs, and no product import depends on it.`

`WHY_PRODUCT_BEHAVIOR_WILL_NOT_CHANGE = The exclusion removes non-runtime ignored evidence copies from type-checking; it does not alter app source, routes, runtime imports, APIs, or generated product behavior.`

`EXPECTED_BUILD_EFFECT = Remove the missing print-types error from the build input and allow production type-checking to evaluate product source.`

`POSSIBLE_SIDE_EFFECTS = A future malformed evidence copy would no longer be type-checked; evidence/archive validation must remain a separate process.`

`REGRESSION_RADIUS = tsconfig build input only; no business domain.`

`ROLLBACK_METHOD = Restore the exact pre-change tsconfig hash in an Owner-approved controlled change; no business data rollback.`

`BEFORE_HASHES = tsconfig hash must be captured immediately before any later approved edit; no edit was made in this control.`

`OWNER_APPROVAL_REQUIRED = YES`

No repository change was applied. This packet stops at the Owner gate.
