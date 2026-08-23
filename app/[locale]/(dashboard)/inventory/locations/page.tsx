"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Edit3, MapPin, Plus, Power, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { apiClient, DarfusApiError } from "@/lib/api/client";
import { useBranchContext } from "@/contexts/branch-context";
import { usePermissions } from "@/hooks/use-permissions";

type Location = { id: string; code: string; name: string; locationType: string; isActive: boolean };
type LocationResponse = { success: boolean; data: { items: Location[]; includeDisabled: boolean; branchId: string } };

export default function InventoryLocationsPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { branchId } = useBranchContext();
  const { hasPermission } = usePermissions();
  const [items, setItems] = useState<Location[]>([]);
  const [includeDisabled, setIncludeDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [locationType, setLocationType] = useState("GENERAL");
  const [message, setMessage] = useState<string | null>(null);

  const load = async (showDisabled = includeDisabled) => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient<LocationResponse>(`/inventory/locations${showDisabled ? "?includeDisabled=true" : ""}`, { locale, branchId });
      setItems(response.data.items || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (rtl ? "تعذر تحميل المواقع." : "Unable to load locations."));
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [branchId, includeDisabled]);

  const resetForm = () => { setEditingId(null); setName(""); setCode(""); setLocationType("GENERAL"); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!branchId) return;
    setMessage(null);
    try {
      const path = editingId ? `/inventory/locations/${encodeURIComponent(editingId)}` : "/inventory/locations";
      await apiClient(path, { method: editingId ? "PATCH" : "POST", body: JSON.stringify({ name, code, locationType }), locale, branchId });
      setMessage(rtl ? "تم حفظ الموقع." : "Location saved.");
      resetForm();
      await load(includeDisabled);
    } catch (cause) {
      setMessage(cause instanceof DarfusApiError ? cause.message : (rtl ? "تعذر حفظ الموقع." : "Unable to save location."));
    }
  };

  const disable = async (id: string) => {
    if (!branchId) return;
    setMessage(null);
    try {
      await apiClient(`/inventory/locations/${encodeURIComponent(id)}/disable`, { method: "POST", body: JSON.stringify({}), locale, branchId });
      setMessage(rtl ? "تم تعطيل الموقع." : "Location disabled.");
      await load(includeDisabled);
    } catch (cause) {
      setMessage(cause instanceof DarfusApiError ? cause.message : (rtl ? "تعذر تعطيل الموقع." : "Unable to disable location."));
    }
  };

  if (!hasPermission("inventory.view")) return <ErrorState message={rtl ? "لا تملك صلاحية عرض المواقع." : "You do not have permission to view locations."} />;

  return <div className="space-y-6 text-xs">
    <PageHeader title={rtl ? "مواقع المخزون" : "Inventory Locations"} description={rtl ? "مواقع DB-backed ضمن الفرع الحالي؛ لا توجد قيمة افتراضية تشغيلية." : "DB-backed locations scoped to the current branch; no operational default is created."} actions={<Link href="/inventory" className="text-brand-700 hover:underline">{rtl ? "العودة للمخزون" : "Back to inventory"}</Link>} />
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4" />{rtl ? "إضافة أو تعديل موقع" : "Add or edit a location"}</div><Button size="sm" variant="secondary" onClick={() => void load(includeDisabled)}><RefreshCw className="h-4 w-4" />{rtl ? "تحديث" : "Refresh"}</Button></div>
      {hasPermission("inventory.adjust") && <form onSubmit={submit} className="grid gap-3 md:grid-cols-4"><label><span className="mb-1 block text-slate-500">{rtl ? "الاسم" : "Name"}</span><input className="input-base" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label><label><span className="mb-1 block text-slate-500">{rtl ? "الكود" : "Code"}</span><input className="input-base" required maxLength={32} value={code} onChange={(event) => setCode(event.target.value)} /></label><label><span className="mb-1 block text-slate-500">{rtl ? "النوع" : "Type"}</span><input className="input-base" maxLength={24} value={locationType} onChange={(event) => setLocationType(event.target.value)} /></label><div className="flex items-end gap-2"><Button type="submit"><Check className="h-4 w-4" />{editingId ? (rtl ? "حفظ التعديل" : "Save edit") : (rtl ? "إضافة" : "Add")}</Button>{editingId && <Button type="button" variant="secondary" onClick={resetForm}>{rtl ? "إلغاء" : "Cancel"}</Button>}</div></form>}
      {message && <p role="status" className="text-slate-600">{message}</p>}
    </Card>
    <Card className="space-y-4 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{rtl ? "قائمة المواقع" : "Location list"}</h2><label className="flex items-center gap-2"><input type="checkbox" checked={includeDisabled} onChange={(event) => setIncludeDisabled(event.target.checked)} />{rtl ? "إظهار المعطّل" : "Include disabled"}</label></div>{loading ? <LoadingState variant="skeleton" /> : error ? <ErrorState message={error} onRetry={() => void load(includeDisabled)} /> : <div className="overflow-x-auto"><table className="min-w-full text-start"><thead className="bg-slate-50 dark:bg-navy-950"><tr><th className="px-3 py-2">{rtl ? "الاسم" : "Name"}</th><th className="px-3 py-2">{rtl ? "الكود" : "Code"}</th><th className="px-3 py-2">{rtl ? "النوع" : "Type"}</th><th className="px-3 py-2">{rtl ? "الحالة" : "Status"}</th><th className="px-3 py-2">{rtl ? "إجراءات" : "Actions"}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t border-border"><td className="px-3 py-2">{item.name}</td><td className="px-3 py-2 font-mono">{item.code}</td><td className="px-3 py-2">{item.locationType}</td><td className="px-3 py-2"><Badge tone={item.isActive ? "green" : "slate"}>{item.isActive ? (rtl ? "نشط" : "Active") : (rtl ? "معطّل" : "Disabled")}</Badge></td><td className="px-3 py-2"><div className="flex gap-2">{hasPermission("inventory.adjust") && <Button size="sm" variant="secondary" onClick={() => { setEditingId(item.id); setName(item.name); setCode(item.code); setLocationType(item.locationType); }}><Edit3 className="h-3.5 w-3.5" />{rtl ? "تعديل" : "Edit"}</Button>}{hasPermission("inventory.adjust") && item.isActive && <Button size="sm" variant="secondary" onClick={() => void disable(item.id)}><Power className="h-3.5 w-3.5" />{rtl ? "تعطيل" : "Disable"}</Button>}</div></td></tr>)}</tbody></table>{!items.length && <p className="py-6 text-center text-slate-500">{rtl ? "لا توجد مواقع في النطاق الحالي." : "No locations in the current scope."}</p>}</div>}</Card>
  </div>;
}
