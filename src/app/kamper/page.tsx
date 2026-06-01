"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFixtures, useLeagues, useGender, type CFixture } from "@/lib/client";
import { cn } from "@/lib/cn";
import { fmtWeekday, fmtDate } from "@/lib/format";
import { PageHeader, Card, Crest } from "@/components/ui/primitives";
import { Field, Select } from "@/components/ui/controls";

export default function KamperPage() {
  const gender = useGender();
  const fixtures = useFixtures();
  const leagues = useLeagues();
  const [league, setLeague] = useState("all");
  const [status, setStatus] = useState<"all" | "played" | "scheduled">("all");
  const [limit, setLimit] = useState(80);

  const leaguesG = useMemo(() => (leagues || []).filter((l) => l.gender === gender), [leagues, gender]);
  const leagueIds = useMemo(() => new Set(leaguesG.map((l) => l.id)), [leaguesG]);

  const pool = useMemo(
    () => (fixtures || [])
      .filter((f) => leagueIds.has(f.leagueId) && (league === "all" || f.leagueId === league) && (status === "all" || f.status === status))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.time < b.time ? -1 : 1)),
    [fixtures, leagueIds, league, status],
  );

  const groups = useMemo(() => {
    const g: Record<string, CFixture[]> = {};
    for (const f of pool.slice(0, limit)) (g[f.date] ||= []).push(f);
    return Object.entries(g);
  }, [pool, limit]);

  return (
    <div>
      <PageHeader title="Kampkalender" subtitle="Alle kamper dag for dag — ekte resultater og kommende oppgjør." />

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <Field label="Liga"><Select value={league} onChange={(v) => { setLeague(v); setLimit(80); }} options={[{ value: "all", label: "Alle ligaer" }, ...leaguesG.map((l) => ({ value: l.id, label: l.name }))]} /></Field>
        <Field label="Status">
          <Select value={status} onChange={(v) => { setStatus(v as any); setLimit(80); }} options={[{ value: "all", label: "Alle" }, { value: "played", label: "Spilte" }, { value: "scheduled", label: "Kommende" }]} />
        </Field>
        <p className="ml-auto self-center text-sm text-muted-foreground">{fixtures ? `${pool.length} kamper` : "Laster…"}</p>
      </div>

      <div className="space-y-6">
        {groups.map(([date, fxs]) => (
          <section key={date}>
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="font-semibold capitalize">{fmtWeekday(date)}</h2>
              <span className="text-sm text-muted-foreground">{fmtDate(date)}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {fxs.map((f) => <CalendarRow key={f.id} f={f} />)}
            </div>
          </section>
        ))}
      </div>

      {pool.length > limit && (
        <div className="mt-6 text-center">
          <button onClick={() => setLimit((l) => l + 80)} className="rounded-lg border border-border bg-card px-5 py-2 text-sm font-medium transition hover:bg-muted">Vis flere</button>
        </div>
      )}
    </div>
  );
}

function CalendarRow({ f }: { f: CFixture }) {
  const played = f.status === "played";
  const hw = played && (f.homeGoals as number) > (f.awayGoals as number);
  const aw = played && (f.awayGoals as number) > (f.homeGoals as number);
  return (
    <Link href={`/kamp/${f.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 transition hover:border-primary/40">
      <span className="w-12 shrink-0 text-center text-xs font-medium text-muted-foreground">{played ? "FT" : f.time}</span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className={cn("flex items-center justify-between gap-2", aw && "opacity-55")}>
          <span className="flex min-w-0 items-center gap-2"><Crest name={f.homeName} short={f.homeShort} color={f.homeColor} size="sm" /><span className={cn("truncate text-sm", hw ? "font-semibold" : "")}>{f.homeName}</span></span>
          <span className={cn("stat-num tabular-nums", hw ? "font-bold" : "")}>{f.homeGoals ?? ""}</span>
        </div>
        <div className={cn("flex items-center justify-between gap-2", hw && "opacity-55")}>
          <span className="flex min-w-0 items-center gap-2"><Crest name={f.awayName} short={f.awayShort} color={f.awayColor} size="sm" /><span className={cn("truncate text-sm", aw ? "font-semibold" : "")}>{f.awayName}</span></span>
          <span className={cn("stat-num tabular-nums", aw ? "font-bold" : "")}>{f.awayGoals ?? ""}</span>
        </div>
      </div>
      <span className="hidden shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground sm:block">{f.leagueShort}</span>
    </Link>
  );
}
