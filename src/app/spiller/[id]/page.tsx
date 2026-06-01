import Link from "next/link";
import { notFound } from "next/navigation";
import { Shirt, Flag, Star } from "lucide-react";
import * as db from "@/lib/db";
import { getLeagueMatches } from "@/lib/matches";
import { fmt, signed } from "@/lib/format";
import { teamImpactTier, TONE_TEXT, TONE_BG } from "@/lib/metrics";
import { PageHeader, Card, Stat, DataBadge, Badge, Avatar, Meter, Tip, FormGuide } from "@/components/ui/primitives";
import { SparkBars } from "@/components/widgets";
import { RadarStat } from "@/components/charts";
import { CHART } from "@/lib/colors";
import { FavButton } from "@/components/fav-button";

export function generateMetadata({ params }: { params: { id: string } }) {
  const p = db.getPlayer(params.id);
  return { title: p ? p.name : "Spiller" };
}

const PCT_METRICS = ["Spilletid", "Starter", "Mål/90", "P/kamp", "+/−/90", "Impact"];

export default async function PlayerPage({ params }: { params: { id: string } }) {
  const player = db.getPlayer(params.id);
  if (!player) notFound();
  const team = db.getTeam(player.teamId)!;
  const league = db.getLeague(player.leagueId)!;
  const tier = teamImpactTier(player.teamImpact);

  // percentile radar vs league peers (>=200 min)
  const peers = db.playersByLeague(player.leagueId).filter((p) => p.minutes >= 200 && p.gender === player.gender);
  const g90 = (p: typeof player) => (p.minutes ? (p.goals * 90) / p.minutes : 0);
  const pctile = (val: number, arr: number[]) => (arr.length ? Math.round((arr.filter((x) => x <= val).length / arr.length) * 100) : 0);
  const cols: ((p: typeof player) => number)[] = [(p) => p.minutes, (p) => p.starts, g90, (p) => p.ppg, (p) => p.plusMinus90, (p) => p.teamImpact ?? 0];
  const radarValues = cols.map((f) => pctile(f(player), peers.map(f)));

  // match-by-match log from the real match files
  const matches = await getLeagueMatches(player.leagueId);
  const log = matches
    .filter((m) => m.status === "played" && (m.homeTeamId === team.id || m.awayTeamId === team.id))
    .map((m) => {
      const home = m.homeTeamId === team.id;
      const ap = (home ? m.lineups.home : m.lineups.away).find((a) => a.playerId === player.id);
      if (!ap || ap.minIn === null) return null;
      const teamGoals = home ? m.homeGoals! : m.awayGoals!;
      const oppGoals = home ? m.awayGoals! : m.homeGoals!;
      return {
        id: m.id, date: m.date, round: m.round,
        oppName: home ? m.awayName : m.homeName,
        oppShort: home ? m.awayShort : m.homeShort,
        homeAway: home ? "H" : "B",
        result: teamGoals > oppGoals ? "W" : teamGoals < oppGoals ? "L" : "D",
        score: `${teamGoals}–${oppGoals}`,
        minutes: ap.minutes, goals: ap.goals, started: ap.started,
        gd: ap.onGF - ap.onGA, yellow: ap.yellow, red: ap.red,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => (a.date > b.date ? -1 : 1)) as any[];
  const sortedByRound = [...log].sort((a, b) => a.round - b.round);

  return (
    <div>
      <PageHeader
        breadcrumb={[{ href: "/spillere", label: "Spillere" }, { href: `/lag/${team.id}`, label: team.name }, { href: `/spiller/${player.id}`, label: player.name }]}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={player.name} posGroup={player.posGroup} size="xl" />
            {player.name}
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1"><Shirt className="h-3.5 w-3.5" />#{player.shirtNo}</span>
            <Link href={`/lag/${team.id}`} className="hover:text-foreground">{team.name}</Link>
            <span>{player.posGroup}</span>
            <span>Født {player.birthYear} · {player.age} år</span>
            <span className="inline-flex items-center gap-1"><Flag className="h-3.5 w-3.5" />{player.nationality}</span>
            {player.captain && <Badge tone="avg">Kaptein</Badge>}
            {player.isNationalTeam && <Badge tone="good"><Star className="h-3 w-3" /> {player.caps} landskamper</Badge>}
          </span>
        }
        badge={<DataBadge source="modeled" />}
        actions={<FavButton kind="p" id={player.id} label />}
      />

      <section className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Kamper" value={`${player.starts} (${player.sub})`} sub="S (I)" />
        <Stat label="Minutter" value={fmt(player.minutes)} sub={`${fmt(player.mpg, 0)} /kamp`} />
        <Stat label="Mål" value={player.goals} sub={`${fmt(player.gpg, 2)} /kamp`} />
        <Stat label="Poeng/kamp" value={fmt(player.ppg, 2)} />
        <Stat label="+/−/90" value={signed(player.plusMinus90, 2)} tone={player.plusMinus90 > 0 ? "good" : player.plusMinus90 < 0 ? "bad" : "avg"} />
        <Stat label="Team Impact" value={player.teamImpact == null ? "–" : signed(player.teamImpact, 2)} tone={tier.tone} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* impact breakdown */}
        <Card className="p-5 lg:col-span-1">
          <h3 className="mb-1 font-semibold">Team Impact</h3>
          <div className="mb-4 flex items-center gap-2">
            <span className={`stat-num text-3xl font-extrabold ${TONE_TEXT[tier.tone]}`}>{player.teamImpact == null ? "–" : signed(player.teamImpact, 2)}</span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TONE_BG[tier.tone]}`}>{tier.label}</span>
          </div>
          {player.qualified ? (
            <div className="space-y-3 text-sm">
              <Row label={<Tip text="Hvor mye bedre laget presterer med spilleren på banen.">Prestasjon&nbsp;Z</Tip>} value={signed(player.perfZ, 2)} v={player.perfZ ?? 0} />
              <Row label={<Tip text="Hvor mye spilleren spiller vs. lagkamerater (trenertillit).">Minutter&nbsp;Z</Tip>} value={signed(player.minZ, 2)} v={(player.minZ ?? 0) * 0.5} />
              <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                Team Impact = Prestasjon Z + 0,5 × Minutter Z. <Link href="/om" className="underline">Metode →</Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ikke kvalifisert — spilleren må ha spilt minst 20 % av lagets totale spilletid for å få en Team Impact-score.
            </p>
          )}
        </Card>

        {/* radar */}
        <Card className="p-5 lg:col-span-1">
          <h3 className="mb-1 font-semibold">Persentil i ligaen</h3>
          <p className="mb-1 text-xs text-muted-foreground">Mot spillere med ≥ 200 min i {league.name}.</p>
          <RadarStat metrics={PCT_METRICS} series={[{ name: player.name, color: CHART[1], values: radarValues }]} height={280} />
        </Card>

        {/* on-pitch GD spark + extras */}
        <Card className="p-5 lg:col-span-1">
          <h3 className="mb-1 font-semibold">On-pitch målforskjell</h3>
          <p className="mb-3 text-xs text-muted-foreground">Per kamp (kronologisk) — lagets MF mens spilleren er på banen.</p>
          <SparkBars values={sortedByRound.map((m) => m.gd)} height={70} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Seire" value={player.w} />
            <MiniStat label="Uavgjort" value={player.d} />
            <MiniStat label="Tap" value={player.l} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <MiniStat label="Gule kort" value={player.yellow} />
            <MiniStat label="Vektet P/K" value={fmt(player.weightedPpg, 2)} />
          </div>
        </Card>
      </div>

      {/* match log */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="font-semibold">Kamphistorikk</h3>
          <Badge tone="low">Modellert</Badge>
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 text-left font-semibold">Runde</th>
                <th className="px-2 py-2.5 text-left font-semibold">Motstander</th>
                <th className="px-2 py-2.5 text-center font-semibold">Res</th>
                <th className="px-2 py-2.5 text-center font-semibold">Min</th>
                <th className="px-2 py-2.5 text-center font-semibold">Mål</th>
                <th className="px-3 py-2.5 text-right font-semibold">On-pitch MF</th>
              </tr>
            </thead>
            <tbody>
              {log.map((m) => (
                <tr key={m.id} className="border-b border-border/50 last:border-0 hover:bg-muted/40">
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">R{m.round}</td>
                  <td className="px-2 py-2">
                    <Link href={`/kamp/${m.id}`} className="font-medium hover:text-primary">
                      <span className="text-muted-foreground">{m.homeAway}</span> {m.oppShort} <span className="text-muted-foreground">{m.score}</span>
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-center"><FormGuide form={[m.result]} /></td>
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{m.minutes}{m.started ? "" : " ↑"}</td>
                  <td className="px-2 py-2 text-center tabular-nums">{m.goals || ""}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-medium ${m.gd > 0 ? "text-emerald-500" : m.gd < 0 ? "text-rose-500" : "text-muted-foreground"}`}>{signed(m.gd, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}

function Row({ label, value, v }: { label: React.ReactNode; value: string; v: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="stat-num font-semibold">{value}</span>
      </div>
      <Meter value={Math.min(1, Math.abs(v) / 2.5)} color={v >= 0 ? "hsl(var(--success))" : "hsl(var(--danger))"} />
    </div>
  );
}
function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2">
      <p className="stat-num text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
