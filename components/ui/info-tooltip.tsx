"use client";

import { useId, useState } from "react";

type InfoTooltipProps = {
  label: string;
  text: string;
};

export function InfoTooltip({ label, text }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  return (
    <span className="relative inline-flex align-middle" onMouseEnter={() => setOpen(true)} onMouseLeave={(event) => { if (!event.currentTarget.contains(document.activeElement)) setOpen(false); }}>
      <button
        type="button"
        aria-label={label}
        aria-controls={tooltipId}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        className="inline-flex h-7 min-w-7 items-center justify-center rounded-full text-sm font-black text-brand-600 outline-none transition-colors hover:text-brand-800 focus-visible:ring-2 focus-visible:ring-brand-500/40"
        onClick={() => setOpen((current) => !current)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ⓘ
      </button>
      {open && <span id={tooltipId} role="tooltip" className="absolute start-0 top-8 z-30 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-3 text-[11px] font-medium leading-5 text-popover-foreground shadow-float">{text}</span>}
    </span>
  );
}
