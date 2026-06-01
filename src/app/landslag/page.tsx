import Link from "next/link";
import { Star } from "lucide-react";
import { getGender } from "@/lib/gender";
import * as db from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader, Card, Stat, Badge, Avatar, Crest } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/tabs";

export const metadata = { title: "Landslagsspillere" };

export default function LandslagPage() {
  const gender = getGender();
  const { players, teams } = db.nationalByGender(gender);

  return (
    <div>
      <PageHeader
        title="Landslagsspillere"
        subtitle="Spillere med landskamper, og lagene som leverer flest."
        badge={<Badge tone="low">Modellert</Badge>}
      />
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Spillere med landskamper" value={fmt(players.length)} />
        <Stat label="Lag representert" value={fmt(teams.length)} />
        <Stat label="Totalt antall landskamper" value={fmt(players.reduce((s, p) => s + p.caps, 0))} />
      </section>

      <Tabs
        items={[
          {
            id: "lag",
            label: "Lag",
            content: (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((t, i) => (
                  <Link key={t.teamId} href={`/lag/${t.teamId}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
                    <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{t.teamName}</p>
                      <p className="truncate text-xs text-muted-foreground">{t.leagueName}</p>
                    </div>
                    <div className="text-right">
                      <p className="stat-num text-lg font-bold">{t.count}</p>
                      <p className="text-[11px] text-muted-foreground">{t.caps} landsk.</p>
                    </div>
                  </Link>
                ))}
              </div>
            ),
          },
          {
            id: "spillere",
            label: "Spillere",
            content: (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((p) => (
                  <Link key={p.id} href={`/spiller/${p.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 transition hover:border-primary/40">
                    <Avatar name={p.name} posGroup={p.pos} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.teamName} · {p.pos}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500"><Star className="h-3.5 w-3.5" />{p.caps}</span>
                  </Link>
                ))}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
