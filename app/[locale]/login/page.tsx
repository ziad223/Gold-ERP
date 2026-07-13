"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, Eye, EyeOff, Gem, LockKeyhole, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuthVisual } from "@/components/auth/auth-visual";
import { GuestGuard } from "@/components/auth/guest-guard";
import { LanguageSwitcher } from "@/components/auth/language-switcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const common = useTranslations("Common");
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("123456");
  const [remember, setRemember] = useState(true);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password, remember);
    if (!result.ok) {
      setError(result.message || t("invalid"));
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
  };

  return (
    <GuestGuard>
      <main className="grid min-h-screen bg-slate-50 dark:bg-navy-950 lg:grid-cols-[1.05fr_.95fr]">
        <AuthVisual
          title={t("brandTitle")}
          description={t("brandText")}
          points={[t("pointAssets"), t("pointSales"), t("pointReports"), t("pointSecurity")]}
          badge={t("platformBadge")}
          footer={t("platformFooter")}
        />

        <section className="relative flex min-h-screen items-center justify-center p-5 sm:p-8 lg:p-12">
          <div className="absolute end-5 top-5 sm:end-8 sm:top-8">
            <LanguageSwitcher />
          </div>

          <div className="w-full max-w-[470px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-700 text-white shadow-lg shadow-brand-700/20">
                <Gem className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xl font-black tracking-wider text-navy-900 dark:text-white">DARFUS</p>
                <p className="text-[10px] font-bold tracking-[0.2em] text-brand-700 dark:text-brand-300">JEWELLERY ERP</p>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-navy-900 sm:p-9">
              <p className="text-xs font-extrabold text-brand-700 dark:text-brand-300">{common("welcome")}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-navy-950 dark:text-white">{t("loginTitle")}</h1>
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{t("loginSubtitle")}</p>

              <form onSubmit={submit} className="mt-8 space-y-5">
                <label className="block">
                  <span className="label-base">{t("email")}</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="input-base ps-11"
                      placeholder={t("emailPlaceholder")}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="label-base">{t("password")}</span>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={visible ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="input-base px-11"
                      placeholder={t("passwordPlaceholder")}
                    />
                    <button
                      type="button"
                      onClick={() => setVisible((current) => !current)}
                      className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-brand-700"
                      aria-label={visible ? t("hidePassword") : t("showPassword")}
                    >
                      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                <div className="flex items-center justify-between gap-4 text-xs">
                  <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-brand-700"
                    />
                    {t("remember")}
                  </label>
                  <button type="button" className="font-extrabold text-brand-700 hover:underline dark:text-brand-300">
                    {t("forgot")}
                  </button>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" disabled={loading} className="w-full rounded-2xl">
                  {loading ? common("loading") : t("login")}
                </Button>
              </form>

              <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/70 p-4 text-xs dark:border-brand-900/50 dark:bg-brand-500/10">
                <p className="font-extrabold text-brand-800 dark:text-brand-200">{t("demoTitle")}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-brand-700 dark:text-brand-300">
                  <span>admin@admin.com</span>
                  <span>123456</span>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
    </GuestGuard>
  );
}
