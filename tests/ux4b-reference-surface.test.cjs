const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const page = fs.readFileSync("components/ux4b-reference-surface.tsx", "utf8");
const wrapper = fs.readFileSync("app/[locale]/test/ux4-components-reference/page.tsx", "utf8");

test("UX4B reference surface is locale-wrapped and isolated from production navigation", () => {
  assert.match(wrapper, /ux4b-reference-surface/);
  assert.doesNotMatch(page, /href=|router\.|redirect\(|navigate\(/);
  assert.doesNotMatch(page, /fetch\(|axios|apiClient|XMLHttpRequest|formAction|method=/i);
});

test("UX4B reference surface exercises every required shared component family", () => {
  for (const name of [
    "Button", "Badge", "Card", "Modal", "InfoTooltip", "NativeSelect", "Input", "Textarea", "Select", "Combobox",
    "Checkbox", "Radio", "Switch", "Alert", "Toast", "Drawer", "Popover", "Tooltip", "Tabs", "Pagination",
    "EmptyState", "LoadingState", "ErrorState", "Table", "DataToolbar",
  ]) {
    assert.match(page, new RegExp(`\\b${name}\\b`), `missing ${name}`);
  }
  assert.match(page, /no API|بلا API/i);
  assert.match(page, /data-testid="ux4b-reference-root"/);
});

test("UX4B reference surface has no business-write affordance", () => {
  assert.doesNotMatch(page, /Confirm Receive|Complete Checkout|Issue Voucher|Post Journal|Receive Inventory|تأكيد الاستلام|إتمام البيع/i);
  assert.doesNotMatch(page, /\bonSubmit\b|\b(?:POST|PUT|PATCH|DELETE)\s+(?:\/|api)/i);
});
