"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "@/i18n/navigation";

export default function ChangePasswordPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const router = useRouter();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiClient("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword, confirmation }), skipBranch: true });
      logout();
      router.replace("/login");
    } catch (err: any) {
      setError(err?.message || (rtl ? "تعذر تغيير كلمة المرور." : "Could not change password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5 dark:bg-navy-950" dir={rtl ? "rtl" : "ltr"}>
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-navy-900">
        <h1 className="text-2xl font-black text-navy-950 dark:text-white">{rtl ? "تغيير كلمة المرور مطلوب" : "Password Change Required"}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="input-base" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder={rtl ? "كلمة المرور الحالية" : "Current password"} required />
          <input className="input-base" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder={rtl ? "كلمة المرور الجديدة" : "New password"} required />
          <input className="input-base" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={rtl ? "تأكيد كلمة المرور" : "Confirm password"} required />
          <Button className="w-full" disabled={loading}>{loading ? (rtl ? "جار الحفظ" : "Saving") : (rtl ? "تغيير كلمة المرور" : "Change password")}</Button>
        </form>
        {error && <p className="mt-4 rounded border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</p>}
      </section>
    </main>
  );
}
