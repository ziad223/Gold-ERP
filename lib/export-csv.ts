import { exportCsvRequest } from "@/lib/export/csv-exporter";

export function exportCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const columns = rows.length
    ? Object.keys(rows[0]).map((key) => ({ key, header: key }))
    : [];

  return exportCsvRequest({
    fileName: filename,
    title: filename.replace(/\.csv$/i, ""),
    columns,
    rows,
    locale: "en",
  });
}
