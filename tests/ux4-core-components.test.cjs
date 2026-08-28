const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('UX4 shared component surface is present without business/API coupling', () => {
  const files = [
    'components/ui/button.tsx', 'components/ui/input.tsx', 'components/ui/textarea.tsx',
    'components/ui/select.tsx', 'components/ui/native-select.tsx', 'components/ui/form-controls.tsx',
    'components/ui/card.tsx', 'components/ui/badge.tsx', 'components/ui/alert.tsx',
    'components/ui/toast.tsx', 'components/ui/modal.tsx', 'components/ui/drawer.tsx',
    'components/ui/popover.tsx', 'components/ui/tooltip.tsx', 'components/ui/tabs.tsx',
    'components/ui/pagination.tsx', 'components/ui/table.tsx', 'components/ui/empty-state.tsx',
    'components/ui/loading-state.tsx', 'components/ui/error-state.tsx',
  ];
  for (const file of files) {
    assert.equal(fs.existsSync(path.join(root, file)), true, file);
    const source = read(file);
    assert.equal(/fetch\(|axios|purchase-orders|inventory-v2|journal|taxTreatment|permission/i.test(source), false, `${file} must remain UI-only`);
  }
});

test('existing component contracts remain compatible', () => {
  const button = read('components/ui/button.tsx');
  assert.match(button, /variant\?: "primary" \| "secondary" \| "ghost" \| "danger"/);
  assert.match(button, /size\?: "sm" \| "md" \| "lg"/);
  assert.match(button, /variant = "primary"/);
  assert.match(button, /size = "md"/);

  const nativeSelect = read('components/ui/native-select.tsx');
  assert.match(nativeSelect, /forwardRef<HTMLSelectElement, NativeSelectProps>/);
  assert.match(nativeSelect, /wrapperClassName/);

  const modal = read('components/ui/modal.tsx');
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /key === "Escape"/);
});

test('UX4 controls expose keyboard and assistive semantics', () => {
  assert.match(read('components/ui/form-controls.tsx'), /role="switch"/);
  assert.match(read('components/ui/form-controls.tsx'), /aria-checked=\{checked\}/);
  assert.match(read('components/ui/select.tsx'), /role="combobox"/);
  assert.match(read('components/ui/select.tsx'), /role="listbox"/);
  assert.match(read('components/ui/tabs.tsx'), /role="tablist"/);
  assert.match(read('components/ui/tabs.tsx'), /role="tab"/);
  assert.match(read('components/ui/pagination.tsx'), /aria-label=\{previousLabel\}/);
  assert.match(read('components/ui/table.tsx'), /scope="col"/);
  assert.match(read('components/ui/info-tooltip.tsx'), /role="tooltip"/);
  assert.match(read('components/ui/info-tooltip.tsx'), /aria-describedby/);
});

test('numeric presentation authority remains untouched', () => {
  const numeric = read('components/ui/numeric-input.tsx');
  assert.match(numeric, /normalizeNumberInput/);
  assert.match(numeric, /type="text"/);
  assert.match(numeric, /dir = "ltr"/);
  assert.match(read('components/ui/numeric-token.tsx'), /toEnglishDigits/);
});

test('state components expose stable status semantics', () => {
  assert.match(read('components/ui/empty-state.tsx'), /role="status"/);
  assert.match(read('components/ui/loading-state.tsx'), /aria-live="polite"/);
  assert.match(read('components/ui/error-state.tsx'), /role="alert"/);
});
