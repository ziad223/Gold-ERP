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
  missing: Array<"line1" | "city" | "country">;
};

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
  const started = Object.values(draft).some((value) => value.trim().length > 0);
  const missing = (["line1", "city", "country"] as const).filter((field) => !draft[field].trim());
  return { valid: !started || missing.length === 0, started, missing };
}

export function customerAddressFromDraft(
  draft: CustomerAddressDraft,
  isPrimary = false,
): CustomerAddress {
  const address: CustomerAddress = {
    line1: draft.line1.trim(),
    city: draft.city.trim(),
    country: draft.country.trim(),
    isPrimary,
  };
  const line2 = draft.line2.trim();
  const postalCode = draft.postalCode.trim();
  if (line2) address.line2 = line2;
  if (postalCode) address.postalCode = postalCode;
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

export function customerAddressDisplayMarker(
  addresses: CustomerAddress[] | undefined,
  index: number,
): "PRIMARY" | "CURRENT_COMPATIBILITY" | null {
  const current = addresses ?? [];
  if (current[index]?.isPrimary === true) return "PRIMARY";
  const hasExplicitPrimary = current.some((address) => address.isPrimary === true);
  if (!hasExplicitPrimary && index === 0) return "CURRENT_COMPATIBILITY";
  return null;
}
