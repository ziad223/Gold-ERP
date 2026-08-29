"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Eye, Printer, RotateCcw, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { InvoiceReadOnlyDetail } from "@/components/sales/InvoiceReadOnlyDetail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { DateInput } from "@/components/ui/date-input";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/settings-context";
import { InvoiceDocument } from "@/features/printing/components/InvoiceDocument";
import { InvoicePrintOptionsDialog } from "@/features/printing/components/InvoicePrintOptionsDialog";
import { renderPrintDocument } from "@/features/printing/components/render-print-document";
import {
  buildTemplateConfigFromPrintOptions,
  getPrintDocumentTitleOverride,
  type InvoicePrintOptions,
} from "@/features/printing/lib/invoice-print-options";
import { useExchangeDisplay } from "@/features/sales/hooks/use-exchange-display";
import {
  SEARCH_PRINT_INVOICE_TYPES,
  SEARCH_PRINT_STATUSES,
  useInvoiceProjectionDetail,
  useInvoiceSearchPrint,
  type InvoiceSearchPrintFilters,
  type SearchPrintInvoice,
  type SearchPrintInvoiceType,
  type SearchPrintStatus,
} from "@/features/sales/hooks/use-invoice-search-print";
import { usePrintTemplateDefaults } from "@/hooks/use-print-template-defaults";
import { Link } from "@/i18n/navigation";
import { printHtmlDocument } from "@/lib/print/print-service";
import { apiClient } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const INPUT_CLASS = "h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none transition focus:ring-4 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground";

const EMPTY_FILTERS: InvoiceSearchPrintFilters = {
  search: "",
  customer: "",
  customerId: "",
  dateFrom: "",
  dateTo: "",
  branch: "all",
  employee: "",
  types: [...SEARCH_PRINT_INVOICE_TYPES],
  status: "all",
};

export default function InvoicesSearchPrintPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const common = useTranslations("Common");
  const salesT = useTranslations("Sales");
  const posT = useTranslations("POS");
  const printT = useTranslations("PrintExport");
  const { company, user } = useAuth();
  const { settings, branches: configuredBranches } = useAppSettings();
  const { defaults: savedPrintDefaults } = usePrintTemplateDefaults();
  const [draftFilters, setDraftFilters] = useState<InvoiceSearchPrintFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<InvoiceSearchPrintFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<SearchPrintInvoice | null>(null);
  const [printTarget, setPrintTarget] = useState<SearchPrintInvoice | null>(null);
  const [printedInvoiceIds, setPrintedInvoiceIds] = useState<Set<string>>(new Set());
  const {
    invoices,
    page: currentPage,
    pageSize: resolvedPageSize,
    total,
    totalPages,
    isLoading,
    error,
    refetch,
  } = useInvoiceSearchPrint({ page, pageSize, filters: appliedFilters });
  const selectedDetailQuery = useInvoiceProjectionDetail(selected);
  const selectedDetail = selectedDetailQuery.data || selected;

  const activeExchangeInvoice = printTarget?.type === "exchange"
    ? (selectedDetail || printTarget)
    : selected?.type === "exchange"
      ? selectedDetail
      : null;
  const {
    data: exchangeDisplay,
    isLoading: isExchangeDisplayLoading,
    error: exchangeDisplayError,
  } = useExchangeDisplay(activeExchangeInvoice?.id, Boolean(activeExchangeInvoice));

  const label = (english: string, arabic: string) => (rtl ? arabic : english);
  const currency = company?.currency ?? settings?.currency ?? "AED";
  const money = (value: number) => formatCurrency(value, currency, locale);
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const firstVisibleRecord = total === 0 ? 0 : ((currentPage - 1) * resolvedPageSize) + 1;
  const lastVisibleRecord = total === 0 ? 0 : Math.min(total, firstVisibleRecord + invoices.length - 1);

  const branches = useMemo(() => configuredBranches.filter((branch) => branch.isActive), [configuredBranches]);

  const typeLabel = (type: SearchPrintInvoiceType | undefined) => {
    const labels: Record<SearchPrintInvoiceType, [string, string]> = {
      sale: ["Sale", "مبيعات"],
      return: ["Return", "مرتجع"],
      exchange: ["Exchange", "استبدال"],
      installment: ["Installment", "تقسيط"],
      deposit: ["Deposit", "عربون"],
      customer_gold_purchase: ["Customer Gold Purchase", "شراء ذهب من عميل"],
      gift_voucher: ["Gift Voucher", "قسيمة هدية"],
    };
    const value = labels[type || "sale"];
    return label(value[0], value[1]);
  };

  const statusLabel = (status: SearchPrintStatus) => {
    const labels: Record<SearchPrintStatus, [string, string]> = {
      draft: ["Draft", "مسودة"],
      posted: ["Posted", "مرحّلة"],
      closed: ["Closed", "مغلقة"],
      cancelled: ["Cancelled", "ملغاة"],
      returned: ["Returned", "مرتجعة"],
    };
    return label(labels[status][0], labels[status][1]);
  };

  const statusTone = (status: SearchPrintStatus): "slate" | "blue" | "green" | "rose" | "amber" => {
    if (status === "draft") return "slate";
    if (status === "closed") return "green";
    if (status === "cancelled") return "rose";
    if (status === "returned") return "amber";
    return "blue";
  };

  const updateDraftFilter = <Key extends keyof InvoiceSearchPrintFilters>(key: Key, value: InvoiceSearchPrintFilters[Key]) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const openInvoice = (invoice: SearchPrintInvoice, forPrint = false) => {
    setSelected(invoice);
    if (forPrint) setPrintTarget(invoice);
  };

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const printInvoice = (invoice: Invoice, options: InvoicePrintOptions = savedPrintDefaults) => {
    const printableInvoice = invoice.type === "customer_gold_purchase"
      ? { ...invoice, type: "customerGoldPurchase" as const }
      : invoice.type === "gift_voucher"
        ? { ...invoice, type: "giftVoucher" as const }
      : invoice;
    const mappedPaperSize = options.templateId === "thermal" ? "80mm" : "A4";
    const html = renderPrintDocument(
      <InvoiceDocument
        templateId={options.templateId}
        invoice={printableInvoice}
        exchangeDisplay={
          invoice.type === "exchange" && activeExchangeInvoice?.id === invoice.id
            ? (exchangeDisplay ?? null)
            : undefined
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
          invoiceNo: salesT("invoice"),
          uuid: printT("uuid"),
          date: salesT("date"),
          branch: salesT("branch"),
          trn: printT("trn"),
          customer: salesT("customer"),
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
          total: salesT("total"),
          payment: salesT("payment"),
          remaining: printT("remaining"),
          notes: printT("notes"),
          qr: printT("qr"),
        }}
        settings={settings}
      />,
      {
        documentType: "invoice",
        paperSize: mappedPaperSize,
        title: `${printT("printInvoice")} ${invoice.invoiceNumber || invoice.id}`,
        locale,
      },
    );
    const result = printHtmlDocument(html, {
      documentType: "invoice",
      paperSize: mappedPaperSize,
      title: invoice.invoiceNumber || invoice.id,
      locale,
    });
    if (!result.ok) {
      toast.error(result.errorCode === "popup-blocked" ? printT("popupBlocked") : printT("printFailed"));
    }
  };

  const authorizeAndPrint = async (invoice: Invoice, options: InvoicePrintOptions = savedPrintDefaults) => {
    const sourceType = String((invoice as Invoice & { type?: string }).type || "sale");
    const key = `${sourceType}:${invoice.id}`;
    if (sourceType === "gift_voucher") {
      printInvoice(invoice, options);
      return;
    }
    const isReprint = printedInvoiceIds.has(key);
    const path = sourceType === "customer_gold_purchase"
      ? `/invoice-projection/${sourceType}/${invoice.id}/print-events`
      : `/invoices/${invoice.id}/print-events`;
    try {
      await apiClient(path, {
        method: "POST",
        body: JSON.stringify({
          type: isReprint ? "reprint" : "official",
          ...(isReprint ? { reason: "Reprint requested from Invoice Search & Print." } : {}),
        }),
        locale,
      });
      setPrintedInvoiceIds((current) => new Set(current).add(key));
      printInvoice(invoice, options);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : label("Print authorization failed", "فشل اعتماد الطباعة"));
    }
  };

  const printDialogReady = Boolean(printTarget && selectedDetail)
    && (printTarget?.type !== "exchange" || !isExchangeDisplayLoading);

  return (
    <div className="space-y-6">
      <PageHeader
        title={label("Invoices Search & Print", "بحث وطباعة الفواتير")}
        description={label(
          "Read-only search, view, and print across supported invoice records.",
          "بحث وعرض وطباعة للقراءة فقط عبر سجلات الفواتير المدعومة.",
        )}
        actions={
          <>
            <Badge tone="green">{label("Read only", "قراءة فقط")}</Badge>
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              <RotateCcw className="h-4 w-4" />
              {common("refresh")}
            </Button>
            <Link href="/sales"><Button type="button" variant="secondary">{label("Sales list", "قائمة المبيعات")}</Button></Link>
          </>
        }
      />

      <Card className="p-5">
        <form className="space-y-5" onSubmit={applyFilters} aria-label={label("Invoice search filters", "مرشحات بحث الفواتير")}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label={label("Invoice number / search", "رقم الفاتورة / بحث")} htmlFor="invoice-search">
              <input
                id="invoice-search"
                name="invoice-search"
                value={draftFilters.search}
                onChange={(event) => updateDraftFilter("search", event.target.value)}
                className={INPUT_CLASS}
                placeholder={label("Invoice number or ID", "رقم الفاتورة أو المعرّف")}
              />
            </FilterField>
            <FilterField label={label("Customer name", "اسم العميل")} htmlFor="customer-name">
              <input
                id="customer-name"
                name="customer-name"
                value={draftFilters.customer}
                onChange={(event) => updateDraftFilter("customer", event.target.value)}
                className={INPUT_CLASS}
              />
            </FilterField>
            <FilterField label={label("Customer ID", "معرّف العميل")} htmlFor="customer-id">
              <input
                id="customer-id"
                name="customer-id"
                value={draftFilters.customerId}
                onChange={(event) => updateDraftFilter("customerId", event.target.value)}
                className={INPUT_CLASS}
              />
            </FilterField>
            <FilterField label={label("Branch", "الفرع")} htmlFor="invoice-branch">
              <select
                id="invoice-branch"
                name="invoice-branch"
                value={draftFilters.branch}
                onChange={(event) => updateDraftFilter("branch", event.target.value)}
                className={INPUT_CLASS}
              >
                <option value="all">{label("All branches", "كل الفروع")}</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
            </FilterField>
            <FilterField label={label("Date from", "التاريخ من")} htmlFor="date-from">
              <DateInput
                id="date-from"
                name="date-from"
                value={draftFilters.dateFrom}
                onChange={(value) => updateDraftFilter("dateFrom", value)}
                className={INPUT_CLASS}
              />
            </FilterField>
            <FilterField label={label("Date to", "التاريخ إلى")} htmlFor="date-to">
              <DateInput
                id="date-to"
                name="date-to"
                value={draftFilters.dateTo}
                onChange={(value) => updateDraftFilter("dateTo", value)}
                className={INPUT_CLASS}
              />
            </FilterField>
            <fieldset className="block" aria-label={label("Invoice type", "نوع الفاتورة")}>
              <legend className="label-base">{label("Invoice type", "نوع الفاتورة")}</legend>
              <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-2xl border border-border bg-panel p-2">
                {SEARCH_PRINT_INVOICE_TYPES.map((type) => {
                  const checked = draftFilters.types.includes(type);
                  return (
                    <label key={type} className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border px-2.5 py-1.5 text-[11px] font-bold">
                      <input
                        type="checkbox"
                        value={type}
                        checked={checked}
                        onChange={(event) => updateDraftFilter("types", event.target.checked
                          ? [...draftFilters.types, type]
                          : draftFilters.types.filter((value) => value !== type))}
                      />
                      {typeLabel(type)}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <FilterField label={label("Invoice status", "حالة الفاتورة")} htmlFor="invoice-status">
              <select
                id="invoice-status"
                name="invoice-status"
                value={draftFilters.status}
                onChange={(event) => updateDraftFilter("status", event.target.value as SearchPrintStatus | "all")}
                className={INPUT_CLASS}
              >
                <option value="all">{label("All statuses", "كل الحالات")}</option>
                {SEARCH_PRINT_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            </FilterField>
            <FilterField
              label={label("Employee / salesperson", "الموظف / مندوب المبيعات")}
              htmlFor="employee-salesperson"
            >
              <input
                id="employee-salesperson"
                name="employee-salesperson"
                value={draftFilters.employee}
                onChange={(event) => updateDraftFilter("employee", event.target.value)}
                placeholder={label("Employee name or code", "اسم الموظف أو الكود")}
                className={INPUT_CLASS}
              />
            </FilterField>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="max-w-3xl text-xs leading-6 text-muted-foreground">
              {label(
                "Supported read-only projection sources: sale, return, exchange, installment, deposit, customer gold purchase, and gift voucher.",
                "مصادر العرض المدعومة للقراءة فقط: المبيعات والمرتجعات والاستبدال والتقسيط والعربون وشراء ذهب من عميل وقسائم الهدايا.",
              )}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4" />
                {label("Reset", "إعادة ضبط")}
              </Button>
              <Button type="submit">
                <Search className="h-4 w-4" />
                {label("Search", "بحث")}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {error && <ErrorState message={error instanceof Error ? error.message : label("Search failed", "فشل البحث")} onRetry={() => refetch()} />}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-extrabold text-foreground">{label("Results", "النتائج")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{label(`${total} matching invoices`, `${total} فاتورة مطابقة`)}</p>
          </div>
          {printTarget?.type === "exchange" && isExchangeDisplayLoading && (
            <Badge tone="amber">{label("Loading trusted exchange print data…", "جارٍ تحميل بيانات طباعة الاستبدال الموثوقة…")}</Badge>
          )}
        </div>

        {isLoading ? (
          <LoadingState message={common("loading")} />
        ) : invoices.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1450px] text-start text-xs">
              <thead className="bg-slate-50 text-slate-500 dark:bg-navy-950">
                <tr>
                  <th className="px-4 py-4">{label("Invoice number", "رقم الفاتورة")}</th>
                  <th className="px-4 py-4">{label("Invoice type", "نوع الفاتورة")}</th>
                  <th className="px-4 py-4">{label("Status", "الحالة")}</th>
                  <th className="px-4 py-4">{label("Date", "التاريخ")}</th>
                  <th className="px-4 py-4">{label("Customer", "العميل")}</th>
                  <th className="px-4 py-4">{label("Branch", "الفرع")}</th>
                  <th className="px-4 py-4">{label("Employee / salesperson", "الموظف / مندوب المبيعات")}</th>
                  <th className="px-4 py-4">{label("Total", "الإجمالي")}</th>
                  <th className="px-4 py-4">{label("Paid", "المدفوع")}</th>
                  <th className="px-4 py-4">{label("Remaining", "المتبقي")}</th>
                  <th className="px-4 py-4">{label("Actions", "الإجراءات")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((invoice) => (
                  <tr
                    key={`${invoice.type}:${invoice.id}`}
                    className="cursor-pointer transition hover:bg-slate-50/80 dark:hover:bg-navy-950/60"
                    onClick={() => openInvoice(invoice)}
                  >
                    <td className="px-4 py-4 font-extrabold text-brand-700 dark:text-brand-300">{invoice.invoiceNumber || invoice.id}</td>
                    <td className="px-4 py-4"><Badge tone="violet">{typeLabel(invoice.type)}</Badge></td>
                    <td className="px-4 py-4"><Badge tone={statusTone(invoice.searchPrintStatus)}>{statusLabel(invoice.searchPrintStatus)}</Badge></td>
                    <td className="px-4 py-4 text-slate-500">{invoice.date}</td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-foreground">{invoice.customerName}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{invoice.customerId}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{invoice.branch}</td>
                    <td className="px-4 py-4 text-slate-400">{invoice.employeeName || label("Not recorded", "غير مسجل")}</td>
                    <td className="px-4 py-4 font-extrabold">{money(invoice.total)}</td>
                    <td className="px-4 py-4 font-bold">{invoice.paidAmount === undefined ? "—" : money(invoice.paidAmount)}</td>
                    <td className="px-4 py-4 font-bold">{invoice.remainingAmount === undefined ? "—" : money(invoice.remainingAmount)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); openInvoice(invoice); }}>
                          <Eye className="h-4 w-4" />
                          {common("view")}
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={(event) => { event.stopPropagation(); openInvoice(invoice, true); }}>
                          <Printer className="h-4 w-4" />
                          {label("Print", "طباعة")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={common("noResults")} description={common("noResultsDescription")} />
        )}

        {!isLoading && total > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-muted-foreground">
              {label(
                `Showing ${firstVisibleRecord}-${lastVisibleRecord} of ${total}`,
                `عرض ${firstVisibleRecord}-${lastVisibleRecord} من ${total}`,
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="h-9 rounded-2xl border border-border bg-panel px-3 text-xs font-semibold text-foreground"
                aria-label={label("Invoices per page", "عدد الفواتير في الصفحة")}
              >
                {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option} / page</option>)}
              </select>
              <Button type="button" size="sm" variant="secondary" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>
                {label("Previous", "السابق")}
              </Button>
              <span className="min-w-20 text-center font-bold text-muted-foreground">{currentPage} / {safeTotalPages}</span>
              <Button type="button" size="sm" variant="secondary" disabled={currentPage >= safeTotalPages} onClick={() => setPage((value) => Math.min(value + 1, safeTotalPages))}>
                {label("Next", "التالي")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.invoiceNumber || selected?.id || ""}
        description={selected?.customerName}
      >
        {selected && (
          <div className="space-y-5">
            {selectedDetailQuery.isLoading && <LoadingState message={label("Loading canonical invoice detail…", "جارٍ تحميل تفاصيل الفاتورة المعتمدة…")} />}
            {selectedDetailQuery.error && <ErrorState message={label("Invoice detail is unavailable.", "تفاصيل الفاتورة غير متاحة.")} onRetry={() => selectedDetailQuery.refetch()} />}
            {selectedDetail && !selectedDetailQuery.isLoading && !selectedDetailQuery.error && (
              <>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Info label={label("Date", "التاريخ")} value={selectedDetail.date} />
                  <Info label={label("Type", "النوع")} value={typeLabel(selectedDetail.type)} />
                  <Info label={label("Status", "الحالة")} value={statusLabel(selectedDetail.searchPrintStatus)} />
                  <Info label={label("Branch", "الفرع")} value={selectedDetail.branch} />
                </div>
                <InvoiceReadOnlyDetail
                  invoice={selectedDetail}
                  exchangeDisplay={activeExchangeInvoice?.id === selectedDetail.id ? exchangeDisplay : undefined}
                  exchangeLoading={selectedDetail.type === "exchange" && isExchangeDisplayLoading}
                  exchangeError={exchangeDisplayError}
                  currency={currency}
                  locale={locale}
                  itemTitle={salesT("invoiceItems")}
                  totalLabel={salesT("total")}
                  money={money}
                />
                {selectedDetail.type === "customer_gold_purchase" && <CgpEvidence invoice={selectedDetail} label={label} />}
                {selectedDetail.type === "gift_voucher" && <GiftVoucherEvidence invoice={selectedDetail} label={label} currency={currency} />}
                <Button type="button" className="w-full" onClick={() => { setPrintTarget(selectedDetail); }}>
                  <Printer className="h-4 w-4" />
                  {printT("printInvoice")}
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>

      <InvoicePrintOptionsDialog
        open={printDialogReady}
        invoice={selectedDetail || printTarget}
        locale={locale}
        initialOptions={savedPrintDefaults}
        onClose={() => setPrintTarget(null)}
        onPrint={(invoice, options) => {
          void authorizeAndPrint(invoice, options);
          setPrintTarget(null);
        }}
      />
    </div>
  );
}

function FilterField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="label-base">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[10px] leading-5 text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-navy-950">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-extrabold">{value}</p>
    </div>
  );
}

function CgpEvidence({
  invoice,
  label,
}: {
  invoice: SearchPrintInvoice;
  label: (english: string, arabic: string) => string;
}) {
  const goldLines = invoice.projectionDetail?.goldPurchaseDetails || [];
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10" aria-label={label("Customer gold purchase evidence", "بيانات شراء الذهب من العميل") }>
      <h3 className="text-sm font-extrabold">{label("Customer Gold Purchase evidence", "بيانات شراء الذهب من العميل")}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {goldLines.map((line, index) => (
          <div key={`${String(line.sourceItemId || index)}`} className="rounded-2xl bg-white/70 p-3 dark:bg-slate-950/30">
            <p className="text-xs font-bold">{String(line.goldType || label("Gold line", "سطر ذهب"))}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {label("Net weight", "الوزن الصافي")}: {String(line.netWeight ?? "—")} · {label("Karat", "العيار")}: {String(line.karat ?? "—")}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {label("Stored rate", "السعر المحفوظ")}: {String(line.rate?.value ?? line.proposedRate ?? "—")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GiftVoucherEvidence({
  invoice,
  label,
  currency,
}: {
  invoice: SearchPrintInvoice;
  label: (english: string, arabic: string) => string;
  currency: string;
}) {
  const voucher = invoice.projectionDetail?.voucher || invoice.projectionSummary || {};
  const moneyValue = voucher.faceValue ?? invoice.total;
  const info = [
    [label("Voucher number", "رقم القسيمة"), voucher.voucherNumber ?? invoice.invoiceNumber ?? invoice.id],
    [label("Voucher code", "رمز القسيمة"), voucher.voucherCode ?? "—"],
    [label("Value", "القيمة"), `${moneyValue ?? "—"} ${voucher.currency ?? currency}`],
    [label("Voucher status", "حالة القسيمة"), voucher.status ?? invoice.projectionSummary?.voucherStatus ?? "—"],
    [label("Issued date", "تاريخ الإصدار"), voucher.issuedAt ?? invoice.date ?? "—"],
    [label("Customer", "العميل"), voucher.customerName ?? invoice.customerName ?? label("Anonymous", "بدون عميل")],
  ];
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10" aria-label={label("Gift Voucher evidence", "بيانات قسيمة الهدية")}>
      <h3 className="text-sm font-extrabold">{label("Gift Voucher", "قسيمة هدية")}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {info.map(([name, value]) => (
          <div key={name} className="rounded-2xl bg-white/70 p-3 dark:bg-slate-950/30">
            <p className="text-[10px] text-muted-foreground">{name}</p>
            <p className="mt-1 text-xs font-extrabold">{String(value || "—")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
