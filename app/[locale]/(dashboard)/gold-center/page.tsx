"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Calculator, Gem, Lock, RefreshCw, Unlock } from "lucide-react";
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
import { useGold, type GoldQuote } from "@/hooks/use-gold";
import { formatCurrency } from "@/lib/utils";
import { formatDateTime } from "@/lib/dates/dates";
import { normalizeNumberInput, toEnglishDigits } from "@/lib/formatters/numbers";
import { NumericInput } from "@/components/ui/numeric-input";
import { NumericToken } from "@/components/ui/numeric-token";
import GoldMarketAdminPanels from "@/features/gold-center/components/GoldMarketAdminPanels";

export default function GoldCenterPage() {
  const t = useTranslations("GoldCenter");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { company } = useAuth();
  const currency = company?.currency ?? "AED";
  const money = (v: number | string) => formatCurrency(Number(v), currency, locale);

  const { snapshot, fixings, loading, refresh, saveKaratPrices, quote, createFixing, unfix } = useGold(currency);

  // ── Karat price editing ──
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingPrices, setSavingPrices] = useState(false);
  useEffect(() => {
    if (snapshot) {
      const d: Record<number, string> = {};
      snapshot.prices.forEach((p) => (d[p.karat] = String(p.pricePerGram)));
      setDrafts(d);
    }
  }, [snapshot]);

  const handleSavePrices = async () => {
    if (!snapshot) return;
    const changed = snapshot.prices
      .filter((p) => drafts[p.karat] !== undefined && Number(drafts[p.karat]) > 0 && Number(drafts[p.karat]) !== p.pricePerGram)
      .map((p) => ({ karat: p.karat, pricePerGram: Number(drafts[p.karat]) }));
    if (!changed.length) return;
    setSavingPrices(true);
    try {
      await saveKaratPrices(changed);
    } finally {
      setSavingPrices(false);
    }
  };

  // ── Quote calculator ──
  const [calc, setCalc] = useState({ grossWeight: "", karat: "21", makingChargePerGram: "", stoneValue: "" });
  const [quoteResult, setQuoteResult] = useState<GoldQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const runQuote = async () => {
    if (!Number(calc.grossWeight)) return;
    setQuoting(true);
    try {
      const r = await quote({
        grossWeight: Number(calc.grossWeight),
        karat: Number(calc.karat),
        makingChargePerGram: Number(calc.makingChargePerGram) || 0,
        stoneValue: Number(calc.stoneValue) || 0,
      });
      setQuoteResult(r);
    } finally {
      setQuoting(false);
    }
  };

  // ── Fixing modal ──
  const [fixOpen, setFixOpen] = useState(false);
  const [fixForm, setFixForm] = useState({ direction: "buy", karat: "21", grossWeight: "", customerName: "" });
  const [fixBusy, setFixBusy] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);
  const submitFix = async (e: FormEvent) => {
    e.preventDefault();
    setFixError(null);
    if (!Number(fixForm.grossWeight)) { setFixError(t("weightError")); return; }
    setFixBusy(true);
    try {
      await createFixing({
        direction: fixForm.direction as "buy" | "sell",
        karat: Number(fixForm.karat),
        grossWeight: Number(fixForm.grossWeight),
        customerName: fixForm.customerName || undefined,
      });
      setFixForm({ direction: "buy", karat: "21", grossWeight: "", customerName: "" });
      setFixOpen(false);
    } catch (err: any) {
      setFixError(err?.message || t("fixError"));
    } finally {
      setFixBusy(false);
    }
  };

  const karatOptions = useMemo(() => snapshot?.prices.map((p) => p.karat) ?? [24, 22, 21, 18, 14], [snapshot]);
  const statusTone: Record<string, "green" | "amber" | "blue"> = { fixed: "green", unfixed: "amber", settled: "blue" };
  const marketStatusTone: Record<string, "green" | "amber" | "blue"> = { FRESH: "green", STALE: "amber", UNAVAILABLE: "amber", NOT_CONFIGURED: "amber" };

  if (loading && !snapshot) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <LoadingState variant="skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GoldMarketAdminPanels section="overview" />
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={refresh}><RefreshCw className="h-4 w-4" />{common("refresh")}</Button>
            <Button onClick={() => { setFixError(null); setFixOpen(true); }}><Lock className="h-4 w-4" />{t("newFixing")}</Button>
          </div>
        }
      />

      {/* Live price banner */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900 p-5 text-white lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><Gem className="h-6 w-6 text-gold-300" /></div>
            <div>
              <p className="text-xs font-semibold text-brand-200">{t("finePerGram")}</p>
            <NumericToken className="text-2xl font-black">{snapshot?.finePricePerGram == null ? "—" : money(snapshot.finePricePerGram)}</NumericToken>
            </div>
          </div>
          <div className="text-end">
            <p className="text-xs text-slate-300">{t("ouncePrice")}: <NumericToken className="font-bold text-white">{snapshot?.ouncePrice == null ? "—" : money(snapshot.ouncePrice)}</NumericToken></p>
            <div className="mt-1 flex flex-wrap justify-end gap-2">
              <Badge tone={marketStatusTone[snapshot?.status || "NOT_CONFIGURED"] ?? "amber"}>{snapshot?.status || "NOT_CONFIGURED"}</Badge>
              {snapshot?.quoteType && <Badge tone="blue">{snapshot.quoteType}</Badge>}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Karat prices */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <span className="font-black">{t("karatPrices")}</span>
              {snapshot?.updatedAt && (
                <p className="text-xs text-muted">{t("lastUpdated")}: {formatDateTime(snapshot.updatedAt, "Asia/Dubai", locale)}{snapshot.ageSeconds != null ? ` · ${snapshot.ageSeconds}s` : ""}</p>
              )}
            </div>
            <Button size="sm" disabled={savingPrices} onClick={handleSavePrices}><Lock className="h-4 w-4" />{t("fixRates")}</Button>
          </div>
          <div className="divide-y divide-border">
            {snapshot?.prices.map((p) => (
              <div key={p.karat} className="flex items-center gap-4 px-5 py-3">
                <div className="w-16 font-black"><NumericToken>{`${p.karat}K`}</NumericToken></div>
                <div className="flex-1 text-xs text-muted">{t("purity")}: <NumericToken>{`${(p.purity * 100).toFixed(1)}%`}</NumericToken></div>
                <Badge tone={p.source === "manual" ? "green" : "blue"}>{p.source === "manual" ? t("manual") : t("live")}</Badge>
                {p.source === "manual" && p.updatedBy && (
                  <span className="hidden text-[10px] text-muted sm:inline" title={t("updatedBy")}>{p.updatedBy}</span>
                )}
                <NumericInput
                  step="0.01"
                  className="input-base w-32 text-end"
                  aria-label={`${t("rate")} ${p.karat}K`}
                  value={drafts[p.karat] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [p.karat]: normalizeNumberInput(e.target.value) }))}
                />
                <span className="w-10 text-xs text-muted">{currency}</span>
              </div>
            ))}
            {!snapshot?.prices.length && <div className="p-5 text-sm text-muted">{snapshot?.warning || "GOLD_MARKET_QUOTE_UNAVAILABLE"}</div>}
          </div>
          {snapshot?.status === "STALE" && <p className="border-t border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">{snapshot.warning} · {snapshot.ageSeconds ?? "—"}s</p>}
          {snapshot?.provider && <p className="border-t border-border px-5 py-3 text-xs text-muted">{snapshot.provider} · {snapshot.quoteType || "SPOT"} · {snapshot.unit || "PER_GRAM"} · {snapshot.source || "CANONICAL_GOLD_MARKET_QUOTE"}</p>}
        </Card>

        {/* Quote calculator */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 font-black"><Calculator className="h-4 w-4 text-brand-600" />{t("quoteTitle")}</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label-base">{t("grossWeight")} (g)</span>
                <NumericInput step="0.01" className="input-base" value={calc.grossWeight} onChange={(e) => setCalc((c) => ({ ...c, grossWeight: normalizeNumberInput(e.target.value) }))} placeholder="0" />
            </label>
            <label className="block">
              <span className="label-base">{t("karat")}</span>
              <NativeSelect value={calc.karat} onChange={(e) => setCalc((c) => ({ ...c, karat: e.target.value }))}>
                {karatOptions.map((k) => <option key={k} value={k}>{k}K</option>)}
              </NativeSelect>
            </label>
            <label className="block">
              <span className="label-base">{t("makingChargePerGram")}</span>
              <NumericInput step="0.01" min="0" className="input-base" value={calc.makingChargePerGram} onChange={(e) => setCalc((c) => ({ ...c, makingChargePerGram: normalizeNumberInput(e.target.value) }))} placeholder="0" />
            </label>
            <label className="block">
              <span className="label-base">{t("stoneValue")}</span>
              <NumericInput step="0.01" className="input-base" value={calc.stoneValue} onChange={(e) => setCalc((c) => ({ ...c, stoneValue: normalizeNumberInput(e.target.value) }))} placeholder="0" />
            </label>
          </div>
          <Button className="mt-4 w-full" disabled={quoting} onClick={runQuote}>{quoting ? common("loading") : t("calculate")}</Button>
          {quoteResult && (
            <div className="mt-4 space-y-2 rounded-2xl bg-surface-muted p-4 text-sm">
              <Row label={`${t("metalValue")} (${quoteResult.fineWeight}g ${t("fine")})`} value={money(quoteResult.metalValue)} />
              <Row label={t("makingChargePerGram")} value={money(quoteResult.makingChargePerGram)} />
              <Row label={t("totalMakingCharge")} value={money(quoteResult.totalMakingCharge ?? quoteResult.makingCharge)} />
              <Row label={t("stoneValue")} value={money(quoteResult.stoneValue)} />
              <Row label={t("subtotal")} value={money(quoteResult.subtotal)} />
              <Row label={t("vat")} value={money(quoteResult.vat)} />
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-black">
                <span>{t("total")}</span><span className="text-brand-700 dark:text-brand-300">{money(quoteResult.total)}</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Fixings */}
      <Card className="overflow-hidden">
        <div className="border-b border-border p-5 font-black">{t("fixings")}</div>
        {fixings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-start text-xs">
              <thead className="bg-table-header text-muted">
                <tr>
                  <th className="px-5 py-4">{t("direction")}</th>
                  <th className="px-5 py-4">{t("customer")}</th>
                  <th className="px-5 py-4">{t("karat")}</th>
                  <th className="px-5 py-4">{t("grossWeight")}</th>
                  <th className="px-5 py-4">{t("rate")}</th>
                  <th className="px-5 py-4">{t("value")}</th>
                  <th className="px-5 py-4">{t("status")}</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fixings.map((f) => (
                  <tr key={f.id} className="hover:bg-table-row-hover">
                    <td className="px-5 py-4"><Badge tone={f.direction === "buy" ? "blue" : "green"}>{t(f.direction)}</Badge></td>
                    <td className="px-5 py-4 font-bold">{f.customerName || "—"}</td>
                    <td className="px-5 py-4"><NumericToken>{`${f.karat}K`}</NumericToken></td>
                    <td className="px-5 py-4"><NumericToken>{`${toEnglishDigits(f.grossWeight)}g`}</NumericToken></td>
                    <td className="px-5 py-4"><NumericToken>{money(f.ratePerGram)}</NumericToken></td>
                    <td className="px-5 py-4 font-black"><NumericToken>{money(f.value)}</NumericToken></td>
                    <td className="px-5 py-4"><Badge tone={statusTone[f.status] ?? "amber"}>{t(f.status)}</Badge></td>
                    <td className="px-5 py-4 text-end">
                      {f.status === "fixed" && (
                        <Button size="sm" variant="secondary" onClick={() => unfix(f.id)}><Unlock className="h-3.5 w-3.5" />{t("unfix")}</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={common("noResults")} description={t("noFixings")} />
        )}
      </Card>

      {/* New fixing modal */}
      <Modal open={fixOpen} onClose={() => setFixOpen(false)} title={t("newFixing")} description={t("fixingDesc")}>
        <form onSubmit={submitFix} className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="label-base">{t("direction")}</span>
            <NativeSelect value={fixForm.direction} onChange={(e) => setFixForm((f) => ({ ...f, direction: e.target.value }))}>
              <option value="buy">{t("buy")}</option>
              <option value="sell">{t("sell")}</option>
            </NativeSelect>
          </label>
          <label className="block">
            <span className="label-base">{t("karat")}</span>
            <NativeSelect value={fixForm.karat} onChange={(e) => setFixForm((f) => ({ ...f, karat: e.target.value }))}>
              {karatOptions.map((k) => <option key={k} value={k}>{k}K</option>)}
            </NativeSelect>
          </label>
          <label className="block">
            <span className="label-base">{t("grossWeight")} (g)</span>
            <NumericInput required step="0.01" min="0" className="input-base" value={fixForm.grossWeight} onChange={(e) => setFixForm((f) => ({ ...f, grossWeight: normalizeNumberInput(e.target.value) }))} placeholder="0" />
          </label>
          <label className="block">
            <span className="label-base">{t("customer")}</span>
            <input className="input-base" value={fixForm.customerName} onChange={(e) => setFixForm((f) => ({ ...f, customerName: e.target.value }))} placeholder={t("customerOptional")} />
          </label>
          {fixError && <p className="text-xs font-bold text-rose-600 sm:col-span-2">{fixError}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setFixOpen(false)}>{common("cancel")}</Button>
            <Button type="submit" disabled={fixBusy}><Lock className="h-4 w-4" />{t("lockRate")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted">
      <span>{label}</span>
      <NumericToken className="font-bold text-foreground">{value}</NumericToken>
    </div>
  );
}
