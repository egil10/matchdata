"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePlayers, useTeams, useLeagues, useGender, useDebounced, type CPlayer } from "@/lib/client";
import { fmt, signed } from "@/lib/format";
import { mean, median, stdev, fiveNumber, pearson, histogram } from "@/lib/stats";
import { POS_GROUP_COLOR } from "@/lib/metrics";
import { PageHeader, Card, Stat, Badge } from "@/components/ui/primitives";
import { Field, Select, SortHeader } from "@/components/ui/controls";
import { Tabs } from "@/components/ui/tabs";
import { BoxPlot, MiniHist, Heatmap } from "@/components/dataviz";
import { OverlayHistogram, ScatterLab, RankBarChart, DonutChart } from "@/components/charts-lazy";

type Agg = "sum" | "mean";
interface Metric { label: string; get: (p: CPlayer) => number; agg: Agg; d: number; qualified?: boolean }

const METRICS: Record<string, Metric> = {
  min: { label: "Minutter", get: (p) => p.min, agg: "sum", d: 0 },
  gls: { label: "Mål", get: (p) => p.gls, agg: "sum", d: 0 },
  g90: { label: "Mål per 90", get: (p) => (p.min ? (p.gls * 90) / p.min : 0), agg: "mean", d: 2 },
  age: { label: "Alder", get: (p) => p.age, agg: "mean", d: 1 },
  k: { label: "Kamper", get: (p) => p.k, agg: "sum", d: 0 },
  st: { label: "Starter", get: (p) => p.st, agg: "sum", d: 0 },
  sub: { label: "Innhopp", get: (p) => p.sub, agg: "sum", d: 0 },
  mpg: { label: "Minutter per kamp", get: (p) => (p.k ? p.min / p.k : 0), agg: "mean", d: 0 },
  pm: { label: "+/−/90", get: (p) => p.pm, agg: "mean", d: 2 },
  tiv: { label: "Team Impact", get: (p) => p.tiv ?? 0, agg: "mean", d: 2, qualified: true },
  ppg: { label: "Poeng per kamp", get: (p) => p.ppg, agg: "mean", d: 2 },
  wppg: { label: "Vektet poeng/kamp", get: (p) => p.wppg, agg: "mean", d: 2 },
  caps: { label: "Landskamper", get: (p) => p.caps, agg: "sum", d: 0 },
  y: { label: "Gule kort", get: (p) => p.y, agg: "sum", d: 0 },
  r: { label: "Røde kort", get: (p) => p.r, agg: "sum", d: 0 },
};
const METRIC_OPTS = Object.entries(METRICS)
  .map(([k, m]) => ({ value: k, label: m.label }))
  .sort((a, b) => a.label.localeCompare(b.label, "nb"));

function values(ps: CPlayer[], m: Metric): number[] {
  const src = m.qualified ? ps.filter((p) => p.q === 1) : ps;
  return src.map(m.get).filter((v) => v != null && isFinite(v));
}
function aggregate(ps: CPlayer[], m: Metric): number {
  const v = values(ps, m);
  if (!v.length) return 0;
  return m.agg === "sum" ? v.reduce((s, x) => s + x, 0) : mean(v);
}

export default function AnalysePage() {
  const gender = useGender();
  const players = usePlayers();
  const teams = useTeams();
  const leagues = useLeagues();

  const [league, setLeague] = useState("all");
  const [posg, setPosg] = useState("all");
  const [minMin, setMinMin] = useState(0);
  const dMin = useDebounced(minMin, 120);

  const leaguesG = useMemo(
    () => (leagues || []).filter((l) => l.gender === gender).sort((a, b) => a.name.localeCompare(b.name, "nb")),
    [leagues, gender],
  );
  const teamById = useMemo(() => Object.fromEntries((teams || []).map((t) => [t.id, t])), [teams]);

  const pool = useMemo(
    () => (players || []).filter((p) =>
      p.g === gender && (league === "all" || p.lg === league) && (posg === "all" || p.pg === posg) && p.min >= dMin),
    [players, gender, league, posg, dMin],
  );

  // team groups
  const teamGroups = useMemo(() => {
    const by: Record<string, CPlayer[]> = {};
    for (const p of pool) (by[p.ti] ||= []).push(p);
    return Object.entries(by).map(([id, ps]) => ({ id, name: ps[0].ts, color: teamById[id]?.color || "#64748b", players: ps }));
  }, [pool, teamById]);

  return (
    <div>
      <PageHeader
        title="Analyse"
        subtitle="Fordelinger, lag-for-lag-statistikk og regresjoner på tvers av alle metrikker."
        badge={<Badge tone="low">Modellert</Badge>}
      />

      <div className="mb-5 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Liga">
          <Select value={league} onChange={setLeague} options={[{ value: "all", label: "Alle ligaer" }, ...leaguesG.map((l) => ({ value: l.id, label: l.name }))]} />
        </Field>
        <Field label="Posisjon">
          <Select value={posg} onChange={setPosg} options={[{ value: "all", label: "Alle posisjoner" }, ...["Angrep", "Forsvar", "Keeper", "Midtbane"].map((g) => ({ value: g, label: g }))]} />
        </Field>
        <Field label={`Min. spilletid: ${minMin} min`}>
          <input type="range" min={0} max={2000} step={90} value={minMin} onChange={(e) => setMinMin(+e.target.value)} className="h-9 w-full accent-[hsl(var(--primary))]" />
        </Field>
        <div className="flex items-end text-sm text-muted-foreground">{players ? `${fmt(pool.length)} spillere · ${teamGroups.length} lag` : "Laster…"}</div>
      </div>

      {!players ? (
        <p className="text-sm text-muted-foreground">Laster…</p>
      ) : (
        <Tabs
          items={[
            { id: "fordeling", label: "Fordelinger", content: <DistTab pool={pool} teamById={teamById} /> },
            { id: "regresjon", label: "Regresjon", content: <RegTab pool={pool} teamById={teamById} /> },
            { id: "geografi", label: "Geografi", content: <GeoTab pool={pool} /> },
          ]}
        />
      )}
    </div>
  );
}

/* =============================================================== Distribution */
type GRow = { key: string; label: string; color: string; href?: string; n: number; mean: number; median: number; sd: number; min: number; max: number; total: number; hist: number[]; q1: number; q3: number };
type DSort = "name" | "n" | "mean" | "median" | "sd" | "min" | "max" | "total";

const PALETTE = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6", "#ec4899", "#f43f5e", "#84cc16", "#06b6d4", "#8b5cf6", "#eab308"];
const AGE_BAND_COLOR: Record<string, string> = { u21: "#22c55e", b2125: "#0ea5e9", b2629: "#f59e0b", o30: "#ef4444" };
const ageBandKey = (a: number) => (a <= 20 ? "u21" : a <= 25 ? "b2125" : a <= 29 ? "b2629" : "o30");
const ageBandLabel = (a: number) => (a <= 20 ? "U21" : a <= 25 ? "21–25" : a <= 29 ? "26–29" : "30+");

interface GroupDef {
  label: string; keyOf: (p: CPlayer) => string; nameOf: (p: CPlayer) => string;
  href?: (key: string) => string; colorOf?: (key: string, i: number, teamById: Record<string, any>) => string; numeric?: boolean;
}
const GROUP_DEFS: Record<string, GroupDef> = {
  team: { label: "Lag", keyOf: (p) => p.ti, nameOf: (p) => p.ts, href: (k) => `/lag/${k}`, colorOf: (k, i, t) => t[k]?.color || PALETTE[i % PALETTE.length] },
  pos: { label: "Posisjon", keyOf: (p) => p.pg, nameOf: (p) => p.pg, colorOf: (k) => POS_GROUP_COLOR[k] || "#64748b" },
  league: { label: "Liga", keyOf: (p) => p.lg, nameOf: (p) => p.ln },
  fylke: { label: "Fylke", keyOf: (p) => p.fy, nameOf: (p) => p.fy },
  ageband: { label: "Aldersgruppe", keyOf: (p) => ageBandKey(p.age), nameOf: (p) => ageBandLabel(p.age), colorOf: (k) => AGE_BAND_COLOR[k] || "#64748b" },
  by: { label: "Fødselsår", keyOf: (p) => String(p.by), nameOf: (p) => String(p.by), numeric: true },
  nat: { label: "Landslag", keyOf: (p) => (p.nat === 1 ? "1" : "0"), nameOf: (p) => (p.nat === 1 ? "Landslagsspiller" : "Øvrige") },
};
const GROUP_OPTS = Object.entries(GROUP_DEFS).map(([k, d]) => ({ value: k, label: d.label })).sort((a, b) => a.label.localeCompare(b.label, "nb"));

interface GroupEntry { key: string; label: string; color: string; href?: string; players: CPlayer[] }
function buildGroups(pool: CPlayer[], def: GroupDef, teamById: Record<string, any>): GroupEntry[] {
  const by: Record<string, { key: string; name: string; players: CPlayer[] }> = {};
  for (const p of pool) {
    const k = def.keyOf(p);
    (by[k] ||= { key: k, name: def.nameOf(p), players: [] }).players.push(p);
  }
  const entries = Object.values(by);
  const nameCount: Record<string, number> = {};
  for (const e of entries) nameCount[e.name] = (nameCount[e.name] || 0) + 1;
  return entries.map((e, i) => ({
    key: e.key,
    players: e.players,
    // disambiguate identical short names across divisions (e.g. two "Sarpsborg")
    label: nameCount[e.name] > 1 ? `${e.name} · ${e.players[0].ln}` : e.name,
    color: def.colorOf ? def.colorOf(e.key, i, teamById) : PALETTE[i % PALETTE.length],
    href: def.href ? def.href(e.key) : undefined,
  }));
}

function DistTab({ pool, teamById }: { pool: CPlayer[]; teamById: Record<string, any> }) {
  const [metricKey, setMetricKey] = useState("min");
  const [groupKey, setGroupKey] = useState("team");
  const [group2Key, setGroup2Key] = useState("none");
  const [sort, setSort] = useState<DSort>("mean");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const m = METRICS[metricKey];
  const gdef = GROUP_DEFS[groupKey];

  const all = useMemo(() => values(pool, m), [pool, m]);
  const hist = useMemo(() => histogram(all, 18), [all]);
  const histData = useMemo(() => hist.map((b) => ({ age: b.label, count: b.count })), [hist]);

  const groups = useMemo(() => buildGroups(pool, gdef, teamById), [pool, gdef, teamById]);

  const rows = useMemo<GRow[]>(() => groups.map((g) => {
    const v = values(g.players, m);
    const fn = fiveNumber(v);
    return {
      key: g.key, label: g.label, color: g.color, href: g.href, n: v.length,
      mean: mean(v), median: median(v), sd: stdev(v), min: fn.min, max: fn.max,
      total: v.reduce((s, x) => s + x, 0), q1: fn.q1, q3: fn.q3,
      hist: histogram(v, 12).map((b) => b.count),
    };
  }).filter((r) => r.n > 0), [groups, m]);

  const sorted = useMemo(() => {
    const get = (r: GRow): number | string => (sort === "name" ? r.label : (r as any)[sort]);
    const arr = [...rows].sort((a, b) => {
      const ga = get(a), gb = get(b);
      return typeof ga === "string" ? (ga as string).localeCompare(gb as string, "nb") : (ga as number) - (gb as number);
    });
    return dir === "desc" ? arr.reverse() : arr;
  }, [rows, sort, dir]);

  const onSort = (k: DSort) => { if (sort === k) setDir((d) => (d === "asc" ? "desc" : "asc")); else { setSort(k); setDir(k === "name" ? "asc" : "desc"); } };

  const boxRows = useMemo(() => {
    const dmn = rows.length ? Math.min(...rows.map((r) => r.min)) : 0;
    const dmx = rows.length ? Math.max(...rows.map((r) => r.max)) : 1;
    return {
      dmn, dmx,
      rows: [...rows].sort((a, b) => a.median - b.median).map((r) => ({
        name: r.label, min: round(r.min), q1: round(r.q1), median: round(r.median), q3: round(r.q3), max: round(r.max), color: r.color,
      })),
    };
  }, [rows]);

  // Optional cross-tabulation: aggregate the metric over group1 × group2.
  const cross = useMemo(() => {
    if (group2Key === "none") return null;
    const def2 = GROUP_DEFS[group2Key];
    const cols = buildGroups(pool, def2, teamById)
      .sort((a, b) => (def2.numeric ? Number(a.key) - Number(b.key) : a.label.localeCompare(b.label, "nb")));
    const mat: Record<string, Record<string, number[]>> = {};
    for (const p of pool) {
      if (m.qualified && p.q !== 1) continue;
      const v = m.get(p); if (v == null || !isFinite(v)) continue;
      const k1 = gdef.keyOf(p), k2 = def2.keyOf(p);
      ((mat[k1] ||= {})[k2] ||= []).push(v);
    }
    const agg = (arr?: number[]) => (!arr || !arr.length ? 0 : m.agg === "sum" ? arr.reduce((s, x) => s + x, 0) : arr.reduce((s, x) => s + x, 0) / arr.length);
    return { def2, cols: cols.map((c) => ({ key: c.key, label: c.label })), agg, mat };
  }, [group2Key, pool, gdef, m, teamById]);

  const crossRows = useMemo(() => [...rows].sort((a, b) => b.n - a.n).slice(0, 40), [rows]);

  const f = (n: number) => fmt(n, m.d);
  const gl = gdef.label.toLowerCase();

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Metrikk">
          <Select value={metricKey} onChange={setMetricKey} options={METRIC_OPTS} searchable />
        </Field>
        <Field label="Grupper etter">
          <Select value={groupKey} onChange={(v) => { setGroupKey(v); if (v === group2Key) setGroup2Key("none"); }} options={GROUP_OPTS} />
        </Field>
        <Field label="Kryss med (valgfritt)">
          <Select value={group2Key} onChange={setGroup2Key} options={[{ value: "none", label: "Ingen" }, ...GROUP_OPTS.filter((o) => o.value !== groupKey)]} />
        </Field>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Spillere" value={fmt(all.length)} />
        <Stat label="Snitt" value={f(mean(all))} />
        <Stat label="Median" value={f(median(all))} />
        <Stat label="Std.avvik" value={`±${f(stdev(all))}`} />
        <Stat label="Lavest" value={f(all.length ? Math.min(...all) : 0)} />
        <Stat label="Høyest" value={f(all.length ? Math.max(...all) : 0)} />
      </section>

      <Card className="p-4">
        <h3 className="mb-1 font-semibold">Fordeling — {m.label}</h3>
        <p className="mb-3 text-xs text-muted-foreground">Antall spillere per intervall (hele utvalget).</p>
        <OverlayHistogram data={histData} series={[{ key: "count", name: "Spillere", color: "hsl(var(--primary))" }]} height={280} xUnit="" />
      </Card>

      {cross && (
        <Card className="p-4">
          <h3 className="mb-1 font-semibold">{m.label}: {gl} × {cross.def2.label.toLowerCase()}</h3>
          <p className="mb-3 text-xs text-muted-foreground">{m.agg === "sum" ? "Sum" : "Snitt"} per celle — mørkere = høyere{crossRows.length < rows.length ? ` · viser ${crossRows.length} av ${rows.length} grupper` : ""}.</p>
          <Heatmap
            rows={crossRows.map((r) => ({ key: r.key, label: r.label }))}
            cols={cross.cols}
            value={(rk, ck) => round(cross.agg(cross.mat[rk]?.[ck]))}
            format={(v) => f(v)}
          />
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-semibold">{m.label} per {gl}</h3>
          <span className="text-xs text-muted-foreground">sortert etter median</span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Boks = Q1–Q3, strek = median, linje = laveste→høyeste.</p>
        <BoxPlot rows={boxRows.rows} domainMin={boxRows.dmn} domainMax={boxRows.dmx} />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-4 py-3"><h3 className="font-semibold">Statistikk — {m.label} per {gl}</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <SortHeader label={gdef.label} active={sort === "name"} dir={dir} onClick={() => onSort("name")} align="left" />
                <SortHeader label="N" active={sort === "n"} dir={dir} onClick={() => onSort("n")} />
                <SortHeader label="Snitt" active={sort === "mean"} dir={dir} onClick={() => onSort("mean")} />
                <SortHeader label="Median" active={sort === "median"} dir={dir} onClick={() => onSort("median")} />
                <SortHeader label="SD" active={sort === "sd"} dir={dir} onClick={() => onSort("sd")} />
                <SortHeader label="Min" active={sort === "min"} dir={dir} onClick={() => onSort("min")} />
                <SortHeader label="Maks" active={sort === "max"} dir={dir} onClick={() => onSort("max")} />
                <SortHeader label="Total" active={sort === "total"} dir={dir} onClick={() => onSort("total")} />
                <th className="px-2 py-2.5 text-center font-semibold">Fordeling</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.key} className="border-b border-border/50 transition last:border-0 hover:bg-muted/40">
                  <td className="px-2 py-2">
                    {r.href ? (
                      <Link href={r.href} className="flex items-center gap-2 font-medium hover:text-primary">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: r.color }} />
                        <span className="truncate">{r.label}</span>
                      </Link>
                    ) : (
                      <span className="flex items-center gap-2 font-medium">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: r.color }} />
                        <span className="truncate">{r.label}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-muted-foreground">{r.n}</td>
                  <td className="px-1.5 py-2 text-center font-semibold tabular-nums">{f(r.mean)}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{f(r.median)}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-muted-foreground">{f(r.sd)}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-muted-foreground">{f(r.min)}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-muted-foreground">{f(r.max)}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{fmt(r.total, 0)}</td>
                  <td className="px-2 py-2"><div className="flex justify-center"><MiniHist values={r.hist} color={r.color} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ================================================================ Regression */
const REG_MODE_OPTS = [{ value: "player", label: "Per spiller" }, ...GROUP_OPTS.map((o) => ({ value: o.value, label: `Per ${o.label.toLowerCase()}` }))];

function RegTab({ pool, teamById }: { pool: CPlayer[]; teamById: Record<string, any> }) {
  const [mode, setMode] = useState("team");
  const [xk, setXk] = useState("age");
  const [yk, setYk] = useState("tiv");
  const mx = METRICS[xk], my = METRICS[yk];
  const perPlayer = mode === "player";

  const points = useMemo(() => {
    if (perPlayer) {
      const src = (mx.qualified || my.qualified) ? pool.filter((p) => p.q === 1) : pool;
      return src.map((p) => ({
        id: p.id, name: p.n, sub: `${p.ts} · ${p.pg}`, color: POS_GROUP_COLOR[p.pg] || "#64748b",
        x: round(mx.get(p)), y: round(my.get(p)), r: Math.max(40, p.min / 6),
      })).filter((p) => isFinite(p.x) && isFinite(p.y));
    }
    const def = GROUP_DEFS[mode];
    return buildGroups(pool, def, teamById).map((g) => ({
      id: g.key, name: g.label, sub: `${g.players.length} spillere`, color: g.color,
      x: round(aggregate(g.players, mx)), y: round(aggregate(g.players, my)), r: g.players.length,
    })).filter((p) => isFinite(p.x) && isFinite(p.y));
  }, [mode, perPlayer, pool, teamById, mx, my]);

  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const r = pearson(xs, ys);
  const r2 = r * r;
  // OLS slope/intercept for the equation label
  const n = points.length;
  let slope = 0, intercept = 0;
  if (n > 1) {
    const sx = xs.reduce((s, v) => s + v, 0), sy = ys.reduce((s, v) => s + v, 0);
    const sxy = points.reduce((s, p) => s + p.x * p.y, 0), sxx = xs.reduce((s, v) => s + v * v, 0);
    const den = n * sxx - sx * sx;
    if (den) { slope = (n * sxy - sx * sy) / den; intercept = (sy - slope * sx) / n; }
  }
  const xRef = n ? mean(xs) : undefined;
  const yRef = n ? mean(ys) : undefined;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nivå / gruppe">
          <Select value={mode} onChange={setMode} options={REG_MODE_OPTS} />
        </Field>
        <Field label="X-akse"><Select value={xk} onChange={setXk} options={METRIC_OPTS} searchable /></Field>
        <Field label="Y-akse"><Select value={yk} onChange={setYk} options={METRIC_OPTS} searchable /></Field>
        <div className="flex flex-wrap items-end gap-2">
          <Badge tone={Math.abs(r) < 0.2 ? "muted" : Math.abs(r) < 0.5 ? "low" : "good"}>r = {signed(r, 2)}</Badge>
          <Badge tone="muted">R² = {fmt(r2, 2)}</Badge>
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{mx.label} <span className="text-muted-foreground">vs</span> {my.label}</p>
          <p className="text-xs text-muted-foreground">
            {n} {perPlayer ? "spillere" : "punkter"} · y = {fmt(slope, 3)}·x {intercept >= 0 ? "+" : "−"} {fmt(Math.abs(intercept), 2)}
          </p>
        </div>
        <ScatterLab points={points} xLabel={mx.label} yLabel={my.label} xRef={xRef} yRef={yRef} trend height={460} />
        <p className="mt-2 text-xs text-muted-foreground">
          Stiplet lilla linje = OLS-regresjon. {Math.abs(r) < 0.2 ? "Ingen tydelig lineær sammenheng." : `${r > 0 ? "Positiv" : "Negativ"} sammenheng — forklarer ${fmt(r2 * 100, 0)} % av variasjonen.`}
        </p>
      </Card>
    </div>
  );
}

/* =================================================================== Geography */
function GeoTab({ pool }: { pool: CPlayer[] }) {
  const byFylke = useMemo(() => {
    const by: Record<string, CPlayer[]> = {};
    for (const p of pool) (by[p.fy] ||= []).push(p);
    return Object.entries(by).map(([fy, ps]) => ({
      fy, n: ps.length,
      age: mean(ps.map((p) => p.age)),
      nat: ps.filter((p) => p.nat === 1).length,
      impact: mean(ps.filter((p) => p.q === 1).map((p) => p.tiv ?? 0)),
      goals: ps.reduce((s, p) => s + p.gls, 0),
    })).sort((a, b) => b.n - a.n);
  }, [pool]);

  const rankData = byFylke.map((f) => ({ name: f.fy, value: f.n }));
  const natShare = useMemo(() => {
    const nat = pool.filter((p) => p.nat === 1).length;
    return [
      { name: "Landslagsspillere", value: nat, color: "hsl(var(--chart-2))" },
      { name: "Øvrige", value: pool.length - nat, color: "hsl(var(--muted))" },
    ];
  }, [pool]);

  const [sort, setSort] = useState<"n" | "age" | "nat" | "impact" | "goals" | "fy">("n");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const sorted = useMemo(() => {
    const get = (f: typeof byFylke[number]): number | string => (sort === "fy" ? f.fy : sort === "nat" ? f.nat / f.n : (f as any)[sort]);
    const arr = [...byFylke].sort((a, b) => {
      const ga = get(a), gb = get(b);
      return typeof ga === "string" ? (ga as string).localeCompare(gb as string, "nb") : (ga as number) - (gb as number);
    });
    return dir === "desc" ? arr.reverse() : arr;
  }, [byFylke, sort, dir]);
  const onSort = (k: typeof sort) => { if (sort === k) setDir((d) => (d === "asc" ? "desc" : "asc")); else { setSort(k); setDir(k === "fy" ? "asc" : "desc"); } };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-1 font-semibold">Spillere per fylke</h3>
          <p className="mb-3 text-xs text-muted-foreground">Geografisk opphav (modellert).</p>
          <RankBarChart data={rankData} height={Math.max(280, rankData.length * 26)} unit=" spillere" />
        </Card>
        <Card className="p-4">
          <h3 className="mb-1 font-semibold">Landslagsandel</h3>
          <p className="mb-3 text-xs text-muted-foreground">Andel med landskamper.</p>
          <DonutChart segments={natShare} height={220} />
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-4 py-3"><h3 className="font-semibold">Fylkesstatistikk</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <SortHeader label="Fylke" active={sort === "fy"} dir={dir} onClick={() => onSort("fy")} align="left" />
                <SortHeader label="Spillere" active={sort === "n"} dir={dir} onClick={() => onSort("n")} />
                <SortHeader label="Snittalder" active={sort === "age"} dir={dir} onClick={() => onSort("age")} />
                <SortHeader label="% landslag" active={sort === "nat"} dir={dir} onClick={() => onSort("nat")} />
                <SortHeader label="Snitt impact" active={sort === "impact"} dir={dir} onClick={() => onSort("impact")} />
                <SortHeader label="Mål" active={sort === "goals"} dir={dir} onClick={() => onSort("goals")} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => (
                <tr key={f.fy} className="border-b border-border/50 last:border-0 hover:bg-muted/40">
                  <td className="px-2 py-2 font-medium">{f.fy}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{f.n}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{fmt(f.age, 1)}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-amber-500">{fmt((f.nat / f.n) * 100, 0)} %</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{signed(f.impact, 2)}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-muted-foreground">{f.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function round(n: number) { return Math.round(n * 100) / 100; }
