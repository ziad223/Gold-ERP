"use client";

import { RotateCcw, Search } from "lucide-react";
import { Button } from "./button";
import { NativeSelect } from "./native-select";

export interface ToolbarFilter {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

interface DataToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  filters?: ToolbarFilter[];
  resultCount?: number;
  resultLabel?: string;
  onReset?: () => void;
  resetLabel?: string;
  children?: React.ReactNode;
}

export function DataToolbar({
  query,
  onQueryChange,
  placeholder,
  filters = [],
  resultCount,
  resultLabel,
  onReset,
  resetLabel = "Reset",
  children,
}: DataToolbarProps) {
  const hasActiveFilters = Boolean(query) || filters.some((filter) => filter.value !== "all");

  return (
    <div className="border-b border-border bg-surface-muted/30 p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="input-base ps-11"
            placeholder={placeholder}
          />
        </div>

        {filters.map((filter) => (
          <NativeSelect
            key={filter.id}
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            aria-label={filter.label}
            wrapperClassName="min-w-[170px]"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        ))}

        {children}

        {onReset && (
          <Button
            type="button"
            variant="secondary"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">{resetLabel}</span>
          </Button>
        )}
      </div>

      {typeof resultCount === "number" && (
        <p className="mt-3 text-[11px] font-semibold text-muted">
          {resultCount} {resultLabel}
        </p>
      )}
    </div>
  );
}
