import type { CustomerAddress } from "@/lib/types";

export type CustomerAddressDraft = {
  line1: string;
  line2: string;
  city: string;
  country: string;
  postalCode: string;
};

export type AddressValidationResult = {
  valid: boolean;
  started: boolean;
  missing: [];
};

export const CUSTOMER_ADDRESS_TEXT_FIELDS = ["line1", "line2", "city", "country", "postalCode"] as const;

export const emptyCustomerAddressDraft = (): CustomerAddressDraft => ({
  line1: "",
  line2: "",
  city: "",
  country: "",
  postalCode: "",
});

export function customerAddressToDraft(address?: CustomerAddress | null): CustomerAddressDraft {
  return {
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    country: address?.country ?? "",
    postalCode: address?.postalCode ?? "",
  };
}

export function validateCustomerAddressDraft(draft: CustomerAddressDraft): AddressValidationResult {
  const started = CUSTOMER_ADDRESS_TEXT_FIELDS.some((field) => draft[field].trim().length > 0);
  return { valid: true, started, missing: [] };
}

export function customerAddressFromDraft(
  draft: CustomerAddressDraft,
  isPrimary = false,
): CustomerAddress {
  const address: CustomerAddress = { isPrimary };
  for (const field of CUSTOMER_ADDRESS_TEXT_FIELDS) {
    const value = draft[field].trim();
    if (value) address[field] = value;
  }
  return address;
}

export function canonicalizeAddressForMutation(address: CustomerAddress): CustomerAddress {
  return customerAddressFromDraft(customerAddressToDraft(address), address.isPrimary === true);
}

export function addCustomerAddress(
  addresses: CustomerAddress[] | undefined,
  draft: CustomerAddressDraft,
): CustomerAddress[] {
  const current = (addresses ?? []).map(canonicalizeAddressForMutation);
  return [...current, customerAddressFromDraft(draft, false)];
}

export function editCustomerAddress(
  addresses: CustomerAddress[] | undefined,
  index: number,
  draft: CustomerAddressDraft,
): CustomerAddress[] {
  return (addresses ?? []).map((address, currentIndex) => (
    currentIndex === index
      ? customerAddressFromDraft(draft, address.isPrimary === true)
      : canonicalizeAddressForMutation(address)
  ));
}

export function setPrimaryCustomerAddress(
  addresses: CustomerAddress[] | undefined,
  index: number,
): CustomerAddress[] {
  return (addresses ?? []).map((address, currentIndex) => ({
    ...canonicalizeAddressForMutation(address),
    isPrimary: currentIndex === index,
  }));
}

export function removeCustomerAddress(
  addresses: CustomerAddress[] | undefined,
  index: number,
): CustomerAddress[] {
  return (addresses ?? [])
    .filter((_, currentIndex) => currentIndex !== index)
    .map(canonicalizeAddressForMutation);
}

export function isMeaningfulCustomerAddress(address?: CustomerAddress | null): boolean {
  return Boolean(address && CUSTOMER_ADDRESS_TEXT_FIELDS.some((field) => {
    const value = address[field];
    return typeof value === "string" && value.trim().length > 0;
  }));
}

export type CustomerAddressResolutionSource = "EXPLICIT_PRIMARY" | "SINGLE_ADDRESS" | "LEGACY_FALLBACK" | "NONE";

export type CustomerAddressResolution = {
  primaryAddress: CustomerAddress | null;
  index: number | null;
  source: CustomerAddressResolutionSource;
};

/**
 * Read-only mirror of the Phase-01 resolver: explicit Primary wins; only an
 * older array without a Primary may fall back to its first meaningful entry.
 */
export function resolveCustomerPrimaryAddress(addresses?: CustomerAddress[]): CustomerAddressResolution {
  const usable = (addresses ?? [])
    .map((address, index) => ({ address, index }))
    .filter(({ address }) => isMeaningfulCustomerAddress(address));
  const explicit = usable.filter(({ address }) => address.isPrimary === true);
  if (explicit.length === 1) return { primaryAddress: explicit[0].address, index: explicit[0].index, source: "EXPLICIT_PRIMARY" };
  if (explicit.length > 1 || usable.length === 0) return { primaryAddress: null, index: null, source: "NONE" };
  if (usable.length === 1) return { primaryAddress: usable[0].address, index: usable[0].index, source: "SINGLE_ADDRESS" };
  return { primaryAddress: usable[0].address, index: usable[0].index, source: "LEGACY_FALLBACK" };
}

export function formatCustomerAddress(address?: CustomerAddress | null): string {
  if (!address) return "";
  return CUSTOMER_ADDRESS_TEXT_FIELDS
    .map((field) => address[field])
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join("، ");
}

export function customerAddressDisplayMarker(
  addresses: CustomerAddress[] | undefined,
  index: number,
): "PRIMARY" | "CURRENT_COMPATIBILITY" | null {
  const resolved = resolveCustomerPrimaryAddress(addresses);
  if (resolved.index !== index) return null;
  if (resolved.source === "EXPLICIT_PRIMARY") return "PRIMARY";
  if (resolved.source === "SINGLE_ADDRESS" || resolved.source === "LEGACY_FALLBACK") return "CURRENT_COMPATIBILITY";
  return null;
}
