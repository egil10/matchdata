"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePlayers, useTeams, useLeagues, useGender, type CPlayer } from "@/lib/client";
import { fmt, signed } from "@/lib/format";
import { mean, median, stdev, weightedMean, fiveNumber, pearson } from "@/lib/stats";
import { POS_GROUP_COLOR } from "@/lib/metrics";
import { PageHeader, Card, Stat, Badge, Avatar, Meter } from "@/components/ui/primitives";
import { Field, Select, SortHeader } from "@/components/ui/controls";
import { Tabs } from "@/components/ui/tabs";
import { BoxPlot, Heatmap, MiniHist, SegBar, LegendChips } from "@/components/dataviz";
import { AgeHistogram, OverlayHistogram, ScatterLab, StackedBars } from "@/components/charts-lazy";

/* Age bands — shared definition */
const BANDS = [
  { key: "u21", label: "U21", short: "≤20", test: (a: number) => a <= 20, color: "#22c55e" },
  { key: "b2125", label: "21–25", short: "21–25", test: (a: number) => a >= 21 && a <= 25, color: "#0ea5e9" },
  { key: "b2629", label: "26–29", short: "26–29", test: (a: number) => a >= 26 && a <= 29, color: "#f59e0b" },
  { key: "o30", label: "30+", short: "≥30", test: (a: number) => a >= 30, color: "#ef4444" },
] as const;

const POS_GROUPS = [
  { key: "Keeper", label: "Keeper" },
  { key: "Forsvar", label: "Forsvar" },
  { key: "Midtbane", label: "Midtbane" },
  { key: "Angrep", label: "Angrep" },
] as const;

const band = (a: number) => BANDS.find((b) => b.test(a))!.key;

type TeamAgg = {
  id: string; name: string; color: string; n: number;
  mean: number; median: number; sd: number; min: number; max: number;
  q1: number; q3: number; weighted: number; bands: Record<string, number>;
  ages: number[]; hist: number[]; ppg: number | null; pts: number | null;
};

export default function AlderPage() {
  const gender = useGender();
  const players = usePlayers();
  const teams = useTeams();
  const leagues = useLeagues();
  const [league, setLeague] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);

  const pool = useMemo(
    () => (players || []).filter((p) => p.g === gender && (league === "all" || p.lg === league)),
    [players, gender, league],
  );
  const leaguesG = useMemo(() => (leagues || []).filter((l) => l.gender === gender), [leagues, gender]);
  const teamById = useMemo(() => Object.fromEntries((teams || []).map((t) => [t.id, t])), [teams]);

  const ages = useMemo(() => pool.map((p) => p.age), [pool]);
  const ageMin = ages.length ? Math.min(...ages) : 16;
  const ageMax = ages.length ? Math.max(...ages) : 40;

  /* overall histogram by single age */
  const ageRange = useMemo(() => {
    const r: number[] = [];
    for (let a = ageMin; a <= ageMax; a++) r.push(a);
    return r;
  }, [ageMin, ageMax]);

  const bars = useMemo(() => {
    const by: Record<number, number> = {};
    for (const p of pool) by[p.age] = (by[p.age] || 0) + 1;
    return ageRange.map((a) => ({ birthYear: a, age: a, count: by[a] || 0 }));
  }, [pool, ageRange]);

  /* distribution by position group (stacked) */
  const posDist = useMemo(() => {
    return ageRange.map((a) => {
      const row: Record<string, number> = { age: a };
      for (const g of POS_GROUPS) row[g.key] = 0;
      for (const p of pool) if (p.age === a) row[p.pg] = (row[p.pg] || 0) + 1;
      return row;
    });
  }, [pool, ageRange]);

  /* per-team aggregates */
  const teamAggs = useMemo<TeamAgg[]>(() => {
    const byTeam: Record<string, CPlayer[]> = {};
    for (const p of pool) (byTeam[p.ti] ||= []).push(p);
    return Object.entries(byTeam).map(([id, ps]) => {
      const a = ps.map((p) => p.age);
      const fn = fiveNumber(a);
      const bands: Record<string, number> = {};
      for (const b of BANDS) bands[b.key] = 0;
      for (const ag of a) bands[band(ag)]++;
      const hist = ageRange.map((y) => a.filter((x) => x === y).length);
      const t = teamById[id];
      const ppg = t && t.pl ? t.pts / t.pl : null;
      return {
        id, name: ps[0].ts, color: t?.color || "#64748b", n: a.length,
        mean: mean(a), median: median(a), sd: stdev(a), min: fn.min, max: fn.max,
        q1: fn.q1, q3: fn.q3, weighted: weightedMean(a, ps.map((p) => p.min)),
        bands, ages: a, hist, ppg, pts: t?.pts ?? null,
      };
    }).sort((x, y) => x.mean - y.mean);
  }, [pool, ageRange, teamById]);

  /* headline numbers */
  const avg = mean(ages);
  const med = median(ages);
  const sd = stdev(ages);
  const totalMin = pool.reduce((s, p) => s + p.min, 0);
  const weighted = totalMin ? pool.reduce((s, p) => s + p.age * p.min, 0) / totalMin : 0;
  const youngest = ages.length ? Math.min(...ages) : 0;
  const oldest = ages.length ? Math.max(...ages) : 0;
  const pctU21 = pool.length ? (pool.filter((p) => p.age <= 20).length / pool.length) * 100 : 0;
  const pct30 = pool.length ? (pool.filter((p) => p.age >= 30).length / pool.length) * 100 : 0;

  const selectedPlayers = useMemo(
    () => (selected != null ? pool.filter((p) => p.age === selected).sort((a, b) => b.min - a.min) : []),
    [pool, selected],
  );

  return (
    <div>
      <PageHeader
        title="Alderslaboratorium"
        subtitle="Fordelinger, kvartiler og lag-for-lag-sammenligning av spilleralder — ikke bare snitt."
        badge={<Badge tone="low">Modellert</Badge>}
        actions={
          <Field>
            <Select value={league} onChange={(v) => { setLeague(v); setSelected(null); }} options={[{ value: "all", label: "Alle ligaer" }, ...leaguesG.map((l) => ({ value: l.id, label: l.name }))]} />
          </Field>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Spillere" value={fmt(pool.length)} sub={`${teamAggs.length} lag`} />
        <Stat label="Snittalder" value={fmt(avg, 1)} sub={`median ${fmt(med, 1)}`} />
        <Stat label="Spredning (SD)" value={`±${fmt(sd, 1)}`} sub="standardavvik" />
        <Stat label="Vektet alder" value={fmt(weighted, 1)} sub="etter spilletid" />
        <Stat label="Andel U21" value={`${fmt(pctU21, 0)} %`} sub={`≤20 år`} tone="good" />
        <Stat label="Andel 30+" value={`${fmt(pct30, 0)} %`} sub="≥30 år" tone="low" />
      </section>

      {!players ? (
        <p className="text-sm text-muted-foreground">Laster…</p>
      ) : (
        <Tabs
          items={[
            {
              id: "oversikt",
              label: "Oversikt",
              content: (
                <Overview
                  bars={bars} selected={selected} setSelected={setSelected}
                  selectedPlayers={selectedPlayers} posDist={posDist} pool={pool}
                />
              ),
            },
            { id: "lag", label: "Lag", content: <TeamsTab aggs={teamAggs} domainMin={ageMin} domainMax={ageMax} /> },
            { id: "sammenlign", label: "Sammenlign lag", content: <CompareTab aggs={teamAggs} ageRange={ageRange} domainMin={ageMin} domainMax={ageMax} /> },
            { id: "monstre", label: "Mønstre", content: <PatternsTab aggs={teamAggs} pool={pool} ageRange={ageRange} /> },
          ]}
        />
      )}
    </div>
  );
}

/* ============================================================ Overview tab */
function Overview({
  bars, selected, setSelected, selectedPlayers, posDist, pool,
}: {
  bars: { birthYear: number; age: number; count: number }[];
  selected: number | null; setSelected: (f: (s: number | null) => number | null) => void;
  selectedPlayers: CPlayer[]; posDist: Record<string, number>[]; pool: CPlayer[];
}) {
  const bandCounts = useMemo(() => {
    return BANDS.map((b) => ({ ...b, value: pool.filter((p) => b.test(p.age)).length }));
  }, [pool]);
  const total = pool.length || 1;

  // minutes share by band — "who actually gets minutes"
  const bandMinutes = useMemo(() => {
    const totalMin = pool.reduce((s, p) => s + p.min, 0) || 1;
    return BANDS.map((b) => {
      const m = pool.filter((p) => b.test(p.age)).reduce((s, p) => s + p.min, 0);
      return { ...b, share: (m / totalMin) * 100, squadShare: (pool.filter((p) => b.test(p.age)).length / pool.length) * 100 };
    });
  }, [pool]);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="mb-1 font-semibold">Antall spillere per alder</h3>
        <p className="mb-3 text-xs text-muted-foreground">Klikk en søyle for å liste spillerne.</p>
        <AgeHistogram bars={bars} selected={selected} onSelect={(yr) => setSelected((s) => (s === yr ? null : yr))} height={300} />
      </Card>

      {selected != null && (
        <Card className="animate-fade-in p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{selected} år <span className="text-muted-foreground">({selectedPlayers.length} spillere)</span></h3>
            <button onClick={() => setSelected(() => null)} className="text-sm text-muted-foreground hover:text-foreground">Lukk</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {selectedPlayers.slice(0, 60).map((p) => (
              <Link key={p.id} href={`/spiller/${p.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 transition hover:border-primary/40">
                <Avatar name={p.n} posGroup={p.pg} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.n}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.ts} · {p.pg}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{fmt(p.min)} min</p>
                  <p>{p.gls} mål</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-1 font-semibold">Fordeling etter posisjon</h3>
          <p className="mb-3 text-xs text-muted-foreground">Stablet aldershistogram per posisjonsgruppe.</p>
          <OverlayHistogram
            stack
            data={posDist}
            series={POS_GROUPS.map((g) => ({ key: g.key, name: g.label, color: POS_GROUP_COLOR[g.key] }))}
            height={280}
          />
        </Card>

        <Card className="p-4">
          <h3 className="mb-1 font-semibold">Aldersgrupper</h3>
          <p className="mb-3 text-xs text-muted-foreground">Tropp-andel vs. spilletid-andel per aldersgruppe.</p>
          <div className="space-y-3">
            {bandMinutes.map((b) => (
              <div key={b.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: b.color }} />{b.label}</span>
                  <span className="text-xs text-muted-foreground">{fmt(b.squadShare, 0)} % tropp · <span className="font-medium text-foreground">{fmt(b.share, 0)} % spilletid</span></span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Meter value={b.squadShare} max={100} color={`${b.color}99`} />
                  <Meter value={b.share} max={100} color={b.color} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {bandCounts.map((b) => (
              <div key={b.key} className="rounded-lg border border-border p-2 text-center">
                <p className="stat-num text-lg font-bold" style={{ color: b.color }}>{b.value}</p>
                <p className="text-[11px] text-muted-foreground">{b.label}</p>
                <p className="text-[10px] text-muted-foreground/70">{fmt((b.value / total) * 100, 0)} %</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* =============================================================== Teams tab */
type SortKey = "name" | "n" | "mean" | "median" | "sd" | "min" | "max" | "u21" | "o30" | "weighted";

function TeamsTab({ aggs, domainMin, domainMax }: { aggs: TeamAgg[]; domainMin: number; domainMax: number }) {
  const [sort, setSort] = useState<SortKey>("mean");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [percent, setPercent] = useState(true);

  const sorted = useMemo(() => {
    const get = (a: TeamAgg): number | string => {
      switch (sort) {
        case "name": return a.name;
        case "n": return a.n;
        case "u21": return a.bands.u21 / a.n;
        case "o30": return a.bands.o30 / a.n;
        default: return (a as any)[sort];
      }
    };
    const arr = [...aggs].sort((x, y) => {
      const gx = get(x), gy = get(y);
      if (typeof gx === "string") return (gx as string).localeCompare(gy as string);
      return (gx as number) - (gy as number);
    });
    return dir === "desc" ? arr.reverse() : arr;
  }, [aggs, sort, dir]);

  const onSort = (k: SortKey) => {
    if (sort === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(k); setDir(k === "name" ? "asc" : "desc"); }
  };

  // box-plot rows sorted by median
  const boxRows = useMemo(
    () => [...aggs].sort((a, b) => a.median - b.median).map((a) => ({ name: a.name, min: a.min, q1: Math.round(a.q1 * 10) / 10, median: Math.round(a.median * 10) / 10, q3: Math.round(a.q3 * 10) / 10, max: a.max, color: a.color, n: a.n })),
    [aggs],
  );

  // stacked age-band bars
  const stackData = useMemo(
    () => [...aggs].sort((a, b) => a.mean - b.mean).map((a) => ({ name: a.name, ...a.bands })),
    [aggs],
  );

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-semibold">Aldersspredning per lag</h3>
          <span className="text-xs text-muted-foreground">sortert etter median</span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Boks = kvartilbredde (Q1–Q3), strek = median, linje = yngste→eldste.</p>
        <BoxPlot rows={boxRows} domainMin={domainMin} domainMax={domainMax} unit=" år" />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold">Lagstatistikk</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <SortHeader label="Lag" active={sort === "name"} dir={dir} onClick={() => onSort("name")} align="left" />
                <SortHeader label="N" active={sort === "n"} dir={dir} onClick={() => onSort("n")} />
                <SortHeader label="Snitt" active={sort === "mean"} dir={dir} onClick={() => onSort("mean")} />
                <SortHeader label="Median" active={sort === "median"} dir={dir} onClick={() => onSort("median")} />
                <SortHeader label="SD" active={sort === "sd"} dir={dir} onClick={() => onSort("sd")} />
                <SortHeader label="Vektet" active={sort === "weighted"} dir={dir} onClick={() => onSort("weighted")} />
                <SortHeader label="Yngst" active={sort === "min"} dir={dir} onClick={() => onSort("min")} />
                <SortHeader label="Eldst" active={sort === "max"} dir={dir} onClick={() => onSort("max")} />
                <SortHeader label="%U21" active={sort === "u21"} dir={dir} onClick={() => onSort("u21")} />
                <SortHeader label="%30+" active={sort === "o30"} dir={dir} onClick={() => onSort("o30")} />
                <th className="px-2 py-2.5 text-center font-semibold">Fordeling</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id} className="border-b border-border/50 transition last:border-0 hover:bg-muted/40">
                  <td className="px-2 py-2">
                    <Link href={`/lag/${a.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: a.color }} />
                      <span className="truncate">{a.name}</span>
                    </Link>
                  </td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-muted-foreground">{a.n}</td>
                  <td className="px-1.5 py-2 text-center font-semibold tabular-nums">{fmt(a.mean, 1)}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{fmt(a.median, 1)}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-muted-foreground">{fmt(a.sd, 1)}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{fmt(a.weighted, 1)}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-muted-foreground">{a.min}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-muted-foreground">{a.max}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-emerald-500">{fmt((a.bands.u21 / a.n) * 100, 0)}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-rose-500">{fmt((a.bands.o30 / a.n) * 100, 0)}</td>
                  <td className="px-2 py-2">
                    <div className="flex justify-center"><MiniHist values={a.hist} color={a.color} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Aldersgrupper per lag</h3>
            <p className="text-xs text-muted-foreground">{percent ? "Andel av tropp" : "Antall spillere"} per aldersgruppe.</p>
          </div>
          <button onClick={() => setPercent((v) => !v)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">
            {percent ? "Vis antall" : "Vis prosent"}
          </button>
        </div>
        <LegendChips className="mb-3" items={BANDS.map((b) => ({ label: b.label, color: b.color }))} />
        <OverlayHistogramStacked data={stackData} percent={percent} />
      </Card>
    </div>
  );
}

function OverlayHistogramStacked({ data, percent }: { data: Record<string, any>[]; percent: boolean }) {
  return (
    <StackedBars
      data={data}
      xKey="name"
      percent={percent}
      height={Math.max(260, data.length * 26)}
      keys={BANDS.map((b) => ({ key: b.key, label: b.label, color: b.color }))}
    />
  );
}

/* ============================================================ Compare tab */
function CompareTab({ aggs, ageRange, domainMin, domainMax }: { aggs: TeamAgg[]; ageRange: number[]; domainMin: number; domainMax: number }) {
  const opts = aggs.map((a) => ({ value: a.id, label: a.name }));
  const sortedByName = [...aggs].sort((a, b) => a.name.localeCompare(b.name));
  const [aId, setAId] = useState(sortedByName[0]?.id || "");
  const [bId, setBId] = useState(sortedByName[1]?.id || sortedByName[0]?.id || "");
  const A = aggs.find((x) => x.id === aId);
  const B = aggs.find((x) => x.id === bId);

  const overlay = useMemo(() => {
    if (!A || !B) return [];
    return ageRange.map((age, i) => ({ age, [A.name]: A.hist[i], [B.name]: B.hist[i] }));
  }, [A, B, ageRange]);

  const rows: { label: string; a: number; b: number; fmt?: (n: number) => string }[] = A && B ? [
    { label: "Spillere", a: A.n, b: B.n },
    { label: "Snittalder", a: A.mean, b: B.mean, fmt: (n) => fmt(n, 1) },
    { label: "Median", a: A.median, b: B.median, fmt: (n) => fmt(n, 1) },
    { label: "Vektet (spilletid)", a: A.weighted, b: B.weighted, fmt: (n) => fmt(n, 1) },
    { label: "Spredning (SD)", a: A.sd, b: B.sd, fmt: (n) => fmt(n, 1) },
    { label: "Yngste", a: A.min, b: B.min },
    { label: "Eldste", a: A.max, b: B.max },
    { label: "Spenn (eldst−yngst)", a: A.max - A.min, b: B.max - B.min },
    { label: "U21-spillere", a: A.bands.u21, b: B.bands.u21 },
    { label: "30+-spillere", a: A.bands.o30, b: B.bands.o30 },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lag A"><Select value={aId} onChange={setAId} options={opts} className="w-full" /></Field>
        <Field label="Lag B"><Select value={bId} onChange={setBId} options={opts} className="w-full" /></Field>
      </div>

      {A && B && (
        <>
          <Card className="p-4">
            <h3 className="mb-1 font-semibold">Aldersfordeling side om side</h3>
            <LegendChips className="mb-3" items={[{ label: A.name, color: A.color }, { label: B.name, color: B.color }]} />
            <OverlayHistogram
              data={overlay}
              series={[{ key: A.name, name: A.name, color: A.color }, { key: B.name, name: B.name, color: B.color }]}
              height={300}
            />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="grid grid-cols-3 border-b border-border bg-muted/40 text-sm font-semibold">
                <div className="px-3 py-2 text-right" style={{ color: A.color }}>{A.name}</div>
                <div className="px-3 py-2 text-center text-muted-foreground">Statistikk</div>
                <div className="px-3 py-2 text-left" style={{ color: B.color }}>{B.name}</div>
              </div>
              {rows.map((r) => {
                const f = r.fmt || ((n: number) => fmt(n, 0));
                const aWin = r.a < r.b; // younger highlighted as "a"
                const close = r.a === r.b;
                return (
                  <div key={r.label} className="grid grid-cols-3 border-b border-border/50 text-sm last:border-0">
                    <div className={`px-3 py-2 text-right tabular-nums ${!close && aWin ? "font-bold text-emerald-500" : ""}`}>{f(r.a)}</div>
                    <div className="px-3 py-2 text-center text-xs text-muted-foreground">{r.label}</div>
                    <div className={`px-3 py-2 text-left tabular-nums ${!close && !aWin ? "font-bold text-emerald-500" : ""}`}>{f(r.b)}</div>
                  </div>
                );
              })}
              <p className="px-3 py-2 text-[11px] text-muted-foreground">Grønt = yngre verdi.</p>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 font-semibold">Kvartiler</h3>
              <BoxPlot
                rows={[
                  { name: A.name, min: A.min, q1: Math.round(A.q1 * 10) / 10, median: Math.round(A.median * 10) / 10, q3: Math.round(A.q3 * 10) / 10, max: A.max, color: A.color },
                  { name: B.name, min: B.min, q1: Math.round(B.q1 * 10) / 10, median: Math.round(B.median * 10) / 10, q3: Math.round(B.q3 * 10) / 10, max: B.max, color: B.color },
                ]}
                domainMin={domainMin} domainMax={domainMax} unit=" år"
              />
              <h4 className="mb-2 mt-5 text-sm font-semibold">Aldersgrupper</h4>
              <div className="space-y-3">
                {[A, B].map((T) => (
                  <div key={T.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium" style={{ color: T.color }}>{T.name}</span>
                      <span className="text-muted-foreground">{T.n} spillere</span>
                    </div>
                    <SegBar segments={BANDS.map((bd) => ({ value: T.bands[bd.key], color: bd.color, label: bd.label }))} height={10} />
                  </div>
                ))}
              </div>
              <LegendChips className="mt-3" items={BANDS.map((b) => ({ label: b.label, color: b.color }))} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================ Patterns tab */
function PatternsTab({ aggs, pool, ageRange }: { aggs: TeamAgg[]; pool: CPlayer[]; ageRange: number[] }) {
  // scatter: mean age vs points-per-game
  const scatter = useMemo(() => {
    return aggs.filter((a) => a.ppg != null).map((a) => ({
      x: Math.round(a.mean * 10) / 10, y: Math.round((a.ppg as number) * 100) / 100,
      name: a.name, sub: `${a.n} spillere · snitt ${fmt(a.mean, 1)} år`, color: a.color, id: a.id, r: a.n,
    }));
  }, [aggs]);
  const r = useMemo(() => pearson(scatter.map((p) => p.x), scatter.map((p) => p.y)), [scatter]);
  const meanAgeAll = scatter.length ? mean(scatter.map((p) => p.x)) : 0;
  const meanPpg = scatter.length ? mean(scatter.map((p) => p.y)) : 0;

  // heatmap team × age band (count)
  const hmRows = useMemo(() => [...aggs].sort((a, b) => a.mean - b.mean).map((a) => ({ key: a.id, label: a.name })), [aggs]);
  const bandLookup = useMemo(() => Object.fromEntries(aggs.map((a) => [a.id, a.bands])), [aggs]);

  // minutes vs age — avg minutes by age (who actually plays)
  const minByAge = useMemo(() => {
    return ageRange.map((age) => {
      const ps = pool.filter((p) => p.age === age);
      const avgMin = ps.length ? ps.reduce((s, p) => s + p.min, 0) / ps.length : 0;
      return { age, min: Math.round(avgMin) };
    });
  }, [pool, ageRange]);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-semibold">Snittalder vs. poeng per kamp</h3>
          <Badge tone={Math.abs(r) < 0.2 ? "muted" : r < 0 ? "good" : "low"}>r = {signed(r, 2)}</Badge>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Hvert punkt er et lag (størrelse = troppstørrelse). Stiplet linje = ligasnitt. {Math.abs(r) < 0.2 ? "Ingen tydelig sammenheng mellom alder og resultater." : r < 0 ? "Yngre lag tenderer mot flere poeng." : "Eldre lag tenderer mot flere poeng."}</p>
        <ScatterLab points={scatter} xLabel="Snittalder" yLabel="Poeng/kamp" xRef={Math.round(meanAgeAll * 10) / 10} yRef={Math.round(meanPpg * 100) / 100} height={420} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-1 font-semibold">Spilletid etter alder</h3>
          <p className="mb-3 text-xs text-muted-foreground">Gjennomsnittlig antall minutter per spiller i hver alder.</p>
          <OverlayHistogram
            data={minByAge}
            series={[{ key: "min", name: "Snitt minutter", color: "hsl(var(--primary))" }]}
            height={280}
          />
        </Card>

        <Card className="p-4">
          <h3 className="mb-1 font-semibold">Lag × aldersgruppe</h3>
          <p className="mb-3 text-xs text-muted-foreground">Antall spillere — mørkere = flere.</p>
          <Heatmap
            rows={hmRows}
            cols={BANDS.map((b) => ({ key: b.key, label: b.label }))}
            value={(rk, ck) => bandLookup[rk]?.[ck] ?? 0}
          />
        </Card>
      </div>
    </div>
  );
}
