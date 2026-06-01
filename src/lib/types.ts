export type Gender = "men" | "women";
export type DataSource = "real" | "modeled";

export interface Meta {
  generatedAt: string;
  season: number;
  seasonLabel: string;
  counts: {
    leagues: number; teams: number; players: number;
    matches: number; realMatches: number; modeledMatches: number;
  };
  realLeagueIds: string[];
  modeledLeagueIds: string[];
  attribution: { openfootball: string; thesportsdb: string };
}

export interface LeagueStats {
  matches: number; goals: number; goalsPerMatch: number;
  homeWinPct: number; drawPct: number; awayWinPct: number;
  cards: number; cardsPerMatch: number; avgAgeWeighted: number; players: number;
}

export interface League {
  id: string; name: string; short: string;
  divisionName: string; avdeling: string | null;
  level: number; gender: Gender; color: string;
  dataSource: DataSource; season: number;
  teamCount: number; matchCount: number;
  roundsTotal: number; roundsPlayed: number; inProgress: boolean;
  stats: LeagueStats;
  ageAnalysis: { teamId: string; name: string; short: string; weightedAvgAge: number; avgAge: number }[];
  goalsByRound: { round: number; goals: number; matches: number; home: number; away: number; draw: number }[];
}

export interface Team {
  id: string; name: string; short: string; slug: string;
  leagueId: string; leagueName: string; leagueShort: string;
  level: number; gender: Gender; color: string; dataSource: DataSource;
  city: string; fylke: string;
  founded: number | null; stadium: string | null; capacity: number | null;
  badge: string | null; desc: string | null;
  played: number; w: number; d: number; l: number;
  gf: number; ga: number; gd: number; points: number;
  ppg: number; mfPerMatch: number; form: string[];
  home: { p: number; w: number; d: number; l: number };
  away: { p: number; w: number; d: number; l: number };
  cleanSheets: number; failedToScore: number;
  longestWin: number; longestUnbeaten: number;
  weightedAvgAge: number; avgAge: number; squadSize: number;
  position: number;
}

export interface Player {
  id: string; name: string; firstName: string; lastName: string; slug: string;
  teamId: string; teamName: string; teamShort: string;
  leagueId: string; leagueName: string; leagueShort: string;
  level: number; gender: Gender; dataSource: DataSource;
  pos: string; posGroup: string; shirtNo: number;
  birthYear: number; age: number; nationality: string; fylke: string;
  isNationalTeam: boolean; caps: number; captain: boolean;
  k: number; starts: number; sub: number; minutes: number; goals: number;
  yellow: number; red: number; w: number; d: number; l: number;
  points: number; ppg: number; gpg: number; mpg: number;
  onGF: number; onGA: number; plusMinus90: number; weightedPpg: number;
  perfZ: number | null; minZ: number | null; teamImpact: number | null; qualified: boolean;
}

export interface Fixture {
  id: string; leagueId: string; leagueShort: string; level: number; season: number;
  round: number; date: string; time: string;
  status: "played" | "scheduled"; dataSource: DataSource;
  homeTeamId: string; awayTeamId: string;
  homeName: string; awayName: string; homeShort: string; awayShort: string;
  homeColor: string; awayColor: string;
  homeGoals: number | null; awayGoals: number | null;
  htHome: number | null; htAway: number | null;
  result: "H" | "A" | "D" | null;
}

export interface MatchEvent {
  minute: number; type: "goal" | "yellow" | "red" | "sub"; side: "home" | "away";
  playerId?: string | null; playerName?: string | null; no?: number | null;
  inId?: string; inName?: string; inNo?: number;
  outId?: string; outName?: string; outNo?: number;
}

export interface Appearance {
  playerId: string; name: string; shirtNo: number;
  pos: string; posGroup: string; started: boolean; captain: boolean;
  minIn: number | null; minOut: number | null; minutes: number;
  goals: number; yellow: boolean; red: boolean; onGF: number; onGA: number;
}

export interface MatchDetail extends Fixture {
  leagueName: string;
  formationHome?: string; formationAway?: string;
  venue: string; surface: string | null; attendance: number | null;
  referee: string | null; kampnummer: string;
  resultReal: boolean; detailModeled: boolean;
  events: MatchEvent[];
  lineups: { home: Appearance[]; away: Appearance[] };
}

export interface Transfer {
  id: string; playerId: string; playerName: string; pos: string; age: number;
  fromTeamId: string; fromName: string; fromShort: string; fromLevel: number; fromLeague: string; fromColor: string;
  toTeamId: string; toName: string; toShort: string; toLevel: number; toLeague: string; toColor: string;
  direction: "up" | "down" | "side"; date: string; week: number;
}

export interface HistorySeason {
  season: number; played: number; complete: boolean;
  table: { name: string; short: string; points: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; played: number }[];
}
