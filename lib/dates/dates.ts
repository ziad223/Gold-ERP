import { DateTime } from "luxon";
import { toEnglishDigits } from "../formatters/numbers";

export const DEFAULT_TIMEZONE = "Asia/Dubai";
export const UI_DATE_FORMAT = "dd/MM/yyyy";
export const UI_DATETIME_FORMAT = "dd/MM/yyyy HH:mm";
export const UI_TIME_FORMAT = "HH:mm";

function localeFor(locale: string) {
  return locale === "ar" ? "ar-AE-u-nu-latn" : "en-AE";
}

/** Display a DATE-only value without applying timezone conversion. */
export function formatDate(dateString: string | Date | undefined | null, locale = "ar"): string {
  if (!dateString) return "—";
  const raw = typeof dateString === "string" ? dateString.trim() : "";
  const parsed = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? DateTime.fromISO(raw, { zone: "utc" })
    : typeof dateString === "string"
      ? DateTime.fromISO(raw, { zone: "utc" })
      : DateTime.fromJSDate(dateString, { zone: "utc" });
  if (!parsed.isValid) return "—";
  return toEnglishDigits(parsed.setLocale(localeFor(locale)).toFormat(UI_DATE_FORMAT));
}

/** Display a timestamp in the existing branch timezone semantics. */
export function formatDateTime(
  timestamp: string | Date | undefined | null,
  timezone = DEFAULT_TIMEZONE,
  locale = "ar",
): string {
  return formatBranchDateTime(timestamp, timezone, locale, UI_DATETIME_FORMAT);
}

export function formatTime(
  timestamp: string | Date | undefined | null,
  timezone = DEFAULT_TIMEZONE,
  locale = "ar",
): string {
  return formatBranchDateTime(timestamp, timezone, locale, UI_TIME_FORMAT);
}

/** Convert a UI date (DD/MM/YYYY) or existing canonical date to YYYY-MM-DD. */
export function parseUserDateInput(value: string | undefined | null): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (match) {
    const parsed = DateTime.fromObject(
      { day: Number(match[1]), month: Number(match[2]), year: Number(match[3]) },
      { zone: "utc" },
    );
    if (!parsed.isValid || parsed.day !== Number(match[1]) || parsed.month !== Number(match[2])) return "";
    return parsed.toFormat("yyyy-MM-dd");
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = DateTime.fromISO(raw, { zone: "utc" });
    return parsed.isValid ? raw : "";
  }
  return "";
}

export function toCanonicalDateInput(value: string | Date | undefined | null): string {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value.trim())) return value.trim().slice(0, 10);
  return parseUserDateInput(formatDate(value, "en"));
}

// Formats a UTC ISO string (or other standard timestamp) into the IANA branch timezone
export function formatBranchDateTime(
  utcTimestamp: string | Date | undefined | null,
  timezone = DEFAULT_TIMEZONE,
  locale = "ar",
  format = UI_DATETIME_FORMAT,
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
  return formatDate(dateString, locale);
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
