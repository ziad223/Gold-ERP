"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Landmark, Plus, Trash2, WalletCards, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useErp } from "@/contexts/erp-context";
import { useJournalEntries, type JournalStatusGroup } from "@/hooks/use-accounting";
import { usePermissions } from "@/hooks/use-permissions";
import { DATA_SOURCE } from "@/lib/data-source";
import type { AccountStatement, TrialBalance, LedgerReconciliation } from "@/lib/repositories/interfaces";
import { formatCurrency } from "@/lib/utils";

const STATEMENT_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

interface JournalRow {
  id: string;
  description: string;
  amount: number;
  status: "balanced" | "pending";
  rawStatus: string;
  sourceType: string;
  reversalOf: string | null;
  date: string;
}

interface AccountOption {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  isActive?: boolean;
}

// A single editable debit/credit line in the manual draft form. Amounts are
// kept as strings so the inputs stay controlled; they are parsed on submit.
interface DraftLine {
  accountId: string;
  debit: string;
  credit: string;
  memo: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const emptyLine = (): DraftLine => ({ accountId: "", debit: "", credit: "", memo: "" });
const today = () => new Date().toISOString().slice(0, 10);
const toNumber = (value: string): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
// Decimal-safe integer scaling (ten-thousandths) — mirrors the backend so the
// balance indicator never disagrees with the server due to float drift.
const toTtt = (value: string): number => Math.round(toNumber(value) * 10000);

export default function AccountingPage() {
  const t = useTranslations("Accounting");
  const common = useTranslations("Common");
  const filtersT = useTranslations("Filters");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { company } = useAuth();
  const { postJournalEntries } = usePermissions();
  const { accountingRepository } = useErp();

  const isApi = DATA_SOURCE === "api";

  const [view, setView] = useState<"entries" | "statement" | "trial" | "reconciliation">("entries");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<JournalStatusGroup>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // The list is always sourced from the accounting repository. In mock/local
  // mode the repository returns an empty set (no legacy local journal cache).
  const {
    entries: apiItems,
    page: apiPage,
    pageSize: apiPageSize,
    total: apiTotal,
    totalPages: apiTotalPages,
    loading,
    error,
    refetch,
  } = useJournalEntries({ page, pageSize, search: query, statusGroup: status });

  const rows: JournalRow[] = useMemo(
    () =>
      (apiItems ?? []).map((e: any) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount ?? e.totalDebit ?? 0),
        status: e.status === "posted" || e.status === "balanced" ? "balanced" : "pending",
        rawStatus: String(e.status ?? ""),
        sourceType: String(e.sourceType ?? ""),
        reversalOf: e.reversalOf ? String(e.reversalOf) : null,
        date: (e.date ?? "").slice(0, 10),
      })),
    [apiItems],
  );

  // A draft is postable only when it is a manual draft, the user can post, and
  // we are in API mode. The server re-enforces all of this.
  const [postingId, setPostingId] = useState<string | null>(null);
  const canPostRow = (row: JournalRow) =>
    isApi && postJournalEntries && row.rawStatus === "draft" && row.sourceType === "manual";

  const postEntry = async (row: JournalRow) => {
    if (!canPostRow(row) || postingId) return;
    const confirmed = window.confirm(
      rtl
        ? "هل أنت متأكد من ترحيل هذا القيد؟ سيتم تحديث أرصدة الحسابات ولا يمكن تكرار الترحيل."
        : "Post this journal entry? Account balances will be updated and posting cannot be repeated.",
    );
    if (!confirmed) return;
    setPostingId(row.id);
    try {
      const result = await accountingRepository.postJournalEntry(row.id);
      if (result.success) {
        toast.success(t("postSuccess"));
        refetch();
      } else {
        toast.error(result.error?.message || t("postFailed"));
      }
    } catch (err: any) {
      toast.error(err?.message || t("postFailed"));
    } finally {
      setPostingId(null);
    }
  };

  // A posted manual entry can be reversed only if it is NOT itself a reversal
  // (reversalOf is null). The server re-enforces all of this.
  const [reversingId, setReversingId] = useState<string | null>(null);
  const canReverseRow = (row: JournalRow) =>
    isApi && postJournalEntries && row.rawStatus === "posted" && row.sourceType === "manual" && !row.reversalOf;

  const reverseEntry = async (row: JournalRow) => {
    if (!canReverseRow(row) || reversingId) return;
    const confirmed = window.confirm(
      rtl
        ? "هل أنت متأكد من عكس هذا القيد؟ سيتم إنشاء قيد عكسي وإرجاع أثره على أرصدة الحسابات، ولا يمكن تكرار العكس."
        : "Reverse this journal entry? A reversal entry will be created, its balance effect undone, and it cannot be reversed again.",
    );
    if (!confirmed) return;
    setReversingId(row.id);
    try {
      const result = await accountingRepository.reverseJournalEntry(row.id);
      if (result.success) {
        toast.success(t("reverseSuccess"));
        refetch();
      } else {
        toast.error(result.error?.message || t("reverseFailed"));
      }
    } catch (err: any) {
      toast.error(err?.message || t("reverseFailed"));
    } finally {
      setReversingId(null);
    }
  };

  // A manual draft can be cancelled (hard-deleted) — same gate as posting.
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const canCancelRow = (row: JournalRow) =>
    isApi && postJournalEntries && row.rawStatus === "draft" && row.sourceType === "manual" && !row.reversalOf;

  const cancelDraft = async (row: JournalRow) => {
    if (!canCancelRow(row) || cancelingId) return;
    const confirmed = window.confirm(
      rtl
        ? "هل أنت متأكد من إلغاء هذه المسودة؟ سيتم حذفها نهائياً لأنها لم تُرحّل بعد."
        : "Are you sure you want to cancel this draft? It will be permanently deleted because it has not been posted.",
    );
    if (!confirmed) return;
    setCancelingId(row.id);
    try {
      const result = await accountingRepository.cancelJournalDraft(row.id);
      if (result.success) {
        toast.success(t("cancelSuccess"));
        refetch();
      } else {
        toast.error(result.error?.message || t("cancelFailed"));
      }
    } catch (err: any) {
      toast.error(err?.message || t("cancelFailed"));
    } finally {
      setCancelingId(null);
    }
  };

  const statusBadge = (row: JournalRow) => {
    if (row.rawStatus === "draft") return { tone: "amber" as const, label: t("draftBadge") };
    if (row.rawStatus === "posted" || row.rawStatus === "balanced") return { tone: "green" as const, label: t("postedBadge") };
    if (row.rawStatus === "reversed") return { tone: "rose" as const, label: t("reversedBadge") };
    return { tone: "amber" as const, label: t("pending") };
  };

  const resultTotal = apiTotal;
  const currentPage = apiPage;
  const resolvedPageSize = apiPageSize;
  const safeTotalPages = Math.max(1, apiTotalPages);
  const firstVisibleRecord = resultTotal === 0 ? 0 : (currentPage - 1) * resolvedPageSize + 1;
  const lastVisibleRecord = resultTotal === 0 ? 0 : Math.min(resultTotal, firstVisibleRecord + rows.length - 1);

  // ── Manual draft modal state ───────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draftDate, setDraftDate] = useState<string>(today());
  const [draftDescription, setDraftDescription] = useState("");
  const [draftReference, setDraftReference] = useState("");
  const [draftLines, setDraftLines] = useState<DraftLine[]>([emptyLine(), emptyLine()]);

  // Load the chart of accounts when the modal opens (API mode only).
  useEffect(() => {
    if (!open || !isApi) return;
    let active = true;
    setAccountsError(null);
    accountingRepository
      .listAccounts()
      .then((list) => {
        if (active) setAccounts((list ?? []) as AccountOption[]);
      })
      .catch((err: any) => {
        if (active) setAccountsError(err?.message || t("loadAccountsFailed"));
      });
    return () => {
      active = false;
    };
  }, [open, isApi, accountingRepository, t]);

  // Only active accounts are selectable; the server re-validates active/company.
  const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive !== false), [accounts]);

  const totalDebit = draftLines.reduce((s, l) => s + toNumber(l.debit), 0);
  const totalCredit = draftLines.reduce((s, l) => s + toNumber(l.credit), 0);
  const tttDebit = draftLines.reduce((s, l) => s + toTtt(l.debit), 0);
  const tttCredit = draftLines.reduce((s, l) => s + toTtt(l.credit), 0);
  const balanced = tttDebit === tttCredit && tttDebit > 0;

  const linesValid = draftLines.every((l) => {
    const d = toNumber(l.debit);
    const c = toNumber(l.credit);
    const dPos = d > 0;
    const cPos = c > 0;
    return Boolean(l.accountId) && d >= 0 && c >= 0 && ((dPos && !cPos) || (cPos && !dPos));
  });
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(draftDate);
  const canSubmit =
    isApi &&
    !submitting &&
    draftDescription.trim().length > 0 &&
    validDate &&
    draftLines.length >= 2 &&
    linesValid &&
    balanced;

  const setLine = (index: number, patch: Partial<DraftLine>) =>
    setDraftLines((current) => current.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  // Entering a debit clears the credit on that line (and vice-versa) so a line
  // is always one-sided, matching the backend rule.
  const handleDebit = (index: number, value: string) => setLine(index, { debit: value, credit: "" });
  const handleCredit = (index: number, value: string) => setLine(index, { credit: value, debit: "" });
  const addLine = () => setDraftLines((current) => [...current, emptyLine()]);
  const removeLine = (index: number) =>
    setDraftLines((current) => (current.length <= 2 ? current : current.filter((_, i) => i !== index)));

  const resetDraft = () => {
    setDraftDate(today());
    setDraftDescription("");
    setDraftReference("");
    setDraftLines([emptyLine(), emptyLine()]);
    setAccountsError(null);
  };
  const openModal = () => {
    resetDraft();
    setOpen(true);
  };
  const closeModal = () => setOpen(false);

  const submitDraft = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await accountingRepository.createManualJournalDraft({
        date: draftDate,
        description: draftDescription.trim(),
        reference: draftReference.trim() || undefined,
        lines: draftLines.map((l) => ({
          accountId: l.accountId,
          debit: toNumber(l.debit),
          credit: toNumber(l.credit),
          memo: l.memo.trim() || undefined,
        })),
      });
      if (result.success) {
        toast.success(t("draftCreated"));
        setOpen(false);
        resetDraft();
        refetch();
      } else {
        toast.error(result.error?.message || t("draftFailed"));
      }
    } catch (err: any) {
      toast.error(err?.message || t("draftFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };
  const handleStatusChange = (value: string) => {
    setStatus(value as JournalStatusGroup);
    setPage(1);
  };
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };
  const resetFilters = () => {
    setQuery("");
    setStatus("all");
    setPage(1);
  };
  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), safeTotalPages));
  };

  const currency = company?.currency ?? "AED";
  const money = (value: number) => formatCurrency(value, currency, locale);
  const statCards: Array<{ label: string; value: string; icon: LucideIcon; classes: string }> = [
    { label: t("cashBalance"), value: money(486250), icon: WalletCards, classes: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" },
    { label: t("bankAccounts"), value: money(1240800), icon: Landmark, classes: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" },
    { label: t("receipts"), value: money(328900), icon: ArrowDownLeft, classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
    { label: t("payments"), value: money(176450), icon: ArrowUpRight, classes: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          view === "entries" && postJournalEntries ? (
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={isApi ? openModal : undefined}
                disabled={!isApi}
                title={!isApi ? t("manualApiOnly") : undefined}
              >
                <Plus className="h-4 w-4" />
                {t("journalEntry")}
              </Button>
              {!isApi && (
                <p className="max-w-md text-end text-[11px] font-semibold leading-5 text-muted">
                  {t("manualApiOnly")}
                </p>
              )}
            </div>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-2 border-b border-border">
        {([
          ["entries", t("tabEntries")],
          ["statement", t("tabStatement")],
          ["trial", t("tabTrial")],
          ["reconciliation", t("tabReconciliation")],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-bold transition ${
              view === key ? "border-brand-600 text-brand-700 dark:text-brand-300" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, classes }) => <Card key={label} className="p-5"><div className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl ${classes}`}><Icon className="h-5 w-5" /></div><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-2xl font-black text-foreground">{value}</p></Card>)}
      </div>
      {view === "entries" ? (
      <>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5 font-black">{t("latestEntries")}</div>
          <DataToolbar query={query} onQueryChange={handleSearchChange} placeholder={t("search")} resultCount={resultTotal} resultLabel={filtersT("results")} resetLabel={filtersT("reset")} onReset={resetFilters} filters={[{ id: "status", label: t("status"), value: status, onChange: handleStatusChange, options: [{ value: "all", label: filtersT("allStatuses") }, { value: "balanced", label: t("balanced") }, { value: "pending", label: t("pending") }] }]} />
          {error ? (
            <ErrorState message={error} onRetry={refetch} className="m-5" />
          ) : loading && rows.length === 0 ? (
            <LoadingState message={common("loading")} />
          ) : rows.length ? (
            <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-start text-xs"><thead className="bg-table-header text-muted"><tr><th className="px-5 py-4">{t("entry")}</th><th className="px-5 py-4">{t("descriptionCol")}</th><th className="px-5 py-4">{t("amount")}</th><th className="px-5 py-4">{t("status")}</th><th className="px-5 py-4">{common("actions")}</th></tr></thead><tbody className="divide-y divide-border">{rows.map((entry) => { const badge = statusBadge(entry); return <tr key={entry.id} className="hover:bg-table-row-hover"><td className="px-5 py-4 font-mono font-bold text-brand-700 dark:text-brand-300">{entry.id}</td><td className="px-5 py-4 font-bold">{entry.description}<p className="mt-1 text-[10px] font-normal text-muted">{entry.date}</p></td><td className="px-5 py-4 font-black">{money(entry.amount)}</td><td className="px-5 py-4"><Badge tone={badge.tone}>{badge.label}</Badge></td><td className="px-5 py-4">{canPostRow(entry) ? <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="secondary" disabled={postingId === entry.id || cancelingId === entry.id} onClick={() => postEntry(entry)}>{postingId === entry.id ? common("loading") : t("postAction")}</Button>{canCancelRow(entry) && <Button type="button" size="sm" variant="secondary" disabled={postingId === entry.id || cancelingId === entry.id} onClick={() => cancelDraft(entry)}>{cancelingId === entry.id ? common("loading") : t("cancelAction")}</Button>}</div> : canReverseRow(entry) ? <Button type="button" size="sm" variant="secondary" disabled={reversingId === entry.id} onClick={() => reverseEntry(entry)}>{reversingId === entry.id ? common("loading") : t("reverseAction")}</Button> : <span className="text-muted">—</span>}</td></tr>; })}</tbody></table></div>
            </div>
          ) : (
            <EmptyState title={common("noResults")} description={common("noResultsDescription")} />
          )}
          {!error && resultTotal > 0 && (
            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-muted">
                {rtl ? `عرض ${firstVisibleRecord}-${lastVisibleRecord} من ${resultTotal}` : `Showing ${firstVisibleRecord}-${lastVisibleRecord} of ${resultTotal}`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <NativeSelect
                  value={String(pageSize)}
                  onChange={(event) => handlePageSizeChange(event.target.value)}
                  disabled={loading}
                  aria-label={rtl ? "عدد القيود في الصفحة" : "Journal entries per page"}
                  wrapperClassName="w-auto min-w-[120px]"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {rtl ? `${option} لكل صفحة` : `${option} / page`}
                    </option>
                  ))}
                </NativeSelect>
                <Button type="button" variant="secondary" size="sm" disabled={loading || currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                  {rtl ? "السابق" : "Previous"}
                </Button>
                <span className="min-w-20 text-center font-bold text-muted">
                  {rtl ? `صفحة ${currentPage} / ${safeTotalPages}` : `Page ${currentPage} / ${safeTotalPages}`}
                </span>
                <Button type="button" variant="secondary" size="sm" disabled={loading || currentPage >= safeTotalPages} onClick={() => goToPage(currentPage + 1)}>
                  {rtl ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </Card>
        <Card className="p-5"><h2 className="font-black text-foreground">{t("financialIndicators")}</h2><div className="mt-5 space-y-5">{[[t("grossMargin"), 68], [t("receivablesCollection"), 82], [t("inventoryTurnover"), 56], [t("liquidityRatio"), 74]].map(([label, value]) => <div key={String(label)}><div className="mb-2 flex justify-between text-xs"><span className="font-bold text-muted">{label}</span><span className="font-black">{value}%</span></div><div className="h-2 rounded-full bg-background"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${value}%` }} /></div></div>)}</div></Card>
      </div>

      <Modal open={open} onClose={closeModal} title={t("manualEntryTitle")} description={t("manualEntryDescription")}>
        <form onSubmit={submitDraft} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label>
              <span className="label-base">{t("date")}</span>
              <input required type="date" className="input-base" value={draftDate} onChange={(event) => setDraftDate(event.target.value)} />
            </label>
            <label className="sm:col-span-2">
              <span className="label-base">{t("descriptionCol")}</span>
              <input required className="input-base" value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} />
            </label>
            <label className="sm:col-span-3">
              <span className="label-base">{t("reference")}</span>
              <input className="input-base" value={draftReference} onChange={(event) => setDraftReference(event.target.value)} />
            </label>
          </div>

          {accountsError && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-300">
              {accountsError}
            </p>
          )}

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] text-start text-xs">
              <thead className="bg-table-header text-muted">
                <tr>
                  <th className="px-3 py-3 text-start">{t("account")}</th>
                  <th className="px-3 py-3 text-start">{t("debit")}</th>
                  <th className="px-3 py-3 text-start">{t("credit")}</th>
                  <th className="px-3 py-3 text-start">{t("memo")}</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {draftLines.map((line, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 align-top">
                      <NativeSelect value={line.accountId} onChange={(event) => setLine(index, { accountId: event.target.value })} wrapperClassName="min-w-[180px]">
                        <option value="">{t("selectAccount")}</option>
                        {activeAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} — {rtl ? account.nameAr || account.name : account.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input type="number" min="0" step="0.0001" className="input-base w-28" value={line.debit} onChange={(event) => handleDebit(index, event.target.value)} />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input type="number" min="0" step="0.0001" className="input-base w-28" value={line.credit} onChange={(event) => handleCredit(index, event.target.value)} />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input className="input-base min-w-[140px]" value={line.memo} onChange={(event) => setLine(index, { memo: event.target.value })} />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Button type="button" variant="secondary" size="sm" disabled={draftLines.length <= 2} onClick={() => removeLine(index)} title={t("removeLine")} aria-label={t("removeLine")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-border bg-table-header/40">
                <tr className="font-black">
                  <td className="px-3 py-3 text-start">{t("totalsLabel")}</td>
                  <td className="px-3 py-3">{money(totalDebit)}</td>
                  <td className="px-3 py-3">{money(totalCredit)}</td>
                  <td className="px-3 py-3" colSpan={2}>
                    <Badge tone={balanced ? "green" : "amber"}>{balanced ? t("balancedBadge") : t("unbalancedBadge")}</Badge>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4" />
              {t("addLine")}
            </Button>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeModal}>{common("cancel")}</Button>
              <Button type="submit" disabled={!canSubmit}>{submitting ? common("loading") : t("createDraft")}</Button>
            </div>
          </div>
        </form>
      </Modal>
      </>
      ) : view === "statement" ? (
        <AccountStatementPanel money={money} />
      ) : view === "trial" ? (
        <TrialBalancePanel money={money} />
      ) : (
        <ReconciliationPanel money={money} />
      )}
    </div>
  );
}

// ── GL Account Statement (Phase 9C) — read-only view over GET
// /accounts/:id/statement. All balances (opening / running / closing) come
// straight from the server; nothing is computed here.
function AccountStatementPanel({ money }: { money: (value: number) => string }) {
  const t = useTranslations("Accounting");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { accountingRepository } = useErp();
  const isApi = DATA_SOURCE === "api";

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountId, setAccountId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [data, setData] = useState<AccountStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Light client-side hint only; the server is the source of truth.
  const dateError = from && to && from > to ? t("dateRangeError") : null;

  useEffect(() => {
    if (!isApi) return;
    let active = true;
    accountingRepository
      .listAccounts()
      .then((list) => {
        if (active) setAccounts((list ?? []) as AccountOption[]);
      })
      .catch(() => {
        /* dropdown stays empty; statement fetch will surface errors */
      });
    return () => {
      active = false;
    };
  }, [isApi, accountingRepository]);

  const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive !== false), [accounts]);

  const reqId = useRef(0);
  useEffect(() => {
    if (!isApi || !accountId || dateError) {
      setData(null);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    accountingRepository
      .getAccountStatement(accountId, { from: from || undefined, to: to || undefined, page, pageSize })
      .then((res) => {
        if (reqId.current === id) setData(res);
      })
      .catch((err: any) => {
        if (reqId.current === id) setError(err?.message || t("statementFailed"));
      })
      .finally(() => {
        if (reqId.current === id) setLoading(false);
      });
  }, [isApi, accountId, from, to, page, pageSize, dateError, accountingRepository, t]);

  const onAccount = (value: string) => { setAccountId(value); setPage(1); };
  const onFrom = (value: string) => { setFrom(value); setPage(1); };
  const onTo = (value: string) => { setTo(value); setPage(1); };
  const onPageSize = (value: string) => { setPageSize(Number(value)); setPage(1); };

  if (!isApi) {
    return (
      <Card className="p-8">
        <EmptyState title={t("statementApiOnly")} description={t("statementApiOnlyDesc")} />
      </Card>
    );
  }

  const total = data?.total ?? 0;
  const safeTotalPages = Math.max(1, data?.totalPages ?? 1);
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = total === 0 ? 0 : Math.min(total, first + (data?.items.length ?? 0) - 1);

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="xl:col-span-2">
            <span className="label-base">{t("account")}</span>
            <NativeSelect value={accountId} onChange={(event) => onAccount(event.target.value)}>
              <option value="">{t("selectAccount")}</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} — {rtl ? account.nameAr || account.name : account.name}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label>
            <span className="label-base">{t("from")}</span>
            <input type="date" className="input-base" value={from} onChange={(event) => onFrom(event.target.value)} />
          </label>
          <label>
            <span className="label-base">{t("to")}</span>
            <input type="date" className="input-base" value={to} onChange={(event) => onTo(event.target.value)} />
          </label>
        </div>
        {dateError && <p className="mt-3 text-xs font-bold text-rose-600 dark:text-rose-300">{dateError}</p>}
      </Card>

      {!accountId ? (
        <Card className="p-8"><EmptyState title={t("statementSelectPrompt")} description={t("statementSelectPromptDesc")} /></Card>
      ) : error ? (
        <ErrorState message={error} className="m-0" />
      ) : loading && !data ? (
        <LoadingState message={common("loading")} />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted">{t("from")} / {t("to")}</p>
              <p className="mt-2 text-sm font-black text-foreground">{(data.from || "—")} → {(data.to || "—")}</p>
              <p className="mt-1 text-[11px] text-muted">{data.account.code} — {rtl ? data.account.nameAr || data.account.name : data.account.name}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted">{t("openingBalance")}</p>
              <p className="mt-2 text-2xl font-black text-foreground">{money(data.openingBalance)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted">{t("closingBalance")}</p>
              <p className="mt-2 text-2xl font-black text-foreground">{money(data.closingBalance)}</p>
              <p className="mt-1 text-[11px] text-muted">{t("closingBalanceHint")}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted">{t("currentBalanceRef")}</p>
              <p className="mt-2 text-2xl font-black text-foreground">{money(data.account.balance)}</p>
              <p className="mt-1 text-[11px] text-muted">{t("currentBalanceRefHint")}</p>
            </Card>
          </div>

          <Card className="overflow-hidden">
            {data.items.length ? (
              <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-start text-xs">
                    <thead className="bg-table-header text-muted">
                      <tr>
                        <th className="px-4 py-3 text-start">{t("date")}</th>
                        <th className="px-4 py-3 text-start">{t("entry")}</th>
                        <th className="px-4 py-3 text-start">{t("descriptionCol")}</th>
                        <th className="px-4 py-3 text-start">{t("source")}</th>
                        <th className="px-4 py-3 text-end">{t("debit")}</th>
                        <th className="px-4 py-3 text-end">{t("credit")}</th>
                        <th className="px-4 py-3 text-end">{t("delta")}</th>
                        <th className="px-4 py-3 text-end">{t("runningBalance")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.items.map((row) => (
                        <tr key={row.journalLineId} className="hover:bg-table-row-hover">
                          <td className="px-4 py-3">{(row.date || "").slice(0, 10)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-brand-700 dark:text-brand-300">{row.journalEntryId}</td>
                          <td className="px-4 py-3">{row.description || "—"}</td>
                          <td className="px-4 py-3 text-[11px] text-muted">{row.sourceType || "—"}{row.sourceId ? ` · ${row.sourceId}` : ""}</td>
                          <td className="px-4 py-3 text-end font-bold">{row.debit ? money(row.debit) : "—"}</td>
                          <td className="px-4 py-3 text-end font-bold">{row.credit ? money(row.credit) : "—"}</td>
                          <td className="px-4 py-3 text-end">{money(row.delta)}</td>
                          <td className="px-4 py-3 text-end font-black">{money(row.runningBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState title={common("noResults")} description={t("statementNoRows")} />
            )}
            {total > 0 && (
              <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-muted">
                  {rtl ? `عرض ${first}-${last} من ${total}` : `Showing ${first}-${last} of ${total}`}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <NativeSelect
                    value={String(pageSize)}
                    onChange={(event) => onPageSize(event.target.value)}
                    disabled={loading}
                    aria-label={rtl ? "عدد الصفوف في الصفحة" : "Rows per page"}
                    wrapperClassName="w-auto min-w-[120px]"
                  >
                    {STATEMENT_PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {rtl ? `${option} لكل صفحة` : `${option} / page`}
                      </option>
                    ))}
                  </NativeSelect>
                  <Button type="button" variant="secondary" size="sm" disabled={loading || page <= 1} onClick={() => setPage(Math.max(page - 1, 1))}>
                    {rtl ? "السابق" : "Previous"}
                  </Button>
                  <span className="min-w-20 text-center font-bold text-muted">
                    {rtl ? `صفحة ${page} / ${safeTotalPages}` : `Page ${page} / ${safeTotalPages}`}
                  </span>
                  <Button type="button" variant="secondary" size="sm" disabled={loading || page >= safeTotalPages} onClick={() => setPage(Math.min(page + 1, safeTotalPages))}>
                    {rtl ? "التالي" : "Next"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

// ── Trial Balance (Phase 9E) — read-only view over GET
// /reports/trial-balance. Every aggregate (totals, calculatedBalance, netDebit,
// netCredit, difference) comes straight from the server; nothing is recomputed
// client-side and no balance is ever written.
function TrialBalancePanel({ money }: { money: (value: number) => string }) {
  const t = useTranslations("Accounting");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { accountingRepository } = useErp();
  const isApi = DATA_SOURCE === "api";

  const [asOf, setAsOf] = useState("");
  const [includeZero, setIncludeZero] = useState(false);
  const [data, setData] = useState<TrialBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reqId = useRef(0);
  useEffect(() => {
    if (!isApi) return;
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    accountingRepository
      .getTrialBalance({ asOf: asOf || undefined, includeZero })
      .then((res) => {
        if (reqId.current === id) setData(res);
      })
      .catch((err: any) => {
        if (reqId.current === id) setError(err?.message || t("trialFailed"));
      })
      .finally(() => {
        if (reqId.current === id) setLoading(false);
      });
  }, [isApi, asOf, includeZero, accountingRepository, t]);

  if (!isApi) {
    return (
      <Card className="p-8">
        <EmptyState title={t("trialApiOnly")} description={t("trialApiOnlyDesc")} />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters — changing either re-fetches via the effect above. */}
      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-6">
          <label>
            <span className="label-base">{t("asOf")}</span>
            <input
              type="date"
              className="input-base"
              value={asOf}
              onChange={(event) => setAsOf(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={includeZero}
              onChange={(event) => setIncludeZero(event.target.checked)}
            />
            <span className="text-xs font-bold text-foreground">{t("includeZero")}</span>
          </label>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} className="m-0" />
      ) : loading && !data ? (
        <LoadingState message={common("loading")} />
      ) : data ? (
        <>
          {/* Summary cards — every value is the server's aggregate, not derived here. */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted">{t("totalDebit")}</p>
              <p className="mt-2 text-2xl font-black text-foreground">{money(data.totalDebit)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted">{t("totalCredit")}</p>
              <p className="mt-2 text-2xl font-black text-foreground">{money(data.totalCredit)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted">{t("balanceStatus")}</p>
              <p className="mt-2">
                <Badge tone={data.isBalanced ? "green" : "amber"}>
                  {data.isBalanced ? t("balancedBadge") : t("outOfBalance")}
                </Badge>
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted">{t("totalDifference")}</p>
              <p className="mt-2 text-2xl font-black text-foreground">{money(data.totalDifference)}</p>
              <p className="mt-1 text-[11px] text-muted">{t("differenceHint")}</p>
            </Card>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
            <span>
              {t("accountCount")}: <b className="text-foreground">{data.accountCount}</b>
              {" · "}
              {t("asOf")}: <b className="text-foreground">{data.asOf || "—"}</b>
            </span>
            <span>{t("currentBalanceRefHint")}</span>
          </div>

          {/* Table — read-only display of server-computed rows. */}
          <Card className="overflow-hidden">
            {data.items.length ? (
              <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-start text-xs">
                    <thead className="bg-table-header text-muted">
                      <tr>
                        <th className="px-4 py-3 text-start">{t("code")}</th>
                        <th className="px-4 py-3 text-start">{t("account")}</th>
                        <th className="px-4 py-3 text-start">{t("typeCol")}</th>
                        <th className="px-4 py-3 text-start">{t("nature")}</th>
                        <th className="px-4 py-3 text-end">{t("debit")}</th>
                        <th className="px-4 py-3 text-end">{t("credit")}</th>
                        <th className="px-4 py-3 text-end">{t("calculatedBalance")}</th>
                        <th className="px-4 py-3 text-end">{t("netDebit")}</th>
                        <th className="px-4 py-3 text-end">{t("netCredit")}</th>
                        <th className="px-4 py-3 text-end">{t("currentBalanceRef")}</th>
                        <th className="px-4 py-3 text-end">{t("delta")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.items.map((row) => (
                        <tr key={row.accountId} className="hover:bg-table-row-hover">
                          <td className="px-4 py-3 font-mono font-bold text-brand-700 dark:text-brand-300">{row.code}</td>
                          <td className="px-4 py-3">{rtl ? row.nameAr || row.name : row.name}</td>
                          <td className="px-4 py-3 text-[11px] text-muted">{row.type}</td>
                          <td className="px-4 py-3 text-[11px] text-muted">{row.nature}</td>
                          <td className="px-4 py-3 text-end font-bold">{money(row.debitTotal)}</td>
                          <td className="px-4 py-3 text-end font-bold">{money(row.creditTotal)}</td>
                          <td className="px-4 py-3 text-end">{money(row.calculatedBalance)}</td>
                          <td className="px-4 py-3 text-end font-bold">{row.netDebit ? money(row.netDebit) : "—"}</td>
                          <td className="px-4 py-3 text-end font-bold">{row.netCredit ? money(row.netCredit) : "—"}</td>
                          <td className="px-4 py-3 text-end text-muted">{money(row.currentBalance)}</td>
                          <td className="px-4 py-3 text-end">{money(row.difference)}</td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Totals footer — echoed from server, not summed here. */}
                    <tfoot className="bg-table-header font-black text-foreground">
                      <tr>
                        <td className="px-4 py-3" colSpan={4}>{t("totalsLabel")}</td>
                        <td className="px-4 py-3 text-end">{money(data.totalDebit)}</td>
                        <td className="px-4 py-3 text-end">{money(data.totalCredit)}</td>
                        <td className="px-4 py-3 text-end" colSpan={2}>
                          {data.isBalanced ? t("balancedBadge") : t("outOfBalance")}
                        </td>
                        <td className="px-4 py-3 text-end" colSpan={3}>{t("totalDifference")}: {money(data.totalDifference)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState title={common("noResults")} description={t("trialNoRows")} />
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

// ── Ledger Reconciliation (Phase 9G) — read-only view over GET
// /reports/ledger-reconciliation. Every figure (calculatedBalance, difference,
// counts, totals) comes straight from the server; nothing is computed here and
// there is no fix/reconcile/adjust action.
function ReconciliationPanel({ money }: { money: (value: number) => string }) {
  const t = useTranslations("Accounting");
  const common = useTranslations("Common");
  const locale = useLocale();
  const rtl = locale === "ar";
  const { accountingRepository } = useErp();
  const isApi = DATA_SOURCE === "api";

  const [asOf, setAsOf] = useState("");
  const [includeZero, setIncludeZero] = useState(false);
  const [onlyDifferences, setOnlyDifferences] = useState(true);
  const [data, setData] = useState<LedgerReconciliation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reqId = useRef(0);
  useEffect(() => {
    if (!isApi) return;
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    accountingRepository
      .getLedgerReconciliation({ asOf: asOf || undefined, includeZero, onlyDifferences })
      .then((res) => {
        if (reqId.current === id) setData(res);
      })
      .catch((err: any) => {
        if (reqId.current === id) setError(err?.message || t("reconFailed"));
      })
      .finally(() => {
        if (reqId.current === id) setLoading(false);
      });
  }, [isApi, asOf, includeZero, onlyDifferences, accountingRepository, t]);

  if (!isApi) {
    return (
      <Card className="p-8">
        <EmptyState title={t("reconApiOnly")} description={t("reconApiOnlyDesc")} />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters — changing any re-fetches via the effect above. */}
      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-6">
          <label>
            <span className="label-base">{t("asOf")}</span>
            <input type="date" className="input-base" value={asOf} onChange={(event) => setAsOf(event.target.value)} />
          </label>
          <label className="flex items-center gap-2 pb-2">
            <input type="checkbox" className="h-4 w-4" checked={includeZero} onChange={(event) => setIncludeZero(event.target.checked)} />
            <span className="text-xs font-bold text-foreground">{t("includeZero")}</span>
          </label>
          <label className="flex items-center gap-2 pb-2">
            <input type="checkbox" className="h-4 w-4" checked={onlyDifferences} onChange={(event) => setOnlyDifferences(event.target.checked)} />
            <span className="text-xs font-bold text-foreground">{t("onlyDifferences")}</span>
          </label>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} className="m-0" />
      ) : loading && !data ? (
        <LoadingState message={common("loading")} />
      ) : data ? (
        <>
          {/* Summary cards — all values come from the server response. */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted">{t("reconStatus")}</p>
              <p className="mt-2">
                <Badge tone={data.hasDifferences ? "amber" : "green"}>
                  {data.hasDifferences ? t("differencesFound") : t("reconMatched")}
                </Badge>
              </p>
              <p className="mt-1 text-[11px] text-muted">{t("asOf")}: <b className="text-foreground">{data.asOf || "—"}</b></p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted">{t("accountCount")}</p>
              <p className="mt-2 text-2xl font-black text-foreground">{data.accountCount}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted">{t("differenceCount")}</p>
              <p className="mt-2 text-2xl font-black text-foreground">{data.differenceCount}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted">{t("totalAbsDifference")}</p>
              <p className="mt-2 text-2xl font-black text-foreground">{money(data.totalAbsoluteDifference)}</p>
              <p className="mt-1 text-[11px] text-muted">{t("differenceHint")}</p>
            </Card>
          </div>

          {/* Table — read-only display of server-computed rows. No fix/adjust action. */}
          <Card className="overflow-hidden">
            {data.items.length ? (
              <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-start text-xs">
                    <thead className="bg-table-header text-muted">
                      <tr>
                        <th className="px-4 py-3 text-start">{t("code")}</th>
                        <th className="px-4 py-3 text-start">{t("account")}</th>
                        <th className="px-4 py-3 text-start">{t("typeCol")}</th>
                        <th className="px-4 py-3 text-start">{t("nature")}</th>
                        <th className="px-4 py-3 text-end">{t("currentBalanceRef")}</th>
                        <th className="px-4 py-3 text-end">{t("debit")}</th>
                        <th className="px-4 py-3 text-end">{t("credit")}</th>
                        <th className="px-4 py-3 text-end">{t("calculatedBalance")}</th>
                        <th className="px-4 py-3 text-end">{t("difference")}</th>
                        <th className="px-4 py-3 text-start">{t("status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.items.map((row) => (
                        <tr key={row.accountId} className="hover:bg-table-row-hover">
                          <td className="px-4 py-3 font-mono font-bold text-brand-700 dark:text-brand-300">{row.code}</td>
                          <td className="px-4 py-3">{rtl ? row.nameAr || row.name : row.name}</td>
                          <td className="px-4 py-3 text-[11px] text-muted">{row.type}</td>
                          <td className="px-4 py-3 text-[11px] text-muted">{row.nature}</td>
                          <td className="px-4 py-3 text-end text-muted">{money(row.currentBalance)}</td>
                          <td className="px-4 py-3 text-end font-bold">{money(row.debitTotal)}</td>
                          <td className="px-4 py-3 text-end font-bold">{money(row.creditTotal)}</td>
                          <td className="px-4 py-3 text-end">{money(row.calculatedBalance)}</td>
                          <td className={`px-4 py-3 text-end font-black ${row.status === "difference" ? "text-amber-600 dark:text-amber-300" : ""}`}>{money(row.difference)}</td>
                          <td className="px-4 py-3">
                            <Badge tone={row.status === "difference" ? "amber" : "green"}>
                              {row.status === "difference" ? t("differenceBadge") : t("matchedBadge")}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState title={common("noResults")} description={t("reconNoRows")} />
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
