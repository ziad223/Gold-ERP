"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  label: string;
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ label, content, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <span className={cn("relative inline-flex", className)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}><button type="button" aria-label={label} aria-describedby={open ? id : undefined} aria-expanded={open} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen((current) => !current)} className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{children}</button>{open && <span id={id} role="tooltip" className="absolute start-0 top-[calc(100%+0.35rem)] z-40 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-3 text-xs leading-5 text-popover-foreground shadow-float">{content}</span>}</span>;
}
