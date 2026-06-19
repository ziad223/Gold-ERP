"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { Scale, Plus, AlertTriangle, ShieldAlert, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { useAssets } from "@/features/assets/hooks/use-assets";
import { useErp } from "@/contexts/erp-context";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { apiClient } from "@/lib/api/client";
import { normalizeItems } from "@/lib/api/normalize";
import { DATA_SOURCE } from "@/lib/data-source";
import { formatBranchDateTime } from "@/lib/dates/dates";
import { queryKeys } from "@/lib/query-keys";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";
import type { AuditLog } from "@/lib/types";

export default function AdjustmentsPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const queryClient = useQueryClient();
  const { isAuthorized } = usePermissions();
  const { auditLogs: localAuditLogs, updateAsset: updateLocalAsset, addAuditLog } = useErp();
  const { assets } = useAssets();
  const { activeBranch, activeBranchId, user } = useAuth();
  const isApi = DATA_SOURCE === "api";

  const auditLogsQuery = useQuery<AuditLog[]>({
    queryKey: queryKeys.auditLogs,
    queryFn: async () => normalizeItems<AuditLog>(await apiClient("/audit-logs", { locale })),
    enabled: isApi,
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [adjustField, setAdjustField] = useState("grossWeight");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("weight-correction");
  const [notes, setNotes] = useState("");

  const hasAccess = isAuthorized("performInventoryAdjustments");
  const auditLogs = isApi ? auditLogsQuery.data ?? [] : localAuditLogs;

  // Filter assets in the current branch to adjust
  const availableAssets = assets.filter((asset) => asset.branch === activeBranch || asset.branchId === activeBranchId);

  // Filter audit logs for adjustment actions
  const adjustments = auditLogs.filter((log) => log.action === "adjustment");

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  const adjustmentMutation = useMutation({
    mutationFn: async ({ assetId, updates, auditEntry }: { assetId: string; updates: Record<string, number>; auditEntry: AuditLog }) => {
      await apiClient(`/assets/${encodeURIComponent(assetId)}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
        locale,
      });
      await apiClient("/audit-logs", {
        method: "POST",
        body: JSON.stringify(auditEntry),
        locale,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAffectedQueries(queryClient, {
        entity: "Asset",
        action: "update",
        id: variables.assetId,
        branchId: activeBranchId,
        related: { assetId: variables.assetId },
      });
      invalidateAffectedQueries(queryClient, {
        entity: "AuditLog",
        action: "create",
        id: variables.auditEntry.id,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !newValue.trim() || !selectedAsset) return;

    const beforeVal = String((selectedAsset as any)[adjustField] ?? "—");
    const numValue = Number(newValue);

    const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const auditEntry: AuditLog = {
      id: `AUD-ADJ-${Date.now()}`,
      action: "adjustment",
      description: `${rtl ? "تعديل حقل" : "Adjusted field"} ${adjustField} ${rtl ? "للأصل" : "on asset"} ${selectedAssetId}. ${rtl ? "السبب:" : "Reason:"} ${reason}`,
      user: user?.firstName || "System",
      userId: user?.id,
      place: activeBranch,
      branch: activeBranch,
      date: timestamp,
      before: beforeVal,
      after: String(newValue),
      device: "Web Browser",
      severity: "warning",
      sourceDocument: reason.toUpperCase(),
    };

    const updates = { [adjustField]: numValue };
    if (isApi) {
      await adjustmentMutation.mutateAsync({ assetId: selectedAssetId, updates, auditEntry });
    } else {
      updateLocalAsset(selectedAssetId, updates);
      addAuditLog(auditEntry);
    }

    setSelectedAssetId("");
    setNewValue("");
    setNotes("");
    setShowForm(false);
  };

  if (!hasAccess) {
    return (
      <Card className="p-10 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-base font-black text-rose-600">
          {rtl ? "غير مصرح بالدخول" : "Unauthorized Access"}
        </h2>
        <p className="text-slate-400 font-bold text-xs max-w-sm mx-auto">
          {rtl
            ? "ليست لديك الصلاحيات الكافية لإجراء التعديلات المخزنية. تتطلب هذه العملية صلاحية performInventoryAdjustments."
            : "You do not have the required permissions to perform inventory adjustments. This requires performInventoryAdjustments."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy-950 dark:text-white lg:text-3xl">
            {rtl ? "التسويات وتعديلات المخزون" : "Inventory Adjustments & Balances"}
          </h1>
          <p className="mt-1.5 text-slate-400 font-bold">
            {rtl
              ? "تصحيح الفروقات وتعديل أوزان وأسعار الأصول يدوياً مع تسجيل كامل لسجل التدقيق."
              : "Manually adjust asset weights and cost metrics with complete audit tracking."}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={adjustmentMutation.isPending}>
          <Plus className="h-4 w-4" />
          {rtl ? "تسوية مخزنية جديدة" : "New Adjustment"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_.45fr]">
        <Card className="p-5">
          <h2 className="text-sm font-black mb-4 flex items-center gap-1.5 text-navy-900 dark:text-white">
            <Scale className="h-4 w-4 text-brand-600" />
            {rtl ? "سجل التسويات المخزنية" : "Adjustments Audit Trail"}
          </h2>

          {adjustments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p>{rtl ? "لا توجد تسويات مسجلة حاليًا." : "No adjustments logged currently."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-[11px]" aria-label="Adjustments Log">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 font-bold">
                  <tr>
                    <th className="px-4 py-2.5 text-start">{rtl ? "التسوية" : "Audit ID"}</th>
                    <th className="px-4 py-2.5 text-start">{rtl ? "الوصف" : "Adjustment"}</th>
                    <th className="px-4 py-2.5 text-start">{rtl ? "القيمة السابقة" : "Before"}</th>
                    <th className="px-4 py-2.5 text-start">{rtl ? "القيمة الجديدة" : "After"}</th>
                    <th className="px-4 py-2.5 text-start">{rtl ? "بواسطة" : "User"}</th>
                    <th className="px-4 py-2.5 text-start">{rtl ? "تاريخ التعديل" : "Date"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {adjustments.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/20">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">{log.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{log.description}</td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-600">{log.before}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600">{log.after}</td>
                      <td className="px-4 py-3 font-semibold">{log.user}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {formatBranchDateTime(log.date, "Asia/Dubai", locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div>
          {showForm && (
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-black text-navy-900 dark:text-white">
                {rtl ? "إنشاء تسوية جديدة" : "New Adjustment Form"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block label-base mb-1 font-bold">{rtl ? "اختر الأصل" : "Select Asset"}</label>
                  <NativeSelect
                    required
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                  >
                    
                    <option value="">{rtl ? "اختر الأصل..." : "Select asset..."}</option>
                    {availableAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.id})
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                {selectedAsset && (
                  <div className="bg-slate-50 dark:bg-navy-950/30 p-3 rounded-xl space-y-1.5 text-[10px] text-slate-500 font-semibold border border-border">
                    <p>{rtl ? `الوزن الحالي: ${selectedAsset.grossWeight} جم` : `Current Weight: ${selectedAsset.grossWeight} g`}</p>
                    <p>{rtl ? `سعر البيع الحالي: ${selectedAsset.price} د.إ` : `Current Sale Price: AED ${selectedAsset.price}`}</p>
                    <p>{rtl ? `التكلفة الحالية: ${selectedAsset.cost} د.إ` : `Current Cost: AED ${selectedAsset.cost}`}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block label-base mb-1 font-bold">{rtl ? "حقل التعديل" : "Adjustment Field"}</label>
                    <NativeSelect
                      value={adjustField}
                      onChange={(e) => setAdjustField(e.target.value)}
                    >
                      <option value="grossWeight">{rtl ? "الوزن الإجمالي" : "Gross Weight"}</option>
                      <option value="netWeight">{rtl ? "الوزن الصافي" : "Net Weight"}</option>
                      <option value="price">{rtl ? "سعر البيع" : "Sale Price"}</option>
                      <option value="cost">{rtl ? "سعر التكلفة" : "Cost Price"}</option>
                    </NativeSelect>
                  </div>

                  <div>
                    <label className="block label-base mb-1 font-bold">{rtl ? "القيمة الجديدة" : "New Value"}</label>
                    <input
                      type="number"
                      step="any"
                      required
                      className="input-base text-xs"
                      placeholder="e.g. 15.5"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block label-base mb-1 font-bold">{rtl ? "سبب التسوية" : "Adjustment Reason"}</label>
                  <NativeSelect
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="weight-correction">{rtl ? "تصحيح وزن معتمد" : "Weight Correction"}</option>
                    <option value="entry-error">{rtl ? "خطأ إدخال البيانات" : "Data Entry Error"}</option>
                    <option value="quality-inspection">{rtl ? "جرد وفحص الجودة" : "Quality Inspection Audit"}</option>
                    <option value="management-approval">{rtl ? "قرار إداري معتمد" : "Management Mandated"}</option>
                    <option value="other">{rtl ? "أخرى" : "Other"}</option>
                  </NativeSelect>
                </div>

                <div>
                  <label className="block label-base mb-1 font-bold">{rtl ? "ملاحظات وتبرير" : "Justification Notes"}</label>
                  <textarea
                    className="input-base h-16 py-2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={rtl ? "اكتب تبريراً للتعديل للتفتيش..." : "Explain adjustment reason for audits..."}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                    {rtl ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button type="submit" disabled={adjustmentMutation.isPending}>
                    <CheckCircle className="h-4 w-4" />
                    {adjustmentMutation.isPending ? (rtl ? "جار الحفظ..." : "Posting...") : (rtl ? "حفظ التسوية" : "Post Adjustment")}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
