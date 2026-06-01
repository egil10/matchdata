# Matchdata

**Advanced statistics & analytics for Norwegian football — from Eliteserien down to local divisions.**

A modern, fast, dark-mode-first analytics app inspired by [kampdata.no](https://kampdata.no), built to go further on data transparency, UI/UX, charts and dashboards. Deployable to Vercel out of the box.

---

## 🔍 Honesty about data — real vs. modeled

This is the most important thing to understand, and it's surfaced **everywhere in the UI** with green **Ekte data** / amber **Modellert** badges.

| Layer | Source | Status |
|---|---|---|
| **Live results, tables & fixtures** — Eliteserien **2026 (in progress)** | [TheSportsDB](https://www.thesportsdb.com) | ✅ **Real** |
| **Results & tables** — OBOS-ligaen 2025 + Eliteserien 2023–2025 history | [openfootball](https://github.com/openfootball) — public domain | ✅ **Real** |
| **Final tables** — 2. divisjon (2 groups) & 3. divisjon (6 groups), 2025 | Wikipedia | ✅ **Real** |
| **Club crests / founders / stadiums** | Wikidata (P154) + TheSportsDB | ✅ **Real** |
| **Managers & top scorers** (Eliteserien) | Wikipedia | ✅ **Real** |
| **Player-level data** (squads, minutes, on-pitch +/‑, **Team Impact**) | Modeled — clearly labeled "Modellert" | ⚠️ **Modeled** |

**Why modeled?** Granular per-player data (lineups, substitution minutes, goal minutes) for Norwegian lower divisions is **not available from any free, legal source** — it lives in NFF's FIKS system, which prohibits scraping. So the player layer is modeled with a deterministic, seeded simulation **anchored to the real results/tables**, while individual player numbers are transparent estimates. See the in-app **Om & metode** page (`/om`).

The live **Eliteserien 2026** table reproduced here matches Wikipedia exactly (Viking top on 27, Start bottom on 7), as do the real 2./3. divisjon tables (Junkeren, Bjarg, Kvik Halden et al.).

---

## ✨ Features

- **Real league tables & results** — live Eliteserien 2026, OBOS-ligaen 2025, Eliteserien history (2023–2025), and **real final tables for 2. & 3. divisjon** (grassroots, 8 groups).
- **Team Impact** — full re-implementation of kampdata's signature metric (`PerfZ + 0.5·MinZ`, 20 % qualification threshold), plus **+/‑/90**, weighted average age, weighted P/K, and official tie-break ordering.
- **League dashboards** — points-race progression, goals per round, results distribution, age analysis, season records.
- **Player profiles** — percentile radar vs. league peers, Team-Impact breakdown, match-by-match on-pitch goal differential.
- **Match pages** — fotball.no-style detail (kampnummer, venue, surface, attendance, lineups with shirt numbers & captain) **plus** per-player on-pitch +/‑ and an event timeline.
- **Utforsk** (Explore) — an interactive scatter "data lab": plot any metric against any other, filter, colour by position/league. *(Not in kampdata.)*
- **Advanced player search** — debounced name search, league/position/county/birth-year filters, sortable columns.
- **Compare** two players side-by-side with a shareable URL and dual radar.
- **Age distribution**, **transfers** feed, **national-team** players, a **day-by-day match calendar**, and **favourites** (localStorage).
- **⌘K command palette**, **Herrer/Kvinner** toggle (cookie-persisted), **dark/light** theme, fully responsive.

## 🧱 Tech stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript**
- **TailwindCSS** (CSS-variable design tokens, dark/light)
- **Recharts** for charts
- Deterministic data pipeline in `scripts/` (seeded — fully reproducible)

## 🚀 Getting started

```bash
npm install
npm run dev          # regenerates data, then starts http://localhost:3000
```

Other scripts:

```bash
npm run generate     # rebuild datasets into src/data/generated + public/data
npm run build        # generate + next build (what Vercel runs)
node scripts/fetch-real.mjs   # refresh the cached real data (openfootball + TheSportsDB)
```

### Data pipeline

- `scripts/fetch-real.mjs` downloads and caches the real sources into `scripts/cache/` (committed, so builds are offline-deterministic).
- `scripts/generate.mjs` parses the real results into tables/analytics and layers the modeled player data on top, writing JSON to `src/data/generated/` (server) and compact indexes to `public/data/` (client).
- Metrics live in `scripts/lib/metrics.mjs` (and mirrored client-side in `src/lib/metrics.ts`).

## ☁️ Deploy to Vercel

Import the repo into Vercel — it auto-detects Next.js. The `build` script regenerates the datasets, so no extra configuration is needed.

## ⚖️ Attribution & disclaimer

- Results & standings: **openfootball** (public domain).
- Club metadata & crests: **TheSportsDB**.
- A hobby project, **not affiliated with NFF**. Modeled figures are estimates, clearly labelled, and must not be presented as official.
