"use client";
/**
 * DARFUS Dashboard — Widget Skeleton (Shared Loading State)
 */
export function WidgetSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3 p-1">
      <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="h-8 w-1/2 rounded-xl bg-slate-200 dark:bg-slate-700" />
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800"
          style={{ width: `${60 + (i % 3) * 15}%` }}
        />
      ))}
    </div>
  );
}
