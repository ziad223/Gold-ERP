import { Decimal } from "decimal.js";
import { toEnglishDigits } from "../formatters/numbers";

// Safe creation of Decimal instance from string/number
export function toDecimal(value: string | number | undefined | null): Decimal {
  if (value === undefined || value === null || String(value).trim() === "") {
    return new Decimal("0");
  }
  try {
    return new Decimal(String(value));
  } catch {
    return new Decimal("0");
  }
}

// Format a decimal string or number to localized currency, strictly for display purposes
export function previewFormatCurrency(value: string | number, currency = "AED", locale = "ar"): string {
  const dec = toDecimal(value);
  const formattedNumber = toEnglishDigits(new Intl.NumberFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    numberingSystem: "latn",
  }).format(dec.toNumber()));

  return locale === "ar" 
    ? `${formattedNumber} ${currency === "AED" ? "د.إ" : currency}`
    : `${currency} ${formattedNumber}`;
}

// Format a weight decimal string, strictly for display
export function previewFormatWeight(value: string | number, suffix = "g", locale = "ar"): string {
  const dec = toDecimal(value);
  const formattedNumber = toEnglishDigits(new Intl.NumberFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
    numberingSystem: "latn",
  }).format(dec.toNumber()));

  const localizedSuffix = suffix === "g" 
    ? (locale === "ar" ? "جم" : "g") 
    : suffix;

  return `${formattedNumber} ${localizedSuffix}`;
}

// Non-authoritative addition of decimal strings
export function previewAdd(a: string | number, b: string | number): string {
  return toDecimal(a).add(toDecimal(b)).toString();
}

// Non-authoritative subtraction of decimal strings
export function previewSubtract(a: string | number, b: string | number): string {
  return toDecimal(a).sub(toDecimal(b)).toString();
}

// Non-authoritative multiplication of decimal strings
export function previewMultiply(a: string | number, b: string | number): string {
  return toDecimal(a).mul(toDecimal(b)).toString();
}

// Non-authoritative division of decimal strings
export function previewDivide(a: string | number, b: string | number): string {
  const decB = toDecimal(b);
  if (decB.isZero()) return "0";
  return toDecimal(a).div(decB).toString();
}

// Non-authoritative percentage calculation (e.g., margins, discount rates)
export function previewPercentage(value: string | number, total: string | number): string {
  const decTotal = toDecimal(total);
  if (decTotal.isZero()) return "0";
  return toDecimal(value).div(decTotal).mul(100).toFixed(2);
}

// Compare two decimal strings: returns 1 if a > b, -1 if a < b, 0 if a == b
export function compareDecimals(a: string | number, b: string | number): number {
  const decA = toDecimal(a);
  const decB = toDecimal(b);
  return decA.comparedTo(decB);
}

// Verify if a value is less than another (strictly for frontend safety alerts, not final rules)
export function isLessThan(a: string | number, b: string | number): boolean {
  return compareDecimals(a, b) === -1;
}

// Verify if a value is zero
export function isZero(value: string | number): boolean {
  return toDecimal(value).isZero();
}
