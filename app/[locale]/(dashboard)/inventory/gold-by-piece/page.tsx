"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Coins, LockKeyhole, RefreshCw } from "lucide-react";
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
import { formatCurrency } from "@/lib/utils";
import { buildSharedTaxRequest, SharedReceiveSection, type SharedReceiveState } from "@/components/inventory/shared-receive-section";

type Contract = any;
type Draft = {
  description: string; goldColor: string; karat: string; grossWeight: string; stoneWeight: string;
  condition: string; makingPerGram: string;
  currentMakingPerGram: string; markupPercent: string; maximumDiscountPercent: string;
  itemCode: string; rfid: string; purchaseGoldRate: string;
};

const initialDraft: Draft = {
  description: "", goldColor: "", karat: "21", grossWeight: "", stoneWeight: "0", condition: "NEW",
  makingPerGram: "",
  currentMakingPerGram: "", markupPercent: "", maximumDiscountPercent: "", itemCode: "",
  rfid: "", purchaseGoldRate: "",
};

const initialReceiveState: SharedReceiveState = {
  supplierId: "", locationId: "", purchaseDate: new Date().toISOString().slice(0, 10), taxTreatment: "", notes: "", rcmEvidence: {},
};

function Section({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return <Card className="space-y-4 p-5"><h2 className="flex items-center gap-2 text-sm font-black"><span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-[11px] text-white">{number}</span>{title}</h2>{children}</Card>;
}

function Field({ label, value, onChange, type = "text", required = false, readOnly = false, disabled = false, step }: { label: string; value: string; onChange?: (value: string) => void; type?: string; required?: boolean; readOnly?: boolean; disabled?: boolean; step?: string }) {
  return <label className="space-y-1"><span className="block text-[11px] font-bold text-slate-500">{label}{required ? " *" : ""}</span><input className={`input-base w-full ${readOnly ? "bg-slate-100 dark:bg-navy-950" : ""}`} dir={type === "number" ? "ltr" : undefined} type={type} step={step} required={required} readOnly={readOnly} disabled={disabled} value={value} onChange={(event) => onChange?.(event.target.value)} /></label>;
}

function SelectField({ label, value, onChange, options, required = false }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; required?: boolean }) {
  return <label className="space-y-1"><span className="block text-[11px] font-bold text-slate-500">{label}{required ? " *" : ""}</span><select className="input-base w-full" value={value} required={required} onChange={(event) => onChange(event.target.value)}><option value="">—</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

const num = (value: string) => Number(value || 0);
const money = (value: unknown, locale: string) => value == null ? "—" : formatCurrency(Number(value), "AED", locale);

export default function GoldByPieceProfilePage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const searchParams = useSearchParams();
  const supplierHint = searchParams.get("supplierId") || "";
  const { branchId, isReady } = useBranchContext();
  const [contract, setContract] = useState<Contract | null>(null);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [receive, setReceive] = useState<SharedReceiveState>(initialReceiveState);
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [rcmVerified, setRcmVerified] = useState(false);

  const update = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const updateReceive = (key: keyof SharedReceiveState, value: string) => setReceive((current) => ({ ...current, [key]: value }));
  const masters = useMemo(() => ({
    descriptions: contract?.masters?.filter((item: any) => item.category === "GOLD_ITEM_DESCRIPTION" && item.isActive) || [],
    colors: contract?.masters?.filter((item: any) => item.category === "GOLD_COLOR" && item.isActive) || [],
  }), [contract]);
  const item = useMemo(() => ({
    profile: "GOLD_BY_PIECE", inventoryProfile: "GOLD_BY_PIECE", description: draft.description, name: draft.description,
    goldColor: draft.goldColor || undefined, karat: num(draft.karat), grossWeight: num(draft.grossWeight), stoneWeight: num(draft.stoneWeight), condition: draft.condition,
    makingPerGram: num(draft.makingPerGram), currentMakingPerGram: num(draft.currentMakingPerGram || draft.makingPerGram),
    markupPercent: num(draft.markupPercent), maximumDiscountPercent: draft.maximumDiscountPercent === "" ? undefined : num(draft.maximumDiscountPercent),
    purchaseGoldRate: draft.purchaseGoldRate || undefined, vatRate: contract?.vat?.enabled === false ? 0 : contract?.vat?.purchaseRate,
    currentVatRate: contract?.vat?.enabled === false ? 0 : contract?.vat?.rate,
  }), [contract, draft]);

  const load = async (quiet = false) => {
    if (!isReady) return;
    if (quiet) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const [response, settingsResponse] = await Promise.all([
        apiClient<any>("/inventory-v2/gold-by-piece/contract", { locale, branchId: branchId || undefined }),
        apiClient<any>("/settings", { locale }),
      ]);
      const profileContract = response?.data || response;
      const settings = settingsResponse?.data || settingsResponse;
      setContract({ ...profileContract, taxPolicy: settings?.taxPolicy || profileContract?.taxPolicy });
    } catch (caught: any) { setError(caught?.message || "Contract unavailable"); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { void load(); }, [branchId, isReady]);
  useEffect(() => {
    if (!contract || !supplierHint) return;
    const supplier = contract.suppliers?.find((entry: any) => entry.id === supplierHint && entry.status !== "inactive");
     if (supplier) setReceive((current) => current.supplierId ? current : { ...current, supplierId: supplier.id });
  }, [contract, supplierHint]);
  useEffect(() => {
    if (!contract || !draft.description || num(draft.grossWeight) <= 0 || num(draft.stoneWeight) > num(draft.grossWeight) || !draft.makingPerGram || !draft.markupPercent) { setPreview(null); return; }
    const timer = window.setTimeout(async () => {
      setPreviewLoading(true); setError("");
      try {
        const response = await apiClient<any>("/inventory-v2/gold-by-piece/preview", { method: "POST", locale, branchId: branchId || undefined, body: JSON.stringify({ item }) });
        setPreview(response?.data || response);
      } catch (caught: any) { setPreview(null); setError(caught?.message || "Server preview unavailable"); }
      finally { setPreviewLoading(false); }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [contract, item, locale, branchId]);

  const inventoryCode = useMemo(() => contract?.barcode?.inventoryCodes?.find((entry: any) => entry.assetType === "gold-piece" && entry.isActive)?.code, [contract]);
  const resolvedItemCode = useMemo(() => draft.itemCode || contract?.barcode?.itemCodes?.find((entry: any) => entry.isActive && entry.isClientApproved !== false && (!inventoryCode || !entry.allowedInventoryCodes?.length || entry.allowedInventoryCodes.includes(inventoryCode)))?.code || "", [contract, draft.itemCode, inventoryCode]);
  const receiveItem = useMemo(() => {
    const unitCost = num(preview?.purchase?.totalPurchaseCost);
    const piece = { ...item, type: "gold-piece", category: "Gold By Piece", inventoryCode, itemCode: resolvedItemCode, locationId: receive.locationId || undefined, rfid: draft.rfid || undefined, notes: receive.notes || undefined, pricing: { markupPercent: num(draft.markupPercent), maximumDiscountPercent: draft.maximumDiscountPercent === "" ? undefined : num(draft.maximumDiscountPercent) } };
    return { ...piece, name: draft.description, description: draft.description, quantity: 1, weightPerUnit: num(draft.grossWeight), grossWeight: num(draft.grossWeight), unitCost, perPiece: [piece] };
  }, [draft.description, draft.grossWeight, draft.markupPercent, draft.maximumDiscountPercent, draft.rfid, inventoryCode, item, preview, receive.locationId, receive.notes, resolvedItemCode]);

  useEffect(() => {
    if (!contract || !preview || !receive.supplierId || !receive.locationId || !receive.purchaseDate || !receive.taxTreatment || !resolvedItemCode) { setTaxSummary(null); return; }
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

  const submit = async () => {
    if (!branchId || !receive.supplierId || !receive.locationId || !receive.taxTreatment || !preview || !taxSummary) { setError(rtl ? "المورد والموقع والمعاملة الضريبية والمعاينة مطلوبة قبل الاستلام." : "Supplier, Location, Tax Treatment, and server previews are required."); return; }
    if (receive.taxTreatment === "REVERSE_CHARGE" && !rcmVerified) { setError(rtl ? "أدلة الاحتساب العكسي مطلوبة." : "Reverse-charge evidence is required."); return; }
    setSubmitLoading(true); setError(""); setResult(null);
    try {
       if (!resolvedItemCode) throw new Error(rtl ? "كود الباركود المعتمد مطلوب." : "An approved barcode item code is required.");
       const idempotencyKey = generateUUID();
       const response = await apiClient<any>("/purchase-orders/receive", { method: "POST", locale, branchId, idempotencyKey, body: JSON.stringify({ supplierId: receive.supplierId, warehouseId: branchId, branchId, purchaseDate: receive.purchaseDate, locationId: receive.locationId, notes: receive.notes || undefined, inventoryV2: true, idempotencyKey, ...buildSharedTaxRequest(receive, contract?.taxPolicy), items: [receiveItem] }) });
      setResult(response?.data || response);
    } catch (caught: any) { setError(caught?.message || "Gold By Piece receive failed"); }
    finally { setSubmitLoading(false); }
  };

  if (loading) return <LoadingState variant="skeleton" />;
  if (error && !contract) return <ErrorState onRetry={() => void load(true)} />;
  const healthReady = contract?.gold?.health?.healthStatus === "HEALTHY" && contract?.gold?.health?.stale !== true;
  const BackIcon = rtl ? ArrowRight : ArrowLeft;

  return <div dir={rtl ? "rtl" : "ltr"} className="space-y-6 text-xs">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/inventory" className="mb-3 inline-flex items-center gap-1 font-bold text-slate-400"><BackIcon className="h-4 w-4" />{rtl ? "كل المخزون" : "All Inventory"}</Link><PageHeader title={rtl ? "إضافة ذهب بالقطعة" : "Add Gold By Piece"} description={rtl ? "نموذج واحد عبر الاستلام القانوني Supplier V2." : "One unified form through the canonical Supplier V2 receive path."} /></div><Button variant="secondary" onClick={() => void load(true)} disabled={refreshing}><RefreshCw className="h-4 w-4" />{rtl ? "تحديث" : "Refresh"}</Button></div>
     <Card className="flex flex-wrap items-center gap-3 border-brand-200 bg-brand-50/60 p-4"><Badge tone={healthReady ? "green" : "rose"}>{healthReady ? (rtl ? "Gold Center متاح" : "Gold Center ready") : (rtl ? "Gold Center غير جاهز" : "Gold Center unavailable")}</Badge><span>{contract?.gold?.provider || "—"} · AED · GLOBAL / SPOT</span><span className="ms-auto text-[10px] text-slate-500">{rtl ? "Asset واحد لكل قطعة؛ Product quantity ليس سلطة مادية." : "One Asset per piece; Product quantity is not physical authority."}</span></Card>
     <SharedReceiveSection state={receive} suppliers={contract?.suppliers || []} locations={contract?.locations || []} taxPolicy={contract?.taxPolicy} taxSummary={taxSummary} onChange={updateReceive} rcmVerified={rcmVerified} onRcmVerified={setRcmVerified} onRcmEvidenceChange={(evidence) => setReceive((current) => ({ ...current, rcmEvidence: evidence }))} />
     <Section number={1} title={rtl ? "هوية القطعة" : "Piece Identity"}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><SelectField label={rtl ? "نوع/وصف القطعة" : "Item Description / Type"} value={draft.description} onChange={(value) => update("description", value)} options={masters.descriptions.map((entry: any) => ({ value: entry.label, label: entry.label }))} required /><SelectField label={rtl ? "لون الذهب" : "Gold Color"} value={draft.goldColor} onChange={(value) => update("goldColor", value)} options={masters.colors.map((entry: any) => ({ value: entry.label, label: entry.label }))} /><SelectField label={rtl ? "العيار" : "Karat"} value={draft.karat} onChange={(value) => update("karat", value)} options={(contract?.karats || []).map((value: number) => ({ value: String(value), label: `${value}K` }))} required /><SelectField label={rtl ? "الحالة" : "Condition"} value={draft.condition} onChange={(value) => update("condition", value)} options={[{ value: "NEW", label: rtl ? "جديد" : "New" }, { value: "USED", label: rtl ? "مستعمل" : "Used" }]} required /></div></Section>
    <Section number={2} title={rtl ? "الوزن" : "Weight"}><><div className="grid gap-3 md:grid-cols-3"><Field label={rtl ? "الوزن الإجمالي (g)" : "Gross Weight (g)"} value={draft.grossWeight} onChange={(value) => update("grossWeight", value)} type="number" step="0.0001" required /><Field label={rtl ? "وزن الحجر (g)" : "Stone Weight (g)"} value={draft.stoneWeight} onChange={(value) => update("stoneWeight", value)} type="number" step="0.0001" required /><Field label={rtl ? "الوزن الصافي" : "Net Gold Weight"} value={preview?.weights?.netGoldWeight || "—"} readOnly /></div><div className="grid gap-3 md:grid-cols-2"><Field label={rtl ? "الذهب الخالص 999.9" : "Pure Gold Weight 999.9"} value={preview?.weights?.pureGoldWeight9999 || "—"} readOnly /><span className="self-end text-[10px] text-slate-500">{rtl ? "الصافي والذهب الخالص محسوبان بالخادم." : "Net and pure gold are server-derived."}</span></div></></Section>
     <Section number={3} title={rtl ? "الشراء والتكلفة" : "Purchase & Cost"}><><div className="grid gap-3 md:grid-cols-3"><Field label="Global Gold Rate / g" value={draft.purchaseGoldRate || preview?.gold?.purchaseRate || "—"} onChange={(value) => update("purchaseGoldRate", value)} type="number" step="0.00000001" readOnly={!contract?.settings?.manualOverride?.available} /><Field label={rtl ? "مصنعية الشراء / g" : "Purchase Making / g"} value={draft.makingPerGram} onChange={(value) => update("makingPerGram", value)} type="number" step="0.00000001" required /><Field label={rtl ? "مصنعية حالية / g" : "Current Making / g"} value={draft.currentMakingPerGram} onChange={(value) => update("currentMakingPerGram", value)} type="number" step="0.00000001" /></div><div className="mt-3 grid gap-3 md:grid-cols-3"><Field label={rtl ? "قيمة الذهب" : "Gold Value"} value={money(preview?.purchase?.goldValue, locale)} readOnly /><Field label={rtl ? "إجمالي المصنعية" : "Making Total"} value={money(preview?.purchase?.makingTotal, locale)} readOnly /><Field label={rtl ? "إجمالي الشراء" : "Total Purchase Cost"} value={money(preview?.purchase?.totalPurchaseCost, locale)} readOnly /></div></></Section>
    <Section number={4} title={rtl ? "السعر الحالي والبيع" : "Current Cost & Sale"}><><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><Field label={rtl ? "وضع السعر الحالي" : "Current Rate Mode"} value={contract?.currentCost?.rateMode || "GLOBAL"} readOnly /><Field label={rtl ? "قيمة الذهب الحالية" : "Current Gold Value"} value={money(preview?.current?.goldValue, locale)} readOnly /><Field label={rtl ? "الإجمالي الحالي" : "Current Total Cost"} value={money(preview?.current?.totalValue, locale)} readOnly /><Field label={rtl ? "نسبة الزيادة %" : "Markup %"} value={draft.markupPercent} onChange={(value) => update("markupPercent", value)} type="number" step="0.000001" required /><Field label={rtl ? "الخصم الأقصى %" : "Maximum Discount %"} value={draft.maximumDiscountPercent} onChange={(value) => update("maximumDiscountPercent", value)} type="number" step="0.000001" /></div>{preview?.sale && <div className="mt-3 grid gap-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4 md:grid-cols-4"><Field label={rtl ? "قيمة الزيادة" : "Markup Value"} value={money(preview.sale.markupValue, locale)} readOnly /><Field label={rtl ? "سعر البيع" : "Total Selling Price"} value={money(preview.sale.totalSellingPrice, locale)} readOnly /><Field label={rtl ? "الحد الأدنى" : "Minimum Selling Price"} value={money(preview.sale.minAllowedSellingPrice, locale)} readOnly /><Field label={rtl ? "حالة Retail" : "Retail Status"} value={contract?.currentCost?.retailStatus || "NOT_CONFIGURED_FAIL_CLOSED"} readOnly /></div>}</></Section>
     <Section number={5} title={rtl ? "الهوية التشغيلية" : "Operational Identity"}><><div className="grid gap-3 md:grid-cols-3"><SelectField label={rtl ? "كود الباركود" : "Barcode Item Code"} value={draft.itemCode} onChange={(value) => update("itemCode", value)} options={(contract?.barcode?.itemCodes || []).filter((entry: any) => entry.isActive && entry.isClientApproved !== false).map((entry: any) => ({ value: entry.code, label: `${entry.code} — ${entry.displayName}` }))} required /><Field label="RFID" value={draft.rfid} onChange={(value) => update("rfid", value)} /><Field label={rtl ? "الفرع" : "Branch"} value={branchId || "—"} readOnly /></div></></Section>
    {error && <Card className="border-rose-300 bg-rose-50 p-4 text-rose-900"><CircleAlert className="me-2 inline h-4 w-4" />{error}</Card>}
    {result && <Card className="border-emerald-300 bg-emerald-50 p-4 text-emerald-900"><CheckCircle2 className="me-2 inline h-4 w-4" />{rtl ? "تم الاستلام عبر Supplier V2." : "Received through Supplier V2."} <Link className="ms-2 font-bold underline" href={`/inventory/${encodeURIComponent(result.assets?.[0]?.id || "")}`}>{rtl ? "فتح الأصل" : "Open Asset"}</Link></Card>}
    <p className="text-[10px] text-slate-500"><LockKeyhole className="me-1 inline h-3 w-3" />{rtl ? "Retail غير مهيأ؛ لا يتم اختراع Premium أو fallback." : "Retail is not configured; no premium or silent fallback is used."}</p>
     <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => { setDraft(initialDraft); setReceive(initialReceiveState); setTaxSummary(null); setRcmVerified(false); }}>{rtl ? "مسح" : "Clear"}</Button><Button onClick={() => void submit()} disabled={submitLoading || previewLoading || !healthReady || !preview || !taxSummary || !receive.supplierId || !receive.locationId || !receive.taxTreatment || !draft.description || !resolvedItemCode || (receive.taxTreatment === "REVERSE_CHARGE" && !rcmVerified)}><Coins className="h-4 w-4" />{submitLoading ? (rtl ? "جارٍ الاستلام…" : "Receiving…") : (rtl ? "استلام أصل واحد" : "Receive one Asset")}</Button></div>
  </div>;
}
