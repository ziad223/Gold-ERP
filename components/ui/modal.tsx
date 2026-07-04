"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Reference-counted body scroll lock shared across all open modals. Nested or
// stacked modals must not leave `document.body` overflow stuck on "hidden":
// the body is locked only when the first modal opens and restored only when the
// last one closes. Module-level so every Modal instance coordinates.
let activeModalCount = 0;
let previousBodyOverflow: string | null = null;

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
  // Keep the latest onClose for the Escape handler without re-running the
  // scroll-lock effect when a parent passes a new inline callback each render
  // (that churn is what previously restored body overflow to "hidden").
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    if (activeModalCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    activeModalCount += 1;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      activeModalCount = Math.max(0, activeModalCount - 1);
      if (activeModalCount === 0) {
        document.body.style.overflow = previousBodyOverflow ?? "";
        previousBodyOverflow = null;
      }
    };
  }, [open]);

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
