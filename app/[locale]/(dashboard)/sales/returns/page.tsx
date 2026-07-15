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
  const { accountType, hasPermission } = usePermissions();

  const dataSource = getDataSourceMode();
  const apiMode = dataSource === "api";
  const usesEmployeeFirstSalesGate = accountType === "branch_shell" || accountType === "super_admin";
  const canExecuteReturns = usesEmployeeFirstSalesGate || hasPermission("sales.create");
  const submitPermissionMessage = rtl
    ? "تنفيذ مرتجع المبيعات يحتاج صلاحية مرتجعات المبيعات للموظف."
    : "Sales return submission requires Employee sales return permission.";

  const [invoiceId, setInvoiceId] = useState("");
  const [searchedInvoice, setSearchedInvoice] = useState<Invoice | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiReturnList, setApiReturnList] = useState<Invoice[]>([]);

  // Phase 30.1 — optional return settlement of the excess after AR relief.
  // Omitted by default (legacy full cash/bank refund); shown only when excess > 0.
  const [settlementEnabled, setSettlementEnabled] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [settlementReference, setSettlementReference] = useState("");
  const [settlementDescription, setSettlementDescription] = useState("");

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

  // Phase 30.1 — receivable-first math for the settlement UI. The backend stays
  // authoritative (it validates sum == excess with a 0.01 tolerance); these
  // client figures let the operator split the excess and see AR relief up front.
  const roundMoney = (value: number) => Math.round((Number(value) || 0) * 100) / 100;
  const selectedNetTotal = useMemo(
    () => selectedLineItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    [selectedLineItems]
  );
  const vatRate = Number(searchedInvoice?.vatRate || 0);
  const returnValueGross = roundMoney(selectedNetTotal * (1 + vatRate / 100));
  const outstandingAR = roundMoney(Number(searchedInvoice?.remainingAmount || 0));
  const arRelief = roundMoney(Math.min(returnValueGross, outstandingAR));
  const excess = roundMoney(Math.max(returnValueGross - arRelief, 0));
  const hasCustomer = Boolean(searchedInvoice?.customerId);

  const settleCash = roundMoney(Number(cashAmount) || 0);
  const settleBank = roundMoney(Number(bankAmount) || 0);
  const settleCredit = roundMoney(Number(creditAmount) || 0);
  const settlementSum = roundMoney(settleCash + settleBank + settleCredit);
  const settlementError = useMemo(() => {
    if (!settlementEnabled) return "";
    if (excess <= 0.01) {
      return rtl
        ? "لا حاجة لتسوية: قيمة المرتجع خفّضت الرصيد المستحق فقط."
        : "Settlement is only available when there is excess after AR relief.";
    }
    if (settleCash < 0 || settleBank < 0 || settleCredit < 0) {
      return rtl ? "لا يمكن أن تكون المبالغ سالبة." : "Amounts cannot be negative.";
    }
    if (settleCredit > 0 && !hasCustomer) {
      return rtl ? "تسوية الرصيد الدائن تتطلب وجود عميل على الفاتورة." : "Credit settlement requires a customer on the invoice.";
    }
    if (Math.abs(settlementSum - excess) > 0.01) {
      return rtl ? "مجموع النقد + البنك + الرصيد الدائن يجب أن يساوي قيمة الفائض." : "Cash + Bank + Customer Credit must equal the excess amount.";
    }
    return "";
  }, [settlementEnabled, excess, settleCash, settleBank, settleCredit, settlementSum, hasCustomer, rtl]);
  const settlementValid = !settlementEnabled || (excess > 0.01 && settlementError === "");

  const applyPreset = (mode: "cash" | "bank" | "credit") => {
    setCashAmount(mode === "cash" ? String(excess) : "0");
    setBankAmount(mode === "bank" ? String(excess) : "0");
    setCreditAmount(mode === "credit" ? String(excess) : "0");
  };

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

  // Phase 30.1 — reset the idempotency key whenever the request signature changes
  // (selected items or the settlement split), so a changed request gets a fresh
  // key. The backend hashes the whole body incl. settlement, so a stale key on a
  // changed split would 409; retrying the SAME split keeps replaying the key.
  useEffect(() => {
    idempotencyKeyRef.current = "";
  }, [selectedItems, settlementEnabled, cashAmount, bankAmount, creditAmount, settlementReference, settlementDescription]);

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
    if (!canExecuteReturns) {
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
        // Phase 30.1 — include the settlement split ONLY when the operator enabled
        // it AND there is a real excess; otherwise omit it (legacy full refund).
        if (settlementEnabled && excess > 0.01) {
          if (!settlementValid) {
            setErrorMsg(settlementError || (rtl ? "تسوية غير صحيحة." : "Invalid settlement."));
            return;
          }
          payload.settlement = {
            cashAmount: settleCash,
            bankAmount: settleBank,
            creditAmount: settleCredit,
            cashAccountCode: "1110",
            bankAccountCode: "1120",
            ...(settlementReference.trim() ? { reference: settlementReference.trim() } : {}),
            ...(settlementDescription.trim() ? { description: settlementDescription.trim() } : {}),
          };
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
      // Phase 30.1 — reset the settlement controls for the next operation.
      setSettlementEnabled(false);
      setCashAmount("");
      setBankAmount("");
      setCreditAmount("");
      setSettlementReference("");
      setSettlementDescription("");
      idempotencyKeyRef.current = "";
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
 
                  {/* Phase 30.1 — receivable-first summary + optional settlement of the excess. */}
                  <div className="space-y-3 rounded-2xl border border-border p-4">
                    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                      <div>
                        <p className="text-muted">{rtl ? "قيمة المرتجع (شامل الضريبة)" : "Return value (incl. VAT)"}</p>
                        <p className="font-black">{money(returnValueGross)}</p>
                      </div>
                      <div>
                        <p className="text-muted">{rtl ? "الرصيد المستحق على الفاتورة" : "Outstanding balance"}</p>
                        <p className="font-black">{money(outstandingAR)}</p>
                      </div>
                      <div>
                        <p className="text-muted">{rtl ? "خصم من المستحق" : "AR relief"}</p>
                        <p className="font-black text-amber-600">{money(arRelief)}</p>
                      </div>
                      <div>
                        <p className="text-muted">{rtl ? "الفائض المستحق للعميل" : "Excess due to customer"}</p>
                        <p className="font-black text-brand-700 dark:text-brand-300">{money(excess)}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted">
                      {rtl
                        ? "يُخصم مبلغ المرتجع من الرصيد المستحق للفاتورة أولاً."
                        : "The outstanding invoice balance is reduced first."}
                    </p>

                    {excess <= 0.01 ? (
                      <p className="text-xs font-bold text-muted">
                        {rtl
                          ? "لا حاجة لاسترداد أو رصيد دائن — هذا المرتجع يخفّض الرصيد المستحق فقط."
                          : "No refund or customer credit is needed. This return only reduces the outstanding invoice balance."}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-bold">
                          <input
                            type="checkbox"
                            checked={settlementEnabled}
                            onChange={(e) => setSettlementEnabled(e.target.checked)}
                          />
                          {rtl ? "تحديد طريقة تسوية الفائض" : "Add settlement options"}
                        </label>

                        {settlementEnabled && (
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset("cash")}>{rtl ? "نقداً بالكامل" : "Full Cash"}</Button>
                              <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset("bank")}>{rtl ? "بنكياً بالكامل" : "Full Bank"}</Button>
                              <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset("credit")} disabled={!hasCustomer}>{rtl ? "رصيد دائن بالكامل" : "Full Customer Credit"}</Button>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <label className="block">
                                <span className="label-base">{rtl ? "استرداد نقدي (1110)" : "Cash refund (1110)"}</span>
                                <input type="number" min="0" step="0.01" className="input-base" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} />
                              </label>
                              <label className="block">
                                <span className="label-base">{rtl ? "استرداد بنكي (1120)" : "Bank refund (1120)"}</span>
                                <input type="number" min="0" step="0.01" className="input-base" value={bankAmount} onChange={(e) => setBankAmount(e.target.value)} />
                              </label>
                              <label className="block">
                                <span className="label-base">{rtl ? "رصيد دائن للعميل" : "Customer credit"}</span>
                                <input type="number" min="0" step="0.01" className="input-base" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} disabled={!hasCustomer} />
                              </label>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <label className="block">
                                <span className="label-base">{rtl ? "مرجع (اختياري)" : "Reference (optional)"}</span>
                                <input type="text" className="input-base" value={settlementReference} onChange={(e) => setSettlementReference(e.target.value)} />
                              </label>
                              <label className="block">
                                <span className="label-base">{rtl ? "وصف (اختياري)" : "Description (optional)"}</span>
                                <input type="text" className="input-base" value={settlementDescription} onChange={(e) => setSettlementDescription(e.target.value)} />
                              </label>
                            </div>
                            <ul className="list-disc space-y-1 ps-5 text-[11px] text-muted">
                              <li>{rtl ? "الاسترداد النقدي/البنكي يُسجّل كحركة خزينة." : "Cash/Bank refund is logged as a treasury refund."}</li>
                              <li>{rtl ? "الرصيد الدائن يُضاف إلى رصيد العميل الدائن ولا يُدفع نقداً الآن." : "Customer credit is added to the customer's available credit and is not paid out now."}</li>
                              <li>{rtl ? "النقد + البنك + الرصيد الدائن يجب أن يساوي قيمة الفائض." : "Cash + Bank + Customer Credit must equal the excess amount."}</li>
                            </ul>
                            {settlementError && (
                              <p className="text-xs font-bold text-destructive">{settlementError}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center rounded-2xl bg-brand-500/5 p-4">
                    <div>
                      <p className="text-xs text-muted">{rtl ? "قيمة المستردات المتوقعة" : "Expected Refund Total"}</p>
                      <p className="text-lg font-black text-brand-700 dark:text-brand-300">
                        {money(selectedLineItems.reduce((sum, item) => sum + item.price, 0))}
                      </p>
                      {!canExecuteReturns && (
                        <p className="mt-2 max-w-sm text-xs font-bold text-destructive">
                          {submitPermissionMessage}
                        </p>
                      )}
                    </div>
                    <Button onClick={handlePostReturn} disabled={!canExecuteReturns || !settlementValid} title={!canExecuteReturns ? submitPermissionMessage : (!settlementValid ? settlementError : undefined)}>
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
