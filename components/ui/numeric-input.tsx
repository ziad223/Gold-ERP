import type { ChangeEvent, InputHTMLAttributes } from "react";
import { normalizeNumberInput } from "@/lib/formatters/numbers";

type NumericInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value: string | number | readonly string[] | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

/** Text-backed numeric input: preserves decimal/empty semantics and normalizes Arabic/Persian digits. */
export function NumericInput({ value, onChange, inputMode = "decimal", dir = "ltr", ...props }: NumericInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode={inputMode}
      dir={dir}
      value={value ?? ""}
      onChange={(event) => {
        const normalized = normalizeNumberInput(event.target.value);
        if (normalized !== event.target.value) {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
          setter?.call(event.target, normalized);
        }
        onChange(event);
      }}
    />
  );
}
