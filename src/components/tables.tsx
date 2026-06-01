import Link from "next/link";
import { cn } from "@/lib/cn";
import { signed, fmt } from "@/lib/format";
import { tableZone, ZONE_COLOR, teamImpactTier, TONE_TEXT } from "@/lib/metrics";
import type { League, Team, Player } from "@/lib/types";
import { Crest, Avatar, FormGuide, Badge } from "@/components/ui/primitives";

/* ----------------------------------------------------------- League table */
export function LeagueTable({ teams, league }: { teams: Team[]; league: League }) {
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-2 py-2.5 text-center font-semibold">#</th>
              <th className="px-2 py-2.5 text-left font-semibold">Lag</th>
              <th className="px-1.5 py-2.5 text-center font-semibold">K</th>
              <th className="px-1.5 py-2.5 text-center font-semibold">S</th>
              <th className="px-1.5 py-2.5 text-center font-semibold">U</th>
              <th className="px-1.5 py-2.5 text-center font-semibold">T</th>
              <th className="hidden px-1.5 py-2.5 text-center font-semibold sm:table-cell">M+</th>
              <th className="hidden px-1.5 py-2.5 text-center font-semibold sm:table-cell">M−</th>
              <th className="px-1.5 py-2.5 text-center font-semibold">MF</th>
              <th className="px-2 py-2.5 text-center font-semibold">P</th>
              <th className="hidden px-2 py-2.5 text-right font-semibold md:table-cell">Form</th>
              <th className="hidden px-2 py-2.5 text-center font-semibold lg:table-cell">Alder</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => {
              const zone = tableZone(league.level, league.gender, t.position, league.teamCount);
              return (
                <tr key={t.id} className="border-b border-border/50 transition last:border-0 hover:bg-muted/40">
                  <td className={cn("border-l-[3px] px-2 py-2 text-center font-semibold tabular-nums", ZONE_COLOR[zone || ""] || "border-l-transparent")}>{t.position}</td>
                  <td className="px-2 py-2">
                    <Link href={`/lag/${t.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                      <Crest name={t.name} short={t.short} color={t.color} badge={t.badge} size="sm" />
                      <span className="truncate">{t.name}</span>
                    </Link>
                  </td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-muted-foreground">{t.played}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{t.w}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{t.d}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{t.l}</td>
                  <td className="hidden px-1.5 py-2 text-center tabular-nums text-muted-foreground sm:table-cell">{t.gf}</td>
                  <td className="hidden px-1.5 py-2 text-center tabular-nums text-muted-foreground sm:table-cell">{t.ga}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums font-medium">{signed(t.gd, 0)}</td>
                  <td className="px-2 py-2 text-center font-bold tabular-nums">{t.points}</td>
                  <td className="hidden px-2 py-2 md:table-cell"><div className="flex justify-end"><FormGuide form={t.form.slice(-5)} /></div></td>
                  <td className="hidden px-2 py-2 text-center tabular-nums text-muted-foreground lg:table-cell">{fmt(t.weightedAvgAge, 1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TableLegend league={league} />
    </div>
  );
}

function TableLegend({ league }: { league: League }) {
  const items: { color: string; label: string }[] = [];
  if (league.gender === "men" && league.level === 1) {
    items.push({ color: "bg-amber-400", label: "Mester" }, { color: "bg-sky-400", label: "Europa" }, { color: "bg-rose-400", label: "Nedrykk" });
  } else if (league.level >= 2) {
    items.push({ color: "bg-emerald-400", label: "Opprykk" }, { color: "bg-rose-400", label: "Nedrykk" });
  } else {
    items.push({ color: "bg-amber-400", label: "Mester" }, { color: "bg-rose-400", label: "Nedrykk" });
  }
  return (
    <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-sm", i.color)} /> {i.label}
        </span>
      ))}
      <span className="ml-auto hidden sm:block">K=kamper · MF=målforskjell · P=poeng</span>
    </div>
  );
}

/* ------------------------------------------------------- Top players table */
export function ImpactTable({ players, showTeam = true }: { players: Player[]; showTeam?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-2 py-2.5 text-center font-semibold">#</th>
            <th className="px-2 py-2.5 text-left font-semibold">Spiller</th>
            {showTeam && <th className="hidden px-2 py-2.5 text-left font-semibold sm:table-cell">Lag</th>}
            <th className="px-1.5 py-2.5 text-center font-semibold">S(I)</th>
            <th className="px-1.5 py-2.5 text-center font-semibold">Min</th>
            <th className="px-1.5 py-2.5 text-center font-semibold">Mål</th>
            <th className="px-1.5 py-2.5 text-center font-semibold">+/−/90</th>
            <th className="px-2 py-2.5 text-right font-semibold">Team Impact</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => {
            const tier = teamImpactTier(p.teamImpact);
            return (
              <tr key={p.id} className="border-b border-border/50 transition last:border-0 hover:bg-muted/40">
                <td className="px-2 py-2 text-center font-semibold tabular-nums text-muted-foreground">{i + 1}</td>
                <td className="px-2 py-2">
                  <Link href={`/spiller/${p.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                    <Avatar name={p.name} posGroup={p.posGroup} size="sm" />
                    <span className="truncate">{p.name}</span>
                  </Link>
                </td>
                {showTeam && (
                  <td className="hidden px-2 py-2 sm:table-cell">
                    <Link href={`/lag/${p.teamId}`} className="text-muted-foreground hover:text-foreground">{p.teamShort}</Link>
                  </td>
                )}
                <td className="px-1.5 py-2 text-center tabular-nums">{p.starts} <span className="text-muted-foreground">({p.sub})</span></td>
                <td className="px-1.5 py-2 text-center tabular-nums text-muted-foreground">{fmt(p.minutes)}</td>
                <td className="px-1.5 py-2 text-center tabular-nums">{p.goals}</td>
                <td className={cn("px-1.5 py-2 text-center tabular-nums font-medium", p.plusMinus90 > 0 ? "text-emerald-500" : p.plusMinus90 < 0 ? "text-rose-500" : "")}>{signed(p.plusMinus90, 2)}</td>
                <td className="px-2 py-2 text-right">
                  <span className={cn("stat-num font-bold", TONE_TEXT[tier.tone])}>{signed(p.teamImpact, 2)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
