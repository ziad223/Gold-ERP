/* eslint-disable no-console */
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const dates = read("lib/dates/dates.ts");
const input = read("components/ui/date-input.tsx");
const dashboard = read("hooks/use-core-erp-data.ts");
const provider = read("features/dashboard/providers/local-provider.ts");
const widget = read("features/dashboard/components/gold-market-widget.tsx");
const env = read("backend/.env");

assert.match(dates, /UI_DATE_FORMAT\s*=\s*["']dd\/MM\/yyyy["']/);
assert.match(dates, /UI_DATETIME_FORMAT\s*=\s*["']dd\/MM\/yyyy HH:mm["']/);
assert.match(dates, /UI_TIME_FORMAT\s*=\s*["']HH:mm["']/);
assert.match(dates, /toEnglishDigits\(/);
assert.match(input, /DD\/MM\/YYYY/);
assert.match(input, /dir="ltr"/);
assert.match(input, /toEnglishDigits\(event\.target\.value\)/);
assert.doesNotMatch(input, /type=["']date|type=["']datetime-local/);

function sourceFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  const result = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (/\.(?:tsx?|jsx?|mjs|cjs)$/.test(entry.name)) result.push(absolute);
    }
  };
  visit(absoluteDir);
  return result;
}

const nativeDateControls = [];
for (const relativeDir of ["app", "features", "components", "hooks", "lib"]) {
  for (const file of sourceFiles(relativeDir)) {
    const source = fs.readFileSync(file, "utf8");
    if (/type\s*=\s*["'](?:date|datetime-local|time)["']/.test(source)) {
      nativeDateControls.push(path.relative(root, file));
    }
  }
}
assert.deepEqual(nativeDateControls, [], `native date/time controls remain: ${nativeDateControls.join(", ")}`);

const rawDatePresentationChecks = [
  ["app/[locale]/(dashboard)/accounting/page.tsx", /\{entry\.date\}/],
  ["app/[locale]/(dashboard)/sales/reservations/page.tsx", /\{(?:reservation|selectedReservation)\.expiresAt/],
  ["app/[locale]/(dashboard)/sales/gift-vouchers/page.tsx", /\{v\.issueDate\}/],
  ["app/[locale]/(dashboard)/sales/installments/page.tsx", /\{inst\.dueDate\}/],
  ["app/[locale]/(dashboard)/pos/page.tsx", /\{createdReservation\.expiresAt/],
  ["features/assets/components/CertificatePanel.tsx", /\{cert\.issueDate\}/],
  ["features/assets/components/AttachmentsPanel.tsx", /\{file\.uploadedAt\}/],
  ["features/sales/components/ReceiptPreview.tsx", /\{invoice\.installments\[0\]\.dueDate\}/],
  ["features/printing/components/ReceiptPrintTemplate.tsx", /toEnglishDigits\(inst\.dueDate\)/],
];
for (const [file, pattern] of rawDatePresentationChecks) {
  assert.doesNotMatch(read(file), pattern, `raw date presentation remains in ${file}`);
}
assert.match(dashboard, /\/gold\/karat-prices\?currency=AED/);
assert.match(dashboard, /refetchInterval:\s*30_000/);
assert.match(dashboard, /status:\s*snapshot\.status/);
assert.match(provider, /changePercent:\s*null/);
assert.doesNotMatch(provider, /changePercent:\s*1\.2/);
assert.doesNotMatch(provider, /trend:\s*["']UP["']/);
assert.match(widget, /formatTime\(/);
assert.match(env, /^REDIS_URL=redis:\/\/127\.0\.0\.1:6379\s*$/m);

const userFacingFiles = [
  "app/[locale]/(dashboard)/settings/users/page.tsx",
  "app/[locale]/(dashboard)/inventory/[id]/page.tsx",
  "app/[locale]/(dashboard)/sales/reservations/[id]/receipt-history/page.tsx",
  "app/[locale]/(dashboard)/sales/reservations/receipts/[receiptId]/page.tsx",
  "app/[locale]/(dashboard)/suppliers/[id]/page.tsx",
  "app/[locale]/(dashboard)/employees/[id]/page.tsx",
  "app/[locale]/(dashboard)/employees/payroll/page.tsx",
  "features/printing/components/BarcodePrintTemplate.tsx",
];
for (const file of userFacingFiles) {
  const source = read(file);
  assert.doesNotMatch(source, /toLocaleString\(|toLocaleDateString\(|toLocaleTimeString\(|new Intl\.DateTimeFormat/);
}

console.log("LOCAL_RUNTIME_DASHBOARD_NUMERAL_DATE_FIX_STATIC=PASS");
console.log("REDIS_URL_CONFIGURED=YES");
console.log("NO_DB_OR_RUNTIME_MUTATION=YES");
