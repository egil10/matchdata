"use client";
// Lightweight, dependency-free dataviz (pure CSS/SVG). No recharts → cheap to
// render inline in tables and cards.
import { cn } from "@/lib/cn";

/* --------------------------------------------------------------- BoxPlot
   Horizontal box-and-whisker rows sharing one numeric domain. Great for
   comparing distributions (min · Q1 · median · Q3 · max) across many groups. */
export function BoxPlot({
  rows, domainMin, domainMax, unit = "",
}: {
  rows: { name: string; min: number; q1: number; median: number; q3: number; max: number; color: string; n?: number; href?: string }[];
  domainMin: number; domainMax: number; unit?: string;
}) {
  const span = domainMax - domainMin || 1;
  const pos = (v: number) => ((v - domainMin) / span) * 100;
  return (
    <div className="space-y-1">
      {rows.map((r) => (
        <div key={r.name} className="group flex items-center gap-2 text-xs">
          <div className="w-24 shrink-0 truncate text-right font-medium text-muted-foreground" title={r.name}>{r.name}</div>
          <div className="relative h-5 flex-1" title={`${r.name}: median ${r.median}${unit} · IQR ${r.q1}–${r.q3} · range ${r.min}–${r.max}`}>
            {/* whisker line */}
            <div className="absolute top-1/2 h-px -translate-y-1/2 bg-border" style={{ left: `${pos(r.min)}%`, width: `${pos(r.max) - pos(r.min)}%` }} />
            {/* whisker caps */}
            <div className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-border" style={{ left: `${pos(r.min)}%` }} />
            <div className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-border" style={{ left: `${pos(r.max)}%` }} />
            {/* IQR box */}
            <div className="absolute top-1/2 h-3.5 -translate-y-1/2 rounded-[3px] transition group-hover:h-4" style={{ left: `${pos(r.q1)}%`, width: `${Math.max(0.5, pos(r.q3) - pos(r.q1))}%`, background: `${r.color}33`, border: `1px solid ${r.color}` }} />
            {/* median */}
            <div className="absolute top-1/2 h-3.5 w-[2px] -translate-y-1/2 rounded group-hover:h-4" style={{ left: `${pos(r.median)}%`, background: r.color }} />
          </div>
          <div className="w-12 shrink-0 text-right tabular-nums text-foreground">{r.median}{unit}</div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- Heatmap
   Generic value grid with per-column or global color scaling. */
export function Heatmap({
  rows, cols, value, format, color = "16 122 87", emptyLow = true,
}: {
  rows: { key: string; label: string }[];
  cols: { key: string; label: string }[];
  value: (rowKey: string, colKey: string) => number;
  format?: (v: number) => string;
  color?: string; // "r g b"
  emptyLow?: boolean;
}) {
  const max = Math.max(1, ...rows.flatMap((r) => cols.map((c) => value(r.key, c.key))));
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-card" />
            {cols.map((c) => (
              <th key={c.key} className="px-1 pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="sticky left-0 z-10 whitespace-nowrap bg-card pr-2 text-right text-xs font-medium text-muted-foreground">{r.label}</td>
              {cols.map((c) => {
                const v = value(r.key, c.key);
                const t = max ? v / max : 0;
                const a = emptyLow ? 0.08 + t * 0.85 : t;
                return (
                  <td key={c.key} className="h-9 min-w-[44px] rounded-md text-center text-xs font-semibold tabular-nums" style={{ background: `rgba(${color} / ${a})`, color: t > 0.5 ? "white" : "hsl(var(--foreground))" }} title={`${r.label} · ${c.label}: ${format ? format(v) : v}`}>
                    {v ? (format ? format(v) : v) : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------ MiniHist (inline) */
export function MiniHist({ values, color = "hsl(var(--primary))", width = 96, height = 22 }: { values: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(1, ...values);
  const n = values.length || 1;
  const bw = width / n;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="inline-block align-middle">
      {values.map((v, i) => {
        const h = (v / max) * height;
        return <rect key={i} x={i * bw + 0.4} y={height - h} width={Math.max(0.8, bw - 0.8)} height={h} fill={color} opacity={0.85} />;
      })}
    </svg>
  );
}

/* ------------------------------------------------------ Diverging bar cell
   Centered bar for signed values (e.g. older/younger than league mean). */
export function DivergeBar({ value, max, color = "hsl(var(--primary))", neg = "hsl(var(--muted-foreground))" }: { value: number; max: number; color?: string; neg?: string }) {
  const w = Math.min(50, (Math.abs(value) / (max || 1)) * 50);
  const positive = value >= 0;
  return (
    <div className="relative h-3 w-full">
      <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
      <div className="absolute top-0 h-full rounded-[2px]" style={{ background: positive ? color : neg, [positive ? "left" : "right"]: "50%", width: `${w}%` } as any} />
    </div>
  );
}

/* ------------------------------------------------------ Segmented bar
   Single stacked horizontal bar of labelled segments (age bands etc.). */
export function SegBar({ segments, height = 8 }: { segments: { value: number; color: string; label?: string }[]; height?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="flex w-full overflow-hidden rounded-full" style={{ height }}>
      {segments.map((s, i) => (
        <div key={i} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={s.label ? `${s.label}: ${s.value}` : String(s.value)} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------ Legend chips */
export function LegendChips({ items, className }: { items: { label: string; color: string }[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground", className)}>
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
