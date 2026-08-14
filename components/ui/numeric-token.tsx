import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { toEnglishDigits } from "@/lib/formatters/numbers";

type NumericTokenProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  children: ReactNode;
};

/** Isolates a numeric display token from surrounding RTL text without changing its value. */
export function NumericToken({ children, className, ...props }: NumericTokenProps) {
  return (
    <bdi dir="ltr" className={cn("numeric-token", className)} {...props}>
      {toEnglishDigits(children)}
    </bdi>
  );
}
