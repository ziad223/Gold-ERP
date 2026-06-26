import * as XLSX from "xlsx";
import { downloadBlob, sanitizeFileName } from "./download-file";
import { resolveExportCell } from "./csv-exporter";
import type { ExportCellValue, ExportRequest, ExportResult } from "./export-types";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function safeSheetName(sheetName: string) {
  const safe = sheetName.replace(/[\[\]*?/\\:]/g, " ").trim() || "Report";
  return safe.slice(0, 31);
}

function normalizeXlsxCell(value: ExportCellValue) {
  if (value === null || typeof value === "undefined") return "";
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") return value;
  return String(value);
}

export function createXlsxBlob<T>(request: Omit<ExportRequest<T>, "format">) {
  const headerRow = request.columns.map((column) => column.header);
  const dataRows = request.rows.map((row) =>
    request.columns.map((column) => normalizeXlsxCell(resolveExportCell(row, column))),
  );
  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  worksheet["!cols"] = request.columns.map((column) => {
    const values = [column.header, ...request.rows.map((row) => normalizeXlsxCell(resolveExportCell(row, column)))];
    const maxLength = values.reduce<number>((max, value) => Math.max(max, String(value ?? "").length), 10);
    return { wch: Math.min(Math.max(maxLength + 2, 10), 42) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(request.sheetName ?? request.title));
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], { type: XLSX_MIME });
}

export function exportXlsxRequest<T>(request: Omit<ExportRequest<T>, "format">): ExportResult {
  if (!request.rows.length) {
    return { ok: false, errorCode: "empty-data", error: "No data to export." };
  }

  try {
    const fileName = sanitizeFileName(request.fileName, ".xlsx");
    return downloadBlob(createXlsxBlob(request), fileName);
  } catch (error) {
    return {
      ok: false,
      errorCode: "xlsx-failed",
      error: error instanceof Error ? error.message : "XLSX export failed.",
    };
  }
}
