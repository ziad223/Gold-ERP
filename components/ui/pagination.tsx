"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps { page: number; pageCount: number; onPageChange: (page: number) => void; previousLabel: string; nextLabel: string; className?: string }

export function Pagination({ page, pageCount, onPageChange, previousLabel, nextLabel, className }: PaginationProps) {
  const safePage = Math.min(Math.max(page, 1), Math.max(pageCount, 1));
  return <nav aria-label="Pagination" className={cn("flex items-center justify-between gap-3", className)}><button type="button" aria-label={previousLabel} disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-xs font-bold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />{previousLabel}</button><span className="text-xs font-bold text-muted-foreground" aria-current="page">{safePage} / {Math.max(pageCount, 1)}</span><button type="button" aria-label={nextLabel} disabled={safePage >= pageCount} onClick={() => onPageChange(safePage + 1)} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-xs font-bold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">{nextLabel}<ChevronRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" /></button></nav>;
}
