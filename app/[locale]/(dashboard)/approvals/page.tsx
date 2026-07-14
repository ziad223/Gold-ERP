"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X, ShieldAlert, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { AuditDiffViewer } from "@/features/audit/components/AuditDiffViewer";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { listGoldPurchaseApprovals, reviewGoldPurchaseDraft } from "@/hooks/use-gold-purchase-drafts";
import type { GoldPurchaseApprovalRequest } from "@/lib/types";

interface ApprovalRequest {
  id: string;
  type: "price-override" | "process-loss" | "manual-stock";
  title: string;
  requestedBy: string;
  branch: string;
  date: string;
  reason: string;
  before: Record<string, any>;
  after: Record<string, any>;
}

const initialApprovals: ApprovalRequest[] = [
  {
    id: "APR-10490",
    type: "price-override",
    title: "خاتم ألماس سوليتير - تعديل السعر",
    requestedBy: "ليلى عادل (صراف)",
    branch: "فرع أبوظبي",
    date: "2026-06-13 11:40",
    reason: "خصم إضافي للعميل VIP مريم سالم لتسهيل إتمام الصفقة",
    before: { price: 12800, discount: 0, status: "available" },
    after: { price: 12100, discount: 700, status: "sold" },
  },
  {
    id: "APR-10491",
    type: "process-loss",
    title: "أمر تصنيع MO-908 - فاقد صياغة مرتفع",
    requestedBy: "أحمد يوسف (مشرف ورشة)",
    branch: "المصنع الرئيسي",
    date: "2026-06-12 15:20",
    reason: "صهر كسر ذهب مستعمل مع ترصيع قديم مما رفع نسبة الفاقد لـ 6.1%",
    before: { inputWeight: "42.00g", outputWeight: "40.20g", lossPercent: "4.28%" },
    after: { inputWeight: "42.00g", outputWeight: "39.43g", lossPercent: "6.11%" },
  },
  {
    id: "APR-10492",
    type: "manual-stock",
    title: "تسوية مخزنية يدوية - قطعة ذهب مفقودة",
    requestedBy: "محمد سالم (أمين مخزن)",
    branch: "فرع دبي مول",
    date: "2026-06-12 09:12",
    reason: "تعديل رصيد أصل ذهب غير متواجد بالرف بعد تدقيق الباركود",
    before: { status: "available", location: "خزنة A · رف 04" },
    after: { status: "sold", location: "خزنة A · رف 04 (تسوية شطب)" },
  }
];

export default function ApprovalsPage() {
  const t = useTranslations("Audit");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  
  const [requests, setRequests] = useState<ApprovalRequest[]>(initialApprovals);
  const [successMsg, setSuccessMsg] = useState("");
  const [goldRequests, setGoldRequests] = useState<GoldPurchaseApprovalRequest[]>([]);
  const [goldError, setGoldError] = useState("");
  const [selfReviewRequest, setSelfReviewRequest] = useState<GoldPurchaseApprovalRequest | null>(null);
  const [selfReviewDecision, setSelfReviewDecision] = useState<"approve" | "reject">("approve");
  const [selfReviewReason, setSelfReviewReason] = useState("");
  const canReviewGold = ["cgp", "igp"].some((kind) => hasPermission(`gold_purchase.${kind}.approve`) || hasPermission(`gold_purchase.${kind}.reject`));

  const loadGoldRequests = useCallback(async () => {
    if (!canReviewGold) return;
    try {
      const response = await listGoldPurchaseApprovals(new URLSearchParams({ approvalStatus: "pending", page: "1", limit: "100" }), locale);
      setGoldRequests(response.data.items); setGoldError("");
    } catch (error) { setGoldError(error instanceof Error ? error.message : "Failed to load Gold Purchase approvals"); }
  }, [canReviewGold, locale]);

  useEffect(() => { void loadGoldRequests(); }, [loadGoldRequests]);

  const reviewGold = async (request: GoldPurchaseApprovalRequest, decision: "approve" | "reject", suppliedReason: string | null = null) => {
    const reason = suppliedReason ?? (decision === "reject" ? window.prompt(rtl ? "سبب الرفض" : "Rejection reason") : null);
    if (decision === "reject" && !reason) return;
    try {
      await reviewGoldPurchaseDraft(request.aggregateType, request.documentId, request.documentVersion + 1, request.version, decision, reason, locale);
      setSuccessMsg(decision === "approve" ? (rtl ? "تم اعتماد طلب شراء الذهب." : "Gold Purchase approved.") : (rtl ? "تم رفض طلب شراء الذهب وإعادته كمسودة." : "Gold Purchase rejected back to draft."));
      await loadGoldRequests();
    } catch (error) { setGoldError(error instanceof Error ? error.message : "Gold Purchase review failed"); }
  };

  const openSelfReview = (request: GoldPurchaseApprovalRequest, decision: "approve" | "reject") => {
    setSelfReviewRequest(request);
    setSelfReviewDecision(decision);
    setSelfReviewReason("");
  };

  const confirmSelfReview = async () => {
    if (!selfReviewRequest || !selfReviewReason.trim()) return;
    await reviewGold(selfReviewRequest, selfReviewDecision, selfReviewReason.trim());
    setSelfReviewRequest(null);
    setSelfReviewReason("");
  };

  const handleAction = (id: string, approve: boolean) => {
    setRequests((current) => current.filter((r) => r.id !== id));
    setSuccessMsg(
      approve
        ? (rtl ? `تم اعتماد طلب التجاوز والموافقة عليه: ${id}` : `Override request approved: ${id}`)
        : (rtl ? `تم رفض طلب التجاوز: ${id}` : `Override request rejected: ${id}`)
    );
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const typeLabels = (type: ApprovalRequest["type"]) => {
    switch (type) {
      case "price-override": return rtl ? "تجاوز السعر والخصومات" : "Price Discount Override";
      case "process-loss": return rtl ? "تجاوز فاقد تصنيع مرتفع" : "Excess Process Loss Override";
      case "manual-stock": return rtl ? "تسوية مخازن يدوية" : "Manual Stock Adjustment";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={rtl ? "صندوق الموافقات والرقابة" : "Approvals Inbox & Control"}
        description={rtl ? "مراجعة واعتماد طلبات التجاوز الاستثنائية والفاقد والخصومات قبل الترحيل المالي" : "Authorize or reject cashier discounts, high manufacturing loss, and manual stock overrides."}
      />

      {successMsg && (
        <div className="flex items-center gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {canReviewGold && <section className="space-y-3">
        <h2 className="text-lg font-black">{rtl ? "موافقات شراء الذهب" : "Gold Purchase approvals"}</h2>
        {goldError && <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{goldError}</div>}
        {goldRequests.length === 0 ? <Card className="p-6 text-center text-xs text-muted">{rtl ? "لا توجد طلبات شراء ذهب معلقة ضمن نطاقك." : "No scoped Gold Purchase approvals are pending."}</Card> : goldRequests.map((request) => {
          const snapshot = request.submittedSnapshot as { documentNumber?: string; createdBy?: string; reference?: { name?: string }; items?: unknown[] };
          const selfReview = user?.id === request.requestedBy || user?.id === snapshot.createdBy;
          const canApprove = hasPermission(`gold_purchase.${request.aggregateType}.approve`);
          const canReject = hasPermission(`gold_purchase.${request.aggregateType}.reject`);
          const canSelfReview = hasPermission(`gold_purchase.${request.aggregateType}.self_approve`);
          return <Card key={request.id} className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs text-muted">{request.id}</p><h3 className="font-black">{snapshot.documentNumber || request.documentId}</h3><p className="text-xs text-muted">{request.aggregateType.toUpperCase()} · {snapshot.reference?.name || "—"} · {snapshot.items?.length || 0} {rtl ? "بند" : "lines"}</p></div><Badge tone="amber">{request.approvalStatus}</Badge></div>
            <div className="rounded-2xl border border-border bg-background p-3 text-xs"><p><strong>{rtl ? "بصمة النسخة: " : "Snapshot hash: "}</strong><span className="font-mono">{request.submittedSnapshotHash}</span></p><p className="mt-1"><strong>{rtl ? "مقدم الطلب: " : "Requested by: "}</strong>{request.requestedBy}</p></div>
            {selfReview && !canSelfReview ? <p className="text-xs font-bold text-destructive">{rtl ? "لا يمكن للمنشئ أو مقدم الطلب مراجعة طلبه دون صلاحية الموافقة الذاتية." : "The creator or submitter cannot review this request without self-review permission."}</p> : selfReview ? <div className="space-y-2"><p className="text-xs font-bold text-amber-700 dark:text-amber-300">{rtl ? "هذه موافقة ذاتية وسيتم تسجيلها في سجل التدقيق." : "This is a self-review and will be recorded in the audit trail."}</p><div className="flex justify-end gap-2">{canReject && <Button variant="danger" size="sm" onClick={() => openSelfReview(request, "reject")}><X className="h-4 w-4" />{rtl ? "رفض" : "Reject"}</Button>}{canApprove && <Button size="sm" onClick={() => openSelfReview(request, "approve")}><Check className="h-4 w-4" />{rtl ? "اعتماد" : "Approve"}</Button>}</div></div> : <div className="flex justify-end gap-2">{canReject && <Button variant="danger" size="sm" onClick={() => void reviewGold(request, "reject")}><X className="h-4 w-4" />{rtl ? "رفض" : "Reject"}</Button>}{canApprove && <Button size="sm" onClick={() => void reviewGold(request, "approve")}><Check className="h-4 w-4" />{rtl ? "اعتماد" : "Approve"}</Button>}</div>}
          </Card>;
        })}
      </section>}

      {selfReviewRequest && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={rtl ? "موافقة ذاتية" : "Self Approval"}>
        <Card className="w-full max-w-lg space-y-4 p-6 shadow-2xl">
          <div><h2 className="text-lg font-black">{rtl ? "موافقة ذاتية" : "Self Approval"}</h2><p className="mt-1 text-sm text-muted">{rtl ? "هذه موافقة ذاتية وسيتم تسجيلها في سجل التدقيق." : "This self-review will be recorded in the audit trail."}</p></div>
          <label className="block text-sm font-bold">{rtl ? "السبب مطلوب" : "Reason is required"}<textarea className="input-base mt-2 min-h-24 w-full" value={selfReviewReason} onChange={(event) => setSelfReviewReason(event.target.value)} autoFocus /></label>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setSelfReviewRequest(null)}>{rtl ? "إلغاء" : "Cancel"}</Button><Button variant={selfReviewDecision === "reject" ? "danger" : "primary"} disabled={!selfReviewReason.trim()} onClick={() => void confirmSelfReview()}>{selfReviewDecision === "approve" ? (rtl ? "تأكيد الاعتماد" : "Confirm approval") : (rtl ? "تأكيد الرفض" : "Confirm rejection")}</Button></div>
        </Card>
      </div>}

      <div className="space-y-6">
        {requests.length === 0 ? (
          <Card className="p-8 text-center text-muted text-xs">
            {rtl ? "لا توجد طلبات موافقة معلقة حالياً." : "No pending approval overrides found."}
          </Card>
        ) : (
          requests.map((req) => (
            <Card key={req.id} className="p-5 flex flex-col lg:flex-row gap-6 justify-between items-stretch">
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-foreground">{req.title}</span>
                    <Badge tone="amber">{req.id}</Badge>
                  </div>
                  <Badge tone="violet">{typeLabels(req.type)}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 text-xs">
                  <div className="p-3 bg-background rounded-2xl">
                    <p className="text-[10px] text-muted">{rtl ? "طلب من:" : "Requested By:"}</p>
                    <p className="mt-1 font-bold text-foreground">{req.requestedBy}</p>
                  </div>
                  <div className="p-3 bg-background rounded-2xl">
                    <p className="text-[10px] text-muted">{rtl ? "الفرع:" : "Branch:"}</p>
                    <p className="mt-1 font-bold text-foreground">{req.branch}</p>
                  </div>
                  <div className="p-3 bg-background rounded-2xl">
                    <p className="text-[10px] text-muted">{rtl ? "التاريخ:" : "Date:"}</p>
                    <p className="mt-1 font-bold text-foreground">{req.date}</p>
                  </div>
                </div>

                <div className="text-xs leading-5 text-muted">
                  <span className="font-extrabold text-foreground block mb-1">
                    {rtl ? "السبب المذكور للتجاوز:" : "Reason for Override:"}
                  </span>
                  <p className="bg-warning/5 p-3 rounded-2xl border border-dashed border-warning/20">
                    {req.reason}
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-xs font-black text-foreground block mb-2">
                    {rtl ? "مقارنة تعديل الحقول (قبل / بعد):" : "Field Modification Diff (Before / After):"}
                  </span>
                  <AuditDiffViewer before={req.before} after={req.after} />
                </div>
              </div>

              {/* Action columns */}
              <div className="flex flex-row lg:flex-col justify-end gap-2 shrink-0 self-end lg:self-center">
                <Button variant="danger" className="text-xs" size="sm" onClick={() => handleAction(req.id, false)}>
                  <X className="h-4 w-4" />
                  {rtl ? "رفض الطلب" : "Reject"}
                </Button>
                <Button className="text-xs" size="sm" onClick={() => handleAction(req.id, true)}>
                  <Check className="h-4 w-4" />
                  {rtl ? "اعتماد وموافقة" : "Approve Override"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
