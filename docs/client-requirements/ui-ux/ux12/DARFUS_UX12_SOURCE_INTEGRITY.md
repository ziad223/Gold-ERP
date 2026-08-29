# UX-12 Source Integrity

Baseline: branch `main`, HEAD `1657b0e9ba580faef69be48f04637835c201b521`, 1021 status lines, 139 tracked modified, 882 untracked, 11 stashes. These are pre-existing worktree conditions and were not cleaned.

UX-12 intentional source delta: one line in `components/ui/data-toolbar.tsx`, adding `aria-label={resetLabel}` to the existing reset button. Pre-edit hash: `5DAB79C313ECB9A4A83BAC90483F1497FF9C3DAC4430EEAA4053A2FA173F0E4`; post-edit hash: `A6D5970D7B282D4D052EF149DDE0A809408C2C9B654A0EEAA4053A2FA173F0E4`. `next-env.d.ts` remained `7B550DDA9686C16F36A17BF9051D5DBF31E98555B30D114AC49FC49A1E712651` before and after. No test/product authority file other than this focused presentation line was intentionally changed.
