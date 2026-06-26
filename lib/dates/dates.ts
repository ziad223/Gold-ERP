import { DateTime } from "luxon";
import { toEnglishDigits } from "../formatters/numbers";

export const DEFAULT_TIMEZONE = "Asia/Dubai";

// Formats a UTC ISO string (or other standard timestamp) into the IANA branch timezone
export function formatBranchDateTime(
  utcTimestamp: string | Date | undefined | null,
  timezone = DEFAULT_TIMEZONE,
  locale = "ar",
  format = "yyyy-MM-dd HH:mm:ss",
): string {
  if (!utcTimestamp) return "—";
  
  const baseDateTime = typeof utcTimestamp === "string" 
    ? DateTime.fromISO(utcTimestamp, { zone: "utc" })
    : DateTime.fromJSDate(utcTimestamp, { zone: "utc" });
    
  if (!baseDateTime.isValid) return "—";
  
  const formatted = baseDateTime
    .setZone(timezone)
    .setLocale(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE")
    .toFormat(format);
  return toEnglishDigits(formatted);
}

// Formats a pure accounting document date (e.g. "2026-06-12") which has no time or timezone component
export function formatAccountingDate(
  dateString: string | undefined | null,
  locale = "ar",
): string {
  if (!dateString) return "—";
  
  const parsed = DateTime.fromFormat(dateString, "yyyy-MM-dd");
  if (!parsed.isValid) return dateString; // fallback to raw string if format deviates
  
  const formatted = parsed
    .setLocale(locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE")
    .toLocaleString(DateTime.DATE_MED);
  return toEnglishDigits(formatted);
}

// Generates the current business date string (yyyy-MM-dd) in the active branch timezone (not the local machine browser timezone)
export function getBranchCurrentDate(timezone = DEFAULT_TIMEZONE): string {
  return DateTime.now().setZone(timezone).toFormat("yyyy-MM-dd");
}

// Generates the current business timestamp string in UTC ISO format
export function getUTCCurrentTimestamp(): string {
  return DateTime.now().toUTC().toISO() || "";
}

// Parses and returns details of a document's lifecycle times (creation, posting, approval) relative to the active branch timezone
export function getDocumentTimes(
  createdTime: string | null,
  postedTime: string | null,
  approvedTime: string | null,
  timezone = DEFAULT_TIMEZONE,
  locale = "ar",
) {
  return {
    created: createdTime ? formatBranchDateTime(createdTime, timezone, locale) : null,
    posted: postedTime ? formatBranchDateTime(postedTime, timezone, locale) : null,
    approved: approvedTime ? formatBranchDateTime(approvedTime, timezone, locale) : null,
  };
}
