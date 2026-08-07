"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Barcode, Building2, FileText, Gem, GitBranch, History, MapPin, RadioTower, Scale, ShieldCheck } from "lucide-react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useBranchContext } from "@/contexts/branch-context";
import { usePermissions } from "@/hooks/use-permissions";
import { Link } from "@/i18n/navigation";
import { apiClient, generateUUID } from "@/lib/api/client";
import { useInventoryV2Detail } from "@/features/inventory/hooks/use-inventory-v2";

const PROFILE_LABELS: Record<string, string> = {
  GOLD_BY_WEIGHT_JEWELLERY: "ذهب بالوزن – مجوهرات", GOLD_BAR_24K: "سبيكة 24K", GOLD_BY_PIECE: "ذهب بالقطعة",
  DIAMOND_JEWELLERY: "مجوهرات ألماس", LOOSE_DIAMOND: "ألماس منفرد", GEMSTONE_JEWELLERY: "مجوهرات أحجار كريمة",
  LOOSE_GEMSTONE: "حجر كريم منفرد", PEARL_JEWELLERY: "مجوهرات لؤلؤ", LOOSE_PEARL: "لؤلؤ منفرد", CGP_CUSTOMER_GOLD_PURCHASE: "شراء ذهب عميل (CGP)",
};
const STATUS_LABELS: Record<string, string> = { AVAILABLE: "متاحة", RESERVED: "محجوزة", SOLD: "مباعة", PENDING_TRANSFER: "بانتظار النقل", WORKSHOP: "في الورشة", RETURNED: "مرتجعة", MISSING: "مفقودة", MELTED: "مصهورة" };
const STATUS_TONES: Record<string, "green" | "amber" | "blue" | "rose" | "violet" | "slate"> = { AVAILABLE: "green", RESERVED: "amber", SOLD: "slate", PENDING_TRANSFER: "violet", WORKSHOP: "blue", RETURNED: "amber", MISSING: "rose", MELTED: "rose" };

const text = (value: unknown) => value === null || value === undefined || value === "" ? "—" : String(value);
const dateTime = (value: unknown, locale: string) => value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(value))) : "—";
function Field({ label, value }: { label: string; value: unknown }) { return <div className="rounded-xl bg-slate-50 p-3 dark:bg-navy-950"><p className="text-[10px] text-slate-400">{label}</p><p className="mt-1 break-words text-xs font-bold text-navy-900 dark:text-slate-100">{text(value)}</p></div>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <Card className="p-5"><h2 className="mb-4 text-sm font-black text-navy-950 dark:text-white">{title}</h2>{children}</Card>; }

export default function AssetDetailsPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const params = useParams<{ id: string }>();
  const assetId = decodeURIComponent(params.id);
  const { branchId } = useBranchContext();
  const { hasPermission } = usePermissions();
  const detail = useInventoryV2Detail(assetId);
  const [outcome, setOutcome] = useState("GOOD");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const data = detail.data;
  const asset = data?.asset;
  const canApproveRestock = hasPermission("inventory.returns.approve_restock");
  const latestReview = data?.returnReviews?.[0] || null;
  const profile = asset?.inventoryProfile || "";
  const BackIcon = rtl ? ArrowRight : ArrowLeft;
  const timeline = useMemo(() => data?.timeline || [], [data?.timeline]);

  const recordReview = async () => {
    setBusy(true); setActionError("");
    try {
      await apiClient(`/inventory-v2/assets/${encodeURIComponent(assetId)}/return-review`, { method: "POST", body: JSON.stringify({ branchId, conditionOutcome: outcome, note }), idempotencyKey: generateUUID(), locale, branchId: branchId || undefined });
      await detail.refetch();
    } catch (error: any) { setActionError(error?.message || (rtl ? "تعذر تسجيل المراجعة." : "Could not record review.")); }
    finally { setBusy(false); }
  };
  const approveRestock = async () => {
    setBusy(true); setActionError("");
    try {
      await apiClient(`/inventory-v2/assets/${encodeURIComponent(assetId)}/return-review/approve-restock`, { method: "POST", body: JSON.stringify({ branchId }), idempotencyKey: generateUUID(), locale, branchId: branchId || undefined });
      await detail.refetch();
    } catch (error: any) { setActionError(error?.message || (rtl ? "تعذر اعتماد الإرجاع للمخزون." : "Could not approve restock.")); }
    finally { setBusy(false); }
  };

  if (detail.isLoading) return <LoadingState variant="skeleton" />;
  if (detail.error || !asset || !data) return <ErrorState onRetry={() => detail.refetch()} />;
  const gross = data.goldDetails?.gross_weight ?? data.goldDetails?.grossWeight ?? asset.grossWeight;
  const stone = data.goldDetails?.stone_weight ?? data.goldDetails?.stoneWeight;
  const net = data.goldDetails?.net_gold_weight ?? data.goldDetails?.netGoldWeight ?? asset.netWeight;
  const pure = data.goldDetails?.pure_gold_9999 ?? data.goldDetails?.pureGold9999;
  const purchase = data.currentPurchaseCost;
  const valuation = data.currentValuation;
  const rfid = data.rfidAssignments?.find((item) => item.is_current ?? item.isCurrent) || data.rfidAssignments?.[0];

  return <div className="space-y-6 text-xs">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><Link href="/inventory" className="mb-3 inline-flex items-center gap-1 font-bold text-slate-400 hover:text-brand-700"><BackIcon className="h-4 w-4" />{rtl ? "كل القطع" : "All Items"}</Link><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black text-navy-950 dark:text-white">{asset.description || asset.name}</h1><Badge tone={STATUS_TONES[asset.operationalStatus] || "slate"}>{rtl ? (STATUS_LABELS[asset.operationalStatus] || asset.operationalStatus) : asset.operationalStatus}</Badge></div><p className="mt-2 font-mono text-[11px] text-slate-400">{asset.id} · {asset.barcode}</p></div><Badge tone="violet">{PROFILE_LABELS[profile] || profile}</Badge></div>

    <Section title={rtl ? "حالة المخزون" : "Stock Status"}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label={rtl ? "الحالة التشغيلية" : "Operational status"} value={asset.operationalStatus} /><Field label={rtl ? "الفرع" : "Branch"} value={asset.branch || asset.branchId} /><Field label={rtl ? "الموقع" : "Location"} value={asset.location || asset.locationId} /><Field label={rtl ? "تاريخ الحالة/آخر حدث" : "Status date / latest event"} value={dateTime(timeline[0]?.occurredAt, locale)} /></div><p className="mt-3 text-[10px] text-slate-500">{rtl ? "الحالة للعرض فقط؛ تغييرها لا يتم من حقول الإدخال، بل من المسار القانوني للحركة." : "Status is read-only here; canonical business actions, not intake fields, change it."}</p></Section>

    {asset.operationalStatus === "RETURNED" && <Section title={rtl ? "مراجعة القطعة المرتجعة" : "Returned Asset Review"}>{canApproveRestock ? <div className="space-y-3"><p className="text-slate-600 dark:text-slate-300">{rtl ? "لا تعود القطعة متاحة تلقائيًا. يلزم توثيق نتيجة المراجعة ثم اعتمادها بصلاحية مستقلة." : "This Asset never returns to Available automatically. Record the review and then approve through the permission-gated canonical action."}</p>{!latestReview ? <div className="flex flex-col gap-2 sm:flex-row"><select className="input-base" value={outcome} onChange={(event) => setOutcome(event.target.value)} disabled={busy}><option value="GOOD">Good</option><option value="NEEDS_INSPECTION">Needs Inspection</option><option value="DAMAGED">Damaged</option><option value="BROKEN">Broken</option><option value="NEEDS_REPAIR">Needs Repair</option></select><input className="input-base flex-1" value={note} onChange={(event) => setNote(event.target.value)} placeholder={rtl ? "ملاحظة المراجعة" : "Review note"} disabled={busy} /><Button onClick={() => void recordReview()} disabled={busy}>{rtl ? "تسجيل المراجعة" : "Record review"}</Button></div> : <div className="flex flex-wrap items-center gap-3"><Badge tone={latestReview.conditionOutcome === "GOOD" ? "green" : "amber"}>{latestReview.conditionOutcome}</Badge><span>{rtl ? "تم تسجيل المراجعة" : "Review recorded"}</span>{latestReview.conditionOutcome === "GOOD" && !latestReview.approvedAt ? <Button onClick={() => void approveRestock()} disabled={busy}>{rtl ? "اعتماد العودة إلى المتاح" : "Approve restock"}</Button> : <span className="text-slate-500">{latestReview.approvedAt ? (rtl ? "تم الاعتماد" : "Approved") : (rtl ? "تبقى القطعة غير متاحة" : "Asset remains non-available")}</span>}</div>}{actionError && <p className="text-rose-600">{actionError}</p>}</div> : <p className="text-slate-500">{rtl ? "المراجعة والاعتماد غير متاحين لك؛ المنع من الخادم وليس من الواجهة فقط." : "You are not authorized to review or restock; the server enforces this permission."}</p>}</Section>}

    <div className="grid gap-5 xl:grid-cols-2"><div className="space-y-5"><Section title={rtl ? "بيانات تعريف القطعة" : "Item Identification"}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label={rtl ? "الوصف" : "Description"} value={asset.description || asset.name} /><Field label={rtl ? "الماركة" : "Brand"} value={asset.brand} /><Field label={rtl ? "الموديل" : "Model"} value={asset.model} /><Field label={rtl ? "رقم الموديل" : "Model number"} value={asset.modelNumber} /><Field label={rtl ? "تاريخ الشراء" : "Purchase date"} value={asset.purchaseDate} /><Field label={rtl ? "الحالة/Condition" : "Condition"} value={asset.condition} /></div></Section>
      <Section title={rtl ? "هوية القطعة والتتبع" : "Identity and Traceability"}><div className="grid gap-3 sm:grid-cols-2"><Field label="Barcode" value={asset.barcode} /><Field label="RFID" value={rfid?.rfid_number || rfid?.rfidNumber || "—"} /><Field label={rtl ? "حالة التاج" : "Tag state"} value={asset.tagState} /><Field label={rtl ? "مصدر الاستلام" : "Receipt origin"} value={data.origin?.origin_type || data.origin?.originType} /></div></Section>
      {Boolean(data.goldDetails || asset.grossWeight) && <Section title={rtl ? "الأوزان والذهب" : "Weights and Gold"}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label={rtl ? "الوزن الإجمالي" : "Gross weight"} value={gross === "—" ? gross : `${gross} g`} /><Field label={rtl ? "وزن الأحجار" : "Stone weight"} value={stone == null ? "—" : `${stone} g`} /><Field label={rtl ? "وزن الذهب الصافي" : "Net gold weight"} value={net == null ? "—" : `${net} g`} /><Field label={rtl ? "العيار" : "Karat"} value={data.goldDetails?.karat ?? asset.karat} /><Field label={rtl ? "الذهب الخالص 999.9" : "Pure gold 999.9"} value={pure == null ? "—" : `${pure} g`} /></div></Section>}
      {data.looseDetails && <Section title={rtl ? "تفاصيل القطعة المنفردة" : "Loose Profile Details"}><div className="grid gap-3 sm:grid-cols-2"><Field label={rtl ? "الاسم/النوع" : "Name/type"} value={data.looseDetails.stoneName || data.looseDetails.pearlType} /><Field label={rtl ? "القياس" : "Measurement"} value={data.looseDetails.measurement?.commercialDisplayValue ? `${data.looseDetails.measurement.commercialDisplayValue} ${data.looseDetails.measurement.unit}` : "—"} /><Field label={rtl ? "اللون" : "Color"} value={data.looseDetails.color} /><Field label={rtl ? "الشكل" : "Shape"} value={data.looseDetails.shape} /></div>{data.looseDetails.masterDataReferences?.length ? <ul className="mt-3 list-disc space-y-1 ps-5 text-slate-600">{data.looseDetails.masterDataReferences.map((ref: any) => <li key={`${ref.category}-${ref.masterDataId}`}>{ref.category}: {ref.label || ref.value}</li>)}</ul> : null}</Section>}
      {data.components?.length ? <Section title={rtl ? "المكونات المضمنة" : "Embedded Components"}><div className="space-y-2">{data.components.map((component: any) => <div key={component.id} className="rounded-xl border border-border p-3"><p className="font-bold">{component.componentType || component.component_type || component.role}</p><p className="mt-1 text-slate-500">{rtl ? "العدد الوصفي" : "Descriptive count"}: {component.componentCount || component.component_count || "—"}</p></div>)}</div><p className="mt-3 text-[10px] text-slate-500">{rtl ? "عدد المكوّنات وصفي داخل أصل واحد وليس سلطة كمية للمخزون." : "Component count is descriptive within one Asset, never a physical inventory quantity."}</p></Section> : null}</div>
      <div className="space-y-5"><Section title={rtl ? "قيمة الشراء التاريخية" : "Frozen Purchase Snapshot"}><div className="grid gap-3 sm:grid-cols-2"><Field label={rtl ? "سعر الذهب وقت الشراء" : "Purchase gold rate"} value={purchase?.purchase_gold_rate ?? purchase?.purchaseGoldRate} /><Field label={rtl ? "قيمة الذهب" : "Gold value"} value={purchase?.gold_value ?? purchase?.goldValue} /><Field label={rtl ? "تكلفة المصنعية" : "Making total"} value={purchase?.making_total ?? purchase?.makingTotal} /><Field label={rtl ? "تكلفة الشهادة" : "Certificate cost"} value={purchase?.certificate_cost ?? purchase?.certificateCost} /><Field label="VAT" value={purchase?.vat_amount ?? purchase?.vatAmount} /><Field label={rtl ? "إجمالي الشراء" : "Total purchase cost"} value={purchase?.total_purchase_cost ?? purchase?.totalPurchaseCost} /></div></Section>
      <Section title={rtl ? "التقييم الحالي المنفصل" : "Separate Current Valuation"}><div className="grid gap-3 sm:grid-cols-2"><Field label={rtl ? "سعر الذهب الحالي" : "Current gold rate"} value={valuation?.gold_rate ?? valuation?.goldRate} /><Field label={rtl ? "قيمة الذهب الحالية" : "Current gold value"} value={valuation?.gold_value ?? valuation?.goldValue} /><Field label={rtl ? "قيمة الشهادة الحالية" : "Current certificate value"} value={valuation?.certificate_value ?? valuation?.certificateValue} /><Field label="VAT" value={valuation?.vat_amount ?? valuation?.vatAmount} /><Field label={rtl ? "إجمالي التقييم الحالي" : "Current total"} value={valuation?.total_value ?? valuation?.totalValue} /></div><p className="mt-3 text-[10px] text-slate-500">{rtl ? "لا يكتب هذا القسم فوق لقطة تكلفة الشراء التاريخية." : "This section never overwrites the historical purchase snapshot."}</p></Section>
      <Section title={rtl ? "الشهادات والمرفقات" : "Certificates and Attachments"}><div className="space-y-3">{data.certificates.length ? data.certificates.map((certificate: any) => <div key={certificate.id} className="rounded-xl border border-border p-3"><p className="font-bold">{certificate.issuer || certificate.type}</p><p className="font-mono text-slate-500">{certificate.certificateNumber}</p></div>) : <p className="text-slate-500">{rtl ? "لا توجد شهادات" : "No certificates"}</p>}{data.attachments.length ? data.attachments.map((attachment: any) => <a key={attachment.id} className="block rounded-xl border border-border p-3 text-brand-700 hover:underline" href={attachment.url || "#"} target={attachment.url ? "_blank" : undefined} rel="noreferrer">{attachment.name || attachment.type}</a>) : <p className="text-slate-500">{rtl ? "لا توجد مرفقات" : "No attachments"}</p>}</div></Section></div></div>

    <Section title={rtl ? "سجل القطعة الموحد" : "Unified Item History"}><p className="mb-4 text-[10px] text-slate-500">{rtl ? "سجل الأحداث غير قابل للحذف هو السلطة الزمنية؛ وتعرض تحته حركات الأصل المربوطة كأدلة مادية." : "Immutable AssetEvents are the chronological authority; linked movement records are shown as physical evidence."}</p><div className="space-y-3">{timeline.length ? timeline.map((entry: any) => <div key={`${entry.kind}-${entry.id}`} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge tone={entry.kind === "EVENT" ? "violet" : "blue"}>{entry.kind === "EVENT" ? (rtl ? "حدث" : "Event") : (rtl ? "حركة" : "Movement")}</Badge><p className="font-bold">{entry.eventType}</p></div><span className="text-[10px] text-slate-400">{dateTime(entry.occurredAt, locale)}</span></div>{entry.note && <p className="mt-2 text-slate-600 dark:text-slate-300">{entry.note}</p>}<div className="mt-2 grid gap-1 text-[10px] text-slate-500 sm:grid-cols-3"><span>{rtl ? "المصدر" : "Source"}: {text(entry.sourceType)} / {text(entry.sourceId)}</span>{entry.actor && <span>{rtl ? "المستخدم" : "Actor"}: {entry.actor}</span>}{entry.oldStatus || entry.newStatus ? <span>{text(entry.oldStatus)} → {text(entry.newStatus)}</span> : null}</div></div>) : <p className="text-slate-500">{rtl ? "لا توجد أحداث بعد." : "No history events yet."}</p>}</div>{data.returnReviews.length ? <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900 dark:bg-amber-950/20"><p className="font-black">{rtl ? "أدلة مراجعة المرتجع R38" : "R38 returned-review evidence"}</p>{data.returnReviews.map((review: any) => <p key={review.id} className="mt-2 text-slate-600 dark:text-slate-300">{review.conditionOutcome} · {dateTime(review.reviewedAt, locale)} · {review.approvedAt ? (rtl ? "تم اعتماد العودة للمتاح" : "Restock approved") : (rtl ? "لم يُعتمد" : "Not approved")}</p>)}</div> : null}</Section>

    <Section title={rtl ? "الروابط والسجل النظامي" : "Relations and System Audit"}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label={rtl ? "الوثائق المرتبطة" : "Document links"} value={data.documentLinks.map((link) => `${link.type}: ${link.id}`).join(" · ")} /><Field label={rtl ? "أنشئ في" : "Created at"} value={dateTime(asset.createdAt, locale)} /><Field label={rtl ? "التحركات القانونية القادمة" : "Legal next transitions"} value={data.legalActions.join(", ")} /></div></Section>
  </div>;
}
