export type AccountFilterValue = "all" | string;

export type AccountFilterState = {
  search: string;
  type: AccountFilterValue;
  classification: AccountFilterValue;
  active: "all" | "active" | "inactive";
  posting: "all" | "posting" | "non_posting";
};

export type FilterableAccount = {
  id: string;
  parentId?: string | null;
  code: string;
  name: string;
  nameAr?: string | null;
  type: string;
  statementClassification?: string | null;
  isActive: boolean;
  isPosting: boolean;
};

export type FilteredAccountNode<T extends FilterableAccount> = {
  account: T;
  depth: number;
  contextOnly: boolean;
};

export const DEFAULT_ACCOUNT_FILTERS: AccountFilterState = Object.freeze({
  search: "",
  type: "all",
  classification: "all",
  active: "all",
  posting: "all",
});

export function normalizeAccountSearch(value: string): string {
  return String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function hasActiveAccountFilters(filters: AccountFilterState): boolean {
  return Boolean(normalizeAccountSearch(filters.search)) ||
    filters.type !== "all" ||
    filters.classification !== "all" ||
    filters.active !== "all" ||
    filters.posting !== "all";
}

export function accountMatchesFilters(account: FilterableAccount, filters: AccountFilterState): boolean {
  const search = normalizeAccountSearch(filters.search);
  if (search) {
    const fields = [account.code, account.name, account.nameAr || ""].map(normalizeAccountSearch);
    if (!fields.some((field) => field.includes(search))) return false;
  }
  if (filters.type !== "all" && account.type !== filters.type) return false;
  if (filters.classification !== "all" && account.statementClassification !== filters.classification) return false;
  if (filters.active === "active" && !account.isActive) return false;
  if (filters.active === "inactive" && account.isActive) return false;
  if (filters.posting === "posting" && !account.isPosting) return false;
  if (filters.posting === "non_posting" && account.isPosting) return false;
  return true;
}

function canonicalAccountOrder<T extends FilterableAccount>(left: T, right: T): number {
  return left.code.localeCompare(right.code, undefined, { numeric: true, sensitivity: "base" }) ||
    left.id.localeCompare(right.id);
}

export function filterAccountHierarchy<T extends FilterableAccount>(
  accounts: readonly T[],
  filters: AccountFilterState,
): FilteredAccountNode<T>[] {
  const byId = new Map(accounts.map((account) => [account.id, account]));
  const children = new Map<string | null, T[]>();
  for (const account of accounts) {
    const parentKey = account.parentId && byId.has(account.parentId) ? account.parentId : null;
    const siblings = children.get(parentKey) || [];
    siblings.push(account);
    children.set(parentKey, siblings);
  }
  for (const siblings of children.values()) siblings.sort(canonicalAccountOrder);

  const output: FilteredAccountNode<T>[] = [];
  const visited = new Set<string>();
  const activeFilters = hasActiveAccountFilters(filters);

  const visit = (account: T, depth: number): boolean => {
    if (visited.has(account.id)) return false;
    visited.add(account.id);
    const insertionIndex = output.length;
    output.push({ account, depth, contextOnly: false });
    let descendantMatches = false;
    for (const child of children.get(account.id) || []) {
      descendantMatches = visit(child, depth + 1) || descendantMatches;
    }
    const selfMatches = accountMatchesFilters(account, filters);
    if (!activeFilters || selfMatches || descendantMatches) {
      output[insertionIndex].contextOnly = activeFilters && !selfMatches;
      return selfMatches || descendantMatches;
    }
    output.splice(insertionIndex, output.length - insertionIndex);
    return false;
  };

  for (const root of children.get(null) || []) visit(root, 0);
  return output;
}
