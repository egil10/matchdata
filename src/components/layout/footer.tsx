import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { NAV, NAV_MORE } from "@/lib/nav";
import meta from "@/data/generated/meta.json";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="font-display text-lg font-extrabold lowercase tracking-tight">
              match<span className="text-muted-foreground">data</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Avansert statistikk og analyse for norsk fotball — fra Eliteserien helt ned til grasrota.
          </p>
        </div>

        <nav className="text-sm">
          <p className="mb-3 font-semibold">Utforsk</p>
          <ul className="space-y-2 text-muted-foreground">
            {NAV.map((n) => (
              <li key={n.href}><Link href={n.href} className="hover:text-foreground">{n.label}</Link></li>
            ))}
          </ul>
        </nav>

        <nav className="text-sm">
          <p className="mb-3 font-semibold">Mer</p>
          <ul className="space-y-2 text-muted-foreground">
            {NAV_MORE.map((n) => (
              <li key={n.href}><Link href={n.href} className="hover:text-foreground">{n.label}</Link></li>
            ))}
          </ul>
        </nav>

        <div className="text-sm">
          <p className="mb-3 font-semibold">Datakilder</p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              Resultater &amp; tabeller:{" "}
              <a href="https://github.com/openfootball" target="_blank" rel="noreferrer" className="text-foreground hover:underline">openfootball</a>{" "}
              <span className="text-xs">(offentlig eiendom)</span>
            </li>
            <li>
              Klubbdata &amp; logoer:{" "}
              <a href="https://www.thesportsdb.com" target="_blank" rel="noreferrer" className="text-foreground hover:underline">TheSportsDB</a>
            </li>
            <li className="text-xs">
              Spillernivå-statistikk er <span className="font-medium text-amber-500">modellert</span> og merket i appen.{" "}
              <Link href="/om" className="underline">Les mer</Link>.
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Matchdata · Hobbyprosjekt · Ikke tilknyttet NFF</p>
          <p>Sesong {meta.seasonLabel} · {meta.counts.players} spillere · {meta.counts.matches} kamper</p>
        </div>
      </div>
    </footer>
  );
}
