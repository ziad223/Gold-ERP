"use client";

import { FormEvent, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Banknote,
  Landmark,
  Wallet,
  Scale,
  Plus,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/contexts/auth-context";
import { useTreasury, type NewCashTransaction } from "@/hooks/use-treasury";
import { formatCurrency } from "@/lib/utils";

type TxType = "cash_in" | "cash_out" | "transfer";

export default function TreasuryPage() {
  const t = useTranslations("Treasury");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { company } = useAuth();
  const currency = company?.currency ?? "AED";
  const money = (v: number | string) => formatCurrency(Number(v), currency, locale);

  // Phase 6B: server-side pagination for the transactions list only.
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(20);
  const {
    summary,
    transactions,
    transactionsTotal,
    transactionsTotalPages,
    registerCurrent,
    registers,
    loading,
    addTransaction,
    openRegister,
    closeRegister,
  } = useTreasury({ page: txPage, pageSize: txPageSize });

  const TX_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
  const rtl = locale === "ar";
  const safeTxTotalPages = Math.max(1, transactionsTotalPages);
  const txFirst = transactionsTotal === 0 ? 0 : (txPage - 1) * txPageSize + 1;
  const txLast = transactionsTotal === 0 ? 0 : Math.min(transactionsTotal, txFirst + transactions.length - 1);
  const handleTxPageSizeChange = (value: number) => { setTxPageSize(value); setTxPage(1); };
  const goToTxPage = (next: number) => setTxPage(Math.min(Math.max(next, 1), safeTxTotalPages));

  const [open, setOpen] = useState(false);
  const [txType, setTxType] = useState<TxType>("cash_in");
  const [form, setForm] = useState({ account: "cash", toAccount: "bank", counterAccountCode: "", amount: "", category: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Phase 21.4 — stable Idempotency-Key for the treasury transaction. One key per
  // modal session: generated on open, reused on retry (kept on failure), and
  // reset on success so the next transaction gets a fresh key.
  const idemKeyRef = useRef("");
  const newIdemKey = () => {
    try {
      return window.crypto.randomUUID();
    } catch {
      return `IDEM-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
  };

  // Cash register state
  const [openingAmount, setOpeningAmount] = useState("");
  const [actual, setActual] = useState("");
  const [varianceReason, setVarianceReason] = useState("");
  const [closeResult, setCloseResult] = useState<{ expected: number; actual: number; variance: number } | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [registerBusy, setRegisterBusy] = useState(false);

  const openModal = (type: TxType) => {
    setTxType(type);
    setForm({ account: "cash", toAccount: "bank", counterAccountCode: "", amount: "", category: "", description: "" });
    setFormError(null);
    idemKeyRef.current = newIdemKey(); // one stable key per transaction session
    setOpen(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setFormError(t("amountError"));
      return;
    }
    if (txType !== "transfer" && !form.counterAccountCode.trim()) {
      setFormError(t("counterAccountRequired"));
      return;
    }
    setSubmitting(true);
    // Ensure a key exists even if the modal was opened before this field existed.
    if (!idemKeyRef.current) idemKeyRef.current = newIdemKey();
    try {
      const payload: NewCashTransaction = {
        type: txType,
        account: form.account,
        amount,
        category: form.category || undefined,
        description: form.description || undefined,
        ...(txType === "transfer" ? { toAccount: form.toAccount } : {}),
        ...(txType !== "transfer" ? { counterAccountCode: form.counterAccountCode.trim() } : {}),
      };
      await addTransaction(payload, idemKeyRef.current);
      idemKeyRef.current = ""; // success → next transaction gets a fresh key
      setTxPage(1); // newest transaction is on page 1
      setOpen(false);
    } catch (err: any) {
      // Keep the same key so a retry of THIS transaction replays, not double-posts.
      setFormError(err?.message || t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const submitOpenRegister = async (e: FormEvent) => {
    e.preventDefault();
    setCloseError(null);
    setRegisterBusy(true);
    try {
      await openRegister(Number(openingAmount), newIdemKey());
      setOpeningAmount("");
      setCloseResult(null);
    } catch (err: any) {
      setCloseError(err?.message || t("registerOpenError"));
    } finally {
      setRegisterBusy(false);
    }
  };

  const submitClosing = async (e: FormEvent) => {
    e.preventDefault();
    setCloseError(null);
    setRegisterBusy(true);
    const actualNum = Number(actual);
    try {
      const data = await closeRegister(actualNum, varianceReason || undefined, newIdemKey());
      setCloseResult({
        expected: Number(data.systemExpectedAmount ?? data.expected ?? 0),
        actual: Number(data.closingCountedAmount ?? actualNum),
        variance: Number(data.variance ?? 0),
      });
      setActual("");
      setVarianceReason("");
      setTxPage(1);
    } catch (err: any) {
      setCloseError(err?.message || t("registerCloseError"));
    } finally {
      setRegisterBusy(false);
    }
  };

  const registerOpen = registerCurrent?.status === "OPEN";
  const expectedForClose = Number(registerCurrent?.expected ?? registerCurrent?.systemExpectedAmount ?? summary.cash);

  const typeMeta: Record<string, { label: string; tone: "green" | "rose" | "blue"; icon: typeof ArrowDownLeft }> = {
    cash_in: { label: t("cashIn"), tone: "green", icon: ArrowDownLeft },
    cash_out: { label: t("cashOut"), tone: "rose", icon: ArrowUpRight },
    transfer: { label: t("transfer"), tone: "blue", icon: ArrowLeftRight },
  };

  const statCards = [
    { label: t("cashOnHand"), value: money(summary.cash), icon: Wallet, classes: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" },
    { label: t("bankAccounts"), value: money(summary.bank), icon: Landmark, classes: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" },
    { label: t("totalLiquidity"), value: money(summary.total), icon: Banknote, classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
    { label: t("todayMovement"), value: `+${money(summary.todayIn)} / -${money(summary.todayOut)}`, icon: ArrowLeftRight, classes: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  ];

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <LoadingState variant="skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => openModal("cash_in")}><ArrowDownLeft className="h-4 w-4" />{t("cashIn")}</Button>
            <Button variant="secondary" onClick={() => openModal("cash_out")}><ArrowUpRight className="h-4 w-4" />{t("cashOut")}</Button>
            <Button onClick={() => openModal("transfer")}><ArrowLeftRight className="h-4 w-4" />{t("transfer")}</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, classes }) => (
          <Card key={label} className="p-5">
            <div className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl ${classes}`}><Icon className="h-5 w-5" /></div>
            <p className="text-xs font-semibold text-muted">{label}</p>
            <p className="mt-2 text-xl font-black text-foreground">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        {/* Transactions */}
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5 font-black">{t("latestMovements")}</div>
          {transactions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-start text-xs">
                <thead className="bg-table-header text-muted">
                  <tr>
                    <th className="px-5 py-4">{t("type")}</th>
                    <th className="px-5 py-4">{t("category")}</th>
                    <th className="px-5 py-4">{t("account")}</th>
                    <th className="px-5 py-4">{t("amount")}</th>
                    <th className="px-5 py-4">{t("date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => {
                    const meta = typeMeta[tx.type] ?? typeMeta.cash_in;
                    return (
                      <tr key={tx.id} className="hover:bg-table-row-hover">
                        <td className="px-5 py-4"><Badge tone={meta.tone}>{meta.label}</Badge></td>
                        <td className="px-5 py-4 font-bold">{tx.category || tx.description || "—"}</td>
                        <td className="px-5 py-4">{tx.account === "bank" ? t("bank") : t("cash")}{tx.type === "transfer" && tx.toAccount ? ` → ${tx.toAccount === "bank" ? t("bank") : t("cash")}` : ""}</td>
                        <td className="px-5 py-4 font-black">{money(tx.amount)}</td>
                        <td className="px-5 py-4 text-muted">{tx.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title={common("noResults")} description={t("noMovements")} />
          )}

          {transactionsTotal > 0 && (
            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-muted">
                {rtl ? `عرض ${txFirst}-${txLast} من ${transactionsTotal}` : `Showing ${txFirst}-${txLast} of ${transactionsTotal}`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={txPageSize}
                  onChange={(event) => handleTxPageSizeChange(Number(event.target.value))}
                  className="h-9 rounded-2xl border border-border bg-panel px-3 text-xs font-semibold text-foreground outline-none focus:ring-4 focus:ring-ring/20"
                  aria-label={rtl ? "عدد الحركات في الصفحة" : "Transactions per page"}
                >
                  {TX_PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {rtl ? `${option} لكل صفحة` : `${option} / page`}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" size="sm" disabled={txPage <= 1} onClick={() => goToTxPage(txPage - 1)}>
                  {rtl ? "السابق" : "Previous"}
                </Button>
                <span className="min-w-20 text-center font-bold text-muted">
                  {rtl ? `صفحة ${txPage} / ${safeTxTotalPages}` : `Page ${txPage} / ${safeTxTotalPages}`}
                </span>
                <Button type="button" variant="secondary" size="sm" disabled={txPage >= safeTxTotalPages} onClick={() => goToTxPage(txPage + 1)}>
                  {rtl ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Cash register */}
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-black text-foreground"><Scale className="h-5 w-5 text-brand-600" />{t("registerTitle")}</h2>
          <p className="mt-1 text-xs text-muted">{t("registerDesc")}</p>
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-xs ${registerOpen ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-500/10 dark:text-emerald-200" : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-200"}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-black">{registerOpen ? t("registerOpen") : t("registerClosed")}</span>
              <span className="font-mono font-bold">{registerCurrent?.id || "—"}</span>
            </div>
            {registerOpen && (
              <div className="mt-2 flex justify-between">
                <span className="font-bold text-muted">{t("expectedBalance")}</span>
                <span className="font-black">{money(expectedForClose)}</span>
              </div>
            )}
          </div>

          {!registerOpen ? (
          <form onSubmit={submitOpenRegister} className="mt-5 space-y-4">
            <label className="block">
              <span className="label-base">{t("openingCountedAmount")}</span>
              <input required type="number" min="0" step="0.01" className="input-base" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} placeholder="0" />
            </label>
            <Button type="submit" className="w-full" disabled={registerBusy}>{t("openRegister")}</Button>
            {closeError && <p className="text-xs font-bold text-rose-600">{closeError}</p>}
          </form>
          ) : (
          <form onSubmit={submitClosing} className="mt-5 space-y-4">
            <div className="flex justify-between rounded-2xl bg-background px-4 py-3 text-xs">
              <span className="font-bold text-muted">{t("expectedBalance")}</span>
              <span className="font-black">{money(expectedForClose)}</span>
            </div>
            <label className="block">
              <span className="label-base">{t("closingCountedAmount")}</span>
              <input required type="number" min="0" step="0.01" className="input-base" value={actual} onChange={(e) => setActual(e.target.value)} placeholder="0" />
            </label>
            <label className="block">
              <span className="label-base">{t("varianceReason")}</span>
              <textarea className="input-base min-h-20" value={varianceReason} onChange={(e) => setVarianceReason(e.target.value)} placeholder={t("varianceReasonPlaceholder")} />
            </label>
            <Button type="submit" className="w-full" disabled={registerBusy}>{t("closeRegister")}</Button>
            {closeError && <p className="text-xs font-bold text-rose-600">{closeError}</p>}
          </form>
          )}

          {closeResult && (
            <div className={`mt-4 rounded-2xl border p-4 text-xs ${Math.abs(closeResult.variance) < 0.01 ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-500/10" : "border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-500/10"}`}>
              <div className="flex justify-between"><span className="text-muted">{t("expectedBalance")}</span><span className="font-bold">{money(closeResult.expected)}</span></div>
              <div className="flex justify-between"><span className="text-muted">{t("actualBalance")}</span><span className="font-bold">{money(closeResult.actual)}</span></div>
              <div className="mt-1 flex justify-between border-t border-dashed pt-1 font-black"><span>{t("variance")}</span><span className={Math.abs(closeResult.variance) < 0.01 ? "text-emerald-600" : "text-rose-600"}>{money(closeResult.variance)}</span></div>
              <p className="mt-2 font-bold">{Math.abs(closeResult.variance) < 0.01 ? t("balanced") : t("varianceDetected")}</p>
            </div>
          )}

          {registers.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 text-xs font-black text-muted">{t("registerHistory")}</p>
              <div className="space-y-2">
                {registers.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted">{String(c.openedAt || "").slice(0, 10)} · {c.status}</span>
                    <span className={`font-bold ${Math.abs(Number(c.variance || 0)) < 0.01 ? "text-emerald-600" : "text-rose-600"}`}>{money(c.variance ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Add transaction modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={typeMeta[txType]?.label} description={t("modalDesc")}>
        <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="label-base">{txType === "transfer" ? t("fromAccount") : t("account")}</span>
            <NativeSelect value={form.account} onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))}>
              <option value="cash">{t("cash")}</option>
              <option value="bank">{t("bank")}</option>
            </NativeSelect>
          </label>
          {txType === "transfer" && (
            <label className="block">
              <span className="label-base">{t("toAccount")}</span>
              <NativeSelect value={form.toAccount} onChange={(e) => setForm((f) => ({ ...f, toAccount: e.target.value }))}>
                <option value="bank">{t("bank")}</option>
                <option value="cash">{t("cash")}</option>
              </NativeSelect>
            </label>
          )}
          <label className="block">
            <span className="label-base">{t("amount")}</span>
            <input required type="number" min="0" step="0.01" className="input-base" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" />
          </label>
          {txType !== "transfer" && (
            <label className="block">
              <span className="label-base">{t("category")}</span>
              <input className="input-base" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder={t("categoryPlaceholder")} />
            </label>
          )}
          {txType !== "transfer" && (
            <label className="block">
              <span className="label-base">{t("counterAccount")}</span>
              <input className="input-base" value={form.counterAccountCode} onChange={(e) => setForm((f) => ({ ...f, counterAccountCode: e.target.value }))} placeholder={t("counterAccountPlaceholder")} />
            </label>
          )}
          <label className="block sm:col-span-2">
            <span className="label-base">{t("description")}</span>
            <input className="input-base" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </label>
          {formError && <p className="text-xs font-bold text-rose-600 sm:col-span-2">{formError}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{common("cancel")}</Button>
            <Button type="submit" disabled={submitting}><Plus className="h-4 w-4" />{common("save")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
