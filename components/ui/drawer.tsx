"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: "start" | "end";
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, description, side = "end", children }: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const invokingTriggerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open) {
      if (!wasOpenRef.current) {
        const activeElement = document.activeElement;
        invokingTriggerRef.current = activeElement instanceof HTMLElement && activeElement !== document.body ? activeElement : null;
      }
      wasOpenRef.current = true;
      document.body.style.overflow = "hidden";
      closeRef.current?.focus();
      return () => { document.body.style.overflow = ""; };
    }

    if (wasOpenRef.current) {
      const invokingTrigger = invokingTriggerRef.current;
      wasOpenRef.current = false;
      invokingTriggerRef.current = null;
      if (invokingTrigger?.isConnected) invokingTrigger.focus({ preventScroll: true });
    }
  }, [open]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] bg-foreground/20 backdrop-blur-sm" role="presentation">
      <button type="button" className="absolute inset-0" aria-label="Close drawer" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className={cn("absolute inset-y-0 w-full max-w-md overflow-y-auto bg-panel p-6 shadow-float", side === "end" ? "end-0" : "start-0")}>
        <div className="flex items-start justify-between gap-4"><div><h2 id={titleId} className="text-lg font-extrabold text-foreground">{title}</h2>{description && <p id={descriptionId} className="mt-1 text-xs leading-6 text-muted-foreground">{description}</p>}</div><button ref={closeRef} type="button" aria-label="Close drawer" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-muted text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X aria-hidden="true" className="h-5 w-5" /></button></div>
        <div className="mt-6">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
