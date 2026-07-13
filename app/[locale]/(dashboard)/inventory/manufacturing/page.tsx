"use client";

import { useMemo, useState, useEffect } from "react";
import { getDataSourceMode } from "@/lib/data-source";
import { ArrowLeft, ArrowRight, Activity, Plus, CheckCircle2, AlertTriangle, ShieldAlert, Cpu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import type { Asset, AssetType } from "@/lib/types";

export default function ManufacturingPage() {
  const t = useTranslations("Inventory");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company, activeBranch, user } = useAuth();
  const { assets, addAsset, updateAssetWithEvent } = useErp();

  const dataSource = getDataSourceMode();
  const apiMode = dataSource === "api";

  const [apiAssets, setApiAssets] = useState<Asset[]>([]);

  useEffect(() => {
    if (apiMode) {
      apiClient<any>("/assets", { locale })
        .then((res) => {
          const items = Array.isArray(res)
            ? res
            : Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.data?.items)
            ? res.data.items
            : Array.isArray(res?.data)
            ? res.data
            : [];
          setApiAssets(items);
        })
        .catch(() => {});
    }
  }, [apiMode, locale]);


  // Input states
  const [inputAssetId, setInputAssetId] = useState("");
  const [inputWeight, setInputWeight] = useState("");
  
  // Output states
  const [outputName, setOutputName] = useState("");
  const [outputType, setOutputType] = useState<AssetType>("gold-piece");
  const [outputWeight, setOutputWeight] = useState("");
  const [outputKarat, setOutputKarat] = useState("21");
  const [laborCost, setLaborCost] = useState("");
  
  // Override state
  const [managerApproved, setManagerApproved] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const currency = company?.currency ?? "AED";
  const money = (value: number) => formatCurrency(value, currency, locale);
  const BackIcon = rtl ? ArrowRight : ArrowLeft;

  // List of scrap / gold-weight assets available for manufacturing input
  const rawGoldAssets = useMemo(() => {
    const list = apiMode ? apiAssets : assets;
    return list.filter(
      (asset) =>
        (asset.type === "gold-weight" || asset.category?.includes("كسر") || asset.category?.toLowerCase().includes("scrap")) &&
        asset.status === "available" &&
        (apiMode || asset.branch === activeBranch)
    );
  }, [apiMode, apiAssets, assets, activeBranch]);

  // Set default raw asset
  useEffect(() => {
    if (rawGoldAssets.length > 0 && !inputAssetId) {
      setInputAssetId(rawGoldAssets[0].id);
    }
  }, [rawGoldAssets, inputAssetId]);

  const selectedInputAsset = useMemo(() => {
    const list = apiMode ? apiAssets : assets;
    return list.find((a) => a.id === inputAssetId) || null;
  }, [apiMode, apiAssets, assets, inputAssetId]);

  // Process loss calculation
  const processLossPct = useMemo(() => {
    const inW = Number(inputWeight) || 0;
    const outW = Number(outputWeight) || 0;
    if (inW <= 0) return 0;
    const loss = inW - outW;
    return (loss / inW) * 100;
  }, [inputWeight, outputWeight]);

  const isLossCritical = processLossPct > 5.0;

  const handlePostManufacturing = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const inW = Number(inputWeight) || 0;
    const outW = Number(outputWeight) || 0;
    const labor = Number(laborCost) || 0;

    if (!selectedInputAsset || !outputName.trim() || inW <= 0 || outW <= 0) {
      setErrorMsg(rtl ? "برجاء استكمال بيانات التصنيع بشكل صحيح." : "Please fill in all manufacturing parameters correctly.");
      return;
    }

    if (inW > selectedInputAsset.grossWeight) {
      setErrorMsg(
        rtl 
          ? `الوزن المطلوب تصنيعه (${inW} جم) أكبر من الوزن المتوفر في الأصل (${selectedInputAsset.grossWeight} جم).` 
          : `Requested manufacturing weight (${inW}g) exceeds available weight in asset (${selectedInputAsset.grossWeight}g).`
      );
      return;
    }

    if (isLossCritical && !managerApproved) {
      setErrorMsg(
        rtl
          ? "تنبيه: الفاقد من الوزن يتجاوز 5%. يتطلب تصريح وتأكيد المشرف لتأكيد العملية."
          : "Warning: Process loss exceeds 5%. Manager override is required to confirm."
      );
      return;
    }

    try {
      if (apiMode) {
        await apiClient("/manufacturing-orders/process", {
          method: "POST",
          body: JSON.stringify({
            inputAssetId: selectedInputAsset.id,
            inputWeight: inW,
            outputName: outputName.trim(),
            outputType,
            outputKarat,
            outputWeight: outW,
            laborCost: labor,
            notes: "",
          }),
          locale,
        });

        setSuccessMsg(
          rtl
            ? `تم الانتهاء من عملية التصنيع بنجاح وتسجيلها في النظام!`
            : `Manufacturing order completed and registered successfully!`
        );

        // Reload assets
        apiClient<any>("/assets", { locale })
          .then((res) => {
            const items = Array.isArray(res)
              ? res
              : Array.isArray(res?.items)
              ? res.items
              : Array.isArray(res?.data?.items)
              ? res.data.items
              : Array.isArray(res?.data)
              ? res.data
              : [];
            setApiAssets(items);
          })
          .catch(() => {});
      } else {
        const timestamp = Date.now();
        const dateStr = new Date().toISOString().slice(0, 16).replace("T", " ");

        const finalWeight = Number((selectedInputAsset.grossWeight - inW).toFixed(2));
        const newStatus = finalWeight <= 0.01 ? "melted" as const : selectedInputAsset.status;
        
        updateAssetWithEvent(
          selectedInputAsset.id,
          { grossWeight: finalWeight, netWeight: finalWeight, status: newStatus },
          {
            id: `EV-MFG-OUT-${timestamp}`,
            action: rtl ? "خصم وزن للتصنيع" : "MELTED_WEIGHT_DEDUCTION",
            date: dateStr,
            user: user?.firstName || "System",
            branch: activeBranch,
            note: `${rtl ? "سحب وزن للتصنيع: " : "Weight deducted for manufacturing: "} ${inW}g. ${rtl ? "أمر تصنيع: " : "MO: "} MO-${timestamp.toString().slice(-5)}`,
            beforeState: `grossWeight:${selectedInputAsset.grossWeight}`,
            afterState: `grossWeight:${finalWeight}`,
            severity: newStatus === "melted" ? "warning" : "info",
          },
        );

        // Use the updated final weight for cost calculation
        const manufacturingCost = Math.round(inW * (selectedInputAsset.cost / selectedInputAsset.grossWeight || 1) + labor);
        const finishedAsset: Asset = {
          id: `AST-MFG-${timestamp.toString().slice(-6)}`,
          name: outputName.trim(),
          type: outputType,
          category: rtl ? "تصنيع محلي" : "Finished jewellery",
          karat: Number(outputKarat) || undefined,
          grossWeight: outW,
          netWeight: outW,
          cost: manufacturingCost,
          price: Math.round(manufacturingCost * 1.35),
          branch: activeBranch,
          location: "Showroom",
          status: "available",
          barcode: `LOCAL-PENDING-${timestamp}`,
          source: `${rtl ? "تحويل وتصنيع من: " : "Manufactured from parent: "} ${selectedInputAsset.id}`,
          parentAssetId: selectedInputAsset.id,
          events: [
            {
              id: `EV-MFG-IN-${timestamp}`,
              action: "MANUFACTURED",
              date: dateStr,
              user: user?.firstName || "System",
              branch: activeBranch,
              note: `${rtl ? "إنتاج قطعة مصنعة من أصل أب " : "Produced asset from parent "} ${selectedInputAsset.id}. ${rtl ? "فاقد الوزن: " : "Process loss: "} ${processLossPct.toFixed(2)}%`,
            },
          ],
        };

        addAsset(finishedAsset);

        setSuccessMsg(
          rtl
            ? `تم الانتهاء من عملية التصنيع بنجاح! تم توليد باركود المنتج الجديد: ${finishedAsset.id}`
            : `Manufacturing order completed successfully! Created finished Asset: ${finishedAsset.id}`
        );
      }

      // Reset
      setOutputName("");
      setInputWeight("");
      setOutputWeight("");
      setLaborCost("");
      setManagerApproved(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to post manufacturing log.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/inventory" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-brand-700">
            <BackIcon className="h-4 w-4" />{t("back") || "Back to inventory"}
          </Link>
          <h1 className="text-2xl font-black text-foreground lg:text-3xl">
            {rtl ? "عمليات الصهر والتصنيع" : "Melt & Manufacturing logs"}
          </h1>
          <p className="text-xs text-muted mt-1">
            {rtl ? "تحويل كسر الذهب والمواد الخام إلى أصول مجوهرات نهائية جاهزة للبيع" : "Convert scrap gold or raw bullion into finished, barcodes-tracked retail assets."}
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
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-6">
          <form onSubmit={handlePostManufacturing} className="space-y-5">
            <h3 className="text-sm font-black text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-brand-600" />
              {rtl ? "تفاصيل أمر التصنيع المحالي" : "New Manufacturing Order (MO)"}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Input section */}
              <div className="space-y-4 sm:col-span-2">
                <h4 className="text-xs font-black text-muted">{rtl ? "1. مدخلات الذهب الكسر / الخام" : "1. Raw Gold Inputs"}</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="label-base">{rtl ? "اختر أصل الذهب الخام" : "Select Input Asset"}</span>
                    <NativeSelect value={inputAssetId} onChange={(e) => setInputAssetId(e.target.value)}>
                      {rawGoldAssets.length === 0 ? (
                        <option value="">{rtl ? "لا يوجد كسر متوفر" : "No raw scrap available"}</option>
                      ) : (
                        rawGoldAssets.map((a) => (
                          <option key={a.id} value={a.id}>{a.name} ({a.grossWeight}g · {a.karat}K)</option>
                        ))
                      )}
                    </NativeSelect>
                  </label>

                  <label className="block">
                    <span className="label-base">{rtl ? "الوزن المسحوب للصهر (جم)" : "Input Weight to Melt (g)"}</span>
                    <input type="number" step="0.01" required placeholder="0.00" className="input-base" value={inputWeight} onChange={(e) => setInputWeight(e.target.value)} />
                  </label>
                </div>
              </div>

              {/* Output section */}
              <div className="space-y-4 sm:col-span-2 pt-3 border-t border-border">
                <h4 className="text-xs font-black text-muted">{rtl ? "2. مخرجات المنتج النهائي" : "2. Finished Asset Output"}</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="label-base">{rtl ? "اسم المنتج النهائي" : "Output Asset Name"}</span>
                    <input type="text" required placeholder={rtl ? "خاتم ذهب مصنع..." : "Finished Gold Ring..."} className="input-base" value={outputName} onChange={(e) => setOutputName(e.target.value)} />
                  </label>

                  <label className="block">
                    <span className="label-base">{rtl ? "نوع المنتج" : "Asset Type"}</span>
                    <NativeSelect value={outputType} onChange={(e) => setOutputType(e.target.value as AssetType)}>
                      <option value="gold-piece">{rtl ? "ذهب بالقطعة" : "Gold by Piece"}</option>
                      <option value="watch">{rtl ? "ساعة" : "Watch"}</option>
                      <option value="diamond">{rtl ? "ألماس" : "Diamond"}</option>
                    </NativeSelect>
                  </label>

                  <label className="block">
                    <span className="label-base">{rtl ? "العيار الناتج" : "Output Karat"}</span>
                    <NativeSelect value={outputKarat} onChange={(e) => setOutputKarat(e.target.value)}>
                      <option value="18">18K</option>
                      <option value="21">21K</option>
                      <option value="22">22K</option>
                      <option value="24">24K</option>
                    </NativeSelect>
                  </label>

                  <label className="block">
                    <span className="label-base">{rtl ? "الوزن الناتج الإجمالي (جم)" : "Output Gross Weight (g)"}</span>
                    <input type="number" step="0.01" required placeholder="0.00" className="input-base" value={outputWeight} onChange={(e) => setOutputWeight(e.target.value)} />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="label-base">{rtl ? "تكلفة الصياغة / الأجور المباشرة" : "Making Charges / Labor Cost"}</span>
                    <input type="number" required placeholder="0" className="input-base" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} />
                  </label>
                </div>
              </div>
            </div>

            {/* Calculations & Warnings */}
            <div className="space-y-3 pt-3 border-t border-border text-xs">
              <div className="flex justify-between items-center bg-background p-3 rounded-2xl">
                <span className="font-bold text-muted">{rtl ? "نسبة الفاقد التقريبية" : "Estimated Process Loss"}</span>
                <span className={`font-black ${isLossCritical ? "text-destructive animate-pulse" : "text-foreground"}`}>
                  {processLossPct.toFixed(2)}%
                </span>
              </div>

              {isLossCritical && (
                <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-2xl space-y-3">
                  <p className="flex items-center gap-1.5 font-bold text-destructive">
                    <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                    <span>{rtl ? "تحذير: الفاقد يتجاوز حد الأمان المعتمد (5.0%)" : "Critical Loss Warning: Exceeds safe threshold (5.0%)"}</span>
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={managerApproved}
                      onChange={(e) => setManagerApproved(e.target.checked)}
                      className="rounded border-destructive text-destructive focus:ring-destructive h-4 w-4"
                    />
                    <span className="font-extrabold text-destructive">{rtl ? "تصريح وتخطي بموافقة المشرف" : "I approve Manager Override for this loss"}</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLossCritical && !managerApproved}>
                {rtl ? "تشغيل أمر التصنيع وإنتاج الأصل" : "Post Order & Produce finished Asset"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Audit guide */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-600" />
              {rtl ? "مراقبة فاقد الوزن والتشغيل" : "Loss Control & Workflows"}
            </h3>
            <div className="text-xs space-y-3 leading-5 text-muted">
              <p>
                {rtl
                  ? "● فاقد الصياغة: تتراوح نسبة الفاقد الطبيعي في عملية صهر وإعادة تصنيع الذهب بين 1.5% و3.0%."
                  : "● Standard Loss: Standard manufacturing loss during gold melting and conversion ranges between 1.5% and 3.0%."}
              </p>
              <p>
                {rtl
                  ? "● تجاوز الحد: تتطلب أي نسبة فاقد أعلى من 5.0% موافقة صريحة من مدير المعرض للتحقق من سلامة الأوزان وضمان عدم التلاعب."
                  : "● Manager Override: Any loss exceeding 5.0% blocks the transaction until a supervisor validates and overrides."}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
