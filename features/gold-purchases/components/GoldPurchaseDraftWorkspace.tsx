"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Plus, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import type { GoldPurchaseDraft, GoldPurchaseDraftItem } from "@/lib/types";
import {
  createGoldPurchaseDraft, listGoldPurchaseDrafts, updateGoldPurchaseDraft,
  validateGoldPurchaseDraft, voidGoldPurchaseDraft, type GoldPurchaseDraftKind,
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
  const canRead = hasPermission(isCgp ? "sales.view" : "suppliers.view");
  const canCreate = hasPermission(isCgp ? "sales.create" : "suppliers.create");
  const canUpdate = hasPermission(isCgp ? "sales.create" : "suppliers.update");
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
  const reset = () => { setSelected(null); setReferenceId(""); setDate(today()); setNotes(""); setLines([blankLine(kind)]); setError(""); };
  const edit = (draft: GoldPurchaseDraft) => {
    setSelected(draft); setReferenceId(isCgp ? draft.customerId || "" : draft.supplierId || "");
    setDate((isCgp ? draft.transactionDate : draft.purchaseDate) || today()); setNotes(draft.notes || "");
    setLines(draft.items.map((x) => ({ ...x })));
  };
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

  if (!canRead) return <Card className="p-6 text-sm font-bold text-destructive">{rtl ? "لا تملك صلاحية عرض هذه المسودات." : "You do not have permission to view these drafts."}</Card>;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">{title}</h1><p className="text-xs text-muted">{rtl ? "مسودات غير محاسبية — لا تنشئ مخزوناً أو قيوداً." : "Non-accounting drafts — no inventory or journals are created."}</p></div><Button variant="secondary" onClick={reset}><Plus className="h-4 w-4" />{rtl ? "مسودة جديدة" : "New draft"}</Button></div>
    {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-bold text-destructive">{error}</div>}
    <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <Card className="p-5"><div className="mb-4 flex gap-2"><NativeSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">{rtl ? "كل الحالات" : "All statuses"}</option><option value="draft">Draft</option><option value="validated">Validated</option></NativeSelect><Button variant="secondary" onClick={() => void load()}><RefreshCw className="h-4 w-4" /></Button></div>
        {loading ? <p className="py-10 text-center text-muted">{rtl ? "جارٍ التحميل..." : "Loading..."}</p> : drafts.length === 0 ? <p className="py-10 text-center text-muted">{rtl ? "لا توجد مسودات." : "No drafts found."}</p> : <div className="space-y-2">{drafts.map((draft) => <button key={draft.id} onClick={() => edit(draft)} className="w-full rounded-2xl border border-border p-3 text-start hover:border-brand-400"><div className="flex justify-between"><span className="font-mono font-black">{draft.draftNumber}</span><span className={draft.status === "validated" ? "text-emerald-600" : "text-amber-600"}>{draft.status}</span></div><p className="mt-1 text-xs text-muted">{draft.customer?.name || draft.supplier?.name} · {draft.branch?.name}</p></button>)}</div>}
        <div className="mt-4 flex items-center justify-between text-xs"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{rtl ? "السابق" : "Previous"}</Button><span>{page} / {Math.max(pages, 1)}</span><Button variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>{rtl ? "التالي" : "Next"}</Button></div>
      </Card>
      <Card className="space-y-4 p-5"><div className="flex justify-between"><h2 className="font-black">{selected?.draftNumber || (rtl ? "مسودة جديدة" : "New draft")}</h2>{selected && <span className="text-xs font-bold">v{selected.version} · {selected.status}</span>}</div>
        <div className="grid gap-3 sm:grid-cols-2"><label><span className="label-base">{referenceLabel}</span><NativeSelect value={referenceId} onChange={(e) => setReferenceId(e.target.value)}><option value="">—</option>{references.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</NativeSelect></label><label><span className="label-base">{rtl ? "التاريخ" : "Date"}</span><input className="input-base" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label></div>
        {lines.map((line, index) => <div key={index} className="rounded-2xl border border-border p-4"><div className="mb-3 flex justify-between"><strong>{rtl ? `بند ${index + 1}` : `Line ${index + 1}`}</strong>{lines.length > 1 && <button onClick={() => setLines((x) => x.filter((_, i) => i !== index))} className="text-destructive"><XCircle className="h-4 w-4" /></button>}</div>
          {kind === "igp" && <div className="mb-3 grid gap-3 sm:grid-cols-2"><label><span className="label-base">{rtl ? "نوع الاستثمار" : "Investment type"}</span><NativeSelect value={line.investmentType} onChange={(e) => updateLine(index, "investmentType", e.target.value)}><option value="physical">Physical</option><option value="bullion">Bullion</option></NativeSelect></label>{line.investmentType === "bullion" && <label><span className="label-base">{rtl ? "هوية السبيكة" : "Bullion identity"}</span><NativeSelect value={line.bullionIdentityType || "serialized_unit"} onChange={(e) => updateLine(index, "bullionIdentityType", e.target.value)}><option value="serialized_unit">Serialized unit</option><option value="bullion_lot">Bullion lot</option></NativeSelect></label>}</div>}
          {kind === "igp" && line.investmentType === "bullion" && <label className="mb-3 block"><span className="label-base">{line.bullionIdentityType === "bullion_lot" ? (rtl ? "رقم التشغيلة" : "Lot number") : (rtl ? "الرقم التسلسلي" : "Serial number")}</span><input className="input-base" value={line.bullionIdentityType === "bullion_lot" ? line.lotNumber || "" : line.serialNumber || ""} onChange={(e) => updateLine(index, line.bullionIdentityType === "bullion_lot" ? "lotNumber" : "serialNumber", e.target.value)} /></label>}
          <div className="grid gap-3 sm:grid-cols-3"><label><span className="label-base">{rtl ? "الوزن القائم" : "Gross weight"}</span><input className="input-base" type="number" step="0.000001" value={line.grossWeight} onChange={(e) => updateLine(index, "grossWeight", e.target.value)} /></label><label><span className="label-base">{rtl ? "وزن الأحجار" : "Stone weight"}</span><input className="input-base" type="number" step="0.000001" value={line.stoneWeight} onChange={(e) => updateLine(index, "stoneWeight", e.target.value)} /></label><label><span className="label-base">{rtl ? "العيار" : "Karat"}</span><NativeSelect value={line.karat} onChange={(e) => { const k = Number(e.target.value); const p = k === 24 ? 1 : k === 22 ? 0.916 : k === 21 ? 0.875 : 0.75; updateLine(index, "karat", k); updateLine(index, "purityFactor", p); updateLine(index, "fineness", p); }}><option value="18">18</option><option value="21">21</option><option value="22">22</option><option value="24">24</option></NativeSelect></label></div>
          {line.netWeight !== undefined && <p className="mt-3 text-xs text-muted">Net: {line.netWeight}g · Pure: {line.pureGoldWeight}g</p>}
        </div>)}
        <Button variant="secondary" onClick={() => setLines((x) => [...x, blankLine(kind)])}><Plus className="h-4 w-4" />{rtl ? "إضافة بند" : "Add line"}</Button>
        <label className="block"><span className="label-base">{rtl ? "ملاحظات" : "Notes"}</span><textarea className="input-base min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <div className="flex flex-wrap justify-end gap-2">{selected && canUpdate && <Button variant="secondary" disabled={saving} onClick={voidDraft}><XCircle className="h-4 w-4" />{rtl ? "إلغاء المسودة" : "Void"}</Button>}{selected && selected.status === "draft" && canUpdate && <Button variant="secondary" disabled={saving} onClick={validate}><ShieldCheck className="h-4 w-4" />{rtl ? "تحقق" : "Validate"}</Button>}{((selected && canUpdate) || (!selected && canCreate)) && <Button disabled={saving} onClick={save}>{saving ? (rtl ? "جارٍ الحفظ..." : "Saving...") : (rtl ? "حفظ المسودة" : "Save draft")}</Button>}</div>
      </Card>
    </div>
  </div>;
}
