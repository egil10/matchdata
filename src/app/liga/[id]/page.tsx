import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, Shield, Swords, Sparkles } from "lucide-react";
import * as db from "@/lib/db";
import { fmt, pct, signed } from "@/lib/format";
import { PageHeader, Card, Stat, DataBadge, Badge, Crest, Avatar } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/tabs";
import { LeagueTable, ImpactTable } from "@/components/tables";
import { ScorerRow, FixtureRow } from "@/components/widgets";
import { ProgressionChart, GoalsPerRoundChart, DonutChart, RankBarChart } from "@/components/charts";
import { CHART } from "@/lib/colors";

export function generateMetadata({ params }: { params: { id: string } }) {
  const l = db.getLeague(params.id);
  return { title: l ? l.name : "Liga" };
}

export default function LeaguePage({ params }: { params: { id: string } }) {
  const league = db.getLeague(params.id);
  if (!league) notFound();

  const teams = db.teamsByLeague(league.id);
  const topImpact = db.topPlayersByImpact(league.id, 15);
  const scorers = db.topScorers(league.id, 12);
  const progression = db.getProgression(league.id);
  const history = db.getHistory(league.id);
  const lf = db.fixturesByLeague(league.id);
  const recent = lf.filter((f) => f.status === "played").sort((a, b) => (a.date > b.date ? -1 : 1)).slice(0, 8);
  const upcoming = lf.filter((f) => f.status === "scheduled").sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 8);

  const bestAttack = [...teams].sort((a, b) => b.gf - a.gf)[0];
  const bestDefense = [...teams].sort((a, b) => a.ga - b.ga)[0];
  const mostCleanSheets = [...teams].sort((a, b) => b.cleanSheets - a.cleanSheets)[0];
  const sumRes = league.goalsByRound.reduce((a, r) => ({ home: a.home + r.home, away: a.away + r.away, draw: a.draw + r.draw }), { home: 0, away: 0, draw: 0 });
  const highlight = teams.slice(0, 5).map((t) => t.id);
  const ageRank = [...league.ageAnalysis].map((a) => ({ name: a.short, value: a.weightedAvgAge }));

  return (
    <div>
      <PageHeader
        breadcrumb={[{ href: "/ligaer", label: "Ligaer" }, { href: `/liga/${league.id}`, label: league.name }]}
        title={
          <span className="flex items-center gap-3">
            <span className="h-7 w-2 rounded-full" style={{ background: league.color }} />
            {league.name}
          </span>
        }
        subtitle={`${league.divisionName} · Nivå ${league.level} · Sesong ${league.season}${league.inProgress ? ` (${league.roundsPlayed}/${league.roundsTotal} runder spilt)` : ""}`}
        badge={<DataBadge source={league.dataSource} />}
      />

      {league.dataSource === "real" && (
        <p className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-sm text-muted-foreground">
          <span className="font-medium text-emerald-500">Ekte data:</span> tabell og resultater er hentet direkte fra openfootball (offentlig eiendom).
          Spillerstatistikk (Team Impact, spilletid, mål) er <span className="font-medium text-amber-500">modellert</span>.
        </p>
      )}

      <section className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Stat label="Kamper" value={fmt(league.stats.matches)} />
        <Stat label="Mål/kamp" value={fmt(league.stats.goalsPerMatch, 2)} />
        <Stat label="Hjemmeseier" value={pct(league.stats.homeWinPct, 0)} />
        <Stat label="Uavgjort" value={pct(league.stats.drawPct, 0)} />
        <Stat label="Kort/kamp" value={fmt(league.stats.cardsPerMatch, 1)} />
        <Stat label="Snittalder" value={fmt(league.stats.avgAgeWeighted, 1)} sub="vektet" />
      </section>

      <Tabs
        items={[
          {
            id: "tabell",
            label: "Tabell",
            content: <LeagueTable teams={teams} league={league} />,
          },
          {
            id: "topp",
            label: "Toppspillere",
            content: (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="font-semibold">Topp 15 — Team Impact</h3>
                    <Badge tone="low">Modellert</Badge>
                  </div>
                  <ImpactTable players={topImpact} />
                </div>
                <Card className="h-fit">
                  <div className="flex items-center justify-between border-b border-border p-4">
                    <h3 className="font-semibold">Toppscorere</h3>
                    <Badge tone="low">Modellert</Badge>
                  </div>
                  <div className="grid gap-1 p-2">
                    {scorers.map((p, i) => <ScorerRow key={p.id} p={p} rank={i + 1} />)}
                  </div>
                </Card>
              </div>
            ),
          },
          {
            id: "alder",
            label: "Aldersanalyse",
            content: (
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 p-4">
                  <h3 className="mb-1 font-semibold">Vektet snittalder per lag</h3>
                  <p className="mb-3 text-xs text-muted-foreground">Alder vektet etter spilletid — yngste lag øverst.</p>
                  <RankBarChart data={ageRank} unit=" år" height={Math.max(260, teams.length * 24)} />
                </Card>
                <div className="space-y-6">
                  <AgeList title="Yngste lag" tone="good" items={league.ageAnalysis.slice(0, 5)} />
                  <AgeList title="Eldste lag" tone="low" items={[...league.ageAnalysis].reverse().slice(0, 5)} />
                </div>
              </div>
            ),
          },
          {
            id: "dashbord",
            label: "Dashbord",
            content: (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <RecordCard icon={<Trophy className="h-4 w-4" />} label="Beste angrep" team={bestAttack.name} value={`${bestAttack.gf} mål`} id={bestAttack.id} />
                  <RecordCard icon={<Shield className="h-4 w-4" />} label="Beste forsvar" team={bestDefense.name} value={`${bestDefense.ga} innslupne`} id={bestDefense.id} />
                  <RecordCard icon={<Sparkles className="h-4 w-4" />} label="Flest nullkamper" team={mostCleanSheets.name} value={`${mostCleanSheets.cleanSheets} kamper`} id={mostCleanSheets.id} />
                  <RecordCard icon={<Swords className="h-4 w-4" />} label="Toppscorer" team={scorers[0]?.name || "–"} value={`${scorers[0]?.goals ?? 0} mål`} id={scorers[0]?.teamId} />
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                  <Card className="p-4 lg:col-span-2">
                    <h3 className="mb-1 font-semibold">Poengutvikling</h3>
                    <p className="mb-2 text-xs text-muted-foreground">Kumulative poeng per runde — topp 5 fremhevet.</p>
                    {progression ? <ProgressionChart series={progression.series} maxRound={progression.maxRound} highlight={highlight} /> : <p className="text-sm text-muted-foreground">Ingen data.</p>}
                  </Card>
                  <Card className="p-4">
                    <h3 className="mb-1 font-semibold">Resultatfordeling</h3>
                    <p className="mb-2 text-xs text-muted-foreground">Hjemme / uavgjort / borte</p>
                    <DonutChart segments={[
                      { name: "Hjemmeseier", value: sumRes.home, color: CHART[0] },
                      { name: "Uavgjort", value: sumRes.draw, color: "hsl(var(--muted-foreground))" },
                      { name: "Borteseier", value: sumRes.away, color: CHART[1] },
                    ]} />
                  </Card>
                </div>
                <Card className="p-4">
                  <h3 className="mb-1 font-semibold">Mål per runde</h3>
                  <GoalsPerRoundChart data={league.goalsByRound} />
                </Card>
              </div>
            ),
          },
          {
            id: "kamper",
            label: "Kamper",
            content: (
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-semibold">Siste resultater</h3>
                  <div className="space-y-2">{recent.length ? recent.map((f) => <FixtureRow key={f.id} fx={f} />) : <p className="text-sm text-muted-foreground">Ingen spilte kamper.</p>}</div>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold">Kommende kamper</h3>
                  <div className="space-y-2">{upcoming.length ? upcoming.map((f) => <FixtureRow key={f.id} fx={f} />) : <p className="text-sm text-muted-foreground">Sesongen er ferdigspilt.</p>}</div>
                </div>
              </div>
            ),
          },
          ...(history.length > 1 ? [{
            id: "historikk",
            label: "Historikk",
            content: (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {history.map((h) => (
                  <Card key={h.season} className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold">Sesong {h.season}</h3>
                      <Badge tone={h.complete ? "good" : "low"}>{h.complete ? "Ferdig" : "Pågår"}</Badge>
                    </div>
                    <div className="space-y-1">
                      {h.table.slice(0, 5).map((row, i) => (
                        <div key={row.name} className="flex items-center gap-2 text-sm">
                          <span className="w-4 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
                          <span className="flex-1 truncate">{row.name}</span>
                          <span className="stat-num tabular-nums font-medium">{row.points}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ),
          }] : []),
        ]}
      />
    </div>
  );
}

function AgeList({ title, items, tone }: { title: string; items: { teamId: string; name: string; weightedAvgAge: number }[]; tone: any }) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="space-y-2">
        {items.map((a) => (
          <Link key={a.teamId} href={`/lag/${a.teamId}`} className="flex items-center justify-between text-sm hover:text-primary">
            <span className="truncate">{a.name}</span>
            <Badge tone={tone}>{fmt(a.weightedAvgAge, 1)} år</Badge>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function RecordCard({ icon, label, team, value, id }: { icon: React.ReactNode; label: string; team: string; value: string; id?: string }) {
  const body = (
    <div className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/40">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <p className="mt-1.5 truncate font-bold">{team}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  );
  return id ? <Link href={`/lag/${id}`}>{body}</Link> : body;
}
