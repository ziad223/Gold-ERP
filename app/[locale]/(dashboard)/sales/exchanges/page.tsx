"use client";

import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Search, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, Gem, ShoppingCart } from "lucide-react";
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
import { apiClient } from "@/lib/api/client";
import type { Invoice, Asset } from "@/lib/types";
import { queryKeys } from "@/lib/query-keys";
import { toEnglishDigits } from "@/lib/formatters/numbers";
import { usePermissions } from "@/hooks/use-permissions";

type InvoiceListLookupResponse = {
  items?: Invoice[];
  data?: {
    items?: Invoice[];
  };
};

export default function ExchangesPage() {
  const t = useTranslations("Sales");
  const locale = useLocale();
  const rtl = locale === "ar";
  const queryClient = useQueryClient();
  const { company, activeBranch, user } = useAuth();
  const { invoices, assets, addInvoice, updateAssetWithEvent } = useErp();
  const { settings } = useAppSettings();
  const { hasPermission } = usePermissions();

  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || "mock";
  const apiMode = dataSource === "api";
  const canCreateSales = hasPermission("sales.create");
  const submitPermissionMessage = rtl
    ? "تنفيذ استبدال القطع يحتاج صلاحية إنشاء مبيعات."
    : "Sales exchange submission requires the sales create permission.";

  const [invoiceId, setInvoiceId] = useState("");
  const [returnInvoice, setReturnInvoice] = useState<Invoice | null>(null);
  const [selectedReturnAssetId, setSelectedReturnAssetId] = useState<string>("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Asset[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiAssets, setApiAssets] = useState<Asset[]>([]);

  const currency = company?.currency ?? "AED";
  const money = (value: number) => toEnglishDigits(formatCurrency(value, currency, locale));
  const BackIcon = rtl ? ArrowRight : ArrowLeft;

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

  // Find invoice to return from
  const handleSearchInvoice = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    const lookupValue = invoiceId.trim();
    if (!lookupValue) return;

    try {
      if (apiMode) {
        const found = await resolveInvoiceForLookup(lookupValue);
        if (!found) {
          setErrorMsg(rtl ? "لم يتم العثور على فاتورة بهذا الرقم." : "No invoice was found with this number.");
          setReturnInvoice(null);
          return;
        }
        setReturnInvoice(found);
        setSelectedReturnAssetId("");
      } else {
        const found = invoices.find(
          (inv) => inv.id.toLowerCase() === invoiceId.trim().toLowerCase()
        );
        if (!found) {
          setErrorMsg(rtl ? "لم يتم العثور على الفاتورة." : "Invoice not found.");
          setReturnInvoice(null);
          return;
        }
        setReturnInvoice(found);
        setSelectedReturnAssetId("");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (rtl ? "تعذر تحميل الفاتورة المطلوبة." : "Unable to load the requested invoice."));
      setReturnInvoice(null);
    }
  };

  // Fetch available assets in API mode
  useEffect(() => {
    if (apiMode) {
      const filters = { status: "available" };
      const queryParams = new URLSearchParams({
        filters: JSON.stringify(filters),
        search: searchQuery
      });
      apiClient<{ items: Asset[] }>(`/assets?${queryParams.toString()}`, { locale })
        .then((res) => {
          setApiAssets(res.items || []);
        })
        .catch(() => {});
    }
  }, [apiMode, searchQuery, locale]);

  // Available new assets list
  const availableNewAssets = useMemo(() => {
    if (apiMode) return apiAssets;
    return assets.filter(
      (asset) =>
        asset.status === "available" &&
        (searchQuery === "" ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.barcode.includes(searchQuery))
    );
  }, [apiMode, apiAssets, assets, searchQuery]);

  const handleToggleCart = (asset: Asset) => {
    setCart((current) =>
      current.some((item) => item.id === asset.id)
        ? current.filter((item) => item.id !== asset.id)
        : [...current, asset]
    );
  };

  const returnAssetVal = useMemo(() => {
    if (!returnInvoice || !selectedReturnAssetId) return 0;
    const item = returnInvoice.items.find((i) => i.assetId === selectedReturnAssetId);
    return item ? item.price : 0;
  }, [returnInvoice, selectedReturnAssetId]);

  const newAssetsVal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price, 0);
  }, [cart]);

  const difference = useMemo(() => {
    return newAssetsVal - returnAssetVal;
  }, [newAssetsVal, returnAssetVal]);

  const handlePostExchange = async () => {
    if (!returnInvoice || !selectedReturnAssetId || cart.length === 0) return;
    if (!canCreateSales) {
      setSuccessMsg("");
      setErrorMsg(submitPermissionMessage);
      return;
    }

    try {
      if (apiMode) {
        await apiClient("/sales/exchanges", {
          method: "POST",
          body: JSON.stringify({
            originalInvoiceId: returnInvoice.id,
            returnedAssetId: selectedReturnAssetId,
            newAssetIds: cart.map((item) => item.id),
            paymentMethod: "Exchange"
          }),
          locale
        });

        const customerId = returnInvoice.customerId;
        const returnedAssetId = selectedReturnAssetId;
        const newAssetIds = cart.map((item) => item.id);

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
          customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.customerInvoices(customerId) }) : Promise.resolve(),
          customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.customerStatement(customerId) }) : Promise.resolve(),
          queryClient.invalidateQueries({ queryKey: queryKeys.assets() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
          queryClient.invalidateQueries({ queryKey: queryKeys.reports }),
          queryClient.invalidateQueries({ queryKey: queryKeys.treasury }),
          queryClient.invalidateQueries({ queryKey: queryKeys.accounting }),
          queryClient.invalidateQueries({ queryKey: queryKeys.asset(returnedAssetId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.assetTimeline(returnedAssetId) }),
          ...newAssetIds.map((assetId) => queryClient.invalidateQueries({ queryKey: queryKeys.asset(assetId) })),
          ...newAssetIds.map((assetId) => queryClient.invalidateQueries({ queryKey: queryKeys.assetTimeline(assetId) })),
        ]);

        setSuccessMsg(
          rtl
            ? `تم تنفيذ عملية الاستبدال بنجاح!`
            : `Exchange executed successfully!`
        );
      } else {
        const exchangeTimestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
        const returnedAsset = assets.find((a) => a.id === selectedReturnAssetId);
        updateAssetWithEvent(
          selectedReturnAssetId,
          { status: "available" },
          {
            id: `EV-EXCH-RET-${Date.now()}`,
            action: rtl ? "إرجاع باستبدال" : "EXCHANGED_OUT",
            date: exchangeTimestamp,
            user: user?.firstName || "System",
            branch: activeBranch,
            note: `${rtl ? "تم إرجاعه بالاستبدال للفاتورة: " : "Returned via exchange in Invoice: "} ${returnInvoice.id}`,
            sourceDocument: returnInvoice.id,
            beforeState: "status:sold",
            afterState: "status:available",
            severity: "info",
          },
        );

        cart.forEach((asset) => {
          updateAssetWithEvent(
            asset.id,
            { status: "sold" },
            {
              id: `EV-EXCH-IN-${Date.now()}`,
              action: rtl ? "شراء باستبدال" : "EXCHANGED_IN",
              date: exchangeTimestamp,
              user: user?.firstName || "System",
              branch: activeBranch,
              note: `${rtl ? "تم شراؤه بالاستبدال للفاتورة: " : "Purchased via exchange in Invoice: "} ${returnInvoice.id}`,
              sourceDocument: returnInvoice.id,
              beforeState: "status:available",
              afterState: "status:sold",
              severity: "info",
            },
          );
        });

        const newInvoiceId = `EX-${10000 + Math.floor(Math.random() * 9000)}`;
        const newInvoice: Invoice = {
          id: newInvoiceId,
          customerId: returnInvoice.customerId,
          customerName: returnInvoice.customerName,
          date: exchangeTimestamp,
          total: difference,
          vatRate: Number(settings.vatRate) || 0,
          tax: Math.round(difference * ((Number(settings.vatRate) || 0) / 100) * 100) / 100,
          status: "paid",
          paymentMethod: "Exchange",
          branch: activeBranch,
          items: [
            {
              assetId: selectedReturnAssetId,
              name: `${rtl ? "مرتجع استبدال: " : "Exchange Return: "} ${returnedAsset?.name || ""}`,
              quantity: 1,
              price: -returnAssetVal,
            },
            ...cart.map((item) => ({
              assetId: item.id,
              name: item.name,
              quantity: 1,
              price: item.price,
            })),
          ],
        };

        addInvoice(newInvoice);

        setSuccessMsg(
          rtl
            ? `تم تنفيذ عملية الاستبدال بنجاح! فاتورة جديدة: ${newInvoiceId}`
            : `Exchange executed successfully! New Invoice: ${newInvoiceId}`
        );
      }
      setReturnInvoice(null);
      setInvoiceId("");
      setSelectedReturnAssetId("");
      setCart([]);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process exchange.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/sales" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-brand-700">
            <BackIcon className="h-4 w-4" />{t("back") || "Back to sales"}
          </Link>
          <h1 className="text-2xl font-black text-foreground lg:text-3xl">
            {rtl ? "استبدال الأصول" : "Asset Exchanges"}
          </h1>
          <p className="text-xs text-muted mt-1">
            {rtl ? "إجراء عملية استبدال بمرتجع دائن وشراء ممتلكات جديدة في نفس الفاتورة" : "Process swaps by returning assets and buying new assets in a single invoice."}
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.3fr]">
        {/* Step 1: Returned Item Selection */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-xs">1</span>
              <h3 className="text-sm font-black text-foreground">
                {rtl ? "العنصر المرتجع" : "Returned Item Details"}
              </h3>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={rtl ? "رقم الفاتورة الأصلية..." : "Original invoice ID..."}
                className="input-base"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
              />
              <Button onClick={handleSearchInvoice}>
                {rtl ? "تحميل الفاتورة" : "Load Invoice"}
              </Button>
            </div>

            {returnInvoice && (
              <div className="space-y-3 pt-3">
                <p className="text-xs text-muted">
                  {rtl ? "اختر القطعة المراد إرجاعها:" : "Choose the piece to return:"}
                </p>
                <div className="space-y-2">
                  {returnInvoice.items.map((item) => (
                    <label
                      key={item.assetId}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                        selectedReturnAssetId === item.assetId
                          ? "border-brand-500 bg-brand-500/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="return-asset"
                          checked={selectedReturnAssetId === item.assetId}
                          onChange={() => setSelectedReturnAssetId(item.assetId)}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <div className="text-xs">
                          <p className="font-bold">{item.name}</p>
                          <p className="text-[10px] text-muted">{toEnglishDigits(item.assetId)}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-xs text-rose-600">
                        -{money(item.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Step 2: New Item Selection & Checkout */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-xs">2</span>
              <h3 className="text-sm font-black text-foreground">
                {rtl ? "الأصل البديل المراد شراؤه" : "Alternate Asset(s) to Purchase"}
              </h3>
            </div>

            <input
              type="text"
              placeholder={rtl ? "البحث بالاسم، الباركود أو المعرّف..." : "Search name, barcode, or ID..."}
              className="input-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="max-h-[200px] overflow-y-auto divide-y divide-border border border-border rounded-2xl">
              {availableNewAssets.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted">
                  {rtl ? "لا توجد أصول متاحة تطابق البحث." : "No available assets match the search."}
                </p>
              ) : (
                availableNewAssets.map((asset) => {
                  const inCart = cart.some((c) => c.id === asset.id);
                  return (
                    <div key={asset.id} className="flex items-center justify-between p-3 text-xs hover:bg-table-row-hover">
                      <div>
                        <p className="font-bold">{asset.name}</p>
                        <p className="text-[10px] text-muted">{toEnglishDigits(asset.id)} · {toEnglishDigits(asset.grossWeight)}g · {toEnglishDigits(asset.karat)}K</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-brand-600">{money(asset.price)}</span>
                        <Button size="sm" variant={inCart ? "secondary" : "primary"} onClick={() => handleToggleCart(asset)}>
                          {inCart ? (rtl ? "إزالة" : "Remove") : (rtl ? "إضافة" : "Add")}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cart overview */}
            {cart.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-dashed border-border">
                <p className="text-xs font-bold">{rtl ? "الأصول المضافة للاستبدال:" : "Selected new assets:"}</p>
                <div className="space-y-2">
                  {cart.map((c) => (
                    <div key={c.id} className="flex justify-between items-center bg-background p-2.5 rounded-xl text-xs">
                      <span>{c.name}</span>
                      <span className="font-black text-brand-700 dark:text-brand-300">{money(c.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {selectedReturnAssetId && cart.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-destructive/10 rounded-2xl">
                    <p className="text-muted">{rtl ? "العائد الدائن" : "Total Return Credit"}</p>
                    <p className="mt-1 font-black text-rose-600">{money(returnAssetVal)}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-2xl">
                    <p className="text-muted">{rtl ? "قيمة المشتريات" : "Total Purchases"}</p>
                    <p className="mt-1 font-black text-emerald-600">{money(newAssetsVal)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-500/5">
                  <div>
                    <p className="text-xs font-bold text-muted">
                      {difference >= 0
                        ? (rtl ? "الفارق المطلوب دفعه" : "Difference to Pay")
                        : (rtl ? "الفارق المسترد للعميل" : "Difference to Refund")}
                    </p>
                    <p className="text-lg font-black text-brand-700 dark:text-brand-300">
                      {money(Math.abs(difference))}
                    </p>
                    {!canCreateSales && (
                      <p className="mt-2 max-w-sm text-xs font-bold text-destructive">
                        {submitPermissionMessage}
                      </p>
                    )}
                  </div>
                  <Button onClick={handlePostExchange} disabled={!canCreateSales} title={!canCreateSales ? submitPermissionMessage : undefined}>
                    <RefreshCw className="h-4 w-4" />
                    {rtl ? "تأكيد واستكمال الاستبدال" : "Confirm Exchange"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
