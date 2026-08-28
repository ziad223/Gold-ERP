"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
export { NativeSelect as Select } from "./native-select";
export type { NativeSelectProps } from "./native-select";

export type ComboboxOption = { value: string; label: string; disabled?: boolean };

export interface ComboboxProps {
  value: string;
  options: ComboboxOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

/** Keyboard/touch-safe searchable select for future shared consumers. */
export function Combobox({ value, options, onValueChange, placeholder = "Select…", disabled, "aria-label": ariaLabel, className }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-controls={listId}
          aria-expanded={open}
          aria-autocomplete="list"
          disabled={disabled}
          value={open ? query : selected?.label || ""}
          placeholder={placeholder}
          className="input-base pe-10"
          onFocus={() => setOpen(true)}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setOpen(false); setQuery(""); }
            if (event.key === "Enter" && filtered[0] && !filtered[0].disabled) { onValueChange(filtered[0].value); setOpen(false); setQuery(""); }
          }}
        />
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {open && (
        <div id={listId} role="listbox" className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-40 max-h-60 overflow-auto rounded-2xl border border-border bg-popover p-1 shadow-float">
          {filtered.length === 0 ? <p className="px-3 py-2 text-xs text-muted-foreground">No results</p> : filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              className="flex min-h-10 w-full items-center rounded-xl px-3 text-start text-xs font-semibold text-popover-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onValueChange(option.value); setOpen(false); setQuery(""); }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
