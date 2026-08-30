import {
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";

export type PhoneCountryCode = CountryCode;

export const PHONE_COUNTRY_OPTIONS = getCountries().map((code) => ({
  code,
  callingCode: `+${getCountryCallingCode(code)}`,
}));

export function normalizePhoneCountry(value: unknown): PhoneCountryCode | "" {
  if (typeof value !== "string") return "";
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && isSupportedCountry(code as CountryCode)
    ? code as PhoneCountryCode
    : "";
}

export function phoneCountryLabel(code: PhoneCountryCode, locale: string): string {
  const callingCode = PHONE_COUNTRY_OPTIONS.find((option) => option.code === code)?.callingCode || "";
  let name: string = code;
  try {
    name = new Intl.DisplayNames([locale], { type: "region" }).of(code) || code;
  } catch {
    // Country code and calling code remain a safe, readable fallback.
  }
  return `${name} (${callingCode})`;
}

export function canonicalizeCustomerPhone(phone: string, phoneCountry: string): {
  rawPhone: string;
  phoneCountry: PhoneCountryCode | "";
  canonicalPhone: string;
  isValid: boolean;
} {
  const rawPhone = String(phone ?? "");
  const country = normalizePhoneCountry(phoneCountry);
  if (!country || !rawPhone.trim()) {
    return { rawPhone, phoneCountry: country, canonicalPhone: "", isValid: false };
  }
  const parsed = parsePhoneNumberFromString(rawPhone, { defaultCountry: country, extract: false });
  if (!parsed || parsed.ext || !parsed.isValid() || (parsed.country && parsed.country !== country)) {
    return { rawPhone, phoneCountry: country, canonicalPhone: "", isValid: false };
  }
  return { rawPhone, phoneCountry: country, canonicalPhone: parsed.number, isValid: true };
}
