import { z } from "zod";

/**
 * Company Print Info config (Phase 19X-Fix).
 *
 * Display-only company contact/branding data used by the invoice print layer.
 * Stored under the settings JSONB key `printCompanyInfo` and saved via the
 * generic `PUT /settings/by-key/printCompanyInfo` endpoint (no new route, no
 * whitelist, no DB migration). It NEVER affects invoice totals, VAT, payments,
 * stock, or accounting — it only supplies company metadata for print display,
 * layered above the company master record and the legacy `receipt` fallback.
 *
 * All values are plain text. Rendering must escape them (React default); never
 * use dangerouslySetInnerHTML with these fields.
 */

export type PrintCompanyInfoConfig = {
  version: 1;
  displayName?: string;
  subtitle?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  taxNumber?: string;
};

/** Per-field maximum lengths (characters). Values longer than this are capped. */
export const PRINT_COMPANY_INFO_MAX_LENGTHS = {
  displayName: 120,
  subtitle: 120,
  phone: 40,
  email: 160,
  website: 200,
  address: 240,
  taxNumber: 80,
} as const;

/** Basic, lenient email shape check. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Website must be an explicit http/https URL. */
const WEBSITE_RE = /^https?:\/\/\S+$/i;

export const DEFAULT_PRINT_COMPANY_INFO_CONFIG: PrintCompanyInfoConfig = {
  version: 1,
};

/**
 * Permissive raw schema: every field optional, unknown keys stripped by Zod's
 * default object behavior. Normalization (trim / cap / format) is done after
 * parsing so we never throw and never reject the whole payload on one bad field.
 */
const RawPrintCompanyInfoSchema = z
  .object({
    // `version` is intentionally omitted here: any incoming version is stripped
    // (unknown key) and the output version is always normalized to 1, so a wrong
    // input version never rejects the whole payload.
    displayName: z.string().optional(),
    subtitle: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
    address: z.string().optional(),
    taxNumber: z.string().optional(),
  })
  .strip();

function normalizeText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

/**
 * Safely parse and normalize a raw `printCompanyInfo` value.
 * Never throws. Invalid/missing payloads fall back to the default config.
 * Unknown keys are stripped; strings are trimmed and capped. Invalid email /
 * website values are cleared (set undefined) rather than rejecting the payload,
 * so a single malformed contact field never blocks saving the rest.
 */
export function sanitizePrintCompanyInfoConfig(raw: unknown): PrintCompanyInfoConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_PRINT_COMPANY_INFO_CONFIG };
  }

  const parsed = RawPrintCompanyInfoSchema.safeParse(raw);
  if (!parsed.success) {
    return { ...DEFAULT_PRINT_COMPANY_INFO_CONFIG };
  }

  const data = parsed.data;

  const emailRaw = normalizeText(data.email, PRINT_COMPANY_INFO_MAX_LENGTHS.email);
  const email = emailRaw && EMAIL_RE.test(emailRaw) ? emailRaw : undefined;

  const websiteRaw = normalizeText(data.website, PRINT_COMPANY_INFO_MAX_LENGTHS.website);
  const website = websiteRaw && WEBSITE_RE.test(websiteRaw) ? websiteRaw : undefined;

  return {
    version: 1,
    displayName: normalizeText(data.displayName, PRINT_COMPANY_INFO_MAX_LENGTHS.displayName),
    subtitle: normalizeText(data.subtitle, PRINT_COMPANY_INFO_MAX_LENGTHS.subtitle),
    phone: normalizeText(data.phone, PRINT_COMPANY_INFO_MAX_LENGTHS.phone),
    email,
    website,
    address: normalizeText(data.address, PRINT_COMPANY_INFO_MAX_LENGTHS.address),
    taxNumber: normalizeText(data.taxNumber, PRINT_COMPANY_INFO_MAX_LENGTHS.taxNumber),
  };
}
