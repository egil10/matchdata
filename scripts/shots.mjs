import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const OUT = "C:/Users/ofurn/Dokumenter/Github/matchdata/.shots";
mkdirSync(OUT, { recursive: true });

const shots = [
  ["/", "home"],
  ["/liga/eliteserien", "league"],
  ["/lag/eliteserien__hamkam", "team"],
  ["/spiller/eliteserien__hamkam__p1", "player"],
  ["/utforsk", "explore"],
  ["/liga/3div-avd1", "lower"],
  ["/kamp/eliteserien-1-hamkam-viking", "match"],
  ["/ligaer", "leagues"],
];

async function run(channel) {
  const browser = await chromium.launch({ channel, headless: true });
  const page = await browser.newPage({ viewport: { width: 1320, height: 920 }, colorScheme: "dark", deviceScaleFactor: 1 });
  for (const [path, name] of shots) {
    await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle", timeout: 40000 });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log("shot", name);
  }
  // a mobile home shot
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
  await m.goto("http://localhost:3000/liga/eliteserien", { waitUntil: "networkidle", timeout: 40000 });
  await m.waitForTimeout(1000);
  await m.screenshot({ path: `${OUT}/mobile-league.png` });
  console.log("shot mobile");
  await browser.close();
}

const channels = ["msedge", "chrome"];
let ok = false;
for (const c of channels) {
  try { await run(c); ok = true; console.log("used channel:", c); break; }
  catch (e) { console.log("channel failed:", c, e.message.split("\n")[0]); }
}
if (!ok) process.exit(2);
