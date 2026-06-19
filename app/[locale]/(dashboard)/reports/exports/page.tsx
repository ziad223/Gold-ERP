"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Download, FileSpreadsheet, FileText, Play, Printer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { ReportPrintTemplate } from "@/features/printing/components/ReportPrintTemplate";
import { renderPrintDocument } from "@/features/printing/components/render-print-document";
import { useCoreErpData } from "@/hooks/use-core-erp-data";
import { Link } from "@/i18n/navigation";
import { exportData } from "@/lib/export/export-service";
import type { ExportColumn, ExportFormat } from "@/lib/export/export-types";
import { toEnglishDigits } from "@/lib/formatters/numbers";
import { printHtmlDocument } from "@/lib/print/print-service";
import { formatCurrency } from "@/lib/utils";

type ExportSource = "sales" | "inventory" | "customers" | "tax";
type LocalExportStatus = "ready" | "failed";
type LocalExportJob = {
  id: string;
  source: ExportSource;
  reportName: string;
  format: ExportFormat;
  status: LocalExportStatus;
  createdAt: string;
  completedAt?: string;
  fileName?: string;
  error?: string;
};

type ExportRow = Record<string, string | number | null>;

export default function ExportCenterPage() {
  const reportsT = useTranslations("Reports");
  const exportT = useTranslations("PrintExport");
  const salesT = useTranslations("Sales");
  const inventoryT = useTranslations("Inventory");
  const customersT = useTranslations("Customers");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company } = useAuth();
  const { invoices, assets, customers } = useCoreErpData();
  const [jobs, setJobs] = useState<LocalExportJob[]>([]);
  const [exportSource, setExportSource] = useState<ExportSource>("sales");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("xlsx");
  const [isTriggering, setIsTriggering] = useState(false);

  const currency = company?.currency ?? "AED";
  const BackIcon = rtl ? ArrowRight : ArrowLeft;
  const money = (value: number) => formatCurrency(value, currency, locale);
  const generatedAt = () => toEnglishDigits(new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
    numberingSystem: "latn",
  }).format(new Date()));

  const sourceLabels: Record<ExportSource, string> = useMemo(() => ({
    sales: exportT("salesSource"),
    inventory: exportT("inventorySource"),
    customers: exportT("customerSource"),
    tax: exportT("taxSource"),
  }), [exportT]);

  const buildRequest = (source: ExportSource) => {
    if (source === "sales") {
      const rows = invoices.map((invoice) => ({
        invoice: invoice.id,
        customer: invoice.customerName,
        date: invoice.date,
        branch: invoice.branch,
        total: invoice.total,
        vat: invoice.tax,
        status: invoice.status,
      }));
      const columns: ExportColumn<ExportRow>[] = [
        { key: "invoice", header: salesT("invoice") },
        { key: "customer", header: salesT("customer") },
        { key: "date", header: salesT("date") },
        { key: "branch", header: salesT("branch") },
        { key: "total", header: salesT("total"), type: "currency" },
        { key: "vat", header: exportT("vat"), type: "currency" },
        { key: "status", header: salesT("status") },
      ];
      return { rows, columns, title: sourceLabels.sales };
    }

    if (source === "inventory") {
      const rows = assets.map((asset) => ({
        asset: asset.id,
        name: asset.name,
        type: asset.type,
        karat: asset.karat ? `${asset.karat}K` : "",
        weight: asset.grossWeight,
        branch: asset.branch,
        price: asset.price,
        status: asset.status,
        barcode: asset.barcode,
      }));
      const columns: ExportColumn<ExportRow>[] = [
        { key: "asset", header: inventoryT("asset") },
        { key: "name", header: inventoryT("name") },
        { key: "type", header: inventoryT("type") },
        { key: "karat", header: inventoryT("karat") },
        { key: "weight", header: inventoryT("weight"), type: "weight" },
        { key: "branch", header: inventoryT("branch") },
        { key: "price", header: inventoryT("price"), type: "currency" },
        { key: "status", header: inventoryT("status") },
        { key: "barcode", header: exportT("barcode") },
      ];
      return { rows, columns, title: sourceLabels.inventory };
    }

    if (source === "customers") {
      const rows = customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        contact: customer.phone,
        tier: customer.tier,
        purchases: customer.purchases,
        balance: customer.balance,
        status: customer.status ?? "active",
      }));
      const columns: ExportColumn<ExportRow>[] = [
        { key: "id", header: exportT("id") },
        { key: "name", header: customersT("name") },
        { key: "contact", header: customersT("contact") },
        { key: "tier", header: customersT("tier") },
        { key: "purchases", header: customersT("purchases"), type: "currency" },
        { key: "balance", header: customersT("balance"), type: "currency" },
        { key: "status", header: exportT("status") },
      ];
      return { rows, columns, title: sourceLabels.customers };
    }

    const totalSales = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalVat = invoices.reduce((sum, invoice) => sum + invoice.tax, 0);
    const rows: ExportRow[] = [
      { metric: salesT("totalSales"), value: totalSales },
      { metric: exportT("vat"), value: totalVat },
      { metric: exportT("records"), value: invoices.length },
    ];
    const columns: ExportColumn<ExportRow>[] = [
      { key: "metric", header: exportT("metric") },
      { key: "value", header: exportT("value") },
    ];
    return { rows, columns, title: sourceLabels.tax };
  };

  const runExport = (source: ExportSource, format: ExportFormat) => {
    const request = buildRequest(source);
    const fileName = `${source}-export`;

    if (format === "pdf") {
      const html = renderPrintDocument(
        <ReportPrintTemplate
          title={request.title}
          generatedAt={`${exportT("generatedAt")}: ${generatedAt()}`}
          branch={company?.branchName}
          columns={request.columns}
          rows={request.rows}
          totals={[{ label: exportT("records"), value: request.rows.length }]}
          emptyLabel={exportT("noDataToExport")}
        />,
        {
          documentType: "report",
          paperSize: "A4",
          orientation: request.columns.length > 6 ? "landscape" : "portrait",
          title: request.title,
          locale,
        },
      );
      const result = printHtmlDocument(html, {
        documentType: "report",
        paperSize: "A4",
        orientation: request.columns.length > 6 ? "landscape" : "portrait",
        title: request.title,
        locale,
      });
      return result.ok
        ? { ok: true, fileName: `${fileName}.pdf` }
        : { ok: false, error: result.error ?? exportT("printFailed") };
    }

    return exportData({
      fileName,
      title: request.title,
      format,
      columns: request.columns,
      rows: request.rows,
      locale,
      sheetName: request.title,
    });
  };

  const handleStartExport = () => {
    setIsTriggering(true);
    const now = generatedAt();
    const jobId = `JOB-${Date.now()}`;
    try {
      const result = runExport(exportSource, exportFormat);
      const nextJob: LocalExportJob = {
        id: toEnglishDigits(jobId),
        source: exportSource,
        reportName: sourceLabels[exportSource],
        format: exportFormat,
        status: result.ok ? "ready" : "failed",
        createdAt: now,
        completedAt: generatedAt(),
        fileName: result.fileName,
        error: result.ok ? undefined : result.error,
      };
      setJobs((prev) => [nextJob, ...prev]);
      if (result.ok) {
        toast.success(exportT("exportReady"));
      } else {
        toast.error(result.errorCode === "empty-data" ? exportT("noDataToExport") : exportT("exportFailed"));
      }
    } finally {
      setIsTriggering(false);
    }
  };

  const rerunJob = (job: LocalExportJob) => {
    const result = runExport(job.source, job.format);
    if (result.ok) {
      toast.success(exportT("exportReady"));
    } else {
      toast.error(result.errorCode === "empty-data" ? exportT("noDataToExport") : exportT("exportFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/reports" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-brand-700">
            <BackIcon className="h-4 w-4" />{reportsT("back")}
          </Link>
          <h1 className="text-2xl font-black text-navy-950 dark:text-white lg:text-3xl">
            {exportT("localExportCenter")}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {exportT("localExportDescription")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.3fr]">
        <Card className="space-y-5 p-6">
          <h3 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-black text-navy-950 dark:border-slate-800 dark:text-white">
            <FileSpreadsheet className="h-5 w-5 text-brand-600" />
            {exportT("startExport")}
          </h3>

          <div className="space-y-4">
            <label className="block">
              <span className="label-base">{exportT("source")}</span>
              <select className="input-base" value={exportSource} onChange={(event) => setExportSource(event.target.value as ExportSource)}>
                <option value="sales">{sourceLabels.sales}</option>
                <option value="inventory">{sourceLabels.inventory}</option>
                <option value="customers">{sourceLabels.customers}</option>
                <option value="tax">{sourceLabels.tax}</option>
              </select>
            </label>

            <label className="block">
              <span className="label-base">{exportT("format")}</span>
              <div className="grid grid-cols-3 gap-2">
                {(["xlsx", "csv", "pdf"] as ExportFormat[]).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setExportFormat(format)}
                    className={`h-11 rounded-2xl border text-xs font-bold uppercase transition ${
                      exportFormat === format
                        ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                        : "border-slate-200 text-slate-500 dark:border-slate-700"
                    }`}
                  >
                    {format === "pdf" ? exportT("printSavePdf") : exportT(format)}
                  </button>
                ))}
              </div>
            </label>

            <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button onClick={handleStartExport} disabled={isTriggering}>
                {exportFormat === "pdf" ? <Printer className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isTriggering ? exportT("preparingFile") : exportT("startExport")}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h3 className="text-sm font-black text-navy-950 dark:text-white">
            {exportT("download")}
          </h3>

          <div className="space-y-4">
            {jobs.length ? jobs.map((job) => (
              <div key={job.id} className="space-y-3 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="block text-xs font-black text-navy-900 dark:text-white">{job.reportName}</span>
                    <span className="mt-1 block text-[10px] text-slate-400">{toEnglishDigits(job.createdAt)} · ID: {toEnglishDigits(job.id)}</span>
                  </div>
                  <Badge tone={job.status === "ready" ? "green" : "rose"}>
                    {job.status === "ready" ? exportT("ready") : exportT("failed")}
                  </Badge>
                </div>

                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>{job.format === "pdf" ? exportT("printSavePdf") : exportT(job.format)}</span>
                  <span>{toEnglishDigits(job.fileName ?? job.error ?? exportT("fileUnavailable"))}</span>
                </div>

                <div className="flex justify-end pt-1">
                  <Button variant="secondary" size="sm" className="h-8 py-1 text-xs" onClick={() => rerunJob(job)}>
                    {job.format === "pdf" ? <FileText className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                    {job.format === "pdf" ? exportT("printSavePdf") : exportT("download")}
                  </Button>
                </div>
              </div>
            )) : (
              <p className="rounded-2xl bg-slate-50 p-5 text-center text-xs font-bold text-slate-500 dark:bg-navy-950">
                {exportT("expiredFile")}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
