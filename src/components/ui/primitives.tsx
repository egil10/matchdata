import Link from "next/link";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { dataSourceMeta, TONE_BG, TONE_TEXT, formColor, formLabel, type Tone } from "@/lib/metrics";
import type { DataSource } from "@/lib/types";

/* ------------------------------------------------------------------ Card */
export function Card({ className, children, as: As = "div", ...rest }: any) {
  return (
    <As className={cn("card-surface", className)} {...rest}>
      {children}
    </As>
  );
}

export function SectionTitle({
  title, sub, action, icon, className,
}: { title: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
        </div>
        {sub && <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ Badge */
export function Badge({
  children, tone = "muted", className, style,
}: { children: React.ReactNode; tone?: Tone; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE_BG[tone], className,
      )}
    >
      {children}
    </span>
  );
}

export function DataBadge({ source, className }: { source: DataSource; className?: string }) {
  const m = dataSourceMeta(source);
  return (
    <span
      title={
        source === "real"
          ? "Ekte data: resultater og tabell fra openfootball (offentlig eiendom)."
          : "Modellert: estimerte tall — ikke offisielle data. Se Om-siden for metode."
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        TONE_BG[m.tone], className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", source === "real" ? "bg-emerald-500" : "bg-amber-500")} />
      {m.label}
    </span>
  );
}

/* ------------------------------------------------------------------ Crest */
const SIZES: Record<string, string> = { sm: "h-6 w-6 text-[9px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm", xl: "h-16 w-16 text-base" };

export function Crest({
  name, color, badge, short, size = "md", className,
}: { name: string; color?: string; badge?: string | null; short?: string; size?: keyof typeof SIZES; className?: string }) {
  if (badge) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={badge}
        alt={name}
        loading="lazy"
        className={cn("shrink-0 rounded-md object-contain", SIZES[size], className)}
      />
    );
  }
  const label = (short || name).replace(/[^A-Za-zÆØÅæøå0-9]/g, "").slice(0, 3).toUpperCase();
  return (
    <span
      aria-hidden
      style={{ background: `linear-gradient(135deg, ${color || "#64748b"}, ${color || "#475569"}cc)` }}
      className={cn(
        "grid shrink-0 place-items-center rounded-md font-bold text-white shadow-sm ring-1 ring-black/10",
        SIZES[size], className,
      )}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ Avatar */
const POS_COLOR: Record<string, string> = {
  Keeper: "#f59e0b", Forsvar: "#0ea5e9", Midtbane: "#22c55e", Angrep: "#ef4444",
};
export function Avatar({ name, posGroup, size = "md", className }: { name: string; posGroup?: string; size?: keyof typeof SIZES; className?: string }) {
  const c = POS_COLOR[posGroup || ""] || "#64748b";
  return (
    <span
      aria-hidden
      style={{ background: `linear-gradient(135deg, ${c}, ${c}aa)` }}
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold text-white ring-1 ring-black/10", SIZES[size], className)}
    >
      {initials(name)}
    </span>
  );
}

/* ------------------------------------------------------------------ Form */
export function FormGuide({ form, className }: { form: string[]; className?: string }) {
  return (
    <div className={cn("flex gap-1", className)}>
      {form.map((r, i) => (
        <span key={i} className={cn("grid h-5 w-5 place-items-center rounded text-[10px] font-bold", formColor(r))} title={r}>
          {formLabel(r)}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Stat */
export function Stat({
  label, value, sub, tone, className, icon,
}: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode; tone?: Tone; className?: string; icon?: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className={cn("stat-num mt-1.5 text-2xl font-bold", tone && TONE_TEXT[tone])}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ Meter */
export function Meter({ value, max = 1, className, color }: { value: number; max?: number; className?: string; color?: string }) {
  const w = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full rounded-full" style={{ width: `${w}%`, background: color || "hsl(var(--primary))" }} />
    </div>
  );
}

/* ----------------------------------------------------------------- Tip */
export function Tip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <span className="group/tip relative inline-flex cursor-help items-center">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-lg group-hover/tip:block max-w-[240px] whitespace-normal w-max">
        {text}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------- PageHeader */
export function PageHeader({
  title, subtitle, badge, actions, breadcrumb,
}: { title: React.ReactNode; subtitle?: React.ReactNode; badge?: React.ReactNode; actions?: React.ReactNode; breadcrumb?: { href: string; label: string }[] }) {
  return (
    <div className="mb-6">
      {breadcrumb && (
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="opacity-50">/</span>}
              <Link href={b.href} className="link-underline hover:text-foreground">{b.label}</Link>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
