"use client";

import { useMemo } from "react";

export type SearchSelector<T> = (item: T) => unknown;
export type FilterPredicate<T> = (item: T) => boolean;

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLocaleLowerCase()
    .trim();
}

export function filterData<T>(
  items: T[],
  query: string,
  searchSelectors: SearchSelector<T>[],
  predicates: FilterPredicate<T>[] = [],
) {
  const normalizedQuery = normalize(query);

  return items.filter((item) => {
    const matchesQuery =
      !normalizedQuery ||
      searchSelectors.some((selector) => normalize(selector(item)).includes(normalizedQuery));

    return matchesQuery && predicates.every((predicate) => predicate(item));
  });
}

export function useDataFilters<T>(
  items: T[],
  query: string,
  searchSelectors: SearchSelector<T>[],
  predicates: FilterPredicate<T>[] = [],
) {
  return useMemo(
    () => filterData(items, query, searchSelectors, predicates),
    [items, query, searchSelectors, predicates],
  );
}
