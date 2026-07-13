"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Plus, Printer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/settings-context";
import { useInvoices } from "@/features/sales/hooks/use-invoices";
import { useExchangeDisplay } from "@/features/sales/hooks/use-exchange-display";
import { ExchangeSummary } from "@/components/sales/ExchangeSummary";
import { InvoiceReadOnlyDetail as RawInvoiceDetail } from "@/components/sales/InvoiceReadOnlyDetail";
import { usePrintTemplateDefaults } from "@/hooks/use-print-template-defaults";
import { InvoiceDocument } from "@/features/printing/components/InvoiceDocument";
import { InvoicePrintOptionsDialog } from "@/features/printing/components/InvoicePrintOptionsDialog";
import {
  buildTemplateConfigFromPrintOptions,
  getPrintDocumentTitleOverride,
  type InvoicePrintOptions,
} from "@/features/printing/lib/invoice-print-options";
import { renderPrintDocument } from "@/features/printing/components/render-print-document";
import { Link } from "@/i18n/navigation";
import { exportData } from "@/lib/export/export-service";
import { printHtmlDocument } from "@/lib/print/print-service";
import { formatCurrency } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import type { Invoice } from "@/lib/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export default function SalesPage() {
  const t = useTranslations("Sales");
  const common = useTranslations("Common");
  const filtersT = useTranslations("Filters");
  const posT = useTranslations("POS");
  const printT = useTranslations("PrintExport");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company, user } = useAuth();
  const { settings, branches: configuredBranches } = useAppSettings();
  const { defaults: savedPrintDefaults } = usePrintTemplateDefaults();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [branch, setBranch] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isExporting, setIsExporting] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [printTarget, setPrintTarget] = useState<Invoice | null>(null);
  const {
    invoices,
    page: currentPage,
    pageSize: resolvedPageSize,
    total: resultTotal,
    totalPages,
    isLoading,
    error,
    refetch,
    fetchAllMatching,
  } = useInvoices({
    page,
    pageSize,
    search: query,
    filters: { status, branch },
  });
  const selectedIsExchange = selected?.type === "exchange";
  const {
    data: exchangeDisplay,
    isLoading: isExchangeDisplayLoading,
    error: exchangeDisplayError,
  } = useExchangeDisplay(selected?.id, Boolean(selected && selectedIsExchange));

  const branches = useMemo(() => {
    const branchNames = new Set(configuredBranches.filter((item) => item.isActive).map((item) => item.name).filter(Boolean));
    invoices.forEach((item) => {
      if (item.branch) branchNames.add(item.branch);
    });
    if (branch !== "all") branchNames.add(branch);
    return [...branchNames];
  }, [configuredBranches, invoices, branch]);

  const currency = company?.currency ?? settings?.currency ?? "AED";
  const money = (value: number) => formatCurrency(value, currency, locale);
  const visiblePageTotal = invoices.reduce((sum, item) => sum + item.total, 0);
  const visiblePageDue = invoices.filter((item) => item.status !== "paid").reduce((sum, item) => sum + item.total, 0);
  const visiblePageAverage = visiblePageTotal / Math.max(invoices.length, 1);
  const pageSummaryHint = rtl ? "إجمالي الصفحة الحالية فقط" : "Current page only";
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const firstVisibleRecord = resultTotal === 0 ? 0 : ((currentPage - 1) * resolvedPageSize) + 1;
  const lastVisibleRecord = resultTotal === 0 ? 0 : Math.min(resultTotal, firstVisibleRecord + invoices.length - 1);
  const statusLabel = (value: Invoice["status"]) => t(value);
  const statusTone = (value: Invoice["status"]) => value === "paid" ? "green" : value === "partial" ? "amber" : value === "returned" ? "rose" : "blue";

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleBranchChange = (value: string) => {
    setBranch(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setQuery("");
    setStatus("all");
    setBranch("all");
    setPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  // Direct-print compatible: calling without options prints with the company
  // saved defaults (or the 19F defaults). Options are display-only.
  const printInvoice = (invoice: Invoice, options: InvoicePrintOptions = savedPrintDefaults) => {
    const mappedPaperSize = options.templateId === "thermal" ? "80mm" : "A4";

    const html = renderPrintDocument(
      <InvoiceDocument
        templateId={options.templateId}
        invoice={invoice}
        // Phase 30.7-Fix — pass trusted exchange-display data (already fetched for
        // the selected invoice) so exchange prints render the customer-safe summary
        // instead of raw negative rows/totals. Undefined for non-exchange or when
        // the printed invoice isn't the one we fetched → conservative fallback.
        exchangeDisplay={
          invoice.type === "exchange" && selected?.id === invoice.id ? (exchangeDisplay ?? null) : undefined
        }
        templateConfig={buildTemplateConfigFromPrintOptions(options)}
        documentTitleOverride={getPrintDocumentTitleOverride(options.documentMode)}
        company={{
          name: company?.businessName ?? settings?.businessName ?? common("appName"),
          logo: company?.logo || settings?.logo,
          branch: company?.branchName,
          trn: company?.taxNumber,
          currency,
          phone: company?.phone,
          email: company?.email,
          website: company?.website,
          country: company?.country,
          city: company?.city,
          region: company?.region,
          address1: company?.address1,
          address2: company?.address2,
          postalCode: company?.postalCode,
        }}
        cashierName={[user?.firstName, user?.lastName].filter(Boolean).join(" ")}
        locale={locale}
        labels={{
          invoice: printT("invoice"),
          invoiceNo: t("invoice"),
          uuid: printT("uuid"),
          date: t("date"),
          branch: t("branch"),
          trn: printT("trn"),
          customer: t("customer"),
          cashier: posT("cashier"),
          item: posT("item"),
          assetId: printT("id"),
          description: posT("item"),
          weight: posT("weight"),
          karat: printT("karat"),
          qty: posT("qty"),
          price: posT("rate"),
          makingCharge: posT("makingCharge"),
          stoneValue: posT("stoneValue"),
          discount: posT("discount"),
          subtotal: posT("subtotal"),
          vat: posT("vatAmount"),
          total: t("total"),
          payment: t("payment"),
          remaining: printT("remaining"),
          notes: printT("notes"),
          qr: printT("qr"),
        }}
        settings={settings}
      />,
      { documentType: "invoice", paperSize: mappedPaperSize, title: `${printT("printInvoice")} ${invoice.invoiceNumber || invoice.id}`, locale },
    );
    const result = printHtmlDocument(html, { documentType: "invoice", paperSize: mappedPaperSize, title: invoice.invoiceNumber || invoice.id, locale });
    if (!result.ok) {
      toast.error(result.errorCode === "popup-blocked" ? printT("popupBlocked") : printT("printFailed"));
    }
  };

  const exportSales = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const rows = await fetchAllMatching();
      const result = exportData({
        fileName: "sales.csv",
        title: t("title"),
        format: "csv",
        rows,
        locale,
        columns: [
          { key: "id", header: t("invoice") },
          { key: "customerName", header: t("customer") },
          { key: "date", header: t("date") },
          { key: "branch", header: t("branch") },
          { key: "paymentMethod", header: t("payment") },
          { key: "total", header: t("total") },
          { key: "status", header: t("status"), value: (item) => statusLabel(item.status) },
        ],
      });

      if (result.ok) toast.success(printT("exportReady"));
      else toast.error(result.errorCode === "empty-data" ? printT("noDataToExport") : printT("exportFailed"));
    } catch {
      toast.error(printT("exportFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/sales/search-print"><Button variant="secondary"><Printer className="h-4 w-4" />{rtl ? "بحث وطباعة الفواتير" : "Invoices Search & Print"}</Button></Link>
            <Link href="/sales/returns"><Button variant="secondary">{rtl ? "مرتجع مبيعات" : "Returns"}</Button></Link>
            <Link href="/sales/exchanges"><Button variant="secondary">{rtl ? "استبدال قطع" : "Exchanges"}</Button></Link>
            <Link href="/sales/reservations"><Button variant="secondary">{rtl ? "الحجوزات" : "Reservations"}</Button></Link>
            <Link href="/sales/customer-gold"><Button variant="secondary">{rtl ? "شراء كسر" : "Customer Gold"}</Button></Link>
            <Link href="/sales/installments"><Button variant="secondary">{rtl ? "التقسيط" : "Installments"}</Button></Link>
            <Link href="/sales/gift-vouchers"><Button variant="secondary">{rtl ? "قسائم الهدايا" : "Gift Vouchers"}</Button></Link>
            <Button variant="secondary" onClick={() => refetch()}>{common("refresh")}</Button>
            <Button variant="secondary" onClick={exportSales} disabled={isExporting}><Download className="h-4 w-4" />{common("export")}</Button>
            <Link href="/pos"><Button><Plus className="h-4 w-4" />{t("newInvoice")}</Button></Link>
          </div>
        }
      />

      {error && <ErrorState message={error.message} onRetry={() => refetch()} />}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-xs font-semibold text-slate-500">{t("totalSales")}</p><p className="mt-2 text-2xl font-black text-navy-950 dark:text-white">{money(visiblePageTotal)}</p><p className="mt-2 text-[11px] font-bold text-emerald-600">{pageSummaryHint}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold text-slate-500">{t("dueAmounts")}</p><p className="mt-2 text-2xl font-black text-navy-950 dark:text-white">{money(visiblePageDue)}</p><p className="mt-2 text-[11px] text-slate-400">{pageSummaryHint}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold text-slate-500">{t("averageInvoice")}</p><p className="mt-2 text-2xl font-black text-navy-950 dark:text-white">{money(visiblePageAverage)}</p><p className="mt-2 text-[11px] text-slate-400">{pageSummaryHint}</p></Card>
      </div>

      <Card className="overflow-hidden">
        <DataToolbar
          query={query}
          onQueryChange={handleQueryChange}
          placeholder={t("search")}
          resultCount={resultTotal}
          resultLabel={filtersT("results")}
          resetLabel={filtersT("reset")}
          onReset={handleResetFilters}
          filters={[
            { id: "status", label: t("status"), value: status, onChange: handleStatusChange, options: [{ value: "all", label: filtersT("allStatuses") }, { value: "paid", label: t("paid") }, { value: "partial", label: t("partial") }, { value: "due", label: t("due") }, { value: "returned", label: t("returned") }] },
            { id: "branch", label: t("branch"), value: branch, onChange: handleBranchChange, options: [{ value: "all", label: filtersT("allBranches") }, ...branches.map((item) => ({ value: item, label: item }))] },
          ]}
        />

        {isLoading ? (
          <LoadingState message={common("loading")} />
        ) : invoices.length ? (
          <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-start text-xs"><thead className="bg-slate-50 text-slate-500 dark:bg-navy-950"><tr><th className="px-5 py-4">{t("invoice")}</th><th className="px-5 py-4">{t("customer")}</th><th className="px-5 py-4">{t("date")}</th><th className="px-5 py-4">{t("payment")}</th><th className="px-5 py-4">{t("branch")}</th><th className="px-5 py-4">{t("total")}</th><th className="px-5 py-4">{t("status")}</th><th className="px-5 py-4" /></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{invoices.map((invoice) => <tr key={invoice.id} className="transition hover:bg-slate-50/80 dark:hover:bg-navy-950/60"><td className="px-5 py-4 font-extrabold text-brand-700 dark:text-brand-300">{invoice.invoiceNumber || invoice.id}</td><td className="px-5 py-4 font-bold text-navy-900 dark:text-white">{invoice.customerName}</td><td className="px-5 py-4 text-slate-500">{invoice.date}</td><td className="px-5 py-4 text-slate-500">{invoice.paymentMethod}</td><td className="px-5 py-4 text-slate-500">{invoice.branch}</td><td className="px-5 py-4 font-extrabold">{money(invoice.total)}</td><td className="px-5 py-4"><Badge tone={statusTone(invoice.status)}>{statusLabel(invoice.status)}</Badge></td><td className="px-5 py-4"><button onClick={() => setSelected(invoice)} className="inline-flex items-center gap-1 font-extrabold text-brand-700 hover:underline dark:text-brand-300"><Eye className="h-4 w-4" />{common("view")}</button></td></tr>)}</tbody></table></div>
        ) : <EmptyState title={common("noResults")} description={common("noResultsDescription")} />}

        {!isLoading && resultTotal > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-xs dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-slate-500">
              {rtl
                ? `عرض ${firstVisibleRecord}-${lastVisibleRecord} من ${resultTotal}`
                : `Showing ${firstVisibleRecord}-${lastVisibleRecord} of ${resultTotal}`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={pageSize}
                onChange={(event) => handlePageSizeChange(event.target.value)}
                className="h-9 rounded-2xl border border-border bg-panel px-3 text-xs font-semibold text-foreground outline-none focus:ring-4 focus:ring-ring/20"
                aria-label={rtl ? "عدد الفواتير في الصفحة" : "Invoices per page"}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {rtl ? `${option} لكل صفحة` : `${option} / page`}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                {rtl ? "السابق" : "Previous"}
              </Button>
              <span className="min-w-20 text-center font-bold text-slate-500">
                {rtl ? `صفحة ${currentPage} / ${safeTotalPages}` : `Page ${currentPage} / ${safeTotalPages}`}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={currentPage >= safeTotalPages}
                onClick={() => setPage((value) => Math.min(safeTotalPages, value + 1))}
              >
                {rtl ? "التالي" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.id ?? ""} description={selected?.customerName}>
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Info label={t("date")} value={selected.date} />
              <Info label={t("payment")} value={selected.paymentMethod} />
              <Info label={t("status")} value={statusLabel(selected.status)} />
            </div>

            {selectedIsExchange && isExchangeDisplayLoading ? (
              <div className="rounded-3xl border border-slate-200 p-6 text-center text-xs font-semibold text-slate-500 dark:border-slate-800">
                {rtl ? "جارٍ تحميل ملخص الاستبدال…" : "Loading exchange summary…"}
              </div>
            ) : selectedIsExchange && exchangeDisplay ? (
              <ExchangeSummary invoice={selected} display={exchangeDisplay} currency={currency} />
            ) : (
              <RawInvoiceDetail
                invoice={selected}
                exchangeError={exchangeDisplayError}
                currency={currency}
                locale={locale}
                itemTitle={t("invoiceItems")}
                totalLabel={t("total")}
                money={money}
              />
            )}

            <Button className="w-full" onClick={() => setPrintTarget(selected)}>
              <Printer className="h-4 w-4" />{printT("printInvoice")}
            </Button>
          </div>
        )}
      </Modal>

      <InvoicePrintOptionsDialog
        open={Boolean(printTarget)}
        invoice={printTarget}
        locale={locale}
        initialOptions={savedPrintDefaults}
        onClose={() => setPrintTarget(null)}
        onPrint={(invoice, options) => {
          printInvoice(invoice, options);
          setPrintTarget(null);
        }}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950"><p className="text-[10px] text-slate-400">{label}</p><p className="mt-1 text-xs font-extrabold">{value}</p></div>;
}
