"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Diamond, LockKeyhole, RefreshCw, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { useBranchContext } from "@/contexts/branch-context";
import { usePermissions } from "@/hooks/use-permissions";
import { apiClient, generateUUID } from "@/lib/api/client";
import { buildSharedTaxRequest, SharedReceiveSection, type SharedReceiveState } from "@/components/inventory/shared-receive-section";

type AnyRecord = Record<string, any>;
const initialReceive: SharedReceiveState = { supplierId: "", locationId: "", purchaseDate: new Date().toISOString().slice(0, 10), taxTreatment: "", notes: "", rcmEvidence: {} };
const initialForm: AnyRecord = { description: "", stoneName: "", diamondType: "", treatment: "", treatmentDescription: "", colors: [], tone: "", toneLevel: "", saturation: "", clarity: "", cut: "", shape: "", origin: "", certificateAuthority: "", certificateNumber: "", carat: "", purchasePrice: "", stoneCost: "", currentDiamondValue: "", sellingPrice: "", markupPercent: "", maximumDiscountPercent: "", notes: "" };

function Section({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return <Card className="space-y-4 p-5"><h2 className="flex items-center gap-2 text-sm font-black"><span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-[11px] text-white">{number}</span>{title}</h2>{children}</Card>;
}
function Field({ label, value, onChange, type = "text", required = false, readOnly = false, info }: { label: string; value: any; onChange?: (value: string) => void; type?: string; required?: boolean; readOnly?: boolean; info?: { label: string; text: string } }) {
  return <label className="space-y-1"><span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">{label}{required ? " *" : ""}{info && <InfoTooltip {...info} />}</span><input aria-label={`${label}${required ? " *" : ""}`} className={`input-base w-full ${readOnly ? "bg-slate-100 dark:bg-navy-950" : ""}`} type={type} step="any" value={value ?? ""} required={required} readOnly={readOnly} onChange={(event) => onChange?.(event.target.value)} /></label>;
}
function SelectField({ label, value, onChange, options, required = false }: { label: string; value: any; onChange: (value: string) => void; options: Array<{ id?: string; value?: string; label: string }>; required?: boolean }) {
  return <label className="space-y-1"><span className="block text-[11px] font-bold text-slate-500">{label}{required ? " *" : ""}</span><select className="input-base w-full" value={value ?? ""} required={required} onChange={(event) => onChange(event.target.value)}><option value="">—</option>{options.map((option) => <option key={option.id || option.value} value={option.id || option.value}>{option.label}</option>)}</select></label>;
}
const money = (value: any, locale: string) => value === null || value === undefined || value === "" ? "—" : new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 8 }).format(Number(value));
function friendlyError(error: any, rtl: boolean) {
  const code = String(error?.errorCode || error?.code || error?.message || "");
  const messages: Record<string, [string, string]> = {
    LOOSE_DIAMOND_COLOR_REQUIRED: ["يجب اختيار لون واحد على الأقل.", "At least one Diamond Color is required."],
    LOOSE_DIAMOND_MASTER_INVALID: ["القيمة المختارة غير موجودة في Master Data النشطة.", "The selected value is not an active master-data value."],
    LOOSE_DIAMOND_TREATMENT_MASTER_INVALID: ["المعالجة يجب أن تأتي من DIAMOND_TREATMENT.", "Treatment must come from DIAMOND_TREATMENT."],
    LOOSE_DIAMOND_SALE_PRICE_BELOW_MINIMUM: ["سعر البيع أقل من الحد الأدنى.", "Selling Price is below the server minimum."],
  };
  const key = Object.keys(messages).find((entry) => code.includes(entry));
  return key ? messages[key][rtl ? 0 : 1] : (error?.message || (rtl ? "تعذر إكمال المعاينة." : "The preview could not be completed."));
}

export default function LooseDiamondProfilePage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const searchParams = useSearchParams();
  const supplierHint = searchParams.get("supplierId") || "";
  const { branchId, isReady } = useBranchContext();
  const { hasPermission } = usePermissions();
  const [contract, setContract] = useState<AnyRecord | null>(null);
  const [form, setForm] = useState<AnyRecord>(initialForm);
  const [receive, setReceive] = useState<SharedReceiveState>(initialReceive);
  const [preview, setPreview] = useState<AnyRecord | null>(null);
  const [sharedPreview, setSharedPreview] = useState<AnyRecord | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [prepared, setPrepared] = useState<AnyRecord | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [result, setResult] = useState<AnyRecord | null>(null);
  const [replayResult, setReplayResult] = useState<AnyRecord | null>(null);
  const [conflictResult, setConflictResult] = useState<AnyRecord | null>(null);
  const exactKeyRef = useRef<string | null>(null);
  const exactRequestRef = useRef<AnyRecord | null>(null);
  const exactFingerprintRef = useRef<string | null>(null);

  const update = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const updateReceive = (key: keyof SharedReceiveState, value: string) => setReceive((current) => ({ ...current, [key]: value }));
  const options = (category: string) => (contract?.masterOptions?.[category] || []).filter((row: AnyRecord) => row.isActive !== false);
  const acceptanceDiagnostics = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("acceptanceDiagnostics") === "1";
  const labels = rtl ? { title: "إضافة ألماس حر", description: "إدخال بيانات الألماس الحر واستلامه.", back: "كل المخزون", refresh: "تحديث", dataReady: "بيانات الاستلام مكتملة", dataIncomplete: "أكمل البيانات المطلوبة" } : { title: "Add Loose Diamond", description: "Enter and receive loose diamond details.", back: "All Inventory", refresh: "Refresh", dataReady: "Receipt data complete", dataIncomplete: "Complete required data" };
  const fieldLabels = rtl ? { description: "وصف القطعة", stoneName: "اسم الحجر", type: "نوع الألماس", treatment: "المعالجة", treatmentDescription: "وصف المعالجة الأخرى", color: "ألوان الألماس", tone: "النغمة", toneLevel: "مستوى النغمة", saturation: "التشبع", clarity: "النقاء", cut: "القطع", shape: "الشكل", origin: "المنشأ", certificateAuthority: "جهة الشهادة", certificateNumber: "رقم الشهادة", carat: "الوزن بالقيراط (CT)", purchasePrice: "سعر الشراء قبل الضريبة", stoneCost: "تكلفة الحجر (مطابقة لسعر الشراء)", current: "قيمة الألماس الحالية", selling: "سعر البيع", markup: "نسبة الزيادة %", discount: "الخصم الأقصى %", notes: "ملاحظات" } : { description: "Item Description", stoneName: "Stone Name", type: "Diamond Type", treatment: "Treatment", treatmentDescription: "Other Treatment Description", color: "Diamond Color", tone: "Tone", toneLevel: "Tone Level", saturation: "Saturation", clarity: "Clarity", cut: "Cut", shape: "Shape", origin: "Origin", certificateAuthority: "Certificate Authority", certificateNumber: "Certificate Number", carat: "Carat (CT)", purchasePrice: "Purchase Price Pre-Tax", stoneCost: "Stone Cost (same canonical value)", current: "Current Diamond Value", selling: "Selling Price", markup: "Markup %", discount: "Maximum Discount %", notes: "Notes" };

  const load = async (quiet = false) => {
    if (!isReady) return;
    quiet ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await apiClient<any>("/inventory-v2/loose-diamond/contract", { locale, branchId: branchId || undefined });
      setContract(response?.data || response);
    } catch (caught: any) { setError(friendlyError(caught, rtl)); } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { void load(); }, [branchId, isReady]);
  useEffect(() => {
    if (!contract || !supplierHint) return;
    const supplier = contract.suppliers?.find((entry: AnyRecord) => entry.id === supplierHint && String(entry.status || "").toLowerCase() !== "inactive");
    if (supplier) setReceive((current) => current.supplierId ? current : { ...current, supplierId: supplier.id });
  }, [contract, supplierHint]);

  const profileItem = useMemo(() => ({
    profile: "LOOSE_DIAMOND", inventoryProfile: "LOOSE_DIAMOND", description: form.description,
    looseDetails: { stoneName: form.stoneName, diamondType: form.diamondType, treatment: form.treatment, treatmentDescription: form.treatmentDescription, colors: form.colors, tone: form.tone, toneLevel: form.toneLevel, saturation: form.saturation, clarity: form.clarity, cut: form.cut, shape: form.shape, origin: form.origin, certificateAuthority: form.certificateAuthority, certificateNumber: form.certificateNumber, carat: form.carat, purchasePrice: form.purchasePrice, stoneCost: form.stoneCost, currentDiamondValue: form.currentDiamondValue, sellingPrice: form.sellingPrice, markupPercent: form.markupPercent, maximumDiscountPercent: form.maximumDiscountPercent, notes: form.notes },
    purchasePricePreTax: form.purchasePrice, currentDiamondValue: form.currentDiamondValue, sellingPrice: form.sellingPrice, markupPercent: form.markupPercent, maximumDiscountPercent: form.maximumDiscountPercent, taxTreatment: receive.taxTreatment, taxContext: receive.rcmEvidence,
  }), [form, receive.rcmEvidence, receive.taxTreatment]);
  const profileFingerprint = useMemo(() => JSON.stringify(profileItem), [profileItem]);
  const readyForPreview = Boolean(contract && branchId && receive.supplierId && receive.locationId && receive.purchaseDate && receive.taxTreatment && form.description && form.stoneName && form.diamondType && form.clarity && form.shape && form.carat && Number(form.carat) > 0 && form.purchasePrice !== "" && form.sellingPrice !== "" && Array.isArray(form.colors) && form.colors.length > 0);

  useEffect(() => {
    setPreview(null); setSharedPreview(null); setPrepared(null); setResult(null); setReplayResult(null); setConflictResult(null); exactKeyRef.current = null; exactRequestRef.current = null; exactFingerprintRef.current = null;
    if (!readyForPreview) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPreviewLoading(true); setError("");
      try {
        const response = await apiClient<any>("/inventory-v2/loose-diamond/preview", { method: "POST", locale, branchId: branchId || undefined, body: JSON.stringify({ item: profileItem }) });
        if (!cancelled) setPreview(response?.data || response);
      } catch (caught: any) { if (!cancelled) setError(friendlyError(caught, rtl)); }
      finally { if (!cancelled) setPreviewLoading(false); }
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [branchId, locale, profileFingerprint, profileItem, readyForPreview, rtl]);

  const profileReady = Boolean(preview?.readiness?.profilePreview === "READY" && preview?.readiness?.salePriceAccepted !== false);
  const currentValuePresent = preview?.current?.currentDiamondValuePreTax !== null && preview?.current?.currentDiamondValuePreTax !== undefined;
  const currentValuationVatRate = preview?.current?.taxSnapshot?.effectiveVatRate;
  const currentValuationReady = !currentValuePresent || (currentValuationVatRate !== null && currentValuationVatRate !== undefined);
  const missingCurrentVatRate = Boolean(profileReady && currentValuePresent && !currentValuationReady);
  useEffect(() => {
    if (missingCurrentVatRate) setError(rtl ? "تعذر التحقق من نسبة ضريبة التقييم الحالية من إعدادات الشركة." : "The current valuation VAT rate is unavailable from the company tax preview.");
  }, [missingCurrentVatRate, rtl]);
  const receiveItem = useMemo(() => {
    if (!preview || !profileReady || !currentValuationReady) return null;
    const base = preview.purchase?.purchaseBasePreTax;
    const details = preview.piece;
    const piece = { profile: "LOOSE_DIAMOND", inventoryProfile: "LOOSE_DIAMOND", type: "diamond", category: "Diamond Loose Stone", name: form.description, description: form.description, unitCost: base, grossWeight: details.derivedWeightGrams, purchaseCost: base, sellingPrice: preview.sale?.finalSalePrice, inventoryCode: "DD", itemCode: "LOS", karatCode: "00", supplierId: receive.supplierId, locationId: receive.locationId, purchaseDate: receive.purchaseDate, looseDetails: { ...details, masterData: details.masterData }, looseFinancial: { purchasePricePreTax: base, purchaseCost: base, stoneCostCanonical: base }, ...(currentValuePresent ? { looseCurrentValuation: { currentDiamondValuePreTax: preview.current.currentDiamondValuePreTax }, currentValuation: { rateSource: "LOOSE_DIAMOND_VALUATION", goldRate: null, goldValue: null, makingValue: null, certificateValue: null, componentValue: preview.current.currentDiamondValuePreTax, vatRate: currentValuationVatRate, vatRateSource: "TAX_ENGINE", vatBase: preview.current.currentDiamondValuePreTax, vatAmount: preview.current.currentVAT, totalValue: preview.current.currentTotalTaxInclusive } } : {}), pricing: { sellingPrice: preview.sale?.finalSalePrice, markupPercent: details.markupPercent, maximumDiscountPercent: details.maximumDiscountPercent, minimumSellingPrice: preview.sale?.minimumAllowedSellingPrice, manualPriceAllowed: false } };
    return { ...piece, quantity: 1, perPiece: [piece] };
  }, [currentValuationReady, currentValuationVatRate, currentValuePresent, form.description, preview, profileReady, receive.locationId, receive.purchaseDate, receive.supplierId]);
  const sharedReady = Boolean(sharedPreview?.success !== false && sharedPreview && profileReady);
  const taxSummary = sharedPreview?.tax || sharedPreview?.summary || sharedPreview;

  useEffect(() => {
    if (!receiveItem || !profileReady || !receive.supplierId || !receive.locationId || !receive.purchaseDate || !receive.taxTreatment) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await apiClient<any>("/inventory-v2/receive-preview", { method: "POST", locale, branchId: branchId || undefined, body: JSON.stringify({ supplierId: receive.supplierId, warehouseId: branchId, branchId, purchaseDate: receive.purchaseDate, locationId: receive.locationId, items: [receiveItem], inventoryV2: true, ...buildSharedTaxRequest(receive, contract?.taxPolicy) }) });
        if (!cancelled) setSharedPreview(response?.data || response);
      } catch (caught: any) { if (!cancelled) { setSharedPreview(null); setError(friendlyError(caught, rtl)); } }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [branchId, contract?.taxPolicy, locale, receive, receiveItem, rtl, sharedReady]);

  useEffect(() => {
    if (!receiveItem || !sharedPreview || !profileReady) return;
    const idempotencyKey = generateUUID();
    exactKeyRef.current = idempotencyKey;
    const exactRequest = Object.freeze({ supplierId: receive.supplierId, warehouseId: branchId, branchId, purchaseDate: receive.purchaseDate, locationId: receive.locationId, notes: receive.notes || undefined, inventoryV2: true, profile: "LOOSE_DIAMOND", idempotencyKey, ...buildSharedTaxRequest(receive, contract?.taxPolicy), items: [receiveItem] });
    exactRequestRef.current = exactRequest;
    exactFingerprintRef.current = JSON.stringify({ profile: profileItem, supplierId: receive.supplierId, locationId: receive.locationId, purchaseDate: receive.purchaseDate, taxTreatment: receive.taxTreatment, request: exactRequest });
    setPrepared(exactRequest);
  }, [branchId, contract?.taxPolicy, profileReady, receive, receiveItem, sharedPreview]);

  const toggleColor = (id: string) => update("colors", (form.colors as string[]).includes(id) ? (form.colors as string[]).filter((value) => value !== id) : [...(form.colors as string[]), id]);
  const finalFingerprint = JSON.stringify({ profile: profileItem, supplierId: receive.supplierId, locationId: receive.locationId, purchaseDate: receive.purchaseDate, taxTreatment: receive.taxTreatment, request: prepared });
  const canReceive = Boolean(hasPermission("suppliers.create") && branchId && profileReady && sharedReady && prepared && !previewLoading && !submitLoading && exactFingerprintRef.current === finalFingerprint);
  const openConfirmation = () => { if (!canReceive) { setError(rtl ? "أكمل المعاينة والبيانات المطلوبة أولًا." : "Complete both server previews first."); return; } setError(""); setConfirmationOpen(true); };
  const confirmReceive = async () => {
    if (!canReceive || !exactRequestRef.current || !exactKeyRef.current || exactFingerprintRef.current !== finalFingerprint) return;
    setSubmitLoading(true); setError(""); setResult(null); setReplayResult(null); setConflictResult(null);
    const exactRequest = exactRequestRef.current; const idempotencyKey = exactKeyRef.current;
    try {
      const response = await apiClient<any>("/purchase-orders/receive", { method: "POST", locale, branchId: branchId || undefined, idempotencyKey, body: JSON.stringify(exactRequest) });
      setResult(response?.data || response); setConfirmationOpen(false);
    } catch (caught: any) { setError(friendlyError(caught, rtl)); }
    finally { setSubmitLoading(false); }
  };
  const replayExactRequest = async () => {
    if (!exactRequestRef.current || !exactKeyRef.current) return;
    setSubmitLoading(true); setError("");
    try { const response = await apiClient<any>("/purchase-orders/receive", { method: "POST", locale, branchId: branchId || undefined, idempotencyKey: exactKeyRef.current, body: JSON.stringify(exactRequestRef.current) }); setReplayResult(response?.data || response); }
    catch (caught: any) { setReplayResult({ status: caught?.status || null, errorCode: caught?.errorCode || caught?.code || null, message: caught?.message || "Replay failed" }); }
    finally { setSubmitLoading(false); }
  };
  const conflictReplay = async () => {
    if (!exactRequestRef.current || !exactKeyRef.current) return;
    setSubmitLoading(true); setError("");
    try { await apiClient<any>("/purchase-orders/receive", { method: "POST", locale, branchId: branchId || undefined, idempotencyKey: exactKeyRef.current, body: JSON.stringify({ ...exactRequestRef.current, notes: `${receive.notes || ""} [changed-payload]` }) }); setConflictResult({ status: "UNEXPECTED_SUCCESS" }); }
    catch (caught: any) { setConflictResult({ status: caught?.status || null, errorCode: caught?.errorCode || caught?.code || null, message: caught?.message || "Conflict response" }); }
    finally { setSubmitLoading(false); }
  };
  const clearPreview = () => { setPreview(null); setSharedPreview(null); setPrepared(null); setResult(null); setReplayResult(null); setConflictResult(null); exactKeyRef.current = null; exactRequestRef.current = null; exactFingerprintRef.current = null; };
  const BackIcon = rtl ? ArrowRight : ArrowLeft;
  if (loading) return <LoadingState variant="skeleton" />;
  if (error && !contract) return <ErrorState onRetry={() => void load(true)} />;

  return <div dir={rtl ? "rtl" : "ltr"} className="space-y-6 text-xs">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/inventory" className="mb-3 inline-flex items-center gap-1 font-bold text-slate-400"><BackIcon className="h-4 w-4" />{labels.back}</Link><PageHeader title={labels.title} description={labels.description} /></div><Button variant="secondary" onClick={() => void load(true)} disabled={refreshing}><RefreshCw className="h-4 w-4" />{labels.refresh}</Button></div>
    <Section number={1} title={rtl ? "الهوية والبيانات المشتركة" : "Identity and Shared Data"}><div className="grid gap-3 md:grid-cols-3"><Field label={fieldLabels.description} value={form.description} onChange={(value) => update("description", value)} required /><SelectField label={fieldLabels.stoneName} value={form.stoneName} onChange={(value) => update("stoneName", value)} options={options("DIAMOND_NAME")} required /><SelectField label={fieldLabels.type} value={form.diamondType} onChange={(value) => update("diamondType", value)} options={options("DIAMOND_TYPE")} required /></div><SharedReceiveSection state={receive} suppliers={contract?.suppliers || []} locations={contract?.locations || []} taxPolicy={contract?.taxPolicy} taxSummary={taxSummary} onChange={updateReceive} rcmVerified={receive.taxTreatment !== "REVERSE_CHARGE" || Object.values(receive.rcmEvidence).every(Boolean)} onRcmVerified={() => undefined} onRcmEvidenceChange={(evidence) => setReceive((current) => ({ ...current, rcmEvidence: evidence }))} /></Section>
    <Section number={2} title={rtl ? "خصائص الحجر" : "Stone Properties"}><div className="grid gap-3 md:grid-cols-3"><SelectField label={fieldLabels.treatment} value={form.treatment} onChange={(value) => update("treatment", value)} options={options("DIAMOND_TREATMENT")} /><Field label={fieldLabels.treatmentDescription} value={form.treatmentDescription} onChange={(value) => update("treatmentDescription", value)} /><SelectField label={fieldLabels.clarity} value={form.clarity} onChange={(value) => update("clarity", value)} options={options("DIAMOND_CLARITY")} required /><SelectField label={fieldLabels.cut} value={form.cut} onChange={(value) => update("cut", value)} options={options("DIAMOND_CUT")} /><SelectField label={fieldLabels.shape} value={form.shape} onChange={(value) => update("shape", value)} options={options("DIAMOND_SHAPE")} required /><SelectField label={fieldLabels.origin} value={form.origin} onChange={(value) => update("origin", value)} options={options("DIAMOND_ORIGIN")} /><SelectField label={fieldLabels.tone} value={form.tone} onChange={(value) => update("tone", value)} options={options("DIAMOND_TONE")} /><SelectField label={fieldLabels.toneLevel} value={form.toneLevel} onChange={(value) => update("toneLevel", value)} options={options("DIAMOND_TONE_LEVEL")} /><SelectField label={fieldLabels.saturation} value={form.saturation} onChange={(value) => update("saturation", value)} options={options("DIAMOND_SATURATION")} /></div><div className="mt-4"><p className="mb-2 flex items-center gap-1 text-[11px] font-bold text-slate-500">{fieldLabels.color} *<InfoTooltip label={rtl ? "مساعدة الألوان" : "Color help"} text={rtl ? "يمكن اختيار أكثر من لون للحجر عند الحاجة." : "You can select more than one stone color when needed."} /></p><div className="grid gap-2 sm:grid-cols-3">{options("DIAMOND_COLOR").map((option: AnyRecord) => <label key={option.id} className="flex items-center gap-2 rounded-xl border border-border p-2"><input type="checkbox" checked={(form.colors as string[]).includes(option.id)} onChange={() => toggleColor(option.id)} />{option.label}</label>)}</div></div><div className="mt-4 grid gap-3 md:grid-cols-3"><SelectField label={fieldLabels.certificateAuthority} value={form.certificateAuthority} onChange={(value) => update("certificateAuthority", value)} options={options("CERTIFICATE_AUTHORITY")} /><Field label={fieldLabels.certificateNumber} value={form.certificateNumber} onChange={(value) => update("certificateNumber", value)} /><Field label={fieldLabels.notes} value={form.notes} onChange={(value) => update("notes", value)} /></div></Section>
    <Section number={3} title={rtl ? "القيراط والتكلفة" : "Carat and Cost"}><div className="grid gap-3 md:grid-cols-3"><Field label={fieldLabels.carat} value={form.carat} onChange={(value) => update("carat", value)} type="number" required /><Field label={fieldLabels.purchasePrice} value={form.purchasePrice} onChange={(value) => update("purchasePrice", value)} type="number" required info={{ label: rtl ? "مساعدة سعر الشراء" : "Purchase price help", text: rtl ? "أدخل سعر شراء الحجر قبل الضريبة، ويتم احتساب الضريبة تلقائيًا حسب إعدادات الشركة." : "Enter the stone purchase price before tax; tax is calculated automatically from company settings." }} /><Field label={fieldLabels.stoneCost} value={form.stoneCost} onChange={(value) => update("stoneCost", value)} type="number" /><Field label={rtl ? "الوزن المشتق (g)" : "Derived Weight (g)"} value={preview?.piece?.derivedWeightGrams} readOnly /><Field label={rtl ? "ضريبة الشراء" : "Purchase VAT"} value={money(preview?.purchase?.purchaseVAT, locale)} readOnly /><Field label={rtl ? "إجمالي الشراء" : "Purchase Total"} value={money(preview?.purchase?.purchaseTotalTaxInclusive, locale)} readOnly /></div><p className="mt-3 flex items-center gap-1 text-[10px] text-slate-500">{rtl ? "القيراط CT هو السلطة الفيزيائية؛ التحويل إلى g = CT × 0.20 للتقارير المشتركة فقط." : "CT is the physical authority; grams are derived for shared reporting only as CT × 0.20."}<InfoTooltip label={rtl ? "مساعدة القيراط" : "Carat help"} text={rtl ? "يُسجّل وزن الحجر بالقيراط، ويُستخدم الوزن المشتق للتقارير فقط." : "The stone is recorded in carats; derived weight is used for reporting only."} /></p></Section>
    <Section number={4} title={rtl ? "التقييم الحالي والتسعير" : "Current Valuation and Sales"}><div className="grid gap-3 md:grid-cols-3"><Field label={fieldLabels.current} value={form.currentDiamondValue} onChange={(value) => update("currentDiamondValue", value)} type="number" info={{ label: rtl ? "مساعدة القيمة الحالية" : "Current value help", text: rtl ? "القيمة الحالية مستقلة عن سعر الشراء التاريخي ويمكن تحديثها دون تغيير تكلفة الشراء الأصلية." : "Current value is independent of historical purchase price and can be updated without changing the original purchase cost." }} /><Field label={fieldLabels.selling} value={form.sellingPrice} onChange={(value) => update("sellingPrice", value)} type="number" required /><Field label={fieldLabels.markup} value={form.markupPercent} onChange={(value) => update("markupPercent", value)} type="number" /><Field label={fieldLabels.discount} value={form.maximumDiscountPercent} onChange={(value) => update("maximumDiscountPercent", value)} type="number" /><Field label={rtl ? "ضريبة التقييم الحالي" : "Current VAT"} value={money(preview?.current?.currentVAT, locale)} readOnly /><Field label={rtl ? "الحد الأدنى لسعر البيع" : "Minimum Selling Price"} value={money(preview?.sale?.minimumAllowedSellingPrice, locale)} readOnly /></div><p className="mt-3 text-[10px] text-slate-500">{rtl ? "قيمة التقييم الحالي اختيارية ومستقلة عن تكلفة الشراء التاريخية." : "Current valuation is optional and remains separate from historical purchase cost."}</p></Section>
    <Card className="space-y-3 border-slate-200 bg-slate-50/80 p-4 dark:bg-navy-950/60"><div className="flex flex-wrap items-center gap-3"><Badge tone={profileReady && sharedReady ? "green" : "amber"}>{profileReady && sharedReady ? labels.dataReady : labels.dataIncomplete}</Badge><Badge tone={hasPermission("suppliers.create") ? "green" : "rose"}>{hasPermission("suppliers.create") ? (rtl ? "صلاحية الاستلام متاحة" : "Receive permission available") : (rtl ? "لا توجد صلاحية الاستلام" : "Receive permission unavailable")}</Badge></div>{error && <p className="text-rose-700">{error}</p>}{acceptanceDiagnostics && prepared && <details data-testid="loose-diamond-prepared-request" className="rounded-xl border border-border bg-background p-3"><summary className="cursor-pointer font-bold">{rtl ? "تفاصيل فنية للاختبار" : "Developer acceptance details"}</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-[9px]">{JSON.stringify(prepared, null, 2)}</pre></details>}{acceptanceDiagnostics && <p className="text-[10px] text-slate-500">{previewLoading ? (rtl ? "جارٍ فحص البيانات…" : "Validating receipt data…") : prepared ? (rtl ? "تم حفظ بيانات الإثبات." : "Acceptance data retained.") : ""}</p>}</Card>
    {result && <Card className="space-y-3 border-emerald-300 bg-emerald-50 p-4 text-emerald-900"><CheckCircle2 className="me-2 inline h-4 w-4" />{rtl ? "تم استلام الألماس بنجاح." : "Loose Diamond received successfully."}{acceptanceDiagnostics && <div className="flex flex-wrap gap-2 pt-2"><Button variant="secondary" onClick={() => void replayExactRequest()} disabled={submitLoading}>{rtl ? "إعادة إرسال العملية" : "Replay transaction"}</Button><Button variant="secondary" onClick={() => void conflictReplay()} disabled={submitLoading}>{rtl ? "إرسال نسخة معدلة" : "Send changed copy"}</Button></div>}{acceptanceDiagnostics && replayResult && <pre className="whitespace-pre-wrap text-[10px]">{JSON.stringify(replayResult, null, 2)}</pre>}{acceptanceDiagnostics && conflictResult && <pre className="whitespace-pre-wrap text-[10px]">{JSON.stringify(conflictResult, null, 2)}</pre>}</Card>}
    <div className="flex justify-end gap-3"><Button variant="secondary" onClick={clearPreview}><X className="h-4 w-4" />{rtl ? "إلغاء المعاينة" : "Cancel Preview"}</Button><Button onClick={openConfirmation} disabled={!canReceive} data-final-receive="true"><Diamond className="h-4 w-4" />{rtl ? "استلام المخزون" : "Receive Inventory"}</Button></div>
    {confirmationOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><Card className="max-h-[calc(100vh-2rem)] w-full max-w-2xl space-y-5 overflow-y-auto p-6 shadow-2xl"><div className="flex items-center justify-between gap-3"><h2 className="text-base font-black">{rtl ? "تأكيد استلام ألماس حر" : "Confirm Loose Diamond Receive"}</h2><button type="button" aria-label={rtl ? "إغلاق" : "Close"} onClick={() => setConfirmationOpen(false)} disabled={submitLoading}><X className="h-5 w-5" /></button></div><div className="grid gap-3 sm:grid-cols-2"><Field label={rtl ? "المورد" : "Supplier"} value={receive.supplierId} readOnly /><Field label={rtl ? "الموقع" : "Location"} value={receive.locationId} readOnly /><Field label={rtl ? "تاريخ الشراء" : "Purchase Date"} value={receive.purchaseDate} readOnly /><Field label={rtl ? "الوصف" : "Item Description"} value={form.description} readOnly /><Field label={rtl ? "القيراط" : "Carat"} value={`${form.carat} CT`} readOnly /><Field label={rtl ? "سعر الشراء قبل الضريبة" : "Purchase Price Pre-Tax"} value={money(preview?.purchase?.purchaseBasePreTax, locale)} readOnly /><Field label={rtl ? "ضريبة الشراء" : "Purchase VAT"} value={money(preview?.purchase?.purchaseVAT, locale)} readOnly /><Field label={rtl ? "إجمالي الشراء" : "Purchase Total"} value={money(preview?.purchase?.purchaseTotalTaxInclusive, locale)} readOnly /><Field label={rtl ? "القيمة الحالية" : "Current Diamond Value"} value={money(preview?.current?.currentDiamondValuePreTax, locale)} readOnly /><Field label={rtl ? "المعاملة الضريبية" : "Tax Treatment"} value={receive.taxTreatment} readOnly /></div>{acceptanceDiagnostics && <><p className="text-[10px] text-slate-500"><LockKeyhole className="me-1 inline h-3 w-3" />{rtl ? "بيانات الإثبات الفنية محفوظة." : "Technical acceptance data is retained."}</p><details data-testid="prepared-receive-payload" open className="rounded-xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-[11px] font-bold">{rtl ? "Developer acceptance payload" : "Developer acceptance payload"}</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-[9px] text-slate-600">{JSON.stringify(exactRequestRef.current, null, 2)}</pre></details></>}<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setConfirmationOpen(false)} disabled={submitLoading}>{rtl ? "إلغاء" : "Cancel"}</Button><Button onClick={() => void confirmReceive()} disabled={submitLoading}>{submitLoading ? (rtl ? "جارٍ التنفيذ…" : "Processing…") : (rtl ? "تأكيد الاستلام" : "Confirm Receive")}</Button></div></Card></div>}
  </div>;
}
