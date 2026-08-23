"use client";

import { useEffect, useState, type InputHTMLAttributes } from "react";
import { formatDate, parseUserDateInput, toCanonicalDateInput } from "@/lib/dates/dates";
import { toEnglishDigits } from "@/lib/formatters/numbers";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value?: string | null;
  onChange: (value: string) => void;
};

/** Presentation-only date input: DD/MM/YYYY on screen, YYYY-MM-DD in the API contract. */
export function DateInput({ value, onChange, placeholder = "DD/MM/YYYY", className, ...props }: DateInputProps) {
  const canonical = toCanonicalDateInput(value);
  const [draft, setDraft] = useState(() => canonical ? formatDate(canonical, "en") : "");

  useEffect(() => {
    setDraft(canonical ? formatDate(canonical, "en") : "");
  }, [canonical]);

  const commit = (next: string) => {
    const normalizedInput = toEnglishDigits(next);
    const normalized = parseUserDateInput(normalizedInput);
    if (!normalizedInput.trim()) {
      setDraft("");
      onChange("");
    } else if (normalized) {
      setDraft(formatDate(normalized, "en"));
      onChange(normalized);
    } else {
      setDraft(canonical ? formatDate(canonical, "en") : "");
    }
  };

  return (
    <input
      {...props}
      type="text"
      dir="ltr"
      inputMode="numeric"
      placeholder={placeholder}
      value={draft}
      className={className}
      onChange={(event) => setDraft(toEnglishDigits(event.target.value).replace(/[^0-9/]/g, "").slice(0, 10))}
      onBlur={(event) => commit(event.target.value)}
    />
  );
}

type DateTimeInputProps = Omit<DateInputProps, "placeholder"> & { placeholder?: string };

/** Presentation-only datetime-local input: DD/MM/YYYY HH:mm on screen. */
export function DateTimeInput({ value, onChange, placeholder = "DD/MM/YYYY HH:mm", className, ...props }: DateTimeInputProps) {
  const canonical = String(value || "").trim();
  const toDisplay = (raw: string) => {
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(raw);
    return match ? `${formatDate(match[1], "en")} ${match[2]}` : "";
  };
  const [draft, setDraft] = useState(() => toDisplay(canonical));

  useEffect(() => {
    setDraft(toDisplay(canonical));
  }, [canonical]);

  const commit = (next: string) => {
    const normalizedInput = toEnglishDigits(next).trim();
    const match = /^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}):(\d{2})$/.exec(normalizedInput);
    if (!normalizedInput) {
      setDraft("");
      onChange("");
      return;
    }
    if (!match) {
      setDraft(toDisplay(canonical));
      return;
    }
    const date = parseUserDateInput(match[1]);
    const hour = Number(match[2]);
    const minute = Number(match[3]);
    if (!date || hour > 23 || minute > 59) {
      setDraft(toDisplay(canonical));
      return;
    }
    const normalized = `${date}T${match[2]}:${match[3]}`;
    setDraft(`${formatDate(date, "en")} ${match[2]}:${match[3]}`);
    onChange(normalized);
  };

  return (
    <input
      {...props}
      type="text"
      dir="ltr"
      inputMode="numeric"
      placeholder={placeholder}
      value={draft}
      className={className}
      onChange={(event) => setDraft(toEnglishDigits(event.target.value).replace(/[^0-9/: ]/g, "").slice(0, 16))}
      onBlur={(event) => commit(event.target.value)}
    />
  );
}
