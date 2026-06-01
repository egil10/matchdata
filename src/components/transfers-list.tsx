"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowRight } from "lucide-react";
import { fmtDate, isoWeek } from "@/lib/format";
import { SearchInput } from "@/components/ui/controls";
import type { Transfer } from "@/lib/types";

export function TransfersList({ transfers }: { transfers: Transfer[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return transfers;
    return transfers.filter((t) => t.playerName.toLowerCase().includes(ql) || t.fromName.toLowerCase().includes(ql) || t.toName.toLowerCase().includes(ql));
  }, [transfers, q]);

  const groups = useMemo(() => {
    const g: Record<string, Transfer[]> = {};
    for (const t of filtered) {
      const k = `Uke ${isoWeek(t.date)}`;
      (g[k] ||= []).push(t);
    }
    return Object.entries(g);
  }, [filtered]);

  return (
    <div>
      <div className="mb-5 max-w-sm"><SearchInput value={q} onChange={setQ} placeholder="Søk spiller eller lag…" /></div>
      <div className="space-y-6">
        {groups.map(([week, ts]) => (
          <section key={week}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{week} · {fmtDate(ts[0].date)}</h2>
            <div className="space-y-2">
              {ts.map((t) => <Row key={t.id} t={t} />)}
            </div>
          </section>
        ))}
        {groups.length === 0 && <p className="text-sm text-muted-foreground">Ingen overganger funnet.</p>}
      </div>
    </div>
  );
}

function Row({ t }: { t: Transfer }) {
  const Dir = t.direction === "up" ? ArrowUp : t.direction === "down" ? ArrowDown : ArrowRight;
  const dirColor = t.direction === "up" ? "text-emerald-500" : t.direction === "down" ? "text-rose-500" : "text-muted-foreground";
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-border bg-card px-3 py-2.5">
      <Link href={`/spiller/${t.playerId}`} className="min-w-0 flex-1 font-medium hover:text-primary">
        {t.playerName} <span className="text-xs font-normal text-muted-foreground">{t.pos} · {t.age} år</span>
      </Link>
      <div className="flex items-center gap-2 text-sm">
        <Pill name={t.fromShort} color={t.fromColor} href={`/lag/${t.fromTeamId}`} title={t.fromLeague} />
        <Dir className={`h-4 w-4 ${dirColor}`} />
        <Pill name={t.toShort} color={t.toColor} href={`/lag/${t.toTeamId}`} title={t.toLeague} />
      </div>
      <span className="ml-auto text-xs text-muted-foreground">{t.fromLeague} → {t.toLeague}</span>
    </div>
  );
}

function Pill({ name, color, href, title }: { name: string; color: string; href: string; title: string }) {
  return (
    <Link href={href} title={title} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 font-medium hover:border-primary/40">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {name}
    </Link>
  );
}
