// Fetches REAL Norwegian football data and caches it locally so the build is
// deterministic and offline-safe.
//
//  * openfootball (public domain / CC0): complete season results for Eliteserien
//    and 1. divisjon (OBOS), plus club + stadium reference data.
//    https://github.com/openfootball/europe  +  https://github.com/openfootball/clubs
//  * TheSportsDB (free tier, attribution): team metadata + crest/badge images.
//    https://www.thesportsdb.com
//
// Run with:  node scripts/fetch-real.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE = join(__dirname, "cache");

const OF = "https://raw.githubusercontent.com/openfootball/europe/master/norway";
const OFC = "https://raw.githubusercontent.com/openfootball/clubs/master/europe/norway";
const TSDB = "https://www.thesportsdb.com/api/v1/json/3";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "matchdata-etl" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}
async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "matchdata-etl" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function save(rel, content) {
  const full = join(CACHE, rel);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(
    full,
    typeof content === "string" ? content : JSON.stringify(content, null, 2),
    "utf8",
  );
  console.log("saved", rel, typeof content === "string" ? content.length + "b" : "");
}

async function main() {
  await mkdir(CACHE, { recursive: true });

  // --- openfootball results (public domain) ---
  const ofFiles = [
    ["2023_no1.txt", "eliteserien-2023"],
    ["2024_no1.txt", "eliteserien-2024"],
    ["2025_no1.txt", "eliteserien-2025"],
    ["2025_no2.txt", "obos-2025"],
  ];
  for (const [file, name] of ofFiles) {
    try {
      const txt = await getText(`${OF}/${file}`);
      await save(`openfootball/${name}.txt`, txt);
    } catch (e) {
      console.warn("skip", file, e.message);
    }
  }
  try {
    await save("openfootball/no.clubs.txt", await getText(`${OFC}/no.clubs.txt`));
  } catch (e) {
    console.warn("clubs skip", e.message);
  }

  // --- TheSportsDB league discovery + team metadata ---
  let leagues = [];
  try {
    const all = await getJson(`${TSDB}/all_leagues.php`);
    leagues = (all.leagues || []).filter(
      (l) => /Norw/i.test(l.strLeague || "") && /Soccer/i.test(l.strSport || ""),
    );
    await save("thesportsdb/norwegian-leagues.json", leagues);
    console.log(
      "Norwegian leagues:",
      leagues.map((l) => `${l.idLeague}:${l.strLeague}`).join(", "),
    );
  } catch (e) {
    console.warn("leagues skip", e.message);
  }

  // Fetch full team metadata for each discovered Norwegian league (top tiers).
  const wanted = leagues.filter((l) =>
    /Eliteserien|1\.?\s*Division|First Division|OBOS|Toppserien/i.test(l.strLeague),
  );
  // ensure Eliteserien present
  if (!wanted.find((l) => l.idLeague === "4358")) {
    wanted.push({ idLeague: "4358", strLeague: "Norwegian Eliteserien" });
  }
  const teamsOut = {};
  for (const l of wanted) {
    try {
      await sleep(400);
      const data = await getJson(
        `${TSDB}/search_all_teams.php?l=${encodeURIComponent(l.strLeague)}`,
      );
      const teams = data.teams || [];
      if (teams.length) {
        teamsOut[l.strLeague] = teams.map((t) => ({
          id: t.idTeam,
          name: t.strTeam,
          alt: t.strTeamAlternate,
          short: t.strTeamShort,
          formed: t.intFormedYear,
          stadium: t.strStadium,
          capacity: t.intStadiumCapacity,
          location: t.strLocation,
          badge: t.strBadge,
          jersey: t.strEquipment,
          colour1: t.strColour1,
          colour2: t.strColour2,
          website: t.strWebsite,
          desc: (t.strDescriptionEN || "").slice(0, 600),
          idAPIfootball: t.idAPIfootball,
        }));
        console.log(l.strLeague, "->", teams.length, "teams");
      }
    } catch (e) {
      console.warn("teams skip", l.strLeague, e.message);
    }
  }
  await save("thesportsdb/teams.json", teamsOut);

  console.log("\nDone. Cached real data under scripts/cache/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
