import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export function Field({ label, children, className }: { label?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      {children}
    </label>
  );
}

export function Select({
  value, onChange, options, className,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-9 rounded-lg border border-border bg-card px-2.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring", className)}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
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
