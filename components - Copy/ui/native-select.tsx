"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Extra wrapper className */
  wrapperClassName?: string;
}

/**
 * NativeSelect — a styled <select> wrapper that works everywhere.
 * Replaces the raw <select className="input-base appearance-none ..."> pattern.
 *
 * Usage:
 *   <NativeSelect value={v} onChange={...}>
 *     <option value="a">A</option>
 *   </NativeSelect>
 */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className = "", wrapperClassName = "", children, ...props }, ref) => {
    return (
      <div className={`relative ${wrapperClassName}`}>
        <select
          ref={ref}
          className={[
            // base layout
            "w-full h-10 rounded-2xl border border-border",
            // bg + text
            "bg-input text-foreground",
            // padding — enough room for the chevron on the right
            "ps-3 pe-9 py-0",
            // typography
            "text-xs font-semibold",
            // focus ring
            "outline-none ring-offset-background",
            "focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
            // cursor + transition
            "cursor-pointer transition-colors",
            // hover
            "hover:border-brand-400",
            // REMOVED: appearance-none is intentionally NOT applied here;
            // the wrapper hides the system arrow, our own chevron shows instead.
            "appearance-none",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {children}
        </select>

        {/* Custom chevron icon — absolutely positioned, pointer-events-none */}
        <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground">
          <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
        </span>
      </div>
    );
  }
);

NativeSelect.displayName = "NativeSelect";
