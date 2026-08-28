"use client";

import { useEffect, useMemo, useState } from "react";
import { Barcode, ChevronLeft, ChevronRight, Filter, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { InventoryIntakeChooser } from "@/components/inventory/inventory-intake-chooser";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";
import { useBranchContext } from "@/contexts/branch-context";
import { usePermissions } from "@/hooks/use-permissions";
import { useInventoryV2List } from "@/features/inventory/hooks/use-inventory-v2";
import { useSearchParams } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "متاحة", RESERVED: "محجوزة", SOLD: "مباعة", PENDING_TRANSFER: "بانتظار النقل",
  WORKSHOP: "في الورشة", RETURNED: "مرتجعة", MISSING: "مفقودة", MELTED: "مصهورة",
};
const STATUS_LABELS_EN: Record<string, string> = {
  AVAILABLE: "Available", RESERVED: "Reserved", SOLD: "Sold", PENDING_TRANSFER: "Pending transfer",
  WORKSHOP: "In workshop", RETURNED: "Returned", MISSING: "Missing", MELTED: "Melted",
};
const STATUS_TONES: Record<string, "green" | "amber" | "blue" | "rose" | "violet" | "slate"> = {
  AVAILABLE: "green", RESERVED: "amber", SOLD: "slate", PENDING_TRANSFER: "violet",
  WORKSHOP: "blue", RETURNED: "amber", MISSING: "rose", MELTED: "rose",
};
const PROFILE_LABELS: Record<string, { ar: string; en: string }> = {
  GOLD_BY_WEIGHT_JEWELLERY: { ar: "ذهب بالوزن – مجوهرات", en: "Gold By Weight Jewellery" }, GOLD_BAR_24K: { ar: "سبيكة 24K", en: "24K Gold Bar" }, GOLD_BY_PIECE: { ar: "ذهب بالقطعة", en: "Gold By Piece" },
  DIAMOND_JEWELLERY: { ar: "مجوهرات ألماس", en: "Diamond Jewellery" }, LOOSE_DIAMOND: { ar: "ألماس منفرد", en: "Loose Diamond" }, GEMSTONE_JEWELLERY: { ar: "مجوهرات أحجار كريمة", en: "Gemstone Jewellery" },
  LOOSE_GEMSTONE: { ar: "حجر كريم منفرد", en: "Loose Gemstone" }, PEARL_JEWELLERY: { ar: "مجوهرات لؤلؤ", en: "Pearl Jewellery" }, LOOSE_PEARL: { ar: "لؤلؤ منفرد", en: "Loose Pearl" }, CGP_CUSTOMER_GOLD_PURCHASE: { ar: "شراء ذهب عميل (CGP)", en: "Customer Gold Purchase (CGP)" },
};
const statusLabel = (key: string, rtl: boolean) => (rtl ? STATUS_LABELS[key] : STATUS_LABELS_EN[key]) || key;

export default function InventoryPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { branchId } = useBranchContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [profile, setProfile] = useState("all");
  const [status, setStatus] = useState("all");
  const [condition, setCondition] = useState("all");
  const [tagState, setTagState] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const list = useInventoryV2List({ search, profile, status, condition, tagState, page, pageSize, sort: "createdAt", direction: "DESC" });
  const [profiles, setProfiles] = useState<string[]>(Object.keys(PROFILE_LABELS));
  const supplierHint = searchParams.get("supplierId") || undefined;

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => { setPage(1); }, [search, profile, status, condition, tagState, pageSize]);
  useEffect(() => {
    if (!branchId) return;
    apiClient<any>("/inventory-v2/profiles", { locale, branchId }).then((response) => {
      const items = response?.data?.profiles ?? response?.profiles ?? [];
      if (Array.isArray(items) && items.length) setProfiles(items.map((item) => item.key));
    }).catch(() => undefined);
  }, [branchId, locale]);
  useEffect(() => {
    setIntakeOpen(searchParams.get("openIntake") === "1");
  }, [searchParams]);

  const total = list.data?.total || 0;
  const totalPages = list.data?.totalPages || 1;
  const range = useMemo(() => total ? `${(page - 1) * pageSize + 1}–${Math.min(total, page * pageSize)} / ${total}` : "0", [page, pageSize, total]);
  const clearFilters = () => { setSearchInput(""); setSearch(""); setProfile("all"); setStatus("all"); setCondition("all"); setTagState("all"); };
  const closeIntake = () => {
    setIntakeOpen(false);
    if (searchParams.get("openIntake") === "1") router.replace("/inventory");
  };

  return <div className="space-y-5 text-sm">
    <PageHeader
      title={rtl ? "كل القطع" : "All Items"}
      description={rtl ? "قائمة قانونية موحّدة: كل صف يمثل أصلًا ماديًا واحدًا فقط." : "Canonical list: every row is exactly one physical Asset."}
      actions={hasPermission("inventory.view") && <Button onClick={() => setIntakeOpen(true)} data-inventory-intake-action><Plus className="h-4 w-4" />{rtl ? "إضافة / استلام مخزون" : "Add / Receive Inventory"}</Button>}
    />
    {hasPermission("inventory.view") && <div className="flex justify-end"><Link href="/inventory/locations" className="text-xs font-semibold text-brand-700 underline-offset-4 hover:underline">{rtl ? "إدارة مواقع المخزون" : "Manage inventory locations"}</Link></div>}
    <div className="grid gap-3 sm:grid-cols-2" aria-label={rtl ? "ملخص المخزون" : "Inventory summary"}>
      <div className="rounded-2xl border border-border bg-panel px-4 py-3"><p className="text-[11px] font-semibold text-muted-foreground">{rtl ? "الأصول المادية المسجلة" : "Serialized Assets"}</p><p className="mt-1 text-xl font-black tabular-nums text-foreground" dir="ltr">{total}</p></div>
      <div className="rounded-2xl border border-border bg-panel px-4 py-3"><p className="text-[11px] font-semibold text-muted-foreground">{rtl ? "النطاق المعروض" : "Displayed range"}</p><p className="mt-1 text-xl font-black tabular-nums text-foreground" dir="ltr">{range}</p></div>
    </div>
    <InventoryIntakeChooser open={intakeOpen} onClose={closeIntake} supplierId={supplierHint} />
    <Card className="space-y-4 p-5">
      <div className="flex flex-col gap-3 lg:flex-row">
        <label className="relative flex-1"><span className="sr-only">{rtl ? "البحث في الأصول" : "Search inventory assets"}</span><Search className="absolute start-3 top-3 h-4 w-4 text-slate-400" /><input className="input-base ps-9" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={rtl ? "بحث: باركود، RFID، رقم الأصل، الوصف، المورد، الشهادة…" : "Search barcode, RFID, Asset number, description, supplier, certificate…"} /></label>
        <Button variant="secondary" onClick={clearFilters}><SlidersHorizontal className="h-4 w-4" />{rtl ? "مسح الفلاتر" : "Clear filters"}</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label><span className="mb-1 block text-slate-500">{rtl ? "الملف" : "Profile"}</span><select className="input-base" value={profile} onChange={(event) => setProfile(event.target.value)}><option value="all">{rtl ? "كل الملفات" : "All profiles"}</option>{profiles.map((key) => <option key={key} value={key}>{PROFILE_LABELS[key]?.[rtl ? "ar" : "en"] || key}</option>)}</select></label>
        <label><span className="mb-1 block text-slate-500">{rtl ? "الحالة التشغيلية" : "Operational status"}</span><select className="input-base" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{rtl ? "كل الحالات" : "All statuses"}</option>{Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{rtl ? label : STATUS_LABELS_EN[key]}</option>)}</select></label>
        <label><span className="mb-1 block text-slate-500">{rtl ? "الحالة/Condition" : "Condition"}</span><select className="input-base" value={condition} onChange={(event) => setCondition(event.target.value)}><option value="all">{rtl ? "الكل" : "All"}</option><option value="NEW">{rtl ? "جديد" : "New"}</option><option value="USED">{rtl ? "مستعمل" : "Used"}</option></select></label>
        <label><span className="mb-1 block text-slate-500">{rtl ? "حالة التاج" : "Tag state"}</span><select className="input-base" value={tagState} onChange={(event) => setTagState(event.target.value)}><option value="all">{rtl ? "الكل" : "All"}</option><option value="PENDING">{rtl ? "قيد الانتظار" : "Pending"}</option><option value="PRINTED">{rtl ? "مطبوع" : "Printed"}</option></select></label>
      </div>
      <p className="flex items-center gap-2 text-[11px] text-slate-500"><Filter className="h-3.5 w-3.5" />{rtl ? "البحث والفلاتر والترقيم تنفّذ في خادم الأصول داخل الفرع المصرح به." : "Search, filters, and pagination are executed by the authorized Branch Asset API."}</p>
    </Card>
    {list.isLoading ? <LoadingState variant="skeleton" /> : list.error ? <ErrorState onRetry={() => list.refetch()} /> : !list.data?.items.length ? <EmptyState title={rtl ? "لا توجد قطع مطابقة" : "No matching Assets"} description={rtl ? "لا تعتمد هذه القائمة على كمية المنتج أو صفوف منتجات مجمعة." : "This list never falls back to Product quantity or grouped Product rows."} /> : <Card className="overflow-hidden">
      <div className="overflow-x-auto"><table className="min-w-[980px] w-full text-start text-[13px]"><caption className="sr-only">{rtl ? "قائمة الأصول المادية المسجلة" : "Serialized inventory Asset list"}</caption><thead className="sticky top-0 z-[1] bg-slate-50/95 text-[11px] text-slate-500 backdrop-blur dark:bg-navy-950/95"><tr><th scope="col" className="px-4 py-3 text-start">{rtl ? "القطعة" : "Asset"}</th><th scope="col" className="px-4 py-3 text-start">{rtl ? "الملف" : "Profile"}</th><th scope="col" className="px-4 py-3 text-start">{rtl ? "الهوية" : "Identity"}</th><th scope="col" className="px-4 py-3 text-end">{rtl ? "الوزن" : "Weight"}</th><th scope="col" className="px-4 py-3 text-start">{rtl ? "الفرع / الموقع" : "Branch / location"}</th><th scope="col" className="px-4 py-3 text-start">{rtl ? "المورد" : "Supplier"}</th><th scope="col" className="px-4 py-3 text-start">{rtl ? "الحالة" : "Status"}</th></tr></thead><tbody>{list.data.items.map((asset) => <tr key={asset.id} className="border-t border-border align-middle hover:bg-slate-50/70 dark:hover:bg-navy-950/30"><td className="px-4 py-3.5 text-start"><Link href={`/inventory/${encodeURIComponent(asset.id)}`} className="font-bold text-brand-700 underline-offset-4 hover:underline">{asset.description || asset.name}</Link><p className="mt-1 font-mono text-[10px] text-slate-400" dir="ltr">{asset.id}</p></td><td className="px-4 py-3.5 text-start">{PROFILE_LABELS[asset.inventoryProfile]?.[rtl ? "ar" : "en"] || asset.inventoryProfile}</td><td className="px-4 py-3.5 text-start"><p className="font-mono tabular-nums" dir="ltr">{asset.barcode}</p><p className="mt-1 text-[10px] text-slate-400" dir="ltr">RFID: {asset.rfid || "—"}</p></td><td className="px-4 py-3.5 text-end tabular-nums" dir="ltr">{asset.grossWeight ?? "—"} g{asset.netWeight != null && <p className="mt-1 text-[10px] text-slate-400">{rtl ? "صافي" : "Net"}: {asset.netWeight} g</p>}</td><td className="px-4 py-3.5 text-start">{asset.branchName || asset.branchId}<p className="mt-1 text-[10px] text-slate-400">{asset.location || "—"}</p></td><td className="px-4 py-3.5 text-start">{asset.supplierName || "—"}</td><td className="px-4 py-3.5 text-start"><Badge tone={STATUS_TONES[asset.operationalStatus] || "slate"}>{statusLabel(asset.operationalStatus, rtl)}</Badge></td></tr>)}</tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4"><span className="text-slate-500">{range}</span><div className="flex items-center gap-2"><select className="input-base h-8 w-auto" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>{[10,25,50,100].map((size) => <option key={size} value={size}>{size}</option>)}</select><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>{rtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</Button><span>{page} / {totalPages}</span><Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>{rtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</Button></div></div>
    </Card>}
    <p className="flex items-center gap-2 text-[10px] text-slate-400"><Barcode className="h-3.5 w-3.5" />{rtl ? "الباركود هو الهوية الرئيسية الدائمة؛ RFID اختياري وتظهر علاقته الحالية فقط." : "Barcode is the permanent primary identity; RFID is optional and shown from its current normalized relationship."}</p>
  </div>;
}
