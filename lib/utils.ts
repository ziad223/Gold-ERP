import { toEnglishDigits } from "./formatters/numbers";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function normalizeCurrencyCode(value?: string | null): string {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase();

  const aliases: Record<string, string> = {
    AED: "AED",
    "د.إ": "AED",
    "درهم": "AED",
    "درهم إماراتي": "AED",
    "درهم اماراتي": "AED",

    EGP: "EGP",
    EGY: "EGP",
    "جنيه": "EGP",
    "جنيه مصري": "EGP",
    "ج.م": "EGP",

    SAR: "SAR",
    "ريال": "SAR",
    "ريال سعودي": "SAR",

    USD: "USD",
    "دولار": "USD",
    "دولار أمريكي": "USD",
    "دولار امريكي": "USD",

    EUR: "EUR",
    "يورو": "EUR",

    KWD: "KWD",
    "دينار كويتي": "KWD",

    QAR: "QAR",
    "ريال قطري": "QAR",

    BHD: "BHD",
    "دينار بحريني": "BHD",

    OMR: "OMR",
    "ريال عماني": "OMR"
  };

  return aliases[upper] || aliases[raw] || "AED";
}

export function formatCurrency(value: number, currency = "AED", locale = "ar") {
  const safeCurrency = normalizeCurrencyCode(currency);
  try {
    const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 2,
      numberingSystem: "latn",
    }).format(Number(value) || 0);
    return toEnglishDigits(formatted);
  } catch (error) {
    const amount = toEnglishDigits(
      new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
        numberingSystem: "latn",
      }).format(Number(value) || 0)
    );
    return `${amount} ${safeCurrency}`;
  }
}

export function formatNumber(value: number, maximumFractionDigits = 2, locale = "ar") {
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE", {
    maximumFractionDigits,
    numberingSystem: "latn",
  }).format(value);
  return toEnglishDigits(formatted);
}
