"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { usePlayers, useGender, useDebounced, type CPlayer } from "@/lib/client";
import { cn } from "@/lib/cn";
import { fmt, signed } from "@/lib/format";
import { teamImpactTier, TONE_TEXT } from "@/lib/metrics";
import { PageHeader, Card, Avatar, Badge } from "@/components/ui/primitives";
import { SearchInput } from "@/components/ui/controls";
import { RadarStat } from "@/components/charts-lazy";
import { CHART } from "@/lib/colors";

const ROWS: { key: keyof CPlayer | "g90"; label: string; dir: 1 | -1; d: number }[] = [
  { key: "k", label: "Kamper", dir: 1, d: 0 },
  { key: "st", label: "Starter", dir: 1, d: 0 },
  { key: "w", label: "Seire", dir: 1, d: 0 },
  { key: "l", label: "Tap", dir: -1, d: 0 },
  { key: "ppg", label: "Poeng per kamp", dir: 1, d: 2 },
  { key: "gls", label: "Mål", dir: 1, d: 0 },
  { key: "min", label: "Minutter", dir: 1, d: 0 },
  { key: "pm", label: "+/−/90", dir: 1, d: 2 },
  { key: "tiv", label: "Team Impact", dir: 1, d: 2 },
];

function PlayerPicker({ pool, onPick }: { pool: CPlayer[]; onPick: (p: CPlayer) => void }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 150);
  const matches = useMemo(() => {
    const ql = dq.trim().toLowerCase();
    if (!ql) return [];
    return pool.filter((p) => p.n.toLowerCase().includes(ql)).slice(0, 8);
  }, [pool, dq]);
  return (
    <div className="relative">
      <SearchInput value={q} onChange={setQ} placeholder="Søk spiller…" />
      {matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
          {matches.map((p) => (
            <button key={p.id} onClick={() => { onPick(p); setQ(""); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
              <Avatar name={p.n} posGroup={p.pg} size="sm" />
              <span className="flex-1 truncate">{p.n}</span>
              <span className="text-xs text-muted-foreground">{p.ts}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CompareInner() {
  const gender = useGender();
  const players = usePlayers();
  const router = useRouter();
  const sp = useSearchParams();
  const pool = useMemo(() => (players || []).filter((p) => p.g === gender), [players, gender]);
  const byId = useMemo(() => Object.fromEntries((players || []).map((p) => [p.id, p])), [players]);
  const a = sp.get("a"); const b = sp.get("b");
  const pa = a ? byId[a] : null; const pb = b ? byId[b] : null;

  function set(slot: "a" | "b", id: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (id) params.set(slot, id); else params.delete(slot);
    router.replace(`/sammenlign?${params.toString()}`);
  }

  const g90 = (p: CPlayer) => (p.min ? (p.gls * 90) / p.min : 0);
  const getter = (k: string) => (p: CPlayer) => (k === "g90" ? g90(p) : ((p as any)[k] ?? 0));
  const radarMetrics = ["Spilletid", "Mål/90", "P/kamp", "+/−/90", "Impact", "Starter"];
  const radarCols = ["min", "g90", "ppg", "pm", "tiv", "st"];
  const pctile = (val: number, arr: number[]) => (arr.length ? Math.round((arr.filter((x) => x <= val).length / arr.length) * 100) : 0);
  const radarFor = (p: CPlayer) => radarCols.map((c) => pctile(getter(c)(p), pool.map(getter(c))));

  return (
    <div>
      <PageHeader title="Sammenlign spillere" subtitle="Velg to spillere og se dem side om side. Lenken kan deles." badge={<Badge tone="low">Modellert</Badge>} />

      <div className="grid gap-4 sm:grid-cols-2">
        {(["a", "b"] as const).map((slot) => {
          const p = slot === "a" ? pa : pb;
          const color = slot === "a" ? CHART[0] : CHART[1];
          return (
            <Card key={slot} className="p-4">
              {p ? (
                <div className="flex items-center gap-3">
                  <Avatar name={p.n} posGroup={p.pg} size="lg" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/spiller/${p.id}`} className="truncate font-semibold hover:text-primary">{p.n}</Link>
                    <p className="truncate text-sm text-muted-foreground">{p.tm} · {p.pg} · {p.age} år</p>
                  </div>
                  <button onClick={() => set(slot, null)} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <div>
                  <p className="mb-2 text-sm font-medium" style={{ color }}>Spiller {slot.toUpperCase()}</p>
                  {players ? <PlayerPicker pool={pool} onPick={(pp) => set(slot, pp.id)} /> : <p className="text-sm text-muted-foreground">Laster…</p>}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {pa && pb && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="overflow-hidden lg:col-span-2">
            <div className="grid grid-cols-3 border-b border-border bg-muted/40 text-sm font-semibold">
              <div className="px-3 py-2 text-right" style={{ color: CHART[0] }}>{pa.ts}</div>
              <div className="px-3 py-2 text-center text-muted-foreground">Statistikk</div>
              <div className="px-3 py-2 text-left" style={{ color: CHART[1] }}>{pb.ts}</div>
            </div>
            {ROWS.map((row) => {
              const av = getter(row.key as string)(pa);
              const bv = getter(row.key as string)(pb);
              const aWin = (av - bv) * row.dir > 0;
              const bWin = (bv - av) * row.dir > 0;
              const f = (v: number) => (row.d === 2 && (row.key === "pm" || row.key === "tiv") ? signed(v, 2) : fmt(v, row.d));
              return (
                <div key={String(row.key)} className="grid grid-cols-3 border-b border-border/50 text-sm last:border-0">
                  <div className={cn("px-3 py-2 text-right tabular-nums", aWin ? "font-bold text-emerald-500" : "")}>{row.key === "tiv" && pa.tiv == null ? "–" : f(av)}</div>
                  <div className="px-3 py-2 text-center text-xs text-muted-foreground">{row.label}</div>
                  <div className={cn("px-3 py-2 text-left tabular-nums", bWin ? "font-bold text-emerald-500" : "")}>{row.key === "tiv" && pb.tiv == null ? "–" : f(bv)}</div>
                </div>
              );
            })}
          </Card>
          <Card className="p-4">
            <h3 className="mb-2 font-semibold">Persentilprofil</h3>
            <RadarStat
              metrics={radarMetrics}
              series={[
                { name: pa.n, color: CHART[0], values: radarFor(pa) },
                { name: pb.n, color: CHART[1], values: radarFor(pb) },
              ]}
              height={300}
            />
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SammenlignPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Laster…</p>}>
      <CompareInner />
    </Suspense>
  );
}
