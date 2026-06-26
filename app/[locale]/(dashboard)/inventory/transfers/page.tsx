"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRightLeft, Plus, CheckCircle2, Truck, Inbox, XCircle, AlertCircle, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { useErp } from "@/contexts/erp-context";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/settings-context";
import { useCoreErpData } from "@/hooks/use-core-erp-data";
import { apiClient } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import type { Transfer, TransferStatus } from "@/lib/types";
import { formatBranchDateTime } from "@/lib/dates/dates";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";
import { toEnglishDigits } from "@/lib/formatters/numbers";

export default function TransfersPage() {
  const locale = useLocale();
  const tCommon = useTranslations("Common");
  const tInventory = useTranslations("Inventory");
  const rtl = locale === "ar";
  const queryClient = useQueryClient();
  const { addTransfer, updateTransfer, updateAsset } = useErp();
  const { transfers, assets } = useCoreErpData();
  const { branches } = useAppSettings();
  const { activeBranch, activeBranchId, user } = useAuth();
  const isApi = DATA_SOURCE === "api";

  const [showAdd, setShowAdd] = useState(false);
  const [targetBranch, setTargetBranch] = useState("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const availableAssets = assets.filter(
    (asset) => (asset.branchId === activeBranchId || asset.branch === activeBranch) && asset.status === "available"
  );

  const createTransferMutation = useMutation({
    mutationFn: async () => {
      await apiClient("/transfers", {
        method: "POST",
        body: JSON.stringify({
          assetIds: selectedAssetIds,
          fromBranchId: activeBranchId,
          toBranchId: targetBranch,
          notes,
        }),
        locale,
      });
    },
    onSuccess: () => {
      invalidateAffectedQueries(queryClient, {
        entity: "Transfer",
        action: "create",
        branchId: activeBranchId,
        related: { assetIds: selectedAssetIds },
      });
    },
  });

  const updateTransferMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TransferStatus }) => {
      await apiClient(`/transfers/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        locale,
      });
    },
    onSuccess: (data, variables) => {
      const transfer = transfers.find((t) => t.id === variables.id);
      const assetIds = transfer?.assetIds || [];
      invalidateAffectedQueries(queryClient, {
        entity: "Transfer",
        action: variables.status,
        id: variables.id,
        branchId: activeBranchId,
        related: { assetIds },
      });
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBranch || selectedAssetIds.length === 0) return;

    if (isApi) {
      await createTransferMutation.mutateAsync();
      setTargetBranch("");
      setSelectedAssetIds([]);
      setNotes("");
      setShowAdd(false);
      return;
    }

    const target = branches.find((branch) => branch.id === targetBranch);
    const targetBranchName = target?.name || targetBranch;

    const newTransfer: Transfer = {
      id: `TR-${Date.now().toString().slice(-6)}`,
      assetIds: selectedAssetIds,
      fromBranch: activeBranch,
      toBranch: targetBranchName,
      requestedBy: user?.firstName || "System",
      requestedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      status: "pending",
      notes,
    };

    addTransfer(newTransfer);

    // Lock asset status to transferred
    selectedAssetIds.forEach((id) => {
      updateAsset(id, { status: "transferred" });
    });

    setTargetBranch("");
    setSelectedAssetIds([]);
    setNotes("");
    setShowAdd(false);
  };

  const handleUpdateStatus = async (id: string, status: TransferStatus) => {
    if (isApi) {
      await updateTransferMutation.mutateAsync({ id, status });
      return;
    }

    const transfer = transfers.find((t) => t.id === id);
    if (!transfer) return;

    const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const updates: Partial<Transfer> = { status };

    if (status === "approved") {
      updates.approvedBy = user?.firstName || "System";
      updates.approvedAt = timestamp;
    } else if (status === "in-transit") {
      // no extra fields
    } else if (status === "received") {
      updates.receivedBy = user?.firstName || "System";
      updates.receivedAt = timestamp;

      // Update actual location/branch of the assets
      transfer.assetIds.forEach((assetId) => {
        updateAsset(assetId, { branch: transfer.toBranch, status: "available" });
      });
    } else if (status === "cancelled") {
      updates.cancelReason = "Cancelled by user";
      // Restore assets to available at fromBranch
      transfer.assetIds.forEach((assetId) => {
        updateAsset(assetId, { status: "available" });
      });
    }

    updateTransfer(id, updates);
  };

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case "received":
        return <Badge tone="green">{rtl ? "تم الاستلام" : "Received"}</Badge>;
      case "in-transit":
        return <Badge tone="blue">{rtl ? "قيد النقل" : "In Transit"}</Badge>;
      case "approved":
        return <Badge tone="violet">{rtl ? "معتمد" : "Approved"}</Badge>;
      case "cancelled":
        return <Badge tone="rose">{rtl ? "ملغى" : "Cancelled"}</Badge>;
      case "pending":
      default:
        return <Badge tone="amber">{rtl ? "قيد الانتظار" : "Pending"}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy-950 dark:text-white lg:text-3xl">
            {rtl ? "نقل الفروع واللوجستيات" : "Branch Transfers & Logistics"}
          </h1>
          <p className="mt-1.5 text-slate-400 font-bold">
            {rtl
              ? "تتبع وإدارة شحنات البضائع المنقولة بين المعارض والمستودعات."
              : "Track and manage jewelry transfers between showrooms and warehouses."}
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} disabled={createTransferMutation.isPending || updateTransferMutation.isPending}>
          <Plus className="h-4 w-4" />
          {rtl ? "طلب نقل جديد" : "Request New Transfer"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_.45fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-black mb-4 flex items-center gap-1.5 text-navy-900 dark:text-white">
              <ArrowRightLeft className="h-4 w-4 text-brand-600" />
              {rtl ? "سجل التحويلات المنقولة" : "Transfers Log"}
            </h2>

            {transfers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>{rtl ? "لا توجد شحنات مسجلة حاليًا." : "No transfers registered currently."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-[11px]" aria-label="Transfers List">
                  <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 font-bold">
                    <tr>
                      <th className="px-4 py-2.5 text-start">ID</th>
                      <th className="px-4 py-2.5 text-start">{rtl ? "من فرع" : "From"}</th>
                      <th className="px-4 py-2.5 text-start">{rtl ? "إلى فرع" : "To"}</th>
                      <th className="px-4 py-2.5 text-start">{rtl ? "القطع" : "Assets"}</th>
                      <th className="px-4 py-2.5 text-start">{rtl ? "الحالة" : "Status"}</th>
                      <th className="px-4 py-2.5 text-start">{rtl ? "التاريخ" : "Requested At"}</th>
                      <th className="px-4 py-2.5 text-end">{tCommon("actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transfers.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/20">
                        <td className="px-4 py-3 font-mono font-bold text-foreground">{toEnglishDigits(item.id)}</td>
                        <td className="px-4 py-3 font-semibold">{item.fromBranch}</td>
                        <td className="px-4 py-3 font-semibold">{item.toBranch}</td>
                        <td className="px-4 py-3 text-slate-400 font-bold">{toEnglishDigits(item.assetIds.length)} pcs</td>
                        <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {toEnglishDigits(formatBranchDateTime(item.requestedAt, "Asia/Dubai", locale))}
                        </td>
                        <td className="px-4 py-3 text-end space-x-1.5 rtl:space-x-reverse">
                          {item.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-violet-600 hover:bg-violet-700 text-white"
                                disabled={updateTransferMutation.isPending}
                                onClick={() => handleUpdateStatus(item.id, "approved")}
                              >
                                {rtl ? "اعتماد" : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-rose-600 hover:bg-rose-50"
                                disabled={updateTransferMutation.isPending}
                                onClick={() => handleUpdateStatus(item.id, "cancelled")}
                              >
                                {rtl ? "إلغاء" : "Cancel"}
                              </Button>
                            </>
                          )}
                          {item.status === "approved" && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={updateTransferMutation.isPending}
                              onClick={() => handleUpdateStatus(item.id, "in-transit")}
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              {rtl ? "شحن" : "Ship"}
                            </Button>
                          )}
                          {item.status === "in-transit" && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={updateTransferMutation.isPending}
                              onClick={() => handleUpdateStatus(item.id, "received")}
                            >
                              <Inbox className="h-3 w-3 mr-1" />
                              {rtl ? "استلام" : "Receive"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div>
          {showAdd && (
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-black text-navy-900 dark:text-white">
                {rtl ? "تفاصيل طلب النقل" : "Transfer Request details"}
              </h3>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block label-base mb-1 font-bold">{rtl ? "الفرع المستهدف" : "Target Branch"}</label>
                  <NativeSelect
                    required
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                  >
                    <option value="">{rtl ? "اختر فرع..." : "Select branch..."}</option>
                    {branches
                      .filter((branch) => branch.isActive && branch.id !== activeBranchId)
                      .map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                  </NativeSelect>
                </div>

                <div>
                  <label className="block label-base mb-1 font-bold">
                    {rtl ? "الأصول المراد نقلها" : "Assets to Transfer"}
                  </label>
                  {availableAssets.length === 0 ? (
                    <p className="text-[10px] text-slate-400 py-1">{rtl ? "لا توجد أصول متاحة حالياً للنقل بهذا الفرع." : "No available assets at this branch."}</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-border rounded-xl p-2.5 space-y-2">
                      {availableAssets.map((asset) => (
                        <label key={asset.id} className="flex items-center gap-2 cursor-pointer py-0.5 hover:bg-slate-50 dark:hover:bg-navy-950/20">
                          <input
                            type="checkbox"
                            checked={selectedAssetIds.includes(asset.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssetIds([...selectedAssetIds, asset.id]);
                              } else {
                                setSelectedAssetIds(selectedAssetIds.filter((id) => id !== asset.id));
                              }
                            }}
                          />
                          <div>
                            <span className="font-semibold text-foreground">{asset.name}</span>
                            <span className="font-mono text-slate-400 font-bold ml-1">({asset.id})</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block label-base mb-1 font-bold">{rtl ? "ملاحظات الشحن" : "Shipping Notes"}</label>
                  <textarea
                    className="input-base h-16 py-2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={rtl ? "ملاحظات إضافية مثل السائق، رقم التتبع..." : "e.g. driver details, route..."}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
                    {tCommon("cancel")}
                  </Button>
                  <Button type="submit" disabled={!targetBranch || selectedAssetIds.length === 0 || createTransferMutation.isPending}>
                    {createTransferMutation.isPending ? (rtl ? "جار الإرسال..." : "Posting...") : (rtl ? "تأكيد طلب النقل" : "Post Transfer Request")}
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
