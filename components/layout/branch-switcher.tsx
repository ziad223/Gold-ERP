"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/settings-context";

export function BranchSwitcher() {
  const t = useTranslations("Header");
  const { activeBranch, activeBranchId, switchBranch, user } = useAuth();
  const { branches } = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const branchOptions = branches.map(b => ({
    value: b.id,
    label: b.name,
    disabled: !b.isActive
  }));
  const isFixedBranchAccount = user?.accountType === "branch_shell";

  useEffect(() => {
    if (!branches.length) return;
    const fixedBranchId = user?.accountScope?.branchId || null;
    const active = branches.find((branch) => branch.id === (isFixedBranchAccount ? fixedBranchId : activeBranchId));
    if (active) {
      if (active.name !== activeBranch) switchBranch(active.id, active.name);
      return;
    }
    if (isFixedBranchAccount) return;
    const fallback = branches.find((branch) => branch.isActive) ?? branches[0];
    if (fallback) switchBranch(fallback.id, fallback.name);
  }, [activeBranch, activeBranchId, branches, isFixedBranchAccount, switchBranch, user?.accountScope?.branchId]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle open/close reset focus index
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    } else {
      // Set focus to the active branch index by default
      const activeIndex = branchOptions.findIndex((b) => b.value === activeBranchId);
      if (activeIndex !== -1) {
        setFocusedIndex(activeIndex);
      }
    }
  }, [isOpen, activeBranchId, branchOptions]);

  // Helper to get next active option index
  const getNextActiveIndex = (startIndex: number, direction: "next" | "prev"): number => {
    let current = startIndex;
    const len = branchOptions.length;
    for (let i = 0; i < len; i++) {
      current = direction === "next" 
        ? (current + 1) % len 
        : (current - 1 + len) % len;
      if (!branchOptions[current].disabled) {
        return current;
      }
    }
    return startIndex;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      triggerRef.current?.focus();
      e.preventDefault();
      return;
    }

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Space" || e.key === "Enter" || e.key === " ") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    // When open
    switch (e.key) {
      case "ArrowDown": {
        const nextIdx = getNextActiveIndex(focusedIndex, "next");
        setFocusedIndex(nextIdx);
        e.preventDefault();
        break;
      }
      case "ArrowUp": {
        const nextIdx = getNextActiveIndex(focusedIndex, "prev");
        setFocusedIndex(nextIdx);
        e.preventDefault();
        break;
      }
      case "Enter":
      case " ":
      case "Space": {
        if (focusedIndex >= 0 && focusedIndex < branchOptions.length) {
          const opt = branchOptions[focusedIndex];
          if (!opt.disabled) {
            switchBranch(opt.value, opt.label);
            setIsOpen(false);
            triggerRef.current?.focus();
          }
        }
        e.preventDefault();
        break;
      }
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  const currentInitials = activeBranch?.slice(0, 2).toUpperCase() || "BR";

  return (
    <div ref={containerRef} className="relative hidden xl:block">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => {
          if (!isFixedBranchAccount) setIsOpen((prev) => !prev);
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isFixedBranchAccount ? false : isOpen}
        aria-disabled={isFixedBranchAccount}
        aria-label={`${t("currentBranch")}: ${activeBranch}`}
        className="flex items-center gap-2 rounded-2xl border border-border bg-panel px-3 py-2 text-start transition focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-brand-500/50"
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-xs font-black text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          {currentInitials}
        </span>
        <div className="leading-tight pr-4">
          <p className="text-[9px] text-muted">{t("currentBranch")}</p>
          <p className="max-w-32 truncate text-xs font-bold text-foreground">
            {activeBranch}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isFixedBranchAccount ? "opacity-30" : ""}`} />
      </button>

      {/* Popover content */}
      {isOpen && !isFixedBranchAccount && (
        <div
          ref={listboxRef}
          role="listbox"
          aria-label={t("currentBranch")}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="absolute end-0 top-[calc(100%+10px)] w-64 rounded-3xl border border-border bg-popover p-2 shadow-float z-50 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {branchOptions.map((opt, idx) => {
            const isSelected = opt.value === activeBranchId;
            const isFocused = idx === focusedIndex;

            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled}
                onClick={() => {
                  if (!opt.disabled) {
                    switchBranch(opt.value, opt.label);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }
                }}
                onMouseEnter={() => {
                  if (!opt.disabled) {
                    setFocusedIndex(idx);
                  }
                }}
                className={`
                  flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold transition cursor-pointer select-none
                  ${opt.disabled 
                    ? "text-muted-foreground/40 cursor-not-allowed opacity-50 bg-transparent" 
                    : isFocused || isSelected
                      ? "bg-accent text-accent-foreground" 
                      : "text-popover-foreground hover:bg-surface-muted"
                  }
                `}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-500" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
