import Link from "next/link";
import { cn } from "@/lib/cn";
import { fmt, fmtDateShort, signed } from "@/lib/format";
import { teamImpactTier, TONE_TEXT } from "@/lib/metrics";
import type { Fixture, League, Player, Team } from "@/lib/types";
import { Avatar, Crest, DataBadge, Badge } from "@/components/ui/primitives";

/* ----------------------------------------------------------- FixtureRow */
export function FixtureRow({ fx, showLeague }: { fx: Fixture; showLeague?: boolean }) {
  const played = fx.status === "played";
  const hw = played && (fx.homeGoals as number) > (fx.awayGoals as number);
  const aw = played && (fx.awayGoals as number) > (fx.homeGoals as number);
  return (
    <Link
      href={`/kamp/${fx.id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 transition hover:border-primary/40"
    >
      <div className="w-14 shrink-0 text-center">
        <div className="text-[11px] font-medium text-muted-foreground">{fmtDateShort(fx.date)}</div>
        <div className="text-[11px] text-muted-foreground/70">{played ? "FT" : fx.time}</div>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <Side name={fx.homeName} short={fx.homeShort} color={fx.homeColor} goals={fx.homeGoals} win={hw} dim={aw} />
        <Side name={fx.awayName} short={fx.awayShort} color={fx.awayColor} goals={fx.awayGoals} win={aw} dim={hw} />
      </div>
      {showLeague && <span className="hidden shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground sm:block">{fx.leagueShort}</span>}
    </Link>
  );
}
function Side({ name, short, color, goals, win, dim }: any) {
  return (
    <div className={cn("flex items-center justify-between gap-2", dim && "opacity-55")}>
      <span className="flex min-w-0 items-center gap-2">
        <Crest name={name} short={short} color={color} size="sm" />
        <span className={cn("truncate text-sm", win ? "font-semibold" : "font-medium")}>{name}</span>
      </span>
      <span className={cn("stat-num shrink-0 text-sm tabular-nums", win ? "font-bold" : "font-medium")}>
        {goals == null ? "" : goals}
      </span>
    </div>
  );
}

/* ------------------------------------------------------ PlayerImpactRow */
export function PlayerImpactRow({ p, rank }: { p: Player; rank?: number }) {
  const tier = teamImpactTier(p.teamImpact);
  return (
    <Link href={`/spiller/${p.id}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-muted">
      {rank != null && <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground">{rank}</span>}
      <Avatar name={p.name} posGroup={p.posGroup} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{p.name}</p>
        <p className="truncate text-xs text-muted-foreground">{p.teamShort} · {p.posGroup}</p>
      </div>
      <span className={cn("stat-num shrink-0 text-sm font-bold", TONE_TEXT[tier.tone])}>{signed(p.teamImpact, 2)}</span>
    </Link>
  );
}

export function ScorerRow({ p, rank }: { p: Player; rank?: number }) {
  return (
    <Link href={`/spiller/${p.id}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-muted">
      {rank != null && <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground">{rank}</span>}
      <Avatar name={p.name} posGroup={p.posGroup} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{p.name}</p>
        <p className="truncate text-xs text-muted-foreground">{p.teamShort}</p>
      </div>
      <span className="stat-num shrink-0 text-sm font-bold">{p.goals}</span>
    </Link>
  );
}

/* ----------------------------------------------------------- LeagueCard */
export function LeagueCard({ league, top }: { league: League; top: Team[] }) {
  return (
    <Link href={`/liga/${league.id}`} className="group flex flex-col rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: league.color }} />
            <h3 className="truncate font-semibold">{league.name}</h3>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Nivå {league.level} · {league.season}{league.inProgress ? " (pågår)" : ""}
          </p>
        </div>
        <DataBadge source={league.dataSource} />
      </div>
      <div className="mt-3 space-y-1">
        {top.map((t, i) => (
          <div key={t.id} className="flex items-center gap-2 text-sm">
            <span className="w-4 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
            <Crest name={t.name} short={t.short} color={t.color} badge={t.badge} size="sm" />
            <span className="flex-1 truncate">{t.name}</span>
            <span className="stat-num font-semibold tabular-nums">{t.points}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{league.teamCount} lag</span>
        <span className="inline-flex items-center gap-1 text-primary opacity-0 transition group-hover:opacity-100">Se liga →</span>
        <span>{fmt(league.stats.goalsPerMatch, 2)} mål/kamp</span>
      </div>
    </Link>
  );
}

/* ----------------------------------------------------------- SparkBars */
export function SparkBars({ values, width = 200, height = 46 }: { values: number[]; width?: number; height?: number }) {
  if (!values.length) return null;
  const max = Math.max(1, ...values.map((v) => Math.abs(v)));
  const bw = width / values.length;
  const mid = height / 2;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <line x1={0} y1={mid} x2={width} y2={mid} stroke="hsl(var(--border))" strokeWidth={1} />
      {values.map((v, i) => {
        const h = (Math.abs(v) / max) * (mid - 2);
        const y = v >= 0 ? mid - h : mid;
        return <rect key={i} x={i * bw + 1} y={y} width={Math.max(1.5, bw - 2)} height={Math.max(1, h)} rx={1} fill={v >= 0 ? "hsl(var(--success))" : "hsl(var(--danger))"} />;
      })}
    </svg>
  );
}

/* ----------------------------------------------------------- TeamTableRow */
export function MiniTableRow({ t, accent }: { t: Team; accent?: string | null }) {
  return (
    <Link
      href={`/lag/${t.id}`}
      className={cn("flex items-center gap-2 border-l-2 px-2 py-1.5 text-sm transition hover:bg-muted", accent || "border-l-transparent")}
    >
      <span className="w-5 text-center text-xs font-semibold text-muted-foreground">{t.position}</span>
      <Crest name={t.name} short={t.short} color={t.color} badge={t.badge} size="sm" />
      <span className="flex-1 truncate">{t.name}</span>
      <span className="stat-num w-7 text-right tabular-nums text-muted-foreground">{t.played}</span>
      <span className="stat-num w-7 text-right font-bold tabular-nums">{t.points}</span>
    </Link>
  );
}
