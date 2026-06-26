"use client";

import { useMemo, useState } from "react";
import {
  Boxes,
  CircleDollarSign,
  Download,
  Scale,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Gem,
  Printer,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { ReportPrintTemplate } from "@/features/printing/components/ReportPrintTemplate";
import { renderPrintDocument } from "@/features/printing/components/render-print-document";
import { filterData } from "@/hooks/use-data-filters";
import { useInvoices } from "@/features/sales/hooks/use-invoices";
import { useCustomers } from "@/hooks/use-customers";
import { useAssetsList } from "@/features/inventory/hooks/use-inventory-list";
import { usePermissions } from "@/hooks/use-permissions";
import { Link } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";
import { exportData } from "@/lib/export/export-service";
import type { ExportColumn, ExportFormat } from "@/lib/export/export-types";
import { toEnglishDigits } from "@/lib/formatters/numbers";
import { printHtmlDocument } from "@/lib/print/print-service";
import { formatCurrency, formatNumber } from "@/lib/utils";

type ReportId = "sales" | "inventory" | "profit" | "customers" | "financial" | "rfid";
type ReportCategory = "sales" | "inventory" | "finance" | "customers";
type ReportRow = Record<string, string | number | null>;

interface ReportItem {
  id: ReportId;
  title: string;
  description: string;
  category: ReportCategory;
  icon: typeof ReceiptText;
}

interface PreparedReport {
  columns: ExportColumn<ReportRow>[];
  rows: ReportRow[];
  totals: Array<{ label: string; value: string | number }>;
  /** Contextual labels/warnings shown in the preview + print (5E-b). */
  notices?: string[];
}

export default function ReportsPage() {
  const t = useTranslations("Reports");
  const common = useTranslations("Common");
  const filtersT = useTranslations("Filters");
  const salesT = useTranslations("Sales");
  const inventoryT = useTranslations("Inventory");
  const customersT = useTranslations("Customers");
  const exportT = useTranslations("PrintExport");
  const locale = useLocale();
  const { company } = useAuth();
  // Phase 5C: reports build rows from the FULL matching dataset (every page)
  // via fetchAllMatching — not the ~25-row useCoreErpData sample. invoices:
  // posted-only (useInvoices); assets: company-wide standalone only
  // (standaloneOnly=true); customers: company scope.
  const invoicesList = useInvoices({ page: 1, pageSize: 20 });
  const customersList = useCustomers({ page: 1, pageSize: 25 });
  const assetsList = useAssetsList({ page: 1, pageSize: 20, standaloneOnly: true });
  const { viewCosts } = usePermissions();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [preparedReport, setPreparedReport] = useState<PreparedReport | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const currency = company?.currency ?? "AED";
  const rtl = locale === "ar";
  const money = (value: number) => formatCurrency(value, currency, locale);
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const dateTime = () => toEnglishDigits(new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
    numberingSystem: "latn",
  }).format(new Date()));

  const reports = useMemo<ReportItem[]>(() => [
    { id: "sales", title: t("sales"), description: t("salesDesc"), category: "sales", icon: ReceiptText },
    { id: "inventory", title: t("inventory"), description: t("inventoryDesc"), category: "inventory", icon: Boxes },
    { id: "profit", title: t("profit"), description: t("profitDesc"), category: "finance", icon: Gem },
    { id: "customers", title: t("customers"), description: t("customersDesc"), category: "customers", icon: UsersRound },
    { id: "financial", title: t("financial"), description: t("financialDesc"), category: "finance", icon: CircleDollarSign },
    { id: "rfid", title: t("rfid"), description: t("rfidDesc"), category: "inventory", icon: FileBarChart },
  ], [t]);

  const filtered = useMemo(
    () => filterData(
      reports,
      query,
      [(item) => item.title, (item) => item.description, (item) => item.category],
      [(item) => category === "all" || item.category === category],
    ),
    [reports, query, category],
  );

  const prepareReport = async (report: ReportItem): Promise<PreparedReport> => {
    if (report.id === "sales") {
      const invoices = await invoicesList.fetchAllMatching();
      const rows = invoices.map((invoice) => ({
        invoice: invoice.invoiceNumber || invoice.id,
        customer: invoice.customerName,
        date: invoice.date,
        payment: invoice.paymentMethod,
        branch: invoice.branch,
        total: invoice.total,
        vat: invoice.tax,
        status: invoice.status,
      }));
      return {
        columns: [
          { key: "invoice", header: salesT("invoice") },
          { key: "customer", header: salesT("customer") },
          { key: "date", header: salesT("date"), type: "date" },
          { key: "payment", header: salesT("payment") },
          { key: "branch", header: salesT("branch") },
          { key: "total", header: salesT("total"), type: "currency" },
          { key: "vat", header: exportT("vat"), type: "currency" },
          { key: "status", header: salesT("status") },
        ],
        rows,
        totals: [
          { label: salesT("totalSales"), value: money(invoices.reduce((sum, invoice) => sum + invoice.total, 0)) },
          { label: exportT("records"), value: toEnglishDigits(invoices.length) },
        ],
      };
    }

    if (report.id === "inventory") {
      const columns: ExportColumn<ReportRow>[] = [
        { key: "asset", header: inventoryT("asset") },
        { key: "type", header: inventoryT("type") },
        { key: "karat", header: inventoryT("karat") },
        { key: "weight", header: inventoryT("weight"), type: "weight" },
        { key: "branch", header: inventoryT("branch") },
        { key: "location", header: inventoryT("location") },
        { key: "salePrice", header: inventoryT("salePrice"), type: "currency" },
        { key: "status", header: inventoryT("status") },
      ];
      if (viewCosts) columns.push({ key: "cost", header: exportT("cost"), type: "currency" });
      const assets = await assetsList.fetchAllMatching();
      const rows = assets.map((asset) => ({
        asset: asset.id,
        type: asset.type,
        karat: asset.karat ? `${asset.karat}K` : "",
        weight: asset.grossWeight,
        branch: asset.branch,
        location: asset.location,
        salePrice: asset.price,
        status: asset.status,
        cost: viewCosts ? asset.cost : null,
      }));
      return {
        columns,
        rows,
        totals: [
          { label: inventoryT("totalAssets"), value: toEnglishDigits(assets.length) },
          { label: inventoryT("netGold"), value: `${formatNumber(assets.reduce((sum, asset) => sum + asset.netWeight, 0), 2, locale)}g` },
        ],
      };
    }

    if (report.id === "profit") {
      // 5E-b: realized gross profit from the server-side posted-sale aggregate.
      const res = await apiClient<any>("/reports/profit-summary", { locale });
      const p = (res?.data ?? res) ?? {};
      const tt = p.totals ?? {};
      const rows: ReportRow[] = [
        { metric: salesT("totalSales"), value: num(tt.revenue) },
        { metric: exportT("cost"), value: num(tt.cogs) },
        { metric: exportT("profit"), value: num(tt.grossProfit) },
        { metric: exportT("margin"), value: tt.marginPct === null || tt.marginPct === undefined ? "—" : `${num(tt.marginPct)}%` },
      ];
      const notices: string[] = [
        rtl ? "إجمالي ربح محقق من فواتير البيع فقط." : "Realized gross profit from posted sales invoices only.",
      ];
      if (p.returnsExchanges === "excluded_pending_item_signing_review") {
        notices.push(rtl
          ? "المرتجعات/الاستبدالات مستبعدة حتى يتم التحقق من إشارة بنودها."
          : "Returns/exchanges are excluded until their item signing is verified.");
      }
      if (tt.hasCostWarnings) {
        notices.push(rtl
          ? `قد يكون الربح غير دقيق بسبب تكاليف مفقودة/صفرية (مفقودة: ${num(tt.missingCostCount)}، صفرية: ${num(tt.zeroCostCount)}).`
          : `Profit may be inaccurate due to missing/zero costs (missing: ${num(tt.missingCostCount)}, zero: ${num(tt.zeroCostCount)}).`);
      }
      if (p.filters?.dateFilterRejected) {
        notices.push(rtl ? "تم تجاهل فلتر التاريخ لأن الصيغة غير صالحة." : "Date filter ignored — invalid format.");
      }
      return {
        columns: [
          { key: "metric", header: exportT("metric") },
          { key: "value", header: exportT("value") },
        ],
        rows,
        totals: [
          { label: exportT("profit"), value: money(num(tt.grossProfit)) },
          { label: exportT("margin"), value: tt.marginPct === null || tt.marginPct === undefined ? "—" : `${num(tt.marginPct)}%` },
        ],
        notices,
      };
    }

    if (report.id === "customers") {
      const customers = await customersList.fetchAllMatching();
      const rows = customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        contact: customer.phone,
        tier: customer.tier,
        purchases: customer.purchases,
        balance: customer.balance,
        status: customer.status ?? "active",
      }));
      return {
        columns: [
          { key: "id", header: exportT("id") },
          { key: "name", header: customersT("name") },
          { key: "contact", header: customersT("contact") },
          { key: "tier", header: customersT("tier") },
          { key: "purchases", header: customersT("purchases"), type: "currency" },
          { key: "balance", header: customersT("balance"), type: "currency" },
          { key: "status", header: common("status") },
        ],
        rows,
        totals: [
          { label: customersT("totalCustomers"), value: toEnglishDigits(customers.length) },
          { label: customersT("balance"), value: money(customers.reduce((sum, customer) => sum + customer.balance, 0)) },
        ],
      };
    }

    if (report.id === "rfid") {
      // RFID lists every standalone asset with its rfid/barcode — no
      // RFID-specific server filter is needed, so fetchAllMatching (all
      // matching standalone assets) is the complete dataset.
      const assets = await assetsList.fetchAllMatching();
      const rows = assets.map((asset) => ({
        asset: asset.id,
        name: asset.name,
        barcode: asset.barcode,
        rfid: asset.rfid ?? "",
        branch: asset.branch,
        status: asset.status,
      }));
      return {
        columns: [
          { key: "asset", header: inventoryT("asset") },
          { key: "name", header: inventoryT("name") },
          { key: "barcode", header: exportT("barcode") },
          { key: "rfid", header: exportT("rfid") },
          { key: "branch", header: inventoryT("branch") },
          { key: "status", header: inventoryT("status") },
        ],
        rows,
        totals: [
          { label: exportT("records"), value: toEnglishDigits(assets.length) },
          { label: exportT("available"), value: toEnglishDigits(assets.filter((asset) => asset.status === "available").length) },
        ],
      };
    }

    // 5E-b: financial summary from the server-side invoice-based aggregate.
    const res = await apiClient<any>("/reports/financial-summary", { locale });
    const p = (res?.data ?? res) ?? {};
    const tt = p.totals ?? {};
    const inventoryCostText = tt.inventoryCostValue === null || tt.inventoryCostValue === undefined
      ? (rtl ? "مؤجل" : "Deferred")
      : money(num(tt.inventoryCostValue));
    const rows: ReportRow[] = [
      { metric: salesT("totalSales"), value: num(tt.revenue) },
      { metric: exportT("vat"), value: num(tt.vat) },
      { metric: customersT("balance"), value: num(tt.receivables) },
      { metric: inventoryT("stockValue"), value: inventoryCostText },
    ];
    const notices: string[] = [
      rtl
        ? "ملخص مالي مبني على الفواتير المرحلة وليس تقرير دفتر أستاذ كامل."
        : "Invoice-based financial summary, not a full ledger statement.",
      rtl ? "ledgerBased: false" : "ledgerBased: false",
    ];
    if (p.filters?.dateFilterRejected) {
      notices.push(rtl ? "تم تجاهل فلتر التاريخ لأن الصيغة غير صالحة." : "Date filter ignored — invalid format.");
    }
    return {
      columns: [
        { key: "metric", header: exportT("metric") },
        { key: "value", header: exportT("value") },
      ],
      rows,
      totals: [
        { label: salesT("totalSales"), value: money(num(tt.revenue)) },
        { label: exportT("vat"), value: money(num(tt.vat)) },
      ],
      notices,
    };
  };

  const showResult = (result: { ok: boolean; errorCode?: string }) => {
    if (result.ok) {
      toast.success(exportT("exportReady"));
      return;
    }
    toast.error(result.errorCode === "empty-data" ? exportT("noDataToExport") : exportT("exportFailed"));
  };

  const openReport = (report: ReportItem) => {
    setSelected(report);
    setPreparedReport(null);
    setPreviewLoading(true);
    prepareReport(report)
      .then(setPreparedReport)
      .catch(() => toast.error(exportT("exportFailed")))
      .finally(() => setPreviewLoading(false));
  };

  const exportReport = async (report: ReportItem, format: Exclude<ExportFormat, "pdf">) => {
    if (busyAction) return; // prevent double-trigger while fetching all pages
    const actionKey = `${report.id}-${format}`;
    setBusyAction(actionKey);
    try {
      const prepared = await prepareReport(report);
      showResult(exportData({
        fileName: `${report.id}-report`,
        title: report.title,
        format,
        columns: prepared.columns,
        rows: prepared.rows,
        locale,
        sheetName: report.title,
      }));
    } catch {
      toast.error(exportT("exportFailed"));
    } finally {
      setBusyAction(null);
    }
  };

  const printReport = async (report: ReportItem, asPdf = false) => {
    if (busyAction) return;
    setBusyAction(`${report.id}-${asPdf ? "pdf" : "print"}`);
    try {
    const prepared = await prepareReport(report);
    const html = renderPrintDocument(
      <ReportPrintTemplate
        title={report.title}
        subtitle={report.description}
        generatedAt={`${exportT("generatedAt")}: ${dateTime()}`}
        branch={company?.branchName}
        filtersSummary={[
          category === "all" ? filtersT("allCategories") : report.category,
          ...(prepared.notices ?? []),
        ].join(" · ")}
        columns={prepared.columns}
        rows={prepared.rows}
        totals={prepared.totals}
        emptyLabel={exportT("noDataToExport")}
      />,
      {
        documentType: "report",
        paperSize: "A4",
        orientation: prepared.columns.length > 6 ? "landscape" : "portrait",
        title: asPdf ? `${exportT("printSavePdf")} - ${report.title}` : report.title,
        locale,
      },
    );
    const result = printHtmlDocument(html, {
      documentType: "report",
      paperSize: "A4",
      orientation: prepared.columns.length > 6 ? "landscape" : "portrait",
      title: report.title,
      locale,
    });
    if (!result.ok) {
      toast.error(result.errorCode === "popup-blocked" ? exportT("popupBlocked") : exportT("printFailed"));
    }
    } catch {
      toast.error(exportT("printFailed"));
    } finally {
      setBusyAction(null);
    }
  };

  const formatPreviewCell = (value: string | number | null, column: ExportColumn<ReportRow>) => {
    if (value === null) return "";
    if (column.type === "currency" && typeof value === "number") return money(value);
    if (column.type === "weight" && typeof value === "number") return `${formatNumber(value, 2, locale)}g`;
    return toEnglishDigits(value);
  };

  const selectedReport = preparedReport;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<div className="flex gap-2">
          <Link href="/reports/inventory-valuation"><Button variant="secondary"><Scale className="h-4 w-4" />{t("inventoryValuation")}</Button></Link>
          <Link href="/reports/exports"><Button variant="secondary"><Download className="h-4 w-4" />{t("exportCenter")}</Button></Link>
        </div>}
      />
      <Card className="overflow-hidden border-0 bg-gradient-to-l from-navy-950 via-navy-900 to-brand-900 p-6 text-white shadow-soft">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold text-brand-300">{t("smartBuilder")}</p>
            <h2 className="mt-2 text-2xl font-black">{t("builderTitle")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">{t("builderText")}</p>
          </div>
          <Button onClick={() => setBuilderOpen(true)} variant="secondary" className="bg-panel text-foreground hover:bg-surface-muted focus:ring-white/20">
            <FileBarChart className="h-4 w-4" />
            {t("customReport")}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <DataToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder={t("search")}
          resultCount={filtered.length}
          resultLabel={filtersT("results")}
          resetLabel={filtersT("reset")}
          onReset={() => { setQuery(""); setCategory("all"); }}
          filters={[{ id: "category", label: t("category"), value: category, onChange: setCategory, options: [{ value: "all", label: filtersT("allCategories") }, { value: "sales", label: t("categorySales") }, { value: "inventory", label: t("categoryInventory") }, { value: "finance", label: t("categoryFinance") }, { value: "customers", label: t("categoryCustomers") }] }]}
        />
        {filtered.length ? (
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((report) => {
              const Icon = report.icon;
              return (
                <div key={report.id} className="group rounded-3xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-panel dark:border-slate-800">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"><Icon className="h-6 w-6" /></div>
                  <h3 className="mt-4 font-black text-navy-950 dark:text-white">{report.title}</h3>
                  <p className="mt-2 min-h-12 text-xs leading-6 text-slate-500">{report.description}</p>
                  <p className="mt-3 text-[11px] font-bold text-slate-400">{rtl ? "جاهز لتصدير كل النتائج المطابقة" : "Ready to export all matching rows"}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => openReport(report)}>{t("open")}</Button>
                    <Button size="sm" variant="secondary" disabled={Boolean(busyAction)} onClick={() => exportReport(report, "csv")}><Download className="h-3.5 w-3.5" />{exportT("csv")}</Button>
                    <Button size="sm" variant="secondary" disabled={Boolean(busyAction)} onClick={() => exportReport(report, "xlsx")}><FileSpreadsheet className="h-3.5 w-3.5" />{exportT("xlsx")}</Button>
                    <Button size="sm" variant="secondary" disabled={Boolean(busyAction)} onClick={() => printReport(report)}><Printer className="h-3.5 w-3.5" />{exportT("print")}</Button>
                    <Button size="sm" variant="secondary" disabled={Boolean(busyAction)} onClick={() => printReport(report, true)}><FileText className="h-3.5 w-3.5" />{exportT("pdf")}</Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <EmptyState title={common("noResults")} description={common("noResultsDescription")} />}
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title ?? ""} description={selected?.description}>
        {selected && previewLoading && <LoadingState message={common("loading")} />}
        {selected && !previewLoading && selectedReport && (
          <div className="space-y-5">
            {selectedReport.notices && selectedReport.notices.length > 0 && (
              <div className="space-y-2">
                {selectedReport.notices.map((notice, i) => (
                  <p key={i} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                    {notice}
                  </p>
                ))}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              {selectedReport.totals.map((total) => (
                <div key={total.label} className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
                  <p className="text-[10px] text-slate-400">{total.label}</p>
                  <p className="mt-2 text-xl font-black">{toEnglishDigits(total.value)}</p>
                </div>
              ))}
            </div>
            {selectedReport.rows.length ? (
              <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[760px] text-xs">
                  <thead className="bg-slate-50 text-slate-500 dark:bg-navy-950">
                    <tr>{selectedReport.columns.map((column) => <th className="px-4 py-3 text-start" key={String(column.key)}>{column.header}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedReport.rows.slice(0, 8).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {selectedReport.columns.map((column) => (
                          <td className="px-4 py-3" key={String(column.key)}>{formatPreviewCell(row[column.key as string], column)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState title={exportT("noDataToExport")} description={common("noResultsDescription")} />}
            <div className="grid gap-2 sm:grid-cols-4">
              <Button disabled={Boolean(busyAction)} onClick={() => exportReport(selected, "csv")} variant="secondary"><Download className="h-4 w-4" />{exportT("exportCsv")}</Button>
              <Button disabled={Boolean(busyAction)} onClick={() => exportReport(selected, "xlsx")} variant="secondary"><FileSpreadsheet className="h-4 w-4" />{exportT("exportExcel")}</Button>
              <Button disabled={Boolean(busyAction)} onClick={() => printReport(selected)} variant="secondary"><Printer className="h-4 w-4" />{exportT("printReport")}</Button>
              <Button disabled={Boolean(busyAction)} onClick={() => printReport(selected, true)}><FileText className="h-4 w-4" />{exportT("printSavePdf")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={builderOpen} onClose={() => setBuilderOpen(false)} title={t("customReport")} description={t("builderModalDesc")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label><span className="label-base">{t("dataSource")}</span><select className="input-base"><option>{t("sales")}</option><option>{t("inventory")}</option><option>{t("customers")}</option></select></label>
          <label><span className="label-base">{t("period")}</span><select className="input-base"><option>{t("last30Days")}</option><option>{t("thisQuarter")}</option><option>{t("thisYear")}</option></select></label>
          <label className="sm:col-span-2"><span className="label-base">{t("reportName")}</span><input className="input-base" placeholder={t("reportNamePlaceholder")} /></label>
          <div className="flex justify-end gap-2 sm:col-span-2"><Button variant="secondary" onClick={() => setBuilderOpen(false)}>{common("cancel")}</Button><Button onClick={() => setBuilderOpen(false)}>{common("save")}</Button></div>
        </div>
      </Modal>
    </div>
  );
}
