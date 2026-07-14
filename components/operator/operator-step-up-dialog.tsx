"use client";

import { FormEvent, useState } from "react";
import { useOperator } from "@/contexts/operator-context";

export function OperatorStepUpDialog({ requiredPermission, requestedOperation, triggerLabel = "Authorize" }: { requiredPermission?: string; requestedOperation?: string; triggerLabel?: string }) {
  const operator = useOperator();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await operator.authorizeAction({ pin, requiredPermission, requestedOperation });
    setPin("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="rounded-2xl border border-border px-3 py-2 text-xs font-bold">
        {triggerLabel}
      </button>
      {open && (
        <form onSubmit={submit} className="absolute end-0 top-[calc(100%+8px)] z-50 w-72 rounded-3xl border border-border bg-panel p-4 shadow-float">
          <p className="text-xs font-black">Level 2 authorization</p>
          <input value={pin} onChange={(event) => setPin(event.target.value)} placeholder="PIN" type="password" inputMode="numeric" pattern="[0-9]{6}" className="input-base mt-3" required />
          <button disabled={operator.loading || !operator.active} className="mt-3 w-full rounded-2xl bg-brand-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50" type="submit">
            Confirm
          </button>
        </form>
      )}
    </div>
  );
}
