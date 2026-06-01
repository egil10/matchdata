import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Calendar, Home, Plane } from "lucide-react";
import * as db from "@/lib/db";
import { fmt, signed } from "@/lib/format";
import { PageHeader, Card, Stat, DataBadge, Badge, Crest, FormGuide } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/tabs";
import { ImpactTable } from "@/components/tables";
import { FixtureRow, MiniTableRow } from "@/components/widgets";
import { ProgressionChart } from "@/components/charts";
import { FavButton } from "@/components/fav-button";

export function generateMetadata({ params }: { params: { id: string } }) {
  const t = db.getTeam(params.id);
  return { title: t ? t.name : "Lag" };
}

export default function TeamPage({ params }: { params: { id: string } }) {
  const team = db.getTeam(params.id);
  if (!team) notFound();
  const league = db.getLeague(team.leagueId)!;
  const leagueTeams = db.teamsByLeague(team.leagueId);
  const idx = leagueTeams.findIndex((t) => t.id === team.id);
  const context = leagueTeams.slice(Math.max(0, idx - 2), Math.min(leagueTeams.length, idx + 3));
  const squad = db.playersByTeam(team.id).sort((a, b) => {
    const ai = a.teamImpact == null ? 1 : 0, bi = b.teamImpact == null ? 1 : 0;
    if (ai !== bi) return ai - bi;
    if (ai === 0) return (b.teamImpact as number) - (a.teamImpact as number);
    return b.minutes - a.minutes;
  });
  const fx = db.fixturesByTeam(team.id);
  const results = fx.filter((f) => f.status === "played").sort((a, b) => (a.date > b.date ? -1 : 1));
  const upcoming = fx.filter((f) => f.status === "scheduled").sort((a, b) => (a.date < b.date ? -1 : 1));
  const progression = db.getProgression(team.leagueId);
  const topPlayers = squad.filter((p) => p.teamImpact != null).slice(0, 5);
  const posCount = ["Keeper", "Forsvar", "Midtbane", "Angrep"].map((g) => ({ g, n: squad.filter((p) => p.posGroup === g).length }));

  return (
    <div>
      <PageHeader
        breadcrumb={[{ href: "/ligaer", label: "Ligaer" }, { href: `/liga/${league.id}`, label: league.name }, { href: `/lag/${team.id}`, label: team.name }]}
        title={
          <span className="flex items-center gap-3">
            <Crest name={team.name} short={team.short} color={team.color} badge={team.badge} size="xl" />
            {team.name}
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Link href={`/liga/${league.id}`} className="hover:text-foreground">{league.name}</Link>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{team.city}, {team.fylke}</span>
            {team.founded && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Etbl. {team.founded}</span>}
            {team.stadium && <span>{team.stadium}{team.capacity ? ` (${fmt(team.capacity)})` : ""}</span>}
          </span>
        }
        badge={<DataBadge source={team.dataSource} />}
        actions={<FavButton kind="t" id={team.id} label />}
      />

      <section className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Plassering" value={`${team.position}.`} sub={`av ${league.teamCount}`} />
        <Stat label="Poeng" value={team.points} sub={`${team.played} kamper`} />
        <Stat label="S–U–T" value={`${team.w}-${team.d}-${team.l}`} />
        <Stat label="Mål" value={`${team.gf}–${team.ga}`} sub={signed(team.gd, 0)} />
        <Stat label="Poeng/kamp" value={fmt(team.ppg, 2)} />
        <Stat label="Snittalder" value={fmt(team.weightedAvgAge, 1)} sub="vektet" />
      </section>

      <Tabs
        items={[
          {
            id: "oversikt",
            label: "Oversikt",
            content: (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <Card className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">Form</h3>
                      <FormGuide form={team.form} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <SplitCard icon={<Home className="h-4 w-4" />} title="Hjemme" rec={team.home} />
                      <SplitCard icon={<Plane className="h-4 w-4" />} title="Borte" rec={team.away} />
                    </div>
                  </Card>
                  <Card>
                    <div className="border-b border-border p-4"><h3 className="font-semibold">Siste resultater</h3></div>
                    <div className="space-y-2 p-3">{results.slice(0, 6).map((f) => <FixtureRow key={f.id} fx={f} />)}</div>
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card>
                    <div className="border-b border-border p-4"><h3 className="font-semibold">Tabellnabolag</h3></div>
                    <div className="p-2">{context.map((t) => <MiniTableRow key={t.id} t={t} />)}</div>
                  </Card>
                  <Card>
                    <div className="flex items-center justify-between border-b border-border p-4">
                      <h3 className="font-semibold">Nøkkelspillere</h3><Badge tone="low">Modellert</Badge>
                    </div>
                    <div className="p-2">
                      {topPlayers.map((p) => (
                        <Link key={p.id} href={`/spiller/${p.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                          <span className="truncate">{p.name}</span>
                          <span className="stat-num font-semibold text-emerald-500">{signed(p.teamImpact, 2)}</span>
                        </Link>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            ),
          },
          {
            id: "spillere",
            label: `Spillere (${squad.length})`,
            content: (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {posCount.map((p) => (
                    <span key={p.g} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
                      <span className="text-muted-foreground">{p.g}:</span> <span className="font-semibold">{p.n}</span>
                    </span>
                  ))}
                  <span className="ml-auto inline-flex items-center"><Badge tone="low">Spillerdata modellert</Badge></span>
                </div>
                <ImpactTable players={squad} showTeam={false} />
              </div>
            ),
          },
          {
            id: "kamper",
            label: "Kamper",
            content: (
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-semibold">Resultater</h3>
                  <div className="space-y-2">{results.map((f) => <FixtureRow key={f.id} fx={f} />)}</div>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold">Kommende</h3>
                  <div className="space-y-2">{upcoming.length ? upcoming.map((f) => <FixtureRow key={f.id} fx={f} />) : <p className="text-sm text-muted-foreground">Ingen kommende kamper.</p>}</div>
                </div>
              </div>
            ),
          },
          {
            id: "form",
            label: "Poengløp",
            content: progression ? (
              <Card className="p-4">
                <h3 className="mb-1 font-semibold">{team.name} i poengløpet</h3>
                <p className="mb-2 text-xs text-muted-foreground">Kumulative poeng per runde sammenlignet med resten av ligaen.</p>
                <ProgressionChart series={progression.series} maxRound={progression.maxRound} highlight={[team.id]} height={380} />
              </Card>
            ) : <p className="text-sm text-muted-foreground">Ingen data.</p>,
          },
        ]}
      />
    </div>
  );
}

function SplitCard({ icon, title, rec }: { icon: React.ReactNode; title: string; rec: { p: number; w: number; d: number; l: number } }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">{icon}{title}</div>
      <p className="mt-1.5 text-lg font-bold tabular-nums">{rec.w}-{rec.d}-{rec.l}</p>
      <p className="text-xs text-muted-foreground">{rec.p} kamper</p>
    </div>
  );
}
