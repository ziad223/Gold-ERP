"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { apiClient } from "@/lib/api/client";

type ReportResponse = { success: true; data: Record<string, any> };
const today = () => new Date().toISOString().slice(0, 10);

export default function FinancialStatementsPage() {
  const ar = useLocale() === "ar";
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(today());
  const [income, setIncome] = useState<Record<string, any> | null>(null);
  const [balance, setBalance] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [incomeResult, balanceResult] = await Promise.all([
        apiClient<ReportResponse>(`/reports/income-statement?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
        apiClient<ReportResponse>(`/reports/balance-sheet?asOf=${encodeURIComponent(to)}`),
      ]);
      setIncome(incomeResult.data);
      setBalance(balanceResult.data);
    } catch (error: any) {
      toast.error(error?.message || (ar ? "تعذر تحميل القوائم المالية" : "Unable to load financial statements"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "القوائم المالية" : "Financial Statements"}
        description={ar ? "قائمة الدخل والميزانية العمومية من القيود المرحلة فقط." : "Income statement and balance sheet derived only from posted ledger lines."}
      />
      <Card className="flex flex-wrap items-end gap-3 p-5">
        <label className="space-y-1 text-sm"><span>{ar ? "من" : "From"}</span><input className="block rounded-xl border bg-background px-3 py-2" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="space-y-1 text-sm"><span>{ar ? "إلى / كما في" : "To / as of"}</span><input className="block rounded-xl border bg-background px-3 py-2" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <Button onClick={load} disabled={loading}>{loading ? "…" : (ar ? "عرض" : "Run reports")}</Button>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">{ar ? "قائمة الدخل" : "Income statement"}</h2>
          {income ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt>{ar ? "الإيرادات" : "Revenue"}</dt><dd>{Number(income.revenue?.total || 0).toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt>{ar ? "تكلفة المبيعات" : "Cost of goods sold"}</dt><dd>{Number(income.costOfGoodsSold?.total || 0).toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt>{ar ? "المصروفات التشغيلية" : "Operating expenses"}</dt><dd>{Number(income.operatingExpenses?.total || 0).toFixed(2)}</dd></div>
              <div className="flex justify-between border-t pt-3 font-bold"><dt>{ar ? "صافي الدخل" : "Net income"}</dt><dd>{Number(income.netIncome || 0).toFixed(2)}</dd></div>
            </dl>
          ) : <p className="text-sm text-muted-foreground">{ar ? "اختر الفترة ثم اعرض التقرير." : "Choose a period and run the report."}</p>}
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">{ar ? "الميزانية العمومية" : "Balance sheet"}</h2>
          {balance ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt>{ar ? "الأصول" : "Assets"}</dt><dd>{Number(balance.assets?.total || 0).toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt>{ar ? "الخصوم" : "Liabilities"}</dt><dd>{Number(balance.liabilities?.total || 0).toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt>{ar ? "حقوق الملكية" : "Equity"}</dt><dd>{Number(balance.equity?.total || 0).toFixed(2)}</dd></div>
              <div className="flex justify-between border-t pt-3 font-bold"><dt>{ar ? "فرق المعادلة" : "Equation difference"}</dt><dd>{Number(balance.difference || 0).toFixed(2)}</dd></div>
            </dl>
          ) : <p className="text-sm text-muted-foreground">{ar ? "اختر التاريخ ثم اعرض التقرير." : "Choose an as-of date and run the report."}</p>}
        </Card>
      </div>
    </div>
  );
}
