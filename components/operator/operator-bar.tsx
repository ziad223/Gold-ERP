"use client";

import { useEffect, useState } from "react";
import { LogOut, RefreshCw, UserRoundCheck } from "lucide-react";
import { useLocale } from "next-intl";
import { OPERATOR_ACTION_REQUIRED_EVENT } from "@/lib/api/client";
import { useAuth } from "@/contexts/auth-context";
import { useOperator } from "@/contexts/operator-context";
import { EmployeeVerificationForm } from "@/components/operator/employee-verification-form";

function formatCountdown(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function OperatorBar() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { activeBranchId, activeBranch } = useAuth();
  const operator = useOperator();
  const [open, setOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const employee = operator.state?.employee;
  const idleSeconds = operator.state?.idleExpiresAt ? Math.max(0, Math.floor((new Date(operator.state.idleExpiresAt).getTime() - tick) / 1000)) : 0;
  const activeLabel = employee?.name || employee?.employeeCode || (rtl ? "موظف" : "Employee");

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOperatorActionRequired = () => {
      setChangeOpen(false);
      setOpen(false);
      void operator.refresh();
    };
    window.addEventListener(OPERATOR_ACTION_REQUIRED_EVENT, handleOperatorActionRequired);
    return () => window.removeEventListener(OPERATOR_ACTION_REQUIRED_EVENT, handleOperatorActionRequired);
  }, [operator]);

  if (!operator.active) return null;

  const endOperatorSession = async () => {
    await operator.endSession("operator_session_ended");
    setOpen(false);
    setChangeOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 max-w-[300px] items-center gap-2 rounded-2xl border border-emerald-300 bg-panel px-3 text-xs font-black text-emerald-700 shadow-sm transition hover:border-brand-500 dark:border-emerald-700 dark:text-emerald-300"
        aria-label={rtl ? "حالة الموظف الحالي" : "Current Employee status"}
      >
        <UserRoundCheck className="h-4 w-4 shrink-0" />
        <span className="hidden min-w-0 truncate md:inline">{rtl ? "الموظف الحالي" : "Current Employee"}: {activeLabel}</span>
        <span className="font-mono text-[10px]">{formatCountdown(idleSeconds)}</span>
      </button>

      {open && (
        <div className="absolute end-0 top-[calc(100%+10px)] z-50 w-[min(92vw,360px)] rounded-2xl border border-border bg-panel p-4 text-xs shadow-float">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-black text-foreground">{rtl ? "الموظف الحالي" : "Current Employee"}</p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{employee?.employeeCode || "—"} · {employee?.name || "—"} · {activeBranch || activeBranchId || "—"}</p>
            </div>
            <button type="button" onClick={() => void operator.refresh()} className="rounded-xl border border-border p-2" aria-label={rtl ? "تحديث" : "Refresh"}>
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-2xl bg-background p-3 text-[11px]">
            <span>{rtl ? "كود الموظف" : "Employee Code"}</span>
            <strong>{employee?.employeeCode || "—"}</strong>
            <span>{rtl ? "انتهاء الخمول" : "Inactivity expiry"}</span>
            <strong>{formatCountdown(idleSeconds)}</strong>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setOpen(false); setChangeOpen(true); }} className="rounded-xl border border-border px-3 py-2 font-bold">{rtl ? "تغيير الموظف" : "Change Employee"}</button>
            <button type="button" onClick={() => void endOperatorSession()} className="inline-flex items-center gap-1 rounded-xl border border-amber-300 px-3 py-2 font-bold text-amber-700">
              <LogOut className="h-3.5 w-3.5" /> {rtl ? "إنهاء جلسة الموظف" : "End Employee Session"}
            </button>
          </div>
        </div>
      )}

      {changeOpen && (
        <EmployeeVerificationForm presentation="dialog" onVerified={() => setChangeOpen(false)} onCancel={() => setChangeOpen(false)} />
      )}
    </div>
  );
}
