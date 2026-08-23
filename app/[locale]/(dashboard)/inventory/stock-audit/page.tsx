"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Barcode, CheckCircle2, RefreshCw } from "lucide-react";
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

type Location = { id: string; code: string; name: string; isActive: boolean; branchId: string };
type CountAsset = { id: string; barcode?: string | null };
type CountItem = { id: string; assetId: string; status: "matched" | "missing" | "unexpected"; result?: string | null; asset?: CountAsset | null };
type Count = { id: string; auditNumber: string; auditMethod: string; locationId: string; status: "draft" | "in-progress" | "completed" | "closed"; items: CountItem[]; expectedCount?: number; countedCount?: number; missingCount?: number; unexpectedCount?: number };
const COUNT_STATUS_LABELS = {
  ar: { draft: "مسودة", "in-progress": "قيد التنفيذ", completed: "مكتمل", closed: "مغلق" },
  en: { draft: "Draft", "in-progress": "In progress", completed: "Completed", closed: "Closed" },
} as const;

export default function StockAuditPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { branchId, isReady } = useBranchContext();
  const { hasPermission } = usePermissions();
  const [locations, setLocations] = useState<Location[]>([]);
  const [count, setCount] = useState<Count | null>(null);
  const [countHistory, setCountHistory] = useState<Count[]>([]);
  const [locationId, setLocationId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const response = await apiClient<{ data: { items: Location[] } }>("/inventory/locations", { locale, branchId: branchId || undefined });
      setLocations((response.data.items || []).filter((item) => item.isActive && item.branchId === branchId));
    } catch (cause) { setError(cause instanceof Error ? cause.message : (rtl ? "تعذر تحميل المواقع." : "Unable to load locations.")); }
    finally { setLoading(false); }
  };

  const loadCount = async (id: string) => {
    const response = await apiClient<{ data: Count }>(`/inventory-v2/audits/${encodeURIComponent(id)}`, { locale, branchId: branchId || undefined });
    setCount(response.data);
  };

  const loadCountHistory = async () => {
    if (!branchId) return;
    try {
      const response = await apiClient<{ data: { items: Count[] } }>("/inventory-v2/audits?status=closed", { locale, branchId: branchId || undefined });
      setCountHistory(response.data.items || []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : (rtl ? "تعذر تحميل سجل الجرد." : "Unable to load Count history.")); }
  };

  useEffect(() => { if (isReady) { void loadLocations(); void loadCountHistory(); } }, [isReady, branchId]);

  const items = count?.items || [];
  const expectedCount = count?.expectedCount ?? items.length;
  const countedCount = count?.countedCount ?? items.filter((item) => item.result === "MATCHED").length;
  const missingCount = count?.missingCount ?? items.filter((item) => item.result === "MISSING").length;
  const unexpectedCount = count?.unexpectedCount ?? items.filter((item) => item.result === "EXTRA").length;
  const zeroVariance = Boolean(count && expectedCount > 0 && countedCount === expectedCount && missingCount === 0 && unexpectedCount === 0);
  const canCreate = hasPermission("inventory.count.create");
  const canScan = hasPermission("inventory.count.scan");
  const canComplete = hasPermission("inventory.count.complete");

  const startCount = async (event: FormEvent) => {
    event.preventDefault();
    if (!branchId || !locationId || busy) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const auditTimestamp = new Date().toISOString()
        .replaceAll("-", "")
        .replaceAll(":", "")
        .replaceAll(".", "")
        .replaceAll("T", "")
        .replaceAll("Z", "");
      const auditNumber = `COUNT-${auditTimestamp.slice(0, 14)}-${generateUUID().slice(0, 8)}`;
      const created = await apiClient<{ data: Count }>("/inventory-v2/audits", { method: "POST", locale, branchId: branchId || undefined, idempotencyKey: generateUUID(), body: JSON.stringify({ auditNumber, auditMethod: "BARCODE_SCAN", locationId }) });
      const started = await apiClient<{ data: Count }>(`/inventory-v2/audits/${encodeURIComponent(created.data.id)}/start`, { method: "POST", locale, branchId: branchId || undefined, idempotencyKey: generateUUID(), body: JSON.stringify({}) });
      setCount(started.data);
      setMessage(rtl ? "بدأ جرد الموقع المحدد." : "Count started for the selected location.");
    } catch (cause) { setError(cause instanceof DarfusApiError ? cause.message : (cause instanceof Error ? cause.message : "Unable to start count.")); }
    finally { setBusy(false); }
  };

  const scanBarcode = async (event: FormEvent) => {
    event.preventDefault();
    const value = barcode.trim();
    if (!count || count.status !== "in-progress" || !value || busy) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      await apiClient(`/inventory-v2/audits/${encodeURIComponent(count.id)}/observe`, { method: "POST", locale, branchId: branchId || undefined, idempotencyKey: generateUUID(), body: JSON.stringify({ barcodes: [value], method: "BARCODE_SCAN" }) });
      await loadCount(count.id);
      setBarcode("");
      setMessage(rtl ? "تم تسجيل الباركود." : "Barcode counted.");
    } catch (cause) { setError(cause instanceof DarfusApiError ? cause.message : (cause instanceof Error ? cause.message : "Unable to count this barcode.")); }
    finally { setBusy(false); }
  };

  const completeCount = async () => {
    if (!count || !zeroVariance || busy) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      await apiClient(`/inventory-v2/audits/${encodeURIComponent(count.id)}/complete`, { method: "POST", locale, branchId: branchId || undefined, idempotencyKey: generateUUID(), body: JSON.stringify({}) });
      await loadCount(count.id);
      setMessage(rtl ? "اكتمل الجرد بدون فروقات." : "Count completed with zero variance.");
    } catch (cause) { setError(cause instanceof DarfusApiError ? cause.message : (cause instanceof Error ? cause.message : "Unable to complete count.")); }
    finally { setBusy(false); }
  };

  const closeCount = async () => {
    if (!count || count.status !== "completed" || busy) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await apiClient<{ data: Count }>(`/inventory-v2/audits/${encodeURIComponent(count.id)}/close`, { method: "POST", locale, branchId: branchId || undefined, idempotencyKey: generateUUID(), body: JSON.stringify({}) });
      setCount(response.data);
      await loadCountHistory();
      setMessage(rtl ? "أُغلق الجرد وحُفظ كدليل تدقيقي." : "Count closed and preserved as audit evidence.");
    } catch (cause) { setError(cause instanceof DarfusApiError ? cause.message : (cause instanceof Error ? cause.message : "Unable to close count.")); }
    finally { setBusy(false); }
  };

  const selectedLocation = useMemo(() => locations.find((location) => location.id === (count?.locationId || locationId)), [locations, count?.locationId, locationId]);
  const countStatusLabel = (status: Count["status"]) => COUNT_STATUS_LABELS[rtl ? "ar" : "en"][status];
  const countTone = (status: Count["status"]): "green" | "amber" | "blue" => status === "closed" ? "green" : status === "completed" ? "blue" : "amber";
  if (!hasPermission("inventory.count.read")) return <ErrorState message={rtl ? "لا تملك صلاحية عرض جرد المخزون." : "You do not have permission to view Inventory Count."} />;
  if (loading && !locations.length) return <LoadingState />;

  return <div className="space-y-6">
    <PageHeader title={rtl ? "جرد المخزون" : "Inventory Count"} description={rtl ? "جرد Asset واحد لكل قطعة داخل موقع DB محدد، بدون تعديل تلقائي للمخزون أو الحسابات." : "Count one Asset per physical piece inside a selected DB location, without automatic inventory or accounting adjustments."} actions={<Button size="sm" variant="secondary" onClick={() => void loadLocations()} disabled={loading}><RefreshCw className="h-4 w-4" />{rtl ? "تحديث" : "Refresh"}</Button>} />
    {message && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />{message}</div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {!count && canCreate && <Card className="space-y-4 p-5"><h2 className="font-semibold">{rtl ? "بدء جرد جديد" : "Start a new count"}</h2><form onSubmit={startCount} className="flex flex-col gap-3 md:flex-row md:items-end"><label className="flex-1"><span className="mb-1 block text-slate-500">{rtl ? "الموقع" : "Location"}</span><NativeSelect required value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="">{rtl ? "اختر موقعًا من DB..." : "Select a DB location..."}</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name} ({location.code})</option>)}</NativeSelect></label><Button type="submit" disabled={busy || !locationId}>{busy ? (rtl ? "جاري البدء..." : "Starting...") : (rtl ? "بدء الجرد" : "Start Count")}</Button></form></Card>}
    {count && <>
      <Card className="space-y-4 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{rtl ? "جلسة الجرد" : "Count session"}: <span className="font-mono">{count.auditNumber}</span></h2><p className="text-sm text-slate-500">{selectedLocation?.name || count.locationId}</p></div><Badge tone={countTone(count.status)}>{countStatusLabel(count.status)}</Badge></div><div className="grid grid-cols-2 gap-3 md:grid-cols-5"><div><span className="text-slate-500">{rtl ? "المتوقع" : "Expected"}</span><strong className="block text-xl">{expectedCount}</strong></div><div><span className="text-slate-500">{rtl ? "المعدود" : "Counted"}</span><strong className="block text-xl text-emerald-600">{countedCount}</strong></div><div><span className="text-slate-500">{rtl ? "المفقود" : "Missing"}</span><strong className="block text-xl text-red-600">{missingCount}</strong></div><div><span className="text-slate-500">{rtl ? "غير متوقع" : "Unexpected"}</span><strong className="block text-xl text-amber-600">{unexpectedCount}</strong></div><div><span className="text-slate-500">{rtl ? "الفروقات" : "Variance"}</span><strong className="block text-xl text-amber-600">{unexpectedCount + missingCount}</strong></div></div></Card>
      {count.status === "in-progress" && canScan && <Card className="space-y-3 p-5"><h2 className="flex items-center gap-2 font-semibold"><Barcode className="h-4 w-4" />{rtl ? "مسح باركود" : "Scan Barcode"}</h2><form onSubmit={scanBarcode} className="flex gap-2"><input autoFocus className="input-base flex-1 font-mono" inputMode="text" value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder={rtl ? "امسح أو اكتب الباركود" : "Scan or type the barcode"} aria-label={rtl ? "الباركود" : "Barcode"} /><Button type="submit" disabled={busy || !barcode.trim()}>{rtl ? "تسجيل" : "Count"}</Button></form><p className="text-xs text-slate-500">{rtl ? "تكرار نفس الباركود لا ينشئ صفًا ثانيًا." : "Repeating the same barcode is idempotent and does not create a second row."}</p></Card>}
      {count.status === "in-progress" && canComplete && <Button onClick={() => void completeCount()} disabled={busy || !zeroVariance}>{rtl ? "إكمال الجرد بدون فروقات" : "Complete Zero-Variance Count"}</Button>}
      {count.status === "completed" && canComplete && <Button onClick={() => void closeCount()} disabled={busy}>{rtl ? "إغلاق وحفظ الدليل" : "Close and Preserve Evidence"}</Button>}
      <Card className="overflow-x-auto p-5"><table className="min-w-full text-start text-sm"><thead><tr className="border-b border-border"><th className="px-2 py-2">{rtl ? "الأصل" : "Asset"}</th><th className="px-2 py-2">{rtl ? "الباركود" : "Barcode"}</th><th className="px-2 py-2">{rtl ? "النتيجة" : "Result"}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-border"><td className="px-2 py-2 font-mono">{item.asset?.id || item.assetId}</td><td className="px-2 py-2 font-mono">{item.asset?.barcode || "—"}</td><td className="px-2 py-2">{item.status === "matched" ? (rtl ? "متطابق" : "EXPECTED_AND_COUNTED") : item.status === "missing" ? (rtl ? "غير معدود" : "EXPECTED_NOT_COUNTED") : (rtl ? "غير متوقع" : "COUNTED_NOT_EXPECTED")}</td></tr>)}</tbody></table></Card>
    </>}
    {countHistory.length > 0 && <Card className="space-y-4 p-5"><div><h2 className="font-semibold">{rtl ? "سجل الجرد المغلق" : "Closed Count history"}</h2><p className="text-sm text-slate-500">{rtl ? "قراءة فقط للأدلة المحفوظة؛ لا توجد إجراءات تعديل." : "Read-only preserved evidence; no mutation actions are available."}</p></div><div className="space-y-3">{countHistory.map((history) => { const historyExpected = history.expectedCount ?? history.items.length; const historyCounted = history.countedCount ?? history.items.filter((item) => item.result === "MATCHED").length; const historyMissing = history.missingCount ?? history.items.filter((item) => item.result === "MISSING").length; const historyUnexpected = history.unexpectedCount ?? history.items.filter((item) => item.result === "EXTRA").length; const historyLocation = locations.find((location) => location.id === history.locationId); return <div key={history.id} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{history.auditNumber}</p><p className="text-sm text-slate-500">{historyLocation?.name || history.locationId}</p></div><Badge tone={countTone(history.status)}>{countStatusLabel(history.status)}</Badge></div><div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-5"><div><span className="text-slate-500">{rtl ? "المتوقع" : "Expected"}</span><strong className="block">{historyExpected}</strong></div><div><span className="text-slate-500">{rtl ? "المعدود" : "Counted"}</span><strong className="block text-emerald-600">{historyCounted}</strong></div><div><span className="text-slate-500">{rtl ? "المفقود" : "Missing"}</span><strong className="block text-red-600">{historyMissing}</strong></div><div><span className="text-slate-500">{rtl ? "غير متوقع" : "Unexpected"}</span><strong className="block text-amber-600">{historyUnexpected}</strong></div><div><span className="text-slate-500">{rtl ? "الفروقات" : "Variance"}</span><strong className="block text-amber-600">{historyUnexpected + historyMissing}</strong></div></div></div>; })}</div></Card>}
  </div>;
}
