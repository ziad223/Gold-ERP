"use client";

import { LockKeyhole } from "lucide-react";
import { useOperator } from "@/contexts/operator-context";

export function OperatorLockButton() {
  const operator = useOperator();
  if (!operator.active) return null;
  return (
    <button
      type="button"
      onClick={() => void operator.lock("manual_lock")}
      className="hidden h-10 items-center gap-2 rounded-2xl border border-border bg-panel px-3 text-xs font-bold text-muted-foreground hover:border-amber-500 hover:text-amber-700 md:flex"
      title="Lock operator session"
    >
      <LockKeyhole className="h-4 w-4" />
      <span>{operator.state?.employee?.employeeCode || "Operator"}</span>
    </button>
  );
}
