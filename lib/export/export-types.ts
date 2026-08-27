export type ExportFormat = "csv" | "xlsx" | "pdf";

export type ExportCellValue = string | number | boolean | Date | null | undefined;

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  value?: (row: T) => ExportCellValue;
  type?: "text" | "number" | "currency" | "weight" | "date";
}

export interface ExportRequest<T> {
  fileName: string;
  title: string;
  format: ExportFormat;
  columns: ExportColumn<T>[];
  rows: T[];
  locale: string;
  sheetName?: string;
}

export type ExportErrorCode =
  | "empty-data"
  | "invalid-data"
  | "unsupported-format"
  | "download-failed"
  | "xlsx-failed"
  | "pdf-fallback-required";

export interface ExportResult {
  ok: boolean;
  fileName?: string;
  errorCode?: ExportErrorCode;
  error?: string;
}
