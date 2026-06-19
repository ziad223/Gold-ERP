export type PrintDocumentType = "invoice" | "receipt" | "barcode" | "report";

export type PrintPaperSize = "A4" | "A5" | "80mm" | "58mm" | "barcode-label";

export interface PrintOptions {
  documentType: PrintDocumentType;
  paperSize: PrintPaperSize;
  title?: string;
  orientation?: "portrait" | "landscape";
  locale?: string;
}

export interface PrintResult {
  ok: boolean;
  errorCode?: "popup-blocked" | "missing-document" | "print-failed";
  error?: string;
}

export interface BarcodeLabelConfig {
  widthMm: number;
  heightMm: number;
  columns: number;
  rowGapMm: number;
  columnGapMm: number;
  showPrice: boolean;
  showWeight: boolean;
  showAssetId: boolean;

  showCompanyName?: boolean;
  showLogo?: boolean;
  showName?: boolean;
  showKarat?: boolean;
  showType?: boolean;
  showBranch?: boolean;
  showSupplier?: boolean;
  showDate?: boolean;
  customText?: string;
  showQrCode?: boolean;
  fontSizePx?: number;
  direction?: "RTL" | "LTR";
  copies?: number;
  showBorder?: boolean;
  template?: string;
}
