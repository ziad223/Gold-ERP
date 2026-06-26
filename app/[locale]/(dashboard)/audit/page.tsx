"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, FilePenLine, LogIn, MoveRight, ShieldAlert, ShieldCheck, ShoppingCart, UserCog } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { apiClient } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { filterData } from "@/hooks/use-data-filters";
import { AuditDiffViewer } from "@/features/audit/components/AuditDiffViewer";
import { useAuditLogs, type AuditLogRow } from "@/hooks/use-audit-logs";

type Tone = "green" | "violet" | "blue" | "amber" | "slate" | "rose";

// Static demo rows — used ONLY as a mock/local fallback (api mode reads the real log).
const mockLogs: AuditLogRow[] = [
  { id: "AUD-1001", action: "sale", description: "INV-10486 · AST-2026-00144", user: "Omar Hassan", place: "Abu Dhabi Branch", date: "2026-06-13 02:22", before: "Asset: available", after: "Asset: sold", severity: "info", sourceDocument: "INV-10486" },
  { id: "AUD-1002", action: "permissions", description: "Role: Branch Manager", user: "Admin DARFUS", place: "Head Office", date: "2026-06-12 17:14", before: "74 permissions", after: "76 permissions", severity: "warning", sourceDocument: "" },
  { id: "AUD-1003", action: "transfer", description: "TR-0901 · to Dubai Mall", user: "Ahmed Youssef", place: "Main Warehouse", date: "2026-06-11 14:10", before: "Main Warehouse", after: "Dubai Mall", severity: "info", sourceDocument: "TR-0901" },
  { id: "AUD-1004", action: "postEdit", description: "Exception request INV-10470", user: "Laila Adel", place: "Abu Dhabi Branch", date: "2026-06-08 11:06", before: "Total: 9,800", after: "Total: 9,650", severity: "critical", sourceDocument: "INV-10470" },
  { id: "AUD-1005", action: "login", description: "New device · Chrome/Windows", user: "Sara Ahmed", place: "Dubai", date: "2026-05-29 08:33", before: "Unknown device", after: "Trusted after verification", severity: "info", sourceDocument: "" },
];

function toneForSeverity(severity: string): Tone {
  if (severity === "critical") return "rose";
  if (severity === "warning") return "amber";
  return "blue";
}

function iconForAction(action: string) {
  const a = (action || "").toLowerCase();
  if (a.includes("sale") || a.includes("checkout") || a.includes("invoice") || a.includes("purchase")) return ShoppingCart;
  if (a.includes("permission") || a.includes("role") || a.includes("settings")) return UserCog;
  if (a.includes("transfer")) return MoveRight;
  if (a.includes("login") || a.includes("session")) return LogIn;
  if (a.includes("edit") || a.includes("update") || a.includes("adjust")) return FilePenLine;
  return ShieldCheck;
}

export default function AuditPage() {
  const t = useTranslations("Audit");
  const common = useTranslations("Common");
  const filtersT = useTranslations("Filters");
  const locale = useLocale();

  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [period, setPeriod] = useState("all");
  // Phase 7B: server-side pagination state (API mode).
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<AuditLogRow | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [integrity, setIntegrity] = useState<{ valid: boolean; total: number } | null>(null);

  const rtl = locale === "ar";
  const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

  // API mode: search + action + severity + period (createdAt range) are applied
  // SERVER-SIDE, and the page slice + total come from the server.
  const { isApi, logs: apiLogs, total: apiTotal, totalPages: apiTotalPages, isLoading } = useAuditLogs({
    page,
    pageSize,
    search: query,
    action,
    severity,
    period,
  });

  // Mock fallback (demo, not API): client-filter the static rows by
  // search/action/severity only — period is deferred here too.
  const mockFiltered = useMemo(
    () =>
      filterData(
        mockLogs,
        query,
        [(item) => item.id, (item) => item.description, (item) => item.user, (item) => item.place, (item) => item.action, (item) => item.sourceDocument],
        [
          (item) => action === "all" || item.action === action,
          (item) => severity === "all" || item.severity === severity,
        ],
      ),
    [query, action, severity],
  );

  const logs = isApi ? apiLogs : mockFiltered;
  const resultTotal = isApi ? apiTotal : mockFiltered.length;
  const safeTotalPages = isApi ? Math.max(1, apiTotalPages) : 1;
  const firstRecord = resultTotal === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecord = resultTotal === 0 ? 0 : Math.min(resultTotal, firstRecord + logs.length - 1);

  // Any search/filter change returns to page 1 (server pagination).
  useEffect(() => {
    setPage(1);
  }, [query, action, severity, period]);

  const goToPage = (next: number) => setPage(Math.min(Math.max(next, 1), safeTotalPages));
  const handlePageSizeChange = (value: number) => { setPageSize(value); setPage(1); };

  const handleVerify = async () => {
    setVerifying(true);
    setIntegrity(null);
    try {
      const res = await apiClient<{ valid: boolean; total: number }>("/audit-logs/verify", { locale });
      setIntegrity({ valid: res.valid, total: res.total });
    } catch {
      setIntegrity({ valid: false, total: 0 });
    } finally {
      setVerifying(false);
    }
  };

  // Action options are derived from the current page's distinct actions (no
  // backend distinct endpoint); the selected action is always kept so it stays
  // selectable across pages.
  const actionOptions = useMemo(() => {
    const uniq = new Set(logs.map((l) => l.action).filter(Boolean));
    if (action !== "all") uniq.add(action);
    return [{ value: "all", label: t("allActions") }, ...Array.from(uniq).sort().map((a) => ({ value: a, label: a }))];
  }, [logs, action, t]);

  const showLoading = isApi && isLoading && logs.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {integrity && (
              <Badge tone={integrity.valid ? "green" : "rose"}>
                {integrity.valid ? t("integrityValid", { total: integrity.total }) : t("integrityBroken")}
              </Badge>
            )}
            <Button variant="secondary" disabled={verifying} onClick={handleVerify}>
              {integrity?.valid === false ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {verifying ? common("loading") : t("verifyIntegrity")}
            </Button>
          </div>
        }
      />
      <Card className="overflow-hidden">
        <DataToolbar query={query} onQueryChange={setQuery} placeholder={t("search")} resultCount={resultTotal} resultLabel={filtersT("results")} resetLabel={filtersT("reset")} onReset={() => { setQuery(""); setAction("all"); setSeverity("all"); setPeriod("all"); }} filters={[
          { id: "action", label: t("allActions"), value: action, onChange: setAction, options: actionOptions },
          { id: "severity", label: t("allSeverities"), value: severity, onChange: setSeverity, options: [{ value: "all", label: t("allSeverities") }, { value: "info", label: t("info") }, { value: "warning", label: t("warning") }, { value: "critical", label: t("critical") }] },
          { id: "period", label: t("allPeriods"), value: period, onChange: setPeriod, options: [{ value: "all", label: t("allPeriods") }, { value: "today", label: t("today") }, { value: "week", label: t("week") }, { value: "month", label: t("month") }] },
        ]} />
         {showLoading ? (
           <EmptyState title={common("loading")} description={common("loading")} />
         ) : logs.length ? (
           <div className="divide-y divide-border">
             {logs.map((log) => {
               const Icon = iconForAction(log.action);
               return (
                 <div key={log.id} className="grid gap-4 p-5 transition hover:bg-table-row-hover md:grid-cols-[auto_1.25fr_1fr_1fr_auto_auto] md:items-center">
                   <div className="grid h-11 w-11 place-items-center rounded-2xl bg-background text-muted">
                     <Icon className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-xs font-black text-foreground">{log.action}</p>
                     <p className="mt-1 text-[10px] text-muted">{log.description}</p>
                   </div>
                   <div>
                     <p className="text-[10px] text-muted">{t("by")}</p>
                     <p className="mt-1 text-xs font-bold">{log.user}</p>
                   </div>
                   <div>
                     <p className="text-[10px] text-muted">{log.place}</p>
                     <p className="mt-1 text-[10px] font-semibold text-muted">{log.date}</p>
                   </div>
                   <Badge tone={toneForSeverity(log.severity)}>{log.id}</Badge>
                   <Button size="sm" variant="ghost" onClick={() => setSelected(log)}>
                     <Eye className="h-4 w-4" />{common("view")}
                   </Button>
                 </div>
               );
             })}
           </div>
         ) : (
           <EmptyState title={common("noResults")} description={common("noResultsDescription")} />
         )}

         {isApi && !showLoading && resultTotal > 0 && (
           <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
             <p className="font-semibold text-muted">
               {rtl ? `عرض ${firstRecord}-${lastRecord} من ${resultTotal}` : `Showing ${firstRecord}-${lastRecord} of ${resultTotal}`}
             </p>
             <div className="flex flex-wrap items-center gap-2">
               <select
                 value={pageSize}
                 onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                 className="h-9 rounded-2xl border border-border bg-panel px-3 text-xs font-semibold text-foreground outline-none focus:ring-4 focus:ring-ring/20"
                 aria-label={rtl ? "عدد السجلات في الصفحة" : "Records per page"}
               >
                 {PAGE_SIZE_OPTIONS.map((option) => (
                   <option key={option} value={option}>
                     {rtl ? `${option} لكل صفحة` : `${option} / page`}
                   </option>
                 ))}
               </select>
               <Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                 {rtl ? "السابق" : "Previous"}
               </Button>
               <span className="min-w-20 text-center font-bold text-muted">
                 {rtl ? `صفحة ${page} / ${safeTotalPages}` : `Page ${page} / ${safeTotalPages}`}
               </span>
               <Button type="button" variant="secondary" size="sm" disabled={page >= safeTotalPages} onClick={() => goToPage(page + 1)}>
                 {rtl ? "التالي" : "Next"}
               </Button>
             </div>
           </div>
         )}
       </Card>

       <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? selected.action : ""} description={selected?.description}>
         {selected && (
           <div className="space-y-4">
             <div className="grid gap-3 sm:grid-cols-3">
               <Info label={t("user")} value={selected.user} />
               <Info label={t("location")} value={selected.place} />
               <Info label={t("date")} value={selected.date} />
             </div>
             {selected.sourceDocument && (
               <div className="grid gap-3 sm:grid-cols-2">
                 <Info label={t("sourceDocument")} value={selected.sourceDocument} />
                 <Info label={t("severity")} value={selected.severity} />
               </div>
             )}
             <div className="pt-2">
               <AuditDiffViewer before={selected.before} after={selected.after} />
             </div>
           </div>
         )}
       </Modal>
     </div>
   );
 }

 function Info({ label, value }: { label: string; value: string }) {
   return (
     <div className="rounded-2xl bg-background p-4">
       <p className="text-[10px] text-muted">{label}</p>
       <p className="mt-1 text-xs font-extrabold">{value}</p>
     </div>
   );
 }
