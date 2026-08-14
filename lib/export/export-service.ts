import { exportCsvRequest } from "./csv-exporter";
import type { ExportRequest, ExportResult } from "./export-types";
import { exportXlsxRequest } from "./xlsx-exporter";

export function exportData<T>(request: ExportRequest<T>): ExportResult {
  if (request.format === "csv") {
    return exportCsvRequest(request);
  }

  if (request.format === "xlsx") {
    return exportXlsxRequest(request);
  }

  return {
    ok: false,
    errorCode: "pdf-fallback-required",
    error: "Use Print / Save as PDF for PDF output.",
  };
}
