import { downloadBlob, sanitizeFileName } from "./download-file";
import type { ExportCellValue, ExportColumn, ExportRequest, ExportResult } from "./export-types";
import { toEnglishDigits } from "../formatters/numbers";

export function resolveExportCell<T>(row: T, column: ExportColumn<T>): ExportCellValue {
  if (column.value) return column.value(row);
  const key = column.key as keyof T;
  return row[key] as ExportCellValue;
}

function normalizeCell(value: ExportCellValue, locale: string) {
  if (value === null || typeof value === "undefined") return "";
  if (value instanceof Date) {
    return toEnglishDigits(new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", {
      numberingSystem: "latn",
    }).format(value));
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  return toEnglishDigits(value);
}

export function escapeCsvCell(value: ExportCellValue, locale = "en") {
  return `"${normalizeCell(value, locale).replace(/"/g, '""')}"`;
}

export function createCsvContent<T>(request: Omit<ExportRequest<T>, "format">) {
  const headers = request.columns.map((column) => escapeCsvCell(column.header, request.locale)).join(",");
  const lines = request.rows.map((row) =>
    request.columns.map((column) => escapeCsvCell(resolveExportCell(row, column), request.locale)).join(","),
  );
  return `\ufeff${[headers, ...lines].join("\r\n")}`;
}

export function exportCsvRequest<T>(request: Omit<ExportRequest<T>, "format">): ExportResult {
  if (!request.rows.length) {
    return { ok: false, errorCode: "empty-data", error: "No data to export." };
  }

  const content = createCsvContent(request);
  const fileName = sanitizeFileName(request.fileName, ".csv");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  return downloadBlob(blob, fileName);
}
