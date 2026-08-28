"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Checkbox({ className, type: _type, ...props }, ref) {
  return <input ref={ref} type="checkbox" className={cn("h-4 w-4 rounded border-border text-brand-600 accent-brand-600 focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />;
});

export const Radio = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Radio({ className, type: _type, ...props }, ref) {
  return <input ref={ref} type="radio" className={cn("h-4 w-4 border-border text-brand-600 accent-brand-600 focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />;
});

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label": string;
  className?: string;
}

export function Switch({ checked, onCheckedChange, disabled, "aria-label": ariaLabel, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent bg-surface-muted p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", checked && "bg-brand-600", className)}
    >
      <span aria-hidden="true" className={cn("block h-5 w-5 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0")} />
    </button>
  );
}

Checkbox.displayName = "Checkbox";
Radio.displayName = "Radio";
