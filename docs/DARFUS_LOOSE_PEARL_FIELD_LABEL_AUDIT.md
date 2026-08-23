# Loose Pearl Field Label Read-Only Audit

## Scope

UI-label-only audit for `app/[locale]/(dashboard)/inventory/loose-pearl/page.tsx`. No backend, DB, Master Data, payload, or business-rule change is in scope.

## Finding

The actual form keys were present in `initialForm` and `looseDetails`, but the display label dictionary used abbreviated keys (`type`, `color`, `shape`, `surface`, etc.) while the selector binding used actual keys (`pearlType`, `pearlColor`, `pearlShape`, `surfaceQuality`, etc.). This made some rendered labels undefined. The fix keys the display labels by the actual form/schema keys and changes nothing in the payload mapping.

## Field mapping register

| Field key | Source/form schema | Master-data category | AR label | EN label | Result |
|---|---|---|---|---|---|
| `totalPearlWeight` | `initialForm` → `looseDetails.totalPearlWeight` | none | إجمالي وزن اللؤلؤ (CT) | Total Pearl Weight (CT) | PASS |
| `pearlSize` | `initialForm` → `looseDetails.pearlSize` | `pearl_size_master_data` | حجم اللؤلؤ | Pearl Size | PASS |
| `pearlType` | `initialForm` → `looseDetails.pearlType` | `PEARL_TYPE` | نوع اللؤلؤ | Pearl Type | PASS |
| `pearlColor` | `initialForm` → `looseDetails.pearlColor` | `PEARL_COLOR` | لون اللؤلؤ | Pearl Color | PASS |
| `overtone` | `initialForm` → `looseDetails.overtone` | `PEARL_OVERTONE` | النغمة الثانوية (Overtone) | Overtone | PASS |
| `orient` | `initialForm` → `looseDetails.orient` | `PEARL_ORIENT` | التوجّه (Orient) | Orient | PASS |
| `pearlShape` | `initialForm` → `looseDetails.pearlShape` | `PEARL_SHAPE` | شكل اللؤلؤ | Pearl Shape | PASS |
| `luster` | `initialForm` → `looseDetails.luster` | `PEARL_LUSTER` | لمعان اللؤلؤ | Pearl Luster | PASS |
| `surfaceQuality` | `initialForm` → `looseDetails.surfaceQuality` | `PEARL_SURFACE_QUALITY` | جودة السطح | Surface Quality | PASS |
| `nacreQuality` | `initialForm` → `looseDetails.nacreQuality` | `PEARL_NACRE_QUALITY` | جودة الصدف (Nacre) | Nacre Quality | PASS |
| `pearlOrigin` | `initialForm` → `looseDetails.pearlOrigin` | `PEARL_ORIGIN` | منشأ اللؤلؤ | Pearl Origin | PASS |
| `certificateAuthority` | `initialForm` → certificate mapping | `CERTIFICATE_AUTHORITY` | جهة الشهادة | Certificate Authority | PASS |
| `certificateNumber` | `initialForm` → certificate mapping | none | رقم الشهادة | Certificate Number | PASS |
| `rfid` | `initialForm` → `piece.rfid` | none; optional supplementary identity | RFID | RFID | PASS |
| `notes` | `initialForm` → `looseDetails.notes` / shared notes | none | ملاحظات | Remarks | PASS |

No field required guessing. No field key was renamed.

## Scope proof

```text
FIELD_EXISTS = YES
FIELD_LABEL_MISSING = YES
FIX_SCOPE = UI_LABEL_ONLY
BACKEND_CHANGE = NO
DB_CHANGE = NO
MASTER_DATA_CHANGE = NO
BUSINESS_LOGIC_CHANGE = NO
LABEL_SOURCE = ACTUAL_FIELD_KEY + FROZEN_LOOSE_PEARL_CONTRACT
GUESSING_LABEL_FROM_SCREEN_POSITION = FORBIDDEN_AND_NOT_USED
```

## Focused test

`node --test tests/loose-pearl-label-audit.test.cjs` verifies actual-key label binding, AR/EN labels, and unchanged canonical payload keys.
