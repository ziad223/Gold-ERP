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
import type { Invoice, InvoiceItem, Asset, Product, CreateExchangePayload, ExchangeNewItem } from "@/lib/types";
import { queryKeys } from "@/lib/query-keys";
import { toEnglishDigits } from "@/lib/formatters/numbers";
import { usePermissions } from "@/hooks/use-permissions";

type InvoiceListLookupResponse = {
  items?: Invoice[];
  data?: {
    items?: Invoice[];
  };
};

// New replacement item held in the exchange cart. Asset is always qty 1; product
// carries an editable quantity (1..available). Display fields only — the backend
// computes the authoritative price/cost.
type ExchangeCartItem =
  | { type: "asset"; id: string; name: string; price: number; quantity: 1 }
  | { type: "product"; id: string; name: string; price: number; quantity: number; available: number };

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
  // Track the returned line by a unique line key (so duplicate product lines are
  // distinguishable); selectedReturnAssetId/Item are derived from it below.
  const [selectedReturnLineKey, setSelectedReturnLineKey] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [newItemKind, setNewItemKind] = useState<"asset" | "product">("asset");
  const [cart, setCart] = useState<ExchangeCartItem[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiAssets, setApiAssets] = useState<Asset[]>([]);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);

  const currency = company?.currency ?? "AED";
  const money = (value: number) => toEnglishDigits(formatCurrency(value, currency, locale));
  const BackIcon = rtl ? ArrowRight : ArrowLeft;

  // Display-only: an invoice line whose stored id starts with PRD-ID is a product
  // (its full quantity is exchanged); anything else is a unique asset.
  const isProductItem = (id: string) => String(id || "").startsWith("PRD-ID");

  // Returned line is selected by a unique key (line id when present, else index),
  // so the second of two same-product lines can be targeted precisely.
  const lineKey = (item: InvoiceItem, index: number) => (item.id != null ? `id:${item.id}` : `idx:${index}`);
  const selectedReturnItem = useMemo(
    () => (returnInvoice?.items ?? []).find((item, index) => lineKey(item, index) === selectedReturnLineKey) ?? null,
    [returnInvoice, selectedReturnLineKey]
  );
  const selectedReturnAssetId = selectedReturnItem?.assetId ?? "";

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
        setSelectedReturnLineKey("");
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
        setSelectedReturnLineKey("");
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

  // Fetch available products in API mode (reuses the existing /products endpoint)
  useEffect(() => {
    if (apiMode) {
      const queryParams = new URLSearchParams({ search: searchQuery, pageSize: "50" });
      apiClient<{ items: Product[] }>(`/products?${queryParams.toString()}`, { locale })
        .then((res) => setApiProducts((res.items || []).filter((p) => Number(p.quantityAvailable) > 0)))
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

  // Available new products list (API mode only; mock has no product inventory)
  const availableNewProducts = useMemo(() => (apiMode ? apiProducts : []), [apiMode, apiProducts]);

  const inCart = (id: string) => cart.some((item) => item.id === id);
  const dupMessage = rtl ? "لا يمكن إضافة نفس العنصر مرتين." : "Cannot add the same item twice.";

  const addAssetToCart = (asset: Asset) => {
    setErrorMsg("");
    if (inCart(asset.id)) { setErrorMsg(dupMessage); return; }
    setCart((c) => [...c, { type: "asset", id: asset.id, name: asset.name, price: Number(asset.price) || 0, quantity: 1 }]);
  };

  const addProductToCart = (product: Product) => {
    setErrorMsg("");
    if (inCart(product.id)) { setErrorMsg(dupMessage); return; }
    if (Number(product.quantityAvailable) < 1) {
      setErrorMsg(rtl ? "لا توجد كمية متاحة لهذا المنتج." : "No available quantity for this product.");
      return;
    }
    setCart((c) => [...c, { type: "product", id: product.id, name: product.productName, price: Number(product.salePrice) || 0, quantity: 1, available: Number(product.quantityAvailable) }]);
  };

  const removeFromCart = (id: string) => setCart((c) => c.filter((item) => item.id !== id));

  const setProductQty = (id: string, value: number) => {
    setCart((c) => c.map((item) => (item.id === id && item.type === "product") ? { ...item, quantity: value } : item));
  };

  const returnAssetVal = useMemo(() => (selectedReturnItem ? selectedReturnItem.price : 0), [selectedReturnItem]);

  const newAssetsVal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * (item.type === "product" ? item.quantity : 1), 0);
  }, [cart]);

  const cartHasInvalidProduct = cart.some(
    (i) => i.type === "product" && (!Number.isInteger(i.quantity) || i.quantity <= 0 || i.quantity > i.available)
  );

  const difference = useMemo(() => {
    return newAssetsVal - returnAssetVal;
  }, [newAssetsVal, returnAssetVal]);

  const handlePostExchange = async () => {
    setErrorMsg("");
    if (!returnInvoice || !selectedReturnItem) {
      setErrorMsg(rtl ? "اختر الفاتورة والعنصر المرتجع." : "Select an invoice and the returned item.");
      return;
    }
    if (cart.length === 0) {
      setErrorMsg(rtl ? "أضف عنصرًا بديلًا واحدًا على الأقل." : "Add at least one replacement item.");
      return;
    }
    if (cartHasInvalidProduct) {
      setErrorMsg(rtl ? "تحقق من كميات المنتجات (عدد صحيح موجب لا يتجاوز المتاح)." : "Check product quantities (positive integer within available stock).");
      return;
    }
    if (!canCreateSales) {
      setSuccessMsg("");
      setErrorMsg(submitPermissionMessage);
      return;
    }

    // Only intent is sent — the backend computes price/cost/tax/diff server-side.
    const newItems: ExchangeNewItem[] = cart.map((item) =>
      item.type === "asset" ? { type: "asset", id: item.id } : { type: "product", id: item.id, quantity: item.quantity }
    );

    try {
      if (apiMode) {
        const payload: CreateExchangePayload = {
          originalInvoiceId: returnInvoice.id,
          returnedAssetId: selectedReturnAssetId, // fallback / compatibility + backend validation
          newItems,
          paymentMethod: "Exchange",
        };
        // Send the exact returned line id when available (mock items may lack one).
        if (selectedReturnItem?.id != null) {
          payload.returnedInvoiceItemId = selectedReturnItem.id;
        }
        await apiClient("/sales/exchanges", { method: "POST", body: JSON.stringify(payload), locale });

        const customerId = returnInvoice.customerId;
        const assetIds = cart.filter((i) => i.type === "asset").map((i) => i.id);

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.invoices }),
          customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.customerInvoices(customerId) }) : Promise.resolve(),
          customerId ? queryClient.invalidateQueries({ queryKey: queryKeys.customerStatement(customerId) }) : Promise.resolve(),
          queryClient.invalidateQueries({ queryKey: queryKeys.assets() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
          queryClient.invalidateQueries({ queryKey: queryKeys.reports }),
          queryClient.invalidateQueries({ queryKey: queryKeys.treasury }),
          queryClient.invalidateQueries({ queryKey: queryKeys.accounting }),
          queryClient.invalidateQueries({ queryKey: queryKeys.asset(selectedReturnAssetId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.assetTimeline(selectedReturnAssetId) }),
          ...assetIds.map((id) => queryClient.invalidateQueries({ queryKey: queryKeys.asset(id) })),
          ...assetIds.map((id) => queryClient.invalidateQueries({ queryKey: queryKeys.assetTimeline(id) })),
        ]);

        setSuccessMsg(rtl ? "تم تنفيذ عملية الاستبدال بنجاح!" : "Exchange executed successfully!");
      } else {
        // Local/mock: simulate asset status changes only (mock has no product
        // inventory). Product replacement items are shown on the mock invoice for
        // display, but their stock is not simulated locally.
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

        cart.filter((i) => i.type === "asset").forEach((item) => {
          updateAssetWithEvent(
            item.id,
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
              quantity: item.type === "product" ? item.quantity : 1,
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
      setSelectedReturnLineKey("");
      setCart([]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to process exchange.");
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
              (!returnInvoice.items || returnInvoice.items.length === 0) ? (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{rtl
                    ? "هذه الفاتورة لا تحتوي على بنود محفوظة، لذلك لا يمكن تنفيذ استبدال عليها. استخدم فاتورة تحتوي على بنود."
                    : "This invoice has no saved line items, so an exchange cannot be processed. Use an invoice that has items."}</span>
                </div>
              ) : (
              <div className="space-y-3 pt-3">
                <p className="text-xs text-muted">
                  {rtl ? "اختر العنصر المراد إرجاعه:" : "Choose the item to return:"}
                </p>
                <div className="space-y-2">
                  {returnInvoice.items.map((item, index) => {
                    const product = isProductItem(item.assetId);
                    const key = lineKey(item, index);
                    return (
                    <label
                      key={`${item.assetId || "item"}-${index}`}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                        selectedReturnLineKey === key
                          ? "border-brand-500 bg-brand-500/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="return-asset"
                          checked={selectedReturnLineKey === key}
                          onChange={() => setSelectedReturnLineKey(key)}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <div className="text-xs">
                          <p className="font-bold flex items-center gap-2">{item.name}<Badge tone={product ? "violet" : "blue"}>{product ? (rtl ? "منتج" : "Product") : (rtl ? "أصل" : "Asset")}</Badge></p>
                          <p className="text-[10px] text-muted">{toEnglishDigits(item.assetId)}{product ? ` · ${rtl ? "الكمية:" : "Qty:"} ${toEnglishDigits(item.quantity ?? 1)}` : ""}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-xs text-rose-600">
                        -{money(item.price)}
                      </span>
                    </label>
                    );
                  })}
                </div>
                {selectedReturnAssetId && isProductItem(selectedReturnAssetId) && (
                  <p className="text-[11px] font-bold text-muted">
                    {rtl
                      ? "ملاحظة: سيتم استبدال كامل كمية المنتج المحدد في الفاتورة الأصلية."
                      : "Note: the selected product is exchanged at its full original quantity."}
                  </p>
                )}
              </div>
              )
            )}
          </Card>
        </div>

        {/* Step 2: New Item Selection & Checkout */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-xs">2</span>
              <h3 className="text-sm font-black text-foreground">
                {rtl ? "العناصر البديلة المراد شراؤها" : "Replacement Item(s) to Purchase"}
              </h3>
            </div>

            <p className="text-[11px] text-muted">
              {rtl
                ? "السعر والتكلفة والضريبة تُحسب من السيرفر. الأصل يُضاف بكمية 1، والمنتج بالكمية المحددة."
                : "Price, cost and tax are computed by the server. Assets add as qty 1; products use the selected quantity."}
            </p>

            <div className="flex gap-2">
              <Button size="sm" variant={newItemKind === "asset" ? "primary" : "secondary"} onClick={() => setNewItemKind("asset")}>
                {rtl ? "أصول" : "Assets"}
              </Button>
              <Button size="sm" variant={newItemKind === "product" ? "primary" : "secondary"} onClick={() => setNewItemKind("product")}>
                {rtl ? "منتجات" : "Products"}
              </Button>
            </div>

            <input
              type="text"
              placeholder={rtl ? "البحث بالاسم، الباركود أو المعرّف..." : "Search name, barcode, or ID..."}
              className="input-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="max-h-[200px] overflow-y-auto divide-y divide-border border border-border rounded-2xl">
              {newItemKind === "asset" ? (
                availableNewAssets.length === 0 ? (
                  <p className="p-4 text-center text-xs text-muted">{rtl ? "لا توجد أصول متاحة تطابق البحث." : "No available assets match the search."}</p>
                ) : (
                  availableNewAssets.map((asset, index) => (
                    <div key={`asset-${asset.id || index}`} className="flex items-center justify-between p-3 text-xs hover:bg-table-row-hover">
                      <div>
                        <p className="font-bold flex items-center gap-2">{asset.name}<Badge tone="blue">{rtl ? "أصل" : "Asset"}</Badge></p>
                        <p className="text-[10px] text-muted">{toEnglishDigits(asset.id)} · {toEnglishDigits(asset.grossWeight)}g · {toEnglishDigits(asset.karat)}K</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-brand-600">{money(asset.price)}</span>
                        <Button size="sm" variant={inCart(asset.id) ? "secondary" : "primary"} disabled={inCart(asset.id)} onClick={() => addAssetToCart(asset)}>
                          {inCart(asset.id) ? (rtl ? "مضاف" : "Added") : (rtl ? "إضافة" : "Add")}
                        </Button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                availableNewProducts.length === 0 ? (
                  <p className="p-4 text-center text-xs text-muted">
                    {apiMode
                      ? (rtl ? "لا توجد منتجات متاحة تطابق البحث." : "No available products match the search.")
                      : (rtl ? "المنتجات غير متاحة في وضع العرض المحلي." : "Products are not available in local/mock mode.")}
                  </p>
                ) : (
                  availableNewProducts.map((product, index) => (
                    <div key={`product-${product.id || index}`} className="flex items-center justify-between p-3 text-xs hover:bg-table-row-hover">
                      <div>
                        <p className="font-bold flex items-center gap-2">{product.productName}<Badge tone="violet">{rtl ? "منتج" : "Product"}</Badge></p>
                        <p className="text-[10px] text-muted">{toEnglishDigits(product.id)} · {rtl ? "المتاح:" : "Available:"} {toEnglishDigits(product.quantityAvailable)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-brand-600">{money(product.salePrice)}</span>
                        <Button size="sm" variant={inCart(product.id) ? "secondary" : "primary"} disabled={inCart(product.id)} onClick={() => addProductToCart(product)}>
                          {inCart(product.id) ? (rtl ? "مضاف" : "Added") : (rtl ? "إضافة" : "Add")}
                        </Button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Cart overview */}
            {cart.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-dashed border-border">
                <p className="text-xs font-bold">{rtl ? "العناصر المضافة للاستبدال:" : "Selected replacement items:"}</p>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="flex justify-between items-center gap-2 bg-background p-2.5 rounded-xl text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge tone={item.type === "product" ? "violet" : "blue"}>{item.type === "product" ? (rtl ? "منتج" : "Product") : (rtl ? "أصل" : "Asset")}</Badge>
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.type === "product" && (
                          <input
                            type="number"
                            min={1}
                            max={item.available}
                            step={1}
                            value={item.quantity}
                            onChange={(e) => setProductQty(item.id, Math.floor(Number(e.target.value) || 0))}
                            className="input-base w-16 py-1 text-center"
                            aria-label={rtl ? "الكمية" : "Quantity"}
                          />
                        )}
                        <span className="font-black text-brand-700 dark:text-brand-300">{money(item.price * (item.type === "product" ? item.quantity : 1))}</span>
                        <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.id)}>{rtl ? "حذف" : "Remove"}</Button>
                      </div>
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
