"use client";
import { useEffect, useRef, useState } from "react";
import { Search, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function Field({ label, children, className }: { label?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      {children}
    </label>
  );
}

export interface Option { value: string; label: string; hint?: string }

/* ---------------------------------------------------- Modern listbox Select
   Drop-in replacement for the native <select>: same value/onChange/options
   API, but a styled popover with optional search for long lists. */
export function Select({
  value, onChange, options, className, placeholder = "Velg…", searchable, align = "left",
}: {
  value: string; onChange: (v: string) => void; options: Option[];
  className?: string; placeholder?: string; searchable?: boolean; align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);
  const showSearch = searchable ?? options.length > 9;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const ql = q.trim().toLowerCase();
  const filtered = ql ? options.filter((o) => o.label.toLowerCase().includes(ql)) : options;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full min-w-[140px] items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium outline-none transition hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring",
          open && "border-primary/60 ring-2 ring-ring/30",
        )}
      >
        <span className={cn("truncate", !current && "text-muted-foreground")}>{current?.label ?? placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="listbox"
          className={cn(
            "glass-strong absolute z-50 mt-1.5 w-max min-w-full max-w-[280px] origin-top animate-scale-in overflow-hidden rounded-xl border border-border p-1 shadow-xl",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {showSearch && (
            <div className="relative mb-1 p-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Søk…"
                className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 && <p className="px-3 py-4 text-center text-xs text-muted-foreground">Ingen treff</p>}
            {filtered.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition",
                    active ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted",
                  )}
                >
                  <Check className={cn("h-3.5 w-3.5 shrink-0", active ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="shrink-0 text-xs text-muted-foreground">{o.hint}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------- Segmented control
   Pill group for small, ordered option sets (status, units, modes). */
export function Segmented<T extends string>({
  value, onChange, options, className, size = "md",
}: {
  value: T; onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; icon?: React.ReactNode }[];
  className?: string; size?: "sm" | "md";
}) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md font-medium transition",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
            value === o.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({
  value, onChange, placeholder, className,
}: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition",
        checked ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      <span className={cn("h-3.5 w-3.5 rounded-full border", checked ? "border-primary bg-primary" : "border-muted-foreground")} />
      {label}
    </button>
  );
}

/* ------------------------------------------------------- Range slider field */
export function RangeField({
  label, value, onChange, min = 0, max = 100, step = 1, className,
}: { label: React.ReactNode; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; className?: string }) {
  return (
    <Field label={label} className={className}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="h-9 w-full accent-[hsl(var(--primary))]"
      />
    </Field>
  );
}

export function SortHeader({
  label, active, dir, onClick, align = "center", className,
}: { label: React.ReactNode; active: boolean; dir: "asc" | "desc"; onClick: () => void; align?: "left" | "center" | "right"; className?: string }) {
  return (
    <th className={cn("px-1.5 py-2.5 font-semibold", align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center", className)}>
      <button onClick={onClick} className={cn("inline-flex items-center gap-1 transition hover:text-foreground", active ? "text-foreground" : "")}>
        {label}
        <span className={cn("text-[9px]", active ? "opacity-100" : "opacity-30")}>{active ? (dir === "asc" ? "▲" : "▼") : "▼"}</span>
      </button>
    </th>
  );
}
