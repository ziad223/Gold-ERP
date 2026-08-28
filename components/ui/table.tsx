import { cn } from "@/lib/utils";

export function Table({ className, children, caption }: { className?: string; children: React.ReactNode; caption?: string }) { return <div className="table-wrap"><div className="overflow-x-auto"><table className={cn("w-full text-start text-xs", className)}>{caption && <caption className="sr-only">{caption}</caption>}{children}</table></div></div>; }
export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) { return <thead className={cn("bg-table-header text-muted", className)}>{children}</thead>; }
export function TableBody({ children, className }: { children: React.ReactNode; className?: string }) { return <tbody className={cn("divide-y divide-border", className)}>{children}</tbody>; }
export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) { return <tr className={cn("transition-colors hover:bg-table-row-hover", className)}>{children}</tr>; }
export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) { return <th scope="col" className={cn("px-4 py-3 text-start text-[11px] font-bold", className)}>{children}</th>; }
export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) { return <td className={cn("px-4 py-3 align-middle text-start", className)}>{children}</td>; }
