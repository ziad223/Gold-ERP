export type CountItemDisplayState = "MATCHED" | "MISSING" | "UNEXPECTED" | "UNOBSERVED" | "UNRESOLVED";

type CountItemLike = { status?: string | null; result?: string | null };
type CountLike = {
  status: string;
  items?: CountItemLike[];
  expectedCount?: number;
  countedCount?: number;
  missingCount?: number;
  unexpectedCount?: number;
};

export function isFinalizedCount(status: string) {
  return status === "completed" || status === "closed";
}

export function countItemDisplayState(item: CountItemLike, countStatus: string): CountItemDisplayState {
  const result = String(item.result || "").toUpperCase();
  if (result === "MATCHED") return "MATCHED";
  if (result === "MISSING") return "MISSING";
  if (result === "EXTRA") return "UNEXPECTED";
  return countStatus === "in-progress" ? "UNOBSERVED" : "UNRESOLVED";
}

export function countTotals(candidate: CountLike) {
  const items = candidate.items || [];
  const expected = candidate.expectedCount ?? items.length;
  const counted = items.length
    ? items.filter((item) => String(item.result || "").toUpperCase() === "MATCHED").length
    : candidate.countedCount ?? 0;
  const missing = items.length
    ? items.filter((item) => String(item.result || "").toUpperCase() === "MISSING").length
    : candidate.missingCount ?? 0;
  const unexpected = items.length
    ? items.filter((item) => String(item.result || "").toUpperCase() === "EXTRA").length
    : candidate.unexpectedCount ?? 0;
  const unobserved = items.length
    ? items.filter((item) => item.result == null).length
    : Math.max(expected - counted - missing - unexpected, 0);
  const variance = isFinalizedCount(candidate.status) ? missing + unexpected : null;
  return { expected, counted, unobserved, missing, unexpected, variance };
}
