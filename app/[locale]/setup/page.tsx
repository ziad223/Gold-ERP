"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { apiClient, DarfusApiError, generateUUID } from "@/lib/api/client";
import { useRouter } from "@/i18n/navigation";

type SetupState = "UNINITIALIZED" | "SETUP_REQUIRED" | "SETUP_IN_PROGRESS" | "READY" | "RECOVERY_REQUIRED" | "CONFIGURATION_CONFLICT";
type SetupStatus = { success: boolean; data: { state: SetupState; action: "SETUP" | "LOGIN" | "WAIT" | "CONTACT_ADMIN" } };

const initialForm = { token: "", firstName: "", lastName: "", email: "", password: "", passwordConfirmation: "", companyName: "", workspace: "", branchName: "", branchCode: "", currency: "AED" };

export default function SetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SetupState | null>(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const idempotencyKey = useRef(generateUUID());

  useEffect(() => {
    let current = true;
    void apiClient<SetupStatus>("/setup/status", { companyScope: "none", skipBranch: true })
      .then((response) => { if (current) setStatus(response.data.state); })
      .catch(() => { if (current) setError("Setup status is unavailable. Retry when the server is reachable."); });
    return () => { current = false; };
  }, []);

  const update = (key: keyof typeof initialForm, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      const { token, ...body } = form;
      await apiClient("/setup/bootstrap", {
        method: "POST", companyScope: "none", skipBranch: true, idempotencyKey: idempotencyKey.current,
        headers: { "X-First-Run-Setup-Token": token }, body: JSON.stringify(body)
      });
      setForm(initialForm); // Never retain the setup token or password after submit.
      setComplete(true);
      setStatus("READY");
    } catch (caught) {
      if (caught instanceof DarfusApiError && caught.isValidationError && caught.errors) {
        setFieldErrors(caught.errors);
        setError("Please correct the highlighted fields.");
      } else {
        setError(caught instanceof DarfusApiError ? "Setup could not be completed. Review the form and authorization, then retry." : "Setup could not be completed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "READY" || complete) {
    return <SetupNotice title="Setup complete" detail="The first workspace is ready. Sign in with the account you just created." action="Go to login" onClick={() => router.replace("/login")} success />;
  }
  if (status === "RECOVERY_REQUIRED" || status === "CONFIGURATION_CONFLICT") {
    return <SetupNotice title="Setup requires administrator recovery" detail="This installation contains partial or conflicting configuration. Bootstrap is intentionally disabled until it is recovered through the approved administrator process." />;
  }
  if (status !== "SETUP_REQUIRED") {
    return <main className="grid min-h-screen place-items-center bg-background p-6"><div className="flex items-center gap-3 rounded-2xl border border-border bg-panel px-5 py-4 text-sm font-bold"><LoaderCircle className="h-5 w-5 animate-spin" /> Preparing setup…</div></main>;
  }

  return <main className="min-h-screen bg-slate-50 p-4 py-8 dark:bg-navy-950 sm:p-8">
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-navy-900 sm:p-8" aria-labelledby="first-run-title">
      <div className="flex gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-700 text-white"><ShieldCheck className="h-6 w-6" /></div><div><h1 id="first-run-title" className="text-2xl font-black text-navy-950 dark:text-white">First-time setup</h1><p className="mt-1 text-sm text-muted">Create the first privileged administrator, Company, Branch, and required financial readiness in one protected operation.</p></div></div>
      {error ? <div role="alert" className="mt-6 flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div> : null}
      <fieldset disabled={submitting} className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field label="Setup authorization" type="password" value={form.token} onChange={(value) => update("token", value)} autoComplete="off" required className="sm:col-span-2" errors={fieldErrors.token} />
        <Field label="First name" value={form.firstName} onChange={(value) => update("firstName", value)} autoComplete="given-name" required errors={fieldErrors.firstName} />
        <Field label="Last name" value={form.lastName} onChange={(value) => update("lastName", value)} autoComplete="family-name" required errors={fieldErrors.lastName} />
        <Field label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} autoComplete="email" required errors={fieldErrors.email} />
        <Field label="Company name" value={form.companyName} onChange={(value) => update("companyName", value)} required errors={fieldErrors.companyName} />
        <Field label="Password" type="password" value={form.password} onChange={(value) => update("password", value)} autoComplete="new-password" required errors={fieldErrors.password} />
        <Field label="Confirm password" type="password" value={form.passwordConfirmation} onChange={(value) => update("passwordConfirmation", value)} autoComplete="new-password" required errors={fieldErrors.passwordConfirmation} />
        <Field label="Workspace" value={form.workspace} onChange={(value) => update("workspace", value)} required errors={fieldErrors.workspace} />
        <Field label="First Branch" value={form.branchName} onChange={(value) => update("branchName", value)} required errors={fieldErrors.branchName} />
        <Field label="Branch code" value={form.branchCode} onChange={(value) => update("branchCode", value)} required errors={fieldErrors.branchCode} />
        <Field label="Currency" value={form.currency} onChange={(value) => update("currency", value)} required errors={fieldErrors.currency} />
      </fieldset>
      <button type="submit" disabled={submitting} className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-60">{submitting ? "Creating protected workspace…" : "Create first workspace"}</button>
      <p className="mt-4 text-xs text-muted">The setup authorization and password stay in this page only and are never stored in the browser.</p>
    </form>
  </main>;
}

function Field({ label, value, onChange, type = "text", required, autoComplete, className = "", errors }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; autoComplete?: string; className?: string; errors?: string[] }) {
  const id = `setup-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  return <label className={`block ${className}`}><span className="label-base">{label}</span><input id={id} aria-invalid={errors?.length ? true : undefined} aria-describedby={errors?.length ? `${id}-error` : undefined} className="input-base mt-1 w-full" type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required={required} />{errors?.length ? <span id={`${id}-error`} role="alert" className="mt-1 block text-xs text-rose-700">{errors.join(" ")}</span> : null}</label>;
}

function SetupNotice({ title, detail, action, onClick, success = false }: { title: string; detail: string; action?: string; onClick?: () => void; success?: boolean }) {
  return <main className="grid min-h-screen place-items-center bg-background p-6"><section className="max-w-lg rounded-3xl border border-border bg-panel p-8 text-center shadow-soft"><CheckCircle2 className={`mx-auto h-10 w-10 ${success ? "text-emerald-600" : "text-amber-600"}`} /><h1 className="mt-4 text-xl font-black">{title}</h1><p className="mt-3 text-sm leading-6 text-muted">{detail}</p>{action && onClick ? <button onClick={onClick} className="mt-6 rounded-xl bg-brand-700 px-4 py-2 font-bold text-white">{action}</button> : null}</section></main>;
}
