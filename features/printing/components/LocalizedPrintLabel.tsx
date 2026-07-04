import type { ReactNode } from "react";

type LocalizedPrintLabelProps = {
  en: string;
  ar: string;
  showEnglish: boolean;
  showArabic: boolean;
  separator?: ReactNode;
  className?: string;
  englishClassName?: string;
  arabicClassName?: string;
};

type LocalizedTextOptions = Pick<LocalizedPrintLabelProps, "en" | "ar" | "showEnglish" | "showArabic"> & {
  separator?: string;
};

export function formatLocalizedText({
  en,
  ar,
  showEnglish,
  showArabic,
  separator = " | ",
}: LocalizedTextOptions) {
  if (showEnglish && showArabic) return `${en}${separator}${ar}`;
  if (showArabic) return ar;
  return en;
}

export function LocalizedPrintLabel({
  en,
  ar,
  showEnglish,
  showArabic,
  separator = " | ",
  className,
  englishClassName,
  arabicClassName,
}: LocalizedPrintLabelProps) {
  const content = (
    <>
      {showEnglish && <span className={englishClassName}>{en}</span>}
      {showEnglish && showArabic && separator}
      {showArabic && (
        <span className={arabicClassName} dir="rtl">
          {ar}
        </span>
      )}
    </>
  );

  if (className) {
    return <span className={className}>{content}</span>;
  }

  return content;
}
