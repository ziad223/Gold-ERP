"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Diamond, LockKeyhole, RefreshCw, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { useBranchContext } from "@/contexts/branch-context";
import { apiClient, generateUUID } from "@/lib/api/client";
import { buildSharedTaxRequest, SharedReceiveSection, type SharedReceiveState } from "@/components/inventory/shared-receive-section";

type AnyRecord = Record<string, any>;
const initialReceive: SharedReceiveState = { supplierId: "", locationId: "", purchaseDate: new Date().toISOString().slice(0, 10), taxTreatment: "", notes: "", rcmEvidence: {} };
const initialForm: AnyRecord = { description: "", stoneName: "", diamondType: "", treatment: "", treatmentDescription: "", colors: [], tone: "", toneLevel: "", saturation: "", clarity: "", cut: "", shape: "", origin: "", certificateAuthority: "", certificateNumber: "", carat: "", purchasePrice: "", stoneCost: "", currentDiamondValue: "", sellingPrice: "", markupPercent: "", maximumDiscountPercent: "", notes: "" };

function Section({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return <Card className="space-y-4 p-5"><h2 className="flex items-center gap-2 text-sm font-black"><span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-[11px] text-white">{number}</span>{title}</h2>{children}</Card>;
}
function Field({ label, value, onChange, type = "text", required = false, readOnly = false }: { label: string; value: any; onChange?: (value: string) => void; type?: string; required?: boolean; readOnly?: boolean }) {
  return <label className="space-y-1"><span className="block text-[11px] font-bold text-slate-500">{label}{required ? " *" : ""}</span><input className={`input-base w-full ${readOnly ? "bg-slate-100 dark:bg-navy-950" : ""}`} type={type} step="any" value={value ?? ""} required={required} readOnly={readOnly} onChange={(event) => onChange?.(event.target.value)} /></label>;
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
  const exactKeyRef = useRef<string | null>(null);

  const update = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const updateReceive = (key: keyof SharedReceiveState, value: string) => setReceive((current) => ({ ...current, [key]: value }));
  const options = (category: string) => (contract?.masterOptions?.[category] || []).filter((row: AnyRecord) => row.isActive !== false);
  const labels = rtl ? { title: "إضافة ألماس حر", description: "مسار واحد للألماس الحر عبر Supplier V2. لا يتم تنفيذ الاستلام من هذه المرحلة.", back: "كل المخزون", refresh: "تحديث", noGold: "لا توجد حقول ذهب في هذا الملف.", readOnly: "معاينة قراءة فقط — زر الاستلام غير متاح في هذه الدفعة." } : { title: "Add Loose Diamond", description: "One canonical Loose Diamond profile through Supplier V2. Receive is disabled in this implementation batch.", back: "All Inventory", refresh: "Refresh", noGold: "Gold business fields are not applicable to this profile.", readOnly: "Read-only preview — final Receive is disabled in this batch." };
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
    setPreview(null); setSharedPreview(null); setPrepared(null); exactKeyRef.current = null;
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
  const receiveItem = useMemo(() => {
    if (!preview || !profileReady) return null;
    const base = preview.purchase?.purchaseBasePreTax;
    const details = preview.piece;
    return { profile: "LOOSE_DIAMOND", inventoryProfile: "LOOSE_DIAMOND", type: "diamond", category: "Diamond Loose Stone", name: form.description, description: form.description, quantity: 1, unitCost: base, grossWeight: details.derivedWeightGrams, purchaseCost: base, sellingPrice: preview.sale?.finalSalePrice, inventoryCode: "DD", itemCode: "LOS", supplierId: receive.supplierId, locationId: receive.locationId, purchaseDate: receive.purchaseDate, looseDetails: { ...details, masterData: details.masterData }, looseFinancial: { purchasePricePreTax: base, purchaseCost: base, stoneCostCanonical: base }, ...(preview.current?.currentDiamondValuePreTax !== null ? { looseCurrentValuation: { currentDiamondValuePreTax: preview.current.currentDiamondValuePreTax }, currentValuation: { rateSource: "LOOSE_DIAMOND_VALUATION", goldRate: null, goldValue: null, makingValue: null, certificateValue: null, componentValue: preview.current.currentDiamondValuePreTax, vatRate: preview.current.currentTax?.effectiveVatRate, vatRateSource: "TAX_ENGINE", vatBase: preview.current.currentDiamondValuePreTax, vatAmount: preview.current.currentVAT, totalValue: preview.current.currentTotalTaxInclusive } } : {}), pricing: { sellingPrice: preview.sale?.finalSalePrice, markupPercent: details.markupPercent, maximumDiscountPercent: details.maximumDiscountPercent, minimumSellingPrice: preview.sale?.minimumAllowedSellingPrice, manualPriceAllowed: false } };
  }, [form.description, preview, profileReady, receive.locationId, receive.purchaseDate, receive.supplierId]);
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
    setPrepared(Object.freeze({ supplierId: receive.supplierId, warehouseId: branchId, branchId, purchaseDate: receive.purchaseDate, locationId: receive.locationId, inventoryV2: true, profile: "LOOSE_DIAMOND", idempotencyKey, ...buildSharedTaxRequest(receive, contract?.taxPolicy), items: [receiveItem] }));
  }, [branchId, contract?.taxPolicy, profileReady, receive, receiveItem, sharedPreview]);

  const toggleColor = (id: string) => update("colors", (form.colors as string[]).includes(id) ? (form.colors as string[]).filter((value) => value !== id) : [...(form.colors as string[]), id]);
  const clearPreview = () => { setPreview(null); setSharedPreview(null); setPrepared(null); exactKeyRef.current = null; };
  const BackIcon = rtl ? ArrowRight : ArrowLeft;
  if (loading) return <LoadingState variant="skeleton" />;
  if (error && !contract) return <ErrorState onRetry={() => void load(true)} />;

  return <div dir={rtl ? "rtl" : "ltr"} className="space-y-6 text-xs">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/inventory" className="mb-3 inline-flex items-center gap-1 font-bold text-slate-400"><BackIcon className="h-4 w-4" />{labels.back}</Link><PageHeader title={labels.title} description={labels.description} /></div><Button variant="secondary" onClick={() => void load(true)} disabled={refreshing}><RefreshCw className="h-4 w-4" />{labels.refresh}</Button></div>
    <Card className="border-amber-200 bg-amber-50/70 p-4 text-amber-900"><LockKeyhole className="me-2 inline h-4 w-4" />{labels.readOnly}<span className="ms-2 font-black">{labels.noGold}</span></Card>
    <Section number={1} title={rtl ? "الهوية والبيانات المشتركة" : "Identity and Shared Data"}><div className="grid gap-3 md:grid-cols-3"><Field label={fieldLabels.description} value={form.description} onChange={(value) => update("description", value)} required /><SelectField label={fieldLabels.stoneName} value={form.stoneName} onChange={(value) => update("stoneName", value)} options={options("DIAMOND_NAME")} required /><SelectField label={fieldLabels.type} value={form.diamondType} onChange={(value) => update("diamondType", value)} options={options("DIAMOND_TYPE")} required /></div><SharedReceiveSection state={receive} suppliers={contract?.suppliers || []} locations={contract?.locations || []} taxPolicy={contract?.taxPolicy} taxSummary={taxSummary} onChange={updateReceive} rcmVerified={receive.taxTreatment !== "REVERSE_CHARGE" || Object.values(receive.rcmEvidence).every(Boolean)} onRcmVerified={() => undefined} onRcmEvidenceChange={(evidence) => setReceive((current) => ({ ...current, rcmEvidence: evidence }))} /></Section>
    <Section number={2} title={rtl ? "خصائص الحجر" : "Stone Properties"}><div className="grid gap-3 md:grid-cols-3"><SelectField label={fieldLabels.treatment} value={form.treatment} onChange={(value) => update("treatment", value)} options={options("DIAMOND_TREATMENT")} /><Field label={fieldLabels.treatmentDescription} value={form.treatmentDescription} onChange={(value) => update("treatmentDescription", value)} /><SelectField label={fieldLabels.clarity} value={form.clarity} onChange={(value) => update("clarity", value)} options={options("DIAMOND_CLARITY")} required /><SelectField label={fieldLabels.cut} value={form.cut} onChange={(value) => update("cut", value)} options={options("DIAMOND_CUT")} /><SelectField label={fieldLabels.shape} value={form.shape} onChange={(value) => update("shape", value)} options={options("DIAMOND_SHAPE")} required /><SelectField label={fieldLabels.origin} value={form.origin} onChange={(value) => update("origin", value)} options={options("DIAMOND_ORIGIN")} /><SelectField label={fieldLabels.tone} value={form.tone} onChange={(value) => update("tone", value)} options={options("DIAMOND_TONE")} /><SelectField label={fieldLabels.toneLevel} value={form.toneLevel} onChange={(value) => update("toneLevel", value)} options={options("DIAMOND_TONE_LEVEL")} /><SelectField label={fieldLabels.saturation} value={form.saturation} onChange={(value) => update("saturation", value)} options={options("DIAMOND_SATURATION")} /></div><div className="mt-4"><p className="mb-2 text-[11px] font-bold text-slate-500">{fieldLabels.color} *</p><div className="grid gap-2 sm:grid-cols-3">{options("DIAMOND_COLOR").map((option: AnyRecord) => <label key={option.id} className="flex items-center gap-2 rounded-xl border border-border p-2"><input type="checkbox" checked={(form.colors as string[]).includes(option.id)} onChange={() => toggleColor(option.id)} />{option.label}</label>)}</div></div><div className="mt-4 grid gap-3 md:grid-cols-3"><SelectField label={fieldLabels.certificateAuthority} value={form.certificateAuthority} onChange={(value) => update("certificateAuthority", value)} options={options("CERTIFICATE_AUTHORITY")} /><Field label={fieldLabels.certificateNumber} value={form.certificateNumber} onChange={(value) => update("certificateNumber", value)} /><Field label={fieldLabels.notes} value={form.notes} onChange={(value) => update("notes", value)} /></div></Section>
    <Section number={3} title={rtl ? "القيراط والتكلفة" : "Carat and Cost"}><div className="grid gap-3 md:grid-cols-3"><Field label={fieldLabels.carat} value={form.carat} onChange={(value) => update("carat", value)} type="number" required /><Field label={fieldLabels.purchasePrice} value={form.purchasePrice} onChange={(value) => update("purchasePrice", value)} type="number" required /><Field label={fieldLabels.stoneCost} value={form.stoneCost} onChange={(value) => update("stoneCost", value)} type="number" /><Field label={rtl ? "الوزن المشتق (g)" : "Derived Weight (g)"} value={preview?.piece?.derivedWeightGrams} readOnly /><Field label={rtl ? "ضريبة الشراء" : "Purchase VAT"} value={money(preview?.purchase?.purchaseVAT, locale)} readOnly /><Field label={rtl ? "إجمالي الشراء" : "Purchase Total"} value={money(preview?.purchase?.purchaseTotalTaxInclusive, locale)} readOnly /></div><p className="mt-3 text-[10px] text-slate-500">{rtl ? "القيراط CT هو السلطة الفيزيائية؛ التحويل إلى g = CT × 0.20 للتقارير المشتركة فقط." : "CT is the physical authority; grams are derived for shared reporting only as CT × 0.20."}</p></Section>
    <Section number={4} title={rtl ? "التقييم الحالي والتسعير" : "Current Valuation and Sales"}><div className="grid gap-3 md:grid-cols-3"><Field label={fieldLabels.current} value={form.currentDiamondValue} onChange={(value) => update("currentDiamondValue", value)} type="number" /><Field label={fieldLabels.selling} value={form.sellingPrice} onChange={(value) => update("sellingPrice", value)} type="number" required /><Field label={fieldLabels.markup} value={form.markupPercent} onChange={(value) => update("markupPercent", value)} type="number" /><Field label={fieldLabels.discount} value={form.maximumDiscountPercent} onChange={(value) => update("maximumDiscountPercent", value)} type="number" /><Field label={rtl ? "ضريبة التقييم الحالي" : "Current VAT"} value={money(preview?.current?.currentVAT, locale)} readOnly /><Field label={rtl ? "الحد الأدنى لسعر البيع" : "Minimum Selling Price"} value={money(preview?.sale?.minimumAllowedSellingPrice, locale)} readOnly /></div><p className="mt-3 text-[10px] text-slate-500">{rtl ? "قيمة التقييم الحالي اختيارية ومستقلة عن تكلفة الشراء التاريخية." : "Current valuation is optional and remains separate from historical purchase cost."}</p></Section>
    <Card className="space-y-3 border-slate-200 bg-slate-50/80 p-4 dark:bg-navy-950/60"><div className="flex flex-wrap items-center gap-3"><Badge tone={profileReady ? "green" : "amber"}>{rtl ? `Profile Preview: ${profileReady ? "جاهزة" : "غير جاهزة"}` : `Profile Preview: ${profileReady ? "READY" : "NOT READY"}`}</Badge><Badge tone={sharedPreview ? "green" : "amber"}>{rtl ? `Shared Preview: ${sharedPreview ? "جاهزة" : "غير جاهزة"}` : `Shared Preview: ${sharedPreview ? "READY" : "NOT READY"}`}</Badge><Badge tone="slate">DD / LOS / 00</Badge></div>{error && <p className="text-rose-700">{error}</p>}{prepared && <details data-testid="loose-diamond-prepared-request" className="rounded-xl border border-border bg-background p-3"><summary className="cursor-pointer font-bold">{rtl ? "Exact Request محضر — قراءة فقط" : "Prepared Exact Request — read-only"}</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-[9px]">{JSON.stringify(prepared, null, 2)}</pre></details>}<p className="text-[10px] text-slate-500">{previewLoading ? (rtl ? "جارٍ طلب المعاينة من الخادم…" : "Requesting server preview…") : (prepared ? (rtl ? "تم الاحتفاظ بالطلب والمفتاح للمعاينة فقط؛ لم يتم إرسال Receive." : "Request and idempotency key are retained for preview only; no Receive was sent.") : labels.readOnly)}</p></Card>
    <div className="flex justify-end gap-3"><Button variant="secondary" onClick={clearPreview}><X className="h-4 w-4" />{rtl ? "إلغاء المعاينة" : "Cancel Preview"}</Button><Button disabled={!profileReady || !sharedPreview} data-final-receive-disabled="true"><Diamond className="h-4 w-4" />{rtl ? "الاستلام غير متاح في هذه الدفعة" : "Receive disabled in this batch"}</Button></div>
  </div>;
}
