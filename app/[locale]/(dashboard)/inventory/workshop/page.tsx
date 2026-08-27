"use client";

import { FormEvent, useEffect, useState } from "react";
import { Hammer, RefreshCw, RotateCcw, Send } from "lucide-react";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { useBranchContext } from "@/contexts/branch-context";
import { apiClient, DarfusApiError, generateUUID } from "@/lib/api/client";
import { usePermissions } from "@/hooks/use-permissions";

type Location = { id: string; code: string; name: string; isActive: boolean };
type Asset = { id: string; name: string; barcode?: string | null; locationId?: string | null; operationalStatus: string; inventoryProfile?: string | null };
type WorkshopOrder = { id: string; orderNumber: string; workshopLocationId: string; workshopLocationName?: string | null; returnLocationId?: string | null; returnLocationName?: string | null; providerName?: string | null; status: "SENT" | "RETURNED"; createdAt: string; assets: Array<{ assetId: string; barcode?: string | null; status: string }> };

export default function InventoryWorkshopPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { branchId } = useBranchContext();
  const { hasPermission } = usePermissions();
  const [locations, setLocations] = useState<Location[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [orders, setOrders] = useState<WorkshopOrder[]>([]);
  const [workshopLocationId, setWorkshopLocationId] = useState("");
  const [returnLocationId, setReturnLocationId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [providerName, setProviderName] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      const [locationResponse, assetResponse, orderResponse] = await Promise.all([
        apiClient<{ data: { items: Location[] } }>("/inventory/locations", { locale, branchId }),
        apiClient<{ data: { items: Asset[] } }>("/inventory-v2/assets?status=AVAILABLE&limit=200", { locale, branchId }),
        apiClient<{ data: { items: WorkshopOrder[] } }>("/inventory-v2/workshop-orders", { locale, branchId }),
      ]);
      const nextLocations = (locationResponse.data.items || []).filter((item) => item.isActive);
      setLocations(nextLocations);
      setAssets(assetResponse.data.items || []);
      setOrders(orderResponse.data.items || []);
      setWorkshopLocationId((current) => nextLocations.some((item) => item.id === current) ? current : "");
      setReturnLocationId((current) => nextLocations.some((item) => item.id === current) ? current : "");
      setAssetId((current) => (assetResponse.data.items || []).some((item) => item.id === current) ? current : "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (rtl ? "تعذر تحميل بيانات الورشة." : "Unable to load Workshop data."));
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [branchId]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!branchId || !assetId || !workshopLocationId) return;
    setBusy(true); setMessage(null);
    try {
      await apiClient("/inventory-v2/workshop-orders", {
        method: "POST",
        locale,
        branchId,
        idempotencyKey: generateUUID(),
        body: JSON.stringify({ assetIds: [assetId], workshopLocationId, providerName: providerName || null, notes: notes || null }),
      });
      setMessage(rtl ? "تم إرسال الأصل إلى الورشة." : "Asset sent to Workshop.");
      setAssetId(""); setProviderName(""); setNotes("");
      await load();
    } catch (cause) { setMessage(cause instanceof DarfusApiError ? cause.message : (rtl ? "تعذر إرسال الأصل." : "Unable to send the Asset.")); }
    finally { setBusy(false); }
  };

  const complete = async (orderId: string) => {
    if (!branchId || !returnLocationId) return;
    setBusy(true); setMessage(null);
    try {
      await apiClient(`/inventory-v2/workshop-orders/${encodeURIComponent(orderId)}/return`, {
        method: "POST",
        locale,
        branchId,
        idempotencyKey: generateUUID(),
        body: JSON.stringify({ returnLocationId, notes: notes || null }),
      });
      setMessage(rtl ? "تم إكمال العمل وإعادة الأصل." : "Workshop work completed and Asset returned.");
      setNotes("");
      await load();
    } catch (cause) { setMessage(cause instanceof DarfusApiError ? cause.message : (rtl ? "تعذر إكمال العمل." : "Unable to complete Workshop work.")); }
    finally { setBusy(false); }
  };

  if (!hasPermission("inventory.workshop.read")) return <ErrorState message={rtl ? "لا تملك صلاحية عرض الورشة." : "You do not have permission to view Workshop."} />;

  return <div className="space-y-6 text-xs">
    <PageHeader title={rtl ? "الورشة" : "Workshop"} description={rtl ? "إدارة عهدة الأصل نفسه داخل موقع ورشة معتمد ضمن الفرع." : "Manage custody of the same Asset at a validated Workshop location within the current branch."} actions={<Button size="sm" variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" />{rtl ? "تحديث" : "Refresh"}</Button>} />
    {error && <ErrorState message={error} onRetry={() => void load()} />}
    {message && <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700 dark:bg-navy-950 dark:text-slate-200">{message}</p>}
    {loading ? <LoadingState variant="skeleton" /> : <>
      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-2 font-semibold"><Hammer className="h-4 w-4" />{rtl ? "إرسال أصل إلى الورشة" : "Send an Asset to Workshop"}</div>
        {hasPermission("inventory.workshop.send") ? <form onSubmit={send} className="grid gap-3 md:grid-cols-2">
          <label><span className="mb-1 block text-slate-500">{rtl ? "الأصل المتاح" : "Available Asset"}</span><NativeSelect required value={assetId} onChange={(event) => setAssetId(event.target.value)}><option value="">{rtl ? "اختر الأصل..." : "Select an Asset..."}</option>{assets.filter((asset) => asset.operationalStatus === "AVAILABLE").map((asset) => <option key={asset.id} value={asset.id}>{asset.barcode || asset.id} — {asset.name}</option>)}</NativeSelect></label>
          <label><span className="mb-1 block text-slate-500">{rtl ? "موقع الورشة" : "Workshop Location"}</span><NativeSelect required value={workshopLocationId} onChange={(event) => setWorkshopLocationId(event.target.value)}><option value="">{rtl ? "اختر موقعًا من DB..." : "Select a DB location..."}</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name} ({location.code})</option>)}</NativeSelect></label>
          <label><span className="mb-1 block text-slate-500">{rtl ? "الفني/الجهة" : "Technician / Provider"}</span><input className="input-base" value={providerName} onChange={(event) => setProviderName(event.target.value)} maxLength={160} /></label>
          <label><span className="mb-1 block text-slate-500">{rtl ? "ملاحظات" : "Notes"}</span><input className="input-base" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} /></label>
          <div className="md:col-span-2 flex justify-end"><Button type="submit" disabled={busy || !assetId || !workshopLocationId}><Send className="h-4 w-4" />{rtl ? "إرسال إلى الورشة" : "Send to Workshop"}</Button></div>
        </form> : <p className="text-slate-500">{rtl ? "لا تملك صلاحية إرسال أصل إلى الورشة." : "You are not authorized to send an Asset to Workshop."}</p>}
      </Card>
      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{rtl ? "سجل الورشة" : "Workshop register"}</h2><label className="min-w-56"><span className="mb-1 block text-slate-500">{rtl ? "موقع الإرجاع" : "Return Location"}</span><NativeSelect value={returnLocationId} onChange={(event) => setReturnLocationId(event.target.value)}><option value="">{rtl ? "اختر موقع الإرجاع..." : "Select return location..."}</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name} ({location.code})</option>)}</NativeSelect></label></div>
        {!orders.length ? <p className="py-6 text-center text-slate-500">{rtl ? "لا توجد عمليات ورشة." : "No Workshop jobs."}</p> : <div className="overflow-x-auto"><table className="min-w-full text-start"><thead className="bg-slate-50 dark:bg-navy-950"><tr><th className="px-3 py-2">{rtl ? "الأصل" : "Asset"}</th><th className="px-3 py-2">{rtl ? "موقع الورشة" : "Workshop Location"}</th><th className="px-3 py-2">{rtl ? "الحالة" : "Status"}</th><th className="px-3 py-2">{rtl ? "إجراء" : "Action"}</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-t border-border"><td className="px-3 py-2 font-mono">{order.assets.map((asset) => asset.barcode || asset.assetId).join(", ")}</td><td className="px-3 py-2">{order.workshopLocationName || order.workshopLocationId}</td><td className="px-3 py-2"><Badge tone={order.status === "RETURNED" ? "green" : "blue"}>{order.status === "RETURNED" ? (rtl ? "تمت الإعادة" : "Returned") : (rtl ? "في الورشة" : "In Workshop")}</Badge></td><td className="px-3 py-2">{order.status === "SENT" && hasPermission("inventory.workshop.complete") && <Button size="sm" disabled={busy || !returnLocationId} onClick={() => void complete(order.id)}><RotateCcw className="h-3.5 w-3.5" />{rtl ? "إكمال وإعادة" : "Complete & Return"}</Button>}</td></tr>)}</tbody></table></div>}
      </Card>
    </>}
  </div>;
}
