// Fetch the live 2026 Eliteserien season from TheSportsDB (per-round, uncapped).
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const TSDB = "https://www.thesportsdb.com/api/v1/json/3";
const UA = { headers: { "User-Agent": "matchdata-etl" } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const all = [];
  for (let r = 1; r <= 30; r++) {
    let e = [];
    try {
      const j = await (await fetch(`${TSDB}/eventsround.php?id=4358&r=${r}&s=2026`, UA)).json();
      e = j.events || [];
    } catch {}
    if (!e.length) { console.log("round", r, "empty — stop"); break; }
    for (const x of e) {
      all.push({
        round: r, date: x.dateEvent, time: (x.strTime || "15:00").slice(0, 5),
        home: (x.strHomeTeam || "").trim(), away: (x.strAwayTeam || "").trim(),
        hg: x.intHomeScore != null ? +x.intHomeScore : null,
        ag: x.intAwayScore != null ? +x.intAwayScore : null,
        venue: x.strVenue || null,
      });
    }
    await sleep(280);
  }
  const dir = join(__dirname, "cache", "thesportsdb");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "eliteserien-2026.json"), JSON.stringify(all));
  const played = all.filter((m) => m.hg != null);
  const teams = [...new Set(all.flatMap((m) => [m.home, m.away]))].sort();
  console.log("TOTAL", all.length, "PLAYED", played.length, "maxRound", Math.max(...all.map((m) => m.round)));
  console.log("TEAMS(" + teams.length + "):\n " + teams.join("\n "));
}
main().catch((e) => { console.error(e); process.exit(1); });
