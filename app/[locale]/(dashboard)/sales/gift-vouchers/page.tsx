"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Gift, Plus, Printer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useGiftVouchers } from "@/hooks/use-gift-vouchers";
import { useCoreErpData } from "@/hooks/use-core-erp-data";
import { apiClient } from "@/lib/api/client";
import { formatDate } from "@/lib/dates/dates";
import { formatCurrency } from "@/lib/utils";
import { ScannableBarcode } from "@/features/printing/components/ScannableBarcode";
import { renderPrintDocument } from "@/features/printing/components/render-print-document";
import { printHtmlDocument } from "@/lib/print/print-service";
import type { GiftVoucher } from "@/lib/types";

type BranchOption = { id: string; name?: string | null; code?: string | null };

function GiftVoucherPrintDocument({ voucher, locale, customerName }: { voucher: GiftVoucher; locale: string; customerName?: string }) {
  const rtl = locale === "ar";
  const labels = rtl
    ? { title: "قسيمة هدية", number: "رقم القسيمة", code: "رمز الاسترداد", value: "القيمة", status: "الحالة", customer: "العميل", issued: "تاريخ الإصدار" }
    : { title: "Gift Voucher", number: "Voucher number", code: "Redemption code", value: "Face value", status: "Status", customer: "Customer", issued: "Issued at" };
  return (
    <main style={{ width: "88mm", padding: "8mm", color: "#111", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ margin: 0, fontSize: "18px" }}>{labels.title}</h1>
      <p style={{ margin: "4px 0 12px", fontSize: "11px" }}>{labels.number}: {voucher.voucherNumber}</p>
      <div style={{ height: "28mm", marginBottom: "8px" }}><ScannableBarcode value={voucher.voucherCode} /></div>
      <dl style={{ margin: 0, fontSize: "12px", lineHeight: 1.8 }}>
        <div><dt style={{ display: "inline", fontWeight: 700 }}>{labels.code}: </dt><dd style={{ display: "inline", fontFamily: "monospace" }}>{voucher.voucherCode}</dd></div>
        <div><dt style={{ display: "inline", fontWeight: 700 }}>{labels.value}: </dt><dd style={{ display: "inline" }}>{voucher.faceValue} {voucher.currency}</dd></div>
        <div><dt style={{ display: "inline", fontWeight: 700 }}>{labels.status}: </dt><dd style={{ display: "inline" }}>{voucher.status}</dd></div>
        {customerName ? <div><dt style={{ display: "inline", fontWeight: 700 }}>{labels.customer}: </dt><dd style={{ display: "inline" }}>{customerName}</dd></div> : null}
        <div><dt style={{ display: "inline", fontWeight: 700 }}>{labels.issued}: </dt><dd style={{ display: "inline" }}>{new Date(voucher.issuedAt).toLocaleString(locale)}</dd></div>
      </dl>
    </main>
  );
}

export default function GiftVouchersPage() {
  const t = useTranslations("GiftVouchers");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { company, activeBranchId } = useAuth();
  const currency = company?.currency ?? "AED";
  const money = (value: number | string) => formatCurrency(Number(value), currency, locale);
  const { customers } = useCoreErpData({ resources: ["customers"] });
  const { items, loading, issueVoucher, activateVoucher, recordPrintEvent } = useGiftVouchers();

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [issueOpen, setIssueOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueForm, setIssueForm] = useState({
    faceValue: "",
    customerId: "",
    paymentMethod: "cash" as "cash" | "card" | "transfer",
    branchEligibilityMode: "ALL_BRANCHES" as "ALL_BRANCHES" | "SELECTED_BRANCHES",
    eligibleBranchIds: [] as string[],
  });

  useEffect(() => {
    if (!activeBranchId) return;
    let cancelled = false;
    apiClient<{ items?: BranchOption[]; data?: { items?: BranchOption[] } }>("/branches?page=1&pageSize=100", { locale, skipBranch: true })
      .then((result) => { if (!cancelled) setBranches(result.items ?? result.data?.items ?? []); })
      .catch(() => { if (!cancelled) setBranches([]); });
    return () => { cancelled = true; };
  }, [activeBranchId, locale]);

  const customersById = useMemo(() => new Map(customers.map((customer) => [customer.id, customer.name])), [customers]);
  const statusTone: Record<GiftVoucher["status"], "green" | "amber" | "rose"> = {
    issued: "amber", active: "green", distributed: "amber", redeemed: "amber", expired: "rose", cancelled: "rose",
  };

  const submitIssue = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const faceValue = Number(issueForm.faceValue);
    if (!(faceValue > 0)) { setError(t("valueError")); return; }
    if (!activeBranchId) { setError(t("branchRequired")); return; }
    if (issueForm.branchEligibilityMode === "SELECTED_BRANCHES" && issueForm.eligibleBranchIds.length === 0) {
      setError(t("eligibilityRequired"));
      return;
    }
    setBusy(true);
    try {
      await issueVoucher({
        faceValue,
        customerId: issueForm.customerId || undefined,
        paymentMethod: issueForm.paymentMethod,
        branchId: activeBranchId,
        branchEligibilityMode: issueForm.branchEligibilityMode,
        eligibleBranchIds: issueForm.branchEligibilityMode === "SELECTED_BRANCHES" ? issueForm.eligibleBranchIds : undefined,
      });
      setIssueForm({ faceValue: "", customerId: "", paymentMethod: "cash", branchEligibilityMode: "ALL_BRANCHES", eligibleBranchIds: [] });
      setIssueOpen(false);
    } catch (err: any) {
      setError(err?.message || t("issueError"));
    } finally {
      setBusy(false);
    }
  };

  const toggleEligibleBranch = (branchId: string) => {
    setIssueForm((current) => ({
      ...current,
      eligibleBranchIds: current.eligibleBranchIds.includes(branchId)
        ? current.eligibleBranchIds.filter((id) => id !== branchId)
        : [...current.eligibleBranchIds, branchId],
    }));
  };

  const activate = async (voucher: GiftVoucher) => {
    if (!activeBranchId) { setError(t("branchRequired")); return; }
    setBusy(true);
    setError(null);
    try {
      await activateVoucher(voucher.voucherCode, activeBranchId);
    } catch (err: any) {
      setError(err?.message || t("activationError"));
    } finally {
      setBusy(false);
    }
  };

  const printVoucher = async (voucher: GiftVoucher) => {
    if (!activeBranchId) { setError(t("branchRequired")); return; }
    setBusy(true);
    setError(null);
    try {
      // An original/reprint audit event is committed before the browser dialog
      // opens, so this immutable identity is never printed without evidence.
      await recordPrintEvent(voucher.voucherCode, activeBranchId);
      const customerName = voucher.customerId ? customersById.get(voucher.customerId) : undefined;
      const html = renderPrintDocument(
        <GiftVoucherPrintDocument voucher={voucher} locale={locale} customerName={customerName} />,
        { documentType: "gift-voucher", paperSize: "80mm", title: voucher.voucherNumber, locale },
      );
      const result = printHtmlDocument(html, { documentType: "gift-voucher", paperSize: "80mm", title: voucher.voucherNumber, locale });
      if (!result.ok) setError(t("printError"));
    } catch (err: any) {
      setError(err?.message || t("printError"));
    } finally {
      setBusy(false);
    }
  };

  if (loading && items.length === 0) {
    return <div className="space-y-6"><PageHeader title={t("title")} description={t("description")} /><LoadingState variant="skeleton" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} actions={<Button onClick={() => { setError(null); setIssueOpen(true); }}><Plus className="h-4 w-4" />{t("issue")}</Button>} />
      <Card className="border-brand-200 bg-brand-50 p-4 text-sm text-brand-900 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-100">{t("fullRedemptionOnly")}</Card>
      {error ? <Card className="border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</Card> : null}

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5 font-black">{t("allVouchers")}</div>
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-start text-xs">
              <thead className="bg-table-header text-muted"><tr>
                <th className="px-5 py-4">{t("number")}</th><th className="px-5 py-4">{t("code")}</th><th className="px-5 py-4">{t("customer")}</th><th className="px-5 py-4">{t("value")}</th><th className="px-5 py-4">{t("status")}</th><th className="px-5 py-4">{t("issueDate")}</th><th className="px-5 py-4">{common("actions")}</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {items.map((voucher) => <tr key={voucher.id} className="hover:bg-table-row-hover">
                  <td className="px-5 py-4 font-mono text-muted">{voucher.voucherNumber}</td>
                  <td className="px-5 py-4 font-mono font-bold text-brand-700 dark:text-brand-300">{voucher.voucherCode}</td>
                  <td className="px-5 py-4 font-bold">{voucher.customerId ? customersById.get(voucher.customerId) || "—" : "—"}</td>
                  <td className="px-5 py-4 font-black">{money(voucher.faceValue)}</td>
                  <td className="px-5 py-4"><Badge tone={statusTone[voucher.status]}>{t(voucher.status)}</Badge></td>
                  <td className="px-5 py-4 text-muted">{formatDate(voucher.issuedAt, locale)}</td>
                  <td className="px-5 py-4"><div className="flex gap-2">
                    {voucher.status === "issued" ? <Button size="sm" variant="secondary" disabled={busy} onClick={() => activate(voucher)}><CheckCircle2 className="h-3.5 w-3.5" />{t("activate")}</Button> : null}
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => printVoucher(voucher)}><Printer className="h-3.5 w-3.5" />{t("print")}</Button>
                  </div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title={common("noResults")} description={t("noVouchers")} />}
      </Card>

      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} title={t("issueTitle")} description={t("issueDesc")}>
        <form onSubmit={submitIssue} className="grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="label-base">{t("value")}</span><input required type="number" min="0" step="0.0001" className="input-base" value={issueForm.faceValue} onChange={(event) => setIssueForm((current) => ({ ...current, faceValue: event.target.value }))} placeholder="0" /></label>
          <label className="block"><span className="label-base">{t("paymentMethod")}</span><NativeSelect value={issueForm.paymentMethod} onChange={(event) => setIssueForm((current) => ({ ...current, paymentMethod: event.target.value as "cash" | "card" | "transfer" }))}><option value="cash">{t("cash")}</option><option value="card">{t("card")}</option><option value="transfer">{t("transfer")}</option></NativeSelect></label>
          <label className="block sm:col-span-2"><span className="label-base">{t("customer")}</span><NativeSelect value={issueForm.customerId} onChange={(event) => setIssueForm((current) => ({ ...current, customerId: event.target.value }))}><option value="">{t("customerOptional")}</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</NativeSelect></label>
          <fieldset className="sm:col-span-2"><legend className="label-base">{t("branchEligibility")}</legend><div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm"><input type="radio" checked={issueForm.branchEligibilityMode === "ALL_BRANCHES"} onChange={() => setIssueForm((current) => ({ ...current, branchEligibilityMode: "ALL_BRANCHES", eligibleBranchIds: [] }))} />{t("allBranches")}</label><label className="flex items-center gap-2 text-sm"><input type="radio" checked={issueForm.branchEligibilityMode === "SELECTED_BRANCHES"} onChange={() => setIssueForm((current) => ({ ...current, branchEligibilityMode: "SELECTED_BRANCHES" }))} />{t("selectedBranches")}</label></div>
            {issueForm.branchEligibilityMode === "SELECTED_BRANCHES" ? <div className="mt-3 grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-2">{branches.map((branch) => <label key={branch.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={issueForm.eligibleBranchIds.includes(branch.id)} onChange={() => toggleEligibleBranch(branch.id)} />{branch.name || branch.code || branch.id}</label>)}</div> : null}
          </fieldset>
          <p className="text-xs text-muted sm:col-span-2">{t("issueCreatesLiability")}</p>
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="secondary" onClick={() => setIssueOpen(false)}>{common("cancel")}</Button><Button type="submit" disabled={busy}><Gift className="h-4 w-4" />{t("issue")}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
