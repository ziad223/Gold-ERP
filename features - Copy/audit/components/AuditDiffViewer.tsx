"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";

interface AuditDiffViewerProps {
  before: string | Record<string, any>;
  after: string | Record<string, any>;
}

export function AuditDiffViewer({ before, after }: AuditDiffViewerProps) {
  const locale = useLocale();
  const rtl = locale === "ar";

  const diffItems = useMemo(() => {
    let beforeObj: Record<string, any> = {};
    let afterObj: Record<string, any> = {};

    try {
      beforeObj = typeof before === "string" ? JSON.parse(before) : before;
    } catch {
      beforeObj = { value: String(before) };
    }

    try {
      afterObj = typeof after === "string" ? JSON.parse(after) : after;
    } catch {
      afterObj = { value: String(after) };
    }

    const allKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]));

    return allKeys.map((key) => {
      const bVal = beforeObj[key];
      const aVal = afterObj[key];
      const changed = JSON.stringify(bVal) !== JSON.stringify(aVal);
      return {
        key,
        before: bVal !== undefined ? String(typeof bVal === "object" ? JSON.stringify(bVal) : bVal) : "—",
        after: aVal !== undefined ? String(typeof aVal === "object" ? JSON.stringify(aVal) : aVal) : "—",
        changed,
      };
    });
  }, [before, after]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-panel text-xs">
      <table className="w-full text-start leading-5">
        <thead className="bg-table-header text-muted">
          <tr>
            <th className="px-4 py-2.5 text-start font-bold">{rtl ? "الحقل" : "Property"}</th>
            <th className="px-4 py-2.5 text-start font-bold">{rtl ? "القيمة السابقة" : "Before"}</th>
            <th className="px-4 py-2.5 text-start font-bold">{rtl ? "القيمة الجديدة" : "After"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {diffItems.map((item) => (
            <tr
              key={item.key}
              className={`transition ${
                item.changed
                  ? "bg-warning/5 hover:bg-warning/10"
                  : "hover:bg-table-row-hover"
              }`}
            >
              <td className="px-4 py-3 font-semibold text-foreground">
                {item.key}
              </td>
              <td className={`px-4 py-3 font-mono ${item.changed ? "text-destructive bg-destructive/10" : "text-muted"}`}>
                {item.before}
              </td>
              <td className={`px-4 py-3 font-mono ${item.changed ? "text-emerald-600 bg-emerald-500/10 font-bold" : "text-muted"}`}>
                {item.after}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
