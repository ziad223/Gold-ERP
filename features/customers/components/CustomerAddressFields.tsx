"use client";

import type { CustomerAddressDraft } from "@/lib/customers/address-ui";

type Props = {
  value: CustomerAddressDraft;
  onChange: (value: CustomerAddressDraft) => void;
  locale: string;
  idPrefix: string;
  disabled?: boolean;
};

export function CustomerAddressFields({ value, onChange, locale, idPrefix, disabled = false }: Props) {
  const ar = locale === "ar";
  const update = (field: keyof CustomerAddressDraft, nextValue: string) => {
    onChange({ ...value, [field]: nextValue });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2" data-testid={`${idPrefix}-fields`}>
      <label className="sm:col-span-2" htmlFor={`${idPrefix}-line1`}>
        <span className="label-base">{ar ? "العنوان" : "Address"}</span>
        <input
          id={`${idPrefix}-line1`}
          data-testid={`${idPrefix}-line1`}
          className="input-base"
          value={value.line1}
          disabled={disabled}
          autoComplete="street-address"
          onChange={(event) => update("line1", event.target.value)}
        />
      </label>
      <label htmlFor={`${idPrefix}-city`}>
        <span className="label-base">{ar ? "المدينة" : "City"}</span>
        <input
          id={`${idPrefix}-city`}
          data-testid={`${idPrefix}-city`}
          className="input-base"
          value={value.city}
          disabled={disabled}
          autoComplete="address-level2"
          onChange={(event) => update("city", event.target.value)}
        />
      </label>
      <label htmlFor={`${idPrefix}-country`}>
        <span className="label-base">{ar ? "الدولة" : "Country"}</span>
        <input
          id={`${idPrefix}-country`}
          data-testid={`${idPrefix}-country`}
          className="input-base"
          value={value.country}
          disabled={disabled}
          autoComplete="country-name"
          onChange={(event) => update("country", event.target.value)}
        />
      </label>
      <label className="sm:col-span-2" htmlFor={`${idPrefix}-line2`}>
        <span className="label-base">{ar ? "تفاصيل إضافية" : "Additional details"}</span>
        <input
          id={`${idPrefix}-line2`}
          data-testid={`${idPrefix}-line2`}
          className="input-base"
          value={value.line2}
          disabled={disabled}
          autoComplete="address-line2"
          onChange={(event) => update("line2", event.target.value)}
        />
      </label>
      <label className="sm:col-span-2" htmlFor={`${idPrefix}-postal-code`}>
        <span className="label-base">{ar ? "الرمز البريدي" : "Postal code"}</span>
        <input
          id={`${idPrefix}-postal-code`}
          data-testid={`${idPrefix}-postal-code`}
          className="input-base"
          value={value.postalCode}
          disabled={disabled}
          autoComplete="postal-code"
          dir="ltr"
          onChange={(event) => update("postalCode", event.target.value)}
        />
      </label>
    </div>
  );
}
