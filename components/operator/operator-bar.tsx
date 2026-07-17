"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { LogOut, RefreshCw, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useLocale } from "next-intl";
import { DarfusApiError, OPERATOR_ACTION_REQUIRED_EVENT } from "@/lib/api/client";
import { useAuth } from "@/contexts/auth-context";
import { useOperator } from "@/contexts/operator-context";
import { cn } from "@/lib/utils";

type DialogMode = "verify" | "switch";

function formatCountdown(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function reasonMessage(reason?: string | null, rtl = false) {
  if (!reason || reason === "NOT_VERIFIED") return rtl ? "اختر موظفًا للبدء" : "Select an employee to begin";
  if (reason === "OPERATOR_SESSION_ENDED") return rtl ? "تم إنهاء جلسة الموظف" : "Employee session ended";
  if (reason.includes("EXPIRED") || reason.includes("TIMEOUT")) return rtl ? "انتهت جلسة الموظف، اختر موظفًا للمتابعة" : "Employee session expired. Select an employee to continue.";
  if (reason.includes("STALE") || reason.includes("REVOKED") || reason === "BRANCH_CHANGED") return rtl ? "انتهت صلاحية جلسة الموظف" : "Employee session expired";
  if (reason === "EMPLOYEE_BRANCH_ACCESS_DENIED" || reason === "OPERATOR_BRANCH_MISMATCH") return rtl ? "هذا الموظف غير مصرح له بهذا الفرع" : "Employee is not authorized for this branch";
  return rtl ? "اختر موظفًا للبدء" : "Select an employee to begin";
}

function verifyErrorMessage(error: unknown, rtl = false) {
  if (error instanceof DarfusApiError) {
    if (error.errorCode === "EMPLOYEE_BRANCH_ACCESS_DENIED") {
      return rtl ? "هذا الموظف غير مصرح له بهذا الفرع" : "Employee is not authorized for this branch";
    }
    if (error.errorCode?.includes("PERMISSION")) {
      return rtl ? "لا يملك الموظف الصلاحية المطلوبة" : "Employee does not have the required permission";
    }
  }
  return rtl ? "كود الموظف أو الرقم السري غير صحيح" : "Employee code or PIN is incorrect";
}

export function OperatorBar() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { activeBranchId, activeBranch } = useAuth();
  const operator = useOperator();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>("verify");
  const [employeeCode, setEmployeeCode] = useState("");
  const [pin, setPin] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [tick, setTick] = useState(Date.now());

  const employee = operator.state?.employee;
  const idleSeconds = operator.state?.idleExpiresAt ? Math.max(0, Math.floor((new Date(operator.state.idleExpiresAt).getTime() - tick) / 1000)) : 0;
  const activeLabel = employee?.name || employee?.employeeCode || (rtl ? "موظف" : "Employee");
  const statusText = operator.active
    ? `${rtl ? "الموظف الحالي" : "Current Employee"}: ${activeLabel}`
    : reasonMessage(operator.reason || operator.state?.reason, rtl);

  const clearSensitiveOperatorFormState = useCallback(() => {
    setPin("");
    setFormError(null);
  }, []);

  const resetOperatorDialogState = useCallback(() => {
    clearSensitiveOperatorFormState();
    setEmployeeCode("");
    setMode("verify");
    setOpen(false);
  }, [clearSensitiveOperatorFormState]);

  const openDialog = useCallback((nextMode: DialogMode) => {
    clearSensitiveOperatorFormState();
    setMode(nextMode);
    if (nextMode === "verify") setEmployeeCode("");
    setOpen(true);
  }, [clearSensitiveOperatorFormState]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOperatorActionRequired = (event: Event) => {
      const detail = (event as CustomEvent<{ errorCode?: string }>).detail;
      setFormError(reasonMessage(detail?.errorCode || operator.reason || operator.state?.reason, rtl));
      openDialog("verify");
      void operator.refresh();
    };
    window.addEventListener(OPERATOR_ACTION_REQUIRED_EVENT, handleOperatorActionRequired);
    return () => window.removeEventListener(OPERATOR_ACTION_REQUIRED_EVENT, handleOperatorActionRequired);
  }, [openDialog, operator, rtl]);

  useEffect(() => {
    if (!operator.active) clearSensitiveOperatorFormState();
  }, [clearSensitiveOperatorFormState, operator.active, operator.reason, operator.state?.state]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    try {
      await operator.verify({ employeeCode, pin, branchId: activeBranchId || "" });
      resetOperatorDialogState();
    } catch (error) {
      setFormError(verifyErrorMessage(error, rtl));
    } finally {
      setPin("");
    }
  };

  const endOperatorSession = async () => {
    try {
      await operator.endSession("operator_session_ended");
    } finally {
      resetOperatorDialogState();
    }
  };

  const toggleStatusPanel = () => {
    if (open) resetOperatorDialogState();
    else setOpen(true);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleStatusPanel}
        className={cn(
          "flex h-10 max-w-[300px] items-center gap-2 rounded-2xl border bg-panel px-3 text-xs font-black shadow-sm transition hover:border-brand-500",
          operator.active
            ? "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
            : "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300",
        )}
        aria-label={rtl ? "حالة الموظف الحالي" : "Current Employee status"}
      >
        {operator.active ? <UserRoundCheck className="h-4 w-4 shrink-0" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
        <span className="hidden min-w-0 truncate md:inline">{statusText}</span>
        {operator.active && <span className="font-mono text-[10px]">{formatCountdown(idleSeconds)}</span>}
      </button>

      {open && (
        <div className="absolute end-0 top-[calc(100%+10px)] z-50 w-[min(92vw,380px)] rounded-2xl border border-border bg-panel p-4 text-xs shadow-float">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-black text-foreground">
                {operator.active ? (rtl ? "الموظف الحالي" : "Current Employee") : (rtl ? "اختر موظفًا للبدء" : "Select an employee to begin")}
              </p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                {operator.active
                  ? `${employee?.employeeCode || "—"} · ${employee?.name || "—"} · ${activeBranch || activeBranchId || "—"}`
                  : reasonMessage(operator.reason || operator.state?.reason, rtl)}
              </p>
            </div>
            <button type="button" onClick={() => operator.refresh()} className="rounded-xl border border-border p-2" aria-label="Refresh operator">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {operator.active && (
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-2xl bg-background p-3 text-[11px]">
              <span>{rtl ? "كود الموظف" : "Employee Code"}</span>
              <strong>{employee?.employeeCode || "—"}</strong>
              <span>{rtl ? "انتهاء الخمول" : "Inactivity expiry"}</span>
              <strong>{formatCountdown(idleSeconds)}</strong>
            </div>
          )}

          <form onSubmit={submit} className="mt-4 space-y-3">
            <input
              value={employeeCode}
              onChange={(event) => setEmployeeCode(event.target.value)}
              placeholder={rtl ? "كود الموظف" : "Employee Code"}
              className="input-base"
              autoComplete="off"
              required
            />
            <input
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={rtl ? "الرقم السري" : "PIN"}
              type="password"
              inputMode="numeric"
              pattern="[0-9]{6}"
              className="input-base"
              autoComplete="new-password"
              required
            />
            {formError && <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{formError}</p>}
            <button disabled={operator.loading || !activeBranchId} className="w-full rounded-2xl bg-brand-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50" type="submit">
              {mode === "switch" ? (rtl ? "تغيير الموظف" : "Change Employee") : (rtl ? "تحقق" : "Verify")}
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {operator.active ? (
              <>
                <button type="button" onClick={() => openDialog("switch")} className="rounded-xl border border-border px-3 py-2 font-bold">{rtl ? "تغيير الموظف" : "Change Employee"}</button>
                <button type="button" onClick={() => void endOperatorSession()} className="inline-flex items-center gap-1 rounded-xl border border-amber-300 px-3 py-2 font-bold text-amber-700">
                  <LogOut className="h-3.5 w-3.5" /> {rtl ? "إنهاء جلسة الموظف" : "End Employee Session"}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => openDialog("verify")} className="rounded-xl border border-border px-3 py-2 font-bold">{rtl ? "اختر موظفًا للبدء" : "Select an employee to begin"}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
