"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, LogIn, LogOut, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/contexts/auth-context";
import { usePayroll } from "@/hooks/use-payroll";
import { apiClient } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";

const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function PayrollPage() {
  const t = useTranslations("Payroll");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { company } = useAuth();
  const currency = company?.currency ?? "AED";
  const money = (v: number | string) => formatCurrency(Number(v), currency, locale);

  const [period, setPeriod] = useState(thisMonth());
  const { payslips, attendance, loading, generatePayroll, payPayslip, checkIn, checkOut } = usePayroll(period);

  const [genBusy, setGenBusy] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  // Phase 21.5 — stable Idempotency-Key per payslip. Generated on the first pay
  // attempt, reused on retry (kept on failure), cleared on success so a later
  // payment gets a fresh key.
  const idemKeysRef = useRef<Record<string, string>>({});
  const newIdemKey = () => {
    try {
      return window.crypto.randomUUID();
    } catch {
      return `IDEM-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
  };
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [attBusy, setAttBusy] = useState(false);

  useEffect(() => {
    apiClient<{ items: { id: string; name: string }[] }>("/employees?pageSize=100", { locale })
      .then((r) => {
        setEmployees(r.items ?? []);
        if (r.items?.length) setSelectedEmp(r.items[0].id);
      })
      .catch(() => {});
  }, [locale]);

  const statusTone: Record<string, "green" | "amber" | "blue"> = { paid: "green", draft: "amber", approved: "blue" };
  const attTone: Record<string, "green" | "rose" | "amber" | "blue"> = { present: "green", absent: "rose", leave: "amber", late: "amber", holiday: "blue" };

  const handleGenerate = async () => {
    setGenBusy(true);
    try { await generatePayroll(); } finally { setGenBusy(false); }
  };

  const handlePay = async (id: string) => {
    setPayingId(id);
    // Reuse the same key across retries of THIS payslip (replay, not double-pay).
    if (!idemKeysRef.current[id]) idemKeysRef.current[id] = newIdemKey();
    try {
      await payPayslip(id, "Bank", idemKeysRef.current[id]);
      delete idemKeysRef.current[id]; // success → a later payment gets a fresh key
    } finally { setPayingId(null); }
  };

  const handleAtt = async (fn: (id: string) => Promise<unknown>) => {
    if (!selectedEmp) return;
    setAttBusy(true);
    try { await fn(selectedEmp); } catch { /* surfaced by hook */ } finally { setAttBusy(false); }
  };

  const totalNet = payslips.reduce((s, p) => s + Number(p.net), 0);
  const paidNet = payslips.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.net), 0);

  if (loading && payslips.length === 0 && attendance.length === 0) {
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
          <div className="flex flex-wrap items-center gap-2">
            <input type="month" className="input-base w-40" value={period} onChange={(e) => setPeriod(e.target.value || thisMonth())} />
            <Button disabled={genBusy} onClick={handleGenerate}><Wallet className="h-4 w-4" />{t("generate")}</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-semibold text-muted">{t("totalPayroll")} — {period}</p>
          <p className="mt-2 text-2xl font-black text-foreground">{money(totalNet)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-muted">{t("paidSoFar")}</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{money(paidNet)}</p>
        </Card>
      </div>

      {/* Attendance */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <span className="flex items-center gap-2 font-black"><CalendarClock className="h-4 w-4 text-brand-600" />{t("attendanceToday")}</span>
          <div className="flex items-center gap-2">
            <NativeSelect className="w-48" value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </NativeSelect>
            <Button size="sm" variant="secondary" disabled={attBusy} onClick={() => handleAtt(checkIn)}><LogIn className="h-3.5 w-3.5" />{t("checkIn")}</Button>
            <Button size="sm" variant="secondary" disabled={attBusy} onClick={() => handleAtt(checkOut)}><LogOut className="h-3.5 w-3.5" />{t("checkOut")}</Button>
          </div>
        </div>
        {attendance.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-start text-xs">
              <thead className="bg-table-header text-muted">
                <tr>
                  <th className="px-5 py-4">{t("employee")}</th>
                  <th className="px-5 py-4">{t("date")}</th>
                  <th className="px-5 py-4">{t("checkInTime")}</th>
                  <th className="px-5 py-4">{t("checkOutTime")}</th>
                  <th className="px-5 py-4">{t("hours")}</th>
                  <th className="px-5 py-4">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-table-row-hover">
                    <td className="px-5 py-4 font-bold">{a.employeeName || a.employeeId}</td>
                    <td className="px-5 py-4 text-muted">{a.date}</td>
                    <td className="px-5 py-4">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td className="px-5 py-4">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td className="px-5 py-4 font-bold">{Number(a.hours)}</td>
                    <td className="px-5 py-4"><Badge tone={attTone[a.status] ?? "blue"}>{t(`att_${a.status}`)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={common("noResults")} description={t("noAttendance")} />
        )}
      </Card>

      {/* Payslips */}
      <Card className="overflow-hidden">
        <div className="border-b border-border p-5 font-black">{t("payslips")} — {period}</div>
        {payslips.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-start text-xs">
              <thead className="bg-table-header text-muted">
                <tr>
                  <th className="px-5 py-4">{t("employee")}</th>
                  <th className="px-5 py-4">{t("baseSalary")}</th>
                  <th className="px-5 py-4">{t("allowances")}</th>
                  <th className="px-5 py-4">{t("deductions")}</th>
                  <th className="px-5 py-4">{t("net")}</th>
                  <th className="px-5 py-4">{t("status")}</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payslips.map((p) => (
                  <tr key={p.id} className="hover:bg-table-row-hover">
                    <td className="px-5 py-4 font-bold">{p.employeeName || p.employeeId}</td>
                    <td className="px-5 py-4">{money(p.baseSalary)}</td>
                    <td className="px-5 py-4">{money(p.allowances)}</td>
                    <td className="px-5 py-4">{money(p.deductions)}</td>
                    <td className="px-5 py-4 font-black">{money(p.net)}</td>
                    <td className="px-5 py-4"><Badge tone={statusTone[p.status] ?? "amber"}>{t(`ps_${p.status}`)}</Badge></td>
                    <td className="px-5 py-4 text-end">
                      {p.status !== "paid" && (
                        <Button size="sm" disabled={payingId === p.id} onClick={() => handlePay(p.id)}>
                          {payingId === p.id ? common("loading") : t("pay")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={common("noResults")} description={t("noPayslips")} />
        )}
      </Card>
    </div>
  );
}
