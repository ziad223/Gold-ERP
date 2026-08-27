export type GiftVoucherErrorKey =
  | "notFound"
  | "notRedeemable"
  | "branchIneligible"
  | "currencyMismatch"
  | "fullValueRequired"
  | "unsupportedPaymentMethod"
  | "missingCode"
  | "generic";

type GiftVoucherErrorLike = {
  status?: number;
  errorCode?: string;
  code?: string;
};

const ERROR_CODE_TO_KEY: Record<string, GiftVoucherErrorKey> = {
  GIFT_VOUCHER_NOT_FOUND: "notFound",
  GIFT_VOUCHER_NOT_REDEEMABLE: "notRedeemable",
  GIFT_VOUCHER_BRANCH_INELIGIBLE: "branchIneligible",
  GIFT_VOUCHER_CURRENCY_MISMATCH: "currencyMismatch",
  GIFT_VOUCHER_FULL_VALUE_REQUIRED: "fullValueRequired",
  GIFT_VOUCHER_CANONICAL_SPLIT_REQUIRED: "unsupportedPaymentMethod",
};

/**
 * Converts the stable Gift Voucher error authority into a locale-neutral UI key.
 * HTTP 404 is the current read-only lookup contract's not-found signal because
 * that route predates its stable error-code response; raw server text is never
 * used as a user-facing fallback.
 */
export function getGiftVoucherErrorKey(error: unknown): GiftVoucherErrorKey {
  const candidate = (error && typeof error === "object" ? error : {}) as GiftVoucherErrorLike;
  const code = String(candidate.errorCode || candidate.code || "").trim().toUpperCase();
  if (ERROR_CODE_TO_KEY[code]) return ERROR_CODE_TO_KEY[code];
  if (candidate.status === 404) return "notFound";
  return "generic";
}
