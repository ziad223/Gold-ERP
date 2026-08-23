"use client";

import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { Link } from "@/i18n/navigation";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const rtl = locale === "ar";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await apiClient("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }), skipBranch: true });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5 dark:bg-navy-950" dir={rtl ? "rtl" : "ltr"}>
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-navy-900">
        <h1 className="text-2xl font-black text-navy-950 dark:text-white">{rtl ? "استرجاع كلمة المرور" : "Password Recovery"}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          {rtl ? "أدخل بريد الحساب. ستظهر نفس الرسالة سواء كان الحساب موجودًا أم لا." : "Enter the account email. The response is generic whether the account exists or not."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="label-base">{rtl ? "البريد الإلكتروني" : "Email"}</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="input-base ps-11" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
          </label>
          <Button className="w-full" disabled={loading}>{loading ? (rtl ? "جار الإرسال" : "Sending") : (rtl ? "إرسال رابط الاسترجاع" : "Send recovery link")}</Button>
        </form>
        {sent && (
          <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
            {rtl ? "إذا كان الحساب قابلًا للاسترجاع، تم إرسال تعليمات إعادة التعيين." : "If the account can be recovered, reset instructions have been sent."}
          </p>
        )}
        <Link href="/login" className="mt-5 inline-block text-xs font-bold text-brand-700">{rtl ? "العودة لتسجيل الدخول" : "Back to login"}</Link>
      </section>
    </main>
  );
}
