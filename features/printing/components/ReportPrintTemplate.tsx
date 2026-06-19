import type { ExportColumn } from "@/lib/export/export-types";
import { resolveExportCell } from "@/lib/export/csv-exporter";

interface ReportPrintTemplateProps<T> {
  title: string;
  subtitle?: string;
  generatedAt: string;
  branch?: string;
  filtersSummary?: string;
  columns: ExportColumn<T>[];
  rows: T[];
  totals?: Array<{ label: string; value: string | number }>;
  emptyLabel: string;
}

export function ReportPrintTemplate<T>({
  title,
  subtitle,
  generatedAt,
  branch,
  filtersSummary,
  columns,
  rows,
  totals,
  emptyLabel,
}: ReportPrintTemplateProps<T>) {
  return (
    <article className="print-document print-page" data-print-root>
      <header className="print-header">
        <div>
          <h1 className="print-title">{title}</h1>
          {subtitle && <p className="print-subtitle">{subtitle}</p>}
          <p className="print-subtitle">{generatedAt}</p>
        </div>
        <div>
          {branch && <p className="print-subtitle">{branch}</p>}
          {filtersSummary && <p className="print-subtitle">{filtersSummary}</p>}
        </div>
      </header>

      {totals?.length ? (
        <section className="print-grid print-section" style={{ marginBottom: 14 }}>
          {totals.map((total) => (
            <div className="print-field" key={total.label}>
              <strong>{total.label}</strong>
              <span>{total.value}</span>
            </div>
          ))}
        </section>
      ) : null}

      {rows.length ? (
        <table className="print-table">
          <thead>
            <tr>
              {columns.map((column) => <th key={String(column.key)}>{column.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => <td key={String(column.key)}>{String(resolveExportCell(row, column) ?? "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="print-muted">{emptyLabel}</p>
      )}
    </article>
  );
}
