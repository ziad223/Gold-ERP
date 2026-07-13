"use client";

import { useMemo, useRef, useState } from "react";
import type React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, Bookmark, Calendar, CheckCircle2, DollarSign, FileText, Plus, RefreshCw, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { NativeSelect } from "@/components/ui/native-select";
import { useAuth } from "@/contexts/auth-context";
import { useCoreErpData } from "@/hooks/use-core-erp-data";
import { useAppSettings } from "@/contexts/settings-context";
import { usePermissions } from "@/hooks/use-permissions";
import { Link } from "@/i18n/navigation";
import { apiClient, generateUUID } from "@/lib/api/client";
import { DATA_SOURCE } from "@/lib/data-source";
import { formatCurrency } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { invalidateAffectedQueries } from "@/lib/realtime/invalidate-affected-queries";
import type { Asset } from "@/lib/types";

type ReservationItem = {
  id: string;
  assetId: string;
  assetName?: string;
  agreedPrice: number | string;
  status: string;
};

type ReservationPayment = {
  id: string;
  amount: number | string;
  status: string;
  receiptNumber?: string;
  paymentMethod?: string;
  receivedAt?: string;
};

type ReservationRefund = {
  id: string;
  amount: number | string;
  status: "requested" | "approved" | "rejected" | "executed" | string;
  refundType?: "reservation_full" | "renewal_excess" | string;
  renewalId?: string | null;
  requestedRefundMethod?: string;
  treasuryAccountCode?: string;
  methodDiffersFromOriginal?: boolean;
  methodOverrideApproved?: boolean;
  reason?: string;
  requestedBy?: string;
  requestedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  executedBy?: string;
  executedAt?: string;
  journalEntryId?: string;
  cashTransactionId?: string;
};

type ReservationAmendment = {
  id: string;
  amendmentType: string;
  reason?: string;
  beforeTotal?: number | string;
  afterTotal?: number | string;
  beforeStatus?: string;
  afterStatus?: string;
  createdBy?: string;
  createdAt?: string;
};

type ReservationExpiryExtension = {
  id: string;
  oldExpiry?: string;
  newExpiry?: string;
  reason?: string;
  extendedBy?: string;
  extendedAt?: string;
};

type ReservationRenewalRecord = {
  id: string;
  sourceReservationId?: string;
  successorReservationId?: string;
  sourceTransferableBalance?: number | string;
  successorTotal?: number | string;
  transferAmount?: number | string;
  excessRefundAmount?: number | string;
  excessRefundId?: string | null;
  status?: string;
};

type ReservationAuditEvent = {
  id: string;
  action: string;
  description?: string;
  user?: string;
  date?: string;
  severity?: string;
  before?: Record<string, unknown> | string | null;
  after?: Record<string, unknown> | string | null;
};

type Reservation = {
  id: string;
  customerName: string;
  branch?: string;
  branchId?: string;
  currency?: string;
  status: string;
  agreedTotal: number | string;
  paidTotal: number | string;
  remainingTotal: number | string;
  excessTotal?: number | string;
  expiresAt?: string;
  createdAt?: string;
  createdBy?: string;
  finalInvoiceId?: string | null;
  completedAt?: string | null;
  completedBy?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  refundedAt?: string | null;
  refundStatus?: string | null;
  expiredBySystem?: boolean;
  expiredAt?: string | null;
  expiryCancellationReason?: string | null;
  extensionCount?: number;
  lastExtendedAt?: string | null;
  predecessorReservationId?: string | null;
  successorReservationId?: string | null;
  renewalStatus?: string | null;
  isLegacy?: boolean;
  workflowVersion?: number;
  items?: ReservationItem[];
  payments?: ReservationPayment[];
  refunds?: ReservationRefund[];
  amendments?: ReservationAmendment[];
  expiryExtensions?: ReservationExpiryExtension[];
  renewalsAsSource?: ReservationRenewalRecord[];
};

type ApiList<T> = { success: boolean; data?: T[]; items?: T[] };
type ApiOne<T> = { success: boolean; data: T };

export default function ReservationsPage() {
  const t = useTranslations("Sales");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const queryClient = useQueryClient();
  const { company, activeBranch, activeBranchId, user } = useAuth();
  const { hasPermission } = usePermissions();
  const { assets, customers } = useCoreErpData();
  const { settings } = useAppSettings();
  const reservationAccountConfigured = Boolean(settings?.reservationAdvancesAccountId);
  const isApi = DATA_SOURCE === "api";

  const [openModal, setOpenModal] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [deposit, setDeposit] = useState("");
  const [depositMethod, setDepositMethod] = useState("cash");
  const [expDate, setExpDate] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const reservationIdempotencyKeyRef = useRef("");

  // Phase 32.6-Fix C — amendment and renewal modal state.
  const [amendTarget, setAmendTarget] = useState<Reservation | null>(null);
  const [amendAddIds, setAmendAddIds] = useState<string[]>([]);
  const [amendRemoveIds, setAmendRemoveIds] = useState<string[]>([]);
  const [amendRepriceIds, setAmendRepriceIds] = useState<string[]>([]);
  const [amendReason, setAmendReason] = useState("");
  const [renewSource, setRenewSource] = useState<Reservation | null>(null);
  const [renewAssetIds, setRenewAssetIds] = useState<string[]>([]);
  const [renewExpiry, setRenewExpiry] = useState("");
  const [renewReason, setRenewReason] = useState("");
  const [renewRefundMethod, setRenewRefundMethod] = useState("cash");
  const [laterPaymentAmount, setLaterPaymentAmount] = useState("");
  const [laterPaymentMethod, setLaterPaymentMethod] = useState("cash");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterSalesperson, setFilterSalesperson] = useState("");
  const [filterCreatedFrom, setFilterCreatedFrom] = useState("");
  const [filterCreatedTo, setFilterCreatedTo] = useState("");
  const [filterExpiryFrom, setFilterExpiryFrom] = useState("");
  const [filterExpiryTo, setFilterExpiryTo] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [filterRefundStatus, setFilterRefundStatus] = useState("all");
  const [filterRenewalStatus, setFilterRenewalStatus] = useState("all");

  const currency = company?.currency ?? "AED";
  const money = (value: number | string | undefined | null) => formatCurrency(Number(value || 0), currency, locale);
  const BackIcon = rtl ? ArrowRight : ArrowLeft;

  const canViewAudit = hasPermission("reservations.audit_view") || hasPermission("audit.view");
  const canViewReports = hasPermission("reservations.reports_view") || hasPermission("reports.view");
  const canRecordPayment = hasPermission("reservations.record_payment") || hasPermission("sales.create");
  const canCompleteSale = hasPermission("reservations.complete_sale") || hasPermission("sales.create");
  const canCancelReservation = hasPermission("reservations.cancel") || hasPermission("sales.approve");
  const canRequestRefund = hasPermission("reservations.refund_request") || hasPermission("sales.approve");
  const canApproveRefund = hasPermission("reservations.refund_approve") || hasPermission("approvals.manage");
  const canRejectRefund = hasPermission("reservations.refund_reject") || hasPermission("approvals.manage");
  const canExecuteRefund = hasPermission("reservations.refund_execute") || hasPermission("treasury.update");
  const canAmendItems = hasPermission("reservations.amend_items") || hasPermission("sales.approve");
  const canRepriceItems = hasPermission("reservations.reprice_items");
  const canExtendExpiry = hasPermission("reservations.extend_expiry") || hasPermission("sales.approve");
  const canRenew = hasPermission("reservations.renew") || hasPermission("sales.approve");
  const canApproveRenewalRefund = hasPermission("reservations.refund_approve") || hasPermission("approvals.manage");
  const canExecuteRenewalRefund = hasPermission("reservations.refund_execute") || hasPermission("treasury.update");

  const availableAssets = useMemo(() => {
    return assets.filter((asset) => asset.status === "available" && (asset.branch === activeBranch || asset.branchId === activeBranchId));
  }, [assets, activeBranch, activeBranchId]);

  const reservedAssets = useMemo(() => {
    return assets.filter((asset) => asset.status === "reserved" && (asset.branch === activeBranch || asset.branchId === activeBranchId));
  }, [assets, activeBranch, activeBranchId]);

  const reservationsQuery = useQuery({
    queryKey: queryKeys.reservations,
    enabled: isApi,
    queryFn: async () => {
      const response = await apiClient<ApiList<Reservation>>("/reservations?pageSize=200", { locale });
      return response.data ?? response.items ?? [];
    },
  });

  const reservationDetailQuery = useQuery({
    queryKey: ["reservation-detail", selectedReservationId],
    enabled: isApi && Boolean(selectedReservationId),
    queryFn: async () => {
      const response = await apiClient<ApiOne<Reservation>>(`/reservations/${encodeURIComponent(selectedReservationId || "")}`, { locale });
      return response.data;
    },
  });

  const reservationAuditQuery = useQuery({
    queryKey: ["reservation-audit-timeline", selectedReservationId],
    enabled: isApi && Boolean(selectedReservationId) && canViewAudit,
    queryFn: async () => {
      const response = await apiClient<ApiList<ReservationAuditEvent>>(`/reservations/${encodeURIComponent(selectedReservationId || "")}/audit-timeline`, { locale });
      return response.data ?? response.items ?? [];
    },
  });

  const reservations = isApi ? (reservationsQuery.data ?? []) : [];
  const selectedReservation = reservationDetailQuery.data ?? reservations.find((reservation) => reservation.id === selectedReservationId) ?? null;
  const latestRefund = selectedReservation?.refunds?.slice().reverse().find((refund) => ["requested", "approved", "executed"].includes(refund.status));
  const isActionBusy = reservationDetailQuery.isFetching
    || reservationsQuery.isFetching;

  const refreshReservations = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.reservations });
    if (selectedReservationId) await queryClient.invalidateQueries({ queryKey: ["reservation-detail", selectedReservationId] });
    if (selectedReservationId) await queryClient.invalidateQueries({ queryKey: ["reservation-audit-timeline", selectedReservationId] });
  };

  const mutationOptions = {
    onSuccess: async () => {
      await refreshReservations();
      invalidateAffectedQueries(queryClient, { entity: "Reservation", action: "update", branchId: activeBranchId });
    },
    onError: (err: any) => setErrorMsg(err.message || (rtl ? "فشل تنفيذ العملية." : "The reservation action failed.")),
  };

  const reservationMutation = useMutation({
    mutationFn: async ({ targetAsset, targetCustomer, depositNum }: { targetAsset: Asset; targetCustomer: any; depositNum: number }) => {
      const reservationId = `RES-${Date.now()}`;
      await apiClient("/reservations", {
        method: "POST",
        locale,
        idempotencyKey: reservationIdempotencyKeyRef.current,
        body: JSON.stringify({
          id: reservationId,
          customerId: targetCustomer.id,
          branchId: activeBranchId,
          expiresAt: expDate,
          notes: `${rtl ? "حجز أصل" : "Asset reservation"} ${targetAsset.id}`,
          items: [{ assetId: targetAsset.id, agreedPrice: targetAsset.price }],
          initialPayment: { amount: depositNum, paymentMethod: depositMethod },
          assetId: targetAsset.id,
          assetName: targetAsset.name,
          customerName: targetCustomer.name,
          branch: activeBranch,
        }),
      });
    },
    ...mutationOptions,
  });

  const completeSaleMutation = useMutation({
    mutationFn: async (reservation: Reservation) => apiClient(`/reservations/${encodeURIComponent(reservation.id)}/complete-sale`, {
      method: "POST",
      locale,
      idempotencyKey: generateUUID(),
      body: JSON.stringify({}),
    }),
    ...mutationOptions,
  });

  const laterPaymentMutation = useMutation({
    mutationFn: async ({ reservation, amount, paymentMethod }: { reservation: Reservation; amount: number; paymentMethod: string }) => apiClient(`/reservations/${encodeURIComponent(reservation.id)}/payments`, {
      method: "POST",
      locale,
      idempotencyKey: generateUUID(),
      body: JSON.stringify({ amount, paymentMethod }),
    }),
    ...mutationOptions,
    onSuccess: async () => {
      setLaterPaymentAmount("");
      setLaterPaymentMethod("cash");
      await mutationOptions.onSuccess();
      setSuccessMsg(rtl ? "تم تسجيل دفعة الحجز." : "Reservation payment recorded.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ reservation, reason }: { reservation: Reservation; reason: string }) => apiClient(`/reservations/${encodeURIComponent(reservation.id)}/cancel`, {
      method: "POST",
      locale,
      body: JSON.stringify({ reason }),
    }),
    ...mutationOptions,
  });

  const refundRequestMutation = useMutation({
    mutationFn: async ({ reservation, reason, refundMethod }: { reservation: Reservation; reason: string; refundMethod: string }) => apiClient(`/reservations/${encodeURIComponent(reservation.id)}/refunds`, {
      method: "POST",
      locale,
      body: JSON.stringify({ reason, refundMethod }),
    }),
    ...mutationOptions,
  });

  const approveRefundMutation = useMutation({
    mutationFn: async ({ refund, methodOverrideApproved }: { refund: ReservationRefund; methodOverrideApproved: boolean }) => apiClient(`/reservation-refunds/${encodeURIComponent(refund.id)}/approve`, {
      method: "POST",
      locale,
      body: JSON.stringify({ methodOverrideApproved }),
    }),
    ...mutationOptions,
  });

  const rejectRefundMutation = useMutation({
    mutationFn: async ({ refund, reason }: { refund: ReservationRefund; reason: string }) => apiClient(`/reservation-refunds/${encodeURIComponent(refund.id)}/reject`, {
      method: "POST",
      locale,
      body: JSON.stringify({ reason }),
    }),
    ...mutationOptions,
  });

  const executeRefundMutation = useMutation({
    mutationFn: async ({ refund, treasuryAccountCode }: { refund: ReservationRefund; treasuryAccountCode: string }) => apiClient(`/reservation-refunds/${encodeURIComponent(refund.id)}/execute`, {
      method: "POST",
      locale,
      idempotencyKey: generateUUID(),
      body: JSON.stringify({ treasuryAccountCode }),
    }),
    ...mutationOptions,
  });

  // Phase 32.6-Fix C — amendment, expiry extension, and renewal actions.
  // The client submits only asset ids, reasons, dates, and refund methods; all
  // totals, prices, transfer amounts, and excess amounts are server-derived.
  const amendItemsMutation = useMutation({
    mutationFn: async ({ reservation, addAssetIds, removeItemIds, repriceItemIds, reason }: { reservation: Reservation; addAssetIds: string[]; removeItemIds: string[]; repriceItemIds: string[]; reason: string }) =>
      apiClient(`/reservations/${encodeURIComponent(reservation.id)}/amend-items`, {
        method: "POST",
        locale,
        idempotencyKey: generateUUID(),
        body: JSON.stringify({ addAssetIds, removeItemIds, repriceItemIds, reason }),
      }),
    ...mutationOptions,
  });

  const extendExpiryMutation = useMutation({
    mutationFn: async ({ reservation, newExpiry, reason }: { reservation: Reservation; newExpiry: string; reason: string }) =>
      apiClient(`/reservations/${encodeURIComponent(reservation.id)}/extend-expiry`, {
        method: "POST",
        locale,
        idempotencyKey: generateUUID(),
        body: JSON.stringify({ newExpiry, reason }),
      }),
    ...mutationOptions,
  });

  const renewMutation = useMutation({
    mutationFn: async ({ reservation, successorAssetIds, newExpiry, reason, refundMethod }: { reservation: Reservation; successorAssetIds: string[]; newExpiry: string; reason: string; refundMethod: string }) =>
      apiClient(`/reservations/${encodeURIComponent(reservation.id)}/renew`, {
        method: "POST",
        locale,
        idempotencyKey: generateUUID(),
        body: JSON.stringify({ successorAssetIds, newExpiry, reason, refundMethod }),
      }),
    ...mutationOptions,
  });

  const approveRenewalRefundMutation = useMutation({
    mutationFn: async ({ refund, methodOverrideApproved }: { refund: ReservationRefund; methodOverrideApproved: boolean }) =>
      apiClient(`/reservation-renewal-refunds/${encodeURIComponent(refund.id)}/approve`, {
        method: "POST",
        locale,
        body: JSON.stringify({ methodOverrideApproved }),
      }),
    ...mutationOptions,
  });

  const executeRenewalRefundMutation = useMutation({
    mutationFn: async ({ refund, treasuryAccountCode }: { refund: ReservationRefund; treasuryAccountCode: string }) =>
      apiClient(`/reservation-renewal-refunds/${encodeURIComponent(refund.id)}/execute`, {
        method: "POST",
        locale,
        idempotencyKey: generateUUID(),
        body: JSON.stringify({ treasuryAccountCode }),
      }),
    ...mutationOptions,
  });

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
    if (!isApi) {
      setErrorMsg(rtl ? "مسار الحجوزات التشغيلي يتطلب الاتصال بالـ API." : "Operational reservations require API mode.");
      return;
    }
    const targetAsset = assets.find((a) => a.id === assetId);
    const targetCustomer = customers.find((c) => c.id === customerId);
    const depositNum = Number(deposit) || 0;
    if (!targetAsset || !targetCustomer) {
      setErrorMsg(rtl ? "برجاء التأكد من اختيار العميل والأصل المراد حجزه." : "Please make sure to select both customer and asset.");
      return;
    }
    if (!reservationAccountConfigured) {
      setErrorMsg(rtl ? "لا يمكن تسجيل حجز بعربون قبل تحديد حساب دفعات مقدمة العملاء للحجوزات من الإعدادات المحاسبية." : "A reservation deposit cannot be recorded until the Reservation Advances Account is configured in Accounting Settings.");
      return;
    }
    if (!(depositNum > 0)) {
      setErrorMsg(rtl ? "يجب إدخال دفعة أولى أكبر من صفر لإنشاء الحجز." : "An initial payment greater than zero is required to create the reservation.");
      return;
    }
    if (depositNum > Number(targetAsset.price)) {
      setErrorMsg(rtl ? "الدفعة الأولى لا يمكن أن تتجاوز إجمالي الحجز." : "The initial payment cannot exceed the reservation total.");
      return;
    }
    try {
      if (!reservationIdempotencyKeyRef.current) reservationIdempotencyKeyRef.current = generateUUID();
      await reservationMutation.mutateAsync({ targetAsset, targetCustomer, depositNum });
      reservationIdempotencyKeyRef.current = "";
      setSuccessMsg(rtl ? `تم حجز الأصل ${targetAsset.name} بنجاح.` : `Asset ${targetAsset.name} reserved successfully.`);
      setOpenModal(false);
    } catch (err: any) {
      reservationIdempotencyKeyRef.current = "";
      setErrorMsg(err.message || "Failed to post reservation.");
    }
  };

  const confirmComplete = async (reservation: Reservation) => {
    setErrorMsg("");
    const message = rtl
      ? "سيتم إنشاء فاتورة البيع النهائية، تطبيق دفعات الحجز، تسوية الدفعات المقدمة، ترحيل المبيعات والضريبة والتكلفة، وتحويل القطع إلى Sold. هل تريد المتابعة؟"
      : "This will create the final sales invoice, apply reservation payments, settle advances, post sales/VAT/COGS, and mark items Sold. Continue?";
    if (!window.confirm(message)) return;
    await completeSaleMutation.mutateAsync(reservation);
    setSuccessMsg(rtl ? "تم إكمال البيع النهائي للحجز." : "Reservation final sale completed.");
  };

  const submitLaterPayment = async (reservation: Reservation) => {
    setErrorMsg("");
    setSuccessMsg("");
    const amount = Number(laterPaymentAmount);
    if (!(amount > 0)) {
      setErrorMsg(rtl ? "أدخل مبلغ دفعة صحيح أكبر من صفر." : "Enter a valid payment amount greater than zero.");
      return;
    }
    if (amount > Number(reservation.remainingTotal || 0)) {
      setErrorMsg(rtl ? "لا يمكن تسجيل دفعة أكبر من المتبقي." : "Payment cannot exceed the remaining reservation amount.");
      return;
    }
    await laterPaymentMutation.mutateAsync({ reservation, amount, paymentMethod: laterPaymentMethod });
  };

  const confirmCancel = async (reservation: Reservation) => {
    setErrorMsg("");
    const reason = window.prompt(rtl ? "سبب إلغاء الحجز مطلوب:" : "Cancellation reason is required:");
    if (!reason?.trim()) return;
    await cancelMutation.mutateAsync({ reservation, reason: reason.trim() });
    setSuccessMsg(rtl ? "تم إلغاء الحجز وتحديث حالته." : "Reservation cancellation recorded.");
  };

  const requestRefund = async (reservation: Reservation) => {
    setErrorMsg("");
    const reason = window.prompt(rtl ? "سبب طلب الاسترداد:" : "Refund request reason:");
    if (!reason?.trim()) return;
    const refundMethod = window.prompt(rtl ? "طريقة الاسترداد (cash أو bank):" : "Refund method (cash or bank):", "cash") || "cash";
    await refundRequestMutation.mutateAsync({ reservation, reason: reason.trim(), refundMethod });
    setSuccessMsg(rtl ? "تم تسجيل طلب الاسترداد." : "Refund request recorded.");
  };

  const approveRefund = async (refund: ReservationRefund) => {
    setErrorMsg("");
    const methodOverrideApproved = refund.methodDiffersFromOriginal
      ? window.confirm(rtl ? "طريقة الاسترداد مختلفة عن طريقة الدفع الأصلية. هل تعتمد override؟" : "Refund method differs from original payment. Approve override?")
      : false;
    if (!window.confirm(rtl ? `اعتماد استرداد ${money(refund.amount)}؟` : `Approve refund ${money(refund.amount)}?`)) return;
    await approveRefundMutation.mutateAsync({ refund, methodOverrideApproved });
    setSuccessMsg(rtl ? "تم اعتماد الاسترداد." : "Refund approved.");
  };

  const rejectRefund = async (refund: ReservationRefund) => {
    setErrorMsg("");
    const reason = window.prompt(rtl ? "سبب رفض الاسترداد مطلوب:" : "Refund rejection reason is required:");
    if (!reason?.trim()) return;
    await rejectRefundMutation.mutateAsync({ refund, reason: reason.trim() });
    setSuccessMsg(rtl ? "تم رفض الاسترداد." : "Refund rejected.");
  };

  const executeRefund = async (refund: ReservationRefund) => {
    setErrorMsg("");
    const treasuryAccountCode = window.prompt(rtl ? "حساب الخزنة/البنك للاسترداد (1110/1120):" : "Refund treasury/bank account (1110/1120):", refund.treasuryAccountCode || "1110") || refund.treasuryAccountCode || "1110";
    const warning = rtl
      ? `سيتم إنشاء قيد مالي وحركة صرف بقيمة ${money(refund.amount)}. هل تريد التنفيذ؟`
      : `This will create a financial journal and cash/bank outflow for ${money(refund.amount)}. Execute?`;
    if (!window.confirm(warning)) return;
    await executeRefundMutation.mutateAsync({ refund, treasuryAccountCode });
    setSuccessMsg(rtl ? "تم تنفيذ الاسترداد." : "Refund executed.");
  };

  // ── Phase 32.6-Fix C handlers ──
  const openAmend = (reservation: Reservation) => {
    setErrorMsg("");
    setAmendTarget(reservation);
    setAmendAddIds([]);
    setAmendRemoveIds([]);
    setAmendRepriceIds([]);
    setAmendReason("");
  };

  const toggleId = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const submitAmend = async () => {
    if (!amendTarget) return;
    if (!amendReason.trim()) { setErrorMsg(rtl ? "سبب التعديل مطلوب." : "Amendment reason is required."); return; }
    if (amendAddIds.length === 0 && amendRemoveIds.length === 0 && amendRepriceIds.length === 0) { setErrorMsg(rtl ? "اختر عملية إضافة أو إزالة أو إعادة تسعير." : "Select items to add, remove, or reprice."); return; }
    try {
      await amendItemsMutation.mutateAsync({ reservation: amendTarget, addAssetIds: amendAddIds, removeItemIds: amendRemoveIds, repriceItemIds: amendRepriceIds, reason: amendReason.trim() });
      setAmendTarget(null);
      setSuccessMsg(rtl ? "تم تعديل قطع الحجز." : "Reservation items amended.");
    } catch (err: any) {
      setErrorMsg(err.message || "Amendment failed.");
    }
  };

  const extendExpiry = async (reservation: Reservation) => {
    setErrorMsg("");
    const newExpiry = window.prompt(rtl ? "تاريخ/وقت الانتهاء الجديد (لاحق للحالي):" : "New expiry date/time (later than current):", reservation.expiresAt || "");
    if (!newExpiry?.trim()) return;
    const reason = window.prompt(rtl ? "سبب التمديد:" : "Extension reason:");
    if (!reason?.trim()) return;
    await extendExpiryMutation.mutateAsync({ reservation, newExpiry: newExpiry.trim(), reason: reason.trim() });
    setSuccessMsg(rtl ? "تم تمديد مدة الحجز." : "Reservation expiry extended.");
  };

  const openRenew = (reservation: Reservation) => {
    setErrorMsg("");
    setRenewSource(reservation);
    setRenewAssetIds([]);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setRenewExpiry(nextWeek.toISOString().slice(0, 10));
    setRenewReason("");
    setRenewRefundMethod("cash");
  };

  const submitRenew = async () => {
    if (!renewSource) return;
    if (renewAssetIds.length === 0) { setErrorMsg(rtl ? "اختر قطع الحجز الجديد." : "Select successor assets."); return; }
    if (!renewExpiry.trim()) { setErrorMsg(rtl ? "تاريخ انتهاء الحجز الجديد مطلوب." : "Successor expiry is required."); return; }
    if (!renewReason.trim()) { setErrorMsg(rtl ? "سبب التجديد مطلوب." : "Renewal reason is required."); return; }
    try {
      await renewMutation.mutateAsync({ reservation: renewSource, successorAssetIds: renewAssetIds, newExpiry: renewExpiry.trim(), reason: renewReason.trim(), refundMethod: renewRefundMethod });
      setRenewSource(null);
      setSuccessMsg(rtl ? "تم إنشاء حجز جديد مرتبط بالتجديد." : "Renewal successor reservation created.");
    } catch (err: any) {
      setErrorMsg(err.message || "Renewal failed.");
    }
  };

  const approveRenewalRefund = async (refund: ReservationRefund) => {
    setErrorMsg("");
    if (!window.confirm(rtl ? `اعتماد استرداد فائض التجديد ${money(refund.amount)}؟` : `Approve renewal excess refund ${money(refund.amount)}?`)) return;
    await approveRenewalRefundMutation.mutateAsync({ refund, methodOverrideApproved: Boolean(refund.methodDiffersFromOriginal) });
    setSuccessMsg(rtl ? "تم اعتماد استرداد الفائض." : "Renewal excess refund approved.");
  };

  const executeRenewalRefund = async (refund: ReservationRefund) => {
    setErrorMsg("");
    const treasuryAccountCode = window.prompt(rtl ? "حساب الخزنة/البنك (1110/1120):" : "Treasury/bank account (1110/1120):", refund.treasuryAccountCode || "1110") || refund.treasuryAccountCode || "1110";
    if (!window.confirm(rtl ? `سيتم صرف فائض التجديد ${money(refund.amount)} وتفعيل الحجز الجديد. متابعة؟` : `This refunds the renewal excess ${money(refund.amount)} and activates the successor. Continue?`)) return;
    await executeRenewalRefundMutation.mutateAsync({ refund, treasuryAccountCode });
    setSuccessMsg(rtl ? "تم تنفيذ استرداد الفائض وتفعيل الحجز." : "Renewal excess refund executed and successor activated.");
  };

  const statusTone = (status: string) => {
    if (status === "completed" || status === "refunded") return "emerald";
    if (status === "fully_paid") return "blue";
    if (status.includes("cancelled")) return "rose";
    if (status === "partially_paid") return "amber";
    return "slate";
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      active: { ar: "نشط", en: "Active" },
      partially_paid: { ar: "مدفوع جزئياً", en: "Partially Paid" },
      fully_paid: { ar: "مدفوع بالكامل", en: "Fully Paid" },
      completed: { ar: "مكتمل", en: "Completed" },
      cancelled: { ar: "ملغي", en: "Cancelled" },
      cancelled_refund_pending: { ar: "ملغي — بانتظار الاسترداد", en: "Cancelled — Refund Pending" },
      refunded: { ar: "مسترد", en: "Refunded" },
      pending_renewal_settlement: { ar: "بانتظار تسوية التجديد", en: "Pending Renewal Settlement" },
      renewed: { ar: "مجدّد", en: "Renewed" },
      expired: { ar: "منتهي", en: "Expired" },
    };
    const row = labels[status];
    return row ? (rtl ? row.ar : row.en) : status;
  };

  const canShowComplete = (reservation: Reservation) =>
    canCompleteSale && reservation.status === "fully_paid" && !reservation.finalInvoiceId && !reservation.isLegacy;
  const canShowCancel = (reservation: Reservation) =>
    canCancelReservation && !["completed", "refunded"].includes(reservation.status) && !reservation.isLegacy;
  const canShowRefundRequest = (reservation: Reservation) =>
    canRequestRefund && reservation.status === "cancelled_refund_pending" && Number(reservation.paidTotal || 0) > 0 && !latestRefund;
  const canShowApproveReject = (refund?: ReservationRefund) =>
    Boolean(refund && refund.status === "requested" && (canApproveRefund || canRejectRefund));
  const canShowExecute = (refund?: ReservationRefund) =>
    Boolean(refund && refund.status === "approved" && canExecuteRefund && (!refund.methodDiffersFromOriginal || refund.methodOverrideApproved));

  const amendableStatuses = ["active", "partially_paid", "fully_paid"];
  const canShowAmend = (reservation: Reservation) =>
    (canAmendItems || canRepriceItems) && amendableStatuses.includes(reservation.status) && !reservation.isLegacy && !reservation.finalInvoiceId;
  const canShowExtend = (reservation: Reservation) =>
    canExtendExpiry && amendableStatuses.includes(reservation.status) && !reservation.isLegacy;
  const canShowRenew = (reservation: Reservation) =>
    canRenew && Boolean(reservation.expiredBySystem) && !reservation.successorReservationId
    && reservation.status !== "renewed" && ["cancelled_refund_pending", "cancelled"].includes(reservation.status);
  const pendingRenewalRefund = (reservation: Reservation) =>
    reservation.refunds?.slice().reverse().find((refund) => refund.refundType === "renewal_excess" && ["requested", "approved"].includes(refund.status));

  const visibleReservations = useMemo(() => {
    let list = isApi ? reservations : [];
    if (filterCustomer) {
      const query = filterCustomer.toLowerCase();
      list = list.filter((r) => r.customerName.toLowerCase().includes(query) || r.id.toLowerCase().includes(query));
    }
    if (filterSalesperson) {
      const query = filterSalesperson.toLowerCase();
      list = list.filter((r) => r.createdBy && r.createdBy.toLowerCase().includes(query));
    }
    if (filterCreatedFrom) {
      list = list.filter((r) => r.createdAt && r.createdAt.slice(0, 10) >= filterCreatedFrom);
    }
    if (filterCreatedTo) {
      list = list.filter((r) => r.createdAt && r.createdAt.slice(0, 10) <= filterCreatedTo);
    }
    if (filterExpiryFrom) {
      list = list.filter((r) => r.expiresAt && r.expiresAt.slice(0, 10) >= filterExpiryFrom);
    }
    if (filterExpiryTo) {
      list = list.filter((r) => r.expiresAt && r.expiresAt.slice(0, 10) <= filterExpiryTo);
    }
    if (filterPaymentStatus !== "all") {
      list = list.filter((r) => {
        const paid = Number(r.paidTotal || 0);
        const total = Number(r.agreedTotal || 0);
        if (filterPaymentStatus === "unpaid") return paid === 0;
        if (filterPaymentStatus === "partially_paid") return paid > 0 && paid < total;
        if (filterPaymentStatus === "fully_paid") return paid >= total;
        return true;
      });
    }
    if (filterRefundStatus !== "all") {
      list = list.filter((r) => r.refundStatus === filterRefundStatus);
    }
    if (filterRenewalStatus !== "all") {
      list = list.filter((r) => r.renewalStatus === filterRenewalStatus);
    }
    return list;
  }, [reservations, isApi, filterCustomer, filterSalesperson, filterCreatedFrom, filterCreatedTo, filterExpiryFrom, filterExpiryTo, filterPaymentStatus, filterRefundStatus, filterRenewalStatus]);

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
            {rtl ? "إدارة حجز قطع المجوهرات وتسوية الدفعات المقدمة عبر مسارات مخصصة." : "Manage asset reservations and dedicated advance settlement workflows."}
          </p>
        </div>
        <div className="flex gap-2">
          {isApi && <Button variant="secondary" onClick={refreshReservations}><RefreshCw className="h-4 w-4" />{rtl ? "تحديث" : "Refresh"}</Button>}
          <Button onClick={handleOpenNewReservation} disabled={availableAssets.length === 0 || !isApi}>
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

      {!isApi && (
        <Card className="p-4 text-xs text-muted">
          {rtl ? "مسار Fix B للتسوية النهائية يعمل من خلال API فقط. القطع المحجوزة المحلية المعروضة للقراءة فقط." : "Fix B final settlement workflow is API-only. Local reserved assets are shown read-only."}
        </Card>
      )}

      {canViewReports && (
        <Card className="p-4 text-xs text-muted">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-black text-foreground">{rtl ? "تقارير الحجوزات" : "Reservation reports"}</p>
              <p>{rtl ? "ملخص الحجوزات، الدفعات، ومطابقة الرصيد التشغيلي للدفعات المقدمة." : "Reservation summary, payments, and operational advances reconciliation."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="text-brand-700 font-bold" href="/api/reports/reservations/summary" target="_blank" rel="noreferrer">{rtl ? "الملخص" : "Summary"}</a>
              <a className="text-brand-700 font-bold" href="/api/reports/reservations/payments" target="_blank" rel="noreferrer">{rtl ? "الدفعات" : "Payments"}</a>
              <a className="text-brand-700 font-bold" href="/api/reports/reservations/reconciliation" target="_blank" rel="noreferrer">{rtl ? "المطابقة" : "Reconciliation"}</a>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="text-xs font-black text-foreground">{rtl ? "تصفية الحجوزات" : "Filter Reservations"}</h3>
          <Button variant="ghost" className="text-xs py-1 px-2 h-auto" onClick={() => {
            setFilterCustomer("");
            setFilterSalesperson("");
            setFilterCreatedFrom("");
            setFilterCreatedTo("");
            setFilterExpiryFrom("");
            setFilterExpiryTo("");
            setFilterPaymentStatus("all");
            setFilterRefundStatus("all");
            setFilterRenewalStatus("all");
          }}>{rtl ? "إعادة تعيين" : "Reset"}</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <label className="block">
            <span className="text-[10px] font-bold text-muted">{rtl ? "العميل أو رقم الحجز" : "Customer or Reservation ID"}</span>
            <input type="text" className="input-base mt-1" value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold text-muted">{rtl ? "الموظف المسؤول" : "Salesperson"}</span>
            <input type="text" className="input-base mt-1" value={filterSalesperson} onChange={(e) => setFilterSalesperson(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold text-muted">{rtl ? "تاريخ الحجز من" : "Created From"}</span>
            <input type="date" className="input-base mt-1" value={filterCreatedFrom} onChange={(e) => setFilterCreatedFrom(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold text-muted">{rtl ? "تاريخ الحجز إلى" : "Created To"}</span>
            <input type="date" className="input-base mt-1" value={filterCreatedTo} onChange={(e) => setFilterCreatedTo(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold text-muted">{rtl ? "تاريخ الانتهاء من" : "Expiry From"}</span>
            <input type="date" className="input-base mt-1" value={filterExpiryFrom} onChange={(e) => setFilterExpiryFrom(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold text-muted">{rtl ? "تاريخ الانتهاء إلى" : "Expiry To"}</span>
            <input type="date" className="input-base mt-1" value={filterExpiryTo} onChange={(e) => setFilterExpiryTo(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold text-muted">{rtl ? "حالة الدفع" : "Payment Status"}</span>
            <NativeSelect className="mt-1" value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)}>
              <option value="all">{rtl ? "الكل" : "All"}</option>
              <option value="unpaid">{rtl ? "غير مدفوع" : "Unpaid"}</option>
              <option value="partially_paid">{rtl ? "مدفوع جزئياً" : "Partially Paid"}</option>
              <option value="fully_paid">{rtl ? "مدفوع بالكامل" : "Fully Paid"}</option>
            </NativeSelect>
          </label>
          <label className="block">
            <span className="text-[10px] font-bold text-muted">{rtl ? "حالة الاسترداد" : "Refund Status"}</span>
            <NativeSelect className="mt-1" value={filterRefundStatus} onChange={(e) => setFilterRefundStatus(e.target.value)}>
              <option value="all">{rtl ? "الكل" : "All"}</option>
              <option value="pending">{rtl ? "قيد الانتظار" : "Pending"}</option>
              <option value="requested">{rtl ? "مطلوب" : "Requested"}</option>
              <option value="approved">{rtl ? "معتمد" : "Approved"}</option>
              <option value="executed">{rtl ? "منفذ" : "Executed"}</option>
            </NativeSelect>
          </label>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {isApi && reservationsQuery.isLoading ? (
          <Card className="col-span-full p-8 text-center text-xs text-muted">{rtl ? "جاري تحميل الحجوزات..." : "Loading reservations..."}</Card>
        ) : visibleReservations.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-xs text-muted">
            {isApi
              ? (rtl ? "لا توجد حجوزات حالياً." : "No reservations found.")
              : (reservedAssets.length === 0 ? (rtl ? "لا توجد قطع محجوزة حالياً في هذا الفرع." : "No assets currently reserved in this branch.") : null)}
          </Card>
        ) : (
          visibleReservations.map((reservation) => (
            <Card key={reservation.id} className="p-5 flex flex-col justify-between space-y-4 hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-panel transition">
              <div>
                <div className="flex justify-between items-start">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300">
                    <Bookmark className="h-5 w-5" />
                  </span>
                  <Badge tone={statusTone(reservation.status) as any}>{statusLabel(reservation.status)}</Badge>
                </div>
                <h3 className="mt-3 font-black text-foreground text-sm">{reservation.id}</h3>
                <div className="mt-4 space-y-2 text-xs border-t border-dashed border-border pt-3">
                  <p className="flex items-center gap-1.5 text-muted"><User className="h-3.5 w-3.5" />{reservation.customerName}</p>
                  <p className="flex items-center gap-1.5 text-muted"><DollarSign className="h-3.5 w-3.5" />{money(reservation.agreedTotal)} · {rtl ? "مدفوع" : "paid"} {money(reservation.paidTotal)} · {rtl ? "متبقي" : "remaining"} {money(reservation.remainingTotal)}</p>
                  <p className="flex items-center gap-1.5 text-muted"><Calendar className="h-3.5 w-3.5" />{reservation.expiresAt || "—"}</p>
                  {reservation.finalInvoiceId && <p className="flex items-center gap-1.5 text-emerald-600"><FileText className="h-3.5 w-3.5" />{reservation.finalInvoiceId}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="secondary" size="sm" className="text-xs" onClick={() => setSelectedReservationId(reservation.id)}>
                  {rtl ? "تفاصيل" : "Details"}
                </Button>
                {canShowComplete(reservation) && (
                  <Button size="sm" className="text-xs" disabled={isActionBusy || completeSaleMutation.isPending} onClick={() => confirmComplete(reservation)}>
                    {rtl ? "إكمال البيع" : "Complete Sale"}
                  </Button>
                )}
                {canShowCancel(reservation) && (
                  <Button variant="secondary" size="sm" className="text-xs" disabled={isActionBusy || cancelMutation.isPending} onClick={() => confirmCancel(reservation)}>
                    {rtl ? "إلغاء" : "Cancel"}
                  </Button>
                )}
                {canShowAmend(reservation) && (
                  <Button variant="secondary" size="sm" className="text-xs" disabled={isActionBusy || amendItemsMutation.isPending} onClick={() => openAmend(reservation)}>
                    {rtl ? "تعديل القطع" : "Amend Items"}
                  </Button>
                )}
                {canShowExtend(reservation) && (
                  <Button variant="secondary" size="sm" className="text-xs" disabled={isActionBusy || extendExpiryMutation.isPending} onClick={() => extendExpiry(reservation)}>
                    {rtl ? "تمديد" : "Extend"}
                  </Button>
                )}
                {canShowRenew(reservation) && (
                  <Button size="sm" className="text-xs" disabled={isActionBusy || renewMutation.isPending} onClick={() => openRenew(reservation)}>
                    {rtl ? "تجديد" : "Renew"}
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={Boolean(selectedReservationId)} onClose={() => setSelectedReservationId(null)} title={rtl ? "تفاصيل الحجز" : "Reservation Detail"} description={selectedReservation?.id || ""}>
        {selectedReservation ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <Info label={rtl ? "العميل" : "Customer"} value={selectedReservation.customerName} />
              <Info label={rtl ? "الحالة" : "Status"} value={statusLabel(selectedReservation.status)} />
              <Info label={rtl ? "الإجمالي" : "Total"} value={money(selectedReservation.agreedTotal)} />
              <Info label={rtl ? "إجمالي المدفوع" : "Total paid"} value={money(selectedReservation.paidTotal)} />
              <Info label={rtl ? "المتبقي" : "Remaining"} value={money(selectedReservation.remainingTotal)} />
              <Info label={rtl ? "حالة الاسترداد" : "Refund status"} value={selectedReservation.refundStatus ? statusLabel(selectedReservation.refundStatus) : "—"} />
              <Info label={rtl ? "اكتمل بواسطة" : "Completed by"} value={selectedReservation.completedBy || "—"} />
              <Info label={rtl ? "تاريخ الإكمال" : "Completed at"} value={selectedReservation.completedAt || "—"} />
              <Info label={rtl ? "سبب الإلغاء" : "Cancellation reason"} value={selectedReservation.cancellationReason || "—"} />
              <Info label={rtl ? "تاريخ الإلغاء" : "Cancelled at"} value={selectedReservation.cancelledAt || "—"} />
              <Info label={rtl ? "تاريخ الانتهاء" : "Expiry"} value={selectedReservation.expiresAt || "—"} />
              <Info label={rtl ? "انتهى تلقائياً" : "Expired by system"} value={selectedReservation.expiredBySystem ? (rtl ? "نعم" : "Yes") : "—"} />
              <Info label={rtl ? "عدد التمديدات" : "Extensions"} value={String(selectedReservation.extensionCount ?? 0)} />
              <Info
                label={rtl ? "حجز سابق" : "Predecessor"}
                value={selectedReservation.predecessorReservationId ? (
                  <button type="button" className="text-brand-700 underline font-bold" onClick={() => setSelectedReservationId(selectedReservation.predecessorReservationId || null)}>
                    {selectedReservation.predecessorReservationId}
                  </button>
                ) : "—"}
              />
              <Info
                label={rtl ? "حجز لاحق" : "Successor"}
                value={selectedReservation.successorReservationId ? (
                  <button type="button" className="text-brand-700 underline font-bold" onClick={() => setSelectedReservationId(selectedReservation.successorReservationId || null)}>
                    {selectedReservation.successorReservationId}
                  </button>
                ) : "—"}
              />
              <Info label={rtl ? "حالة التجديد" : "Renewal status"} value={selectedReservation.renewalStatus ? statusLabel(selectedReservation.renewalStatus) : "—"} />
            </div>

            {selectedReservation.finalInvoiceId && (
              <Link href={`/sales/search-print?search=${encodeURIComponent(selectedReservation.finalInvoiceId)}`} className="inline-flex items-center gap-2 text-xs font-bold text-brand-700">
                <FileText className="h-4 w-4" />
                {rtl ? "فتح الفاتورة النهائية" : "Open final invoice"} · {selectedReservation.finalInvoiceId}
              </Link>
            )}

            <Section title={rtl ? "القطع الحالية" : "Current active items"}>
              {(selectedReservation.items ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-3 text-xs">
                  {item.assetName || item.assetId} · {item.status} · {money(item.agreedPrice)}
                </div>
              ))}
            </Section>

            <Section title={rtl ? "دفعات الحجز" : "Payment history"}>
              {(selectedReservation.payments ?? []).map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-border p-3 text-xs flex justify-between items-center">
                  <span>{payment.receiptNumber || payment.id} · {payment.status} · {payment.paymentMethod || "cash"} · {money(payment.amount)} · {payment.receivedAt || "—"}</span>
                  {payment.status === "posted" && (
                    <a href={`/api/print/receipt/${payment.id}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-brand-700 underline ml-2">
                      {rtl ? "طباعة الإيصال" : "Print Receipt"}
                    </a>
                  )}
                </div>
              ))}
            </Section>

            {canRecordPayment && amendableStatuses.includes(selectedReservation.status) && Number(selectedReservation.remainingTotal || 0) > 0 && !selectedReservation.isLegacy && (
              <Section title={rtl ? "تسجيل دفعة لاحقة" : "Record later payment"}>
                <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
                  <input
                    className="input-base"
                    type="number"
                    min="0"
                    step="0.01"
                    value={laterPaymentAmount}
                    onChange={(event) => setLaterPaymentAmount(event.target.value)}
                    placeholder={rtl ? "المبلغ" : "Amount"}
                  />
                  <NativeSelect value={laterPaymentMethod} onChange={(event) => setLaterPaymentMethod(event.target.value)}>
                    <option value="cash">{rtl ? "نقدي" : "Cash"}</option>
                    <option value="bank">{rtl ? "بنكي" : "Bank"}</option>
                    <option value="card">{rtl ? "بطاقة" : "Card"}</option>
                  </NativeSelect>
                  <Button type="button" disabled={laterPaymentMutation.isPending} onClick={() => submitLaterPayment(selectedReservation)}>
                    {rtl ? "تسجيل الدفعة" : "Record Payment"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted">{rtl ? "يرسل المتصفح المبلغ وطريقة الدفع فقط؛ المتبقي والقيد والإيصال من الخادم." : "The browser sends only amount and method; remaining balance, receipt, and journal are server-controlled."}</p>
              </Section>
            )}

            <Section title={rtl ? "الاسترداد" : "Refund"}>
              {(selectedReservation.refunds ?? []).length === 0 ? (
                <p className="text-xs text-muted">{rtl ? "لا يوجد طلب استرداد." : "No refund request."}</p>
              ) : selectedReservation.refunds?.map((refund) => (
                <div key={refund.id} className="rounded-2xl border border-border p-3 text-xs space-y-1">
                  <p>{refund.id} · {refund.status} · {money(refund.amount)} · {refund.requestedRefundMethod || "cash"}</p>
                  <p>{rtl ? "طلب بواسطة" : "Requested by"}: {refund.requestedBy || "—"} · {refund.requestedAt || "—"}</p>
                  <p>{rtl ? "اعتماد" : "Approved"}: {refund.approvedBy || "—"} · {refund.approvedAt || "—"}</p>
                  <p>{rtl ? "تنفيذ" : "Executed"}: {refund.executedBy || "—"} · {refund.executedAt || "—"}</p>
                  {refund.methodDiffersFromOriginal && <p className="font-bold text-amber-600">{rtl ? "طريقة الاسترداد مختلفة وتتطلب اعتماد override." : "Method differs from original payment and requires override approval."}</p>}
                  {refund.journalEntryId && <p>{rtl ? "قيد" : "Journal"}: {refund.journalEntryId}</p>}
                </div>
              ))}
            </Section>

            <Section title={rtl ? "سجل التعديلات" : "Amendment history"}>
              {(selectedReservation.amendments ?? []).length === 0 ? (
                <p className="text-xs text-muted">{rtl ? "لا توجد تعديلات." : "No amendments."}</p>
              ) : selectedReservation.amendments?.map((amendment) => (
                <div key={amendment.id} className="rounded-2xl border border-border p-3 text-xs space-y-1">
                  <p>{amendment.amendmentType} · {money(amendment.beforeTotal)} → {money(amendment.afterTotal)} · {amendment.afterStatus}</p>
                  <p>{rtl ? "السبب" : "Reason"}: {amendment.reason || "—"} · {amendment.createdBy || "—"} · {amendment.createdAt || "—"}</p>
                </div>
              ))}
            </Section>

            <Section title={rtl ? "سجل التمديد" : "Extension history"}>
              {(selectedReservation.expiryExtensions ?? []).length === 0 ? (
                <p className="text-xs text-muted">{rtl ? "لا يوجد تمديد." : "No extensions."}</p>
              ) : selectedReservation.expiryExtensions?.map((extension) => (
                <div key={extension.id} className="rounded-2xl border border-border p-3 text-xs">
                  {extension.oldExpiry} → {extension.newExpiry} · {extension.reason || "—"} · {extension.extendedBy || "—"}
                </div>
              ))}
            </Section>

            <Section title={rtl ? "التجديد" : "Renewal"}>
              {(selectedReservation.renewalsAsSource ?? []).length === 0 ? (
                <p className="text-xs text-muted">{rtl ? "لا يوجد تجديد." : "No renewal."}</p>
              ) : selectedReservation.renewalsAsSource?.map((renewal) => (
                <div key={renewal.id} className="rounded-2xl border border-border p-3 text-xs space-y-1">
                  <p>{renewal.id} · {renewal.status}</p>
                  <p>{rtl ? "الرصيد القابل للتحويل" : "Transferable"}: {money(renewal.sourceTransferableBalance)} · {rtl ? "إجمالي الجديد" : "Successor total"}: {money(renewal.successorTotal)}</p>
                  <p>{rtl ? "المُحوَّل" : "Transferred"}: {money(renewal.transferAmount)} · {rtl ? "فائض للاسترداد" : "Excess refund"}: {money(renewal.excessRefundAmount)}</p>
                  {renewal.successorReservationId && <p>{rtl ? "الحجز الجديد" : "Successor"}: {renewal.successorReservationId}</p>}
                </div>
              ))}
            </Section>

            {canViewAudit && (
              <Section title={rtl ? "سجل التدقيق" : "Audit timeline"}>
                {reservationAuditQuery.isFetching ? (
                  <p className="text-xs text-muted">{rtl ? "جاري تحميل سجل التدقيق..." : "Loading audit timeline..."}</p>
                ) : (reservationAuditQuery.data ?? []).length === 0 ? (
                  <p className="text-xs text-muted">{rtl ? "لا توجد أحداث تدقيق." : "No audit events."}</p>
                ) : reservationAuditQuery.data?.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-border p-3 text-xs space-y-1">
                    <p className="font-bold">{event.action} · {event.user || "—"} · {event.date || "—"}</p>
                    <p className="text-muted">{event.description || "—"}</p>
                    {(event.before || event.after) && (
                      <p className="break-all text-[10px] text-muted">
                        {rtl ? "قبل/بعد" : "Before/after"}: {JSON.stringify({ before: event.before, after: event.after })}
                      </p>
                    )}
                  </div>
                ))}
              </Section>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              {canShowComplete(selectedReservation) && <Button disabled={isActionBusy || completeSaleMutation.isPending} onClick={() => confirmComplete(selectedReservation)}>{rtl ? "إكمال البيع النهائي" : "Complete Final Sale"}</Button>}
              {canShowCancel(selectedReservation) && <Button variant="secondary" disabled={isActionBusy || cancelMutation.isPending} onClick={() => confirmCancel(selectedReservation)}>{rtl ? "إلغاء الحجز" : "Cancel Reservation"}</Button>}
              {canShowAmend(selectedReservation) && <Button variant="secondary" disabled={isActionBusy || amendItemsMutation.isPending} onClick={() => openAmend(selectedReservation)}>{rtl ? "تعديل القطع" : "Amend Items"}</Button>}
              {canShowExtend(selectedReservation) && <Button variant="secondary" disabled={isActionBusy || extendExpiryMutation.isPending} onClick={() => extendExpiry(selectedReservation)}>{rtl ? "تمديد المدة" : "Extend Expiry"}</Button>}
              {canShowRenew(selectedReservation) && <Button disabled={isActionBusy || renewMutation.isPending} onClick={() => openRenew(selectedReservation)}>{rtl ? "تجديد الحجز" : "Renew Reservation"}</Button>}
              {canShowRefundRequest(selectedReservation) && <Button variant="secondary" disabled={isActionBusy || refundRequestMutation.isPending} onClick={() => requestRefund(selectedReservation)}>{rtl ? "طلب استرداد" : "Request Refund"}</Button>}
              {canShowApproveReject(latestRefund) && canApproveRefund && <Button disabled={isActionBusy || approveRefundMutation.isPending} onClick={() => approveRefund(latestRefund!)}>{rtl ? "اعتماد الاسترداد" : "Approve Refund"}</Button>}
              {canShowApproveReject(latestRefund) && canRejectRefund && <Button variant="secondary" disabled={isActionBusy || rejectRefundMutation.isPending} onClick={() => rejectRefund(latestRefund!)}>{rtl ? "رفض الاسترداد" : "Reject Refund"}</Button>}
              {canShowExecute(latestRefund) && <Button disabled={isActionBusy || executeRefundMutation.isPending} onClick={() => executeRefund(latestRefund!)}>{rtl ? "تنفيذ الاسترداد" : "Execute Refund"}</Button>}
              {(() => { const rr = pendingRenewalRefund(selectedReservation); if (!rr) return null; return (<>
                {rr.status === "requested" && canApproveRenewalRefund && <Button disabled={isActionBusy || approveRenewalRefundMutation.isPending} onClick={() => approveRenewalRefund(rr)}>{rtl ? "اعتماد فائض التجديد" : "Approve Renewal Excess"}</Button>}
                {rr.status === "approved" && canExecuteRenewalRefund && <Button disabled={isActionBusy || executeRenewalRefundMutation.isPending} onClick={() => executeRenewalRefund(rr)}>{rtl ? "تنفيذ فائض التجديد" : "Execute Renewal Excess"}</Button>}
              </>); })()}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">{rtl ? "جاري التحميل..." : "Loading..."}</p>
        )}
      </Modal>

      <Modal open={openModal} onClose={() => setOpenModal(false)} title={rtl ? "تسجيل حجز قطعة" : "Create New Asset Reservation"} description={rtl ? "حجز أصل متاح للعميل مقابل دفعة مقدمة" : "Reserve an available asset for a customer and record an advance payment."}>
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
              <span className="label-base">{rtl ? "الدفعة الأولى (إلزامية)" : "Initial Payment (required)"}</span>
              <input type="number" min="0.01" step="0.01" required placeholder="0" className="input-base" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            </label>

            <label className="block">
              <span className="label-base">{rtl ? "طريقة الدفع" : "Payment Method"}</span>
              <NativeSelect value={depositMethod} onChange={(e) => setDepositMethod(e.target.value)}>
                <option value="cash">{rtl ? "نقدي" : "Cash"}</option>
                <option value="card">{rtl ? "بطاقة" : "Card"}</option>
                <option value="transfer">{rtl ? "تحويل" : "Transfer"}</option>
              </NativeSelect>
            </label>

            <label className="block col-span-2">
              <span className="label-base">{rtl ? "تاريخ انتهاء الحجز" : "Expiry Date"}</span>
              <input type="date" required className="input-base" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
            </label>
          </div>

          <p className="text-[10px] text-muted">{rtl ? "الدفعات اللاحقة غير مجدولة وغير محدودة العدد، ويُعاد احتساب المتبقي على الخادم. لا يوجد جدول أقساط." : "Later payments are unscheduled and unlimited; the server recalculates the remaining balance. There is no installment schedule."}</p>

          {!reservationAccountConfigured && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              {rtl ? "لا يمكن تسجيل حجز بعربون قبل تحديد حساب دفعات مقدمة العملاء للحجوزات من الإعدادات المحاسبية." : "A reservation deposit cannot be recorded until the Reservation Advances Account is configured in Accounting Settings."}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setOpenModal(false)}>{common("cancel")}</Button>
            <Button type="submit" disabled={reservationMutation.isPending || !reservationAccountConfigured}>{rtl ? "إنشاء الحجز وتسجيل الدفعة الأولى" : "Create Reservation & Record Initial Payment"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(amendTarget)} onClose={() => setAmendTarget(null)} title={rtl ? "تعديل قطع الحجز" : "Amend Reservation Items"} description={amendTarget?.id || ""}>
        {amendTarget && (
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted">{rtl ? "تُحتسب الأسعار والإجماليات على الخادم من أسعار القطع الحالية. لا يُرسل أي مبلغ من الواجهة." : "Prices and totals are computed on the server from current asset prices. No amounts are submitted from the UI."}</p>
            {canAmendItems && <Section title={rtl ? "إزالة قطع نشطة" : "Remove active items"}>
              {(amendTarget.items ?? []).filter((i) => i.status === "active").map((item) => (
                <label key={item.id} className="flex items-center gap-2 rounded-2xl border border-border p-3 text-xs">
                  <input type="checkbox" checked={amendRemoveIds.includes(item.id)} onChange={() => {
                    setAmendRemoveIds((prev) => toggleId(prev, item.id));
                    setAmendRepriceIds((prev) => prev.filter((id) => id !== item.id));
                  }} />
                  <span>{item.assetName || item.assetId} · {money(item.agreedPrice)}</span>
                </label>
              ))}
            </Section>}
            {canAmendItems && <Section title={rtl ? "إضافة قطع متاحة" : "Add available assets"}>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {availableAssets.map((asset) => (
                  <label key={asset.id} className="flex items-center gap-2 rounded-2xl border border-border p-3 text-xs">
                    <input type="checkbox" checked={amendAddIds.includes(asset.id)} onChange={() => setAmendAddIds((prev) => toggleId(prev, asset.id))} />
                    <span>{asset.name} ({money(asset.price)})</span>
                  </label>
                ))}
              </div>
            </Section>}
            {canRepriceItems && <Section title={rtl ? "إعادة تسعير القطع النشطة" : "Reprice active items"}>
              {(amendTarget.items ?? []).filter((i) => i.status === "active").map((item) => (
                <label key={item.id} className="flex items-center gap-2 rounded-2xl border border-border p-3 text-xs">
                  <input
                    type="checkbox"
                    checked={amendRepriceIds.includes(item.id)}
                    disabled={amendRemoveIds.includes(item.id)}
                    onChange={() => setAmendRepriceIds((prev) => toggleId(prev, item.id))}
                  />
                  <span>{item.assetName || item.assetId} · {money(item.agreedPrice)}</span>
                </label>
              ))}
            </Section>}
            <label className="block">
              <span className="label-base">{rtl ? "سبب التعديل" : "Amendment reason"}</span>
              <input className="input-base" value={amendReason} onChange={(e) => setAmendReason(e.target.value)} />
            </label>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setAmendTarget(null)}>{common("cancel")}</Button>
              <Button type="button" disabled={amendItemsMutation.isPending} onClick={submitAmend}>{rtl ? "تنفيذ التعديل" : "Apply Amendment"}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(renewSource)} onClose={() => setRenewSource(null)} title={rtl ? "تجديد الحجز المنتهي" : "Renew Expired Reservation"} description={renewSource?.id || ""}>
        {renewSource && (
          <div className="space-y-4 text-sm">
            <p className="text-xs text-muted">{rtl ? "يُنشئ حجزاً جديداً بأسعار الخادم الحالية ويحوِّل الرصيد المؤهل. الفائض (إن وُجد) يتطلب استرداداً معتمداً قبل التفعيل." : "Creates a new reservation at current server prices and transfers the eligible balance. Any excess requires an approved refund before activation."}</p>
            <Info label={rtl ? "المدفوع في الحجز السابق" : "Source paid"} value={money(renewSource.paidTotal)} />
            <Section title={rtl ? "قطع الحجز الجديد" : "Successor assets"}>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {availableAssets.map((asset) => (
                  <label key={asset.id} className="flex items-center gap-2 rounded-2xl border border-border p-3 text-xs">
                    <input type="checkbox" checked={renewAssetIds.includes(asset.id)} onChange={() => setRenewAssetIds((prev) => toggleId(prev, asset.id))} />
                    <span>{asset.name} ({money(asset.price)})</span>
                  </label>
                ))}
              </div>
            </Section>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="label-base">{rtl ? "تاريخ انتهاء الحجز الجديد" : "Successor expiry"}</span>
                <input type="date" className="input-base" value={renewExpiry} onChange={(e) => setRenewExpiry(e.target.value)} />
              </label>
              <label className="block">
                <span className="label-base">{rtl ? "طريقة استرداد الفائض" : "Excess refund method"}</span>
                <NativeSelect value={renewRefundMethod} onChange={(e) => setRenewRefundMethod(e.target.value)}>
                  <option value="cash">{rtl ? "نقدي" : "Cash"}</option>
                  <option value="bank">{rtl ? "بنكي" : "Bank"}</option>
                </NativeSelect>
              </label>
            </div>
            <label className="block">
              <span className="label-base">{rtl ? "سبب التجديد" : "Renewal reason"}</span>
              <input className="input-base" value={renewReason} onChange={(e) => setRenewReason(e.target.value)} />
            </label>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setRenewSource(null)}>{common("cancel")}</Button>
              <Button type="button" disabled={renewMutation.isPending} onClick={submitRenew}>{rtl ? "إنشاء التجديد" : "Create Renewal"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border p-3">
      <p className="text-[10px] font-bold uppercase text-muted">{label}</p>
      <p className="mt-1 text-xs font-black text-foreground">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-black text-foreground">{title}</h3>
      {children}
    </div>
  );
}
