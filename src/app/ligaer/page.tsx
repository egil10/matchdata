import Link from "next/link";
import { getGender } from "@/lib/gender";
import * as db from "@/lib/db";
import { fmt, pct } from "@/lib/format";
import { PageHeader, Card, DataBadge } from "@/components/ui/primitives";
import { LeagueCard } from "@/components/widgets";

export const metadata = { title: "Ligaer" };

export default function LigaerPage() {
  const gender = getGender();
  const leagues = db.leaguesByGender(gender);
  const byLevel = leagues.reduce<Record<number, typeof leagues>>((acc, l) => {
    (acc[l.level] ||= []).push(l);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Ligaer"
        subtitle={`${gender === "men" ? "Herrefotball" : "Kvinnefotball"} · ${leagues.length} ligaer · sesong ${db.meta.seasonLabel}`}
      />

      <div className="space-y-8">
        {Object.entries(byLevel).map(([level, ls]) => (
          <section key={level}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="grid h-5 w-5 place-items-center rounded bg-muted text-[11px] font-bold text-foreground">{level}</span>
              Nivå {level}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ls.map((l) => (
                <LeagueCard key={l.id} league={l} top={db.teamsByLeague(l.id).slice(0, 3)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Ligaoversikt</h2>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 text-left font-semibold">Liga</th>
                <th className="px-2 py-2.5 text-center font-semibold">Nivå</th>
                <th className="px-2 py-2.5 text-center font-semibold">Lag</th>
                <th className="px-2 py-2.5 text-center font-semibold">Kamper</th>
                <th className="px-2 py-2.5 text-center font-semibold">Mål/kamp</th>
                <th className="px-2 py-2.5 text-center font-semibold">Hjemmeseier</th>
                <th className="px-2 py-2.5 text-center font-semibold">Snittalder</th>
                <th className="px-3 py-2.5 text-right font-semibold">Kilde</th>
              </tr>
            </thead>
            <tbody>
              {leagues.map((l) => (
                <tr key={l.id} className="border-b border-border/50 last:border-0 hover:bg-muted/40">
                  <td className="px-3 py-2.5">
                    <Link href={`/liga/${l.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} /> {l.name}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{l.level}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{l.teamCount}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{l.stats.matches}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{fmt(l.stats.goalsPerMatch, 2)}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{pct(l.stats.homeWinPct, 0)}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{fmt(l.stats.avgAgeWeighted, 1)}</td>
                  <td className="px-3 py-2.5 text-right"><DataBadge source={l.dataSource} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
