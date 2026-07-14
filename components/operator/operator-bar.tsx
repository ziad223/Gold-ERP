"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { LockKeyhole, RefreshCw, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useLocale } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { useOperator } from "@/contexts/operator-context";
import { OPERATOR_ACTION_REQUIRED_EVENT } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type DialogMode = "verify" | "switch" | "step-up";

function secondsUntil(value?: string | null) {
  if (!value) return 0;
  return Math.max(0, Math.floor((new Date(value).getTime() - Date.now()) / 1000));
}

function formatCountdown(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function safeReason(reason?: string | null, rtl = false) {
  if (!reason || reason === "NOT_VERIFIED") return rtl ? "لا يوجد مشغل نشط" : "No active operator";
  if (reason === "BRANCH_CHANGED") return rtl ? "تغير الفرع — يلزم التحقق" : "Branch changed — verify again";
  if (reason.includes("LOCKED")) return rtl ? "جلسة المشغل مقفلة" : "Operator session locked";
  if (reason.includes("EXPIRED") || reason.includes("TIMEOUT")) return rtl ? "انتهت جلسة المشغل" : "Operator session expired";
  if (reason.includes("STALE")) return rtl ? "يلزم تحديث التحقق" : "Verification refresh required";
  return rtl ? "يلزم التحقق من الموظف" : "Employee verification required";
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
  const [tick, setTick] = useState(Date.now());

  const clearSensitiveOperatorFormState = useCallback(() => {
    setPin("");
  }, []);

  const resetOperatorDialogState = useCallback(() => {
    clearSensitiveOperatorFormState();
    setEmployeeCode("");
    setMode("verify");
    setOpen(false);
  }, [clearSensitiveOperatorFormState]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const idleSeconds = secondsUntil(operator.state?.idleExpiresAt);
  const absoluteSeconds = secondsUntil(operator.state?.absoluteExpiresAt);
  const level2Seconds = operator.state?.level2VerifiedAt
    ? Math.max(0, Math.floor((new Date(operator.state.level2VerifiedAt).getTime() + 5 * 60 * 1000 - tick) / 1000))
    : 0;
  const level = level2Seconds > 0 && Number(operator.state?.verificationLevel || 0) >= 2 ? 2 : operator.active ? 1 : 0;
  const employee = operator.state?.employee;
  const activeLabel = employee?.employeeCode || employee?.name || (rtl ? "مشغل" : "Operator");
  const statusText = operator.active
    ? `${activeLabel} · L${level}`
    : safeReason(operator.reason || operator.state?.reason, rtl);

  const tone = operator.active ? (level >= 2 ? "emerald" : "blue") : "amber";

  const title = useMemo(() => {
    if (mode === "switch") return rtl ? "تبديل الموظف" : "Switch employee";
    if (mode === "step-up") return rtl ? "تفويض المستوى الثاني" : "Level 2 step-up";
    return rtl ? "تحقق من الموظف" : "Verify employee";
  }, [mode, rtl]);

  const openDialog = useCallback((nextMode: DialogMode) => {
    clearSensitiveOperatorFormState();
    setMode(nextMode);
    if (nextMode !== "switch") setEmployeeCode("");
    setOpen(true);
  }, [clearSensitiveOperatorFormState]);

  useEffect(() => {
    const handleOperatorActionRequired = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: DialogMode }>).detail;
      openDialog(detail?.mode === "step-up" ? "step-up" : "verify");
      void operator.refresh();
    };
    window.addEventListener(OPERATOR_ACTION_REQUIRED_EVENT, handleOperatorActionRequired);
    return () => window.removeEventListener(OPERATOR_ACTION_REQUIRED_EVENT, handleOperatorActionRequired);
  }, [openDialog, operator]);

  const toggleStatusPanel = () => {
    if (open) resetOperatorDialogState();
    else setOpen(true);
  };

  useEffect(() => {
    const inactive = !operator.active || operator.state?.state === "locked" || operator.state?.state === "inactive";
    if (inactive && mode !== "verify") resetOperatorDialogState();
    if (inactive) clearSensitiveOperatorFormState();
  }, [mode, operator.active, operator.state?.state, operator.reason, resetOperatorDialogState, clearSensitiveOperatorFormState]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "step-up") {
        await operator.authorizeAction({ pin, requestedOperation: "operator-step-up" });
      } else {
        await operator.verify({ employeeCode, pin, branchId: activeBranchId || "", requestedLevel: mode === "verify" ? 1 : 1 });
      }
      resetOperatorDialogState();
    } finally {
      clearSensitiveOperatorFormState();
    }
  };

  const lockOperator = async () => {
    try {
      await operator.lock("manual_lock");
    } finally {
      resetOperatorDialogState();
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleStatusPanel}
        className={cn(
          "flex h-10 max-w-[220px] items-center gap-2 rounded-2xl border bg-panel px-3 text-xs font-black shadow-sm transition hover:border-brand-500",
          tone === "emerald" && "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300",
          tone === "blue" && "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300",
          tone === "amber" && "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300",
        )}
        aria-label={rtl ? "حالة المشغل" : "Operator status"}
      >
        {operator.active ? <UserRoundCheck className="h-4 w-4 shrink-0" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
        <span className="hidden truncate md:inline">{statusText}</span>
        {operator.active && <span className="font-mono text-[10px]">{formatCountdown(idleSeconds)}</span>}
      </button>

      {open && (
        <div className="absolute end-0 top-[calc(100%+10px)] z-50 w-[min(92vw,360px)] rounded-3xl border border-border bg-panel p-4 text-xs shadow-float">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-foreground">{title}</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                {operator.active
                  ? `${employee?.employeeCode || "—"} · ${employee?.name || "—"} · ${activeBranch || activeBranchId || "—"}`
                  : (rtl ? "الحساب التقني مسجل، لكن يلزم تحقق الموظف للعمليات المستقبلية." : "Technical account is signed in; employee verification is required for future protected operations.")}
              </p>
            </div>
            <button type="button" onClick={() => operator.refresh()} className="rounded-xl border border-border p-2" aria-label="Refresh operator">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {operator.active && (
            <div className="mt-3 grid gap-2 rounded-2xl bg-background p-3 text-[11px]">
              <div className="flex justify-between"><span>{rtl ? "المستوى" : "Level"}</span><strong>L{level}</strong></div>
              <div className="flex justify-between"><span>{rtl ? "انتهاء الخمول" : "Idle expiry"}</span><strong>{formatCountdown(idleSeconds)}</strong></div>
              <div className="flex justify-between"><span>{rtl ? "الانتهاء المطلق" : "Absolute expiry"}</span><strong>{formatCountdown(absoluteSeconds)}</strong></div>
              {level >= 2 && <div className="flex justify-between"><span>{rtl ? "صلاحية L2" : "L2 freshness"}</span><strong>{formatCountdown(level2Seconds)}</strong></div>}
            </div>
          )}

          <form onSubmit={submit} className="mt-4 space-y-3">
            {mode !== "step-up" && (
              <input
                value={employeeCode}
                onChange={(event) => setEmployeeCode(event.target.value)}
                placeholder={rtl ? "كود الموظف" : "Employee Code"}
                className="input-base"
                autoComplete="off"
                required
              />
            )}
            <input
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="PIN"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{6}"
              className="input-base"
              autoComplete="new-password"
              required
            />
            <button disabled={operator.loading || !activeBranchId} className="w-full rounded-2xl bg-brand-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50" type="submit">
              {mode === "switch" ? (rtl ? "تبديل" : "Switch") : mode === "step-up" ? (rtl ? "تفويض" : "Authorize") : (rtl ? "تحقق" : "Verify")}
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {operator.active ? (
              <>
                <button type="button" onClick={() => openDialog("switch")} className="rounded-xl border border-border px-3 py-2 font-bold">{rtl ? "تبديل" : "Switch"}</button>
                <button type="button" onClick={() => openDialog("step-up")} className="rounded-xl border border-border px-3 py-2 font-bold">{rtl ? "مستوى 2" : "Step-up"}</button>
                <button type="button" onClick={() => void lockOperator()} className="inline-flex items-center gap-1 rounded-xl border border-amber-300 px-3 py-2 font-bold text-amber-700">
                  <LockKeyhole className="h-3.5 w-3.5" /> {rtl ? "قفل" : "Lock"}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => openDialog("verify")} className="rounded-xl border border-border px-3 py-2 font-bold">{rtl ? "تحقق" : "Verify"}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
