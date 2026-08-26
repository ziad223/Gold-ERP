"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { apiClient, DarfusApiError } from "@/lib/api/client";
import { revisionErrorMessage } from "@/lib/inventory/revision-ui";
import { formatDateTime } from "@/lib/dates/dates";

type RevisionActor = {
  technicalUserId?: string | null;
  employeeId?: string | null;
  employeeCode?: string | null;
  employeeName?: string | null;
};

type RevisionListItem = {
  revisionId: string;
  assetId: string;
  revisionNo: number;
  occurredAt: string;
  reason: string;
  sourceOperation: string;
  actor: RevisionActor;
  changeCount: number;
};

type RevisionDetail = RevisionListItem & {
  sourceReference?: string | null;
  changes: Array<{
    fieldKey: string;
    oldValue: unknown;
    newValue: unknown;
    valueType: string;
    authorityType: string;
    dedicatedOperationReference?: string | null;
  }>;
};

type AssetRevisionPanelProps = {
  assetId: string;
  branchId?: string | null;
  canView: boolean;
  refreshToken: number;
};

function unwrap<T>(response: { data?: T } | T): T {
  return ((response as { data?: T })?.data ?? response) as T;
}

function actorLabel(actor: RevisionActor, isEn: boolean): string {
  const values = [actor.employeeName, actor.employeeCode, actor.technicalUserId].filter(Boolean).map(String);
  return values.length ? values.join(" · ") : (isEn ? "System actor" : "مستخدم النظام");
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function apiErrorMessage(error: unknown, locale: "ar" | "en"): string {
  if (error instanceof DarfusApiError) {
    return revisionErrorMessage(error.errorCode, locale) || error.message;
  }
  return locale === "en" ? "Could not load Revision history." : "تعذر تحميل سجل Revision.";
}

export function AssetRevisionPanel({ assetId, branchId, canView, refreshToken }: AssetRevisionPanelProps) {
  const locale = useLocale() === "en" ? "en" : "ar";
  const isEn = locale === "en";
  const t = useTranslations("AssetDetails");
  const [items, setItems] = useState<RevisionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<RevisionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const load = async () => {
    if (!canView || !branchId) return;
    setLoading(true);
    setError("");
    try {
      const response = await apiClient<{ data: { items: RevisionListItem[] } }>(
        `/inventory-v2/assets/${encodeURIComponent(assetId)}/revisions?limit=50`,
        { locale, branchId },
      );
      setItems(unwrap(response).items || []);
    } catch (loadError) {
      setError(apiErrorMessage(loadError, locale));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // refreshToken changes only after an intentional accepted revision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId, branchId, canView, refreshToken]);

  const openDetail = async (revisionId: string) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      const response = await apiClient<{ data: RevisionDetail }>(
        `/inventory-v2/assets/${encodeURIComponent(assetId)}/revisions/${encodeURIComponent(revisionId)}`,
        { locale, branchId: branchId || undefined },
      );
      setSelected(unwrap(response));
    } catch (detailLoadError) {
      setDetailError(apiErrorMessage(detailLoadError, locale));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <Card className="p-5" data-testid="asset-revision-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-navy-950 dark:text-white">{t("revisionTitle")}</h2>
          <p className="mt-1 text-[10px] leading-5 text-slate-500">{t("revisionDescription")}</p>
        </div>
        {canView && <Button size="sm" variant="secondary" onClick={() => void load()} disabled={loading}>{t("revisionRefresh")}</Button>}
      </div>

      {!canView ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{t("revisionNoAccess")}</p>
      ) : loading && !items.length ? (
        <LoadingState variant="inline" />
      ) : error ? (
        <ErrorState className="mt-4" message={error} onRetry={() => void load()} />
      ) : !items.length ? (
        <div className="mt-4"><EmptyState title={t("revisionEmpty")} description={t("revisionEmptyDescription")} /></div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-start text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950">
              <tr>
                <th className="px-3 py-2">{t("revisionNumber")}</th>
                <th className="px-3 py-2">{t("revisionDate")}</th>
                <th className="px-3 py-2">{t("revisionReason")}</th>
                <th className="px-3 py-2">{t("revisionSource")}</th>
                <th className="px-3 py-2">{t("revisionActor")}</th>
                <th className="px-3 py-2">{t("revisionChangeCount")}</th>
                <th className="px-3 py-2"><span className="sr-only">{t("revisionDetail")}</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.revisionId} className="border-t border-border">
                  <td className="px-3 py-3 font-mono" dir="ltr">v{item.revisionNo}</td>
                  <td className="whitespace-nowrap px-3 py-3" dir="ltr">{formatDateTime(item.occurredAt, "Asia/Dubai", locale)}</td>
                  <td className="max-w-xs px-3 py-3">{item.reason}</td>
                  <td className="px-3 py-3 font-mono" dir="ltr">{item.sourceOperation}</td>
                  <td className="px-3 py-3">{actorLabel(item.actor, isEn)}</td>
                  <td className="px-3 py-3" dir="ltr"><Badge tone="slate">{item.changeCount}</Badge></td>
                  <td className="px-3 py-3"><Button size="sm" variant="secondary" onClick={() => void openDetail(item.revisionId)}>{t("revisionDetail")}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailError && <p className="mt-3 text-xs text-rose-600">{detailError}</p>}
      <Modal open={Boolean(selected) || detailLoading} onClose={() => { if (!detailLoading) setSelected(null); }} title={t("revisionDetail")} description={selected ? `${t("revisionNumber")}: v${selected.revisionNo}` : t("loadingRevision")}>
        {detailLoading ? <LoadingState variant="inline" /> : selected ? <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className="text-[10px] text-slate-400">{t("revisionReason")}</p><p className="mt-1 font-bold">{selected.reason}</p></div>
            <div><p className="text-[10px] text-slate-400">{t("revisionDate")}</p><p className="mt-1 font-mono" dir="ltr">{formatDateTime(selected.occurredAt, "Asia/Dubai", locale)}</p></div>
            <div><p className="text-[10px] text-slate-400">{t("revisionSource")}</p><p className="mt-1 font-mono" dir="ltr">{selected.sourceOperation}</p></div>
            <div><p className="text-[10px] text-slate-400">{t("revisionActor")}</p><p className="mt-1">{actorLabel(selected.actor, isEn)}</p></div>
            {selected.sourceReference && <div><p className="text-[10px] text-slate-400">{t("revisionSourceReference")}</p><p className="mt-1 font-mono" dir="ltr">{selected.sourceReference}</p></div>}
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950"><tr><th className="px-3 py-2">{t("revisionField")}</th><th className="px-3 py-2">{t("revisionOldValue")}</th><th className="px-3 py-2">{t("revisionNewValue")}</th></tr></thead>
              <tbody>{selected.changes.map((change) => <tr key={change.fieldKey} className="border-t border-border"><td className="px-3 py-3 font-semibold">{change.fieldKey}</td><td className="px-3 py-3" dir="ltr">{displayValue(change.oldValue)}</td><td className="px-3 py-3" dir="ltr">{displayValue(change.newValue)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="flex justify-end"><Button variant="secondary" onClick={() => setSelected(null)}>{t("revisionClose")}</Button></div>
        </div> : null}
      </Modal>
    </Card>
  );
}
