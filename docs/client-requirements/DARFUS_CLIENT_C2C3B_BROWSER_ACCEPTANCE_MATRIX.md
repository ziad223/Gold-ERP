# DARFUS Client C2C3B — Browser Acceptance Matrix

بالعربي المختصر: كل سيناريوهات القبول بقيت `NOT_RUN_BLOCKED` لأن التحكم بالمتصفح لم يتعافَ قبل فتح أي صفحة. لا يجوز تحويل HTTP 200 أو source proof إلى Browser PASS.

## Isolated target

| Target | Value | Read-only proof |
|---|---|---|
| Frontend | `http://localhost:3002` | AR and EN Asset Detail GET = 200 |
| Backend | `http://localhost:8001` | health/db/redis = 200 |
| Database | `darfus_c2c2_revision_runtime_02` | `SELECT current_database()` |
| Official DB | `darfus_erp` | read-only verification only |

## Required browser preflight

| Preflight | Expected | Actual | Status |
|---|---|---|---|
| open new tab | tab handle | browser control failed before tab creation | BLOCKED |
| load EN route | Asset Detail document | not reached through browser tool | BLOCKED |
| load AR route | Asset Detail document | not reached through browser tool | BLOCKED |
| inspect DOM | DOM snapshot | not reached | BLOCKED |
| inspect console | no blocking errors | not reached | BLOCKED |
| inspect network | frontend → `8001` | not reached | BLOCKED |

## Scenario matrix

| Scenario | Required result | Actual | Status |
|---|---|---|---|
| B1 Notes Revision | one POST 201; one Revision/event; notes visible | no browser action | NOT_RUN_BLOCKED |
| B2 Name + Description | one POST 201; two changes; history refresh | no browser action | NOT_RUN_BLOCKED |
| B3 No-Op | no durable Revision/event/audit effect | no browser action | NOT_RUN_BLOCKED |
| B4 Double Submit | one durable result; no duplicate effect | no browser action | NOT_RUN_BLOCKED |
| B5 Stale Revision | 409 concurrent conflict; no retry/overwrite | no browser action | NOT_RUN_BLOCKED |
| B6 View-Only | history visible; create unavailable; backend denied | no browser action | NOT_RUN_BLOCKED |
| B7 No Permission | hidden/denied; fail-closed; no mutation | no browser action | NOT_RUN_BLOCKED |
| B8 Dedicated Fields | protected fields stay outside Revision | no browser action | NOT_RUN_BLOCKED |

## AR/EN acceptance

| Area | AR | EN |
|---|---|---|
| RTL/LTR layout | BLOCKED | BLOCKED |
| Revision list/detail | BLOCKED | BLOCKED |
| edit/review/confirm | BLOCKED | BLOCKED |
| localized validation/error | BLOCKED | BLOCKED |
| keyboard/touch interaction | BLOCKED | BLOCKED |
| console/network proof | BLOCKED | BLOCKED |

## No-mutation rule

Because no tab was created, there was:

- no browser POST;
- no Revision mutation;
- no permission mutation;
- no event/audit mutation;
- no official DB mutation.

The matrix intentionally does not claim B1–B8 or AR/EN PASS.
