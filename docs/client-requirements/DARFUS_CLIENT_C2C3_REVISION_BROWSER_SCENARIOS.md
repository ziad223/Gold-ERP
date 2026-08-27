# DARFUS ERP — C2C3 Revision Browser Scenarios

## Status

The static UI implementation and focused contract tests are complete. Real browser acceptance is **not run** because the required frontend runtime-parity gate stopped on protected `next-env.d.ts` drift after the project-standard build.

## Intended disposable scenarios

| ID | Scenario | Required proof | Status |
|---|---|---|---|
| B1 | Asset Detail AR | Detail, Revision surface, RTL, existing identity | BLOCKED — runtime parity gate |
| B2 | Asset Detail EN | Detail, Revision surface, LTR, same capability | BLOCKED — runtime parity gate |
| B3 | Empty history | Zero rows and clean empty state | BLOCKED — runtime parity gate |
| B4 | Existing history | Newest-first rows, actor, reason, change count | BLOCKED — runtime parity gate |
| B5 | Detail | Old/new values and source/actor | BLOCKED — runtime parity gate |
| B6 | Single-field edit | One POST, one Revision, refreshed detail/history | BLOCKED — runtime parity gate |
| B7 | Multi-field edit | One POST, one header, multiple change rows | BLOCKED — runtime parity gate |
| B8 | No-op | No obvious submit and no mutation | BLOCKED — runtime parity gate |
| B9 | Double submit | One effective request/result | BLOCKED — runtime parity gate |
| B10 | Stale conflict | 409, no retry, refresh path | BLOCKED — runtime parity gate |
| B11 | View-only | History visible, create hidden | BLOCKED — runtime parity gate |
| B12 | No permission | Fail closed | BLOCKED — runtime parity gate |
| B13 | Dedicated protection | No Barcode/RFID/status route | STATIC PASS; browser BLOCKED |

No browser POST, Revision mutation, permission grant, or official DB write was attempted in C2C3.

