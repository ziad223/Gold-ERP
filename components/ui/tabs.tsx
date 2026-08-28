"use client";

import { cn } from "@/lib/utils";

export interface TabItem { value: string; label: string; disabled?: boolean }
export interface TabsProps { items: TabItem[]; value: string; onValueChange: (value: string) => void; "aria-label": string; className?: string }

export function Tabs({ items, value, onValueChange, "aria-label": ariaLabel, className }: TabsProps) {
  return <div className={cn("flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-surface-muted p-1", className)} role="tablist" aria-label={ariaLabel}>{items.map((item) => <button key={item.value} type="button" role="tab" aria-selected={item.value === value} disabled={item.disabled} onClick={() => onValueChange(item.value)} className={cn("min-h-10 shrink-0 rounded-xl px-4 text-xs font-bold text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", item.value === value && "bg-panel text-foreground shadow-sm")}>{item.label}</button>)}</div>;
}
