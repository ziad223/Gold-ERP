"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, ExternalLink, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";
import { useBranchContext } from "@/contexts/branch-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

type ReadinessCheck = { status: "READY" | "BLOCKED" | "OPTIONAL"; code: string; label: string; requiredFor: string; details?: Record<string, unknown> | null };
type Readiness = {
  systemFirstRunReady: boolean;
  operationalReceiveReady: boolean;
  checks: Record<string, ReadinessCheck>;
  blockers: Array<{ code: string; scope: string }>;
  company: { businessName: string | null; country: string | null; currency: string | null; trnPresent: boolean };
  branch: { branchId?: string; branchName?: string } | null;
};
type ReadinessResponse = { success: boolean; data: Readiness };

const steps = [
  { key: "companyIdentity", ar: "بيانات الشركة", en: "Company identity", href: "/settings" },
  { key: "taxPolicy", ar: "الضرائب", en: "UAE tax policy", href: "/settings" },
  { key: "activeBranch", ar: "الفروع", en: "Branches", href: "/settings" },
  { key: "activeInventoryLocation", ar: "مواقع المخزون", en: "Inventory locations", href: "/inventory/locations" },
  { key: "financialFoundation", ar: "الجاهزية المالية", en: "Financial readiness", href: "/accounting" },
  { key: "supplierAvailable", ar: "الموردون", en: "Suppliers", href: "/suppliers" },
  { key: "review", ar: "مراجعة الجاهزية", en: "Readiness review", href: null },
] as const;

export default function OnboardingPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { branchId } = useBranchContext();
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient<ReadinessResponse>("/settings/operational-readiness", { locale, branchId: branchId || undefined });
      setReadiness(response.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (rtl ? "تعذر تحميل حالة الجاهزية." : "Unable to load readiness."));
    } finally { setLoading(false); }
  };

  useEffect(() => { if (branchId) void load(); }, [branchId]);

  if (loading) return <LoadingState variant="skeleton" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!readiness) return null;

  return <div className="space-y-6 text-xs">
    <PageHeader
      title={rtl ? "إعداد الشركة والجاهزية التشغيلية" : "Company onboarding & operational readiness"}
      description={rtl ? "دليل واحد مشتق من حالة قاعدة البيانات. لا ينشئ موردًا أو موقعًا أو إعداد ضريبة تلقائيًا." : "One database-derived guide. It never creates a supplier, location, or tax setting automatically."}
      actions={<Button size="sm" variant="secondary" onClick={() => void load()}><RefreshCw className="h-4 w-4" />{rtl ? "تحديث" : "Refresh"}</Button>}
    />
    <div className="grid gap-4 md:grid-cols-2">
      <ReadinessCard title={rtl ? "جاهزية تشغيل النظام" : "System first-run readiness"} ready={readiness.systemFirstRunReady} rtl={rtl} />
      <ReadinessCard title={rtl ? "جاهزية الاستلام من مورد" : "Supplier receive readiness"} ready={readiness.operationalReceiveReady} rtl={rtl} />
    </div>
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-bold">{rtl ? "خطوات الإعداد" : "Onboarding steps"}</h2><span className="text-slate-500">{readiness.company.businessName || (rtl ? "اسم الشركة غير مكتمل" : "Company identity incomplete")}</span></div>
      <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const check = step.key === "review" ? null : readiness.checks[step.key];
          const ready = step.key === "review" ? readiness.operationalReceiveReady : check?.status === "READY";
          return <li key={step.key} className="rounded-xl border border-border p-3">
            <div className="flex items-start gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 font-bold text-slate-600">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{rtl ? step.ar : step.en}</h3>{ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label={rtl ? "جاهز" : "Ready"} /> : <CircleAlert className="h-4 w-4 text-amber-600" aria-label={rtl ? "يحتاج إعداد" : "Needs setup"} />}</div><p className="mt-2 text-slate-500">{step.key === "review" ? (ready ? (rtl ? "يمكن فتح الاستلام canonical من المخزون." : "Canonical receive can be opened from Inventory.") : (rtl ? "راجع المتطلبات الناقصة قبل الاستلام." : "Review blockers before receiving.")) : check?.label}</p>{step.href && <Link href={step.href} className="mt-2 inline-flex items-center gap-1 text-brand-700 hover:underline">{rtl ? "فتح الإدارة الحالية" : "Open canonical management"}<ExternalLink className="h-3 w-3" /></Link>}</div></div>
          </li>;
        })}
      </ol>
    </Card>
    {readiness.blockers.length > 0 && <Card className="border-amber-200 p-4"><h2 className="font-bold text-amber-800">{rtl ? "متطلبات تحتاج إعدادًا" : "Readiness blockers"}</h2><ul className="mt-3 space-y-2 text-amber-900">{readiness.blockers.map((blocker) => <li key={`${blocker.scope}-${blocker.code}`}>• {blocker.code}</li>)}</ul></Card>}
    <Card className="p-4"><p className="font-semibold">{rtl ? "مسار الاستلام" : "Receive authority"}</p><p className="mt-1 text-slate-600">{rtl ? "الاستلام لا يتم من onboarding أو من شاشة الموردين؛ المسار الوحيد هو المخزون → إضافة / استلام مخزون." : "Onboarding and Supplier Master do not create receives; the only receive entry is Inventory → Add / Receive Inventory."}</p><Link href="/inventory" className="mt-3 inline-flex text-brand-700 hover:underline">{rtl ? "فتح المخزون" : "Open Inventory"}</Link></Card>
  </div>;
}

function ReadinessCard({ title, ready, rtl }: { title: string; ready: boolean; rtl: boolean }) {
  return <Card className={`p-4 ${ready ? "border-emerald-200" : "border-amber-200"}`}><div className="flex items-center gap-2">{ready ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <CircleAlert className="h-5 w-5 text-amber-600" />}<h2 className="font-bold">{title}</h2></div><p className={`mt-2 font-semibold ${ready ? "text-emerald-700" : "text-amber-700"}`}>{ready ? (rtl ? "جاهز" : "READY") : (rtl ? "يحتاج إعداد" : "NEEDS SETUP")}</p></Card>;
}
