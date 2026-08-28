const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const css = read('features/printing/components/PrintPreviewUx11.module.css');
const dialog = read('features/printing/components/InvoicePrintOptionsDialog.tsx');
const receipt = read('features/sales/components/ReceiptPreview.tsx');
const barcode = read('features/barcodes/components/BarcodeLabelPreview.tsx');
const assetTag = read('features/inventory/components/ClientAssetTagPreview.tsx');
const printConfig = read('lib/print/print-config.ts');
const renderer = read('features/printing/components/render-print-document.tsx');
const invoiceDocument = read('features/printing/components/InvoiceDocument.tsx');
const scanner = read('features/printing/components/ScannableBarcode.tsx');

test('UX11 scopes presentation improvements to preview surfaces', () => {
  for (const source of [dialog, receipt, barcode, assetTag]) {
    assert.match(source, /PrintPreviewUx11\.module\.css/);
    assert.match(source, /previewSurface/);
  }
  assert.match(dialog, /previewViewport/);
  assert.match(dialog, /documentFrame/);
  assert.match(receipt, /documentFrame/);
  assert.match(barcode, /machineReadable/);
  assert.match(assetTag, /previewViewport/);
});

test('UX11 provides accessible responsive preview containment', () => {
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /overscroll-behavior-inline/);
  assert.match(css, /unicode-bidi:\s*plaintext/);
  assert.match(css, /max-width:\s*900px/);
  assert.match(css, /max-width:\s*640px/);
});

test('UX11 isolates fixed-format and machine-readable content from app theme', () => {
  assert.match(css, /color-scheme:\s*light/);
  assert.match(css, /forced-color-adjust:\s*none/);
  assert.match(printConfig, /data-print-root.*color-scheme:\s*light/);
  assert.match(printConfig, /forced-color-adjust:\s*none/);
  assert.match(printConfig, /@media print/);
  assert.match(renderer, /getPrintDocumentCss/);
});

test('UX11 preserves document, barcode, and print action authorities', () => {
  assert.match(invoiceDocument, /InvoicePrintTemplate/);
  assert.match(invoiceDocument, /CompactInvoicePrintTemplate/);
  assert.match(invoiceDocument, /MinimalInvoicePrintTemplate/);
  assert.match(invoiceDocument, /ThermalInvoicePrintTemplate/);
  assert.match(scanner, /bwipjs\.toSVG/);
  assert.match(scanner, /value: string/);
  assert.match(receipt, /printHtmlDocument/);
  assert.match(barcode, /printHtmlDocument/);
  assert.match(assetTag, /printHtmlDocument/);
  assert.match(barcode, /disabled=\{!canPrintBarcode\}/);
  assert.match(assetTag, /disabled=\{!canPrint\}/);
  assert.doesNotMatch(dialog, /purchase-orders\/receive|fetch\(/);
  assert.doesNotMatch(receipt, /purchase-orders\/receive|fetch\(/);
  assert.doesNotMatch(barcode, /purchase-orders\/receive|fetch\(/);
  assert.doesNotMatch(assetTag, /purchase-orders\/receive|fetch\(/);
});
