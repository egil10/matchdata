"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RotateCcw, Star } from "lucide-react";
import { usePlayers, useLeagues, useGender, useDebounced, type CPlayer } from "@/lib/client";
import { cn } from "@/lib/cn";
import { fmt, signed } from "@/lib/format";
import { teamImpactTier, TONE_TEXT } from "@/lib/metrics";
import { PageHeader, Avatar, Badge } from "@/components/ui/primitives";
import { Field, Select, SearchInput, Toggle, SortHeader } from "@/components/ui/controls";

type SortKey = "n" | "ts" | "st" | "gls" | "min" | "pm" | "tiv" | "cards";
const SORT_VAL: Record<SortKey, (p: CPlayer) => number | string> = {
  n: (p) => p.n.toLowerCase(),
  ts: (p) => p.ts.toLowerCase(),
  st: (p) => p.st * 1000 + p.sub,
  gls: (p) => p.gls,
  min: (p) => p.min,
  pm: (p) => p.pm,
  tiv: (p) => (p.tiv ?? -999),
  cards: (p) => p.y + p.r * 10,
};

export default function SpillerePage() {
  const gender = useGender();
  const players = usePlayers();
  const leagues = useLeagues();

  const [q, setQ] = useState("");
  const dq = useDebounced(q, 180);
  const [league, setLeague] = useState("all");
  const [fylke, setFylke] = useState("all");
  const [by, setBy] = useState("all");
  const [pos, setPos] = useState("all");
  const [natOnly, setNatOnly] = useState(false);
  const [minMin, setMinMin] = useState(0);
  const dMinMin = useDebounced(minMin, 120);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "tiv", dir: "desc" });

  const pool = useMemo(() => (players || []).filter((p) => p.g === gender), [players, gender]);
  const leaguesG = useMemo(
    () => (leagues || []).filter((l) => l.gender === gender).sort((a, b) => a.name.localeCompare(b.name, "nb")),
    [leagues, gender],
  );
  const fylker = useMemo(() => [...new Set(pool.map((p) => p.fy))].sort((a, b) => a.localeCompare(b, "nb")), [pool]);
  // Birth-year → age, taken straight from the data so the label tracks the
  // current season instead of a hardcoded base year.
  const years = useMemo(() => {
    const byAge = new Map<number, number>();
    for (const p of pool) if (!byAge.has(p.by)) byAge.set(p.by, p.age);
    return [...byAge.entries()].sort((a, b) => b[0] - a[0]);
  }, [pool]);

  const filtered = useMemo(() => {
    const ql = dq.trim().toLowerCase();
    let r = pool.filter((p) =>
      (!ql || p.n.toLowerCase().includes(ql)) &&
      (league === "all" || p.lg === league) &&
      (fylke === "all" || p.fy === fylke) &&
      (by === "all" || p.by === +by) &&
      (pos === "all" || p.pg === pos) &&
      (!natOnly || p.nat === 1) &&
      p.min >= dMinMin);
    const f = SORT_VAL[sort.key];
    r = [...r].sort((a, b) => {
      const av = f(a), bv = f(b);
      const c = typeof av === "string" ? (av as string).localeCompare(bv as string, "nb") : (av as number) - (bv as number);
      return sort.dir === "asc" ? c : -c;
    });
    return r;
  }, [pool, dq, league, fylke, by, pos, natOnly, dMinMin, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "n" || key === "ts" ? "asc" : "desc" }));
  }
  function reset() {
    setQ(""); setLeague("all"); setFylke("all"); setBy("all"); setPos("all"); setNatOnly(false); setMinMin(0);
  }

  const shown = useMemo(() => filtered.slice(0, 400), [filtered]);

  return (
    <div>
      <PageHeader
        title="Spillersøk"
        subtitle="Søk og filtrer spillere på tvers av ligaer. Spillerdata er modellert."
        badge={<Badge tone="low">Modellert</Badge>}
      />

      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Navn" className="sm:col-span-2 lg:col-span-1">
            <SearchInput value={q} onChange={setQ} placeholder="Søk spiller…" />
          </Field>
          <Field label="Liga">
            <Select value={league} onChange={setLeague} options={[{ value: "all", label: "Alle ligaer" }, ...leaguesG.map((l) => ({ value: l.id, label: l.name }))]} />
          </Field>
          <Field label="Posisjon">
            <Select value={pos} onChange={setPos} options={[{ value: "all", label: "Alle" }, ...["Keeper", "Forsvar", "Midtbane", "Angrep"].map((g) => ({ value: g, label: g }))]} />
          </Field>
          <Field label="Fylke">
            <Select value={fylke} onChange={setFylke} options={[{ value: "all", label: "Alle fylker" }, ...fylker.map((f) => ({ value: f, label: f }))]} />
          </Field>
          <Field label="Fødselsår">
            <Select value={by} onChange={setBy} options={[{ value: "all", label: "Alle år" }, ...years.map(([y, age]) => ({ value: String(y), label: `${y} (${age} år)` }))]} />
          </Field>
          <Field label={`Min. spilletid: ${minMin} min`}>
            <input type="range" min={0} max={2000} step={90} value={minMin} onChange={(e) => setMinMin(+e.target.value)} className="h-9 w-full accent-[hsl(var(--primary))]" />
          </Field>
          <div className="flex items-end gap-2">
            <Toggle checked={natOnly} onChange={setNatOnly} label="Kun landslag" />
            <button onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Nullstill
            </button>
          </div>
        </div>
      </div>

      <p className="mb-2 text-sm text-muted-foreground">
        {players ? <>Viser <span className="font-medium text-foreground">{fmt(shown.length)}</span> av {fmt(filtered.length)} spillere</> : "Laster…"}
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-2 py-2.5 text-center font-semibold">#</th>
              <SortHeader label="Spiller" active={sort.key === "n"} dir={sort.dir} onClick={() => toggleSort("n")} align="left" />
              <SortHeader label="Lag" active={sort.key === "ts"} dir={sort.dir} onClick={() => toggleSort("ts")} align="left" />
              <SortHeader label="S (I)" active={sort.key === "st"} dir={sort.dir} onClick={() => toggleSort("st")} />
              <SortHeader label="Mål" active={sort.key === "gls"} dir={sort.dir} onClick={() => toggleSort("gls")} />
              <SortHeader label="Min" active={sort.key === "min"} dir={sort.dir} onClick={() => toggleSort("min")} />
              <SortHeader label="+/−/90" active={sort.key === "pm"} dir={sort.dir} onClick={() => toggleSort("pm")} />
              <SortHeader label="Team Impact" active={sort.key === "tiv"} dir={sort.dir} onClick={() => toggleSort("tiv")} align="right" />
              <SortHeader label="Kort" active={sort.key === "cards"} dir={sort.dir} onClick={() => toggleSort("cards")} />
            </tr>
          </thead>
          <tbody>
            {shown.map((p, i) => {
              const tier = teamImpactTier(p.tiv);
              return (
                <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/40">
                  <td className="px-2 py-2 text-center text-xs tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-2 py-2">
                    <Link href={`/spiller/${p.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                      <Avatar name={p.n} posGroup={p.pg} size="sm" />
                      <span className="truncate">{p.n}</span>
                      {p.nat === 1 && <Star className="h-3 w-3 shrink-0 fill-amber-500 text-amber-500" aria-label="Landslagsspiller" />}
                    </Link>
                  </td>
                  <td className="px-2 py-2"><Link href={`/lag/${p.ti}`} className="text-muted-foreground hover:text-foreground">{p.ts}</Link></td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{p.st} <span className="text-muted-foreground">({p.sub})</span></td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{p.gls}</td>
                  <td className="px-1.5 py-2 text-center tabular-nums text-muted-foreground">{fmt(p.min)}</td>
                  <td className={cn("px-1.5 py-2 text-center tabular-nums", p.pm > 0 ? "text-emerald-500" : p.pm < 0 ? "text-rose-500" : "")}>{signed(p.pm, 2)}</td>
                  <td className="px-2 py-2 text-right"><span className={cn("stat-num font-bold", TONE_TEXT[tier.tone])}>{p.tiv == null ? "–" : signed(p.tiv, 2)}</span></td>
                  <td className="px-1.5 py-2 text-center tabular-nums">{p.y ? <span className="text-amber-500">{p.y}</span> : ""}{p.r ? <span className="ml-1 text-rose-500">{p.r}</span> : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
