import { CheckCircle2, Gem, ShieldCheck, Sparkles } from "lucide-react";

export function AuthVisual({
  title,
  description,
  points,
  badge,
  footer,
}: {
  title: string;
  description: string;
  points: string[];
  badge: string;
  footer: string;
}) {
  return (
    <aside className="auth-grid relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
      <div className="absolute -start-28 top-20 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="absolute -end-20 bottom-16 h-80 w-80 rounded-full bg-gold-400/10 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur">
          <Gem className="h-7 w-7 text-gold-300" />
        </div>
        <div>
          <p className="text-xl font-black tracking-[0.14em]">DARFUS</p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.22em] text-brand-200">JEWELLERY ERP</p>
        </div>
      </div>

      <div className="relative max-w-xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-300/20 bg-brand-300/10 px-4 py-2 text-xs font-bold text-brand-100">
          <Sparkles className="h-4 w-4" />
          {badge}
        </div>
        <h1 className="text-4xl font-black leading-[1.35] xl:text-5xl">{title}</h1>
        <p className="mt-5 max-w-lg text-sm leading-8 text-slate-300 xl:text-base">{description}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {points.map((point) => (
            <div key={point} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-300" />
              <span className="text-xs font-semibold text-slate-200">{point}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4 text-brand-300" />
        {footer}
      </div>
    </aside>
  );
}
