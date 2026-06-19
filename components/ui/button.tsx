"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition focus:outline-none focus:ring-4 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 focus:ring-brand-200 dark:focus:ring-brand-950/30",
        variant === "secondary" && "border border-border bg-panel text-foreground hover:bg-background focus:ring-ring/20",
        variant === "ghost" && "text-muted hover:bg-surface-muted hover:text-foreground focus:ring-ring/20",
        variant === "danger" && "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive/20",
        size === "sm" && "h-9 px-3 text-xs",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        className,
      )}
      {...props}
    />
  );
}
