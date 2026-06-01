# Toppdata ⚽📊

**Advanced statistics & analytics for Norwegian football — from Eliteserien down to local divisions.**

A modern, fast, dark-mode-first analytics app inspired by [kampdata.no](https://kampdata.no), built to go further on data transparency, UI/UX, charts and dashboards. Deployable to Vercel out of the box.

---

## 🔍 Honesty about data — real vs. modeled

This is the most important thing to understand, and it's surfaced **everywhere in the UI** with green **Ekte data** / amber **Modellert** badges.

| Layer | Source | Status |
|---|---|---|
| **Results, tables, fixtures, half-time scores** (Eliteserien 2023–2025, OBOS-ligaen 2025) | [openfootball](https://github.com/openfootball) — public domain | ✅ **Real** |
| **Club crests, founding years, stadiums, capacities** | [TheSportsDB](https://www.thesportsdb.com) | ✅ **Real** |
| **Player-level data** (squads, minutes, goals, cards, on-pitch +/‑, **Team Impact**) | Modeled — *anchored to the real scorelines* | ⚠️ **Modeled** |
| **Lower & women's divisions** (3. divisjon, Toppserien, 1. div. kvinner) | Modeled | ⚠️ **Modeled** |

**Why modeled?** Granular per-player data (lineups, substitution minutes, goal minutes) for Norwegian lower divisions is **not available from any free, legal source** — it lives in NFF's FIKS system, which prohibits scraping. So the player layer is modeled with a deterministic, seeded simulation that is **anchored to the real results**: real goals are distributed across modeled scorers and minutes, so every **team result and league table is exactly real**, while individual player numbers are transparent estimates. See the in-app **Om & metode** page (`/om`).

The Eliteserien 2024 table reproduced here matches reality exactly (Bodø/Glimt champions on 62 pts; Lillestrøm & Odd relegated).

---

## ✨ Features

- **Real league tables & results** for Eliteserien (complete 2024 season) and OBOS-ligaen (live 2025), with 2023/2025 history.
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
