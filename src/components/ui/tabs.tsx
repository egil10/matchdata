"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  const [active, setActive] = useState(items[0]?.id);
  // Mount a tab's content only once it has been opened, then keep it mounted so
  // state (and recharts instances) survive tab switches without re-mount cost.
  const [seen, setSeen] = useState<Set<string>>(() => new Set(items[0] ? [items[0].id] : []));

  const open = (id: string) => {
    setActive(id);
    setSeen((s) => (s.has(id) ? s : new Set(s).add(id)));
  };

  return (
    <div className={className}>
      <div className="mb-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => open(it.id)}
            className={cn(
              "whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
              active === it.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {it.label}
          </button>
        ))}
      </div>
      {items.map((it) => (
        <div key={it.id} className={cn("animate-fade-in", active !== it.id && "hidden")}>
          {seen.has(it.id) ? it.content : null}
        </div>
      ))}
    </div>
  );
}
