"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useOperator } from "@/contexts/operator-context";

export function OperatorVerifyDialog() {
  const { activeBranchId } = useAuth();
  const operator = useOperator();
  const [employeeCode, setEmployeeCode] = useState("");
  const [pin, setPin] = useState("");
  const [open, setOpen] = useState(false);

  const clearSensitiveOperatorFormState = useCallback(() => setPin(""), []);

  const closeDialog = useCallback(() => {
    clearSensitiveOperatorFormState();
    setEmployeeCode("");
    setOpen(false);
  }, [clearSensitiveOperatorFormState]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await operator.verify({ employeeCode, pin, branchId: activeBranchId || "" });
      closeDialog();
    } finally {
      clearSensitiveOperatorFormState();
    }
  };

  useEffect(() => {
    if (operator.active) closeDialog();
  }, [closeDialog, operator.active]);

  if (operator.active) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (open) closeDialog();
          else {
            clearSensitiveOperatorFormState();
            setOpen(true);
          }
        }}
        className="hidden h-10 rounded-2xl border border-border bg-panel px-3 text-xs font-bold text-muted-foreground hover:border-brand-500 hover:text-brand-700 md:block"
      >
        Operator
      </button>
      {open && (
        <form onSubmit={submit} className="absolute end-0 top-[calc(100%+10px)] z-50 w-72 rounded-3xl border border-border bg-panel p-4 shadow-float">
          <p className="text-xs font-black text-foreground">Operator verification</p>
          <input value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} placeholder="Employee Code" className="input-base mt-3" required />
          <input value={pin} onChange={(event) => setPin(event.target.value)} placeholder="PIN" type="password" inputMode="numeric" pattern="[0-9]{6}" className="input-base mt-3" required />
          <button disabled={operator.loading || !activeBranchId} className="mt-3 w-full rounded-2xl bg-brand-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50" type="submit">
            Verify
          </button>
        </form>
      )}
    </div>
  );
}
