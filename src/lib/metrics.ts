import type { Gender } from "./types";

export type Tone = "elite" | "good" | "avg" | "low" | "bad" | "muted";

export const TONE_TEXT: Record<Tone, string> = {
  elite: "text-emerald-400",
  good: "text-emerald-500",
  avg: "text-muted-foreground",
  low: "text-amber-500",
  bad: "text-rose-500",
  muted: "text-muted-foreground",
};
export const TONE_BG: Record<Tone, string> = {
  elite: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  good: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
  avg: "bg-muted text-muted-foreground border-border",
  low: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  bad: "bg-rose-500/10 text-rose-500 border-rose-500/25",
  muted: "bg-muted text-muted-foreground border-border",
};

export function teamImpactTier(ti: number | null): { label: string; tone: Tone } {
  if (ti == null) return { label: "Ikke kvalifisert", tone: "muted" };
  if (ti >= 2) return { label: "Svært verdifull", tone: "elite" };
  if (ti >= 1) return { label: "Verdifull", tone: "good" };
  if (ti > -1) return { label: "Gjennomsnittlig", tone: "avg" };
  if (ti > -2) return { label: "Under snittet", tone: "low" };
  return { label: "Svak", tone: "bad" };
}

export function tiTone(ti: number | null): Tone {
  return teamImpactTier(ti).tone;
}

export function pmTone(v: number): Tone {
  if (v >= 0.8) return "good";
  if (v > -0.8) return "avg";
  return "bad";
}

export function formColor(r: string): string {
  if (r === "W") return "bg-emerald-500 text-white";
  if (r === "D") return "bg-zinc-400/70 text-white dark:bg-zinc-500";
  return "bg-rose-500 text-white";
}
export function formLabel(r: string): string {
  return r === "W" ? "S" : r === "D" ? "U" : "T";
}

export const POS_GROUP_COLOR: Record<string, string> = {
  Keeper: "#f59e0b",
  Forsvar: "#0ea5e9",
  Midtbane: "#22c55e",
  Angrep: "#ef4444",
};

export function levelLabel(level: number, gender: Gender): string {
  const men = ["", "Eliteserien", "OBOS-ligaen", "2. divisjon", "3. divisjon", "4. divisjon"];
  const women = ["", "Toppserien", "1. divisjon", "2. divisjon"];
  return (gender === "women" ? women : men)[level] || `Nivå ${level}`;
}

export const GENDERS: { id: Gender; label: string }[] = [
  { id: "men", label: "Herrer" },
  { id: "women", label: "Kvinner" },
];

export function dataSourceMeta(ds: "real" | "modeled") {
  return ds === "real"
    ? { label: "Ekte data", tone: "good" as Tone, short: "Ekte" }
    : { label: "Modellert", tone: "low" as Tone, short: "Modell" };
}

// table accent zone by position within a league
export function tableZone(level: number, gender: Gender, position: number, teamCount: number): string | null {
  if (position === 1) return "champion";
  if (gender === "men" && level === 1 && position <= 3) return "europe";
  if (level >= 2 && position <= 2) return "promotion";
  if (position > teamCount - 2) return "relegation";
  return null;
}

export const ZONE_COLOR: Record<string, string> = {
  champion: "border-l-amber-400",
  europe: "border-l-sky-400",
  promotion: "border-l-emerald-400",
  relegation: "border-l-rose-400",
};
