"use client";

import { FormEvent, useRef, useState } from "react";
import { X } from "lucide-react";
import { useLocale } from "next-intl";
import { DarfusApiError } from "@/lib/api/client";
import { useAuth } from "@/contexts/auth-context";
import { useOperator } from "@/contexts/operator-context";
import type { EmployeeAuthorizationSummary } from "@/lib/types";

type Presentation = "inline" | "dialog";

interface EmployeeVerificationFormProps {
  presentation: Presentation;
  onVerified?: (authorization: EmployeeAuthorizationSummary | null) => void;
  onCancel?: () => void;
}

function errorMessage(error: unknown, rtl: boolean) {
  if (error instanceof DarfusApiError && error.errorCode === "EMPLOYEE_BRANCH_ACCESS_DENIED") {
    return rtl ? "هذا الموظف غير مصرح له بهذا الفرع" : "Employee is not authorized for this branch";
  }
  return rtl ? "كود الموظف أو الرقم السري غير صحيح" : "Employee code or PIN is incorrect";
}

export function EmployeeVerificationForm({ presentation, onVerified, onCancel }: EmployeeVerificationFormProps) {
  const locale = useLocale();
  const rtl = locale === "ar";
  const { activeBranchId } = useAuth();
  const operator = useOperator();
  const codeInputRef = useRef<HTMLInputElement>(null);
  const [employeeCode, setEmployeeCode] = useState("");
  const [pin, setPin] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!/^\d{6}$/.test(pin)) {
      setFormError(rtl ? "كود الموظف أو الرقم السري غير صحيح" : "Employee code or PIN is incorrect");
      return;
    }

    try {
      const authorization = await operator.verify({ employeeCode, pin, branchId: activeBranchId || "" });
      setPin("");
      onVerified?.(authorization);
    } catch (error) {
      setPin("");
      setFormError(errorMessage(error, rtl));
      codeInputRef.current?.focus();
    }
  };

  const form = (
    <form onSubmit={submit} className="space-y-3" data-employee-verification-form={presentation}>
      <label className="block text-start">
        <span className="label-base">{rtl ? "كود الموظف" : "Employee Code"}</span>
        <input
          ref={codeInputRef}
          value={employeeCode}
          onChange={(event) => setEmployeeCode(event.target.value)}
          placeholder={rtl ? "كود الموظف" : "Employee Code"}
          className="input-base mt-1"
          autoComplete="off"
          autoFocus
          required
        />
      </label>
      <label className="block text-start">
        <span className="label-base">{rtl ? "الرقم السري" : "Six-digit PIN"}</span>
        <input
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder={rtl ? "الرقم السري" : "Six-digit PIN"}
          type="password"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          className="input-base mt-1"
          autoComplete="one-time-code"
          required
        />
      </label>
      {formError && <p className="rounded-xl bg-amber-50 px-3 py-2 text-start text-[11px] font-bold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{formError}</p>}
      <button disabled={operator.loading || !activeBranchId} className="w-full rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50" type="submit">
        {operator.loading ? (rtl ? "جارٍ التحقق" : "Verifying") : (rtl ? "تحقق من الموظف" : "Verify Employee")}
      </button>
    </form>
  );

  if (presentation === "inline") return form;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-navy-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={rtl ? "تغيير الموظف" : "Change Employee"}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-5 shadow-float sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-foreground">{rtl ? "تغيير الموظف" : "Change Employee"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{rtl ? "أدخل كود الموظف والرقم السري للمتابعة." : "Enter the Employee Code and PIN to continue."}</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground" aria-label={rtl ? "إغلاق" : "Close"}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {form}
      </div>
    </div>
  );
}
