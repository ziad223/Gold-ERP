"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Gem, LockKeyhole, RefreshCw, Save, Scale, Tag } from "lucide-react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useBranchContext } from "@/contexts/branch-context";
import { apiClient, generateUUID } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { compareDecimals } from "@/lib/decimal/decimal";
import { buildSharedTaxRequest, SharedReceiveSection, type SharedReceiveState } from "@/components/inventory/shared-receive-section";

type Master = { id: string; category: string; label: string; value: string; isActive: boolean };
type Contract = {
  karats: number[];
  jewelleryKarats: number[];
  masters: Master[];
  suppliers: Array<{ id: string; name: string; status?: string }>;
  locations: Array<{ id: string; code: string; name: string; isActive: boolean }>;
  currency: string;
  vat: { enabled: boolean; rate: number; purchaseRate: number };
  taxPolicy?: { enabledTaxTreatments?: string[]; vatRate?: number | string | null; vatRegistered?: boolean | null };
  gold: { health: any; provider: string | null; mode: string | null; currency: string | null };
  settings: { manualOverride: { available: boolean; permission: string; reasonRequired: boolean } };
  barcode?: { inventoryCodes: any[]; itemCodes: any[] };
  configurationState: { mastersConfigured: boolean; locationsConfigured: boolean; settingsRowsConfigured: boolean };
};

type Draft = {
  strategy: "GOLD_BY_WEIGHT_JEWELLERY" | "GOLD_BAR_24K";
  description: string; karat: string; goldColor: string; brand: string; model: string; modelNumber: string;
  grossWeight: string; stoneWeight: string; stoneName: string;
  itemCode: string; purchaseGoldRate: string; purchaseGoldRateOverrideReason: string; makingPerGram: string; currentMakingPerGram: string; certificateCost: string;
  sellingMakingPerGram: string; minimumMakingPerGram: string; rfid: string;
};

const initialDraft: Draft = {
  strategy: "GOLD_BY_WEIGHT_JEWELLERY", description: "", karat: "21", goldColor: "", brand: "", model: "", modelNumber: "",
  grossWeight: "", stoneWeight: "0", stoneName: "",
  itemCode: "", purchaseGoldRate: "", purchaseGoldRateOverrideReason: "", makingPerGram: "", currentMakingPerGram: "", certificateCost: "", sellingMakingPerGram: "", minimumMakingPerGram: "", rfid: "",
};

const initialReceiveState: SharedReceiveState = {
  supplierId: "", locationId: "", purchaseDate: new Date().toISOString().slice(0, 10), taxTreatment: "", notes: "", rcmEvidence: {},
};

function Section({ number, title, icon, children }: { number: number; title: string; icon?: ReactNode; children: ReactNode }) {
  return <Card className="space-y-4 p-5"><h2 className="flex items-center gap-2 text-sm font-black text-navy-950 dark:text-white"><span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-[11px] text-white">{number}</span>{icon}{title}</h2>{children}</Card>;
}

function Field({ label, value, onChange, type = "text", readOnly = false, required = false, disabled = false, step }: { label: string; value: string; onChange?: (value: string) => void; type?: string; readOnly?: boolean; required?: boolean; disabled?: boolean; step?: string }) {
  return <label className="space-y-1"><span className="block text-[11px] font-bold text-slate-500">{label}{required ? " *" : ""}</span><input dir={type === "number" ? "ltr" : undefined} type={type} step={step} required={required} readOnly={readOnly} disabled={disabled} className={`input-base w-full ${readOnly ? "bg-slate-100 dark:bg-navy-950" : ""}`} value={value} onChange={(event) => onChange?.(event.target.value)} /></label>;
}

function SelectField({ label, value, onChange, options, required = false, disabled = false, emptyLabel = "—" }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; required?: boolean; disabled?: boolean; emptyLabel?: string }) {
  return <label className="space-y-1"><span className="block text-[11px] font-bold text-slate-500">{label}{required ? " *" : ""}</span><select className="input-base w-full" value={value} required={required} disabled={disabled} onChange={(event) => onChange(event.target.value)}><option value="">{emptyLabel}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

const number = (value: string) => Number(value || 0);
const money = (value: unknown, currency: string, locale: string) => value === null || value === undefined ? "—" : formatCurrency(Number(value), currency, locale);

export default function GoldByWeightProfilePage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const searchParams = useSearchParams();
  const supplierHint = searchParams.get("supplierId") || "";
  const { company } = useAuth();
  const { branchId, isReady } = useBranchContext();
  const [contract, setContract] = useState<Contract | null>(null);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [preview, setPreview] = useState<any>(null);
  const [salePreview, setSalePreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [receive, setReceive] = useState<SharedReceiveState>(initialReceiveState);
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [rcmVerified, setRcmVerified] = useState(false);

  const update = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const updateReceive = (key: keyof SharedReceiveState, value: string) => setReceive((current) => ({ ...current, [key]: value }));
  const masters = useMemo(() => ({
    descriptions: contract?.masters.filter((item) => item.category === "GOLD_ITEM_DESCRIPTION" && item.isActive) || [],
    colors: contract?.masters.filter((item) => item.category === "GOLD_COLOR" && item.isActive) || [],
  }), [contract]);
  const itemPayload = useMemo(() => ({
    profile: draft.strategy, description: draft.description, name: draft.description, karat: number(draft.karat),
    grossWeight: number(draft.grossWeight), stoneWeight: number(draft.stoneWeight), goldColor: draft.goldColor || undefined,
    brand: draft.brand || undefined, model: draft.model || undefined, modelNumber: draft.modelNumber || undefined,
    itemCode: draft.itemCode || undefined,
    rfid: draft.rfid || undefined, stoneName: draft.stoneName || undefined,
    makingPerGram: draft.strategy === "GOLD_BAR_24K" ? undefined : number(draft.makingPerGram),
    currentMakingPerGram: draft.strategy === "GOLD_BAR_24K" ? undefined : number(draft.currentMakingPerGram || draft.makingPerGram),
    certificateCost: draft.strategy === "GOLD_BAR_24K" ? number(draft.certificateCost) : undefined,
    purchaseGoldRate: draft.purchaseGoldRate ? number(draft.purchaseGoldRate) : undefined,
    currentGoldRate: preview?.gold?.currentRate || undefined,
    vatRate: contract?.vat.enabled === false ? 0 : contract?.vat.rate,
  }), [contract, draft, preview]);

  const loadContract = async (quiet = false) => {
    if (!isReady) return;
    if (quiet) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const [response, settingsResponse] = await Promise.all([
        apiClient<any>("/inventory-v2/gold-by-weight/contract", { locale, branchId: branchId || undefined }),
        apiClient<any>("/settings", { locale }),
      ]);
      const profileContract = response?.data || response;
      const settings = settingsResponse?.data || settingsResponse;
      setContract({ ...profileContract, taxPolicy: settings?.taxPolicy || profileContract?.taxPolicy });
    } catch (caught: any) { setError(caught?.message || (rtl ? "تعذر تحميل عقد الذهب بالوزن." : "Could not load the Gold By Weight contract.")); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { void loadContract(); }, [branchId, isReady]);

  useEffect(() => {
    if (!contract || !supplierHint) return;
    const accessibleSupplier = contract.suppliers.find((item) => item.id === supplierHint && item.status !== "inactive");
    if (!accessibleSupplier) return;
    setReceive((current) => current.supplierId ? current : { ...current, supplierId: accessibleSupplier.id });
  }, [contract, supplierHint]);

  useEffect(() => {
    if (!contract || !draft.description || number(draft.grossWeight) <= 0 || number(draft.stoneWeight) > number(draft.grossWeight)) { setPreview(null); return; }
    const timer = window.setTimeout(async () => {
      setPreviewLoading(true); setError("");
      try {
        const response = await apiClient<any>("/inventory-v2/gold-by-weight/preview", { method: "POST", locale, branchId: branchId || undefined, body: JSON.stringify({ item: itemPayload }) });
        setPreview(response?.data || response);
      } catch (caught: any) { setPreview(null); setError(caught?.message || (rtl ? "تعذر احتساب المعاينة." : "Server preview unavailable.")); }
      finally { setPreviewLoading(false); }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [contract, draft.description, draft.grossWeight, draft.stoneWeight, draft.karat, draft.strategy, draft.makingPerGram, draft.currentMakingPerGram, draft.certificateCost, draft.purchaseGoldRate, locale, branchId]);

  const inventoryCode = useMemo(() => contract?.barcode?.inventoryCodes?.find((item: any) => item.assetType === "gold-weight" && item.isActive)?.code, [contract]);
  const resolvedItemCode = useMemo(() => draft.itemCode || contract?.barcode?.itemCodes?.find((item: any) => item.isActive && item.isClientApproved !== false && (!inventoryCode || !item.allowedInventoryCodes?.length || item.allowedInventoryCodes.includes(inventoryCode)))?.code || "", [contract, draft.itemCode, inventoryCode]);
  const resolvedPurchaseGoldRate = draft.purchaseGoldRate ? number(draft.purchaseGoldRate) : number(preview?.gold?.purchaseRate);
  const purchaseRateOverrideActive = useMemo(() => {
    const enteredRate = draft.purchaseGoldRate.trim();
    const referenceRate = preview?.gold?.currentRate;
    if (!enteredRate || referenceRate === undefined || referenceRate === null || String(referenceRate).trim() === "") return false;
    return Number.isFinite(Number(enteredRate)) && Number.isFinite(Number(referenceRate)) && compareDecimals(enteredRate, String(referenceRate)) !== 0;
  }, [draft.purchaseGoldRate, preview?.gold?.currentRate]);
  const receiveItem = useMemo(() => {
    const unitCost = number(preview?.purchase?.totalPurchaseCost);
    const piece = { ...itemPayload, profile: draft.strategy, inventoryProfile: draft.strategy, type: "gold-weight", category: "Gold By Weight", inventoryCode, itemCode: resolvedItemCode, weightPerUnit: number(draft.grossWeight), unitCost, cost: unitCost, goldValuation: {
      purchaseGoldRate: resolvedPurchaseGoldRate || undefined,
      currentGoldRate: preview?.gold?.currentRate,
      makingPerGram: draft.strategy === "GOLD_BAR_24K" ? undefined : number(draft.makingPerGram),
      currentMakingPerGram: draft.strategy === "GOLD_BAR_24K" ? undefined : number(draft.currentMakingPerGram || draft.makingPerGram),
      certificateCost: draft.strategy === "GOLD_BAR_24K" ? number(draft.certificateCost) : undefined,
      currentCertificateCost: draft.strategy === "GOLD_BAR_24K" ? number(draft.certificateCost) : undefined,
      vatRate: contract?.vat.enabled === false ? 0 : contract?.vat.rate,
      currentVatRate: contract?.vat.enabled === false ? 0 : contract?.vat.rate,
      purchaseRateOverrideReason: purchaseRateOverrideActive ? draft.purchaseGoldRateOverrideReason.trim() || undefined : undefined,
    } };
    return { ...piece, name: draft.description, description: draft.description, quantity: 1, grossWeight: number(draft.grossWeight), perPiece: [piece] };
  }, [draft.description, draft.grossWeight, draft.purchaseGoldRateOverrideReason, draft.strategy, inventoryCode, itemPayload, preview, purchaseRateOverrideActive, resolvedItemCode, resolvedPurchaseGoldRate]);

  useEffect(() => {
    const treatment = receive.taxTreatment;
    if (!contract || !preview || !receive.supplierId || !receive.locationId || !receive.purchaseDate || !treatment || !resolvedItemCode) { setTaxSummary(null); return; }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await apiClient<any>("/inventory-v2/receive-preview", {
          method: "POST", locale, branchId: branchId || undefined,
          body: JSON.stringify({ supplierId: receive.supplierId, warehouseId: branchId, branchId, purchaseDate: receive.purchaseDate, locationId: receive.locationId, notes: receive.notes || undefined, items: [receiveItem], ...buildSharedTaxRequest(receive, contract.taxPolicy) }),
        });
        if (!cancelled) setTaxSummary(response?.data || response);
      } catch (caught: any) {
        if (!cancelled) { setTaxSummary(null); setError(caught?.message || (rtl ? "تعذر تحميل ملخص الضريبة." : "Server tax summary unavailable.")); }
      }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [branchId, contract, locale, preview, receive, receiveItem, resolvedItemCode, rtl]);

  const requestSalePreview = async () => {
    if (!contract) return;
    setSaleLoading(true); setError("");
    try {
      const response = await apiClient<any>("/inventory-v2/gold-by-weight/sale-preview", { method: "POST", locale, branchId: branchId || undefined, body: JSON.stringify({ item: itemPayload, sale: { sellingGoldRate: preview?.current?.goldRate, makingPerGram: number(draft.sellingMakingPerGram), minimumMakingPerGram: number(draft.minimumMakingPerGram) } }) });
      setSalePreview(response?.data?.sale || response?.sale || response);
    } catch (caught: any) { setSalePreview(null); setError(caught?.message || (rtl ? "تعذر احتساب سعر البيع." : "Sale pricing preview unavailable.")); }
    finally { setSaleLoading(false); }
  };

  const submit = async () => {
    if (!contract || !branchId || !receive.supplierId || !receive.locationId || !receive.taxTreatment) { setError(rtl ? "المورد والموقع والمعاملة الضريبية مطلوبة." : "Supplier, Location, and Tax Treatment are required."); return; }
    if (!preview || !taxSummary) { setError(rtl ? "انتظر المعاينات القانونية قبل الحفظ." : "Wait for the canonical server previews before submitting."); return; }
    if (purchaseRateOverrideActive && !draft.purchaseGoldRateOverrideReason.trim()) { setError(rtl ? "سبب تعديل سعر شراء الذهب مطلوب عند اختلاف السعر عن المرجع." : "A reason is required when the purchase gold rate differs from the reference."); return; }
    if (receive.taxTreatment === "REVERSE_CHARGE" && !rcmVerified) { setError(rtl ? "أدلة الاحتساب العكسي مطلوبة." : "Reverse-charge evidence is required."); return; }
    setSubmitLoading(true); setError(""); setSubmitResult(null);
    const idempotencyKey = generateUUID();
    try {
       const unitCost = number(preview.purchase?.totalPurchaseCost);
       const piece = { ...itemPayload, profile: draft.strategy, inventoryProfile: draft.strategy, type: "gold-weight", category: "Gold By Weight", inventoryCode, itemCode: resolvedItemCode, weightPerUnit: number(draft.grossWeight), unitCost, cost: unitCost, goldValuation: {
        purchaseGoldRate: resolvedPurchaseGoldRate || undefined,
        currentGoldRate: preview.gold?.currentRate,
        makingPerGram: draft.strategy === "GOLD_BAR_24K" ? undefined : number(draft.makingPerGram),
        currentMakingPerGram: draft.strategy === "GOLD_BAR_24K" ? undefined : number(draft.currentMakingPerGram || draft.makingPerGram),
        certificateCost: draft.strategy === "GOLD_BAR_24K" ? number(draft.certificateCost) : undefined,
        vatRate: contract.vat.enabled === false ? 0 : contract.vat.rate,
        currentVatRate: contract.vat.enabled === false ? 0 : contract.vat.rate,
        purchaseRateOverrideReason: purchaseRateOverrideActive ? draft.purchaseGoldRateOverrideReason.trim() : undefined,
      } };
      const response = await apiClient<any>("/purchase-orders/receive", {
        method: "POST", locale, branchId, idempotencyKey,
         body: JSON.stringify({ supplierId: receive.supplierId, warehouseId: branchId, branchId, purchaseDate: receive.purchaseDate, locationId: receive.locationId, notes: receive.notes || undefined, inventoryV2: true, idempotencyKey, ...buildSharedTaxRequest(receive, contract.taxPolicy), items: [{
           name: draft.description, description: draft.description, type: "gold-weight", category: "Gold By Weight", inventoryProfile: draft.strategy,
           inventoryCode, itemCode: resolvedItemCode, quantity: 1, weightPerUnit: number(draft.grossWeight), grossWeight: number(draft.grossWeight), unitCost, perPiece: [piece],
         }] }),
      });
      setSubmitResult(response?.data || response);
    } catch (caught: any) {
      const message = caught?.message;
      setError(message === "Purchase gold-rate override reason is required."
        ? (rtl ? "سبب تعديل سعر شراء الذهب مطلوب عند اختلاف السعر عن المرجع." : message)
        : (message || (rtl ? "فشل استلام قطعة الذهب." : "Gold By Weight receive failed.")));
    }
    finally { setSubmitLoading(false); }
  };

  if (loading) return <LoadingState variant="skeleton" />;
  if (error && !contract) return <ErrorState onRetry={() => void loadContract(true)} />;
  const health = contract?.gold.health;
  const masterMissing = !contract?.configurationState.mastersConfigured;
  const healthReady = health?.healthStatus === "HEALTHY" && health?.stale !== true;
  const BackIcon = rtl ? ArrowRight : ArrowLeft;
  const strategyOptions = [{ value: "GOLD_BY_WEIGHT_JEWELLERY", label: rtl ? "مجوهرات ذهب بالوزن" : "Gold By Weight Jewellery" }, { value: "GOLD_BAR_24K", label: rtl ? "سبيكة ذهب 24K" : "24K Gold Bar" }];
  const selectedRate = preview?.current?.goldRate || preview?.current?.gold_rate;

  return <div dir={rtl ? "rtl" : "ltr"} className="space-y-6 text-xs">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/inventory" className="mb-3 inline-flex items-center gap-1 font-bold text-slate-400 hover:text-brand-700"><BackIcon className="h-4 w-4" />{rtl ? "كل القطع" : "All Items"}</Link><PageHeader title={rtl ? "إضافة ذهب بالوزن" : "Add Gold By Weight"} description={rtl ? "شاشة مستقلة: أصل واحد لكل قطعة، والاستلام يمر عبر Supplier V2." : "Dedicated profile screen: one Asset per physical piece through Supplier V2."} /></div><Button variant="secondary" onClick={() => void loadContract(true)} disabled={refreshing}><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />{rtl ? "تحديث العقد" : "Refresh contract"}</Button></div>

     <Card className="flex flex-wrap items-center gap-3 border-brand-200 bg-brand-50/60 p-4 dark:border-brand-900 dark:bg-brand-950/20"><Badge tone={healthReady ? "green" : "rose"}>{healthReady ? (rtl ? "Gold Center متاح" : "Gold Center ready") : (rtl ? "Gold Center غير جاهز" : "Gold Center unavailable")}</Badge><span>{contract?.gold.provider || "—"} · {contract?.gold.currency || contract?.currency || "AED"}</span>{health?.latestQuote?.quoteTimestamp && <span className="text-slate-500">{rtl ? "آخر quote" : "Last quote"}: {health.latestQuote.quoteTimestamp}</span>}<span className="ms-auto text-[10px] text-slate-500">{rtl ? "لا يتم عرض أو قبول Product quantity هنا" : "Product quantity is never an authority here"}</span></Card>
     <SharedReceiveSection state={receive} suppliers={contract?.suppliers || []} locations={contract?.locations || []} taxPolicy={contract?.taxPolicy} taxSummary={taxSummary} onChange={updateReceive} rcmVerified={rcmVerified} onRcmVerified={setRcmVerified} onRcmEvidenceChange={(evidence) => setReceive((current) => ({ ...current, rcmEvidence: evidence }))} />
    {masterMissing && <Card className="border-amber-300 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/20"><div className="flex items-center gap-2 font-bold"><CircleAlert className="h-4 w-4" />{rtl ? "بيانات Master Data غير مهيأة" : "Master Data is not configured"}</div><p className="mt-1">{rtl ? "القوائم الرسمية فارغة؛ لن يتم استبدالها بقيم hardcoded. اطلب provisioning معتمدًا." : "The official server lists are empty; no hardcoded production substitute is used. Approved provisioning is required."}</p></Card>}

    <Section number={1} title={rtl ? "بيانات تعريف القطعة" : "Item Identification"} icon={<Gem className="h-4 w-4 text-brand-600" />}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><SelectField label={rtl ? "استراتيجية الملف" : "Profile strategy"} value={draft.strategy} onChange={(value) => update("strategy", value)} options={strategyOptions} required /><SelectField label={rtl ? "وصف القطعة" : "Item Description"} value={draft.description} onChange={(value) => update("description", value)} options={masters.descriptions.map((item) => ({ value: item.label, label: item.label }))} required disabled={!masters.descriptions.length} /><SelectField label={rtl ? "كود الباركود" : "Barcode Item Code"} value={draft.itemCode} onChange={(value) => update("itemCode", value)} options={(contract?.barcode?.itemCodes || []).filter((item: any) => item.isActive && item.isClientApproved !== false).map((item: any) => ({ value: item.code, label: `${item.code} — ${item.displayName}` }))} required disabled={!contract?.barcode?.itemCodes?.length} /><SelectField label={rtl ? "العيار" : "Gold Karat / KT"} value={draft.karat} onChange={(value) => update("karat", value)} options={(draft.strategy === "GOLD_BAR_24K" ? [24] : (contract?.jewelleryKarats || [])).map((value) => ({ value: String(value), label: `${value}K` }))} required /><SelectField label={rtl ? "لون الذهب" : "Gold Color"} value={draft.goldColor} onChange={(value) => update("goldColor", value)} options={masters.colors.map((item) => ({ value: item.label, label: item.label }))} /></div><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Field label={rtl ? "الماركة" : "Brand Name"} value={draft.brand} onChange={(value) => update("brand", value)} /><Field label={rtl ? "الموديل" : "Model Name"} value={draft.model} onChange={(value) => update("model", value)} /><Field label={rtl ? "رقم الموديل" : "Model Number"} value={draft.modelNumber} onChange={(value) => update("modelNumber", value)} /></div></Section>

    <Section number={2} title={rtl ? "بيانات الأوزان" : "Weight Information"} icon={<Scale className="h-4 w-4 text-brand-600" />}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><Field label={rtl ? "الوزن الإجمالي (g)" : "Gross Weight (g)"} value={draft.grossWeight} onChange={(value) => update("grossWeight", value)} type="number" step="0.0001" required /><Field label={rtl ? "وزن الأحجار (g)" : "Stone Weight (g)"} value={draft.stoneWeight} onChange={(value) => update("stoneWeight", value)} type="number" step="0.0001" required /><Field label={rtl ? "اسم الحجر" : "Stone Name"} value={draft.stoneName} onChange={(value) => update("stoneName", value)} /><Field label={rtl ? "الوزن الصافي (g)" : "Net Gold Weight (g)"} value={preview?.weights?.netGoldWeight || "—"} readOnly /><Field label={rtl ? "الذهب الخالص 999.9 (g)" : "Pure Gold Weight 999.9 (g)"} value={preview?.weights?.pureGoldWeight9999 || "—"} readOnly /></div><p className="text-[10px] text-slate-500">{rtl ? "الصافي والذهب الخالص محسوبان على الخادم ولا يمكن تحريرهما." : "Net and pure-gold weights are server-calculated and read-only."}</p></Section>

    <Section number={3} title={rtl ? "بيانات الشراء" : "Purchase Information"}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><Field label={rtl ? "سعر الذهب وقت الشراء / g" : "Global Gold Rate At Purchase / g"} value={draft.purchaseGoldRate} onChange={(value) => update("purchaseGoldRate", value)} type="number" step="0.00000001" /><Field label={rtl ? "المصنعية / g" : "Making Cost Per Gram"} value={draft.makingPerGram} onChange={(value) => update("makingPerGram", value)} type="number" step="0.00000001" required={draft.strategy !== "GOLD_BAR_24K"} disabled={draft.strategy === "GOLD_BAR_24K"} /><Field label={rtl ? "تكلفة الشهادة" : "Certificate Cost"} value={draft.certificateCost} onChange={(value) => update("certificateCost", value)} type="number" step="0.01" required={draft.strategy === "GOLD_BAR_24K"} disabled={draft.strategy !== "GOLD_BAR_24K"} />{purchaseRateOverrideActive && <label className="space-y-1 md:col-span-2 xl:col-span-3"><span className="block text-[11px] font-bold text-slate-500">{rtl ? "سبب تعديل سعر شراء الذهب" : "Purchase Gold-Rate Override Reason"} *</span><textarea id="purchase-gold-rate-override-reason" aria-describedby="purchase-gold-rate-override-reason-help" required rows={2} className="input-base min-h-20 w-full resize-y" value={draft.purchaseGoldRateOverrideReason} onChange={(event) => update("purchaseGoldRateOverrideReason", event.target.value)} /><span id="purchase-gold-rate-override-reason-help" className="block text-[10px] text-slate-500">{rtl ? "أدخل سبب اختلاف السعر عن المرجع الحالي." : "Enter why the purchase rate differs from the current reference."}</span></label>}</div><div className="mt-3 grid gap-3 md:grid-cols-3"><Field label={rtl ? "قيمة الذهب" : "Total Gold Value"} value={money(preview?.purchase?.goldValue, contract?.currency || "AED", locale)} readOnly /><Field label={rtl ? "إجمالي المصنعية" : "Total Making Cost"} value={money(preview?.purchase?.makingTotal, contract?.currency || "AED", locale)} readOnly /><Field label={rtl ? "إجمالي الشراء" : "Total Purchase Cost"} value={money(preview?.purchase?.totalPurchaseCost, contract?.currency || "AED", locale)} readOnly /></div></Section>

    <Section number={4} title={rtl ? "التكلفة الحالية" : "Current Cost"}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><Field label={rtl ? "سعر الذهب الحالي" : "Current Global Gold Rate"} value={selectedRate || "—"} readOnly /><Field label={rtl ? "قيمة الذهب الحالية" : "Current Gold Value"} value={money(preview?.current?.goldValue, contract?.currency || "AED", locale)} readOnly /><Field label={rtl ? "مصنعية حالية / g" : "Current Making Cost / g"} value={draft.currentMakingPerGram || draft.makingPerGram} onChange={(value) => update("currentMakingPerGram", value)} type="number" step="0.00000001" disabled={draft.strategy === "GOLD_BAR_24K"} /><Field label={rtl ? "قيمة المصنعية الحالية" : "Current Making Value"} value={money(preview?.current?.makingValue, contract?.currency || "AED", locale)} readOnly /><Field label={rtl ? "الإجمالي الحالي" : "Current Total Cost"} value={money(preview?.current?.totalValue, contract?.currency || "AED", locale)} readOnly /></div><p className="mt-2 text-[10px] text-slate-500">{rtl ? "المعاينة الحالية منفصلة عن لقطة الشراء التاريخية. التعديل اليدوي محكوم بإعداد وصلاحية صريحة." : "Current valuation is separate from the immutable purchase snapshot. Manual override requires explicit configuration and permission."} {contract?.settings.manualOverride.available ? <Badge tone="amber">{rtl ? "متاح بصلاحية" : "Permission enabled"}</Badge> : <Badge tone="slate"><LockKeyhole className="me-1 inline h-3 w-3" />{rtl ? "مغلق Fail-Closed" : "Fail-closed"}</Badge>}</p></Section>

    <Section number={5} title={rtl ? "بيانات البيع والتسعير" : "Sales / Pricing"}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Field label={rtl ? "سعر البيع الحالي" : "Current Selling Gold Rate"} value={selectedRate || "—"} readOnly /><Field label={rtl ? "مصنعية البيع / g" : "Selling Making Per Gram"} value={draft.sellingMakingPerGram} onChange={(value) => update("sellingMakingPerGram", value)} type="number" step="0.00000001" required /><Field label={rtl ? "الحد الأدنى للمصنعية / g" : "Minimum Allowed Making / g"} value={draft.minimumMakingPerGram} onChange={(value) => update("minimumMakingPerGram", value)} type="number" step="0.00000001" required /><div className="flex items-end"><Button type="button" variant="secondary" onClick={() => void requestSalePreview()} disabled={saleLoading || !preview}>{saleLoading ? (rtl ? "جارٍ الحساب…" : "Calculating…") : (rtl ? "احسب سعر البيع" : "Calculate sale")}</Button></div></div>{salePreview && <div className="mt-4 grid gap-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4 md:grid-cols-2 xl:grid-cols-5"><Field label={rtl ? "قيمة الذهب" : "Gold Value"} value={money(salePreview.goldValue, contract?.currency || "AED", locale)} readOnly /><Field label={rtl ? "إجمالي المصنعية" : "Making Total"} value={money(salePreview.makingTotal, contract?.currency || "AED", locale)} readOnly /><Field label={rtl ? "قبل الضريبة" : "Subtotal"} value={money(salePreview.subtotal, contract?.currency || "AED", locale)} readOnly /><Field label="VAT" value={money(salePreview.vatAmount, contract?.currency || "AED", locale)} readOnly /><Field label={rtl ? "الإجمالي" : "Total"} value={money(salePreview.total, contract?.currency || "AED", locale)} readOnly /><div className="md:col-span-2 xl:col-span-5"><Badge tone={salePreview.approvalRequired ? "amber" : "green"}>{salePreview.approvalRequired ? (rtl ? "يتطلب اعتماد مدير" : "Manager approval required") : (rtl ? "ضمن الحد الأدنى" : "Within minimum policy")}</Badge></div></div>}</Section>

    <Section number={6} title={rtl ? "بيانات التاج والهوية" : "Tag / Barcode / RFID"} icon={<Tag className="h-4 w-4 text-brand-600" />}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Field label="Asset ID" value={submitResult?.assets?.[0]?.id || "Generated on receive"} readOnly /><Field label="Barcode" value={submitResult?.assets?.[0]?.barcode || "Generated by server"} readOnly /><Field label="RFID" value={draft.rfid} onChange={(value) => update("rfid", value)} /><Field label={rtl ? "حالة التاج" : "Tag state"} value="PENDING" readOnly /></div><p className="text-[10px] text-slate-500">{rtl ? "الباركود يولده الخادم ولا يعاد استخدامه. إعادة الطباعة/ربط RFID يتمان من مسارات Asset المعتمدة بعد الإنشاء." : "Barcode is generated by the server and never reused. Reprint/RFID assignment use the governed Asset actions after creation."}</p></Section>

    <Section number={7} title={rtl ? "الحالة والفرع" : "Status / Branch"}><div className="grid gap-3 md:grid-cols-3"><Field label={rtl ? "الفرع" : "Branch"} value={branchId || "—"} readOnly /><Field label={rtl ? "الحالة التشغيلية" : "Operational Status"} value="AVAILABLE after canonical receive" readOnly /><Field label={rtl ? "الحالة" : "Condition"} value="—" readOnly /></div><p className="text-[10px] text-slate-500">{rtl ? "الفرع من سياق الخادم؛ الحالة لا تُرسل من الشاشة ولا تتحول إلى Product quantity." : "Branch is server-context-owned; operational status is not intake-editable and never becomes Product quantity."}</p></Section>

    <Section number={8} title={rtl ? "التدقيق والنظام" : "Audit & System"}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Field label={rtl ? "الشركة" : "Company"} value={company?.businessName || "—"} readOnly /><Field label={rtl ? "العملة" : "Currency"} value={contract?.currency || "AED"} readOnly /><Field label={rtl ? "مصدر الذهب" : "Gold Source"} value={healthReady ? `${contract?.gold.provider || "GOLD_CENTER"} / LIVE` : "UNAVAILABLE"} readOnly /><Field label={rtl ? "مصدر الاستلام" : "Receive Authority"} value="SUPPLIER_V2_PER_PIECE" readOnly /></div><p className="text-[10px] text-slate-500">{rtl ? "يحفظ المسار القانوني actor/company/branch/time/source، وتعرض شاشة التفاصيل التاريخ والمراجعات دون تخزين مكرر." : "The canonical path records actor/company/branch/time/source; the Asset detail aggregates immutable history without duplicate storage."}</p></Section>

    {error && <Card className="border-rose-300 bg-rose-50 p-4 text-rose-900 dark:bg-rose-950/20"><CircleAlert className="me-2 inline h-4 w-4" />{error}</Card>}
    {submitResult && <Card className="border-emerald-300 bg-emerald-50 p-4 text-emerald-900 dark:bg-emerald-950/20"><CheckCircle2 className="me-2 inline h-4 w-4" />{rtl ? "تم استلام الأصل عبر Supplier V2." : "Asset received through Supplier V2."} <Link className="ms-2 font-bold underline" href={`/inventory/${encodeURIComponent(submitResult.assets?.[0]?.id || submitResult.createdAssets?.[0]?.id || "")}`}>{rtl ? "فتح التفاصيل" : "Open detail"}</Link></Card>}
    {!healthReady && <p className="text-[10px] text-rose-600">{rtl ? "لا يمكن اعتماد أسعار الذهب أثناء توقف/تقادم Gold Center." : "Gold Center must be healthy and fresh before authoritative pricing."}</p>}
    <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" onClick={() => { setDraft(initialDraft); setReceive(initialReceiveState); setTaxSummary(null); setRcmVerified(false); }}>{rtl ? "مسح" : "Clear"}</Button><Button onClick={() => void submit()} disabled={submitLoading || !healthReady || masterMissing || !preview || !taxSummary || !receive.supplierId || !receive.locationId || !receive.taxTreatment || !draft.description || !resolvedItemCode || (receive.taxTreatment === "REVERSE_CHARGE" && !rcmVerified)}><Save className="h-4 w-4" />{submitLoading ? (rtl ? "جارٍ الاستلام…" : "Receiving…") : (rtl ? "استلام قطعة واحدة" : "Receive one Asset")}</Button></div>
  </div>;
}
