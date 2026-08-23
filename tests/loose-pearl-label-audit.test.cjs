const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const page = fs.readFileSync("app/[locale]/(dashboard)/inventory/loose-pearl/page.tsx", "utf8");

test("Loose Pearl labels are keyed by the actual form/schema field keys", () => {
  const actualKeys = [
    "totalPearlWeight", "pearlSize", "pearlType", "pearlColor", "overtone", "orient",
    "pearlShape", "luster", "surfaceQuality", "nacreQuality", "pearlOrigin",
    "certificateAuthority", "certificateNumber", "rfid", "notes",
  ];
  for (const key of actualKeys) assert.match(page, new RegExp(`${key}:`));
  assert.match(page, /label=\{field\.totalPearlWeight\}/);
  assert.match(page, /label=\{field\.pearlSize\}/);
  assert.match(page, /label=\{field\.rfid\}/);
  assert.match(page, /label=\{field\.certificateAuthority\}/);
  assert.match(page, /label=\{field\.certificateNumber\}/);
  assert.match(page, /label=\{field\.notes\}/);
  assert.match(page, /label=\{field\[key as keyof typeof field\] as string\}/);
});

test("Loose Pearl AR and EN labels match the frozen business field authority", () => {
  for (const label of [
    "إجمالي وزن اللؤلؤ (CT)", "حجم اللؤلؤ", "نوع اللؤلؤ", "لون اللؤلؤ", "النغمة الثانوية (Overtone)",
    "التوجّه (Orient)", "شكل اللؤلؤ", "لمعان اللؤلؤ", "جودة السطح", "جودة الصدف (Nacre)",
    "منشأ اللؤلؤ", "جهة الشهادة", "رقم الشهادة", "ملاحظات",
  ]) assert.match(page, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const label of [
    "Total Pearl Weight (CT)", "Pearl Size", "Pearl Type", "Pearl Color", "Overtone", "Orient",
    "Pearl Shape", "Pearl Luster", "Surface Quality", "Nacre Quality", "Pearl Origin",
    "Certificate Authority", "Certificate Number", "Remarks",
  ]) assert.match(page, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("label-only scope preserves the canonical payload keys", () => {
  assert.match(page, /totalPearlWeight: form\.totalPearlWeight/);
  assert.match(page, /pearlSize: form\.pearlSize/);
  assert.match(page, /pearlType: form\.pearlType/);
  assert.match(page, /pearlColor: form\.pearlColor/);
  assert.match(page, /rfid: form\.rfid/);
  assert.match(page, /notes: form\.notes/);
});
