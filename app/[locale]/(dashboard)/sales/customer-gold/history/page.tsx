"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";
import type { CustomerGoldPool } from "@/lib/types";

export default function CustomerGoldHistoryPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const [items, setItems] = useState<CustomerGoldPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const BackIcon = rtl ? ArrowRight : ArrowLeft;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient<any>("/customer-gold-pools?limit=100", { locale });
      const rows = response.data?.items || response.data?.data || response.items || response.data || [];
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : (rtl ? "تعذر تحميل السجل التاريخي." : "Unable to load historical purchases."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [locale]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={rtl ? "مشتريات الذهب السابقة" : "Historical customer-gold purchases"}
        description={rtl ? "عرض للقراءة فقط لسجلات Legacy السابقة دون إنشاء عمليات جديدة." : "Read-only history of legacy customer-gold records; new acquisitions use the canonical CGP workflow."}
        actions={<div className="flex flex-wrap gap-2"><Link href="/sales/customer-gold/drafts" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-bold"><BackIcon className="h-4 w-4" />{rtl ? "شراء جديد عبر CGP" : "New purchase via CGP"}</Link><Button variant="secondary" onClick={() => void load()}><RefreshCw className="h-4 w-4" />{rtl ? "تحديث" : "Refresh"}</Button></div>}
      />
      {error && <Card className="p-4 text-sm font-bold text-destructive">{error}</Card>}
      <Card className="overflow-hidden p-0">
        {loading ? <p className="p-8 text-center text-sm text-muted">{rtl ? "جارٍ التحميل..." : "Loading..."}</p> : items.length === 0 ? <p className="p-8 text-center text-sm text-muted">{rtl ? "لا توجد سجلات تاريخية." : "No historical records found."}</p> : (
          <div className="divide-y divide-border">
            {items.map((pool) => <div key={pool.id} className="grid gap-3 p-4 sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto] sm:items-center">
              <div><p className="font-mono text-sm font-black">{pool.id}</p><p className="text-xs text-muted">{pool.customerName}</p></div>
              <div><p className="text-[11px] text-muted">{rtl ? "الوزن القائم" : "Gross weight"}</p><p className="font-bold">{pool.grossWeight} g</p></div>
              <div><p className="text-[11px] text-muted">{rtl ? "الوزن الخالص" : "Fine weight"}</p><p className="font-bold">{pool.fineWeight} g</p></div>
              <div><p className="text-[11px] text-muted">{rtl ? "الحالة / الاستلام" : "Status / received"}</p><p className="font-bold">{pool.status} · {pool.receivedAt}</p></div>
              <span className="rounded-full bg-surface-muted px-3 py-1 text-center text-xs font-bold">{pool.transferredToIGP ? (rtl ? "تم التحويل" : "Transferred") : (rtl ? "سجل تاريخي" : "Historical")}</span>
            </div>)}
          </div>
        )}
      </Card>
    </div>
  );
}
