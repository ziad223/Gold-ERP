import { toEnglishDigits } from "./numbers";
import { normalizeCurrencyCode } from "../utils";

export function formatAppMoney(
  value: number | string,
  currency: string,
  decimalPrecision = 2
): string {
  const amount = Number(value) || 0;
  const safeCurrency = normalizeCurrencyCode(currency);

  try {
    return toEnglishDigits(
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: safeCurrency,
        numberingSystem: "latn",
        minimumFractionDigits: decimalPrecision,
        maximumFractionDigits: decimalPrecision
      }).format(amount)
    );
  } catch (error) {
    const formattedAmount = toEnglishDigits(
      new Intl.NumberFormat("en-US", {
        numberingSystem: "latn",
        minimumFractionDigits: decimalPrecision,
        maximumFractionDigits: decimalPrecision
      }).format(amount)
    );
    return `${formattedAmount} ${safeCurrency}`;
  }
}
