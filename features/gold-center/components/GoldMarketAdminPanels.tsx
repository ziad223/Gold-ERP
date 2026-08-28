"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, ExternalLink, RefreshCw, Save, ShieldAlert, Wifi } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { DateTimeInput } from "@/components/ui/date-input";
import { apiClient } from "@/lib/api/client";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDateTime } from "@/lib/dates/dates";
import { formatEnglishNumber } from "@/lib/formatters/numbers";
import { NumericInput } from "@/components/ui/numeric-input";
import { NumericToken } from "@/components/ui/numeric-token";
import styles from "./GoldMarketAdminPanels.module.css";

type Section = "overview" | "live" | "rules" | "history" | "settings";
type MarketState = {
  settings: { pricingMode: "MANUAL_APPROVED" | "LIVE_PROVIDER"; activeProvider: string | null; marketCurrency: string; refreshIntervalSeconds: number; staleAfterSeconds: number; enabled: boolean; providerConfigured: boolean; updatedAt?: string | null };
  providers: Array<{ providerId: string; configured: boolean; networkEnabled: boolean; capabilities: Record<string, boolean> }>;
  health: { status: string; lastQuoteAt?: string | null; receivedAt?: string | null; failureCode?: string | null };
  latestQuote: Record<string, any> | null;
  effectiveCgpRates?: Record<string, string | null>;
};

const KARATS = [18, 21, 22, 24];
const labels: Record<string, { ar: string; en: string }> = {
  overview: { ar: "المركز", en: "Overview" }, live: { ar: "الأسعار المباشرة", en: "Live Prices" }, rules: { ar: "قواعد التسعير", en: "Pricing Rules" }, history: { ar: "سجل الأسعار", en: "Price History" }, settings: { ar: "إعدادات مزود السوق", en: "Market Data Provider" },
};

function unwrap<T>(payload: any): T { return payload?.data ?? payload; }
function statusTone(status: string): "green" | "amber" | "rose" | "blue" { return status === "HEALTHY" ? "green" : status === "STALE" ? "amber" : status === "LOADING" ? "blue" : "rose"; }
function dateText(value: unknown, locale: string) { return value ? formatDateTime(String(value), "Asia/Dubai", locale) : "—"; }
function ageText(value: unknown) { if (!value) return "—"; const seconds = Math.max(0, Math.floor((Date.now() - new Date(String(value)).getTime()) / 1000)); return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`; }

export function GoldMarketAdminPanels({ section = "overview" }: { section?: Section }) {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("gold.manage_pricing_policy");
  const [state, setState] = useState<MarketState | null>(null);
  const [history, setHistory] = useState<any>({ items: [], page: 1, pageSize: 25, total: 0, hasMore: false });
  const [policyHistory, setPolicyHistory] = useState<any>({ items: [], page: 1, pageSize: 25, total: 0, hasMore: false });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any | null>(null);
  const [draft, setDraft] = useState({ pricingMode: "MANUAL_APPROVED", activeProvider: "GOLDAPI_IO", marketCurrency: "AED", refreshIntervalSeconds: 30, staleAfterSeconds: 120, enabled: false });
  const [policy, setPolicy] = useState({ pricingMode: "LIVE_PROVIDER", scopeType: "DEFAULT", karat: "", baseQuoteType: "BID", adjustmentType: "NONE", adjustmentValue: "0", effectiveFrom: new Date().toISOString().slice(0, 16), effectiveUntil: "", activate: false });

  const loadState = useCallback(async () => {
    setError(null);
    try {
      const result = unwrap<MarketState>(await apiClient<any>("/gold-pricing/market/settings", { locale }));
      setState(result);
      setDraft({ pricingMode: result.settings.pricingMode, activeProvider: result.settings.activeProvider || "GOLDAPI_IO", marketCurrency: result.settings.marketCurrency, refreshIntervalSeconds: result.settings.refreshIntervalSeconds, staleAfterSeconds: result.settings.staleAfterSeconds, enabled: result.settings.enabled });
    } catch (err: any) { setError(err?.message || (rtl ? "تعذر تحميل حالة السوق" : "Unable to load market state")); }
  }, [locale, rtl]);

  const loadHistory = useCallback(async (page = 1) => {
    try { setHistory(unwrap<any>(await apiClient<any>(`/gold-pricing/market/quotes/history?page=${page}&pageSize=25`, { locale }))); } catch (err: any) { setError(err?.message || "Unable to load history"); }
  }, [locale]);

  const loadPolicyHistory = useCallback(async (page = 1) => {
    try { setPolicyHistory(unwrap<any>(await apiClient<any>(`/gold-pricing/policies/history?page=${page}&pageSize=25`, { locale }))); } catch (err: any) { setError(err?.message || "Unable to load policy history"); }
  }, [locale]);

  useEffect(() => { void loadState(); if (section === "history") void loadHistory(); if (section === "rules") void loadPolicyHistory(); }, [loadState, loadHistory, loadPolicyHistory, section]);

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage) return;
    setBusy(true); setError(null);
    try { await apiClient("/gold-pricing/market/settings", { method: "PUT", body: JSON.stringify(draft), locale }); await loadState(); } catch (err: any) { setError(err?.message || (rtl ? "تعذر حفظ الإعدادات" : "Unable to save settings")); } finally { setBusy(false); }
  };

  const testConnection = async () => {
    if (!canManage) return;
    setTesting(true); setError(null);
    try { const result = unwrap<any>(await apiClient<any>("/gold-pricing/market/test-connection", { method: "POST", body: JSON.stringify({ providerId: draft.activeProvider, currency: draft.marketCurrency, staleAfterSeconds: draft.staleAfterSeconds }), locale })); setConnectionResult(result); setError(result.status === "HEALTHY" ? null : `${result.status}: ${result.reason || "provider unavailable"}`); await loadState(); } catch (err: any) { setError(err?.message || "Connection test failed"); } finally { setTesting(false); }
  };

  const createPolicy = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage) return;
    setBusy(true); setError(null);
    try { await apiClient("/gold-pricing/policies/versions", { method: "POST", body: JSON.stringify({ ...policy, karat: policy.scopeType === "KARAT" ? Number(policy.karat) : null, adjustmentValue: Number(policy.adjustmentValue), effectiveFrom: new Date(policy.effectiveFrom).toISOString(), effectiveUntil: policy.effectiveUntil ? new Date(policy.effectiveUntil).toISOString() : null, activate: policy.activate, reason: "Gold Center policy administration" }), locale }); setPolicy((v) => ({ ...v, activate: false })); await loadPolicyHistory(); } catch (err: any) { setError(err?.message || "Unable to create policy version"); } finally { setBusy(false); }
  };

  const quote = state?.latestQuote;
  const marketRows = useMemo(() => quote ? [{ label: "BID", value: quote.bid }, { label: "SPOT", value: quote.spot }, { label: "ASK", value: quote.ask }] : [], [quote]);
  const numberText = (value: unknown) => value == null ? "—" : formatEnglishNumber(Number(value), { maximumFractionDigits: 8 });
  const title = labels[section][rtl ? "ar" : "en"];

  return <div className={`${styles.panelRoot} space-y-6`} dir={rtl ? "rtl" : "ltr"}>
    <PageHeader title={title} description={rtl ? "مصدر السوق وإدارة قواعد التسعير مع بقاء السلطة المالية في الخادم." : "Market data and pricing administration with server-owned financial authority."} actions={<Button variant="secondary" onClick={() => { void loadState(); if (section === "history") void loadHistory(); }}><RefreshCw className="h-4 w-4" />{rtl ? "تحديث" : "Refresh"}</Button>} />
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200" role="alert">{error}</div>}
    {section === "overview" && <nav className={styles.sectionNav} aria-label={rtl ? "أقسام مركز الذهب" : "Gold Center sections"}>{(["live", "rules", "history", "settings"] as Section[]).map((item) => <Link key={item} href={`/gold-center/${item === "live" ? "live-prices" : item === "rules" ? "pricing-rules" : item === "history" ? "price-history" : "settings/market-data"}`} className={styles.sectionLink}><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />{labels[item][rtl ? "ar" : "en"]}</Link>)}</nav>}
    {!state ? <Card className="p-6 text-sm text-muted">{rtl ? "جارٍ التحميل…" : "Loading…"}</Card> : <>
      {(section === "overview" || section === "live") && <Card className={`${styles.surface} ${styles.statusSurface} space-y-5 p-5`}>
        <div className={styles.surfaceHeader}><div><p className={styles.eyebrow}>{rtl ? "حالة تغذية السوق" : "Market feed status"}</p><p className={styles.surfaceTitle}><span className={styles.machineValue}>{state.settings.marketCurrency}</span> / XAU / PER_GRAM</p></div><Badge tone={statusTone(state.health.status)}>{state.health.status === "HEALTHY" ? "HEALTHY · FRESH" : state.health.status}</Badge></div>
        <div className={styles.metricGrid}><Metric label={rtl ? "الوضع" : "Mode"} value={state.settings.pricingMode} /><Metric label={rtl ? "المزود" : "Provider"} value={state.settings.activeProvider || "—"} /><Metric label={rtl ? "آخر تحديث ناجح" : "Last successful refresh"} value={dateText(state.health.receivedAt, locale)} /><Metric label={rtl ? "وقت الاقتباس" : "Provider quote timestamp"} value={dateText(state.health.lastQuoteAt, locale)} /><Metric label={rtl ? "عمر الاقتباس" : "Quote age"} value={ageText(state.health.lastQuoteAt)} /><Metric label={rtl ? "التحديث / التقادم" : "Refresh / stale"} value={`${state.settings.refreshIntervalSeconds}s / ${state.settings.staleAfterSeconds}s`} /></div>
        <div className={styles.metricGrid}>{marketRows.map((row) => <Metric key={row.label} label={`${rtl ? "سعر السوق" : "Market rate"} · ${row.label}`} value={row.value == null ? "—" : `${numberText(row.value)} ${state.settings.marketCurrency}/g`} />)}</div>
        <div className={styles.dataFrame}><table className={styles.dataTable}><thead><tr><th>{rtl ? "العيار" : "Karat"}</th><th>{rtl ? "سعر السوق" : "Market rate"}</th><th>{rtl ? "معدل شراء CGP الفعّال" : "Effective CGP buy rate"}</th></tr></thead><tbody>{KARATS.map((karat) => <tr key={karat}><td className="font-bold"><NumericToken>{`${karat}K`}</NumericToken></td><td><NumericToken>{numberText(quote?.[`karat${karat}Rate`])}</NumericToken> <span className={styles.machineValue}>{state.settings.marketCurrency}/g</span></td><td className="font-bold"><NumericToken>{numberText(state.effectiveCgpRates?.[karat])}</NumericToken>{state.effectiveCgpRates?.[karat] ? ` ${state.settings.marketCurrency}/g` : ""}</td></tr>)}</tbody></table></div>
        <div className="rounded-xl bg-surface-muted p-3 text-xs text-muted">{rtl ? "سعر السوق المعروض منفصل عن معدل شراء CGP الفعّال؛ لا يتم تسمية SPOT كسعر BID." : "Market rate is displayed separately from the effective CGP buy rate; SPOT is never labelled as BID."}</div>
        {state.health.status === "STALE" && <div className={`${styles.notice} p-3`} role="status">{rtl ? "الاقتباس متقادم؛ التسعير المالي LIVE غير مؤهل حتى يصل اقتباس حديث." : "Quote is stale; Live financial pricing is ineligible until a fresh quote arrives."}</div>}
      </Card>}

      {(section === "overview" || section === "settings") && <Card className={`${styles.surface} space-y-5 p-5`}><div className="flex items-center gap-2 font-black"><Wifi className="h-4 w-4 text-brand-600" aria-hidden="true" />{rtl ? "إعدادات مزود السوق" : "Market Data Provider"}</div><form className={`${styles.formGrid} md:grid-cols-2`} onSubmit={saveSettings}>
        <label className="block"><span className="label-base">{rtl ? "الوضع" : "Mode"}</span><NativeSelect value={draft.pricingMode} disabled={!canManage || busy} onChange={(e) => { const next = e.target.value; if (next === "LIVE_PROVIDER" && !window.confirm(rtl ? "سيعيد الخادم التحقق من المزود والاقتباس والسياسة قبل التفعيل. متابعة؟" : "The server will revalidate provider, quote and policy before activation. Continue?")) return; setDraft((v) => ({ ...v, pricingMode: next })); }}><option value="MANUAL_APPROVED">MANUAL_APPROVED</option><option value="LIVE_PROVIDER">LIVE_PROVIDER</option></NativeSelect></label>
        <label className="block"><span className="label-base">{rtl ? "المزود" : "Provider"}</span><NativeSelect value={draft.activeProvider} disabled={!canManage || busy} onChange={(e) => { const next = e.target.value; if (next !== draft.activeProvider && !window.confirm(rtl ? "تغيير المزود يتطلب اختبارًا وتدقيقًا. متابعة؟" : "Changing provider requires a test and audit. Continue?")) return; setDraft((v) => ({ ...v, activeProvider: next })); }}><option value="GOLDAPI_IO">GOLDAPI_IO</option><option value="METALS_API">METALS_API (network disabled)</option></NativeSelect></label>
        <label className="block"><span className="label-base">{rtl ? "العملة" : "Currency"}</span><input className="input-base" maxLength={3} value={draft.marketCurrency} disabled={!canManage || busy} onChange={(e) => setDraft((v) => ({ ...v, marketCurrency: e.target.value.toUpperCase() }))} /></label>
        <label className="block"><span className="label-base">{rtl ? "التحديث / حد التقادم (ثانية)" : "Refresh / stale threshold (seconds)"}</span><div className="flex gap-2"><NumericInput inputMode="numeric" min={1} className="input-base" value={draft.refreshIntervalSeconds} disabled={!canManage || busy} onChange={(e) => setDraft((v) => ({ ...v, refreshIntervalSeconds: Number(e.target.value) }))} /><NumericInput inputMode="numeric" min={1} className="input-base" value={draft.staleAfterSeconds} disabled={!canManage || busy} onChange={(e) => setDraft((v) => ({ ...v, staleAfterSeconds: Number(e.target.value) }))} /></div></label>
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={draft.enabled} disabled={!canManage || busy} onChange={(e) => setDraft((v) => ({ ...v, enabled: e.target.checked }))} />{rtl ? "تفعيل مصدر السوق صراحةً" : "Explicitly enable market provider"}</label>
        <div className="flex flex-wrap gap-2 md:col-span-2"><Button type="submit" disabled={!canManage || busy}><Save className="h-4 w-4" />{rtl ? "حفظ" : "Save"}</Button><Button type="button" variant="secondary" disabled={!canManage || testing} onClick={() => void testConnection()}><Wifi className="h-4 w-4" />{testing ? (rtl ? "جارٍ الاختبار…" : "Testing…") : (rtl ? "اختبار الاتصال" : "Test Connection")}</Button></div>
        {!canManage && <p className="text-xs text-muted md:col-span-2">{rtl ? "العرض متاح، والتعديل يتطلب gold.manage_pricing_policy." : "Read-only view. Changes require gold.manage_pricing_policy."}</p>}
      </form>{connectionResult && <div className="rounded-xl border border-border p-3 text-xs"><div className="flex items-center justify-between"><span className="font-bold">{connectionResult.provider}</span><Badge tone={statusTone(connectionResult.status)}>{connectionResult.status}</Badge></div><div className="mt-2 grid gap-2 md:grid-cols-3"><Metric label="Configured" value={connectionResult.configured ? "CONFIGURED" : "NOT CONFIGURED"} /><Metric label="Reachable" value={connectionResult.reachable ? "YES" : "NO"} /><Metric label="Currency / quote time" value={`${connectionResult.currency || draft.marketCurrency} · ${dateText(connectionResult.quoteTimestamp, locale)}`} /></div><p className="mt-2 text-muted">BID {connectionResult.capabilities?.supportsBid ? "✓" : "—"} · SPOT {connectionResult.capabilities?.supportsSpot ? "✓" : "—"} · ASK {connectionResult.capabilities?.supportsAsk ? "✓" : "—"}</p></div>}<div className={styles.providerGrid}>{state.providers.map((provider) => <div key={provider.providerId} className={styles.providerCard}><div className="flex items-center justify-between gap-2"><span className={`${styles.machineValue} font-bold`}>{provider.providerId}</span><Badge tone={provider.configured ? "green" : "amber"}>{provider.configured ? "CONFIGURED" : "NOT CONFIGURED"}</Badge></div><p className={styles.providerMeta}>{provider.networkEnabled ? (rtl ? "يعمل عبر خادم ERP فقط" : "ERP backend only") : (rtl ? "الشبكة غير مفعلة" : "Network disabled")}</p></div>)}</div></Card>}

      {(section === "overview" || section === "rules") && <Card className={`${styles.surface} space-y-4 p-5`}><div className="flex items-center gap-2 font-black"><ShieldAlert className="h-4 w-4 text-brand-600" aria-hidden="true" />{rtl ? "قواعد CGP" : "CGP Pricing Rules"}</div><form className="grid gap-3 md:grid-cols-3" onSubmit={createPolicy}><label><span className="label-base">{rtl ? "النطاق" : "Scope"}</span><NativeSelect value={policy.scopeType} disabled={!canManage || busy} onChange={(e) => setPolicy((v) => ({ ...v, scopeType: e.target.value }))}><option value="DEFAULT">DEFAULT</option><option value="KARAT">PER KARAT</option></NativeSelect></label><label><span className="label-base">{rtl ? "العيار" : "Karat"}</span><NativeSelect value={policy.karat} disabled={!canManage || busy || policy.scopeType !== "KARAT"} onChange={(e) => setPolicy((v) => ({ ...v, karat: e.target.value }))}><option value="">—</option>{KARATS.map((k) => <option key={k} value={k}>{k}K</option>)}</NativeSelect></label><label><span className="label-base">{rtl ? "أساس الاقتباس" : "Quote basis"}</span><NativeSelect value={policy.baseQuoteType} disabled={!canManage || busy} onChange={(e) => setPolicy((v) => ({ ...v, baseQuoteType: e.target.value }))}><option value="BID">BID</option><option value="SPOT">SPOT</option><option value="ASK">ASK</option></NativeSelect></label><label><span className="label-base">{rtl ? "التعديل" : "Adjustment"}</span><NativeSelect value={policy.adjustmentType} disabled={!canManage || busy} onChange={(e) => setPolicy((v) => ({ ...v, adjustmentType: e.target.value }))}><option value="NONE">NONE</option><option value="FIXED_PER_GRAM">FIXED_PER_GRAM</option><option value="PERCENTAGE">PERCENTAGE</option></NativeSelect></label><label><span className="label-base">{rtl ? "قيمة التعديل" : "Adjustment value"}</span><input className="input-base" type="number" step="0.0001" value={policy.adjustmentValue} disabled={!canManage || busy} onChange={(e) => setPolicy((v) => ({ ...v, adjustmentValue: e.target.value }))} /></label><label><span className="label-base">{rtl ? "سريان من" : "Effective from"}</span><DateTimeInput className="input-base" value={policy.effectiveFrom} disabled={!canManage || busy} onChange={(value) => setPolicy((v) => ({ ...v, effectiveFrom: value }))} /></label><label><span className="label-base">{rtl ? "سريان حتى" : "Effective until"}</span><DateTimeInput className="input-base" value={policy.effectiveUntil} disabled={!canManage || busy} onChange={(value) => setPolicy((v) => ({ ...v, effectiveUntil: value }))} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={policy.activate} disabled={!canManage || busy} onChange={(e) => setPolicy((v) => ({ ...v, activate: e.target.checked }))} />{rtl ? "تفعيل الإصدار بعد الإنشاء" : "Activate version after creation"}</label><div><Button type="submit" disabled={!canManage || busy}>{rtl ? "إنشاء إصدار" : "Create version"}</Button></div></form><p className="text-xs text-muted">{rtl ? "الإصدارات غير قابلة للتعديل؛ استخدم إصدارًا جديدًا للتصحيح. التفعيل لا يملك أي fallback تلقائي." : "Versions are immutable; corrections use a new version. Activation never performs automatic fallback."}</p>{policyHistory.items?.length ? <div className={styles.dataFrame}><table className={styles.dataTable}><thead className="bg-table-header text-muted"><tr><th>{rtl ? "النطاق" : "Scope"}</th><th>{rtl ? "الإصدار" : "Version"}</th><th>{rtl ? "الاقتباس" : "Quote"}</th><th>{rtl ? "التعديل" : "Adjustment"}</th><th>{rtl ? "السريان" : "Effective"}</th><th>{rtl ? "الحالة" : "Status"}</th><th>{rtl ? "بواسطة / في" : "Changed by / at"}</th></tr></thead><tbody>{policyHistory.items.map((row: any) => <tr key={row.id} className="border-t border-border"><td className="px-4 py-3">{row.scopeType}{row.karat ? ` ${row.karat}K` : ""}</td><td className="px-4 py-3">v{row.version}</td><td className="px-4 py-3">{row.baseQuoteType}</td><td className="px-4 py-3">{row.adjustmentType} {row.adjustmentValue}</td><td className="px-4 py-3">{dateText(row.effectiveFrom, locale)}{row.effectiveUntil ? ` → ${dateText(row.effectiveUntil, locale)}` : ""}</td><td className="px-4 py-3"><Badge tone={row.status === "ACTIVE" ? "green" : "slate"}>{row.status}</Badge></td><td className="px-4 py-3">{row.createdBy || "—"} · {dateText(row.createdAt || row.updatedAt, locale)}</td></tr>)}</tbody></table></div> : <div className="text-xs text-muted">{rtl ? "لا توجد إصدارات بعد." : "No policy versions yet."}</div>}</Card>}

      {(section === "overview" || section === "history") && <Card className={`${styles.surface} overflow-hidden`}><div className="flex items-center justify-between gap-3 border-b border-border p-5"><div className="font-black">{rtl ? "سجل اقتباسات السوق" : "Market quote history"}</div><Clock3 className="h-4 w-4 text-muted" aria-hidden="true" /></div>{history.items?.length ? <div className={styles.dataFrame}><table className={styles.dataTable}><thead className="bg-table-header text-muted"><tr><th>{rtl ? "المزود" : "Provider"}</th><th>{rtl ? "العملة" : "Currency"}</th><th>{rtl ? "وقت الاقتباس" : "Quote time"}</th><th className="px-5 py-3">BID</th><th className="px-5 py-3">SPOT</th><th className="px-5 py-3">ASK</th>{KARATS.map((karat) => <th key={karat} className="px-5 py-3">{karat}K</th>)}<th>{rtl ? "الحالة" : "Status"}</th></tr></thead><tbody>{history.items.map((row: any) => <tr key={row.id} className="border-t border-border"><td className="px-5 py-3"><span className={styles.machineValue}>{row.provider}</span></td><td className="px-5 py-3"><span className={styles.machineValue}>{row.currency}</span></td><td className="px-5 py-3">{dateText(row.quoteTimestamp, locale)}</td><td className="px-5 py-3"><span className={styles.machineValue}>{row.bid ?? "—"}</span></td><td className="px-5 py-3"><span className={styles.machineValue}>{row.spot ?? "—"}</span></td><td className="px-5 py-3"><span className={styles.machineValue}>{row.ask ?? "—"}</span></td>{KARATS.map((karat) => <td key={karat} className="px-5 py-3"><span className={styles.machineValue}>{row[`karat${karat}Rate`] ?? "—"}</span></td>)}<td className="px-5 py-3"><Badge tone={row.status === "VALID" ? "green" : "amber"}>{row.status}</Badge></td></tr>)}</tbody></table></div> : <div className="p-5 text-sm text-muted">{rtl ? "لا توجد اقتباسات محفوظة." : "No stored quotes."}</div>}{history.hasMore && <div className="border-t border-border p-3 text-end"><Button size="sm" variant="secondary" onClick={() => void loadHistory(history.page + 1)}>{rtl ? "التالي" : "Next"}</Button></div>}</Card>}
    </>}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className={styles.metric}><p className="text-xs text-muted">{label}</p><NumericToken className={styles.metricValue}>{value}</NumericToken></div>; }

export default GoldMarketAdminPanels;
