// Fetch REAL club crests from Wikidata via ONE SPARQL query (no rate-limit issues).
// Returns all Norwegian football clubs + their P154 logo (Wikimedia Commons),
// then matches to our club names. Cached to scripts/cache/wikidata/logos.json
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CLUB_INFO, MODELED_LEAGUES } from "./lib/sources.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "cache", "wikidata");
const UA = { "User-Agent": "matchdata-etl/1.0 (hobby; contact via github)", Accept: "application/sparql-results+json" };

const QUERY = `
SELECT ?club ?clubLabel ?logo WHERE {
  ?club wdt:P31/wdt:P279* wd:Q476028 .
  ?club wdt:P17 wd:Q20 .
  ?club wdt:P154 ?logo .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "nb,en". }
}`;

function norm(s) {
  return s.toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/[./]/g, " ")
    .replace(/\b(fk|il|if|bk|sk|ik|fc|cf|fotball|fotballklubb|ballklubb|idrettslag|toppfotball|elite)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");
}
function commons(url, width = 200) {
  // SPARQL returns http(s)://commons.wikimedia.org/wiki/Special:FilePath/<file>
  return url.replace(/^http:/, "https:") + (url.includes("?") ? "" : `?width=${width}`);
}

const ALIAS = {
  "KFUM Oslo": "kfumkameratene", "HamKam": "hamarkameratene",
  "Bodø/Glimt": "bodoglimt", "Sarpsborg 08": "sarpsborg08", "Vålerenga": "valerenga",
  "Vard Haugesund": "vard", "Stjørdals-Blink": "stjordalsblink",
};

async function main() {
  mkdirSync(OUT, { recursive: true });
  const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(QUERY);
  const res = await fetch(url, { headers: UA });
  const j = await res.json();
  const rows = j.results.bindings.map((b) => ({ label: b.clubLabel?.value || "", logo: b.logo?.value || "" })).filter((r) => r.logo);
  console.log("Wikidata Norwegian clubs with logos:", rows.length);

  const byNorm = {};
  for (const r of rows) byNorm[norm(r.label)] = r.logo; // last wins; fine

  const want = new Set();
  for (const raw of Object.keys(CLUB_INFO)) want.add(CLUB_INFO[raw].name);
  for (const lg of MODELED_LEAGUES) for (const t of lg.teams) want.add(t.name);

  const out = {};
  for (const name of want) {
    const candidates = [norm(name), ALIAS[name] || "", norm(name.replace(/\s*\d+$/, "")), norm(name.split(" ")[0])].filter(Boolean);
    let hit = null;
    for (const c of candidates) { if (byNorm[c]) { hit = byNorm[c]; break; } }
    if (!hit) {
      // substring fallback
      const nn = norm(name);
      const k = Object.keys(byNorm).find((key) => key.length > 3 && (key.includes(nn) || nn.includes(key)));
      if (k) hit = byNorm[k];
    }
    if (hit) out[name] = commons(hit);
  }
  writeFileSync(join(OUT, "logos.json"), JSON.stringify(out, null, 2), "utf8");
  console.log(`Matched ${Object.keys(out).length}/${want.size} of our clubs.`);
  console.log("Sample:", Object.keys(out).slice(0, 8).join(", "));
}
main().catch((e) => { console.error(e); process.exit(1); });
