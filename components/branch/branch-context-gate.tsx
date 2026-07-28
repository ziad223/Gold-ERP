"use client";

import { useBranchContext } from "@/contexts/branch-context";

/** Keeps operational pages from mounting while the active Branch is unverified. */
export function BranchContextGate({ children }: { children: React.ReactNode }) {
  const { status, isReady } = useBranchContext();
  if (isReady) return <>{children}</>;

  const copy = status === "SETUP_REQUIRED"
    ? "Branch setup is required before operational work can start."
    : status === "SELECTION_REQUIRED"
      ? "Select an active Branch to continue."
      : status === "ERROR"
        ? "Branch readiness could not be loaded."
        : status === "INVALID"
          ? "The active Branch is no longer available. Select another Branch."
          : "Validating Branch readiness…";

  return (
    <section className="grid min-h-[50vh] place-items-center" data-branch-context-gate="true" data-branch-status={status}>
      <div className="w-full max-w-lg rounded-3xl border border-border bg-panel p-6 shadow-float">
        <h1 className="text-xl font-black text-foreground">Branch readiness required</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
      </div>
    </section>
  );
}
