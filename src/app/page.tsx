import Link from "next/link";
import { ArrowRight, BarChart3, Search, Sparkles, TrendingUp, Trophy, Users } from "lucide-react";
import { getGender } from "@/lib/gender";
import * as db from "@/lib/db";
import { fmt } from "@/lib/format";
import { tableZone, ZONE_COLOR } from "@/lib/metrics";
import { Card, SectionTitle, Stat, DataBadge, Badge } from "@/components/ui/primitives";
import { LeagueCard, FixtureRow, PlayerImpactRow, ScorerRow, MiniTableRow } from "@/components/widgets";

export default function Home() {
  const gender = getGender();
  const leagues = db.leaguesByGender(gender);
  const meta = db.meta;
  const topImpact = db.topPlayersByImpactGender(gender, 8);
  const scorers = db.players.filter((p) => p.gender === gender).sort((a, b) => b.goals - a.goals || b.minutes - a.minutes).slice(0, 8);
  const recent = db.recentByGender(gender, 6);
  const upcoming = db.upcomingByGender(gender, 6);
  const featured = leagues[0];
  const featuredTop = featured ? db.teamsByLeague(featured.id).slice(0, 6) : [];

  return (
    <div className="space-y-12">
      {/* hero */}
      <section className="relative -mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-glow" />
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="relative mx-auto max-w-3xl py-12 text-center sm:py-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Norsk fotball i tall · Sesong {meta.seasonLabel}
          </div>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Dypere innsikt i <span className="text-gradient">norsk fotball</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground sm:text-lg">
            Ekte tabeller og resultater fra Eliteserien og OBOS-ligaen, kombinert med avansert
            spilleranalyse som <strong className="text-foreground">Team Impact</strong> og aldersprofiler —
            helt ned til lokale divisjoner.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/ligaer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              Utforsk ligaer <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/spillere" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-muted">
              <Search className="h-4 w-4" /> Søk spillere
            </Link>
            <Link href="/om" className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground">
              Slik fungerer det
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
            <DataBadge source="real" />
            <span className="text-muted-foreground">Eliteserien 2026 · OBOS · 2./3. divisjon</span>
            <span className="text-muted-foreground/40">|</span>
            <DataBadge source="modeled" />
            <span className="text-muted-foreground">spillerstatistikk</span>
          </div>
        </div>
      </section>

      {/* stat strip */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Ligaer" value={fmt(meta.counts.leagues)} icon={<Trophy className="h-4 w-4 text-muted-foreground" />} />
        <Stat label="Lag" value={fmt(meta.counts.teams)} icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />} />
        <Stat label="Spillere" value={fmt(meta.counts.players)} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <Stat label="Kamper" value={fmt(meta.counts.matches)} sub={`${fmt(meta.counts.realMatches)} ekte resultater`} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
      </section>

      {/* leagues */}
      <section>
        <SectionTitle
          title="Ligaer"
          sub={gender === "men" ? "Herrefotball — fire nivåer" : "Kvinnefotball — to nivåer"}
          action={<Link href="/ligaer" className="text-sm font-medium text-primary hover:underline">Alle ligaer →</Link>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((l) => (
            <LeagueCard key={l.id} league={l} top={db.teamsByLeague(l.id).slice(0, 3)} />
          ))}
        </div>
      </section>

      {/* featured table + impact */}
      <section className="grid gap-6 lg:grid-cols-3">
        {featured && (
          <Card className="lg:col-span-1">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h3 className="font-semibold">{featured.name}</h3>
                <p className="text-xs text-muted-foreground">Tabelltopp · {featured.season}</p>
              </div>
              <DataBadge source={featured.dataSource} />
            </div>
            <div className="p-2">
              {featuredTop.map((t) => (
                <MiniTableRow key={t.id} t={t} accent={ZONE_COLOR[tableZone(featured.level, featured.gender, t.position, featured.teamCount) || ""]} />
              ))}
            </div>
            <div className="border-t border-border p-3 text-center">
              <Link href={`/liga/${featured.id}`} className="text-sm font-medium text-primary hover:underline">Hele tabellen →</Link>
            </div>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h3 className="font-semibold">Høyest Team Impact</h3>
              <p className="text-xs text-muted-foreground">Mest verdifulle spillere akkurat nå</p>
            </div>
            <Badge tone="low">Modellert</Badge>
          </div>
          <div className="grid gap-1 p-2 sm:grid-cols-2">
            {topImpact.map((p, i) => <PlayerImpactRow key={p.id} p={p} rank={i + 1} />)}
          </div>
        </Card>
      </section>

      {/* results / upcoming / scorers */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <div className="border-b border-border p-4"><h3 className="font-semibold">Siste resultater</h3></div>
          <div className="space-y-2 p-3">
            {recent.length ? recent.map((f) => <FixtureRow key={f.id} fx={f} showLeague />) : <p className="p-2 text-sm text-muted-foreground">Ingen kamper.</p>}
          </div>
        </Card>
        <Card>
          <div className="border-b border-border p-4"><h3 className="font-semibold">Kommende kamper</h3></div>
          <div className="space-y-2 p-3">
            {upcoming.length ? upcoming.map((f) => <FixtureRow key={f.id} fx={f} showLeague />) : <p className="p-2 text-sm text-muted-foreground">Ingen kommende kamper i datasettet.</p>}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-semibold">Toppscorere</h3>
            <Badge tone="low">Modellert</Badge>
          </div>
          <div className="grid gap-1 p-2">
            {scorers.map((p, i) => <ScorerRow key={p.id} p={p} rank={i + 1} />)}
          </div>
        </Card>
      </section>

      {/* methodology teaser */}
      <section>
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-glow opacity-60" />
          <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <h3 className="text-xl font-bold">Ekte data der det finnes — ærlig modellert ellers</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Resultater og tabeller hentes fra openfootball (offentlig eiendom). Spillernivå-data
                som ikke finnes offentlig er tydelig merket som <span className="font-medium text-amber-500">modellert</span>.
                Vi skjuler aldri hva som er hva.
              </p>
            </div>
            <Link href="/om" className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted">
              Les om metoden <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
