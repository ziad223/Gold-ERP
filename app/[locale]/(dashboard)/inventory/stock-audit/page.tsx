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
import { formatDateTime } from "@/lib/dates/dates";
import { usePermissions } from "@/hooks/use-permissions";
import { countItemDisplayState, countTotals } from "@/components/inventory/count-semantics";

type Location = { id: string; code: string; name: string; isActive: boolean; branchId: string };
type CountAsset = {
  id: string;
  barcode?: string | null;
  operationalStatus?: string | null;
  status?: string | null;
  branchId?: string | null;
  locationId?: string | null;
  updatedAt?: string | null;
  lifecycleChangedAfterSnapshot?: boolean;
};
type CountItem = {
  id: string;
  assetId: string;
  status: "matched" | "missing" | "unexpected";
  result?: string | null;
  createdAt?: string | null;
  asset?: CountAsset | null;
};
type Count = {
  id: string;
  auditNumber: string;
  auditMethod: string;
  locationId: string;
  status: "draft" | "in-progress" | "completed" | "closed";
  items: CountItem[];
  createdAt?: string;
  expectedCount?: number;
  countedCount?: number;
  missingCount?: number;
  unexpectedCount?: number;
};
type ScanRejection = {
  barcode: string;
  reasonCode: string;
  currentOperationalStatus?: string;
  currentLocationId?: string;
  expectedLocationId?: string;
};
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
  const [activeCounts, setActiveCounts] = useState<Count[]>([]);
  const [countHistory, setCountHistory] = useState<Count[]>([]);
  const [locationId, setLocationId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeLoading, setActiveLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanRejection, setScanRejection] = useState<ScanRejection | null>(null);

  const loadLocations = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const response = await apiClient<{ data: { items: Location[] } }>("/inventory/locations", {
        locale,
        branchId: branchId || undefined,
      });
      setLocations((response.data.items || []).filter((item) => item.isActive && item.branchId === branchId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : rtl ? "تعذر تحميل المواقع." : "Unable to load locations.");
    } finally {
      setLoading(false);
    }
  };

  const loadCount = async (id: string) => {
    const response = await apiClient<{ data: Count }>(`/inventory-v2/audits/${encodeURIComponent(id)}`, {
      locale,
      branchId: branchId || undefined,
    });
    setCount(response.data);
    return response.data;
  };

  const loadActiveCounts = async (): Promise<Count[]> => {
    if (!branchId) {
      setActiveCounts([]);
      setActiveLoading(false);
      return [];
    }
    setActiveLoading(true);
    try {
      const [draftResponse, inProgressResponse] = await Promise.all([
        apiClient<{ data: { items: Count[] } }>("/inventory-v2/audits?status=draft", { locale, branchId }),
        apiClient<{ data: { items: Count[] } }>("/inventory-v2/audits?status=in-progress", { locale, branchId }),
      ]);
      const active = [...(draftResponse.data.items || []), ...(inProgressResponse.data.items || [])]
        .filter((candidate) => candidate.status === "draft" || candidate.status === "in-progress")
        .filter((candidate, index, all) => all.findIndex((item) => item.id === candidate.id) === index);
      setActiveCounts(active);
      return active;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : rtl ? "تعذر تحميل الجرود النشطة." : "Unable to load active Counts.",
      );
      return [];
    } finally {
      setActiveLoading(false);
    }
  };

  const loadCountHistory = async () => {
    if (!branchId) return;
    try {
      const response = await apiClient<{ data: { items: Count[] } }>("/inventory-v2/audits?status=closed", {
        locale,
        branchId: branchId || undefined,
      });
      setCountHistory(response.data.items || []);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : rtl ? "تعذر تحميل سجل الجرد." : "Unable to load Count history.",
      );
    }
  };

  const refreshPage = () => {
    void loadLocations();
    void loadActiveCounts();
    void loadCountHistory();
  };

  useEffect(() => {
    if (isReady) refreshPage();
  }, [isReady, branchId]);

  const items = count?.items || [];
  const currentTotals = count
    ? countTotals(count)
    : { expected: 0, counted: 0, unobserved: 0, missing: 0, unexpected: 0, variance: null };
  const expectedCount = currentTotals.expected;
  const countedCount = currentTotals.counted;
  const missingCount = currentTotals.missing;
  const unexpectedCount = currentTotals.unexpected;
  const zeroVariance = Boolean(
    count && expectedCount > 0 && countedCount === expectedCount && missingCount === 0 && unexpectedCount === 0,
  );
  const canCreate = hasPermission("inventory.count.create");
  const canScan = hasPermission("inventory.count.scan");
  const canComplete = hasPermission("inventory.count.complete");
  const selectedActiveCount = activeCounts.find((candidate) => candidate.locationId === locationId) || null;

  const openCount = async (candidate: Count) => {
    if (!branchId || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await loadCount(candidate.id);
      setLocationId(candidate.locationId);
      setMessage(rtl ? "تم فتح الجرد الحالي للمتابعة." : "The current Count is open and ready to continue.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : rtl ? "تعذر فتح الجرد الحالي." : "Unable to open the current Count.",
      );
    } finally {
      setBusy(false);
    }
  };

  const startCount = async (event: FormEvent) => {
    event.preventDefault();
    if (!branchId || !locationId || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const auditTimestamp = new Date()
        .toISOString()
        .replaceAll("-", "")
        .replaceAll(":", "")
        .replaceAll(".", "")
        .replaceAll("T", "")
        .replaceAll("Z", "");
      const auditNumber = `COUNT-${auditTimestamp.slice(0, 14)}-${generateUUID().slice(0, 8)}`;
      const created = await apiClient<{ data: Count }>("/inventory-v2/audits", {
        method: "POST",
        locale,
        branchId: branchId || undefined,
        idempotencyKey: generateUUID(),
        body: JSON.stringify({ auditNumber, auditMethod: "BARCODE_SCAN", locationId }),
      });
      const started = await apiClient<{ data: Count }>(
        `/inventory-v2/audits/${encodeURIComponent(created.data.id)}/start`,
        {
          method: "POST",
          locale,
          branchId: branchId || undefined,
          idempotencyKey: generateUUID(),
          body: JSON.stringify({}),
        },
      );
      const startedCount = await loadCount(started.data.id);
      setCount(startedCount);
      setMessage(rtl ? "بدأ جرد الموقع المحدد." : "Count started for the selected location.");
    } catch (cause) {
      if (cause instanceof DarfusApiError && cause.status === 409 && cause.errorCode === "STATE_CONFLICT") {
        const refreshed = await loadActiveCounts();
        const conflicting = refreshed.find((candidate) => candidate.locationId === locationId);
        setError(null);
        setMessage(
          conflicting
            ? rtl
              ? "يوجد جرد نشط بالفعل لهذا الموقع. افتح الجرد الحالي أو أكمله قبل بدء جرد جديد."
              : "An active inventory count already exists for this location. Open or continue the current count before starting a new one."
            : rtl
              ? "يوجد تعارض في حالة الجرد. حدّث الصفحة وراجع الجرود النشطة."
              : "The Count state has changed. Refresh the page and review active Counts.",
        );
      } else {
        setError(
          cause instanceof DarfusApiError
            ? cause.message
            : cause instanceof Error
              ? cause.message
              : "Unable to start count.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const scanBarcode = async (event: FormEvent) => {
    event.preventDefault();
    const value = barcode.trim();
    if (!count || count.status !== "in-progress" || !value || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    setScanRejection(null);
    try {
      await apiClient(`/inventory-v2/audits/${encodeURIComponent(count.id)}/observe`, {
        method: "POST",
        locale,
        branchId: branchId || undefined,
        idempotencyKey: generateUUID(),
        body: JSON.stringify({ barcodes: [value], method: "BARCODE_SCAN" }),
      });
      await loadCount(count.id);
      await loadActiveCounts();
      setBarcode("");
      setMessage(rtl ? "تم تسجيل الباركود." : "Barcode counted.");
    } catch (cause) {
      if (cause instanceof DarfusApiError && cause.errorCode === "STATE_CONFLICT" && cause.details?.reasonCode) {
        setScanRejection({
          barcode: value,
          reasonCode: String(cause.details.reasonCode),
          currentOperationalStatus:
            typeof cause.details.currentOperationalStatus === "string"
              ? cause.details.currentOperationalStatus
              : undefined,
          currentLocationId:
            typeof cause.details.currentLocationId === "string" ? cause.details.currentLocationId : undefined,
          expectedLocationId:
            typeof cause.details.expectedLocationId === "string" ? cause.details.expectedLocationId : undefined,
        });
      } else
        setError(
          cause instanceof DarfusApiError
            ? cause.message
            : cause instanceof Error
              ? cause.message
              : "Unable to count this barcode.",
        );
    } finally {
      setBusy(false);
    }
  };

  const lifecycleLabel = (status?: string | null) => {
    const normalized = String(status || "").toUpperCase();
    const labels = rtl
      ? { AVAILABLE: "متاحة", SOLD: "مباعة", MELTED: "مصهّرة", MISSING: "مفقودة" }
      : { AVAILABLE: "Available", SOLD: "Sold", MELTED: "Melted", MISSING: "Missing" };
    return labels[normalized as keyof typeof labels] || (rtl ? "غير محددة" : "Unknown");
  };

  const rejectionReason = (reasonCode: string) => {
    const labels: Record<string, [string, string]> = {
      ASSET_SOLD: [
        "هذه القطعة مباعة حاليًا ولا يمكن احتسابها في هذا الجرد.",
        "This Asset is currently sold and cannot be counted in this Count.",
      ],
      ASSET_MELTED: [
        "هذه القطعة مصهّرة حاليًا ولا يمكن احتسابها في هذا الجرد.",
        "This Asset is currently melted and cannot be counted in this Count.",
      ],
      ASSET_MISSING: [
        "هذه القطعة مسجلة كمفقودة ولا يمكن احتسابها في هذا الجرد.",
        "This Asset is marked missing and cannot be counted in this Count.",
      ],
      ASSET_BRANCH_MISMATCH: [
        "هذه القطعة موجودة في فرع مختلف عن فرع الجرد.",
        "This Asset belongs to a different branch than the Count.",
      ],
      ASSET_LOCATION_MISMATCH: [
        "هذه القطعة موجودة في موقع مختلف عن موقع الجرد.",
        "This Asset is in a different location than the Count.",
      ],
      ASSET_NOT_IN_FROZEN_SET: [
        "هذه القطعة ليست ضمن قائمة القطع المثبتة عند بدء الجرد.",
        "This Asset is not part of the frozen expected set for this Count.",
      ],
    };
    return (
      labels[reasonCode]?.[rtl ? 0 : 1] ||
      (rtl ? "لا يمكن احتساب هذه القطعة في هذا الجرد." : "This Asset cannot be counted in this Count.")
    );
  };

  const completeCount = async () => {
    if (!count || !zeroVariance || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await apiClient(`/inventory-v2/audits/${encodeURIComponent(count.id)}/complete`, {
        method: "POST",
        locale,
        branchId: branchId || undefined,
        idempotencyKey: generateUUID(),
        body: JSON.stringify({}),
      });
      await loadCount(count.id);
      await loadActiveCounts();
      setMessage(rtl ? "اكتمل الجرد بدون فروقات." : "Count completed with zero variance.");
    } catch (cause) {
      setError(
        cause instanceof DarfusApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : "Unable to complete count.",
      );
    } finally {
      setBusy(false);
    }
  };

  const closeCount = async () => {
    if (!count || count.status !== "completed" || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await apiClient<{ data: Count }>(`/inventory-v2/audits/${encodeURIComponent(count.id)}/close`, {
        method: "POST",
        locale,
        branchId: branchId || undefined,
        idempotencyKey: generateUUID(),
        body: JSON.stringify({}),
      });
      setCount(response.data);
      await loadActiveCounts();
      await loadCountHistory();
      setMessage(rtl ? "أُغلق الجرد وحُفظ كدليل تدقيقي." : "Count closed and preserved as audit evidence.");
    } catch (cause) {
      setError(
        cause instanceof DarfusApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : "Unable to close count.",
      );
    } finally {
      setBusy(false);
    }
  };

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === (count?.locationId || locationId)),
    [locations, count?.locationId, locationId],
  );
  const countStatusLabel = (status: Count["status"]) => COUNT_STATUS_LABELS[rtl ? "ar" : "en"][status];
  const itemResultLabel = (item: CountItem) => {
    const state = countItemDisplayState(item, count?.status || "in-progress");
    if (state === "MATCHED") return rtl ? "متطابق" : "Matched";
    if (state === "MISSING") return rtl ? "مفقود" : "Missing";
    if (state === "UNEXPECTED") return rtl ? "غير متوقع" : "Unexpected";
    return rtl ? "غير معدود" : "Not Counted Yet";
  };
  const varianceLabel = (variance: number | null) =>
    variance === null ? (rtl ? "غير محسوبة بعد" : "Not calculated yet") : String(variance);
  const varianceHeading = (status: Count["status"]) =>
    status === "in-progress" ? (rtl ? "الفروقات النهائية" : "Final Variance") : rtl ? "الفروقات" : "Variance";
  const countTone = (status: Count["status"]): "green" | "amber" | "blue" =>
    status === "closed" ? "green" : status === "completed" ? "blue" : "amber";
  if (!hasPermission("inventory.count.read"))
    return (
      <ErrorState
        message={rtl ? "لا تملك صلاحية عرض جرد المخزون." : "You do not have permission to view Inventory Count."}
      />
    );
  if ((loading || activeLoading) && !locations.length) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={rtl ? "جرد المخزون" : "Inventory Count"}
        description={
          rtl
            ? "جرد Asset واحد لكل قطعة داخل موقع DB محدد، بدون تعديل تلقائي للمخزون أو الحسابات."
            : "Count one Asset per physical piece inside a selected DB location, without automatic inventory or accounting adjustments."
        }
        actions={
          <Button size="sm" variant="secondary" onClick={refreshPage} disabled={loading || activeLoading}>
            <RefreshCw className="h-4 w-4" />
            {rtl ? "تحديث" : "Refresh"}
          </Button>
        }
      />
      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {scanRejection && (
        <div role="alert">
          <Card className="space-y-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">
              {rtl ? "تعذر احتساب هذه القطعة في هذا الجرد." : "This Asset was not counted in this Count."}
            </p>
            <p>
              <span className="text-slate-600">{rtl ? "الباركود" : "Barcode"}:</span>{" "}
              <span className="font-mono">{scanRejection.barcode}</span>
            </p>
            <p>
              <span className="text-slate-600">{rtl ? "الحالة الحالية" : "Current Asset state"}:</span>{" "}
              {lifecycleLabel(scanRejection.currentOperationalStatus)}
            </p>
            <p>
              <span className="text-slate-600">{rtl ? "السبب" : "Reason"}:</span>{" "}
              {rejectionReason(scanRejection.reasonCode)}
            </p>
          </Card>
        </div>
      )}
      {activeCounts.length > 0 && (
        <Card className="space-y-4 border-amber-200 p-5">
          <div>
            <h2 className="font-semibold">{rtl ? "الجرود النشطة" : "Active Counts"}</h2>
            <p className="text-sm text-slate-500">
              {rtl
                ? "افتح الجرد الحالي قبل بدء جرد آخر للموقع نفسه."
                : "Open the current Count before starting another Count for the same location."}
            </p>
          </div>
          <div className="space-y-3">
            {activeCounts.map((active) => {
              const totals = countTotals(active);
              const activeLocation = locations.find((location) => location.id === active.locationId);
              return (
                <div key={active.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{active.auditNumber}</p>
                      <p className="text-sm text-slate-500">
                        {activeLocation?.name || active.locationId}
                        {activeLocation?.code ? ` (${activeLocation.code})` : ""}
                      </p>
                      <p className="text-xs text-slate-500">
                        {rtl ? "تاريخ الإنشاء" : "Created"}:{" "}
                        {active.createdAt ? formatDateTime(active.createdAt, "Asia/Dubai", locale) : "—"}
                      </p>
                    </div>
                    <Badge tone="amber">{countStatusLabel(active.status)}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-6">
                    <div>
                      <span className="text-slate-500">{rtl ? "المتوقع" : "Expected"}</span>
                      <strong className="block">{totals.expected}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{rtl ? "المعدود" : "Counted"}</span>
                      <strong className="block text-emerald-600">{totals.counted}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{rtl ? "غير معدود" : "Not Counted Yet"}</span>
                      <strong className="block text-slate-600">{totals.unobserved}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{rtl ? "المفقود" : "Missing"}</span>
                      <strong className="block text-red-600">{totals.missing}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{rtl ? "غير متوقع" : "Unexpected"}</span>
                      <strong className="block text-amber-600">{totals.unexpected}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{rtl ? "الفروقات النهائية" : "Final Variance"}</span>
                      <strong className="block text-amber-600">{varianceLabel(totals.variance)}</strong>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void openCount(active)}
                      disabled={busy && count?.id !== active.id}
                    >
                      {rtl ? "فتح الجرد الحالي" : "Open current Count"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      {!count && canCreate && !selectedActiveCount && (
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">{rtl ? "بدء جرد جديد" : "Start a new count"}</h2>
          <form onSubmit={startCount} className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="flex-1">
              <span className="mb-1 block text-slate-500">{rtl ? "الموقع" : "Location"}</span>
              <NativeSelect required value={locationId} onChange={(event) => setLocationId(event.target.value)}>
                <option value="">{rtl ? "اختر موقعًا من DB..." : "Select a DB location..."}</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.code})
                  </option>
                ))}
              </NativeSelect>
            </label>
            <Button type="submit" disabled={busy || !locationId}>
              {busy ? (rtl ? "جاري البدء..." : "Starting...") : rtl ? "بدء الجرد" : "Start Count"}
            </Button>
          </form>
        </Card>
      )}
      {count && (
        <>
          <Card className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">
                  {rtl ? "جلسة الجرد" : "Count session"}: <span className="font-mono">{count.auditNumber}</span>
                </h2>
                <p className="text-sm text-slate-500">{selectedLocation?.name || count.locationId}</p>
              </div>
              <Badge tone={countTone(count.status)}>{countStatusLabel(count.status)}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <div>
                <span className="text-slate-500">{rtl ? "المتوقع" : "Expected"}</span>
                <strong className="block text-xl">{expectedCount}</strong>
              </div>
              <div>
                <span className="text-slate-500">{rtl ? "المعدود" : "Counted"}</span>
                <strong className="block text-xl text-emerald-600">{countedCount}</strong>
              </div>
              <div>
                <span className="text-slate-500">{rtl ? "غير معدود" : "Not Counted Yet"}</span>
                <strong className="block text-xl text-slate-600">{currentTotals.unobserved}</strong>
              </div>
              <div>
                <span className="text-slate-500">{rtl ? "المفقود" : "Missing"}</span>
                <strong className="block text-xl text-red-600">{missingCount}</strong>
              </div>
              <div>
                <span className="text-slate-500">{rtl ? "غير متوقع" : "Unexpected"}</span>
                <strong className="block text-xl text-amber-600">{unexpectedCount}</strong>
              </div>
              <div>
                <span className="text-slate-500">
                  {count.status === "in-progress"
                    ? rtl
                      ? "الفروقات النهائية"
                      : "Final Variance"
                    : rtl
                      ? "الفروقات"
                      : "Variance"}
                </span>
                <strong className="block text-xl text-amber-600">{varianceLabel(currentTotals.variance)}</strong>
              </div>
            </div>
          </Card>
          {count.status === "in-progress" && canScan && (
            <Card className="space-y-3 p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <Barcode className="h-4 w-4" />
                {rtl ? "مسح باركود" : "Scan Barcode"}
              </h2>
              <form onSubmit={scanBarcode} className="flex gap-2">
                <input
                  autoFocus
                  className="input-base flex-1 font-mono"
                  inputMode="text"
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  placeholder={rtl ? "امسح أو اكتب الباركود" : "Scan or type the barcode"}
                  aria-label={rtl ? "الباركود" : "Barcode"}
                />
                <Button type="submit" disabled={busy || !barcode.trim()}>
                  {rtl ? "تسجيل" : "Count"}
                </Button>
              </form>
              <p className="text-xs text-slate-500">
                {rtl
                  ? "تكرار نفس الباركود لا ينشئ صفًا ثانيًا."
                  : "Repeating the same barcode is idempotent and does not create a second row."}
              </p>
            </Card>
          )}
          {count.status === "in-progress" && canComplete && (
            <Button onClick={() => void completeCount()} disabled={busy || !zeroVariance}>
              {rtl ? "إكمال الجرد بدون فروقات" : "Complete Zero-Variance Count"}
            </Button>
          )}
          {count.status === "completed" && canComplete && (
            <Button onClick={() => void closeCount()} disabled={busy}>
              {rtl ? "إغلاق وحفظ الدليل" : "Close and Preserve Evidence"}
            </Button>
          )}
          <Card className="overflow-x-auto p-5">
            <table className="min-w-full text-start text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-2">{rtl ? "الأصل" : "Asset"}</th>
                  <th className="px-2 py-2">{rtl ? "الباركود" : "Barcode"}</th>
                  <th className="px-2 py-2">{rtl ? "نتيجة الجرد" : "Count result"}</th>
                  <th className="px-2 py-2">{rtl ? "حالة القطعة الحالية" : "Current Asset state"}</th>
                  <th className="px-2 py-2">{rtl ? "ملاحظة" : "Note"}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const changedAfterSnapshot =
                    item.asset?.lifecycleChangedAfterSnapshot === true ||
                    Boolean(
                      item.asset?.updatedAt &&
                        item.createdAt &&
                        new Date(item.asset.updatedAt).getTime() > new Date(item.createdAt).getTime(),
                    );
                  return (
                    <tr key={item.id} className="border-b border-border">
                      <td className="px-2 py-2 font-mono">{item.asset?.id || item.assetId}</td>
                      <td className="px-2 py-2 font-mono">{item.asset?.barcode || "—"}</td>
                      <td className="px-2 py-2">{itemResultLabel(item)}</td>
                      <td className="px-2 py-2">
                        {lifecycleLabel(item.asset?.operationalStatus || item.asset?.status)}
                      </td>
                      <td className="px-2 py-2">
                        {changedAfterSnapshot
                          ? rtl
                            ? "تغيرت الحالة بعد تثبيت قائمة الجرد"
                            : "Lifecycle changed after the Count snapshot"
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
      {countHistory.length > 0 && (
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="font-semibold">{rtl ? "سجل الجرد المغلق" : "Closed Count history"}</h2>
            <p className="text-sm text-slate-500">
              {rtl
                ? "قراءة فقط للأدلة المحفوظة؛ لا توجد إجراءات تعديل."
                : "Read-only preserved evidence; no mutation actions are available."}
            </p>
          </div>
          <div className="space-y-3">
            {countHistory.map((history) => {
              const historyTotals = countTotals(history);
              const historyLocation = locations.find((location) => location.id === history.locationId);
              return (
                <div key={history.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{history.auditNumber}</p>
                      <p className="text-sm text-slate-500">{historyLocation?.name || history.locationId}</p>
                    </div>
                    <Badge tone={countTone(history.status)}>{countStatusLabel(history.status)}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                    <div>
                      <span className="text-slate-500">{rtl ? "المتوقع" : "Expected"}</span>
                      <strong className="block">{historyTotals.expected}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{rtl ? "المعدود" : "Counted"}</span>
                      <strong className="block text-emerald-600">{historyTotals.counted}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{rtl ? "المفقود" : "Missing"}</span>
                      <strong className="block text-red-600">{historyTotals.missing}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{rtl ? "غير متوقع" : "Unexpected"}</span>
                      <strong className="block text-amber-600">{historyTotals.unexpected}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">{rtl ? "الفروقات" : "Variance"}</span>
                      <strong className="block text-amber-600">{historyTotals.variance}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
