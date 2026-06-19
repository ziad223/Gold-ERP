"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const portalRootRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  // Mount portal onto document.documentElement so it inherits the .dark class
  if (!portalRootRef.current) {
    portalRootRef.current = document.documentElement;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-foreground/20 p-4 backdrop-blur-sm">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close" />
      <section className="relative z-10 w-full max-w-2xl rounded-[28px] border border-border bg-panel shadow-float">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
            {description && <p className="mt-1 text-xs leading-6 text-muted-foreground">{description}</p>}
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-surface-muted text-muted hover:text-foreground transition focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </section>
    </div>,
    document.documentElement,
  );
}
