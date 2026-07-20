"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Truck, Plus, CheckCircle2, AlertCircle, ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { NativeSelect } from "@/components/ui/native-select";
import { ReverseChargeChecklist } from "@/features/tax/components/ReverseChargeChecklist";
import { useAuth } from "@/contexts/auth-context";
import { useAssets } from "@/features/assets/hooks/use-assets";
import { useSuppliers } from "@/hooks/use-suppliers";
import { Link } from "@/i18n/navigation";
import { apiClient, generateUUID } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import { formatCurrency } from "@/lib/utils";
import type { Supplier, Asset, AssetType, Product } from "@/lib/types";
import { normalizeNumberInput, toEnglishDigits } from "@/lib/formatters/numbers";
import { useBarcodeSettings } from "@/features/settings/hooks/use-barcode-settings";

export default function SupplierPurchasesPage() {
  const t = useTranslations("Suppliers");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const queryClient = useQueryClient();
  const { company, activeBranch, activeBranchId, user } = useAuth();
  const { items: suppliers, loading: suppliersLoading, error: suppliersError, refresh: refreshSuppliers } = useSuppliers({ page: 1, pageSize: 100 });
  const { createAsset, isCreating } = useAssets();
  const { inventoryCodes: barcodeInventoryCodes, itemCodes: barcodeItemCodes } = useBarcodeSettings();
  const isApi = DATA_SOURCE === "api";

  const [supplierId, setSupplierId] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [useReverseCharge, setUseReverseCharge] = useState(false);
  const [drcVerified, setDrcVerified] = useState(false);

  // Phase 12J — purchase VAT UI. VAT is opt-in (default off) so the existing
  // no-VAT receive path is unchanged. Defaults come from company settings (12E).
  const [applyVat, setApplyVat] = useState(false);
  const [vatRate, setVatRate] = useState("5");
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [isRecoverable, setIsRecoverable] = useState(true);

  // New quantity-based product fields
  const [isQuantityBased, setIsQuantityBased] = useState(true);
  const [productCode, setProductCode] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [matchingProduct, setMatchingProduct] = useState<Product | null>(null);

  // Query products list for lookups
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiClient<any>("/products", { locale });
      return res.items || res.data?.items || [];
    },
    enabled: isApi,
  });

  // Phase 12J — company settings supply purchase-VAT defaults (12E keys).
  const { data: vatSettings } = useQuery<any>({
    queryKey: ["settings", "purchase-vat"],
    queryFn: async () => {
      const res = await apiClient<any>("/settings", { locale });
      return res.data || res;
    },
    enabled: isApi,
  });
  useEffect(() => {
    if (!vatSettings) return;
    const rate = vatSettings.purchaseVatRate ?? vatSettings.vatRate;
    if (rate !== undefined && rate !== null) setVatRate(String(rate));
    if (typeof vatSettings.purchaseTaxIncludedDefault === "boolean") setTaxIncluded(vatSettings.purchaseTaxIncludedDefault);
    if (typeof vatSettings.purchaseVatRecoverableDefault === "boolean") setIsRecoverable(vatSettings.purchaseVatRecoverableDefault);
  }, [vatSettings]);

  const handleProductCodeChange = (code: string) => {
    const cleanCode = code.toUpperCase();
    setProductCode(cleanCode);
    
    const match = products.find(p => p.productCode.toUpperCase() === cleanCode.trim());
    if (match) {
      setMatchingProduct(match);
      setAssetName(match.productName);
      setAssetType(match.stockType as AssetType);
      setKarat(String(match.karat || 21));
      setCategory(match.description || "");
      setSalePrice(String(match.salePrice || 0));
    } else {
      setMatchingProduct(null);
    }
  };

  // Form states for the new asset being purchased
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("gold-piece");
  const [category, setCategory] = useState("");
  const [itemCode, setItemCode] = useState("RNG");
  const [karat, setKarat] = useState("21");
  const [quantity, setQuantity] = useState("1");
  const [weightPerUnit, setWeightPerUnit] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [paidAmount, setPaidAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const currency = company?.currency ?? "AED";
  const selectedInventoryCode = barcodeInventoryCodes.find((code) => code.assetType === assetType && code.isActive);
  const availableItemCodes = barcodeItemCodes.filter((code) => code.isActive && (!code.allowedInventoryCodes.length || (selectedInventoryCode && code.allowedInventoryCodes.includes(selectedInventoryCode.code))));
  useEffect(() => {
    if (!selectedInventoryCode || isQuantityBased) return;
    const preferred = selectedInventoryCode.defaultItemCode;
    if (preferred && availableItemCodes.some((code) => code.code === preferred) && itemCode !== preferred) setItemCode(preferred);
    if (!selectedInventoryCode.requiresKarat) setKarat("");
  }, [selectedInventoryCode, availableItemCodes, itemCode, isQuantityBased]);
  const money = (value: number) => formatCurrency(value, currency, locale);
  const BackIcon = rtl ? ArrowRight : ArrowLeft;
  const parseDecimal = (value: string) => Number(toEnglishDigits(value).replace(",", ".")) || 0;
  const normalizeDecimalValue = (value: string) => normalizeNumberInput(value).replace(",", ".");
  const quantityNum = parseDecimal(quantity);
  const weightPerUnitNum = parseDecimal(weightPerUnit);
  const unitCostNum = parseDecimal(unitCost);
  const paidAmountNum = parseDecimal(paidAmount);
  const totalWeight = Math.round(quantityNum * weightPerUnitNum * 10000) / 10000;
  const totalCost = Math.round(quantityNum * unitCostNum * 100) / 100;
  const remainingAmount = Math.max(0, Math.round((totalCost - paidAmountNum) * 100) / 100);
  const paymentStatus = remainingAmount <= 0 && totalCost > 0 ? "paid" : paidAmountNum > 0 ? "partial" : "unpaid";

  // Phase 12J — purchase VAT preview (display only; the backend recomputes and
  // is the source of truth). Mirrors the 12I equations on the goods total. RCM
  // takes precedence when DRC is enabled.
  const vatRateNum = parseDecimal(vatRate);
  const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
  const vatRateValid = Number.isFinite(vatRateNum) && vatRateNum >= 0 && vatRateNum <= 100;
  const vatPreview = useMemo(() => {
    const goods = totalCost;
    if (useReverseCharge) {
      const rcmVatAmount = r2(goods * vatRateNum / 100);
      return { mode: "rcm" as const, taxBase: goods, inputVatAmount: 0, rcmVatAmount, payable: goods };
    }
    if (applyVat && vatRateNum > 0) {
      if (taxIncluded) {
        const taxBase = r2(goods / (1 + vatRateNum / 100));
        const inputVatAmount = r2(goods - taxBase);
        return { mode: (isRecoverable ? "inclusive" as const : "nonRecoverable" as const), taxBase, inputVatAmount, rcmVatAmount: 0, payable: goods };
      }
      const inputVatAmount = r2(goods * vatRateNum / 100);
      return { mode: (isRecoverable ? "exclusive" as const : "nonRecoverable" as const), taxBase: goods, inputVatAmount, rcmVatAmount: 0, payable: r2(goods + inputVatAmount) };
    }
    return { mode: "none" as const, taxBase: goods, inputVatAmount: 0, rcmVatAmount: 0, payable: goods };
  }, [totalCost, useReverseCharge, applyVat, vatRateNum, taxIncluded, isRecoverable]);

  const activeSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => supplier.status !== "inactive");
  }, [suppliers]);

  const selectedSupplier = useMemo(() => {
    return activeSuppliers.find((supplier) => supplier.id === supplierId) || null;
  }, [activeSuppliers, supplierId]);

  // Phase 21.3 — stable Idempotency-Key for the purchase-receive submit:
  // generated once per attempt, reused on retry, reset on success.
  const idempotencyKeyRef = useRef("");

  const handlePostPurchase = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedSupplier) {
      setErrorMsg(rtl ? "اختر المورد أولًا" : "Please select a supplier first");
      return;
    }

    if (isQuantityBased && !productCode.trim()) {
      setErrorMsg(rtl ? "رمز المنتج مطلوب للمنتجات بالكمية." : "Product code is required for quantity-based products.");
      return;
    }

    const salePriceNum = parseDecimal(salePrice);
    if (isQuantityBased && (isNaN(salePriceNum) || salePriceNum < 0)) {
      setErrorMsg(rtl ? "سعر البيع يجب أن يكون أكبر من أو يساوي الصفر." : "Sale price must be greater than or equal to zero.");
      return;
    }

    if (!assetName.trim() || quantityNum <= 0 || !Number.isInteger(quantityNum) || weightPerUnitNum <= 0 || unitCostNum < 0 || totalCost <= 0) {
      setErrorMsg(rtl ? "برجاء استكمال بيانات التوريد بشكل صحيح." : "Please fill in all asset purchase details correctly.");
      return;
    }
    if (!isQuantityBased && (!selectedInventoryCode || !itemCode)) {
      setErrorMsg(rtl ? "يجب اختيار كود مخزون وكود قطعة نشطين." : "Select active inventory and item codes before receiving a serialized asset.");
      return;
    }

    if (paidAmountNum < 0 || paidAmountNum > totalCost) {
      setErrorMsg(rtl ? "المبلغ المدفوع يجب ألا يتجاوز إجمالي الشراء." : "Paid amount cannot exceed total cost.");
      return;
    }

    if (useReverseCharge && !drcVerified) {
      setErrorMsg(rtl ? "يجب استيفاء جميع شروط التدقيق الضريبي للاحتساب العكسي." : "Reverse charge checks must be fully compliant.");
      return;
    }

    // Phase 12J — VAT rate must be valid when VAT (or RCM) is applied.
    if ((applyVat || useReverseCharge) && !vatRateValid) {
      setErrorMsg(rtl ? "نسبة الضريبة يجب أن تكون رقماً بين 0 و 100." : "VAT rate must be a number between 0 and 100.");
      return;
    }

    setIsPosting(true);
    try {
      const timestamp = Date.now();
      const dateStr = purchaseDate || new Date().toISOString().slice(0, 10);
      const purchaseOrderId = `PO-${timestamp}`;

      const localPlaceholderBarcode = `LOCAL-PENDING-${timestamp}`;
      const assetId = `AST-PUR-${timestamp.toString().slice(-6)}`;

      // Local/mock mode keeps the existing client-side repository behavior.
      const newAssetItem: Partial<Asset> = {
        id: assetId,
        name: assetName,
        type: assetType,
        category: category.trim() || (rtl ? "خام" : "Raw material"),
        karat: Number(karat) || undefined,
        grossWeight: weightPerUnitNum,
        netWeight: weightPerUnitNum,
        cost: unitCostNum,
        price: isQuantityBased ? salePriceNum : Math.round(unitCostNum * 1.32), // Markup for sales preview
        branch: activeBranch,
        location: "Showroom",
        status: "available",
        barcode: localPlaceholderBarcode,
        inventoryCode: selectedInventoryCode?.code,
        itemCode,
        inventorySubtype: assetType === "watch" ? "watch" : undefined,
        source: `${rtl ? "توريد من: " : "Supplied by: "} ${selectedSupplier.name}`,
        events: [
          {
            id: `EV-PUR-${timestamp}`,
            action: "PURCHASED",
            date: dateStr,
            user: user?.firstName || "System",
            branch: activeBranch,
            note: `${rtl ? "فاتورة توريد من " : "Purchase invoice from "} ${selectedSupplier.name}. ${rtl ? "الاحتساب العكسي: " : "DRC: "} ${useReverseCharge ? (rtl ? "نعم" : "Yes") : (rtl ? "لا" : "No")}`,
          },
        ],
      };

      let createdAssetId = assetId;

      if (isApi) {
        if (!idempotencyKeyRef.current) idempotencyKeyRef.current = generateUUID();
        const response = await apiClient<any>("/purchase-orders/receive", {
          method: "POST",
          idempotencyKey: idempotencyKeyRef.current,
          locale,
          body: JSON.stringify({
            id: purchaseOrderId,
            supplierId: selectedSupplier.id,
            date: dateStr,
            receivedDate: dateStr,
            supplierName: selectedSupplier.name,
            stockType: assetType,
            itemName: assetName,
            description: category.trim(),
            purchaseDate: dateStr,
            branchId: activeBranchId,
            warehouseId: activeBranchId,
            total: totalCost,
            totalCost,
            paidAmount: paidAmountNum,
            remainingAmount,
            paymentStatus,
            paymentMethod,
            // Phase 12J — purchase VAT / RCM. RCM (DRC) takes precedence; else
            // ordinary VAT when applyVat; else no VAT (default path unchanged).
            ...(useReverseCharge
              ? { applyVat: true, isRcm: true, isDRC: true, reverseVat: true, useReverseCharge: true, rcmRate: vatRateNum, taxIncluded: false, isRecoverable: true }
              : applyVat
              ? { applyVat: true, vatRate: vatRateNum, taxIncluded, isRecoverable, isRcm: false }
              : { applyVat: false }),
            notes: [notes.trim(), `${rtl ? "توريد أصل" : "Asset purchase"}: ${assetName}. ${rtl ? "الاحتساب العكسي: " : "DRC: "} ${useReverseCharge ? (rtl ? "نعم" : "Yes") : (rtl ? "لا" : "No")}`].filter(Boolean).join(" | "),
            isConsignment: Boolean(selectedSupplier.isConsignment),
            items: [
              {
                name: assetName,
                type: assetType,
                inventoryCode: selectedInventoryCode?.code,
                itemCode: isQuantityBased ? undefined : itemCode,
                inventorySubtype: assetType === "watch" ? "watch" : undefined,
                category: category.trim() || (rtl ? "خام" : "Raw material"),
                karat: Number(karat) || undefined,
                weightPerUnit: weightPerUnitNum,
                grossWeight: weightPerUnitNum,
                netWeight: weightPerUnitNum,
                unitCost: unitCostNum,
                cost: unitCostNum,
                price: isQuantityBased ? salePriceNum : Math.round(unitCostNum * 1.32),
                quantity: quantityNum,
                unit: rtl ? "قطعة" : "piece",
                location: "Showroom",
                notes: useReverseCharge ? "Domestic reverse charge verified" : "",
                productCode: isQuantityBased ? productCode.trim() : undefined,
              },
            ],
          }),
        });
        idempotencyKeyRef.current = ""; // success → next receive gets a fresh key
        createdAssetId = response?.assets?.[0]?.id || response?.data?.assets?.[0]?.id || assetId;
        invalidateAffectedQueries(queryClient, {
          entity: "PurchaseOrder",
          action: "receive",
          id: purchaseOrderId,
          branchId: activeBranchId,
          related: {
            supplierId: selectedSupplier.id,
            purchaseOrderId,
            assetIds: response?.assets?.map((asset: Asset) => asset.id) || response?.data?.assets?.map((asset: Asset) => asset.id) || [createdAssetId],
          },
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
          queryClient.invalidateQueries({ queryKey: ["supplier", selectedSupplier.id] }),
          queryClient.invalidateQueries({ queryKey: ["supplier-purchase-orders", selectedSupplier.id] }),
          queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }),
          queryClient.invalidateQueries({ queryKey: ["assets"] }),
          queryClient.invalidateQueries({ queryKey: ["products"] }),
          queryClient.invalidateQueries({ queryKey: ["inventoryProducts"] }),
          queryClient.invalidateQueries({ queryKey: ["posProducts"] }),
          queryClient.invalidateQueries({ queryKey: ["stock-movements"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
          queryClient.invalidateQueries({ queryKey: ["reports"] }),
          queryClient.invalidateQueries({ queryKey: ["accounting"] }),
          queryClient.invalidateQueries({ queryKey: ["treasury"] }),
          queryClient.invalidateQueries({ queryKey: ["notifications"] }),
          queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
        ]);
        await refreshSuppliers();
      } else {
        for (let i = 0; i < quantityNum; i++) {
          await createAsset({
            ...newAssetItem,
            id: `${assetId}-${i + 1}`,
            name: quantityNum > 1 ? `${assetName} ${i + 1}` : assetName,
            barcode: `LOCAL-PENDING-${timestamp + i}`,
          });
        }
      }

      setSuccessMsg(
        rtl
          ? `تم استلام الشحنة وحفظ أمر الشراء ${purchaseOrderId} بنجاح.`
          : `Shipment received, purchase order ${purchaseOrderId} saved, and inventory updated successfully.`
      );

      // Reset form
      setProductCode("");
      setSalePrice("");
      setMatchingProduct(null);
      setAssetName("");
      setQuantity("1");
      setWeightPerUnit("");
      setUnitCost("");
      setPaidAmount("0");
      setPaymentMethod("credit");
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setCategory("");
      setItemCode("RNG");
      setUseReverseCharge(false);
      setDrcVerified(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to post purchase.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/suppliers" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-brand-700">
            <BackIcon className="h-4 w-4" />{common("back")}
          </Link>
          <h1 className="text-2xl font-black text-navy-950 dark:text-white lg:text-3xl">
            {rtl ? "استلام التوريدات وأوامر الشراء" : "Purchase Orders & Receiving"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {rtl ? "شراء أصول جديدة وتسجيلها بالمخزون مع تطبيق ضريبة الاحتساب العكسي" : "Record new asset purchases, manage margins, and apply reverse charge compliance."}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800 dark:border-rose-950/40 dark:bg-rose-950/10 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        {/* Purchase Form */}
        <Card className="p-6">
          <form onSubmit={handlePostPurchase} className="space-y-5">
            <h3 className="text-sm font-black text-navy-950 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {rtl ? "تفاصيل الشحنة والأصل الوارد" : "Incoming Consignment & Asset Details"}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="label-base font-bold">{rtl ? "نوع الإدخال" : "Inventory Model"}</span>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isQuantityBased}
                      onChange={() => {
                        setIsQuantityBased(true);
                        setProductCode("");
                        setMatchingProduct(null);
                      }}
                      className="text-brand-600 focus:ring-brand-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-navy-800 dark:text-slate-200">
                      {rtl ? "منتج بالكمية (نموذج موحد)" : "Quantity-Based Product"}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isQuantityBased}
                      onChange={() => {
                        setIsQuantityBased(false);
                        setProductCode("");
                        setMatchingProduct(null);
                      }}
                      className="text-brand-600 focus:ring-brand-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-navy-800 dark:text-slate-200">
                      {rtl ? "أصل فردي برقم تسلسلي" : "Serialized Individual Asset"}
                    </span>
                  </label>
                </div>
              </div>

              <label className="block">
                <span className="label-base">{rtl ? "المورد" : "Supplier"}</span>
                <NativeSelect value={supplierId} onChange={(e) => setSupplierId(e.target.value)} disabled={suppliersLoading || Boolean(suppliersError)}>
                  <option value="">{rtl ? "اختر المورد" : "Select supplier"}</option>
                  {activeSuppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}{(supplier as any).code ? ` - ${(supplier as any).code}` : supplier.category ? ` · ${supplier.category}` : ""}
                    </option>
                  ))}
                </NativeSelect>
                {suppliersLoading && <p className="mt-2 text-[11px] font-bold text-slate-400">{rtl ? "جاري تحميل الموردين..." : "Loading suppliers..."}</p>}
                {suppliersError && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 dark:border-rose-950/40 dark:bg-rose-950/10 dark:text-rose-300">
                    <span>{rtl ? "تعذر تحميل الموردين" : "Failed to load suppliers"}</span>
                    <button type="button" onClick={refreshSuppliers} className="underline">{common("refresh")}</button>
                  </div>
                )}
                {!suppliersLoading && !suppliersError && activeSuppliers.length === 0 && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-300">
                    <span>{rtl ? "لا يوجد موردون منشأون بعد." : "No suppliers created."}</span>
                    <Link href="/suppliers" className="underline">{rtl ? "إضافة مورد" : "Add supplier"}</Link>
                  </div>
                )}
              </label>

              {isQuantityBased ? (
                <label className="block">
                  <span className="label-base">{rtl ? "رمز المنتج (يدوي)" : "Product Code (Manual)"} <span className="text-rose-500">*</span></span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LULU-001"
                    className="input-base font-mono uppercase"
                    value={productCode}
                    onChange={(e) => handleProductCodeChange(e.target.value)}
                  />
                </label>
              ) : (
                <div />
              )}

              {isQuantityBased && matchingProduct && (
                <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-xs font-bold text-amber-900 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-300">
                  <p>
                    ⚠️ {rtl 
                      ? `رمز المنتج موجود بالفعل لمنتج: "${matchingProduct.productName}".` 
                      : `Product Code already exists for: "${matchingProduct.productName}".`}
                  </p>
                  <p className="mt-1 font-semibold text-slate-500 dark:text-slate-400">
                    {rtl 
                      ? `استلام هذا التوريد سيقوم بإضافة ${quantityNum} قطعة إلى المخزون (المخزون الحالي: ${matchingProduct.quantityOnHand}) وسيعيد احتساب متوسط التكلفة وتحديث سعر البيع.` 
                      : `Receiving this consignment will add ${quantityNum} unit(s) to stock (current: ${matchingProduct.quantityOnHand}) and recalculate the average unit cost and update the sale price.`}
                  </p>
                </div>
              )}

              <label className="block">
                <span className="label-base">
                  {isQuantityBased ? (rtl ? "اسم المنتج" : "Product Name") : (rtl ? "اسم الأصل الوارد" : "Asset Name")}
                </span>
                <input type="text" required className="input-base" placeholder={rtl ? "خاتم ذهب، سبيكة..." : "Gold ring, bullion..."} value={assetName} onChange={(e) => setAssetName(e.target.value)} />
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "نوع المخزون" : "Inventory Type"}</span>
                <NativeSelect value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)}>
                  <option value="gold-piece">{rtl ? "ذهب بالقطعة" : "Gold by Piece"}</option>
                  <option value="gold-weight">{rtl ? "ذهب بالوزن" : "Gold by Weight"}</option>
                  <option value="diamond">{rtl ? "ألماس" : "Diamond"}</option>
                  <option value="gemstone">{rtl ? "أحجار كريمة" : "Gemstones"}</option>
                  <option value="pearl">{rtl ? "لؤلؤ" : "Pearl"}</option>
                  <option value="watch">{rtl ? "ساعات" : "Watch"}</option>
                </NativeSelect>
              </label>

              {!isQuantityBased && <label className="block">
                <span className="label-base">{rtl ? "كود القطعة" : "Item Code"}</span>
                <NativeSelect value={itemCode} onChange={(e) => setItemCode(e.target.value)} disabled={availableItemCodes.length === 0}>
                  <option value="">{rtl ? "اختر كود القطعة" : "Select item code"}</option>
                  {availableItemCodes.map((code) => <option key={code.id} value={code.code}>{code.code} — {code.displayName}</option>)}
                </NativeSelect>
                {availableItemCodes.length === 0 && <p className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 dark:border-rose-950/40 dark:bg-rose-950/10 dark:text-rose-300">{rtl ? "لا توجد أكواد قطع نشطة لهذا النوع. أكمل إعداد تصنيف المخزون قبل الاستلام." : "No active item codes exist for this inventory type. Complete inventory taxonomy setup before receiving."}</p>}
              </label>}

              <label className="block">
                <span className="label-base">{rtl ? "التصنيف" : "Category"}</span>
                <input type="text" placeholder={rtl ? "مثال: خواتم، سبائك" : "e.g. rings, bars"} className="input-base" value={category} onChange={(e) => setCategory(e.target.value)} />
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "العيار" : "Karat"}</span>
                <NativeSelect disabled={selectedInventoryCode?.requiresKarat === false} value={karat} onChange={(e) => setKarat(e.target.value)}>
                  {selectedInventoryCode?.requiresKarat === false && <option value="">{selectedInventoryCode.defaultKaratCode || "00"}</option>}
                  <option value="18">18K</option>
                  <option value="21">21K</option>
                  <option value="22">22K</option>
                  <option value="24">24K</option>
                </NativeSelect>
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "تاريخ الشراء" : "Purchase Date"}</span>
                <input
                  type="date"
                  required
                  className="input-base"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(toEnglishDigits(e.target.value))}
                />
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "الكمية" : "Quantity"}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  required
                  placeholder="12"
                  className="input-base"
                  value={toEnglishDigits(quantity)}
                  onChange={(e) => setQuantity(normalizeNumberInput(e.target.value).replace(/[.,-]/g, ""))}
                />
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "وزن الوحدة (جم)" : "Weight per Unit (g)"}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  required
                  placeholder="1"
                  className="input-base"
                  value={toEnglishDigits(weightPerUnit)}
                  onChange={(e) => setWeightPerUnit(normalizeDecimalValue(e.target.value))}
                />
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "سعر تكلفة الوحدة" : "Unit Cost"}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  required
                  placeholder="100"
                  className="input-base"
                  value={toEnglishDigits(unitCost)}
                  onChange={(e) => setUnitCost(normalizeDecimalValue(e.target.value))}
                />
              </label>

              {isQuantityBased ? (
                <label className="block">
                  <span className="label-base">{rtl ? "سعر بيع الوحدة" : "Unit Sale Price"} <span className="text-rose-500">*</span></span>
                  <input
                    type="text"
                    inputMode="decimal"
                    dir="ltr"
                    required
                    placeholder="251"
                    className="input-base"
                    value={toEnglishDigits(salePrice)}
                    onChange={(e) => setSalePrice(normalizeDecimalValue(e.target.value))}
                  />
                </label>
              ) : (
                <div />
              )}

              <label className="block">
                <span className="label-base">{rtl ? "طريقة الدفع" : "Payment Method"}</span>
                <NativeSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="credit">{rtl ? "آجل / بدون دفع" : "Credit / Unpaid"}</option>
                  <option value="cash">{rtl ? "نقدي" : "Cash"}</option>
                  <option value="bank_transfer">{rtl ? "تحويل بنكي" : "Bank Transfer"}</option>
                  <option value="card">{rtl ? "بطاقة" : "Card"}</option>
                </NativeSelect>
              </label>

              <label className="block">
                <span className="label-base">{rtl ? "المبلغ المدفوع" : "Paid Amount"}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  placeholder="0"
                  className="input-base"
                  value={toEnglishDigits(paidAmount)}
                  onChange={(e) => setPaidAmount(normalizeDecimalValue(e.target.value))}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="label-base">{rtl ? "ملاحظات" : "Notes"}</span>
                <textarea
                  className="input-base min-h-[84px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-3 rounded-3xl border border-brand-100 bg-brand-50/60 p-4 text-xs dark:border-brand-500/20 dark:bg-brand-500/10 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500">{rtl ? "إجمالي الوزن" : "Total Weight"}</p>
                <p className="mt-1 font-black text-navy-950 dark:text-white">
                  {toEnglishDigits(totalWeight.toFixed(2))}g
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {toEnglishDigits(quantityNum)} × {toEnglishDigits(weightPerUnitNum)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500">{rtl ? "إجمالي التكلفة" : "Total Cost"}</p>
                <p className="mt-1 font-black text-navy-950 dark:text-white">{money(totalCost)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500">{rtl ? "المدفوع" : "Paid"}</p>
                <p className="mt-1 font-black text-emerald-700 dark:text-emerald-300">{money(paidAmountNum)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500">{rtl ? "المتبقي / الحالة" : "Remaining / Status"}</p>
                <p className="mt-1 font-black text-amber-700 dark:text-amber-300">{money(remainingAmount)}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-500">
                  {paymentStatus === "paid" ? (rtl ? "مدفوعة" : "Paid") : paymentStatus === "partial" ? (rtl ? "جزئية" : "Partial") : (rtl ? "غير مدفوعة" : "Unpaid")}
                </p>
              </div>
            </div>

            {/* Phase 12J — Purchase VAT */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-3">
              <h4 className="text-xs font-black text-navy-900 dark:text-slate-100">{rtl ? "ضريبة المشتريات" : "Purchase VAT"}</h4>

              <label className={`flex items-center gap-2 ${useReverseCharge ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={applyVat}
                  disabled={useReverseCharge}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-navy-800 dark:text-slate-200">{rtl ? "تطبيق ضريبة على هذا الشراء" : "Apply VAT to this purchase"}</span>
              </label>

              {applyVat && !useReverseCharge && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500">{rtl ? "نسبة الضريبة %" : "VAT rate %"}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={toEnglishDigits(vatRate)}
                      onChange={(e) => setVatRate(normalizeDecimalValue(e.target.value))}
                      className={`rounded-xl border px-3 py-2 text-sm ${vatRateValid ? "border-slate-300 dark:border-slate-700" : "border-rose-400"}`}
                    />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer pt-5">
                    <input type="checkbox" checked={taxIncluded} onChange={(e) => setTaxIncluded(e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4" />
                    <span className="text-xs font-bold text-navy-800 dark:text-slate-200">{rtl ? "السعر شامل الضريبة" : "Tax-inclusive price"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer pt-5">
                    <input type="checkbox" checked={isRecoverable} onChange={(e) => setIsRecoverable(e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4" />
                    <span className="text-xs font-bold text-navy-800 dark:text-slate-200">{rtl ? "ضريبة قابلة للخصم" : "Recoverable VAT"}</span>
                  </label>
                </div>
              )}

              {/* Preview (display only — backend is the source of truth) */}
              <div className="rounded-xl bg-slate-50/70 dark:bg-navy-950/30 p-3 text-[11px] space-y-1">
                {vatPreview.mode === "none" && (
                  <p className="font-bold text-slate-500">{rtl ? "بدون ضريبة: سيتم تسجيل الشراء كما هو." : "No VAT: the purchase is recorded as-is."}</p>
                )}
                {(vatPreview.mode === "inclusive" || vatPreview.mode === "exclusive") && (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">{rtl ? "أساس الضريبة" : "Tax base"}</span><span className="font-bold">{money(vatPreview.taxBase)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">{rtl ? "ضريبة المدخلات" : "Input VAT"}</span><span className="font-bold">{money(vatPreview.inputVatAmount)}</span></div>
                    <div className="flex justify-between border-t border-dashed pt-1"><span className="font-bold">{rtl ? "المستحق للمورد" : "Payable to supplier"}</span><span className="font-black">{money(vatPreview.payable)}</span></div>
                  </>
                )}
                {vatPreview.mode === "nonRecoverable" && (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">{rtl ? "أساس الضريبة" : "Tax base"}</span><span className="font-bold">{money(vatPreview.taxBase)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">{rtl ? "الضريبة" : "VAT"}</span><span className="font-bold">{money(vatPreview.inputVatAmount)}</span></div>
                    <div className="flex justify-between border-t border-dashed pt-1"><span className="font-bold">{rtl ? "المستحق للمورد" : "Payable to supplier"}</span><span className="font-black">{money(vatPreview.payable)}</span></div>
                    <p className="font-bold text-amber-600">{rtl ? "هذه الضريبة غير قابلة للخصم وستدخل ضمن تكلفة المخزون." : "Non-recoverable VAT — capitalised into inventory cost."}</p>
                  </>
                )}
                {vatPreview.mode === "rcm" && (
                  <>
                    <p className="font-bold text-brand-600">{rtl ? "احتساب عكسي (RCM): المورد لا يحصل على الضريبة." : "Reverse charge (RCM): the supplier is not paid VAT."}</p>
                    <div className="flex justify-between"><span className="text-slate-500">{rtl ? "أساس الضريبة" : "Tax base"}</span><span className="font-bold">{money(vatPreview.taxBase)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">{rtl ? "ضريبة RCM" : "RCM VAT"}</span><span className="font-bold">{money(vatPreview.rcmVatAmount)}</span></div>
                    <div className="flex justify-between border-t border-dashed pt-1"><span className="font-bold">{rtl ? "المستحق للمورد" : "Payable to supplier"}</span><span className="font-black">{money(vatPreview.payable)}</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Reverse Charge compliance checkbox */}
            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-2xl bg-slate-50/50 dark:bg-navy-950/20">
              <input
                type="checkbox"
                checked={useReverseCharge}
                onChange={(e) => setUseReverseCharge(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span className="text-xs font-bold text-navy-800 dark:text-slate-200">
                {rtl ? "خاضع للاحتساب العكسي لضريبة القيمة المضافة (DRC)" : "Apply Domestic Reverse Charge (DRC)"}
              </span>
            </label>

            {useReverseCharge && selectedSupplier && (
              <ReverseChargeChecklist
                supplierName={selectedSupplier.name}
                trn="100389024000003"
                onVerifyStatusChange={setDrcVerified}
                locale={locale}
              />
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" disabled={isPosting || (!isApi && isCreating) || suppliersLoading || activeSuppliers.length === 0 || (useReverseCharge && !drcVerified)}>
                <Plus className="h-4.5 w-4.5" />
                {isPosting || (!isApi && isCreating) ? common("loading") : rtl ? "استلام وتسجيل الأصل" : "Post Purchase & Add Asset"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Info panel */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-black text-navy-950 dark:text-white">
              {rtl ? "معلومات هامة للتدقيق" : "VAT & DRC Audit Guidelines"}
            </h3>
            <div className="text-xs space-y-3 leading-5 text-slate-500">
              <p>
                {rtl
                  ? "1. بموجب المادة 70 من قانون ضريبة القيمة المضافة، تقع مسؤولية سداد الضريبة على المشتري المسجل في حال كان توريد الذهب بغرض إعادة تصنيعه أو بيعه."
                  : "1. Under UAE VAT Law Executive Regulations, VAT on gold supplied to a registered business for resale or manufacture is accounted for under reverse charge."}
              </p>
              <p>
                {rtl
                  ? "2. يجب الاحتفاظ بملف إقرار DRC وشهادات التسجيل الضريبي كأدلة قانونية صالحة للتدقيق الضريبي."
                  : "2. Written DRC declarations and active TRN records must be kept on file as audit evidence."}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
