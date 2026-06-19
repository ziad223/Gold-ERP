import type { BarcodeLabelConfig, PrintOptions, PrintPaperSize } from "./print-types";

export const DEFAULT_BARCODE_LABEL_CONFIG: BarcodeLabelConfig = {
  widthMm: 62,
  heightMm: 28,
  columns: 2,
  rowGapMm: 3,
  columnGapMm: 3,
  showPrice: true,
  showWeight: true,
  showAssetId: true,
};

export const PAPER_SIZE_LABELS: Record<PrintPaperSize, string> = {
  A4: "A4",
  A5: "A5",
  "80mm": "80mm",
  "58mm": "58mm",
  "barcode-label": "Barcode label",
};

function pageSize(options: PrintOptions) {
  if (options.paperSize === "80mm") return "80mm auto";
  if (options.paperSize === "58mm") return "58mm auto";
  if (options.paperSize === "barcode-label") return "auto";
  return `${options.paperSize} ${options.orientation ?? "portrait"}`;
}

export function getPrintDocumentCss(options: PrintOptions) {
  return `
    @page {
      size: ${pageSize(options)};
      margin: ${options.paperSize === "80mm" || options.paperSize === "58mm" || options.paperSize === "barcode-label" ? "0" : "12mm"};
    }

    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111827;
      font-family: ${options.locale === "ar" ? '"Cairo", "Arial", sans-serif' : '"Inter", "Arial", sans-serif'};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { direction: ${options.locale === "ar" ? "rtl" : "ltr"}; }
    .no-print, [data-no-print="true"] { display: none !important; }
    [data-print-root] { background: #fff; color: #111827; }
    .print-page { width: 100%; page-break-after: auto; }
    .print-document { background: #fff; color: #111827; }
    .print-section { break-inside: avoid; page-break-inside: avoid; }
    .print-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .print-table thead { display: table-header-group; }
    .print-table tfoot { display: table-footer-group; }
    .print-table th, .print-table td {
      border: 1px solid #d8dee8;
      padding: 6px 7px;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    .print-table th { background: #f3f6f8; font-weight: 800; }
    .print-muted { color: #64748b; }
    .print-total-row { font-weight: 800; background: #f8fafc; }
    .print-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #111827;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .print-logo {
      width: 56px;
      height: 56px;
      object-fit: contain;
      border: 1px solid #d8dee8;
      border-radius: 8px;
      padding: 4px;
    }
    .print-title { margin: 0; font-size: 20px; font-weight: 900; }
    .print-subtitle { margin: 4px 0 0; font-size: 11px; color: #64748b; }
    .print-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 18px; }
    .print-field { display: flex; justify-content: space-between; gap: 10px; border-bottom: 1px dashed #d8dee8; padding: 4px 0; font-size: 11px; }
    .print-field strong { font-weight: 800; }

    .receipt-print {
      width: ${options.paperSize === "58mm" ? "58mm" : "80mm"};
      padding: 3mm;
      margin: 0 auto;
      font-size: ${options.paperSize === "58mm" ? "9px" : "10px"};
      line-height: 1.35;
    }
    .receipt-print .print-title { font-size: 14px; text-align: center; }
    .receipt-print .print-table th, .receipt-print .print-table td { border-width: 0 0 1px; padding: 4px 2px; }

    .barcode-sheet {
      display: grid;
      grid-template-columns: repeat(var(--label-columns), var(--label-width));
      gap: var(--label-row-gap) var(--label-column-gap);
      align-items: start;
      justify-content: start;
      padding: 0;
    }
    .barcode-label {
      width: var(--label-width);
      height: var(--label-height);
      border: 1px solid #111827;
      padding: 2mm;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
      font-size: 8px;
      display: grid;
      grid-template-columns: 1fr 22mm;
      gap: 2mm;
    }
    .barcode-visual {
      direction: ltr;
      height: 9mm;
      display: flex;
      gap: 1px;
      align-items: stretch;
      background: #fff;
      border: 1px solid #111827;
      padding: 1px;
    }
    .barcode-bar { background: #111827; height: 100%; }
    .barcode-text { direction: ltr; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: 0.12em; }

    @media print {
      .app-shell, header, aside, nav, .no-print, [data-no-print="true"] { display: none !important; }
      .print-only { display: block !important; }
      .print-document { box-shadow: none !important; }
    }
  `;
}
