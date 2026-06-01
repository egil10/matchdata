"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePlayers, useLeagues, useGender, type CPlayer } from "@/lib/client";
import { fmt } from "@/lib/format";
import { PageHeader, Card, Stat, Badge, Avatar } from "@/components/ui/primitives";
import { Field, Select } from "@/components/ui/controls";
import { AgeHistogram } from "@/components/charts-lazy";

const SEASON = 2024;

export default function AlderPage() {
  const gender = useGender();
  const players = usePlayers();
  const leagues = useLeagues();
  const [league, setLeague] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);

  const pool = useMemo(
    () => (players || []).filter((p) => p.g === gender && (league === "all" || p.lg === league)),
    [players, gender, league],
  );
  const leaguesG = useMemo(() => (leagues || []).filter((l) => l.gender === gender), [leagues, gender]);

  const bars = useMemo(() => {
    const by: Record<number, number> = {};
    for (const p of pool) by[p.by] = (by[p.by] || 0) + 1;
    return Object.keys(by).map(Number).sort((a, b) => a - b).map((y) => ({ birthYear: y, age: SEASON - y, count: by[y] }));
  }, [pool]);

  const totalMin = pool.reduce((s, p) => s + p.min, 0);
  const weighted = totalMin ? pool.reduce((s, p) => s + p.age * p.min, 0) / totalMin : 0;
  const avg = pool.length ? pool.reduce((s, p) => s + p.age, 0) / pool.length : 0;
  const y
    = pool.length ? Math.min(...pool.map((p) => p.age)) : 0;
  const oldest = pool.length ? Math.max(...pool.map((p) => p.age)) : 0;

  const selectedPlayers = useMemo(
    () => (selected ? pool.filter((p) => p.by === selected).sort((a, b) => b.min - a.min) : []),
    [pool, selected],
  );

  return (
    <div>
      <PageHeader
        title="Aldersfordeling"
        subtitle="Antall spillere per fødselsår. Klikk en søyle for å se spillerne."
        badge={<Badge tone="low">Modellert</Badge>}
        actions={
          <Field>
            <Select value={league} onChange={(v) => { setLeague(v); setSelected(null); }} options={[{ value: "all", label: "Alle ligaer" }, ...leaguesG.map((l) => ({ value: l.id, label: l.name }))]} />
          </Field>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Spillere" value={fmt(pool.length)} />
        <Stat label="Snittalder" value={fmt(avg, 1)} sub={`vektet ${fmt(weighted, 1)}`} />
        <Stat label="Yngste" value={`${y} år`} />
        <Stat label="Eldste" value={`${oldest} år`} />
      </section>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Antall spillere per alder</h3>
        {players ? <AgeHistogram bars={bars} selected={selected} onSelect={(yr) => setSelected((s) => (s === yr ? null : yr))} height={300} /> : <p className="text-sm text-muted-foreground">Laster…</p>}
      </Card>

      {selected && (
        <section className="mt-6 animate-fade-in">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Født {selected} · {SEASON - selected} år <span className="text-muted-foreground">({selectedPlayers.length} spillere)</span></h3>
            <button onClick={() => setSelected(null)} className="text-sm text-muted-foreground hover:text-foreground">Lukk</button>
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
        </section>
      )}
    </div>
  );
}
