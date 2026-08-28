# UX-8 Focused Test Results

| Check | Command/evidence | Result |
|---|---|---|
| UX-8 presentation contract | `node --test tests/ux8-gold-center-presentation.test.cjs` | PASS, 4/4 |
| TypeScript | `npm run typecheck` | PASS |
| Production build | `npm run build` | PASS; Next.js 16.2.9, 130/130 static pages |
| Gold Center runtime routes | browser route sweep, AR/EN | PASS |
| Responsive/theme matrix | browser evidence JSON and screenshots | PASS |
| No business mutation | controls remained unclicked; backend GET log evidence | PASS |

No unrelated broad regression suite was run in this UX-8 scoped pass. Existing pre-UX8 changes in the dirty worktree remain outside attribution.

`UX8_FOCUSED_TESTS = PASS`
`UX8_TYPECHECK = PASS`
`UX8_BUILD = PASS`

