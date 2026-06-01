// ============================================================================
//  Matchdata data pipeline
//  ---------------------------------------------------------------------------
//  REAL  : Eliteserien + OBOS-ligaen results/tables come from openfootball
//          (public domain). 2023-2025 history for Eliteserien.
//  MODEL : Player-level detail (squads, minutes, on-pitch +/-, Team Impact) and
//          the lower/women's divisions are modeled and flagged dataSource:"modeled".
//          The modeled player layer for real leagues is *anchored* to the real
//          scoreline (real goals are distributed to modeled scorers/minutes), so
//          every team result/table remains exactly real.
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { RNG, hashString } from "./lib/prng.mjs";
import {
  round, mean, weightedAge, weightedPpg, computeTeamImpact, tableCompare,
} from "./lib/metrics.mjs";
import {
  REAL_LEAGUES, MODELED_LEAGUES, CLUB_INFO, CITY_FYLKE, TSDB_BADGE_ALIAS,
  TSDB_CLUB, LOWER_CLUB_CITY, SURFACES, NAMES,
} from "./lib/sources.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CACHE = join(__dirname, "cache");
const OUT = join(ROOT, "src", "data", "generated");
const PUB = join(ROOT, "public", "data");

const SEASON = 2026; // current live season
const SEASON_LABEL = "2026";
const rng = new RNG(20260601);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function slug(s) {
  return s
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function fylkeOf(city) {
  return CITY_FYLKE[city] || "Norge";
}
function pad(n, w = 2) { return String(n).padStart(w, "0"); }
function iso(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

// ---------------------------------------------------------------------------
// 1. parse openfootball results
// ---------------------------------------------------------------------------
function parseOpenfootball(file, season = SEASON) {
  const txt = readFileSync(join(CACHE, "openfootball", file), "utf8");
  const lines = txt.split(/\r?\n/);
  const matches = [];
  let round = 0, curDate = null, curYear = season, curTime = null;
  const dateRe = /^\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{4}))?\s*$/;
  const mdRe = /Matchday\s+(\d+)/i;
  const matchRe = /^\s*(?:(\d{1,2}:\d{2})\s+)?(.+?)\s+v\s+(.+?)\s+(\d+)-(\d+)(?:\s*\((\d+)-(\d+)\))?\s*$/;
  const fixtureRe = /^\s*(?:(\d{1,2}:\d{2})\s+)?(.+?)\s+v\s+(.+?)\s*$/;
  for (const line of lines) {
    const md = line.match(mdRe);
    if (md) { round = +md[1]; continue; }
    const dm = line.match(dateRe);
    if (dm) {
      const mon = MONTHS[dm[2]];
      const day = +dm[3];
      if (dm[4]) curYear = +dm[4];
      curDate = iso(curYear, mon, day);
      curTime = null;
      continue;
    }
    const mm = line.match(matchRe);
    if (mm) {
      if (mm[1]) curTime = mm[1];
      matches.push({
        round, date: curDate, time: curTime || "18:00", status: "played",
        homeRaw: mm[2].trim(), awayRaw: mm[3].trim(),
        hg: +mm[4], ag: +mm[5],
        hth: mm[6] != null ? +mm[6] : null,
        hta: mm[7] != null ? +mm[7] : null,
      });
      continue;
    }
    // unplayed fixture (no score yet)
    if (/\sv\s/.test(line) && !/\d+-\d+/.test(line)) {
      const fm = line.match(fixtureRe);
      if (fm && fm[3].trim()) {
        if (fm[1]) curTime = fm[1];
        matches.push({
          round, date: curDate, time: curTime || "18:00", status: "scheduled",
          homeRaw: fm[2].trim(), awayRaw: fm[3].trim(),
          hg: null, ag: null, hth: null, hta: null,
        });
      }
    }
  }
  return matches;
}

// Parse the live 2026 Eliteserien JSON cached from TheSportsDB.
function parseTSDB(file) {
  const arr = loadJson("thesportsdb", `${file}.json`) || [];
  return arr.map((m) => ({
    round: m.round, date: m.date, time: m.time || "15:00",
    status: m.hg != null ? "played" : "scheduled",
    homeRaw: m.home, awayRaw: m.away,
    hg: m.hg, ag: m.ag, hth: null, hta: null, venue: m.venue || null,
  }));
}

function normClub(s) {
  return s.toLowerCase().replace(/[^a-zæøå0-9]/g, "").replace(/0?8$/, "");
}

function clubDisplay(raw) {
  const info = CLUB_INFO[raw] || TSDB_CLUB[raw];
  if (info) return info;
  // fallback: strip common tokens
  let name = raw.replace(/\b(FK|IL|IF|BK|SK|IK|FC|Fotball)\b/g, "").replace(/\s+/g, " ").trim();
  return { name: name || raw, short: name.slice(0, 8), city: "Norge" };
}

// ---------------------------------------------------------------------------
// 2. TheSportsDB crests + metadata
// ---------------------------------------------------------------------------
let tsdbTeams = {};
try {
  tsdbTeams = JSON.parse(readFileSync(join(CACHE, "thesportsdb", "teams.json"), "utf8"));
} catch { tsdbTeams = {}; }
const tsdbByName = {};
for (const arr of Object.values(tsdbTeams)) {
  for (const t of arr) tsdbByName[t.name] = t;
}
function loadJson(...p) {
  try { return JSON.parse(readFileSync(join(CACHE, ...p), "utf8")); } catch { return null; }
}
// Real club crests from Wikidata (P154) — covers more clubs than TheSportsDB.
const wdLogos = loadJson("wikidata", "logos.json") || {};
// Real season facts (Wikipedia): top scorers, managers, attendances.
const FACTS = {
  2026: loadJson("wikipedia", "eliteserien-2026.json"),
  2024: loadJson("wikipedia", "eliteserien-2024.json"),
};
const LOWER = loadJson("wikipedia", "lower-divisions-2025.json");

function crestFor(displayName) {
  const alias = TSDB_BADGE_ALIAS[displayName] || displayName;
  const rec = tsdbByName[alias];
  const badge = wdLogos[displayName] || (rec ? rec.badge || null : null);
  return {
    badge,
    founded: rec && rec.formed ? +rec.formed : null,
    stadium: rec ? rec.stadium || null : null,
    capacity: rec && rec.capacity ? +rec.capacity : null,
    desc: rec ? rec.desc || null : null,
  };
}

// ---------------------------------------------------------------------------
// model knobs
// ---------------------------------------------------------------------------
const POS = {
  GK: { group: "Keeper", att: 0.01, def: 1.0 },
  CB: { group: "Forsvar", att: 0.16, def: 0.95 },
  FB: { group: "Forsvar", att: 0.34, def: 0.8 },
  DM: { group: "Midtbane", att: 0.4, def: 0.8 },
  CM: { group: "Midtbane", att: 0.58, def: 0.55 },
  AM: { group: "Midtbane", att: 0.8, def: 0.32 },
  W: { group: "Angrep", att: 0.9, def: 0.25 },
  ST: { group: "Angrep", att: 1.0, def: 0.12 },
};
const FORMATIONS = [
  { name: "4-3-3", line: ["GK", "FB", "CB", "CB", "FB", "DM", "CM", "CM", "W", "ST", "W"] },
  { name: "4-4-2", line: ["GK", "FB", "CB", "CB", "FB", "W", "CM", "CM", "W", "ST", "ST"] },
  { name: "4-2-3-1", line: ["GK", "FB", "CB", "CB", "FB", "DM", "DM", "AM", "W", "W", "ST"] },
  { name: "3-5-2", line: ["GK", "CB", "CB", "CB", "W", "CM", "CM", "DM", "W", "ST", "ST"] },
];
const SQUAD_TEMPLATE = ["GK", "GK", "GK", "CB", "CB", "CB", "CB", "FB", "FB", "FB", "DM", "DM", "CM", "CM", "CM", "AM", "AM", "W", "W", "W", "ST", "ST", "ST"];
const NATIONS = ["Sverige", "Danmark", "Island", "Nigeria", "Ghana", "Frankrike", "Brasil", "Nederland", "Kosovo", "Senegal"];

let PID = 0;

function makeSquad(team, level, gender, season = SEASON) {
  const r = new RNG(hashString("squad:" + team.id));
  const ageMean = [0, 24.6, 24.1, 23.4, 22.8][level] || 23;
  const foreignP = level <= 2 ? 0.22 : level === 3 ? 0.08 : 0.03;
  const players = [];
  const usedShirts = new Set();
  const gkShirts = [1, 12, 30, 25];
  let gkIdx = 0;
  SQUAD_TEMPLATE.forEach((pos, i) => {
    const meta = POS[pos];
    // quality around team strength with role + depth variance
    const depth = i / SQUAD_TEMPLATE.length; // starters listed first-ish
    let q = clamp(r.gauss(team.strength - depth * 0.18, 0.12), 0.05, 0.98);
    const age = clamp(Math.round(r.gauss(ageMean + (depth > 0.7 ? -1.6 : 0), 3.7)), 16, 38);
    const isForeign = pos !== "GK" && r.next() < foreignP;
    let firstName, lastName, nationality;
    if (isForeign) {
      const f = r.pick(NAMES.foreign);
      firstName = f[0]; lastName = f[1]; nationality = r.pick(NATIONS);
    } else {
      firstName = r.pick(gender === "women" ? NAMES.femaleFirst : NAMES.maleFirst);
      lastName = r.pick(NAMES.last);
      nationality = "Norge";
    }
    let shirt;
    if (pos === "GK") { shirt = gkShirts[gkIdx++] || r.int(20, 40); }
    else { do { shirt = r.int(2, 39); } while (usedShirts.has(shirt)); }
    usedShirts.add(shirt);
    const isNat = level <= 1 && gender === "men" && q > 0.82 && r.next() < 0.5
      || level === 1 && gender === "women" && q > 0.8 && r.next() < 0.55;
    players.push({
      id: `${team.id}__p${++PID}`,
      firstName, lastName,
      name: `${firstName} ${lastName}`,
      teamId: team.id,
      pos, posGroup: meta.group,
      shirtNo: shirt,
      birthYear: season - age,
      age,
      nationality,
      quality: q,
      attTend: meta.att, defTend: meta.def,
      isNationalTeam: !!isNat,
      caps: isNat ? r.int(1, 48) : 0,
      // accumulators
      apps: 0, starts: 0, sub: 0, minutes: 0, goals: 0, yellow: 0, red: 0,
      onGF: 0, onGA: 0, w: 0, d: 0, l: 0, matchLog: [],
    });
  });
  // stable captain: best non-GK, prefer experience (age) & quality
  const cap = players.filter((p) => p.pos !== "GK").sort((a, b) => (b.quality + b.age / 100) - (a.quality + a.age / 100))[0];
  if (cap) cap.captain = true;
  return players;
}

// pick starting XI + bench for a match (with light rotation)
function pickLineup(squad, r) {
  const form = r.pick(FORMATIONS);
  const byPos = {};
  for (const p of squad) (byPos[p.pos] ||= []).push(p);
  const available = new Set(squad.map((p) => p.id));
  const xi = [];
  const score = (p) => p.quality + r.gauss(0, 0.06); // rotation noise
  for (const need of form.line) {
    // candidate pool: same pos, then same group, then anyone
    let pool = (byPos[need] || []).filter((p) => available.has(p.id));
    if (!pool.length) pool = squad.filter((p) => available.has(p.id) && POS[p.pos].group === POS[need].group);
    if (!pool.length) pool = squad.filter((p) => available.has(p.id) && p.pos !== "GK");
    if (!pool.length) pool = squad.filter((p) => available.has(p.id));
    pool.sort((a, b) => score(b) - score(a));
    const chosen = pool[0];
    available.delete(chosen.id);
    xi.push({ player: chosen, slotPos: need });
  }
  const bench = squad
    .filter((p) => available.has(p.id))
    .sort((a, b) => score(b) - score(a))
    .slice(0, 9);
  return { form, xi, bench };
}

let KAMPNR = 1000000;
function nextKampnr(level) {
  KAMPNR += 1;
  return `99${level}${SEASON}${pad(KAMPNR % 100000, 5)}`;
}

// build full match detail (lineups + events + on-pitch +/-)
function buildMatch(base, home, away, hg, ag, hth, hta, dataSource) {
  const r = new RNG(hashString("match:" + base.id));
  const total = hg + ag;
  const lineHome = pickLineup(home.squad, r);
  const lineAway = pickLineup(away.squad, r);

  function startApps(line, captainPref) {
    const apps = [];
    line.xi.forEach(({ player, slotPos }) => {
      apps.push({ player, slotPos, started: true, minIn: 0, minOut: 90, captain: !!player.captain, goals: 0, yellow: false, red: false, onGF: 0, onGA: 0 });
    });
    line.bench.forEach((player) => {
      apps.push({ player, slotPos: player.pos, started: false, minIn: null, minOut: null, captain: false, goals: 0, yellow: false, red: false, onGF: 0, onGA: 0 });
    });
    return apps;
  }
  const appsHome = startApps(lineHome);
  const appsAway = startApps(lineAway);
  const events = [];

  // substitutions
  function doSubs(apps, side, line) {
    const nSub = r.int(3, 5);
    const subMinutes = Array.from({ length: nSub }, () => r.int(46, 86)).sort((a, b) => a - b);
    let benchIdx = 0;
    const benchApps = apps.filter((a) => !a.started);
    for (const m of subMinutes) {
      if (benchIdx >= benchApps.length) break;
      const onField = apps.filter((a) => a.minIn !== null && a.minOut === 90 && a.minutes !== 0 && a.player.pos !== "GK");
      // outgoing: prefer tired / lower quality
      const live = apps.filter((a) => a.minIn !== null && a.minOut === 90 && a.player.pos !== "GK");
      if (!live.length) break;
      const out = r.weighted(live, (a) => 1.1 - a.player.quality + (m - 0) / 200);
      const inApp = benchApps[benchIdx++];
      out.minOut = m;
      inApp.minIn = m;
      inApp.minOut = 90;
      events.push({ minute: m, type: "sub", side, inId: inApp.player.id, inName: inApp.player.name, inNo: inApp.player.shirtNo, outId: out.player.id, outName: out.player.name, outNo: out.player.shirtNo });
    }
  }
  doSubs(appsHome, "home", lineHome);
  doSubs(appsAway, "away", lineAway);

  // cards
  function doCards(apps, side) {
    const yellows = r.poisson(1.6);
    for (let i = 0; i < yellows; i++) {
      const live = apps.filter((a) => a.minIn !== null);
      if (!live.length) break;
      const m = r.int(8, 92);
      const pl = r.weighted(live, (a) => 0.5 + a.player.defTend);
      pl.yellow = true;
      events.push({ minute: m, type: "yellow", side, playerId: pl.player.id, playerName: pl.player.name, no: pl.player.shirtNo });
    }
    if (r.next() < 0.07) {
      const live = apps.filter((a) => a.minIn !== null && a.minOut === 90);
      if (live.length) {
        const m = r.int(35, 90);
        const pl = r.weighted(live, (a) => 0.5 + a.player.defTend);
        pl.red = true;
        pl.minOut = Math.min(pl.minOut, m);
        events.push({ minute: m, type: "red", side, playerId: pl.player.id, playerName: pl.player.name, no: pl.player.shirtNo });
      }
    }
  }
  doCards(appsHome, "home");
  doCards(appsAway, "away");

  // finalize minutes
  for (const a of [...appsHome, ...appsAway]) {
    a.minutes = a.minIn === null ? 0 : Math.max(0, a.minOut - a.minIn);
  }

  // goals -> minutes + scorers, respecting HT split if known
  function goalMinutes(n, lo, hi) {
    const arr = Array.from({ length: n }, () => r.int(lo, hi)).sort((a, b) => a - b);
    return arr;
  }
  let hFH = hth, hSH = hg - (hth ?? 0), aFH = hta, aSH = ag - (hta ?? 0);
  if (hth == null) { hFH = 0; hSH = hg; aFH = 0; aSH = ag; } // unknown HT: treat all 2nd half-ish
  const goalList = [];
  for (const [side, n, lo, hi] of [
    ["home", hFH, 2, 45], ["home", hSH, 46, 90],
    ["away", aFH, 2, 45], ["away", aSH, 46, 90],
  ]) {
    for (const m of goalMinutes(n, lo, hi)) goalList.push({ minute: m, side });
  }
  goalList.sort((a, b) => a.minute - b.minute);

  function onPitch(apps, m) {
    return apps.filter((a) => a.minIn !== null && a.minIn < m && m <= a.minOut);
  }
  for (const g of goalList) {
    const scApps = g.side === "home" ? appsHome : appsAway;
    const pitch = onPitch(scApps, g.minute);
    const outfield = pitch.filter((a) => a.player.pos !== "GK");
    const scorer = (outfield.length ? r.weighted(outfield, (a) => a.player.attTend * (0.4 + a.player.quality)) : r.pick(pitch));
    if (scorer) scorer.goals += 1;
    events.push({ minute: g.minute, type: "goal", side: g.side, playerId: scorer ? scorer.player.id : null, playerName: scorer ? scorer.player.name : null, no: scorer ? scorer.player.shirtNo : null });
    // on-pitch +/-
    for (const a of onPitch(appsHome, g.minute)) { if (g.side === "home") a.onGF++; else a.onGA++; }
    for (const a of onPitch(appsAway, g.minute)) { if (g.side === "away") a.onGF++; else a.onGA++; }
  }
  events.sort((a, b) => a.minute - b.minute || (a.type === "goal" ? -1 : 1));

  // result + accumulate into players
  const res = hg > ag ? "H" : hg < ag ? "A" : "D";
  function commit(apps, side, gf, ga) {
    const teamRes = side === "home" ? (res === "H" ? "W" : res === "A" ? "L" : "D") : (res === "A" ? "W" : res === "H" ? "L" : "D");
    const pts = teamRes === "W" ? 3 : teamRes === "D" ? 1 : 0;
    for (const a of apps) {
      if (a.minIn === null) continue;
      const p = a.player;
      p.apps++;
      if (a.started) p.starts++; else p.sub++;
      p.minutes += a.minutes;
      p.goals += a.goals;
      if (a.yellow) p.yellow++;
      if (a.red) p.red++;
      p.onGF += a.onGF;
      p.onGA += a.onGA;
      if (teamRes === "W") p.w++; else if (teamRes === "D") p.d++; else p.l++;
      p.matchLog.push({
        matchId: base.id, round: base.round, date: base.date,
        side, oppTeamId: side === "home" ? away.id : home.id,
        points: pts, minutes: a.minutes, goals: a.goals,
        onGF: a.onGF, onGA: a.onGA, started: a.started,
        teamGoals: gf, oppGoals: ga,
      });
    }
  }
  commit(appsHome, "home", hg, ag);
  commit(appsAway, "away", ag, hg);

  function serialApps(apps) {
    return apps
      .filter((a) => a.minIn !== null || !a.started)
      .map((a) => ({
        playerId: a.player.id, name: a.player.name, shirtNo: a.player.shirtNo,
        pos: a.slotPos, posGroup: POS[a.player.pos].group,
        started: a.started, captain: a.captain,
        minIn: a.minIn, minOut: a.minIn === null ? null : a.minOut,
        minutes: a.minutes, goals: a.goals,
        yellow: a.yellow, red: a.red, onGF: a.onGF, onGA: a.onGA,
      }))
      .sort((x, y) => (y.started - x.started) || x.shirtNo - y.shirtNo);
  }

  const venue = base.venue || home.stadium || `${home.city} stadion`;
  return {
    ...base,
    homeTeamId: home.id, awayTeamId: away.id,
    homeName: home.name, awayName: away.name,
    homeShort: home.short, awayShort: away.short,
    homeColor: home.color, awayColor: away.color,
    homeGoals: hg, awayGoals: ag, htHome: hth, htAway: hta,
    result: res,
    formationHome: lineHome.form.name, formationAway: lineAway.form.name,
    venue, surface: r.pick(SURFACES),
    attendance: Math.round((home.capacity || 4000) * clamp(r.gauss(0.55, 0.18), 0.12, 0.99)),
    referee: `${r.pick(NAMES.maleFirst)} ${r.pick(NAMES.last)}`,
    kampnummer: nextKampnr(base.level),
    dataSource,
    resultReal: dataSource === "real",
    detailModeled: true,
    status: "played",
    events,
    lineups: { home: serialApps(appsHome), away: serialApps(appsAway) },
  };
}

// light record for a real fixture that has not been played yet
function makeFixture(base, home, away, dataSource) {
  return {
    ...base,
    homeTeamId: home.id, awayTeamId: away.id,
    homeName: home.name, awayName: away.name, homeShort: home.short, awayShort: away.short,
    homeColor: home.color, awayColor: away.color,
    homeGoals: null, awayGoals: null, htHome: null, htAway: null, result: null,
    venue: base.venue || home.stadium || `${home.city} stadion`, surface: null, attendance: null, referee: null,
    kampnummer: nextKampnr(base.level), dataSource, resultReal: false, detailModeled: false,
    status: "scheduled", events: [], lineups: { home: [], away: [] },
  };
}

// ---------------------------------------------------------------------------
// schedule generator (double round robin, circle method)
// ---------------------------------------------------------------------------
function roundRobin(ids) {
  const n = ids.length;
  const arr = ids.slice();
  if (n % 2) arr.push(null);
  const m = arr.length;
  const rounds = [];
  for (let r = 0; r < m - 1; r++) {
    const pair = [];
    for (let i = 0; i < m / 2; i++) {
      const a = arr[i], b = arr[m - 1 - i];
      if (a && b) pair.push(r % 2 ? [a, b] : [b, a]);
    }
    rounds.push(pair);
    arr.splice(1, 0, arr.pop());
  }
  // second leg reversed home/away
  const full = rounds.map((p) => p);
  const second = rounds.map((p) => p.map(([h, a]) => [a, h]));
  return [...full, ...second];
}

// ===========================================================================
// BUILD
// ===========================================================================
const leagues = [];
const teamsById = new Map();
const allPlayers = [];
const allMatches = [];
const history = {}; // leagueId -> { season -> table[] } (real, team-level only)

function registerTeam(t) { teamsById.set(t.id, t); }

// ---- REAL leagues ----
for (const lg of REAL_LEAGUES) {
  const primary = lg.primarySeason;
  // every available season -> team-level table (played matches only)
  for (const [seasonStr, file] of Object.entries(lg.seasons)) {
    const season = +seasonStr;
    const played = parseOpenfootball(`${file}.txt`, season).filter((m) => m.status === "played");
    const tbl = buildTableFromResults(played);
    const fullRounds = (tbl.length - 1) * 2;
    (history[lg.id] ||= {})[season] = {
      season,
      played: played.length,
      complete: played.length >= (tbl.length / 2) * fullRounds,
      table: tbl.map((row) => ({ name: row.name, short: CLUB_INFO[row.raw]?.short || row.name, points: row.points, w: row.w, d: row.d, l: row.l, gf: row.gf, ga: row.ga, gd: row.gd, played: row.played })),
    };
  }
  // primary season -> full build (real results + modeled player detail)
  const all = lg.primarySource === "thesportsdb"
    ? parseTSDB(lg.primaryFile)
    : parseOpenfootball(`${lg.seasons[primary]}.txt`, primary);
  const played = all.filter((m) => m.status === "played");
  const teamNames = [...new Set(all.flatMap((m) => [m.homeRaw, m.awayRaw]))];
  const teamObjs = teamNames.map((raw) => {
    const info = clubDisplay(raw);
    const crest = crestFor(info.name);
    const id = `${lg.id}__${slug(info.name)}`;
    const t = {
      id, raw, name: info.name, short: info.short || info.name,
      slug: slug(info.name), leagueId: lg.id, leagueName: lg.name, leagueShort: lg.short,
      level: lg.level, gender: lg.gender, color: lg.color, dataSource: "real", season: primary,
      city: info.city, fylke: fylkeOf(info.city),
      founded: crest.founded, stadium: crest.stadium, capacity: crest.capacity,
      badge: crest.badge, desc: crest.desc,
      strength: 0.5,
    };
    registerTeam(t);
    return t;
  });
  const nameToId = new Map(teamObjs.map((t) => [t.raw, t.id]));
  const table = buildTableFromResults(played);
  table.forEach((row, i) => {
    const t = teamObjs.find((x) => x.raw === row.raw);
    if (t) t.strength = clamp(0.74 - i * (0.34 / table.length) + (lg.level === 1 ? 0.12 : lg.level === 2 ? 0.04 : 0), 0.2, 0.92);
  });
  for (const t of teamObjs) t.squad = makeSquad(t, lg.level, lg.gender, primary);
  // attach real managers (Wikipedia) where available
  const facts = FACTS[primary];
  if (facts && facts.managers) {
    const mm = {};
    for (const x of facts.managers) mm[normClub(x.club)] = x.manager;
    for (const t of teamObjs) t.manager = mm[normClub(t.name)] || null;
  }
  for (const m of all) {
    const home = teamsById.get(nameToId.get(m.homeRaw));
    const away = teamsById.get(nameToId.get(m.awayRaw));
    const base = { id: `${lg.id}-${m.round}-${home.slug}-${away.slug}`, leagueId: lg.id, leagueName: lg.name, leagueShort: lg.short, level: lg.level, season: primary, round: m.round, date: m.date, time: m.time, venue: m.venue };
    if (m.status === "played") allMatches.push(buildMatch(base, home, away, m.hg, m.ag, m.hth, m.hta, "real"));
    else allMatches.push(makeFixture(base, home, away, "real"));
  }
  leagues.push({ ...lg, season: primary, teamObjs, facts: facts || null });
}

// ---- MODELED leagues ----
for (const lg of MODELED_LEAGUES) {
  const teamObjs = lg.teams.map((tm, i) => {
    const id = `${lg.id}__${slug(tm.name)}`;
    const strength = clamp(0.62 - i * 0.015 + rng.gauss(0, 0.05) - (lg.level - 1) * 0.03, 0.2, 0.85);
    const crest = crestFor(tm.name);
    const t = {
      id, raw: tm.name, name: tm.name, short: tm.short || tm.name, slug: slug(tm.name),
      leagueId: lg.id, leagueName: lg.name, leagueShort: lg.short, level: lg.level,
      gender: lg.gender, color: lg.color, dataSource: "modeled", season: SEASON,
      city: tm.city, fylke: fylkeOf(tm.city),
      founded: crest.founded, stadium: crest.stadium || `${tm.city} idrettspark`,
      capacity: crest.capacity || [0, 0, 0, 4200, 1800][lg.level] || 1500,
      badge: crest.badge, desc: null, strength,
    };
    registerTeam(t);
    return t;
  });
  for (const t of teamObjs) t.squad = makeSquad(t, lg.level, lg.gender, SEASON);

  const ids = teamObjs.map((t) => t.id);
  const schedule = roundRobin(rng.shuffle(ids));
  const start = new Date(Date.UTC(SEASON, 3, 12));
  schedule.forEach((pairs, ri) => {
    const d = new Date(start.getTime() + ri * 7 * 86400000);
    const date = iso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    for (const [hId, aId] of pairs) {
      const home = teamsById.get(hId), away = teamsById.get(aId);
      const diff = home.strength - away.strength;
      const expH = clamp(1.35 + 0.32 + diff * 2.3, 0.18, 4.4);
      const expA = clamp(1.2 - diff * 2.0, 0.16, 3.6);
      const hg = Math.min(7, rng.poisson(expH));
      const ag = Math.min(7, rng.poisson(expA));
      let hth = 0, hta = 0;
      for (let i = 0; i < hg; i++) if (rng.next() < 0.45) hth++;
      for (let i = 0; i < ag; i++) if (rng.next() < 0.45) hta++;
      const base = { id: `${lg.id}-${ri + 1}-${home.slug}-${away.slug}`, leagueId: lg.id, leagueName: lg.name, leagueShort: lg.short, level: lg.level, season: SEASON, round: ri + 1, date, time: rng.pick(["13:00", "15:00", "16:00", "18:00"]) };
      allMatches.push(buildMatch(base, home, away, hg, ag, hth, hta, "modeled"));
    }
  });
  leagues.push({ ...lg, season: SEASON, teamObjs });
}

// ---- LOWER divisions: REAL standings (Wikipedia) + modeled players ----
const lowerDefs = [];
if (LOWER) {
  (LOWER.secondDivision?.groups || []).forEach((g, i) => lowerDefs.push({
    id: `2div-avd${i + 1}`, name: `2. divisjon avd. ${i + 1}`, short: `2.div ${i + 1}`,
    divisionName: "2. divisjon", avdeling: `Avdeling ${i + 1}`, level: 3, color: "#2563eb", group: g,
  }));
  (LOWER.thirdDivision?.groups || []).forEach((g, i) => lowerDefs.push({
    id: `3div-avd${i + 1}`, name: `3. divisjon avd. ${i + 1}`, short: `3.div ${i + 1}`,
    divisionName: "3. divisjon", avdeling: `Avdeling ${i + 1}`, level: 4, color: "#f59e0b", group: g,
  }));
}
for (const lg of lowerDefs) {
  const rows = lg.group.table;
  const teamObjs = rows.map((row, i) => {
    const name = row.club;
    const short = name.length > 12 ? name.split(/[ /]/)[0] : name;
    const city = LOWER_CLUB_CITY[name] || CLUB_INFO[name]?.city || TSDB_CLUB[name]?.city || "Norge";
    const crest = crestFor(name);
    const strength = clamp(0.6 - i * (0.34 / rows.length) - (lg.level - 3) * 0.05, 0.16, 0.78);
    const t = {
      id: `${lg.id}__${slug(name)}`, raw: name, name, short, slug: slug(name),
      leagueId: lg.id, leagueName: lg.name, leagueShort: lg.short, level: lg.level,
      gender: "men", color: lg.color, dataSource: "real", season: 2025,
      city, fylke: fylkeOf(city),
      founded: crest.founded, stadium: crest.stadium || `${city} stadion`, capacity: crest.capacity || 2000,
      badge: crest.badge, desc: crest.desc, strength, realStanding: row, manager: null,
    };
    registerTeam(t);
    return t;
  });
  for (const t of teamObjs) t.squad = makeSquad(t, lg.level, "men", 2025);
  const ids = teamObjs.map((t) => t.id);
  const schedule = roundRobin(rng.shuffle(ids));
  const start = new Date(Date.UTC(2025, 3, 5));
  schedule.forEach((pairs, ri) => {
    const d = new Date(start.getTime() + ri * 7 * 86400000);
    const date = iso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    for (const [hId, aId] of pairs) {
      const home = teamsById.get(hId), away = teamsById.get(aId);
      const diff = home.strength - away.strength;
      const expH = clamp(1.4 + 0.32 + diff * 2.4, 0.18, 4.8);
      const expA = clamp(1.3 - diff * 2.1, 0.16, 3.9);
      const hg = Math.min(8, rng.poisson(expH)), ag = Math.min(8, rng.poisson(expA));
      let hth = 0, hta = 0;
      for (let k = 0; k < hg; k++) if (rng.next() < 0.45) hth++;
      for (let k = 0; k < ag; k++) if (rng.next() < 0.45) hta++;
      const base = { id: `${lg.id}-${ri + 1}-${home.slug}-${away.slug}`, leagueId: lg.id, leagueName: lg.name, leagueShort: lg.short, level: lg.level, season: 2025, round: ri + 1, date, time: rng.pick(["13:00", "14:00", "16:00"]) };
      allMatches.push(buildMatch(base, home, away, hg, ag, hth, hta, "modeled"));
    }
  });
  leagues.push({ id: lg.id, name: lg.name, short: lg.short, divisionName: lg.divisionName, avdeling: lg.avdeling, level: lg.level, gender: "men", color: lg.color, season: 2025, teamObjs, tableReal: true });
}

// collect players
for (const t of teamsById.values()) for (const p of t.squad) allPlayers.push(p);

// ---------------------------------------------------------------------------
// table builder from raw results
// ---------------------------------------------------------------------------
function buildTableFromResults(matches) {
  const tbl = new Map();
  function row(raw) {
    if (!tbl.has(raw)) {
      const info = clubDisplay(raw);
      tbl.set(raw, { raw, name: info.name, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, points: 0 });
    }
    return tbl.get(raw);
  }
  for (const m of matches) {
    const h = row(m.homeRaw), a = row(m.awayRaw);
    h.played++; a.played++;
    h.gf += m.hg; h.ga += m.ag; a.gf += m.ag; a.ga += m.hg;
    if (m.hg > m.ag) { h.w++; a.l++; h.points += 3; }
    else if (m.hg < m.ag) { a.w++; h.l++; a.points += 3; }
    else { h.d++; a.d++; h.points++; a.points++; }
  }
  const arr = [...tbl.values()];
  arr.forEach((r) => (r.gd = r.gf - r.ga));
  arr.sort(tableCompare);
  return arr;
}

console.log(`Built ${teamsById.size} teams, ${allPlayers.length} players, ${allMatches.length} matches`);

// ===========================================================================
// AGGREGATE
// ===========================================================================
// team season aggregates from matches
const teamAgg = new Map();
for (const t of teamsById.values()) {
  teamAgg.set(t.id, { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, points: 0, form: [], hp: 0, hw: 0, hd: 0, hl: 0, ap: 0, aw: 0, ad: 0, al: 0, cleanSheets: 0, failedToScore: 0, results: [] });
}
const playedSorted = allMatches.filter((m) => m.status === "played").sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.round - b.round));
for (const m of playedSorted) {
  const H = teamAgg.get(m.homeTeamId), A = teamAgg.get(m.awayTeamId);
  H.played++; A.played++;
  H.gf += m.homeGoals; H.ga += m.awayGoals; A.gf += m.awayGoals; A.ga += m.homeGoals;
  H.hp++; A.ap++;
  if (m.homeGoals === 0) H.failedToScore++; if (m.awayGoals === 0) A.failedToScore++;
  if (m.awayGoals === 0) H.cleanSheets++; if (m.homeGoals === 0) A.cleanSheets++;
  if (m.result === "H") { H.w++; H.points += 3; A.l++; H.hw++; A.al++; H.form.push("W"); A.form.push("L"); H.results.push({ id: m.id, r: "W" }); A.results.push({ id: m.id, r: "L" }); }
  else if (m.result === "A") { A.w++; A.points += 3; H.l++; A.aw++; H.hl++; A.form.push("W"); H.form.push("L"); A.results.push({ id: m.id, r: "W" }); H.results.push({ id: m.id, r: "L" }); }
  else { H.d++; A.d++; H.points++; A.points++; H.hd++; A.ad++; H.form.push("D"); A.form.push("D"); H.results.push({ id: m.id, r: "D" }); A.results.push({ id: m.id, r: "D" }); }
}

// streaks
function longest(results, pred) {
  let best = 0, cur = 0;
  for (const r of results) { if (pred(r.r)) { cur++; best = Math.max(best, cur); } else cur = 0; }
  return best;
}

// ---------------------------------------------------------------------------
// player aggregates
// ---------------------------------------------------------------------------
const teamPpg = new Map();
for (const [id, a] of teamAgg) teamPpg.set(id, a.played ? a.points / a.played : 0);

const playerOut = [];
for (const p of allPlayers) {
  const t = teamsById.get(p.teamId);
  const minutes = p.minutes;
  const pm90 = minutes ? ((p.onGF - p.onGA) * 90) / minutes : 0;
  const wlog = p.matchLog.map((ml) => ({ points: ml.points, oppPpg: teamPpg.get(ml.oppTeamId) || 0, minutes: ml.minutes }));
  const wppg = weightedPpg(wlog);
  const points = p.w * 3 + p.d;
  playerOut.push({
    id: p.id, name: p.name, firstName: p.firstName, lastName: p.lastName, slug: slug(p.name),
    teamId: p.teamId, teamName: t.name, teamShort: t.short, leagueId: t.leagueId, leagueName: t.leagueName, leagueShort: t.leagueShort,
    level: t.level, gender: t.gender, dataSource: "modeled",
    pos: p.pos, posGroup: p.posGroup, shirtNo: p.shirtNo,
    birthYear: p.birthYear, age: p.age, nationality: p.nationality, fylke: t.fylke,
    isNationalTeam: p.isNationalTeam, caps: p.caps, captain: !!p.captain,
    k: p.apps, starts: p.starts, sub: p.sub, minutes, goals: p.goals,
    yellow: p.yellow, red: p.red, w: p.w, d: p.d, l: p.l,
    points, ppg: p.apps ? points / p.apps : 0,
    gpg: p.apps ? p.goals / p.apps : 0, mpg: p.apps ? minutes / p.apps : 0,
    onGF: p.onGF, onGA: p.onGA, plusMinus90: pm90, weightedPpg: wppg,
    perfZ: null, minZ: null, teamImpact: null, qualified: false,
  });
}
const playerById = new Map(playerOut.map((p) => [p.id, p]));

// Team Impact per team
for (const t of teamsById.values()) {
  const ta = teamAgg.get(t.id);
  const mfPerMatch = ta.played ? (ta.gf - ta.ga) / ta.played : 0;
  const roster = t.squad.map((p) => {
    const po = playerById.get(p.id);
    return { id: p.id, minutes: po.minutes, pm90: po.plusMinus90 };
  });
  const impact = computeTeamImpact(roster, ta.played, mfPerMatch);
  for (const [id, val] of impact) {
    const po = playerById.get(id);
    po.perfZ = val.perfZ == null ? null : round(val.perfZ, 3);
    po.minZ = val.minZ == null ? null : round(val.minZ, 3);
    po.teamImpact = val.teamImpact == null ? null : round(val.teamImpact, 3);
    po.qualified = val.qualified;
  }
}

// round numeric fields
for (const p of playerOut) {
  p.ppg = round(p.ppg, 2); p.gpg = round(p.gpg, 2); p.mpg = round(p.mpg, 0);
  p.plusMinus90 = round(p.plusMinus90, 2); p.weightedPpg = round(p.weightedPpg, 2);
}

// ---------------------------------------------------------------------------
// team output (with table position, weighted age)
// ---------------------------------------------------------------------------
const teamOut = [];
for (const t of teamsById.values()) {
  const ta = teamAgg.get(t.id);
  const squadPlayers = t.squad.map((p) => playerById.get(p.id));
  const wAge = weightedAge(squadPlayers.filter((p) => p.minutes > 0).map((p) => ({ age: p.age, minutes: p.minutes })));
  const avgAge = mean(squadPlayers.map((p) => p.age));
  const rs = t.realStanding; // real Wikipedia standing for lower divisions
  teamOut.push({
    id: t.id, name: t.name, short: t.short, slug: t.slug,
    leagueId: t.leagueId, leagueName: t.leagueName, leagueShort: t.leagueShort,
    level: t.level, gender: t.gender, color: t.color, dataSource: t.dataSource,
    city: t.city, fylke: t.fylke, founded: t.founded, stadium: t.stadium, capacity: t.capacity, badge: t.badge, desc: t.desc,
    manager: t.manager || null, tableReal: !!rs,
    played: rs ? rs.played : ta.played, w: rs ? rs.w : ta.w, d: rs ? rs.d : ta.d, l: rs ? rs.l : ta.l,
    gf: rs ? rs.gf : ta.gf, ga: rs ? rs.ga : ta.ga, gd: rs ? rs.gf - rs.ga : ta.gf - ta.ga, points: rs ? rs.points : ta.points,
    ppg: round(rs ? rs.points / (rs.played || 1) : teamPpg.get(t.id), 2),
    mfPerMatch: round(rs ? (rs.gf - rs.ga) / (rs.played || 1) : (ta.played ? (ta.gf - ta.ga) / ta.played : 0), 2),
    form: rs ? [] : ta.form.slice(-6),
    home: { p: ta.hp, w: ta.hw, d: ta.hd, l: ta.hl }, away: { p: ta.ap, w: ta.aw, d: ta.ad, l: ta.al },
    cleanSheets: ta.cleanSheets, failedToScore: ta.failedToScore,
    longestWin: longest(ta.results, (r) => r === "W"),
    longestUnbeaten: longest(ta.results, (r) => r !== "L"),
    weightedAvgAge: round(wAge, 1), avgAge: round(avgAge, 1), squadSize: t.squad.length,
  });
}

// table position within league
for (const lg of leagues) {
  const rows = teamOut.filter((t) => t.leagueId === lg.id).sort((a, b) => tableCompare({ points: a.points, gd: a.gd, gf: a.gf, name: a.name }, { points: b.points, gd: b.gd, gf: b.gf, name: b.name }));
  rows.forEach((r, i) => (r.position = i + 1));
}
const teamOutById = new Map(teamOut.map((t) => [t.id, t]));

// ---------------------------------------------------------------------------
// league output
// ---------------------------------------------------------------------------
const leagueOut = [];
for (const lg of leagues) {
  const lt = teamOut.filter((t) => t.leagueId === lg.id);
  const lm = allMatches.filter((m) => m.leagueId === lg.id && m.status === "played");
  const lp = playerOut.filter((p) => p.leagueId === lg.id);
  const goals = lm.reduce((s, m) => s + m.homeGoals + m.awayGoals, 0);
  const homeWins = lm.filter((m) => m.result === "H").length;
  const draws = lm.filter((m) => m.result === "D").length;
  const awayWins = lm.filter((m) => m.result === "A").length;
  const cards = lm.reduce((s, m) => s + m.events.filter((e) => e.type === "yellow" || e.type === "red").length, 0);
  const wAgeLeague = weightedAge(lp.filter((p) => p.minutes > 0).map((p) => ({ age: p.age, minutes: p.minutes })));
  const roundsTotal = (lt.length - 1) * 2;
  const roundsPlayed = Math.max(...lm.map((m) => m.round), 0);
  const isReal = !!(REAL_LEAGUES.find((r) => r.id === lg.id) || lg.tableReal);
  const realGoals = lg.tableReal ? lt.reduce((s, t) => s + t.gf, 0) : goals;
  const realMatches = lg.tableReal ? Math.round(lt.reduce((s, t) => s + t.played, 0) / 2) : lm.length;
  leagueOut.push({
    id: lg.id, name: lg.name, short: lg.short, divisionName: lg.divisionName, avdeling: lg.avdeling,
    level: lg.level, gender: lg.gender, color: lg.color,
    dataSource: isReal ? "real" : "modeled", tableReal: !!lg.tableReal,
    realTopScorers: lg.facts?.topScorers || null, realAttendances: lg.facts?.attendances || null,
    season: lg.season || SEASON, teamCount: lt.length, matchCount: realMatches, roundsTotal,
    roundsPlayed: lg.tableReal ? roundsTotal : roundsPlayed,
    inProgress: lg.tableReal ? false : roundsPlayed < roundsTotal,
    stats: {
      matches: realMatches, goals: realGoals, goalsPerMatch: round(realGoals / (realMatches || 1), 2),
      homeWinPct: round((homeWins / (lm.length || 1)) * 100, 1),
      drawPct: round((draws / (lm.length || 1)) * 100, 1),
      awayWinPct: round((awayWins / (lm.length || 1)) * 100, 1),
      cards, cardsPerMatch: round(cards / (lm.length || 1), 2),
      avgAgeWeighted: round(wAgeLeague, 1),
      players: lp.length,
    },
    // age analysis: avg starting XI age per team (weighted by minutes), youngest first
    ageAnalysis: lt.map((t) => ({ teamId: t.id, name: t.name, short: t.short, weightedAvgAge: t.weightedAvgAge, avgAge: t.avgAge }))
      .sort((a, b) => a.weightedAvgAge - b.weightedAvgAge),
  });
}

// goals-per-round series (for league dashboards) — real-ish since goals are real for real leagues
for (const lo of leagueOut) {
  const lm = allMatches.filter((m) => m.leagueId === lo.id && m.status === "played");
  const byRound = {};
  for (const m of lm) {
    const k = m.round;
    (byRound[k] ||= { round: k, goals: 0, matches: 0, home: 0, away: 0, draw: 0 });
    byRound[k].goals += m.homeGoals + m.awayGoals;
    byRound[k].matches++;
    if (m.result === "H") byRound[k].home++; else if (m.result === "A") byRound[k].away++; else byRound[k].draw++;
  }
  lo.goalsByRound = Object.values(byRound).sort((a, b) => a.round - b.round);
}

// ---------------------------------------------------------------------------
// table progression (real for real leagues): cumulative points per team per round
// ---------------------------------------------------------------------------
const progression = {};
for (const lg of leagues) {
  const lm = allMatches.filter((m) => m.leagueId === lg.id && m.status === "played").sort((a, b) => a.round - b.round);
  const cum = {};
  const maxRound = Math.max(...lm.map((m) => m.round), 0);
  const series = teamOut.filter((t) => t.leagueId === lg.id).map((t) => ({ teamId: t.id, name: t.short, points: [] }));
  const seriesById = new Map(series.map((s) => [s.teamId, s]));
  for (let r = 1; r <= maxRound; r++) {
    for (const m of lm.filter((x) => x.round === r)) {
      cum[m.homeTeamId] = (cum[m.homeTeamId] || 0) + (m.result === "H" ? 3 : m.result === "D" ? 1 : 0);
      cum[m.awayTeamId] = (cum[m.awayTeamId] || 0) + (m.result === "A" ? 3 : m.result === "D" ? 1 : 0);
    }
    for (const s of series) s.points.push(cum[s.teamId] || 0);
  }
  progression[lg.id] = { maxRound, series };
}

// ---------------------------------------------------------------------------
// age distribution (per gender, all players)
// ---------------------------------------------------------------------------
function ageDistribution(players) {
  const byYear = {};
  for (const p of players) (byYear[p.birthYear] ||= 0), byYear[p.birthYear]++;
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  return {
    total: players.length,
    avgAge: round(mean(players.map((p) => p.age)), 1),
    weightedAvgAge: round(weightedAge(players.filter((p) => p.minutes > 0).map((p) => ({ age: p.age, minutes: p.minutes }))), 1),
    bars: years.map((y) => ({ birthYear: y, age: SEASON - y, count: byYear[y] })),
  };
}

// ---------------------------------------------------------------------------
// transfers (modeled feed across the season)
// ---------------------------------------------------------------------------
const transfers = [];
{
  const r = new RNG(987654);
  const pool = playerOut.filter((p) => p.minutes > 200);
  const teamsByLevel = {};
  for (const t of teamOut) (teamsByLevel[t.level] ||= []).push(t);
  const count = 130;
  for (let i = 0; i < count; i++) {
    const p = r.pick(pool);
    const fromTeam = teamOutById.get(p.teamId);
    if (!fromTeam) continue;
    // destination: a different team, biased toward adjacent levels, same gender
    const candidates = teamOut.filter((t) => t.gender === fromTeam.gender && t.id !== fromTeam.id && Math.abs(t.level - fromTeam.level) <= 1);
    const toTeam = r.pick(candidates);
    if (!toTeam) continue;
    const week = r.int(1, 30);
    const d = new Date(Date.UTC(SEASON, 2, 1) + week * 7 * 86400000);
    transfers.push({
      id: `tr-${i}`,
      playerId: p.id, playerName: p.name, pos: p.posGroup, age: p.age,
      fromTeamId: fromTeam.id, fromName: fromTeam.name, fromShort: fromTeam.short, fromLevel: fromTeam.level, fromLeague: fromTeam.leagueName, fromColor: fromTeam.color,
      toTeamId: toTeam.id, toName: toTeam.name, toShort: toTeam.short, toLevel: toTeam.level, toLeague: toTeam.leagueName, toColor: toTeam.color,
      direction: toTeam.level < fromTeam.level ? "up" : toTeam.level > fromTeam.level ? "down" : "side",
      date: iso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
      week,
    });
  }
  transfers.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---------------------------------------------------------------------------
// national team players (modeled)
// ---------------------------------------------------------------------------
const national = {
  players: playerOut.filter((p) => p.isNationalTeam).map((p) => ({ id: p.id, name: p.name, teamId: p.teamId, teamName: p.teamName, leagueName: p.leagueName, gender: p.gender, caps: p.caps, pos: p.posGroup, age: p.age })).sort((a, b) => b.caps - a.caps),
};
national.teams = Object.values(
  national.players.reduce((acc, p) => {
    (acc[p.teamId] ||= { teamId: p.teamId, teamName: p.teamName, leagueName: p.leagueName, gender: p.gender, count: 0, caps: 0 });
    acc[p.teamId].count++; acc[p.teamId].caps += p.caps;
    return acc;
  }, {}),
).sort((a, b) => b.count - a.count || b.caps - a.caps);

// ---------------------------------------------------------------------------
// fixtures (compact, all matches) + per-league full match files
// ---------------------------------------------------------------------------
const fixtures = allMatches.map((m) => ({
  id: m.id, leagueId: m.leagueId, leagueShort: m.leagueShort, level: m.level, season: m.season,
  round: m.round, date: m.date, time: m.time, status: m.status, dataSource: m.dataSource,
  homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId, homeName: m.homeName, awayName: m.awayName,
  homeShort: m.homeShort, awayShort: m.awayShort, homeColor: m.homeColor, awayColor: m.awayColor,
  homeGoals: m.homeGoals, awayGoals: m.awayGoals, htHome: m.htHome, htAway: m.htAway, result: m.result,
})).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
if (existsSync(OUT)) for (const f of readdirSync(OUT)) rmSync(join(OUT, f));
mkdirSync(OUT, { recursive: true });
mkdirSync(PUB, { recursive: true });
const writeJson = (dir, name, data, pretty = false) =>
  writeFileSync(join(dir, name), JSON.stringify(data, null, pretty ? 2 : 0), "utf8");

// server datasets
writeJson(OUT, "leagues.json", leagueOut, true);
writeJson(OUT, "teams.json", teamOut);
writeJson(OUT, "players.json", playerOut);
writeJson(OUT, "fixtures.json", fixtures);
writeJson(OUT, "history.json", history, true);
writeJson(OUT, "progression.json", progression);
writeJson(OUT, "transfers.json", transfers);
writeJson(OUT, "national.json", national);
writeJson(OUT, "age.json", { men: ageDistribution(playerOut.filter((p) => p.gender === "men")), women: ageDistribution(playerOut.filter((p) => p.gender === "women")) }, true);

// per-league full match detail (server, lazy)
for (const lg of leagues) {
  const lm = allMatches.filter((m) => m.leagueId === lg.id);
  writeJson(OUT, `matches-${lg.id}.json`, lm);
}

const meta = {
  generatedAt: new Date().toISOString(),
  season: SEASON, seasonLabel: SEASON_LABEL,
  counts: {
    leagues: leagueOut.length, teams: teamOut.length, players: playerOut.length,
    matches: allMatches.length,
    realMatches: allMatches.filter((m) => m.dataSource === "real").length,
    modeledMatches: allMatches.filter((m) => m.dataSource === "modeled").length,
  },
  realLeagueIds: REAL_LEAGUES.map((l) => l.id),
  modeledLeagueIds: MODELED_LEAGUES.map((l) => l.id),
  attribution: {
    openfootball: "Results & standings (Eliteserien, OBOS-ligaen) — public domain, github.com/openfootball",
    thesportsdb: "Club crests & metadata — TheSportsDB.com",
  },
};
writeJson(OUT, "meta.json", meta, true);

// ---------------------------------------------------------------------------
// public client indexes (compact)
// ---------------------------------------------------------------------------
const playersClient = playerOut.map((p) => ({
  id: p.id, n: p.name, tm: p.teamName, ts: p.teamShort, ti: p.teamId,
  lg: p.leagueId, ln: p.leagueShort, lv: p.level, g: p.gender, ds: p.dataSource,
  pos: p.pos, pg: p.posGroup, by: p.birthYear, age: p.age, nat: p.isNationalTeam ? 1 : 0, caps: p.caps,
  fy: p.fylke, k: p.k, st: p.starts, sub: p.sub, min: p.minutes, gls: p.goals,
  w: p.w, d: p.d, l: p.l, wppg: p.weightedPpg, cap: p.captain ? 1 : 0,
  pts: p.points, ppg: p.ppg, pm: p.plusMinus90, tiv: p.teamImpact, y: p.yellow, r: p.red, q: p.qualified ? 1 : 0,
}));
writeJson(PUB, "players.json", playersClient);

const teamsClient = teamOut.map((t) => ({
  id: t.id, n: t.name, s: t.short, lg: t.leagueId, ln: t.leagueShort, lv: t.level, g: t.gender, ds: t.dataSource,
  city: t.city, fy: t.fylke, pos: t.position, pts: t.points, pl: t.played, gd: t.gd, badge: t.badge, color: t.color,
  age: t.weightedAvgAge,
}));
writeJson(PUB, "teams.json", teamsClient);

writeJson(PUB, "leagues.json", leagueOut.map((l) => ({ id: l.id, name: l.name, short: l.short, divisionName: l.divisionName, avdeling: l.avdeling, level: l.level, gender: l.gender, color: l.color, dataSource: l.dataSource, teamCount: l.teamCount })));

// compact fixtures for the client-side calendar
writeJson(PUB, "fixtures.json", fixtures);

const search = [
  ...playerOut.map((p) => ({ t: "p", id: p.id, n: p.name, s: p.teamShort, l: p.leagueShort, g: p.gender })),
  ...teamOut.map((t) => ({ t: "t", id: t.id, n: t.name, s: t.leagueShort, l: t.leagueShort, g: t.gender })),
  ...leagueOut.map((l) => ({ t: "l", id: l.id, n: l.name, s: l.divisionName, l: l.short, g: l.gender })),
];
writeJson(PUB, "search.json", search);

writeJson(PUB, "meta.json", meta);

console.log("Wrote datasets to src/data/generated and public/data");
console.log("Counts:", JSON.stringify(meta.counts));
