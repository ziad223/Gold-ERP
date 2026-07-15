"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { Link } from "@/i18n/navigation";

export default function ResetPasswordPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tokenStatus, setTokenStatus] = useState<"unknown" | "valid" | "invalid" | "expired" | "used">("unknown");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const nextToken = new URLSearchParams(window.location.search).get("token") || "";
      setToken(nextToken);
      if (nextToken) {
        void apiClient<{ success: boolean; data: { valid: boolean; status: "valid" | "invalid" | "expired" | "used" } }>("/auth/validate-reset-token", {
          method: "POST",
          body: JSON.stringify({ token: nextToken }),
          skipBranch: true,
        }).then((res) => setTokenStatus(res.data.status)).catch(() => setTokenStatus("invalid"));
      }
    } catch {
      setToken("");
    }
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await apiClient("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword, confirmation }), skipBranch: true });
      setMessage(rtl ? "تم تغيير كلمة المرور. سجل الدخول من جديد." : "Password changed. Please log in again.");
      setToken("");
      setNewPassword("");
      setConfirmation("");
    } catch (err: any) {
      setError(err?.message || (rtl ? "تعذر تغيير كلمة المرور." : "Could not reset password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5 dark:bg-navy-950" dir={rtl ? "rtl" : "ltr"}>
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-navy-900">
        <h1 className="text-2xl font-black text-navy-950 dark:text-white">{rtl ? "إعادة تعيين كلمة المرور" : "Reset Password"}</h1>
        {tokenStatus !== "unknown" && (
          <p className={`mt-4 rounded border p-3 text-xs font-bold ${tokenStatus === "valid" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
            {tokenStatus === "valid"
              ? (rtl ? "رمز الاسترجاع صالح." : "Recovery token is valid.")
              : (rtl ? "رمز الاسترجاع غير صالح أو منتهي أو مستخدم." : "Recovery token is invalid, expired, or already used.")}
          </p>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="input-base" value={token} onChange={(event) => setToken(event.target.value)} placeholder={rtl ? "رمز الاسترجاع" : "Recovery token"} required />
          <input className="input-base" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder={rtl ? "كلمة المرور الجديدة" : "New password"} required />
          <input className="input-base" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={rtl ? "تأكيد كلمة المرور" : "Confirm password"} required />
          <Button className="w-full" disabled={loading}>{loading ? (rtl ? "جار الحفظ" : "Saving") : (rtl ? "تغيير كلمة المرور" : "Change password")}</Button>
        </form>
        {message && <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{message}</p>}
        {error && <p className="mt-4 rounded border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</p>}
        <Link href="/login" className="mt-5 inline-block text-xs font-bold text-brand-700">{rtl ? "العودة لتسجيل الدخول" : "Back to login"}</Link>
      </section>
    </main>
  );
}
