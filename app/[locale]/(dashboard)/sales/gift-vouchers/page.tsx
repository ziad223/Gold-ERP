"use client";

import { FormEvent, useState } from "react";
import { Gift, Plus, Ticket } from "lucide-react";
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
import { useGiftVouchers } from "@/hooks/use-gift-vouchers";
import { formatCurrency } from "@/lib/utils";

export default function GiftVouchersPage() {
  const t = useTranslations("GiftVouchers");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { company } = useAuth();
  const currency = company?.currency ?? "AED";
  const money = (v: number | string) => formatCurrency(Number(v), currency, locale);

  const { items, loading, issueVoucher, redeemVoucher } = useGiftVouchers();

  const [issueOpen, setIssueOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ value: "", customerName: "", paymentMethod: "cash" });
  const [redeemForm, setRedeemForm] = useState({ code: "", amount: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusTone: Record<string, "green" | "amber" | "rose"> = { active: "green", redeemed: "amber", expired: "rose" };

  const submitIssue = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = Number(issueForm.value);
    if (!value || value <= 0) { setError(t("valueError")); return; }
    setBusy(true);
    try {
      await issueVoucher({ value, customerName: issueForm.customerName || undefined, paymentMethod: issueForm.paymentMethod });
      setIssueForm({ value: "", customerName: "", paymentMethod: "cash" });
      setIssueOpen(false);
    } catch (err: any) {
      setError(err?.message || t("issueError"));
    } finally {
      setBusy(false);
    }
  };

  const submitRedeem = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await redeemVoucher(redeemForm.code.trim(), redeemForm.amount ? Number(redeemForm.amount) : undefined);
      setRedeemForm({ code: "", amount: "" });
      setRedeemOpen(false);
    } catch (err: any) {
      setError(err?.message || t("redeemError"));
    } finally {
      setBusy(false);
    }
  };

  if (loading && items.length === 0) {
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
            <Button variant="secondary" disabled title={t("financialWorkflowDisabled")}><Ticket className="h-4 w-4" />{t("redeem")}</Button>
            <Button disabled title={t("financialWorkflowDisabled")}><Plus className="h-4 w-4" />{t("issue")}</Button>
          </div>
        }
      />

      <Card className="border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-200">
        {t("financialWorkflowDisabled")}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5 font-black">{t("allVouchers")}</div>
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-start text-xs">
              <thead className="bg-table-header text-muted">
                <tr>
                  <th className="px-5 py-4">{t("code")}</th>
                  <th className="px-5 py-4">{t("customer")}</th>
                  <th className="px-5 py-4">{t("value")}</th>
                  <th className="px-5 py-4">{t("balance")}</th>
                  <th className="px-5 py-4">{t("status")}</th>
                  <th className="px-5 py-4">{t("issueDate")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((v) => (
                  <tr key={v.id} className="hover:bg-table-row-hover">
                    <td className="px-5 py-4 font-mono font-bold text-brand-700 dark:text-brand-300">{v.code}</td>
                    <td className="px-5 py-4 font-bold">{v.customerName || "—"}</td>
                    <td className="px-5 py-4">{money(v.value)}</td>
                    <td className="px-5 py-4 font-black">{money(v.balance)}</td>
                    <td className="px-5 py-4"><Badge tone={statusTone[v.status] ?? "amber"}>{t(v.status)}</Badge></td>
                    <td className="px-5 py-4 text-muted">{v.issueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={common("noResults")} description={t("noVouchers")} />
        )}
      </Card>

      {/* Issue modal */}
      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} title={t("issueTitle")} description={t("issueDesc")}>
        <form onSubmit={submitIssue} className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="label-base">{t("value")}</span>
            <input required type="number" min="0" step="0.01" className="input-base" value={issueForm.value} onChange={(e) => setIssueForm((f) => ({ ...f, value: e.target.value }))} placeholder="0" />
          </label>
          <label className="block">
            <span className="label-base">{t("paymentMethod")}</span>
            <NativeSelect value={issueForm.paymentMethod} onChange={(e) => setIssueForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
              <option value="cash">{t("cash")}</option>
              <option value="card">{t("card")}</option>
            </NativeSelect>
          </label>
          <label className="block sm:col-span-2">
            <span className="label-base">{t("customer")}</span>
            <input className="input-base" value={issueForm.customerName} onChange={(e) => setIssueForm((f) => ({ ...f, customerName: e.target.value }))} placeholder={t("customerPlaceholder")} />
          </label>
          {error && <p className="text-xs font-bold text-rose-600 sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setIssueOpen(false)}>{common("cancel")}</Button>
            <Button type="submit" disabled={busy}><Gift className="h-4 w-4" />{t("issue")}</Button>
          </div>
        </form>
      </Modal>

      {/* Redeem modal */}
      <Modal open={redeemOpen} onClose={() => setRedeemOpen(false)} title={t("redeemTitle")} description={t("redeemDesc")}>
        <form onSubmit={submitRedeem} className="grid gap-5">
          <label className="block">
            <span className="label-base">{t("code")}</span>
            <input required className="input-base font-mono" value={redeemForm.code} onChange={(e) => setRedeemForm((f) => ({ ...f, code: e.target.value }))} placeholder="GV-XXXXXX" />
          </label>
          <label className="block">
            <span className="label-base">{t("redeemAmount")}</span>
            <input type="number" min="0" step="0.01" className="input-base" value={redeemForm.amount} onChange={(e) => setRedeemForm((f) => ({ ...f, amount: e.target.value }))} placeholder={t("redeemAmountPlaceholder")} />
          </label>
          {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setRedeemOpen(false)}>{common("cancel")}</Button>
            <Button type="submit" disabled={busy}><Ticket className="h-4 w-4" />{t("redeem")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
