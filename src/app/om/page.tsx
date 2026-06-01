import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { meta } from "@/lib/db";
import { PageHeader, Card, DataBadge } from "@/components/ui/primitives";

export const metadata = { title: "Om & metode" };

function Formula({ children }: { children: React.ReactNode }) {
  return <pre className="my-2 overflow-x-auto rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-sm">{children}</pre>;
}
function H({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h2 id={id} className="mb-3 mt-10 scroll-mt-20 text-xl font-bold">{children}</h2>;
}

export default function OmPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Om & metode" subtitle="Hva Matchdata er, hvor dataene kommer fra, og hvordan tallene beregnes." />

      <p className="text-muted-foreground">
        Matchdata samler og analyserer statistikk fra norsk fotball — fra Eliteserien helt ned til grasrota
        (2. og 3. divisjon). Målet er å gjøre utviklingen til spillere og lag enklere å følge, særlig på nivåer
        hvor slik statistikk tradisjonelt er vanskelig tilgjengelig.
      </p>

      {/* DATA SOURCES — the honest core */}
      <H id="data">Datakilder — ekte vs. modellert</H>
      <p className="text-muted-foreground">
        Vi er helt åpne om hva som er hva. Hver verdi i appen er merket med én av to kilder:
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2"><DataBadge source="real" /></div>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Ekte resultater og tabeller:</strong> Eliteserien {" "}
            <strong className="text-foreground">2026 (pågående)</strong> fra{" "}
            <a href="https://www.thesportsdb.com" target="_blank" rel="noreferrer" className="text-foreground underline">TheSportsDB</a>;
            OBOS-ligaen 2025 + Eliteserien-historikk fra{" "}
            <a href="https://github.com/openfootball" target="_blank" rel="noreferrer" className="text-foreground underline">openfootball</a>{" "}
            (offentlig eiendom); <strong className="text-foreground">2. og 3. divisjon</strong> 2025-sluttabeller fra Wikipedia.
            Klubblogoer fra Wikidata/TheSportsDB; trenere og toppscorere fra Wikipedia.
          </p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2"><DataBadge source="modeled" /></div>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Spillernivå-data</strong> (tropper, spilletid, mål, kort, on-pitch
            målforskjell, Team Impact) og <strong className="text-foreground">lavere/kvinnelige divisjoner</strong> er
            <strong className="text-foreground"> modellert</strong>. Slike data finnes ikke offentlig tilgjengelig for
            norsk lavnivåfotball — de ligger i NFFs FIKS-system, som ikke tillater automatisert innhenting.
          </p>
        </Card>
      </div>
      <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-muted-foreground">
        <AlertTriangle className="mb-1 inline h-4 w-4 text-amber-500" />{" "}
        <strong className="text-foreground">Viktig:</strong> Den modellerte spillerdataen er <em>forankret i de ekte
        resultatene</em> — ekte mål fordeles på modellerte målscorere og spilletider, slik at lagenes faktiske resultat
        og tabell alltid er korrekte. Men individuelle spillertall er estimater, ikke offisielle data. Bruk dem som en
        illustrasjon av metoden, ikke som fasit.
      </div>

      {/* basic */}
      <H id="grunnleggende">Grunnleggende beregninger</H>
      <h3 className="mt-4 font-semibold">S (I) — Starter (Innbytter)</h3>
      <p className="text-sm text-muted-foreground">Antall kamper startet, med innbytteropptredener i parentes. <span className="font-mono">8 (2)</span> = 8 starter + 2 innbytter = 10 kamper.</p>
      <h3 className="mt-4 font-semibold">Poeng per kamp (P/K)</h3>
      <Formula>P = S×3 + U{"\n"}P/K = P ÷ K</Formula>
      <p className="text-sm text-muted-foreground">Gjennomsnittlige poeng laget tar i kampene spilleren deltar i. Maks 3,00.</p>
      <h3 className="mt-4 font-semibold">Mål/kamp og Min/kamp</h3>
      <Formula>Mål/K = Mål ÷ K{"\n"}Min/K = Min ÷ K</Formula>

      {/* advanced */}
      <H id="avansert">Avanserte beregninger</H>
      <h3 className="mt-2 font-semibold">Målforskjell per 90 minutter (+/−/90)</h3>
      <Formula>+/−/90 = (MF − MM) × 90 ÷ Min</Formula>
      <p className="text-sm text-muted-foreground">Lagets målforskjell per 90 min mens spilleren er på banen. MF = mål for, MM = mål mot, mens spilleren spiller.</p>

      <h3 className="mt-5 font-semibold">Team Impact</h3>
      <p className="text-sm text-muted-foreground">En kombinert score for spillerens verdi for laget — prestasjon vektet dobbelt så høyt som spilletid:</p>
      <Formula>Team Impact = Prestasjon&nbsp;Z + (0,5 × Minutter&nbsp;Z){"\n\n"}Prestasjon Z = (spillerens +/−/90 − lagets MF/kamp) ÷ σ{"\n"}Minutter Z  = (spillerens minutter − snitt minutter) ÷ σ_min</Formula>
      <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
        <li><strong className="text-foreground">Prestasjon Z</strong> måler hvor mye bedre laget presterer med spilleren på banen.</li>
        <li><strong className="text-foreground">Minutter Z</strong> fanger «trenertillit» — spillere som spiller mye er ofte viktige.</li>
        <li>σ beregnes kun fra <strong className="text-foreground">kvalifiserte</strong> spillere (≥ 20 % av lagets totale spilletid).</li>
      </ul>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground"><th className="py-2">Team Impact</th><th>Tolkning</th></tr></thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border/50"><td className="py-1.5 font-mono text-emerald-400">≥ +2,0</td><td>Svært verdifull spiller</td></tr>
            <tr className="border-b border-border/50"><td className="py-1.5 font-mono text-emerald-500">≥ +1,0</td><td>Verdifull spiller</td></tr>
            <tr className="border-b border-border/50"><td className="py-1.5 font-mono">−1,0 … +1,0</td><td>Gjennomsnittlig bidrag</td></tr>
            <tr className="border-b border-border/50"><td className="py-1.5 font-mono text-amber-500">≤ −1,0</td><td>Under gjennomsnittet</td></tr>
            <tr><td className="py-1.5 font-mono text-rose-500">≤ −2,0</td><td>Laget presterer merkbart dårligere</td></tr>
          </tbody>
        </table>
      </div>

      <h3 className="mt-5 font-semibold">Vektet snittalder</h3>
      <Formula>Vektet alder = Σ(alder × min) ÷ Σ(min)</Formula>
      <p className="text-sm text-muted-foreground">Gjennomsnittsalder vektet etter spilletid — gir et mer presist bilde av alderen på banen.</p>

      <h3 className="mt-5 font-semibold">Vektet P/K (motstanderjustert)</h3>
      <Formula>Vektet P/K = Σ(poeng × motst_P/K × min/90) ÷ Σ(motst_P/K × min/90)</Formula>
      <p className="text-sm text-muted-foreground">Justerer poeng per kamp etter motstanderens styrke — seier mot sterke lag teller mer.</p>

      <h3 className="mt-5 font-semibold">Tabellsortering</h3>
      <p className="text-sm text-muted-foreground">Ved poenglikhet: 1) poeng, 2) målforskjell, 3) flest scorede mål.</p>

      {/* tech */}
      <H id="teknisk">Teknisk</H>
      <p className="text-sm text-muted-foreground">
        Bygget med Next.js, TypeScript, TailwindCSS og Recharts. Datasettet inneholder {meta.counts.leagues} ligaer,{" "}
        {meta.counts.teams} lag, {meta.counts.players} spillere og {meta.counts.matches} kamper
        ({meta.counts.realMatches} med ekte resultat). Sesong {meta.seasonLabel}.
        Hobbyprosjekt, ikke tilknyttet NFF.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/ligaer" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Utforsk ligaer</Link>
        <Link href="/utforsk" className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">Åpne datalab</Link>
      </div>
    </div>
  );
}
