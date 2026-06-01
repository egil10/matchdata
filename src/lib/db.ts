// Server-side data access layer. Imports the generated JSON datasets.
// NOTE: only import this from Server Components — it pulls in multi-MB data.
import leaguesData from "@/data/generated/leagues.json";
import teamsData from "@/data/generated/teams.json";
import playersData from "@/data/generated/players.json";
import fixturesData from "@/data/generated/fixtures.json";
import historyData from "@/data/generated/history.json";
import progressionData from "@/data/generated/progression.json";
import transfersData from "@/data/generated/transfers.json";
import nationalData from "@/data/generated/national.json";
import ageData from "@/data/generated/age.json";
import metaData from "@/data/generated/meta.json";
import type {
  League, Team, Player, Fixture, Transfer, HistorySeason, Meta, Gender,
} from "./types";

export const meta = metaData as Meta;
export const leagues = leaguesData as unknown as League[];
export const teams = teamsData as unknown as Team[];
export const players = playersData as unknown as Player[];
export const fixtures = fixturesData as unknown as Fixture[];
const history = historyData as unknown as Record<string, Record<string, HistorySeason>>;
const progression = progressionData as unknown as Record<string, { maxRound: number; series: { teamId: string; name: string; points: number[] }[] }>;
export const transfers = transfersData as unknown as Transfer[];
export const national = nationalData as unknown as {
  players: { id: string; name: string; teamId: string; teamName: string; leagueName: string; gender: Gender; caps: number; pos: string; age: number }[];
  teams: { teamId: string; teamName: string; leagueName: string; gender: Gender; count: number; caps: number }[];
};
export const age = ageData as unknown as Record<Gender, {
  total: number; avgAge: number; weightedAvgAge: number;
  bars: { birthYear: number; age: number; count: number }[];
}>;

const leagueById = new Map(leagues.map((l) => [l.id, l]));
const teamById = new Map(teams.map((t) => [t.id, t]));
const playerById = new Map(players.map((p) => [p.id, p]));

// --- leagues ---
export const getLeague = (id: string) => leagueById.get(id);
export const leaguesByGender = (g: Gender) =>
  leagues.filter((l) => l.gender === g).sort((a, b) => a.level - b.level);

// --- teams ---
export const getTeam = (id: string) => teamById.get(id);
export const teamsByLeague = (id: string) =>
  teams.filter((t) => t.leagueId === id).sort((a, b) => a.position - b.position);
export const teamsByGender = (g: Gender) => teams.filter((t) => t.gender === g);

// --- players ---
export const getPlayer = (id: string) => playerById.get(id);
export const playersByTeam = (id: string) => players.filter((p) => p.teamId === id);
export const playersByLeague = (id: string) => players.filter((p) => p.leagueId === id);
export const playersByBirthYear = (year: number, g: Gender) =>
  players.filter((p) => p.birthYear === year && p.gender === g).sort((a, b) => b.minutes - a.minutes);

// --- fixtures ---
export const fixturesByLeague = (id: string) =>
  fixtures.filter((f) => f.leagueId === id);
export const fixturesByTeam = (id: string) =>
  fixtures.filter((f) => f.homeTeamId === id || f.awayTeamId === id);

export function upcomingByGender(g: Gender, limit = 12): Fixture[] {
  const ids = new Set(leaguesByGender(g).map((l) => l.id));
  return fixtures
    .filter((f) => f.status === "scheduled" && ids.has(f.leagueId))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, limit);
}
export function recentByGender(g: Gender, limit = 12): Fixture[] {
  const ids = new Set(leaguesByGender(g).map((l) => l.id));
  return fixtures
    .filter((f) => f.status === "played" && ids.has(f.leagueId))
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, limit);
}

// --- derived ---
export function topPlayersByImpact(leagueId: string, n = 10): Player[] {
  return players
    .filter((p) => p.leagueId === leagueId && p.teamImpact != null)
    .sort((a, b) => (b.teamImpact as number) - (a.teamImpact as number))
    .slice(0, n);
}
export function topScorers(leagueId: string, n = 10): Player[] {
  return players
    .filter((p) => p.leagueId === leagueId)
    .sort((a, b) => b.goals - a.goals || b.minutes - a.minutes)
    .slice(0, n);
}
export function topPlayersByImpactGender(g: Gender, n = 12): Player[] {
  return players
    .filter((p) => p.gender === g && p.teamImpact != null)
    .sort((a, b) => (b.teamImpact as number) - (a.teamImpact as number))
    .slice(0, n);
}

export function getHistory(leagueId: string): HistorySeason[] {
  const h = history[leagueId];
  return h ? Object.values(h).sort((a, b) => b.season - a.season) : [];
}
export function getProgression(leagueId: string) {
  return progression[leagueId];
}

export function transfersByGender(g: Gender): Transfer[] {
  return transfers.filter((t) => teamById.get(t.fromTeamId)?.gender === g);
}
export function nationalByGender(g: Gender) {
  return {
    players: national.players.filter((p) => p.gender === g),
    teams: national.teams.filter((t) => t.gender === g),
  };
}
