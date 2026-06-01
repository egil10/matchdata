"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, Hash } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Gender } from "@/lib/types";

type Entry = { t: "p" | "t" | "l"; id: string; n: string; s: string; l: string; g: Gender };
const TYPE_LABEL = { p: "Spiller", t: "Lag", l: "Liga" } as const;
const route = (e: Entry) => (e.t === "p" ? `/spiller/${e.id}` : e.t === "t" ? `/lag/${e.id}` : `/liga/${e.id}`);

export function CommandPalette({ gender }: { gender: Gender }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Entry[] | null>(null);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("kd-open-search", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("kd-open-search", onOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (open && !items) {
      fetch("/data/search.json").then((r) => r.json()).then(setItems).catch(() => setItems([]));
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else { setQ(""); setIdx(0); }
  }, [open, items]);

  const results = useMemo(() => {
    if (!items) return [];
    const ql = q.trim().toLowerCase();
    let pool = items.filter((e) => e.g === gender);
    if (ql) pool = pool.filter((e) => e.n.toLowerCase().includes(ql) || e.s.toLowerCase().includes(ql));
    // players & teams first when searching
    pool.sort((a, b) => {
      const an = a.n.toLowerCase().startsWith(ql) ? 0 : 1;
      const bn = b.n.toLowerCase().startsWith(ql) ? 0 : 1;
      return an - bn;
    });
    return pool.slice(0, 30);
  }, [items, q, gender]);

  useEffect(() => setIdx(0), [q]);

  function go(e: Entry) {
    setOpen(false);
    router.push(route(e));
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
              if (e.key === "Enter" && results[idx]) go(results[idx]);
            }}
            placeholder="Søk etter spillere, lag, ligaer…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">ESC</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {!items && <p className="p-4 text-sm text-muted-foreground">Laster…</p>}
          {items && results.length === 0 && <p className="p-4 text-sm text-muted-foreground">Ingen treff.</p>}
          {results.map((e, i) => (
            <button
              key={e.t + e.id}
              onMouseEnter={() => setIdx(i)}
              onClick={() => go(e)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm",
                i === idx ? "bg-muted" : "hover:bg-muted/60",
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{e.n}</span>
                <span className="truncate text-xs text-muted-foreground">{e.s}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{TYPE_LABEL[e.t]}</span>
                {i === idx && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
