// Fetch REAL club crests (free, Wikimedia-licensed) for as many clubs as possible:
//  - Wikidata P154 (Commons logos) for Norwegian football/sports clubs (broad query)
//  - TheSportsDB badges (cached) merged in
//  - fuzzy name matching (Wikidata labels clubs e.g. "Sportsklubben Brann")
//  - reserve teams ("X 2") inherit the parent club crest
// Clubs with no free crest fall back to clean monograms in the app.
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CLUB_INFO, TSDB_CLUB, MODELED_LEAGUES } from "./lib/sources.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE = join(__dirname, "cache");
const OUT = join(CACHE, "wikidata");
const UA = { "User-Agent": "matchdata-etl/1.0 (hobby football stats; github.com/egil10)", Accept: "application/sparql-results+json" };

function norm(s) {
  return s.toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/[./]/g, " ")
    .replace(/\b(fk|il|if|bk|sk|ik|fc|cf|fotball|fotballklubb|ballklubb|idrettslag|idrettsklubb|idrettsforening|sportsklubben|sportsklubb|toppfotball|toppfotballklubb|elite|kvinner|2|ii)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");
}
function commons(url, width = 200) {
  return url.replace(/^http:/, "https:") + (url.includes("?") ? "" : `?width=${width}`);
}
const ALIAS = {
  "KFUM Oslo": "kfumkameratene", "Ull/Kisa": "ullensakerkisa", "Vard Haugesund": "vard",
  "HamKam": "hamarkameratene", "Glimt": "bodoglimt", "FFK": "fredrikstad",
};

async function wikidata() {
  const query = `
    SELECT ?clubLabel ?logo WHERE {
      ?club wdt:P154 ?logo ; wdt:P17 wd:Q20 .
      ?club wdt:P31/wdt:P279* ?t .
      VALUES ?t { wd:Q476028 wd:Q847017 wd:Q14752149 wd:Q15944511 wd:Q23905052 }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "nb,nn,en". }
    }`;
  const u = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query);
  const j = await (await fetch(u, { headers: UA })).json();
  return (j.results.bindings || [])
    .filter((b) => b.clubLabel?.value && b.logo?.value && !/^Q\d+$/.test(b.clubLabel.value))
    .map((b) => ({ key: norm(b.clubLabel.value), logo: commons(b.logo.value) }));
}

function tsdbBadges() {
  try {
    const t = JSON.parse(readFileSync(join(CACHE, "thesportsdb", "teams.json"), "utf8"));
    const out = [];
    for (const arr of Object.values(t)) for (const x of arr) if (x.badge) out.push({ key: norm(x.name), logo: x.badge });
    return out;
  } catch { return []; }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const wanted = new Set();
  for (const k of Object.keys(CLUB_INFO)) wanted.add(CLUB_INFO[k].name);
  for (const k of Object.keys(TSDB_CLUB)) wanted.add(TSDB_CLUB[k].name);
  for (const lg of MODELED_LEAGUES) for (const t of lg.teams) wanted.add(t.name);
  try {
    const lower = JSON.parse(readFileSync(join(CACHE, "wikipedia", "lower-divisions-2025.json"), "utf8"));
    for (const div of [lower.secondDivision, lower.thirdDivision])
      for (const g of div.groups) for (const row of g.table) wanted.add(row.club);
  } catch {}
  const names = [...wanted];

  const wd = await wikidata();
  const all = [...wd, ...tsdbBadges()];
  const exact = {};
  for (const r of all) if (!exact[r.key]) exact[r.key] = r.logo;
  console.log(`Wikidata logos: ${wd.length}, +TheSportsDB. Resolving ${names.length} clubs…`);

  const out = {};
  const resolve = (name) => {
    const base = name.replace(/\s+2$/, "").trim();
    const cands = [norm(name), ALIAS[name], norm(base)].filter(Boolean);
    for (const c of cands) if (exact[c]) return exact[c];
    // substring (guarded) against all keys
    for (const c of cands) {
      if (c.length < 4) continue;
      const hit = all.find((r) => r.key.length >= 4 && (r.key.includes(c) || c.includes(r.key)));
      if (hit) return hit.logo;
    }
    return null;
  };
  for (const name of names) { const l = resolve(name); if (l) out[name] = l; }
  // reserves inherit parent
  for (const name of names) {
    if (out[name]) continue;
    const base = name.replace(/\s+2$/, "").trim();
    if (base !== name && out[base]) out[name] = out[base];
  }

  writeFileSync(join(OUT, "logos.json"), JSON.stringify(out, null, 2), "utf8");
  console.log(`Done. ${Object.keys(out).length}/${names.length} clubs with real crests.`);
  console.log("Still monogram:", names.filter((n) => !out[n]).length, "clubs (no free crest).");
}
main().catch((e) => { console.error(e); process.exit(1); });
