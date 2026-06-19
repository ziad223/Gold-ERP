"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Plus, Printer, ReceiptText } from "lucide-react";
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
import { InvoicePrintTemplate } from "@/features/printing/components/InvoicePrintTemplate";
import { renderPrintDocument } from "@/features/printing/components/render-print-document";
import { Link } from "@/i18n/navigation";
import { exportData } from "@/lib/export/export-service";
import { filterData } from "@/hooks/use-data-filters";
import { printHtmlDocument } from "@/lib/print/print-service";
import { formatCurrency } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import type { Invoice } from "@/lib/types";

export default function SalesPage() {
  const t = useTranslations("Sales");
  const common = useTranslations("Common");
  const filtersT = useTranslations("Filters");
  const posT = useTranslations("POS");
  const printT = useTranslations("PrintExport");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company, user } = useAuth();
  const { settings } = useAppSettings();
  const { invoices, isLoading, error, refetch } = useInvoices();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [branch, setBranch] = useState("all");
  const [selected, setSelected] = useState<Invoice | null>(null);

  const branches = useMemo(() => [...new Set(invoices.map((item) => item.branch))], [invoices]);
  const filtered = useMemo(
    () => filterData(
      invoices,
      query,
      [(item) => item.id, (item) => item.customerName, (item) => item.paymentMethod, (item) => item.branch],
      [(item) => status === "all" || item.status === status, (item) => branch === "all" || item.branch === branch],
    ),
    [invoices, query, status, branch],
  );

  const currency = company?.currency ?? settings?.currency ?? "AED";
  const money = (value: number) => formatCurrency(value, currency, locale);
  const total = invoices.reduce((sum, item) => sum + item.total, 0);
  const due = invoices.filter((item) => item.status !== "paid").reduce((sum, item) => sum + item.total, 0);
  const statusLabel = (value: Invoice["status"]) => t(value);
  const statusTone = (value: Invoice["status"]) => value === "paid" ? "green" : value === "partial" ? "amber" : value === "returned" ? "rose" : "blue";

  const printInvoice = (invoice: Invoice) => {
    const rawPaperSize = settings?.receipt?.paperSize || "A4";
    const mappedPaperSize = rawPaperSize === "thermal" ? "80mm" : rawPaperSize === "A5" ? "A5" : "A4";

    const html = renderPrintDocument(
      <InvoicePrintTemplate
        invoice={invoice}
        company={{
          name: company?.businessName ?? settings?.businessName ?? common("appName"),
          logo: company?.logo || settings?.logo,
          branch: company?.branchName,
          trn: company?.taxNumber,
          currency,
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
      { documentType: "invoice", paperSize: mappedPaperSize, title: `${printT("printInvoice")} ${invoice.id}`, locale },
    );
    const result = printHtmlDocument(html, { documentType: "invoice", paperSize: mappedPaperSize, title: invoice.id, locale });
    if (!result.ok) {
      toast.error(result.errorCode === "popup-blocked" ? printT("popupBlocked") : printT("printFailed"));
    }
  };

  const exportSales = () => {
    const result = exportData({
      fileName: "sales.csv",
      title: t("title"),
      format: "csv",
      rows: filtered,
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
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/sales/returns"><Button variant="secondary">{rtl ? "مرتجع مبيعات" : "Returns"}</Button></Link>
            <Link href="/sales/exchanges"><Button variant="secondary">{rtl ? "استبدال قطع" : "Exchanges"}</Button></Link>
            <Link href="/sales/reservations"><Button variant="secondary">{rtl ? "الحجوزات" : "Reservations"}</Button></Link>
            <Link href="/sales/customer-gold"><Button variant="secondary">{rtl ? "شراء كسر" : "Customer Gold"}</Button></Link>
            <Link href="/sales/installments"><Button variant="secondary">{rtl ? "التقسيط" : "Installments"}</Button></Link>
            <Link href="/sales/gift-vouchers"><Button variant="secondary">{rtl ? "قسائم الهدايا" : "Gift Vouchers"}</Button></Link>
            <Button variant="secondary" onClick={() => refetch()}>{common("refresh")}</Button>
            <Button variant="secondary" onClick={exportSales}><Download className="h-4 w-4" />{common("export")}</Button>
            <Link href="/pos"><Button><Plus className="h-4 w-4" />{t("newInvoice")}</Button></Link>
          </div>
        }
      />

      {error && <ErrorState message={error.message} onRetry={() => refetch()} />}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-xs font-semibold text-slate-500">{t("totalSales")}</p><p className="mt-2 text-2xl font-black text-navy-950 dark:text-white">{money(total)}</p><p className="mt-2 text-[11px] font-bold text-emerald-600">{t("periodGrowth")}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold text-slate-500">{t("dueAmounts")}</p><p className="mt-2 text-2xl font-black text-navy-950 dark:text-white">{money(due)}</p><p className="mt-2 text-[11px] text-slate-400">{t("dueHint")}</p></Card>
        <Card className="p-5"><p className="text-xs font-semibold text-slate-500">{t("averageInvoice")}</p><p className="mt-2 text-2xl font-black text-navy-950 dark:text-white">{money(total / Math.max(invoices.length, 1))}</p><p className="mt-2 text-[11px] text-slate-400">{t("branchesHint")}</p></Card>
      </div>

      <Card className="overflow-hidden">
        <DataToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder={t("search")}
          resultCount={filtered.length}
          resultLabel={filtersT("results")}
          resetLabel={filtersT("reset")}
          onReset={() => { setQuery(""); setStatus("all"); setBranch("all"); }}
          filters={[
            { id: "status", label: t("status"), value: status, onChange: setStatus, options: [{ value: "all", label: filtersT("allStatuses") }, { value: "paid", label: t("paid") }, { value: "partial", label: t("partial") }, { value: "due", label: t("due") }, { value: "returned", label: t("returned") }] },
            { id: "branch", label: t("branch"), value: branch, onChange: setBranch, options: [{ value: "all", label: filtersT("allBranches") }, ...branches.map((item) => ({ value: item, label: item }))] },
          ]}
        />

        {isLoading ? (
          <LoadingState message={common("loading")} />
        ) : filtered.length ? (
          <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-start text-xs"><thead className="bg-slate-50 text-slate-500 dark:bg-navy-950"><tr><th className="px-5 py-4">{t("invoice")}</th><th className="px-5 py-4">{t("customer")}</th><th className="px-5 py-4">{t("date")}</th><th className="px-5 py-4">{t("payment")}</th><th className="px-5 py-4">{t("branch")}</th><th className="px-5 py-4">{t("total")}</th><th className="px-5 py-4">{t("status")}</th><th className="px-5 py-4" /></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filtered.map((invoice) => <tr key={invoice.id} className="transition hover:bg-slate-50/80 dark:hover:bg-navy-950/60"><td className="px-5 py-4 font-extrabold text-brand-700 dark:text-brand-300">{invoice.id}</td><td className="px-5 py-4 font-bold text-navy-900 dark:text-white">{invoice.customerName}</td><td className="px-5 py-4 text-slate-500">{invoice.date}</td><td className="px-5 py-4 text-slate-500">{invoice.paymentMethod}</td><td className="px-5 py-4 text-slate-500">{invoice.branch}</td><td className="px-5 py-4 font-extrabold">{money(invoice.total)}</td><td className="px-5 py-4"><Badge tone={statusTone(invoice.status)}>{statusLabel(invoice.status)}</Badge></td><td className="px-5 py-4"><button onClick={() => setSelected(invoice)} className="inline-flex items-center gap-1 font-extrabold text-brand-700 hover:underline dark:text-brand-300"><Eye className="h-4 w-4" />{common("view")}</button></td></tr>)}</tbody></table></div>
        ) : <EmptyState title={common("noResults")} description={common("noResultsDescription")} />}
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.id ?? ""} description={selected?.customerName}>
        {selected && <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><Info label={t("date")} value={selected.date} /><Info label={t("payment")} value={selected.paymentMethod} /><Info label={t("status")} value={statusLabel(selected.status)} /></div><div className="rounded-3xl border border-slate-200 dark:border-slate-800"><div className="border-b border-slate-200 p-4 text-xs font-extrabold dark:border-slate-800">{t("invoiceItems")}</div>{selected.items.map((item) => <div key={item.assetId} className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-0 dark:border-slate-800"><div><p className="text-xs font-extrabold">{item.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.assetId}</p></div><p className="text-sm font-black">{money(item.price)}</p></div>)}</div><div className="flex items-center justify-between rounded-2xl bg-brand-50 p-4 text-brand-800 dark:bg-brand-500/10 dark:text-brand-200"><span className="text-sm font-bold">{t("total")}</span><span className="text-xl font-black">{money(selected.total)}</span></div><Button className="w-full" onClick={() => printInvoice(selected)}><Printer className="h-4 w-4" />{printT("printInvoice")}</Button></div>}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950"><p className="text-[10px] text-slate-400">{label}</p><p className="mt-1 text-xs font-extrabold">{value}</p></div>;
}
