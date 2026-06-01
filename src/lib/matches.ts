// Lazy access to full match detail (lineups + events). Server only.
// Each league's detail file is loaded on demand so routes stay lean.
import { fixtures } from "./db";
import type { MatchDetail } from "./types";

async function loadLeague(leagueId: string): Promise<MatchDetail[]> {
  switch (leagueId) {
    case "eliteserien": return (await import("@/data/generated/matches-eliteserien.json")).default as unknown as MatchDetail[];
    case "obos-ligaen": return (await import("@/data/generated/matches-obos-ligaen.json")).default as unknown as MatchDetail[];
    case "postnord-avd1": return (await import("@/data/generated/matches-postnord-avd1.json")).default as unknown as MatchDetail[];
    case "3div-avd1": return (await import("@/data/generated/matches-3div-avd1.json")).default as unknown as MatchDetail[];
    case "toppserien": return (await import("@/data/generated/matches-toppserien.json")).default as unknown as MatchDetail[];
    case "1div-kvinner": return (await import("@/data/generated/matches-1div-kvinner.json")).default as unknown as MatchDetail[];
    default: return [];
  }
}

export async function getLeagueMatches(leagueId: string): Promise<MatchDetail[]> {
  return loadLeague(leagueId);
}

export async function getMatch(id: string): Promise<MatchDetail | null> {
  const fx = fixtures.find((f) => f.id === id);
  if (!fx) return null;
  const list = await loadLeague(fx.leagueId);
  return list.find((m) => m.id === id) || null;
}

export async function getTeamLastMatches(leagueId: string, teamId: string, n = 5): Promise<MatchDetail[]> {
  const list = await loadLeague(leagueId);
  return list
    .filter((m) => m.status === "played" && (m.homeTeamId === teamId || m.awayTeamId === teamId))
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, n);
}
