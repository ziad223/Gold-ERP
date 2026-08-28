const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const tagTemplate = fs.readFileSync(path.join(root, 'features/printing/components/ClientBarcodeTagTemplate.tsx'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'features/inventory/components/ClientAssetTagPreview.tsx'), 'utf8');
const barcode = fs.readFileSync(path.join(root, 'features/printing/components/ScannableBarcode.tsx'), 'utf8');

test('UX6B isolates the embedded tag faces from the application theme', () => {
  assert.match(tagTemplate, /\.barcode-tag-face\s*\{[\s\S]*background:\s*#ffffff;/);
  assert.match(tagTemplate, /\.barcode-tag-face\s*\{[\s\S]*color:\s*#111827;/);
  assert.match(tagTemplate, /color-scheme:\s*light/);
  assert.match(tagTemplate, /forced-color-adjust:\s*none/);
  assert.match(tagTemplate, /\.barcode-tag-face \.scannable-barcode\s*\{\s*background:\s*#ffffff;\s*color:\s*#111827;/);
  assert.match(tagTemplate, /\.barcode-tag-face \.scannable-barcode svg\s*\{\s*background:\s*#ffffff;\s*\}/);
});

test('UX6B keeps the canonical Asset/tag/barcode data path unchanged', () => {
  assert.match(preview, /assetToTagData/);
  assert.match(preview, /ClientBarcodeTagTemplate/);
  assert.match(tagTemplate, /data-print-root/);
  assert.match(tagTemplate, /items\.map/);
  assert.match(barcode, /bwipjs\.toSVG/);
  assert.match(barcode, /value: string/);
});

test('UX6B preserves the print action and shared renderer contract', () => {
  assert.match(preview, /renderPrintDocument/);
  assert.match(preview, /printHtmlDocument/);
  assert.match(preview, /data-c4-tag-preview/);
  assert.match(preview, /disabled=\{!canPrint\}/);
  assert.doesNotMatch(preview, /purchase-orders\/receive|inventory-v2\/assets\/.+\/status/);
});

test('UX6B does not introduce business, barcode, or database mutations', () => {
  assert.doesNotMatch(tagTemplate, /fetch\(|apiClient|POST|PUT|PATCH|DELETE|INSERT|UPDATE|TRUNCATE/);
  assert.doesNotMatch(preview, /purchase-orders\/receive|inventory-v2\/assets\/.+\/(assign|replace|unassign|status)/);
});
