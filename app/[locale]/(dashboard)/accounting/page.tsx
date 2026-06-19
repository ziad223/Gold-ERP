"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Landmark, Plus, Receipt, WalletCards, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/contexts/auth-context";
import { filterData } from "@/hooks/use-data-filters";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { useJournalEntries } from "@/hooks/use-accounting";
import { DATA_SOURCE } from "@/lib/data-source";
import { formatCurrency } from "@/lib/utils";

interface JournalEntry {
  id: string;
  description: string;
  amount: number;
  status: "balanced" | "pending";
  date: string;
}

const initialEntries: JournalEntry[] = [
  { id: "JE-260612-091", description: "Dubai Mall branch sales", amount: 52780, status: "balanced", date: "2026-06-12" },
  { id: "JE-260612-087", description: "Customer payment receipt", amount: 18000, status: "balanced", date: "2026-06-12" },
  { id: "JE-260611-102", description: "Diamond purchase invoice", amount: 84500, status: "balanced", date: "2026-06-11" },
  { id: "JE-260611-078", description: "Branch maintenance expense", amount: 2350, status: "pending", date: "2026-06-11" },
];

export default function AccountingPage() {
  const t = useTranslations("Accounting");
  const common = useTranslations("Common");
  const filtersT = useTranslations("Filters");
  const locale = useLocale();
  const { company } = useAuth();
  const [entries, setEntries] = useLocalStorageState<JournalEntry[]>("darfus-journals-v1", initialEntries);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", status: "balanced" as JournalEntry["status"] });

  // In API mode, show the real auto-posted journal entries from the backend.
  const isApi = DATA_SOURCE === "api";
  const { items: apiItems } = useJournalEntries({ page: 1, pageSize: 100 });
  const apiEntries: JournalEntry[] = useMemo(
    () =>
      (apiItems ?? []).map((e: any) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount ?? e.totalDebit ?? 0),
        status: e.status === "posted" || e.status === "balanced" ? "balanced" : "pending",
        date: (e.date ?? "").slice(0, 10),
      })),
    [apiItems],
  );
  const sourceEntries = isApi ? apiEntries : entries;

  const filtered = useMemo(
    () => filterData(sourceEntries, query, [(item) => item.id, (item) => item.description, (item) => item.date], [(item) => status === "all" || item.status === status]),
    [sourceEntries, query, status],
  );
  const currency = company?.currency ?? "AED";
  const money = (value: number) => formatCurrency(value, currency, locale);
  const statCards: Array<{ label: string; value: string; icon: LucideIcon; classes: string }> = [
    { label: t("cashBalance"), value: money(486250), icon: WalletCards, classes: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" },
    { label: t("bankAccounts"), value: money(1240800), icon: Landmark, classes: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" },
    { label: t("receipts"), value: money(328900), icon: ArrowDownLeft, classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
    { label: t("payments"), value: money(176450), icon: ArrowUpRight, classes: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
  ];

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!form.description.trim() || Number(form.amount) <= 0) return;
    setEntries((current) => [{ id: `JE-${Date.now().toString().slice(-9)}`, description: form.description.trim(), amount: Number(form.amount), status: form.status, date: new Date().toISOString().slice(0, 10) }, ...current]);
    setForm({ description: "", amount: "", status: "balanced" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} actions={<><Button variant="secondary" onClick={() => setOpen(true)}><Receipt className="h-4 w-4" />{t("journalEntry")}</Button><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t("newVoucher")}</Button></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, classes }) => <Card key={label} className="p-5"><div className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl ${classes}`}><Icon className="h-5 w-5" /></div><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-2xl font-black text-foreground">{value}</p></Card>)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5 font-black">{t("latestEntries")}</div>
          <DataToolbar query={query} onQueryChange={setQuery} placeholder={t("search")} resultCount={filtered.length} resultLabel={filtersT("results")} resetLabel={filtersT("reset")} onReset={() => { setQuery(""); setStatus("all"); }} filters={[{ id: "status", label: t("status"), value: status, onChange: setStatus, options: [{ value: "all", label: filtersT("allStatuses") }, { value: "balanced", label: t("balanced") }, { value: "pending", label: t("pending") }] }]} />
          {filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-start text-xs"><thead className="bg-table-header text-muted"><tr><th className="px-5 py-4">{t("entry")}</th><th className="px-5 py-4">{t("descriptionCol")}</th><th className="px-5 py-4">{t("amount")}</th><th className="px-5 py-4">{t("status")}</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((entry) => <tr key={entry.id} className="hover:bg-table-row-hover"><td className="px-5 py-4 font-mono font-bold text-brand-700 dark:text-brand-300">{entry.id}</td><td className="px-5 py-4 font-bold">{entry.description}<p className="mt-1 text-[10px] font-normal text-muted">{entry.date}</p></td><td className="px-5 py-4 font-black">{money(entry.amount)}</td><td className="px-5 py-4"><Badge tone={entry.status === "balanced" ? "green" : "amber"}>{t(entry.status)}</Badge></td></tr>)}</tbody></table></div> : <EmptyState title={common("noResults")} description={common("noResultsDescription")} />}
        </Card>
        <Card className="p-5"><h2 className="font-black text-foreground">{t("financialIndicators")}</h2><div className="mt-5 space-y-5">{[[t("grossMargin"), 68], [t("receivablesCollection"), 82], [t("inventoryTurnover"), 56], [t("liquidityRatio"), 74]].map(([label, value]) => <div key={String(label)}><div className="mb-2 flex justify-between text-xs"><span className="font-bold text-muted">{label}</span><span className="font-black">{value}%</span></div><div className="h-2 rounded-full bg-background"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${value}%` }} /></div></div>)}</div></Card>
      </div>
 
      <Modal open={open} onClose={() => setOpen(false)} title={t("addEntryTitle")} description={t("addEntryDescription")}>
        <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="label-base">{t("descriptionCol")}</span>
            <input required className="input-base" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label>
            <span className="label-base">{t("amount")}</span>
            <input required type="number" min="0" className="input-base" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
          </label>
          <label>
            <span className="label-base">{t("status")}</span>
            <NativeSelect value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as JournalEntry["status"] }))}>
              <option value="balanced">{t("balanced")}</option>
              <option value="pending">{t("pending")}</option>
            </NativeSelect>
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{common("cancel")}</Button>
            <Button type="submit">{t("saveEntry")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
