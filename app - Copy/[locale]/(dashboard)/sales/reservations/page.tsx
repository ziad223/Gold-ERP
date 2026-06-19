"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Plus, CheckCircle2, AlertCircle, Bookmark, BookmarkX, ShoppingBag, Calendar, User, DollarSign } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { NativeSelect } from "@/components/ui/native-select";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { useAppSettings } from "@/contexts/settings-context";
import { useCoreErpData } from "@/hooks/use-core-erp-data";
import { Link } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import { formatCurrency } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";
import type { Asset, Invoice } from "@/lib/types";

export default function ReservationsPage() {
  const t = useTranslations("Sales");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const queryClient = useQueryClient();
  const { company, activeBranch, activeBranchId, user } = useAuth();
  const { addInvoice, updateAssetWithEvent } = useErp();
  const { settings } = useAppSettings();
  const { assets, customers } = useCoreErpData();
  const isApi = DATA_SOURCE === "api";

  const [openModal, setOpenModal] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [deposit, setDeposit] = useState("");
  const [expDate, setExpDate] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const currency = company?.currency ?? "AED";
  const money = (value: number) => formatCurrency(value, currency, locale);
  const BackIcon = rtl ? ArrowRight : ArrowLeft;

  // Active reservations list
  const reservedAssets = useMemo(() => {
    return assets.filter((asset) => asset.status === "reserved" && (asset.branch === activeBranch || asset.branchId === activeBranchId));
  }, [assets, activeBranch, activeBranchId]);

  // Available assets to reserve
  const availableAssets = useMemo(() => {
    return assets.filter((asset) => asset.status === "available" && (asset.branch === activeBranch || asset.branchId === activeBranchId));
  }, [assets, activeBranch, activeBranchId]);

  const reservationMutation = useMutation({
    mutationFn: async ({ targetAsset, targetCustomer, depositNum, timestamp }: { targetAsset: Asset; targetCustomer: any; depositNum: number; timestamp: string }) => {
      const reservationId = `RES-${Date.now()}`;
      await apiClient("/reservations", {
        method: "POST",
        locale,
        body: JSON.stringify({
          id: reservationId,
          assetId: targetAsset.id,
          assetName: targetAsset.name,
          customerId: targetCustomer.id,
          customerName: targetCustomer.name,
          branch: activeBranch,
          deposit: depositNum,
          expiresAt: expDate,
          status: "active",
          notes: `${rtl ? "حجز أصل" : "Asset reservation"} ${targetAsset.id}`,
        }),
      });
      await apiClient(`/assets/${encodeURIComponent(targetAsset.id)}`, {
        method: "PATCH",
        locale,
        body: JSON.stringify({ status: "reserved" }),
      });
      if (depositNum > 0) {
        await apiClient("/sales/invoices/draft", {
          method: "POST",
          locale,
          body: JSON.stringify({
            id: `DEP-${Date.now()}`,
            type: "deposit",
            customerId: targetCustomer.id,
            customerName: targetCustomer.name,
            date: timestamp,
            subtotal: depositNum,
            total: depositNum,
            vatRate: Number(settings.vatRate) || 0,
            tax: Math.round(depositNum * ((Number(settings.vatRate) || 0) / 100) * 100) / 100,
            status: "partial",
            paymentMethod: "Cash",
            branch: activeBranch,
            branchId: activeBranchId,
            items: [{
              assetId: targetAsset.id,
              name: `${rtl ? "عربون حجز: " : "Reservation Deposit: "} ${targetAsset.name}`,
              quantity: 1,
              price: depositNum,
            }],
          }),
        });
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations });
      invalidateAffectedQueries(queryClient, {
        entity: "Asset",
        action: "update",
        id: variables.targetAsset.id,
        branchId: activeBranchId,
        related: {
          assetId: variables.targetAsset.id,
          customerId: variables.targetCustomer.id,
        },
      });
      if (variables.depositNum > 0) {
        invalidateAffectedQueries(queryClient, {
          entity: "Invoice",
          action: "create",
          related: {
            customerId: variables.targetCustomer.id,
            assetIds: [variables.targetAsset.id],
          },
        });
      }
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (assetId: string) => {
      await apiClient(`/assets/${encodeURIComponent(assetId)}`, {
        method: "PATCH",
        locale,
        body: JSON.stringify({ status: "available" }),
      });
    },
    onSuccess: (_data, releasedAssetId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations });
      invalidateAffectedQueries(queryClient, {
        entity: "Asset",
        action: "update",
        id: releasedAssetId,
        branchId: activeBranchId,
        related: { assetId: releasedAssetId },
      });
    },
  });

  // Set default values when opening the modal
  const handleOpenNewReservation = () => {
    if (customers.length > 0) setCustomerId(customers[0].id);
    if (availableAssets.length > 0) setAssetId(availableAssets[0].id);
    setDeposit("");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    setExpDate(tomorrow.toISOString().slice(0, 10));
    setOpenModal(true);
  };

  const handlePostReservation = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const targetAsset = assets.find((a) => a.id === assetId);
    const targetCustomer = customers.find((c) => c.id === customerId);
    const depositNum = Number(deposit) || 0;

    if (!targetAsset || !targetCustomer) {
      setErrorMsg(rtl ? "برجاء التأكد من اختيار العميل والأصل المراد حجزه." : "Please make sure to select both customer and asset.");
      return;
    }

    try {
      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");

      if (isApi) {
        await reservationMutation.mutateAsync({ targetAsset, targetCustomer, depositNum, timestamp });
        setSuccessMsg(
          rtl
            ? `تم حجز الأصل ${targetAsset.name} بنجاح للعميل ${targetCustomer.name}.`
            : `Asset ${targetAsset.name} reserved successfully for ${targetCustomer.name}.`
        );
        setOpenModal(false);
        return;
      }

      // ✅ Immutable update via ErpContext
      updateAssetWithEvent(
        targetAsset.id,
        { status: "reserved" },
        {
          id: `EV-RES-${Date.now()}`,
          action: rtl ? "حجز الأصل" : "RESERVED",
          date: timestamp,
          user: user?.firstName || "System",
          branch: activeBranch,
          note: `${rtl ? "حجز للعميل " : "Reserved for customer: "} ${targetCustomer.name}. ${rtl ? "العربون: " : "Deposit: "} ${money(depositNum)}. ${rtl ? "تاريخ انتهاء الحجز: " : "Expires: "} ${expDate}`,
          beforeState: "status:available",
          afterState: "status:reserved",
          severity: "info",
        },
      );

      // Create a deposit/partial invoice for record keeping
      if (depositNum > 0) {
        const invId = `DEP-${10000 + Math.floor(Math.random() * 9000)}`;
        const depositInvoice: Invoice = {
          id: invId,
          customerId: targetCustomer.id,
          customerName: targetCustomer.name,
          date: timestamp,
          total: depositNum,
          vatRate: Number(settings.vatRate) || 0,
          tax: Math.round(depositNum * ((Number(settings.vatRate) || 0) / 100) * 100) / 100,
          status: "partial",
          paymentMethod: "Cash",
          branch: activeBranch,
          items: [
            {
              assetId: targetAsset.id,
              name: `${rtl ? "عربون حجز: " : "Reservation Deposit: "} ${targetAsset.name}`,
              quantity: 1,
              price: depositNum,
            },
          ],
        };
        addInvoice(depositInvoice);
      }

      setSuccessMsg(
        rtl
          ? `تم حجز الأصل ${targetAsset.name} بنجاح للعميل ${targetCustomer.name}.`
          : `Asset ${targetAsset.name} reserved successfully for ${targetCustomer.name}.`
      );
      setOpenModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to post reservation.");
    }
  };

  const handleCancelReservation = async (asset: Asset) => {
    try {
      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      if (isApi) {
        await releaseMutation.mutateAsync(asset.id);
        setSuccessMsg(
          rtl
            ? `تم إلغاء حجز القطعة ${asset.name} وإعادتها للمخزون.`
            : `Reservation released for ${asset.name}.`
        );
        return;
      }

      // ✅ Immutable cancel via ErpContext
      updateAssetWithEvent(
        asset.id,
        { status: "available" },
        {
          id: `EV-RES-CAN-${Date.now()}`,
          action: rtl ? "إلغاء الحجز" : "RELEASED",
          date: timestamp,
          user: user?.firstName || "System",
          branch: activeBranch,
          note: rtl ? "تم إلغاء الحجز يدوياً وإعادة القطعة للمخزون المتاح" : "Reservation cancelled manually and item returned to stock",
          beforeState: "status:reserved",
          afterState: "status:available",
          severity: "info",
        },
      );
      setSuccessMsg(
        rtl
          ? `تم إلغاء حجز القطعة ${asset.name} وإعادتها للمخزون.`
          : `Reservation released for ${asset.name}.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to cancel reservation.");
    }
  };

  return (

    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/sales" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-brand-700">
            <BackIcon className="h-4 w-4" />{t("back") || "Back to sales"}
          </Link>
          <h1 className="text-2xl font-black text-foreground lg:text-3xl">
            {rtl ? "حجوزات الأصول والعربون" : "Asset Reservations & Deposits"}
          </h1>
          <p className="text-xs text-muted mt-1">
            {rtl ? "إدارة حجز قطع المجوهرات للعملاء بموجب دفعة عربون مقدمة" : "Manage asset reservations and track customer advance deposit balances."}
          </p>
        </div>
        <div>
          <Button onClick={handleOpenNewReservation} disabled={availableAssets.length === 0}>
            <Plus className="h-4 w-4" />
            {rtl ? "حجز قطعة جديد" : "New Asset Reservation"}
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid of reserved items */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {reservedAssets.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center text-muted text-xs">
              {rtl ? "لا توجد قطع محجوزة حالياً في هذا الفرع." : "No assets currently reserved in this branch."}
            </Card>
          </div>
        ) : (
          reservedAssets.map((asset) => {
            const reservationEvent = [...asset.events].reverse().find((e) => e.action === "RESERVED");
            return (
              <Card key={asset.id} className="p-5 flex flex-col justify-between space-y-4 hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-panel transition">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300">
                      <Bookmark className="h-5 w-5" />
                    </span>
                    <Badge tone="amber">{rtl ? "محجوزة" : "Reserved"}</Badge>
                  </div>
                  <h3 className="mt-3 font-black text-foreground text-sm">{asset.name}</h3>
                  <p className="text-[10px] text-muted mt-1">{asset.id} · {asset.karat}K · {asset.grossWeight}g</p>

                  <div className="mt-4 space-y-2 text-xs border-t border-dashed border-border pt-3">
                    {reservationEvent && (
                      <>
                        <p className="flex items-center gap-1.5 text-muted">
                          <User className="h-3.5 w-3.5 text-muted/80" />
                          <span>{reservationEvent.note?.split(".")[0] || ""}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-muted">
                          <DollarSign className="h-3.5 w-3.5 text-muted/80" />
                          <span>{reservationEvent.note?.split(".")[1] || ""}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-destructive font-bold">
                          <Calendar className="h-3.5 w-3.5 text-rose-500" />
                          <span>{reservationEvent.note?.split(".")[2] || ""}</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" className="flex-1 text-xs" size="sm" onClick={() => handleCancelReservation(asset)}>
                    <BookmarkX className="h-3.5 w-3.5" />
                    {rtl ? "إلغاء الحجز" : "Cancel"}
                  </Button>
                  <Link href="/pos" className="flex-1">
                    <Button className="w-full text-xs" size="sm">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {rtl ? "بيع القطعة" : "Complete Sale"}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* New Reservation Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title={rtl ? "تسجيل حجز قطعة ذهب" : "Create New Asset Reservation"} description={rtl ? "حجز أصل متاح للعميل مقابل عربون محدد" : "Reserve an available asset for a customer and record the deposit."}>
        <form onSubmit={handlePostReservation} className="space-y-4">
          <label className="block">
            <span className="label-base">{rtl ? "اختر العميل" : "Select Customer"}</span>
            <NativeSelect value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.filter(c => c.status !== "inactive").map((c) => (
                <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
              ))}
            </NativeSelect>
          </label>

          <label className="block">
            <span className="label-base">{rtl ? "اختر الأصل المتوفر" : "Select Asset"}</span>
            <NativeSelect value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              {availableAssets.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({money(a.price)})</option>
              ))}
            </NativeSelect>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="label-base">{rtl ? "مبلغ العربون المستلم" : "Deposit Paid"}</span>
              <input type="number" min="0" required placeholder="0" className="input-base" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "تاريخ انتهاء الحجز" : "Expiry Date"}</span>
              <input type="date" required className="input-base" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setOpenModal(false)}>{common("cancel")}</Button>
            <Button type="submit">{rtl ? "تأكيد الحجز" : "Confirm Reservation"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
