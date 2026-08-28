"use client";

import { cn } from "@/lib/utils";

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Popover({ open, onOpenChange, label, trigger, children, className }: PopoverProps) {
  return <div className="relative inline-flex"><button type="button" aria-label={label} aria-expanded={open} onClick={() => onOpenChange(!open)} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{trigger}</button>{open && <div role="dialog" aria-label={label} className={cn("absolute end-0 top-[calc(100%+0.5rem)] z-40 min-w-56 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-float", className)}>{children}</div>}</div>;
}
