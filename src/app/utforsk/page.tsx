"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { usePlayers, useLeagues, useGender, type CPlayer } from "@/lib/client";
import { fmt, signed } from "@/lib/format";
import { POS_GROUP_COLOR, teamImpactTier, TONE_TEXT } from "@/lib/metrics";
import { PageHeader, Card, Badge, Avatar } from "@/components/ui/primitives";
import { Field, Select, Toggle } from "@/components/ui/controls";
import { ScatterLab } from "@/components/charts";

const g90 = (p: CPlayer) => (p.min ? (p.gls * 90) / p.min : 0);
const METRICS: Record<string, { label: string; get: (p: CPlayer) => number; d: number }> = {
  min: { label: "Spilletid (min)", get: (p) => p.min, d: 0 },
  tiv: { label: "Team Impact", get: (p) => p.tiv ?? 0, d: 2 },
  pm: { label: "+/−/90", get: (p) => p.pm, d: 2 },
  gls: { label: "Mål", get: (p) => p.gls, d: 0 },
  g90: { label: "Mål per 90", get: g90, d: 2 },
  ppg: { label: "Poeng/kamp", get: (p) => p.ppg, d: 2 },
  age: { label: "Alder", get: (p) => p.age, d: 0 },
  st: { label: "Starter", get: (p) => p.st, d: 0 },
};
const PRESETS: { label: string; x: string; y: string }[] = [
  { label: "Spilletid vs Impact", x: "min", y: "tiv" },
  { label: "Alder vs Impact", x: "age", y: "tiv" },
  { label: "Mål/90 vs +/−/90", x: "g90", y: "pm" },
  { label: "Mål vs Spilletid", x: "min", y: "gls" },
];

export default function UtforskPage() {
  const gender = useGender();
  const players = usePlayers();
  const leagues = useLeagues();
  const [x, setX] = useState("min");
  const [y, setY] = useState("tiv");
  const [league, setLeague] = useState("all");
  const [minMin, setMinMin] = useState(270);
  const [colorByLeague, setColorByLeague] = useState(false);
  const [sel, setSel] = useState<string | null>(null);

  const leaguesG = useMemo(() => (leagues || []).filter((l) => l.gender === gender), [leagues, gender]);
  const leagueColor = useMemo(() => Object.fromEntries((leagues || []).map((l) => [l.id, l.color])), [leagues]);

  const pool = useMemo(
    () => (players || []).filter((p) => p.g === gender && (league === "all" || p.lg === league) && p.min >= minMin && (x !== "tiv" && y !== "tiv" ? true : p.q === 1)),
    [players, gender, league, minMin, x, y],
  );

  const points = useMemo(() => {
    const gx = METRICS[x].get, gy = METRICS[y].get;
    return pool.map((p) => ({
      id: p.id, name: p.n, sub: `${p.ts} · ${p.pg}`,
      x: Math.round(gx(p) * 100) / 100, y: Math.round(gy(p) * 100) / 100,
      r: Math.max(40, p.min / 6),
      color: colorByLeague ? (leagueColor[p.lg] || "#64748b") : (POS_GROUP_COLOR[p.pg] || "#64748b"),
    }));
  }, [pool, x, y, colorByLeague, leagueColor]);

  const xRef = points.length ? points.reduce((s, p) => s + p.x, 0) / points.length : undefined;
  const yRef = points.length ? points.reduce((s, p) => s + p.y, 0) / points.length : undefined;
  const selected = sel ? (players || []).find((p) => p.id === sel) : null;

  return (
    <div>
      <PageHeader
        title="Utforsk"
        subtitle="Tegn hvilken som helst metrikk mot en annen. Klikk et punkt for detaljer."
        badge={<Badge tone="low">Modellert</Badge>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((pre) => (
          <button
            key={pre.label}
            onClick={() => { setX(pre.x); setY(pre.y); }}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            {pre.label}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="X-akse"><Select value={x} onChange={setX} options={Object.entries(METRICS).map(([k, m]) => ({ value: k, label: m.label }))} /></Field>
        <Field label="Y-akse"><Select value={y} onChange={setY} options={Object.entries(METRICS).map(([k, m]) => ({ value: k, label: m.label }))} /></Field>
        <Field label="Liga"><Select value={league} onChange={setLeague} options={[{ value: "all", label: "Alle" }, ...leaguesG.map((l) => ({ value: l.id, label: l.name }))]} /></Field>
        <Field label={`Min. spilletid: ${minMin}`}><input type="range" min={0} max={2000} step={90} value={minMin} onChange={(e) => setMinMin(+e.target.value)} className="h-9 w-full accent-[hsl(var(--primary))]" /></Field>
        <div className="flex items-end"><Toggle checked={colorByLeague} onChange={setColorByLeague} label={colorByLeague ? "Farge: Liga" : "Farge: Posisjon"} /></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-medium">{METRICS[x].label} <span className="text-muted-foreground">vs</span> {METRICS[y].label}</p>
            <p className="text-xs text-muted-foreground">{points.length} spillere</p>
          </div>
          {players ? <ScatterLab points={points} xLabel={METRICS[x].label} yLabel={METRICS[y].label} xRef={xRef} yRef={yRef} onSelect={setSel} /> : <div className="grid h-[460px] place-items-center text-sm text-muted-foreground">Laster…</div>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {!colorByLeague && Object.entries(POS_GROUP_COLOR).map(([g, c]) => (
              <span key={g} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{g}</span>
            ))}
            <span className="ml-auto">Boblestørrelse = spilletid · stiplet linje = snitt</span>
          </div>
        </Card>

        <Card className="p-5">
          {selected ? (
            <div className="animate-fade-in">
              <div className="mb-3 flex items-center gap-3">
                <Avatar name={selected.n} posGroup={selected.pg} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{selected.n}</p>
                  <p className="truncate text-sm text-muted-foreground">{selected.tm} · {selected.pg}</p>
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                <Stat2 k="Alder" v={`${selected.age} år`} />
                <Stat2 k="Spilletid" v={`${fmt(selected.min)} min`} />
                <Stat2 k="Mål" v={selected.gls} />
                <Stat2 k="+/−/90" v={signed(selected.pm, 2)} />
                <Stat2 k="Team Impact" v={selected.tiv == null ? "–" : signed(selected.tiv, 2)} tone />
              </dl>
              <Link href={`/spiller/${selected.id}`} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                Se profil <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid h-full min-h-[200px] place-items-center text-center text-sm text-muted-foreground">
              Klikk et punkt i diagrammet for å se spilleren her.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat2({ k, v, tone }: { k: string; v: React.ReactNode; tone?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="stat-num font-semibold">{v}</dd>
    </div>
  );
}
