"use client";

import { useEffect, useRef } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { useCompanyContext } from "@/contexts/company-context";

/** Blocks scoped content only while the server-authoritative Company is unavailable. */
export function CompanyContextGate({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, status, messageKey, retryBootstrap } = useCompanyContext();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (isSuperAdmin && status !== "READY") headingRef.current?.focus();
  }, [isSuperAdmin, status]);

  if (!isSuperAdmin || status === "READY") return <>{children}</>;

  const isLoading = status === "UNRESOLVED" || status === "VALIDATING";
  const copy = status === "SETUP_REQUIRED"
    ? "Company setup is required before Company-scoped work can start."
    : status === "CONFIGURATION_CONFLICT"
      ? "Company configuration requires administrator attention. Company-scoped work remains blocked."
      : status === "ERROR"
        ? "Company readiness could not be loaded. Retry to continue."
        : status === "INVALID"
          ? "Company access changed. Validating the current Company configuration again."
          : "Validating Company readiness…";
  const title = status === "SETUP_REQUIRED"
    ? "Company setup required"
    : status === "CONFIGURATION_CONFLICT"
      ? "Company configuration required"
      : "Preparing workspace";

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4" data-company-context-gate="true" data-company-status={status}>
      <section className="w-full max-w-lg rounded-3xl border border-border bg-panel p-6 shadow-float sm:p-8" aria-labelledby="company-context-title">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"><Building2 className="h-6 w-6" /></div>
        <h1 ref={headingRef} id="company-context-title" tabIndex={-1} className="text-xl font-black text-foreground focus:outline-none">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted" data-company-message-key={messageKey || "company.loading"}>{copy}</p>
        {isLoading ? <p className="mt-6 text-sm font-semibold text-muted">Loading Company readiness…</p> : null}
        {status === "ERROR" || status === "INVALID" ? (
          <button onClick={() => void retryBootstrap()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        ) : null}
        {status === "SETUP_REQUIRED" ? <p className="mt-6 text-sm text-muted">Continue with the approved first-run setup process.</p> : null}
      </section>
    </main>
  );
}
