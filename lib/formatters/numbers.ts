export function toEnglishDigits(value: unknown): string {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

export function normalizeNumberInput(value: unknown): string {
  return toEnglishDigits(value).replace(/[^\d.,-]/g, "");
}

export function formatEnglishNumber(
  value: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  const num = Number(toEnglishDigits(value ?? 0)) || 0;

  return toEnglishDigits(
    new Intl.NumberFormat("en-US", {
      numberingSystem: "latn",
      ...options
    }).format(num)
  );
}

export function hasArabicDigits(value: unknown): boolean {
  return /[٠-٩۰-۹]/.test(String(value ?? ""));
}
