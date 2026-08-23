"use client";

import { ArrowLeft, ArrowRight, History, ShieldAlert } from "lucide-react";
import { useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";

/**
 * Compatibility landing page for the retired direct Scrap Gold route.
 * New customer purchases belong to the canonical CGP draft/posting workflow;
 * this bookmarked route is intentionally read-only and cannot create legacy
 * pools, assets, invoices, or payouts.
 */
export default function CustomerGoldLegacyCompatibilityPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const BackIcon = rtl ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6">
      <PageHeader
        title={rtl ? "مشتريات الذهب السابقة" : "Historical customer-gold purchases"}
        description={rtl ? "هذا الرابط محفوظ للتوافق التاريخي فقط؛ لا ينشئ مشتريات جديدة." : "This bookmarked route is retained for historical compatibility only; it does not create new purchases."}
      />
      <Card className="space-y-4 p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-sm font-bold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{rtl ? "تم إيقاف إنشاء شراء كسر جديد من هذا المسار. استخدم شراء الذهب من العميل (CGP) للمشتريات الجديدة." : "New Scrap Gold creation is disabled here. Use Customer Gold Purchase (CGP) for new customer purchases."}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/sales/customer-gold/drafts" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
            <BackIcon className="h-4 w-4" />{rtl ? "شراء الذهب من العميل (CGP)" : "Customer Gold Purchase (CGP)"}
          </Link>
          <Link href="/sales/customer-gold/history" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-surface-muted">
            <History className="h-4 w-4" />{rtl ? "عرض المشتريات السابقة" : "View historical purchases"}
          </Link>
        </div>
      </Card>
    </div>
  );
}
