"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Heart, Users, Shield } from "lucide-react";
import { useFavorites } from "@/lib/use-favorites";
import { usePlayers, useTeams } from "@/lib/client";
import { fmt, signed } from "@/lib/format";
import { TONE_TEXT, teamImpactTier } from "@/lib/metrics";
import { PageHeader, Card, Avatar, Crest, Empty } from "@/components/ui/primitives";

export default function FavoritterPage() {
  const { favs, ready, toggle } = useFavorites();
  const players = usePlayers();
  const teams = useTeams();

  const favPlayers = useMemo(() => (players || []).filter((p) => favs.p.includes(p.id)), [players, favs.p]);
  const favTeams = useMemo(() => (teams || []).filter((t) => favs.t.includes(t.id)), [teams, favs.t]);

  return (
    <div>
      <PageHeader title="Favoritter" subtitle="Lagene og spillerne du følger. Lagres lokalt i nettleseren." />

      {ready && favPlayers.length === 0 && favTeams.length === 0 && (
        <Empty>
          <div className="space-y-2">
            <Heart className="mx-auto h-8 w-8 opacity-40" />
            <p>Du har ingen favoritter ennå.</p>
            <p className="text-xs">Trykk på hjertet på en spiller- eller lagside for å legge til.</p>
            <Link href="/spillere" className="inline-block text-primary hover:underline">Finn spillere →</Link>
          </div>
        </Empty>
      )}

      {favTeams.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Shield className="h-4 w-4" /> Lag ({favTeams.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favTeams.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <Crest name={t.n} short={t.s} color={t.color} badge={t.badge} size="lg" />
                <Link href={`/lag/${t.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold hover:text-primary">{t.n}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.ln} · {t.pos}. plass · {t.pts}p</p>
                </Link>
                <button onClick={() => toggle("t", t.id)} className="text-rose-500" aria-label="Fjern favoritt"><Heart className="h-4 w-4 fill-current" /></button>
              </div>
            ))}
          </div>
        </section>
      )}

      {favPlayers.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Users className="h-4 w-4" /> Spillere ({favPlayers.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favPlayers.map((p) => {
              const tier = teamImpactTier(p.tiv);
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <Avatar name={p.n} posGroup={p.pg} size="lg" />
                  <Link href={`/spiller/${p.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-semibold hover:text-primary">{p.n}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.ts} · {p.gls} mål · {fmt(p.min)} min</p>
                    <p className={`text-xs font-semibold ${TONE_TEXT[tier.tone]}`}>Impact {p.tiv == null ? "–" : signed(p.tiv, 2)}</p>
                  </Link>
                  <button onClick={() => toggle("p", p.id)} className="text-rose-500" aria-label="Fjern favoritt"><Heart className="h-4 w-4 fill-current" /></button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
