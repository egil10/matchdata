import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Users, CalendarDays, Goal, ArrowLeftRight } from "lucide-react";
import * as db from "@/lib/db";
import { getMatch } from "@/lib/matches";
import { fmt, fmtDate, fmtWeekday, signed } from "@/lib/format";
import { PageHeader, Card, DataBadge, Badge, Crest, Tip } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/tabs";
import type { Appearance, MatchEvent } from "@/lib/types";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const m = await getMatch(params.id);
  return { title: m ? `${m.homeName} – ${m.awayName}` : "Kamp" };
}

export default async function MatchPage({ params }: { params: { id: string } }) {
  const m = await getMatch(params.id);
  if (!m) notFound();
  const league = db.getLeague(m.leagueId)!;
  const played = m.status === "played";

  return (
    <div>
      <PageHeader
        breadcrumb={[{ href: `/liga/${league.id}`, label: league.name }, { href: "/kamper", label: "Kamper" }]}
        title={<span className="text-base font-medium text-muted-foreground capitalize">{fmtWeekday(m.date)} {fmtDate(m.date)} · {m.time}</span>}
        badge={<DataBadge source={m.dataSource} />}
      />

      {/* scoreboard */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-6">
          <Link href={`/lag/${m.homeTeamId}`} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-end sm:text-right">
            <span className="order-2 sm:order-1 font-semibold sm:text-lg">{m.homeName}</span>
            <Crest name={m.homeName} short={m.homeShort} color={m.homeColor} size="xl" className="order-1 sm:order-2" />
          </Link>
          <div className="text-center">
            {played ? (
              <>
                <div className="stat-num text-4xl font-extrabold tabular-nums sm:text-5xl">{m.homeGoals}<span className="mx-2 text-muted-foreground">–</span>{m.awayGoals}</div>
                {m.htHome != null && <div className="mt-1 text-xs text-muted-foreground">({m.htHome}–{m.htAway})</div>}
              </>
            ) : (
              <div className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground">{m.time}</div>
            )}
          </div>
          <Link href={`/lag/${m.awayTeamId}`} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-start sm:text-left">
            <Crest name={m.awayName} short={m.awayShort} color={m.awayColor} size="xl" />
            <span className="font-semibold sm:text-lg">{m.awayName}</span>
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{league.name} · Runde {m.round}</span>
          {m.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{m.venue}</span>}
          {m.surface && <span>{m.surface}</span>}
          {m.attendance != null && <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{fmt(m.attendance)} tilskuere</span>}
          {m.referee && <span>Dommer: {m.referee}</span>}
          <span>Kampnr: {m.kampnummer}</span>
        </div>
      </Card>

      {m.dataSource === "real" && played && (
        <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-sm text-muted-foreground">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Ekte resultat</span> ({league.id === "eliteserien" ? "TheSportsDB" : "openfootball"}). Lagoppstilling, hendelser, tilskuere og dommer er <span className="font-medium text-amber-500">modellert</span>.
        </p>
      )}

      {played ? (
        <div className="mt-6">
          <Tabs
            items={[
              {
                id: "tropper",
                label: "Kamptropper",
                content: (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <LineupColumn title={m.homeName} formation={m.formationHome} lineup={m.lineups.home} />
                    <LineupColumn title={m.awayName} formation={m.formationAway} lineup={m.lineups.away} />
                  </div>
                ),
              },
              {
                id: "hendelser",
                label: "Kamphendelser",
                content: <Timeline events={m.events} homeName={m.homeShort} awayName={m.awayShort} />,
              },
            ]}
          />
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">Kampen er ikke spilt ennå.</p>
      )}
    </div>
  );
}

function LineupColumn({ title, formation, lineup }: { title: string; formation?: string; lineup: Appearance[] }) {
  const starters = lineup.filter((a) => a.started);
  const subs = lineup.filter((a) => !a.started);
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="font-semibold">{title}</h3>
        {formation && <Badge tone="avg">{formation}</Badge>}
      </div>
      <div className="p-2">
        <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Startoppstilling</p>
        {starters.map((a) => <PlayerLine key={a.playerId} a={a} />)}
        <p className="mt-2 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Innbyttere</p>
        {subs.map((a) => <PlayerLine key={a.playerId} a={a} bench />)}
      </div>
    </Card>
  );
}

function PlayerLine({ a, bench }: { a: Appearance; bench?: boolean }) {
  const dnp = bench && a.minIn === null;
  return (
    <Link href={`/spiller/${a.playerId}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-muted">
      <span className="w-6 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">{a.shirtNo}</span>
      <span className={`min-w-0 flex-1 truncate ${dnp ? "text-muted-foreground" : ""}`}>
        {a.name}
        {a.captain && <span className="ml-1.5 rounded bg-muted px-1 text-[9px] font-bold text-muted-foreground">K</span>}
      </span>
      <span className="flex shrink-0 items-center gap-1.5 text-xs">
        {a.goals > 0 && <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400" title="Mål"><Goal className="h-3.5 w-3.5" />{a.goals > 1 ? a.goals : ""}</span>}
        {a.yellow && <span className="inline-block h-3 w-2 rounded-[1px] bg-amber-400" title="Gult kort" />}
        {a.red && <span className="inline-block h-3 w-2 rounded-[1px] bg-rose-500" title="Rødt kort" />}
        {!dnp && (
          <>
            <span className="w-10 text-right tabular-nums text-muted-foreground">{a.minIn ? `${a.minIn}'` : ""} {a.minutes}′</span>
            <span className={`w-8 text-right tabular-nums font-medium ${a.onGF - a.onGA > 0 ? "text-emerald-500" : a.onGF - a.onGA < 0 ? "text-rose-500" : "text-muted-foreground"}`}>{signed(a.onGF - a.onGA, 0)}</span>
          </>
        )}
      </span>
    </Link>
  );
}

function Timeline({ events, homeName, awayName }: { events: MatchEvent[]; homeName: string; awayName: string }) {
  const icon = (e: MatchEvent) =>
    e.type === "goal" ? <Goal className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      : e.type === "yellow" ? <span className="inline-block h-3.5 w-2.5 rounded-[2px] bg-amber-400" />
        : e.type === "red" ? <span className="inline-block h-3.5 w-2.5 rounded-[2px] bg-rose-500" />
          : <ArrowLeftRight className="h-4 w-4 text-sky-500" />;
  const desc = (e: MatchEvent) =>
    e.type === "sub" ? <>{e.inName} <span className="text-muted-foreground">inn for</span> {e.outName}</> : e.playerName;
  return (
    <Card className="p-4">
      <div className="mx-auto max-w-2xl">
        {events.map((e, i) => (
          <div key={i} className={`flex items-center gap-3 py-1.5 ${e.side === "away" ? "flex-row-reverse text-right" : ""}`}>
            <span className="w-9 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">{e.minute}′</span>
            <span className="shrink-0">{icon(e)}</span>
            <span className="min-w-0 flex-1 truncate text-sm">{desc(e)}</span>
          </div>
        ))}
        {events.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Ingen registrerte hendelser.</p>}
      </div>
    </Card>
  );
}
