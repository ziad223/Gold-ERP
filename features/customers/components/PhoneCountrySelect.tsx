"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import {
  PHONE_COUNTRY_OPTIONS,
  normalizePhoneCountry,
  phoneCountryLabel,
} from "@/lib/customers/phone";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
  required?: boolean;
  disabled?: boolean;
  testId?: string;
};

export function PhoneCountrySelect({ value, onChange, label, id, required, disabled, testId }: Props) {
  const locale = useLocale();
  const options = useMemo(
    () => PHONE_COUNTRY_OPTIONS
      .map((option) => ({ ...option, label: phoneCountryLabel(option.code, locale) }))
      .sort((a, b) => a.label.localeCompare(b.label, locale)),
    [locale],
  );

  return (
    <label className="block min-w-0">
      <span className="label-base">{label}</span>
      <select
        id={id}
        value={normalizePhoneCountry(value)}
        required={required}
        disabled={disabled}
        data-testid={testId}
        className="input-base w-full"
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{locale === "ar" ? "اختر الدولة" : "Select country"}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

