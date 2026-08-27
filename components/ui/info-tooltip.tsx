"use client";

import { useState } from "react";

type InfoTooltipProps = {
  label: string;
  text: string;
};

export function InfoTooltip({ label, text }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle" onMouseEnter={() => setOpen(true)} onMouseLeave={(event) => { if (!event.currentTarget.contains(document.activeElement)) setOpen(false); }}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-sm font-black text-brand-600 outline-none hover:text-brand-800 focus:ring-2 focus:ring-brand-500/40"
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ⓘ
      </button>
      {open && <span role="tooltip" className="absolute start-0 top-6 z-30 w-64 rounded-xl border border-border bg-panel p-3 text-[11px] font-medium leading-5 text-foreground shadow-lg">{text}</span>}
    </span>
  );
}
