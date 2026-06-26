import { SearchX } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-56 place-items-center p-8 text-center">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-surface-muted text-muted">
          <SearchX className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-sm font-extrabold text-foreground">{title}</h3>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
