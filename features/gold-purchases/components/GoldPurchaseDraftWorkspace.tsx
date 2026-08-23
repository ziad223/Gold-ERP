"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Plus, RefreshCw, Send, ShieldCheck, GitBranch, XCircle, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { DateInput } from "@/components/ui/date-input";
import { apiClient } from "@/lib/api/client";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import type { GoldPurchaseDraft, GoldPurchaseDraftItem } from "@/lib/types";
import {
  cgpBusinessStatusLabel,
  cgpGovernanceLabel,
  cgpIntegrationStatusLabel,
  cgpOperationalStatusLabel,
  cgpPaymentMethodLabel,
  cgpPaymentStatusLabel,
  cgpSettlementStatusLabel,
  cgpReversalStatusLabel,
  formatCgpDate,
  formatCgpDateTime,
  formatCgpMoney,
  formatCgpNumber,
} from "@/lib/cgp/presentation";
import {
  createGoldPurchaseDraft, listGoldPurchaseDrafts, updateGoldPurchaseDraft,
  validateGoldPurchaseDraft, voidGoldPurchaseDraft, submitGoldPurchaseDraft,
  createGoldPurchaseRevision, postGoldPurchaseDraft, getCgpBusinessView, type GoldPurchaseDraftKind, type CgpBusinessView,
  settleCgpDraft,
} from "@/hooks/use-gold-purchase-drafts";

type Reference = { id: string; name: string; status?: string };
const today = () => new Date().toISOString().slice(0, 10);
const blankLine = (kind: GoldPurchaseDraftKind): GoldPurchaseDraftItem => ({
  goldType: "gold", karat: 21, fineness: 0.875, purityFactor: 0.875,
  grossWeight: "", stoneWeight: 0, quantity: 1,
  ...(kind === "igp" ? { investmentType: "physical" } : {}),
});

export function GoldPurchaseDraftWorkspace({ kind }: { kind: GoldPurchaseDraftKind }) {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company, activeBranchId } = useAuth();
  const { hasPermission } = usePermissions();
  const isCgp = kind === "cgp";
  const prefix = `gold_purchase.${kind}`;
  const dedicated = hasPermission(`${prefix}.view`);
  const canRead = dedicated || hasPermission(isCgp ? "sales.view" : "suppliers.view");
  const canCreate = dedicated ? hasPermission(`${prefix}.create`) : hasPermission(isCgp ? "sales.create" : "suppliers.create");
  const canUpdate = dedicated ? hasPermission(`${prefix}.update_draft`) : hasPermission(isCgp ? "sales.create" : "suppliers.update");
  const canValidate = dedicated ? hasPermission(`${prefix}.validate`) : canUpdate;
  const canVoid = dedicated ? hasPermission(`${prefix}.void`) : canUpdate;
  const canSubmit = !isCgp && dedicated && hasPermission(`${prefix}.submit`);
  const canPost = isCgp && hasPermission("gold_purchase.cgp.post");
  const canSettle = isCgp && hasPermission("gold_purchase.cgp.settle");
  const [drafts, setDrafts] = useState<GoldPurchaseDraft[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [selected, setSelected] = useState<GoldPurchaseDraft | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<GoldPurchaseDraftItem[]>([blankLine(kind)]);
  const [businessView, setBusinessView] = useState<CgpBusinessView | null>(null);
  const [settlementMethod, setSettlementMethod] = useState<"CASH" | "BANK" | "MIXED">("CASH");
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [settlementNotes, setSettlementNotes] = useState("");
  const [settlementSaving, setSettlementSaving] = useState(false);
  const [settlementError, setSettlementError] = useState("");

  const load = useCallback(async () => {
    if (!canRead) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const query = new URLSearchParams({ page: String(page), limit: "50" });
      if (status) query.set("status", status);
      const response = await listGoldPurchaseDrafts(kind, query, locale);
      setDrafts(response.data.items); setPages(response.data.pagination.pages);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load drafts"); }
    finally { setLoading(false); }
  }, [canRead, kind, locale, page, status]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!canRead) return;
    apiClient<any>(isCgp ? "/customers?page=1&limit=100" : "/suppliers?page=1&limit=100", { locale })
      .then((r) => { const rows = r.data?.items || r.items || []; setReferences(rows.filter((x: Reference) => x.status !== "inactive")); })
      .catch(() => setReferences([]));
  }, [canRead, isCgp, locale]);

  const title = isCgp ? (rtl ? "مسودات شراء الذهب من العملاء" : "Customer Gold Purchase Drafts") : (rtl ? "مسودات شراء الذهب الاستثماري" : "Investment Gold Purchase Drafts");
  const referenceLabel = isCgp ? (rtl ? "العميل" : "Customer") : (rtl ? "المورد" : "Supplier");
  const reset = () => { setSelected(null); setBusinessView(null); setReferenceId(""); setDate(today()); setNotes(""); setLines([blankLine(kind)]); setError(""); setSettlementError(""); setCashAmount(""); setBankAmount(""); setBankReference(""); setSettlementNotes(""); };
  const edit = (draft: GoldPurchaseDraft) => {
    setSelected(draft); setReferenceId(isCgp ? draft.customerId || "" : draft.supplierId || "");
    setDate((isCgp ? draft.transactionDate : draft.purchaseDate) || today()); setNotes(draft.notes || "");
    setLines(draft.items.map((x) => ({ ...x })));
  };
  useEffect(() => {
    let cancelled = false;
    if (!isCgp || !selected?.id || !["POSTED", "REVERSED"].includes(String(selected.businessStatus || "").toUpperCase())) {
      setBusinessView(null);
      return () => { cancelled = true; };
    }
    void getCgpBusinessView(selected.id, locale).then((response) => { if (!cancelled) setBusinessView(response.data); }).catch(() => { if (!cancelled) setBusinessView(null); });
    return () => { cancelled = true; };
  }, [isCgp, locale, selected?.id, selected?.businessStatus]);
  const updateLine = (index: number, key: keyof GoldPurchaseDraftItem, value: unknown) => setLines((current) => current.map((line, i) => i === index ? { ...line, [key]: value } : line));

  const payload = useMemo(() => ({
    branchId: activeBranchId,
    [isCgp ? "customerId" : "supplierId"]: referenceId,
    [isCgp ? "transactionDate" : "purchaseDate"]: date,
    currency: company?.currency || "AED", exchangeRate: 1, notes,
    items: lines.map((line) => ({ ...line, netWeight: undefined, pureGoldWeight: undefined })),
  }), [activeBranchId, company?.currency, date, isCgp, lines, notes, referenceId]);

  const save = async () => {
    setSaving(true); setError("");
    try {
      const result = selected
        ? await updateGoldPurchaseDraft(kind, selected.id, { ...payload, version: selected.version }, locale)
        : await createGoldPurchaseDraft(kind, payload, locale);
      edit(result.data); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save draft"); }
    finally { setSaving(false); }
  };
  const validate = async () => { if (!selected) return; setSaving(true); try { const r = await validateGoldPurchaseDraft(kind, selected, locale); edit(r.data); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Validation failed"); } finally { setSaving(false); } };
  const voidDraft = async () => { if (!selected) return; const reason = window.prompt(rtl ? "سبب الإلغاء" : "Void reason"); if (!reason) return; setSaving(true); try { await voidGoldPurchaseDraft(kind, selected, reason, locale); reset(); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Void failed"); } finally { setSaving(false); } };
  const submit = async () => { if (!selected) return; setSaving(true); try { const r = await submitGoldPurchaseDraft(kind, selected, locale); edit(r.data.document); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Submission failed"); } finally { setSaving(false); } };
  const post = async () => { if (!selected || selected.businessStatus !== "VALIDATED") return; setSaving(true); setError(""); try { const r = await postGoldPurchaseDraft(selected, locale); edit(r.data.document); await load(); } catch (e) { setError(e instanceof Error ? e.message : (rtl ? "تعذر ترحيل عملية الشراء." : "Posting failed")); } finally { setSaving(false); } };
  const createRevision = async () => { if (!selected) return; setSaving(true); try { const r = await createGoldPurchaseRevision(kind, selected, locale); edit(r.data); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Revision creation failed"); } finally { setSaving(false); } };
  const settle = async () => {
    if (!selected || !businessView?.payable?.id || selected.businessStatus !== "POSTED") return;
    setSettlementSaving(true); setSettlementError("");
    try {
      const result = await settleCgpDraft(selected.id, {
        liabilityId: String(businessView.payable.id), paymentMethod: settlementMethod,
        ...(settlementMethod !== "BANK" ? { cashAmount } : {}),
        ...(settlementMethod !== "CASH" ? { bankAmount, bankReference } : {}),
        notes: settlementNotes || undefined,
      }, locale);
      const refreshed = await getCgpBusinessView(selected.id, locale);
      setBusinessView(refreshed.data);
      setCashAmount(""); setBankAmount(""); setBankReference(""); setSettlementNotes("");
      setError(rtl ? "تم تسجيل الدفعة وتحديث المستحق." : "Payment recorded and payable refreshed.");
      return result;
    } catch (e) { setSettlementError(e instanceof Error ? e.message : (rtl ? "تعذر تسجيل الدفعة." : "Settlement failed")); }
    finally { setSettlementSaving(false); }
  };
  const immutable = selected?.status === "submitted" || selected?.status === "approved" || selected?.businessStatus === "POSTED" || selected?.businessStatus === "REVERSED";
  const historicalReadOnly = selected?.businessStatus === "POSTED" || selected?.businessStatus === "REVERSED";
  const businessStatusLabel = (value?: string) => cgpBusinessStatusLabel(value, locale);
  const governanceLabel = (value?: string) => cgpGovernanceLabel(value, locale);
  const displayDate = (value?: string | null) => formatCgpDate(value, locale);
  const displayDateTime = (value?: string | null) => formatCgpDateTime(value, locale);
  const displayNumber = (value?: number | string | null) => <bdi dir="ltr" className="numeric-token">{formatCgpNumber(value)}</bdi>;
  const displayMoney = (value?: number | string | null, currency = selected?.currency || company?.currency || "AED") => <bdi dir="ltr" className="numeric-token">{formatCgpMoney(value, currency)}</bdi>;
  const paymentStatus = businessView?.settlementSummary?.paymentStatus || selected?.paymentStatus || "UNPAID";
  const paymentStatusLabel = cgpPaymentStatusLabel(paymentStatus, locale);
  const paymentAmount = businessView?.settlementSummary?.paidAmount ?? businessView?.payable?.settledAmount ?? "0.0000";
  const outstandingAmount = businessView?.settlementSummary?.outstandingAmount ?? businessView?.settlementSummary?.remainingAmount ?? businessView?.payable?.outstandingAmount ?? null;
  const originalAmount = businessView?.settlementSummary?.originalAmount ?? businessView?.payable?.originalAmount ?? selected?.totalPayableToCustomer ?? "0.0000";
  const settlementActionable = selected?.businessStatus === "POSTED" && canSettle && businessView?.payable && Number(outstandingAmount || 0) > 0;

  if (!canRead) return <Card className="p-6 text-sm font-bold text-destructive">{rtl ? "لا تملك صلاحية عرض هذه المسودات." : "You do not have permission to view these drafts."}</Card>;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">{title}</h1><p className="text-xs text-muted">{rtl ? "مسودة = إدخال بيانات، التحقق = مراجعة البيانات، والترحيل = تثبيت الشراء وبدء تكامل الأصل والمحاسبة ومركز الذهب." : "Draft = data entry, validation = data verification, and posting = recognition of the purchase and the start of Asset, Accounting, and Gold Center integration."}</p><p className="mt-1 text-xs font-bold text-brand-700 dark:text-brand-300">{isCgp ? (rtl ? "بعد التحقق يتم ترحيل شراء العميل مباشرة. الترحيل هو الذي يثبت الشراء ويبدأ تكامل الأصل والمحاسبة." : "After validation, the customer purchase is posted directly. Posting recognizes the purchase and starts Asset and Accounting integration.") : (rtl ? "لا ينشئ Draft أو التحقق أو الاعتماد الإداري Asset. بعد الترحيل: كل بند/قطعة فعلية = Asset واحد وBarcode فريد." : "Draft, validation, and administrative approval do not create an Asset. After posting: each physical item/piece becomes one Asset with a unique barcode.")}</p></div>{canCreate && <Button variant="secondary" onClick={reset}><Plus className="h-4 w-4" />{rtl ? "شراء جديد" : "New purchase"}</Button>}</div>
    {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-bold text-destructive">{error}</div>}
    <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <Card className="p-5"><div className="mb-4 flex gap-2"><NativeSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">{rtl ? "كل الحالات" : "All statuses"}</option><option value="draft">{rtl ? "مسودة" : "Draft"}</option><option value="validated">{rtl ? "تم التحقق" : "Validated"}</option><option value="submitted">{rtl ? "مرسلة للمراجعة" : "Submitted"}</option><option value="approved">{rtl ? "معتمدة" : "Approved"}</option></NativeSelect><Button variant="secondary" onClick={() => void load()}><RefreshCw className="h-4 w-4" /></Button></div>
        {loading ? <p className="py-10 text-center text-muted">{rtl ? "جارٍ التحميل..." : "Loading..."}</p> : drafts.length === 0 ? <p className="py-10 text-center text-muted">{rtl ? "لا توجد مسودات." : "No drafts found."}</p> : <div className="space-y-2">{drafts.map((draft) => <button key={draft.id} onClick={() => edit(draft)} className="w-full rounded-2xl border border-border p-3 text-start transition hover:border-brand-400 hover:bg-brand-500/5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono font-black" dir="ltr">{draft.draftNumber}</span><div className="flex flex-wrap items-center gap-2 text-xs font-bold"><span className={draft.businessStatus === "POSTED" ? "text-emerald-600" : draft.businessStatus === "VALIDATED" ? "text-sky-600" : "text-amber-600"}>{businessStatusLabel(draft.businessStatus || draft.status)}</span>{isCgp && draft.businessStatus === "POSTED" && <span className="rounded-full border border-border px-2 py-0.5">{cgpPaymentStatusLabel(draft.paymentStatus || "UNPAID", locale)}</span>}</div></div><p className="mt-1 text-xs text-muted">{draft.customer?.name || draft.supplier?.name} · {draft.branch?.name}</p><p className="mt-1 text-xs text-muted" dir="ltr">{displayDate(isCgp ? draft.transactionDate : draft.purchaseDate)}</p></button>)}</div>}
        <div className="mt-4 flex items-center justify-between text-xs"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{rtl ? "السابق" : "Previous"}</Button><span>{page} / {Math.max(pages, 1)}</span><Button variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>{rtl ? "التالي" : "Next"}</Button></div>
      </Card>
      <Card className="space-y-5 p-5"><div className="space-y-3" id="cgp-overview"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold text-muted">{rtl ? "شراء الذهب من العميل" : "Customer Gold Purchase"}</p><h2 className="font-black" dir="ltr">{selected?.draftNumber || (rtl ? "شراء جديد — مسودة" : "New purchase — Draft")}</h2>{selected && <p className="mt-1 text-xs text-muted">{selected.customer?.name || references.find((x) => x.id === referenceId)?.name || "—"} · {selected.branch?.name || "—"} · <span dir="ltr">{displayDate(isCgp ? selected.transactionDate : selected.purchaseDate)}</span></p>}</div>{selected && <div className="flex flex-wrap items-center gap-2 text-xs font-bold"><span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1">{businessStatusLabel(selected.businessStatus || selected.status)}</span>{isCgp && historicalReadOnly && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">{paymentStatusLabel}</span>}<span className="text-muted">{governanceLabel(selected.governanceStatus)}</span></div>}</div>{selected && historicalReadOnly && isCgp && <nav aria-label={rtl ? "تنقل مستند شراء الذهب" : "CGP sections"} className="flex flex-wrap gap-2 text-xs"><a className="rounded-full border border-border px-3 py-1 hover:border-brand-400" href="#cgp-financial">{rtl ? "الملخص المالي" : "Financial summary"}</a><a className="rounded-full border border-border px-3 py-1 hover:border-brand-400" href="#cgp-integrations">{rtl ? "التكاملات" : "Integrations"}</a><a className="rounded-full border border-border px-3 py-1 hover:border-brand-400" href="#cgp-assets">{rtl ? "الأصول" : "Assets"}</a><a className="rounded-full border border-border px-3 py-1 hover:border-brand-400" href="#cgp-settlements">{rtl ? "التسويات" : "Settlements"}</a><a className="rounded-full border border-border px-3 py-1 hover:border-brand-400" href="#cgp-technical">{rtl ? "التفاصيل" : "Details"}</a></nav>}</div>
         {immutable && <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 p-3 text-xs font-bold">{selected?.businessStatus === "POSTED" ? (rtl ? "تم ترحيل الشراء. هذا المستند للعرض فقط وتظهر أدناه نتائج التكامل والتسوية." : "Posted purchase. This document is read-only; integration and settlement results are shown below.") : selected?.businessStatus === "REVERSED" ? (rtl ? "تم عكس العملية. السجل التاريخي للعرض فقط." : "Reversed purchase. Historical record is read-only.") : selected?.status === "approved" ? (rtl ? "المستند معتمد وغير قابل للتعديل. أنشئ مراجعة جديدة للتغيير." : "Approved and immutable. Create a revision to make changes.") : (rtl ? "المستند قيد المراجعة وغير قابل للتعديل." : "Submitted for review and immutable.")}</div>}
         {selected?.lastRejectionReason && <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-xs"><strong>{rtl ? "آخر سبب رفض: " : "Last rejection: "}</strong>{selected.lastRejectionReason}</div>}
         {historicalReadOnly ? <div className="space-y-4" data-cgp-readonly-result="true">
            <div className="grid gap-3 sm:grid-cols-2"><div><span className="label-base">{referenceLabel}</span><p className="font-semibold">{references.find((x) => x.id === referenceId)?.name || referenceId || "—"}</p></div><div><span className="label-base">{rtl ? "تاريخ الشراء" : "Purchase date"}</span><p className="font-semibold" dir="ltr">{displayDate(date)}</p></div></div>
            <div className="grid gap-3 sm:grid-cols-2">{lines.map((line, index) => <div key={index} className="rounded-2xl border border-border p-4"><strong>{rtl ? `بند ${index + 1}` : `Line ${index + 1}`}</strong><p className="mt-2 text-sm">{line.notes || (rtl ? "بدون وصف" : "No description")}</p><p className="text-xs text-muted">{rtl ? "العيار" : "Karat"}: {displayNumber(line.karat)} · {rtl ? "إجمالي" : "Gross"}: {displayNumber(line.grossWeight)}g · {rtl ? "صافي" : "Net"}: {displayNumber(line.netWeight)}g · {rtl ? "ذهب خالص" : "Pure"}: {displayNumber(line.pureGoldWeight)}g</p></div>)}</div>
           <p className="text-xs text-muted">{notes || (rtl ? "لا توجد ملاحظات." : "No notes.")}</p>
           {isCgp && <div className="rounded-2xl border border-border bg-background/60 p-4" aria-label={rtl ? "مراحل العملية" : "Purchase and payment progress"}><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-black">{rtl ? "مراحل العملية" : "Progress"}</h3><span className="text-xs text-muted">{rtl ? "السداد منفصل عن حالة الترحيل" : "Payment is separate from the posting lifecycle"}</span></div><ol className="grid gap-2 text-xs sm:grid-cols-3"><li className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 font-bold">✓ {rtl ? "تم التحقق" : "Validated"}</li><li className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-3 font-bold">✓ {rtl ? "تم الترحيل" : "Posted"}</li><li className={`rounded-xl border p-3 font-bold ${paymentStatus === "FULLY_PAID" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"}`}>{paymentStatus === "FULLY_PAID" ? "✓" : "○"} {rtl ? "تم سداد العميل" : "Customer paid"}</li></ol></div>}
           {isCgp && <div className="space-y-4 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4" data-cgp-business-dashboard="true" id="cgp-integrations">
             <h3 className="font-black">{rtl ? "نتائج الترحيل والتكامل" : "Posting and integration results"}</h3>
              <div className="grid gap-3 sm:grid-cols-2"><div><span className="label-base">{rtl ? "الأصول / المخزون" : "Assets / Inventory"}</span><p className="font-semibold">{cgpIntegrationStatusLabel("INVENTORY", businessView?.integrationSummary?.inventory?.status || (businessView ? (businessView.assets.length ? "SUCCEEDED" : "PENDING") : "PENDING"), locale)}</p></div><div><span className="label-base">{rtl ? "المحاسبة" : "Accounting"}</span><p className="font-semibold">{cgpIntegrationStatusLabel("ACCOUNTING", businessView?.accounting?.status || "PENDING", locale)}{businessView?.accounting?.journalEntryId ? <span dir="ltr"> · {businessView.accounting.journalEntryId}</span> : ""}</p></div><div><span className="label-base">{rtl ? "مركز الذهب" : "Gold Center"}</span><p className="font-semibold">{cgpIntegrationStatusLabel("GOLD_CENTER", businessView?.integrationSummary?.goldCenter?.status || (businessView?.goldCenter ? "SUCCEEDED" : "PENDING"), locale)}</p></div><div><span className="label-base">{rtl ? "سجل العميل" : "CRM"}</span><p className="font-semibold">{cgpIntegrationStatusLabel("CRM", businessView?.integrationSummary?.crm?.status || "PENDING", locale)}</p></div></div>
              <div id="cgp-assets"><h4 className="mb-2 font-black">{rtl ? "الأصول المنشأة" : "Created Assets"}</h4>{businessView?.assets?.length ? <div className="grid gap-2 sm:grid-cols-2">{businessView.assets.map((asset) => <div key={asset.id} className="rounded-xl border border-border p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{asset.name || asset.description || "—"}</strong><bdi className="numeric-token font-mono" dir="ltr">{asset.barcode || "—"}</bdi></div><p className="mt-2 text-xs text-muted">{rtl ? "الحالة" : "Status"}: {cgpOperationalStatusLabel(asset.operationalStatus || asset.status, locale)} · {rtl ? "العيار" : "Karat"}: {displayNumber(asset.karat)} · {rtl ? "الصافي" : "Net"}: {displayNumber(asset.netWeight)}g · {rtl ? "الذهب الخالص" : "Pure"}: {displayNumber(asset.pureGoldWeight)}g</p><div className="mt-2 flex flex-wrap items-center gap-3"><Link href={`/inventory/${encodeURIComponent(asset.id)}`} className="text-xs font-bold text-brand-700 hover:underline dark:text-brand-300">{rtl ? "عرض الأصل في المخزون" : "View asset in inventory"}</Link><details className="text-xs"><summary className="cursor-pointer font-bold">{rtl ? "معرّف الأصل" : "Asset ID"}</summary><bdi className="numeric-token" dir="ltr">{asset.id}</bdi></details></div></div>)}</div> : <p className="text-sm text-muted">{rtl ? "لم يُنشأ أصل بعد أو ما زال التكامل معلقًا." : "No asset yet or integration is pending."}</p>}</div>
              <div id="cgp-financial" className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-background p-4"><span className="label-base">{rtl ? "قيمة الشراء" : "Purchase value"}</span><p className="mt-2 text-lg font-black">{displayMoney(originalAmount)} <span dir="ltr">{selected.currency}</span></p></div><div className="rounded-2xl border border-border bg-background p-4"><span className="label-base">{rtl ? "المدفوع للعميل" : "Paid to customer"}</span><p className="mt-2 text-lg font-black">{displayMoney(paymentAmount)} <span dir="ltr">{selected.currency}</span></p></div><div className={`rounded-2xl border p-4 ${paymentStatus === "FULLY_PAID" ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-background"}`}><span className="label-base">{rtl ? "المتبقي للعميل" : "Remaining to customer"}</span><p className="mt-2 text-lg font-black">{displayMoney(outstandingAmount)} <span dir="ltr">{selected.currency}</span></p></div></div>
              <div id="cgp-settlements"><h4 className="mb-2 font-black">{rtl ? "تاريخ التسوية" : "Settlement history"}</h4>{businessView?.settlements?.length ? <div className="space-y-2">{businessView.settlements.map((row, index) => <div key={`${row.id}-${index}`} className="rounded-xl border border-border bg-background p-3"><div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold"><span>{cgpPaymentMethodLabel(row.method, locale)}</span><bdi className="numeric-token" dir="ltr">{displayMoney(row.amount, selected.currency)} <span>{selected.currency}</span></bdi></div><p className="mt-1 text-xs text-muted" dir="ltr">{displayDateTime(row.executedAt)} · {cgpSettlementStatusLabel(row.status, locale)}</p>{(row.bankReference || row.journalEntryId) && <p className="mt-1 text-xs text-muted">{row.bankReference ? `${rtl ? "المرجع" : "Reference"}: ` : ""}<bdi className="numeric-token" dir="ltr">{row.bankReference || row.journalEntryId}</bdi></p>}</div>)}</div> : <p className="text-sm text-muted">{selected?.businessStatus === "POSTED" && !businessView?.payable ? (rtl ? "لا يمكن إتاحة التسوية لأن التكامل المالي للعملية لم يكتمل بعد." : "Settlement is not available because financial integration has not completed yet.") : (rtl ? "لم تُسجل دفعة. الترحيل لا ينشئ حركة خزينة تلقائيًا." : "No payment recorded. Posting does not create a Treasury movement.")}</p>}</div>
             {settlementActionable && <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4" data-cgp-settlement-form="true">
               <h4 className="font-black">{rtl ? "تسجيل دفعة للعميل" : "Record customer payment"}</h4>
                <p className="text-xs text-muted">{rtl ? "المستحق الحالي" : "Current payable"}: {displayMoney(outstandingAmount)} <span dir="ltr">{selected.currency}</span></p>
               <div className="grid gap-3 sm:grid-cols-3"><label><span className="label-base">{rtl ? "طريقة الدفع" : "Payment method"}</span><NativeSelect value={settlementMethod} onChange={(e) => setSettlementMethod(e.target.value as "CASH" | "BANK" | "MIXED")}><option value="CASH">{rtl ? "نقدي" : "Cash"}</option><option value="BANK">{rtl ? "بنك" : "Bank"}</option><option value="MIXED">{rtl ? "مختلط" : "Mixed"}</option></NativeSelect></label>{settlementMethod !== "BANK" && <label><span className="label-base">{rtl ? "مبلغ نقدي" : "Cash amount"}</span><input className="input-base" inputMode="decimal" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} /></label>}{settlementMethod !== "CASH" && <label><span className="label-base">{rtl ? "مبلغ بنكي" : "Bank amount"}</span><input className="input-base" inputMode="decimal" value={bankAmount} onChange={(e) => setBankAmount(e.target.value)} /></label>}</div>
               {settlementMethod !== "CASH" && <label className="block"><span className="label-base">{rtl ? "مرجع البنك" : "Bank reference"}</span><input className="input-base" value={bankReference} onChange={(e) => setBankReference(e.target.value)} /></label>}
               <label className="block"><span className="label-base">{rtl ? "ملاحظات" : "Notes"}</span><textarea className="input-base min-h-16" value={settlementNotes} onChange={(e) => setSettlementNotes(e.target.value)} /></label>
                <p className="text-xs text-muted">{rtl ? "هذه الدفعة" : "This payment"}: {displayMoney((Number(cashAmount) || 0) + (Number(bankAmount) || 0))} · {rtl ? "المتبقي بعد الدفع" : "Remaining after payment"}: {displayMoney(Math.max(0, Number(outstandingAmount || 0) - (Number(cashAmount) || 0) - (Number(bankAmount) || 0)))}</p>
               {settlementError && <p className="text-xs font-bold text-destructive">{settlementError}</p>}
               <Button disabled={settlementSaving} onClick={settle}>{settlementSaving ? (rtl ? "جارٍ التسجيل..." : "Recording...") : (rtl ? "تسجيل الدفعة" : "Record payment")}</Button>
             </div>}
             {selected.businessStatus === "POSTED" && !canSettle && businessView?.payable && Number(outstandingAmount || 0) > 0 && <p className="text-xs text-muted">{rtl ? "يمكنك عرض المستحق فقط؛ صلاحية تسجيل الدفعة غير متاحة." : "Read-only payable summary; settlement permission is not available."}</p>}
             {selected.businessStatus === "POSTED" && paymentStatus === "FULLY_PAID" && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm font-bold text-emerald-800 dark:text-emerald-200">{rtl ? "تم ترحيل عملية الشراء وسداد مستحق العميل بالكامل." : "The purchase was posted and the customer payable was fully settled."}</div>}
              {businessView?.reversal && <p className="text-xs font-bold">{rtl ? "حالة العكس" : "Reversal"}: {cgpReversalStatusLabel(businessView.reversal.status, locale)}</p>}
              {businessView?.pricingSnapshots?.length ? <p className="text-xs text-muted">{rtl ? "لقطة التسعير ثابتة بعد الترحيل" : "Pricing snapshot is immutable after posting"}: {businessView.pricingSnapshots.map((x, index) => <span key={`${x.karat}-${x.approvedKaratRate}`} dir="ltr">{index > 0 ? " · " : ""}{formatCgpNumber(x.karat)}K @ {formatCgpNumber(x.approvedKaratRate)}</span>)}</p> : null}
              <details id="cgp-technical" className="rounded-xl border border-border p-3 text-xs"><summary className="cursor-pointer font-bold">{rtl ? "تفاصيل تقنية" : "Technical details"}</summary><div className="mt-2 space-y-1 text-muted">{selected.postingReference && <p>{rtl ? "مرجع الترحيل" : "Posting reference"}: <bdi className="numeric-token" dir="ltr">{selected.postingReference}</bdi></p>}{businessView?.payable?.id && <p>{rtl ? "معرّف المستحق" : "Payable ID"}: <bdi className="numeric-token" dir="ltr">{businessView.payable.id}</bdi></p>}{businessView?.accounting?.journalEntryId && <p>{rtl ? "مرجع القيد" : "Journal reference"}: <bdi className="numeric-token" dir="ltr">{businessView.accounting.journalEntryId}</bdi></p>}</div></details>
           </div>}
         </div> : <>
         <div className="grid gap-3 sm:grid-cols-2"><label><span className="label-base">{referenceLabel}</span><NativeSelect value={referenceId} onChange={(e) => setReferenceId(e.target.value)}><option value="">—</option>{references.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</NativeSelect></label><label><span className="label-base">{rtl ? "التاريخ" : "Date"}</span><DateInput className="input-base" value={date} onChange={setDate} /></label></div>
         {lines.map((line, index) => <div key={index} className="rounded-2xl border border-border p-4"><div className="mb-3 flex justify-between"><strong>{rtl ? `بند ${index + 1}` : `Line ${index + 1}`}</strong>{lines.length > 1 && <button onClick={() => setLines((x) => x.filter((_, i) => i !== index))} className="text-destructive"><XCircle className="h-4 w-4" /></button>}</div>
          {kind === "igp" && <div className="mb-3 grid gap-3 sm:grid-cols-2"><label><span className="label-base">{rtl ? "نوع الاستثمار" : "Investment type"}</span><NativeSelect value={line.investmentType} onChange={(e) => updateLine(index, "investmentType", e.target.value)}><option value="physical">Physical</option><option value="bullion">Bullion</option></NativeSelect></label>{line.investmentType === "bullion" && <label><span className="label-base">{rtl ? "هوية السبيكة" : "Bullion identity"}</span><NativeSelect value={line.bullionIdentityType || "serialized_unit"} onChange={(e) => updateLine(index, "bullionIdentityType", e.target.value)}><option value="serialized_unit">Serialized unit</option><option value="bullion_lot">Bullion lot</option></NativeSelect></label>}</div>}
          {kind === "igp" && line.investmentType === "bullion" && <label className="mb-3 block"><span className="label-base">{line.bullionIdentityType === "bullion_lot" ? (rtl ? "رقم التشغيلة" : "Lot number") : (rtl ? "الرقم التسلسلي" : "Serial number")}</span><input className="input-base" value={line.bullionIdentityType === "bullion_lot" ? line.lotNumber || "" : line.serialNumber || ""} onChange={(e) => updateLine(index, line.bullionIdentityType === "bullion_lot" ? "lotNumber" : "serialNumber", e.target.value)} /></label>}
           <div className="grid gap-3 sm:grid-cols-3"><label><span className="label-base">{rtl ? "الوزن القائم" : "Gross weight"}</span><input className="input-base" type="number" step="0.000001" value={line.grossWeight} onChange={(e) => updateLine(index, "grossWeight", e.target.value)} /></label><label><span className="label-base">{rtl ? "وزن الأحجار" : "Stone weight"}</span><input className="input-base" type="number" step="0.000001" value={line.stoneWeight} onChange={(e) => updateLine(index, "stoneWeight", e.target.value)} /></label><label><span className="label-base">{rtl ? "العيار" : "Karat"}</span><NativeSelect value={line.karat} onChange={(e) => { const k = Number(e.target.value); const p = k === 24 ? 1 : k === 22 ? 0.916 : k === 21 ? 0.875 : 0.75; updateLine(index, "karat", k); updateLine(index, "purityFactor", p); updateLine(index, "fineness", p); }}><option value="18">18</option><option value="21">21</option><option value="22">22</option><option value="24">24</option></NativeSelect></label></div>
           {isCgp && <label className="mt-3 block"><span className="label-base">{rtl ? "وصف القطعة / اسمها في المخزون" : "Piece description / Inventory name"}</span><input className="input-base" value={line.notes || ""} onChange={(e) => updateLine(index, "notes", e.target.value)} placeholder={rtl ? "مثال: خاتم ذهب مستعمل" : "Example: used gold ring"} /></label>}
            {line.netWeight !== undefined && <p className="mt-3 text-xs text-muted">{rtl ? "الصافي" : "Net"}: {displayNumber(line.netWeight)}g · {rtl ? "الذهب الخالص" : "Pure"}: {displayNumber(line.pureGoldWeight)}g</p>}
         </div>)}
         <Button variant="secondary" onClick={() => setLines((x) => [...x, blankLine(kind)])}><Plus className="h-4 w-4" />{rtl ? "إضافة بند" : "Add line"}</Button>
         <label className="block"><span className="label-base">{rtl ? "ملاحظات" : "Notes"}</span><textarea className="input-base min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
         </>}
         <div className="flex flex-wrap justify-end gap-2">{selected && !immutable && canVoid && <Button variant="secondary" disabled={saving} onClick={voidDraft}><XCircle className="h-4 w-4" />{rtl ? "إلغاء المسودة" : "Void"}</Button>}{selected && selected.status === "draft" && canValidate && <Button variant="secondary" disabled={saving} onClick={validate}><ShieldCheck className="h-4 w-4" />{rtl ? "التحقق من البيانات" : "Validate data"}</Button>}{selected && selected.status === "validated" && !historicalReadOnly && canSubmit && <Button variant="secondary" disabled={saving} onClick={submit}><Send className="h-4 w-4" />{rtl ? "إرسال للمراجعة الإدارية" : "Submit for governance review"}</Button>}{selected && selected.businessStatus === "VALIDATED" && canPost && <Button disabled={saving} onClick={post}><UploadCloud className="h-4 w-4" />{rtl ? "ترحيل عملية الشراء" : "Post purchase"}</Button>}{selected?.status === "approved" && !historicalReadOnly && canCreate && <Button disabled={saving} onClick={createRevision}><GitBranch className="h-4 w-4" />{rtl ? "إنشاء مراجعة" : "Create revision"}</Button>}{((selected && !immutable && canUpdate) || (!selected && canCreate)) && <Button disabled={saving} onClick={save}>{saving ? (rtl ? "جارٍ الحفظ..." : "Saving...") : (rtl ? "حفظ المسودة" : "Save draft")}</Button>}</div>
      </Card>
    </div>
  </div>;
}
