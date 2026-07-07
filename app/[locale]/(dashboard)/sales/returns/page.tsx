"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { getDataSourceMode } from "@/lib/data-source";
import { ArrowLeft, ArrowRight, Search, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { useAppSettings } from "@/contexts/settings-context";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { apiClient, generateUUID } from "@/lib/api/client";
import type { Invoice, InvoiceItem, CreateReturnPayload } from "@/lib/types";
import { queryKeys } from "@/lib/query-keys";
import { toEnglishDigits } from "@/lib/formatters/numbers";
import { usePermissions } from "@/hooks/use-permissions";

type InvoiceListLookupResponse = {
  items?: Invoice[];
  data?: {
    items?: Invoice[];
  };
};

export default function ReturnsPage() {
  const t = useTranslations("Sales");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const queryClient = useQueryClient();
  const { company, activeBranch, user } = useAuth();
  const { invoices, addInvoice, updateAssetWithEvent } = useErp();
  const { settings } = useAppSettings();
  const { hasPermission } = usePermissions();

  const dataSource = getDataSourceMode();
  const apiMode = dataSource === "api";
  const canCreateSales = hasPermission("sales.create");
  const submitPermissionMessage = rtl
    ? "تنفيذ مرتجع المبيعات يحتاج صلاحية إنشاء مبيعات."
    : "Sales return submission requires the sales create permission.";

  const [invoiceId, setInvoiceId] = useState("");
  const [searchedInvoice, setSearchedInvoice] = useState<Invoice | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiReturnList, setApiReturnList] = useState<Invoice[]>([]);

  const currency = company?.currency ?? "AED";
  const money = (value: number) => toEnglishDigits(formatCurrency(value, currency, locale));
  const BackIcon = rtl ? ArrowRight : ArrowLeft;

  // Display-only: an invoice line whose stored id starts with PRD-ID is a product
  // (its quantity is returned in full); anything else is a unique asset.
  const isProductItem = (id: string) => String(id || "").startsWith("PRD-ID");

  // selectedItems holds unique LINE keys (not assetIds) so duplicate product
  // lines are selected independently. Prefer the backend line id; fall back to
  // the row index for mock/local items that have no id.
  const lineKey = (item: InvoiceItem, index: number) => (item.id != null ? `id:${item.id}` : `idx:${index}`);
  const selectedLineItems = useMemo(
    () => (searchedInvoice?.items ?? []).filter((item, index) => selectedItems.includes(lineKey(item, index))),
    [searchedInvoice, selectedItems]
  );

  // Load credit notes list from API
  const loadCreditNotes = useCallback(() => {
    if (apiMode) {
      apiClient<{ items: Invoice[] }>(`/invoices?filters=${encodeURIComponent(JSON.stringify({ type: "return" }))}`, { locale })
        .then((res) => {
          setApiReturnList(res.items || []);
        })
        .catch(() => {});
    }
  }, [apiMode, locale]);

  useEffect(() => {
    loadCreditNotes();
  }, [loadCreditNotes]);

  const resolveInvoiceForLookup = async (input: string) => {
    try {
      const directRes = await apiClient<{ data?: Invoice }>(`/invoices/${encodeURIComponent(input)}`, { locale });
      if (directRes.data) return directRes.data;
    } catch (err: any) {
      if (err?.status && ![404, 422].includes(err.status)) throw err;
    }

    const params = new URLSearchParams({
      page: "1",
      pageSize: "10",
      search: input,
    });
    const searchRes = await apiClient<InvoiceListLookupResponse>(`/invoices?${params.toString()}`, { locale });
    const matches = searchRes.items ?? searchRes.data?.items ?? [];
    const normalizedInput = input.toLowerCase();
    const exactMatch = matches.find((invoice) =>
      [invoice.invoiceNumber, invoice.id].some((value) => String(value || "").toLowerCase() === normalizedInput)
    );
    if (!exactMatch && matches.length > 1) {
      throw new Error(rtl ? "يوجد أكثر من فاتورة مطابقة، استخدم رقم الفاتورة الكامل." : "More than one invoice matched. Use the full invoice number.");
    }
    const resolved = exactMatch ?? (matches.length === 1 ? matches[0] : null);

    if (!resolved) {
      return null;
    }

    const detailRes = await apiClient<{ data?: Invoice }>(`/invoices/${encodeURIComponent(resolved.id)}`, { locale });
    return detailRes.data ?? resolved;
  };

  // Search invoice handler
  const handleSearch = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    idempotencyKeyRef.current = ""; // fresh operation → fresh idempotency key
    const lookupValue = invoiceId.trim();
    if (!lookupValue) return;

    try {
      if (apiMode) {
        const found = await resolveInvoiceForLookup(lookupValue);
        if (!found) {
          setErrorMsg(rtl ? "لم يتم العثور على فاتورة بهذا الرقم." : "No invoice was found with this number.");
          setSearchedInvoice(null);
          return;
        }
        if (found.status === "returned") {
          setErrorMsg(
            rtl ? "هذه الفاتورة تم إرجاعها بالكامل مسبقاً." : "This invoice has already been fully returned."
          );
          setSearchedInvoice(null);
          return;
        }
        setSearchedInvoice(found);
        setSelectedItems([]);
      } else {
        const found = invoices.find(
          (inv) => inv.id.toLowerCase() === invoiceId.trim().toLowerCase()
        );
        if (!found) {
          setErrorMsg(rtl ? "لم يتم العثور على الفاتورة المطلوبة." : "Invoice not found.");
          setSearchedInvoice(null);
          return;
        }
        if (found.status === "returned") {
          setErrorMsg(
            rtl ? "هذه الفاتورة تم إرجاعها بالكامل مسبقاً." : "This invoice has already been fully returned."
          );
          setSearchedInvoice(null);
          return;
        }
        setSearchedInvoice(found);
        setSelectedItems([]);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (rtl ? "تعذر تحميل الفاتورة المطلوبة." : "Unable to load the requested invoice."));
      setSearchedInvoice(null);
    }
  };

  const handleToggleItem = (key: string) => {
    setSelectedItems((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    );
  };

  // Phase 21.3 — stable Idempotency-Key: generated once per submit attempt,
  // reused on retry (so a lost-response retry replays instead of duplicating),
  // reset on success and when a new invoice search starts a fresh operation.
  const idempotencyKeyRef = useRef("");

  const handlePostReturn = async () => {
    setErrorMsg("");
    if (!searchedInvoice) {
      setErrorMsg(rtl ? "ابحث عن فاتورة أولاً." : "Search for an invoice first.");
      return;
    }
    if (!searchedInvoice.items || searchedInvoice.items.length === 0) {
      setErrorMsg(rtl
        ? "هذه الفاتورة لا تحتوي على بنود محفوظة، لذلك لا يمكن تنفيذ مرتجع عليها."
        : "This invoice has no saved line items, so a return cannot be processed.");
      return;
    }
    if (selectedItems.length === 0) {
      setErrorMsg(rtl ? "اختر بندًا واحدًا على الأقل للإرجاع." : "Select at least one item to return.");
      return;
    }
    if (!canCreateSales) {
      setSuccessMsg("");
      setErrorMsg(submitPermissionMessage);
      return;
    }

    try {
      if (apiMode) {
        // Intent only — the backend computes credit-note totals/COGS/VAT.
        const lineIds = selectedLineItems.map((it) => it.id).filter((id): id is number => id != null);
        const assetIds = selectedLineItems.map((it) => it.assetId);
        const payload: CreateReturnPayload = {
          originalInvoiceId: searchedInvoice.id,
          returnedAssetIds: assetIds, // fallback / compatibility
          reason,
        };
        // Send exact line ids only when every selected line has one (mock items may not).
        if (lineIds.length > 0 && lineIds.length === selectedLineItems.length) {
          payload.returnedInvoiceItemIds = lineIds;
        }
        if (!idempotencyKeyRef.current) idempotencyKeyRef.current = generateUUID();
        await apiClient("/sales/returns", { method: "POST", body: JSON.stringify(payload), idempotencyKey: idempotencyKeyRef.current, locale });
        idempotencyKeyRef.current = "";

        const customerId = searchedInvoice.customerId;
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
          customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.customerInvoices(customerId) }) : Promise.resolve(),
          customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.customerStatement(customerId) }) : Promise.resolve(),
          queryClient.invalidateQueries({ queryKey: queryKeys.assets() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
          queryClient.invalidateQueries({ queryKey: queryKeys.reports }),
          queryClient.invalidateQueries({ queryKey: queryKeys.treasury }),
          queryClient.invalidateQueries({ queryKey: queryKeys.accounting }),
          ...assetIds.map((assetId) => queryClient.invalidateQueries({ queryKey: queryKeys.asset(assetId) })),
          ...assetIds.map((assetId) => queryClient.invalidateQueries({ queryKey: queryKeys.assetTimeline(assetId) })),
        ]);

        setSuccessMsg(
          rtl
            ? `تم تسجيل المرتجع بنجاح وإنشاء سند الرصيد الدائن`
            : `Return posted successfully! Credit Note generated.`
        );
        loadCreditNotes();
      } else {
        const returnTimestamp = new Date().toISOString().slice(0, 16).replace("T", " ");

        selectedLineItems.forEach((item) => {
          updateAssetWithEvent(
            item.assetId,
            { status: "available" },
            {
              id: `EV-RET-${Date.now()}-${item.assetId}`,
              action: rtl ? "تم الإرجاع" : "RETURNED",
              date: returnTimestamp,
              user: user?.firstName || "System",
              branch: activeBranch,
              note: `${rtl ? "تم الإرجاع للفاتورة: " : "Returned from Invoice: "} ${searchedInvoice.id}. ${rtl ? "السبب: " : "Reason: "} ${reason}`,
              sourceDocument: searchedInvoice.id,
              beforeState: "status:sold",
              afterState: "status:available",
              severity: "info",
            },
          );
        });

        const returnInvoiceId = `CN-${10000 + Math.floor(Math.random() * 9000)}`;
        const returnedValue = selectedLineItems.reduce((sum, item) => sum + item.price, 0);

        const creditNote: Invoice = {
          id: returnInvoiceId,
          type: "return",
          customerId: searchedInvoice.customerId,
          customerName: searchedInvoice.customerName,
          date: returnTimestamp,
          total: -returnedValue,
          tax: -Math.round(returnedValue * ((Number(searchedInvoice.vatRate ?? settings.vatRate) || 0) / 100) * 100) / 100,
          status: "returned",
          paymentMethod: searchedInvoice.paymentMethod,
          branch: activeBranch,
          items: selectedLineItems,
          relatedInvoiceId: searchedInvoice.id,
        };

        addInvoice(creditNote);

        setSuccessMsg(
          rtl
            ? `تم تسجيل المرتجع بنجاح وإنشاء سند الرصيد الدائن ${returnInvoiceId}`
            : `Return posted successfully! Credit Note ${returnInvoiceId} generated.`
        );
      }
      setSearchedInvoice(null);
      setInvoiceId("");
      setSelectedItems([]);
      setReason("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setErrorMsg(msg || (rtl
        ? "تعذر تنفيذ المرتجع. راجع اختيار البنود ثم حاول مرة أخرى."
        : "Could not process the return. Review the selected items and try again."));
    }
  };

  const returnList = useMemo(() => {
    if (apiMode) return apiReturnList;
    return invoices.filter((inv) => inv.total < 0);
  }, [apiMode, apiReturnList, invoices]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/sales" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-brand-700">
            <BackIcon className="h-4 w-4" />{t("back") || "Back to sales"}
          </Link>
          <h1 className="text-2xl font-black text-foreground lg:text-3xl">
            {rtl ? "مرتجع المبيعات وسندات الدائن" : "Sales Returns & Credit Notes"}
          </h1>
          <p className="text-xs text-muted mt-1">
            {rtl ? "إدارة عمليات المرتجعات واسترداد قيمة الأصول المبيعة" : "Manage sales return workflows and restore assets."}
          </p>
        </div>
      </div>
 
      {successMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
 
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
 
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          {/* Lookup Panel */}
          <Card className="p-6">
            <h3 className="text-sm font-black text-foreground mb-4">
              {rtl ? "البحث عن الفاتورة الأصلية" : "Search Original Invoice"}
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={rtl ? "مثال: INV-10650" : "e.g. INV-10650"}
                className="input-base max-w-sm"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
                {rtl ? "بحث" : "Search"}
              </Button>
            </div>
          </Card>
 
          {/* Searched Invoice Panel */}
          {searchedInvoice && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    {rtl ? "بيانات الفاتورة:" : "Invoice Details:"} {toEnglishDigits(searchedInvoice.id)}
                  </h3>
                  <p className="text-xs text-muted mt-1">
                    {searchedInvoice.customerName} · {toEnglishDigits(searchedInvoice.date)}
                  </p>
                </div>
                <Badge tone={searchedInvoice.status === "paid" ? "green" : "amber"}>
                  {searchedInvoice.status}
                </Badge>
              </div>
 
              {(!searchedInvoice.items || searchedInvoice.items.length === 0) ? (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{rtl
                    ? "هذه الفاتورة لا تحتوي على بنود محفوظة، لذلك لا يمكن تنفيذ مرتجع عليها. استخدم فاتورة تحتوي على بنود."
                    : "This invoice has no saved line items, so a return cannot be processed. Use an invoice that has items."}</span>
                </div>
              ) : (
              <div className="border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-start text-xs">
                  <thead className="bg-table-header text-muted">
                    <tr>
                      <th className="px-4 py-3 text-start w-12">{rtl ? "تحديد" : "Select"}</th>
                      <th className="px-4 py-3 text-start">{rtl ? "الأصل / العنصر" : "Asset / Item"}</th>
                      <th className="px-4 py-3 text-start">{rtl ? "النوع" : "Type"}</th>
                      <th className="px-4 py-3 text-end">{rtl ? "الكمية" : "Qty"}</th>
                      <th className="px-4 py-3 text-end">{rtl ? "سعر البيع" : "Sale Price"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {searchedInvoice.items.map((item, index) => {
                      const key = lineKey(item, index);
                      const selected = selectedItems.includes(key);
                      const product = isProductItem(item.assetId);
                      return (
                        <tr key={`${item.assetId || "item"}-${index}`} className="hover:bg-table-row-hover">
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => handleToggleItem(key)}
                              className="rounded border-border bg-input text-brand-600 focus:ring-brand-500 h-4 w-4"
                            />
                          </td>
                          <td className="px-4 py-3 font-bold text-foreground">
                            {item.name}
                            <span className="block font-mono text-[10px] text-muted">{toEnglishDigits(item.assetId)}</span>
                          </td>
                          <td className="px-4 py-3"><Badge tone={product ? "violet" : "blue"}>{product ? (rtl ? "منتج" : "Product") : (rtl ? "أصل" : "Asset")}</Badge></td>
                          <td className="px-4 py-3 text-end">{toEnglishDigits(item.quantity ?? 1)}</td>
                          <td className="px-4 py-3 text-end font-black">{money(item.price)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}

              {selectedLineItems.some((it) => isProductItem(it.assetId)) && (
                <p className="text-[11px] font-bold text-muted">
                  {rtl
                    ? "ملاحظة: سيتم إرجاع كامل كمية البنود من نوع «منتج» المحددة."
                    : "Note: selected product line(s) are returned in full quantity."}
                </p>
              )}
 
              {selectedItems.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-dashed border-border">
                  <label className="block">
                    <span className="label-base">{rtl ? "سبب الإرجاع" : "Reason for Return"}</span>
                    <input
                      type="text"
                      className="input-base"
                      placeholder={rtl ? "أدخل سبب الإرجاع هنا..." : "Enter reason for return..."}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
 
                  <div className="flex justify-between items-center rounded-2xl bg-brand-500/5 p-4">
                    <div>
                      <p className="text-xs text-muted">{rtl ? "قيمة المستردات المتوقعة" : "Expected Refund Total"}</p>
                      <p className="text-lg font-black text-brand-700 dark:text-brand-300">
                        {money(selectedLineItems.reduce((sum, item) => sum + item.price, 0))}
                      </p>
                      {!canCreateSales && (
                        <p className="mt-2 max-w-sm text-xs font-bold text-destructive">
                          {submitPermissionMessage}
                        </p>
                      )}
                    </div>
                    <Button onClick={handlePostReturn} disabled={!canCreateSales} title={!canCreateSales ? submitPermissionMessage : undefined}>
                      <RotateCcw className="h-4 w-4" />
                      {rtl ? "اعتماد المرتجع وإصدار سند دائن" : "Post Return & Credit Note"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
 
        {/* Returns Log / Credit Notes */}
        <div>
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-black text-foreground">
              {rtl ? "سندات الرصيد الدائن الصادرة" : "Issued Credit Notes"}
            </h3>
            {returnList.length === 0 ? (
              <p className="text-xs text-muted">{rtl ? "لا توجد سندات مرتجعات مسجلة." : "No credit notes recorded."}</p>
            ) : (
              <div className="space-y-3">
                {returnList.map((ret) => (
                  <div key={ret.id} className="border border-border rounded-2xl p-3 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-brand-600 dark:text-brand-400">{toEnglishDigits(ret.id)}</span>
                      <span className="text-muted">{toEnglishDigits(ret.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">{ret.customerName}</span>
                      <span className="font-black text-rose-600">{money(ret.total)}</span>
                    </div>
                    <div className="text-[10px] text-muted truncate">
                      {rtl ? "العناصر: " : "Items: "} {ret.items.map((i) => i.name).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
